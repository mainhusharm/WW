import React, { useState, useEffect, useCallback } from 'react';

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

interface YahooFinanceServiceProps {
  onDataUpdate: (data: { prices: Record<string, PriceData>; historical: Record<string, HistoricalData[]> }) => void;
  symbols: string[];
  updateInterval?: number;
}

const YahooFinanceService: React.FC<YahooFinanceServiceProps> = ({ 
  onDataUpdate, 
  symbols, 
  updateInterval = 30000 
}) => {
  const [isActive, setIsActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const baseUrl = 'https://forex-data-service.onrender.com';

  const fetchPriceData = useCallback(async (symbol: string): Promise<PriceData> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}/api/forex-price?pair=${symbol}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.price && !isNaN(data.price)) {
        return {
          price: parseFloat(data.price.toFixed(5)),
          provider: 'yfinance',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('Invalid price data received');

    } catch (error: any) {
      console.warn(`Price fetch failed for ${symbol}:`, error.message);
      return {
        price: 0,
        provider: 'yfinance',
        timestamp: new Date().toISOString(),
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      };
    }
  }, [baseUrl]);

  const fetchHistoricalData = useCallback(async (symbol: string, timeframe: string = '1h'): Promise<HistoricalData[]> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${baseUrl}/api/forex-data?pair=${symbol}&timeframe=${timeframe}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (Array.isArray(data) && data.length > 0) {
        return data.map((bar: any) => ({
          time: bar.time,
          open: parseFloat(bar.open),
          high: parseFloat(bar.high),
          low: parseFloat(bar.low),
          close: parseFloat(bar.close),
          volume: bar.volume ? parseFloat(bar.volume) : undefined
        }));
      }

      return [];

    } catch (error: any) {
      console.warn(`Historical data fetch failed for ${symbol}:`, error.message);
      return [];
    }
  }, [baseUrl]);

  const fetchAllData = useCallback(async () => {
    if (!isActive || symbols.length === 0) return;

    console.log(`Fetching data for ${symbols.length} symbols from Yahoo Finance...`);
    
    const newErrors: string[] = [];
    const prices: Record<string, PriceData> = {};
    const historical: Record<string, HistoricalData[]> = {};

    // Fetch prices for all symbols
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const priceData = await fetchPriceData(symbol);
        prices[symbol] = priceData;
        
        if (priceData.error) {
          newErrors.push(`${symbol}: ${priceData.error}`);
        }
      } catch (error: any) {
        newErrors.push(`${symbol}: ${error.message}`);
        prices[symbol] = {
          price: 0,
          provider: 'yfinance',
          timestamp: new Date().toISOString(),
          error: error.message
        };
      }
    });

    // Fetch historical data for all symbols
    const historicalPromises = symbols.map(async (symbol) => {
      try {
        const histData = await fetchHistoricalData(symbol);
        historical[symbol] = histData;
        
        if (histData.length === 0) {
          newErrors.push(`${symbol}: No historical data available`);
        }
      } catch (error: any) {
        newErrors.push(`${symbol}: Historical data error - ${error.message}`);
        historical[symbol] = [];
      }
    });

    // Wait for all requests to complete
    await Promise.all([...pricePromises, ...historicalPromises]);

    setErrors(newErrors);
    setLastUpdate(new Date());
    
    // Update parent component with new data
    onDataUpdate({ prices, historical });

    const successCount = Object.values(prices).filter(p => !p.error).length;
    console.log(`Yahoo Finance update complete: ${successCount}/${symbols.length} successful`);

  }, [symbols, isActive, fetchPriceData, fetchHistoricalData, onDataUpdate]);

  // Initial fetch and interval setup
  useEffect(() => {
    if (symbols.length === 0) return;

    fetchAllData();

    const interval = setInterval(fetchAllData, updateInterval);
    return () => clearInterval(interval);
  }, [fetchAllData, updateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => setIsActive(false);
  }, []);

  return (
    <div className="yahoo-finance-service">
      {/* Service Status Indicator */}
      <div className="flex items-center space-x-2 text-xs text-gray-400 mb-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span>Yahoo Finance Service</span>
        {lastUpdate && (
          <span>• Last update: {lastUpdate.toLocaleTimeString()}</span>
        )}
      </div>

      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-3 mb-4">
          <div className="text-red-400 text-sm font-semibold mb-2">
            Data Fetch Issues ({errors.length}):
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {errors.slice(0, 5).map((error, index) => (
              <div key={index} className="text-red-300 text-xs">
                • {error}
              </div>
            ))}
            {errors.length > 5 && (
              <div className="text-red-400 text-xs">
                ... and {errors.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YahooFinanceService;
