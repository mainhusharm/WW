import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import { enhancedSignalService } from '../services/enhancedSignalService';
import { Activity, Wifi, WifiOff, RefreshCw, TrendingUp, TrendingDown, Clock, Target, Shield } from 'lucide-react';

interface EnhancedSignalsFeedProps {
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}

const EnhancedSignalsFeed: React.FC<EnhancedSignalsFeedProps> = ({ 
  onMarkAsTaken, 
  onAddToJournal, 
  onChatWithNexus 
}) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [takenSignalIds, setTakenSignalIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    delivered: 0,
    recent: 0
  });
  
  const signalsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calculate pagination values
  const paginatedSignals = useMemo(() => {
    const startIndex = (currentPage - 1) * signalsPerPage;
    return signals.slice(startIndex, startIndex + signalsPerPage);
  }, [signals, currentPage, signalsPerPage]);
  
  const totalPages = Math.ceil(signals.length / signalsPerPage);

  // Initialize enhanced signal service
  useEffect(() => {
    const initializeService = async () => {
      try {
        // Set up callbacks
        enhancedSignalService.setCallbacks({
          onSignalReceived: (newSignal: Signal) => {
            console.log('📡 New signal received:', newSignal);
            setSignals(prevSignals => {
              const existingSignalIds = new Set(prevSignals.map(s => s.id));
              
              if (!existingSignalIds.has(newSignal.id)) {
                return [newSignal, ...prevSignals];
              }
              return prevSignals;
            });
            setLastUpdate(new Date());
          },
          onConnected: () => {
            console.log('✅ Connected to signal service');
            setConnectionStatus('connected');
            setError(null);
          },
          onDisconnected: () => {
            console.log('❌ Disconnected from signal service');
            setConnectionStatus('disconnected');
            // Don't set error on disconnect - just show offline status
          },
          onError: (error: Error) => {
            console.error('❌ Signal service error:', error);
            // Don't show timeout errors to user - they're not actionable
            if (!error.message.includes('timeout') && !error.message.includes('Connection timeout')) {
              setError(error.message);
            } else {
              // For timeout errors, just log and continue with cached signals
              console.log('🔄 Connection timeout - continuing with cached signals');
              setConnectionStatus('disconnected');
            }
          }
        });

        // Initialize the service
        await enhancedSignalService.initialize();
        
        // Load existing persistent signals
        const persistentSignals = enhancedSignalService.getPersistentSignals();
        
        // Only show real signals - no sample/demo signals
        setSignals(persistentSignals);
        
        // Update stats
        const signalStats = enhancedSignalService.getSignalStats();
        setStats(signalStats);
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Failed to initialize signal service:', error);
        // Don't show initialization errors - just continue with cached signals
        console.log('🔄 Continuing with cached signals due to initialization error');
        setConnectionStatus('disconnected');
        setIsLoading(false);
      }
    };

    initializeService();

    // Cleanup on unmount
    return () => {
      enhancedSignalService.disconnect();
    };
  }, []);

  // Update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = enhancedSignalService.getConnectionStatus();
      setConnectionStatus(status);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle marking signal as taken
  const handleMarkAsTaken = useCallback(async (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    try {
      // Update local state
      onMarkAsTaken(signal, outcome, pnl);
      setTakenSignalIds(prev => [...prev, signal.id]);
      
      // Update signal status locally
      setSignals(prev => prev.map(s => 
        s.id === signal.id ? { ...s, status: 'taken', outcome, pnl } : s
      ));
    } catch (error) {
      console.error('Error marking signal as taken:', error);
      // Still update local state even if backend fails
      onMarkAsTaken(signal, outcome, pnl);
      setTakenSignalIds(prev => [...prev, signal.id]);
    }
  }, [onMarkAsTaken]);

  // Handle adding signal to journal
  const handleAddToJournal = useCallback((signal: Signal) => {
    onAddToJournal(signal);
  }, [onAddToJournal]);

  // Handle chat with Nexus
  const handleChatWithNexus = useCallback((signal: Signal) => {
    onChatWithNexus(signal);
  }, [onChatWithNexus]);

  // Refresh signals
  const refreshSignals = useCallback(async () => {
    try {
      setIsLoading(true);
      const persistentSignals = enhancedSignalService.getPersistentSignals();
      setSignals(persistentSignals);
      
      const signalStats = enhancedSignalService.getSignalStats();
      setStats(signalStats);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing signals:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get action icon
  const getActionIcon = (action: string) => {
    if (action?.toLowerCase().includes('buy') || action?.toLowerCase().includes('long')) {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    }
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  // Get action color
  const getActionColor = (action: string) => {
    if (action?.toLowerCase().includes('buy') || action?.toLowerCase().includes('long')) {
      return 'text-green-400';
    }
    return 'text-red-400';
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const signalTime = new Date(timestamp);
    const diffMs = now.getTime() - signalTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Format take profit
  const formatTakeProfit = (tp: any) => {
    if (Array.isArray(tp)) {
      return tp.join(', ');
    }
    return tp;
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-gray-300">Loading signals...</span>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <button 
          onClick={refreshSignals}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="enhanced-signals-feed">
      {/* Header with Connection Status */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Activity className="w-6 h-6 mr-2" />
              Real-time Signals
            </h2>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === 'connected' 
                ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-red-600/20 text-red-400 border border-red-500/30'
            }`}>
              {connectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
          
          <button 
            onClick={refreshSignals}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-gray-400 text-sm">Total Signals</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-white mb-1">{stats.delivered}</div>
            <div className="text-gray-400 text-sm">Delivered</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="text-3xl font-bold text-white mb-1">{stats.recent}</div>
            <div className="text-gray-400 text-sm">Recent (7d)</div>
          </div>
        </div>

        {/* Last Update */}
        {lastUpdate && (
          <div className="text-gray-400 text-sm mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Signals List */}
      {paginatedSignals.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No Signals Available</h3>
          <p className="text-gray-500">
            {connectionStatus === 'connected' 
              ? 'No signals match your risk profile yet. Check back soon!'
              : 'Connect to receive real-time signals.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedSignals.map((signal) => (
            <div 
              key={signal.id} 
              className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-blue-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getActionIcon(signal.direction || signal.action || '')}
                  <div>
                    <h3 className="font-semibold text-white">{signal.pair || signal.symbol}</h3>
                    <p className={`text-sm font-medium ${getActionColor(signal.direction || signal.action || '')}`}>
                      {signal.direction || signal.action}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {signal.is_recommended && (
                    <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                      ⭐ Recommended
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(signal.createdAt || new Date().toISOString())}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-gray-400 text-sm">Entry Price</p>
                  <p className="text-white font-semibold">{signal.entry || signal.entryPrice}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Stop Loss</p>
                  <p className="text-white font-semibold">{signal.stopLoss}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Take Profit</p>
                  <p className="text-white font-semibold">{formatTakeProfit(signal.takeProfit)}</p>
                </div>
              </div>

              {signal.analysis && (
                <div className="mb-3">
                  <p className="text-gray-400 text-sm">Analysis</p>
                  <p className="text-gray-300 text-sm">{signal.analysis}</p>
                </div>
              )}

              {signal.ictConcepts && signal.ictConcepts.length > 0 && (
                <div className="mb-3">
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
              
              <div className="flex flex-wrap gap-2">
                {!takenSignalIds.includes(signal.id) && (
                  <>
                    <button 
                      onClick={() => handleMarkAsTaken(signal, 'Target Hit')}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                    >
                      <Target className="w-4 h-4" />
                      <span>Mark as Won</span>
                    </button>
                    <button 
                      onClick={() => handleMarkAsTaken(signal, 'Stop Loss Hit')}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Mark as Lost</span>
                    </button>
                    <button 
                      onClick={() => handleMarkAsTaken(signal, 'Breakeven')}
                      className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Break Even
                    </button>
                  </>
                )}
                <button 
                  onClick={() => handleAddToJournal(signal)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Add to Journal
                </button>
                <button 
                  onClick={() => handleChatWithNexus(signal)}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors"
                >
                  Chat with Nexus
                </button>
              </div>
              
              {takenSignalIds.includes(signal.id) && (
                <div className="mt-3 p-2 bg-green-600/20 border border-green-500/30 rounded text-green-300 text-sm">
                  ✅ Signal taken
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedSignalsFeed;