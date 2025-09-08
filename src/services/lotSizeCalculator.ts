export interface LotSizeCalculation {
  lotSize: number;
  units: number;
  moneyAtRisk: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  stopLossPips: number;
  takeProfitPips: number;
  pipValue: number;
  contractSize: number;
}

export interface RiskParameters {
  accountBalance: number;
  riskPercentage: number;
  stopLossPips: number;
  entryPrice: number;
  symbol: string;
  contractSize?: number;
}

class LotSizeCalculator {
  // Standard contract sizes for different instruments
  private contractSizes: { [key: string]: number } = {
    // Forex pairs
    'EURUSD': 100000,
    'GBPUSD': 100000,
    'USDJPY': 100000,
    'USDCHF': 100000,
    'AUDUSD': 100000,
    'USDCAD': 100000,
    'NZDUSD': 100000,
    'EURGBP': 100000,
    'EURJPY': 100000,
    'GBPJPY': 100000,
    'AUDJPY': 100000,
    'CADJPY': 100000,
    'CHFJPY': 100000,
    'NZDJPY': 100000,
    'EURCHF': 100000,
    'EURAUD': 100000,
    'EURCAD': 100000,
    'EURNZD': 100000,
    'GBPCHF': 100000,
    'GBPAUD': 100000,
    'GBPCAD': 100000,
    'GBPNZD': 100000,
    'AUDCHF': 100000,
    'AUDCAD': 100000,
    'AUDNZD': 100000,
    'CADCHF': 100000,
    'NZDCHF': 100000,
    'NZDCAD': 100000,
    
    // Crypto pairs (typically 1 unit per lot)
    'BTCUSD': 1,
    'ETHUSD': 1,
    'LTCUSD': 1,
    'XRPUSD': 1,
    'ADAUSD': 1,
    'DOTUSD': 1,
    'LINKUSD': 1,
    'UNIUSD': 1,
    'AAVEUSD': 1,
    'SOLUSD': 1,
    'MATICUSD': 1,
    'AVAXUSD': 1,
    'ATOMUSD': 1,
    'FTMUSD': 1,
    'ALGOUSD': 1,
    
    // Indices (typically 1 unit per lot)
    'US30': 1,
    'NAS100': 1,
    'SPX500': 1,
    'UK100': 1,
    'GER30': 1,
    'FRA40': 1,
    'JPN225': 1,
    'AUS200': 1,
    
    // Commodities
    'GOLD': 100,
    'SILVER': 5000,
    'OIL': 1000,
    'COPPER': 25000,
  };

  // Pip values for different instruments
  private pipValues: { [key: string]: number } = {
    // Forex pairs (typically 0.0001 for most pairs, 0.01 for JPY pairs)
    'EURUSD': 0.0001,
    'GBPUSD': 0.0001,
    'USDJPY': 0.01,
    'USDCHF': 0.0001,
    'AUDUSD': 0.0001,
    'USDCAD': 0.0001,
    'NZDUSD': 0.0001,
    'EURGBP': 0.0001,
    'EURJPY': 0.01,
    'GBPJPY': 0.01,
    'AUDJPY': 0.01,
    'CADJPY': 0.01,
    'CHFJPY': 0.01,
    'NZDJPY': 0.01,
    'EURCHF': 0.0001,
    'EURAUD': 0.0001,
    'EURCAD': 0.0001,
    'EURNZD': 0.0001,
    'GBPCHF': 0.0001,
    'GBPAUD': 0.0001,
    'GBPCAD': 0.0001,
    'GBPNZD': 0.0001,
    'AUDCHF': 0.0001,
    'AUDCAD': 0.0001,
    'AUDNZD': 0.0001,
    'CADCHF': 0.0001,
    'NZDCHF': 0.0001,
    'NZDCAD': 0.0001,
    
    // Crypto pairs (typically $1 per unit)
    'BTCUSD': 1,
    'ETHUSD': 1,
    'LTCUSD': 1,
    'XRPUSD': 1,
    'ADAUSD': 1,
    'DOTUSD': 1,
    'LINKUSD': 1,
    'UNIUSD': 1,
    'AAVEUSD': 1,
    'SOLUSD': 1,
    'MATICUSD': 1,
    'AVAXUSD': 1,
    'ATOMUSD': 1,
    'FTMUSD': 1,
    'ALGOUSD': 1,
    
    // Indices (typically $1 per point)
    'US30': 1,
    'NAS100': 1,
    'SPX500': 1,
    'UK100': 1,
    'GER30': 1,
    'FRA40': 1,
    'JPN225': 1,
    'AUS200': 1,
    
    // Commodities
    'GOLD': 0.01,
    'SILVER': 0.001,
    'OIL': 0.01,
    'COPPER': 0.0001,
  };

  // Get contract size for a symbol
  getContractSize(symbol: string): number {
    const normalizedSymbol = symbol.replace(/[^A-Z]/g, '').toUpperCase();
    return this.contractSizes[normalizedSymbol] || 100000; // Default to 100,000 for forex
  }

