import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Copy, Send, RefreshCw } from 'lucide-react';
import realYfinanceService from '../services/realYfinanceService';

interface Signal {
  id: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  targets: {
    target1: number;
    target2: number;
    target3: number;
  };
  timeframe: string;
  timestamp: string;
}

const ChartAnalysis: React.FC = () => {
  const [asset, setAsset] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  const assets = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/AUD', 'GBP/AUD', 'AUD/CAD', 'CAD/JPY',
    'CHF/JPY', 'AUD/CHF', 'CAD/CHF', 'EUR/CHF', 'GBP/CHF', 'NZD/CAD', 'NZD/JPY', 'AUD/NZD',
    'XAU/USD', 'XAG/USD', 'USOIL', 'BTC/USD', 'ETH/USD'
  ];

  const timeframes = ['5m', '15m', '30m', '1h', '4h', '1d'];

  const fetchSignal = useCallback(async (asset: string, timeframe: string) => {
    try {
      // Get real price data for the asset
      const priceData = await realYfinanceService.fetchRealPrice(asset);
      if (priceData) {
        // Create a basic signal based on real price data
        const signal = {
          id: Date.now().toString(),
          symbol: asset,
          direction: 'LONG' as const, // Default direction
          entry: priceData.price,
          stopLoss: priceData.price * 0.995, // 0.5% below entry
          targets: {
            target1: priceData.price * 1.01, // 1% above entry
            target2: priceData.price * 1.02, // 2% above entry
            target3: priceData.price * 1.03, // 3% above entry
          },
          timeframe: timeframe,
          timestamp: priceData.timestamp
        };
        return signal;
      }
      return null;
    } catch (error) {
      console.error('Error fetching signal:', error);
      return null;
    }
  }, []);

  const analyzeAsset = async () => {
    if (!asset || !timeframe) {
      setError('Please select both asset and timeframe');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysisResult(null);

    try {
      // Get real price data for the asset
      const priceData = await realYfinanceService.fetchRealPrice(asset);
      if (priceData) {
        // Create analysis result based on real price data
        const analysis = {
          symbol: asset,
          currentPrice: priceData.price,
          timeframe: timeframe,
          timestamp: priceData.timestamp,
          provider: priceData.provider,
          signal: {
            id: Date.now().toString(),
            symbol: asset,
            direction: 'LONG' as const, // Default direction
            entry: priceData.price,
            stopLoss: priceData.price * 0.995, // 0.5% below entry
            targets: {
              target1: priceData.price * 1.01, // 1% above entry
              target2: priceData.price * 1.02, // 2% above entry
              target3: priceData.price * 1.03, // 3% above entry
            },
            timeframe: timeframe,
            timestamp: priceData.timestamp
          }
        };
        setAnalysisResult(analysis);
        setError('');
      } else {
        setError('No real price data available for analysis');
      }
    } catch (error: any) {
      setError(`Analysis failed: ${error.message}`);
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (signal: Signal) => {
    const tradeDetails = `\n      Symbol: ${signal.symbol}\n      Direction: ${signal.direction}\n      Entry: ${signal.entry}\n      Stop Loss: ${signal.stopLoss}\n      Take Profit: ${signal.targets.target1}\n    `;
    navigator.clipboard.writeText(tradeDetails.trim());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSend = (signal: Signal) => {
    const existingSignals = JSON.parse(localStorage.getItem('admin_signals') || '[]');
    const newSignalData = {
      ...signal,
      timestamp: new Date().toISOString()
    };
    existingSignals.unshift(newSignalData);
    localStorage.setItem('admin_signals', JSON.stringify(existingSignals.slice(0, 100)));
    
    // Also add to telegram messages for display
    const telegramMessage = {
      id: Date.now(),
      text: `${signal.symbol}\n${signal.direction} NOW\nEntry ${signal.entry}\nStop Loss ${signal.stopLoss}\nTake Profit ${signal.targets.target1}`,
      timestamp: new Date().toISOString(),
      from: 'Chart Analysis',
      chat_id: 1,
      message_id: Date.now(),
      update_id: Date.now()
    };
    
    const existingMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
    existingMessages.unshift(telegramMessage);
    localStorage.setItem('telegram_messages', JSON.stringify(existingMessages.slice(0, 100)));
    
    alert('Signal sent to admin panel!');
  };

  useEffect(() => {
    // Auto-fetch signals for selected asset/timeframe
    if (asset && timeframe) {
      fetchSignal(asset, timeframe);
    }
  }, [asset, timeframe, fetchSignal]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chart Analysis & Signals</h2>
      
      {/* Asset Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Asset</label>
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Asset</option>
            {assets.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Timeframe</option>
            {timeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Analysis Button */}
      <div className="mb-6">
        <button
          onClick={analyzeAsset}
          disabled={!asset || !timeframe || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5" />
              <span>Analyze Asset</span>
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Analysis Result</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Symbol:</span> {analysisResult.symbol}
            </div>
            <div>
              <span className="font-medium">Direction:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                analysisResult.direction === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {analysisResult.direction}
              </span>
            </div>
            <div>
              <span className="font-medium">Entry:</span> {analysisResult.entry}
            </div>
            <div>
              <span className="font-medium">Stop Loss:</span> {analysisResult.stopLoss}
            </div>
            <div>
              <span className="font-medium">Take Profit 1:</span> {analysisResult.targets?.target1}
            </div>
            <div>
              <span className="font-medium">Take Profit 2:</span> {analysisResult.targets?.target2}
            </div>
          </div>
        </div>
      )}

      {/* Signals List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Signals</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{signal.symbol}</h4>
                  <p className="text-sm text-gray-600">{signal.timeframe} • {new Date(signal.timestamp).toLocaleString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  signal.direction === 'LONG' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {signal.direction}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Entry:</span>
                  <p className="text-gray-900">{signal.entry}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Stop Loss:</span>
                  <p className="text-gray-900">{signal.stopLoss}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Take Profit:</span>
                  <p className="text-gray-900">{signal.targets.target1}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleCopy(signal)}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={() => handleSend(signal)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ))}
          
          {signals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No signals generated yet</p>
              <p className="text-sm">Select an asset and timeframe to start analysis</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartAnalysis;