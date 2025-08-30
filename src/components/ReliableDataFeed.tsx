import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { errorHandler } from '../services/errorHandler';

interface PriceData {
  price: number;
  provider: string;
  timestamp: string;
  change?: number;
  changePercent?: number;
}

interface ReliableDataFeedProps {
  symbols?: string[];
  updateInterval?: number;
}

const ReliableDataFeed: React.FC<ReliableDataFeedProps> = ({ 
  symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD'], 
  updateInterval = 30000 
}) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  const getBasePrice = (symbol: string): number => {
    const basePrices: { [key: string]: number } = {
      'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 149.50,
      'USD/CHF': 0.8750, 'AUD/USD': 0.6450, 'USD/CAD': 1.3650,
      'NZD/USD': 0.5950, 'EUR/JPY': 162.25, 'GBP/JPY': 189.15,
      'EUR/GBP': 0.8580, 'EUR/AUD': 1.6820, 'GBP/AUD': 1.9610,
      'AUD/CAD': 0.8960, 'CAD/JPY': 109.50, 'CHF/JPY': 170.85,
      'AUD/CHF': 0.7370, 'CAD/CHF': 0.6410, 'EUR/CHF': 1.2400,
      'GBP/CHF': 1.4450, 'NZD/CAD': 0.4360, 'NZD/JPY': 89.00,
      'AUD/NZD': 1.0840
    };
    return basePrices[symbol] || 1.0000;
  };

  const generateRealisticPrice = (symbol: string, previousPrice?: number): PriceData => {
    const basePrice = previousPrice || getBasePrice(symbol);
    const maxChange = symbol.includes('USD') ? 0.002 : 0.005; // 0.2% for forex, 0.5% for others
    const change = (Math.random() - 0.5) * maxChange;
    const newPrice = basePrice * (1 + change);
    
    return {
      price: parseFloat(newPrice.toFixed(symbol.includes('JPY') ? 3 : 5)),
      provider: 'simulated',
      timestamp: new Date().toISOString(),
      change: change * basePrice,
      changePercent: change * 100
    };
  };

  const fetchFromYahooFinance = async (symbol: string): Promise<PriceData | null> => {
    try {
      const priceData = await errorHandler.handlePriceApi(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`)}`, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors'
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.price && !isNaN(data.price)) {
            return {
              price: parseFloat(data.price),
              symbol: symbol
            };
          }
        }
        throw new Error(`Failed to fetch price for ${symbol}`);
      }, symbol);

      if (priceData && priceData.price && !isNaN(priceData.price)) {
        return {
          price: parseFloat(priceData.price.toFixed(symbol.includes('JPY') ? 3 : 5)),
          provider: priceData.cached ? 'cached' : 'yahoo-finance',
          timestamp: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      // Error handler will have already logged this in development
      return null;
    }
  };

  const updatePrices = async () => {
    setLoading(true);
    setConnectionStatus('connecting');

    const newPrices: Record<string, PriceData> = {};
    let successfulFetches = 0;

    // Try to fetch from Yahoo Finance first, fallback to simulation
    for (const symbol of symbols) {
      const yahooData = await fetchFromYahooFinance(symbol);
      
      if (yahooData) {
        newPrices[symbol] = yahooData;
        successfulFetches++;
      } else {
        // Use previous price if available for more realistic simulation
        const previousPrice = prices[symbol]?.price;
        newPrices[symbol] = generateRealisticPrice(symbol, previousPrice);
      }
    }

    setPrices(newPrices);
    setLastUpdate(new Date());
    setConnectionStatus(successfulFetches > 0 ? 'connected' : 'disconnected');
    setLoading(false);

    console.log(`Price update: ${successfulFetches}/${symbols.length} from Yahoo Finance, ${symbols.length - successfulFetches} simulated`);
  };

  useEffect(() => {
    // Initial load
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
