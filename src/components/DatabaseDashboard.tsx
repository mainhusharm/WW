import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, Lock, Database, BarChart3, TrendingUp, TrendingDown, Star, Activity } from 'lucide-react';
import api from '../api';

interface BotData {
  id: number;
  bot_type: string;
  pair: string;
  timestamp: string;
  price: number;
  signal_type: string;
  signal_strength: number;
  is_recommended: boolean;
  volume?: number;
  high?: number;
  low?: number;
  open_price?: number;
  close_price?: number;
  timeframe?: string;
}

interface OHLCData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface BotStatus {
  bot_type: string;
  is_active: boolean;
  last_started?: string;
  last_stopped?: string;
  status_updated_at: string;
}

const DatabaseDashboard: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mpin, setMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dashboard data
  const [botData, setBotData] = useState<BotData[]>([]);
  const [ohlcData, setOhlcData] = useState<Record<string, OHLCData[]>>({});
  const [botStatus, setBotStatus] = useState<BotStatus[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1h');
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'bot-status' | 'raw-data'>('overview');
  
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const handleMpinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (mpin.length !== 6) {
      setError('MPIN must be 6 digits');
      setIsLoading(false);
      return;
    }

    // M-PIN for Database Dashboard is 231806
    if (mpin === '231806') {
      setIsAuthenticated(true);
      localStorage.setItem('db_dashboard_authenticated', 'true');
      localStorage.setItem('db_dashboard_auth_time', new Date().toISOString());
    } else {
      setError('Invalid MPIN. Access denied.');
    }
    
    setIsLoading(false);
  };

  const handleMpinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setMpin(value);
    setError('');
  };

  // Check if already authenticated
  useEffect(() => {
    const isAuth = localStorage.getItem('db_dashboard_authenticated');
    const authTime = localStorage.getItem('db_dashboard_auth_time');
    
    if (isAuth && authTime) {
      const authTimestamp = new Date(authTime);
      const now = new Date();
      const hoursSinceAuth = (now.getTime() - authTimestamp.getTime()) / (1000 * 60 * 60);
      
      // Auto-logout after 8 hours
      if (hoursSinceAuth < 8) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('db_dashboard_authenticated');
        localStorage.removeItem('db_dashboard_auth_time');
      }
    }
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        // Fetch bot data
        const botResponse = await api.get('/api/database/bot-data');
        setBotData(botResponse.data);

        // Fetch bot status
        const statusResponse = await api.get('/api/database/bot-status');
        setBotStatus(statusResponse.data);

        // Fetch OHLC data for charts
        const ohlcResponse = await api.get('/api/database/ohlc-data');
        setOhlcData(ohlcResponse.data);

        // Set default selected pair
        if (botData.length > 0 && !selectedPair) {
          setSelectedPair(botData[0].pair);
        }
      } catch (error) {
        console.error('Error fetching database data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, selectedPair]);

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('db_dashboard_authenticated');
    localStorage.removeItem('db_dashboard_auth_time');
  };

  const getUniquePairs = () => {
    return [...new Set(botData.map(item => item.pair))];
  };

  const getPairData = (pair: string) => {
    return botData.filter(item => item.pair === pair);
  };

  const getRecommendedSignals = () => {
    return botData.filter(item => item.is_recommended);
  };

  const getSignalStats = () => {
    const total = botData.length;
    const buySignals = botData.filter(item => item.signal_type === 'buy').length;
    const sellSignals = botData.filter(item => item.signal_type === 'sell').length;
    const recommended = getRecommendedSignals().length;
    
    return { total, buySignals, sellSignals, recommended };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-900/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Database Dashboard</h1>
              <p className="text-gray-400">Enter M-PIN to access trading data</p>
            </div>

            <form onSubmit={handleMpinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-PIN
                </label>
                <div className="relative">
                  <input
                    type={showMpin ? 'text' : 'password'}
                    value={mpin}
                    onChange={handleMpinChange}
                    className="w-full px-4 py-3 bg-gray-800/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter 6-digit M-PIN"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMpin(!showMpin)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showMpin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || mpin.length !== 6}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Access Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="bg-gray-900/60 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Database className="w-8 h-8 text-blue-400" />
              <h1 className="text-xl font-bold text-white">Database Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-green-400 text-sm">🔒 Authenticated</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-900/40 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'charts', label: 'Charts', icon: TrendingUp },
              { id: 'bot-status', label: 'Bot Status', icon: Activity },
              { id: 'raw-data', label: 'Raw Data', icon: Database }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {(() => {
                const stats = getSignalStats();
                return [
                  { label: 'Total Signals', value: stats.total, color: 'blue', icon: BarChart3 },
                  { label: 'Buy Signals', value: stats.buySignals, color: 'green', icon: TrendingUp },
                  { label: 'Sell Signals', value: stats.sellSignals, color: 'red', icon: TrendingDown },
                  { label: 'Recommended', value: stats.recommended, color: 'yellow', icon: Star }
                ].map((stat, index) => (
                  <div key={index} className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg bg-${stat.color}-600/20`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Recent Data */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Bot Data</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {botData.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{item.pair}</p>
                        <p className="text-sm text-gray-400">{item.bot_type} • {item.timeframe || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-medium">${item.price.toFixed(4)}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.signal_type === 'buy' ? 'bg-green-600 text-white' : 
                            item.signal_type === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {item.signal_type?.toUpperCase() || 'NEUTRAL'}
                          </span>
                          {item.is_recommended && (
                            <Star className="w-3 h-3 text-yellow-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Bot Status</h3>
                <div className="space-y-3">
                  {botStatus.map((bot) => (
                    <div key={bot.bot_type} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium capitalize">{bot.bot_type} Bot</p>
                        <p className="text-sm text-gray-400">
                          Last updated: {new Date(bot.status_updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          bot.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {bot.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Chart Controls */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="flex flex-wrap items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trading Pair</label>
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Pair</option>
                    {getUniquePairs().map((pair) => (
                      <option key={pair} value={pair}>{pair}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {timeframes.map((tf) => (
                      <option key={tf} value={tf}>{tf}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Chart Display */}
            {selectedPair && ohlcData[selectedPair] && (
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {selectedPair} - {selectedTimeframe} Chart
                </h3>
                <div className="h-96 bg-gray-900 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Chart visualization will be implemented here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Data points: {ohlcData[selectedPair]?.length || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bot-status' && (
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Bot Status Management</h3>
              <div className="space-y-4">
                {botStatus.map((bot) => (
                  <div key={bot.bot_type} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div>
                      <h4 className="text-white font-medium capitalize">{bot.bot_type} Bot</h4>
                      <p className="text-sm text-gray-400">
                        Status: {bot.is_active ? 'Running' : 'Stopped'}
                      </p>
                      {bot.last_started && (
                        <p className="text-sm text-gray-400">
                          Started: {new Date(bot.last_started).toLocaleString()}
                        </p>
                      )}
                      {bot.last_stopped && (
                        <p className="text-sm text-gray-400">
                          Stopped: {new Date(bot.last_stopped).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        bot.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {bot.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      <button
                        onClick={async () => {
                          try {
                            const newStatus = !bot.is_active;
                            await api.post(`/api/database/bot-status/${bot.bot_type}`, {
                              is_active: newStatus
                            });
                            // Refresh data
                            window.location.reload();
                          } catch (error) {
                            console.error('Error updating bot status:', error);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          bot.is_active
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {bot.is_active ? 'Stop Bot' : 'Start Bot'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'raw-data' && (
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Raw Bot Data</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Pair</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bot Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Signal</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Strength</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Recommended</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {botData.slice(0, 50).map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.pair}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">{item.bot_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${item.price.toFixed(4)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.signal_type === 'buy' ? 'bg-green-600 text-white' : 
                            item.signal_type === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {item.signal_type?.toUpperCase() || 'NEUTRAL'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {item.signal_strength ? `${item.signal_strength}%` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.is_recommended ? (
                            <Star className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseDashboard;
