import React, { useState, useEffect } from 'react';
import { 
  SignalIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  ClockIcon,
  StarIcon,
  EyeIcon,
  ShareIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

interface TradingSignal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  price: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  source: string;
  timestamp: string;
  isActive: boolean;
  performance?: {
    pnl: number;
    pnlPercent: number;
    duration: string;
  };
  analysis: {
    technical: string[];
    fundamental: string[];
    sentiment: string;
  };
}

const EnhancedSignalsFeed: React.FC = () => {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [filter, setFilter] = useState('all');
  const [timeframe, setTimeframe] = useState('all');
  const [strength, setStrength] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<TradingSignal | null>(null);
  const [sortBy, setSortBy] = useState('timestamp');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSignals: TradingSignal[] = [
      {
        id: '1',
        symbol: 'BTC/USDT',
        type: 'buy',
        strength: 'strong',
        timeframe: '1h',
        price: 43250,
        targetPrice: 44500,
        stopLoss: 42500,
        confidence: 85,
        source: 'SMC Analysis',
        timestamp: '2024-01-15T10:30:00Z',
        isActive: true,
        performance: {
          pnl: 1250,
          pnlPercent: 2.89,
          duration: '2h 15m'
        },
        analysis: {
          technical: ['RSI oversold', 'Support level', 'Volume spike'],
          fundamental: ['Institutional buying', 'ETF approval'],
          sentiment: 'Bullish'
        }
      },
      {
        id: '2',
        symbol: 'ETH/USDT',
        type: 'sell',
        strength: 'medium',
        timeframe: '4h',
        price: 2650,
        targetPrice: 2580,
        stopLoss: 2720,
        confidence: 72,
        source: 'Technical Analysis',
        timestamp: '2024-01-15T09:15:00Z',
        isActive: true,
        analysis: {
          technical: ['Resistance level', 'MACD bearish crossover'],
          fundamental: ['Network upgrade concerns'],
          sentiment: 'Bearish'
        }
      },
      {
        id: '3',
        symbol: 'SOL/USDT',
        type: 'buy',
        strength: 'very-strong',
        timeframe: '15m',
        price: 98.50,
        targetPrice: 105.00,
        stopLoss: 95.00,
        confidence: 92,
        source: 'AI Algorithm',
        timestamp: '2024-01-15T08:45:00Z',
        isActive: true,
        analysis: {
          technical: ['Breakout pattern', 'High volume', 'RSI momentum'],
          fundamental: ['Ecosystem growth', 'Developer activity'],
          sentiment: 'Very Bullish'
        }
      }
    ];
    setSignals(mockSignals);
  }, []);

  const filteredSignals = signals.filter(signal => {
    const matchesFilter = filter === 'all' || signal.type === filter;
    const matchesTimeframe = timeframe === 'all' || signal.timeframe === timeframe;
    const matchesStrength = strength === 'all' || signal.strength === strength;
    const matchesSearch = signal.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         signal.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesTimeframe && matchesStrength && matchesSearch;
  });

  const sortedSignals = [...filteredSignals].sort((a, b) => {
    switch (sortBy) {
      case 'timestamp':
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      case 'confidence':
        return b.confidence - a.confidence;
      case 'strength':
        const strengthOrder = { 'weak': 1, 'medium': 2, 'strong': 3, 'very-strong': 4 };
        return strengthOrder[b.strength] - strengthOrder[a.strength];
      case 'price':
        return b.price - a.price;
      default:
        return 0;
    }
  });

  const getSignalTypeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-green-100 text-green-800';
      case 'sell': return 'bg-red-100 text-red-800';
      case 'hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'weak': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'strong': return 'bg-orange-100 text-orange-800';
      case 'very-strong': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const handleSignalAction = (signalId: string, action: string) => {
    console.log(`${action} signal: ${signalId}`);
    // Implement signal actions (bookmark, share, etc.)
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Signals Feed</h1>
          <p className="text-gray-600 mt-2">Real-time trading signals with advanced analysis</p>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Signal Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="hold">Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="all">All Timeframes</option>
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Strength</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
              >
                <option value="all">All Strengths</option>
                <option value="weak">Weak</option>
                <option value="medium">Medium</option>
                <option value="strong">Strong</option>
                <option value="very-strong">Very Strong</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="timestamp">Latest</option>
                <option value="confidence">Confidence</option>
                <option value="strength">Strength</option>
                <option value="price">Price</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Symbol or source..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Signals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedSignals.map((signal) => (
            <div key={signal.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
              {/* Signal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getSignalTypeColor(signal.type)}`}>
                      {signal.type === 'buy' ? (
                        <TrendingUpIcon className="h-5 w-5" />
                      ) : signal.type === 'sell' ? (
                        <TrendingDownIcon className="h-5 w-5" />
                      ) : (
                        <SignalIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{signal.symbol}</h3>
                      <p className="text-sm text-gray-500 capitalize">{signal.type} signal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getConfidenceColor(signal.confidence)}`}>
                      {signal.confidence}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                </div>

                {/* Signal Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Current Price</p>
                    <p className="text-lg font-semibold text-gray-900">${signal.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Target</p>
                    <p className="text-lg font-semibold text-green-600">${signal.targetPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Stop Loss</p>
                    <p className="text-lg font-semibold text-red-600">${signal.stopLoss.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Timeframe</p>
                    <p className="text-sm font-medium text-gray-900">{signal.timeframe}</p>
                  </div>
                </div>

                {/* Performance (if available) */}
                {signal.performance && (
                  <div className="bg-green-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">Performance</span>
                      <span className="text-sm font-bold text-green-600">
                        +${signal.performance.pnl.toLocaleString()} ({signal.performance.pnlPercent.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Duration: {signal.performance.duration}
                    </div>
                  </div>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStrengthColor(signal.strength)}`}>
                    {signal.strength.replace('-', ' ')}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {signal.source}
                  </span>
                </div>

                {/* Analysis Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
                  <div className="space-y-1">
                    {signal.analysis.technical.slice(0, 2).map((point, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center">
                        <div className="w-1 h-1 bg-blue-500 rounded-full mr-2"></div>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-xs">{formatTimestamp(signal.timestamp)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSignalAction(signal.id, 'bookmark')}
                      className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                      title="Bookmark"
                    >
                      <BookmarkIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleSignalAction(signal.id, 'share')}
                      className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Share"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setSelectedSignal(signal)}
                      className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signal Details Modal */}
        {selectedSignal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-medium text-gray-900">
                    Signal Details - {selectedSignal.symbol}
                  </h3>
                  <button
                    onClick={() => setSelectedSignal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Technical Analysis */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Technical Analysis</h4>
                    <div className="space-y-2">
                      {selectedSignal.analysis.technical.map((point, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></div>
                          <span className="text-sm text-gray-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fundamental Analysis */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Fundamental Analysis</h4>
                    <div className="space-y-2">
                      {selectedSignal.analysis.fundamental.map((point, index) => (
                        <div key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                          <span className="text-sm text-gray-700">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sentiment */}
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Market Sentiment</h4>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    selectedSignal.analysis.sentiment === 'Bullish' ? 'bg-green-100 text-green-800' :
                    selectedSignal.analysis.sentiment === 'Bearish' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedSignal.analysis.sentiment}
                  </div>
                </div>

                {/* Risk Metrics */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Risk Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Risk/Reward Ratio</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {((selectedSignal.targetPrice - selectedSignal.price) / (selectedSignal.price - selectedSignal.stopLoss)).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Potential Loss</p>
                      <p className="text-lg font-semibold text-red-600">
                        {((selectedSignal.price - selectedSignal.stopLoss) / selectedSignal.price * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSignalsFeed;
