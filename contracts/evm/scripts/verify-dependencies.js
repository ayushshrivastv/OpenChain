const { ethers, network } = require("hardhat");

// Contract addresses to verify
const CONTRACTS_TO_VERIFY = {
  chainlinkPriceFeed: "0x63efCbA94D2A1A4a9dF59A6e73514E0348ED31ff",
  permissions: "0xEAF4ECeBeE04f7D10c47ff31d152a82596D90800",
  rateLimiter: "0xb6CCE115d1535693C8e60F62DB6B11DCC0e93BDf",
  liquidationManager: "0x3b9340C9cC41Fe6F22eF05B555641DC6D7F70c83",
  syntheticUSDC: "0x7b0d1FCC2e4839Ae10a7F936bB2FFd411237068e"
};

// Sepolia addresses to verify
const SEPOLIA_ADDRESSES = {
  ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789"
};

async function main() {
  console.log("🔍 VERIFYING CONTRACT DEPENDENCIES");
  console.log("==================================");
  
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  let allValid = true;

  try {
    // Check each deployed contract
    for (const [name, address] of Object.entries(CONTRACTS_TO_VERIFY)) {
      console.log(`\n🔍 Checking ${name} at ${address}...`);
      
      try {
        // Check if contract has code
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
          console.log(`❌ ${name}: No contract code found`);
          allValid = false;
          continue;
        }
        console.log(`✅ ${name}: Has contract code (${code.length} chars)`);
        
        // Try to connect to contract and call a basic function
        if (name === "chainlinkPriceFeed") {
          try {
            const contract = await ethers.getContractAt("ChainlinkPriceFeed", address);
            const owner = await contract.owner();
            console.log(`✅ ${name}: Owner = ${owner}`);
          } catch (error) {
            console.log(`⚠️  ${name}: Could not call owner() - ${error.message}`);
          }
        }
        
        if (name === "permissions") {
          try {
            const contract = await ethers.getContractAt("Permissions", address);
            // Try to check if it has the expected interface
            const hasRole = contract.interface.hasFunction("hasRole");
            console.log(`✅ ${name}: Has hasRole function = ${hasRole}`);
            
            if (hasRole) {
              const defaultAdminRole = await contract.DEFAULT_ADMIN_ROLE();
              console.log(`✅ ${name}: DEFAULT_ADMIN_ROLE = ${defaultAdminRole}`);
            }
          } catch (error) {
            console.log(`⚠️  ${name}: Interface check failed - ${error.message}`);
          }
        }
        
        if (name === "rateLimiter") {
          try {
            const contract = await ethers.getContractAt("RateLimiter", address);
            // Check if it has basic functions
            const hasConfig = contract.interface.hasFunction("configureRateLimit");
            console.log(`✅ ${name}: Has configureRateLimit function = ${hasConfig}`);
          } catch (error) {
            console.log(`⚠️  ${name}: Interface check failed - ${error.message}`);
          }
        }
        
        if (name === "liquidationManager") {
          try {
            const contract = await ethers.getContractAt("LiquidationManager", address);
            // Just check that we can connect
            const hasFunction = contract.interface.hasFunction("liquidate");
            console.log(`✅ ${name}: Has liquidate function = ${hasFunction}`);
          } catch (error) {
            console.log(`⚠️  ${name}: Interface check failed - ${error.message}`);
          }
        }
        
        if (name === "syntheticUSDC") {
          try {
            const contract = await ethers.getContractAt("SyntheticAsset", address);
            const name = await contract.name();
            const symbol = await contract.symbol();
            console.log(`✅ ${name}: ${name} (${symbol})`);
          } catch (error) {
            console.log(`⚠️  ${name}: Token info check failed - ${error.message}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${name}: Verification failed - ${error.message}`);
        allValid = false;
      }
    }
    
    // Check Sepolia addresses
    console.log("\n🌐 Checking Sepolia network addresses...");
    for (const [name, address] of Object.entries(SEPOLIA_ADDRESSES)) {
      console.log(`\n🔍 Checking ${name} at ${address}...`);
      
      try {
        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
          console.log(`❌ ${name}: No contract code found`);
          allValid = false;
        } else {
          console.log(`✅ ${name}: Has contract code (${code.length} chars)`);
        }
      } catch (error) {
        console.log(`❌ ${name}: Check failed - ${error.message}`);
        allValid = false;
      }
    }
    
    // Test a minimal initialization call
    console.log("\n🧪 Testing minimal LendingPool initialization...");
    try {
      // Deploy a test LendingPool
      const LendingPool = await ethers.getContractFactory("LendingPool");
      console.log("✅ LendingPool factory created");
      
      // Try to estimate gas for deployment
      const deploymentData = LendingPool.getDeployTransaction(SEPOLIA_ADDRESSES.ccipRouter);
      const gasEstimate = await ethers.provider.estimateGas(deploymentData);
      console.log(`✅ Deployment gas estimate: ${gasEstimate.toString()}`);
      
    } catch (error) {
      console.log(`❌ LendingPool test failed: ${error.message}`);
      allValid = false;
    }
    
    console.log("\n🎯 VERIFICATION SUMMARY:");
    console.log("========================");
    if (allValid) {
      console.log("✅ All contract dependencies appear to be valid");
      console.log("✅ Sepolia network addresses are accessible");
      console.log("✅ LendingPool can be deployed");
      console.log("\n💡 The initialization issue may be due to:");
      console.log("   - Contract logic requirements not met");
      console.log("   - Insufficient gas limit");
      console.log("   - Access control restrictions");
    } else {
      console.log("❌ Some contract dependencies have issues");
      console.log("❌ Need to fix dependency contracts before proceeding");
    }
    
  } catch (error) {
    console.error("❌ VERIFICATION FAILED:", error);
    throw error;
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main }; 
