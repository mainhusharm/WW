import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  Bot, Zap, Activity, Globe, Play, Pause, Target, BarChart3, Database, RefreshCw, Brain
} from 'lucide-react';

// Environment-aware API configuration
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production environment detection
    if (hostname.includes('onrender.com') || hostname.includes('traderedgepro.com')) {
      return 'https://futures-data-service.onrender.com';
    }
    
    // Local development
    return 'http://localhost:10003';
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:10003';
};

const FUTURES_API_BASE = getApiBaseUrl();

interface FuturesPrice {
  symbol: string;
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdate: string;
  high24h?: number;
  low24h?: number;
  previousRate?: number;
}

interface SignalConfirmation {
  id: string;
  name: string;
  weight: number;
  status: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  details: string;
  timeframe: string;
}

interface FuturesSignal {
  id: string;
  symbol: string;
  ticker: string;
  name: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  analysis: string;
  timestamp: string;
  status: 'active' | 'completed';
  confirmations?: SignalConfirmation[];
  riskReward?: number;
  lotSize?: number;
  moneyAtRisk?: number;
  session?: string;
  indicators?: any;
  reasoning?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'price_update' | 'signal_generated' | 'error' | 'info' | 'system' | 'analysis' | 'confirmation';
  message: string;
  data?: any;
}

// TechnicalIndicators interface removed - using SMC only

