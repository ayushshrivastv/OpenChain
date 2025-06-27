const { ethers, network } = require("hardhat");

// Live Sepolia contract addresses from deployment
const DEPLOYED_CONTRACTS = {
  lendingPool: "0xDD5c505d69703230CFFfA1307753923302CEb586",
  chainlinkPriceFeed: "0x63efCbA94D2A1A4a9dF59A6e73514E0348ED31ff",
  permissions: "0xEAF4ECeBeE04f7D10c47ff31d152a82596D90800",
  rateLimiter: "0xb6CCE115d1535693C8e60F62DB6B11DCC0e93BDf",
  liquidationManager: "0x3b9340C9cC41Fe6F22eF05B555641DC6D7F70c83"
};

// Sepolia network configuration
const SEPOLIA_CONFIG = {
  ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
};

async function main() {
  console.log("🔧 SIMPLE LENDING POOL INITIALIZATION");
  console.log("=====================================");
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  try {
    // Connect to LendingPool
    console.log("\n🔗 Connecting to LendingPool...");
    const lendingPool = await ethers.getContractAt("LendingPool", DEPLOYED_CONTRACTS.lendingPool);
    
    // Check current state
    console.log("\n📊 Current state:");
    const currentOwner = await lendingPool.owner();
    const currentRouter = await lendingPool.ccipRouter();
    console.log(`Current Owner: ${currentOwner}`);
    console.log(`Current CCIP Router: ${currentRouter}`);
    
    if (currentOwner === "0x0000000000000000000000000000000000000000") {
      console.log("\n🏦 Initializing LendingPool...");
      
      // Estimate gas first
      const gasEstimate = await lendingPool.initialize.estimateGas(
        SEPOLIA_CONFIG.ccipRouter,
        SEPOLIA_CONFIG.linkToken,
        DEPLOYED_CONTRACTS.chainlinkPriceFeed,
        DEPLOYED_CONTRACTS.liquidationManager,
        DEPLOYED_CONTRACTS.rateLimiter,
        DEPLOYED_CONTRACTS.permissions
      );
      
      console.log(`Estimated gas: ${gasEstimate.toString()}`);
      
      // Execute initialization
      const initTx = await lendingPool.initialize(
        SEPOLIA_CONFIG.ccipRouter,
        SEPOLIA_CONFIG.linkToken,
        DEPLOYED_CONTRACTS.chainlinkPriceFeed,
        DEPLOYED_CONTRACTS.liquidationManager,
        DEPLOYED_CONTRACTS.rateLimiter,
        DEPLOYED_CONTRACTS.permissions,
        {
          gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        }
      );
      
      console.log(`Transaction hash: ${initTx.hash}`);
      console.log("⏳ Waiting for confirmation...");
      
      const receipt = await initTx.wait();
      console.log(`✅ Initialized! Block: ${receipt.blockNumber}`);
      
      // Verify initialization
      console.log("\n🔍 Verifying initialization...");
      const newOwner = await lendingPool.owner();
      const newRouter = await lendingPool.ccipRouter();
      const newLinkToken = await lendingPool.linkToken();
      
      console.log(`New Owner: ${newOwner}`);
      console.log(`New CCIP Router: ${newRouter}`);
      console.log(`New LINK Token: ${newLinkToken}`);
      
      if (newOwner === deployer.address) {
        console.log("✅ Ownership correctly set to deployer");
      } else {
        console.log("❌ Ownership not set correctly");
      }
      
      if (newRouter === SEPOLIA_CONFIG.ccipRouter) {
        console.log("✅ CCIP Router correctly configured");
      } else {
        console.log("❌ CCIP Router not configured correctly");
      }
      
    } else {
      console.log("⚠️  LendingPool already initialized");
      console.log(`Owner: ${currentOwner}`);
      console.log(`CCIP Router: ${currentRouter}`);
    }
    
    console.log("\n🎉 INITIALIZATION PROCESS COMPLETE!");
    
  } catch (error) {
    console.error("❌ INITIALIZATION FAILED:", error);
    
    // Provide more detailed error information
    if (error.message.includes("InvalidInitialization")) {
      console.log("💡 The contract appears to already be initialized");
    } else if (error.message.includes("revert")) {
      console.log("💡 The transaction reverted - check contract requirements");
    } else if (error.message.includes("gas")) {
      console.log("💡 Gas-related error - try increasing gas limit");
    }
    
    throw error;
  }
}

// Execute initialization
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main }; 
