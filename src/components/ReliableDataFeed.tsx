import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import realYfinanceService from '../services/realYfinanceService';

interface ReliableDataFeedProps {
  symbols: string[];
  updateInterval?: number;
}

interface PriceData {
  price: number;
  provider: string;
  timestamp: string;
  change?: number;
  changePercent?: number;
}

const ReliableDataFeed: React.FC<ReliableDataFeedProps> = ({ 
  symbols, 
  updateInterval = 30000 
}) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const updatePrices = async () => {
    setLoading(true);
    setConnectionStatus('connecting');

    try {
      // Use real yfinance service instead of problematic api.allorigins.win
      const bulkData = await realYfinanceService.fetchBulkRealPrices(symbols, true); // Force refresh
      
      if (bulkData.success && bulkData.data.length > 0) {
        const newPrices: Record<string, PriceData> = {};
        
        for (const item of bulkData.data) {
          if (item.symbol && item.price) {
            newPrices[item.symbol] = {
              price: parseFloat(item.price.toFixed(item.symbol.includes('JPY') ? 3 : 5)),
              provider: item.provider || 'real-data',
              timestamp: item.timestamp || new Date().toISOString(),
              change: item.change,
              changePercent: item.changePercent
            };
          }
        }
        
        setPrices(newPrices);
        setConnectionStatus('connected');
        console.log(`✅ Real data fetched: ${bulkData.count}/${symbols.length} symbols successful`);
      } else {
        setConnectionStatus('disconnected');
        console.warn('No real data available from yfinance service');
      }
    } catch (error) {
      console.error('Failed to fetch real data:', error);
      setConnectionStatus('disconnected');
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  useEffect(() => {
    // Clear cache and initial load
    realYfinanceService.clearCache();
    updatePrices();

    // Set up regular updates
    const interval = setInterval(updatePrices, updateInterval);
    return () => clearInterval(interval);
  }, [symbols, updateInterval]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'disconnected': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reliable Data Feed</h2>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map(symbol => {
          const priceData = prices[symbol];
          if (!priceData) return null;

          return (
            <div key={symbol} className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-800">{symbol}</h3>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  priceData.provider === 'yahoo-finance' ? 'bg-green-100 text-green-800' :
                  priceData.provider === 'cached' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {priceData.provider}
                </span>
              </div>
              
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {priceData.price.toFixed(symbol.includes('JPY') ? 3 : 5)}
              </div>
              
              {priceData.change !== undefined && (
                <div className={`text-sm ${priceData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className={`inline w-4 h-4 ${priceData.change < 0 ? 'rotate-180' : ''}`} />
                  {priceData.change >= 0 ? '+' : ''}{priceData.change.toFixed(5)} ({priceData.changePercent?.toFixed(2)}%)
                </div>
              )}
              
              <div className="text-xs text-gray-500 mt-2">
                {new Date(priceData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
        <span>Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</span>
        <button
          onClick={updatePrices}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Updating...' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
};

export default ReliableDataFeed;
