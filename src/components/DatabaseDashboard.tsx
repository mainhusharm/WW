import React, { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, Lock, Database, BarChart3, TrendingUp, TrendingDown, Star, Activity, Globe, Filter } from 'lucide-react';
import api from '../lib/api';
import { fetchForexFactoryNews, getImpactColor, formatEventTime, ForexFactoryEvent } from '../services/forexFactoryService';

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
  
  // News functionality state variables
  const [forexNews, setForexNews] = useState<ForexFactoryEvent[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedNewsDate, setSelectedNewsDate] = useState(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  
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

  // News functions
  const handleNewsDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedNewsDate(new Date(e.target.value));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
  };

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTimezone(e.target.value);
  };

  const refreshNews = async () => {
    if (isLoadingNews) return;
    setIsLoadingNews(true);
    try {
      const news = await fetchForexFactoryNews(selectedNewsDate, selectedCurrency);
      setForexNews(news);
    } catch (error) {
      console.log('Using fallback news data for refresh');
    } finally {
      setIsLoadingNews(false);
    }
  };

  // Load news on component mount and when parameters change
  useEffect(() => {
    if (isAuthenticated) {
      refreshNews();
    }
  }, [isAuthenticated, selectedNewsDate, selectedCurrency]);

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
                  {botData.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-white font-medium capitalize">{item.bot_type} Bot</p>
                        <p className="text-sm text-gray-400">
                          Last updated: {new Date(item.timestamp).toLocaleString()}
                        </p>
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
            </div>

            {/* News Section */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Activity className="w-6 h-6 mr-2 text-blue-400" />
                  Forex News
                </h3>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={refreshNews}
                    disabled={isLoadingNews}
                    className={`bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm transition-colors ${
                      isLoadingNews ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'
                    }`}
                  >
                    {isLoadingNews ? 'Loading...' : 'Refresh'}
                  </button>
                  <select 
                    value={selectedCurrency} 
                    onChange={handleCurrencyChange}
                    className="bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
                  >
                    <option value="ALL">All Currencies</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                    <option value="NZD">NZD</option>
                    <option value="CHF">CHF</option>
                  </select>
                  <input 
                    type="date" 
                    value={selectedNewsDate.toISOString().split('T')[0]} 
                    onChange={handleNewsDateChange}
                    className="bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
                  />
                  <select 
                    value={selectedTimezone} 
                    onChange={handleTimezoneChange}
                    className="bg-gray-700 text-white p-2 rounded border border-gray-600 text-sm"
                  >
                    <option value="America/New_York">New York</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>
              </div>
              
              {isLoadingNews ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading news events...</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {forexNews.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <div className="text-gray-400 text-lg font-medium mb-2">No news events for selected date</div>
                      <p className="text-gray-500 text-sm">Try selecting a different date or currency</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm text-left text-gray-400">
                      <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                        <tr>
                          <th scope="col" className="px-4 py-3 w-[10%]">Time</th>
                          <th scope="col" className="px-4 py-3 w-[10%]">Currency</th>
                          <th scope="col" className="px-4 py-3 w-[10%]">Impact</th>
                          <th scope="col" className="px-4 py-3 w-[40%]">Event</th>
                          <th scope="col" className="px-4 py-3 text-right w-[10%]">Actual</th>
                          <th scope="col" className="px-4 py-3 text-right w-[10%]">Forecast</th>
                          <th scope="col" className="px-4 py-3 text-right w-[10%]">Previous</th>
                        </tr>
                      </thead>
                      <tbody>
                      {forexNews.map((event) => (
                        <tr key={event.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors duration-300">
                          <td className="px-4 py-3 font-medium text-white">{formatEventTime(event.time, selectedTimezone)}</td>
                          <td className="px-4 py-3 font-medium text-white">{event.currency}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(event.impact)}`}>
                              {event.impact.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white">{event.event}</td>
                          <td className="px-4 py-3 text-right font-medium text-white">{event.actual}</td>
                          <td className="px-4 py-3 text-right">{event.forecast}</td>
                          <td className="px-4 py-3 text-right">{event.previous}</td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="space-y-6">
            {/* Chart controls */}
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Currency Pair</label>
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg text-white p-2"
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
                    className="bg-gray-700 border border-gray-600 rounded-lg text-white p-2"
                  >
                    {timeframes.map((tf) => (
                      <option key={tf} value={tf}>{tf}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Chart display */}
            {selectedPair && ohlcData[selectedPair] && (
              <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">{selectedPair} - {selectedTimeframe}</h3>
                <div className="h-96 bg-gray-700/50 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Chart visualization would go here</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'bot-status' && (
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Bot Status Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {botStatus.map((bot) => (
                  <div key={bot.bot_type} className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium capitalize">{bot.bot_type} Bot</h4>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        bot.is_active ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                      }`}>
                        {bot.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      Last updated: {new Date(bot.status_updated_at).toLocaleString()}
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
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
                    <tr>
                      <th scope="col" className="px-4 py-3">ID</th>
                      <th scope="col" className="px-4 py-3">Bot Type</th>
                      <th scope="col" className="px-4 py-3">Pair</th>
                      <th scope="col" className="px-4 py-3">Price</th>
                      <th scope="col" className="px-4 py-3">Signal Type</th>
                      <th scope="col" className="px-4 py-3">Strength</th>
                      <th scope="col" className="px-4 py-3">Recommended</th>
                      <th scope="col" className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {botData.map((item) => (
                      <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-white">{item.id}</td>
                        <td className="px-4 py-3 text-white">{item.bot_type}</td>
                        <td className="px-4 py-3 text-white">{item.pair}</td>
                        <td className="px-4 py-3 text-white">${item.price.toFixed(4)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.signal_type === 'buy' ? 'bg-green-600 text-white' : 
                            item.signal_type === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                          }`}>
                            {item.signal_type?.toUpperCase() || 'NEUTRAL'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white">{item.signal_strength}</td>
                        <td className="px-4 py-3 text-white">
                          {item.is_recommended ? (
                            <Star className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{new Date(item.timestamp).toLocaleString()}</td>
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
