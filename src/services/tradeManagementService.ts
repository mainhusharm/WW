import { lotSizeCalculator, LotSizeCalculation } from './lotSizeCalculator';

export interface Trade {
  id: string;
  signalId: string;
  symbol: string;
  direction: 'long' | 'short';
  entryPrice: number;
  exitPrice?: number;
  lotSize: number;
  units: number;
  stopLoss: number;
  takeProfit: number;
  stopLossPips: number;
  takeProfitPips: number;
  moneyAtRisk: number;
  pipValue: number;
  contractSize: number;
  status: 'pending' | 'active' | 'won' | 'lost' | 'breakeven';
  pnl?: number;
  pnlPercentage?: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  notes?: string;
}

export interface AccountPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  totalPnL: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  currentDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  accountBalance: number;
  initialBalance: number;
}

class TradeManagementService {
  private baseUrl = '/api/trades';

  // Save trade to both localStorage and database
  async saveTrade(trade: Trade, userEmail: string): Promise<Trade> {
    try {
      // Save to localStorage for immediate access
      const existingTrades = this.getLocalTrades(userEmail);
      const updatedTrades = existingTrades.filter(t => t.id !== trade.id);
      updatedTrades.push(trade);
      localStorage.setItem(`trades_${userEmail}`, JSON.stringify(updatedTrades));

      // Try to save to database
      try {
        const response = await fetch(`${this.baseUrl}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...trade, userEmail })
        });
        
        if (response.ok) {
          const savedTrade = await response.json();
          return savedTrade;
        }
      } catch (dbError) {
        console.warn('Failed to save to database, using localStorage only:', dbError);
      }

      return trade;
    } catch (error) {
      console.error('Error saving trade:', error);
      throw error;
    }
  }

  // Get trades from localStorage (with database sync)
  async getTrades(userEmail: string): Promise<Trade[]> {
    try {
      // First try to get from database
      try {
        const response = await fetch(`${this.baseUrl}?userEmail=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const dbTrades = await response.json();
          // Update localStorage with database data
          localStorage.setItem(`trades_${userEmail}`, JSON.stringify(dbTrades));
          return dbTrades;
        }
      } catch (dbError) {
        console.warn('Failed to fetch from database, using localStorage:', dbError);
      }

      return this.getLocalTrades(userEmail);
    } catch (error) {
      console.error('Error fetching trades:', error);
      return this.getLocalTrades(userEmail);
    }
  }

  // Get trades from localStorage only
  private getLocalTrades(userEmail: string): Trade[] {
    const saved = localStorage.getItem(`trades_${userEmail}`);
    return saved ? JSON.parse(saved) : [];
  }

  // Create trade from signal
  async createTradeFromSignal(
    signal: any,
    userEmail: string,
    userRiskPlan: any
  ): Promise<Trade> {
    const symbol = signal.pair || signal.symbol || 'EURUSD';
    const direction = signal.signalType?.toLowerCase().includes('buy') ? 'long' : 'short';
    
    // Get risk parameters from user's plan
    const riskParams = lotSizeCalculator.getRiskParameters(userRiskPlan, symbol);
    
    // Calculate lot size and other parameters
    const calculation = lotSizeCalculator.calculateLotSize(riskParams);
    
    const trade: Trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      signalId: signal.id || `signal_${Date.now()}`,
      symbol,
      direction,
      entryPrice: calculation.stopLossPrice, // This will be updated with actual entry price
      stopLoss: calculation.stopLossPrice,
      takeProfit: calculation.takeProfitPrice,
      stopLossPips: calculation.stopLossPips,
      takeProfitPips: calculation.takeProfitPips,
      lotSize: calculation.lotSize,
      units: calculation.units,
      moneyAtRisk: calculation.moneyAtRisk,
      pipValue: calculation.pipValue,
      contractSize: calculation.contractSize,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: `Created from signal: ${signal.text || 'Trading signal'}`
    };

