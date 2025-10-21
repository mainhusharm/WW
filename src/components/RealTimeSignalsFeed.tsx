/**
 * Real-time Signals Feed Component
 * Displays signals with real-time updates via Socket.IO
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, Target, Shield, 
  AlertCircle, CheckCircle, XCircle, RefreshCw, 
  Wifi, WifiOff, Activity, Zap
} from 'lucide-react';
import { Signal } from '../trading/types';
import { useUser } from '../contexts/UserContext';
import realTimeSignalService from '../services/realTimeSignalService';
import signalApiService, { Signal as ApiSignal } from '../services/signalApiService';

interface RealTimeSignalsFeedProps {
  onMarkAsTaken?: (signal: Signal) => void;
  onAddToJournal?: (signal: Signal) => void;
  onChatWithNexus?: (signal: Signal) => void;
}

const RealTimeSignalsFeed: React.FC<RealTimeSignalsFeedProps> = ({ 
  onMarkAsTaken, 
  onAddToJournal, 
  onChatWithNexus 
}) => {
  const { user } = useUser();
  const [signals, setSignals] = useState<Signal[]>([]);
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

  // Transform API signal to frontend signal format
  const transformApiSignal = useCallback((apiSignal: ApiSignal): Signal => {
    return {
      id: apiSignal.id,
      symbol: apiSignal.symbol,
      action: apiSignal.side.toUpperCase() as 'BUY' | 'SELL',
      entryPrice: apiSignal.entry_price,
      stopLoss: apiSignal.stop_loss,
      takeProfit: apiSignal.take_profit,
      timeframe: apiSignal.payload?.timeframe || '1H',
      status: apiSignal.status,
      createdAt: apiSignal.created_at,
      description: apiSignal.payload?.analysis || '',
      confidence: apiSignal.payload?.confidence || 85,
      rrRatio: apiSignal.rr_ratio ? `1:${apiSignal.rr_ratio.toFixed(1)}` : '1:2.0',
      analysis: apiSignal.payload?.analysis || 'Professional signal analysis',
      riskTier: apiSignal.risk_tier
    };
  }, []);

  // Fallback function to fetch signals when main API fails
  const fetchSignalsFallback = useCallback(async (riskTier: string) => {
    // NO PREFILLED DATA - Only return empty state
    // Signals will only come from admin dashboard via real-time system
    console.log('API unavailable - no signals available until admin creates them');
    
    return {
      success: true,
      signals: [], // EMPTY - no prefilled data
      count: 0,
      user_risk_tier: riskTier,
      filters: {
        limit: 100,
        since: null,
        include_delivered: false
      }
    };
  }, []);

  // Fetch initial signals from API
  const fetchInitialSignals = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Try the main API first
        let response;
        try {
          response = await signalApiService.getUserSignals({ 
            limit: 100, 
            risk_tier: user?.risk_tier || 'medium' 
          });
        } catch (apiError) {
          console.warn('Main API failed, trying fallback:', apiError);
          // Fallback to direct fetch with real signal data
          response = await fetchSignalsFallback(user?.risk_tier || 'medium');
        }
      
      if (response.success) {
        const transformedSignals = response.signals.map(transformApiSignal);
        setSignals(transformedSignals);
        setLastUpdate(new Date());
        
        // Update stats
        setStats(prev => ({
          ...prev,
          total: response.count,
          delivered: response.signals.filter(s => s.delivered).length
        }));
      }
    } catch (err) {
      console.error('Error fetching initial signals:', err);
      setError('Failed to load signals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [transformApiSignal, user?.risk_tier, fetchSignalsFallback]);

  // Fetch signal statistics
  const fetchStats = useCallback(async () => {
    try {
      let response;
      try {
        response = await signalApiService.getUserSignalStats(user?.risk_tier || 'medium');
      } catch (apiError) {
        console.warn('Main API failed for stats, using fallback:', apiError);
        // Use fallback data for stats
        const fallbackData = await fetchSignalsFallback(user?.risk_tier || 'medium');
        response = {
          success: true,
          stats: {
            total_signals: fallbackData.count,
            delivered_signals: fallbackData.count,
            recent_signals_7d: fallbackData.count,
            user_risk_tier: fallbackData.user_risk_tier,
            latest_signal: fallbackData.signals[0] || null
          }
        };
      }
      
      if (response.success) {
        setStats(prev => ({
          ...prev,
          total: response.stats.total_signals,
          delivered: response.stats.delivered_signals,
          recent: response.stats.recent_signals_7d
        }));
      }
    } catch (err) {
      console.error('Error fetching signal stats:', err);
    }
  }, [user?.risk_tier, fetchSignalsFallback]);

  // Handle new signal from Socket.IO
  const handleNewSignal = useCallback((newSignal: Signal) => {
    setSignals(prevSignals => {
      const existingSignalIds = new Set(prevSignals.map(s => s.id));
      
      if (!existingSignalIds.has(newSignal.id)) {
        console.log(`Received new unique signal: ${newSignal.id}`);
        
        // Mark as delivered since we received it via WebSocket
        signalApiService.markSignalDelivered(newSignal.id).catch(console.error);
        
        setLastUpdate(new Date());
        return [newSignal, ...prevSignals];
      }

      return prevSignals;
    });
  }, []);

  // Setup Socket.IO connection
  useEffect(() => {
    if (!user?.token) return;

    // Set token for Socket.IO service
    realTimeSignalService.setToken(user.token);

    // Set callbacks
    realTimeSignalService.setCallbacks({
      onSignalReceived: handleNewSignal,
      onConnected: () => {
        setConnectionStatus('connected');
        console.log('Real-time signals connected');
      },
      onDisconnected: () => {
        setConnectionStatus('disconnected');
        console.log('Real-time signals disconnected');
      },
      onError: (error) => {
        console.error('Real-time signals error:', error);
        setConnectionStatus('disconnected');
      }
    });

    // Connect to Socket.IO
    realTimeSignalService.connect()
      .then(() => {
        setConnectionStatus('connected');
      })
      .catch((error) => {
        console.error('Failed to connect to real-time signals:', error);
        setConnectionStatus('disconnected');
      });

    // Cleanup on unmount
    return () => {
      realTimeSignalService.disconnect();
    };
  }, [user?.token, handleNewSignal]);

  // Fetch initial data
  useEffect(() => {
    fetchInitialSignals();
    fetchStats();
  }, [fetchInitialSignals, fetchStats]);

  // Update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectionStatus(realTimeSignalService.getConnectionStatus());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getActionIcon = (action: string) => {
    return action === 'BUY' ? 
      <TrendingUp className="w-5 h-5 text-green-400" /> : 
      <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  const getActionColor = (action: string) => {
    return action === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  const getRiskTierColor = (riskTier: string) => {
    switch (riskTier?.toLowerCase()) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Wifi className="w-4 h-4 text-green-400" />;
      case 'connecting': return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'disconnected': return <WifiOff className="w-4 h-4 text-red-400" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-gray-300">Loading signals...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
        <button 
            onClick={fetchInitialSignals}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          Retry
        </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Stats and Connection Status */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Real-time Signals</h2>
            <div className="flex items-center space-x-2">
              {getConnectionIcon()}
              <span className="text-sm text-gray-400 capitalize">{connectionStatus}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            {lastUpdate && (
              <span>Last update: {formatTimeAgo(lastUpdate.toISOString())}</span>
            )}
            <button 
              onClick={fetchInitialSignals}
              className="flex items-center space-x-1 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Signals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.delivered}</div>
            <div className="text-sm text-gray-400">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.recent}</div>
            <div className="text-sm text-gray-400">Recent (7d)</div>
          </div>
          </div>
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
                  {getActionIcon(signal.action)}
                  <div>
                    <h3 className="font-semibold text-white">{signal.symbol}</h3>
                    <p className={`text-sm font-medium ${getActionColor(signal.action)}`}>
                      {signal.action}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskTierColor(signal.riskTier)}`}>
                    {signal.riskTier?.toUpperCase() || 'MEDIUM'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(signal.createdAt)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-400">Entry</div>
                  <div className="font-semibold text-white">${signal.entryPrice.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Stop Loss</div>
                  <div className="font-semibold text-red-400">${signal.stopLoss.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Take Profit</div>
                  <div className="font-semibold text-green-400">${signal.takeProfit.toFixed(4)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <span>R:R {signal.rrRatio}</span>
                  <span>Confidence: {signal.confidence}%</span>
                  <span>{signal.timeframe}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {onMarkAsTaken && (
                    <button 
                      onClick={() => onMarkAsTaken(signal)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                    >
                      Mark Taken
                    </button>
                  )}
                  {onAddToJournal && (
                    <button 
                      onClick={() => onAddToJournal(signal)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
                    >
                      Add to Journal
            </button>
                  )}
                </div>
              </div>

              {signal.analysis && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <p className="text-sm text-gray-300">{signal.analysis}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          >
            Next
          </button>
      </div>
      )}
    </div>
  );
};

export default RealTimeSignalsFeed;