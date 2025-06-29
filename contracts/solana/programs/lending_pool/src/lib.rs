use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
// Remove unused import
// use anchor_spl::associated_token::AssociatedToken;
// Remove chainlink import until compatible version is available
// use chainlink_solana as chainlink;

declare_id!("ss9Hb9bSa6jW2w3UUNBN2aGviAUVMmnwVZ71HZw6xBL");

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

        emit!(AssetAddedEvent {
            mint: ctx.accounts.mint.key(),
            ltv: asset_config.ltv,
            liquidation_threshold: asset_config.liquidation_threshold,
        });

        Ok(())
    }

    /// Deposit collateral
    pub fn deposit(ctx: Context<DepositAccounts>, amount: u64) -> Result<()> {
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

        emit!(DepositEvent {
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

        // Get asset price from Chainlink (simplified for now)
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

        // Send cross-chain message
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

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_borrows = asset_info.total_borrows
            .checked_add(amount)
            .unwrap();

        emit!(BorrowEvent {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount,
            dest_chain,
            health_factor: new_health_factor,
        });

        Ok(())
    }

    /// Repay borrowed amount
    pub fn repay(ctx: Context<RepayAccounts>, repay_amount: u64) -> Result<()> {
        require!(repay_amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let user_position = &mut ctx.accounts.user_position;
        require!(user_position.user != Pubkey::default(), ErrorCode::PositionNotFound);
        require!(user_position.borrow_balance >= repay_amount, ErrorCode::InvalidAmount);

        // Rate limiting check
        let current_time = Clock::get()?.unix_timestamp;
        if user_position.last_action_timestamp + 900 > current_time {
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
        token::transfer(cpi_ctx, repay_amount)?;

        // Update user position
        user_position.borrow_balance = user_position.borrow_balance
            .checked_sub(repay_amount)
            .unwrap();
        user_position.last_action_timestamp = current_time;

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_borrows = asset_info.total_borrows
            .checked_sub(repay_amount)
            .unwrap();

        // Update health factor
        update_health_factor(user_position, &ctx.remaining_accounts)?;

        emit!(RepayEvent {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount: repay_amount,
        });

        Ok(())
    }

    /// Withdraw collateral
    pub fn withdraw(ctx: Context<WithdrawAccounts>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let user_position = &mut ctx.accounts.user_position;
        require!(user_position.user != Pubkey::default(), ErrorCode::PositionNotFound);
        require!(user_position.collateral_balance >= amount, ErrorCode::InvalidAmount);

        // Rate limiting check
        let current_time = Clock::get()?.unix_timestamp;
        if user_position.last_action_timestamp + 900 > current_time {
            return Err(ErrorCode::RateLimited.into());
        }

        // Check if withdrawal would make position unhealthy
        let remaining_collateral = user_position.collateral_balance
            .checked_sub(amount)
            .unwrap();

        if user_position.borrow_balance > 0 && remaining_collateral > 0 {
            // Calculate health factor after withdrawal
            let price = get_asset_price(&ctx.remaining_accounts[0])?;
            let remaining_collateral_value = calculate_usd_value(
                remaining_collateral,
                price,
                ctx.accounts.mint.decimals,
            )?;

            let new_health_factor = calculate_health_factor(
                remaining_collateral_value,
                user_position.total_borrow_value_usd,
                ctx.accounts.asset_info.liquidation_threshold,
            )?;

            require!(new_health_factor >= MIN_HEALTH_FACTOR, ErrorCode::HealthFactorTooLow);
            user_position.health_factor = new_health_factor;
        }

        // Transfer tokens from pool to user
        let pool_bump = ctx.accounts.pool.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"pool", &[pool_bump]]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, amount)?;

        // Update user position
        user_position.collateral_balance = remaining_collateral;
        user_position.last_action_timestamp = current_time;

        // Update asset info
        let asset_info = &mut ctx.accounts.asset_info;
        asset_info.total_deposits = asset_info.total_deposits
            .checked_sub(amount)
            .unwrap();

        emit!(WithdrawEvent {
            user: ctx.accounts.user.key(),
            mint: ctx.accounts.mint.key(),
            amount,
        });

        Ok(())
    }

    /// Liquidate unhealthy position
    pub fn liquidate(
        ctx: Context<Liquidate>,
        debt_amount: u64,
    ) -> Result<()> {
        require!(debt_amount > 0, ErrorCode::InvalidAmount);
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        let borrower_position = &mut ctx.accounts.borrower_position;
        require!(borrower_position.user != Pubkey::default(), ErrorCode::PositionNotFound);

        // Check if position is liquidatable
        require!(borrower_position.health_factor < MIN_HEALTH_FACTOR, ErrorCode::LiquidationNotAllowed);
        require!(borrower_position.borrow_balance >= debt_amount, ErrorCode::InvalidAmount);

        // Get prices
        let debt_price = get_asset_price(&ctx.accounts.debt_price_feed)?;
        let collateral_price = get_asset_price(&ctx.accounts.collateral_price_feed)?;

        // Calculate collateral to seize
        let collateral_to_seize = calculate_liquidation_amount(
            debt_amount,
            debt_price,
            collateral_price,
            LIQUIDATION_BONUS,
        )?;

        require!(borrower_position.collateral_balance >= collateral_to_seize, ErrorCode::InsufficientCollateral);

        // Transfer debt tokens from liquidator to pool
        let cpi_accounts = Transfer {
            from: ctx.accounts.liquidator_debt_account.to_account_info(),
            to: ctx.accounts.pool_debt_account.to_account_info(),
            authority: ctx.accounts.liquidator.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program.clone(), cpi_accounts);
        token::transfer(cpi_ctx, debt_amount)?;

        // Transfer collateral from pool to liquidator
        let pool_bump = ctx.accounts.pool.bump;
        let signer_seeds: &[&[&[u8]]] = &[&[b"pool", &[pool_bump]]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_collateral_account.to_account_info(),
            to: ctx.accounts.liquidator_collateral_account.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, collateral_to_seize)?;

        // Update borrower position
        borrower_position.borrow_balance = borrower_position.borrow_balance
            .checked_sub(debt_amount)
            .unwrap();
        borrower_position.collateral_balance = borrower_position.collateral_balance
            .checked_sub(collateral_to_seize)
            .unwrap();

        // Recalculate health factor
        if borrower_position.borrow_balance > 0 {
            let collateral_value = calculate_usd_value(
                borrower_position.collateral_balance,
                collateral_price,
                ctx.accounts.collateral_mint.decimals,
            )?;
            let borrow_value = calculate_usd_value(
                borrower_position.borrow_balance,
                debt_price,
                ctx.accounts.debt_mint.decimals,
            )?;

            borrower_position.health_factor = calculate_health_factor(
                collateral_value,
                borrow_value,
                LIQUIDATION_THRESHOLD,
            )?;
        } else {
            borrower_position.health_factor = u64::MAX; // No debt, maximum health
        }

        emit!(LiquidationEvent {
            liquidator: ctx.accounts.liquidator.key(),
            borrower: ctx.accounts.borrower.key(),
            debt_amount,
            collateral_seized: collateral_to_seize,
            health_factor: borrower_position.health_factor,
        });

        Ok(())
    }

    /// Receive cross-chain message via CCIP
    pub fn ccip_receive(ctx: Context<CCIPReceive>, data: Vec<u8>) -> Result<()> {
        require!(!ctx.accounts.pool.is_paused, ErrorCode::NotAuthorized);

        // Parse cross-chain message (simplified)
        if data.len() < 64 {
            return Err(ErrorCode::CrossChainFailed.into());
        }

        // Mint synthetic asset to user
        let amount = u64::from_le_bytes([
            data[32], data[33], data[34], data[35],
            data[36], data[37], data[38], data[39],
        ]);

        mint_synthetic_asset(
            &ctx.accounts.synthetic_mint,
            &ctx.accounts.user_synthetic_account,
            &ctx.accounts.pool,
            amount,
            ctx.accounts.pool.bump,
        )?;

        emit!(CrossChainMessageReceivedEvent {
            user: ctx.accounts.user.key(),
            action: "synthetic_mint".to_string(),
            amount,
            source_chain: 0, // Parse from data
        });

        Ok(())
    }

    /// Pause the protocol (admin only)
    pub fn pause(ctx: Context<AdminAction>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.is_paused = true;

        emit!(ProtocolPausedEvent {
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }

    /// Unpause the protocol (admin only)
    pub fn unpause(ctx: Context<AdminAction>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.is_paused = false;

        emit!(ProtocolUnpausedEvent {
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }
}

// Account structs
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

// Configuration structs
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AssetConfig {
    pub price_feed: Pubkey,
    pub ltv: u64,
    pub liquidation_threshold: u64,
    pub can_be_collateral: bool,
    pub can_be_borrowed: bool,
}

// Context structs
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
pub struct DepositAccounts<'info> {
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
pub struct RepayAccounts<'info> {
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
pub struct WithdrawAccounts<'info> {
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
pub struct AssetAddedEvent {
    pub mint: Pubkey,
    pub ltv: u64,
    pub liquidation_threshold: u64,
}

#[event]
pub struct DepositEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub chain_selector: u64,
}

#[event]
pub struct BorrowEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub dest_chain: u64,
    pub health_factor: u64,
}

#[event]
pub struct RepayEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

#[event]
pub struct LiquidationEvent {
    pub liquidator: Pubkey,
    pub borrower: Pubkey,
    pub debt_amount: u64,
    pub collateral_seized: u64,
    pub health_factor: u64,
}

#[event]
pub struct CrossChainMessageReceivedEvent {
    pub user: Pubkey,
    pub action: String,
    pub amount: u64,
    pub source_chain: u64,
}

#[event]
pub struct ProtocolPausedEvent {
    pub admin: Pubkey,
}

#[event]
pub struct ProtocolUnpausedEvent {
    pub admin: Pubkey,
}

// Helper functions
fn get_asset_price(_price_feed: &AccountInfo) -> Result<u64> {
    // Placeholder implementation - in production, this would integrate with Chainlink
    // For now, return a mock price (e.g., $1000 with 8 decimals)
    Ok(100_000_000_000) // $1000 with 8 decimal places
}

fn calculate_usd_value(amount: u64, price: u64, decimals: u8) -> Result<u64> {
    let amount_normalized = amount
        .checked_mul(10_u64.pow(18_u32.saturating_sub(decimals as u32)))
        .ok_or(ErrorCode::InvalidAmount)?;
    
    amount_normalized
        .checked_mul(price)
        .and_then(|x| x.checked_div(10_u64.pow(8))) // Price has 8 decimals
        .ok_or(ErrorCode::InvalidAmount.into())
}

fn calculate_health_factor(
    total_collateral_value_usd: u64,
    total_borrow_value_usd: u64,
    liquidation_threshold: u64,
) -> Result<u64> {
    if total_borrow_value_usd == 0 {
        return Ok(u64::MAX); // No debt means infinite health factor
    }

    let adjusted_collateral = total_collateral_value_usd
        .checked_mul(liquidation_threshold)
        .ok_or(ErrorCode::InvalidAmount)?
        .checked_div(PRECISION)
        .ok_or(ErrorCode::InvalidAmount)?;

    adjusted_collateral
        .checked_mul(PRECISION)
        .ok_or(ErrorCode::InvalidAmount)?
        .checked_div(total_borrow_value_usd)
        .ok_or(ErrorCode::InvalidAmount.into())
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

    collateral_value_needed
        .checked_div(collateral_price)
        .ok_or(ErrorCode::InvalidAmount.into())
}

fn update_health_factor(
    user_position: &mut UserPosition,
    _remaining_accounts: &[AccountInfo],
) -> Result<()> {
    // Simplified implementation - in production, this would calculate based on all positions
    if user_position.total_borrow_value_usd == 0 {
        user_position.health_factor = u64::MAX;
    } else {
        user_position.health_factor = calculate_health_factor(
            user_position.total_collateral_value_usd,
            user_position.total_borrow_value_usd,
            LIQUIDATION_THRESHOLD,
        )?;
    }
    Ok(())
}

fn send_ccip_message(
    _ccip_program: &AccountInfo,
    _user: &Signer,
    _action: &str,
    _asset: Pubkey,
    _amount: u64,
    _dest_chain: u64,
    _receiver: [u8; 32],
    _remaining_accounts: &[AccountInfo],
) -> Result<()> {
    // Placeholder implementation - in production, this would send a CCIP message
    msg!("CCIP message would be sent here");
    Ok(())
}

fn mint_synthetic_asset(
    _mint: &Account<Mint>,
    _user_account: &Account<TokenAccount>,
    _authority: &Account<Pool>,
    _amount: u64,
    _authority_bump: u8,
) -> Result<()> {
    // Placeholder implementation - in production, this would mint synthetic assets
    msg!("Synthetic asset would be minted here");
    Ok(())
}
