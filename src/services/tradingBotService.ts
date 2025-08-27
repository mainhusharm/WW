import tradingBotAPI from '../api/tradingBot';

export interface TradingSignal {
  id: string;
  symbol: string;
  signalType: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  confirmations: string[];
  timestamp: Date;
  analysis: string;
  sessionQuality: string;
  timeframe: string;
  status: 'active' | 'target_hit' | 'sl_hit';
  direction: 'bullish' | 'bearish' | 'neutral';
  market: 'forex' | 'crypto';
}

export interface BotConfig {
  id: string;
  name: string;
  type: 'forex' | 'crypto' | 'hybrid';
  isActive: boolean;
  symbols: string[];
  timeframes: string[];
  riskReward: number;
  maxPositions: number;
  autoTrade: boolean;
  stopLoss: number;
  takeProfit: number;
  strategy: string;
  lastModified: Date;
}

export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: Date;
  provider: string;
}

export interface BotStatus {
  id: number;
  bot_type: string;
  is_active: boolean;
  last_started: string;
  last_stopped: string;
  status_updated_at: string;
  updated_by: string;
}

class TradingBotService {
  private yfinanceBaseUrl = 'http://localhost:3001/api/yfinance';
  private binanceBaseUrl = 'http://localhost:5010/api';
  private isRunning = false;
  private priceInterval: NodeJS.Timeout | null = null;
  private analysisInterval: NodeJS.Timeout | null = null;

