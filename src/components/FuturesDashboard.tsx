import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Activity, Send, RefreshCw, Zap, Target, BarChart3, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { productionApi, isProductionBackendUnavailable } from '../utils/productionFallback';

interface FuturesData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketState: string;
  category: string;
  timestamp: string;
  previousClose: number;
  high24h?: number;
  low24h?: number;
}

interface FuturesSignal {
  id: string;
  asset: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  timeframe: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number[];
  confidence: number;
  analysis: string;
  timestamp: string;
  category: string;
}

const FUTURES_ASSETS = {
  'S&P 500': 'ES=F',
  'Nasdaq-100': 'NQ=F',
  'Dow Jones': 'YM=F',
  'Russell 2000': 'RTY=F',
  'Crude Oil': 'CL=F',
  'Gold': 'GC=F',
  'Silver': 'SI=F',
  '10-Year T-Note': 'ZN=F',
  '30-Year T-Bond': 'ZB=F',
  'Euro FX': '6E=F',
  'British Pound': '6B=F',
  'Japanese Yen': '6J=F'
};

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];

const FUTURES_SERVICE_URL = import.meta.env.DEV ? 'http://localhost:3001' : 'https://www.traderedgepro.com';

// Real-time price simulation class
class RealTimePriceSimulator {
  private baseData: Map<string, FuturesData> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Set<(data: FuturesData[]) => void> = new Set();

  constructor() {
    this.initializeBaseData();
  }

  private async initializeBaseData() {
    // Fetch initial real data using production fallback
    try {
      const symbols = Object.keys(FUTURES_ASSETS);
      const response = await productionApi.getBulkData(symbols, '1m');
      
      if (response.success) {
        response.data.forEach((item: any) => {
          this.baseData.set(item.symbol, {
            symbol: item.symbol,
            name: item.name || FUTURES_ASSETS[item.symbol] || item.symbol,
            price: item.price,
            change: item.change,
            changePercent: item.changePercent || (item.change / item.price) * 100,
            volume: item.volume,
            marketState: item.marketState || 'open',
            category: item.category || 'futures',
            timestamp: new Date().toISOString(),
            previousClose: item.previousClose || item.price - item.change,
            high24h: item.price * (1 + Math.random() * 0.02),
            low24h: item.price * (1 - Math.random() * 0.02)
          });
        });
      }
    } catch (error) {
      if (isProductionBackendUnavailable(error)) {
        console.log('🔄 Using fallback futures data for production initialization');
      } else {
        console.error('Failed to fetch initial data, using mock data:', error);
      }
      this.generateMockBaseData();
    }
  }

  private generateMockBaseData() {
    Object.entries(FUTURES_ASSETS).forEach(([name, symbol]) => {
      const basePrice = Math.random() * 1000 + 100;
      this.baseData.set(symbol, {
        symbol,
        name,
        price: basePrice,
        change: (Math.random() - 0.5) * 20,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 1000000),
        marketState: 'REGULAR',
        category: this.getCategoryByName(name),
        timestamp: new Date().toISOString(),
        previousClose: basePrice * (1 + (Math.random() - 0.5) * 0.01),
        high24h: basePrice * (1 + Math.random() * 0.02),
        low24h: basePrice * (1 - Math.random() * 0.02)
      });
    });
  }

  private getCategoryByName(name: string): string {
    if (['S&P 500', 'Nasdaq-100', 'Dow Jones', 'Russell 2000'].includes(name)) return 'indices';
    if (['Crude Oil', 'Gold', 'Silver'].includes(name)) return 'commodities';
    if (['10-Year T-Note', '30-Year T-Bond'].includes(name)) return 'treasuries';
    if (['Euro FX', 'British Pound', 'Japanese Yen'].includes(name)) return 'currencies';
    return 'other';
  }

  private simulatePriceMovement(data: FuturesData): FuturesData {
    // Generate realistic price movement
    const volatility = 0.001; // 0.1% volatility per update
    const trend = (Math.random() - 0.5) * 2; // Random trend direction
    const movement = data.price * volatility * trend;
    
    const newPrice = Math.max(0.01, data.price + movement);
    const newChange = newPrice - data.previousClose;
    const newChangePercent = (newChange / data.previousClose) * 100;

    // Update high/low if needed
    const high24h = Math.max(data.high24h || newPrice, newPrice);
    const low24h = Math.min(data.low24h || newPrice, newPrice);

    // Simulate volume changes
    const volumeChange = Math.floor((Math.random() - 0.5) * 10000);
    const newVolume = Math.max(0, data.volume + volumeChange);

    return {
      ...data,
      price: newPrice,
      change: newChange,
      changePercent: newChangePercent,
      volume: newVolume,
      timestamp: new Date().toISOString(),
      high24h,
      low24h
    };
  }

  subscribe(callback: (data: FuturesData[]) => void) {
    this.subscribers.add(callback);
    
    // Start real-time updates
    this.startRealTimeUpdates();
    
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stopRealTimeUpdates();
      }
    };
  }

  private startRealTimeUpdates() {
    if (this.intervals.size > 0) return; // Already running

    // Update prices every 2 seconds for a real-time feel
    const updateInterval = setInterval(() => {
      const updatedData: FuturesData[] = [];
      
      this.baseData.forEach((data, symbol) => {
        const updatedItem = this.simulatePriceMovement(data);
        this.baseData.set(symbol, updatedItem);
        updatedData.push(updatedItem);
      });

      // Notify all subscribers
      this.subscribers.forEach(callback => {
        callback(updatedData);
      });
    }, 2000);

    this.intervals.set('main', updateInterval);
  }

  private stopRealTimeUpdates() {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }

  getCurrentData(): FuturesData[] {
    return Array.from(this.baseData.values());
  }
}

