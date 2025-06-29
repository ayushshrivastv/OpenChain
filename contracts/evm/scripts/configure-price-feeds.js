const { ethers, network } = require("hardhat");

// Network configurations with real Chainlink addresses
const NETWORK_CONFIG = {
  11155111: { // Sepolia
    name: "Sepolia", 
    ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306", // ETH/USD on Sepolia
    usdcUsdPriceFeed: "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E" // USDC/USD on Sepolia
  }
};

// Latest deployment addresses
const DEPLOYED_CONTRACTS = {
  chainlinkPriceFeed: "0x2E38242Ff1FDa1783fdA682c24A3f409b5c8163f",
  syntheticUSDC: "0x77036167D0b74Fb82BA5966a507ACA06C5E16B30",
  syntheticWETH: "0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44"
};

async function main() {
  const chainId = network.config.chainId;
  const networkConfig = NETWORK_CONFIG[chainId];
  
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${chainId}`);
  }

  console.log("📊 CHAINLINK PRICE FEEDS CONFIGURATION");
  console.log("======================================");
  console.log(`📡 Network: ${networkConfig.name} (${chainId})`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  // Connect to ChainlinkPriceFeed contract
  console.log("\n🔗 Connecting to ChainlinkPriceFeed contract...");
  const priceFeed = await ethers.getContractAt("ChainlinkPriceFeed", DEPLOYED_CONTRACTS.chainlinkPriceFeed);
  console.log("✅ Connected to ChainlinkPriceFeed");

  // Configure price feeds
  console.log("\n📊 Configuring price feeds...");
  
  try {
    // Add ETH/USD price feed (native ETH)
    console.log("Adding ETH/USD price feed...");
    const addEthPriceFeedTx = await priceFeed.addPriceFeed(
      "0x0000000000000000000000000000000000000000", // ETH address (zero address)
      networkConfig.ethUsdPriceFeed,
      3600, // 1 hour staleness threshold
      "ETH/USD Price Feed"
    );
    await addEthPriceFeedTx.wait();
    console.log("✅ Added ETH/USD price feed");
  } catch (error) {
    if (error.message.includes("revert")) {
      console.log("⚠️  ETH price feed already exists or failed to add");
    } else {
      console.error("❌ Error adding ETH price feed:", error.message);
    }
  }
  
  try {
    // Add WETH/USD price feed (same as ETH)
    console.log("Adding WETH/USD price feed...");
    const addWethPriceFeedTx = await priceFeed.addPriceFeed(
      DEPLOYED_CONTRACTS.syntheticWETH,
      networkConfig.ethUsdPriceFeed, // Use same feed as ETH
      3600, // 1 hour staleness threshold
      "WETH/USD Price Feed"
    );
    await addWethPriceFeedTx.wait();
    console.log("✅ Added WETH/USD price feed");
  } catch (error) {
    if (error.message.includes("revert")) {
      console.log("⚠️  WETH price feed already exists or failed to add");
    } else {
      console.error("❌ Error adding WETH price feed:", error.message);
    }
  }
  
  try {
    // Add USDC/USD price feed
    console.log("Adding USDC/USD price feed...");
    const addUsdcPriceFeedTx = await priceFeed.addPriceFeed(
      DEPLOYED_CONTRACTS.syntheticUSDC,
      networkConfig.usdcUsdPriceFeed,
      3600, // 1 hour staleness threshold
      "USDC/USD Price Feed"
    );
    await addUsdcPriceFeedTx.wait();
    console.log("✅ Added USDC/USD price feed");
  } catch (error) {
    if (error.message.includes("revert")) {
      console.log("⚠️  USDC price feed already exists or failed to add");
    } else {
      console.error("❌ Error adding USDC price feed:", error.message);
    }
  }

  // Verify price feeds
  console.log("\n🔍 Verifying price feeds...");
  
  try {
    // Test ETH price
    const [ethPrice, ethIsStale] = await priceFeed.getSafePrice("0x0000000000000000000000000000000000000000");
    console.log(`ETH Price: $${Number(ethPrice) / 1e18} (Stale: ${ethIsStale})`);
  } catch (error) {
    console.log("❌ Failed to get ETH price:", error.message);
  }
  
  try {
    // Test WETH price
    const [wethPrice, wethIsStale] = await priceFeed.getSafePrice(DEPLOYED_CONTRACTS.syntheticWETH);
    console.log(`WETH Price: $${Number(wethPrice) / 1e18} (Stale: ${wethIsStale})`);
  } catch (error) {
    console.log("❌ Failed to get WETH price:", error.message);
  }
  
  try {
    // Test USDC price
    const [usdcPrice, usdcIsStale] = await priceFeed.getSafePrice(DEPLOYED_CONTRACTS.syntheticUSDC);
    console.log(`USDC Price: $${Number(usdcPrice) / 1e18} (Stale: ${usdcIsStale})`);
  } catch (error) {
    console.log("❌ Failed to get USDC price:", error.message);
  }

  console.log("\n🎉 PRICE FEEDS CONFIGURATION COMPLETED!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Configuration failed:", error);
    process.exit(1);
  }); 
 