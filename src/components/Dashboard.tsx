import { useState, useEffect } from 'react';
import { TradingState, TradeOutcome, Signal } from '../trading/types';
import { openTrade, closeTrade } from '../trading/tradeManager';
import { isDailyLossLimitReached } from '../trading/riskManager';
import { useUser } from '../contexts/UserContext';
import { useTradingPlan } from '../contexts/TradingPlanContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import SubscriptionStatus from './SubscriptionStatus';
import api from '../api';
import ConsentForm from './ConsentForm';
import FuturisticBackground from './FuturisticBackground';
import FuturisticCursor from './FuturisticCursor';
import DashboardFallback from './DashboardFallback';
import SimpleDashboard from './SimpleDashboard';
import { supabaseApi } from '../lib/supabase';
import DashboardConcept1 from './DashboardConcept1';
import DashboardConcept2 from './DashboardConcept2';
import DashboardConcept3 from './DashboardConcept3';
import DashboardConcept4 from './DashboardConcept4';
import DashboardConcept5 from './DashboardConcept5';
import { realTimeDataService } from '../services/realTimeDataService';
import unifiedDashboardService from '../services/unifiedDashboardService';

const Dashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { user } = useUser();
  const { tradingPlan } = useTradingPlan();
  const { access } = useSubscription();
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('dashboard_selected_concept');
    return savedTheme || 'concept1';
  });
  const [tradingState, setTradingState] = useState<TradingState | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any>(null);
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const [criticalError, setCriticalError] = useState(false);

  // Function to save dashboard data to Supabase
  const saveDashboardToSupabase = async (dashboardData: any, tradingState: any, theme: string) => {
    try {
      console.log('Saving dashboard data to Supabase:', {
        user: user?.email,
        currentEquity: tradingState?.currentEquity,
        totalPnl: tradingState?.performanceMetrics?.totalPnl,
        totalTrades: tradingState?.performanceMetrics?.totalTrades
      });
      
      const supabaseDashboardData = {
        // User Profile Data
        prop_firm: dashboardData?.userProfile?.propFirm || null,
        account_type: dashboardData?.userProfile?.accountType || null,
        account_size: dashboardData?.userProfile?.accountSize ? parseFloat(dashboardData.userProfile.accountSize.toString()) : null,
        risk_per_trade: dashboardData?.userProfile?.riskPerTrade ? parseFloat(dashboardData.userProfile.riskPerTrade.toString().replace('%', '')) : null,
        experience: dashboardData?.userProfile?.experience || null,
        unique_id: dashboardData?.userProfile?.uniqueId || null,
        
        // Performance Metrics
        account_balance: dashboardData?.performance?.accountBalance ? parseFloat(dashboardData.performance.accountBalance.toString()) : null,
        total_pnl: tradingState?.performanceMetrics?.totalPnl || 0,
        win_rate: tradingState?.performanceMetrics?.winRate || 0,
        total_trades: tradingState?.performanceMetrics?.totalTrades || 0,
        winning_trades: tradingState?.performanceMetrics?.winningTrades || 0,
        losing_trades: tradingState?.performanceMetrics?.losingTrades || 0,
        average_win: tradingState?.performanceMetrics?.averageWin || 0,
        average_loss: tradingState?.performanceMetrics?.averageLoss || 0,
        profit_factor: tradingState?.performanceMetrics?.profitFactor || 0,
        max_drawdown: tradingState?.performanceMetrics?.maxDrawdown || 0,
        current_drawdown: tradingState?.performanceMetrics?.currentDrawdown || 0,
        gross_profit: tradingState?.performanceMetrics?.grossProfit || 0,
        gross_loss: tradingState?.performanceMetrics?.grossLoss || 0,
        consecutive_wins: tradingState?.performanceMetrics?.consecutiveWins || 0,
        consecutive_losses: tradingState?.performanceMetrics?.consecutiveLosses || 0,
        sharpe_ratio: tradingState?.performanceMetrics?.sharpeRatio || null,
        
        // Risk Protocol
        max_daily_risk: dashboardData?.riskProtocol?.maxDailyRisk ? parseFloat(dashboardData.riskProtocol.maxDailyRisk.toString()) : null,
        risk_per_trade_amount: dashboardData?.riskProtocol?.riskPerTrade ? parseFloat(dashboardData.riskProtocol.riskPerTrade.toString()) : null,
        max_drawdown_limit: dashboardData?.riskProtocol?.maxDrawdown ? parseFloat(dashboardData.riskProtocol.maxDrawdown.toString()) : null,
        
        // Trading State
        initial_equity: tradingState?.initialEquity || null,
        current_equity: tradingState?.currentEquity || null,
        daily_pnl: tradingState?.dailyStats?.pnl || 0,
        daily_trades: tradingState?.dailyStats?.trades || 0,
        daily_initial_equity: tradingState?.dailyStats?.initialEquity || null,
        
        // Risk Settings
        risk_per_trade_percentage: tradingState?.riskSettings?.riskPerTrade || null,
        daily_loss_limit: tradingState?.riskSettings?.dailyLossLimit || null,
        consecutive_losses_limit: tradingState?.riskSettings?.consecutiveLossesLimit || null,
        
        // Dashboard Settings
        selected_theme: theme,
        notifications_enabled: true,
        auto_refresh: true,
        refresh_interval: 5000,
        language: 'en',
        timezone: 'UTC',
        
        // Real-time Data
        real_time_data: realTimeData,
        last_signal: null,
        market_status: 'open',
        connection_status: 'online',
        
        // Trading Data
        open_positions: tradingState?.openPositions || [],
        trade_history: tradingState?.trades || [],
        signals: [],
        
        // User Preferences
        dashboard_layout: null,
        widget_settings: null,
        alert_settings: null,
        
        // Metadata
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try to update existing dashboard first, then create if not exists
      try {
        const existingDashboard = await supabaseApi.getUserDashboardByUserId(user?.id || user?.email || 'unknown');
        if (existingDashboard) {
          const result = await supabaseApi.updateUserDashboard(existingDashboard.id, supabaseDashboardData);
          console.log('✅ Dashboard data updated in Supabase:', {
            id: result.id,
            currentEquity: result.current_equity,
            totalPnl: result.total_pnl,
            totalTrades: result.total_trades
          });
          return result;
        }
      } catch (error) {
        // Dashboard doesn't exist, create new one
        console.log('Creating new dashboard...');
      }

      const result = await supabaseApi.createUserDashboard({
        id: crypto.randomUUID(),
        user_id: user?.id || user?.email || 'unknown',
        user_email: user?.email || 'unknown@example.com',
        user_name: user?.fullName || user?.name || 'Unknown User',
        ...supabaseDashboardData,
        created_at: new Date().toISOString()
      });
      console.log('✅ Dashboard data saved to Supabase:', {
        id: result.id,
        currentEquity: result.current_equity,
        totalPnl: result.total_pnl,
        totalTrades: result.total_trades
      });
      return result;
    } catch (error) {
      console.error('❌ Failed to save dashboard to Supabase:', error);
      return null;
    }
  };

  // Function to handle real-time equity updates
  const updateEquityInSupabase = async (newEquity: number, pnl: number) => {
    try {
      const existingDashboard = await supabaseApi.getUserDashboardByUserId(user?.id || user?.email || 'unknown');
      if (existingDashboard) {
        const result = await supabaseApi.updateUserDashboard(existingDashboard.id, {
          current_equity: newEquity,
          total_pnl: pnl,
          account_balance: newEquity,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log('✅ Equity updated in Supabase:', {
          currentEquity: result.current_equity,
          totalPnl: result.total_pnl
        });
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to update equity in Supabase:', error);
    }
  };

  // Enhanced global error handler for production environment
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Global error caught:', error);
      
      // Check for headers-related errors (common in production)
      if (error.message?.includes('Cannot read properties of undefined') || 
          error.message?.includes('headers') ||
          error.message?.includes('TypeError') ||
          error.filename?.includes('index-') ||
          error.filename?.includes('vendor-')) {
        console.error('❌ Production headers error detected, switching to fallback');
        setCriticalError(true);
        setSupabaseAvailable(false);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Check for Supabase-related errors
      if (event.reason?.message?.includes('headers') ||
          event.reason?.message?.includes('fetch') ||
          event.reason?.message?.includes('network')) {
        console.error('❌ Supabase network error detected, switching to fallback');
        setSupabaseAvailable(false);
        event.preventDefault(); // Prevent the error from crashing the app
      }
    };

    // Add both error handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Check for consent on mount
  useEffect(() => {
    const consentGiven = localStorage.getItem('user_consent_accepted');
    if (!consentGiven && user?.setupComplete) {
      setShowConsentForm(true);
    }
  }, [user]);

  // Initialize real-time data service
  useEffect(() => {
    if (user?.id) {
      const realTimeService = realTimeDataService;
      
      // Subscribe to real-time dashboard data
      const unsubscribeDashboard = realTimeService.subscribeToDashboardData(
        user.id,
        (data) => {
          setRealTimeData(data);
          if (data?.trading) {
            setDashboardData(prev => ({
              ...prev,
              performance: {
                ...prev?.performance,
                totalPnl: data.trading.total_pnl,
                winRate: data.trading.win_rate,
                totalTrades: data.trading.total_trades
              }
            }));
          }
        },
        5000 // Update every 5 seconds
      );

      // Subscribe to performance metrics
      const unsubscribePerformance = realTimeService.subscribeToPerformanceMetrics(
        user.id,
        (metrics) => {
          setDashboardData(prev => ({
            ...prev,
            performance: {
              ...prev?.performance,
              ...metrics
            }
          }));
        },
        10000 // Update every 10 seconds
      );

      // Subscribe to connection status
      const unsubscribeConnection = realTimeService.subscribeToConnectionStatus(
        (isOnline) => {
          if (!isOnline) {
            console.warn('Connection lost - dashboard in offline mode');
          }
        }
      );

      // Cleanup subscriptions
      return () => {
        unsubscribeDashboard();
        unsubscribePerformance();
        unsubscribeConnection();
      };
    }
  }, [user?.id]);

  // Load initial data from Supabase, API and localStorage
  useEffect(() => {
    const initializeData = async () => {
      if (user?.email) {
        setIsLoading(true);
        const stateKey = `trading_state_${user.email}`;
        
        // Try to load data from Supabase first with enhanced error handling
        try {
          console.log('Loading dashboard data from Supabase...');
          
          // Check if supabaseApi is available and properly initialized
          if (!supabaseApi || typeof supabaseApi.getUserDashboardByUserId !== 'function') {
            throw new Error('Supabase API not properly initialized');
          }
          
          const supabasePromise = supabaseApi.getUserDashboardByUserId(user.id || user.email);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Supabase timeout')), 3000)
          );
          
          const existingDashboard = await Promise.race([supabasePromise, timeoutPromise]);
          
          if (existingDashboard && existingDashboard.id) {
            console.log('Found existing dashboard in Supabase:', existingDashboard);
            
            // Load dashboard data from Supabase
            const supabaseDashboardData = {
              userProfile: {
                propFirm: existingDashboard.prop_firm || 'Not Set',
                accountType: existingDashboard.account_type || 'Not Set',
                accountSize: existingDashboard.account_size || 'Not Set',
                riskPerTrade: existingDashboard.risk_per_trade ? `${existingDashboard.risk_per_trade}%` : 'Not Set',
                experience: existingDashboard.experience || 'Not Set',
                uniqueId: existingDashboard.unique_id || 'Not Set'
              },
              performance: {
                accountBalance: existingDashboard.account_balance || existingDashboard.current_equity || 'Not Set',
                totalPnl: existingDashboard.total_pnl || 0,
                winRate: existingDashboard.win_rate || 0,
                totalTrades: existingDashboard.total_trades || 0
              },
              riskProtocol: {
                maxDailyRisk: existingDashboard.max_daily_risk || 'Not Set',
                riskPerTrade: existingDashboard.risk_per_trade_amount || 'Not Set',
                maxDrawdown: existingDashboard.max_drawdown_limit || 'Not Set'
              }
            };
            
            setDashboardData(supabaseDashboardData);
            
            // Load trading state from Supabase
            const supabaseTradingState: TradingState = {
              initialEquity: existingDashboard.initial_equity || 100000,
              currentEquity: existingDashboard.current_equity || existingDashboard.initial_equity || 100000,
              trades: existingDashboard.trade_history || [],
              openPositions: existingDashboard.open_positions || [],
              riskSettings: {
                riskPerTrade: existingDashboard.risk_per_trade_percentage || 1,
                dailyLossLimit: existingDashboard.daily_loss_limit || 5,
                consecutiveLossesLimit: existingDashboard.consecutive_losses_limit || 3,
              },
              performanceMetrics: {
                totalPnl: existingDashboard.total_pnl || 0,
                winRate: existingDashboard.win_rate || 0,
                totalTrades: existingDashboard.total_trades || 0,
                winningTrades: existingDashboard.winning_trades || 0,
                losingTrades: existingDashboard.losing_trades || 0,
                averageWin: existingDashboard.average_win || 0,
                averageLoss: existingDashboard.average_loss || 0,
                profitFactor: existingDashboard.profit_factor || 0,
                maxDrawdown: existingDashboard.max_drawdown || 0,
                currentDrawdown: existingDashboard.current_drawdown || 0,
                grossProfit: existingDashboard.gross_profit || 0,
                grossLoss: existingDashboard.gross_loss || 0,
                consecutiveWins: existingDashboard.consecutive_wins || 0,
                consecutiveLosses: existingDashboard.consecutive_losses || 0,
                sharpeRatio: existingDashboard.sharpe_ratio || 0,
              },
              dailyStats: {
                pnl: existingDashboard.daily_pnl || 0,
                trades: existingDashboard.daily_trades || 0,
                initialEquity: existingDashboard.daily_initial_equity || existingDashboard.initial_equity || 100000
              },
            };
            
            setTradingState(supabaseTradingState);
            console.log('✅ Loaded data from Supabase successfully');
            setIsLoading(false);
            return; // Exit early if Supabase data is loaded
          }
        } catch (error) {
          console.error('Error loading data from Supabase, falling back to localStorage:', error);
          setSupabaseAvailable(false);
          // Check if this is a critical error
          if (error instanceof Error && error.message.includes('Cannot read properties of undefined')) {
            setCriticalError(true);
            return;
          }
          // Continue to localStorage fallback below
        }
        
        // Restore dashboard state from user backup if available
        const backupData = localStorage.getItem(`user_backup_${user.email}`);
        if (backupData) {
          try {
            const backup = JSON.parse(backupData);
            if (backup.dashboardState) {
              // Restore dashboard preferences
              if (backup.dashboardState.activeTab) {
                localStorage.setItem(`dashboard_active_tab_${user.email}`, backup.dashboardState.activeTab);
              }
              if (backup.dashboardState.selectedTimezone) {
                localStorage.setItem(`dashboard_timezone_${user.email}`, backup.dashboardState.selectedTimezone);
              }
              if (backup.dashboardState.preferences) {
                localStorage.setItem(`dashboard_preferences_${user.email}`, backup.dashboardState.preferences);
              }
            }
          } catch (error) {
            console.warn('Could not restore dashboard state:', error);
          }
        }
        
        // Load data from localStorage first, then try API as enhancement
        const localDashboardData = localStorage.getItem(`dashboard_data_${user.email}`);
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
        
        // Create dashboard data from questionnaire if available
        const accountValue = parsedQuestionnaire?.hasAccount === 'yes' 
          ? parsedQuestionnaire?.accountEquity 
          : parsedQuestionnaire?.accountSize;

        const fallbackDashboardData = {
          userProfile: {
            propFirm: parsedQuestionnaire?.propFirm || 'Not Set',
            accountType: parsedQuestionnaire?.accountType || 'Not Set',
            accountSize: accountValue || 'Not Set',
            riskPerTrade: parsedQuestionnaire?.riskPercentage ? `${parsedQuestionnaire.riskPercentage}%` : 'Not Set',
            experience: parsedQuestionnaire?.experience || 'Not Set',
            uniqueId: user?.uniqueId || 'Not Set'
          },
          performance: {
            accountBalance: accountValue || 'Not Set',
            totalPnl: 0,
            winRate: 0,
            totalTrades: 0
          },
          riskProtocol: {
            maxDailyRisk: parsedRiskPlan?.dailyRiskAmount || 'Not Set',
            riskPerTrade: parsedRiskPlan?.riskAmount || 'Not Set',
            maxDrawdown: 'Not Set'
          }
        };
        
        // Set dashboard data from localStorage or fallback
        if (localDashboardData) {
          try {
            setDashboardData(JSON.parse(localDashboardData));
          } catch {
            setDashboardData(fallbackDashboardData);
          }
        } else {
          setDashboardData(fallbackDashboardData);
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
        
        try {
          // Try unified dashboard service first (uses trading_bots.db)
          console.log('🔄 Attempting to fetch data from unified dashboard service...');
          const unifiedData = await unifiedDashboardService.getDashboardDataWithFallback(user.email);
          
          if (unifiedData) {
            console.log('✅ Using unified dashboard data from trading_bots.db:', unifiedData);
            setDashboardData(unifiedData);
          } else {
            // Fallback to original API
            console.log('⚠️ Unified service unavailable, trying original API...');
            const response = await api.get('/dashboard-data');
            if (response.data && Object.keys(response.data).length > 0) {
              setDashboardData(response.data);
              console.log('✅ Using fallback dashboard data');
            }
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            console.warn('Dashboard data endpoint not found, using local data');
          } else {
            console.error('Failed to fetch dashboard data from API, using local data.', error);
          }
        }
        
        setIsLoading(false);
      }
    };
    initializeData();
  }, [user, tradingPlan]);

  // Save dashboard data to Supabase whenever it changes
  useEffect(() => {
    if (dashboardData && tradingState && user?.id) {
      // Debounce the save to avoid too many API calls
      const timeoutId = setTimeout(() => {
        saveDashboardToSupabase(dashboardData, tradingState, theme);
      }, 1000); // Wait 1 second after changes stop
      
      return () => clearTimeout(timeoutId);
    }
  }, [dashboardData, tradingState, theme, user?.id]);

  // Persist data to localStorage on change
  useEffect(() => {
    if (user?.email && tradingState) {
      localStorage.setItem(`trading_state_${user.email}`, JSON.stringify(tradingState));
    }
    if (user?.email && dashboardData) {
      localStorage.setItem(`dashboard_data_${user.email}`, JSON.stringify(dashboardData));
    }
  }, [tradingState, dashboardData, user?.email]);

  // Sync dashboardData with tradingState
  useEffect(() => {
    if (tradingState && dashboardData) {
      const { performanceMetrics, currentEquity } = tradingState;
      setDashboardData((prevData: any) => ({
        ...prevData,
        performance: {
          ...prevData.performance,
          accountBalance: currentEquity,
          totalPnl: performanceMetrics.totalPnl,
          winRate: performanceMetrics.winRate,
          totalTrades: performanceMetrics.totalTrades,
        },
        account: {
            ...prevData.account,
            balance: currentEquity,
            equity: currentEquity,
        }
      }));
    }
  }, [tradingState]);

  // Handle real-time equity updates and save to Supabase
  useEffect(() => {
    if (tradingState?.currentEquity && user?.id) {
      const { currentEquity, performanceMetrics } = tradingState;
      const pnl = performanceMetrics?.totalPnl || 0;
      
      // Update equity in Supabase when it changes
      const timeoutId = setTimeout(() => {
        updateEquityInSupabase(currentEquity, pnl);
      }, 2000); // Wait 2 seconds after equity changes
      
      return () => clearTimeout(timeoutId);
    }
  }, [tradingState?.currentEquity, tradingState?.performanceMetrics?.totalPnl, user?.id]);

  const handleConsentAccept = () => {
    setShowConsentForm(false);
  };

  const handleConsentDecline = () => {
    onLogout();
  };

  const handleMarkAsTaken = (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    if (tradingState) {
      if (isDailyLossLimitReached(tradingState)) {
        alert("You have hit your daily loss limit. No more trades are allowed today.");
        return;
      }
      const stateAfterOpen = openTrade(tradingState, signal);
      const newTrade = stateAfterOpen.openPositions[stateAfterOpen.openPositions.length - 1];
      const finalState = closeTrade(stateAfterOpen, newTrade.id, outcome, pnl);
      setTradingState(finalState);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter overflow-hidden">
        <FuturisticBackground />
        <FuturisticCursor />
        
        {/* Futuristic Loading Animation */}
        <div className="relative z-10 text-center">
          {/* Main Loading Circle */}
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto relative">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400 animate-spin"></div>
              {/* Middle rotating ring */}
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-blue-400 border-l-blue-400 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              {/* Inner pulsing core */}
              <div className="absolute inset-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse shadow-lg shadow-cyan-500/50"></div>
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full animate-ping"></div>
            </div>
          </div>
          
          {/* Loading Text with Typewriter Effect */}
          <div className="text-2xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              INITIALIZING DASHBOARD
            </span>
          </div>
          
          {/* Progress Bars */}
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex items-center space-x-3">
              <div className="text-cyan-400 text-sm font-mono w-24 text-left">CORE_SYS</div>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse" style={{width: '85%'}}></div>
              </div>
              <div className="text-cyan-400 text-xs font-mono w-8">85%</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-blue-400 text-sm font-mono w-24 text-left">DATA_SYNC</div>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse" style={{width: '72%'}}></div>
              </div>
              <div className="text-blue-400 text-xs font-mono w-8">72%</div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-purple-400 text-sm font-mono w-24 text-left">UI_LOAD</div>
              <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse" style={{width: '91%'}}></div>
              </div>
              <div className="text-purple-400 text-xs font-mono w-8">91%</div>
            </div>
          </div>
          
          {/* Status Messages */}
          <div className="mt-6 text-gray-400 text-sm font-mono">
            <div className="animate-pulse">» Establishing secure connection...</div>
            <div className="animate-pulse" style={{animationDelay: '0.5s'}}>» Loading market data streams...</div>
            <div className="animate-pulse" style={{animationDelay: '1s'}}>» Initializing trading algorithms...</div>
          </div>
          
          {/* Scanning Effect */}
          <div className="absolute -inset-4 opacity-30">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-transparent via-purple-400 to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
            <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-gradient-to-b from-transparent via-pink-400 to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  // Use simple dashboard if there's a critical error
  if (criticalError) {
    return <SimpleDashboard onLogout={onLogout} />;
  }

  // Use fallback component if Supabase is not available
  if (!supabaseAvailable) {
    return <DashboardFallback onLogout={onLogout} />;
  }

  if (!user.setupComplete) {
    const message = user.membershipTier === 'kickstarter'
      ? "Your Kickstarter plan is awaiting approval. You will be notified once your account is active."
      : "Please complete the setup process to access your dashboard.";
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center font-inter">
        <FuturisticBackground />
        <FuturisticCursor />
        <div className="relative z-10 text-center">
          <div className="text-blue-400 text-xl animate-pulse mb-4">Awaiting Access</div>
          <p className="text-gray-400">{message}</p>
        </div>
      </div>
    );
  }

  const renderTheme = () => {
    const props = {
      onLogout,
      tradingState,
      dashboardData,
      handleMarkAsTaken,
      setTradingState,
      user,
      realTimeData, // Pass real-time data to dashboard concepts
    };
    switch (theme) {
      case 'concept1':
        return <DashboardConcept1 {...props} />;
      case 'concept2':
        return <DashboardConcept2 {...props} />;
      case 'concept3':
        return <DashboardConcept3 {...props} />;
      case 'concept4':
        return <DashboardConcept4 {...props} />;
      case 'concept5':
        return <DashboardConcept5 {...props} />;
      default:
        return <DashboardConcept1 {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 font-inter relative">
      <FuturisticBackground />
      <FuturisticCursor />
      <ConsentForm 
        isOpen={showConsentForm}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
      
      {/* Subscription Status */}
      <div className="fixed top-4 left-4 z-40 max-w-sm">
        <SubscriptionStatus />
      </div>
      <div className="theme-switcher fixed top-4 right-4 z-50">
        <select 
          onChange={(e) => {
            const newTheme = e.target.value;
            setTheme(newTheme);
            // Persist theme selection to localStorage
            localStorage.setItem('dashboard_selected_concept', newTheme);
          }}
          value={theme}
          className="bg-gray-800 text-white p-2 rounded border border-gray-600"
        >
          <option value="concept1">Default</option>
          <option value="concept2">Aurora Borealis</option>
          <option value="concept3">Neomorphic Dark</option>
          <option value="concept4">Fluid Gradient</option>
        </select>
      </div>
      {renderTheme()}
    </div>
  );
};

export default Dashboard;
