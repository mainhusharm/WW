import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  PlayIcon, 
  PauseIcon, 
  StopIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TradingBot {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  strategy: string;
  symbols: string[];
  riskLevel: 'low' | 'medium' | 'high';
  performance: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    totalPnl: number;
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  settings: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxDailyLoss: number;
    tradingHours: {
      start: string;
      end: string;
    };
  };
  createdAt: string;
  lastActive: string;
  isActive: boolean;
}

const TradingBotManager: React.FC = () => {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [selectedBot, setSelectedBot] = useState<TradingBot | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch real bot data from API
  useEffect(() => {
    const fetchBots = async () => {
      try {
        const response = await fetch('/api/trading-bots');
        if (response.ok) {
          const data = await response.json();
          setBots(data.bots || []);
        } else {
          console.error('Failed to fetch trading bots');
          setBots([]);
        }
      } catch (error) {
        console.error('Error fetching trading bots:', error);
        setBots([]);
      }
    };
    
    fetchBots();
    // Refresh bot data every 30 seconds
    const interval = setInterval(fetchBots, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredBots = bots.filter(bot => {
    const matchesFilter = filter === 'all' || bot.status === filter;
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bot.strategy.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'stopped': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBotAction = (botId: string, action: string) => {
    setBots(bots.map(bot => {
      if (bot.id === botId) {
        switch (action) {
          case 'start':
            return { ...bot, status: 'running', lastActive: new Date().toISOString() };
          case 'pause':
            return { ...bot, status: 'paused' };
          case 'stop':
            return { ...bot, status: 'stopped' };
          case 'toggle':
            return { ...bot, isActive: !bot.isActive };
          default:
            return bot;
        }
      }
      return bot;
    }));
  };

  const handleCreateBot = () => {
    setIsCreating(true);
    setSelectedBot({
      id: Date.now().toString(),
      name: '',
      description: '',
      status: 'stopped',
      strategy: '',
      symbols: [],
      riskLevel: 'medium',
      performance: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalPnl: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      },
      settings: {
        maxPositionSize: 0.05,
        stopLoss: 0.03,
        takeProfit: 0.06,
        maxDailyLoss: 0.02,
        tradingHours: {
          start: '09:00',
          end: '17:00'
        }
      },
      createdAt: new Date().toISOString().split('T')[0],
      lastActive: new Date().toISOString(),
      isActive: true
    });
  };

  const handleEditBot = (bot: TradingBot) => {
    setSelectedBot(bot);
    setIsEditing(true);
  };

  const handleDeleteBot = (id: string) => {
    if (confirm('Are you sure you want to delete this trading bot?')) {
      setBots(bots.filter(b => b.id !== id));
    }
  };

  const handleSaveBot = (bot: TradingBot) => {
    if (isCreating) {
      setBots([...bots, bot]);
    } else {
      setBots(bots.map(b => b.id === bot.id ? bot : b));
    }
    setIsEditing(false);
    setIsCreating(false);
    setSelectedBot(null);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trading Bot Manager</h1>
          <p className="text-gray-600 mt-2">Manage and monitor automated trading strategies</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CogIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Bots</p>
                <p className="text-2xl font-semibold text-gray-900">{bots.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <PlayIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {bots.filter(b => b.status === 'running').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total P&L</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${bots.reduce((sum, b) => sum + b.performance.totalPnl, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Win Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(bots.reduce((sum, b) => sum + b.performance.winRate, 0) / bots.length).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="running">Running</option>
                <option value="paused">Paused</option>
                <option value="stopped">Stopped</option>
                <option value="error">Error</option>
              </select>
              <input
                type="text"
                placeholder="Search bots..."
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleCreateBot}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Bot
            </button>
          </div>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBots.map((bot) => (
            <div key={bot.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Bot Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bot.name}</h3>
                    <p className="text-sm text-gray-500">{bot.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bot.status)}`}>
                      {bot.status}
                    </span>
                  </div>
                </div>

                {/* Strategy Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Strategy</span>
                    <span className="text-sm text-gray-900">{bot.strategy}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Risk Level</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(bot.riskLevel)}`}>
                      {bot.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Symbols</span>
                    <span className="text-sm text-gray-900">{bot.symbols.length}</span>
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Win Rate</p>
                      <p className="font-semibold text-gray-900">{bot.performance.winRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total P&L</p>
                      <p className={`font-semibold ${bot.performance.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${bot.performance.totalPnl.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Trades</p>
                      <p className="font-semibold text-gray-900">{bot.performance.totalTrades}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Sharpe</p>
                      <p className="font-semibold text-gray-900">{bot.performance.sharpeRatio.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {bot.status === 'running' ? (
                      <button
                        onClick={() => handleBotAction(bot.id, 'pause')}
                        className="p-2 text-yellow-600 hover:text-yellow-700 transition-colors"
                        title="Pause Bot"
                      >
                        <PauseIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBotAction(bot.id, 'start')}
                        className="p-2 text-green-600 hover:text-green-700 transition-colors"
                        title="Start Bot"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleBotAction(bot.id, 'stop')}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Stop Bot"
                    >
                      <StopIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedBot(bot)}
                      className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditBot(bot)}
                      className="p-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                      title="Edit Bot"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBot(bot.id)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Delete Bot"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bot Modal */}
        {(isEditing || isCreating) && selectedBot && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-gray-900">
                    {isCreating ? 'Create New Bot' : 'Edit Bot'}
                  </h3>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setIsCreating(false);
                      setSelectedBot(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveBot(selectedBot);
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bot Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedBot.name}
                        onChange={(e) => setSelectedBot({...selectedBot, name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Strategy
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedBot.strategy}
                        onChange={(e) => setSelectedBot({...selectedBot, strategy: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedBot.description}
                      onChange={(e) => setSelectedBot({...selectedBot, description: e.target.value})}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Level
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedBot.riskLevel}
                        onChange={(e) => setSelectedBot({...selectedBot, riskLevel: e.target.value as any})}
                        required
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Position Size
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedBot.settings.maxPositionSize}
                        onChange={(e) => setSelectedBot({
                          ...selectedBot, 
                          settings: {...selectedBot.settings, maxPositionSize: parseFloat(e.target.value)}
                        })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        setSelectedBot(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {isCreating ? 'Create' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingBotManager;
