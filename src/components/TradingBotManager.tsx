import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  RefreshCw, 
  TrendingUp, 
  Coins, 
  Activity, 
  Bot, 
  Zap, 
  Globe, 
  Settings, 
  Brain, 
  Rocket, 
  Shield, 
  Target,
  Cpu,
  Database,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  Eye,
  EyeOff,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit3,
  Save,
  X,
  Plus
} from 'lucide-react';
import tradingBotService, { TradingSignal, BotConfig, PriceData, BotStatus } from '../services/tradingBotService';

interface TradingBotManagerProps {
  // Props if needed
}

interface BotData {
  id: number;
  bot_type: string;
  pair: string;
  price: number;
  signal_type: string;
  signal_strength: number;
  is_recommended: boolean;
  timestamp: string;
}

const TradingBotManager: React.FC<TradingBotManagerProps> = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<'forex' | 'crypto'>('forex');
  const [isBothBotsActive, setIsBothBotsActive] = useState(false);
  const [forexData, setForexData] = useState<BotData[]>([]);
  const [cryptoData, setCryptoData] = useState<BotData[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  // Working functionality state
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('ALL');
  const [riskRewardRatio, setRiskRewardRatio] = useState(2.0);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [logs, setLogs] = useState<Array<{message: string, type: string, timestamp: Date}>>([]);
  const [stats, setStats] = useState({
    activePairs: 0,
    signalsToday: 0,
    activeTimeframes: 0,
    systemStatus: 'Ready',
    bosCount: 0,
    chochCount: 0,
    orderBlocks: 0,
    fvgCount: 0,
    activeSignals: 0,
    totalBots: 0,
    activeBots: 0,
    totalProfit: 0,
    winRate: 0
  });
  const [priceFeed, setPriceFeed] = useState<{[key: string]: any}>({});
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState<string>('');
  const [botConfigs, setBotConfigs] = useState<BotConfig[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<BotConfig | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [livePrices, setLivePrices] = useState<PriceData[]>([]);
  const [isPriceMonitoring, setIsPriceMonitoring] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRunningRef = useRef(isRunning);

  // All the symbols and timeframes from your working components
  const cryptoSymbols = [
    'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT',
    'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT', 'LTCUSDT', 'XLMUSDT', 'FILUSDT', 'AAVEUSDT'
  ];

  const forexSymbols = [
    'EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X', 'USDCAD=X', 'NZDUSD=X',
    'EURJPY=X', 'GBPJPY=X', 'EURGBP=X', 'AUDJPY=X', 'CADJPY=X', 'CHFJPY=X', 'EURCHF=X',
    'GBPCHF=X', 'AUDCHF=X', 'CADCHF=X', 'EURAUD=X', 'GBPAUD=X', 'EURNZD=X', 'GBPNZD=X',
    'AUDNZD=X', 'NZDCHF=X', 'NZDJPY=X'
  ];

  const timeframes = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];

  // Initialize with real bot configurations and status
  useEffect(() => {
    const initializeBots = async () => {
      try {
        // Load bot configurations
        const configs = await tradingBotService.getBotConfigs();
        setBotConfigs(configs);
        
        // Load bot status
        const forexStatus = await tradingBotService.getBotStatus('forex');
        const cryptoStatus = await tradingBotService.getBotStatus('crypto');
        
        setBotStatus([forexStatus, cryptoStatus].filter((status): status is BotStatus => status !== null));
        
        // Load existing signals
        const existingSignals = await tradingBotService.getSignals();
        setSignals(existingSignals);
        
        // Update stats
        setStats(prev => ({ 
          ...prev, 
          totalBots: configs.length, 
          activeBots: configs.filter(b => b.isActive).length,
          activeSignals: existingSignals.length
        }));
        
        addLog('✅ Bot system initialized successfully', 'success');
      } catch (error) {
        console.error('Error initializing bots:', error);
        addLog('❌ Error initializing bot system', 'error');
      }
    };
    
    initializeBots();
  }, []);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Update current date time
  useEffect(() => {
    const updateDateTime = () => {
      setCurrentDateTime(new Date().toLocaleString());
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-start price monitoring when tab changes
  useEffect(() => {
    if (isPriceMonitoring) {
      stopPriceMonitoring();
    }
    // Start monitoring for the new tab
    const timer = setTimeout(() => {
      startPriceMonitoring();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [activeSubTab]);

  const addLog = (message: string, type: string = 'info') => {
    const newLog = {
      message,
      type,
      timestamp: new Date()
    };
    setLogs(prev => [newLog, ...prev.slice(0, 99)]);
  };

  const startAnalysis = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setIsAnalysisRunning(true);
    addLog('🚀 Starting advanced trading analysis...', 'success');
    
    try {
      // Get current bot configuration
      const currentConfig = botConfigs.find(config => config.type === activeSubTab);
      if (!currentConfig) {
        addLog('❌ No bot configuration found for current market type', 'error');
        return;
      }

      // Start the bot using the service
      const success = await tradingBotService.startBot(activeSubTab, currentConfig);
      
      if (success) {
        addLog(`✅ ${activeSubTab.toUpperCase()} bot started successfully`, 'success');
        
        // Update bot status
        const newStatus = await tradingBotService.getBotStatus(activeSubTab);
        if (newStatus) {
          setBotStatus(prev => {
            const filtered = prev.filter(s => s.bot_type !== activeSubTab);
            return [...filtered, newStatus];
          });
        }
        
        // Update stats
        setStats(prev => ({
          ...prev,
          activePairs: currentConfig.symbols.length,
          activeTimeframes: currentConfig.timeframes.length,
          activeBots: prev.activeBots + 1
        }));
      } else {
        addLog(`❌ Failed to start ${activeSubTab} bot`, 'error');
      }
      
    } catch (error) {
      addLog(`❌ Error starting analysis: ${error}`, 'error');
    } finally {
      setIsAnalysisRunning(false);
    }
  };

  const stopAnalysis = async () => {
    try {
      const success = await tradingBotService.stopBot(activeSubTab);
      
      if (success) {
        setIsRunning(false);
        addLog(`⏹️ ${activeSubTab.toUpperCase()} bot stopped successfully.`, 'warning');
        
        // Update bot status
        const newStatus = await tradingBotService.getBotStatus(activeSubTab);
        if (newStatus) {
          setBotStatus(prev => {
            const filtered = prev.filter(s => s.bot_type !== activeSubTab);
            return [...filtered, newStatus];
          });
        }
        
        // Update stats
        setStats(prev => ({
          ...prev,
          activeBots: Math.max(0, prev.activeBots - 1)
        }));
      } else {
        addLog(`❌ Failed to stop ${activeSubTab} bot`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error stopping bot: ${error}`, 'error');
    }
  };

  const refreshSystem = () => {
    stopAnalysis();
    setSignals([]);
    setStats(prev => ({
      ...prev,
      activePairs: 0,
      activeTimeframes: 0,
      activeSignals: 0
    }));
    addLog('🔄 Trading system refreshed.', 'success');
  };

  const startPriceMonitoring = async () => {
    if (isPriceMonitoring) return;
    
    setIsPriceMonitoring(true);
    addLog('📊 Starting real-time price monitoring...', 'info');
    
    const updatePrices = async () => {
      try {
        let prices: PriceData[] = [];
        
        if (activeSubTab === 'forex') {
          const symbols = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'USDCHF=X', 'AUDUSD=X'];
          prices = await tradingBotService.fetchForexPrices(symbols);
        } else if (activeSubTab === 'crypto') {
          const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'XRPUSDT'];
          prices = await tradingBotService.fetchCryptoPrices(symbols);
        }
        
        if (prices.length > 0) {
          setLivePrices(prices);
          addLog(`📈 Updated ${prices.length} ${activeSubTab} prices`, 'success');
        }
      } catch (error) {
        addLog(`❌ Error updating prices: ${error}`, 'error');
      }
    };
    
    // Update immediately
    await updatePrices();
    
    // Set up interval for continuous updates
    const priceInterval = setInterval(updatePrices, 10000); // Update every 10 seconds
    
    // Store interval reference for cleanup
    return () => {
      clearInterval(priceInterval);
      setIsPriceMonitoring(false);
    };
  };

  const stopPriceMonitoring = () => {
    setIsPriceMonitoring(false);
    addLog('⏹️ Price monitoring stopped.', 'warning');
  };

  const copyTradeDetails = (signal: TradingSignal) => {
    const text = `Symbol: ${signal.symbol}\nType: ${signal.signalType}\nEntry: ${signal.entryPrice}\nStop Loss: ${signal.stopLoss}\nTake Profit: ${signal.takeProfit}\nConfidence: ${signal.confidence}%`;
    navigator.clipboard.writeText(text).then(() => {
      addLog('Trade details copied to clipboard!', 'success');
    });
  };

  const toggleBotStatus = async (botId: string) => {
    try {
      const bot = botConfigs.find(b => b.id === botId);
      if (!bot) return;

      const newConfig = { ...bot, isActive: !bot.isActive };
      const success = await tradingBotService.saveBotConfig(newConfig);
      
      if (success) {
        setBotConfigs(prev => prev.map(b => 
          b.id === botId ? newConfig : b
        ));
        setStats(prev => ({ 
          ...prev, 
          activeBots: botConfigs.filter(b => b.isActive).length 
        }));
        addLog(`Bot ${botId} status toggled`, 'info');
      }
    } catch (error) {
      addLog(`❌ Error toggling bot status: ${error}`, 'error');
    }
  };

  const deleteBot = async (botId: string) => {
    if (confirm('Are you sure you want to delete this bot configuration?')) {
      try {
        const success = await tradingBotService.deleteBotConfig(botId);
        if (success) {
          setBotConfigs(prev => prev.filter(bot => bot.id !== botId));
          setStats(prev => ({ ...prev, totalBots: prev.totalBots - 1 }));
          addLog(`Bot ${botId} deleted`, 'warning');
        }
      } catch (error) {
        addLog(`❌ Error deleting bot: ${error}`, 'error');
      }
    }
  };

  const saveBotConfig = async (config: BotConfig) => {
    try {
      const success = await tradingBotService.saveBotConfig(config);
      if (success) {
        if (editingConfig) {
          setBotConfigs(prev => prev.map(bot => 
            bot.id === config.id ? { ...config, lastModified: new Date() } : bot
          ));
        } else {
          const newConfig = { ...config, id: Date.now().toString(), lastModified: new Date() };
          setBotConfigs(prev => [...prev, newConfig]);
          setStats(prev => ({ ...prev, totalBots: prev.totalBots + 1 }));
        }
        setShowConfigModal(false);
        setEditingConfig(null);
        addLog(`Bot configuration ${editingConfig ? 'updated' : 'created'}`, 'success');
      }
    } catch (error) {
      addLog(`❌ Error saving bot config: ${error}`, 'error');
    }
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-600/80 text-white';
    if (confidence >= 70) return 'bg-yellow-600/80 text-white';
    return 'bg-red-600/80 text-white';
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType.toLowerCase()) {
      case 'buy': return '🟢';
      case 'sell': return '🔴';
      default: return '🟡';
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(5);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const aiCoreStats = [
    {
      label: 'AI Signal Generator',
      value: isRunning ? 'Online' : 'Offline',
      icon: <Bot className="w-5 h-5 text-green-400" />,
      statusColor: isRunning ? 'text-green-400' : 'text-red-400'
    },
    {
      label: 'Market Analysis Engine',
      value: isAnalysisRunning ? 'Active' : 'Idle',
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      statusColor: isAnalysisRunning ? 'text-cyan-400' : 'text-gray-400'
    },
    {
      label: 'Bot Database',
      value: 'Connected',
      icon: <Database className="w-5 h-5 text-purple-400" />,
      statusColor: 'text-purple-400'
    },
    {
      label: 'Signal Distribution',
      value: 'Operational',
      icon: <Server className="w-5 h-5 text-yellow-400" />,
      statusColor: 'text-yellow-400'
    }
  ];

  return (
    <div className="space-y-6">
      <style>{`
        .futuristic-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .futuristic-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .futuristic-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #00d4ff, #0099cc);
          border-radius: 4px;
        }
        .futuristic-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(45deg, #0099cc, #00d4ff);
        }
      `}</style>
      {/* Header Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🤖</div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-wider">Advanced Trading Bot Manager</h2>
              <p className="text-gray-400">Unified Forex & Crypto SMC Analysis with Real-Time Data</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-gray-300">{isRunning ? 'Running' : 'Stopped'}</span>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-cyan-500/20">
            <div className="text-xs text-gray-400 mb-1">Total Bots</div>
            <div className="text-lg font-bold text-cyan-400">{stats.totalBots}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-cyan-500/20">
            <div className="text-xs text-gray-400 mb-1">Active Bots</div>
            <div className="text-lg font-bold text-green-400">{stats.activeBots}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-cyan-500/20">
            <div className="text-xs text-gray-400 mb-1">Live Signals</div>
            <div className="text-lg font-bold text-blue-400">{stats.activeSignals}</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center border border-cyan-500/20">
            <div className="text-xs text-gray-400 mb-1">Win Rate</div>
            <div className="text-lg font-bold text-purple-400">{stats.winRate}%</div>
          </div>
        </div>
      </div>

      {/* Bot Type Selection */}
      <div className="flex border-b border-cyan-500/30">
        <button 
          className={`py-2 px-4 text-lg font-medium transition-all duration-300 ${activeSubTab === 'forex' ? 'text-cyan-300 border-b-2 border-cyan-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveSubTab('forex')}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Forex Bot
        </button>
        <button 
          className={`py-2 px-4 text-lg font-medium transition-all duration-300 ${activeSubTab === 'crypto' ? 'text-cyan-300 border-b-2 border-cyan-300' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveSubTab('crypto')}
        >
          <Coins className="w-4 h-4 inline mr-2" />
          Crypto Bot
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Bot Settings */}
        <div className="space-y-6">
          {/* Trading Settings */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2 text-cyan-400" />
              Advanced SMC Trading Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Symbol</option>
                  <option value="ALL" className="bg-cyan-600 text-white font-bold">📊 ALL SYMBOLS</option>
                  {activeSubTab === 'forex' ? 
                    forexSymbols.map(symbol => (
                      <option key={symbol} value={symbol}>
                        {symbol.replace('=X', '')}
                      </option>
                    )) :
                    cryptoSymbols.map(symbol => (
                      <option key={symbol} value={symbol}>
                        {symbol.replace('USDT', '')}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select Timeframe</option>
                  <option value="ALL" className="bg-cyan-600 text-white font-bold">⏰ ALL TIMEFRAMES</option>
                  {timeframes.map(tf => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Risk:Reward Ratio</label>
                <select
                  value={riskRewardRatio}
                  onChange={(e) => setRiskRewardRatio(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={1.5}>1.5</option>
                  <option value={2.0}>2.0</option>
                  <option value={2.5}>2.5</option>
                  <option value={3.0}>3.0</option>
                  <option value={3.5}>3.5</option>
                </select>
              </div>

              <div className="space-y-2">
                <button
                  onClick={startAnalysis}
                  disabled={isRunning}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Analysis</span>
                </button>
                
                <button
                  onClick={stopAnalysis}
                  disabled={!isRunning}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Analysis</span>
                </button>
                
                <button
                  onClick={refreshSystem}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh System</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Core Status */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
            <h4 className="text-lg font-semibold text-white mb-4 tracking-wider">AI Core Status</h4>
            <div className="space-y-3">
              {aiCoreStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {stat.icon}
                    <span className="text-gray-300">{stat.label}</span>
                  </div>
                  <span className={`${stat.statusColor} font-semibold`}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Live Signals */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Zap className="w-6 h-6 mr-2 text-cyan-400" />
              Live Trading Signals ({signals.length})
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto futuristic-scrollbar">
              {signals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Configure settings and start analysis for live trading signals</p>
                  <p className="text-sm mt-2 opacity-70">Real-time SMC structure analysis with multi-API data</p>
                </div>
              ) : (
                signals.map(signal => (
                  <div
                    key={signal.id}
                    className={`bg-gray-800/50 rounded-xl p-6 border-l-4 transition-all hover:bg-gray-700/50 ${
                      signal.direction === 'bullish' ? 'border-cyan-400' : 'border-red-400'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getSignalIcon(signal.signalType)}
                        </div>
                        <div>
                          <div className={`text-xl font-bold ${
                            signal.direction === 'bullish' ? 'text-cyan-400' : 'text-red-400'
                          }`}>
                            {signal.signalType} {signal.symbol}
                          </div>
                          <div className="text-sm text-gray-400">
                            {signal.timeframe} • {signal.sessionQuality}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${getConfidenceClass(signal.confidence)}`}>
                        {signal.confidence}% Confidence
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Entry</div>
                        <div className="text-cyan-400 font-bold">{signal.entryPrice}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Stop Loss</div>
                        <div className="text-red-400 font-bold">{signal.stopLoss}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">Take Profit</div>
                        <div className="text-green-400 font-bold">{signal.takeProfit}</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-400 mb-1">R:R Ratio</div>
                        <div className="text-white font-bold">{signal.riskReward}</div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="text-sm font-semibold text-gray-300 mb-2">
                        📋 SMC Confirmations ({signal.confirmations.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {signal.confirmations.map((conf, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-cyan-600/20 text-cyan-300 text-xs rounded-full border border-cyan-500/30"
                          >
                            {conf}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
                      <div className="text-sm font-semibold text-gray-300 mb-2">Analysis:</div>
                      <div className="text-gray-300 text-sm leading-relaxed">{signal.analysis}</div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => copyTradeDetails(signal)}
                        className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copy Trade Details</span>
                      </button>
                      <button
                        onClick={() => {/* Add to watchlist */}}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Price Feed */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Activity className="w-6 h-6 mr-2 text-cyan-400" />
            Live Price Feed ({livePrices.length})
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={startPriceMonitoring}
              disabled={isPriceMonitoring}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>Start Monitoring</span>
            </button>
            <button
              onClick={stopPriceMonitoring}
              disabled={!isPriceMonitoring}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2"
            >
              <Square className="w-4 h-4" />
              <span>Stop Monitoring</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {livePrices.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start price monitoring to see live {activeSubTab} prices</p>
            </div>
          ) : (
            livePrices.map((price, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-lg font-semibold text-white">{price.symbol}</h4>
                  <span className="text-xs text-gray-400">{price.provider}</span>
                </div>
                <div className="text-2xl font-bold text-cyan-400 mb-2">
                  ${price.price.toFixed(price.symbol.includes('JPY') ? 2 : 4)}
                </div>
                <div className="text-xs text-gray-400">
                  Updated: {price.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bot Configurations */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Settings className="w-6 h-6 mr-2 text-cyan-400" />
            Bot Configurations ({botConfigs.length})
          </h3>
          <button
            onClick={() => setShowConfigModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bot</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {botConfigs.map(bot => (
            <div key={bot.id} className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-white">{bot.name}</h4>
                <div className={`w-3 h-3 rounded-full ${bot.isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Type:</span>
                  <span className="text-white capitalize">{bot.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Symbols:</span>
                  <span className="text-white">{bot.symbols.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">R:R Ratio:</span>
                  <span className="text-white">{bot.riskReward}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Auto Trade:</span>
                  <span className={bot.autoTrade ? 'text-green-400' : 'text-red-400'}>
                    {bot.autoTrade ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => toggleBotStatus(bot.id)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    bot.isActive 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {bot.isActive ? 'Stop' : 'Start'}
                </button>
                <button
                  onClick={() => setEditingConfig(bot)}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteBot(bot.id)}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📝 System Logs</h3>
        <div className="bg-gray-800/50 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm futuristic-scrollbar">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-cyan-400 font-bold">
                [{log.timestamp.toLocaleTimeString()}]
              </span>
              <span className={`ml-2 ${
                log.type === 'success' ? 'text-green-400' :
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-gray-300'
              }`}>
                {log.message}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bot Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingConfig ? 'Edit Bot' : 'Add New Bot'}
              </h3>
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setEditingConfig(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const config: BotConfig = {
                id: editingConfig?.id || '',
                name: formData.get('name') as string,
                type: formData.get('type') as 'forex' | 'crypto' | 'hybrid',
                isActive: editingConfig?.isActive || false,
                symbols: (formData.get('symbols') as string).split(',').map(s => s.trim()),
                timeframes: (formData.get('timeframes') as string).split(',').map(s => s.trim()),
                riskReward: parseFloat(formData.get('riskReward') as string),
                maxPositions: parseInt(formData.get('maxPositions') as string),
                autoTrade: formData.get('autoTrade') === 'on',
                stopLoss: parseFloat(formData.get('stopLoss') as string),
                takeProfit: parseFloat(formData.get('takeProfit') as string),
                strategy: formData.get('strategy') as string,
                lastModified: new Date()
              };
              saveBotConfig(config);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bot Name</label>
                  <input
                    name="name"
                    defaultValue={editingConfig?.name}
                    className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bot Type</label>
                  <select
                    name="type"
                    defaultValue={editingConfig?.type}
                    className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                    required
                  >
                    <option value="forex">Forex</option>
                    <option value="crypto">Crypto</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Symbols (comma-separated)</label>
                  <input
                    name="symbols"
                    defaultValue={editingConfig?.symbols.join(', ')}
                    className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                    placeholder="EURUSD, GBPUSD, BTCUSDT"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timeframes (comma-separated)</label>
                  <input
                    name="timeframes"
                    defaultValue={editingConfig?.timeframes.join(', ')}
                    className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                    placeholder="15m, 1h, 4h"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Risk:Reward</label>
                    <input
                      name="riskReward"
                      type="number"
                      step="0.1"
                      defaultValue={editingConfig?.riskReward}
                      className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Max Positions</label>
                    <input
                      name="maxPositions"
                      type="number"
                      defaultValue={editingConfig?.maxPositions}
                      className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (%)</label>
                    <input
                      name="stopLoss"
                      type="number"
                      step="0.1"
                      defaultValue={editingConfig?.stopLoss}
                      className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (%)</label>
                    <input
                      name="takeProfit"
                      type="number"
                      step="0.1"
                      defaultValue={editingConfig?.takeProfit}
                      className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Strategy</label>
                  <input
                    name="strategy"
                    defaultValue={editingConfig?.strategy}
                    className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
                    placeholder="Smart Money Concepts"
                    required
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    name="autoTrade"
                    type="checkbox"
                    defaultChecked={editingConfig?.autoTrade}
                    className="w-4 h-4 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500"
                  />
                  <label className="text-sm text-gray-300">Enable Auto Trading</label>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
                  >
                    {editingConfig ? 'Update Bot' : 'Create Bot'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfigModal(false);
                      setEditingConfig(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingBotManager;