  // Start the trading bot
  async startBot(botType: 'forex' | 'crypto', config: BotConfig): Promise<boolean> {
    try {
      const response = await tradingBotAPI.bot.startBot(botType, config);
      
      if (response.data.success) {
        this.isRunning = true;
        this.startPriceMonitoring(config.symbols, botType);
        this.startAnalysis(config, botType);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error starting bot:', error);
      return false;
    }
  }

  // Stop the trading bot
  async stopBot(botType: 'forex' | 'crypto'): Promise<boolean> {
    try {
      const response = await tradingBotAPI.bot.stopBot(botType);
      
      if (response.data.success) {
        this.isRunning = false;
        this.stopPriceMonitoring();
        this.stopAnalysis();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error stopping bot:', error);
      return false;
    }
  }

  // Get bot status
  async getBotStatus(botType: 'forex' | 'crypto'): Promise<BotStatus | null> {
    try {
      const response = await tradingBotAPI.bot.getBotStatus(botType);
      return response.data[botType] || null;
    } catch (error) {
      console.error('Error getting bot status:', error);
      return null;
    }
  }

  // Fetch real-time prices from yfinance (forex)
  async fetchForexPrices(symbols: string[]): Promise<PriceData[]> {
    try {
      const prices: PriceData[] = [];
      
      for (const symbol of symbols) {
        try {
          console.log(`📊 Fetching real-time price for ${symbol} from yfinance...`);
          const response = await fetch(`${this.yfinanceBaseUrl}/price/${symbol}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Validate the response data
            if (data.price && !isNaN(data.price) && data.price > 0) {
              const priceData: PriceData = {
                symbol: symbol.replace('=X', ''),
                price: parseFloat(data.price),
                change: data.change || 0,
                changePercent: data.changePercent || 0,
                volume: data.volume || 0,
                high: data.high || data.price,
                low: data.low || data.price,
                open: data.open || data.price,
                timestamp: new Date(data.timestamp || Date.now()),
                provider: 'yfinance'
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
        
        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`📈 Total forex prices fetched: ${prices.length}/${symbols.length}`);
      return prices;
    } catch (error) {
      console.error('❌ Error fetching forex prices:', error);
      return [];
    }
  }

  // Fetch real-time prices from Binance (crypto)
  async fetchCryptoPrices(symbols: string[]): Promise<PriceData[]> {
    try {
      const prices: PriceData[] = [];
      
      for (const symbol of symbols) {
        try {
          console.log(`🪙 Fetching real-time price for ${symbol} from Binance...`);
          const response = await fetch(`${this.binanceBaseUrl}/ticker/price?symbol=${symbol}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.price && !isNaN(data.price) && data.price > 0) {
              const priceData: PriceData = {
                symbol: symbol.replace('USDT', ''),
                price: parseFloat(data.price),
                change: 0, // Will be calculated from historical data if available
                changePercent: 0,
                volume: 0,
                high: 0,
                low: 0,
                open: 0,
                timestamp: new Date(),
                provider: 'binance'
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
        
        // Add small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log(`🪙 Total crypto prices fetched: ${prices.length}/${symbols.length}`);
      return prices;
    } catch (error) {
      console.error('❌ Error fetching crypto prices:', error);
      return [];
    }
  }

  // Start price monitoring with enhanced database storage
  private startPriceMonitoring(symbols: string[], botType: 'forex' | 'crypto') {
    console.log(`🚀 Starting price monitoring for ${botType} bot with ${symbols.length} symbols`);
    
    this.priceInterval = setInterval(async () => {
      try {
        if (!this.isRunning) {
          console.log(`⏸️ Bot is not running, skipping price monitoring`);
          return;
        }

        let prices: PriceData[] = [];
        
        if (botType === 'forex') {
          prices = await this.fetchForexPrices(symbols);
        } else if (botType === 'crypto') {
          prices = await this.fetchCryptoPrices(symbols);
        }

        // Store ALL prices in database (not just when signals are generated)
        if (prices.length > 0) {
          console.log(`💾 Storing ${prices.length} price records to database...`);
          await this.storePriceData(prices, botType);
          
          // Also store OHLC data for charting
          await this.storeOHLCData(prices, botType);
        } else {
          console.warn(`⚠️ No prices fetched for ${botType} bot`);
        }
      } catch (error) {
        console.error('❌ Error in price monitoring:', error);
      }
    }, 5000); // Update every 5 seconds
  }

  // Stop price monitoring
  private stopPriceMonitoring() {
    if (this.priceInterval) {
      clearInterval(this.priceInterval);
      this.priceInterval = null;
    }
  }

  // Start analysis
  private startAnalysis(config: BotConfig, botType: 'forex' | 'crypto') {
    this.analysisInterval = setInterval(async () => {
      try {
        if (!this.isRunning) return;

        // Perform SMC analysis for each symbol and timeframe
        for (const symbol of config.symbols) {
          for (const timeframe of config.timeframes) {
            const signal = await this.analyzeSymbol(symbol, timeframe, botType);
            if (signal) {
              await this.storeSignal(signal);
            }
          }
        }
      } catch (error) {
        console.error('Error in analysis:', error);
      }
    }, 30000); // Analyze every 30 seconds
  }

  // Stop analysis
  private stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
  }

  // Analyze symbol using SMC concepts
  private async analyzeSymbol(symbol: string, timeframe: string, botType: 'forex' | 'crypto'): Promise<TradingSignal | null> {
    try {
      // Fetch historical data for analysis
      const historicalData = await this.fetchHistoricalData(symbol, timeframe, botType);
      if (!historicalData || historicalData.length < 20) return null;

      // Perform SMC analysis
      const analysis = this.performSMCAnalysis(historicalData, symbol, timeframe);
      if (!analysis.signalDirection) return null;

      // Calculate entry, stop loss, and take profit
      const currentPrice = historicalData[historicalData.length - 1].close;
      const { entryPrice, stopLoss, takeProfit } = this.calculateTradeLevels(
        currentPrice, 
        analysis.signalDirection, 
        2.0, // Default risk reward ratio
        historicalData
      );

      const signal: TradingSignal = {
        id: `${symbol}_${timeframe}_${Date.now()}`,
        symbol: symbol.replace('=X', '').replace('USDT', ''),
        signalType: analysis.signalDirection,
        confidence: this.calculateConfidence(analysis.confirmations),
        entryPrice,
        stopLoss,
        takeProfit,
        riskReward: '2.0',
        confirmations: analysis.confirmations,
        timestamp: new Date(),
        analysis: analysis.analysis,
        sessionQuality: 'High',
        timeframe,
        status: 'active',
        direction: analysis.signalDirection === 'BUY' ? 'bullish' : 'bearish',
        market: botType
      };

      return signal;
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
      return null;
    }
  }

  // Fetch historical data with enhanced validation
  private async fetchHistoricalData(symbol: string, timeframe: string, botType: 'forex' | 'crypto'): Promise<any[]> {
    try {
      if (botType === 'forex') {
        console.log(`📊 Fetching historical data for ${symbol} (${timeframe}) from yfinance...`);
        const response = await fetch(`${this.yfinanceBaseUrl}/historical/${symbol}/${timeframe}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.history && Array.isArray(data.history) && data.history.length > 0) {
            console.log(`✅ Successfully fetched ${data.history.length} historical bars for ${symbol}`);
            return data.history;
          } else {
            console.warn(`⚠️ No historical data available for ${symbol}`);
            return [];
          }
        } else {
          console.error(`❌ HTTP error fetching historical data for ${symbol}: ${response.status}`);
          return [];
        }
      } else if (botType === 'crypto') {
        // For crypto, fetch from Binance API instead of using mock data
        console.log(`🪙 Fetching historical data for ${symbol} (${timeframe}) from Binance...`);
        try {
          const response = await fetch(`${this.binanceBaseUrl}/klines?symbol=${symbol}&interval=${timeframe}&limit=100`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (Array.isArray(data) && data.length > 0) {
              const history = data.map((candle: any) => ({
                time: new Date(candle[0]).toISOString(),
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5])
              }));
              
              console.log(`✅ Successfully fetched ${history.length} historical bars for ${symbol} from Binance`);
              return history;
            }
          }
        } catch (cryptoError) {
          console.error(`❌ Error fetching crypto historical data for ${symbol}:`, cryptoError);
        }
        
        console.warn(`⚠️ Falling back to minimal historical data for ${symbol}`);
        return [];
      }
      
      return [];
    } catch (error) {
      console.error(`❌ Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  // Remove mock data generation - we only use real data
  // private generateMockHistoricalData(symbol: string, timeframe: string): any[] {
  //   This method has been removed to ensure only real data is used
  // }

  // Perform SMC analysis
  private performSMCAnalysis(data: any[], symbol: string, timeframe: string): any {
    // Simplified SMC analysis - in a real implementation, this would be much more sophisticated
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Calculate basic indicators
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const currentPrice = prices[prices.length - 1];
    
    const confirmations = [];
    let signalDirection = null;
    let analysis = '';

    // Simple trend analysis
    if (currentPrice > sma20 && sma20 > sma50) {
      signalDirection = 'BUY';
      confirmations.push('Uptrend', 'Price above SMA20', 'SMA20 above SMA50');
      analysis = `Strong uptrend detected for ${symbol} on ${timeframe}. Price is above both moving averages indicating bullish momentum.`;
    } else if (currentPrice < sma20 && sma20 < sma50) {
      signalDirection = 'SELL';
      confirmations.push('Downtrend', 'Price below SMA20', 'SMA20 below SMA50');
      analysis = `Strong downtrend detected for ${symbol} on ${timeframe}. Price is below both moving averages indicating bearish momentum.`;
    }

    return {
      signalDirection,
      confirmations,
      analysis: analysis || 'No clear trend detected'
    };
  }

  // Calculate SMA
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  // Calculate trade levels
  private calculateTradeLevels(currentPrice: number, direction: string, riskReward: number, data: any[]): any {
    const atr = this.calculateATR(data, 14);
    const stopLossDistance = atr * 2; // 2x ATR for stop loss
    
    let entryPrice = currentPrice;
    let stopLoss = 0;
    let takeProfit = 0;

    if (direction === 'BUY') {
      stopLoss = currentPrice - stopLossDistance;
      takeProfit = currentPrice + (stopLossDistance * riskReward);
    } else {
      stopLoss = currentPrice + stopLossDistance;
      takeProfit = currentPrice - (stopLossDistance * riskReward);
    }

    return { entryPrice, stopLoss, takeProfit };
  }

  // Calculate ATR
  private calculateATR(data: any[], period: number): number {
    if (data.length < period + 1) return 0;
    
    let sum = 0;
    for (let i = 1; i <= period; i++) {
      const high = data[data.length - i].high;
      const low = data[data.length - i].low;
      const prevClose = data[data.length - i - 1].close;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      sum += Math.max(tr1, tr2, tr3);
    }
    
    return sum / period;
  }

  // Calculate confidence based on confirmations
  private calculateConfidence(confirmations: string[]): number {
    const baseConfidence = 60;
    const confirmationBonus = confirmations.length * 5;
    return Math.min(baseConfidence + confirmationBonus, 95);
  }

  // Enhanced store price data function
  private async storePriceData(prices: PriceData[], botType: 'forex' | 'crypto') {
    try {
      console.log(`💾 Storing ${prices.length} price records to database for ${botType} bot...`);
      
      for (const price of prices) {
        try {
          // Store in bot_data table
          await tradingBotAPI.bot.storeBotData({
            bot_type: botType,
            pair: price.symbol,
            price: price.price,
            signal_type: 'neutral', // Price data, not a signal
            signal_strength: 0,
            is_recommended: false,
            volume: price.volume,
            high: price.high,
            low: price.low,
            open_price: price.open,
            close_price: price.price,
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

  // New function to store OHLC data for charting
  private async storeOHLCData(prices: PriceData[], botType: 'forex' | 'crypto') {
    try {
      console.log(`📊 Storing OHLC data for ${prices.length} symbols...`);
      
      for (const price of prices) {
        try {
          // Store in ohlc_data table if the endpoint exists
          await tradingBotAPI.price.storePriceData({
            pair: price.symbol,
            timeframe: '1m',
            timestamp: price.timestamp.toISOString(),
            open_price: price.open,
            high_price: price.high,
            low_price: price.low,
            close_price: price.price,
            volume: price.volume,
            market: botType
          });
          
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

  // Store signal in database
  private async storeSignal(signal: TradingSignal) {
    try {
      await tradingBotAPI.signal.createSignal({
        signal_id: signal.id,
        pair: signal.symbol,
        timeframe: signal.timeframe,
        direction: signal.signalType,
        entry_price: signal.entryPrice.toString(),
        stop_loss: signal.stopLoss.toString(),
        take_profit: signal.takeProfit.toString(),
        confidence: signal.confidence,
        analysis: signal.analysis,
        ict_concepts: signal.confirmations.join(','),
        status: signal.status,
        created_by: 'trading_bot',
        market: signal.market
      });
    } catch (error) {
      console.error('Error storing signal:', error);
    }
  }

  // Get all signals
  async getSignals(market?: 'forex' | 'crypto'): Promise<TradingSignal[]> {
    try {
      const response = await tradingBotAPI.signal.getSignals(market);
      return response.data.map((signal: any) => ({
        ...signal,
        timestamp: new Date(signal.timestamp),
        confirmations: signal.ict_concepts ? signal.ict_concepts.split(',') : []
      }));
    } catch (error) {
      console.error('Error getting signals:', error);
      return [];
    }
  }

  // Get bot configurations
  async getBotConfigs(): Promise<BotConfig[]> {
    try {
      const response = await tradingBotAPI.bot.getBotConfigs();
      return response.data.map((config: any) => ({
        ...config,
        lastModified: new Date(config.lastModified)
      }));
    } catch (error) {
      console.error('Error getting bot configs:', error);
      return [];
    }
  }

  // Save bot configuration
  async saveBotConfig(config: BotConfig): Promise<boolean> {
    try {
      await tradingBotAPI.bot.saveBotConfig(config);
      return true;
    } catch (error) {
      console.error('Error saving bot config:', error);
      return false;
    }
  }

  // Delete bot configuration
  async deleteBotConfig(configId: string): Promise<boolean> {
    try {
      await tradingBotAPI.bot.deleteBotConfig(configId);
      return true;
    } catch (error) {
      console.error('Error deleting bot config:', error);
      return false;
    }
  }
}

export const tradingBotService = new TradingBotService();
export default tradingBotService;
