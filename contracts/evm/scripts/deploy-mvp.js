const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 DEPLOYING CROSSCHAIN.IO MVP TO TESTNET");
  console.log("============================================");

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  console.log("🌐 Network:", networkName, "Chain ID:", network.chainId.toString());

  // CCIP Configuration
  const CCIP_CONFIG = {
    11155111: { // Sepolia
      router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
      linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
    },
    80001: { // Mumbai  
      router: "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1",
      linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB"
    }
  };

  const chainId = Number(network.chainId);
  const config = CCIP_CONFIG[chainId];
  
  if (!config) {
    throw new Error(`Network ${chainId} not supported for MVP deployment`);
  }

  console.log("🔗 CCIP Router:", config.router);
  console.log("🔗 LINK Token:", config.linkToken);

  // Deploy contracts
  console.log("\n📊 Deploying ChainlinkPriceFeed...");
  const ChainlinkPriceFeed = await ethers.getContractFactory("ChainlinkPriceFeed");
  const priceFeed = await ChainlinkPriceFeed.deploy();
  await priceFeed.waitForDeployment();
  const priceFeedAddress = await priceFeed.getAddress();
  console.log("✅ ChainlinkPriceFeed deployed to:", priceFeedAddress);

  console.log("\n🔐 Deploying Permissions...");
  const Permissions = await ethers.getContractFactory("Permissions");
  const permissions = await Permissions.deploy(deployer.address, deployer.address);
  await permissions.waitForDeployment();
  const permissionsAddress = await permissions.getAddress();
  console.log("✅ Permissions deployed to:", permissionsAddress);

  console.log("\n⏱️ Deploying RateLimiter...");
  const RateLimiter = await ethers.getContractFactory("RateLimiter");
  const rateLimiter = await RateLimiter.deploy();
  await rateLimiter.waitForDeployment();
  const rateLimiterAddress = await rateLimiter.getAddress();
  console.log("✅ RateLimiter deployed to:", rateLimiterAddress);

  console.log("\n💧 Deploying LiquidationManager...");
  const LiquidationManager = await ethers.getContractFactory("LiquidationManager");
  const liquidationManager = await LiquidationManager.deploy(
    priceFeedAddress,
    ethers.ZeroAddress // Placeholder for LendingPool
  );
  await liquidationManager.waitForDeployment();
  const liquidationManagerAddress = await liquidationManager.getAddress();
  console.log("✅ LiquidationManager deployed to:", liquidationManagerAddress);

  console.log("\n🏦 Deploying LendingPool (Upgradeable)...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await upgrades.deployProxy(
    LendingPool,
    [
      config.router,        // CCIP Router
      config.linkToken,     // LINK Token
      priceFeedAddress,     // Price Feed
      liquidationManagerAddress,
      rateLimiterAddress,
      permissionsAddress
    ],
    { initializer: 'initialize' }
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ LendingPool deployed to:", lendingPoolAddress);

  // Deploy synthetic assets
  console.log("\n🪙 Deploying Synthetic USDC...");
  const SyntheticAsset = await ethers.getContractFactory("SyntheticAsset");
  const synthUSDC = await SyntheticAsset.deploy("Synthetic USDC", "sUSDC", lendingPoolAddress);
  await synthUSDC.waitForDeployment();
  const synthUSDCAddress = await synthUSDC.getAddress();
  console.log("✅ Synthetic USDC deployed to:", synthUSDCAddress);

  console.log("\n🪙 Deploying Synthetic WETH...");
  const synthWETH = await SyntheticAsset.deploy("Synthetic WETH", "sWETH", lendingPoolAddress);
  await synthWETH.waitForDeployment();
  const synthWETHAddress = await synthWETH.getAddress();
  console.log("✅ Synthetic WETH deployed to:", synthWETHAddress);

  // Save deployment addresses
  const deploymentInfo = {
    network: networkName,
    chainId: chainId,
    timestamp: new Date().toISOString(),
    contracts: {
      lendingPool: lendingPoolAddress,
      priceFeed: priceFeedAddress,
      permissions: permissionsAddress,
      rateLimiter: rateLimiterAddress,
      liquidationManager: liquidationManagerAddress,
      synthUSDC: synthUSDCAddress,
      synthWETH: synthWETHAddress,
      ccipRouter: config.router,
      linkToken: config.linkToken
    }
  };

  const fs = require('fs');
  const deploymentFile = `./deployments/${networkName}-mvp-deployment.json`;
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 MVP DEPLOYMENT COMPLETE!");
  console.log("============================");
  console.log(`📋 Addresses saved to: ${deploymentFile}`);
  
  console.log("\n📋 Contract Addresses:");
  console.log("🏦 LendingPool:", lendingPoolAddress);
  console.log("📊 ChainlinkPriceFeed:", priceFeedAddress);
  console.log("🔐 Permissions:", permissionsAddress);
  console.log("⏱️ RateLimiter:", rateLimiterAddress);
  console.log("💧 LiquidationManager:", liquidationManagerAddress);
  console.log("🪙 Synthetic USDC:", synthUSDCAddress);
  console.log("🪙 Synthetic WETH:", synthWETHAddress);

  console.log("\n🔧 NEXT STEPS:");
  console.log("1. Update frontend with these addresses");
  console.log("2. Get testnet tokens from faucets");
  console.log("3. Test basic deposit/borrow functionality");
  console.log("4. Deploy to second testnet for cross-chain testing");
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