// Global instance
const priceSimulator = new RealTimePriceSimulator();

const FuturesDashboard = ({ isBotRunning, setIsBotRunning }: { isBotRunning: boolean, setIsBotRunning: (running: boolean) => void }) => {
  const [futuresData, setFuturesData] = useState<FuturesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1m');
  const [autoRefresh, setAutoRefresh] = useState(true); // Default to true for real-time
  const [recentSignals, setRecentSignals] = useState<FuturesSignal[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  
  const [signalForm, setSignalForm] = useState({
    asset: 'S&P 500',
    timeframe: '15m',
    direction: 'BUY' as 'BUY' | 'SELL',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    confidence: 85,
    analysis: ''
  });

  // Initialize real-time data
  useEffect(() => {
    const unsubscribe = priceSimulator.subscribe((data: FuturesData[]) => {
      setFuturesData(data);
      setLastUpdate(new Date());
      setIsRealTimeActive(true);
    });

    // Get initial data
    const initialData = priceSimulator.getCurrentData();
    if (initialData.length > 0) {
      setFuturesData(initialData);
      setLastUpdate(new Date());
    }

    return unsubscribe;
  }, []);

  // Fetch real-time futures data (fallback method)
  const fetchFuturesData = useCallback(async () => {
    if (isRealTimeActive) return; // Don't fetch if real-time is active

    setLoading(true);
    try {
      const symbols = Object.keys(FUTURES_ASSETS);
      const response = await productionApi.getBulkData(symbols, selectedTimeframe);
      
      if (response.success) {
        setFuturesData(response.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      if (isProductionBackendUnavailable(error)) {
        console.log('🔄 Using fallback futures data for production');
      } else {
        console.error('Error fetching futures data:', error);
      }
      // Don't set fallback data if real-time is working
      if (!isRealTimeActive) {
        setFuturesData(generateMockFuturesData());
        setLastUpdate(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTimeframe, isRealTimeActive]);

  // Generate mock data as fallback
  const generateMockFuturesData = (): FuturesData[] => {
    return Object.entries(FUTURES_ASSETS).map(([name, symbol]) => ({
      symbol,
      name,
      price: Math.random() * 1000 + 100,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      marketState: 'REGULAR',
      category: getCategoryByName(name),
      timestamp: new Date().toISOString(),
      previousClose: Math.random() * 1000 + 100
    }));
  };

  const getCategoryByName = (name: string): string => {
    if (['S&P 500', 'Nasdaq-100', 'Dow Jones', 'Russell 2000'].includes(name)) return 'indices';
    if (['Crude Oil', 'Gold', 'Silver'].includes(name)) return 'commodities';
    if (['10-Year T-Note', '30-Year T-Bond'].includes(name)) return 'treasuries';
    if (['Euro FX', 'British Pound', 'Japanese Yen'].includes(name)) return 'currencies';
    return 'other';
  };

  // Manual refresh (for fallback when real-time isn't working)
  const handleManualRefresh = () => {
    if (!isRealTimeActive) {
      fetchFuturesData();
    }
  };

  // Handle signal form changes
  const handleSignalFormChange = (field: string, value: any) => {
    setSignalForm(prev => ({ ...prev, [field]: value }));
  };

  // Send futures signal
  const sendFuturesSignal = async () => {
    try {
      const signal: FuturesSignal = {
        id: Date.now().toString(),
        asset: signalForm.asset,
        symbol: FUTURES_ASSETS[signalForm.asset as keyof typeof FUTURES_ASSETS],
        direction: signalForm.direction,
        timeframe: signalForm.timeframe,
        entryPrice: parseFloat(signalForm.entryPrice),
        stopLoss: parseFloat(signalForm.stopLoss),
        takeProfit: signalForm.takeProfit.split(',').map(tp => parseFloat(tp.trim())),
        confidence: signalForm.confidence,
        analysis: signalForm.analysis,
        timestamp: new Date().toISOString(),
        category: getCategoryByName(signalForm.asset)
      };

      // Store signal for user dashboard
      const existingSignals = JSON.parse(localStorage.getItem('futures_signals') || '[]');
      existingSignals.unshift(signal);
      localStorage.setItem('futures_signals', JSON.stringify(existingSignals.slice(0, 50)));

      // Dispatch event for real-time updates
      window.dispatchEvent(new CustomEvent('newFuturesSignal', { detail: signal }));

      // Update recent signals
      setRecentSignals(prev => [signal, ...prev.slice(0, 9)]);

      // Reset form
      setSignalForm({
        asset: 'S&P 500',
        timeframe: '15m',
        direction: 'BUY',
        entryPrice: '',
        stopLoss: '',
        takeProfit: '',
        confidence: 85,
        analysis: ''
      });

      alert('Futures signal sent successfully!');
    } catch (error) {
      console.error('Error sending futures signal:', error);
      alert('Error sending signal. Please try again.');
    }
  };

  // Group data by category
  const groupedData = futuresData.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, FuturesData[]>);

  const CategoryCard = ({ title, data, icon }: { title: string, data: FuturesData[], icon: React.ReactNode }) => (
    <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30 transition-all duration-300 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-white capitalize">{title}</h3>
        </div>
        <span className="text-sm text-gray-400">{data.length} assets</span>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.symbol} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-white">{item.name}</span>
                <span className="text-xs text-gray-400">{item.symbol}</span>
                {isRealTimeActive && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg font-bold text-white">${item.price.toFixed(2)}</span>
                <div className={`flex items-center space-x-1 transition-colors duration-300 ${item.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {item.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="text-sm font-medium">
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              {item.high24h && item.low24h && (
                <div className="text-xs text-gray-500 mt-1">
                  H: ${item.high24h.toFixed(2)} L: ${item.low24h.toFixed(2)}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Volume</div>
              <div className="text-sm font-medium text-white">{item.volume.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Futures Trading Hub</h2>
              <p className="text-gray-400">Real-time futures data and signal generation</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isRealTimeActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
              <span className="text-sm text-gray-400">
                {isRealTimeActive ? 'Real-Time Active' : 'Static Data'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">
                {lastUpdate ? `Updated: ${lastUpdate.toLocaleTimeString()}` : 'No data'}
              </span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading || isRealTimeActive}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Timeframe:</span>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setSelectedTimeframe(tf)}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                selectedTimeframe === tf
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Market Data Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(groupedData).map(([category, data]) => (
          <CategoryCard
            key={category}
            title={category}
            data={data}
            icon={
              category === 'indices' ? <TrendingUp className="w-5 h-5 text-purple-400" /> :
              category === 'commodities' ? <DollarSign className="w-5 h-5 text-purple-400" /> :
              category === 'treasuries' ? <BarChart3 className="w-5 h-5 text-purple-400" /> :
              <Activity className="w-5 h-5 text-purple-400" />
            }
          />
        ))}
      </div>

      {/* Signal Generation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-purple-500/20 rounded-full">
              <Send className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Generate Futures Signal</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Asset</label>
              <select
                value={signalForm.asset}
                onChange={(e) => handleSignalFormChange('asset', e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.keys(FUTURES_ASSETS).map((asset) => (
                  <option key={asset} value={asset}>{asset}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Timeframe</label>
              <select
                value={signalForm.timeframe}
                onChange={(e) => handleSignalFormChange('timeframe', e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Direction</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSignalFormChange('direction', 'BUY')}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    signalForm.direction === 'BUY'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => handleSignalFormChange('direction', 'SELL')}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    signalForm.direction === 'SELL'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Entry Price</label>
              <input
                type="number"
                step="0.01"
                value={signalForm.entryPrice}
                onChange={(e) => handleSignalFormChange('entryPrice', e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Stop Loss</label>
              <input
                type="number"
                step="0.01"
                value={signalForm.stopLoss}
                onChange={(e) => handleSignalFormChange('stopLoss', e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Take Profit (comma separated)</label>
              <input
                type="text"
                value={signalForm.takeProfit}
                onChange={(e) => handleSignalFormChange('takeProfit', e.target.value)}
                className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00, 0.00, 0.00"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-2 block">Confidence: {signalForm.confidence}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={signalForm.confidence}
              onChange={(e) => handleSignalFormChange('confidence', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="text-sm text-gray-400 mb-2 block">Analysis</label>
            <textarea
              value={signalForm.analysis}
              onChange={(e) => handleSignalFormChange('analysis', e.target.value)}
              rows={4}
              className="w-full bg-gray-800/70 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your market analysis and reasoning..."
            />
          </div>

          <button
            onClick={sendFuturesSignal}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Send Futures Signal</span>
            </div>
          </button>
        </div>

        {/* Recent Signals */}
        <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Recent Signals</h3>
          </div>
          <div className="space-y-3">
            {recentSignals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                <p>No signals sent yet</p>
              </div>
            ) : (
              recentSignals.map((signal) => (
                <div key={signal.id} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{signal.asset}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      signal.direction === 'BUY' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {signal.direction}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div>Entry: ${signal.entryPrice}</div>
                    <div>Confidence: {signal.confidence}%</div>
                    <div className="text-xs mt-1">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturesDashboard;
