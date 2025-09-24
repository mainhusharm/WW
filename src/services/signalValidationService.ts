export interface SignalValidation {
  isValid: boolean;
  confidence: number;
  riskScore: number;
  warnings: string[];
  recommendations: string[];
}

export interface SignalData {
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  price: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  indicators: Record<string, any>;
  volume: number;
  marketCap?: number;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  isActive: boolean;
  validate: (signal: SignalData) => Promise<boolean>;
}

class SignalValidationService {
  private validationRules: ValidationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.validationRules = [
      {
        id: '1',
        name: 'Price Action Validation',
        description: 'Validates price action patterns and support/resistance levels',
        weight: 0.25,
        isActive: true,
        validate: async (signal: SignalData) => {
          // Implement price action validation logic
          return true;
        }
      },
      {
        id: '2',
        name: 'Volume Confirmation',
        description: 'Ensures volume supports the signal direction',
        weight: 0.20,
        isActive: true,
        validate: async (signal: SignalData) => {
          // Implement volume validation logic
          return signal.volume > 0;
        }
      },
      {
        id: '3',
        name: 'Risk-Reward Ratio',
        description: 'Validates the risk-reward ratio is acceptable',
        weight: 0.20,
        isActive: true,
        validate: async (signal: SignalData) => {
          const risk = Math.abs(signal.price - signal.stopLoss);
          const reward = Math.abs(signal.targetPrice - signal.price);
          return reward / risk >= 1.5;
        }
      },
      {
        id: '4',
        name: 'Market Trend Alignment',
        description: 'Checks if signal aligns with overall market trend',
        weight: 0.15,
        isActive: true,
        validate: async (signal: SignalData) => {
          // Implement market trend validation logic
          return true;
        }
      },
      {
        id: '5',
        name: 'Volatility Check',
        description: 'Ensures volatility is within acceptable range',
        weight: 0.10,
        isActive: true,
        validate: async (signal: SignalData) => {
          // Implement volatility validation logic
          return true;
        }
      },
      {
        id: '6',
        name: 'Liquidity Validation',
        description: 'Checks if the asset has sufficient liquidity',
        weight: 0.10,
        isActive: true,
        validate: async (signal: SignalData) => {
          // Implement liquidity validation logic
          return signal.marketCap ? signal.marketCap > 1000000 : true;
        }
      }
    ];
  }

  async validateSignal(signal: SignalData): Promise<SignalValidation> {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    // Run all active validation rules
    for (const rule of this.validationRules) {
      if (!rule.isActive) continue;

      try {
        const isValid = await rule.validate(signal);
        if (isValid) {
          weightedScore += rule.weight;
        } else {
          warnings.push(`Failed ${rule.name}: ${rule.description}`);
        }
        totalWeight += rule.weight;
      } catch (error) {
        warnings.push(`Error in ${rule.name}: ${error}`);
      }
    }

    // Calculate confidence score
    const confidence = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

    // Calculate risk score based on signal characteristics
    const riskScore = this.calculateRiskScore(signal);

    // Generate recommendations
    if (confidence < 70) {
      recommendations.push('Consider waiting for stronger confirmation signals');
    }
    if (riskScore > 7) {
      recommendations.push('High risk signal - consider reducing position size');
    }
    if (signal.type === 'buy' && signal.price > signal.targetPrice * 0.95) {
      recommendations.push('Price close to target - consider adjusting entry');
    }

    return {
      isValid: confidence >= 60 && riskScore <= 8,
      confidence: Math.round(confidence),
      riskScore: Math.round(riskScore * 10) / 10,
      warnings,
      recommendations
    };
  }

  private calculateRiskScore(signal: SignalData): number {
    let riskScore = 0;

    // Risk based on timeframe
    const timeframeRisk = {
      '1m': 9, '5m': 8, '15m': 7, '1h': 6, '4h': 5, '1d': 4
    };
    riskScore += timeframeRisk[signal.timeframe as keyof typeof timeframeRisk] || 5;

    // Risk based on price distance from stop loss
    const stopLossDistance = Math.abs(signal.price - signal.stopLoss) / signal.price;
    if (stopLossDistance > 0.1) riskScore += 2;
    else if (stopLossDistance > 0.05) riskScore += 1;

    // Risk based on volume (if available)
    if (signal.volume < 1000000) riskScore += 1;

    // Risk based on market cap (if available)
    if (signal.marketCap && signal.marketCap < 10000000) riskScore += 1;

    return Math.min(riskScore, 10);
  }

  async validateMultipleSignals(signals: SignalData[]): Promise<SignalValidation[]> {
    const validations: SignalValidation[] = [];
    
    for (const signal of signals) {
      const validation = await this.validateSignal(signal);
      validations.push(validation);
    }

    return validations;
  }

  getValidationRules(): ValidationRule[] {
    return [...this.validationRules];
  }

  addValidationRule(rule: ValidationRule): void {
    this.validationRules.push(rule);
  }

  updateValidationRule(id: string, updates: Partial<ValidationRule>): void {
    const ruleIndex = this.validationRules.findIndex(r => r.id === id);
    if (ruleIndex !== -1) {
      this.validationRules[ruleIndex] = { ...this.validationRules[ruleIndex], ...updates };
    }
  }

  toggleValidationRule(id: string): void {
    const rule = this.validationRules.find(r => r.id === id);
    if (rule) {
      rule.isActive = !rule.isActive;
    }
  }

  removeValidationRule(id: string): void {
    this.validationRules = this.validationRules.filter(r => r.id !== id);
  }

  async getSignalHistory(symbol: string, days: number = 30): Promise<SignalData[]> {
    // This would typically fetch from an API
    // For now, return empty array
    return [];
  }

  async getValidationStats(): Promise<{
    totalSignals: number;
    validSignals: number;
    averageConfidence: number;
    averageRiskScore: number;
  }> {
    // This would typically fetch from an API
    // For now, return mock data
    return {
      totalSignals: 0,
      validSignals: 0,
      averageConfidence: 0,
      averageRiskScore: 0
    };
  }
}

export default new SignalValidationService();
