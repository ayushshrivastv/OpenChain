const { ethers, network } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Network configurations with real testnet addresses
const NETWORK_CONFIG = {
  11155111: { // Sepolia
    name: "Sepolia",
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    chainSelector: "16015286601757825753"
  },
  80001: { // Mumbai
    name: "Mumbai", 
    ccipRouter: "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1",
    linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    chainSelector: "12532609583862916517"
  },
  31337: { // Hardhat (for testing)
    name: "Hardhat",
    ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Use Sepolia addresses for testing
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    chainSelector: "16015286601757825753"
  }
};

async function main() {
  const chainId = network.config.chainId;
  const networkConfig = NETWORK_CONFIG[chainId];
  
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${chainId}. Supported networks: Sepolia (11155111), Mumbai (80001), Hardhat (31337)`);
  }

  console.log("🚀 CROSSCHAIN.IO TESTNET DEPLOYMENT STARTED");
  console.log("==========================================");
  console.log(`📡 Network: ${networkConfig.name} (${chainId})`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  WARNING: Low balance. You may need more ETH for deployment.");
  }

  const deploymentResults = {};

  try {
    // 1. Deploy ChainlinkPriceFeed
    console.log("\n📊 Deploying ChainlinkPriceFeed...");
    const ChainlinkPriceFeed = await ethers.getContractFactory("ChainlinkPriceFeed");
    const priceFeed = await ChainlinkPriceFeed.deploy();
    await priceFeed.waitForDeployment();
    const priceFeedAddress = await priceFeed.getAddress();
    console.log(`✅ ChainlinkPriceFeed deployed: ${priceFeedAddress}`);
    deploymentResults.chainlinkPriceFeed = priceFeedAddress;

    // 2. Deploy Permissions
    console.log("\n🔐 Deploying Permissions...");
    const Permissions = await ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy(deployer.address, deployer.address); // admin, emergencyGuardian
    await permissions.waitForDeployment();
    const permissionsAddress = await permissions.getAddress();
    console.log(`✅ Permissions deployed: ${permissionsAddress}`);
    deploymentResults.permissions = permissionsAddress;

    // 3. Deploy RateLimiter
    console.log("\n⏱️  Deploying RateLimiter...");
    const RateLimiter = await ethers.getContractFactory("RateLimiter");
    const rateLimiter = await RateLimiter.deploy();
    await rateLimiter.waitForDeployment();
    const rateLimiterAddress = await rateLimiter.getAddress();
    console.log(`✅ RateLimiter deployed: ${rateLimiterAddress}`);
    deploymentResults.rateLimiter = rateLimiterAddress;

    // 4. Deploy LiquidationManager (placeholder for LendingPool)
    console.log("\n💧 Deploying LiquidationManager...");
    const LiquidationManager = await ethers.getContractFactory("LiquidationManager");
    const liquidationManager = await LiquidationManager.deploy(
      networkConfig.ccipRouter,
      priceFeedAddress
    );
    await liquidationManager.waitForDeployment();
    const liquidationManagerAddress = await liquidationManager.getAddress();
    console.log(`✅ LiquidationManager deployed: ${liquidationManagerAddress}`);
    deploymentResults.liquidationManager = liquidationManagerAddress;

    // 5. Deploy ChainlinkSecurity
    console.log("\n🛡️  Deploying ChainlinkSecurity...");
    const ChainlinkSecurity = await ethers.getContractFactory("ChainlinkSecurity");
    const chainlinkSecurity = await ChainlinkSecurity.deploy(
      "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625", // VRF Coordinator for Sepolia
      liquidationManagerAddress, // lendingPool address (will be deployed later, using placeholder)
      1, // subscriptionId
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" // keyHash for Sepolia
    );
    await chainlinkSecurity.waitForDeployment();
    const chainlinkSecurityAddress = await chainlinkSecurity.getAddress();
    console.log(`✅ ChainlinkSecurity deployed: ${chainlinkSecurityAddress}`);
    deploymentResults.chainlinkSecurity = chainlinkSecurityAddress;

    // 6. Deploy TimeLock
    console.log("\n⏰ Deploying TimeLock...");
    const TimeLock = await ethers.getContractFactory("TimeLock");
    const timeLock = await TimeLock.deploy(
      [deployer.address], // proposers
      [deployer.address], // executors  
      deployer.address // admin
    );
    await timeLock.waitForDeployment();
    const timeLockAddress = await timeLock.getAddress();
    console.log(`✅ TimeLock deployed: ${timeLockAddress}`);
    deploymentResults.timeLock = timeLockAddress;

    // 7. Deploy LendingPool
    console.log("\n🏦 Deploying LendingPool...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(networkConfig.ccipRouter);
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log(`✅ LendingPool deployed: ${lendingPoolAddress}`);
    deploymentResults.lendingPool = lendingPoolAddress;

    // Note: LendingPool initialization should be done separately after deployment
    // to avoid InvalidInitialization error in upgradeable contracts

    // 8. Deploy SyntheticAsset (USDC example)
    console.log("\n💎 Deploying SyntheticAsset (USDC)...");
    const SyntheticAsset = await ethers.getContractFactory("SyntheticAsset");
    const synthUSDC = await SyntheticAsset.deploy(
      "Synthetic USDC",
      "sUSDC"
    );
    await synthUSDC.waitForDeployment();
    const synthUSDCAddress = await synthUSDC.getAddress();
    console.log(`✅ SyntheticAsset (USDC) deployed: ${synthUSDCAddress}`);
    
    // Set the LendingPool as the minter
    await synthUSDC.setPool(lendingPoolAddress);
    console.log(`✅ LendingPool set as minter for SyntheticAsset`);
    
    deploymentResults.syntheticAssets = { USDC: synthUSDCAddress };

    // Save deployment results
    const deploymentData = {
      network: networkConfig.name,
      chainId: chainId,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deploymentResults
    };

    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${networkConfig.name.toLowerCase()}-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentsDir, filename),
      JSON.stringify(deploymentData, null, 2)
    );

    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=====================================");
    console.log(`📄 Deployment saved: deployments/${filename}`);
    console.log("\n📋 CONTRACT ADDRESSES:");
    console.log("======================");
    for (const [name, address] of Object.entries(deploymentResults)) {
      if (typeof address === 'string') {
        console.log(`${name}: ${address}`);
      } else {
        console.log(`${name}:`);
        for (const [subName, subAddress] of Object.entries(address)) {
          console.log(`  ${subName}: ${subAddress}`);
        }
      }
    }

    console.log("\n🔗 Next Steps:");
    console.log("1. Update frontend contract addresses");
    console.log("2. Verify contracts on block explorer");
    console.log("3. Set up Chainlink VRF subscription");
    console.log("4. Configure price feeds");

    return deploymentResults;
    
  } catch (error) {
    console.error("❌ DEPLOYMENT FAILED:", error);
    throw error;
  }
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main }; 
