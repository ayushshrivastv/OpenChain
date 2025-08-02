import { FALLBACK_PRICES, API_ENDPOINTS, TokenConfig } from './tokenConfig';

export interface PriceData {
  [symbol: string]: number;
}

export class PriceService {
  private static instance: PriceService;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  // Get cached price if available and not expired
  private getCachedPrice(symbol: string): number | null {
    const cached = this.priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price;
    }
    return null;
  }

  // Cache price data
  private setCachedPrice(symbol: string, price: number): void {
    this.priceCache.set(symbol, {
      price,
      timestamp: Date.now()
    });
  }

  // Fetch prices from CoinGecko API
  async fetchPricesFromCoinGecko(tokens: TokenConfig[]): Promise<PriceData> {
    const prices: PriceData = {};
    
    // Get unique coingecko IDs
    const coingeckoIds = Array.from(new Set(
      tokens
        .map(token => token.coingeckoId)
        .filter(Boolean)
    ));

    if (coingeckoIds.length === 0) {
      return this.getFallbackPrices(tokens);
    }

    try {
      const response = await fetch(
        `${API_ENDPOINTS.coingecko}?ids=${coingeckoIds.join(',')}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map coingecko data back to token symbols
      tokens.forEach(token => {
        if (token.coingeckoId && data[token.coingeckoId]?.usd) {
          prices[token.symbol] = data[token.coingeckoId].usd;
          this.setCachedPrice(token.symbol, prices[token.symbol]);
        }
      });

      return prices;
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return this.getFallbackPrices(tokens);
    }
  }

  // Get fallback prices for tokens
  private getFallbackPrices(tokens: TokenConfig[]): PriceData {
    const prices: PriceData = {};
    tokens.forEach(token => {
      prices[token.symbol] = FALLBACK_PRICES[token.symbol] || 0;
    });
    return prices;
  }

  // Get prices for specific tokens with caching
  async getTokenPrices(tokens: TokenConfig[]): Promise<PriceData> {
    const prices: PriceData = {};
    const tokensToFetch: TokenConfig[] = [];

    // Check cache first
    tokens.forEach(token => {
      const cachedPrice = this.getCachedPrice(token.symbol);
      if (cachedPrice !== null) {
        prices[token.symbol] = cachedPrice;
      } else {
        tokensToFetch.push(token);
      }
    });

    // Fetch uncached prices
    if (tokensToFetch.length > 0) {
      const fetchedPrices = await this.fetchPricesFromCoinGecko(tokensToFetch);
      Object.assign(prices, fetchedPrices);
    }

    return prices;
  }

  // Get single token price
  async getTokenPrice(token: TokenConfig): Promise<number> {
    const cachedPrice = this.getCachedPrice(token.symbol);
    if (cachedPrice !== null) {
      return cachedPrice;
    }

    const prices = await this.fetchPricesFromCoinGecko([token]);
    return prices[token.symbol] || FALLBACK_PRICES[token.symbol] || 0;
  }

  // Clear cache
  clearCache(): void {
    this.priceCache.clear();
  }
}

// Export singleton instance
export const priceService = PriceService.getInstance();
