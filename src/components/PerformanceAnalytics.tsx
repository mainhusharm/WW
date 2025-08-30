import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle } from 'lucide-react';

const PerformanceAnalytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('1M');
  const [performanceData] = useState([
    { month: 'Jan', profit: 2500, loss: 800, net: 1700 },
    { month: 'Feb', profit: 3200, loss: 1200, net: 2000 },
    { month: 'Mar', profit: 2800, loss: 900, net: 1900 },
    { month: 'Apr', profit: 4100, loss: 1500, net: 2600 },
    { month: 'May', profit: 3600, loss: 1100, net: 2500 },
    { month: 'Jun', profit: 4800, loss: 1800, net: 3000 },
  ]);

  const [tradeData] = useState([
    { type: 'Winning Trades', count: 45, percentage: 75 },
    { type: 'Losing Trades', count: 15, percentage: 25 },
  ]);

  const maxNet = Math.max(...performanceData.map(d => d.net));
  const maxProfit = Math.max(...performanceData.map(d => d.profit));

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
        <div className="flex space-x-2">
          {['1W', '1M', '3M', '6M', '1Y'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Profit</p>
              <p className="text-2xl font-bold text-green-400">$18,200</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Loss</p>
              <p className="text-2xl font-bold text-red-400">$7,300</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Net P&L</p>
              <p className="text-2xl font-bold text-blue-400">$10,900</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Win Rate</p>
              <p className="text-2xl font-bold text-yellow-400">75%</p>
            </div>
            <Target className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Monthly Performance</h3>
        <div className="space-y-4">
          {performanceData.map((data, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-16 text-sm text-gray-400">{data.month}</div>
              <div className="flex-1 bg-gray-700 rounded-full h-8 relative overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(data.net / maxNet) * 100}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    ${data.net.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trade Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Trade Distribution</h3>
          <div className="space-y-4">
            {tradeData.map((trade, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-300">{trade.type}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-700 rounded-full h-3">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        trade.type === 'Winning Trades' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${trade.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-400 w-12 text-right">
                    {trade.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Risk Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-300">Max Drawdown</span>
              <span className="text-red-400 font-medium">-12.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Sharpe Ratio</span>
              <span className="text-green-400 font-medium">1.8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Risk/Reward</span>
              <span className="text-blue-400 font-medium">2.5:1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Avg Trade</span>
              <span className="text-yellow-400 font-medium">$182</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert */}
      <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <div>
            <p className="text-yellow-200 font-medium">Performance Notice</p>
            <p className="text-yellow-300 text-sm">
              Your current performance is above the 75% win rate target. Consider increasing position sizes gradually.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
