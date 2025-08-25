import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { Signal, TradeOutcome } from '../trading/types';
import api from '../api';

// WebSocket connection manager
const useWebSocket = (url: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000; // 5 seconds

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    console.log(`Connecting to WebSocket at: ${url}`);
    
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: reconnectDelay,
      forceNew: true,
      timeout: 20000,
    });

    socketRef.current.on('connect', () => {
      console.log('WebSocket connected successfully');
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
      setIsConnected(false);
      
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        // Manual disconnection, don't reconnect
        return;
      }
      
      // Attempt to reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
        console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connect();
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        console.log('Cleaning up WebSocket connection');
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [url, reconnectAttempts]);

  useEffect(() => {
    connect();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  return { socket: socketRef.current, isConnected };
};

interface SignalCardProps {
  signal: Signal;
  isTaken: boolean;
  isSkipped: boolean;
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}

const SignalCardComponent: React.FC<SignalCardProps> = ({ 
  signal, 
  isTaken, 
  isSkipped, 
  onMarkAsTaken, 
  onAddToJournal, 
  onChatWithNexus 
}) => {
  const formatTakeProfit = (tp: any) => {
    if (Array.isArray(tp)) {
      return tp.join(', ');
    }
    return tp;
  };

  return (
    <div className={`signal-card bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700 mb-4 ${isTaken ? 'border-green-500' : ''} ${isSkipped ? 'border-red-500' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-white">{signal.pair} - {signal.type?.toUpperCase() || signal.direction}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          signal.type?.toLowerCase() === 'buy' || signal.direction?.toLowerCase() === 'buy' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          {signal.type?.toUpperCase() || signal.direction}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm">Entry Price</p>
          <p className="text-white font-semibold">{signal.entry || signal.entryPrice}</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Stop Loss</p>
          <p className="text-white font-semibold">{signal.stopLoss}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-400 text-sm">Take Profit</p>
          <p className="text-white font-semibold">{formatTakeProfit(signal.takeProfit)}</p>
        </div>
      </div>

      {signal.analysis && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm">Analysis</p>
          <p className="text-gray-300 text-sm">{signal.analysis}</p>
        </div>
      )}

      {signal.ictConcepts && signal.ictConcepts.length > 0 && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-2">ICT Concepts</p>
          <div className="flex flex-wrap gap-2">
            {signal.ictConcepts.map((concept: string, index: number) => (
              <span key={index} className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs">
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="signal-actions flex flex-wrap gap-2">
        {!isTaken && !isSkipped && (
          <>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Target Hit')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              Mark as Won
            </button>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Stop Loss Hit')}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Mark as Lost
            </button>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Breakeven')}
              className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
            >
              Break Even
            </button>
          </>
        )}
        <button 
          onClick={() => onAddToJournal(signal)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          Add to Journal
        </button>
        <button 
          onClick={() => onChatWithNexus(signal)}
          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
        >
          Chat with Nexus
        </button>
      </div>
      
      {isTaken && (
        <div className="mt-3 p-2 bg-green-600/20 border border-green-500/30 rounded text-green-300 text-sm">
          ✅ Signal taken
        </div>
      )}
      
      {isSkipped && (
        <div className="mt-3 p-2 bg-red-600/20 border border-red-500/30 rounded text-red-300 text-sm">
          ❌ Signal skipped
        </div>
      )}
    </div>
  );
};

interface SignalsFeedProps {
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}

const SignalsFeed: React.FC<SignalsFeedProps> = ({ onMarkAsTaken, onAddToJournal, onChatWithNexus }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [takenSignalIds, setTakenSignalIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const signalsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  const socketUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
  const { socket, isConnected } = useWebSocket(socketUrl);
  const connectionStatus = isConnected ? 'connected' : 'disconnected';
  
  // Calculate pagination values
  const paginatedSignals = useMemo(() => {
    const startIndex = (currentPage - 1) * signalsPerPage;
    return signals.slice(startIndex, startIndex + signalsPerPage);
  }, [signals, currentPage, signalsPerPage]);
  
  const totalPages = Math.ceil(signals.length / signalsPerPage);
  
  // Update connection status when WebSocket connection state changes
  useEffect(() => {
    console.log(`WebSocket connection status: ${connectionStatus}`);
  }, [isConnected, connectionStatus]);
  
  // Handle WebSocket messages
  useEffect(() => {
    if (!socket) return;
    
    const handleNewSignal = (newSignals: Signal[]) => {
      setSignals(prevSignals => {
        const existingSignalIds = new Set(prevSignals.map(s => s.id));
        const uniqueNewSignals = newSignals.filter(s => !existingSignalIds.has(s.id));

        if (uniqueNewSignals.length > 0) {
          console.log(`Received ${uniqueNewSignals.length} new unique signals.`);
          return [...uniqueNewSignals, ...prevSignals];
        }

        return prevSignals;
      });
    };
    
    socket.on('newSignal', handleNewSignal);
    
    return () => {
      socket.off('newSignal', handleNewSignal);
    };
  }, [socket]);

  // Fetch initial signals
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/signals');
        setSignals(response.data);
      } catch (err) {
        setError('Failed to fetch signals');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSignals();
  }, []);
  
  // Handle marking signal as taken
  const handleMarkAsTaken = (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    onMarkAsTaken(signal, outcome, pnl);
    setTakenSignalIds(prev => [...prev, signal.id]);
  };
  
  // Handle adding signal to journal
  const handleAddToJournal = (signal: Signal) => {
    onAddToJournal(signal);
  };
  
  // Handle chat with Nexus
  const handleChatWithNexus = (signal: Signal) => {
    onChatWithNexus(signal);
  };

  // Render signals list
  if (isLoading) {
    return <div>Loading signals...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (signals.length === 0) {
    return <div>No signals available</div>;
  }
  
  return (
    <div className="signals-feed">
      <div className="connection-status">
        Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <div className="signals-list">
        {paginatedSignals.map(signal => (
          <SignalCardComponent
            key={signal.id}
            signal={signal}
            isTaken={takenSignalIds.includes(signal.id)}
            isSkipped={false}
            onMarkAsTaken={handleMarkAsTaken}
            onAddToJournal={handleAddToJournal}
            onChatWithNexus={handleChatWithNexus}
          />
        ))}
        
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
      
      <style>
        {`
          .signals-feed {
            max-width: 800px;
            margin: 0 auto;
            padding: 1rem;
          }
          
          .connection-status {
            margin-bottom: 1rem;
            padding: 0.5rem;
            background: #f5f5f5;
            border-radius: 4px;
            text-align: center;
          }
          
          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-top: 1rem;
          }
          
          button {
            padding: 0.5rem 1rem;
            background: #0070f3;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          
          button:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
        `}
      </style>
    </div>
  );
};

export default SignalsFeed;
