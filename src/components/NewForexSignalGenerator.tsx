import React, { useState, useEffect, useRef } from 'react';
import { Bot, Zap, TrendingUp, TrendingDown, Activity, Globe, Settings, Play, Pause, RefreshCw } from 'lucide-react';

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

const NewForexSignalGenerator: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
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

  const symbols = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/AUD', 'GBP/AUD', 'AUD/CAD', 'CAD/JPY',
    'CHF/JPY', 'AUD/CHF', 'CAD/CHF', 'EUR/CHF', 'GBP/CHF', 'NZD/CAD', 'NZD/JPY', 'AUD/NZD'
  ];

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-99), logEntry]);
  };

  const analyzeSymbolWithBackend = async (symbol: string, timeframe: string) => {
    addLog(`🔍 Analyzing ${symbol} on ${timeframe}...`, 'info');
    if (!timeframes.includes(timeframe)) {
      addLog(`❌ Invalid timeframe "${timeframe}" for Forex analysis. Skipping.`, 'error');
      return null;
    }
    try {
      const response = await fetch('https://yfinance-proxy.onrender.com/api/yfinance/analyze-symbol', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, timeframe }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || `HTTP ${response.status}`);
      }
      
      return result;

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
          <h2 className="text-2xl font-bold">New Forex Signal Generator</h2>
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

export default NewForexSignalGenerator;
