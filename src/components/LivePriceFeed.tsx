import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Settings, X } from 'lucide-react';
import { API_CONFIG } from '../api/config';
import realYfinanceService, { RealPriceData } from '../services/realYfinanceService';

interface LivePriceFeedProps {
  market: 'forex' | 'crypto' | 'stocks';
}

interface PriceData {
  price: number;
  provider: string;
  timestamp: string;
  error?: string;
}

const LivePriceFeed: React.FC<LivePriceFeedProps> = ({ market }) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const symbols = {
    forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD', 'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'EUR/AUD', 'GBP/AUD', 'AUD/CAD', 'CAD/JPY', 'CHF/JPY', 'AUD/CHF', 'CAD/CHF', 'EUR/CHF', 'GBP/CHF', 'NZD/CAD', 'NZD/JPY', 'AUD/NZD'],
    crypto: ['BTC/USD', 'ETH/USD', 'BNB/USD', 'ADA/USD', 'XRP/USD', 'SOL/USD', 'DOT/USD', 'DOGE/USD', 'AVAX/USD', 'LINK/USD', 'LTC/USD', 'XLM/USD', 'FIL/USD', 'AAVE/USD'],
    stocks: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
  };

  const selectedSymbols = useMemo(() => symbols[market], [market]);

  useEffect(() => {
    const fetchPrices = async () => {
      if (selectedSymbols.length === 0) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        let results: any = {};
        
        if (market === 'forex') {
          // Use real yfinance service for forex data - NO FALLBACK DATA
          try {
            const bulkData = await realYfinanceService.fetchBulkRealPrices(selectedSymbols, true); // Force refresh
            
            if (bulkData.success && bulkData.data.length > 0) {
              for (const item of bulkData.data) {
                if (item.symbol && item.price) {
                  results[item.symbol] = { 
                    price: item.price,
                    provider: item.provider,
                    timestamp: item.timestamp
                  };
                }
              }
              console.log(`✅ Real forex data fetched: ${bulkData.count} symbols successful`);
            } else {
              console.warn('No real forex data available');
            }
          } catch (yfinanceError) {
            console.error('Real yfinance service failed:', yfinanceError);
            // NO FALLBACK DATA - leave results empty
          }
        } else if (market === 'crypto') {
          // Use alternative data sources for crypto to avoid CORS proxy overload
          const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
          
          // Try to get cached data first
          const cachedData = JSON.parse(localStorage.getItem('crypto_prices') || '{}');
          const cacheAge = JSON.parse(localStorage.getItem('crypto_prices_timestamp') || '0');
          const isCacheValid = Date.now() - cacheAge < 300000; // 5 minute cache (increased)
          
          if (isCacheValid && Object.keys(cachedData).length > 0) {
            console.log('✅ Using cached crypto data');
            results = cachedData;
          } else {
            // Use CoinGecko API as primary source (no CORS issues)
            try {
              console.log('🔄 Fetching crypto data from CoinGecko API...');
              const coinGeckoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,cardano,ripple,solana,polkadot,dogecoin,avalanche-2,chainlink,litecoin,stellar,filecoin,aave&vs_currencies=usd');
              
              if (coinGeckoResponse.ok) {
                const coinGeckoData = await coinGeckoResponse.json();
                
                // Map CoinGecko data to our symbols
                const symbolMap: { [key: string]: string } = {
                  'BTC/USD': 'bitcoin',
                  'ETH/USD': 'ethereum', 
                  'BNB/USD': 'binancecoin',
                  'ADA/USD': 'cardano',
                  'XRP/USD': 'ripple',
                  'SOL/USD': 'solana',
                  'DOT/USD': 'polkadot',
                  'DOGE/USD': 'dogecoin',
                  'AVAX/USD': 'avalanche-2',
                  'LINK/USD': 'chainlink',
                  'LTC/USD': 'litecoin',
                  'XLM/USD': 'stellar',
                  'FIL/USD': 'filecoin',
                  'AAVE/USD': 'aave'
                };
                
                for (const symbol of selectedSymbols) {
                  const coinId = symbolMap[symbol];
                  if (coinId && coinGeckoData[coinId]?.usd) {
                    results[symbol] = {
                      price: coinGeckoData[coinId].usd,
                      provider: 'CoinGecko',
                      timestamp: new Date().toISOString()
                    };
                  }
                }
                
                console.log(`✅ CoinGecko data fetched: ${Object.keys(results).length} symbols`);
              }
            } catch (coinGeckoError) {
              console.warn('CoinGecko API failed, trying Binance with heavy rate limiting:', coinGeckoError);
              
              // Fallback to Binance with very heavy rate limiting
              for (let i = 0; i < selectedSymbols.length; i++) {
                const symbol = selectedSymbols[i];
                try {
                  // Convert symbol format (e.g., BTC/USD -> BTCUSDT)
                  const baseSymbol = symbol.split('/')[0];
                  const binanceSymbol = baseSymbol + 'USDT';
                  
                  // Use multiple CORS proxies to distribute load
                  const proxies = [
                    'https://api.allorigins.win/raw?url=',
                    'https://corsproxy.io/?',
                    'https://thingproxy.freeboard.io/fetch/'
                  ];
                  
                  const proxyUrl = proxies[i % proxies.length] + encodeURIComponent(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
                  const response = await fetch(proxyUrl);
                  
                  if (response.ok) {
                    const data = await response.json();
                    // Handle CORS proxy response format
                    const priceData = data.contents ? JSON.parse(data.contents) : data;
                    if (priceData.price) {
                      results[symbol] = { 
                        price: parseFloat(priceData.price),
                        provider: 'Binance',
                        timestamp: new Date().toISOString()
                      };
                    }
                  }
                } catch (error) {
                  console.warn(`Failed to fetch ${symbol}:`, error);
                }
                
                // Heavy delay between requests to avoid overwhelming proxies
                if (i < selectedSymbols.length - 1) {
                  await delay(2000); // 2 second delay between requests
                }
              }
            }
            
            // Cache the results
            if (Object.keys(results).length > 0) {
              localStorage.setItem('crypto_prices', JSON.stringify(results));
              localStorage.setItem('crypto_prices_timestamp', JSON.stringify(Date.now()));
            }
            
            console.log('✅ Crypto data fetch completed');
          }
        } else if (market === 'stocks') {
          // Use real yfinance service for stocks data - NO FALLBACK DATA
          try {
            const bulkData = await realYfinanceService.fetchBulkRealPrices(selectedSymbols, true); // Force refresh
            
            if (bulkData.success && bulkData.data.length > 0) {
              for (const item of bulkData.data) {
                if (item.symbol && item.price) {
                  results[item.symbol] = { 
                    price: item.price,
                    provider: item.provider,
                    timestamp: item.timestamp
                  };
                }
              }
              console.log(`✅ Real stocks data fetched: ${bulkData.count} symbols successful`);
            } else {
              console.warn('No real stocks data available');
            }
          } catch (yfinanceError) {
            console.error('Real yfinance service failed for stocks:', yfinanceError);
            // NO FALLBACK DATA - leave results empty
          }
        }
        
        // Process the results
        processResults(results);
        
      } catch (error: any) {
        console.error('Data fetching failed:', error);
        setError(`Failed to fetch prices: ${error.message}`);
        // NO FALLBACK DATA - leave prices empty
      } finally {
        setLoading(false);
      }
    };

    const processResults = (results: any) => {
      const newPrices: Record<string, PriceData> = {};
      let successCount = 0;
      
      for (const symbol of selectedSymbols) {
        if (results[symbol] && results[symbol].price && !isNaN(results[symbol].price)) {
          newPrices[symbol] = {
            price: parseFloat(results[symbol].price.toFixed(symbol.includes('JPY') ? 3 : 5)),
            provider: results[symbol].provider || 'unknown',
            timestamp: results[symbol].timestamp || new Date().toISOString()
          };
          successCount++;
        }
      }
      
      if (successCount > 0) {
        setPrices(newPrices);
        setError(null);
      } else {
        setError('No valid price data received');
        setPrices({}); // Clear prices if no valid data
      }
    };

    fetchPrices();
    
    // Set up interval for regular updates
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedSymbols, market]);

  if (loading && Object.keys(prices).length === 0) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading prices...</span>
      </div>
    );
  }

  if (error && Object.keys(prices).length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 mb-2">⚠️ {error}</div>
        <div className="text-sm text-gray-500">Using fallback data</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {selectedSymbols.map(symbol => {
        const priceData = prices[symbol];
        if (!priceData) return null;
        
        return (
          <div key={symbol} className="bg-white rounded-lg shadow-md p-4 border">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-800">{symbol}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                priceData.provider === 'yfinance-proxy' ? 'bg-green-100 text-green-800' :
                priceData.provider === 'binance' ? 'bg-blue-100 text-blue-800' :
                priceData.provider === 'fallback' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {priceData.provider}
              </span>
            </div>
            
            {priceData.error ? (
              <div className="text-red-500 text-sm">{priceData.error}</div>
            ) : (
              <div className="text-2xl font-bold text-gray-900">
                {priceData.price.toFixed(symbol.includes('JPY') ? 3 : 5)}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              {new Date(priceData.timestamp).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LivePriceFeed;
