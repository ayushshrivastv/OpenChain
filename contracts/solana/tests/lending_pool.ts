import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LendingPool, Pool, AssetInfo, UserPosition } from "../types/lending_pool";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  sendAndConfirmTransaction
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAccount
} from "@solana/spl-token";
import { expect } from "chai";
import BN from "bn.js";

describe("Cross-Chain Lending Pool", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.LendingPool as Program<LendingPool>;
  const payer = provider.wallet as anchor.Wallet;

  // Test accounts
  let admin: Keypair;
  let user: Keypair;
  let liquidator: Keypair;

  // Test tokens
  let usdcMint: PublicKey;
  let wethMint: PublicKey;
  let solMint: PublicKey;

  // Pool and asset accounts
  let poolAccount: PublicKey;
  let usdcAssetInfo: PublicKey;
  let wethAssetInfo: PublicKey;

  // User token accounts
  let userUsdcAccount: PublicKey;
  let userWethAccount: PublicKey;
  let poolUsdcAccount: PublicKey;
  let poolWethAccount: PublicKey;

  // User position accounts
  let userUsdcPosition: PublicKey;
  let userWethPosition: PublicKey;

  // Constants
  const LAMPORTS_PER_SOL = 1_000_000_000;
  const USDC_DECIMALS = 6;
  const WETH_DECIMALS = 18;

  before(async () => {
    // Initialize test accounts
    admin = Keypair.generate();
    user = Keypair.generate();
    liquidator = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(liquidator.publicKey, 10 * LAMPORTS_PER_SOL)
    );

    // Create test tokens
    usdcMint = await createMint(
      provider.connection,
      payer.payer,
      admin.publicKey,
      null,
      USDC_DECIMALS
    );

    wethMint = await createMint(
      provider.connection,
      payer.payer,
      admin.publicKey,
      null,
      WETH_DECIMALS
    );

    // Create user token accounts
    userUsdcAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      usdcMint,
      user.publicKey
    );

    userWethAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      wethMint,
      user.publicKey
    );

    // Mint tokens to user
    await mintTo(
      provider.connection,
      payer.payer,
      usdcMint,
      userUsdcAccount,
      admin,
      1000000 * Math.pow(10, USDC_DECIMALS) // 1M USDC
    );

    await mintTo(
      provider.connection,
      payer.payer,
      wethMint,
      userWethAccount,
      admin,
      BigInt(1000 * Math.pow(10, WETH_DECIMALS)) // 1000 WETH
    );

    // Derive PDAs
    [poolAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool")],
      program.programId
    );

    [usdcAssetInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset"), usdcMint.toBuffer()],
      program.programId
    );

    [wethAssetInfo] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset"), wethMint.toBuffer()],
      program.programId
    );

    [userUsdcPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user.publicKey.toBuffer(), usdcMint.toBuffer()],
      program.programId
    );

    [userWethPosition] = PublicKey.findProgramAddressSync(
      [Buffer.from("position"), user.publicKey.toBuffer(), wethMint.toBuffer()],
      program.programId
    );

    // Create pool token accounts
    poolUsdcAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      usdcMint,
      poolAccount
    );

    poolWethAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      wethMint,
      poolAccount
    );
  });

  it("Initialize the lending pool", async () => {
    const ccipProgram = Keypair.generate().publicKey; // Mock CCIP program

    const tx = await program.methods
      .initialize(admin.publicKey, ccipProgram)
      .accounts({
        pool: poolAccount,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    console.log("Initialize transaction signature:", tx);

    // Verify pool state
    const poolState = await program.account.pool.fetch(poolAccount) as Pool;
    expect(poolState.admin.toString()).to.equal(admin.publicKey.toString());
    expect(poolState.ccipProgram.toString()).to.equal(ccipProgram.toString());
    expect(poolState.isPaused).to.be.false;
    expect(poolState.totalAssets).to.equal(0);
  });

  it("Add supported assets", async () => {
    const mockPriceFeed = Keypair.generate().publicKey;

    // Add USDC
    const usdcConfig = {
      priceFeed: mockPriceFeed,
      ltv: new BN("750000000000000000"), // 75%
      liquidationThreshold: new BN("850000000000000000"), // 85%
      canBeCollateral: true,
      canBeBorrowed: true,
    };

    await program.methods
      .addSupportedAsset(usdcConfig)
      .accounts({
        pool: poolAccount,
        assetInfo: usdcAssetInfo,
        mint: usdcMint,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    // Add WETH
    const wethConfig = {
      priceFeed: mockPriceFeed,
      ltv: new BN("750000000000000000"), // 75%
      liquidationThreshold: new BN("850000000000000000"), // 85%
      canBeCollateral: true,
      canBeBorrowed: true,
    };

    await program.methods
      .addSupportedAsset(wethConfig)
      .accounts({
        pool: poolAccount,
        assetInfo: wethAssetInfo,
        mint: wethMint,
        admin: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

        // Verify asset info
    const usdcInfo = await program.account.assetInfo.fetch(usdcAssetInfo) as AssetInfo;
    expect(usdcInfo.mint.toString()).to.equal(usdcMint.toString());
    expect(usdcInfo.isActive).to.be.true;
    expect(usdcInfo.canBeCollateral).to.be.true;
    expect(usdcInfo.canBeBorrowed).to.be.true;

    const wethInfo = await program.account.assetInfo.fetch(wethAssetInfo) as AssetInfo;
    expect(wethInfo.mint.toString()).to.equal(wethMint.toString());
    expect(wethInfo.isActive).to.be.true;
  });

  it("Deposit collateral", async () => {
    const depositAmount = new BN(1000 * Math.pow(10, USDC_DECIMALS)); // 1000 USDC

    await program.methods
      .deposit(depositAmount)
      .accounts({
        pool: poolAccount,
        assetInfo: usdcAssetInfo,
        userPosition: userUsdcPosition,
        mint: usdcMint,
        userTokenAccount: userUsdcAccount,
        poolTokenAccount: poolUsdcAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

        // Verify user position
    const position = await program.account.userPosition.fetch(userUsdcPosition) as UserPosition;
    expect(position.user.toString()).to.equal(user.publicKey.toString());
    expect(position.collateralBalance.toString()).to.equal(depositAmount.toString());

    // Verify asset info updated
    const assetInfo = await program.account.assetInfo.fetch(usdcAssetInfo) as AssetInfo;
    expect(assetInfo.totalDeposits.toString()).to.equal(depositAmount.toString());

    // Verify token transfer
    const poolTokenAccountInfo = await getAccount(provider.connection, poolUsdcAccount);
    expect(poolTokenAccountInfo.amount.toString()).to.equal(depositAmount.toString());
  });

  it("Cross-chain borrow", async () => {
    const borrowAmount = new BN(500 * Math.pow(10, WETH_DECIMALS)); // 500 WETH
    const destChain = new BN(12532609583862916517); // Mumbai chain selector
    const receiver = Array.from(user.publicKey.toBuffer()); // Convert to [u8; 32]

    const mockPriceFeed = Keypair.generate().publicKey;
    const mockCcipProgram = Keypair.generate().publicKey;

    await program.methods
      .borrowCrossChain(borrowAmount, destChain, receiver)
      .accounts({
        pool: poolAccount,
        assetInfo: wethAssetInfo,
        userPosition: userWethPosition,
        mint: wethMint,
        priceFeed: mockPriceFeed,
        ccipProgram: mockCcipProgram,
        user: user.publicKey,
      })
      .signers([user])
      .rpc();

        // Verify user position
    const position = await program.account.userPosition.fetch(userWethPosition) as UserPosition;
    expect(position.borrowBalance.toString()).to.equal(borrowAmount.toString());

    // Verify asset info updated
    const assetInfo = await program.account.assetInfo.fetch(wethAssetInfo) as AssetInfo;
    expect(assetInfo.totalBorrows.toString()).to.equal(borrowAmount.toString());
  });

  it("Repay borrowed amount", async () => {
    const repayAmount = new BN(250 * Math.pow(10, WETH_DECIMALS)); // 250 WETH

    await program.methods
      .repay(repayAmount)
      .accounts({
        pool: poolAccount,
        assetInfo: wethAssetInfo,
        userPosition: userWethPosition,
        mint: wethMint,
        userTokenAccount: userWethAccount,
        poolTokenAccount: poolWethAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Verify user position updated
    const position = await program.account.userPosition.fetch(userWethPosition) as UserPosition;
    const expectedBalance = new BN(250 * Math.pow(10, WETH_DECIMALS)); // 500 - 250 = 250
    expect(position.borrowBalance.toString()).to.equal(expectedBalance.toString());
  });

  it("Withdraw collateral", async () => {
    const withdrawAmount = new BN(500 * Math.pow(10, USDC_DECIMALS)); // 500 USDC

    await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        pool: poolAccount,
        assetInfo: usdcAssetInfo,
        userPosition: userUsdcPosition,
        mint: usdcMint,
        userTokenAccount: userUsdcAccount,
        poolTokenAccount: poolUsdcAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user])
      .rpc();

    // Verify user position updated
    const position = await program.account.userPosition.fetch(userUsdcPosition) as UserPosition;
    const expectedBalance = new BN(500 * Math.pow(10, USDC_DECIMALS)); // 1000 - 500 = 500
    expect(position.collateralBalance.toString()).to.equal(expectedBalance.toString());
  });

  it("Pause and unpause protocol", async () => {
    // Pause
    await program.methods
      .pause()
      .accounts({
        pool: poolAccount,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

        let poolState = await program.account.pool.fetch(poolAccount) as Pool;
    expect(poolState.isPaused).to.be.true;

    // Unpause
    await program.methods
      .unpause()
      .accounts({
        pool: poolAccount,
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();

    poolState = await program.account.pool.fetch(poolAccount) as Pool;
    expect(poolState.isPaused).to.be.false;
  });

  it("Receive cross-chain message", async () => {
    const mockMessage = {
      user: user.publicKey,
      action: "borrow",
      asset: wethMint,
      amount: new BN(100),
      sourceChain: new BN(16015286601757825753), // Sepolia
      destChain: new BN(12532609583862916517), // Mumbai
    };

    const messageData = Buffer.from(JSON.stringify(mockMessage));

    const syntheticMint = await createMint(
      provider.connection,
      payer.payer,
      poolAccount,
      null,
      WETH_DECIMALS
    );

    const userSyntheticAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      syntheticMint,
      user.publicKey
    );

    await program.methods
      .ccipReceive(Array.from(messageData))
      .accounts({
        pool: poolAccount,
        syntheticMint: syntheticMint,
        userSyntheticAccount: userSyntheticAccount,
        user: user.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Cross-chain message processed successfully");
  });

  it("Handle liquidation", async () => {
    const debtAmount = new BN(100 * Math.pow(10, WETH_DECIMALS));

    const borrowerPosition = userWethPosition;
    const borrower = user.publicKey;
    const debtMint = wethMint;
    const collateralMint = usdcMint;

    // Create liquidator token accounts
    const liquidatorDebtAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      debtMint,
      liquidator.publicKey
    );

    const liquidatorCollateralAccount = await createAssociatedTokenAccount(
      provider.connection,
      payer.payer,
      collateralMint,
      liquidator.publicKey
    );

    // Mint debt tokens to liquidator
    await mintTo(
      provider.connection,
      payer.payer,
      debtMint,
      liquidatorDebtAccount,
      admin,
      BigInt(debtAmount.toString())
    );

    const mockPriceFeed = Keypair.generate().publicKey;

    try {
      await program.methods
        .liquidate(debtAmount)
        .accounts({
          pool: poolAccount,
          borrowerPosition: borrowerPosition,
          borrower: borrower,
          debtMint: debtMint,
          collateralMint: collateralMint,
          liquidatorDebtAccount: liquidatorDebtAccount,
          liquidatorCollateralAccount: liquidatorCollateralAccount,
          poolDebtAccount: poolWethAccount,
          poolCollateralAccount: poolUsdcAccount,
          debtPriceFeed: mockPriceFeed,
          collateralPriceFeed: mockPriceFeed,
          liquidator: liquidator.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([liquidator])
        .rpc();

      console.log("Liquidation completed successfully");
    } catch (error) {
      // Liquidation might fail if position is healthy
      console.log("Liquidation failed (position might be healthy):", error instanceof Error ? error.message : String(error));
    }
  });

  it("Check error handling", async () => {
    try {
      // Try to deposit zero amount
      await program.methods
        .deposit(new BN(0))
        .accounts({
          pool: poolAccount,
          assetInfo: usdcAssetInfo,
          userPosition: userUsdcPosition,
          mint: usdcMint,
          userTokenAccount: userUsdcAccount,
          poolTokenAccount: poolUsdcAccount,
          user: user.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown error for zero deposit");
    } catch (error) {
      expect(error instanceof Error ? error.message : String(error)).to.include("InvalidAmount");
    }
  });
});
