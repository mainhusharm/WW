// Clean YFinance Service - Single Source of Truth
// Uses ONLY backend server for real-time data with SMC signal generation

interface YFinanceData {
  history: any[];
  provider: string;
}

interface YFinancePrice {
  price: string;
  provider: string;
}

interface SMCSignal {
  pair: string;
  signal_type: 'buy' | 'sell';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  timestamp: string;
  confidence: number;
  structure_type: 'BOS' | 'CHoCH' | 'OrderBlock';
}

class YFinanceWorkingService {
  private static instance: YFinanceWorkingService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly BACKEND_URL = 'http://localhost:5000'; // Single source of truth

  static getInstance(): YFinanceWorkingService {
    if (!YFinanceWorkingService.instance) {
      YFinanceWorkingService.instance = new YFinanceWorkingService();
    }
    return YFinanceWorkingService.instance;
  }

  private formatSymbol(symbol: string): string {
    // Convert forex symbols to proper format for backend
    return symbol.replace('/', '%2F');
  }

  // SINGLE METHOD: Use backend server only (NO fallbacks, NO multiple sources)
  private async fetchFromBackend(symbol: string, timeframe: string): Promise<Response | null> {
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/yfinance/historical/${this.formatSymbol(symbol)}/${timeframe}`);
      
      if (response.ok) {
        return response;
      } else {
        console.error(`❌ Backend fetch failed for ${symbol}: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Backend connection failed for ${symbol}:`, error);
      return null;
    }
  }

  // SINGLE METHOD: Get historical data from backend only
  async fetchHistoricalData(symbol: string, timeframe: string = '1m'): Promise<YFinanceData> {
    const cacheKey = `${symbol}_${timeframe}`;
    const now = Date.now();
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    // SINGLE SOURCE: Backend server only
    const response = await this.fetchFromBackend(symbol, timeframe);
    
    if (response) {
      try {
        const data = await response.json();
        
        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
          const resultData = { history: data.history, provider: 'backend-server' };
          this.cache.set(cacheKey, { data: resultData, timestamp: now });
          return resultData;
        }
      } catch (error) {
        console.error(`❌ Data parsing failed for ${symbol}:`, error);
      }
    }
    
    // Return empty data if backend fails (NO fallbacks)
    return { history: [], provider: 'backend-server' };
  }

  // SINGLE METHOD: Get current price from backend only
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

    // SINGLE SOURCE: Backend server only
    try {
      const response = await fetch(`${this.BACKEND_URL}/api/yfinance/price/${this.formatSymbol(symbol)}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.price && !isNaN(parseFloat(data.price))) {
          const resultData = { price: data.price, provider: 'backend-server' };
          this.cache.set(cacheKey, { data: resultData, timestamp: now });
          return resultData;
        }
      }
    } catch (error) {
      console.error(`❌ Backend price fetch failed for ${symbol}:`, error);
    }
    
    // Return null if backend fails (NO fallbacks)
    return null;
  }

  // SINGLE METHOD: Get bulk data from backend only
  async fetchBulkData(symbols: string[], timeframe: string): Promise<{ [key: string]: any[] }> {
    try {
      // SINGLE SOURCE: Backend server only
      const response = await fetch(`${this.BACKEND_URL}/api/yfinance/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols, timeframe })
      });
      
      if (response.ok) {
        const results = await response.json();
        console.log(`✅ Backend bulk fetch completed: ${Object.keys(results).filter(k => results[k].length > 0).length} successful`);
        return results;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Backend bulk fetch failed:`, error);
      
      // Return empty results for all symbols (NO fallbacks)
      const emptyResults: { [key: string]: any[] } = {};
      symbols.forEach(symbol => {
        emptyResults[symbol] = [];
      });
      return emptyResults;
    }
  }

  // SMC Signal Generation based on the Pine Script logic
  async generateSMCSignals(symbol: string, timeframe: string = '1m'): Promise<SMCSignal[]> {
    try {
      // Get historical data from backend
      const data = await this.fetchHistoricalData(symbol, timeframe);
      
      if (!data.history || data.history.length < 50) {
        console.warn(`⚠️ Insufficient data for SMC analysis on ${symbol}`);
        return [];
      }

      const signals: SMCSignal[] = [];
      const history = data.history;
      
      // Implement SMC logic based on the Pine Script
      for (let i = 20; i < history.length - 1; i++) {
        const current = history[i];
        const previous = history[i - 1];
        const next = history[i + 1];
        
        if (!current || !previous || !next) continue;
        
        const currentClose = parseFloat(current.close);
        const previousClose = parseFloat(previous.close);
        const nextClose = parseFloat(next.close);
        const currentHigh = parseFloat(current.high);
        const currentLow = parseFloat(current.low);
        const previousHigh = parseFloat(previous.high);
        const previousLow = parseFloat(previous.low);
        
        // BOS (Break of Structure) Detection
        if (currentClose > previousHigh && previousClose < previousHigh) {
          // Bullish BOS
          const stopLoss = Math.min(previousLow, currentLow) - (currentHigh - currentLow) * 0.5;
          const risk = currentClose - stopLoss;
          const takeProfit = currentClose + (risk * 2.0); // 2:1 R:R ratio
          
          signals.push({
            pair: symbol,
            signal_type: 'buy',
            entry_price: currentClose,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            timestamp: current.time,
            confidence: 0.8,
            structure_type: 'BOS'
          });
        }
        
        if (currentClose < previousLow && previousClose > previousLow) {
          // Bearish BOS
          const stopLoss = Math.max(previousHigh, currentHigh) + (currentHigh - currentLow) * 0.5;
          const risk = stopLoss - currentClose;
          const takeProfit = currentClose - (risk * 2.0); // 2:1 R:R ratio
          
          signals.push({
            pair: symbol,
            signal_type: 'sell',
            entry_price: currentClose,
            stop_loss: stopLoss,
            take_profit: takeProfit,
            timestamp: current.time,
            confidence: 0.8,
            structure_type: 'BOS'
          });
        }
        
        // CHoCH (Change of Character) Detection
        if (i > 10) {
          const swingHigh = Math.max(...history.slice(i - 10, i).map(h => parseFloat(h.high)));
          const swingLow = Math.min(...history.slice(i - 10, i).map(h => parseFloat(h.low)));
          
          if (currentClose > swingHigh && previousClose < swingHigh) {
            // Bullish CHoCH
            const stopLoss = swingLow - (swingHigh - swingLow) * 0.3;
            const risk = currentClose - stopLoss;
            const takeProfit = currentClose + (risk * 2.0);
            
            signals.push({
              pair: symbol,
              signal_type: 'buy',
              entry_price: currentClose,
              stop_loss: stopLoss,
              take_profit: takeProfit,
              timestamp: current.time,
              confidence: 0.9,
              structure_type: 'CHoCH'
            });
          }
          
          if (currentClose < swingLow && previousClose > swingLow) {
            // Bearish CHoCH
            const stopLoss = swingHigh + (swingHigh - swingLow) * 0.3;
            const risk = stopLoss - currentClose;
            const takeProfit = currentClose - (risk * 2.0);
            
            signals.push({
              pair: symbol,
              signal_type: 'sell',
              entry_price: currentClose,
              stop_loss: stopLoss,
              take_profit: takeProfit,
              timestamp: current.time,
              confidence: 0.9,
              structure_type: 'CHoCH'
            });
          }
        }
      }
      
      // Return only the most recent signals (last 5)
      return signals.slice(-5);
      
    } catch (error) {
      console.error(`❌ SMC signal generation failed for ${symbol}:`, error);
      return [];
    }
  }

  // Clear cache for a specific symbol or all symbols
  clearCache(symbol?: string): void {
    if (symbol) {
      // Clear cache for specific symbol
      for (const key of this.cache.keys()) {
        if (key.startsWith(symbol)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default YFinanceWorkingService;
