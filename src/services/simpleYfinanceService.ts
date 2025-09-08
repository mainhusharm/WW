// Simple YFinance Service - Direct approach without CORS issues
// Uses public APIs or simple methods to get forex data

export interface SimplePriceData {
  symbol: string;
  price: number;
  timestamp: string;
  provider: string;
}

export interface SimpleBulkData {
  success: boolean;
  count: number;
  data: SimplePriceData[];
  timestamp: string;
}

class SimpleYfinanceService {
  private static instance: SimpleYfinanceService;
  private priceCache: Map<string, { data: SimplePriceData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): SimpleYfinanceService {
    if (!SimpleYfinanceService.instance) {
      SimpleYfinanceService.instance = new SimpleYfinanceService();
    }
    return SimpleYfinanceService.instance;
  }

  /**
   * Get realistic forex prices with slight variations (simulated real-time)
   */
  async fetchPrice(symbol: string): Promise<SimplePriceData | null> {
    const cacheKey = `${symbol}_simple`;
    const now = Date.now();
    
    // Check cache first
    if (this.priceCache.has(cacheKey)) {
      const cached = this.priceCache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // Try to fetch real data from Yahoo Finance API
    try {
      const yfSymbol = symbol.replace('/', '') + '=X';
      // Use CORS proxy to avoid CORS errors
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://yfinance-service-kyce.onrender.com/api/price/${yfSymbol}`)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Handle CORS proxy response format
      const actualData = data.contents ? JSON.parse(data.contents) : data;
      
      if (actualData && actualData.price) {
        const priceData: SimplePriceData = {
          symbol: symbol,
          price: parseFloat(actualData.price),
          timestamp: new Date().toISOString(),
          provider: 'yfinance-service'
        };
        
        this.priceCache.set(cacheKey, { data: priceData, timestamp: now });
        console.log(`✅ Real Yahoo Finance price fetched for ${symbol}: ${priceData.price}`);
        return priceData;
      }
    } catch (error) {
      console.warn(`Failed to fetch real price for ${symbol}:`, error);
    }

    // NO FALLBACK DATA - return null if Yahoo Finance fails
    console.log(`❌ No real price data available for ${symbol}`);
    return null;
  }

  /**
   * Fetch bulk prices
   */
  async fetchBulkPrices(symbols: string[]): Promise<SimpleBulkData> {
    console.log(`📡 Fetching simple bulk prices for ${symbols.length} symbols...`);
    
    const results: SimplePriceData[] = [];
    let successCount = 0;

    for (const symbol of symbols) {
      try {
        const priceData = await this.fetchPrice(symbol);
        if (priceData) {
          results.push(priceData);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to fetch simple price for ${symbol}:`, error);
      }
    }

    console.log(`📊 Simple bulk fetch completed: ${successCount}/${symbols.length} successful`);
    return {
      success: successCount > 0,
      count: successCount,
      data: results,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get historical data for analysis (simulated)
   */
  async fetchHistoricalData(symbol: string, timeframe: string = '1m', range: string = '5d'): Promise<any> {
    const basePrice = await this.fetchPrice(symbol);
    if (!basePrice) return null;

    // Generate 25 bars of historical data (minimum required for analysis)
    const bars = [];
    const now = new Date();
    const basePriceValue = basePrice.price;
    
    for (let i = 24; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * 60000)); // 1 minute intervals
      
      // Add realistic price variations
      const variation = (Math.random() - 0.5) * 0.001; // ±0.05%
      const price = basePriceValue * (1 + variation);
      
      bars.push({
        time: time.toISOString(),
        open: parseFloat(price.toFixed(5)),
        high: parseFloat((price * 1.0005).toFixed(5)),
        low: parseFloat((price * 0.9995).toFixed(5)),
        close: parseFloat(price.toFixed(5)),
        volume: Math.floor(Math.random() * 1000) + 100
      });
    }

    return {
      symbol: symbol,
      history: bars,
      provider: 'simple-yfinance-historical'
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.priceCache.clear();
  }
}

export default SimpleYfinanceService.getInstance();
