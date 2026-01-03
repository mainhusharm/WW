import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import YahooFinanceService from './YahooFinanceService';

interface PriceData {
  price: number;
  provider: string;
  timestamp: string;
  error?: string;
}

interface HistoricalData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface SignalData {
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  confidence: number;
  timestamp: string;
  status: 'ACTIVE' | 'CLOSED' | 'PENDING';
}

const EnhancedForexDashboard: React.FC = () => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [historical, setHistorical] = useState<Record<string, HistoricalData[]>>({});
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [activeTab, setActiveTab] = useState('signals');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Major forex pairs and commodities
  const symbols = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
    'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'XAG/USD'
  ];

  const handleDataUpdate = (data: { prices: Record<string, PriceData>; historical: Record<string, HistoricalData[]> }) => {
    setPrices(data.prices);
    setHistorical(data.historical);
    
    // Generate signals based on new data
    generateSignals(data.prices, data.historical);
  };

  const generateSignals = (priceData: Record<string, PriceData>, historicalData: Record<string, HistoricalData[]>) => {
    setIsAnalyzing(true);
    
    const newSignals: SignalData[] = [];
    
    Object.entries(priceData).forEach(([symbol, price]) => {
      if (price.error || !historicalData[symbol] || historicalData[symbol].length === 0) {
        return;
      }

      const hist = historicalData[symbol];
      const currentPrice = price.price;
      
      // Simple signal generation based on price action
      if (hist.length >= 5) {
        const recentBars = hist.slice(-5);
        const trend = analyzeTrend(recentBars);
        const volatility = calculateVolatility(recentBars);
        
        if (trend.strength > 0.6 && volatility > 0.001) {
          const signal: SignalData = {
            symbol,
            direction: trend.direction > 0 ? 'BUY' : 'SELL',
            entry: currentPrice,
            stopLoss: trend.direction > 0 ? 
              currentPrice - (volatility * 2) : 
              currentPrice + (volatility * 2),
            takeProfit: trend.direction > 0 ? 
              currentPrice + (volatility * 3) : 
              currentPrice - (volatility * 3),
            confidence: Math.round(trend.strength * 100),
            timestamp: new Date().toISOString(),
            status: 'ACTIVE'
          };
          
          newSignals.push(signal);
        }
      }
    });
    
    setSignals(newSignals);
    setIsAnalyzing(false);
  };

  const analyzeTrend = (bars: HistoricalData[]) => {
    if (bars.length < 3) return { direction: 0, strength: 0 };
    
    let upMoves = 0;
    let downMoves = 0;
    
    for (let i = 1; i < bars.length; i++) {
      if (bars[i].close > bars[i-1].close) upMoves++;
      else if (bars[i].close < bars[i-1].close) downMoves++;
    }
    
    const totalMoves = upMoves + downMoves;
    if (totalMoves === 0) return { direction: 0, strength: 0 };
    
    const direction = upMoves > downMoves ? 1 : -1;
    const strength = Math.abs(upMoves - downMoves) / totalMoves;
    
    return { direction, strength };
  };

  const calculateVolatility = (bars: HistoricalData[]) => {
    if (bars.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < bars.length; i++) {
      const return_val = (bars[i].close - bars[i-1].close) / bars[i-1].close;
      returns.push(return_val);
    }
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  };

  const renderSignalsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Activity className="mr-2 text-green-400" />
          Live Trading Signals
        </h3>
        <div className="flex items-center space-x-2">
          {isAnalyzing && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
          )}
          <span className="text-sm text-gray-400">
            {signals.length} active signals
          </span>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">No trading signals available</p>
          <p className="text-gray-500 text-sm mt-2">
            Signals will appear when market conditions meet our criteria
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal, index) => (
            <div key={index} className={`bg-gray-800 rounded-lg p-4 border-l-4 ${
              signal.direction === 'BUY' ? 'border-green-500' : 'border-red-500'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`font-bold ${
                      signal.direction === 'BUY' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {signal.direction}
                    </span>
                    <span className="text-white font-semibold">{signal.symbol}</span>
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      {signal.confidence}% confidence
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Entry</p>
                      <p className="text-white font-semibold">{signal.entry.toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Stop Loss</p>
                      <p className="text-red-400">{signal.stopLoss.toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Take Profit</p>
                      <p className="text-green-400">{signal.takeProfit.toFixed(5)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Risk/Reward</p>
                      <p className="text-white">1:1.5</p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-2">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </p>
                  <button className={`px-4 py-2 rounded text-white text-sm ${
                    signal.direction === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}>
                    Take Signal
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPricesTab = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center">
        <TrendingUp className="mr-2 text-blue-400" />
        Live Market Prices
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map(symbol => {
          const priceData = prices[symbol];
          const hasError = priceData?.error;
          const hasHistorical = historical[symbol]?.length > 0;
          
          return (
            <div key={symbol} className={`bg-gray-800 rounded-lg p-4 border ${
              hasError ? 'border-red-600/50' : 'border-gray-700'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-semibold">{symbol}</span>
                <div className="flex items-center space-x-2">
                  {hasHistorical ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-xs ${
                    priceData?.provider === 'yfinance' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {priceData?.provider || 'N/A'}
                  </span>
                </div>
              </div>
              
              {hasError ? (
                <div className="text-red-400 text-sm">
                  <p>❌ {priceData.error}</p>
                </div>
              ) : priceData ? (
                <div>
                  <p className="text-2xl font-bold text-green-400 mb-1">
                    {priceData.price.toFixed(5)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Updated: {new Date(priceData.timestamp).toLocaleTimeString()}
                  </p>
                  {hasHistorical && (
                    <p className="text-xs text-green-400 mt-1">
                      ✅ Historical data: {historical[symbol].length} bars
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">
                  <div className="animate-pulse">Loading...</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Enhanced Forex Dashboard</h1>
          <p className="text-gray-400">Real-time market data powered by Yahoo Finance</p>
        </div>

        {/* Yahoo Finance Service Component */}
        <YahooFinanceService 
          symbols={symbols}
          onDataUpdate={handleDataUpdate}
          updateInterval={30000}
        />

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6 border-b border-gray-700">
          {[
            { id: 'signals', label: 'Trading Signals', icon: Activity },
            { id: 'prices', label: 'Live Prices', icon: TrendingUp }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'signals' && renderSignalsTab()}
          {activeTab === 'prices' && renderPricesTab()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedForexDashboard;
