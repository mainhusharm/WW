import { useState, useEffect, useCallback } from 'react';
import { ForexData, ForexPair } from '../services/renderForexService';

interface UseRenderForexOptions {
  symbols?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseRenderForexReturn {
  data: ForexData[];
  pairs: ForexPair[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  subscribe: (symbols: string[]) => void;
  unsubscribe: () => void;
}

export const useRenderForex = (options: UseRenderForexOptions = {}): UseRenderForexReturn => {
  const {
    symbols = [],
    autoRefresh = true,
    refreshInterval = 5000
  } = options;

  const [data, setData] = useState<ForexData[]>([]);
  const [pairs, setPairs] = useState<ForexPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  const fetchPairs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically call the actual API
      // For now, using mock data
      const mockPairs: ForexPair[] = [
        { base: 'EUR', quote: 'USD', symbol: 'EUR/USD', name: 'Euro / US Dollar', category: 'major' },
        { base: 'GBP', quote: 'USD', symbol: 'GBP/USD', name: 'British Pound / US Dollar', category: 'major' },
        { base: 'USD', quote: 'JPY', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', category: 'major' },
        { base: 'USD', quote: 'CHF', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', category: 'major' },
        { base: 'AUD', quote: 'USD', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', category: 'major' },
        { base: 'USD', quote: 'CAD', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', category: 'major' },
        { base: 'NZD', quote: 'USD', symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', category: 'major' }
      ];
      
      setPairs(mockPairs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forex pairs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (symbols.length === 0) return;

    try {
      setError(null);
      
      // This would typically call the actual API
      // For now, using mock data
      const mockData: ForexData[] = symbols.map(symbol => ({
        symbol,
        bid: Math.random() * 2 + 0.5,
        ask: Math.random() * 2 + 0.5,
        spread: Math.random() * 0.01,
        change: (Math.random() - 0.5) * 0.1,
        changePercent: (Math.random() - 0.5) * 2,
        high: Math.random() * 2 + 0.5,
        low: Math.random() * 2 + 0.5,
        volume: Math.random() * 1000000,
        timestamp: new Date().toISOString()
      }));
      
      setData(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch forex data');
    }
  }, [symbols]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const subscribe = useCallback((newSymbols: string[]) => {
    if (wsConnection) {
      wsConnection.close();
    }

    // Mock WebSocket connection
    const mockWs = {
      send: (data: string) => console.log('Mock WS send:', data),
      close: () => console.log('Mock WS close'),
      onmessage: null,
      onerror: null,
      onclose: null
    } as any;

    setWsConnection(mockWs);

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (newSymbols.length > 0) {
        const update: ForexData = {
          symbol: newSymbols[Math.floor(Math.random() * newSymbols.length)],
          bid: Math.random() * 2 + 0.5,
          ask: Math.random() * 2 + 0.5,
          spread: Math.random() * 0.01,
          change: (Math.random() - 0.5) * 0.1,
          changePercent: (Math.random() - 0.5) * 2,
          high: Math.random() * 2 + 0.5,
          low: Math.random() * 2 + 0.5,
          volume: Math.random() * 1000000,
          timestamp: new Date().toISOString()
        };

        setData(prevData => 
          prevData.map(item => 
            item.symbol === update.symbol ? update : item
          )
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [wsConnection]);

  const unsubscribe = useCallback(() => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
  }, [wsConnection]);

  // Initial data fetch
  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [wsConnection]);

  return {
    data,
    pairs,
    loading,
    error,
    refresh,
    subscribe,
    unsubscribe
  };
};

export default useRenderForex;
