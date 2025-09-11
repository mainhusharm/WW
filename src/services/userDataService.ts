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
    return data ? JSON.parse(data) : this.getDefaultAccountData();
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

  // Calculate P&L from signal data
  public calculatePnL(signal: any, outcome: 'Target Hit' | 'Stop Loss Hit' | 'Breakeven'): number {
    const entryPrice = parseFloat(signal.entry || signal.entryPrice || '0');
    const stopLoss = parseFloat(signal.stopLoss || '0');
    const takeProfit = parseFloat(Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0');
    
    // Use the dollar amounts from the signal if available, otherwise calculate
    let pnl = 0;
    
    switch (outcome) {
      case 'Target Hit':
        // Use take profit dollar amount if available, otherwise calculate
        if (signal.takeProfitDollar) {
          pnl = parseFloat(signal.takeProfitDollar);
        } else if (signal.takeProfitAmount) {
          pnl = parseFloat(signal.takeProfitAmount);
        } else if (entryPrice > 0 && takeProfit > 0) {
          // Calculate based on price difference and lot size
          const lotSize = parseFloat(signal.lotSize || '0.1');
          const pipValue = 10; // Standard pip value for most forex pairs
          const pips = Math.abs(takeProfit - entryPrice) * 10000; // Convert to pips
          pnl = pips * pipValue * lotSize;
        }
        break;
      case 'Stop Loss Hit':
        // Use stop loss dollar amount if available, otherwise calculate
        if (signal.stopLossDollar) {
          pnl = -Math.abs(parseFloat(signal.stopLossDollar)); // Negative for loss
        } else if (signal.stopLossAmount) {
          pnl = -Math.abs(parseFloat(signal.stopLossAmount));
        } else if (entryPrice > 0 && stopLoss > 0) {
          // Calculate based on price difference and lot size
          const lotSize = parseFloat(signal.lotSize || '0.1');
          const pipValue = 10; // Standard pip value for most forex pairs
          const pips = Math.abs(entryPrice - stopLoss) * 10000; // Convert to pips
          pnl = -(pips * pipValue * lotSize); // Negative for loss
        }
        break;
      case 'Breakeven':
        pnl = 0;
        break;
    }

    return Math.round(pnl * 100) / 100; // Round to 2 decimal places
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

  // Get default account data
  private getDefaultAccountData(): any {
    return {
      accountBalance: 10000,
      totalPnl: 0,
      totalTrades: 0,
      wins: 0,
      winRate: 0
    };
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
