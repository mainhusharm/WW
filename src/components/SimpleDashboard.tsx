import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

const SimpleDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [accountBalance, setAccountBalance] = useState(100000);
  const [totalPnl, setTotalPnl] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [winRate, setWinRate] = useState(0);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Dashboard...</h2>
          <p className="text-gray-300">Please wait while we initialize your trading dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">TraderEdge Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Account Balance */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Account Balance</h3>
            <p className="text-3xl font-bold text-green-400">
              ${accountBalance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Initial: $100,000
            </p>
          </div>

          {/* Total PnL */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Total P&L</h3>
            <p className={`text-3xl font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${totalPnl.toLocaleString()}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {((totalPnl / 100000) * 100).toFixed(2)}%
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Win Rate</h3>
            <p className="text-3xl font-bold text-blue-400">
              {winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Based on {totalTrades} trades
            </p>
          </div>

          {/* Total Trades */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Total Trades</h3>
            <p className="text-3xl font-bold text-purple-400">
              {totalTrades}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              All time
            </p>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Average Win:</span>
                <span className="text-green-400 font-semibold">
                  $350.25
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Average Loss:</span>
                <span className="text-red-400 font-semibold">
                  $200.10
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Profit Factor:</span>
                <span className="text-blue-400 font-semibold">
                  2.75
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Max Drawdown:</span>
                <span className="text-orange-400 font-semibold">
                  $1,000.00
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Risk Management</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Risk per Trade:</span>
                <span className="text-yellow-400 font-semibold">
                  2.0%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Daily Loss Limit:</span>
                <span className="text-red-400 font-semibold">
                  5.0%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Consecutive Loss Limit:</span>
                <span className="text-orange-400 font-semibold">
                  3
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Current Drawdown:</span>
                <span className="text-purple-400 font-semibold">
                  $0.00
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        <div className="mt-8 bg-green-500/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Dashboard Loaded Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your trading dashboard is now ready. All systems are operational and you can start trading.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleDashboard;
