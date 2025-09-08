import { useState, useEffect } from 'react';
import { 
  Settings, Bell, DollarSign, Activity, Shield, Target, TrendingUp,
  User, LogOut, BarChart3, Globe, Filter
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import ErrorBoundary from './ErrorBoundary';
import { fetchForexFactoryNews, getImpactColor, formatEventTime, ForexFactoryEvent } from '../services/forexFactoryService';

const DashboardOffline = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // News functionality state variables
  const [forexNews, setForexNews] = useState<ForexFactoryEvent[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedNewsDate, setSelectedNewsDate] = useState(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');

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

  // Load news on component mount
  useEffect(() => {
    refreshNews();
  }, [selectedNewsDate, selectedCurrency]);

  // Initialize dashboard data - Render deployment friendly with offline mode
  useEffect(() => {
    const initializeDashboardData = () => {
      if (!user?.email) {
        setIsLoadingData(false);
        return;
      }

      // Check for cached data first
      const cacheKey = `dashboard_${user.email}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setDashboardData(parsedData);
          setIsLoadingData(false);
          return;
        } catch (e) {
          // Invalid cached data, continue to fallback
        }
      }

      // Render deployment: Use offline mode with demo data
      const offlineData = {
        userProfile: {
          propFirm: 'FTMO',
          accountType: 'Challenge',
          accountSize: '$100,000',
          experience: 'Intermediate',
          tradesPerDay: '3-5',
          riskPerTrade: '1.5%',
          riskReward: '1:3',
          session: 'London/NY'
        },
        performance: {
          accountBalance: 98750,
          winRate: 67.5,
          totalTrades: 24,
          totalPnL: 2150.75
        },
        propFirmRules: {
          maxDailyLoss: 5000,
          maxTotalLoss: 10000,
          profitTarget: 10000,
          minTradingDays: 10
        },
        riskProtocol: {
          maxDailyRisk: 1500,
          maxDailyRiskPct: '1.5%',
          baseTradeRisk: 1000,
          baseTradeRiskPct: '1.0%',
          minRiskReward: '1:2.5'
        },
        assets: { 
          crypto: ['BTC/USD', 'ETH/USD'], 
          forex: ['EUR/USD', 'GBP/USD', 'USD/JPY'] 
        }
      };

      // Cache the offline data
      localStorage.setItem(cacheKey, JSON.stringify(offlineData));
      
      // Set data with slight delay to prevent React error #310
      setTimeout(() => {
        setDashboardData(offlineData);
        setIsLoadingData(false);
      }, 300);
    };

    initializeDashboardData();
  }, [user?.email]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-white text-center">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                TraderEdge Pro
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">BETA</span>
              </h1>
              <span className="text-sm text-gray-400">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
              
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-medium">{user?.email?.split('@')[0] || 'Trader'}</span>
              </div>
              
              <button 
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'performance', label: 'Performance', icon: TrendingUp },
                { id: 'risk', label: 'Risk Management', icon: Shield },
                { id: 'trades', label: 'Trades', icon: Activity }
              ].map((tab) => {
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
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Account Balance */}
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-medium">Account Balance</h3>
                  <DollarSign className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  ${dashboardData?.performance?.accountBalance?.toLocaleString() || '0'}
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-green-400 text-sm">+2.15%</span>
                </div>
              </div>

              {/* Win Rate */}
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-medium">Win Rate</h3>
                  <Target className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {dashboardData?.performance?.winRate || 0}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full" 
                    style={{ width: `${dashboardData?.performance?.winRate || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Total Trades */}
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-medium">Total Trades</h3>
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {dashboardData?.performance?.totalTrades || 0}
                </div>
                <div className="text-sm text-gray-400 mt-2">This month</div>
              </div>

              {/* P&L */}
              <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-400 text-sm font-medium">Total P&L</h3>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-400">
                  +${dashboardData?.performance?.totalPnL?.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-gray-400 mt-2">All time</div>
              </div>
            </div>
          )}

          {/* News Section */}
          {activeTab === 'overview' && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-8">
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
          )}

          {activeTab === 'performance' && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Performance Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-400 mb-4">Trading Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="text-white">{dashboardData?.performance?.winRate || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Trades:</span>
                      <span className="text-white">{dashboardData?.performance?.totalTrades || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Account Balance:</span>
                      <span className="text-white">${dashboardData?.performance?.accountBalance?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-4">Risk Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk per Trade:</span>
                      <span className="text-white">{dashboardData?.userProfile?.riskPerTrade || '1.5%'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Risk Reward:</span>
                      <span className="text-white">{dashboardData?.userProfile?.riskReward || '1:3'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risk' && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Risk Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-400 mb-4">Prop Firm Rules</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Daily Loss:</span>
                      <span className="text-white">${dashboardData?.propFirmRules?.maxDailyLoss?.toLocaleString() || '5,000'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Total Loss:</span>
                      <span className="text-white">${dashboardData?.propFirmRules?.maxTotalLoss?.toLocaleString() || '10,000'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Profit Target:</span>
                      <span className="text-white">${dashboardData?.propFirmRules?.profitTarget?.toLocaleString() || '10,000'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 mb-4">Trading Assets</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Forex:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dashboardData?.assets?.forex?.map((asset: string, index: number) => (
                          <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-sm">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Crypto:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {dashboardData?.assets?.crypto?.map((asset: string, index: number) => (
                          <span key={index} className="bg-orange-600 text-white px-2 py-1 rounded text-sm">
                            {asset}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Recent Trades</h2>
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">No trades available in offline mode</p>
                <p className="text-sm text-gray-500 mt-2">Connect to the internet to view live trading data</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardOffline;
