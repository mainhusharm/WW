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
  symbols = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'AUD/JPY', 'GBP/CHF', 'EUR/CHF', 'CAD/JPY', 'CHF/JPY', 'AUD/CAD', 'AUD/CHF', 'AUD/NZD', 'CAD/CHF', 'EUR/AUD', 'EUR/CAD', 'EUR/NZD', 'GBP/AUD'],
  updateInterval = 60000 
}) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Realistic base prices for fallback
  const getBasePrice = (symbol: string): number => {
    const basePrices: Record<string, number> = {
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2650,
      'USD/JPY': 149.50,
      'USD/CHF': 0.8750,
      'AUD/USD': 0.6450,
      'USD/CAD': 1.3650,
      'NZD/USD': 0.5950,
      'EUR/JPY': 162.25,
      'GBP/JPY': 189.15,
      'EUR/GBP': 0.8580,
      'AUD/JPY': 96.45,
      'GBP/CHF': 1.1070,
      'EUR/CHF': 0.9490,
      'CAD/JPY': 109.60,
      'CHF/JPY': 170.85,
      'AUD/CAD': 0.8810,
      'AUD/CHF': 0.5645,
      'AUD/NZD': 1.0840,
      'CAD/CHF': 0.6410,
      'EUR/AUD': 1.6830,
      'EUR/CAD': 1.4810,
      'EUR/NZD': 1.8240,
      'GBP/AUD': 1.9620,
      'BTCUSDT': 43250.00,
      'ETHUSDT': 2650.00
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

        const response = await fetch(`https://forex-data-service.onrender.com/api/forex-price?pair=${symbol}`, {
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
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white flex items-center">
          <TrendingUp className="mr-2 text-blue-400" />
          Live Market Data
        </h3>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
          )}
        </div>
      </div>

      {/* Status Info */}
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-300">
            Data Source: {connectionStatus === 'connected' ? 'Yahoo Finance + Simulation' : 'Simulation Only'}
          </span>
          {lastUpdate && (
            <span className="text-gray-400">
              Last Update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Price Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map(symbol => {
          const priceData = prices[symbol];
          if (!priceData) return null;

          const isPositive = (priceData.changePercent || 0) >= 0;
          
          return (
            <div key={symbol} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-semibold">{symbol}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  priceData.provider === 'yahoo-finance' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-blue-600 text-white'
                }`}>
                  {priceData.provider === 'yahoo-finance' ? 'LIVE' : 'SIM'}
                </span>
              </div>
              
              <div className="text-2xl font-bold text-white mb-1">
                {priceData.price}
              </div>
              
              {priceData.changePercent !== undefined && (
                <div className={`flex items-center text-sm ${
                  isPositive ? 'text-green-400' : 'text-red-400'
                }`}>
                  <span className="mr-1">{isPositive ? '↗' : '↘'}</span>
                  <span>{isPositive ? '+' : ''}{priceData.changePercent.toFixed(2)}%</span>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-2">
                {new Date(priceData.timestamp).toLocaleTimeString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Refresh */}
      <div className="mt-4 text-center">
        <button
          onClick={updatePrices}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm flex items-center space-x-2 mx-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Prices</span>
        </button>
      </div>
    </div>
  );
};

export default ReliableDataFeed;
