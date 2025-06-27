const { ethers, network } = require("hardhat");

// Existing contract addresses that we'll reuse
const EXISTING_CONTRACTS = {
  chainlinkPriceFeed: "0x63efCbA94D2A1A4a9dF59A6e73514E0348ED31ff",
  permissions: "0xEAF4ECeBeE04f7D10c47ff31d152a82596D90800",
  rateLimiter: "0xb6CCE115d1535693C8e60F62DB6B11DCC0e93BDf",
  liquidationManager: "0x3b9340C9cC41Fe6F22eF05B555641DC6D7F70c83",
  syntheticUSDC: "0x7b0d1FCC2e4839Ae10a7F936bB2FFd411237068e"
};

// Sepolia network configuration
const SEPOLIA_CONFIG = {
  ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  chainSelector: "16015286601757825753"
};

async function main() {
  console.log("🚀 REDEPLOYING LENDING POOL");
  console.log("===========================");
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  try {
    // 1. Deploy new LendingPool
    console.log("\n🏦 Deploying new LendingPool...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(SEPOLIA_CONFIG.ccipRouter);
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log(`✅ New LendingPool deployed: ${lendingPoolAddress}`);

    // 2. Initialize the new LendingPool
    console.log("\n🔧 Initializing LendingPool...");
    const initTx = await lendingPool.initialize(
      SEPOLIA_CONFIG.ccipRouter,
      SEPOLIA_CONFIG.linkToken,
      EXISTING_CONTRACTS.chainlinkPriceFeed,
      EXISTING_CONTRACTS.liquidationManager,
      EXISTING_CONTRACTS.rateLimiter,
      EXISTING_CONTRACTS.permissions
    );
    await initTx.wait();
    console.log("✅ LendingPool initialized successfully");

    // 3. Configure supported chain
    console.log("\n🌐 Configuring supported chains...");
    const setSupportedChainTx = await lendingPool.setSupportedChain(
      SEPOLIA_CONFIG.chainSelector,
      true
    );
    await setSupportedChainTx.wait();
    console.log("✅ Sepolia chain configured as supported");

    // 4. Add USDC as supported asset
    console.log("\n💰 Adding USDC as supported asset...");
    const addAssetTx = await lendingPool.addSupportedAsset(
      EXISTING_CONTRACTS.syntheticUSDC, // token address
      EXISTING_CONTRACTS.chainlinkPriceFeed, // price feed
      EXISTING_CONTRACTS.syntheticUSDC, // synthetic token (same as token for now)
      ethers.parseEther("0.75"), // 75% LTV
      ethers.parseEther("0.80"), // 80% liquidation threshold
      true, // can be borrowed
      true  // can be collateral
    );
    await addAssetTx.wait();
    console.log("✅ USDC added as supported asset");

    // 5. Update synthetic USDC to use new LendingPool as minter
    console.log("\n🔗 Updating synthetic USDC minter...");
    const syntheticUSDC = await ethers.getContractAt("SyntheticAsset", EXISTING_CONTRACTS.syntheticUSDC);
    const setPoolTx = await syntheticUSDC.setPool(lendingPoolAddress);
    await setPoolTx.wait();
    console.log("✅ Synthetic USDC minter updated");

    // 6. Verification
    console.log("\n✅ VERIFICATION:");
    console.log("================");
    
    const owner = await lendingPool.owner();
    const ccipRouter = await lendingPool.ccipRouter();
    const linkToken = await lendingPool.linkToken();
    const isPaused = await lendingPool.paused();
    
    console.log(`LendingPool Owner: ${owner}`);
    console.log(`CCIP Router: ${ccipRouter}`);
    console.log(`LINK Token: ${linkToken}`);
    console.log(`Is Paused: ${isPaused}`);
    
    // Check first asset
    const firstAsset = await lendingPool.assetsList(0);
    console.log(`First supported asset: ${firstAsset}`);
    
    const assetInfo = await lendingPool.supportedAssets(firstAsset);
    console.log(`Asset active: ${assetInfo.isActive}`);
    console.log(`Can be borrowed: ${assetInfo.canBeBorrowed}`);
    console.log(`Can be collateral: ${assetInfo.canBeCollateral}`);

    // Check chain support
    const isChainSupported = await lendingPool.supportedChains(SEPOLIA_CONFIG.chainSelector);
    console.log(`Sepolia chain supported: ${isChainSupported}`);

    console.log("\n🎉 REDEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("======================================");
    console.log(`🆕 NEW LENDING POOL ADDRESS: ${lendingPoolAddress}`);
    console.log("\n📋 Updated Contract Addresses:");
    console.log(`LendingPool: ${lendingPoolAddress}`);
    console.log(`ChainlinkPriceFeed: ${EXISTING_CONTRACTS.chainlinkPriceFeed}`);
    console.log(`Permissions: ${EXISTING_CONTRACTS.permissions}`);
    console.log(`RateLimiter: ${EXISTING_CONTRACTS.rateLimiter}`);
    console.log(`LiquidationManager: ${EXISTING_CONTRACTS.liquidationManager}`);
    console.log(`SyntheticUSDC: ${EXISTING_CONTRACTS.syntheticUSDC}`);
    
    console.log("\n🔄 Next Steps:");
    console.log("1. Update frontend with new LendingPool address");
    console.log("2. Update deployment records");
    console.log("3. Run comprehensive tests");
    
    return {
      lendingPool: lendingPoolAddress,
      ...EXISTING_CONTRACTS
    };
    
  } catch (error) {
    console.error("❌ REDEPLOYMENT FAILED:", error);
    throw error;
  }
}

// Execute redeployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main }; 
