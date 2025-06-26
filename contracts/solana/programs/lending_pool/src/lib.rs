use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;
use chainlink_solana as chainlink;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgAGF4d8CLQN");

// Error codes
#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    #[msg("Asset not supported")]
    AssetNotSupported,
    #[msg("Health factor too low")]
    HealthFactorTooLow,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Rate limited")]
    RateLimited,
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Cross-chain operation failed")]
    CrossChainFailed,
    #[msg("Invalid price data")]
    InvalidPriceData,
    #[msg("Liquidation not allowed")]
    LiquidationNotAllowed,
    #[msg("Position not found")]
    PositionNotFound,
    #[msg("Chain not supported")]
    ChainNotSupported,
}

// Constants
pub const PRECISION: u64 = 1_000_000_000_000_000_000; // 1e18
pub const MIN_HEALTH_FACTOR: u64 = PRECISION; // 1.0
pub const LIQUIDATION_THRESHOLD: u64 = 950_000_000_000_000_000; // 0.95
pub const LIQUIDATION_BONUS: u64 = 50_000_000_000_000_000; // 0.05 (5%)
pub const MAX_LTV: u64 = 750_000_000_000_000_000; // 0.75 (75%)

#[program]
pub mod lending_pool {
    use super::*;

    /// Initialize the lending pool
    pub fn initialize(
        ctx: Context<Initialize>,
        admin: Pubkey,
        ccip_program: Pubkey,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.admin = admin;
        pool.ccip_program = ccip_program;
        pool.is_paused = false;
        pool.total_assets = 0;
        pool.bump = ctx.bumps.pool;

        msg!("Lending pool initialized with admin: {}", admin);
        Ok(())
    }

    /// Add a supported asset to the lending pool
    pub fn add_supported_asset(
        ctx: Context<AddSupportedAsset>,
        asset_config: AssetConfig,
    ) -> Result<()> {
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.mint = ctx.accounts.mint.key();
        asset_info.price_feed = asset_config.price_feed;
        asset_info.ltv = asset_config.ltv;
        asset_info.liquidation_threshold = asset_config.liquidation_threshold;
        asset_info.is_active = true;
        asset_info.can_be_collateral = asset_config.can_be_collateral;
        asset_info.can_be_borrowed = asset_config.can_be_borrowed;
        asset_info.total_deposits = 0;
        asset_info.total_borrows = 0;
        asset_info.bump = ctx.bumps.asset_info;

        let pool = &mut ctx.accounts.pool;
        pool.total_assets = pool.total_assets.checked_add(1).unwrap();

        emit!(AssetAdded {
            mint: ctx.accounts.mint.key(),
            ltv: asset_config.ltv,
            liquidation_threshold: asset_config.liquidation_threshold,
        });

        Ok(())
    }

