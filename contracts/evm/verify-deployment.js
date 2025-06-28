const { ethers } = require('hardhat');
async function checkContractBytecode() {
  const addresses = {
    lendingPool: '0x473AC85625b7f9F18eA21d2250ea19Ded1093a99',
    synthUSDC: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30',
    priceFeed: '0x2E38242Ff1FDa1783fdA682c24A3f409b5c8163f'
  };
  
  console.log('🔍 CONTRACT BYTECODE VERIFICATION');
  console.log('=====================================');
  
  for (const [name, address] of Object.entries(addresses)) {
    try {
      const code = await ethers.provider.getCode(address);
      const isDeployed = code !== '0x';
      const size = code.length;
      console.log(`✅ ${name}: ${isDeployed ? 'DEPLOYED' : 'NOT DEPLOYED'} (${size} bytes)`);
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
    }
  }
}
checkContractBytecode().catch(console.error);
