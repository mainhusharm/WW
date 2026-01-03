// Trade Management Service
// Handles persistent trade storage, status updates, and performance calculations

export interface TradeStatus {
  id: string;
  signalId: string;
  status: 'active' | 'won' | 'lost' | 'breakeven';
  pnl: number;
  lotSize: number;
  dollarAmount: number;
  stopLossDollar: number;
  takeProfitDollar: number;
  timestamp: string;
  closedAt?: string;
}

export interface RiskManagementPlan {
  accountBalance: number;
  riskPercentage: number;
  maxRiskPerTrade: number;
  preferredRiskReward: number;
}

export interface LotSizeCalculation {
  lotSize: number;
  units: number;
  moneyAtRisk: number;
  stopLossPips: number;
  pipValue: number;
}

class TradeManager {
  private static instance: TradeManager;
  private trades: Map<string, TradeStatus> = new Map();
  private riskPlan: RiskManagementPlan;

  constructor() {
    this.riskPlan = this.loadRiskPlan();
    this.loadTrades();
  }

  static getInstance(): TradeManager {
    if (!TradeManager.instance) {
      TradeManager.instance = new TradeManager();
    }
    return TradeManager.instance;
  }

  // Load risk management plan from localStorage
  private loadRiskPlan(): RiskManagementPlan {
    const saved = localStorage.getItem('riskManagementPlan');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default risk plan
    const defaultPlan: RiskManagementPlan = {
      accountBalance: 10000,
      riskPercentage: 2,
      maxRiskPerTrade: 200,
      preferredRiskReward: 2
    };
    
    this.saveRiskPlan(defaultPlan);
    return defaultPlan;
  }

  // Save risk management plan to localStorage
  saveRiskPlan(plan: RiskManagementPlan): void {
    this.riskPlan = plan;
    localStorage.setItem('riskManagementPlan', JSON.stringify(plan));
  }

  // Get current risk plan
  getRiskPlan(): RiskManagementPlan {
    return this.riskPlan;
  }

  // Load trades from localStorage
  private loadTrades(): void {
    const saved = localStorage.getItem('persistentTrades');
    if (saved) {
      const tradesArray = JSON.parse(saved);
      this.trades = new Map(tradesArray.map((trade: TradeStatus) => [trade.id, trade]));
    }
  }

  // Save trades to localStorage
  private saveTrades(): void {
    const tradesArray = Array.from(this.trades.values());
    localStorage.setItem('persistentTrades', JSON.stringify(tradesArray));
  }

  // Create a new trade from signal
  createTrade(signal: any): TradeStatus {
    const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate lot size based on risk management
    const lotCalculation = this.calculateLotSize(signal);
    
    const trade: TradeStatus = {
      id: tradeId,
      signalId: signal.id || signal.message_id || Date.now().toString(),
      status: 'active',
      pnl: 0,
      lotSize: lotCalculation.lotSize,
      dollarAmount: lotCalculation.moneyAtRisk,
      stopLossDollar: lotCalculation.stopLossDollar,
      takeProfitDollar: lotCalculation.takeProfitDollar,
      timestamp: new Date().toISOString()
    };

    this.trades.set(tradeId, trade);
    this.saveTrades();
    return trade;
  }

  // Calculate lot size based on risk management plan
  calculateLotSize(signal: any): LotSizeCalculation {
    const entryPrice = parseFloat(signal.entryPrice || signal.entry || '0');
    const stopLoss = parseFloat(signal.stopLoss || '0');
    const takeProfit = parseFloat(Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0');
    
    if (!entryPrice || !stopLoss || !takeProfit) {
      return {
        lotSize: 0.01,
        units: 1000,
        moneyAtRisk: 0,
        stopLossPips: 0,
        pipValue: 0
      };
    }

    // Calculate stop loss in pips
    const stopLossPips = Math.abs(entryPrice - stopLoss) * 10000; // For major pairs
    const pipValue = 10; // Standard pip value for major pairs
    
    // Calculate money at risk based on risk percentage
    const moneyAtRisk = (this.riskPlan.accountBalance * this.riskPlan.riskPercentage) / 100;
    
    // Calculate lot size: Money at Risk / (Stop Loss Pips * Pip Value)
    const lotSize = Math.max(0.01, moneyAtRisk / (stopLossPips * pipValue));
    
    // Round to 2 decimal places
    const roundedLotSize = Math.round(lotSize * 100) / 100;
    
    // Calculate units (1 lot = 100,000 units for major pairs)
    const units = roundedLotSize * 100000;
    
    // Calculate dollar amounts
    const stopLossDollar = Math.abs(entryPrice - stopLoss) * units;
    const takeProfitDollar = Math.abs(takeProfit - entryPrice) * units;

    return {
      lotSize: roundedLotSize,
      units: Math.round(units),
      moneyAtRisk: Math.round(moneyAtRisk * 100) / 100,
      stopLossPips: Math.round(stopLossPips * 100) / 100,
      pipValue
    };
  }

  // Update trade status
  updateTradeStatus(tradeId: string, status: 'won' | 'lost' | 'breakeven', pnl?: number): void {
    const trade = this.trades.get(tradeId);
    if (!trade) return;

    trade.status = status;
    trade.closedAt = new Date().toISOString();
    
    if (pnl !== undefined) {
      trade.pnl = pnl;
    } else {
      // Calculate PnL based on status
      switch (status) {
        case 'won':
          trade.pnl = trade.takeProfitDollar;
          break;
        case 'lost':
          trade.pnl = -trade.stopLossDollar;
          break;
        case 'breakeven':
          trade.pnl = 0;
          break;
      }
    }

    this.trades.set(tradeId, trade);
    this.saveTrades();
    
    // Update account balance
    this.updateAccountBalance(trade.pnl);
  }

  // Update account balance based on trade outcome
  private updateAccountBalance(pnl: number): void {
    this.riskPlan.accountBalance += pnl;
    this.saveRiskPlan(this.riskPlan);
  }

  // Get all trades
  getAllTrades(): TradeStatus[] {
    return Array.from(this.trades.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get active trades
  getActiveTrades(): TradeStatus[] {
    return this.getAllTrades().filter(trade => trade.status === 'active');
  }

  // Get trade by signal ID
  getTradeBySignalId(signalId: string): TradeStatus | undefined {
    return Array.from(this.trades.values()).find(trade => trade.signalId === signalId);
  }

  // Get performance metrics
  getPerformanceMetrics(): {
    totalTrades: number;
    wonTrades: number;
    lostTrades: number;
    breakevenTrades: number;
    winRate: number;
    totalPnL: number;
    currentBalance: number;
  } {
    const allTrades = this.getAllTrades();
    const closedTrades = allTrades.filter(trade => trade.status !== 'active');
    
    const wonTrades = closedTrades.filter(trade => trade.status === 'won').length;
    const lostTrades = closedTrades.filter(trade => trade.status === 'lost').length;
    const breakevenTrades = closedTrades.filter(trade => trade.status === 'breakeven').length;
    
    const totalPnL = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
    const winRate = closedTrades.length > 0 ? (wonTrades / closedTrades.length) * 100 : 0;

    return {
      totalTrades: allTrades.length,
      wonTrades,
      lostTrades,
      breakevenTrades,
      winRate: Math.round(winRate * 100) / 100,
      totalPnL: Math.round(totalPnL * 100) / 100,
      currentBalance: this.riskPlan.accountBalance
    };
  }

  // Clear all trades (for testing)
  clearAllTrades(): void {
    this.trades.clear();
    localStorage.removeItem('persistentTrades');
  }
}

export default TradeManager;
