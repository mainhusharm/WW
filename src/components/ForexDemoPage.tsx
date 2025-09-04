import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  ChartBarIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import useRenderForex from '../hooks/useRenderForex';

const ForexDemoPage: React.FC = () => {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['EUR/USD', 'GBP/USD', 'USD/JPY']);
  const [timeframe, setTimeframe] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, pairs, loading, error, refresh, subscribe, unsubscribe } = useRenderForex({
    symbols: selectedSymbols,
    autoRefresh,
    refreshInterval: 5000
  });

  useEffect(() => {
    if (selectedSymbols.length > 0) {
      subscribe(selectedSymbols);
    }
    return () => unsubscribe();
  }, [selectedSymbols, subscribe, unsubscribe]);

  const handleSymbolToggle = (symbol: string) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUpIcon className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDownIcon className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading forex data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <GlobeAltIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Forex Demo Dashboard</h1>
          </div>
          <p className="text-gray-600">Real-time forex data and analysis demonstration</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timeframe
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Refresh
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700">Enable</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actions
              </label>
              <button
                onClick={refresh}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Refresh Now
              </button>
            </div>
          </div>
        </div>

        {/* Symbol Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Available Symbols</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {pairs.map((pair) => (
              <button
                key={pair.symbol}
                onClick={() => handleSymbolToggle(pair.symbol)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedSymbols.includes(pair.symbol)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="text-sm font-medium">{pair.symbol}</div>
                <div className="text-xs text-gray-500 capitalize">{pair.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Data Display */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {data.map((forexData) => (
            <div key={forexData.symbol} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{forexData.symbol}</h3>
                    <p className="text-sm text-gray-500">Live Rate</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${forexData.bid.toFixed(5)}
                    </div>
                    <div className="text-sm text-gray-500">Bid</div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Ask</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ${forexData.ask.toFixed(5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Spread</p>
                    <p className="text-lg font-semibold text-red-600">
                      ${forexData.spread.toFixed(5)}
                    </p>
                  </div>
                </div>

                {/* Change Information */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Change</span>
                    <div className="flex items-center">
                      {getChangeIcon(forexData.change)}
                      <span className={`ml-1 font-semibold ${getChangeColor(forexData.change)}`}>
                        {forexData.change >= 0 ? '+' : ''}{forexData.change.toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Change %</span>
                    <span className={`font-semibold ${getChangeColor(forexData.changePercent)}`}>
                      {forexData.changePercent >= 0 ? '+' : ''}{forexData.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* High/Low */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">High</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${forexData.high.toFixed(5)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Low</p>
                    <p className="text-lg font-semibold text-red-600">
                      ${forexData.low.toFixed(5)}
                    </p>
                  </div>
                </div>

                {/* Volume and Timestamp */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-4 w-4 mr-1" />
                      Volume: {forexData.volume.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(forexData.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Market Summary */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Market Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{data.length}</div>
              <div className="text-sm text-gray-500">Active Pairs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.filter(d => d.change >= 0).length}
              </div>
              <div className="text-sm text-gray-500">Gaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.filter(d => d.change < 0).length}
              </div>
              <div className="text-sm text-gray-500">Declining</div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">Demo Mode</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This is a demonstration of the forex data integration. The data shown is simulated for demonstration purposes.</p>
                <p className="mt-2">In production, this would connect to real forex data providers and display live market rates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForexDemoPage;
