// Backend Configuration for OpenChain Mobile
export interface NetworkConfig {
  name: string;
  chainId?: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  contracts: {
    lendingPool?: string;
    priceOracle?: string;
    ccipRouter?: string;
    tokenBridge?: string;
  };
}

export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  network: string;
  decimals: number;
  coingeckoId?: string;
  chainlinkPriceFeed?: string;
  crossChainEnabled: boolean;
}

// Production contract addresses (replace with your deployed addresses)
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    contracts: {
      lendingPool: process.env.EXPO_PUBLIC_ETH_LENDING_POOL || '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30',
      priceOracle: process.env.EXPO_PUBLIC_ETH_USD_FEED || '0x694AA1769357215DE4FAC081bf1f309aDC325306',
      ccipRouter: process.env.EXPO_PUBLIC_CCIP_ROUTER_SEPOLIA || '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
      tokenBridge: process.env.EXPO_PUBLIC_WETH_ADDRESS || '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44',
    },
  },
  polygon: {
    name: 'Polygon Mumbai',
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
    contracts: {
      lendingPool: process.env.EXPO_PUBLIC_POLYGON_LENDING_POOL || '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44',
      priceOracle: process.env.EXPO_PUBLIC_MATIC_USD_FEED || '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada',
      ccipRouter: process.env.EXPO_PUBLIC_CCIP_ROUTER_MUMBAI || '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1',
      tokenBridge: process.env.EXPO_PUBLIC_POLYGON_LENDING_POOL || '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44',
    },
  },
  solana: {
    name: 'Solana Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    contracts: {
      lendingPool: process.env.EXPO_PUBLIC_SOLANA_PROGRAM_ID || '46PEhxKNPS6TNy6SHuMBF6eAXR54onGecnLXvv52uwWJ',
      priceOracle: process.env.EXPO_PUBLIC_SOLANA_PROGRAM_ID || '46PEhxKNPS6TNy6SHuMBF6eAXR54onGecnLXvv52uwWJ',
    },
  },
};

// Token configurations with Chainlink price feeds
export const TOKEN_CONFIGS: TokenConfig[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: 'native',
    network: 'ethereum',
    decimals: 18,
    coingeckoId: 'ethereum',
    chainlinkPriceFeed: '0x694AA1769357215DE4FAC081bf1f309aDC325306', // ETH/USD Sepolia
    crossChainEnabled: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30', // Replace with actual
    network: 'ethereum',
    decimals: 6,
    coingeckoId: 'usd-coin',
    chainlinkPriceFeed: '0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E', // USDC/USD Sepolia
    crossChainEnabled: true,
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    address: 'native',
    network: 'polygon',
    decimals: 18,
    coingeckoId: 'matic-network',
    chainlinkPriceFeed: '0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada', // MATIC/USD Mumbai
    crossChainEnabled: true,
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    address: 'native',
    network: 'solana',
    decimals: 9,
    coingeckoId: 'solana',
    crossChainEnabled: true,
  },
  {
    symbol: 'BONK',
    name: 'Bonk',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    network: 'solana',
    decimals: 5,
    coingeckoId: 'bonk',
    crossChainEnabled: false,
  },
];

// API endpoints
export const API_ENDPOINTS = {
  COINGECKO: 'https://api.coingecko.com/api/v3',
  CHAINLINK_FEEDS: 'https://api.chain.link/user/publicFeeds',
  BACKEND_API: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.2.2:3000/api/mobile',
};

// Utility functions
export const getNetworkConfig = (networkName: string): NetworkConfig | null => {
  return NETWORK_CONFIGS[networkName] || null;
};

export const getTokensByNetwork = (networkName: string): TokenConfig[] => {
  return TOKEN_CONFIGS.filter(token => token.network === networkName);
};

export const getTokenConfig = (symbol: string, network?: string): TokenConfig | null => {
  return TOKEN_CONFIGS.find(token => 
    token.symbol === symbol && (!network || token.network === network)
  ) || null;
};

export const getSupportedNetworks = (): string[] => {
  return Object.keys(NETWORK_CONFIGS);
};
