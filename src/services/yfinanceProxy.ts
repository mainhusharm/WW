// YFinance Data Fetching Service with Multiple Fallback Methods
// This service handles CORS issues and provides reliable data fetching

interface YFinanceData {
  history: any[];
  provider: string;
}

interface YFinancePrice {
  price: string;
  provider: string;
}

class YFinanceProxyService {
  private static instance: YFinanceProxyService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  static getInstance(): YFinanceProxyService {
    if (!YFinanceProxyService.instance) {
      YFinanceProxyService.instance = new YFinanceProxyService();
    }
    return YFinanceProxyService.instance;
  }

  private formatSymbol(symbol: string): string {
    const symbolMap: { [key: string]: string } = {
      'EUR/USD': 'EURUSD=X',
      'GBP/USD': 'GBPUSD=X',
      'USD/JPY': 'USDJPY=X',
      'USD/CHF': 'USDCHF=X',
      'AUD/USD': 'AUDUSD=X',
      'USD/CAD': 'USDCAD=X',
      'NZD/USD': 'NZDUSD=X',
      'EUR/JPY': 'EURJPY=X',
      'GBP/JPY': 'GBPJPY=X',
      'EUR/GBP': 'EURGBP=X',
      'EUR/AUD': 'EURAUD=X',
      'GBP/AUD': 'GBPAUD=X',
      'AUD/CAD': 'AUDCAD=X',
      'CAD/JPY': 'CADJPY=X',
      'CHF/JPY': 'CHFJPY=X',
      'AUD/CHF': 'AUDCHF=X',
      'CAD/CHF': 'CADCHF=X',
      'EUR/CHF': 'EURCHF=X',
      'GBP/CHF': 'GBPCHF=X',
      'NZD/CAD': 'NZDCAD=X',
      'NZD/JPY': 'NZDJPY=X',
      'AUD/NZD': 'AUDNZD=X',
      'XAU/USD': 'GC=F',
      'XAG/USD': 'SI=F',
      'USOIL': 'CL=F'
    };
    
    return symbolMap[symbol] || symbol;
  }

  private async fetchWithProxy(url: string, proxy: string): Promise<Response> {
    if (proxy.includes('allorigins.win')) {
      return fetch(proxy + encodeURIComponent(url));
    } else if (proxy.includes('corsproxy.io')) {
      return fetch(proxy + url);
    } else if (proxy.includes('thingproxy.freeboard.io')) {
      return fetch(proxy + url);
    } else {
      // cors-anywhere
      return fetch(proxy + url, {
        headers: {
          'Origin': window.location.origin,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
    }
  }

  async fetchHistoricalData(symbol: string, timeframe: string): Promise<YFinanceData | null> {
    const cacheKey = `${symbol}_${timeframe}_history`;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    const formattedSymbol = this.formatSymbol(symbol);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${timeframe}&range=7d`;
    
    // Multiple proxy options for reliability
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors-anywhere.herokuapp.com/'
    ];

    for (const proxy of proxies) {
      try {
        const response = await this.fetchWithProxy(yahooUrl, proxy);
        
        if (!response.ok) {
          console.warn(`Proxy ${proxy} failed with status ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];
          
          if (timestamps && quotes && timestamps.length > 0) {
            const history = timestamps.map((timestamp: number, index: number) => ({
              time: new Date(timestamp * 1000).toISOString(),
              open: quotes.open[index] || 0,
              high: quotes.high[index] || 0,
              low: quotes.low[index] || 0,
              close: quotes.close[index] || 0,
              volume: quotes.volume[index] || 0
            }));

            const resultData = { history, provider: 'yfinance' };
            
            // Cache the result
            this.cache.set(cacheKey, { data: resultData, timestamp: now });
            
            return resultData;
          }
        }
      } catch (error) {
        console.warn(`Proxy ${proxy} failed:`, error);
        continue;
      }
    }

    return null; // All proxies failed
  }

  async fetchLatestPrice(symbol: string): Promise<YFinancePrice | null> {
    const cacheKey = `${symbol}_latest_price`;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    const formattedSymbol = this.formatSymbol(symbol);
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1m&range=1d`;
    
    // Multiple proxy options for reliability
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?',
      'https://thingproxy.freeboard.io/fetch/',
      'https://cors-anywhere.herokuapp.com/'
    ];

    for (const proxy of proxies) {
      try {
        const response = await this.fetchWithProxy(yahooUrl, proxy);
        
        if (!response.ok) {
          console.warn(`Proxy ${proxy} failed with status ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
          const result = data.chart.result[0];
          const quotes = result.indicators.quote[0];
          
          if (quotes && quotes.close && quotes.close.length > 0) {
            const latestPrice = quotes.close[quotes.close.length - 1];
            if (latestPrice && !isNaN(latestPrice)) {
              const resultData = { price: latestPrice.toString(), provider: 'yfinance' };
              
              // Cache the result
              this.cache.set(cacheKey, { data: resultData, timestamp: now });
              
              return resultData;
            }
          }
        }
      } catch (error) {
        console.warn(`Proxy ${proxy} failed:`, error);
        continue;
      }
    }

    return null; // All proxies failed
  }

  async fetchBulkData(symbols: string[], timeframe: string): Promise<{ [key: string]: any[] }> {
    const results: { [key: string]: any[] } = {};
    
    console.log(`Fetching bulk data for ${symbols.length} symbols...`);
    
    for (const symbol of symbols) {
      try {
        const data = await this.fetchHistoricalData(symbol, timeframe);
        if (data && data.history) {
          results[symbol] = data.history;
          console.log(`✅ Successfully fetched ${symbol}`);
        } else {
          console.warn(`⚠️ No data for ${symbol}`);
          results[symbol] = [];
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to fetch ${symbol}:`, error);
        results[symbol] = [];
      }
    }
    
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default YFinanceProxyService.getInstance();
