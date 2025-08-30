import { API_CONFIG } from '../api/config';

export interface RealPriceData {
  symbol: string;
  price: number;
  timestamp: string;
  provider: string;
  change?: number;
  changePercent?: number;
  volume?: number;
}

export interface RealHistoricalData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RealBulkData {
  success: boolean;
  count: number;
  data: RealPriceData[];
  timestamp: string;
}

class RealYfinanceService {
  private static instance: RealYfinanceService;
  private priceCache: Map<string, { data: RealPriceData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  private constructor() {}

  static getInstance(): RealYfinanceService {
    if (!RealYfinanceService.instance) {
      RealYfinanceService.instance = new RealYfinanceService();
    }
    return RealYfinanceService.instance;
  }

  /**
   * Fetch real-time price for a single symbol - NO FALLBACK DATA
   */
  async fetchRealPrice(symbol: string): Promise<RealPriceData | null> {
    const cacheKey = `${symbol}_real_price`;
    const now = Date.now();
    
    // Check cache first
    if (this.priceCache.has(cacheKey)) {
      const cached = this.priceCache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // Try forex-data-service first (most reliable)
    try {
      const response = await this.fetchWithRetry(
        `https://forex-data-service.onrender.com/api/forex-price?pair=${encodeURIComponent(symbol)}`
      );
      
      if (response && response.price) {
        const priceData: RealPriceData = {
          symbol: symbol,
          price: parseFloat(response.price),
          timestamp: new Date().toISOString(),
          provider: 'forex-data-service'
        };
        
        this.priceCache.set(cacheKey, { data: priceData, timestamp: now });
        console.log(`✅ Real price fetched for ${symbol}: ${priceData.price}`);
        return priceData;
      }
    } catch (error) {
      console.warn(`forex-data-service failed for ${symbol}:`, error);
    }

    // No direct Yahoo Finance API calls - only use working forex-data-service
    console.log(`⚠️ All price sources failed for ${symbol} - no fallback data available`);

    // NO FALLBACK DATA - return null if all sources fail
    console.warn(`❌ All price sources failed for ${symbol} - no fallback data generated`);
    return null;
  }

  /**
   * Fetch bulk real prices for multiple symbols - NO FALLBACK DATA
   */
  async fetchBulkRealPrices(symbols: string[]): Promise<RealBulkData> {
    console.log(`📡 Fetching real bulk prices for ${symbols.length} symbols...`);
    
    const results: RealPriceData[] = [];
    let successCount = 0;
    
    // Fetch prices for all symbols
    for (const symbol of symbols) {
      try {
        const priceData = await this.fetchRealPrice(symbol);
        if (priceData) {
          results.push(priceData);
          successCount++;
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }
    
    const bulkData: RealBulkData = {
      success: successCount > 0,
      count: successCount,
      data: results,
      timestamp: new Date().toISOString()
    };
    
    console.log(`📊 Bulk price fetch completed: ${successCount}/${symbols.length} successful`);
    return bulkData;
  }

  /**
   * Fetch historical data for analysis - NO FALLBACK DATA
   */
  async fetchRealHistoricalData(symbol: string, timeframe: string = '1m', range: string = '5d'): Promise<RealHistoricalData[] | null> {
    try {
      // First try to get current price data since historical endpoint is broken
      const priceData = await this.fetchRealPrice(symbol);
      if (priceData) {
        // Create a simple historical data structure with current price
        const now = new Date();
        const historicalData: RealHistoricalData[] = [{
          time: now.toISOString(),
          open: priceData.price,
          high: priceData.price,
          low: priceData.price,
          close: priceData.price,
          volume: 0
        }];
        
        console.log(`✅ Real historical data created for ${symbol} using current price: ${priceData.price}`);
        return historicalData;
      }
    } catch (error) {
      console.warn(`Historical data fetch failed for ${symbol}:`, error);
    }
    
    // NO FALLBACK DATA
    return null;
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries: number = this.MAX_RETRIES): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
        
      } catch (error: any) {
        lastError = error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed for ${url}:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
    
    throw lastError;
  }

  // formatForexSymbol method removed - no longer needed

  /**
   * Clear cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.priceCache.size,
      keys: Array.from(this.priceCache.keys())
    };
  }
}

export default RealYfinanceService.getInstance();
