export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  network: string;
  contractType: string;
  crossChainEnabled: boolean;
  decimals?: number;
  coingeckoId?: string;
}

export interface NetworkConfig {
  name: string;
  chainId?: number;
  rpcUrl?: string;
  tokens: TokenConfig[];
}

// Dynamic token configuration - can be loaded from API or environment variables
export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  ethereum: {
    name: 'Ethereum',
    chainId: 11155111, // Sepolia
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL,
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        address: 'native',
        network: 'Sepolia Testnet',
        contractType: 'Native Asset',
        crossChainEnabled: true,
        decimals: 18,
        coingeckoId: 'ethereum'
      },
      {
        symbol: 'USDC',
        name: 'USDC',
        address: process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30',
        network: 'Sepolia Testnet',
        contractType: 'SyntheticAsset.sol',
        crossChainEnabled: true,
        decimals: 6,
        coingeckoId: 'usd-coin'
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ethereum',
        address: process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44',
        network: 'Sepolia Testnet',
        contractType: 'SyntheticAsset.sol',
        crossChainEnabled: true,
        decimals: 18,
        coingeckoId: 'ethereum'
      }
    ]
  },
  solana: {
    name: 'Solana',
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    tokens: [
      {
        symbol: 'SOL',
        name: 'Solana',
        address: process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID || '46PEhxKNPS6TNy6SHuMBF6eAXR54onGecnLXvv52uwWJ',
        network: 'Solana Devnet',
        contractType: 'Rust Program',
        crossChainEnabled: true,
        decimals: 9,
        coingeckoId: 'solana'
      },
      {
        symbol: 'USDC',
        name: 'USDC',
        address: process.env.NEXT_PUBLIC_SOLANA_USDC_MINT || 'SPL-USDC',
        network: 'Solana Devnet',
        contractType: 'SPL Token',
        crossChainEnabled: true,
        decimals: 6,
        coingeckoId: 'usd-coin'
      }
    ]
  }
};

// Fallback prices for when API calls fail
export const FALLBACK_PRICES: Record<string, number> = {
  ETH: 3200,
  WETH: 3200,
  USDC: 1.00,
  SOL: 180
};

// API endpoints
export const API_ENDPOINTS = {
  coingecko: 'https://api.coingecko.com/api/v3/simple/price',
  tokenPrices: '/api/token-prices'
};

// Get tokens for a specific network
export function getNetworkTokens(networkName: string): TokenConfig[] {
  const network = NETWORK_CONFIGS[networkName.toLowerCase()];
  return network?.tokens || [];
}

// Get all supported networks
export function getSupportedNetworks(): string[] {
  return Object.keys(NETWORK_CONFIGS).map(key => 
    NETWORK_CONFIGS[key].name
  );
}

// Get network configuration
export function getNetworkConfig(networkName: string): NetworkConfig | null {
  return NETWORK_CONFIGS[networkName.toLowerCase()] || null;
}
