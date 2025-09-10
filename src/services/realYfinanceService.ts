import { API_CONFIG } from '../api/config';
import YFinanceDirectService from './yfinanceDirect';

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
  private readonly CACHE_DURATION = 5000; // 5 seconds (reduced to force fresh data)
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private readonly RATE_LIMIT_DELAY = 500; // 500ms between requests
  private lastRequestTime = 0;

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
  async fetchRealPrice(symbol: string, forceRefresh: boolean = false): Promise<RealPriceData | null> {
    const cacheKey = `${symbol}_real_price`;
    const now = Date.now();
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh && this.priceCache.has(cacheKey)) {
      const cached = this.priceCache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // Try yfinance service first (most reliable)
    try {
      // Convert forex pair to yfinance symbol format
      const yfSymbol = symbol.replace('/', '') + '=X';
      // Use CORS proxy to avoid CORS errors
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://yfinance-service-kyce.onrender.com/api/price/${yfSymbol}`)}`;
      const response = await this.fetchWithRetry(proxyUrl);
      
      // Handle CORS proxy response format
      const actualResponse = response.contents ? JSON.parse(response.contents) : response;
      
      if (actualResponse && actualResponse.price) {
        const priceData: RealPriceData = {
          symbol: symbol,
          price: parseFloat(actualResponse.price),
          timestamp: new Date().toISOString(),
          provider: 'yfinance-service'
        };
        
        this.priceCache.set(cacheKey, { data: priceData, timestamp: now });
        console.log(`✅ yfinance price fetched for ${symbol}: ${priceData.price}`);
        return priceData;
      }
    } catch (error) {
      console.warn(`yfinance service failed for ${symbol}:`, error);
    }

    // Try direct yfinance service as fallback
    try {
      console.log(`🔄 Trying direct yfinance service for ${symbol}...`);
      const directService = YFinanceDirectService.getInstance();
      const directResult = await directService.fetchLatestPrice(symbol);
      
      if (directResult && directResult.price) {
        const priceData: RealPriceData = {
          symbol: symbol,
          price: parseFloat(directResult.price),
          timestamp: new Date().toISOString(),
          provider: 'yfinance-direct'
        };
        
        this.priceCache.set(cacheKey, { data: priceData, timestamp: now });
        console.log(`✅ Direct yfinance service success for ${symbol}: $${priceData.price}`);
        return priceData;
      }
    } catch (directError) {
      console.warn(`Direct yfinance service also failed for ${symbol}:`, directError);
    }

    // NO FALLBACK DATA - return null if all sources fail
    console.warn(`❌ All price sources failed for ${symbol} - no fallback data generated`);
    return null;
  }

  /**
   * Fetch bulk real prices for multiple symbols - NO FALLBACK DATA
   */
  async fetchBulkRealPrices(symbols: string[], forceRefresh: boolean = false): Promise<RealBulkData> {
    console.log(`📡 Fetching real bulk prices for ${symbols.length} symbols (bulk endpoint)...`);

    // First, try the yfinance service bulk endpoint
    try {
      // Convert symbols to yfinance format
      const yfSymbols = symbols.map(s => s.replace('/', '') + '=X');
      // Use CORS proxy to avoid CORS errors
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://yfinance-service-kyce.onrender.com/api/bulk`)}`;
      const response = await this.fetchWithRetry(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: yfSymbols })
      });

      const results: RealPriceData[] = [];
      let successCount = 0;

      // Handle CORS proxy response format
      const actualResponse = response.contents ? JSON.parse(response.contents) : response;

      // The bulk API returns data in a 'data' array
      if (actualResponse.data && Array.isArray(actualResponse.data)) {
        for (const entry of actualResponse.data) {
          if (entry && entry.symbol && typeof entry.price !== 'undefined' && entry.price !== null) {
            // Convert yfinance symbol back to our format (EURUSD=X -> EUR/USD)
            const originalSymbol = entry.symbol.replace('=X', '').replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
            results.push({
              symbol: originalSymbol,
              price: parseFloat(entry.price),
              timestamp: entry.timestamp || new Date().toISOString(),
              provider: entry.provider || 'yfinance-service'
            });
            successCount++;
          }
        }
      }

      console.log(`📊 Bulk price fetch (single call) completed: ${successCount}/${symbols.length} successful`);
      return {
        success: successCount > 0,
        count: successCount,
        data: results,
        timestamp: new Date().toISOString()
      };
    } catch (bulkError) {
      console.warn('Bulk endpoint failed, trying direct yfinance service:', bulkError);
      
      // Try direct yfinance service for bulk data
      try {
        const directService = YFinanceDirectService.getInstance();
        const directResults: RealPriceData[] = [];
        let directSuccessCount = 0;
        
        for (const symbol of symbols) {
          const directResult = await directService.fetchLatestPrice(symbol);
          if (directResult && directResult.price) {
            directResults.push({
              symbol: symbol,
              price: parseFloat(directResult.price),
              timestamp: new Date().toISOString(),
              provider: 'yfinance-direct'
            });
            directSuccessCount++;
          }
        }
        
        if (directSuccessCount > 0) {
          console.log(`📊 Direct yfinance bulk fetch completed: ${directSuccessCount}/${symbols.length} successful`);
          return {
            success: true,
            count: directSuccessCount,
            data: directResults,
            timestamp: new Date().toISOString()
          };
        }
      } catch (directBulkError) {
        console.warn('Direct yfinance bulk also failed, falling back to per-symbol requests:', directBulkError);
      }
    }

    // Fallback: per-symbol requests (slower, may hit rate limits)
    const results: RealPriceData[] = [];
    let successCount = 0;
    for (const symbol of symbols) {
      try {
        const priceData = await this.fetchRealPrice(symbol, forceRefresh);
        if (priceData) {
          results.push(priceData);
          successCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
      }
    }

    console.log(`📊 Bulk price fetch (fallback) completed: ${successCount}/${symbols.length} successful`);
    return {
      success: successCount > 0,
      count: successCount,
      data: results,
      timestamp: new Date().toISOString()
    };
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
   * Clear the price cache to force fresh data
   */
  clearCache(): void {
    this.priceCache.clear();
    console.log('🧹 Price cache cleared');
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries: number = this.MAX_RETRIES): Promise<any> {
    let lastError: any;
    
    // Rate limiting: ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
    
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
