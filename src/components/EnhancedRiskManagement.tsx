import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, BarChart3, Target, AlertTriangle, Info } from 'lucide-react';

interface RiskManagementData {
  accountSize: number;
  riskPerTrade: number;
  compoundingMethod: 'flat' | 'compounding';
  winRate: number;
  tradingDays: number;
}

interface EarningsProjection {
  winRate: number;
  finalBalance: number;
  totalReturn: number;
  totalTrades: number;
  expectedWins: number;
  expectedLosses: number;
}

const EnhancedRiskManagement: React.FC = () => {
  const [riskData, setRiskData] = useState<RiskManagementData>({
    accountSize: 100000,
    riskPerTrade: 1,
    compoundingMethod: 'flat',
    winRate: 60,
    tradingDays: 30
  });

  const [earningsProjections, setEarningsProjections] = useState<EarningsProjection[]>([]);
  const [showProjections, setShowProjections] = useState(false);

  // Calculate earnings projections based on different win rates
  const calculateEarningsProjections = () => {
    const winRates = [50, 60, 70, 80, 90];
    const projections: EarningsProjection[] = [];

    winRates.forEach(rate => {
      const projection = calculateProjection(rate);
      projections.push(projection);
    });

    setEarningsProjections(projections);
    setShowProjections(true);
  };

  // Calculate projection for a specific win rate
  const calculateProjection = (winRate: number): EarningsProjection => {
    let currentBalance = riskData.accountSize;
    const totalTrades = Math.floor(riskData.tradingDays * 2); // Assuming 2 trades per day
    const expectedWins = Math.floor((totalTrades * winRate) / 100);
    const expectedLosses = totalTrades - expectedWins;

    if (riskData.compoundingMethod === 'flat') {
      // Flat risk calculation
      const riskAmount = (riskData.accountSize * riskData.riskPerTrade) / 100;
      const winAmount = riskAmount * 2; // Assuming 2:1 risk-reward ratio
      
      const totalWinnings = expectedWins * winAmount;
      const totalLosses = expectedLosses * riskAmount;
      
      currentBalance = riskData.accountSize + totalWinnings - totalLosses;
    } else {
      // Compounding calculation
      for (let i = 0; i < totalTrades; i++) {
        const riskAmount = (currentBalance * riskData.riskPerTrade) / 100;
        
        if (i < expectedWins) {
          // Win - add 2x risk amount
          currentBalance += riskAmount * 2;
        } else {
          // Loss - subtract risk amount
          currentBalance -= riskAmount;
        }
      }
    }

    return {
      winRate,
      finalBalance: currentBalance,
      totalReturn: currentBalance - riskData.accountSize,
      totalTrades,
      expectedWins,
      expectedLosses
    };
  };

  // Calculate risk per trade amount
  const getRiskAmount = () => {
    return (riskData.accountSize * riskData.riskPerTrade) / 100;
  };

  // Calculate potential win amount (assuming 2:1 risk-reward)
  const getPotentialWinAmount = () => {
    return getRiskAmount() * 2;
  };

  // Calculate maximum consecutive losses before account blowup
  const getMaxConsecutiveLosses = () => {
    const riskAmount = getRiskAmount();
    return Math.floor(riskData.accountSize / riskAmount);
  };

  // Calculate daily risk limit
  const getDailyRiskLimit = () => {
    return getRiskAmount() * 3; // Assuming max 3 trades per day
  };

  // Calculate monthly risk limit
  const getMonthlyRiskLimit = () => {
    return getDailyRiskLimit() * riskData.tradingDays;
  };

  // Handle input changes
  const handleInputChange = (field: keyof RiskManagementData, value: number | string) => {
    setRiskData(prev => ({
      ...prev,
      [field]: field === 'compoundingMethod' ? value : Number(value)
    }));
  };

  // Reset to default values
  const resetToDefaults = () => {
    setRiskData({
      accountSize: 100000,
      riskPerTrade: 1,
      compoundingMethod: 'flat',
      winRate: 60,
      tradingDays: 30
    });
    setShowProjections(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Risk Management</h1>
        <p className="text-gray-600">Advanced risk calculation with compounding methods and earnings projections</p>
      </div>

      {/* Risk Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              Risk Configuration
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Size ($)
                </label>
                <input
                  type="number"
                  value={riskData.accountSize}
                  onChange={(e) => handleInputChange('accountSize', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="100000"
                  min="1000"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Per Trade (%)
                </label>
                <input
                  type="number"
                  value={riskData.riskPerTrade}
                  onChange={(e) => handleInputChange('riskPerTrade', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="1"
                  min="0.1"
                  max="5"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Recommended: 1-2% per trade</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compounding Method
                </label>
                <select
                  value={riskData.compoundingMethod}
                  onChange={(e) => handleInputChange('compoundingMethod', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="flat">Flat Risk (Fixed amount per trade)</option>
                  <option value="compounding">Compounding (Risk based on current balance)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {riskData.compoundingMethod === 'flat' 
                    ? 'Risk amount stays constant regardless of account growth'
                    : 'Risk amount increases/decreases with account balance'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trading Days per Month
                </label>
                <input
                  type="number"
                  value={riskData.tradingDays}
                  onChange={(e) => handleInputChange('tradingDays', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="30"
                  min="1"
                  max="31"
                  step="1"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={calculateEarningsProjections}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Calculate Projections
                </button>
                <button
                  onClick={resetToDefaults}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Risk Metrics */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Risk Metrics
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${getRiskAmount().toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Risk per Trade</div>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${getPotentialWinAmount().toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Potential Win</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{getMaxConsecutiveLosses()}</div>
                  <div className="text-sm text-gray-600">Max Consecutive Losses</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">${getDailyRiskLimit().toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Daily Risk Limit</div>
                </div>
              </div>

              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">${getMonthlyRiskLimit().toFixed(2)}</div>
                <div className="text-sm text-gray-600">Monthly Risk Limit</div>
              </div>
            </div>
          </div>

          {/* Risk Warnings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Risk Warnings
            </h3>
            
            <div className="space-y-2 text-sm text-gray-600">
              {riskData.riskPerTrade > 2 && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Risk per trade is high. Consider reducing to 1-2%.</span>
                </div>
              )}
              
              {getMaxConsecutiveLosses() < 10 && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Account vulnerable to consecutive losses. Increase account size or reduce risk.</span>
                </div>
              )}
              
              {riskData.compoundingMethod === 'compounding' && (
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Compounding method selected. Risk increases with account growth.</span>
                </div>
              )}
              
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>Always use stop-loss orders to limit downside risk.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Projections Section */}
      {showProjections && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Earnings Projections (30 Trading Days)
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Final Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Trades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Wins
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Losses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earningsProjections.map((projection) => (
                  <tr key={projection.winRate} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        projection.winRate >= 80 ? 'bg-green-100 text-green-800' :
                        projection.winRate >= 70 ? 'bg-blue-100 text-blue-800' :
                        projection.winRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {projection.winRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${projection.finalBalance.toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      projection.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${projection.totalReturn.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {projection.totalTrades}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {projection.expectedWins}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {projection.expectedLosses}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      projection.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {((projection.totalReturn / riskData.accountSize) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Projection Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Projection Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Method:</span>
                <span className="ml-2 text-blue-700 capitalize">{riskData.compoundingMethod}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Account Size:</span>
                <span className="ml-2 text-blue-700">${riskData.accountSize.toLocaleString()}</span>
              </div>
              <div>
                <span className="font-medium text-blue-800">Risk Per Trade:</span>
                <span className="ml-2 text-blue-700">{riskData.riskPerTrade}%</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              <Info className="w-3 h-3 inline mr-1" />
              Projections are estimates based on historical data and current market conditions. 
              Actual results may vary significantly.
            </p>
          </div>
        </div>
      )}

      {/* Comparison Section */}
      {showProjections && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Flat Risk vs Compounding Comparison</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Flat Risk */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Flat Risk Method</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Risk per trade:</span>
                  <span className="font-medium">${getRiskAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Potential win:</span>
                  <span className="font-medium">${getPotentialWinAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max consecutive losses:</span>
                  <span className="font-medium">{getMaxConsecutiveLosses()}</span>
                </div>
                <div className="pt-2 text-xs text-gray-600">
                  Risk amount remains constant regardless of account performance
                </div>
              </div>
            </div>

            {/* Compounding */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Compounding Method</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Initial risk per trade:</span>
                  <span className="font-medium">${getRiskAmount().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk after 10% growth:</span>
                  <span className="font-medium">${(getRiskAmount() * 1.1).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Risk after 20% growth:</span>
                  <span className="font-medium">${(getRiskAmount() * 1.2).toFixed(2)}</span>
                </div>
                <div className="pt-2 text-xs text-gray-600">
                  Risk amount increases/decreases with account balance
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedRiskManagement;
