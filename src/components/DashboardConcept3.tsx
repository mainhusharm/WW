import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TradingState, TradeOutcome, Signal, Trade, PerformanceMetrics } from '../trading/types';
import { 
  Layers, Zap, Shield, PieChart, BookOpen, GitBranch, Target, Cpu, Bell, Settings, LogOut, DollarSign, Activity, Award, MessageSquare 
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { useDashboardData } from './DashboardDataReader';
import AdminSignalsFeed from './AdminSignalsFeed';
import NewPropFirmRules from './NewPropFirmRules';

import SignalsFeed from './SignalsFeed';
import EnhancedUserSignalsFeed from './EnhancedUserSignalsFeed';
import WorkingSignalsFeed from './WorkingSignalsFeed';
import SimpleSignalsFeed from './SimpleSignalsFeed';
import RealTimeSignalsFeed from './RealTimeSignalsFeed';
import AdminConnectedSignalsFeed from './AdminConnectedSignalsFeed';
import DirectAdminSignalsFeed from './DirectAdminSignalsFeed';
import RealAdminSignalsFeed from './RealAdminSignalsFeed';
import NewSignalsFeed from './NewSignalsFeed';
import PerformanceAnalytics from './PerformanceAnalytics';
import TradingJournalDashboard from './TradingJournalDashboard';
import MultiAccountTracker from './MultiAccountTracker';
import NotificationCenter from './NotificationCenter';
import AccountSettings from './AccountSettings';
import PropFirmRules from './PropFirmRules';
import RiskProtocol from './RiskProtocol';
import LiveChatWidget from './LiveChatWidget';
import UserSupportDashboard from './UserSupportDashboard';
import AICoach from './AICoach';
import { getAllTimezones, getMarketStatus } from '../services/timezoneService';
import { getImpactColor, getImpactIcon, formatEventTime } from '../services/forexFactoryService';

interface DashboardConcept3Props {
  onLogout: () => void;
  tradingState: TradingState | null;
  dashboardData: any;
  handleMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
}

const DashboardConcept3: React.FC<DashboardConcept3Props> = ({ onLogout, tradingState, dashboardData: initialDashboardData, handleMarkAsTaken }) => {
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
  
  // Journal state
  const [journalEntries, setJournalEntries] = useState(() => {
    if (typeof window !== 'undefined' && user?.email) {
      const saved = localStorage.getItem(`journal_entries_${user.email}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
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
  
  const handleAddJournalEntry = () => {
    if (!newJournalEntry.symbol || !newJournalEntry.entryPrice) return;
    
    const entry = {
      ...newJournalEntry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      pnl: parseFloat(newJournalEntry.pnl) || 0
    };
    
    setJournalEntries((prev: any[]) => [entry, ...prev]);
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
  };
  
  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries((prev: any[]) => prev.filter((entry: any) => entry.id !== id));
  };

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'risk', label: 'Risk Management', icon: '⚠️' },
    { id: 'trading', label: 'Trading', icon: '📈' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'data', label: 'Data & Export', icon: '💾' },
    { id: 'api', label: 'API & Integrations', icon: '🔗' }
  ];

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="holo-card">
        <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text mb-6 flex items-center" style={{fontFamily: 'Courier New, monospace', textShadow: '0 0 20px rgba(0, 255, 0, 0.5)'}}>        Settings
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
          {journalEntries.length === 0 ? (
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
      <div className="matrix-card">
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
        <div className="lg:col-span-2 matrix-card">
          <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
          {userTrades.length === 0 ? (
            <div className="text-center py-12"><Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" /><div className="text-gray-400 text-lg font-medium mb-2">No trades recorded yet</div><div className="text-gray-500 text-sm">Trades will appear here after marking signals as taken</div></div>
          ) : (
            <div className="space-y-4">{userTrades.slice(-5).reverse().map((trade, index) => <div key={index} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg"><div className="flex items-center space-x-4"><div className={`w-3 h-3 rounded-full ${(trade.pnl || 0) > 0 ? 'bg-green-400' : (trade.pnl || 0) < 0 ? 'bg-red-400' : 'bg-yellow-400'}`}></div><div><div className="text-white font-medium">{trade.pair}</div><div className="text-sm text-gray-400">{trade.outcome} • {new Date(trade.entryTime).toLocaleTimeString()}</div></div></div><div className="text-right"><div className={`font-medium ${(trade.pnl || 0) > 0 ? 'text-green-400' : (trade.pnl || 0) < 0 ? 'text-red-400' : 'text-yellow-400'}`}>${(trade.pnl || 0).toFixed(2)}</div></div></div>)}</div>
          )}
        </div>
        <div className="matrix-card">
          <h3 className="text-lg font-semibold text-white mb-4">Market Status</h3>
          {marketStatus && <div className="space-y-4"><div className="text-xs text-gray-400 mb-2">{marketStatus.localTime}</div><div className="flex items-center justify-between"><span className="text-gray-400">Forex Market</span><div className="flex items-center space-x-2"><div className={`w-2 h-2 rounded-full ${marketStatus.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div><span className={`text-sm ${marketStatus.isOpen ? 'text-green-400' : 'text-red-400'}`}>{marketStatus.isOpen ? 'Open' : 'Closed'}</span></div></div><div className="flex items-center justify-between"><span className="text-gray-400">Current Session</span><span className="text-white text-sm">{marketStatus.currentSession}</span></div><div className="flex items-center justify-between"><span className="text-gray-400">Next Session</span><span className="text-white text-sm">{marketStatus.nextSession} ({marketStatus.timeUntilNext})</span></div></div>}
        </div>
        
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .dashboard-concept3 { 
          background: #0f0f0f;
          width: 100%; 
          height: 100vh; 
          display: flex;
        }
        @keyframes matrix-pulse {
          0% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
        .matrix-rain { 
{{ ... }}
            transparent 2px,
            rgba(0, 255, 0, 0.02) 2px,
            rgba(0, 255, 0, 0.02) 4px
          );
        } 
        .sidebar { 
          width: 280px; 
          height: 100%; 
          background: #0f0f0f; 
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 100; 
          display: flex; 
          flex-direction: column;
        }
        .matrix-sidebar::before {
          content: '';
          position: absolute;
          top: 0;
{{ ... }}
        }
        @keyframes matrix-border-pulse {
          0%, 100% { box-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00; }
          50% { box-shadow: 0 0 15px #00ff00, 0 0 25px #00ff00; }
        }
        .logo {
          font-size: 24px;
          font-weight: 300;
          text-align: center;
          padding: 30px 20px;
          color: #fff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }  
        @keyframes matrix-text-flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
{{ ... }}
        .matrix-menu-item { 
          padding: 25px 40px; 
          cursor: pointer; 
          position: relative; 
          overflow: hidden; 
          transition: all 0.3s ease; 
          display: flex; 
          align-items: center; 
          gap: 20px;
          border-left: 3px solid transparent;
          font-family: 'Courier New', monospace;
          font-weight: 600;
        }
        .matrix-menu-item.active { 
          background: rgba(0, 255, 0, 0.1); 
          border-left: 3px solid #00ff00; 
          color: #00ff00;
          box-shadow: 
            inset 0 0 20px rgba(0, 255, 0, 0.2),
            0 0 10px rgba(0, 255, 0, 0.3);
        }
        .matrix-menu-item:not(.active) { 
          color: #00aa00; 
        }
        .matrix-menu-item::before { 
          content: ''; 
          position: absolute; 
          left: -100%; 
          top: 0; 
          width: 100%; 
          height: 100%; 
          background: linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.3), transparent); 
          transition: left 0.5s ease;
        }
        .neural-menu-item:hover {
          color: #ff6400;
          text-shadow: 
            0 0 18px #ff6400,
            0 0 35px #c800ff,
            0 0 50px #00c8ff;
          transform: translateX(12px) scale(1.02) rotateZ(1deg);
          box-shadow: 
            inset 0 0 40px rgba(255, 100, 0, 0.3),
            0 0 25px rgba(200, 0, 255, 0.4);
        }
        .neural-menu-item::after {
          content: '●';
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #ff6400;
          font-size: 8px;
          opacity: 0;
          transition: all 0.3s ease;
        }
        .neural-menu-item.active::after,
        .neural-menu-item:hover::after {
          opacity: 1;
          transform: translateY(-50%) translateX(3px) scale(1.5);
          text-shadow: 0 0 8px #ff6400;
        }
        .neural-card { 
          background: 
            linear-gradient(135deg, 
              rgba(30, 20, 40, 0.9), 
              rgba(40, 25, 30, 0.85), 
              rgba(35, 30, 35, 0.8)); 
          border: 3px solid transparent;
          border-image: linear-gradient(45deg, 
            rgba(255, 100, 0, 0.7) 0%, 
            rgba(200, 0, 255, 0.6) 25%, 
            rgba(0, 200, 255, 0.7) 50%, 
            rgba(255, 200, 0, 0.6) 75%, 
            rgba(255, 100, 0, 0.7) 100%) 1;
          border-radius: 18px; 
          padding: 45px; 
          margin-bottom: 45px; 
          position: relative; 
          backdrop-filter: blur(20px) saturate(1.3) contrast(1.1);
          box-shadow: 
            0 18px 50px rgba(255, 100, 0, 0.2),
            0 0 60px rgba(200, 0, 255, 0.15),
            inset 0 2px 0 rgba(255, 100, 0, 0.15),
            inset 0 -1px 0 rgba(200, 0, 255, 0.1);
          animation: neural-card-process 12s ease-in-out infinite;
          overflow: hidden;
        }
        .neural-card::after {
          content: '';
          position: absolute;
          top: -75%;
          left: -75%;
          width: 250%;
          height: 250%;
          background: 
            repeating-linear-gradient(
              30deg,
              transparent 0px,
              rgba(255, 100, 0, 0.02) 3px,
              transparent 6px,
              transparent 60px
            ),
            repeating-linear-gradient(
              -30deg,
              transparent 0px,
              rgba(200, 0, 255, 0.015) 3px,
              transparent 6px,
              transparent 80px
            );
          animation: neural-card-data-flow 18s linear infinite;
          pointer-events: none;
          z-index: -1;
        }
        @keyframes neural-card-data-flow {
          0% { transform: translate(-20%, -20%) rotate(0deg); }
          100% { transform: translate(20%, 20%) rotate(360deg); }
        }
        @keyframes neural-card-process {
          0%, 100% { 
            transform: translateY(0px) scale(1); 
            filter: brightness(1);
          }
          50% { 
            transform: translateY(-5px) scale(1.01); 
            filter: brightness(1.1);
          }
        }
        .neural-main {
          flex: 1;
          padding: 55px;
          background: 
            radial-gradient(ellipse at 25% 25%, rgba(30, 15, 0, 0.2) 0%, transparent 65%),
            radial-gradient(ellipse at 75% 75%, rgba(20, 0, 30, 0.18) 0%, transparent 55%);
          position: relative;
          z-index: 2;
        }
        .neural-main::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            repeating-linear-gradient(
              60deg,
              transparent 0px,
              rgba(255, 100, 0, 0.008) 1px,
              transparent 2px,
              transparent 180px
            ),
            repeating-linear-gradient(
              -60deg,
              transparent 0px,
              rgba(200, 0, 255, 0.006) 1px,
              transparent 2px,
              transparent 220px
            );
          animation: neural-main-process 16s linear infinite;
          pointer-events: none;
        }
        @keyframes neural-main-process {
          0% { transform: translateX(-180px) translateY(-90px) rotate(0deg); }
          100% { transform: translateX(180px) translateY(90px) rotate(360deg); }
        }
        .holo-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .holo-stat { 
          text-align: center; 
          padding: 30px; 
          background: #0f0f0f;
          border-radius: 24px;
          box-shadow: 
            8px 8px 16px rgba(0,0,0,0.5),
            -8px -8px 16px rgba(255,255,255,0.03);
          position: relative;
          transition: all 0.3s ease;
        }
        .holo-stat:hover {
          box-shadow: 
            12px 12px 24px rgba(0,0,0,0.6),
            -12px -12px 24px rgba(255,255,255,0.04);
          transform: translateY(-2px);
        }
        .holo-value { 
          font-size: 36px; 
          font-weight: 700; 
          color: #fff;
          margin-bottom: 8px;
        }
        .holo-card { 
          background: #0f0f0f;
          border-radius: 24px; 
          padding: 30px; 
          margin-bottom: 30px; 
          position: relative; 
          box-shadow: 
            8px 8px 16px rgba(0,0,0,0.5),
            -8px -8px 16px rgba(255,255,255,0.03);
          transition: all 0.3s ease;
        }
        .holo-card:hover {
          box-shadow: 
            12px 12px 24px rgba(0,0,0,0.6),
            -12px -12px 24px rgba(255,255,255,0.04);
          transform: translateY(-2px);
        }
        .matrix-card {
          background: #0f0f0f;
          border-radius: 24px;
          padding: 30px;
          margin-bottom: 30px;
          position: relative;
          box-shadow: 
            8px 8px 16px rgba(0,0,0,0.5),
            -8px -8px 16px rgba(255,255,255,0.03);
          transition: all 0.3s ease;
        }
        .matrix-card:hover {
          box-shadow: 
            12px 12px 24px rgba(0,0,0,0.6),
            -12px -12px 24px rgba(255,255,255,0.04);
          transform: translateY(-2px);
        }
        .menu-item { 
          padding: 16px 24px; 
          cursor: pointer; 
          transition: all 0.3s ease; 
          display: flex; 
          align-items: center; 
          gap: 12px;
          color: rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          margin: 4px 0;
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 500;
        }
        .menu-item.active {
          background: #0f0f0f;
          color: #fff;
          box-shadow: 
            2px 2px 8px rgba(0,0,0,0.6),
            -2px -2px 8px rgba(255,255,255,0.08);
        }
        .menu-item:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.05);
        }
        .main-content {
          flex: 1;
          padding: 40px;
          overflow-y: auto;
          background: #0f0f0f;
        }
        .card { 
          background: #0f0f0f;
          border-radius: 24px; 
          padding: 30px; 
          margin-bottom: 30px; 
          box-shadow: 
            8px 8px 16px rgba(0,0,0,0.5),
            -8px -8px 16px rgba(255,255,255,0.03);
          position: relative;
          transition: all 0.3s ease;
        }
        .card:hover {
          box-shadow: 
            12px 12px 24px rgba(0,0,0,0.6),
            -12px -12px 24px rgba(255,255,255,0.04);
          transform: translateY(-2px);
        }
        .value { 
          font-size: 32px; 
          font-weight: 700; 
          color: #3b82f6;
          font-family: 'Inter', sans-serif;
        }
      `}</style>
      <div className="dashboard-concept3">
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
              {activeTab === 'signals' && <RealAdminSignalsFeed 
                onMarkAsTaken={handleMarkAsTaken}
                onAddToJournal={(signal) => {
                  console.log('Adding signal to journal:', signal);
                }}
                onChatWithNexus={(signal) => {
                  // Redirect to AI Coach with signal context
                  const signalData = encodeURIComponent(JSON.stringify({
                    pair: signal.pair || signal.symbol,
                    symbol: signal.pair || signal.symbol,
                    direction: signal.direction || signal.action,
                    action: signal.direction || signal.action,
                    entry: signal.entry || signal.entryPrice,
                    entryPrice: signal.entry || signal.entryPrice,
                    stopLoss: signal.stopLoss,
                    takeProfit: signal.takeProfit,
                    confidence: signal.confidence,
                    timeframe: signal.timeframe || '1H',
                    riskReward: signal.riskReward,
                    analysis: signal.analysis || signal.description
                  }));
                  window.location.href = `/ai-coach?signal=${signalData}`;
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

export default DashboardConcept3;
