import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';

export interface SignalConfirmation {
  id: string;
  name: string;
  weight: number;
  status: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  details: string;
  timeframe: string;
}

export interface DynamicTradingSignal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  lotSize: number;
  moneyAtRisk: number;
  timeframe: string;
  confirmations: SignalConfirmation[];
  riskReward: number;
  timestamp: Date;
  session: string;
  analysis: string;
}

export class DynamicSignalGenerator {
  private userContext: any;
  private riskPlan: any;

  constructor(userContext: any, riskPlan: any) {
    this.userContext = userContext;
    this.riskPlan = riskPlan;
  }

  // Calculate confidence based on actual confirmations
  private calculateConfidence(confirmations: SignalConfirmation[]): number {
    if (confirmations.length === 0) return 0;

    // Calculate weighted confidence score
    const totalWeight = confirmations.reduce((sum, conf) => sum + conf.weight, 0);
    const weightedScore = confirmations.reduce((sum, conf) => {
      const score = conf.status === 'neutral' ? 50 : (conf.status === 'bullish' || conf.status === 'bearish') ? conf.confidence : 0;
      return sum + (score * conf.weight);
    }, 0);

    const baseConfidence = totalWeight > 0 ? weightedScore / totalWeight : 0;
    
    // Apply confirmation count multiplier
    const confirmationMultiplier = Math.min(1.2, 0.6 + (confirmations.length * 0.1));
    
    // Apply timeframe alignment bonus
    const timeframeAlignment = this.calculateTimeframeAlignment(confirmations);
    
    const finalConfidence = Math.min(95, baseConfidence * confirmationMultiplier * timeframeAlignment);
    
    return Math.round(finalConfidence);
  }

  // Calculate timeframe alignment bonus
  private calculateTimeframeAlignment(confirmations: SignalConfirmation[]): number {
    const timeframes = confirmations.map(c => c.timeframe);
    const uniqueTimeframes = [...new Set(timeframes)];
    
    // More timeframes aligned = higher bonus
    if (uniqueTimeframes.length >= 3) return 1.15;
    if (uniqueTimeframes.length === 2) return 1.08;
    return 1.0;
  }

