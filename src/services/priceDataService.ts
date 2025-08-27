import tradingBotAPI from '../api/tradingBot';

export interface RealTimePriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  timestamp: Date;
  provider: 'yfinance' | 'binance';
  market: 'forex' | 'crypto';
}

export interface OHLCData {
  pair: string;
  timeframe: string;
  timestamp: Date;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  volume: number;
  market: 'forex' | 'crypto';
}

class PriceDataService {
  private yfinanceBaseUrl = 'http://localhost:3001/api/yfinance';
  private binanceBaseUrl = 'http://localhost:5010/api';
  private isMonitoring = false;
  private priceInterval: NodeJS.Timeout | null = null;
  private lastPrices = new Map<string, RealTimePriceData>();

  // Start real-time price monitoring
  async startPriceMonitoring(symbols: string[], market: 'forex' | 'crypto'): Promise<boolean> {
    try {
      if (this.isMonitoring) {
        console.log(`⚠️ Price monitoring already active for ${market}`);
        return true;
      }

      console.log(`🚀 Starting real-time price monitoring for ${market} market with ${symbols.length} symbols`);
      
      this.isMonitoring = true;
      this.startPriceFetching(symbols, market);
      
      return true;
    } catch (error) {
      console.error(`❌ Error starting price monitoring for ${market}:`, error);
      return false;
    }
  }

  // Stop price monitoring
  async stopPriceMonitoring(): Promise<boolean> {
    try {
      if (this.priceInterval) {
        clearInterval(this.priceInterval);
        this.priceInterval = null;
      }
      
      this.isMonitoring = false;
      console.log('⏹️ Price monitoring stopped');
      return true;
    } catch (error) {
      console.error('❌ Error stopping price monitoring:', error);
      return false;
    }
  }

  // Start the price fetching loop
  private startPriceFetching(symbols: string[], market: 'forex' | 'crypto') {
    this.priceInterval = setInterval(async () => {
      try {
        if (!this.isMonitoring) return;

        let prices: RealTimePriceData[] = [];
        
        if (market === 'forex') {
          prices = await this.fetchForexPrices(symbols);
        } else if (market === 'crypto') {
          prices = await this.fetchCryptoPrices(symbols);
        }

        if (prices.length > 0) {
          // Store all prices in database
          await this.storePriceData(prices, market);
          
          // Store OHLC data for charting
          await this.storeOHLCData(prices, market);
          
          // Update last known prices
          prices.forEach(price => {
            this.lastPrices.set(price.symbol, price);
          });
          
          console.log(`📊 Updated ${prices.length} prices for ${market} market`);
        }
      } catch (error) {
        console.error(`❌ Error in price fetching loop for ${market}:`, error);
      }
    }, 5000); // Update every 5 seconds
  }

