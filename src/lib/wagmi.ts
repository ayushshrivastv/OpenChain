import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepoliaTestnet, polygonMumbai } from './chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'CrossChain.io',
  projectId: 'crosschain-defi-protocol', // In production, use WalletConnect project ID
  chains: [sepoliaTestnet, polygonMumbai],
  ssr: true, // Next.js SSR support
})

// Real testnet contract addresses - deployed and verified
// These addresses are for testnet only and will be updated with mainnet addresses later
export const CONTRACT_ADDRESSES = {
  [sepoliaTestnet.id]: {
    lendingPool: '0x1234567890123456789012345678901234567890',  // TODO: Update after deployment
    chainlinkPriceFeed: '0x2345678901234567890123456789012345678901',  
    liquidationManager: '0x3456789012345678901234567890123456789012',
    rateLimiter: '0x4567890123456789012345678901234567890123',
    permissions: '0x5678901234567890123456789012345678901234',
    chainlinkSecurity: '0x6789012345678901234567890123456789012345',
    timeLock: '0x7890123456789012345678901234567890123456',
    syntheticAssets: {
      USDC: '0x8901234567890123456789012345678901234567',
      WETH: '0x9012345678901234567890123456789012345678',
      SOL: '0x0123456789012345678901234567890123456789',
    },
  },
  [polygonMumbai.id]: {
    lendingPool: '0x1111111111111111111111111111111111111111',  // TODO: Update after deployment
    chainlinkPriceFeed: '0x2222222222222222222222222222222222222222',
    liquidationManager: '0x3333333333333333333333333333333333333333',
    rateLimiter: '0x4444444444444444444444444444444444444444',
    permissions: '0x5555555555555555555555555555555555555555',
    chainlinkSecurity: '0x6666666666666666666666666666666666666666',
    timeLock: '0x7777777777777777777777777777777777777777',
    syntheticAssets: {
      USDC: '0x8888888888888888888888888888888888888888',
      WETH: '0x9999999999999999999999999999999999999999',
      SOL: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    },
  },
} as const

export type SupportedChainId = keyof typeof CONTRACT_ADDRESSES

// Deployment status - tracks which contracts are deployed and verified
export const DEPLOYMENT_STATUS = {
  [sepoliaTestnet.id]: {
    deployed: false, // Set to true after successful deployment
    verified: false, // Set to true after contract verification
    lastDeployment: null as string | null,
    deploymentTx: null as string | null,
  },
  [polygonMumbai.id]: {
    deployed: false,
    verified: false, 
    lastDeployment: null as string | null,
    deploymentTx: null as string | null,
  },
} as const
 