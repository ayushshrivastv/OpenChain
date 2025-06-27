const { ethers } = require('hardhat')
require('dotenv').config()

async function main() {
  const [deployer] = await ethers.getSigners()
  const network = await ethers.provider.getNetwork()
  
  console.log('💰 WALLET BALANCE CHECK')
  console.log('=======================')
  console.log(`📡 Network: ${network.name} (${network.chainId})`)
  console.log(`👤 Address: ${deployer.address}`)
  
  const balance = await ethers.provider.getBalance(deployer.address)
  const balanceEth = ethers.formatEther(balance)
  
  console.log(`💰 Balance: ${balanceEth} ETH`)
  
  // Check if balance is sufficient for deployment
  const minBalance = ethers.parseEther('0.1') // 0.1 ETH minimum
  
  if (balance >= minBalance) {
    console.log('✅ Sufficient balance for deployment')
  } else {
    console.log('❌ Insufficient balance!')
    console.log(`⚠️  Need at least 0.1 ETH for deployment`)
    console.log(`📍 Get testnet tokens from:`)
    
    if (network.chainId === 11155111n) {
      console.log('   • Sepolia ETH: https://sepoliafaucet.com/')
      console.log('   • LINK tokens: https://faucets.chain.link/')
    } else if (network.chainId === 80001n) {
      console.log('   • Mumbai MATIC: https://faucet.polygon.technology/')
      console.log('   • LINK tokens: https://faucets.chain.link/')
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 