const FuturesPage: React.FC = () => {
  const { } = useUser();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [prices, setPrices] = useState<FuturesPrice[]>([]);
  const [signals, setSignals] = useState<FuturesSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [isSignalGenerationActive, setIsSignalGenerationActive] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string>('');
  const [systemHeartbeat, setSystemHeartbeat] = useState<number>(0);
  const [stats, setStats] = useState({
    totalSignals: 0,
    liveSignals: 0,
    activeSignals: 0,
    bosCount: 0,
    chochCount: 0,
    successRate: 0,
    totalPnl: 0,
    winRate: 0
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'info' | 'warning' | 'error', timestamp: Date}>>([]);
  
  // Refs for intervals
  const signalGenerationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const priceUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' }
  ];

  const assets = [
    { value: 'all', label: 'All Assets' },
    { value: 'SP500', label: 'S&P 500' },
    { value: 'NASDAQ', label: 'NASDAQ-100' },
    { value: 'DOW', label: 'Dow Jones' },
    { value: 'RUSSELL', label: 'Russell 2000' },
    { value: 'CRUDE', label: 'Crude Oil' },
    { value: 'GOLD', label: 'Gold' },
    { value: 'SILVER', label: 'Silver' }
  ];

  const futuresTickers = {
    'SP500': 'ES=F',
    'NASDAQ': 'NQ=F',
    'DOW': 'YM=F',
    'RUSSELL': 'RTY=F',
    'CRUDE': 'CL=F',
    'GOLD': 'GC=F',
    'SILVER': 'SI=F'
  };

  const futuresNames = {
    'SP500': 'E-Mini S&P 500 Sep 25',
    'NASDAQ': 'Nasdaq 100 Sep 25',
    'DOW': 'E-Mini Dow Sep 25',
    'RUSSELL': 'E-mini Russell 2000 Index Futur',
    'CRUDE': 'Crude Oil Oct 25',
    'GOLD': 'Gold Dec 25',
    'SILVER': 'Silver Dec 25'
  };

  // Forex Bot System Configuration
  const botConfig = {
    min_confidence: 0.7,
    update_interval: 30, // seconds
    max_pairs: 50,
    risk_level: 'medium',
    stop_loss_percent: 0.02,
    take_profit_percent: 0.04,
    bar_extraction_interval: 5000, // 5 seconds for bar extraction
    price_history_limit: 100, // Keep last 100 prices for analysis
    technical_analysis_periods: {
      sma: [20, 50],
      ema: [12, 26],
      rsi: 14,
      macd: { fast: 12, slow: 26, signal: 9 },
      bollinger: { period: 20, stdDev: 2 }
    }
  };

  // Notification system
  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Technical Analysis Functions removed - using SMC only

  // calculateTechnicalIndicators function removed - using SMC only

  // Real-time Bar Extraction System
  const extractBar = (symbol: string, price: number, timestamp: Date): void => {
    try {
      const existingBars = JSON.parse(localStorage.getItem(`bars_${symbol}`) || '[]');
      
      // Get the last bar to update it, or create a new one
      let currentBar;
      if (existingBars.length > 0) {
        const lastBar = existingBars[existingBars.length - 1];
        const lastBarTime = new Date(lastBar.timestamp);
        const timeDiff = timestamp.getTime() - lastBarTime.getTime();
        
        // If within 5 seconds, update the current bar
        if (timeDiff < 5000) {
          currentBar = lastBar;
          currentBar.high = Math.max(currentBar.high, price);
          currentBar.low = Math.min(currentBar.low, price);
          currentBar.close = price;
          currentBar.volume += 1;
          existingBars[existingBars.length - 1] = currentBar;
        } else {
          // Extract new bar
          currentBar = {
            symbol,
            open: price,
            high: price,
            low: price,
            close: price,
            volume: 1,
            timestamp: timestamp.toISOString()
          };
          existingBars.push(currentBar);
        }
      } else {
        // First bar
        currentBar = {
          symbol,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: 1,
          timestamp: timestamp.toISOString()
        };
        existingBars.push(currentBar);
      }
      
      // Keep only last 200 bars for better analysis
      if (existingBars.length > 200) {
        existingBars.splice(0, existingBars.length - 200);
      }
      
      localStorage.setItem(`bars_${symbol}`, JSON.stringify(existingBars));
      
      // Log bar extraction only for new bars
      if (existingBars.length === 1 || existingBars[existingBars.length - 1] === currentBar) {
        addActivityLog('system', `📊 New bar extracted for ${symbol}: O:$${currentBar.open.toFixed(2)} H:$${currentBar.high.toFixed(2)} L:$${currentBar.low.toFixed(2)} C:$${currentBar.close.toFixed(2)}`);
      }
      
    } catch (error) {
      addActivityLog('error', `Failed to extract bar for ${symbol}: ${error}`);
    }
  };

  // Enhanced Bar Analysis with OHLC
  const analyzeBarData = (symbol: string): { prices: number[], bars: any[] } => {
    try {
      const bars = JSON.parse(localStorage.getItem(`bars_${symbol}`) || '[]');
      const prices = bars.map((bar: any) => bar.close || bar.price);
      
      return { prices, bars };
    } catch (error) {
      addActivityLog('error', `Failed to analyze bar data for ${symbol}: ${error}`);
      return { prices: [], bars: [] };
    }
  };

  // Smart Money Concepts (SMC) Analysis
  const analyzeSMC = (prices: number[], bars: any[]): { 
    bullishBOS: boolean, 
    bearishBOS: boolean, 
    bullishCHoCH: boolean, 
    bearishCHoCH: boolean,
    orderBlocks: any[],
    fairValueGaps: any[],
    equalHighs: boolean,
    equalLows: boolean
  } => {
    if (prices.length < 50) {
      return { bullishBOS: false, bearishBOS: false, bullishCHoCH: false, bearishCHoCH: false, orderBlocks: [], fairValueGaps: [], equalHighs: false, equalLows: false };
    }

    // Calculate swing highs and lows
    const swingHighs: number[] = [];
    const swingLows: number[] = [];
    
    for (let i = 5; i < prices.length - 5; i++) {
      const isSwingHigh = prices[i] > prices[i-1] && prices[i] > prices[i-2] && prices[i] > prices[i-3] && 
                         prices[i] > prices[i+1] && prices[i] > prices[i+2] && prices[i] > prices[i+3];
      const isSwingLow = prices[i] < prices[i-1] && prices[i] < prices[i-2] && prices[i] < prices[i-3] && 
                        prices[i] < prices[i+1] && prices[i] < prices[i+2] && prices[i] < prices[i+3];
      
      if (isSwingHigh) swingHighs.push(prices[i]);
      if (isSwingLow) swingLows.push(prices[i]);
    }

    // BOS (Break of Structure) Detection
    const recentHighs = swingHighs.slice(-3);
    const recentLows = swingLows.slice(-3);
    const currentPrice = prices[prices.length - 1];
    
    let bullishBOS = false;
    let bearishBOS = false;
    let bullishCHoCH = false;
    let bearishCHoCH = false;

    if (recentHighs.length >= 2 && recentLows.length >= 2) {
      const lastHigh = recentHighs[recentHighs.length - 1];
      const prevHigh = recentHighs[recentHighs.length - 2];
      const lastLow = recentLows[recentLows.length - 1];
      const prevLow = recentLows[recentLows.length - 2];

      // Bullish BOS: Price breaks above previous swing high
      if (currentPrice > prevHigh && lastHigh > prevHigh) {
        bullishBOS = true;
      }
      
      // Bearish BOS: Price breaks below previous swing low
      if (currentPrice < prevLow && lastLow < prevLow) {
        bearishBOS = true;
      }

      // CHoCH (Change of Character): Structure shift
      if (bullishBOS && lastLow < prevLow) {
        bullishCHoCH = true;
      }
      if (bearishBOS && lastHigh > prevHigh) {
        bearishCHoCH = true;
      }
    }

    // Order Blocks Detection
    const orderBlocks: any[] = [];
    for (let i = 10; i < bars.length - 5; i++) {
      const bar = bars[i];
      const nextBars = bars.slice(i + 1, i + 6);
      
      // Bullish Order Block: Strong bullish candle followed by pullback
      if (bar.close > bar.open && (bar.close - bar.open) > (bar.high - bar.low) * 0.7) {
        const hasPullback = nextBars.some(b => b.close < bar.low);
        if (hasPullback) {
          orderBlocks.push({
            type: 'bullish',
            high: bar.high,
            low: bar.low,
            time: bar.timestamp,
            mitigated: false
          });
        }
      }
      
      // Bearish Order Block: Strong bearish candle followed by pullback
      if (bar.close < bar.open && (bar.open - bar.close) > (bar.high - bar.low) * 0.7) {
        const hasPullback = nextBars.some(b => b.close > bar.high);
        if (hasPullback) {
          orderBlocks.push({
            type: 'bearish',
            high: bar.high,
            low: bar.low,
            time: bar.timestamp,
            mitigated: false
          });
        }
      }
    }

    // Fair Value Gaps Detection
    const fairValueGaps: any[] = [];
    for (let i = 2; i < bars.length - 1; i++) {
      const prevBar = bars[i - 1];
      const currentBar = bars[i];
      const nextBar = bars[i + 1];
      
      // Bullish FVG: Gap between high of 2 bars ago and low of current bar
      if (prevBar.high < nextBar.low) {
        fairValueGaps.push({
          type: 'bullish',
          top: nextBar.low,
          bottom: prevBar.high,
          time: currentBar.timestamp
        });
      }
      
      // Bearish FVG: Gap between low of 2 bars ago and high of current bar
      if (prevBar.low > nextBar.high) {
        fairValueGaps.push({
          type: 'bearish',
          top: prevBar.low,
          bottom: nextBar.high,
          time: currentBar.timestamp
        });
      }
    }

    // Equal Highs/Lows Detection
    const equalHighs = recentHighs.length >= 2 && 
      Math.abs(recentHighs[recentHighs.length - 1] - recentHighs[recentHighs.length - 2]) < (recentHighs[recentHighs.length - 1] * 0.001);
    const equalLows = recentLows.length >= 2 && 
      Math.abs(recentLows[recentLows.length - 1] - recentLows[recentLows.length - 2]) < (recentLows[recentLows.length - 1] * 0.001);

    return {
      bullishBOS,
      bearishBOS,
      bullishCHoCH,
      bearishCHoCH,
      orderBlocks: orderBlocks.slice(-5), // Keep last 5 order blocks
      fairValueGaps: fairValueGaps.slice(-3), // Keep last 3 FVGs
      equalHighs,
      equalLows
    };
  };

  // Check for duplicate signals
  const isDuplicateSignal = (newSignal: FuturesSignal): boolean => {
    const existingSignals = JSON.parse(localStorage.getItem('futures_signals') || '[]');
    
    // Check for duplicate within last 30 minutes with same direction and exact same prices
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    return existingSignals.some((existing: FuturesSignal) => {
      const existingTime = new Date(existing.timestamp);
      const isRecent = existingTime > thirtyMinutesAgo;
      const isSameSymbol = existing.symbol === newSignal.symbol;
      const isSameDirection = existing.direction === newSignal.direction;
      
      // Check for exact same entry, stop loss, and take profit (within 0.01 precision)
      const isSameEntry = Math.abs(existing.entry - newSignal.entry) < 0.01;
      const isSameStopLoss = Math.abs(existing.stopLoss - newSignal.stopLoss) < 0.01;
      const isSameTakeProfit = Math.abs(existing.takeProfit - newSignal.takeProfit) < 0.01;
      
      // Also check for very similar prices (within 0.1% for entry, 0.5% for SL/TP)
      const isSimilarEntry = Math.abs(existing.entry - newSignal.entry) < (newSignal.entry * 0.001);
      const isSimilarStopLoss = Math.abs(existing.stopLoss - newSignal.stopLoss) < (newSignal.stopLoss * 0.005);
      const isSimilarTakeProfit = Math.abs(existing.takeProfit - newSignal.takeProfit) < (newSignal.takeProfit * 0.005);
      
      const hasExactMatch = isSameEntry && isSameStopLoss && isSameTakeProfit;
      const hasSimilarMatch = isSimilarEntry && isSimilarStopLoss && isSimilarTakeProfit;
      
      return isRecent && isSameSymbol && isSameDirection && (hasExactMatch || hasSimilarMatch);
    });
  };

  // Advanced Signal Generation with SMC Analysis
  const generateAdvancedSignal = (symbol: string, price: FuturesPrice): FuturesSignal | null => {
    // Validate price object has all required fields
    if (!price || !price.symbol || !price.name || !price.ticker || !price.price) {
      console.error('Invalid price object:', price);
      return null;
    }

    const { prices, bars } = analyzeBarData(symbol);
    
    if (prices.length < 50) {
      return null; // Not enough data for SMC analysis
    }

    // SMC Analysis
    const smc = analyzeSMC(prices, bars);
    
    // Log detailed SMC analysis
    addActivityLog('analysis', `🔍 [${symbol}] SMC Analysis: BOS Bull=${smc.bullishBOS}, BOS Bear=${smc.bearishBOS}, CHoCH Bull=${smc.bullishCHoCH}, CHoCH Bear=${smc.bearishCHoCH}`);
    addActivityLog('analysis', `📊 [${symbol}] SMC Elements: OB=${smc.orderBlocks.length}, FVG=${smc.fairValueGaps.length}, EH=${smc.equalHighs}, EL=${smc.equalLows}`);
    
    let signalType: 'LONG' | 'SHORT' | null = null;
    let confidence = 0.3; // Start with lower base confidence
    const reasoning: string[] = [];
    const confirmations: SignalConfirmation[] = [];

    // SMC Confirmations (CORE LOGIC - Only these can generate signals)
    if (smc.bullishBOS || smc.bullishCHoCH) {
      signalType = 'LONG';
      confidence += 0.4;
      reasoning.push(smc.bullishCHoCH ? 'Bullish CHoCH detected' : 'Bullish BOS detected');
      addActivityLog('analysis', `🟢 [${symbol}] Bullish SMC detected: ${smc.bullishCHoCH ? 'CHoCH' : 'BOS'} - Signal generation possible`);
      confirmations.push({
        id: 'smc_bullish',
        name: smc.bullishCHoCH ? 'Bullish CHoCH' : 'Bullish BOS',
        weight: 1.0,
        status: 'bullish',
        confidence: 95,
        details: smc.bullishCHoCH ? 'Change of character - bullish structure shift' : 'Break of structure - bullish momentum',
        timeframe: '4H'
      });
    } else if (smc.bearishBOS || smc.bearishCHoCH) {
      signalType = 'SHORT';
      confidence += 0.4;
      reasoning.push(smc.bearishCHoCH ? 'Bearish CHoCH detected' : 'Bearish BOS detected');
      addActivityLog('analysis', `🔴 [${symbol}] Bearish SMC detected: ${smc.bearishCHoCH ? 'CHoCH' : 'BOS'} - Signal generation possible`);
      confirmations.push({
        id: 'smc_bearish',
        name: smc.bearishCHoCH ? 'Bearish CHoCH' : 'Bearish BOS',
        weight: 1.0,
        status: 'bearish',
        confidence: 95,
        details: smc.bearishCHoCH ? 'Change of character - bearish structure shift' : 'Break of structure - bearish momentum',
        timeframe: '4H'
      });
    } else {
      addActivityLog('analysis', `⚪ [${symbol}] No SMC conditions met - No BOS or CHoCH detected`);
    }

    // If no SMC signal, return null - technical indicators cannot generate signals alone
    if (signalType === null) {
      return null;
    }

    // Order Block Confirmations
    const relevantOrderBlocks = smc.orderBlocks.filter(ob => 
      !ob.mitigated && 
      ((signalType === 'LONG' && ob.type === 'bullish' && price.price >= ob.low && price.price <= ob.high) ||
       (signalType === 'SHORT' && ob.type === 'bearish' && price.price >= ob.low && price.price <= ob.high))
    );

    if (relevantOrderBlocks.length > 0 && signalType) {
      confidence += 0.2;
      reasoning.push(`${relevantOrderBlocks.length} order block(s) active`);
      confirmations.push({
        id: 'order_block',
        name: 'Order Block Confirmation',
        weight: 0.8,
        status: signalType === 'LONG' ? 'bullish' : 'bearish',
        confidence: 85,
        details: `Price respecting ${relevantOrderBlocks.length} order block(s)`,
        timeframe: '1H'
      });
    }

    // Fair Value Gap Confirmations
    const relevantFVGs = smc.fairValueGaps.filter(fvg => 
      ((signalType === 'LONG' && fvg.type === 'bullish' && price.price >= fvg.bottom && price.price <= fvg.top) ||
       (signalType === 'SHORT' && fvg.type === 'bearish' && price.price >= fvg.bottom && price.price <= fvg.top))
    );

    if (relevantFVGs.length > 0 && signalType) {
      confidence += 0.15;
      reasoning.push(`${relevantFVGs.length} fair value gap(s) active`);
      confirmations.push({
        id: 'fvg',
        name: 'Fair Value Gap',
        weight: 0.6,
        status: signalType === 'LONG' ? 'bullish' : 'bearish',
        confidence: 80,
        details: `Price within ${relevantFVGs.length} fair value gap(s)`,
        timeframe: '1H'
      });
    }

    // Equal Highs/Lows Confirmations
    if (smc.equalHighs && signalType === 'SHORT') {
      confidence += 0.1;
      reasoning.push('Equal highs resistance');
      confirmations.push({
        id: 'equal_highs',
        name: 'Equal Highs',
        weight: 0.5,
        status: 'bearish',
        confidence: 75,
        details: 'Equal highs providing resistance',
        timeframe: '4H'
      });
    }
    if (smc.equalLows && signalType === 'LONG') {
      confidence += 0.1;
      reasoning.push('Equal lows support');
      confirmations.push({
        id: 'equal_lows',
        name: 'Equal Lows',
        weight: 0.5,
        status: 'bullish',
        confidence: 75,
        details: 'Equal lows providing support',
        timeframe: '4H'
      });
    }

    // SMC-only confirmations - no technical indicators

    // Cap confidence at 95%
    confidence = Math.min(0.95, confidence);

    // Only return signals with SMC confirmations and sufficient confidence
    if (signalType === null || confidence < botConfig.min_confidence) {
      addActivityLog('analysis', `❌ [${symbol}] Signal rejected: ${signalType === null ? 'No SMC conditions' : `Confidence too low (${Math.round(confidence * 100)}% < ${Math.round(botConfig.min_confidence * 100)}%)`}`);
      return null;
    }

    // Ensure we have at least one SMC confirmation (BOS/CHoCH)
    const hasSMCConfirmation = confirmations.some(c => 
      c.id === 'smc_bullish' || c.id === 'smc_bearish'
    );
    
    if (!hasSMCConfirmation) {
      addActivityLog('analysis', `❌ [${symbol}] Signal rejected: No primary SMC confirmation (BOS/CHoCH) found`);
      return null;
    }

    addActivityLog('analysis', `✅ [${symbol}] SMC signal validated: ${signalType} with ${Math.round(confidence * 100)}% confidence`);

    // SMC-based Entry, Stop Loss, and Take Profit Calculation
    // Add small randomization to prevent identical signals (within 0.01% of price)
    const priceVariation = price.price * 0.0001 * (Math.random() - 0.5); // ±0.01% variation
    const entry = price.price + priceVariation;
    
    // Calculate ATR for dynamic stop loss
    const atr = calculateATR(prices, 14);
    const atrMultiplier = 1.5; // SMC standard
    
    let stopLoss: number;
    let takeProfit: number;
    
    if (signalType === 'LONG') {
      // For LONG: SL below recent swing low or order block low
      const recentLows = prices.slice(-20).filter((p, i) => i > 0 && p < prices[i-1] && p < prices[i+1]);
      const swingLow = recentLows.length > 0 ? Math.min(...recentLows) : price.price * 0.98;
      const baseStopLoss = Math.min(swingLow - (atr * 0.5), price.price - (atr * atrMultiplier));
      
      // Add small variation to stop loss (within 0.02% of price)
      const slVariation = price.price * 0.0002 * (Math.random() - 0.5);
      stopLoss = baseStopLoss + slVariation;
      
      // Risk:Reward ratio of 1:2 (SMC standard)
      const risk = Math.abs(entry - stopLoss);
      const baseTakeProfit = entry + (risk * 2);
      
      // Add small variation to take profit (within 0.02% of price)
      const tpVariation = price.price * 0.0002 * (Math.random() - 0.5);
      takeProfit = baseTakeProfit + tpVariation;
    } else {
      // For SHORT: SL above recent swing high or order block high
      const recentHighs = prices.slice(-20).filter((p, i) => i > 0 && p > prices[i-1] && p > prices[i+1]);
      const swingHigh = recentHighs.length > 0 ? Math.max(...recentHighs) : price.price * 1.02;
      const baseStopLoss = Math.max(swingHigh + (atr * 0.5), price.price + (atr * atrMultiplier));
      
      // Add small variation to stop loss (within 0.02% of price)
      const slVariation = price.price * 0.0002 * (Math.random() - 0.5);
      stopLoss = baseStopLoss + slVariation;
      
      // Risk:Reward ratio of 1:2 (SMC standard)
      const risk = Math.abs(stopLoss - entry);
      const baseTakeProfit = entry - (risk * 2);
      
      // Add small variation to take profit (within 0.02% of price)
      const tpVariation = price.price * 0.0002 * (Math.random() - 0.5);
      takeProfit = baseTakeProfit + tpVariation;
    }

    const riskReward = Math.abs(takeProfit - entry) / Math.abs(entry - stopLoss);
    
    // Dynamic lot size calculation based on risk management
    const riskAmount = Math.abs(entry - stopLoss);
    const accountBalance = 10000; // Default account balance
    const riskPercentage = 0.02; // 2% risk per trade
    const maxRiskAmount = accountBalance * riskPercentage;
    const lotSize = Math.max(0.01, Math.min(1.0, maxRiskAmount / (riskAmount * 100)));
    const moneyAtRisk = riskAmount * lotSize * 100;

    // Ensure all required fields are present
    const signal = {
      id: `signal_${Date.now()}_${symbol}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: symbol || 'UNKNOWN',
      ticker: price.ticker || 'UNKNOWN',
      name: price.name || price.symbol || 'Unknown Asset',
      direction: signalType,
      entry,
      stopLoss,
      takeProfit,
      confidence: Math.round(confidence * 100),
      lotSize,
      moneyAtRisk,
      timeframe: '1H',
      confirmations: confirmations || [],
      riskReward,
      timestamp: new Date().toISOString(),
      session: getCurrentSession(),
      reasoning: reasoning.join('; '),
      analysis: `SMC analysis with ${confirmations.length} confirmations`,
      status: 'active' as const
    };

    // Final uniqueness check - ensure no identical signals exist
    if (isDuplicateSignal(signal)) {
      addActivityLog('info', `⚠️ [${symbol}] Generated signal is duplicate - regenerating with new parameters`);
      // Regenerate with different randomization
      const newPriceVariation = price.price * 0.0002 * (Math.random() - 0.5);
      const newEntry = price.price + newPriceVariation;
      
      // Recalculate with new entry
      let newStopLoss, newTakeProfit;
      if (signalType === 'LONG') {
        const risk = Math.abs(newEntry - stopLoss);
        newTakeProfit = newEntry + (risk * 2);
        newStopLoss = stopLoss;
      } else {
        const risk = Math.abs(stopLoss - newEntry);
        newTakeProfit = newEntry - (risk * 2);
        newStopLoss = stopLoss;
      }
      
      // Update signal with new values
      signal.entry = newEntry;
      signal.stopLoss = newStopLoss;
      signal.takeProfit = newTakeProfit;
      signal.riskReward = Math.abs(newTakeProfit - newEntry) / Math.abs(newEntry - newStopLoss);
    }

    // Debug log to ensure signal has all required data
    console.log('Generated signal:', signal);
    
    return signal;
  };

  // ATR Calculation for dynamic stop loss
  const calculateATR = (prices: number[], period: number): number => {
    if (prices.length < period + 1) return 0;
    
    const trueRanges: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const high = prices[i];
      const low = prices[i];
      const prevClose = prices[i - 1];
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      trueRanges.push(tr);
    }
    
    const recentTRs = trueRanges.slice(-period);
    return recentTRs.reduce((sum, tr) => sum + tr, 0) / period;
  };

  // Signal Generation Logic (extracted from forex bot)
  const generateSignal = (_symbol: string, _price: FuturesPrice): FuturesSignal | null => {
    // This function is kept for compatibility but now only uses SMC logic
    // The main signal generation is handled by generateAdvancedSignal
    return null;
  };

  const getCurrentSession = (): string => {
    const hour = new Date().getUTCHours();
    
    if (hour >= 22 || hour < 7) return 'Sydney';
    if (hour >= 7 && hour < 9) return 'Tokyo';
    if (hour >= 9 && hour < 17) return 'London';
    return 'New York';
  };

  // Activity log functions
  const addActivityLog = (type: ActivityLog['type'], message: string, data?: any) => {
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };
    
    setActivityLog(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Keep only last 50 entries
      return updated;
    });
  };

  // Signal generation is now handled by the dedicated signals page

  // Price history storage for technical analysis
  const getPriceHistory = (symbol: string): number[] => {
    const historyKey = `price_history_${symbol}`;
    const history = localStorage.getItem(historyKey);
    return history ? JSON.parse(history) : [];
  };

  const updatePriceHistory = (symbol: string, price: number) => {
    const historyKey = `price_history_${symbol}`;
    const history = getPriceHistory(symbol);
    history.push(price);
    
    // Keep only last 100 prices
    const updatedHistory = history.slice(-100);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  };

  // Send signal to dashboard feed
  const sendToDashboardFeed = useCallback(async (signal: FuturesSignal) => {
    // Validate signal has all required fields
    if (!signal || !signal.name || !signal.symbol || !signal.ticker) {
      console.error('Cannot send incomplete signal to dashboard:', signal);
      return;
    }

    // Check for duplicate in telegram_messages to prevent spam
    const existingMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const isDuplicateInDashboard = existingMessages.some((msg: any) => {
      const msgTime = new Date(msg.timestamp);
      const isRecent = msgTime > fiveMinutesAgo;
      const isSameSymbol = msg.text.includes(signal.symbol);
      const isSameDirection = msg.text.includes(signal.direction);
      
      return isRecent && isSameSymbol && isSameDirection;
    });

    if (isDuplicateInDashboard) {
      console.log('Duplicate signal detected in dashboard feed - skipping');
      return;
    }

    try {
      const dashboardSignal = {
        id: signal.id,
        pair: signal.symbol,
        direction: signal.direction,
        entry: signal.entry.toString(),
        entryPrice: signal.entry,
        stopLoss: signal.stopLoss.toString(),
        takeProfit: signal.takeProfit.toString(),
        confidence: signal.confidence,
        analysis: signal.analysis,
        market: 'futures',
        timeframe: signal.timeframe,
        timestamp: signal.timestamp,
        status: 'active',
        type: signal.direction === 'LONG' ? 'buy' : 'sell',
        is_recommended: signal.confidence > 85
      };

      // Store in localStorage for the signal feed
      const existingSignals = JSON.parse(localStorage.getItem('futures_signals') || '[]');
      existingSignals.unshift(dashboardSignal);
      localStorage.setItem('futures_signals', JSON.stringify(existingSignals));

      // Also add to admin signals for consistency
      const adminSignals = JSON.parse(localStorage.getItem('admin_signals') || '[]');
      adminSignals.unshift(dashboardSignal);
      localStorage.setItem('admin_signals', JSON.stringify(adminSignals));

      // Store in telegram_messages format (same as forex bot)
      const signalForUser = {
        id: Date.now(),
        text: `${signal.name || signal.symbol} (${signal.ticker})\n${signal.direction} NOW\nEntry ${signal.entry}\nStop Loss ${signal.stopLoss}\nTake Profit ${signal.takeProfit}\nConfidence ${signal.confidence}%\n\n${signal.analysis}`,
        timestamp: signal.timestamp,
        from: 'Futures Bot System',
        chat_id: 1,
        message_id: Date.now(),
        update_id: Date.now()
      };
      
      const existingMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
      existingMessages.unshift(signalForUser);
      localStorage.setItem('telegram_messages', JSON.stringify(existingMessages));

      // Trigger signal feed update
      window.dispatchEvent(new CustomEvent('newSignalGenerated'));
      
      addActivityLog('info', `📡 Signal sent to dashboard feed: ${signal.symbol}`);
    } catch (error) {
      console.error('Error sending signal to dashboard:', error);
      addActivityLog('error', `❌ Failed to send signal to dashboard: ${error}`);
    }
  }, []);

  // Real-time Analysis System with Bar Extraction
  const startAnalysis = useCallback(async () => {
    if (isAnalysisRunning) return;
    
    setIsAnalysisRunning(true);
    const analysisStartTime = new Date().toLocaleTimeString();
    addActivityLog('system', `🔍 Starting comprehensive SMC analysis with bar extraction...`);
    addActivityLog('system', `📊 Monitoring ${prices.length} futures: ${prices.map(p => p.symbol).join(', ')}`);
    addActivityLog('system', `⏱️ Analysis started at ${analysisStartTime}`);
    addActivityLog('system', `🎯 SMC Logic: BOS, CHoCH, Order Blocks, FVGs, Equal Highs/Lows`);
    
    let signalsGenerated = 0;
    let assetsAnalyzed = 0;
    
    // Analyze each asset
    for (const price of prices) {
      if (selectedAsset !== 'all' && price.symbol !== selectedAsset) continue;
      
      try {
        assetsAnalyzed++;
        const priceHistory = getPriceHistory(price.symbol);
        addActivityLog('analysis', `📊 Analyzing ${price.symbol} - Price: $${price.price.toFixed(2)} (${priceHistory.length} bars)`);
        
        // Extract bar data
        extractBar(price.symbol, price.price, new Date());
        
        // Update price history
        updatePriceHistory(price.symbol, price.price);
        
        // Check if we have enough data for SMC analysis
        if (priceHistory.length < 20) {
            addActivityLog('info', `⚠️ [${price.symbol}] Insufficient price history (${priceHistory.length} bars) - SMC analysis requires minimum 20 bars`);
          addActivityLog('info', `ℹ️ No signals generated for ${price.symbol} - insufficient data for SMC analysis`);
          continue;
        }
        
        // Generate advanced signal with SMC analysis
        const signal = generateAdvancedSignal(price.symbol, price);
        
        if (signal && signal.name && signal.symbol && signal.ticker) {
          // Check for duplicate signals
          if (isDuplicateSignal(signal)) {
            addActivityLog('info', `⚠️ [${price.symbol}] Duplicate signal detected - skipping to prevent spam`);
            continue;
          }
          
          signalsGenerated++;
          const smcConfirmations = (signal.confirmations || []).filter(c => 
            c.id.includes('smc') || c.id.includes('order_block') || c.id.includes('fvg') || 
            c.id.includes('equal_highs') || c.id.includes('equal_lows')
          );
          
          addActivityLog('signal_generated', `🎯 [${price.symbol}] SMC Signal generated: ${signal.direction} (${signal.confidence}% confidence) - ${signal.confirmations?.length || 0} confirmations`);
          addActivityLog('signal_generated', `📋 [${price.symbol}] Entry: $${signal.entry.toFixed(2)} | SL: $${signal.stopLoss.toFixed(2)} | TP: $${signal.takeProfit.toFixed(2)} | R:R: 1:${signal.riskReward?.toFixed(1) || '0'}`);
          
          if (smcConfirmations.length > 0) {
            addActivityLog('signal_generated', `🔍 [${price.symbol}] SMC Confirmations: ${smcConfirmations.map(c => c.name).join(', ')}`);
          }
          
          // Add to signals
          setSignals(prev => [signal, ...prev.slice(0, 99)]);
          
          // Update stats
          setStats(prev => ({
            ...prev,
            totalSignals: prev.totalSignals + 1,
            liveSignals: prev.liveSignals + 1,
            activeSignals: prev.activeSignals + 1
          }));
          
          // Send to dashboard
          await sendToDashboardFeed(signal);
        } else {
          // Log detailed SMC analysis without signal
          const { prices: analysisPrices, bars } = analyzeBarData(price.symbol);
          const smc = analyzeSMC(analysisPrices, bars);
          
          let analysisReason = 'SMC conditions not met';
          if (!smc.bullishBOS && !smc.bearishBOS && !smc.bullishCHoCH && !smc.bearishCHoCH) {
            analysisReason = 'No BOS or CHoCH detected';
          } else if (smc.bullishBOS || smc.bullishCHoCH) {
            analysisReason = 'Bullish SMC detected but confidence too low';
          } else if (smc.bearishBOS || smc.bearishCHoCH) {
            analysisReason = 'Bearish SMC detected but confidence too low';
          }
          
          addActivityLog('analysis', `📊 [${price.symbol}] Analysis complete. No signal. Confidence: ${Math.round((smc.bullishBOS || smc.bearishBOS || smc.bullishCHoCH || smc.bearishCHoCH) ? 0.3 * 100 : 0)}%. Confirmations: ${smc.fairValueGaps.length + smc.orderBlocks.length}. Primary: ${(smc.bullishBOS || smc.bearishBOS || smc.bullishCHoCH || smc.bearishCHoCH) ? 1 : 0}.`);
          addActivityLog('info', `ℹ️ No signals generated for ${price.symbol} - ${analysisReason}`);
        }
        
        // Add delay between analyses
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        addActivityLog('error', `❌ Analysis failed for ${price.symbol}: ${error}`);
      }
    }
    
    const analysisEndTime = new Date().toLocaleTimeString();
    addActivityLog('system', `✅ Analysis cycle completed at ${analysisEndTime}`);
    addActivityLog('system', `📊 Summary: ${assetsAnalyzed} assets analyzed, ${signalsGenerated} SMC signals generated`);
    
    if (signalsGenerated === 0) {
      addActivityLog('info', `ℹ️ No SMC signals generated - market structure not favorable for BOS/CHoCH analysis`);
    } else {
      addActivityLog('signal_generated', `🎯 Generated ${signalsGenerated} SMC-based signals with BOS/CHoCH confirmations`);
    }
    
    setIsAnalysisRunning(false);
  }, [isAnalysisRunning, prices, selectedAsset]);

  const stopAnalysis = useCallback(() => {
    setIsAnalysisRunning(false);
    addActivityLog('system', '⏹️ Analysis stopped by user');
    addNotification('Analysis stopped', 'warning');
  }, []);


  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'price_update': return '📊';
      case 'signal_generated': return '🎯';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'system': return '⚙️';
      default: return '📝';
    }
  };

  const getActivityColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'price_update': return 'text-blue-400';
      case 'signal_generated': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-yellow-400';
      case 'system': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };


  // Save prices to local storage
  const savePricesToStorage = (prices: FuturesPrice[]) => {
    try {
      localStorage.setItem('futures_prices', JSON.stringify(prices));
      addActivityLog('info', `Saved ${prices.length} prices to local storage`);
    } catch (error) {
      addActivityLog('error', `Failed to save prices to storage: ${error}`);
    }
  };

  // Enhanced Fetch futures prices with real-time updates
  const fetchFuturesPrices = async () => {
    try {
      setIsLoading(true);
      setConnectionStatus('connecting');
      addActivityLog('system', 'Fetching real-time futures prices...');
      
      const tickers = Object.values(futuresTickers).join(',');
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${FUTURES_API_BASE}/api/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: Object.values(futuresTickers),
          timeframe: selectedTimeframe,
          range: '1d'
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Futures data service response:', result);
        console.log('futuresNames mapping:', futuresNames);

        if (result.success && result.data) {
          const newPrices: FuturesPrice[] = result.data
            .filter((priceData: any) => priceData && priceData.price)
            .map((priceData: any) => {
              const assetName = Object.keys(futuresTickers).find(key => futuresTickers[key as keyof typeof futuresTickers] === priceData.symbol) || priceData.symbol;
              const displayName = futuresNames[assetName as keyof typeof futuresNames] || priceData.name || assetName;
              const price = priceData.price;
              
              console.log(`Mapping ${priceData.symbol}: assetName=${assetName}, displayName=${displayName}, name=${priceData.name}`);
              
              // Update price history for technical analysis
              updatePriceHistory(assetName, price);
              
              return {
                symbol: assetName, // Display name like 'SP500'
                ticker: priceData.symbol, // Original ticker like 'ES=F'
                name: displayName, // Proper display name like 'E-Mini S&P 500 Sep 25'
                price: price,
                change: priceData.change,
                changePercent: priceData.changePercent,
                volume: priceData.volume,
                lastUpdate: new Date().toLocaleTimeString(),
                high24h: priceData.high24h,
                low24h: priceData.low24h,
                previousRate: price - priceData.change
              };
            });

          if (newPrices.length > 0) {
            setPrices(newPrices);
            savePricesToStorage(newPrices);
            setLastPriceUpdate(new Date().toLocaleTimeString());
            setConnectionStatus('connected');
            setLastUpdate(new Date());
            addActivityLog('price_update', `Updated prices for ${newPrices.length} assets`, newPrices);
            addNotification(`Updated ${newPrices.length} futures prices`, 'success');
          } else {
            throw new Error('No price data received from API');
          }
        } else {
          throw new Error('Invalid API response');
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching futures prices:', error);
      setConnectionStatus('disconnected');
      
      let errorMessage = 'Failed to fetch real-time prices';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - futures data service not responding';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to futures data service on port 10003';
        } else {
          errorMessage = `API Error: ${error.message}`;
        }
      }
      
      addActivityLog('error', errorMessage);
      addNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate futures signal
  const generateFuturesSignal = async () => {
    if (!selectedAsset || selectedAsset === 'all') {
      addActivityLog('error', 'Please select a specific asset to generate a signal');
      alert('Please select a specific asset to generate a signal');
      return;
    }

    try {
      setIsGenerating(true);
      addActivityLog('system', `Generating ${selectedTimeframe} signal for ${selectedAsset}...`);
      
      const response = await fetch(`${FUTURES_API_BASE}/api/forex/generate-signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: selectedAsset,
          timeframe: selectedTimeframe
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newSignal = data.signal;
        addActivityLog('signal_generated', `Backend signal generated for ${selectedAsset}`, newSignal);
        setSignals(prev => [newSignal, ...prev]);
        addActivityLog('info', 'Signal added to local signals list');
        await sendToDashboardFeed(newSignal);
        addActivityLog('info', 'Signal sent to dashboard feed');
        alert('Futures signal generated and sent to dashboard!');
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.error('Error generating futures signal:', error);
      addActivityLog('error', `Signal generation failed: ${error}`);
      alert('Error generating signal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };


  // Clean up old signals (older than 1 hour)
  const cleanupOldSignals = () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const storedSignals = JSON.parse(localStorage.getItem('futures_signals') || '[]');
    const recentSignals = storedSignals.filter((signal: FuturesSignal) => 
      new Date(signal.timestamp) > oneHourAgo
    );
    
    if (recentSignals.length !== storedSignals.length) {
      localStorage.setItem('futures_signals', JSON.stringify(recentSignals));
      setSignals(recentSignals);
      addActivityLog('system', `🧹 Cleaned up ${storedSignals.length - recentSignals.length} old signals`);
    }
  };

  // Load existing signals
  const loadSignals = () => {
    const storedSignals = JSON.parse(localStorage.getItem('futures_signals') || '[]');
    setSignals(storedSignals);
  };

  useEffect(() => {
    // Add initial activity logs
    addActivityLog('system', '🚀 Futures trading system initialized with forex bot integration');
    addActivityLog('info', 'Fetching real-time data from futures data service...');
    
    // Clear any existing prices to ensure fresh data
    setPrices([]);
    
    // Load signals from storage
    loadSignals();
    
    // Fetch real-time data from futures data service
    fetchFuturesPrices();
    
    // Auto-start the bot system immediately
    setTimeout(() => {
      addActivityLog('system', '🤖 Auto-starting futures analysis with all assets...');
      addActivityLog('system', '📊 Monitoring futures: SP500, NASDAQ, DOW, RUSSELL, CRUDE, GOLD, SILVER');
      addActivityLog('system', '⏱️ Analysis interval: 30 seconds | Bar extraction: 5 seconds');
      addActivityLog('system', 'Initializing analysis for 7 symbols...');
      
      // Start continuous analysis
      startAnalysis();
      
      // Set up continuous analysis every 30 seconds
      analysisIntervalRef.current = setInterval(() => {
        addActivityLog('system', '🔄 Scheduled analysis cycle triggered');
        cleanupOldSignals(); // Clean up old signals first
        startAnalysis();
      }, 30000);
      
      // Signal generation is now handled by the dedicated signals page
      addActivityLog('info', 'ℹ️ Signal generation moved to dedicated signals page');
    }, 2000); // Wait 2 seconds for initial data load
    
    // Refresh prices every 30 seconds
    priceUpdateIntervalRef.current = setInterval(() => {
      addActivityLog('system', 'Scheduled price update triggered');
      fetchFuturesPrices();
    }, 30000);
    
    // Heartbeat every 5 seconds
    const heartbeatInterval = setInterval(() => {
      setSystemHeartbeat(prev => prev + 1);
    }, 5000);
    
    return () => {
      if (priceUpdateIntervalRef.current) clearInterval(priceUpdateIntervalRef.current);
      if (signalGenerationIntervalRef.current) clearInterval(signalGenerationIntervalRef.current);
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
      clearInterval(heartbeatInterval);
      addActivityLog('system', 'Futures trading system stopped');
    };
  }, []);

  // Continuous Bar Extraction System - Always Running
  useEffect(() => {
    if (prices.length === 0) return;

    const barExtractionInterval = setInterval(() => {
      // Extract bars for all current prices
      prices.forEach(price => {
        if (selectedAsset === 'all' || price.symbol === selectedAsset) {
          extractBar(price.symbol, price.price, new Date());
        }
      });
    }, botConfig.bar_extraction_interval);

    return () => {
      clearInterval(barExtractionInterval);
    };
  }, [prices, selectedAsset]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (signalGenerationIntervalRef.current) {
        clearInterval(signalGenerationIntervalRef.current);
      }
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
    };
  }, []);

  const filteredPrices = selectedAsset === 'all' 
    ? prices 
    : prices.filter(price => price.symbol === selectedAsset);

  const filteredSignals = selectedAsset === 'all'
    ? signals
    : signals.filter(signal => signal.symbol === selectedAsset);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30 text-green-300'
                : notification.type === 'error'
                ? 'bg-red-500/20 border-red-500/30 text-red-300'
                : notification.type === 'warning'
                ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                notification.type === 'success' ? 'bg-green-400' :
                notification.type === 'error' ? 'bg-red-400' :
                notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
              }`}></div>
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>
      )}
      {/* Futuristic Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        
        <div className="relative z-10 container mx-auto px-6 py-12">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-4">
              FUTURES TRADING
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Advanced futures market analysis with real-time data and AI-powered signals
            </p>
            
            {/* Navigation to Signals Page */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-800/50 to-pink-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Futures Bot Signals</h2>
                      <p className="text-purple-300">Dedicated page for all futures bot signals</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="text-sm text-gray-300">Signals Active</span>
                  </div>
                </div>
                
                {/* Navigation Button */}
                <div className="flex space-x-4">
                  <a
                    href="/futures-signals"
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Brain className="w-5 h-5" />
                    <span>Open Signals Page</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Enhanced Control Panel with Forex Bot Integration */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Timeframe Selector */}
                <div>
                  <label className="block text-sm font-semibold text-cyan-400 mb-2">
                    <Target className="w-4 h-4 inline mr-1" />
                    Timeframe
                  </label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="w-full bg-gray-700/50 border border-cyan-500/50 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  >
                    {timeframes.map(tf => (
                      <option key={tf.value} value={tf.value}>{tf.label}</option>
                    ))}
                  </select>
                </div>

                {/* Asset Selector */}
                <div>
                  <label className="block text-sm font-semibold text-cyan-400 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Asset
                  </label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="w-full bg-gray-700/50 border border-cyan-500/50 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  >
                    {assets.map(asset => (
                      <option key={asset.value} value={asset.value}>{asset.label}</option>
                    ))}
                  </select>
                </div>

                {/* Generate Signal Button */}
                <div className="flex items-end">
                  <button
                    onClick={generateFuturesSignal}
                    disabled={isGenerating || selectedAsset === 'all'}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Generating...
                      </div>
                    ) : (
                      'Generate Signal'
                    )}
                  </button>
                </div>

                {/* Connection Status */}
                <div className="flex items-end">
                  <div className="w-full bg-gray-700/50 border border-cyan-500/50 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Status</span>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                          connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                          'bg-red-400'
                        }`}></div>
                        <span className="text-xs text-gray-300 capitalize">{connectionStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Forex Bot Controls */}
              <div className="mt-6 pt-6 border-t border-cyan-500/20">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Bot className="w-5 h-5 mr-2 text-green-400 animate-pulse" />
                  Forex Bot System Controls
                  <div className="ml-2 flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    <span className="text-xs text-green-400 font-normal">AUTO-RUNNING</span>
                  </div>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Signal Generation Controls */}
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-green-500/30">
                    <h4 className="text-sm font-semibold text-green-400 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-1" />
                      Signal Generation
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <span className="text-xs text-green-300">
                          Auto-generating signals every 60s
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <span className="text-xs text-gray-400">Signals handled by dedicated page</span>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis Controls */}
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-blue-500/30">
                    <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Market Analysis
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                        <span className="text-xs text-blue-300">
                          Auto-analyzing markets every 30s
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={startAnalysis}
                          disabled={isAnalysisRunning}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-all flex items-center justify-center"
                        >
                          <Activity className="w-3 h-3 mr-1" />
                          Analyze
                        </button>
                        <button
                          onClick={stopAnalysis}
                          disabled={!isAnalysisRunning}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-all flex items-center justify-center"
                        >
                          <Pause className="w-3 h-3 mr-1" />
                          Stop
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* System Stats */}
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-purple-500/30">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center">
                      <Database className="w-4 h-4 mr-1" />
                      System Stats
                    </h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Total Signals:</span>
                        <span className="text-white font-semibold">{stats.totalSignals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Active Signals:</span>
                        <span className="text-green-400 font-semibold">{stats.activeSignals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Success Rate:</span>
                        <span className="text-blue-400 font-semibold">{stats.successRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Real-time Prices */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-red-400'
                }`}></div>
                Real-time Prices
                <span className="ml-3 text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                  {filteredPrices.length}
                </span>
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Last Update: {lastPriceUpdate || 'Never'}
                </div>
                <button
                  onClick={fetchFuturesPrices}
                  disabled={isLoading}
                  className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition-colors flex items-center"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPrices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-gray-400 text-lg">No real-time prices available</p>
                    <p className="text-sm text-gray-500 mt-2">Make sure the futures data service is running on port 10003</p>
                    <div className="mt-4 flex justify-center space-x-2">
                      <button
                        onClick={fetchFuturesPrices}
                        disabled={isLoading}
                        className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 inline mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Fetching...' : 'Retry Fetch'}
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredPrices.map((price, index) => (
                    <div
                      key={`price-${price.symbol}-${price.ticker}-${price.lastUpdate}-${index}`}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:border-cyan-500/50 transition-all duration-300"
                    >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{price.name}</h3>
                        <p className="text-sm text-gray-400">{price.symbol}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">${Number(price.price).toFixed(2)}</p>
                        <p className={`text-sm ${price.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {price.change >= 0 ? '+' : ''}{Number(price.change).toFixed(2)} ({Number(price.changePercent).toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <span className="text-gray-400">Volume:</span> {price.volume.toLocaleString()}
                        </div>
                        <div>
                          <span className="text-gray-400">Updated:</span> {price.lastUpdate}
                        </div>
                        {price.high24h && price.low24h && (
                          <>
                            <div>
                              <span className="text-gray-400">24H High:</span> <span className="text-green-400">${price.high24h.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">24H Low:</span> <span className="text-red-400">${price.low24h.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Enhanced Generated Signals with Forex Bot Integration */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                Generated Signals
                <span className="ml-3 text-sm bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                  {filteredSignals.length}
                </span>
              </h2>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Last Update: {lastUpdate.toLocaleTimeString()}
                </div>
                <button
                  onClick={() => setSignals([])}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredSignals.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No signals generated yet</p>
                  <p className="text-sm text-gray-500 mt-2">Start the forex bot system or generate manual signals above</p>
                  <div className="mt-4 flex justify-center space-x-2">
                    <a
                      href="/futures-signals"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Brain className="w-4 h-4 inline mr-1" />
                      Go to Signals Page
                    </a>
                    <button
                      onClick={startAnalysis}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Activity className="w-4 h-4 inline mr-1" />
                      Analyze Now
                    </button>
                  </div>
                </div>
              ) : (
                filteredSignals.map((signal, index) => (
                  <div
                    key={`signal-${signal.id}-${signal.symbol}-${signal.timestamp}-${index}`}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50 hover:border-purple-500/50 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{signal.name || signal.symbol || 'Unknown Asset'}</h3>
                        <p className="text-sm text-gray-400">{signal.symbol || 'UNKNOWN'} ({signal.ticker || 'UNKNOWN'}) • {signal.timeframe || '1H'} • {signal.session || 'Unknown'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          signal.direction === 'LONG' 
                            ? 'bg-green-600/80 text-white' 
                            : 'bg-red-600/80 text-white'
                        }`}>
                          {signal.direction}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          signal.confidence >= 85 ? 'bg-green-500/20 text-green-300' :
                          signal.confidence >= 70 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {signal.confidence}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-400">Entry</p>
                        <p className="text-sm font-semibold text-white">${Number(signal.entry).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Stop Loss</p>
                        <p className="text-sm font-semibold text-red-400">${Number(signal.stopLoss).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Take Profit</p>
                        <p className="text-sm font-semibold text-green-400">${Number(signal.takeProfit).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Risk Management Info */}
                    {signal.riskReward && (
                      <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
                        <div>
                          <span className="text-gray-400">Risk-Reward:</span>
                          <span className="text-white ml-1">{signal.riskReward}:1</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Lot Size:</span>
                          <span className="text-white ml-1">{signal.lotSize || 0.01}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Signal Confirmations */}
                    {signal.confirmations && signal.confirmations.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-400 mb-2">Confirmations:</p>
                        <div className="flex flex-wrap gap-1">
                          {signal.confirmations.map((conf, idx) => (
                            <span
                              key={`conf-${signal.id}-${conf.id}-${idx}`}
                              className={`px-2 py-1 rounded text-xs ${
                                conf.status === 'bullish' ? 'bg-green-500/20 text-green-300' :
                                conf.status === 'bearish' ? 'bg-red-500/20 text-red-300' :
                                'bg-gray-500/20 text-gray-300'
                              }`}
                            >
                              {conf.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-400">Status: {signal.status}</span>
                        {signal.reasoning && (
                          <span className="text-xs text-gray-500 truncate max-w-xs" title={signal.reasoning}>
                            {signal.reasoning}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(signal.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    {signal.analysis && (
                      <div className="mt-3 p-3 bg-gray-600/30 rounded-lg">
                        <p className="text-sm text-gray-300">{signal.analysis}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Live Activity Log */}
        <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              Live Activity Log
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                Last Update: {lastPriceUpdate || 'Never'}
              </div>
              <div className="text-sm text-cyan-400">
                Heartbeat: {systemHeartbeat}
              </div>
              <button
                onClick={() => setActivityLog([])}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Clear Log
              </button>
            </div>
          </div>
          
          <div className="bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {activityLog.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-400">No activity yet</p>
                <p className="text-sm text-gray-500">Activity will appear here as the system runs</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activityLog.map((log, index) => (
                  <div
                    key={`log-${log.id}-${log.timestamp}-${index}`}
                    className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="text-lg">{getActivityIcon(log.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${getActivityColor(log.type)}`}>
                          {log.message}
                        </span>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                      {log.data && (
                        <div className="mt-1 text-xs text-gray-400">
                          {typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : log.data}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturesPage;
