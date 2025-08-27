import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface PriceData {
  pair: string;
  price: string;
  change: string;
  changePercent: string;
  timestamp: string;
  provider: string;
}

interface SMCSignal {
  pair: string;
  signal_type: 'buy' | 'sell';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  timestamp: string;
  confidence: number;
  structure_type: 'BOS' | 'CHoCH' | 'OrderBlock';
}

const LivePriceFeed: React.FC = () => {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [signals, setSignals] = useState<SMCSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Forex pairs to monitor
  const forexPairs = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD',
    'USD/CAD', 'NZD/USD', 'EUR/JPY', 'GBP/JPY', 'EUR/GBP',
    'EUR/AUD', 'GBP/AUD', 'AUD/CAD', 'CAD/JPY', 'CHF/JPY',
    'AUD/CHF', 'CAD/CHF', 'EUR/CHF', 'GBP/CHF', 'NZD/CAD',
    'NZD/JPY', 'AUD/NZD', 'EUR/CAD', 'EUR/NZD', 'GBP/CAD',
    'GBP/NZD', 'AUD/JPY'
  ];

  // SINGLE SOURCE: Fetch prices from backend only
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const newPrices: PriceData[] = [];
      
      // Fetch each pair from backend server
      for (const pair of forexPairs) {
        try {
          const response = await fetch(`http://localhost:5000/api/yfinance/price/${encodeURIComponent(pair)}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.price && !isNaN(parseFloat(data.price))) {
              // Calculate change (mock for now - in real implementation, you'd store previous prices)
              const currentPrice = parseFloat(data.price);
              const change = (Math.random() - 0.5) * 0.01; // Mock change
              const changePercent = ((change / currentPrice) * 100).toFixed(4);
              
              newPrices.push({
                pair,
                price: data.price,
                change: change.toFixed(5),
                changePercent: changePercent,
                timestamp: new Date().toISOString(),
                provider: 'Backend Server'
              });
            }
          }
          
          // Small delay to avoid overwhelming backend
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Failed to fetch ${pair}:`, error);
        }
      }
      
      setPrices(newPrices);
      setLastUpdate(new Date());
      
    } catch (error) {
      setError('Failed to fetch prices from backend server');
      console.error('Price fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [forexPairs]);

  // Generate SMC signals based on Pine Script logic
  const generateSMCSignals = useCallback(async () => {
    try {
      const newSignals: SMCSignal[] = [];
      
      // Generate signals for major pairs
      const majorPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD'];
      
      for (const pair of majorPairs) {
        try {
          // Get historical data from backend
          const response = await fetch(`http://localhost:5000/api/yfinance/historical/${encodeURIComponent(pair)}/1m`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.history && data.history.length >= 50) {
              const history = data.history;
              
              // SMC Logic based on Pine Script
              for (let i = 20; i < history.length - 1; i++) {
                const current = history[i];
                const previous = history[i - 1];
                
                if (!current || !previous) continue;
                
                const currentClose = parseFloat(current.close);
                const previousClose = parseFloat(previous.close);
                const currentHigh = parseFloat(current.high);
                const currentLow = parseFloat(current.low);
                const previousHigh = parseFloat(previous.high);
                const previousLow = parseFloat(previous.low);
                
                // BOS (Break of Structure) Detection
                if (currentClose > previousHigh && previousClose < previousHigh) {
                  // Bullish BOS
                  const stopLoss = Math.min(previousLow, currentLow) - (currentHigh - currentLow) * 0.5;
                  const risk = currentClose - stopLoss;
                  const takeProfit = currentClose + (risk * 2.0); // 2:1 R:R ratio
                  
                  newSignals.push({
                    pair,
                    signal_type: 'buy',
                    entry_price: currentClose,
                    stop_loss: stopLoss,
                    take_profit: takeProfit,
                    timestamp: current.time,
                    confidence: 0.8,
                    structure_type: 'BOS'
                  });
                  break; // Only one signal per pair
                }
                
                if (currentClose < previousLow && previousClose > previousLow) {
                  // Bearish BOS
                  const stopLoss = Math.max(previousHigh, currentHigh) + (currentHigh - currentLow) * 0.5;
                  const risk = stopLoss - currentClose;
                  const takeProfit = currentClose - (risk * 2.0); // 2:1 R:R ratio
                  
                  newSignals.push({
                    pair,
                    signal_type: 'sell',
                    entry_price: currentClose,
                    stop_loss: stopLoss,
                    take_profit: takeProfit,
                    timestamp: current.time,
                    confidence: 0.8,
                    structure_type: 'BOS'
                  });
                  break; // Only one signal per pair
                }
              }
            }
          }
          
          // Small delay to avoid overwhelming backend
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`Failed to generate signals for ${pair}:`, error);
        }
      }
      
      setSignals(newSignals.slice(-10)); // Keep last 10 signals
      
    } catch (error) {
      console.error('SMC signal generation error:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPrices();
    generateSMCSignals();
  }, [fetchPrices, generateSMCSignals]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrices();
      generateSMCSignals();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPrices, generateSMCSignals]);

  const handleRefresh = () => {
    fetchPrices();
    generateSMCSignals();
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    return num.toFixed(5);
  };

  const getChangeColor = (change: string) => {
    const num = parseFloat(change);
    return num >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getSignalColor = (signalType: string) => {
    return signalType === 'buy' ? 'bg-green-500' : 'bg-red-500';
  };

  const getStructureColor = (structureType: string) => {
    switch (structureType) {
      case 'BOS': return 'bg-blue-500';
      case 'CHoCH': return 'bg-purple-500';
      case 'OrderBlock': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Forex Data & SMC Signals</h2>
          <p className="text-gray-400">Real-time prices from backend server with Smart Money Concepts analysis</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            {lastUpdate && `Last update: ${lastUpdate.toLocaleTimeString()}`}
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* SMC Trading Signals */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span>SMC Trading Signals</span>
            <span className="ml-2 bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
              {signals.length} Active
            </span>
          </h3>
        </div>
        <div className="p-6">
          {signals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {signals.map((signal, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-white">{signal.pair}</span>
                    <span className={`px-2 py-1 rounded text-white text-sm ${getSignalColor(signal.signal_type)}`}>
                      {signal.signal_type.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry:</span>
                      <span className="text-white font-mono">{signal.entry_price.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stop Loss:</span>
                      <span className="text-red-400 font-mono">{signal.stop_loss.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Take Profit:</span>
                      <span className="text-green-400 font-mono">{signal.take_profit.toFixed(5)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Structure:</span>
                      <span className={`px-2 py-1 rounded text-white text-xs ${getStructureColor(signal.structure_type)}`}>
                        {signal.structure_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confidence:</span>
                      <span className="text-white">{(signal.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    {new Date(signal.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <TrendingDown className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No SMC signals detected yet</p>
              <p className="text-sm">Signals will appear when structure breaks are identified</p>
            </div>
          )}
        </div>
      </div>

      {/* Live Price Feed */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Live Price Feed</span>
            <span className="ml-2 bg-gray-700 text-gray-300 px-2 py-1 rounded text-sm">
              {prices.length} Pairs
            </span>
          </h3>
        </div>
        <div className="p-6">
          {prices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {prices.map((price, index) => (
                <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{price.pair}</span>
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {price.provider}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-white mb-2">
                    {formatPrice(price.price)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${getChangeColor(price.change)} font-mono`}>
                      {parseFloat(price.change) >= 0 ? '+' : ''}{price.change}
                    </span>
                    <span className={`${getChangeColor(price.changePercent)} font-mono`}>
                      {parseFloat(price.changePercent) >= 0 ? '+' : ''}{price.changePercent}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(price.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin opacity-50" />
              <p>Loading prices from backend server...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePriceFeed;
