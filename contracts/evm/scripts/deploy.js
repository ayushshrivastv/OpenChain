const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

// Chainlink CCIP Router addresses (Testnet)
const CCIP_ROUTERS = {
  sepolia: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59", // Sepolia testnet
  mumbai: "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1",   // Mumbai testnet
};

// Chainlink LINK token addresses (Testnet)
const LINK_TOKENS = {
  sepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // Sepolia testnet
  mumbai: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",   // Mumbai testnet
};

// Price feed addresses (Testnet) - These are examples, use actual Chainlink feeds
const PRICE_FEEDS = {
  sepolia: {
    ETH_USD: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    USDC_USD: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E",
  },
  mumbai: {
    MATIC_USD: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    USDC_USD: "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
  }
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "sepolia" : network.name;
  
  console.log("🚀 Deploying Cross-Chain Lending Protocol...");
  console.log("📡 Network:", networkName);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Get network-specific addresses
  const ccipRouter = CCIP_ROUTERS[networkName];
  const linkToken = LINK_TOKENS[networkName];
  
  if (!ccipRouter || !linkToken) {
    throw new Error(`❌ Network ${networkName} not supported or missing addresses`);
  }
  
  console.log("🔗 CCIP Router:", ccipRouter);
  console.log("🔗 LINK Token:", linkToken);
  
  // 1. Deploy ChainlinkPriceFeed
  console.log("\n📊 Deploying ChainlinkPriceFeed...");
  const ChainlinkPriceFeed = await ethers.getContractFactory("ChainlinkPriceFeed");
  const priceFeed = await ChainlinkPriceFeed.deploy();
  await priceFeed.waitForDeployment();
  const priceFeedAddress = await priceFeed.getAddress();
  console.log("✅ ChainlinkPriceFeed deployed to:", priceFeedAddress);
  
  // 2. Deploy Permissions
  console.log("\n🔐 Deploying Permissions...");
  const Permissions = await ethers.getContractFactory("Permissions");
  const permissions = await Permissions.deploy(deployer.address, deployer.address);
  await permissions.waitForDeployment();
  const permissionsAddress = await permissions.getAddress();
  console.log("✅ Permissions deployed to:", permissionsAddress);
  
  // 3. Deploy RateLimiter
  console.log("\n⏱️ Deploying RateLimiter...");
  const RateLimiter = await ethers.getContractFactory("RateLimiter");
  const rateLimiter = await RateLimiter.deploy();
  await rateLimiter.waitForDeployment();
  const rateLimiterAddress = await rateLimiter.getAddress();
  console.log("✅ RateLimiter deployed to:", rateLimiterAddress);
  
  // 4. Deploy LiquidationManager (we'll update this after LendingPool)
  console.log("\n💧 Deploying LiquidationManager...");
  const LiquidationManager = await ethers.getContractFactory("LiquidationManager");
  const liquidationManager = await LiquidationManager.deploy(
    ethers.ZeroAddress, // Will be updated after LendingPool deployment
    priceFeedAddress
  );
  await liquidationManager.waitForDeployment();
  const liquidationManagerAddress = await liquidationManager.getAddress();
  console.log("✅ LiquidationManager deployed to:", liquidationManagerAddress);
  
  // 5. Deploy LendingPool (upgradeable)
  console.log("\n🏦 Deploying LendingPool (Upgradeable)...");
  const LendingPool = await ethers.getContractFactory("LendingPool");
  const lendingPool = await upgrades.deployProxy(
    LendingPool,
    [
      ccipRouter,
      linkToken,
      priceFeedAddress,
      liquidationManagerAddress,
      rateLimiterAddress,
      permissionsAddress
    ],
    {
      initializer: "initialize",
      constructorArgs: [ccipRouter]
    }
  );
  await lendingPool.waitForDeployment();
  const lendingPoolAddress = await lendingPool.getAddress();
  console.log("✅ LendingPool deployed to:", lendingPoolAddress);
  
  // 6. Update LiquidationManager with LendingPool address
  console.log("\n🔄 Updating LiquidationManager with LendingPool address...");
  await liquidationManager.updateLendingPool(lendingPoolAddress);
  console.log("✅ LiquidationManager updated");
  
  // 7. Deploy SyntheticAsset for USDC
  console.log("\n🪙 Deploying Synthetic USDC...");
  const SyntheticAsset = await ethers.getContractFactory("SyntheticAsset");
  const synthUSDC = await SyntheticAsset.deploy("Synthetic USDC", "sUSDC");
  await synthUSDC.waitForDeployment();
  const synthUSDCAddress = await synthUSDC.getAddress();
  console.log("✅ Synthetic USDC deployed to:", synthUSDCAddress);
  
  // 8. Deploy SyntheticAsset for WETH
  console.log("\n🪙 Deploying Synthetic WETH...");
  const synthWETH = await SyntheticAsset.deploy("Synthetic WETH", "sWETH");
  await synthWETH.waitForDeployment();
  const synthWETHAddress = await synthWETH.getAddress();
  console.log("✅ Synthetic WETH deployed to:", synthWETHAddress);
  
  // 9. Set up initial configurations
  console.log("\n⚙️ Setting up initial configurations...");
  
  // Configure supported chains
  const supportedChains = {
    sepolia: "16015286601757825753",
    mumbai: "12532609583862916517"
  };
  
  for (const [chainName, chainSelector] of Object.entries(supportedChains)) {
    if (chainName !== networkName) {
      console.log(`🔗 Adding supported chain: ${chainName} (${chainSelector})`);
      await lendingPool.setSupportedChain(chainSelector, true);
    }
  }
  
  // Configure price feeds
  if (PRICE_FEEDS[networkName]) {
    const feeds = PRICE_FEEDS[networkName];
    for (const [asset, feedAddress] of Object.entries(feeds)) {
      console.log(`📊 Adding price feed for ${asset}: ${feedAddress}`);
      await priceFeed.addPriceFeed(
        ethers.ZeroAddress, // Placeholder - replace with actual token addresses
        feedAddress,
        3600, // 1 hour heartbeat
        `${asset} Price Feed`
      );
    }
  }
  
  // Configure rate limits
  console.log("⏱️ Configuring rate limits...");
  await rateLimiter.configureRateLimit(
    "deposit",
    10, // max 10 requests
    900, // per 15 minutes
    0, // FIXED_WINDOW
    0, // not used for fixed window
    0  // not used for fixed window
  );
  
  await rateLimiter.configureRateLimit(
    "borrow",
    5, // max 5 requests
    900, // per 15 minutes
    0, // FIXED_WINDOW
    0, // not used
    0  // not used
  );
  
  // Configure liquidation settings
  console.log("💧 Configuring liquidation settings...");
  // This is handled by the LiquidationManager constructor
  
  console.log("\n🎉 Deployment Complete!");
  console.log("=" * 60);
  console.log("📋 Contract Addresses:");
  console.log("=" * 60);
  console.log(`🏦 LendingPool: ${lendingPoolAddress}`);
  console.log(`📊 ChainlinkPriceFeed: ${priceFeedAddress}`);
  console.log(`🔐 Permissions: ${permissionsAddress}`);
  console.log(`⏱️ RateLimiter: ${rateLimiterAddress}`);
  console.log(`💧 LiquidationManager: ${liquidationManagerAddress}`);
  console.log(`🪙 Synthetic USDC: ${synthUSDCAddress}`);
  console.log(`🪙 Synthetic WETH: ${synthWETHAddress}`);
  console.log("=" * 60);
  
  // Save deployment addresses
  const deployment = {
    network: networkName,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      LendingPool: lendingPoolAddress,
      ChainlinkPriceFeed: priceFeedAddress,
      Permissions: permissionsAddress,
      RateLimiter: rateLimiterAddress,
      LiquidationManager: liquidationManagerAddress,
      SyntheticUSDC: synthUSDCAddress,
      SyntheticWETH: synthWETHAddress
    },
    configuration: {
      ccipRouter: ccipRouter,
      linkToken: linkToken,
      supportedChains: supportedChains
    }
  };
  
  const fs = require("fs");
  const path = require("path");
  const deploymentDir = path.join(__dirname, "..", "deployments");
  
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);
  
  console.log("\n🔍 Next Steps:");
  console.log("1. Verify contracts on block explorer");
  console.log("2. Add supported assets with addSupportedAsset()");
  console.log("3. Configure cross-chain destinations");
  console.log("4. Fund contracts with LINK tokens for CCIP");
  console.log("5. Test basic functionality");
  
  console.log("\n📝 Verification Commands:");
  console.log(`npx hardhat verify --network ${networkName} ${priceFeedAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${permissionsAddress} "${deployer.address}" "${deployer.address}"`);
  console.log(`npx hardhat verify --network ${networkName} ${rateLimiterAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${synthUSDCAddress} "Synthetic USDC" "sUSDC"`);
  console.log(`npx hardhat verify --network ${networkName} ${synthWETHAddress} "Synthetic WETH" "sWETH"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