    /// Deposit collateral
    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);
        require!(ctx.accounts.asset_info.is_active, ErrorCode::AssetNotSupported);
        require!(ctx.accounts.asset_info.can_be_collateral, ErrorCode::AssetNotSupported);

        // Rate limiting check
        let user_position = &mut ctx.accounts.user_position;
        let current_time = Clock::get()?.unix_timestamp;
        if user_position.last_action_timestamp + 900 > current_time { // 15 minutes
            return Err(ErrorCode::RateLimited.into());
        }

        // Transfer tokens from user to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        // Update user position
        if user_position.user == Pubkey::default() {
            user_position.user = ctx.accounts.user.key();
            user_position.bump = ctx.bumps.user_position;
        }

        user_position.collateral_balance = user_position.collateral_balance
            .checked_add(amount)
            .unwrap();
        user_position.last_action_timestamp = current_time;

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_deposits = asset_info.total_deposits
            .checked_add(amount)
            .unwrap();

        // Update health factor
        update_health_factor(user_position, &ctx.remaining_accounts)?;

        emit!(Deposit {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount,
            chain_selector: 0, // Current chain
        });

        Ok(())
    }

    /// Cross-chain borrow
    pub fn borrow_cross_chain(
        ctx: Context<BorrowCrossChain>,
        amount: u64,
        dest_chain: u64,
        receiver: [u8; 32],
    ) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);
        require!(ctx.accounts.asset_info.is_active, ErrorCode::AssetNotSupported);
        require!(ctx.accounts.asset_info.can_be_borrowed, ErrorCode::AssetNotSupported);

        let user_position = &mut ctx.accounts.user_position;
        require!(user_position.user != Pubkey::default(), ErrorCode::PositionNotFound);

        // Rate limiting check
        let current_time = Clock::get()?.unix_timestamp;
        if user_position.last_action_timestamp + 900 > current_time {
            return Err(ErrorCode::RateLimited.into());
        }

        // Get asset price from Chainlink
        let price = get_asset_price(&ctx.accounts.price_feed)?;
        let borrow_value_usd = calculate_usd_value(amount, price, ctx.accounts.mint.decimals)?;

        // Calculate new total borrow value
        let new_total_borrow_value = user_position.total_borrow_value_usd
            .checked_add(borrow_value_usd)
            .unwrap();

        // Check LTV ratio
        let max_borrow_value = user_position.total_collateral_value_usd
            .checked_mul(ctx.accounts.asset_info.ltv)
            .unwrap()
            .checked_div(PRECISION)
            .unwrap();

        require!(new_total_borrow_value <= max_borrow_value, ErrorCode::InsufficientCollateral);

        // Update user position
        user_position.borrow_balance = user_position.borrow_balance
            .checked_add(amount)
            .unwrap();
        user_position.total_borrow_value_usd = new_total_borrow_value;
        user_position.last_action_timestamp = current_time;

        // Calculate new health factor
        let new_health_factor = calculate_health_factor(
            user_position.total_collateral_value_usd,
            user_position.total_borrow_value_usd,
            ctx.accounts.asset_info.liquidation_threshold,
        )?;

        require!(new_health_factor >= MIN_HEALTH_FACTOR, ErrorCode::HealthFactorTooLow);
        user_position.health_factor = new_health_factor;

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_borrows = asset_info.total_borrows
            .checked_add(amount)
            .unwrap();

        // Send cross-chain message via CCIP
        if dest_chain != 0 {
            send_ccip_message(
                &ctx.accounts.ccip_program,
                &ctx.accounts.user,
                "borrow",
                ctx.accounts.mint.key(),
                amount,
                dest_chain,
                receiver,
                &ctx.remaining_accounts,
            )?;
        }

        emit!(Borrow {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount,
            dest_chain,
            health_factor: new_health_factor,
        });

        Ok(())
    }

    /// Repay borrowed amount
    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let user_position = &mut ctx.accounts.user_position;
        require!(user_position.user != Pubkey::default(), ErrorCode::PositionNotFound);

        let repay_amount = std::cmp::min(amount, user_position.borrow_balance);
        require!(repay_amount > 0, ErrorCode::InvalidAmount);

        // Transfer tokens from user to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, repay_amount)?;

        // Update user position
        user_position.borrow_balance = user_position.borrow_balance
            .checked_sub(repay_amount)
            .unwrap();

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_borrows = asset_info.total_borrows
            .checked_sub(repay_amount)
            .unwrap();

        // Update health factor
        update_health_factor(user_position, &ctx.remaining_accounts)?;

        emit!(Repay {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount: repay_amount,
        });

        Ok(())
    }

    /// Withdraw collateral
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let user_position = &mut ctx.accounts.user_position;
        require!(user_position.user != Pubkey::default(), ErrorCode::PositionNotFound);
        require!(amount <= user_position.collateral_balance, ErrorCode::InvalidAmount);

        // Temporarily update position to check health factor
        let original_collateral = user_position.collateral_balance;
        user_position.collateral_balance = user_position.collateral_balance
            .checked_sub(amount)
            .unwrap();

        // Update health factor with new collateral
        update_health_factor(user_position, &ctx.remaining_accounts)?;

        // Check if withdrawal would make position unhealthy
        if user_position.total_borrow_value_usd > 0 && user_position.health_factor < MIN_HEALTH_FACTOR {
            // Revert the change
            user_position.collateral_balance = original_collateral;
            return Err(ErrorCode::HealthFactorTooLow.into());
        }

        // Transfer tokens from pool to user
        let seeds = &[
            b"pool".as_ref(),
            &[ctx.accounts.pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_deposits = asset_info.total_deposits
            .checked_sub(amount)
            .unwrap();

        emit!(Withdraw {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount,
        });

        Ok(())
    }

    /// Liquidate an unhealthy position
    pub fn liquidate(
        ctx: Context<Liquidate>,
        debt_amount: u64,
    ) -> Result<()> {
        require!(debt_amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let borrower_position = &mut ctx.accounts.borrower_position;
        require!(borrower_position.user != Pubkey::default(), ErrorCode::PositionNotFound);

        // Update health factor
        update_health_factor(borrower_position, &ctx.remaining_accounts)?;

        // Check if liquidation is allowed
        require!(borrower_position.health_factor < LIQUIDATION_THRESHOLD, ErrorCode::LiquidationNotAllowed);

        let actual_debt_amount = std::cmp::min(debt_amount, borrower_position.borrow_balance);

        // Calculate collateral to seize (with bonus)
        let collateral_price = get_asset_price(&ctx.accounts.collateral_price_feed)?;
        let debt_price = get_asset_price(&ctx.accounts.debt_price_feed)?;

        let collateral_to_seize = calculate_liquidation_amount(
            actual_debt_amount,
            debt_price,
            collateral_price,
            LIQUIDATION_BONUS,
        )?;

        require!(collateral_to_seize <= borrower_position.collateral_balance, ErrorCode::InsufficientCollateral);

        // Transfer debt repayment from liquidator
        let cpi_accounts = Transfer {
            from: ctx.accounts.liquidator_debt_account.to_account_info(),
            to: ctx.accounts.pool_debt_account.to_account_info(),
            authority: ctx.accounts.liquidator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, actual_debt_amount)?;

        // Transfer collateral to liquidator
        let seeds = &[
            b"pool".as_ref(),
            &[ctx.accounts.pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_collateral_account.to_account_info(),
            to: ctx.accounts.liquidator_collateral_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, collateral_to_seize)?;

        // Update borrower position
        borrower_position.borrow_balance = borrower_position.borrow_balance
            .checked_sub(actual_debt_amount)
            .unwrap();
        borrower_position.collateral_balance = borrower_position.collateral_balance
            .checked_sub(collateral_to_seize)
            .unwrap();

        // Update health factor
        update_health_factor(borrower_position, &ctx.remaining_accounts)?;

        emit!(Liquidation {
            liquidator: ctx.accounts.liquidator.key(),
            borrower: borrower_position.user,
            debt_amount: actual_debt_amount,
            collateral_seized: collateral_to_seize,
            health_factor: borrower_position.health_factor,
        });

        Ok(())
    }

    /// Receive cross-chain message
    pub fn ccip_receive(ctx: Context<CCIPReceive>, data: Vec<u8>) -> Result<()> {
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        // Decode cross-chain message
        let message: CrossChainMessage = CrossChainMessage::try_from_slice(&data)
            .map_err(|_| ErrorCode::CrossChainFailed)?;

        // Process based on action
        match message.action.as_str() {
            "borrow" => {
                // Mint synthetic asset to user
                mint_synthetic_asset(
                    &ctx.accounts.synthetic_mint,
                    &ctx.accounts.user_synthetic_account,
                    &ctx.accounts.pool,
                    message.amount,
                    ctx.accounts.pool.bump,
                )?;
            },
            "repay" => {
                // Burn synthetic asset
                burn_synthetic_asset(
                    &ctx.accounts.synthetic_mint,
                    &ctx.accounts.user_synthetic_account,
                    &ctx.accounts.user,
                    message.amount,
                )?;
            },
            _ => return Err(ErrorCode::CrossChainFailed.into()),
        }

        emit!(CrossChainMessageReceived {
            user: message.user,
            action: message.action,
            amount: message.amount,
            source_chain: message.source_chain,
        });

        Ok(())
    }

    /// Pause the protocol (emergency function)
    pub fn pause(ctx: Context<AdminAction>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.is_paused = true;

        emit!(ProtocolPaused {
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }

    /// Unpause the protocol
    pub fn unpause(ctx: Context<AdminAction>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.is_paused = false;

        emit!(ProtocolUnpaused {
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }
}

// Account structures
#[account]
pub struct Pool {
    pub admin: Pubkey,
    pub ccip_program: Pubkey,
    pub is_paused: bool,
    pub total_assets: u32,
    pub bump: u8,
}

#[account]
pub struct AssetInfo {
    pub mint: Pubkey,
    pub price_feed: Pubkey,
    pub ltv: u64,
    pub liquidation_threshold: u64,
    pub is_active: bool,
    pub can_be_collateral: bool,
    pub can_be_borrowed: bool,
    pub total_deposits: u64,
    pub total_borrows: u64,
    pub bump: u8,
}

#[account]
pub struct UserPosition {
    pub user: Pubkey,
    pub collateral_balance: u64,
    pub borrow_balance: u64,
    pub total_collateral_value_usd: u64,
    pub total_borrow_value_usd: u64,
    pub health_factor: u64,
    pub last_action_timestamp: i64,
    pub bump: u8,
}

// Data structures
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AssetConfig {
    pub price_feed: Pubkey,
    pub ltv: u64,
    pub liquidation_threshold: u64,
    pub can_be_collateral: bool,
    pub can_be_borrowed: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CrossChainMessage {
    pub user: Pubkey,
    pub action: String,
    pub asset: Pubkey,
    pub amount: u64,
    pub source_chain: u64,
    pub dest_chain: u64,
}

// Context structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 1 + 4 + 1,
        seeds = [b"pool"],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddSupportedAsset<'info> {
    #[account(mut, has_one = admin)]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 32 + 8 + 8 + 1 + 1 + 1 + 8 + 8 + 1,
        seeds = [b"asset", mint.key().as_ref()],
        bump
    )]
    pub asset_info: Account<'info, AssetInfo>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut, seeds = [b"asset", mint.key().as_ref()], bump = asset_info.bump)]
    pub asset_info: Account<'info, AssetInfo>,
    #[account(
        init_if_needed,
        payer = user,
        space = 8 + 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1,
        seeds = [b"position", user.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BorrowCrossChain<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut, seeds = [b"asset", mint.key().as_ref()], bump = asset_info.bump)]
    pub asset_info: Account<'info, AssetInfo>,
    #[account(mut, seeds = [b"position", user.key().as_ref(), mint.key().as_ref()], bump = user_position.bump)]
    pub user_position: Account<'info, UserPosition>,
    pub mint: Account<'info, Mint>,
    /// CHECK: Chainlink price feed account
    pub price_feed: AccountInfo<'info>,
    /// CHECK: CCIP program for cross-chain messaging
    pub ccip_program: AccountInfo<'info>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut, seeds = [b"asset", mint.key().as_ref()], bump = asset_info.bump)]
    pub asset_info: Account<'info, AssetInfo>,
    #[account(mut, seeds = [b"position", user.key().as_ref(), mint.key().as_ref()], bump = user_position.bump)]
    pub user_position: Account<'info, UserPosition>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut, seeds = [b"asset", mint.key().as_ref()], bump = asset_info.bump)]
    pub asset_info: Account<'info, AssetInfo>,
    #[account(mut, seeds = [b"position", user.key().as_ref(), mint.key().as_ref()], bump = user_position.bump)]
    pub user_position: Account<'info, UserPosition>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut, seeds = [b"position", borrower.key().as_ref(), debt_mint.key().as_ref()], bump = borrower_position.bump)]
    pub borrower_position: Account<'info, UserPosition>,
    /// CHECK: Borrower account
    pub borrower: AccountInfo<'info>,
    pub debt_mint: Account<'info, Mint>,
    pub collateral_mint: Account<'info, Mint>,
    #[account(mut)]
    pub liquidator_debt_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub liquidator_collateral_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_debt_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_collateral_account: Account<'info, TokenAccount>,
    /// CHECK: Chainlink price feeds
    pub debt_price_feed: AccountInfo<'info>,
    /// CHECK: Chainlink price feeds
    pub collateral_price_feed: AccountInfo<'info>,
    #[account(mut)]
    pub liquidator: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CCIPReceive<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,
    #[account(mut)]
    pub synthetic_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_synthetic_account: Account<'info, TokenAccount>,
    /// CHECK: User account from cross-chain message
    pub user: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct AdminAction<'info> {
    #[account(mut, has_one = admin)]
    pub pool: Account<'info, Pool>,
    pub admin: Signer<'info>,
}

// Events
#[event]
pub struct AssetAdded {
    pub mint: Pubkey,
    pub ltv: u64,
    pub liquidation_threshold: u64,
}

#[event]
pub struct Deposit {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub chain_selector: u64,
}

#[event]
pub struct Borrow {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub dest_chain: u64,
    pub health_factor: u64,
}

#[event]
pub struct Repay {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Withdraw {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Liquidation {
    pub liquidator: Pubkey,
    pub borrower: Pubkey,
    pub debt_amount: u64,
    pub collateral_seized: u64,
    pub health_factor: u64,
}

#[event]
pub struct CrossChainMessageReceived {
    pub user: Pubkey,
    pub action: String,
    pub amount: u64,
    pub source_chain: u64,
}

#[event]
pub struct ProtocolPaused {
    pub admin: Pubkey,
}

#[event]
pub struct ProtocolUnpaused {
    pub admin: Pubkey,
}

// Helper functions
fn get_asset_price(price_feed: &AccountInfo) -> Result<u64> {
    // Implementation would integrate with Chainlink price feeds on Solana
    // This is a placeholder - actual implementation would use chainlink_solana crate
    let price_data = chainlink::latest_round_data(price_feed)?;
    require!(price_data.answer > 0, ErrorCode::InvalidPriceData);
    Ok(price_data.answer as u64)
}

fn calculate_usd_value(amount: u64, price: u64, decimals: u8) -> Result<u64> {
    let value = amount
        .checked_mul(price)
        .ok_or(ErrorCode::InvalidAmount)?
        .checked_div(10u64.pow(decimals as u32))
        .ok_or(ErrorCode::InvalidAmount)?;
    Ok(value)
}

fn calculate_health_factor(
    total_collateral_value_usd: u64,
    total_borrow_value_usd: u64,
    liquidation_threshold: u64,
) -> Result<u64> {
    if total_borrow_value_usd == 0 {
        return Ok(u64::MAX); // Infinite health factor
    }

    let weighted_collateral = total_collateral_value_usd
        .checked_mul(liquidation_threshold)
        .ok_or(ErrorCode::InvalidAmount)?
        .checked_div(PRECISION)
        .ok_or(ErrorCode::InvalidAmount)?;

    let health_factor = weighted_collateral
        .checked_mul(PRECISION)
        .ok_or(ErrorCode::InvalidAmount)?
        .checked_div(total_borrow_value_usd)
        .ok_or(ErrorCode::InvalidAmount)?;

    Ok(health_factor)
}

fn calculate_liquidation_amount(
    debt_amount: u64,
    debt_price: u64,
    collateral_price: u64,
    liquidation_bonus: u64,
) -> Result<u64> {
    let debt_value = debt_amount
        .checked_mul(debt_price)
        .ok_or(ErrorCode::InvalidAmount)?;

    let collateral_value_needed = debt_value
        .checked_mul(PRECISION.checked_add(liquidation_bonus).unwrap())
        .ok_or(ErrorCode::InvalidAmount)?
        .checked_div(PRECISION)
        .ok_or(ErrorCode::InvalidAmount)?;

    let collateral_amount = collateral_value_needed
        .checked_div(collateral_price)
        .ok_or(ErrorCode::InvalidAmount)?;

    Ok(collateral_amount)
}

fn update_health_factor(
    user_position: &mut UserPosition,
    remaining_accounts: &[AccountInfo],
) -> Result<()> {
    // This would iterate through all user's assets and calculate total values
    // For now, we'll use a simplified version
    let health_factor = calculate_health_factor(
        user_position.total_collateral_value_usd,
        user_position.total_borrow_value_usd,
        LIQUIDATION_THRESHOLD,
    )?;
    user_position.health_factor = health_factor;
    Ok(())
}

fn send_ccip_message(
    ccip_program: &AccountInfo,
    user: &Signer,
    action: &str,
    asset: Pubkey,
    amount: u64,
    dest_chain: u64,
    receiver: [u8; 32],
    remaining_accounts: &[AccountInfo],
) -> Result<()> {
    // This would integrate with Chainlink CCIP on Solana
    // Implementation details would depend on the actual CCIP Solana program
    // This is a placeholder for the actual CCIP integration
    msg!("Sending CCIP message: {} {} tokens to chain {}", action, amount, dest_chain);
    Ok(())
}

fn mint_synthetic_asset(
    mint: &Account<Mint>,
    user_account: &Account<TokenAccount>,
    authority: &Account<Pool>,
    amount: u64,
    authority_bump: u8,
) -> Result<()> {
    // This would mint synthetic assets representing borrowed tokens
    // Implementation would use SPL Token mint_to instruction
    msg!("Minting {} synthetic tokens", amount);
    Ok(())
}

fn burn_synthetic_asset(
    mint: &Account<Mint>,
    user_account: &Account<TokenAccount>,
    user: &Signer,
    amount: u64,
) -> Result<()> {
    // This would burn synthetic assets when debt is repaid
    // Implementation would use SPL Token burn instruction
    msg!("Burning {} synthetic tokens", amount);
    Ok(())
}
