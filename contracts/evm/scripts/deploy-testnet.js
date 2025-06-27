const { ethers } = require('hardhat')
require('dotenv').config()

async function main() {
  console.log('🚀 CROSSCHAIN.IO TESTNET DEPLOYMENT STARTED')
  console.log('==========================================')
  
  const [deployer] = await ethers.getSigners()
  const network = await ethers.provider.getNetwork()
  
  console.log(`📡 Network: ${network.name} (${network.chainId})`)
  console.log(`👤 Deployer: ${deployer.address}`)
  console.log(`💰 Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`)
  
  // Network-specific configuration
  const config = getNetworkConfig(network.chainId)
  if (!config) {
    throw new Error(`Unsupported network: ${network.chainId}`)
  }
  
  console.log('\n🔧 DEPLOYMENT CONFIGURATION:')
  console.log(`CCIP Router: ${config.ccipRouter}`)
  console.log(`LINK Token: ${config.linkToken}`)
  console.log(`Price Feed: ${config.priceFeed}`)
  
  // Deploy contracts in correct order
  const contracts = {}
  
  console.log('\n📦 DEPLOYING CONTRACTS...')
  
  // 1. Deploy Permissions contract
  console.log('\n1️⃣ Deploying Permissions...')
  const Permissions = await ethers.getContractFactory('Permissions')
  contracts.permissions = await Permissions.deploy()
  await contracts.permissions.waitForDeployment()
  console.log(`✅ Permissions deployed: ${await contracts.permissions.getAddress()}`)
  
  // 2. Deploy TimeLock contract
  console.log('\n2️⃣ Deploying TimeLock...')
  const TimeLock = await ethers.getContractFactory('TimeLock')
  contracts.timeLock = await TimeLock.deploy(
    deployer.address, // admin
    86400 // 24 hours delay
  )
  await contracts.timeLock.waitForDeployment()
  console.log(`✅ TimeLock deployed: ${await contracts.timeLock.getAddress()}`)
  
  // 3. Deploy ChainlinkPriceFeed
  console.log('\n3️⃣ Deploying ChainlinkPriceFeed...')
  const ChainlinkPriceFeed = await ethers.getContractFactory('ChainlinkPriceFeed')
  contracts.chainlinkPriceFeed = await ChainlinkPriceFeed.deploy()
  await contracts.chainlinkPriceFeed.waitForDeployment()
  console.log(`✅ ChainlinkPriceFeed deployed: ${await contracts.chainlinkPriceFeed.getAddress()}`)
  
  // 4. Deploy RateLimiter
  console.log('\n4️⃣ Deploying RateLimiter...')
  const RateLimiter = await ethers.getContractFactory('RateLimiter')
  contracts.rateLimiter = await RateLimiter.deploy(
    await contracts.permissions.getAddress()
  )
  await contracts.rateLimiter.waitForDeployment()
  console.log(`✅ RateLimiter deployed: ${await contracts.rateLimiter.getAddress()}`)
  
  // 5. Deploy ChainlinkSecurity
  console.log('\n5️⃣ Deploying ChainlinkSecurity...')
  const ChainlinkSecurity = await ethers.getContractFactory('ChainlinkSecurity')
  contracts.chainlinkSecurity = await ChainlinkSecurity.deploy(
    config.vrfCoordinator,
    config.linkToken,
    config.keyHash,
    config.subscriptionId || 1
  )
  await contracts.chainlinkSecurity.waitForDeployment()
  console.log(`✅ ChainlinkSecurity deployed: ${await contracts.chainlinkSecurity.getAddress()}`)
  
  // 6. Deploy LiquidationManager
  console.log('\n6️⃣ Deploying LiquidationManager...')
  const LiquidationManager = await ethers.getContractFactory('LiquidationManager')
  contracts.liquidationManager = await LiquidationManager.deploy(
    await contracts.chainlinkPriceFeed.getAddress(),
    await contracts.chainlinkSecurity.getAddress()
  )
  await contracts.liquidationManager.waitForDeployment()
  console.log(`✅ LiquidationManager deployed: ${await contracts.liquidationManager.getAddress()}`)
  
  // 7. Deploy SyntheticAsset (USDC)
  console.log('\n7️⃣ Deploying SyntheticAsset (USDC)...')
  const SyntheticAsset = await ethers.getContractFactory('SyntheticAsset')
  contracts.syntheticUSDC = await SyntheticAsset.deploy(
    'CrossChain USDC',
    'xUSDC',
    6, // decimals
    ethers.parseUnits('1000000', 6) // 1M initial supply
  )
  await contracts.syntheticUSDC.waitForDeployment()
  console.log(`✅ SyntheticAsset (USDC) deployed: ${await contracts.syntheticUSDC.getAddress()}`)
  
  // 8. Deploy main LendingPool
  console.log('\n8️⃣ Deploying LendingPool (Main Contract)...')
  const LendingPool = await ethers.getContractFactory('LendingPool')
  contracts.lendingPool = await LendingPool.deploy(
    config.ccipRouter,
    config.linkToken,
    await contracts.chainlinkPriceFeed.getAddress(),
    await contracts.liquidationManager.getAddress(),
    await contracts.rateLimiter.getAddress(),
    await contracts.permissions.getAddress()
  )
  await contracts.lendingPool.waitForDeployment()
  console.log(`✅ LendingPool deployed: ${await contracts.lendingPool.getAddress()}`)
  
  console.log('\n🔧 CONFIGURING CONTRACTS...')
  
  // Configure price feeds
  console.log('Setting up price feeds...')
  await contracts.chainlinkPriceFeed.addPriceFeed(
    await contracts.syntheticUSDC.getAddress(),
    config.usdcPriceFeed
  )
  
  // Configure permissions
  console.log('Setting up permissions...')
  await contracts.permissions.grantRole(
    await contracts.permissions.ADMIN_ROLE(),
    await contracts.lendingPool.getAddress()
  )
  
  // Configure rate limiter
  console.log('Setting up rate limits...')
  await contracts.rateLimiter.setRateLimit(
    await contracts.syntheticUSDC.getAddress(),
    ethers.parseUnits('10000', 6), // 10k USDC per hour
    3600 // 1 hour
  )
  
  console.log('\n✅ DEPLOYMENT COMPLETED SUCCESSFULLY!')
  console.log('=====================================')
  
  // Save deployment addresses
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      lendingPool: await contracts.lendingPool.getAddress(),
      chainlinkPriceFeed: await contracts.chainlinkPriceFeed.getAddress(),
      liquidationManager: await contracts.liquidationManager.getAddress(),
      rateLimiter: await contracts.rateLimiter.getAddress(),
      permissions: await contracts.permissions.getAddress(),
      chainlinkSecurity: await contracts.chainlinkSecurity.getAddress(),
      timeLock: await contracts.timeLock.getAddress(),
      syntheticAssets: {
        USDC: await contracts.syntheticUSDC.getAddress()
      }
    }
  }
  
  // Write to deployments directory
  const fs = require('fs')
  const deploymentPath = `./deployments/${network.name}-${network.chainId}.json`
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2))
  
  console.log(`\n📄 Deployment info saved to: ${deploymentPath}`)
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Update frontend contract addresses')
  console.log('2. Verify contracts on Etherscan')
  console.log('3. Setup Chainlink VRF subscription')
  console.log('4. Fund contracts with LINK tokens')
  console.log('5. Test all functionality')
  
  console.log('\n📋 CONTRACT ADDRESSES:')
  console.log('=======================')
  Object.entries(deploymentInfo.contracts).forEach(([name, address]) => {
    if (typeof address === 'string') {
      console.log(`${name}: ${address}`)
    } else {
      console.log(`${name}:`)
      Object.entries(address).forEach(([subName, subAddress]) => {
        console.log(`  ${subName}: ${subAddress}`)
      })
    }
  })
  
  return deploymentInfo
}

function getNetworkConfig(chainId) {
  const configs = {
    // Sepolia
    11155111: {
      ccipRouter: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
      linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      vrfCoordinator: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
      keyHash: '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c',
      usdcPriceFeed: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E',
      subscriptionId: process.env.VRF_SUBSCRIPTION_ID || 1
    },
    // Mumbai
    80001: {
      ccipRouter: '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1',
      linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
      vrfCoordinator: '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed',
      keyHash: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f',
      usdcPriceFeed: '0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0',
      subscriptionId: process.env.VRF_SUBSCRIPTION_ID || 1
    }
  }
  
  return configs[chainId]
}

main()
  .then((deploymentInfo) => {
    console.log('\n🎉 DEPLOYMENT SUCCESSFUL!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ DEPLOYMENT FAILED:', error)
    process.exit(1)
  }) 
