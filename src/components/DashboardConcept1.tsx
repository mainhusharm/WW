import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TradingState, TradeOutcome, Signal, Trade, PerformanceMetrics } from '../trading/types';
import { 
  Layers, Zap, Shield, PieChart, BookOpen, GitBranch, Target, Cpu, Bell, Settings, LogOut, DollarSign, Activity, Award, MessageSquare 
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { useDashboardData } from './DashboardDataReader';
import { userDataService } from '../services/userDataService';
import SignalsFeed from './SignalsFeed';
import NewSignalsFeed from './NewSignalsFeed';
import OriginalSignalsFeed from './OriginalSignalsFeed';
import AdminSignalsFeed from './AdminSignalsFeed';
import EnhancedUserSignalsFeed from './EnhancedUserSignalsFeed';
import WorkingSignalsFeed from './WorkingSignalsFeed';
import SimpleSignalsFeed from './SimpleSignalsFeed';
import RealTimeSignalsFeed from './RealTimeSignalsFeed';
import AdminConnectedSignalsFeed from './AdminConnectedSignalsFeed';
import DirectAdminSignalsFeed from './DirectAdminSignalsFeed';
import RealAdminSignalsFeed from './RealAdminSignalsFeed';
import EnhancedSignalsFeed from './EnhancedSignalsFeed';
import PaymentBasedCustomerDatabase from './PaymentBasedCustomerDatabase';
import PerformanceAnalytics from './PerformanceAnalytics';
import MultiAccountTracker from './MultiAccountTracker';
import NotificationCenter from './NotificationCenter';
import PropFirmRules from './PropFirmRules';
import NewPropFirmRules from './NewPropFirmRules';
import RiskManagementPlan from './RiskManagementPlan';
import LiveChatWidget from './LiveChatWidget';
import ConsentForm from './ConsentForm';
import UserScreenshotTab from './UserScreenshotTab';
import UserSupportDashboard from './UserSupportDashboard';
import AICoach from './AICoach';
import { getAllTimezones, getMarketStatus } from '../services/timezoneService';
import { fetchForexFactoryNews, getImpactColor, formatEventTime, ForexFactoryEvent } from '../services/forexFactoryService';
import { useSafeEffect, useSafeInterval, useSafeTimeout } from '../hooks/useSafeEffect';
import { journalService, JournalEntry } from '../services/journalService';

interface DashboardConcept1Props {
  onLogout: () => void;
  tradingState: TradingState | null;
  dashboardData: any;
  handleMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
}

const DashboardConcept1: React.FC<DashboardConcept1Props> = ({ onLogout, tradingState, dashboardData: initialDashboardData, handleMarkAsTaken }) => {
  const { user } = useUser();
  const { tradingPlan, propFirm, accountConfig, accounts, selectedAccountId, selectAccount, loading: tradingPlanLoading } = useTradingPlan();
  const { dashboardData: localStorageData, loading: localStorageLoading } = useDashboardData();

  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    // Restore active tab from localStorage if available
    if (typeof window !== 'undefined' && user?.email) {
      const saved = localStorage.getItem(`dashboard_active_tab_${user.email}`);
      return saved || 'overview';
    }
    return 'overview';
  });

  useEffect(() => {
    // Use localStorage data if available, otherwise fall back to context data
    if (!localStorageLoading && localStorageData) {
      setDashboardData(localStorageData);
      setIsLoading(false);
    } else if (!tradingPlanLoading && tradingPlan && propFirm && accountConfig) {
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
    } else if (!tradingPlanLoading && !localStorageLoading) {
      // Handle case where both context and localStorage are loaded but data is missing
      setIsLoading(false);
    }
  }, [tradingPlan, propFirm, accountConfig, user, tradingState, tradingPlanLoading, localStorageData, localStorageLoading]);

  const [selectedAccount, setSelectedAccount] = useState('');
  const [marketStatus, setMarketStatus] = useState<any>(null);
  const [selectedTimezone, setSelectedTimezone] = useState(() => {
    // Restore timezone from localStorage if available
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
    // Check if user has already accepted the simplified consent
    const consentAccepted = localStorage.getItem('user_consent_accepted') === 'true';
    return !consentAccepted;
  });
  
  // Settings state
  const [userSettings, setUserSettings] = useState(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const saved = localStorage.getItem(`user_settings_${user.email}`);
      return saved ? JSON.parse(saved) : {
        // Account Profile
        profile: {
          firstName: user?.name?.split(' ')[0] || '',
          lastName: user?.name?.split(' ')[1] || '',
          email: user?.email || '',
          phone: '',
          country: 'United States',
          language: 'English',
          bio: ''
        },
        // Risk Management
        riskPerTrade: 1,
        maxDailyRisk: 5,
        maxDrawdown: 10,
        stopLossDefault: 50,
        takeProfitDefault: 100,
        riskRewardRatio: 2,
        // Trading Preferences
        trading: {
          defaultLotSize: 0.1,
          maxPositions: 5,
          autoCloseOnProfit: false,
          autoCloseOnLoss: true,
          slippage: 3,
          executionMode: 'market',
          confirmTrades: true,
          oneClickTrading: false
        },
        // Display & Theme
        display: {
          theme: 'dark',
          accentColor: 'cyan',
          fontSize: 'medium',
          compactMode: false,
          showAnimations: true,
          chartStyle: 'candlestick',
          defaultTimeframe: '1h'
        },
        // Notifications
        notifications: {
          signals: true,
          news: true,
          trades: true,
          priceAlerts: true,
          email: true,
          push: true,
          sound: true,
          desktop: true
        },
        // Security
        security: {
          twoFactorAuth: false,
          sessionTimeout: 30,
          loginNotifications: true,
          deviceTracking: true,
          autoLogout: true
        },
        // Data & Export
        data: {
          autoBackup: true,
          backupFrequency: 'daily',
          exportFormat: 'csv',
          dataRetention: '1year',
          syncAcrossDevices: true
        },
        // API & Integrations
        api: {
          enableAPI: false,
          apiKey: '',
          webhookUrl: '',
          telegramBot: '',
          discordWebhook: ''
        },
        // General
        currency: 'USD',
        timezone: 'America/New_York',
        autoSave: true
      };
    }
    return {
      profile: {
        firstName: user?.name?.split(' ')[0] || '',
        lastName: user?.name?.split(' ')[1] || '',
        email: user?.email || '',
        phone: '',
        country: 'United States',
        language: 'English',
        bio: ''
      },
      riskPerTrade: 1,
      maxDailyRisk: 5,
      maxDrawdown: 10,
      stopLossDefault: 50,
      takeProfitDefault: 100,
      riskRewardRatio: 2,
      trading: {
        defaultLotSize: 0.1,
        maxPositions: 5,
        autoCloseOnProfit: false,
        autoCloseOnLoss: true,
        slippage: 3,
        executionMode: 'market',
        confirmTrades: true,
        oneClickTrading: false
      },
      display: {
        theme: 'dark',
        accentColor: 'cyan',
        fontSize: 'medium',
        compactMode: false,
        showAnimations: true,
        chartStyle: 'candlestick',
        defaultTimeframe: '1h'
      },
      notifications: {
        signals: true,
        news: true,
        trades: true,
        priceAlerts: true,
        email: true,
        push: true,
        sound: true,
        desktop: true
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 30,
        loginNotifications: true,
        deviceTracking: true,
        autoLogout: true
      },
      data: {
        autoBackup: true,
        backupFrequency: 'daily',
        exportFormat: 'csv',
        dataRetention: '1year',
        syncAcrossDevices: true
      },
      api: {
        enableAPI: false,
        apiKey: '',
        webhookUrl: '',
        telegramBot: '',
        discordWebhook: ''
      },
      currency: 'USD',
      timezone: 'America/New_York',
      autoSave: true
    };
  });
  
  const [activeSettingsTab, setActiveSettingsTab] = useState('risk');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalLoading, setJournalLoading] = useState(true);
  
  // Account data state for real-time updates
  const [currentAccountData, setCurrentAccountData] = useState({
    accountBalance: 10000,
    totalPnl: 0,
    winRate: 0,
    totalTrades: 0
  });
  
  const [newJournalEntry, setNewJournalEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    symbol: '',
    direction: 'BUY',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    pnl: '',
    notes: '',
    tags: []
  });
  
  // Load journal entries
  useEffect(() => {
    const loadJournalEntries = async () => {
      if (user?.email) {
        try {
          setJournalLoading(true);
          const entries = await journalService.getEntries(user.email);
          setJournalEntries(entries);
        } catch (error) {
          console.error('Error loading journal entries:', error);
        } finally {
          setJournalLoading(false);
        }
      }
    };

    loadJournalEntries();
  }, [user?.email]);

  // Load account data from userDataService
  useEffect(() => {
    if (user?.email) {
      // Ensure userDataService is initialized with the correct email
      userDataService.setUserEmail(user.email);

      const accountData = userDataService.getAccountData();
      if (accountData) {
        setCurrentAccountData(accountData);
      } else {
        // Fallback: Calculate from questionnaire data
        const questionnaireAnswers = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
        const hasAccount = questionnaireAnswers.hasAccount === 'yes';
        const accountBalance = hasAccount
          ? parseFloat(questionnaireAnswers.accountEquity) || 0
          : parseFloat(questionnaireAnswers.accountSize) || 0;

        if (accountBalance > 0) {
          setCurrentAccountData(prev => ({
            ...prev,
            accountBalance: accountBalance
          }));
        }
      }
    }
  }, [user?.email]);

  // Refresh account data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.email) {
        const accountData = userDataService.getAccountData();
        if (accountData) {
          setCurrentAccountData(accountData);
        }
      }
    }, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [user?.email]);

  // Save dashboard state for persistence
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`dashboard_active_tab_${user.email}`, activeTab);
      localStorage.setItem(`dashboard_timezone_${user.email}`, selectedTimezone);
      localStorage.setItem(`user_settings_${user.email}`, JSON.stringify(userSettings));
    }
  }, [activeTab, selectedTimezone, userSettings, user?.email]);
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    totalPnl: 0,
    winRate: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    maxDrawdown: 0,
    currentDrawdown: 0,
    grossProfit: 0,
    grossLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0
  });

  // Update performance metrics based on trades
  const updatePerformanceMetrics = (trades: Trade[]) => {
    if (trades.length === 0) {
      setPerformanceMetrics({
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        currentDrawdown: 0,
        grossProfit: 0,
        grossLoss: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      });
      return;
    }

    const totalTrades = trades.length;
    const winningTrades = trades.filter(trade => (trade.pnl || 0) > 0);
    const losingTrades = trades.filter(trade => (trade.pnl || 0) < 0);
    
    const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0));
    
    const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
    const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    
    // Calculate consecutive wins/losses
    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    
    trades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
      } else if ((trade.pnl || 0) < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
      }
    });
    
    // Calculate max drawdown
    let maxDrawdown = 0;
    let peak = dashboardData?.performance?.accountBalance || 10000;
    let runningEquity = peak;
    
    trades.forEach(trade => {
      runningEquity += (trade.pnl || 0);
      if (runningEquity > peak) {
        peak = runningEquity;
      }
      const drawdown = ((peak - runningEquity) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });
    
    const currentEquity = (dashboardData?.performance?.accountBalance || 10000) + totalPnl;
    const currentDrawdown = peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;
    
    setPerformanceMetrics({
      totalPnl,
      winRate,
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin,
      averageLoss,
      profitFactor,
      maxDrawdown,
      currentDrawdown,
      grossProfit,
      grossLoss,
      consecutiveWins,
      consecutiveLosses
    });
  };

  // Load user trades from localStorage on component mount
  useEffect(() => {
    const storedTrades = localStorage.getItem('userTrades');
    if (storedTrades) {
      try {
        const trades = JSON.parse(storedTrades);
        setUserTrades(trades);
        // updatePerformanceMetrics will be called after the function is defined
      } catch (error) {
        console.error('Error parsing stored trades:', error);
      }
    }
  }, []);

  // Update performance metrics when trades change
  useEffect(() => {
    updatePerformanceMetrics(userTrades);
  }, [userTrades, dashboardData?.performance?.accountBalance]);

  // Use safe interval hook to prevent React error #310
  useSafeInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Update every minute instead of every second

  // Use safe effect for market status updates
  useSafeEffect(() => {
    const updateMarketStatus = () => {
      const status = getMarketStatus(selectedTimezone);
      setMarketStatus(status);
    };
    
    updateMarketStatus();
  }, [selectedTimezone]);

  // Use safe interval for periodic market status updates
  useSafeInterval(() => {
    const status = getMarketStatus(selectedTimezone);
    setMarketStatus(status);
  }, 60000);

  // Use safe effect for news loading with debouncing
  useSafeEffect(() => {
    const loadNewsData = async () => {
      if (isLoadingNews) return;
      setIsLoadingNews(true);
      try {
        const news = await fetchForexFactoryNews(selectedNewsDate, selectedCurrency);
        setForexNews(news);
      } catch (error) {
        // Silently handle errors - fallback data is already provided by the service
        console.log('Using fallback news data due to API limitations');
      } finally {
        setIsLoadingNews(false);
      }
    };
    
    loadNewsData();
  }, [selectedNewsDate, selectedCurrency]);

  // Early return for loading state - must be after all hooks
  if (isLoading) {
    return <div>Loading Dashboard Data...</div>;
  }

  const handleNewsDateChange = (e: React.ChangeEvent<HTMLInputElement>) => setSelectedNewsDate(new Date(e.target.value));
  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCurrency(e.target.value);

  const handleTabClick = (tabId: string) => {
    console.log('Clicked tab:', tabId);
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
  };

  
  const handleSettingsUpdate = (key: string, value: any) => {
    setUserSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleNestedSettingsUpdate = (category: string, key: string, value: any) => {
    setUserSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };
  
  const handleNotificationUpdate = (key: string, value: boolean) => {
    setUserSettings((prev: any) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };
  
  const handleAddJournalEntry = async () => {
    if (!newJournalEntry.symbol || !newJournalEntry.entryPrice || !user?.email) return;
    
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: newJournalEntry.date,
      symbol: newJournalEntry.symbol,
      direction: newJournalEntry.direction as 'BUY' | 'SELL',
      entryPrice: parseFloat(newJournalEntry.entryPrice),
      exitPrice: parseFloat(newJournalEntry.exitPrice) || 0,
      quantity: parseFloat(newJournalEntry.quantity) || 0,
      pnl: parseFloat(newJournalEntry.pnl) || 0,
      notes: newJournalEntry.notes,
      tags: newJournalEntry.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    try {
      await journalService.saveEntry(entry, user.email);
      setJournalEntries((prev) => [entry, ...prev]);
      setNewJournalEntry({
        date: new Date().toISOString().split('T')[0],
        symbol: '',
        direction: 'BUY',
        entryPrice: '',
        exitPrice: '',
        quantity: '',
        pnl: '',
        notes: '',
        tags: []
      });
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };
  
  const handleDeleteJournalEntry = async (id: string) => {
    if (!user?.email) return;
    
    try {
      await journalService.deleteEntry(id, user.email);
      setJournalEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  const handleConsentAccept = () => {
    setShowConsentForm(false);
  };

  const handleConsentDecline = () => {
    // Redirect user away or show alternative action
    onLogout();
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'risk', label: 'Risk Management', icon: '⚠️' },
    { id: 'trading', label: 'Trading', icon: '📈' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'data', label: 'Data & Export', icon: '💾' },
    { id: 'api', label: 'API & Integrations', icon: '🔗' },
    { id: 'screenshot', label: 'Screenshot', icon: '📷' }
  ];

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="holo-card">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          Settings
        </h2>
        
        {/* Settings Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-900/30 rounded-lg">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeSettingsTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Settings Content */}
        {activeSettingsTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={userSettings.profile?.firstName || ''}
                  onChange={(e) => handleNestedSettingsUpdate('profile', 'firstName', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={userSettings.profile?.lastName || ''}
                  onChange={(e) => handleNestedSettingsUpdate('profile', 'lastName', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'risk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Risk Management</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Risk Per Trade (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={userSettings.riskPerTrade}
                    onChange={(e) => handleSettingsUpdate('riskPerTrade', parseFloat(e.target.value))}
                    className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                  <div className="absolute right-3 top-3 text-cyan-400">%</div>
                </div>
                <div className="mt-2 text-xs text-gray-400">Recommended: 1-2% per trade</div>
              </div>
              
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Max Daily Risk (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.5"
                    value={userSettings.maxDailyRisk}
                    onChange={(e) => handleSettingsUpdate('maxDailyRisk', parseFloat(e.target.value))}
                    className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  />
                  <div className="absolute right-3 top-3 text-cyan-400">%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Preferences</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Base Currency</label>
                <select
                  value={userSettings.currency}
                  onChange={(e) => handleSettingsUpdate('currency', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </div>
              
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Timezone</label>
                <select
                  value={userSettings.timezone}
                  onChange={(e) => handleSettingsUpdate('timezone', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                >
                  <option value="America/New_York">New York (EST)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                  <option value="Asia/Kolkata">Mumbai (IST)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        )}
        
        {activeSettingsTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Notification Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(userSettings.notifications || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
                  <span className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1')} Alerts</span>
                  <button
                    onClick={() => handleNotificationUpdate(key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'trading' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Trading Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Default Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={userSettings.trading?.defaultLotSize || 0.1}
                  onChange={(e) => handleNestedSettingsUpdate('trading', 'defaultLotSize', parseFloat(e.target.value))}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Max Positions</label>
                <input
                  type="number"
                  value={userSettings.trading?.maxPositions || 5}
                  onChange={(e) => handleNestedSettingsUpdate('trading', 'maxPositions', parseInt(e.target.value))}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'display' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Display & Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Theme</label>
                <select
                  value={userSettings.display?.theme || 'dark'}
                  onChange={(e) => handleNestedSettingsUpdate('display', 'theme', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Accent Color</label>
                <select
                  value={userSettings.display?.accentColor || 'cyan'}
                  onChange={(e) => handleNestedSettingsUpdate('display', 'accentColor', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="cyan">Cyan</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
                <div>
                  <span className="text-white font-medium">Two-Factor Authentication</span>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <button
                  onClick={() => handleNestedSettingsUpdate('security', 'twoFactorAuth', !userSettings.security?.twoFactorAuth)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    userSettings.security?.twoFactorAuth ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      userSettings.security?.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'data' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Data & Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Export Format</label>
                <select
                  value={userSettings.data?.exportFormat || 'csv'}
                  onChange={(e) => handleNestedSettingsUpdate('data', 'exportFormat', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Data Retention</label>
                <select
                  value={userSettings.data?.dataRetention || '1year'}
                  onChange={(e) => handleNestedSettingsUpdate('data', 'dataRetention', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="1month">1 Month</option>
                  <option value="6months">6 Months</option>
                  <option value="1year">1 Year</option>
                  <option value="forever">Forever</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'api' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">API & Integrations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={userSettings.api?.apiKey || ''}
                  onChange={(e) => handleNestedSettingsUpdate('api', 'apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={userSettings.api?.webhookUrl || ''}
                  onChange={(e) => handleNestedSettingsUpdate('api', 'webhookUrl', e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}

        {activeSettingsTab === 'screenshot' && <UserScreenshotTab />}
      </div>
    </div>
  );

  const renderJournal = () => (
    <div className="space-y-6">
      <div className="holo-card">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
          <BookOpen className="w-8 h-8 mr-3" />
          Trading Journal
        </h2>
        
        {/* Add New Entry Form */}
        <div className="bg-gray-900/30 rounded-lg p-6 mb-6 border border-cyan-400/20">
          <h3 className="text-lg font-semibold text-white mb-4">+ New Entry</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                value={newJournalEntry.date}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, date: e.target.value})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">Symbol</label>
              <input
                type="text"
                placeholder="EURUSD"
                value={newJournalEntry.symbol}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, symbol: e.target.value.toUpperCase()})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">Direction</label>
              <select
                value={newJournalEntry.direction}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, direction: e.target.value})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">Entry Price</label>
              <input
                type="number"
                step="0.00001"
                placeholder="1.0850"
                value={newJournalEntry.entryPrice}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, entryPrice: e.target.value})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">Exit Price</label>
              <input
                type="number"
                step="0.00001"
                placeholder="1.0900"
                value={newJournalEntry.exitPrice}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, exitPrice: e.target.value})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.10"
                value={newJournalEntry.quantity}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, quantity: e.target.value})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-cyan-300 text-sm font-medium mb-1">P&L ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="50.00"
                value={newJournalEntry.pnl}
                onChange={(e) => setNewJournalEntry({...newJournalEntry, pnl: e.target.value})}
                className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-cyan-300 text-sm font-medium mb-1">Notes</label>
            <textarea
              placeholder="Trade analysis, market conditions, lessons learned..."
              value={newJournalEntry.notes}
              onChange={(e) => setNewJournalEntry({...newJournalEntry, notes: e.target.value})}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 h-20"
            />
          </div>
          
          <button
            onClick={handleAddJournalEntry}
            disabled={!newJournalEntry.symbol || !newJournalEntry.entryPrice}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Add Entry
          </button>
        </div>
        
        {/* Journal Entries */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Entries ({journalEntries.length})</h3>
          {journalLoading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Loading journal entries...</p>
            </div>
          ) : journalEntries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No journal entries yet. Add your first trade above!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {journalEntries.map((entry: any) => (
                <div key={entry.id} className="bg-gray-900/40 rounded-lg p-4 border border-cyan-400/20 hover:border-cyan-400/40 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-white">{entry.symbol}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entry.direction === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {entry.direction}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        parseFloat(entry.pnl) >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {parseFloat(entry.pnl) >= 0 ? '+' : ''}${parseFloat(entry.pnl).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleDeleteJournalEntry(entry.id)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-400">Entry:</span>
                      <span className="text-white ml-2">{entry.entryPrice}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Exit:</span>
                      <span className="text-white ml-2">{entry.exitPrice || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Size:</span>
                      <span className="text-white ml-2">{entry.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white ml-2">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  
                  {entry.notes && (
                    <div className="text-sm text-gray-300 bg-gray-800/50 rounded p-3 mt-3">
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const hasProAccess = user && ['pro', 'professional', 'elite', 'enterprise'].includes(user.membershipTier || '');
  const hasJournalAccess = hasProAccess;
  const hasMultiAccountAccess = hasProAccess;

  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: <Layers className="w-5 h-5" /> },
    { id: 'signals', label: 'Signal Feed', icon: <Zap className="w-5 h-5" /> },
    { id: 'rules', label: 'Prop Firm Rules', icon: <Shield className="w-5 h-5" /> },
    { id: 'analytics', label: 'Performance', icon: <PieChart className="w-5 h-5" /> },
    ...(hasJournalAccess ? [{ id: 'journal', label: 'Trade Journal', icon: <BookOpen className="w-5 h-5" /> }] : []),
    ...(hasMultiAccountAccess ? [{ id: 'accounts', label: 'Multi-Account', icon: <GitBranch className="w-5 h-5" /> }] : []),
    { id: 'risk-protocol', label: 'Risk Protocol', icon: <Target className="w-5 h-5" /> },
    { id: 'ai-coach', label: 'AI Coach', icon: <Cpu className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
    { id: 'support', label: 'Support', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  // Calculate current equity from questionnaire data and performance
  const questionnaireAnswers = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
  const hasAccount = questionnaireAnswers.hasAccount === 'yes';
  const initialBalance = hasAccount
    ? parseFloat(questionnaireAnswers.accountEquity)
    : parseFloat(questionnaireAnswers.accountSize) || dashboardData?.performance?.accountBalance || 10000;

  const currentEquity = currentAccountData.accountBalance;
  
  const stats = [
    {
      label: hasAccount ? 'Account Equity' : 'Account Balance',
      value: `$${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarSign className="w-8 h-8" />,
    },
    {
      label: 'Win Rate',
      value: `${currentAccountData.winRate.toFixed(1)}%`,
      icon: <Target className="w-8 h-8" />,
    },
    {
      label: 'Total Trades',
      value: currentAccountData.totalTrades,
      icon: <Activity className="w-8 h-8" />,
    },
    {
      label: 'Total P&L',
      value: `${currentAccountData.totalPnl >= 0 ? '+' : ''}$${currentAccountData.totalPnl.toFixed(2)}`,
      icon: <Award className="w-8 h-8" />,
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="holo-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome, {user?.name}</h2>
            <p className="text-gray-400">Your {user?.membershipTier?.charAt(0).toUpperCase() + (user?.membershipTier?.slice(1) || '')} Dashboard</p>
            <p className="text-gray-400">User ID: {dashboardData?.userProfile?.uniqueId || user?.uniqueId}</p>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm max-w-4xl mx-auto">
              <div className="bg-gray-800/50 rounded-lg p-3"><span className="text-gray-400">Prop Firm:</span><span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.propFirm || 'Not Set'}</span></div>
              <div className="bg-gray-800/50 rounded-lg p-3"><span className="text-gray-400">Account Type:</span><span className="text-white ml-2 font-semibold">{dashboardData?.userProfile?.accountType || 'Not Set'}</span></div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <span className="text-gray-400">{hasAccount ? 'Account Equity:' : 'Account Size:'}</span>
                <span className="text-white ml-2 font-semibold">
                  {initialBalance ? `$${initialBalance.toLocaleString()}` : 'Not Set'}
                </span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3"><span className="text-gray-400">Experience:</span><span className="text-white ml-2 font-semibold capitalize">{dashboardData?.userProfile?.experience || 'Not Set'}</span></div>
            </div>
          </div>
          <div className="text-right space-y-2">
            <div className="text-sm text-gray-400">Timezone</div>
            <select value={selectedTimezone} onChange={(e) => setSelectedTimezone(e.target.value)} className="bg-gray-800 text-white p-2 rounded border border-gray-600 max-w-xs">
              {getAllTimezones().map((tz) => <option key={tz.value} value={tz.value}>{tz.label} ({tz.offset})</option>)}
            </select>
          </div>
        </div>
      </div>
      <div className="holo-stats">{stats.map((stat, index) => <div key={index} className="holo-stat"><div className="holo-value">{stat.value}</div><div style={{color: 'rgba(255,255,255,0.5)', marginTop: '10px'}}>{stat.label}</div></div>)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 holo-card">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
          {userTrades.length === 0 ? (
            <div className="text-center py-12"><Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" /><div className="text-gray-400 text-lg font-medium mb-2">No trades recorded yet</div><div className="text-gray-500 text-sm">Trades will appear here after marking signals as taken</div></div>
          ) : (
            <div className="space-y-4">{userTrades.slice(-5).reverse().map((trade, index) => <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"><div className="flex items-center space-x-4"><div className={`w-3 h-3 rounded-full ${(trade.pnl || 0) > 0 ? 'bg-green-400' : (trade.pnl || 0) < 0 ? 'bg-red-400' : 'bg-yellow-400'}`}></div><div><div className="text-white font-medium">{trade.pair}</div><div className="text-sm text-gray-400">{trade.outcome} • {new Date(trade.entryTime).toLocaleTimeString()}</div></div></div><div className="text-right"><div className={`font-medium ${(trade.pnl || 0) > 0 ? 'text-green-400' : (trade.pnl || 0) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>${(trade.pnl || 0).toFixed(2)}</div></div></div>)}</div>
          )}
        </div>
        <div className="holo-card">
          <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
          {marketStatus && <div className="space-y-4"><div className="text-xs text-gray-400 mb-2">{marketStatus.localTime}</div><div className="flex items-center justify-between"><span className="text-gray-400">Forex Market</span><div className="flex items-center space-x-2"><div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div><span className={`text-sm ${marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>{marketStatus.isOpen ? 'Open' : 'Closed'}</span></div></div><div className="flex items-center justify-between"><span className="text-gray-400">Current Session</span><span className="text-white text-sm">{marketStatus.currentSession}</span></div><div className="flex items-center justify-between"><span className="text-gray-400">Next Session</span><span className="text-white text-sm">{marketStatus.nextSession} ({marketStatus.timeUntilNext})</span></div></div>}
        </div>
        
        {/* News Section Removed - Only for Admin Dashboard */}
      </div>
    </div>
  );

  return (
    <>
      <ConsentForm 
        isOpen={showConsentForm}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
      <style>{`
        .concept1 { background: radial-gradient(ellipse at center, #0a0a1f 0%, #000000 100%); position: relative; overflow: hidden; width: 100%; height: 100vh; display: flex; }
        .neural-grid { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px); background-size: 50px 50px; animation: grid-move 20s linear infinite; }
        @keyframes grid-move { 0% { transform: translate(0, 0); } 100% { transform: translate(50px, 50px); } }
        .holo-sidebar { width: 250px; height: 100%; background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1)); backdrop-filter: blur(20px); border-right: 1px solid rgba(0, 255, 255, 0.3); z-index: 100; display: flex; flex-direction: column; }
        .holo-logo { padding: 30px; font-size: 24px; font-weight: bold; background: linear-gradient(45deg, #00ffff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; text-shadow: 0 0 15px rgba(0, 255, 136, 0.5); }
        .holo-menu-item { padding: 20px 30px; cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s; display: flex; align-items: center; gap: 15px; }
        .holo-menu-item.active { background: rgba(0, 255, 255, 0.1); border-left: 3px solid #00ffff; color: #00ffff; }
        .holo-menu-item:not(.active) { color: #fff; }
        .holo-menu-item::before { content: ''; position: absolute; left: -100%; top: 0; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent); transition: left 0.5s; }
        .holo-menu-item:hover::before { left: 100%; }
        .holo-main { flex: 1; padding: 40px; position: relative; height: 100vh; overflow-y: auto; }
        .holo-card { background: rgba(0, 20, 40, 0.6); border: 1px solid rgba(0, 255, 255, 0.3); border-radius: 20px; padding: 30px; margin-bottom: 30px; position: relative; backdrop-filter: blur(10px); animation: holo-float 6s ease-in-out infinite; }
        @keyframes holo-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .holo-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .holo-stat { text-align: center; padding: 20px; background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), transparent); border-radius: 15px; border: 1px solid rgba(0, 255, 255, 0.2); }
        .holo-value { font-size: 32px; font-weight: bold; background: linear-gradient(45deg, #00ffff, #00ff88); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
      <div className="concept1">
        <div className="neural-grid"></div>
        <div className="holo-sidebar">
            <div className="holo-logo">
              TraderEdgePro
              <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold" style={{display: 'inline-block'}}>BETA</span>
            </div>
            <div className="p-4">
              <select 
                value={selectedAccountId || ''} 
                onChange={(e) => selectAccount(e.target.value || null)} 
                className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600"
              >
                <option value="">Select Account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.propFirm} - ${account.accountSize.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <nav className="flex-1 p-4 overflow-y-auto"><div className="space-y-2">{sidebarTabs.map((item) => <div key={item.id} className={`holo-menu-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => handleTabClick(item.id)}>{item.icon} <span>{item.label}</span></div>)}</div></nav>
            <div className="p-4 border-t border-gray-800 flex items-center justify-around"><button onClick={onLogout} className="text-gray-400 hover:text-white"><LogOut className="w-6 h-6" /></button></div>
        </div>
        <div className="holo-main">
            <div className="container mx-auto">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'signals' && <SimpleSignalsFeed 
                onMarkAsTaken={handleMarkAsTaken}
                onAddToJournal={(signal) => {
                  // Extract signal data from the text field if individual fields are not available
                  let signalSymbol = signal.pair || signal.symbol || signal.currencyPair || 'Unknown';
                  let signalDirection = signal.direction || signal.signalType || 'BUY';
                  let signalEntry = signal.entryPrice || signal.entry || '0';
                  let signalStopLoss = signal.stopLoss || '0';
                  let signalTakeProfit = Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0';
                  let signalAnalysis = signal.analysis || signal.text || '';
                  
                  // If data is in text format, parse it
                  if (signal.text && !signal.entryPrice) {
                    const textLines = signal.text.split('\n');
                    for (const line of textLines) {
                      if (line.includes('Entry')) {
                        const match = line.match(/Entry\s+([\d.]+)/);
                        if (match) signalEntry = match[1];
                      } else if (line.includes('Stop Loss')) {
                        const match = line.match(/Stop Loss\s+([\d.]+)/);
                        if (match) signalStopLoss = match[1];
                      } else if (line.includes('Take Profit')) {
                        const match = line.match(/Take Profit\s+([\d.]+)/);
                        if (match) signalTakeProfit = match[1];
                      } else if (line.includes('Confidence')) {
                        const match = line.match(/Confidence\s+(\d+)%/);
                        if (match) signalAnalysis += ` (Confidence: ${match[1]}%)`;
                      } else if (line.includes('NOW')) {
                        const match = line.match(/(\w+)\s+NOW/);
                        if (match) signalDirection = match[1];
                      }
                    }
                    
                    // Extract symbol from first line if not already set
                    if (signalSymbol === 'Unknown' && textLines[0]) {
                      signalSymbol = textLines[0].replace(/\s+(BUY|SELL)\s+NOW.*/, '');
                    }
                  }
                  
                  setNewJournalEntry({
                    date: new Date().toISOString().split('T')[0],
                    symbol: signalSymbol,
                    direction: signalDirection.toUpperCase(),
                    entryPrice: signalEntry.toString(),
                    exitPrice: '',
                    quantity: '',
                    pnl: '',
                    notes: `Signal Analysis: ${signalAnalysis}`,
                    tags: ['signal-generated']
                  });
                  
                  // Navigate to journal tab
                  setActiveTab('journal');
                }}
                onChatWithNexus={(signal) => {
                  // Extract signal data from the text field if individual fields are not available
                  let signalSymbol = signal.pair || signal.symbol || signal.currencyPair || 'Unknown';
                  let signalDirection = signal.direction || signal.signalType || 'BUY';
                  let signalEntry = signal.entryPrice || signal.entry || '0';
                  let signalStopLoss = signal.stopLoss || '0';
                  let signalTakeProfit = Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0';
                  let signalConfidence = signal.confidence || '0';
                  let signalAnalysis = signal.analysis || signal.text || '';
                  
                  // If data is in text format, parse it
                  if (signal.text && !signal.entryPrice) {
                    const textLines = signal.text.split('\n');
                    for (const line of textLines) {
                      if (line.includes('Entry')) {
                        const match = line.match(/Entry\s+([\d.]+)/);
                        if (match) signalEntry = match[1];
                      } else if (line.includes('Stop Loss')) {
                        const match = line.match(/Stop Loss\s+([\d.]+)/);
                        if (match) signalStopLoss = match[1];
                      } else if (line.includes('Take Profit')) {
                        const match = line.match(/Take Profit\s+([\d.]+)/);
                        if (match) signalTakeProfit = match[1];
                      } else if (line.includes('Confidence')) {
                        const match = line.match(/Confidence\s+(\d+)%/);
                        if (match) signalConfidence = match[1];
                      } else if (line.includes('NOW')) {
                        const match = line.match(/(\w+)\s+NOW/);
                        if (match) signalDirection = match[1];
                      }
                    }
                    
                    // Extract symbol from first line if not already set
                    if (signalSymbol === 'Unknown' && textLines[0]) {
                      signalSymbol = textLines[0].replace(/\s+(BUY|SELL)\s+NOW.*/, '');
                    }
                  }
                  
                  // Store signal data for AI Coach
                  const signalData = {
                    symbol: signalSymbol,
                    direction: signalDirection,
                    entryPrice: signalEntry,
                    stopLoss: signalStopLoss,
                    takeProfit: signalTakeProfit,
                    confidence: signalConfidence,
                    analysis: signalAnalysis,
                    timestamp: new Date().toISOString()
                  };
                  
                  // Store signal data in localStorage for AI Coach to access
                  localStorage.setItem('nexus_chat_signal', JSON.stringify(signalData));
                  
                  // Navigate to AI Coach tab
                  setActiveTab('ai-coach');
                }}
              />}
              {activeTab === 'analytics' && <PerformanceAnalytics tradingState={{ 
                initialEquity: initialBalance,
                currentEquity: currentEquity,
                trades: userTrades,
                openPositions: [],
                riskSettings: {
                  riskPerTrade: parseFloat(dashboardData?.riskParameters?.baseTradeRiskPct?.replace('%', '') || '1'),
                  dailyLossLimit: 5,
                  consecutiveLossesLimit: 3
                },
                performanceMetrics,
                dailyStats: {
                  pnl: userTrades.filter(t => new Date(t.entryTime).toDateString() === new Date().toDateString()).reduce((sum, t) => sum + (t.pnl || 0), 0),
                  trades: userTrades.filter(t => new Date(t.entryTime).toDateString() === new Date().toDateString()).length,
                  initialEquity: initialBalance
                }
              }} />}
              {activeTab === 'journal' && renderJournal()}
              {activeTab === 'accounts' && hasMultiAccountAccess && <MultiAccountTracker />}
              {activeTab === 'rules' && <NewPropFirmRules />}
              {activeTab === 'risk-protocol' && <RiskManagementPlan />}
              {activeTab === 'ai-coach' && <AICoach />}
              {activeTab === 'notifications' && <NotificationCenter />}
              {activeTab === 'support' && <UserSupportDashboard />}
              {activeTab === 'settings' && renderSettings()}
            </div>
        </div>
      </div>
      <div style={{ display: 'none' }}>
        <LiveChatWidget userId={user?.id || user?.email} userName={user?.name || 'TraderEdgePro User'} />
      </div>
    </>
  );
};

export default DashboardConcept1;