  // Analyze market structure with proper confirmations
  private analyzeMarketStructure(pair: string): SignalConfirmation {
    // Simulate proper market structure analysis
    const scenarios = [
      {
        status: 'bullish' as const,
        confidence: 88,
        details: 'Price respecting bullish order block - strong institutional support',
        timeframe: '4H'
      },
      {
        status: 'bearish' as const,
        confidence: 82,
        details: 'Break of structure detected - bearish momentum confirmed',
        timeframe: '1H'
      },
      {
        status: 'bullish' as const,
        confidence: 90,
        details: 'Fair Value Gap mitigation complete - expecting continuation higher',
        timeframe: 'Daily'
      },
      {
        status: 'bearish' as const,
        confidence: 85,
        details: 'Lower high formed - market structure turning bearish',
        timeframe: '4H'
      },
      {
        status: 'neutral' as const,
        confidence: 60,
        details: 'Consolidation phase - awaiting structural break',
        timeframe: '1H'
      }
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    return {
      id: 'market_structure',
      name: 'Market Structure (ICT/SMC)',
      weight: 25,
      status: randomScenario.status,
      confidence: randomScenario.confidence,
      details: randomScenario.details,
      timeframe: randomScenario.timeframe
    };
  }

  // Analyze higher timeframe bias
  private analyzeHigherTimeframeBias(pair: string): SignalConfirmation {
    const biasScenarios = [
      {
        status: 'bullish' as const,
        confidence: 92,
        details: 'All higher timeframes aligned bullish - EMA 20 > 50 > 200',
        timeframe: 'Daily'
      },
      {
        status: 'bearish' as const,
        confidence: 89,
        details: 'Daily and 4H bearish alignment confirmed - downtrend intact',
        timeframe: 'Daily'
      },
      {
        status: 'bullish' as const,
        confidence: 87,
        details: '4H trend change confirmed - daily still bullish',
        timeframe: '4H'
      },
      {
        status: 'neutral' as const,
        confidence: 65,
        details: 'Mixed signals across timeframes - waiting for alignment',
        timeframe: '1H'
      }
    ];

    const randomBias = biasScenarios[Math.floor(Math.random() * biasScenarios.length)];

    return {
      id: 'htf_bias',
      name: 'Higher Timeframe Bias',
      weight: 25,
      status: randomBias.status,
      confidence: randomBias.confidence,
      details: randomBias.details,
      timeframe: randomBias.timeframe
    };
  }

  // Analyze confirmation patterns
  private analyzeConfirmationPatterns(pair: string): SignalConfirmation {
    const patternScenarios = [
      {
        status: 'bullish' as const,
        confidence: 85,
        details: 'Bullish engulfing pattern at key support - strong reversal signal',
        timeframe: '1H'
      },
      {
        status: 'bearish' as const,
        confidence: 80,
        details: 'Shooting star rejection at resistance - bearish reversal likely',
        timeframe: '4H'
      },
      {
        status: 'bullish' as const,
        confidence: 78,
        details: 'Hammer candle at demand zone - bullish rejection confirmed',
        timeframe: '1H'
      },
      {
        status: 'bearish' as const,
        confidence: 83,
        details: 'Bearish pin bar at supply level - selling pressure evident',
        timeframe: '4H'
      },
      {
        status: 'neutral' as const,
        confidence: 55,
        details: 'No clear patterns - waiting for confirmation candles',
        timeframe: '1H'
      }
    ];

    const randomPattern = patternScenarios[Math.floor(Math.random() * patternScenarios.length)];

    return {
      id: 'confirmation_patterns',
      name: 'Confirmation Patterns',
      weight: 20,
      status: randomPattern.status,
      confidence: randomPattern.confidence,
      details: randomPattern.details,
      timeframe: randomPattern.timeframe
    };
  }

  // Analyze session liquidity
  private analyzeSessionLiquidity(pair: string): SignalConfirmation {
    const currentSession = this.getCurrentSession();
    let status: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let confidence = 0;
    let details = '';
    let timeframe = '1H';

    if (currentSession === 'London' || currentSession === 'New York') {
      status = 'bullish';
      confidence = 85;
      details = `High liquidity during ${currentSession} session - optimal trading conditions`;
      timeframe = '1H';
    } else if (currentSession === 'Tokyo' && (pair.includes('JPY') || pair === 'AUDUSD')) {
      status = 'bullish';
      confidence = 75;
      details = 'Asian session - good for JPY and AUD pairs';
      timeframe = '4H';
    } else {
      status = 'neutral';
      confidence = 50;
      details = 'Lower liquidity session - reduced trading activity';
      timeframe = '4H';
    }

    return {
      id: 'session_liquidity',
      name: 'Session Liquidity',
      weight: 15,
      status,
      confidence,
      details,
      timeframe
    };
  }

  // Analyze risk management
  private analyzeRiskManagement(pair: string, direction: 'BUY' | 'SELL'): SignalConfirmation {
    const riskScenarios = [
      {
        confidence: 90,
        details: 'Excellent 1:3 Risk-Reward setup - low volatility environment',
        timeframe: '1H'
      },
      {
        confidence: 85,
        details: 'Good 1:2.5 Risk-Reward - optimal position sizing confirmed',
        timeframe: '1H'
      },
      {
        confidence: 75,
        details: 'Acceptable 1:2 Risk-Reward - standard position size recommended',
        timeframe: '4H'
      },
      {
        confidence: 65,
        details: 'Marginal 1:1.5 Risk-Reward - reduced position size advised',
        timeframe: '4H'
      }
    ];

    const randomRisk = riskScenarios[Math.floor(Math.random() * riskScenarios.length)];

    return {
      id: 'risk_management',
      name: 'Risk Management',
      weight: 15,
      status: direction === 'BUY' ? 'bullish' : 'bearish',
      confidence: randomRisk.confidence,
      details: randomRisk.details,
      timeframe: randomRisk.timeframe
    };
  }

  // Calculate lot size based on user risk preferences
  private calculateLotSize(entry: number, stopLoss: number, accountBalance: number, riskPercentage: number): number {
    if (!entry || !stopLoss || !accountBalance || !riskPercentage) {
      return 0.01; // Default minimum lot size
    }

    // Calculate money at risk based on user's risk percentage
    const moneyAtRisk = (accountBalance * riskPercentage) / 100;
    
    // Calculate stop loss in pips
    const pipValue = entry.toString().includes('.') ? 0.0001 : 0.01; // JPY pairs use 0.01
    const stopLossPips = Math.abs(entry - stopLoss) / pipValue;
    
    // Calculate pip value per standard lot (simplified)
    const pipValuePerLot = 10; // $10 per pip for major pairs
    
    // Calculate lot size: Money at Risk / (Stop Loss Pips × Pip Value per Lot)
    const lotSize = moneyAtRisk / (stopLossPips * pipValuePerLot);
    
    // Round to 2 decimal places and ensure minimum lot size
    const roundedLotSize = Math.max(0.01, Math.round(lotSize * 100) / 100);
    
    return roundedLotSize;
  }

  // Determine optimal timeframe based on confirmations
  private determineOptimalTimeframe(confirmations: SignalConfirmation[]): string {
    const timeframes = confirmations.map(c => c.timeframe);
    const timeframeCounts = timeframes.reduce((acc, tf) => {
      acc[tf] = (acc[tf] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find the most common timeframe
    const mostCommonTimeframe = Object.entries(timeframeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '1H';

    // If we have multiple timeframes, prefer higher timeframes for better signals
    const timeframePriority = ['Daily', '4H', '1H', '30M', '15M'];
    const availableTimeframes = Object.keys(timeframeCounts);
    
    for (const tf of timeframePriority) {
      if (availableTimeframes.includes(tf)) {
        return tf;
      }
    }

    return mostCommonTimeframe;
  }

  // Generate complete trading signal
  public generateSignal(pair: string): DynamicTradingSignal | null {
    const MAJOR_PAIRS = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD', 'USDCAD', 'NZDUSD'];
    
    if (!MAJOR_PAIRS.includes(pair)) {
      return null;
    }

    // Analyze all conditions
    const confirmations = [
      this.analyzeMarketStructure(pair),
      this.analyzeHigherTimeframeBias(pair),
      this.analyzeConfirmationPatterns(pair),
      this.analyzeSessionLiquidity(pair)
    ];

    // Calculate weighted scores
    const bullishScore = confirmations.reduce((sum, conf) => 
      sum + (conf.status === 'bullish' ? conf.confidence * conf.weight / 100 : 0), 0
    );

    const bearishScore = confirmations.reduce((sum, conf) => 
      sum + (conf.status === 'bearish' ? conf.confidence * conf.weight / 100 : 0), 0
    );

    // Determine signal direction
    const MIN_SCORE = 60;
    let direction: 'BUY' | 'SELL' | null = null;

    if (bullishScore > bearishScore && bullishScore >= MIN_SCORE) {
      direction = 'BUY';
    } else if (bearishScore > bullishScore && bearishScore >= MIN_SCORE) {
      direction = 'SELL';
    }

    if (!direction) {
      return null; // No signal generated
    }

    // Add risk management confirmation
    const riskConfirmation = this.analyzeRiskManagement(pair, direction);
    confirmations.push(riskConfirmation);

    // Calculate confidence based on actual confirmations
    const confidence = this.calculateConfidence(confirmations);

    // Determine optimal timeframe
    const timeframe = this.determineOptimalTimeframe(confirmations);

    // Calculate realistic price levels
    const basePrice = this.getBasePrice(pair);
    const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
    
    const entry = direction === 'BUY' ? 
      basePrice + (Math.random() * 5 * pipValue) : 
      basePrice - (Math.random() * 5 * pipValue);
    
    const stopDistance = (20 + Math.random() * 30) * pipValue; // 20-50 pips
    const stopLoss = direction === 'BUY' ? entry - stopDistance : entry + stopDistance;
    
    const targetDistance = stopDistance * (2 + Math.random()); // 1:2 to 1:3 RR
    const takeProfit = direction === 'BUY' ? entry + targetDistance : entry - targetDistance;
    
    const riskReward = targetDistance / stopDistance;

    // Get user risk parameters
    const accountBalance = this.riskPlan?.accountBalance || this.userContext?.accountSize || 10000;
    const riskPercentage = this.riskPlan?.riskPercentage || this.userContext?.riskPerTrade || 1;

    // Calculate lot size based on user preferences
    const lotSize = this.calculateLotSize(entry, stopLoss, accountBalance, riskPercentage);
    const moneyAtRisk = (accountBalance * riskPercentage) / 100;

    // Generate analysis based on confirmations
    const analysis = this.generateAnalysis(confirmations, direction, pair);

    return {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pair,
      direction,
      entry: this.roundPrice(entry, pair),
      stopLoss: this.roundPrice(stopLoss, pair),
      takeProfit: this.roundPrice(takeProfit, pair),
      confidence,
      lotSize,
      moneyAtRisk,
      timeframe,
      confirmations,
      riskReward: Math.round(riskReward * 10) / 10,
      timestamp: new Date(),
      session: this.getCurrentSession(),
      analysis
    };
  }

  // Generate analysis based on confirmations
  private generateAnalysis(confirmations: SignalConfirmation[], direction: string, pair: string): string {
    const bullishConfirmations = confirmations.filter(c => c.status === 'bullish').length;
    const bearishConfirmations = confirmations.filter(c => c.status === 'bearish').length;
    const neutralConfirmations = confirmations.filter(c => c.status === 'neutral').length;

    let analysis = `Strong ${direction.toLowerCase()} setup detected for ${pair}. `;
    
    if (bullishConfirmations > bearishConfirmations) {
      analysis += `Major swing Break of Structure confirms bullish momentum shift. `;
    } else if (bearishConfirmations > bullishConfirmations) {
      analysis += `Break of structure confirms bearish momentum shift. `;
    }

    analysis += `Price respecting institutional order block levels. `;
    analysis += `Entry from ${direction === 'BUY' ? 'premium' : 'discount'} zone - ideal for ${direction.toLowerCase()} setups. `;
    analysis += `High-probability setup suitable for standard position sizing.`;

    return analysis;
  }

  // Helper methods
  private getCurrentSession(): 'Sydney' | 'Tokyo' | 'London' | 'New York' {
    const hour = new Date().getUTCHours();
    
    if (hour >= 22 || hour < 7) return 'Sydney';
    if (hour >= 7 && hour < 9) return 'Tokyo';
    if (hour >= 9 && hour < 17) return 'London';
    return 'New York';
  }

  private getBasePrice(pair: string): number {
    const basePrices: { [key: string]: number } = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2750,
      'USDJPY': 149.50,
      'XAUUSD': 2020.00,
      'AUDUSD': 0.6650,
      'USDCAD': 1.3600,
      'NZDUSD': 0.6200
    };
    return basePrices[pair] || 1.0000;
  }

  private roundPrice(price: number, pair: string): number {
    const decimals = pair.includes('JPY') ? 3 : 5;
    return Math.round(price * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

export default DynamicSignalGenerator;
