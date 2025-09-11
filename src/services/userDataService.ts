// User-specific data service to ensure each user has their own isolated data
export class UserDataService {
  private static instance: UserDataService;
  private userEmail: string | null = null;

  private constructor() {}

  public static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService();
    }
    return UserDataService.instance;
  }

  public setUserEmail(email: string): void {
    this.userEmail = email;
  }

  public getUserEmail(): string | null {
    return this.userEmail;
  }

  // Get user-specific account data
  public getAccountData(): any {
    if (!this.userEmail) return null;
    
    const key = `account_data_${this.userEmail}`;
    const data = localStorage.getItem(key);
    
    if (data) {
      return JSON.parse(data);
    } else {
      // Initialize with user's actual account data from questionnaire
      const accountData = this.getDefaultAccountData();
      this.saveAccountData(accountData);
      return accountData;
    }
  }

  // Save user-specific account data
  public saveAccountData(data: any): void {
    if (!this.userEmail) return;
    
    const key = `account_data_${this.userEmail}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Get user-specific trading state
  public getTradingState(): any {
    if (!this.userEmail) return null;
    
    const key = `trading_state_${this.userEmail}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : this.getDefaultTradingState();
  }

  // Save user-specific trading state
  public saveTradingState(state: any): void {
    if (!this.userEmail) return;
    
    const key = `trading_state_${this.userEmail}`;
    localStorage.setItem(key, JSON.stringify(state));
  }

  // Get user-specific taken signals
  public getTakenSignals(): string[] {
    if (!this.userEmail) return [];
    
    const key = `taken_signals_${this.userEmail}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // Save user-specific taken signals
  public saveTakenSignals(signals: string[]): void {
    if (!this.userEmail) return;
    
    const key = `taken_signals_${this.userEmail}`;
    localStorage.setItem(key, JSON.stringify(signals));
  }

  // Add a taken signal
  public addTakenSignal(signalId: string): void {
    const takenSignals = this.getTakenSignals();
    if (!takenSignals.includes(signalId)) {
      takenSignals.push(signalId);
      this.saveTakenSignals(takenSignals);
    }
  }

  // Calculate P&L from signal data based on user's actual account and risk settings
  public calculatePnL(signal: any, outcome: 'Target Hit' | 'Stop Loss Hit' | 'Breakeven'): number {
    const entryPrice = parseFloat(signal.entry || signal.entryPrice || '0');
    const stopLoss = parseFloat(signal.stopLoss || '0');
    const takeProfit = parseFloat(Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0');
    
    // Get user's actual account data and risk settings
    const questionnaireData = this.getQuestionnaireData();
    const accountBalance = questionnaireData?.accountSize || questionnaireData?.accountEquity || 10000;
    const riskPercentage = questionnaireData?.riskPercentage || 1;
    
    // Calculate money at risk based on user's actual risk percentage
    const moneyAtRisk = (accountBalance * riskPercentage) / 100;
    
    let pnl = 0;
    
    switch (outcome) {
      case 'Target Hit':
        // Use take profit dollar amount if available, otherwise calculate based on risk-reward ratio
        if (signal.takeProfitDollar) {
          pnl = parseFloat(signal.takeProfitDollar);
        } else if (signal.takeProfitAmount) {
          pnl = parseFloat(signal.takeProfitAmount);
        } else {
          // Calculate based on risk-reward ratio and user's money at risk
          const riskRewardRatio = this.calculateRiskRewardRatio(entryPrice, stopLoss, takeProfit);
          pnl = moneyAtRisk * riskRewardRatio;
        }
        break;
      case 'Stop Loss Hit':
        // Use stop loss dollar amount if available, otherwise use user's money at risk
        if (signal.stopLossDollar) {
          pnl = -Math.abs(parseFloat(signal.stopLossDollar));
        } else if (signal.stopLossAmount) {
          pnl = -Math.abs(parseFloat(signal.stopLossAmount));
        } else {
          // Use the user's actual money at risk as the loss
          pnl = -moneyAtRisk;
        }
        break;
      case 'Breakeven':
        pnl = 0;
        break;
    }

    return Math.round(pnl * 100) / 100; // Round to 2 decimal places
  }

  // Calculate risk-reward ratio
  private calculateRiskRewardRatio(entry: number, stopLoss: number, takeProfit: number): number {
    if (!entry || !stopLoss || !takeProfit) return 2; // Default 1:2 ratio
    
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    return risk > 0 ? reward / risk : 2;
  }

  // Update account balance based on P&L
  public updateAccountBalance(pnl: number): void {
    const accountData = this.getAccountData();
    const newBalance = accountData.accountBalance + pnl;
    
    const updatedData = {
      ...accountData,
      accountBalance: newBalance,
      totalPnl: accountData.totalPnl + pnl,
      totalTrades: accountData.totalTrades + 1,
      winRate: this.calculateWinRate(accountData.totalTrades + 1, accountData.wins + (pnl > 0 ? 1 : 0))
    };

    if (pnl > 0) {
      updatedData.wins = (updatedData.wins || 0) + 1;
    }

    this.saveAccountData(updatedData);
  }

  // Calculate win rate
  private calculateWinRate(totalTrades: number, wins: number): number {
    return totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  }

  // Get default account data based on user's questionnaire data
  private getDefaultAccountData(): any {
    // Try to get user's actual account data from questionnaire
    const questionnaireData = this.getQuestionnaireData();
    const accountBalance = questionnaireData?.accountSize || questionnaireData?.accountEquity || 10000;
    
    return {
      accountBalance: accountBalance,
      totalPnl: 0,
      totalTrades: 0,
      wins: 0,
      winRate: 0
    };
  }

  // Get questionnaire data
  private getQuestionnaireData(): any {
    try {
      const data = localStorage.getItem('questionnaireAnswers');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error parsing questionnaire data:', error);
      return null;
    }
  }

  // Get default trading state
  private getDefaultTradingState(): any {
    return {
      currentEquity: 10000,
      initialEquity: 10000,
      openPositions: [],
      trades: [],
      dailyStats: {
        pnl: 0,
        trades: 0
      },
      performanceMetrics: {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0
      }
    };
  }

  // Recalculate lot sizes for existing signals based on user's current account data
  public recalculateSignalLotSizes(signals: any[]): any[] {
    const questionnaireData = this.getQuestionnaireData();
    const accountBalance = questionnaireData?.accountSize || questionnaireData?.accountEquity || 10000;
    const riskPercentage = questionnaireData?.riskPercentage || 1;
    
    return signals.map(signal => {
      const entryPrice = parseFloat(signal.entry || signal.entryPrice || '0');
      const stopLoss = parseFloat(signal.stopLoss || '0');
      
      if (!entryPrice || !stopLoss) return signal;
      
      // Calculate money at risk based on user's actual risk percentage
      const moneyAtRisk = (accountBalance * riskPercentage) / 100;
      
      // Calculate stop loss in pips
      const symbol = signal.pair || signal.symbol || 'EURUSD';
      const pipValue = symbol.includes('JPY') ? 0.01 : 0.0001;
      const stopLossPips = Math.abs(entryPrice - stopLoss) / pipValue;
      
      // Calculate lot size: Money at Risk / (Stop Loss Pips × Pip Value per Lot)
      const pipValuePerLot = 10; // $10 per pip for major pairs
      const lotSize = Math.max(0.01, moneyAtRisk / (stopLossPips * pipValuePerLot));
      const roundedLotSize = Math.round(lotSize * 100) / 100;
      
      // Calculate dollar amounts
      const units = roundedLotSize * 100000;
      const stopLossDollar = Math.abs(entryPrice - stopLoss) * units;
      const takeProfit = parseFloat(Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0');
      const takeProfitDollar = takeProfit ? Math.abs(takeProfit - entryPrice) * units : 0;
      
      return {
        ...signal,
        lotSize: roundedLotSize,
        moneyAtRisk: moneyAtRisk,
        stopLossDollar: stopLossDollar,
        takeProfitDollar: takeProfitDollar
      };
    });
  }

  // Clear all user data (for testing)
  public clearUserData(): void {
    if (!this.userEmail) return;
    
    const keys = [
      `account_data_${this.userEmail}`,
      `trading_state_${this.userEmail}`,
      `taken_signals_${this.userEmail}`
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
  }
}

export const userDataService = UserDataService.getInstance();
