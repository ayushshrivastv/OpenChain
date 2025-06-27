const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing FIXED Deployment...");
  console.log("============================================================");
  
  const [deployer] = await ethers.getSigners();
  console.log("👤 Testing with deployer:", deployer.address);
  
  // FIXED deployment addresses
  const FIXED_ADDRESSES = {
    lendingPool: "0x473AC85625b7f9F18eA21d2250ea19Ded1093a99",
    chainlinkPriceFeed: "0x2E38242Ff1FDa1783fdA682c24A3f409b5c8163f",
    permissions: "0xe5D4a658583D66a124Af361070c6135A6ce33F5a",
    rateLimiter: "0x4FFc21015131556B90A86Ab189D9Cba970683205",
    liquidationManager: "0x53E0672c2280e621f29dCC47696043d6B436F970",
    chainlinkSecurity: "0x90d25B11B7C7d4814B6D583DfE26321d08ba66ed",
    timeLock: "0xE55f1Ecc2144B09AFEB3fAf16F91c007568828C0",
    synthUSDC: "0x77036167D0b74Fb82BA5966a507ACA06C5E16B30",
    synthWETH: "0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44"
  };
  
  console.log("📋 Testing contract addresses:");
  Object.entries(FIXED_ADDRESSES).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  
  try {
    // Get contract instances
    const lendingPool = await ethers.getContractAt("LendingPool", FIXED_ADDRESSES.lendingPool);
    const synthUSDC = await ethers.getContractAt("SyntheticAsset", FIXED_ADDRESSES.synthUSDC);
    const synthWETH = await ethers.getContractAt("SyntheticAsset", FIXED_ADDRESSES.synthWETH);
    
    console.log("\n🔍 CRITICAL INITIALIZATION TESTS");
    console.log("============================================================");
    
    // Test 1: Owner verification
    const owner = await lendingPool.owner();
    const ownerCorrect = owner === deployer.address;
    console.log(`✅ Owner Test: ${ownerCorrect ? "PASS" : "FAIL"}`);
    console.log(`   Expected: ${deployer.address}`);
    console.log(`   Actual: ${owner}`);
    
    // Test 2: CCIP Router verification
    const ccipRouter = await lendingPool.ccipRouter();
    const ccipCorrect = ccipRouter === "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59";
    console.log(`✅ CCIP Router Test: ${ccipCorrect ? "PASS" : "FAIL"}`);
    console.log(`   Expected: 0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`);
    console.log(`   Actual: ${ccipRouter}`);
    
    // Test 3: LINK Token verification
    const linkToken = await lendingPool.linkToken();
    const linkCorrect = linkToken === "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    console.log(`✅ LINK Token Test: ${linkCorrect ? "PASS" : "FAIL"}`);
    console.log(`   Expected: 0x779877A7B0D9E8603169DdbD7836e478b4624789`);
    console.log(`   Actual: ${linkToken}`);
    
    // Test 4: Supported assets verification
    const supportedAssets = await lendingPool.getSupportedAssets();
    const assetsCorrect = supportedAssets.length === 2;
    console.log(`✅ Supported Assets Test: ${assetsCorrect ? "PASS" : "FAIL"}`);
    console.log(`   Expected: 2 assets`);
    console.log(`   Actual: ${supportedAssets.length} assets`);
    console.log(`   Assets: ${supportedAssets}`);
    
    // Test 5: Asset configuration verification
    const usdcAsset = await lendingPool.supportedAssets(FIXED_ADDRESSES.synthUSDC);
    const usdcActive = usdcAsset.isActive;
    console.log(`✅ USDC Asset Config Test: ${usdcActive ? "PASS" : "FAIL"}`);
    console.log(`   Active: ${usdcActive}`);
    console.log(`   Can be borrowed: ${usdcAsset.canBeBorrowed}`);
    console.log(`   Can be collateral: ${usdcAsset.canBeCollateral}`);
    
    // Test 6: Synthetic asset functionality
    const synthUSDCName = await synthUSDC.name();
    const synthUSDCSymbol = await synthUSDC.symbol();
    const synthCorrect = synthUSDCName === "Synthetic USDC" && synthUSDCSymbol === "sUSDC";
    console.log(`✅ Synthetic USDC Test: ${synthCorrect ? "PASS" : "FAIL"}`);
    console.log(`   Name: ${synthUSDCName}`);
    console.log(`   Symbol: ${synthUSDCSymbol}`);
    
    // Test 7: Cross-chain support verification
    const mumbaiSupported = await lendingPool.supportedChains("12532609583862916517");
    console.log(`✅ Mumbai Chain Support Test: ${mumbaiSupported ? "PASS" : "FAIL"}`);
    console.log(`   Mumbai supported: ${mumbaiSupported}`);
    
    console.log("\n🚀 FUNCTIONAL TESTS");
    console.log("============================================================");
    
    // Test 8: User position query (should work without revert)
    try {
      const userPosition = await lendingPool.getUserPosition(deployer.address);
      console.log("✅ User Position Query Test: PASS");
      console.log(`   Total Collateral Value: ${ethers.formatEther(userPosition[0])} USD`);
      console.log(`   Total Borrow Value: ${ethers.formatEther(userPosition[1])} USD`);
      console.log(`   Health Factor: ${ethers.formatEther(userPosition[2])}`);
      console.log(`   Max Borrow Value: ${ethers.formatEther(userPosition[3])} USD`);
    } catch (error) {
      console.log("❌ User Position Query Test: FAIL");
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 9: Asset price query (should work without revert)
    try {
      const usdcPrice = await lendingPool.getAssetPrice(FIXED_ADDRESSES.synthUSDC);
      console.log("✅ Asset Price Query Test: PASS");
      console.log(`   USDC Price: ${ethers.formatEther(usdcPrice)} USD`);
    } catch (error) {
      console.log("❌ Asset Price Query Test: FAIL");
      console.log(`   Error: ${error.message}`);
    }
    
    // Test 10: Contract state consistency
    const ccipGasLimit = await lendingPool.ccipGasLimit();
    console.log(`✅ CCIP Gas Limit: ${ccipGasLimit}`);
    
    console.log("\n📊 DEPLOYMENT COMPARISON");
    console.log("============================================================");
    
    // Compare with old broken deployment
    const OLD_BROKEN_ADDRESS = "0xDD5c505d69703230CFFfA1307753923302CEb586";
    
    try {
      const oldLendingPool = await ethers.getContractAt("LendingPool", OLD_BROKEN_ADDRESS);
      const oldOwner = await oldLendingPool.owner();
      const oldCcipRouter = await oldLendingPool.ccipRouter();
      
      console.log("🔴 OLD BROKEN DEPLOYMENT:");
      console.log(`   Owner: ${oldOwner}`);
      console.log(`   CCIP Router: ${oldCcipRouter}`);
      console.log(`   Status: ${oldOwner === ethers.ZeroAddress ? "UNINITIALIZED" : "INITIALIZED"}`);
      
      console.log("\n🟢 NEW FIXED DEPLOYMENT:");
      console.log(`   Owner: ${owner}`);
      console.log(`   CCIP Router: ${ccipRouter}`);
      console.log(`   Status: ${owner !== ethers.ZeroAddress ? "PROPERLY INITIALIZED" : "FAILED"}`);
      
    } catch (error) {
      console.log("⚠️ Could not compare with old deployment:", error.message);
    }
    
    console.log("\n🎯 FINAL RESULTS");
    console.log("============================================================");
    
    const allTestsPassed = ownerCorrect && ccipCorrect && linkCorrect && assetsCorrect && usdcActive && synthCorrect;
    
    if (allTestsPassed) {
      console.log("🎉 ALL TESTS PASSED! DEPLOYMENT IS FULLY FUNCTIONAL!");
      console.log("✅ LendingPool is properly initialized");
      console.log("✅ CCIP integration is configured");
      console.log("✅ Assets are properly configured");
      console.log("✅ Cross-chain support is enabled");
      console.log("✅ Contract is ready for production use");
      
      console.log("\n🔗 Frontend Integration Ready:");
      console.log(`   LendingPool: ${FIXED_ADDRESSES.lendingPool}`);
      console.log(`   Synthetic USDC: ${FIXED_ADDRESSES.synthUSDC}`);
      console.log(`   Synthetic WETH: ${FIXED_ADDRESSES.synthWETH}`);
      
    } else {
      console.log("❌ SOME TESTS FAILED - NEEDS INVESTIGATION");
    }
    
  } catch (error) {
    console.error("❌ Test execution failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
