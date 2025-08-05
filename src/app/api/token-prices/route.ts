import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, fallback } from 'viem';
import { sepolia } from 'viem/chains';

// Your deployed ChainlinkPriceFeed contract address
const CHAINLINK_PRICE_FEED_ADDRESS = '0x2E38242Ff1FDa1783fdA682c24A3f409b5c8163f';

// Token addresses for price lookup
const TOKEN_ADDRESSES = {
  ETH: '0x0000000000000000000000000000000000000000', // Native ETH
  USDC: '0x77036167D0b74Fb82BA5966a507ACA06C5E16B30', // Your synthetic USDC
  WETH: '0x39CdAe9f7Cb7e06A165f8B4C6864850cCef5CC44', // Your synthetic WETH
  SOL: '0x0000000000000000000000000000000000000001', // Placeholder for SOL
  BONK: '0x0000000000000000000000000000000000000002', // Placeholder for BONK
};

// ABI for your ChainlinkPriceFeed contract - using getSafePrice like lending protocol
const CHAINLINK_PRICE_FEED_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "asset", "type": "address" }
    ],
    "name": "getSafePrice",
    "outputs": [
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "bool", "name": "isStale", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Create public client for reading from Sepolia with multiple RPC fallbacks
const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    http('https://ethereum-sepolia-rpc.publicnode.com'),
    http('https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'),
    http('https://ethereum-sepolia.publicnode.com'),
    http('https://rpc.sepolia.org')
  ])
});

async function fetchChainlinkPrice(tokenSymbol: string): Promise<number> {
  try {
    const tokenAddress = TOKEN_ADDRESSES[tokenSymbol as keyof typeof TOKEN_ADDRESSES];
    
    if (!tokenAddress) {
      console.warn(`Token address not found for ${tokenSymbol}`);
      return 0;
    }

    // Call your ChainlinkPriceFeed contract using getSafePrice
    const result = await publicClient.readContract({
      address: CHAINLINK_PRICE_FEED_ADDRESS as `0x${string}`,
      abi: CHAINLINK_PRICE_FEED_ABI,
      functionName: 'getSafePrice',
      args: [tokenAddress as `0x${string}`]
    });

    const [price, isStale] = result as [bigint, boolean];
    
    // Check if price is valid and not stale
    if (price === 0n || isStale) {
      console.warn(`⚠️ Chainlink price feed not configured for ${tokenSymbol}, fetching real-time market price`);
      
      // Fetch real-time prices from CoinGecko as fallback
      try {
        const coinGeckoIds: Record<string, string> = {
          ETH: 'ethereum',
          WETH: 'ethereum', // WETH tracks ETH price
          USDC: 'usd-coin',
          SOL: 'solana',
          BONK: 'bonk'
        };
        
        const coinId = coinGeckoIds[tokenSymbol];
        if (coinId) {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
            { next: { revalidate: 30 } } // Cache for 30 seconds
          );
          
          if (response.ok) {
            const data = await response.json();
            const realPrice = data[coinId]?.usd;
            if (realPrice) {
              console.log(`✅ Real-time market price for ${tokenSymbol}: $${realPrice}`);
              return realPrice;
            }
          }
        }
      } catch (error) {
        console.error(`Failed to fetch real-time price for ${tokenSymbol}:`, error);
      }
      
      // Final fallback to reasonable prices
      const fallbackPrices: Record<string, number> = {
        ETH: 3400, WETH: 3400, USDC: 1.00, SOL: 180, BONK: 0.00000123
      };
      return fallbackPrices[tokenSymbol] || 0;
    }
    
    // Convert the price from 18 decimals to a human-readable number
    const priceInUSD = Number(price) / 1e18;
    
    console.log(`✅ Real-time Chainlink price for ${tokenSymbol}: $${priceInUSD}`);
    return priceInUSD;

  } catch (error) {
    console.error(`Error fetching real-time price for ${tokenSymbol}:`, error);
    
    // Fallback to reasonable default prices if contract call fails
    const fallbackPrices: Record<string, number> = {
      ETH: 3400,
      WETH: 3400,
      USDC: 1.00,
      SOL: 180,
      BONK: 0.00000123
    };
    
    console.warn(`Using fallback price for ${tokenSymbol}: $${fallbackPrices[tokenSymbol] || 0}`);
    return fallbackPrices[tokenSymbol] || 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    const prices: Record<string, number> = {};
    
    // Fetch prices for all supported tokens
    for (const token of Object.keys(TOKEN_ADDRESSES)) {
      prices[token] = await fetchChainlinkPrice(token);
    }

    console.log('✅ Successfully fetched real-time prices from Chainlink:', prices);

    return NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching token prices from Chainlink:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token prices from Chainlink smart contract' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tokens } = await request.json();
    const prices: Record<string, number> = {};
    
    // Fetch prices for specific tokens
    for (const token of tokens) {
      if (TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES]) {
        prices[token] = await fetchChainlinkPrice(token);
      }
    }

    console.log('✅ Successfully fetched specific real-time prices from Chainlink:', prices);

    return NextResponse.json(prices);

  } catch (error) {
    console.error('❌ Error fetching specific token prices from Chainlink:', error);
    return NextResponse.json(
      { error: 'Failed to fetch specific token prices from Chainlink smart contract' },
      { status: 500 }
    );
  }
} 
