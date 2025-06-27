const { ethers, upgrades, network } = require("hardhat");
const fs = require("fs");

// Network configurations
const CCIP_ROUTERS = {
  sepolia: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  mumbai: "0x1035CabC275068e0F4b745A29CEDf38E13aF41b1",
};

const LINK_TOKENS = {
  sepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
  mumbai: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
};

const CHAIN_SELECTORS = {
  sepolia: "16015286601757825753",
  mumbai: "12532609583862916517",
};

async function main() {
  console.log("🚀 Starting FIXED CrossChain.io Deployment...");
  console.log("============================================================");
  
  const [deployer] = await ethers.getSigners();
  const networkName = network.name;
  const chainId = await deployer.provider.getNetwork().then(n => Number(n.chainId));
  
  console.log("📡 Network:", networkName);
  console.log("🔗 Chain ID:", chainId);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  // Get network-specific configuration
  const ccipRouter = CCIP_ROUTERS[networkName];
  const linkToken = LINK_TOKENS[networkName];
  const chainSelector = CHAIN_SELECTORS[networkName];
  
  if (!ccipRouter || !linkToken) {
    throw new Error(`Network ${networkName} not supported for CCIP deployment`);
  }
  
  console.log("🔗 CCIP Router:", ccipRouter);
  console.log("🔗 LINK Token:", linkToken);
  console.log("🔗 Chain Selector:", chainSelector);
  
  const deploymentInfo = {
    network: networkName,
    chainId,
    deployer: deployer.address,
    contracts: {},
    ccipConfig: {
      router: ccipRouter,
      linkToken: linkToken,
      chainSelector: chainSelector,
    },
    deploymentTimestamp: Date.now(),
    transactionHashes: [],
  };
  
  try {
    // 1. Deploy ChainlinkPriceFeed
    console.log("\n📊 Deploying ChainlinkPriceFeed...");
    const ChainlinkPriceFeed = await ethers.getContractFactory("ChainlinkPriceFeed");
    const priceFeed = await ChainlinkPriceFeed.deploy();
    await priceFeed.waitForDeployment();
    const priceFeedAddress = await priceFeed.getAddress();
    deploymentInfo.contracts.priceFeed = priceFeedAddress;
    console.log("✅ ChainlinkPriceFeed deployed to:", priceFeedAddress);
    
    // 2. Deploy Permissions
    console.log("\n🔐 Deploying Permissions...");
    const Permissions = await ethers.getContractFactory("Permissions");
    const permissions = await Permissions.deploy(deployer.address, deployer.address);
    await permissions.waitForDeployment();
    const permissionsAddress = await permissions.getAddress();
    deploymentInfo.contracts.permissions = permissionsAddress;
    console.log("✅ Permissions deployed to:", permissionsAddress);
    
    // 3. Deploy RateLimiter
    console.log("\n⏱️ Deploying RateLimiter...");
    const RateLimiter = await ethers.getContractFactory("RateLimiter");
    const rateLimiter = await RateLimiter.deploy();
    await rateLimiter.waitForDeployment();
    const rateLimiterAddress = await rateLimiter.getAddress();
    deploymentInfo.contracts.rateLimiter = rateLimiterAddress;
    console.log("✅ RateLimiter deployed to:", rateLimiterAddress);
    
    // 4. Deploy LiquidationManager (placeholder for LendingPool)
    console.log("\n💧 Deploying LiquidationManager...");
    const LiquidationManager = await ethers.getContractFactory("LiquidationManager");
    const liquidationManager = await LiquidationManager.deploy(
      ethers.ZeroAddress, // Will be updated after LendingPool deployment
      priceFeedAddress
    );
    await liquidationManager.waitForDeployment();
    const liquidationManagerAddress = await liquidationManager.getAddress();
    deploymentInfo.contracts.liquidationManager = liquidationManagerAddress;
    console.log("✅ LiquidationManager deployed to:", liquidationManagerAddress);
    
    // 5. Deploy ChainlinkSecurity
    console.log("\n🔒 Deploying ChainlinkSecurity...");
    const ChainlinkSecurity = await ethers.getContractFactory("ChainlinkSecurity");
    
    // VRF Coordinator addresses for different networks
    const vrfCoordinators = {
      sepolia: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
      mumbai: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed"
    };
    
    const keyHashes = {
      sepolia: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
      mumbai: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f"  // 500 gwei
    };
    
    const vrfCoordinator = vrfCoordinators[networkName];
    const keyHash = keyHashes[networkName];
    const subscriptionId = 1; // Placeholder - would need real VRF subscription
    
    console.log("  - VRF Coordinator:", vrfCoordinator);
    console.log("  - Key Hash:", keyHash);
    console.log("  - Subscription ID:", subscriptionId);
    
    const chainlinkSecurity = await ChainlinkSecurity.deploy(
      vrfCoordinator,
      ethers.ZeroAddress, // LendingPool address - will be set after deployment
      subscriptionId,
      keyHash
    );
    await chainlinkSecurity.waitForDeployment();
    const chainlinkSecurityAddress = await chainlinkSecurity.getAddress();
    deploymentInfo.contracts.chainlinkSecurity = chainlinkSecurityAddress;
    console.log("✅ ChainlinkSecurity deployed to:", chainlinkSecurityAddress);
    
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
    deploymentInfo.contracts.timeLock = timeLockAddress;
    console.log("✅ TimeLock deployed to:", timeLockAddress);
    
    // 7. Deploy LendingPool (Upgradeable) - FIXED VERSION
    console.log("\n🏦 Deploying LendingPool (FIXED Upgradeable)...");
    const LendingPool = await ethers.getContractFactory("LendingPool");
    
    console.log("🔧 Initializing with parameters:");
    console.log("  - CCIP Router:", ccipRouter);
    console.log("  - LINK Token:", linkToken);
    console.log("  - Price Feed:", priceFeedAddress);
    console.log("  - Liquidation Manager:", liquidationManagerAddress);
    console.log("  - Rate Limiter:", rateLimiterAddress);
    console.log("  - Permissions:", permissionsAddress);
    
    const lendingPool = await upgrades.deployProxy(
      LendingPool,
      [
        ccipRouter,
        linkToken,
        priceFeedAddress,
        liquidationManagerAddress,
        rateLimiterAddress,
        permissionsAddress,
      ],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    deploymentInfo.contracts.lendingPool = lendingPoolAddress;
    console.log("✅ LendingPool deployed to:", lendingPoolAddress);
    
    // 8. Deploy Synthetic USDC
    console.log("\n🪙 Deploying Synthetic USDC...");
    const SyntheticAsset = await ethers.getContractFactory("SyntheticAsset");
    const synthUSDC = await SyntheticAsset.deploy("Synthetic USDC", "sUSDC");
    await synthUSDC.waitForDeployment();
    const synthUSDCAddress = await synthUSDC.getAddress();
    deploymentInfo.contracts.synthUSDC = synthUSDCAddress;
    console.log("✅ Synthetic USDC deployed to:", synthUSDCAddress);
    
    // 9. Deploy Synthetic WETH
    console.log("\n🪙 Deploying Synthetic WETH...");
    const synthWETH = await SyntheticAsset.deploy("Synthetic WETH", "sWETH");
    await synthWETH.waitForDeployment();
    const synthWETHAddress = await synthWETH.getAddress();
    deploymentInfo.contracts.synthWETH = synthWETHAddress;
    console.log("✅ Synthetic WETH deployed to:", synthWETHAddress);
    
    // 10. Verify LendingPool is properly initialized
    console.log("\n🔍 Verifying LendingPool initialization...");
    const owner = await lendingPool.owner();
    const ccipRouterSet = await lendingPool.ccipRouter();
    const linkTokenSet = await lendingPool.linkToken();
    
    console.log("✅ LendingPool Owner:", owner);
    console.log("✅ CCIP Router Set:", ccipRouterSet);
    console.log("✅ LINK Token Set:", linkTokenSet);
    
    if (owner === deployer.address && ccipRouterSet === ccipRouter && linkTokenSet === linkToken) {
      console.log("🎉 LendingPool initialization SUCCESSFUL!");
    } else {
      throw new Error("❌ LendingPool initialization FAILED!");
    }
    
    // 11. Configure initial settings
    console.log("\n⚙️ Setting up initial configurations...");
    
    // Add supported chains
    const supportedChains = [
      { name: "Sepolia", selector: CHAIN_SELECTORS.sepolia },
      { name: "Mumbai", selector: CHAIN_SELECTORS.mumbai },
    ];
    
    for (const chain of supportedChains) {
      if (chain.selector !== chainSelector) { // Don't add self
        console.log(`🔗 Adding supported chain: ${chain.name} (${chain.selector})`);
        const tx = await lendingPool.setSupportedChain(chain.selector, true);
        await tx.wait();
        console.log("✅ Chain added successfully");
      }
    }
    
    // Configure price feeds (using Chainlink testnet price feeds)
    const priceFeeds = networkName === "sepolia" ? [
      { asset: "USDC", feed: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E" },
      { asset: "WETH", feed: "0x694AA1769357215DE4FAC081bf1f309aDC325306" },
    ] : [
      { asset: "USDC", feed: "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0" },
      { asset: "WETH", feed: "0x0715A7794a1dc8e42615F059dD6e406A6594651A" },
    ];
    
    // Add supported assets to lending pool
    console.log("\n💰 Adding supported assets...");
    
    console.log("📊 Adding Synthetic USDC as supported asset...");
    const tx1 = await lendingPool.addSupportedAsset(
      synthUSDCAddress,
      priceFeeds.find(p => p.asset === "USDC").feed,
      synthUSDCAddress,
      ethers.parseEther("0.75"), // 75% LTV
      ethers.parseEther("0.80"), // 80% liquidation threshold
      true,  // can be borrowed
      true   // can be collateral
    );
    await tx1.wait();
    console.log("✅ Synthetic USDC added successfully");
    
    console.log("📊 Adding Synthetic WETH as supported asset...");
    const tx2 = await lendingPool.addSupportedAsset(
      synthWETHAddress,
      priceFeeds.find(p => p.asset === "WETH").feed,
      synthWETHAddress,
      ethers.parseEther("0.75"), // 75% LTV
      ethers.parseEther("0.80"), // 80% liquidation threshold
      true,  // can be borrowed
      true   // can be collateral
    );
    await tx2.wait();
    console.log("✅ Synthetic WETH added successfully");
    
    // 12. Final verification
    console.log("\n🔍 Final verification...");
    const supportedAssets = await lendingPool.getSupportedAssets();
    console.log("✅ Supported assets count:", supportedAssets.length);
    console.log("✅ Supported assets:", supportedAssets);
    
    // Save deployment info
    const deploymentFile = `deployments/${networkName}-fixed-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("============================================================");
    console.log("📄 Deployment info saved to:", deploymentFile);
    console.log("\n📋 CONTRACT ADDRESSES:");
    console.log("🏦 LendingPool:", lendingPoolAddress);
    console.log("📊 ChainlinkPriceFeed:", priceFeedAddress);
    console.log("🔐 Permissions:", permissionsAddress);
    console.log("⏱️ RateLimiter:", rateLimiterAddress);
    console.log("💧 LiquidationManager:", liquidationManagerAddress);
    console.log("🔒 ChainlinkSecurity:", chainlinkSecurityAddress);
    console.log("⏰ TimeLock:", timeLockAddress);
    console.log("🪙 Synthetic USDC:", synthUSDCAddress);
    console.log("🪙 Synthetic WETH:", synthWETHAddress);
    console.log("============================================================");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