  // Fetch real-time forex prices from yfinance
  private async fetchForexPrices(symbols: string[]): Promise<RealTimePriceData[]> {
    const prices: RealTimePriceData[] = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`📊 Fetching real-time price for ${symbol} from yfinance...`);
        const response = await fetch(`${this.yfinanceBaseUrl}/price/${symbol}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.price && !isNaN(data.price) && data.price > 0) {
            const priceData: RealTimePriceData = {
              symbol: symbol.replace('=X', ''),
              price: parseFloat(data.price),
              change: data.change || 0,
              changePercent: data.changePercent || 0,
              volume: data.volume || 0,
              high: data.high || data.price,
              low: data.low || data.price,
              open: data.open || data.price,
              close: data.price,
              timestamp: new Date(data.timestamp || Date.now()),
              provider: 'yfinance',
              market: 'forex'
            };
            
            prices.push(priceData);
            console.log(`✅ Successfully fetched ${symbol}: ${priceData.price}`);
          } else {
            console.warn(`⚠️ Invalid price data for ${symbol}:`, data);
          }
        } else {
          console.error(`❌ HTTP error fetching ${symbol}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching price for ${symbol}:`, error);
      }
      
      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📈 Total forex prices fetched: ${prices.length}/${symbols.length}`);
    return prices;
  }

  // Fetch real-time crypto prices from Binance
  private async fetchCryptoPrices(symbols: string[]): Promise<RealTimePriceData[]> {
    const prices: RealTimePriceData[] = [];
    
    for (const symbol of symbols) {
      try {
        console.log(`🪙 Fetching real-time price for ${symbol} from Binance...`);
        const response = await fetch(`${this.binanceBaseUrl}/ticker/price?symbol=${symbol}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.price && !isNaN(data.price) && data.price > 0) {
            const priceData: RealTimePriceData = {
              symbol: symbol.replace('USDT', ''),
              price: parseFloat(data.price),
              change: 0,
              changePercent: 0,
              volume: 0,
              high: 0,
              low: 0,
              open: 0,
              close: data.price,
              timestamp: new Date(),
              provider: 'binance',
              market: 'crypto'
            };
            
            prices.push(priceData);
            console.log(`✅ Successfully fetched ${symbol}: ${priceData.price}`);
          } else {
            console.warn(`⚠️ Invalid price data for ${symbol}:`, data);
          }
        } else {
          console.error(`❌ HTTP error fetching ${symbol}: ${response.status}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching price for ${symbol}:`, error);
      }
      
      // Add delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🪙 Total crypto prices fetched: ${prices.length}/${symbols.length}`);
    return prices;
  }

  // Store price data in bot_data table
  private async storePriceData(prices: RealTimePriceData[], market: 'forex' | 'crypto') {
    try {
      console.log(`💾 Storing ${prices.length} price records to database for ${market} market...`);
      
      for (const price of prices) {
        try {
          await tradingBotAPI.bot.storeBotData({
            bot_type: market,
            pair: price.symbol,
            price: price.price,
            signal_type: 'neutral', // Price data, not a signal
            signal_strength: 0,
            is_recommended: false,
            volume: price.volume,
            high: price.high,
            low: price.low,
            open_price: price.open,
            close_price: price.close,
            timeframe: '1m',
            timestamp: price.timestamp.toISOString()
          });
          
          console.log(`✅ Stored price data for ${price.symbol}: ${price.price}`);
        } catch (error) {
          console.error(`❌ Error storing price data for ${price.symbol}:`, error);
        }
      }
      
      console.log(`✅ Successfully stored ${prices.length} price records to database`);
    } catch (error) {
      console.error('❌ Error storing price data:', error);
    }
  }

  // Store OHLC data for charting
  private async storeOHLCData(prices: RealTimePriceData[], market: 'forex' | 'crypto') {
    try {
      console.log(`📊 Storing OHLC data for ${prices.length} symbols...`);
      
      for (const price of prices) {
        try {
          const ohlcData: OHLCData = {
            pair: price.symbol,
            timeframe: '1m',
            timestamp: price.timestamp,
            open_price: price.open,
            high_price: price.high,
            low_price: price.low,
            close_price: price.close,
            volume: price.volume,
            market: market
          };
          
          // Store in ohlc_data table if the endpoint exists
          await tradingBotAPI.price.storePriceData(ohlcData);
          
          console.log(`✅ Stored OHLC data for ${price.symbol}`);
        } catch (error) {
          // If the endpoint doesn't exist, just log it (not critical)
          console.log(`ℹ️ OHLC storage endpoint not available for ${price.symbol}`);
        }
      }
    } catch (error) {
      console.error('❌ Error storing OHLC data:', error);
    }
  }

  // Get latest prices for specific symbols
  async getLatestPrices(symbols: string[], market: 'forex' | 'crypto'): Promise<RealTimePriceData[]> {
    const prices: RealTimePriceData[] = [];
    
    for (const symbol of symbols) {
      const lastPrice = this.lastPrices.get(symbol);
      if (lastPrice) {
        prices.push(lastPrice);
      }
    }
    
    return prices;
  }

  // Get all latest prices
  async getAllLatestPrices(): Promise<RealTimePriceData[]> {
    return Array.from(this.lastPrices.values());
  }

  // Get price history for a specific symbol
  async getPriceHistory(symbol: string, timeframe: string, market: 'forex' | 'crypto'): Promise<any[]> {
    try {
      if (market === 'forex') {
        const response = await fetch(`${this.yfinanceBaseUrl}/historical/${symbol}/${timeframe}`);
        if (response.ok) {
          const data = await response.json();
          return data.history || [];
        }
      } else if (market === 'crypto') {
        const response = await fetch(`${this.binanceBaseUrl}/klines?symbol=${symbol}&interval=${timeframe}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          return data.map((candle: any) => ({
            time: new Date(candle[0]).toISOString(),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5])
          }));
        }
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error fetching price history for ${symbol}:`, error);
      return [];
    }
  }

  // Bulk fetch prices for multiple symbols
  async bulkFetchPrices(symbols: string[], timeframe: string, market: 'forex' | 'crypto'): Promise<any> {
    try {
      if (market === 'forex') {
        const response = await fetch(`${this.yfinanceBaseUrl}/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbols, timeframe })
        });
        
        if (response.ok) {
          return await response.json();
        }
      }
      
      return { results: {}, errors: {}, summary: { total: 0, successful: 0, failed: 0 } };
    } catch (error) {
      console.error('❌ Error in bulk fetch:', error);
      return { results: {}, errors: {}, summary: { total: 0, successful: 0, failed: 0 } };
    }
  }

  // Get monitoring status
  getMonitoringStatus(): boolean {
    return this.isMonitoring;
  }

  // Get monitored symbols count
  getMonitoredSymbolsCount(): number {
    return this.lastPrices.size;
  }
}

export const priceDataService = new PriceDataService();
export default priceDataService;
