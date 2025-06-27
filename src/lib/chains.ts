import type { Chain } from 'viem'

// Testnet chains for development
export const sepoliaTestnet: Chain = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'SEP',
  },
  rpcUrls: {
    default: {
      http: ['https://ethereum-sepolia.publicnode.com'],
    },
    public: {
      http: ['https://ethereum-sepolia.publicnode.com'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  testnet: true,
}

export const polygonMumbai: Chain = {
  id: 80001,
  name: 'Polygon Mumbai',
  nativeCurrency: {
    decimals: 18,
    name: 'MATIC',
    symbol: 'MATIC',
  },
  rpcUrls: {
    default: {
      http: ['https://polygon-mumbai.gateway.tenderly.co'],
    },
    public: {
      http: ['https://polygon-mumbai.gateway.tenderly.co'],
    },
  },
  blockExplorers: {
    default: { name: 'PolygonScan', url: 'https://mumbai.polygonscan.com' },
  },
  testnet: true,
}

// Supported chains for our protocol
export const supportedChains = [sepoliaTestnet, polygonMumbai] as const

// Chainlink CCIP Configuration
export const CCIP_CONFIG = {
  [sepoliaTestnet.id]: {
    router: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
    linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    chainSelector: '16015286601757825753',
    name: 'Sepolia',
  },
  [polygonMumbai.id]: {
    router: '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1',
    linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    chainSelector: '12532609583862916517', 
    name: 'Mumbai',
  },
} as const

// Chainlink Price Feed Configuration
export const PRICE_FEEDS = {
  [sepoliaTestnet.id]: {
    ETH_USD: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
    USDC_USD: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E',
  },
  [polygonMumbai.id]: {
    MATIC_USD: '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
    USDC_USD: '0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0',
  },
} as const

// Supported assets configuration
export const SUPPORTED_ASSETS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
    addresses: {
      [sepoliaTestnet.id]: '0x...',  // Will be set after deployment
      [polygonMumbai.id]: '0x...',   // Will be set after deployment
    },
  },
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    icon: '🔶',
    addresses: {
      [sepoliaTestnet.id]: '0x...',  // Will be set after deployment
      [polygonMumbai.id]: '0x...',   // Will be set after deployment
    },
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    icon: '🟣',
    addresses: {
      // SOL is native to Solana, synthetic representations on EVM
      [sepoliaTestnet.id]: '0x...',  // Synthetic SOL
      [polygonMumbai.id]: '0x...',   // Synthetic SOL
    },
  },
} as const

// Solana configuration
export const SOLANA_CONFIG = {
  network: 'devnet',
  endpoint: 'https://api.devnet.solana.com',
  programId: 'Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkgAGF4d8CLQN',
} as const

// Solana Devnet Configuration
export const solanaDevnet = {
  id: 'solana-devnet',
  name: 'Solana Devnet',
  network: 'devnet',
  nativeCurrency: {
    decimals: 9,
    name: 'SOL',
    symbol: 'SOL',
  },
  rpcUrls: {
    default: { http: ['https://api.devnet.solana.com'] },
    public: { http: ['https://api.devnet.solana.com'] },
  },
  blockExplorers: {
    default: { name: 'Solana Explorer', url: 'https://explorer.solana.com' },
  },
  testnet: true,
} as const

// Contract addresses for each chain (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  [sepoliaTestnet.id]: {
    lendingPool: '0x1234567890123456789012345678901234567890',
    priceFeed: '0x2345678901234567890123456789012345678901',
    liquidationManager: '0x3456789012345678901234567890123456789012',
    rateLimiter: '0x4567890123456789012345678901234567890123',
    permissions: '0x5678901234567890123456789012345678901234',
    syntheticAsset: '0x6789012345678901234567890123456789012345',
    ccipRouter: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59', // Sepolia CCIP Router
    // Security contracts
    chainlinkSecurity: '0x7890123456789012345678901234567890123456',
    timeLock: '0x8901234567890123456789012345678901234567',
    vrfCoordinator: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625', // Sepolia VRF Coordinator
    automationRegistry: '0x6593c7De001fC8542bB1703532EE1E5aA0D458fD', // Sepolia Automation Registry
  },
  [polygonMumbai.id]: {
    lendingPool: '0x1234567890123456789012345678901234567890',
    priceFeed: '0x2345678901234567890123456789012345678901',
    liquidationManager: '0x3456789012345678901234567890123456789012',
    rateLimiter: '0x4567890123456789012345678901234567890123',
    permissions: '0x5678901234567890123456789012345678901234',
    syntheticAsset: '0x6789012345678901234567890123456789012345',
    ccipRouter: '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1', // Mumbai CCIP Router
    // Security contracts
    chainlinkSecurity: '0x7890123456789012345678901234567890123456',
    timeLock: '0x8901234567890123456789012345678901234567',
    vrfCoordinator: '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed', // Mumbai VRF Coordinator
    automationRegistry: '0x02777053d6764996e594c3E88AF1D58D5363a2e6', // Mumbai Automation Registry
  },
} as const

// Chainlink Security Configuration
export const SECURITY_CONFIG = {
  VRF: {
    [sepoliaTestnet.id]: {
      coordinator: '0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625',
      keyHash: '0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c', // 30 gwei Key Hash
      subscriptionId: 0, // Will be set after VRF subscription creation
      requestConfirmations: 3,
      callbackGasLimit: 2500000,
    },
    [polygonMumbai.id]: {
      coordinator: '0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed',
      keyHash: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f', // 500 gwei Key Hash
      subscriptionId: 0, // Will be set after VRF subscription creation
      requestConfirmations: 3,
      callbackGasLimit: 2500000,
    },
  },
  AUTOMATION: {
    [sepoliaTestnet.id]: {
      registry: '0x6593c7De001fC8542bB1703532EE1E5aA0D458fD',
      registrar: '0xb0E49c5D0d05cbc241d68c05BC5BA1d1B7B72976',
      linkToken: '0x779877A7B0D9E8603169DdbD7836e478b4624789',
      upkeepGasLimit: 5000000,
      checkDataSize: 1000,
    },
    [polygonMumbai.id]: {
      registry: '0x02777053d6764996e594c3E88AF1D58D5363a2e6',
      registrar: '0x57A4a13b35d25EE78e084168aBaC5ad360252467',
      linkToken: '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
      upkeepGasLimit: 5000000,
      checkDataSize: 1000,
    },
  },
  TIMELOCK: {
    minDelay: 24 * 60 * 60, // 24 hours
    criticalDelay: 72 * 60 * 60, // 72 hours
    emergencyDelay: 60 * 60, // 1 hour
  },
  RISK_PARAMETERS: {
    healthFactorThreshold: '1000000000000000000', // 1.0
    criticalHealthFactor: '950000000000000000', // 0.95
    emergencyThreshold: 10, // Max 10 emergency liquidations per hour
    maxLiquidationSize: '100000000000000000000000', // $100k
    securityDelay: 60 * 60, // 1 hour
  },
} as const

export type SupportedChainId = typeof supportedChains[number]['id']
export type AssetSymbol = keyof typeof SUPPORTED_ASSETS 
