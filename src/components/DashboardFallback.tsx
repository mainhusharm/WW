import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface TradingState {
  initialEquity: number;
  currentEquity: number;
  trades: any[];
  openPositions: any[];
  riskSettings: {
    riskPerTrade: number;
    dailyLossLimit: number;
    consecutiveLossesLimit: number;
  };
  performanceMetrics: {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    maxDrawdown: number;
    currentDrawdown: number;
    grossProfit: number;
    grossLoss: number;
    consecutiveWins: number;
    consecutiveLosses: number;
    sharpeRatio?: number;
  };
  dailyStats: {
    pnl: number;
    trades: number;
    initialEquity: number;
  };
}

const DashboardFallback: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const { user } = useUser();
  const [tradingState, setTradingState] = useState<TradingState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      if (user?.email) {
        setIsLoading(true);
        const stateKey = `trading_state_${user.email}`;
        
        // Load from localStorage
        const localState = localStorage.getItem(stateKey);
        const questionnaireData = localStorage.getItem('questionnaireAnswers');
        const riskPlanData = localStorage.getItem('riskManagementPlan');
        
        let parsedQuestionnaire = null;
        let parsedRiskPlan = null;
        
        try {
          parsedQuestionnaire = questionnaireData ? JSON.parse(questionnaireData) : null;
          parsedRiskPlan = riskPlanData ? JSON.parse(riskPlanData) : null;
        } catch (parseError) {
          console.warn('Error parsing questionnaire data, using defaults');
        }
        
        // Initialize trading state
        if (localState) {
          try {
            setTradingState(JSON.parse(localState));
          } catch {
            // Create new state if parsing fails
            const initialEquity = (parsedQuestionnaire?.hasAccount === 'yes' 
              ? parsedQuestionnaire?.accountEquity 
              : parsedQuestionnaire?.accountSize) || parsedRiskPlan?.accountSize || 100000;
            const initialState: TradingState = {
              initialEquity,
              currentEquity: initialEquity,
              trades: [],
              openPositions: [],
              riskSettings: {
                riskPerTrade: parsedQuestionnaire?.riskPercentage || 1,
                dailyLossLimit: 5,
                consecutiveLossesLimit: 3,
              },
              performanceMetrics: {
                totalPnl: 0, winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0,
                averageWin: 0, averageLoss: 0, profitFactor: 0, maxDrawdown: 0,
                currentDrawdown: 0, grossProfit: 0, grossLoss: 0, consecutiveWins: 0,
                consecutiveLosses: 0,
              },
              dailyStats: { pnl: 0, trades: 0, initialEquity },
            };
            setTradingState(initialState);
            localStorage.setItem(stateKey, JSON.stringify(initialState));
          }
        } else {
          // Create initial state for new users
          const initialEquity = (parsedQuestionnaire?.hasAccount === 'yes' 
            ? parsedQuestionnaire?.accountEquity 
            : parsedQuestionnaire?.accountSize) || parsedRiskPlan?.accountSize || 100000;
          const initialState: TradingState = {
            initialEquity,
            currentEquity: initialEquity,
            trades: [],
            openPositions: [],
            riskSettings: {
              riskPerTrade: parsedQuestionnaire?.riskPercentage || 1,
              dailyLossLimit: 5,
              consecutiveLossesLimit: 3,
            },
            performanceMetrics: {
              totalPnl: 0, winRate: 0, totalTrades: 0, winningTrades: 0, losingTrades: 0,
              averageWin: 0, averageLoss: 0, profitFactor: 0, maxDrawdown: 0,
              currentDrawdown: 0, grossProfit: 0, grossLoss: 0, consecutiveWins: 0,
              consecutiveLosses: 0,
            },
            dailyStats: { pnl: 0, trades: 0, initialEquity },
          };
          setTradingState(initialState);
          localStorage.setItem(stateKey, JSON.stringify(initialState));
        }
        
        setIsLoading(false);
      }
    };
    initializeData();
  }, [user]);

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

  if (!tradingState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Dashboard Unavailable</h2>
          <p className="text-gray-300 mb-6">Unable to load dashboard data. Please try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Refresh Page
          </button>
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
              <span className="ml-3 px-2 py-1 bg-green-500 text-white text-xs rounded-full">BETA</span>
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
              ${tradingState.currentEquity.toLocaleString()}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Initial: ${tradingState.initialEquity.toLocaleString()}
            </p>
          </div>

          {/* Total PnL */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Total P&L</h3>
            <p className={`text-3xl font-bold ${tradingState.performanceMetrics.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ${tradingState.performanceMetrics.totalPnl.toLocaleString()}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {((tradingState.performanceMetrics.totalPnl / tradingState.initialEquity) * 100).toFixed(2)}%
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Win Rate</h3>
            <p className="text-3xl font-bold text-blue-400">
              {tradingState.performanceMetrics.winRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-300 mt-1">
              {tradingState.performanceMetrics.winningTrades}W / {tradingState.performanceMetrics.losingTrades}L
            </p>
          </div>

          {/* Total Trades */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-2">Total Trades</h3>
            <p className="text-3xl font-bold text-purple-400">
              {tradingState.performanceMetrics.totalTrades}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Today: {tradingState.dailyStats.trades}
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
                  ${tradingState.performanceMetrics.averageWin.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Average Loss:</span>
                <span className="text-red-400 font-semibold">
                  ${tradingState.performanceMetrics.averageLoss.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Profit Factor:</span>
                <span className="text-blue-400 font-semibold">
                  {tradingState.performanceMetrics.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Max Drawdown:</span>
                <span className="text-orange-400 font-semibold">
                  ${tradingState.performanceMetrics.maxDrawdown.toFixed(2)}
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
                  {tradingState.riskSettings.riskPerTrade}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Daily Loss Limit:</span>
                <span className="text-red-400 font-semibold">
                  {tradingState.riskSettings.dailyLossLimit}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Consecutive Loss Limit:</span>
                <span className="text-orange-400 font-semibold">
                  {tradingState.riskSettings.consecutiveLossesLimit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Current Drawdown:</span>
                <span className="text-purple-400 font-semibold">
                  ${tradingState.performanceMetrics.currentDrawdown.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-8 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Dashboard in Offline Mode
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  The dashboard is running in offline mode. Some features may be limited. 
                  Data is being saved locally and will sync when the connection is restored.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardFallback;