    return await this.saveTrade(trade, userEmail);
  }

  // Update trade status
  async updateTradeStatus(
    tradeId: string,
    status: Trade['status'],
    exitPrice?: number,
    userEmail: string
  ): Promise<Trade> {
    const trades = this.getLocalTrades(userEmail);
    const tradeIndex = trades.findIndex(t => t.id === tradeId);
    
    if (tradeIndex === -1) {
      throw new Error('Trade not found');
    }

    const trade = trades[tradeIndex];
    const updatedTrade = { ...trade };
    
    updatedTrade.status = status;
    updatedTrade.updatedAt = new Date().toISOString();
    
    if (exitPrice) {
      updatedTrade.exitPrice = exitPrice;
      updatedTrade.closedAt = new Date().toISOString();
      
      // Calculate P&L
      const pnl = lotSizeCalculator.calculatePnL(
        trade.entryPrice,
        exitPrice,
        trade.lotSize,
        trade.symbol,
        trade.direction === 'long'
      );
      
      updatedTrade.pnl = Math.round(pnl * 100) / 100;
      updatedTrade.pnlPercentage = Math.round((pnl / trade.moneyAtRisk) * 100 * 100) / 100;
    }

    trades[tradeIndex] = updatedTrade;
    localStorage.setItem(`trades_${userEmail}`, JSON.stringify(trades));

    // Update account performance
    await this.updateAccountPerformance(userEmail);

    return updatedTrade;
  }

  // Calculate account performance
  async calculateAccountPerformance(userEmail: string): Promise<AccountPerformance> {
    const trades = this.getLocalTrades(userEmail);
    const closedTrades = trades.filter(t => t.status === 'won' || t.status === 'lost' || t.status === 'breakeven');
    
    const winningTrades = closedTrades.filter(t => t.status === 'won');
    const losingTrades = closedTrades.filter(t => t.status === 'lost');
    const breakevenTrades = closedTrades.filter(t => t.status === 'breakeven');
    
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
    
    const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentStreak = 0;
    let currentStreakType: 'win' | 'loss' | null = null;
    
    for (const trade of closedTrades.reverse()) {
      if (trade.status === 'won') {
        if (currentStreakType === 'win') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = 'win';
        }
        consecutiveWins = Math.max(consecutiveWins, currentStreak);
      } else if (trade.status === 'lost') {
        if (currentStreakType === 'loss') {
          currentStreak++;
        } else {
          currentStreak = 1;
          currentStreakType = 'loss';
        }
        consecutiveLosses = Math.max(consecutiveLosses, currentStreak);
      }
    }
    
    // Calculate drawdown
    let maxDrawdown = 0;
    let currentDrawdown = 0;
    let peakBalance = 10000; // Initial balance
    let currentBalance = peakBalance + totalPnL;
    
    for (const trade of closedTrades) {
      currentBalance += trade.pnl || 0;
      if (currentBalance > peakBalance) {
        peakBalance = currentBalance;
        currentDrawdown = 0;
      } else {
        currentDrawdown = peakBalance - currentBalance;
        maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
      }
    }
    
    const performance: AccountPerformance = {
      totalTrades: closedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      breakevenTrades: breakevenTrades.length,
      totalPnL: Math.round(totalPnL * 100) / 100,
      winRate: Math.round(winRate * 100) / 100,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      currentDrawdown: Math.round(currentDrawdown * 100) / 100,
      consecutiveWins,
      consecutiveLosses,
      accountBalance: Math.round(currentBalance * 100) / 100,
      initialBalance: 10000
    };
    
    return performance;
  }

  // Update account performance in localStorage
  async updateAccountPerformance(userEmail: string): Promise<void> {
    const performance = await this.calculateAccountPerformance(userEmail);
    localStorage.setItem(`account_performance_${userEmail}`, JSON.stringify(performance));
  }

  // Get account performance
  async getAccountPerformance(userEmail: string): Promise<AccountPerformance> {
    const saved = localStorage.getItem(`account_performance_${userEmail}`);
    if (saved) {
      return JSON.parse(saved);
    }
    
    return await this.calculateAccountPerformance(userEmail);
  }

  // Delete trade
  async deleteTrade(tradeId: string, userEmail: string): Promise<void> {
    const trades = this.getLocalTrades(userEmail);
    const updatedTrades = trades.filter(t => t.id !== tradeId);
    localStorage.setItem(`trades_${userEmail}`, JSON.stringify(updatedTrades));
    
    // Update account performance
    await this.updateAccountPerformance(userEmail);
  }
}

export const tradeManagementService = new TradeManagementService();
export default tradeManagementService;
