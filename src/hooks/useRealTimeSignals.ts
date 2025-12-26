import { useState, useEffect, useCallback, useRef } from 'react';
import { Signal } from '../trading/types';
import realTimeSignalService from '../services/realTimeSignalService';

interface UseRealTimeSignalsOptions {
  autoConnect?: boolean;
  enableCache?: boolean;
}

interface UseRealTimeSignalsReturn {
  signals: Signal[];
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearCache: () => void;
  ping: () => void;
}

export const useRealTimeSignals = (options: UseRealTimeSignalsOptions = {}): UseRealTimeSignalsReturn => {
  const { autoConnect = true, enableCache = true } = options;
  
  const [signals, setSignals] = useState<Signal[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mountedRef = useRef(true);

  // Load cached signals on mount
  useEffect(() => {
    if (enableCache) {
      const cachedSignals = realTimeSignalService.getCachedSignals();
      setSignals(cachedSignals);
    }
  }, [enableCache]);

  // Set up service callbacks
  useEffect(() => {
    realTimeSignalService.setCallbacks({
      onNewSignal: (signal: Signal) => {
        if (!mountedRef.current) return;
        
        setSignals(prevSignals => {
          // Check if signal already exists to prevent duplicates
          const exists = prevSignals.some(s => s.id === signal.id);
          if (exists) {
            return prevSignals;
          }
          
          // Add new signal to the beginning of the list
          return [signal, ...prevSignals];
        });
      },
      
      onSignalUpdate: (signal: Signal) => {
        if (!mountedRef.current) return;
        
        setSignals(prevSignals => 
          prevSignals.map(s => s.id === signal.id ? signal : s)
        );
      },
      
      onConnected: () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
      },
      
      onDisconnected: () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
      },
      
      onError: (error: Error) => {
        if (!mountedRef.current) return;
        setError(error.message);
        setIsConnecting(false);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !isConnected && !isConnecting) {
      connect();
    }
  }, [autoConnect, isConnected, isConnecting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const connect = useCallback(async (): Promise<void> => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setError(null);
    
    try {
      await realTimeSignalService.connect();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect';
      setError(errorMessage);
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting]);

  const disconnect = useCallback((): void => {
    realTimeSignalService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  const clearCache = useCallback((): void => {
    realTimeSignalService.clearCache();
    setSignals([]);
  }, []);

  const ping = useCallback((): void => {
    realTimeSignalService.ping();
  }, []);

  return {
    signals,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    clearCache,
    ping
  };
};