  // Get pip value for a symbol
  getPipValue(symbol: string): number {
    const normalizedSymbol = symbol.replace(/[^A-Z]/g, '').toUpperCase();
    return this.pipValues[normalizedSymbol] || 0.0001; // Default to 0.0001 for forex
  }

  // Calculate lot size based on risk parameters
  calculateLotSize(params: RiskParameters): LotSizeCalculation {
    const {
      accountBalance,
      riskPercentage,
      stopLossPips,
      entryPrice,
      symbol
    } = params;

    const contractSize = params.contractSize || this.getContractSize(symbol);
    const pipValue = this.getPipValue(symbol);
    
    // Calculate money at risk
    const moneyAtRisk = (accountBalance * riskPercentage) / 100;
    
    // Calculate lot size using the formula from FXVerify
    // Lot Size = Money at Risk / (Stop Loss in Pips × Pip Value × Contract Size)
    const lotSize = moneyAtRisk / (stopLossPips * pipValue * contractSize);
    
    // Round to 2 decimal places for standard lots
    const roundedLotSize = Math.round(lotSize * 100) / 100;
    
    // Calculate units
    const units = roundedLotSize * contractSize;
    
    // Calculate stop loss and take profit prices
    const stopLossPrice = this.calculateStopLossPrice(entryPrice, stopLossPips, symbol);
    const takeProfitPips = stopLossPips * 2; // 1:2 risk-reward ratio
    const takeProfitPrice = this.calculateTakeProfitPrice(entryPrice, takeProfitPips, symbol);
    
    return {
      lotSize: roundedLotSize,
      units: Math.round(units),
      moneyAtRisk: Math.round(moneyAtRisk * 100) / 100,
      stopLossPrice: Math.round(stopLossPrice * 100000) / 100000,
      takeProfitPrice: Math.round(takeProfitPrice * 100000) / 100000,
      stopLossPips,
      takeProfitPips,
      pipValue,
      contractSize
    };
  }

  // Calculate stop loss price
  private calculateStopLossPrice(entryPrice: number, stopLossPips: number, symbol: string): number {
    const normalizedSymbol = symbol.replace(/[^A-Z]/g, '').toUpperCase();
    const pipValue = this.getPipValue(normalizedSymbol);
    
    // For long positions, stop loss is below entry price
    // For short positions, stop loss is above entry price
    // We'll assume long position for calculation
    return entryPrice - (stopLossPips * pipValue);
  }

  // Calculate take profit price
  private calculateTakeProfitPrice(entryPrice: number, takeProfitPips: number, symbol: string): number {
    const normalizedSymbol = symbol.replace(/[^A-Z]/g, '').toUpperCase();
    const pipValue = this.getPipValue(normalizedSymbol);
    
    // For long positions, take profit is above entry price
    return entryPrice + (takeProfitPips * pipValue);
  }

  // Calculate P&L for a trade
  calculatePnL(
    entryPrice: number,
    exitPrice: number,
    lotSize: number,
    symbol: string,
    isLong: boolean
  ): number {
    const contractSize = this.getContractSize(symbol);
    const pipValue = this.getPipValue(symbol);
    
    const priceDifference = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
    const pips = priceDifference / pipValue;
    
    return pips * lotSize * contractSize * pipValue;
  }

  // Get risk management parameters from user's plan
  getRiskParameters(userRiskPlan: any, symbol: string, entryPrice?: number, stopLoss?: number): RiskParameters {
    const accountBalance = userRiskPlan?.userProfile?.accountEquity || 10000;
    const riskPercentage = userRiskPlan?.riskParameters?.baseTradeRiskPct || 2;
    
    // Calculate stop loss pips from actual signal data
    let stopLossPips = 20; // Default fallback
    if (entryPrice && stopLoss) {
      const pipValue = this.getPipValue(symbol);
      stopLossPips = Math.abs(entryPrice - stopLoss) / pipValue;
    }
    
    // Use actual entry price from signal, fallback to mock price
    const actualEntryPrice = entryPrice || this.getCurrentPrice(symbol);
    
    return {
      accountBalance,
      riskPercentage: parseFloat(riskPercentage.toString().replace('%', '')),
      stopLossPips,
      entryPrice: actualEntryPrice,
      symbol
    };
  }

  // Mock current price (in real implementation, this would come from a price feed)
  private getCurrentPrice(symbol: string): number {
    const mockPrices: { [key: string]: number } = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'USDJPY': 150.00,
      'USDCHF': 0.8750,
      'AUDUSD': 0.6550,
      'USDCAD': 1.3650,
      'NZDUSD': 0.6050,
      'BTCUSD': 45000,
      'ETHUSD': 3000,
      'GOLD': 2000,
      'OIL': 75.00,
    };
    
    const normalizedSymbol = symbol.replace(/[^A-Z]/g, '').toUpperCase();
    return mockPrices[normalizedSymbol] || 1.0000;
  }
}

export const lotSizeCalculator = new LotSizeCalculator();
export default lotSizeCalculator;
