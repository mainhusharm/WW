import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradingState, TradeOutcome, Signal, Trade, PerformanceMetrics } from '../trading/types';
import { 
  Layers, Zap, Shield, PieChart, BookOpen, GitBranch, Target, Cpu, Bell, Settings, LogOut, DollarSign, Activity, Award, MessageSquare 
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { useDashboardData } from './DashboardDataReader';
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
import { getImpactColor, formatEventTime } from '../services/forexFactoryService';
import { useSafeEffect, useSafeInterval, useSafeTimeout } from '../hooks/useSafeEffect';
import { journalService, JournalEntry } from '../services/journalService';

interface DashboardConcept2Props {
  onLogout: () => void;
  tradingState: TradingState | null;
  dashboardData: any;
  handleMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
}

const DashboardConcept2: React.FC<DashboardConcept2Props> = ({ onLogout, tradingState, dashboardData: initialDashboardData, handleMarkAsTaken }) => {
  const { user } = useUser();
  const { tradingPlan, propFirm, accountConfig, accounts, selectedAccountId, selectAccount, loading: tradingPlanLoading } = useTradingPlan();
  const { dashboardData: localStorageData, loading: localStorageLoading } = useDashboardData();

  const [dashboardData, setDashboardData] = useState(initialDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const { tab } = useParams();
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
      return saved || 'America/New_York';
    }
    return 'America/New_York';
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  
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
  
  // Save dashboard state for persistence
  useEffect(() => {
    if (user?.email) {
      localStorage.setItem(`dashboard_active_tab_${user.email}`, activeTab);
      localStorage.setItem(`dashboard_timezone_${user.email}`, selectedTimezone);
      localStorage.setItem(`user_settings_${user.email}`, JSON.stringify(userSettings));
      localStorage.setItem(`journal_entries_${user.email}`, JSON.stringify(journalEntries));
    }
  }, [activeTab, selectedTimezone, userSettings, journalEntries, user?.email]);
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
    let peak = tradingPlan?.userProfile?.initialBalance || 10000;
    let runningEquity = peak;
    
    trades.forEach(trade => {
      runningEquity += (trade.pnl || 0);
      if (runningEquity > peak) {
        peak = runningEquity;
      }
      const drawdown = ((peak - runningEquity) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    });
    
    const currentEquity = (tradingPlan?.userProfile?.initialBalance || 10000) + totalPnl;
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

  // Handle mark as taken with real trade tracking
  const handleMarkAsTradeComplete = (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    const actualPnl = pnl || 0;
    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      signalId: signal.id,
      pair: signal.pair,
      direction: signal.direction,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      riskAmount: signal.riskAmount || 0,
      rewardAmount: signal.rewardAmount || 0,
      status: 'closed',
      entryTime: new Date(signal.timestamp),
      closeTime: new Date(),
      outcome,
      pnl: actualPnl,
      equityBefore: (tradingPlan?.userProfile?.initialBalance || 10000) + performanceMetrics.totalPnl,
      equityAfter: (tradingPlan?.userProfile?.initialBalance || 10000) + performanceMetrics.totalPnl + actualPnl,
      notes: `Signal taken from dashboard - ${outcome}`
    };
    
    const updatedTrades = [...userTrades, newTrade];
    setUserTrades(updatedTrades);
    updatePerformanceMetrics(updatedTrades);
    
    // Save to localStorage
    localStorage.setItem('userTrades', JSON.stringify(updatedTrades));
    
    // Call the original handler if provided
    if (handleMarkAsTaken) {
      handleMarkAsTaken(signal, outcome, actualPnl);
    }
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
  }, [userTrades, tradingPlan?.userProfile?.initialBalance]);

  useEffect(() => {
    // Update time every second for real-time display
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Update market status immediately and every minute
    const updateMarketStatus = () => {
      const status = getMarketStatus(selectedTimezone);
      setMarketStatus(status);
    };
    
    updateMarketStatus();
    const statusTimer = setInterval(updateMarketStatus, 60000); // Update every minute
    
    return () => clearInterval(statusTimer);
  }, [selectedTimezone, currentTime]);


  useEffect(() => {
    if (tab) setActiveTab(tab);
  }, [tab]);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/dashboard/${tabId}`);
  };

  const handleAddToJournal = (signal: Signal) => {
    console.log('Adding to journal:', signal);
    handleTabClick('journal');
  };

  const handleChatWithNexus = (signal: Signal) => {
    handleTabClick('ai-coach');
    // Note: Signal data can be passed to AICoach component if needed
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

  // Early return for loading state - must be after all hooks
  if (isLoading) {
    return <div>Loading Dashboard Data...</div>;
  }

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="holo-card">
        <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-yellow-400 bg-clip-text mb-6 flex items-center" style={{fontFamily: 'Orbitron, Arial, sans-serif', textShadow: '0 0 20px rgba(0, 255, 255, 0.5)'}}>        Settings
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
                      <span className="text-white ml-2">{new Date(entry.createdAt || entry.timestamp).toLocaleTimeString()}</span>
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
  const currentEquity = initialBalance + (tradingState?.performanceMetrics?.totalPnl || 0);
  
  const stats = [
    {
      label: hasAccount ? 'Account Equity' : 'Account Balance',
      value: `$${currentEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarSign className="w-8 h-8" />,
    },
    {
      label: 'Win Rate',
      value: `${(tradingState?.performanceMetrics?.winRate || 0).toFixed(1)}%`,
      icon: <Target className="w-8 h-8" />,
    },
    {
      label: 'Total Trades',
      value: tradingState?.performanceMetrics?.totalTrades || 0,
      icon: <Activity className="w-8 h-8" />,
    },
    {
      label: 'Total P&L',
      value: `${(tradingState?.performanceMetrics?.totalPnl || 0) >= 0 ? '+' : ''}$${(tradingState?.performanceMetrics?.totalPnl || 0).toFixed(2)}`,
      icon: <Award className="w-8 h-8" />,
    },
  ];

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in-up">
      <div className="neon-card">
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
        
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .dashboard-concept2 { 
          background: linear-gradient(180deg, #0a0118 0%, #1e0533 50%, #0a0118 100%);
          width: 100%; 
          height: 100vh; 
          display: flex;
          position: relative;
          overflow: hidden;
        }
        .aurora-bg {
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(ellipse at center, 
            rgba(120, 240, 180, 0.15) 0%, 
            rgba(80, 200, 255, 0.1) 25%, 
            rgba(150, 100, 255, 0.1) 50%, 
            transparent 70%);
          animation: aurora 20s ease-in-out infinite;
          filter: blur(60px);
          z-index: 1;
        }
        @keyframes aurora {
          0%, 100% { transform: rotate(0deg) scale(1); }
          33% { transform: rotate(120deg) scale(1.1); }
          66% { transform: rotate(240deg) scale(0.9); }
        }
        .sidebar { 
          width: 280px; 
          height: 100%; 
          background: rgba(30, 30, 50, 0.95); 
          backdrop-filter: blur(10px); 
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          z-index: 100; 
          display: flex; 
          flex-direction: column;
          position: relative;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          text-align: center;
          padding: 30px 20px;
          color: #ffffff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
          z-index: 10;
        }
        .menu-item { 
          padding: 16px 24px; 
          cursor: pointer; 
          transition: all 0.2s ease; 
          display: flex; 
          align-items: center; 
          gap: 12px;
          color: #a0a0a0;
          border-radius: 8px;
          margin: 4px 0;
          position: relative;
          overflow: hidden;
        }
        .menu-item.active {
          color: #78f0b4;
          background: rgba(120, 240, 180, 0.1);
          box-shadow: 0 0 20px rgba(120, 240, 180, 0.2);
        }
        .menu-item:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }
        .main-content {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          position: relative;
          z-index: 10;
        }
        .card { 
          background: rgba(40, 40, 60, 0.8); 
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px; 
          padding: 24px; 
          margin-bottom: 24px; 
          backdrop-filter: blur(10px);
        }
        .value { 
          font-size: 32px; 
          font-weight: 700; 
          color: #3b82f6;
          font-family: 'Inter', sans-serif;
        }
        .holo-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .holo-stat { 
          text-align: center; 
          padding: 20px; 
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .holo-stat::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(120, 240, 180, 0.8), 
            rgba(80, 200, 255, 0.8), 
            transparent);
          animation: scan 3s linear infinite;
        }
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .holo-stat:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 20px 40px rgba(120, 240, 180, 0.1);
        }
        .holo-value { 
          font-size: 32px; 
          font-weight: bold; 
          background: linear-gradient(135deg, #78f0b4, #50c8ff);
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
        }
        .holo-card { 
          background: rgba(0, 20, 40, 0.6); 
          border: 1px solid rgba(0, 255, 255, 0.3); 
          border-radius: 20px; 
          padding: 30px; 
          margin-bottom: 30px; 
          position: relative; 
          backdrop-filter: blur(10px);
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .neon-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 24px;
          padding: 30px;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .neon-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent, 
            rgba(120, 240, 180, 0.8), 
            rgba(80, 200, 255, 0.8), 
            transparent);
          animation: scan 3s linear infinite;
        }
        .neon-card:hover {
          transform: translateY(-5px);
          background: rgba(255,255,255,0.06);
          box-shadow: 0 20px 40px rgba(120, 240, 180, 0.1);
        }
    `}</style>
    <div className="dashboard-concept2">
      <div className="aurora-bg"></div>
      <div className="sidebar">
          <div className="logo">
            Trader Edge Pro
            <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">BETA</span>
          </div>
          {hasMultiAccountAccess && <div className="p-4"><select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600">{accounts.map((account: any) => <option key={account.id} value={account.id}>{account.account_name}</option>)}</select></div>}
          <nav className="flex-1 p-4 overflow-y-auto"><div className="space-y-3">{sidebarTabs.map((item) => <div key={item.id} className={`menu-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => handleTabClick(item.id)}>{item.icon} <span>{item.label}</span></div>)}</div></nav>
          <div className="p-4 border-t border-gray-800 flex items-center justify-around"><button onClick={onLogout} className="text-gray-400 hover:text-white"><LogOut className="w-6 h-6" /></button></div>
        </div>
        <div className="main-content">
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
                  
                  // Redirect to AI Coach with signal context
                  const signalDataForUrl = encodeURIComponent(JSON.stringify({
                    pair: signalSymbol,
                    symbol: signalSymbol,
                    direction: signalDirection,
                    action: signalDirection,
                    entry: signalEntry,
                    entryPrice: signalEntry,
                    stopLoss: signalStopLoss,
                    takeProfit: signalTakeProfit,
                    confidence: signalConfidence,
                    timeframe: signal.timeframe || '1H',
                    riskReward: signal.riskReward || '2.0',
                    analysis: signalAnalysis
                  }));
                  window.location.href = `/ai-coach?signal=${signalDataForUrl}`;
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

export default DashboardConcept2;
