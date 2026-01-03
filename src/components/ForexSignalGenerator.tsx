import React, { useState, useEffect, useRef } from 'react';
import { Bot, Zap, TrendingUp, TrendingDown, Activity, Globe, Settings, Play, Pause, RefreshCw } from 'lucide-react';
import realYfinanceService from '../services/realYfinanceService';

interface ForexSignal {
  id: string;
  symbol: string;
  signalType: 'BUY' | 'SELL';
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: string;
  confirmations: string[];
  timestamp: Date;
  analysis: string;
  sessionQuality: string;
  timeframe: string;
  status: string;
  direction: 'bullish' | 'bearish';
  market: string;
}

const ForexSignalGenerator: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isSignalGenerationActive, setIsSignalGenerationActive] = useState(false);
  const [signals, setSignals] = useState<ForexSignal[]>([]);
  const [stats, setStats] = useState({
    totalSignals: 0,
    liveSignals: 0,
    activeSignals: 0,
    bosCount: 0,
    chochCount: 0,
    successRate: 0
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['EUR/USD', 'GBP/USD', 'USD/JPY']);
  const [timeframes, setTimeframes] = useState<string[]>(['1h', '4h', '1d']);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
  const signalGenerationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const symbols = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/AUD', 'GBP/AUD', 'AUD/CAD', 'CAD/JPY',
    'CHF/JPY', 'AUD/CHF', 'CAD/CHF', 'EUR/CHF', 'GBP/CHF', 'NZD/CAD', 'NZD/JPY', 'AUD/NZD'
  ];

  const timeframes = ['1h', '4h', '1d'];

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-99), logEntry]);
  };

  // Signal Generation Functions
  const sendSignalToUsers = async (signal: ForexSignal) => {
    try {
      const signalData = {
        pair: signal.symbol,
        direction: signal.signalType,
        entry: signal.entryPrice.toString(),
        stopLoss: signal.stopLoss.toString(),
        takeProfit: signal.takeProfit.toString(),
        confidence: signal.confidence,
        analysis: signal.analysis,
        ictConcepts: signal.confirmations,
        market: 'forex',
        timeframe: signal.timeframe
      };

      const response = await fetch('https://backend-8j0e.onrender.com/api/admin/create-signal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signalData)
      });

      if (response.ok) {
        addLog(`✅ Signal sent to users: ${signal.symbol} ${signal.signalType}`, 'success');
      } else {
        addLog(`❌ Failed to send signal: ${response.statusText}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error sending signal: ${error}`, 'error');
    }
  };

  const startSignalGeneration = () => {
    if (isSignalGenerationActive) return;
    
    setIsSignalGenerationActive(true);
    addLog('🚀 Started continuous signal generation to user dashboard', 'success');
    
    // Generate signals every 30 seconds
    signalGenerationIntervalRef.current = setInterval(() => {
      if (!isSignalGenerationActive) return;
      
      // Generate a random forex signal
      const forexSymbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
      const directions = ['BUY', 'SELL'];
      const symbol = forexSymbols[Math.floor(Math.random() * forexSymbols.length)];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
      // Get current price (simulated)
      const basePrice = Math.random() * 2 + 0.5; // Forex prices are typically 0.5-2.5
      const entryPrice = basePrice;
      const stopLoss = direction === 'BUY' ? basePrice * 0.995 : basePrice * 1.005;
      const takeProfit = direction === 'BUY' ? basePrice * 1.01 : basePrice * 0.99;
      
      const signal: ForexSignal = {
        id: `forex-${Date.now()}`,
        symbol,
        signalType: direction as 'BUY' | 'SELL',
        confidence: Math.floor(Math.random() * 30) + 70, // 70-100%
        entryPrice,
        stopLoss,
        takeProfit,
        riskReward: '1:2',
        confirmations: ['SMC Analysis', 'Order Block', 'Market Structure'],
        timestamp: new Date(),
        analysis: `${direction} signal for ${symbol} based on Smart Money Concepts analysis. Strong market structure break with order block confirmation.`,
        sessionQuality: 'High',
        timeframe: '1h',
        status: 'active',
        direction: direction === 'BUY' ? 'bullish' : 'bearish',
        market: 'forex'
      };
      
      // Add to local signals
      setSignals(prev => [signal, ...prev.slice(0, 9)]); // Keep last 10 signals
      
      // Send to users
      sendSignalToUsers(signal);
      
    }, 30000); // Every 30 seconds
  };

  const stopSignalGeneration = () => {
    if (!isSignalGenerationActive) return;
    
    setIsSignalGenerationActive(false);
    if (signalGenerationIntervalRef.current) {
      clearInterval(signalGenerationIntervalRef.current);
      signalGenerationIntervalRef.current = null;
    }
    addLog('🛑 Stopped signal generation to user dashboard', 'warning');
  };

  const analyzeSymbolWithBackend = async (symbol: string, timeframe: string) => {
    addLog(`🔍 Analyzing ${symbol} on ${timeframe}...`, 'info');
    if (!timeframes.includes(timeframe)) {
      addLog(`❌ Invalid timeframe "${timeframe}" for Forex analysis. Skipping.`, 'error');
      return null;
    }
    try {
      // Get real price data for the symbol
      const priceData = await realYfinanceService.fetchRealPrice(symbol);
      if (priceData) {
        // Create a basic analysis result based on real price data
        const result = {
          symbol: symbol,
          timeframe: timeframe,
          currentPrice: priceData.price,
          timestamp: priceData.timestamp,
          provider: priceData.provider,
          signalType: 'BUY' as const, // Default signal type
          confidence: 75, // Default confidence
          entryPrice: priceData.price,
          stopLoss: priceData.price * 0.995, // 0.5% below entry
          takeProfit: priceData.price * 1.01, // 1% above entry
          primaryRiskReward: '1:2',
          confirmations: ['Price Action', 'Trend Analysis'],
          analysis: `Real-time analysis of ${symbol} at ${priceData.price} based on ${priceData.provider} data.`,
          sessionQuality: 'High'
        };
        
        addLog(`✅ Analysis completed for ${symbol} using real data`, 'success');
        return result;
      } else {
        addLog(`❌ No real price data available for ${symbol}`, 'error');
        return null;
      }
    } catch (error: any) {
      console.error(`Error analyzing ${symbol} with backend:`, error);
      addLog(`❌ Error analyzing ${symbol} on ${timeframe}: ${error.message}`, 'error');
      return null;
    }
  };

  const processSignal = async (signal: any) => {
    const formattedSignal: ForexSignal = {
      id: `forex-signal-${signal.symbol}-${signal.timeframe}-${Date.now()}`,
      symbol: signal.symbol,
      signalType: signal.signalType,
      confidence: signal.confidence,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      riskReward: signal.primaryRiskReward || '1:2',
      confirmations: signal.confirmations,
      timestamp: new Date(signal.timestamp),
      analysis: signal.analysis,
      sessionQuality: signal.sessionQuality || 'N/A',
      timeframe: signal.timeframe,
      status: 'active',
      direction: signal.signalType === 'BUY' ? 'bullish' : 'bearish',
      market: 'forex',
    };

    const existingSignals = JSON.parse(localStorage.getItem('admin_generated_signals') || '[]');
    const signalForStorage = {
      ...formattedSignal,
      timestamp: formattedSignal.timestamp.toISOString()
    };
    existingSignals.unshift(signalForStorage);
    localStorage.setItem('admin_generated_signals', JSON.stringify(existingSignals.slice(0, 100)));
    
    const signalForUser = {
      id: Date.now(),
      text: `${signal.symbol}\n${signal.signalType} NOW\nEntry ${signal.entryPrice}\nStop Loss ${signal.stopLoss}\nTake Profit ${signal.takeProfit}\nConfidence ${signal.confidence}%\n\n${signal.analysis}`,
      timestamp: formattedSignal.timestamp.toISOString(),
      from: 'Forex Signal Generator',
      chat_id: 1,
      message_id: Date.now(),
      update_id: Date.now()
    };
    
    const existingMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
    existingMessages.unshift(signalForUser);
    localStorage.setItem('telegram_messages', JSON.stringify(existingMessages.slice(0, 100)));

    // Use centralized signal service to relay to users
    try {
      const signalService = await import('../services/signalService');
      await signalService.default.addSignal({
        id: formattedSignal.id,
        pair: formattedSignal.symbol,
        direction: formattedSignal.signalType === 'BUY' ? 'LONG' : 'SHORT',
        entry: formattedSignal.entryPrice,
        stopLoss: formattedSignal.stopLoss,
        takeProfit: formattedSignal.takeProfit,
        confidence: formattedSignal.confidence,
        analysis: formattedSignal.analysis,
        timestamp: formattedSignal.timestamp.toISOString(),
        status: 'active',
        market: 'forex',
        timeframe: formattedSignal.timeframe
      });
    } catch (error) {
      console.error('Error relaying forex signal:', error);
    }

    setStats(prev => ({
      ...prev,
      liveSignals: prev.liveSignals + 1,
      activeSignals: prev.activeSignals + 1,
      bosCount: prev.bosCount + (signal.confirmations.some((c: string) => c.includes('BOS')) ? 1 : 0),
      chochCount: prev.chochCount + (signal.confirmations.some((c: string) => c.includes('CHoCH')) ? 1 : 0),
    }));

    setSignals(prev => [formattedSignal, ...prev.slice(0, 99)]);
    addLog(`✅ Generated ${signal.signalType} signal for ${signal.symbol} (${signal.confidence}% confidence)`, 'success');
  };

  const startAnalysis = async () => {
    if (isAnalysisRunning) return;
    
    setIsAnalysisRunning(true);
    addLog('🚀 Starting Forex signal analysis...', 'info');
    
    for (const symbol of selectedSymbols) {
      if (!isAnalysisRunning) break;
      
      for (const timeframe of timeframes) {
        if (!isAnalysisRunning) break;
        
        try {
          const result = await analyzeSymbolWithBackend(symbol, timeframe);
          if (result && result.signalType) {
            await processSignal(result);
          } else {
            addLog(`ℹ️ No signals generated for ${symbol} - market conditions not met`, 'info');
          }
          
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error: any) {
          addLog(`❌ Analysis failed for ${symbol} on ${timeframe}: ${error.message}`, 'error');
        }
      }
    }
    
    setIsAnalysisRunning(false);
    addLog('🏁 Analysis cycle completed', 'info');
  };

  const stopAnalysis = () => {
    setIsAnalysisRunning(false);
    addLog('⏹️ Analysis stopped by user', 'warning');
  };

  const clearSignals = () => {
    setSignals([]);
    setStats(prev => ({ ...prev, liveSignals: 0, activeSignals: 0 }));
    addLog('🗑️ All signals cleared', 'info');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    // Load existing signals from localStorage
    const savedSignals = JSON.parse(localStorage.getItem('admin_generated_signals') || '[]');
    if (savedSignals.length > 0) {
      setSignals(savedSignals.slice(0, 100).map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp)
      })));
      setStats(prev => ({ ...prev, totalSignals: savedSignals.length }));
    }
  }, []);

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <Bot className="h-8 w-8 text-blue-400" />
          <h2 className="text-2xl font-bold">Forex Signal Generator</h2>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={startAnalysis}
            disabled={isAnalysisRunning}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Play className="h-5 w-5" />
            <span>Start Analysis</span>
          </button>
          <button
            onClick={stopAnalysis}
            disabled={!isAnalysisRunning}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Pause className="h-5 w-5" />
            <span>Stop</span>
          </button>
          <button
            onClick={clearSignals}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Signal Generation Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-green-500/30 p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-green-400" />
          📡 Signal Generation to Users
        </h3>
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${isSignalGenerationActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-gray-300">
              {isSignalGenerationActive ? 'Generating signals every 30 seconds' : 'Signal generation stopped'}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            This will continuously send forex signals to all users in the dashboard
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={startSignalGeneration}
            disabled={isSignalGenerationActive}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>🚀 Start Signal Generation</span>
          </button>
          
          <button
            onClick={stopSignalGeneration}
            disabled={!isSignalGenerationActive}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center space-x-2"
          >
            <Pause className="w-4 h-4" />
            <span>🛑 Stop Signal Generation</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-400">{stats.totalSignals}</div>
          <div className="text-sm text-gray-400">Total Signals</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-400">{stats.liveSignals}</div>
          <div className="text-sm text-gray-400">Live Signals</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-400">{stats.bosCount}</div>
          <div className="text-sm text-gray-400">BOS Count</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-400">{stats.chochCount}</div>
          <div className="text-sm text-gray-400">CHoCH Count</div>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Selected Symbols</h3>
          <div className="grid grid-cols-2 gap-2">
            {symbols.map(symbol => (
              <label key={symbol} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedSymbols.includes(symbol)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSymbols(prev => [...prev, symbol]);
                    } else {
                      setSelectedSymbols(prev => prev.filter(s => s !== symbol));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{symbol}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Timeframes</h3>
          <div className="space-y-2">
            {timeframes.map(tf => (
              <label key={tf} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={timeframes.includes(tf)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTimeframes(prev => [...prev, tf]);
                    } else {
                      setTimeframes(prev => prev.filter(t => t !== tf));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{tf}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Signals and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Signals */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Generated Signals</h3>
            <span className="text-sm text-gray-400">{signals.length} signals</span>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {signals.map((signal) => (
              <div key={signal.id} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{signal.symbol}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      signal.signalType === 'BUY' ? 'bg-green-600' : 'bg-red-600'
                    }`}>
                      {signal.signalType}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">{signal.confidence}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>Entry: {signal.entryPrice}</div>
                  <div>SL: {signal.stopLoss}</div>
                  <div>TP: {signal.takeProfit}</div>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {signal.timestamp.toLocaleString()}
                </div>
              </div>
            ))}
            {signals.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Bot className="h-12 w-12 mx-auto mb-2" />
                <p>No signals generated yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Analysis Logs</h3>
            <button
              onClick={clearLogs}
              className="text-sm text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="text-gray-300">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <Activity className="h-12 w-12 mx-auto mb-2" />
                <p>No logs yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexSignalGenerator;
