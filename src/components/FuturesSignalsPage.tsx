import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../contexts/UserContext';
import { 
  Bot, Zap, Activity, Globe, Play, Pause, Target, BarChart3, Database, RefreshCw,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, DollarSign,
  Brain, Cpu, Eye, Shield, ArrowUp, ArrowDown, Minus, Plus, Signal
} from 'lucide-react';

// Environment-aware API configuration
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production environment detection
    if (hostname.includes('onrender.com') || hostname.includes('traderedgepro.com')) {
      return 'https://futures-data-service.onrender.com';
    }
    
    // Local development
    return 'http://localhost:10003';
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:10003';
};

const FUTURES_API_BASE = getApiBaseUrl();

interface FuturesSignal {
  id: string;
  symbol: string;
  ticker: string;
  name: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timeframe: string;
  analysis: string;
  timestamp: string;
  status: 'active' | 'completed';
  confirmations?: any[];
  riskReward?: number;
  lotSize?: number;
  moneyAtRisk?: number;
  session?: string;
  indicators?: any;
  reasoning?: string;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'price_update' | 'signal_generated' | 'error' | 'info' | 'system' | 'analysis' | 'confirmation';
  message: string;
  data?: any;
}

const FuturesSignalsPage: React.FC = () => {
  const { user } = useUser();
  const [signals, setSignals] = useState<FuturesSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignalGenerationActive, setIsSignalGenerationActive] = useState(true);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [lastSignalUpdate, setLastSignalUpdate] = useState<string>('');
  const [systemHeartbeat, setSystemHeartbeat] = useState<number>(0);
  const [stats, setStats] = useState({
    totalSignals: 0,
    liveSignals: 0,
    activeSignals: 0,
    successRate: 0,
    totalPnl: 0,
    analysisCount: 0
  });

  const signalIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Activity logging function
  const addActivityLog = useCallback((type: ActivityLog['type'], message: string, data?: any) => {
    const logEntry: ActivityLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    
    setActivityLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries
  }, []);

  // Generate signal from futures bot
  const generateSignal = useCallback(async () => {
    if (!isSignalGenerationActive) return;

    try {
      // Generate signal for random asset
      const assets = ['SP500', 'NASDAQ', 'DOW', 'RUSSELL', 'CRUDE', 'GOLD', 'SILVER'];
      const randomAsset = assets[Math.floor(Math.random() * assets.length)];
      
      const response = await fetch(`${FUTURES_API_BASE}/api/futures/signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset: randomAsset,
          timeframe: '1m'
        })
      });

      if (response.ok) {
        const signal = await response.json();
        setSignals(prev => [signal, ...prev.slice(0, 49)]); // Keep last 50 signals
        setLastSignalUpdate(new Date().toLocaleTimeString());
        addActivityLog('signal_generated', `🎯 New ${signal.direction} signal for ${signal.symbol}`, signal);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalSignals: prev.totalSignals + 1,
          liveSignals: prev.liveSignals + 1,
          analysisCount: prev.analysisCount + 1
        }));
      }
    } catch (error) {
      console.error('Error generating signal:', error);
      addActivityLog('error', `❌ Signal generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [isSignalGenerationActive, addActivityLog]);

  // Start continuous signal generation
  const startSignalGeneration = useCallback(() => {
    if (isSignalGenerationActive) return;
    
    setIsSignalGenerationActive(true);
    addActivityLog('system', '🚀 Starting continuous signal generation...');
    
    // Start signal generation every 30 seconds
    signalIntervalRef.current = setInterval(generateSignal, 30000);
    
    // Start heartbeat every 5 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      setSystemHeartbeat(prev => prev + 1);
    }, 5000);
    
    // Initial signal generation
    generateSignal();
  }, [isSignalGenerationActive, generateSignal, addActivityLog]);

  // Stop signal generation
  const stopSignalGeneration = useCallback(() => {
    setIsSignalGenerationActive(false);
    addActivityLog('system', '⏹️ Signal generation stopped by user');
    
    if (signalIntervalRef.current) {
      clearInterval(signalIntervalRef.current);
      signalIntervalRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, [addActivityLog]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (signalIntervalRef.current) clearInterval(signalIntervalRef.current);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // Auto-start signal generation on component mount
  useEffect(() => {
    setIsLoading(false);
    addActivityLog('system', '🚀 Futures Signals Page initialized');
    startSignalGeneration();
  }, [startSignalGeneration, addActivityLog]);

  const getSignalIcon = (direction: 'LONG' | 'SHORT') => {
    return direction === 'LONG' ? 
      <ArrowUp className="w-4 h-4 text-green-400" /> : 
      <ArrowDown className="w-4 h-4 text-red-400" />;
  };

  const getSignalColor = (direction: 'LONG' | 'SHORT') => {
    return direction === 'LONG' ? 'text-green-400' : 'text-red-400';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-400';
    if (confidence >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-10 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
        </div>
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Signal className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Futures Bot Signals
                </h1>
                <p className="text-gray-300 text-lg">Live signals from futures trading bot</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isSignalGenerationActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-300">
                  {isSignalGenerationActive ? 'Active' : 'Stopped'}
                </span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={startSignalGeneration}
                  disabled={isSignalGenerationActive}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Signals</span>
                </button>
                
                <button
                  onClick={stopSignalGeneration}
                  disabled={!isSignalGenerationActive}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  <Pause className="w-5 h-5" />
                  <span>Stop Signals</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-800/50 to-purple-600/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Total Signals</p>
                <p className="text-3xl font-bold text-white">{stats.totalSignals}</p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-800/50 to-blue-600/50 backdrop-blur-sm rounded-xl p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Live Signals</p>
                <p className="text-3xl font-bold text-white">{stats.liveSignals}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-800/50 to-green-600/50 backdrop-blur-sm rounded-xl p-6 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300 text-sm font-medium">Active Signals</p>
                <p className="text-3xl font-bold text-white">{stats.activeSignals}</p>
              </div>
              <Cpu className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-800/50 to-orange-600/50 backdrop-blur-sm rounded-xl p-6 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm font-medium">System Heartbeat</p>
                <p className="text-3xl font-bold text-white">{systemHeartbeat}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Signals */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <span>Live Signals</span>
              </h2>
              <div className="text-sm text-gray-400">
                Last update: {lastSignalUpdate}
              </div>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {signals.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Signal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No signals generated yet</p>
                  <p className="text-sm">Signals will start automatically</p>
                </div>
              ) : (
                signals.map((signal) => (
                  <div
                    key={signal.id}
                    className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 rounded-lg p-4 border border-slate-500/20 hover:border-slate-400/40 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getSignalIcon(signal.direction)}
                        <div>
                          <h3 className="font-semibold text-white">{signal.symbol}</h3>
                          <p className="text-sm text-gray-400">{signal.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getSignalColor(signal.direction)}`}>
                          {signal.direction}
                        </div>
                        <div className={`text-sm ${getConfidenceColor(signal.confidence)}`}>
                          {signal.confidence}% confidence
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Entry</p>
                        <p className="font-semibold text-white">${signal.entry.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Stop Loss</p>
                        <p className="font-semibold text-red-400">${signal.stopLoss.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Take Profit</p>
                        <p className="font-semibold text-green-400">${signal.takeProfit.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-slate-600/50">
                      <p className="text-sm text-gray-300">{signal.analysis}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(signal.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                          {signal.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Database className="w-6 h-6 text-purple-400" />
                <span>Activity Log</span>
              </h2>
              <div className="text-sm text-gray-400">
                Real-time monitoring
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activityLog.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No activity yet</p>
                  <p className="text-sm">System is initializing...</p>
                </div>
              ) : (
                activityLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/20"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {log.type === 'signal_generated' && <Target className="w-4 h-4 text-green-400" />}
                      {log.type === 'price_update' && <RefreshCw className="w-4 h-4 text-blue-400" />}
                      {log.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      {log.type === 'system' && <Cpu className="w-4 h-4 text-purple-400" />}
                      {log.type === 'analysis' && <Brain className="w-4 h-4 text-yellow-400" />}
                      {log.type === 'info' && <Eye className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{log.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p>Futures Bot Signals • Powered by Advanced AI • Real-time Signal Processing</p>
        </div>
      </div>
    </div>
  );
};

export default FuturesSignalsPage;
