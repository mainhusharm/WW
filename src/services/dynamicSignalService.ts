import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import DynamicSignalGenerator, { DynamicTradingSignal } from './dynamicSignalGenerator';

export interface Signal {
  id: string;
  symbol: string;
  pair: string;
  action: 'BUY' | 'SELL';
  direction: 'BUY' | 'SELL';
  type: 'BUY' | 'SELL';
  entry: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  lotSize: number;
  moneyAtRisk: number;
  timeframe: string;
  riskReward: number;
  rrRatio: string;
  timestamp: Date;
  createdAt: Date;
  status: string;
  analysis: string;
  description: string;
  market: 'forex' | 'crypto';
  is_recommended?: boolean;
  riskTier?: string;
}

class DynamicSignalService {
  private static instance: DynamicSignalService;
  private signalGenerator: DynamicSignalGenerator | null = null;
  private userContext: any = null;
  private riskPlan: any = null;

  private constructor() {}

  public static getInstance(): DynamicSignalService {
    if (!DynamicSignalService.instance) {
      DynamicSignalService.instance = new DynamicSignalService();
    }
    return DynamicSignalService.instance;
  }

  public setUserContext(userContext: any, riskPlan: any) {
    this.userContext = userContext;
    this.riskPlan = riskPlan;
    this.signalGenerator = new DynamicSignalGenerator(userContext, riskPlan);
  }

  public generateSignal(pair: string): Signal | null {
    if (!this.signalGenerator) {
      console.error('Signal generator not initialized. Please set user context first.');
      return null;
    }

    const dynamicSignal = this.signalGenerator.generateSignal(pair);
    if (!dynamicSignal) {
      return null;
    }

    // Convert dynamic signal to standard signal format
    return {
      id: dynamicSignal.id,
      symbol: dynamicSignal.pair,
      pair: dynamicSignal.pair,
      action: dynamicSignal.direction,
      direction: dynamicSignal.direction,
      type: dynamicSignal.direction,
      entry: dynamicSignal.entry,
      entryPrice: dynamicSignal.entry,
      stopLoss: dynamicSignal.stopLoss,
      takeProfit: dynamicSignal.takeProfit,
      confidence: dynamicSignal.confidence,
      lotSize: dynamicSignal.lotSize,
      moneyAtRisk: dynamicSignal.moneyAtRisk,
      timeframe: dynamicSignal.timeframe,
      riskReward: dynamicSignal.riskReward,
      rrRatio: `1:${dynamicSignal.riskReward.toFixed(1)}`,
      timestamp: dynamicSignal.timestamp,
      createdAt: dynamicSignal.timestamp,
      status: 'active',
      analysis: dynamicSignal.analysis,
      description: dynamicSignal.analysis,
      market: this.determineMarket(pair),
      is_recommended: dynamicSignal.confidence >= 80,
      riskTier: this.determineRiskTier(dynamicSignal.confidence)
    };
  }

  public generateMultipleSignals(pairs: string[]): Signal[] {
    const signals: Signal[] = [];
    
    for (const pair of pairs) {
      const signal = this.generateSignal(pair);
      if (signal) {
        signals.push(signal);
      }
    }

    return signals;
  }

  private determineMarket(pair: string): 'forex' | 'crypto' {
    const cryptoPairs = ['BTCUSD', 'ETHUSD', 'XRPUSD', 'ADAUSD', 'DOTUSD'];
    return cryptoPairs.includes(pair) ? 'crypto' : 'forex';
  }

  private determineRiskTier(confidence: number): string {
    if (confidence >= 90) return 'high';
    if (confidence >= 80) return 'medium';
    if (confidence >= 70) return 'low';
    return 'very_low';
  }

  // Calculate lot size for any signal based on user preferences
  public calculateLotSize(signal: Signal, userContext: any, riskPlan: any): number {
    if (!signal.entryPrice || !signal.stopLoss) {
      return 0.01;
    }

    const accountBalance = riskPlan?.accountBalance || riskPlan?.accountSize || userContext?.accountSize || 10000;
    const riskPercentage = riskPlan?.riskPercentage || riskPlan?.riskPerTrade || userContext?.riskPerTrade || 1;

    // Calculate money at risk
    const moneyAtRisk = (accountBalance * riskPercentage) / 100;
    
    // Calculate stop loss in pips
    const pipValue = signal.symbol.includes('JPY') ? 0.01 : 0.0001;
    const stopLossPips = Math.abs(signal.entryPrice - signal.stopLoss) / pipValue;
    
    // Calculate lot size: Money at Risk / (Stop Loss Pips × Pip Value per Lot)
    const pipValuePerLot = 10; // $10 per pip for major pairs
    const lotSize = Math.max(0.01, moneyAtRisk / (stopLossPips * pipValuePerLot));
    
    return Math.round(lotSize * 100) / 100;
  }

  // Calculate confidence based on actual confirmations
  public calculateConfidence(confirmations: any[]): number {
    if (confirmations.length === 0) return 0;

    const totalWeight = confirmations.reduce((sum, conf) => sum + (conf.weight || 1), 0);
    const weightedScore = confirmations.reduce((sum, conf) => {
      const score = conf.status === 'neutral' ? 50 : (conf.status === 'bullish' || conf.status === 'bearish') ? conf.confidence : 0;
      return sum + (score * (conf.weight || 1));
    }, 0);

    const baseConfidence = totalWeight > 0 ? weightedScore / totalWeight : 0;
    const confirmationMultiplier = Math.min(1.2, 0.6 + (confirmations.length * 0.1));
    
    return Math.min(95, Math.round(baseConfidence * confirmationMultiplier));
  }
}

export default DynamicSignalService.getInstance();
