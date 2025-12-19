// YFinance Proxy Service - Handles CORS issues
// Makes requests to yfinance service through proper channels

export interface YFinancePriceData {
  symbol: string;
  price: number;
  timestamp: string;
  provider: string;
  change?: number;
  changePercent?: number;
  volume?: number;
}

export interface YFinanceBulkData {
  success: boolean;
  count: number;
  data: YFinancePriceData[];
  timestamp: string;
}

class YFinanceProxyService {
  private static instance: YFinanceProxyService;
  private priceCache: Map<string, { data: YFinancePriceData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

  private constructor() {}

  static getInstance(): YFinanceProxyService {
    if (!YFinanceProxyService.instance) {
      YFinanceProxyService.instance = new YFinanceProxyService();
    }
    return YFinanceProxyService.instance;
  }

  /**
   * Fetch forex price using CORS proxy
   */
  async fetchPrice(symbol: string): Promise<YFinancePriceData | null> {
    const cacheKey = `${symbol}_proxy`;
    const now = Date.now();
    
    // Check cache first
    if (this.priceCache.has(cacheKey)) {
      const cached = this.priceCache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      // Use yfinance service directly
      const yfSymbol = symbol.replace('/', '') + '=X';
      // Use CORS proxy to avoid CORS errors
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://yfinance-service-kyce.onrender.com/api/price/${yfSymbol}`)}`;
      
      console.log(`📡 Fetching ${symbol} via yfinance service (with CORS proxy)`);
      
      const response = await this.fetchWithRetry(proxyUrl);
      
      // Handle CORS proxy response format
      const actualResponse = response.contents ? JSON.parse(response.contents) : response;
      
      if (actualResponse && actualResponse.price) {
        const priceData: YFinancePriceData = {
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

    console.log(`❌ All methods failed for ${symbol}`);
    return null;
  }

  /**
   * Fetch bulk prices using CORS proxy
   */
  async fetchBulkPrices(symbols: string[]): Promise<YFinanceBulkData> {
    console.log(`📡 Fetching bulk prices for ${symbols.length} symbols via proxy...`);
    
    const results: YFinancePriceData[] = [];
    let successCount = 0;

    // Process symbols individually to avoid CORS issues with bulk endpoint
    for (const symbol of symbols) {
      try {
        const priceData = await this.fetchPrice(symbol);
        if (priceData) {
          results.push(priceData);
          successCount++;
        }
        // Small delay to avoid overwhelming the proxy
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to fetch proxy price for ${symbol}:`, error);
      }
    }

    console.log(`📊 Proxy bulk fetch completed: ${successCount}/${symbols.length} successful`);
    return {
      success: successCount > 0,
      count: successCount,
      data: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries: number = this.MAX_RETRIES): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://frontend-zwwl.onrender.com',
            ...(options.headers || {})
          }
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

  /**
   * Clear cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }
}

export default YFinanceProxyService.getInstance();
