import React, { useState, useEffect } from 'react';
import { 
  Settings, Bell, DollarSign, Activity, Shield, Target, 
  LogOut, Award, Layers, Zap, PieChart, BookOpen, GitBranch, Cpu,
  TrendingUp, TrendingDown, Clock, Users, BarChart3, Calendar,
  AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';

// Safe context hook with fallback
const useSafeTradingPlan = () => {
  try {
    const { useTradingPlan } = require('../contexts/TradingPlanContext');
    return useTradingPlan();
  } catch (error) {
    console.warn('TradingPlanContext not available, using fallback data');
    return {
      accounts: [],
      accountConfig: null,
      updateAccountConfig: () => {},
      tradingPlan: {
        userProfile: {
          initialBalance: 10000,
          accountEquity: 10000,
          tradesPerDay: '3-5',
          tradingSession: 'London/New York',
          cryptoAssets: ['BTC/USD', 'ETH/USD'],
          forexAssets: ['EUR/USD', 'GBP/USD'],
          hasAccount: 'yes',
          experience: 'intermediate'
        },
        riskParameters: {
          maxDailyRisk: 500,
          maxDailyRiskPct: '5%',
          baseTradeRisk: 100,
          baseTradeRiskPct: '1%',
          minRiskReward: '1:2'
        },
        trades: [],
        propFirmCompliance: {
          dailyLossLimit: '5%',
          totalDrawdownLimit: '10%',
          profitTarget: '10%',
          consistencyRule: 'enabled'
        }
      },
      updateTradingPlan: () => {},
      propFirm: null,
      updatePropFirm: () => {}
    };
  }
};

const DashboardConcept1 = ({ onLogout, availableFeatures }: { onLogout: () => void, availableFeatures: string[] }) => {
  const { user } = useUser();
  const { tradingPlan } = useSafeTradingPlan();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: 'Welcome to your trading dashboard!', time: '2 min ago' },
    { id: 2, type: 'info', message: 'Market opens in 30 minutes', time: '5 min ago' }
  ]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for deployment safety
  const mockPerformanceData = {
    totalPnL: 2450.00,
    todayPnL: 125.50,
    winRate: 68.5,
    totalTrades: 47,
    winningTrades: 32,
    losingTrades: 15,
    avgWin: 85.30,
    avgLoss: -42.15,
    profitFactor: 2.02,
    maxDrawdown: -3.2,
    consecutiveWins: 5,
    consecutiveLosses: 2
  };

  const mockAccountData = {
    balance: tradingPlan?.userProfile?.accountEquity || 10000,
    equity: tradingPlan?.userProfile?.accountEquity || 10000,
    margin: 250.00,
    freeMargin: 9750.00
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Welcome back, {user?.name || 'Trader'}!</h2>
                  <p className="text-blue-100 mt-1">
                    {currentTime.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Local Time</p>
                  <p className="text-xl font-mono">{currentTime.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Account Overview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <DollarSign className="mr-2" />
                  Account Overview
                </h3>
                <button
                  onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                  className="text-gray-400 hover:text-white"
                >
                  {isBalanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
                  <p className="text-gray-400 text-sm">Balance</p>
                  <p className="text-white text-lg font-bold">
                    {isBalanceVisible ? `$${mockAccountData.balance.toLocaleString()}` : '••••••'}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-400 text-sm">Equity</p>
                  <p className="text-white text-lg font-bold">
                    {isBalanceVisible ? `$${mockAccountData.equity.toLocaleString()}` : '••••••'}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-gray-400 text-sm">Margin</p>
                  <p className="text-white text-lg font-bold">
                    {isBalanceVisible ? `$${mockAccountData.margin.toLocaleString()}` : '••••••'}
                  </p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
                  <p className="text-gray-400 text-sm">Free Margin</p>
                  <p className="text-white text-lg font-bold">
                    {isBalanceVisible ? `$${mockAccountData.freeMargin.toLocaleString()}` : '••••••'}
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="mr-2 text-green-400" />
                  Performance Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total P&L</p>
                        <p className="text-green-400 text-lg font-bold">+${mockPerformanceData.totalPnL.toLocaleString()}</p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Today's P&L</p>
                        <p className="text-green-400 text-lg font-bold">+${mockPerformanceData.todayPnL.toLocaleString()}</p>
                      </div>
                      <BarChart3 className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Win Rate</p>
                        <p className="text-white text-lg font-bold">{mockPerformanceData.winRate}%</p>
                      </div>
                      <Target className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Profit Factor</p>
                    <p className="text-green-400 text-lg font-bold">{mockPerformanceData.profitFactor}</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Max Drawdown</p>
                    <p className="text-red-400 text-lg font-bold">{mockPerformanceData.maxDrawdown}%</p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-sm">Total Trades</p>
                    <p className="text-white text-lg font-bold">{mockPerformanceData.totalTrades}</p>
                  </div>
                </div>
              </div>

              {/* Notifications Panel */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Bell className="mr-2 text-yellow-400" />
                  Notifications
                </h3>
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="bg-gray-700 p-3 rounded-lg">
                      <div className="flex items-start space-x-3">
                        {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />}
                        {notification.type === 'info' && <AlertTriangle className="w-5 h-5 text-blue-400 mt-0.5" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-white text-sm">{notification.message}</p>
                          <p className="text-gray-400 text-xs mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trading Plan Summary */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Target className="mr-2" />
                Trading Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-gray-400 text-sm">Max Daily Risk</p>
                  <p className="text-white text-lg font-bold">{tradingPlan?.riskParameters?.maxDailyRiskPct || '5%'}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-gray-400 text-sm">Base Trade Risk</p>
                  <p className="text-white text-lg font-bold">{tradingPlan?.riskParameters?.baseTradeRiskPct || '1%'}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-gray-400 text-sm">Trading Session</p>
                  <p className="text-white text-lg font-bold">{tradingPlan?.userProfile?.tradingSession || 'London/New York'}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded">
                  <p className="text-gray-400 text-sm">Trades Per Day</p>
                  <p className="text-white text-lg font-bold">{tradingPlan?.userProfile?.tradesPerDay || '3-5'}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'signals':
        return (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <Zap className="mr-2 text-yellow-400" />
                  Live Trading Signals
                </h3>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white">
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
              
              {/* Mock Signals */}
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-400 font-bold">BUY</span>
                        <span className="text-white font-semibold">EUR/USD</span>
                        <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">ACTIVE</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Entry</p>
                          <p className="text-white">1.0850</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Stop Loss</p>
                          <p className="text-red-400">1.0820</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Take Profit</p>
                          <p className="text-green-400">1.0920</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Risk/Reward</p>
                          <p className="text-white">1:2.3</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">2 min ago</p>
                      <button className="mt-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white text-sm">
                        Take Signal
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-red-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-red-400 font-bold">SELL</span>
                        <span className="text-white font-semibold">GBP/USD</span>
                        <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">ACTIVE</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Entry</p>
                          <p className="text-white">1.2650</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Stop Loss</p>
                          <p className="text-red-400">1.2680</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Take Profit</p>
                          <p className="text-green-400">1.2580</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Risk/Reward</p>
                          <p className="text-white">1:2.3</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">5 min ago</p>
                      <button className="mt-2 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white text-sm">
                        Take Signal
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 border-l-4 border-gray-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-400 font-bold">BUY</span>
                        <span className="text-white font-semibold">USD/JPY</span>
                        <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">CLOSED</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Entry</p>
                          <p className="text-white">149.50</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Exit</p>
                          <p className="text-green-400">150.80</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Result</p>
                          <p className="text-green-400">+130 pips</p>
                        </div>
                        <div>
                          <p className="text-gray-400">P&L</p>
                          <p className="text-green-400">+$185</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">1 hour ago</p>
                      <CheckCircle className="w-6 h-6 text-green-400 ml-auto mt-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <PieChart className="mr-2" />
              Performance Analytics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold mb-2">Trade Statistics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Trades:</span>
                    <span className="text-white">{mockPerformanceData.totalTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Winning Trades:</span>
                    <span className="text-green-400">{mockPerformanceData.winningTrades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Losing Trades:</span>
                    <span className="text-red-400">{mockPerformanceData.losingTrades}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold mb-2">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Drawdown:</span>
                    <span className="text-white">-2.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit Factor:</span>
                    <span className="text-green-400">1.85</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sharpe Ratio:</span>
                    <span className="text-white">1.42</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'journal':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <BookOpen className="mr-2" />
              Trading Journal
            </h3>
            <div className="text-center py-8">
              <p className="text-gray-400">No trades recorded yet</p>
              <p className="text-gray-500 text-sm mt-2">Your trading history will appear here</p>
            </div>
          </div>
        );

      case 'risk':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Shield className="mr-2" />
              Risk Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold mb-2">Current Risk Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Daily Risk Used:</span>
                    <span className="text-green-400">1.2% / 5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Open Positions:</span>
                    <span className="text-white">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Status:</span>
                    <span className="text-green-400">Safe</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold mb-2">Risk Limits</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Daily Loss:</span>
                    <span className="text-white">{tradingPlan?.propFirmCompliance?.dailyLossLimit || '5%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Drawdown:</span>
                    <span className="text-white">{tradingPlan?.propFirmCompliance?.totalDrawdownLimit || '10%'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Profit Target:</span>
                    <span className="text-green-400">{tradingPlan?.propFirmCompliance?.profitTarget || '10%'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Settings className="mr-2" />
              Account Settings
            </h3>
            <div className="space-y-4">
              <div className="bg-gray-700 p-4 rounded">
                <h4 className="text-white font-semibold mb-2">User Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{user?.email || 'user@example.com'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Membership:</span>
                    <span className="text-white">{user?.membershipTier || 'Starter'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experience:</span>
                    <span className="text-white">{tradingPlan?.userProfile?.experience || 'Intermediate'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-white">Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Trading Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Bell className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-8 px-4">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'signals', label: 'Signals', icon: Zap },
            { id: 'analytics', label: 'Analytics', icon: PieChart },
            { id: 'journal', label: 'Journal', icon: BookOpen },
            { id: 'risk', label: 'Risk', icon: Shield },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].filter(tab => availableFeatures.includes(tab.id)).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default DashboardConcept1;
