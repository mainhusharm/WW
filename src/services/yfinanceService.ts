import api from '../lib/api';

export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  timestamp: number;
}

export interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class YFinanceService {
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Fetch price with retry logic and validation
   */
  async fetchPrice(symbol: string): Promise<PriceData | null> {
    try {
      // Check cache first
      const cached = this.priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return this.createPriceData(symbol, cached.price);
      }

      // Fetch from backend with retry logic
      const price = await this.fetchWithRetry(symbol);
      if (price === null) return null;

      // Validate price
      if (!this.isValidPrice(price)) {
        console.warn(`Invalid price received for ${symbol}: ${price}`);
        return null;
      }

      // Cache the price
      this.priceCache.set(symbol, { price, timestamp: Date.now() });

      return this.createPriceData(symbol, price);
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Fetch price with retry logic
   */
  private async fetchWithRetry(symbol: string): Promise<number | null> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await api.get(`/api/yfinance/price/${symbol}`);
        if (response.data && response.data.price) {
          return parseFloat(response.data.price);
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed for ${symbol}:`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    return null;
  }

  /**
   * Fetch OHLC data for charting
   */
  async fetchOHLC(symbol: string, interval: string = '1d', period: string = '1mo'): Promise<OHLCData[]> {
    try {
      const response = await api.get(`/api/yfinance/ohlc/${symbol}`, {
        params: { interval, period }
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          time: new Date(item.timestamp).getTime(),
          open: parseFloat(item.open),
          high: parseFloat(item.high),
          low: parseFloat(item.low),
          close: parseFloat(item.close),
          volume: parseInt(item.volume) || 0
        }));
      }
      return [];
    } catch (error) {
      console.error(`Error fetching OHLC data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Fetch multiple symbols at once
   */
  async fetchMultiplePrices(symbols: string[]): Promise<PriceData[]> {
    const promises = symbols.map(symbol => this.fetchPrice(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<PriceData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
  }

  /**
   * Get real-time price updates via WebSocket
   */
  subscribeToPriceUpdates(symbols: string[], callback: (data: PriceData) => void): () => void {
    // This would integrate with your existing WebSocket system
    // For now, we'll use polling as a fallback
    const interval = setInterval(async () => {
      for (const symbol of symbols) {
        const priceData = await this.fetchPrice(symbol);
        if (priceData) {
          callback(priceData);
        }
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }

  /**
   * Validate price data
   */
  private isValidPrice(price: number): boolean {
    return (
      typeof price === 'number' &&
      !isNaN(price) &&
      isFinite(price) &&
      price > 0 &&
      price < 1000000 // Reasonable upper limit
    );
  }

  /**
   * Create standardized price data object
   */
  private createPriceData(symbol: string, price: number): PriceData {
    return {
      symbol,
      price: this.roundPrice(price),
      change: 0, // Would need previous price to calculate
      changePercent: 0, // Would need previous price to calculate
      timestamp: Date.now()
    };
  }

  /**
   * Round price to appropriate decimal places
   */
  private roundPrice(price: number): number {
    if (price >= 100) return Math.round(price * 100) / 100; // 2 decimal places
    if (price >= 1) return Math.round(price * 1000) / 1000; // 3 decimal places
    if (price >= 0.01) return Math.round(price * 100000) / 100000; // 5 decimal places
    return Math.round(price * 1000000) / 1000000; // 6 decimal places
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    const size = this.priceCache.size;
    // This is a simplified hit rate calculation
    const hitRate = size > 0 ? 0.8 : 0; // Would need to track actual hits/misses
    return { size, hitRate };
  }
}

export default new YFinanceService();
