import React, { useState, useEffect } from 'react';

interface LivePriceFeedProps {
  market: 'forex' | 'crypto';
}

interface PriceData {
  price: number;
  provider: string;
  timestamp: string;
  error?: string;
}

const LivePriceFeed: React.FC<LivePriceFeedProps> = ({ market }) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const symbols = {
    forex: [
      'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
      'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'AUD/JPY', 'GBP/CHF', 'EUR/CHF', 'CAD/JPY', 
      'CHF/JPY', 'AUD/CAD', 'AUD/CHF', 'AUD/NZD', 'CAD/CHF', 'EUR/AUD', 'EUR/CAD', 
      'EUR/NZD', 'GBP/AUD'
    ],
    crypto: [
      'BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'BNBUSDT', 'XRPUSDT', 'SOLUSDT', 'DOTUSDT'
    ]
  };

  const selectedSymbols = symbols[market];

  useEffect(() => {
    const fetchPrices = async () => {
      if (selectedSymbols.length === 0) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Try multiple data sources for better reliability
        const dataSources = [
          'https://forex-data-service.onrender.com',
          // Fallback to local mock data if service is down
        ];
        
        let lastError: Error | null = null;
        
        for (const baseUrl of dataSources) {
          try {
            const url = `${baseUrl}/api/bulk-forex-price?pairs=${encodeURIComponent(selectedSymbols.join(','))}`;
            console.log(`Attempting to fetch from: ${url}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              console.log('Request timeout, aborting...');
              controller.abort();
            }, 10000); // Reduced to 10 second timeout
        
            const response = await fetch(url, {
              signal: controller.signal,
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; TradingDashboard/1.0)'
              },
              mode: 'cors'
            });
            
            clearTimeout(timeoutId);
        
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const results = await response.json();
            console.log('Yahoo Finance API Response:', results);
            
            // If we get here, the request was successful, break out of the loop
            return processResults(results);
            
          } catch (error: any) {
            lastError = error;
            console.warn(`Failed to fetch from ${baseUrl}:`, error.message);
            
            // If this is the last data source, we'll fall through to the error handling
            if (baseUrl === dataSources[dataSources.length - 1]) {
              break;
            }
            
            // Wait a bit before trying the next source
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If we get here, all data sources failed
        throw lastError || new Error('All data sources failed');
        
      } catch (error: any) {
        console.error('All data fetching attempts failed:', error);
        return generateFallbackData();
      } finally {
        setLoading(false);
      }
    };
    
    const processResults = (results: any) => {
        
      const newPrices: Record<string, PriceData> = {};
      let successCount = 0;
      
      for (const symbol of selectedSymbols) {
        if (results[symbol]) {
          if (results[symbol].error) {
            console.warn(`Error for ${symbol}:`, results[symbol].error);
            newPrices[symbol] = {
              price: 0,
              provider: 'yfinance',
              timestamp: new Date().toISOString(),
              error: results[symbol].error
            };
          } else if (results[symbol].price && !isNaN(results[symbol].price)) {
            newPrices[symbol] = {
              price: parseFloat(results[symbol].price.toFixed(5)),
              provider: 'yfinance',
              timestamp: new Date().toISOString()
            };
            successCount++;
          }
        } else {
          console.warn(`No data returned for ${symbol}`);
          newPrices[symbol] = {
            price: 0,
            provider: 'yfinance',
            timestamp: new Date().toISOString(),
            error: 'No data available'
          };
        }
      }
      
      setPrices(newPrices);
      
      if (successCount === 0) {
        setError('No price data available from Yahoo Finance');
      } else {
        setError(null);
        console.log(`Successfully fetched ${successCount}/${selectedSymbols.length} prices`);
      }
      
      return newPrices;
    };
    
    const generateFallbackData = () => {
      console.warn('Real-time data service unavailable');
      setError('Real-time data service is currently unavailable. Please try again later.');
      setPrices({});
      return {};
    };

    // Initial fetch with delay to avoid overwhelming the service
    const initialTimeout = setTimeout(() => {
      fetchPrices();
    }, 1000);
    
    // Set up interval for regular updates (increased to 60 seconds to reduce load)
    const interval = setInterval(fetchPrices, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [market, selectedSymbols]);

  return (
    <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">Live Prices ({market.toUpperCase()})</h3>
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-400"></div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-600 rounded-lg">
          <p className="text-yellow-400 text-sm">⚠️ {error}</p>
        </div>
      )}
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Object.keys(prices).length > 0 ? (
          Object.keys(prices).map(symbol => {
            const priceData = prices[symbol];
            const hasError = priceData.error;
            
            return (
              <div key={symbol} className={`flex justify-between items-center p-2 rounded-lg ${
                hasError ? 'bg-red-900/30 border border-red-600/50' : 'bg-gray-900/50'
              }`}>
                <span className="text-white font-semibold">{symbol}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${
                    priceData.provider === 'yfinance' ? 'text-green-400' : 
                    priceData.provider === 'mock' ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    ({priceData.provider})
                  </span>
                  {hasError ? (
                    <span className="text-red-400 text-sm">Error</span>
                  ) : (
                    <span className={`font-bold ${
                      priceData.provider === 'yfinance' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {priceData.price}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
            <p className="text-gray-400">Fetching live prices from Yahoo Finance...</p>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-4">No price data available</p>
        )}
      </div>
    </div>
  );
};

export default LivePriceFeed;
