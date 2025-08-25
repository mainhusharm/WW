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
  return (
    <div className={`signal-card ${isTaken ? 'taken' : ''} ${isSkipped ? 'skipped' : ''}`}>
      <h3>{signal.pair} - {signal.direction}</h3>
      <p>Entry: {signal.entryPrice}</p>
      <p>Stop Loss: {signal.stopLoss}</p>
      <p>Take Profit: {signal.takeProfit}</p>
      
      <div className="signal-actions">
        {!isTaken && !isSkipped && (
          <>
                        <button onClick={() => onMarkAsTaken(signal, 'Target Hit')}>Mark as Won</button>
            <button onClick={() => onMarkAsTaken(signal, 'Stop Loss Hit')}>Mark as Lost</button>
            <button onClick={() => onMarkAsTaken(signal, 'Breakeven')}>Mark as Break Even</button>
          </>
        )}
        <button onClick={() => onAddToJournal(signal)}>Add to Journal</button>
        <button onClick={() => onChatWithNexus(signal)}>Chat with Nexus</button>
      </div>
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
