import { Signal } from '../trading/types';

export interface MarketData {
  symbol: string;
  timeframe: string;
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume?: number[];
  timestamp: number[];
}

export interface TechnicalIndicatorResult {
  name: string;
  value: number | boolean;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-1
}

class TechnicalIndicatorsService {
  private marketDataCache: Map<string, MarketData> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  /**
   * Fetch market data from your ForexData bot API
   */
  private async fetchMarketData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<MarketData> {
    const cacheKey = `${symbol}_${timeframe}`;
    const now = Date.now();
    
    // Check cache
    if (this.marketDataCache.has(cacheKey) && 
        this.cacheExpiry.has(cacheKey) && 
        this.cacheExpiry.get(cacheKey)! > now) {
      return this.marketDataCache.get(cacheKey)!;
    }

    try {
      // Replace with your actual ForexData bot API endpoint
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/market-data/${symbol}?timeframe=${timeframe}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform your API response to MarketData format
      const marketData: MarketData = {
        symbol,
        timeframe,
        open: data.candles.map((c: any) => parseFloat(c.open)),
        high: data.candles.map((c: any) => parseFloat(c.high)),
        low: data.candles.map((c: any) => parseFloat(c.low)),
        close: data.candles.map((c: any) => parseFloat(c.close)),
        volume: data.candles.map((c: any) => parseFloat(c.volume || 0)),
        timestamp: data.candles.map((c: any) => new Date(c.timestamp).getTime())
      };

      // Cache the data
      this.marketDataCache.set(cacheKey, marketData);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);

      return marketData;
    } catch (error) {
      console.error(`Error fetching market data for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length < period + 1) return 50; // Neutral if not enough data

    let gains = 0;
    let losses = 0;

    // Calculate initial average gain/loss
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Calculate RSI for remaining periods
    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(closes: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    if (closes.length < slowPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }

    // Calculate EMAs
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    
    const macdLine = fastEMA - slowEMA;
    const macdHistory = [macdLine]; // In real implementation, you'd calculate this for multiple periods
    const signalLine = this.calculateEMA(macdHistory, signalPeriod);
    const histogram = macdLine - signalLine;

    return {
      macd: macdLine,
      signal: signalLine,
      histogram
    };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  private calculateEMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    if (values.length < period) return values[values.length - 1];

    const multiplier = 2 / (period + 1);
    let ema = values[0];

    for (let i = 1; i < values.length; i++) {
      ema = (values[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  /**
   * Calculate ATR (Average True Range)
   */
  private calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period + 1) return 0;

    const trueRanges: number[] = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
  }

  /**
   * Calculate ADX (Average Directional Index)
   */
  private calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (highs.length < period + 1) return 0;

    // Simplified ADX calculation - in production, use a proper technical analysis library
    const trueRanges: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];

    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));

      const plusDM = highs[i] - highs[i - 1] > lows[i - 1] - lows[i] ? Math.max(highs[i] - highs[i - 1], 0) : 0;
      const minusDM = lows[i - 1] - lows[i] > highs[i] - highs[i - 1] ? Math.max(lows[i - 1] - lows[i], 0) : 0;
      
      plusDMs.push(plusDM);
      minusDMs.push(minusDM);
    }

    // Calculate smoothed averages (simplified)
    const avgTR = trueRanges.slice(-period).reduce((sum, tr) => sum + tr, 0) / period;
    const avgPlusDM = plusDMs.slice(-period).reduce((sum, dm) => sum + dm, 0) / period;
    const avgMinusDM = minusDMs.slice(-period).reduce((sum, dm) => sum + dm, 0) / period;

    const plusDI = (avgPlusDM / avgTR) * 100;
    const minusDI = (avgMinusDM / avgTR) * 100;

    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    return dx; // Simplified - real ADX needs smoothing
  }

  /**
   * Check Higher Timeframe Trend Alignment
   */
  async checkHTFTrendAlignment(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      const htfData = await this.fetchMarketData(signal.pair, '4h', 50);
      const ema20 = this.calculateEMA(htfData.close.slice(-20), 20);
      const ema50 = this.calculateEMA(htfData.close.slice(-50), 50);
      const currentPrice = htfData.close[htfData.close.length - 1];

      const isUptrend = ema20 > ema50 && currentPrice > ema20;
      const isDowntrend = ema20 < ema50 && currentPrice < ema20;

      const signalDirection = signal.direction?.toLowerCase() || signal.type?.toLowerCase();
      const isAligned = (signalDirection === 'long' && isUptrend) || (signalDirection === 'short' && isDowntrend);

      return {
        name: 'HTF_trend',
        value: isAligned,
        signal: isUptrend ? 'bullish' : isDowntrend ? 'bearish' : 'neutral',
        confidence: isAligned ? 0.8 : 0.2
      };
    } catch (error) {
      console.error('Error checking HTF trend alignment:', error);
      return { name: 'HTF_trend', value: false, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Check RSI Confirmation
   */
  async checkRSIConfirmation(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      const data = await this.fetchMarketData(signal.pair, '1h', 50);
      const rsi = this.calculateRSI(data.close);

      const signalDirection = signal.direction?.toLowerCase() || signal.type?.toLowerCase();
      const isOversold = rsi < 30;
      const isOverbought = rsi > 70;

      const isConfirmed = (signalDirection === 'long' && isOversold) || (signalDirection === 'short' && isOverbought);

      return {
        name: 'RSI',
        value: rsi,
        signal: isOversold ? 'bullish' : isOverbought ? 'bearish' : 'neutral',
        confidence: isConfirmed ? 0.7 : 0.3
      };
    } catch (error) {
      console.error('Error checking RSI confirmation:', error);
      return { name: 'RSI', value: 50, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Check MACD Confirmation
   */
  async checkMACDConfirmation(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      const data = await this.fetchMarketData(signal.pair, '1h', 50);
      const macd = this.calculateMACD(data.close);

      const signalDirection = signal.direction?.toLowerCase() || signal.type?.toLowerCase();
      const isBullish = macd.histogram > 0 && macd.macd > macd.signal;
      const isBearish = macd.histogram < 0 && macd.macd < macd.signal;

      const isConfirmed = (signalDirection === 'long' && isBullish) || (signalDirection === 'short' && isBearish);

      return {
        name: 'MACD',
        value: macd.histogram,
        signal: isBullish ? 'bullish' : isBearish ? 'bearish' : 'neutral',
        confidence: isConfirmed ? 0.6 : 0.2
      };
    } catch (error) {
      console.error('Error checking MACD confirmation:', error);
      return { name: 'MACD', value: 0, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Check EMA Alignment
   */
  async checkEMAAlignment(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      const data = await this.fetchMarketData(signal.pair, '1h', 200);
      const ema20 = this.calculateEMA(data.close.slice(-20), 20);
      const ema50 = this.calculateEMA(data.close.slice(-50), 50);
      const ema200 = this.calculateEMA(data.close, 200);
      const currentPrice = data.close[data.close.length - 1];

      const signalDirection = signal.direction?.toLowerCase() || signal.type?.toLowerCase();
      const isBullishAlignment = currentPrice > ema20 && ema20 > ema50 && ema50 > ema200;
      const isBearishAlignment = currentPrice < ema20 && ema20 < ema50 && ema50 < ema200;

      const isAligned = (signalDirection === 'long' && isBullishAlignment) || (signalDirection === 'short' && isBearishAlignment);

      return {
        name: 'EMA_alignment',
        value: isAligned,
        signal: isBullishAlignment ? 'bullish' : isBearishAlignment ? 'bearish' : 'neutral',
        confidence: isAligned ? 0.75 : 0.25
      };
    } catch (error) {
      console.error('Error checking EMA alignment:', error);
      return { name: 'EMA_alignment', value: false, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Check ATR Volatility Filter
   */
  async checkATRFilter(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      const data = await this.fetchMarketData(signal.pair, '1h', 50);
      const atr = this.calculateATR(data.high, data.low, data.close);
      const currentPrice = data.close[data.close.length - 1];
      const atrPercentage = (atr / currentPrice) * 100;

      // ATR should be between 0.5% and 3% for optimal conditions
      const isOptimal = atrPercentage >= 0.5 && atrPercentage <= 3.0;

      return {
        name: 'ATR_ok',
        value: atrPercentage,
        signal: 'neutral',
        confidence: isOptimal ? 0.5 : 0.1
      };
    } catch (error) {
      console.error('Error checking ATR filter:', error);
      return { name: 'ATR_ok', value: 0, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Check ADX Trend Strength
   */
  async checkADXStrength(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      const data = await this.fetchMarketData(signal.pair, '1h', 50);
      const adx = this.calculateADX(data.high, data.low, data.close);

      // ADX > 25 indicates strong trend
      const isStrongTrend = adx > 25;

      return {
        name: 'ADX',
        value: adx,
        signal: 'neutral',
        confidence: isStrongTrend ? 0.6 : 0.2
      };
    } catch (error) {
      console.error('Error checking ADX strength:', error);
      return { name: 'ADX', value: 0, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Check Trading Session
   */
  checkTradingSession(signal: Signal): TechnicalIndicatorResult {
    const now = new Date();
    const hour = now.getUTCHours();

    // London session: 8-17 UTC, New York session: 13-22 UTC
    const isLondonSession = hour >= 8 && hour <= 17;
    const isNewYorkSession = hour >= 13 && hour <= 22;
    const isOptimalSession = isLondonSession || isNewYorkSession;

    return {
      name: 'Session_ok',
      value: isOptimalSession,
      signal: 'neutral',
      confidence: isOptimalSession ? 0.4 : 0.1
    };
  }

  /**
   * Check Spread Filter (mock implementation - replace with real spread data)
   */
  async checkSpreadFilter(signal: Signal): Promise<TechnicalIndicatorResult> {
    try {
      // In real implementation, fetch current spread from your broker API
      const mockSpread = 0.0002; // 2 pips for EURUSD
      const maxAllowedSpread = 0.0005; // 5 pips max
      
      const isAcceptableSpread = mockSpread <= maxAllowedSpread;

      return {
        name: 'Spread_ok',
        value: mockSpread,
        signal: 'neutral',
        confidence: isAcceptableSpread ? 0.3 : 0.05
      };
    } catch (error) {
      console.error('Error checking spread filter:', error);
      return { name: 'Spread_ok', value: 0, signal: 'neutral', confidence: 0 };
    }
  }

  /**
   * Evaluate all secondary confirmations for a signal
   */
  async evaluateAllConfirmations(signal: Signal): Promise<TechnicalIndicatorResult[]> {
    const results = await Promise.all([
      this.checkHTFTrendAlignment(signal),
      this.checkRSIConfirmation(signal),
      this.checkMACDConfirmation(signal),
      this.checkEMAAlignment(signal),
      this.checkATRFilter(signal),
      this.checkADXStrength(signal),
      this.checkSpreadFilter(signal),
    ]);

    // Add session check (synchronous)
    results.push(this.checkTradingSession(signal));

    return results;
  }
}

export const technicalIndicators = new TechnicalIndicatorsService();
export default technicalIndicators;
