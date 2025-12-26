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
      const parsedData = JSON.parse(data);
      
      // Calculate current account balance as initial balance + total P&L
      const questionnaireData = this.getQuestionnaireData();
      const initialBalance = parseFloat(questionnaireData?.accountSize || questionnaireData?.accountEquity || '10000');
      const currentBalance = initialBalance + (parsedData.totalPnl || 0);
      
      // Update the account balance to reflect current value (round to 2 decimal places)
      parsedData.accountBalance = Math.round(currentBalance * 100) / 100;
      
      // Don't update account balance from questionnaire if user has trading data
      // Only update if this is the first time or if there's no trading history
      if (parsedData.totalTrades === 0) {
        if (questionnaireData) {
          const questionnaireBalance = questionnaireData?.accountSize || questionnaireData?.accountEquity;
          if (questionnaireBalance) {
            // Only update account balance if no trades have been made yet
            parsedData.accountBalance = questionnaireBalance;
            this.saveAccountData(parsedData);
          }
        }
      }
      return parsedData;
    } else {
      // Try to restore from backup first
      const backupData = this.restoreFromBackup();
      if (backupData) {
        return backupData;
      }
      
      // If no backup, initialize with user's actual account data from questionnaire
      const accountData = this.getDefaultAccountData();
      this.saveAccountData(accountData);
      return accountData;
    }
  }

  // Save user-specific account data
  public saveAccountData(data: any): void {
    if (!this.userEmail) return;
    
    const key = `account_data_${this.userEmail}`;
    // Add timestamp to track when data was last saved
    const dataWithTimestamp = {
      ...data,
      lastSaved: new Date().toISOString(),
      version: '1.0'
    };
    localStorage.setItem(key, JSON.stringify(dataWithTimestamp));
    
    // Also save a backup copy
    const backupKey = `account_data_backup_${this.userEmail}`;
    localStorage.setItem(backupKey, JSON.stringify(dataWithTimestamp));
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
    const newTotalTrades = accountData.totalTrades + 1;
    const newWins = pnl > 0 ? (accountData.wins || 0) + 1 : (accountData.wins || 0);
    
    const updatedData = {
      ...accountData,
      totalPnl: accountData.totalPnl + pnl,
      totalTrades: newTotalTrades,
      wins: newWins,
      winRate: this.calculateWinRate(newTotalTrades, newWins)
      // Note: accountBalance will be calculated by getAccountData() as initialBalance + totalPnl
    };

    this.saveAccountData(updatedData);
    
    // Force immediate save to ensure persistence
    this.forceSave();
  }

  // Force save all data to ensure persistence
  public forceSave(): void {
    if (!this.userEmail) return;
    
    // Save account data
    const accountData = this.getAccountData();
    if (accountData) {
      this.saveAccountData(accountData);
    }
    
    // Save trading state
    const tradingState = this.getTradingState();
    if (tradingState) {
      this.saveTradingState(tradingState);
    }
    
    // Save taken signals
    const takenSignals = this.getTakenSignals();
    if (takenSignals) {
      this.saveTakenSignals(takenSignals);
    }
  }

  // Calculate win rate
  private calculateWinRate(totalTrades: number, wins: number): number {
    return totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  }

  // Get default account data based on user's questionnaire data
  private getDefaultAccountData(): any {
    // Try to get user's actual account data from questionnaire
    const questionnaireData = this.getQuestionnaireData();
    const accountBalance = parseFloat(questionnaireData?.accountSize || questionnaireData?.accountEquity || '10000');
    
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

  // Restore data from backup if main data is missing
  public restoreFromBackup(): any {
    if (!this.userEmail) return null;
    
    const backupKey = `account_data_backup_${this.userEmail}`;
    const backupData = localStorage.getItem(backupKey);
    
    if (backupData) {
      const parsedData = JSON.parse(backupData);
      // Restore the main data
      this.saveAccountData(parsedData);
      return parsedData;
    }
    
    return null;
  }

  // Clear all user data (for testing) - but keep backup
  public clearUserData(): void {
    if (!this.userEmail) return;
    
    const keys = [
      `account_data_${this.userEmail}`,
      `trading_state_${this.userEmail}`,
      `taken_signals_${this.userEmail}`
    ];
    
    keys.forEach(key => localStorage.removeItem(key));
    // Note: We keep the backup data for recovery
  }
}

export const userDataService = UserDataService.getInstance();
