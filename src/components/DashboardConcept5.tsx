import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingState, TradeOutcome, Signal, Trade, PerformanceMetrics } from '../trading/types';
import { 
  Layers, Zap, Shield, PieChart, BookOpen, GitBranch, Target, Cpu, Bell, Settings, LogOut, DollarSign, Activity, Award, TrendingUp, Bitcoin, Globe
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import SignalsFeed from './SignalsFeed';
import EnhancedUserSignalsFeed from './EnhancedUserSignalsFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import MultiAccountTracker from './MultiAccountTracker';
import NotificationCenter from './NotificationCenter';
import PropFirmRules from './PropFirmRules';
import RiskManagementPlan from './RiskManagementPlan';
import LiveChatWidget from './LiveChatWidget';
import ConsentForm from './ConsentForm';
import UserScreenshotTab from './UserScreenshotTab';
import ForexData from './ForexData';
import CryptoDashboard from './CryptoDashboard';
import { getAllTimezones, getMarketStatus } from '../services/timezoneService';
import { fetchForexFactoryNews, getImpactColor, formatEventTime, ForexFactoryEvent } from '../services/forexFactoryService';

interface DashboardConcept5Props {
  onLogout: () => void;
  tradingState: TradingState | null;
  dashboardData: any;
  handleMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
}

const DashboardConcept5: React.FC<DashboardConcept5Props> = ({ onLogout, tradingState, dashboardData: initialDashboardData, handleMarkAsTaken }) => {
  const { user } = useUser();
  const { tradingPlan, propFirm, accountConfig, loading: tradingPlanLoading } = useTradingPlan();

  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [isBotRunning, setIsBotRunning] = useState(false);

  useEffect(() => {
    if (!tradingPlanLoading && tradingPlan && propFirm && accountConfig) {
      const accountValue = tradingPlan.userProfile.hasAccount === 'yes'
        ? tradingPlan.userProfile.accountEquity
        : accountConfig.size;

      const newData = {
        userProfile: {
          propFirm: propFirm.name || 'Not Set',
          accountType: accountConfig.challengeType || 'Not Set',
          accountSize: accountValue || 10000,
          experience: tradingPlan.userProfile.experience || 'Not Set',
          uniqueId: user?.uniqueId || 'Not Set',
        },
        performance: {
          accountBalance: accountValue || 10000,
          totalPnl: tradingState?.performanceMetrics.totalPnl || 0,
          winRate: tradingState?.performanceMetrics.winRate || 0,
          totalTrades: tradingState?.performanceMetrics.totalTrades || 0,
        },
        riskProtocol: {
          maxDailyRisk: tradingPlan.riskParameters.maxDailyRisk || 5000,
          riskPerTrade: tradingPlan.riskParameters.baseTradeRisk || 1000,
          maxDrawdown: tradingPlan.propFirmCompliance.totalDrawdownLimit || '10%',
        },
      };
      setDashboardData(newData);
      setIsLoading(false);
    } else if (!tradingPlanLoading) {
      setIsLoading(false);
    }
  }, [tradingPlan, propFirm, accountConfig, user, tradingState, tradingPlanLoading]);

  const navigate = useNavigate();
  const aiCoachRef = useRef<HTMLIFrameElement>(null);
  
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const saved = localStorage.getItem(`dashboard_active_tab_${user.email}`);
      return saved || 'overview';
    }
    return 'overview';
  });
  const [selectedAccount, setSelectedAccount] = useState('');
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const saved = localStorage.getItem(`dashboard_timezone_${user.email}`);
      return saved || 'Asia/Kolkata';
    }
    return 'Asia/Kolkata';
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [forexNews, setForexNews] = useState<ForexFactoryEvent[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [selectedNewsDate, setSelectedNewsDate] = useState(new Date());
  const [selectedCurrency, setSelectedCurrency] = useState('ALL');
  const [showConsentForm, setShowConsentForm] = useState(() => {
    const consentAccepted = localStorage.getItem('user_consent_accepted') === 'true';
    return !consentAccepted;
  });

  // Save active tab to localStorage when it changes
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`dashboard_active_tab_${user.email}`, activeTab);
    }
  }, [activeTab, user?.email]);

  // Save timezone to localStorage when it changes
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`dashboard_timezone_${user.email}`, selectedTimezone);
    }
  }, [selectedTimezone, user?.email]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch market status and news
  useEffect(() => {
    const fetchData = async () => {
      try {
        const status = await getMarketStatus(selectedTimezone);
        setMarketStatus(status);
      } catch (error) {
        console.error('Error fetching market status:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedTimezone]);

  // Fetch forex news
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoadingNews(true);
      try {
        const news = await fetchForexFactoryNews(selectedNewsDate, selectedCurrency);
        setForexNews(news);
      } catch (error) {
        console.error('Error fetching forex news:', error);
      } finally {
        setIsLoadingNews(false);
      }
    };

    fetchNews();
  }, [selectedNewsDate, selectedCurrency]);

  // Early return for loading state - must be after all hooks
  if (isLoading) {
    return <div>Loading Dashboard Data...</div>;
  }

  const handleConsentAccept = () => {
    localStorage.setItem('user_consent_accepted', 'true');
    setShowConsentForm(false);
  };

  const handleConsentDecline = () => {
    localStorage.setItem('user_consent_accepted', 'false');
    setShowConsentForm(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Account Balance</p>
                    <p className="text-2xl font-bold text-white">${dashboardData?.performance?.accountBalance?.toLocaleString() || '0'}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total P&L</p>
                    <p className={`text-2xl font-bold ${dashboardData?.performance?.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${dashboardData?.performance?.totalPnl?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Win Rate</p>
                    <p className="text-2xl font-bold text-white">{dashboardData?.performance?.winRate || '0'}%</p>
                  </div>
                  <Award className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Trades</p>
                    <p className="text-2xl font-bold text-white">{dashboardData?.performance?.totalTrades || '0'}</p>
                  </div>
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
              </div>
            </div>

            {/* Market Status */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-4">Market Status</h3>
              {marketStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(marketStatus).map(([market, status]: [string, any]) => (
                    <div key={market} className="text-center">
                      <p className="text-gray-400 text-sm">{market}</p>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        status.isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {status.isOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent News */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
              <h3 className="text-xl font-semibold text-white mb-4">Latest Forex News</h3>
              {isLoadingNews ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {forexNews.slice(0, 5).map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{event.currency}</p>
                        <p className="text-gray-400 text-sm">{event.title}</p>
                      </div>
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(event.impact)}`}>
                          {event.impact}
                        </div>
                        <p className="text-gray-400 text-sm">{formatEventTime(event.time, selectedTimezone)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'forex':
        return <ForexData isBotRunning={isBotRunning} setIsBotRunning={setIsBotRunning} />;

      case 'crypto':
        return <CryptoDashboard isBotRunning={isBotRunning} setIsBotRunning={setIsBotRunning} />;

      case 'signals':
        return <SignalsFeed onMarkAsTaken={handleMarkAsTaken} />;

      case 'performance':
        return <PerformanceAnalytics tradingState={tradingState} />;

      case 'accounts':
        return <MultiAccountTracker selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />;

      case 'risk':
        return <RiskManagementPlan />;

      case 'rules':
        return <PropFirmRules />;

      case 'screenshots':
        return <UserScreenshotTab />;

      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ConsentForm 
        isOpen={showConsentForm}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
      
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">
                TraderEdge Pro
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">BETA</span>
              </h1>
              <div className="text-sm text-gray-400">
                {currentTime.toLocaleString('en-US', { 
                  timeZone: selectedTimezone,
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {getAllTimezones().map(timezone => (
                  <option key={timezone.value} value={timezone.value}>
                    {timezone.label}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => navigate('/ai-coach')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                AI Coach
              </button>
              
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <nav className="flex space-x-1 bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 mb-8 border border-gray-700/50">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview</span>
          </button>
          
          <button
            onClick={() => setActiveTab('forex')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'forex'
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Forex Data</span>
          </button>
          
          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'crypto'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Bitcoin className="w-4 h-4" />
            <span>Crypto Data</span>
          </button>
          
          <button
            onClick={() => setActiveTab('signals')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'signals'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Signals</span>
          </button>
          
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'performance'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Performance</span>
          </button>
          
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'accounts'
                ? 'bg-pink-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Accounts</span>
          </button>
          
          <button
            onClick={() => setActiveTab('risk')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'risk'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Risk</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rules'
                ? 'bg-orange-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Rules</span>
          </button>
          
          <button
            onClick={() => setActiveTab('screenshots')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'screenshots'
                ? 'bg-teal-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Screenshots</span>
          </button>
        </nav>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {renderTabContent()}
        </div>
      </div>

      {/* Live Chat Widget */}
      <div style={{ display: 'none' }}>
        <LiveChatWidget />
      </div>
    </div>
  );
};

export default DashboardConcept5;
