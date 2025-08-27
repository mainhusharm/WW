import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { Signal, TradeOutcome } from '../trading/types';
import api from '../api';
import { Star, TrendingUp, TrendingDown, Play, Pause, RefreshCw, Database, BarChart3 } from 'lucide-react';

// WebSocket connection manager
const useWebSocket = (url: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 5000;

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
        return;
      }
      
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
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcome, setOutcome] = useState<TradeOutcome>('win');
  const [pnl, setPnl] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const handleMarkAsTaken = () => {
    onMarkAsTaken(signal, outcome, pnl);
    setShowOutcomeModal(false);
    setOutcome('win');
    setPnl(0);
    setNotes('');
  };

  const getSignalIcon = (signalType: string) => {
    switch (signalType.toLowerCase()) {
      case 'buy':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'sell':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType.toLowerCase()) {
      case 'buy':
        return 'border-green-500 bg-green-50';
      case 'sell':
        return 'border-red-500 bg-red-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  return (
    <div className={`relative border-2 rounded-lg p-4 mb-4 ${getSignalColor(signal.signal_type)} transition-all hover:shadow-lg`}>
      {/* Recommended Badge */}
      {signal.is_recommended && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Star className="w-3 h-3" />
          Recommended
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getSignalIcon(signal.signal_type)}
          <span className="font-semibold text-lg">{signal.pair}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            signal.signal_type.toLowerCase() === 'buy' 
              ? 'bg-green-100 text-green-800' 
              : signal.signal_type.toLowerCase() === 'sell'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {signal.signal_type.toUpperCase()}
          </span>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {new Date(signal.timestamp).toLocaleString()}
          </div>
          {signal.signal_strength && (
            <div className="text-xs text-gray-500">
              Strength: {signal.signal_strength.toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <label className="text-xs text-gray-600">Entry Price</label>
          <div className="font-semibold">${signal.entry_price?.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <label className="text-xs text-gray-600">Stop Loss</label>
          <div className="font-semibold text-red-600">${signal.stop_loss?.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <label className="text-xs text-gray-600">Take Profit</label>
          <div className="font-semibold text-green-600">${signal.take_profit?.toFixed(2) || 'N/A'}</div>
        </div>
        <div>
          <label className="text-xs text-gray-600">Risk/Reward</label>
          <div className="font-semibold">
            {signal.entry_price && signal.stop_loss && signal.take_profit 
              ? ((signal.take_profit - signal.entry_price) / (signal.entry_price - signal.stop_loss)).toFixed(2)
              : 'N/A'
            }
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {!isTaken && !isSkipped && (
          <>
            <button
              onClick={() => setShowOutcomeModal(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark as Taken
            </button>
            <button
              onClick={() => onMarkAsTaken(signal, 'skipped')}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Skip
            </button>
          </>
        )}
        
        {isTaken && (
          <div className="flex-1 text-center py-2 px-4 bg-green-100 text-green-800 rounded-lg">
            ✓ Trade Completed
          </div>
        )}
        
        {isSkipped && (
          <div className="flex-1 text-center py-2 px-4 bg-gray-100 text-gray-600 rounded-lg">
            ⏭ Trade Skipped
          </div>
        )}
        
        <button
          onClick={() => onAddToJournal(signal)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Journal
        </button>
        
        <button
          onClick={() => onChatWithNexus(signal)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Chat
        </button>
      </div>

      {/* Outcome Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Trade Outcome</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as TradeOutcome)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="win">Win</option>
                <option value="loss">Loss</option>
                <option value="breakeven">Breakeven</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">P&L ($)</label>
              <input
                type="number"
                value={pnl}
                onChange={(e) => setPnl(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="0.00"
                step="0.01"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                placeholder="Add trade notes..."
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleMarkAsTaken}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BotStatus {
  bot_type: string;
  is_active: boolean;
  last_started?: string;
  last_stopped?: string;
}

interface EnhancedSignalsFeedProps {
  onLogout?: () => void;
}

const EnhancedSignalsFeed: React.FC<EnhancedSignalsFeedProps> = ({ onLogout }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'signals' | 'bots' | 'history'>('signals');
  const [userSignals, setUserSignals] = useState<any[]>([]);
  
  const { socket, isConnected } = useWebSocket('ws://localhost:3001');

  // Load signals from API
  const loadSignals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.get('/api/signals');
      if (response.data.success) {
        setSignals(response.data.data);
      } else {
        setError('Failed to load signals');
      }
    } catch (err) {
      console.error('Error loading signals:', err);
      setError('Failed to load signals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load bot status
  const loadBotStatus = useCallback(async () => {
    try {
      const response = await api.get('/api/database/bot-status');
      setBotStatus(response.data);
    } catch (err) {
      console.error('Error loading bot status:', err);
    }
  }, []);

  // Load user signals history
  const loadUserSignals = useCallback(async () => {
    try {
      const response = await api.get('/api/user/signals?user_id=default_user');
      if (response.data.success) {
        setUserSignals(response.data.data);
      }
    } catch (err) {
      console.error('Error loading user signals:', err);
    }
  }, []);

  // Toggle bot status
  const toggleBot = async (botType: string, isActive: boolean) => {
    try {
      const endpoint = isActive ? '/api/bot/stop' : '/api/bot/start';
      const response = await api.post(endpoint, {
        bot_type: botType,
        updated_by: 'user'
      });
      
      if (response.data.success) {
        await loadBotStatus();
      }
    } catch (err) {
      console.error('Error toggling bot:', err);
    }
  };

  // Mark signal as taken
  const handleMarkAsTaken = async (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    try {
      const userSignal = {
        user_id: 'default_user',
        pair: signal.pair,
        signal_type: signal.signal_type,
        result: outcome,
        confidence_pct: signal.signal_strength || 0,
        is_recommended: signal.is_recommended || false,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        pnl: pnl || 0,
        notes: ''
      };

      await api.post('/api/user/signals', userSignal);
      await loadUserSignals();
      
      // Update local signals
      setSignals(prev => prev.map(s => 
        s.id === signal.id ? { ...s, isTaken: true } : s
      ));
    } catch (err) {
      console.error('Error marking signal as taken:', err);
    }
  };

  // Add to journal
  const handleAddToJournal = (signal: Signal) => {
    // Implementation for adding to journal
    console.log('Adding to journal:', signal);
  };

  // Chat with Nexus
  const handleChatWithNexus = (signal: Signal) => {
    // Implementation for chat functionality
    console.log('Chatting with Nexus about:', signal);
  };

  // Load data on mount
  useEffect(() => {
    loadSignals();
    loadBotStatus();
    loadUserSignals();
  }, [loadSignals, loadBotStatus, loadUserSignals]);

  // WebSocket event handlers
  useEffect(() => {
    if (socket) {
      socket.on('new_signal', (newSignal: Signal) => {
        setSignals(prev => [newSignal, ...prev]);
      });

      socket.on('bot_status_update', (updatedBots: BotStatus[]) => {
        setBotStatus(updatedBots);
      });

      return () => {
        socket.off('new_signal');
        socket.off('bot_status_update');
      };
    }
  }, [socket]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={loadSignals}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Signal Feed</h1>
          <p className="text-gray-600">Real-time trading signals with AI-powered recommendations</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <button
            onClick={loadSignals}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('signals')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'signals'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Live Signals ({signals.length})
        </button>
        <button
          onClick={() => setActiveTab('bots')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'bots'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Bot Control ({botStatus.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Trade History ({userSignals.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'signals' && (
        <div>
          {signals.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signals available</h3>
              <p className="text-gray-600">Signals will appear here when bots are active</p>
            </div>
          ) : (
            <div className="space-y-4">
              {signals.map((signal) => (
                <SignalCardComponent
                  key={signal.id}
                  signal={signal}
                  isTaken={false}
                  isSkipped={false}
                  onMarkAsTaken={handleMarkAsTaken}
                  onAddToJournal={handleAddToJournal}
                  onChatWithNexus={handleChatWithNexus}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {botStatus.map((bot) => (
            <div key={bot.bot_type} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize">{bot.bot_type} Bot</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  bot.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {bot.is_active ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-600">
                  Last Started: {bot.last_started ? new Date(bot.last_started).toLocaleString() : 'Never'}
                </div>
                <div className="text-sm text-gray-600">
                  Last Stopped: {bot.last_stopped ? new Date(bot.last_stopped).toLocaleString() : 'Never'}
                </div>
              </div>
              
              <button
                onClick={() => toggleBot(bot.bot_type, bot.is_active)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  bot.is_active
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {bot.is_active ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Stop Bot
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Start Bot
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'history' && (
        <div>
          {userSignals.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trade history</h3>
              <p className="text-gray-600">Your completed trades will appear here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pair
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userSignals.map((signal) => (
                    <tr key={signal.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {signal.pair}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          signal.signal_type.toLowerCase() === 'buy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {signal.signal_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          signal.result === 'win' 
                            ? 'bg-green-100 text-green-800'
                            : signal.result === 'loss'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {signal.result.toUpperCase()}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                        signal.pnl > 0 ? 'text-green-600' : signal.pnl < 0 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        ${signal.pnl?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(signal.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSignalsFeed;
