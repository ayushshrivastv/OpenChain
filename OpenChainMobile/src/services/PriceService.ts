import { API_ENDPOINTS, TokenConfig, TOKEN_CONFIGS } from './BackendConfig';

export interface PriceData {
  [symbol: string]: {
    price: number;
    change24h?: number;
    lastUpdated: number;
    source: 'chainlink' | 'coingecko' | 'cache';
  };
}

export interface ChainlinkPriceData {
  answer: string;
  decimals: number;
  description: string;
  roundId: string;
  updatedAt: string;
}

class PriceService {
  private static instance: PriceService;
  private priceCache: Map<string, PriceData[string]> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  // Get cached price if available and not expired
  private getCachedPrice(symbol: string): PriceData[string] | null {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
      return cached;
    }
    return null;
  }

  // Cache price data
  private setCachedPrice(symbol: string, priceData: PriceData[string]): void {
    this.priceCache.set(symbol, priceData);
  }

  // Fetch price from Chainlink price feed (for supported tokens)
  async fetchChainlinkPrice(token: TokenConfig): Promise<number | null> {
    if (!token.chainlinkPriceFeed) {
      return null;
    }

    try {
      // This would typically be done via smart contract call
      // For mobile, we'll use a backend API that reads from Chainlink
      const response = await fetch(`${API_ENDPOINTS.BACKEND_API}/chainlink/price/${token.symbol}`);
      
      if (!response.ok) {
        throw new Error(`Chainlink API error: ${response.status}`);
      }

      const data: ChainlinkPriceData = await response.json();
      const price = parseFloat(data.answer) / Math.pow(10, data.decimals);
      
      return price;
    } catch (error) {
      console.warn(`Failed to fetch Chainlink price for ${token.symbol}:`, error);
      return null;
    }
  }

  // Fetch prices from CoinGecko API
  async fetchCoinGeckoPrice(token: TokenConfig): Promise<number | null> {
    if (!token.coingeckoId) {
      return null;
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.COINGECKO}/simple/price?ids=${token.coingeckoId}&vs_currencies=usd&include_24hr_change=true`
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      const tokenData = data[token.coingeckoId];
      
      if (tokenData && tokenData.usd) {
        return tokenData.usd;
      }

      return null;
    } catch (error) {
      console.warn(`Failed to fetch CoinGecko price for ${token.symbol}:`, error);
      return null;
    }
  }

  // Get price for a single token with fallback strategy
  async getTokenPrice(symbol: string): Promise<PriceData[string] | null> {
    // Check cache first
    const cached = this.getCachedPrice(symbol);
    if (cached) {
      return cached;
    }

    const token = TOKEN_CONFIGS.find(t => t.symbol === symbol);
    if (!token) {
      console.warn(`Token configuration not found for ${symbol}`);
      return null;
    }

    let priceData: PriceData[string] | null = null;

    // Try Chainlink first (more reliable for DeFi)
    try {
      const chainlinkPrice = await this.fetchChainlinkPrice(token);
      if (chainlinkPrice !== null) {
        priceData = {
          price: chainlinkPrice,
          lastUpdated: Date.now(),
          source: 'chainlink',
        };
      }
    } catch (error) {
      console.warn(`Chainlink price fetch failed for ${symbol}:`, error);
    }

    // Fallback to CoinGecko
    if (!priceData) {
      try {
        const coingeckoPrice = await this.fetchCoinGeckoPrice(token);
        if (coingeckoPrice !== null) {
          priceData = {
            price: coingeckoPrice,
            lastUpdated: Date.now(),
            source: 'coingecko',
          };
        }
      } catch (error) {
        console.warn(`CoinGecko price fetch failed for ${symbol}:`, error);
      }
    }

    // Cache the result if we got one
    if (priceData) {
      this.setCachedPrice(symbol, priceData);
    }

    return priceData;
  }

  // Get prices for multiple tokens
  async getTokenPrices(symbols: string[]): Promise<PriceData> {
    const pricePromises = symbols.map(symbol => 
      this.getTokenPrice(symbol).then(price => ({ symbol, price }))
    );

    const results = await Promise.allSettled(pricePromises);
    const prices: PriceData = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.price) {
        prices[result.value.symbol] = result.value.price;
      } else {
        // Fallback price for failed fetches
        const symbol = symbols[index];
        prices[symbol] = {
          price: this.getFallbackPrice(symbol),
          lastUpdated: Date.now(),
          source: 'cache',
        };
      }
    });

    return prices;
  }

  // Fallback prices for when APIs fail
  private getFallbackPrice(symbol: string): number {
    const fallbackPrices: Record<string, number> = {
      ETH: 2500,
      USDC: 1.0,
      MATIC: 0.8,
      SOL: 100,
      BTC: 45000,
    };

    return fallbackPrices[symbol] || 1.0;
  }

  // Get all supported tokens with current prices
  async getAllTokenPrices(): Promise<PriceData> {
    const symbols = TOKEN_CONFIGS.map(token => token.symbol);
    return this.getTokenPrices(symbols);
  }

  // Calculate USD value for token amount
  calculateUSDValue(amount: number, symbol: string, prices: PriceData): number {
    const priceData = prices[symbol];
    if (!priceData) {
      return 0;
    }
    return amount * priceData.price;
  }

  // Format price for display
  formatPrice(price: number): string {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else if (price < 100) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
  }

  // Format percentage change
  formatPriceChange(change: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }
}

export const priceService = PriceService.getInstance();
