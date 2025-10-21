import React, { useState, useEffect } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import { useUser } from '../contexts/UserContext';
import botDataService from '../services/botDataService';

interface AdminConnectedSignalCardProps {
  signal: Signal;
  isTaken: boolean;
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
  userRiskReward?: string;
}

const AdminConnectedSignalCard: React.FC<AdminConnectedSignalCardProps> = ({ 
  signal, 
  isTaken, 
  onMarkAsTaken, 
  onAddToJournal, 
  onChatWithNexus,
  userRiskReward 
}) => {
  const formatTakeProfit = (tp: any) => {
    if (Array.isArray(tp)) {
      return tp.join(', ');
    }
    return tp;
  };

  const calculateRiskReward = () => {
    const entry = parseFloat(signal.entry || signal.entryPrice || '0');
    const stopLoss = parseFloat(signal.stopLoss || '0');
    const takeProfit = parseFloat(Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0');
    
    if (entry && stopLoss && takeProfit) {
      const risk = Math.abs(entry - stopLoss);
      const reward = Math.abs(takeProfit - entry);
      return risk > 0 ? (reward / risk).toFixed(2) : '0';
    }
    return '0';
  };

  const riskReward = calculateRiskReward();
  const matchesUserPreference = userRiskReward ? parseFloat(riskReward) >= parseFloat(userRiskReward) : true;

  return (
    <div className={`signal-card bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border-2 mb-6 transition-all duration-300 hover:scale-[1.02] ${
      isTaken ? 'border-green-500/50 bg-green-900/20' : 
      signal.is_recommended ? 'border-yellow-500/50 bg-yellow-900/10' :
      'border-gray-600/50 hover:border-blue-500/50'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <h3 className="text-2xl font-bold text-white">{signal.pair}</h3>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            signal.direction?.toLowerCase() === 'long' || signal.type?.toLowerCase() === 'buy'
              ? 'bg-green-600/80 text-white' 
              : 'bg-red-600/80 text-white'
          }`}>
            {signal.direction || signal.type?.toUpperCase()}
          </div>
          {signal.is_recommended && (
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold rounded-full flex items-center shadow-lg">
              ⭐ Recommended
            </span>
          )}
          <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs font-semibold">
            📡 FROM ADMIN
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Confidence</div>
          <div className="text-lg font-bold text-blue-400">{signal.confidence}%</div>
        </div>
      </div>
      
      {/* Signal Details Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Entry Price</p>
          <p className="text-white font-bold text-lg">{signal.entry || signal.entryPrice}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Stop Loss</p>
          <p className="text-red-400 font-bold text-lg">{signal.stopLoss}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Take Profit</p>
          <p className="text-green-400 font-bold text-lg">{formatTakeProfit(signal.takeProfit)}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Risk:Reward</p>
          <p className={`font-bold text-lg ${matchesUserPreference ? 'text-green-400' : 'text-yellow-400'}`}>
            1:{riskReward}
          </p>
        </div>
      </div>

      {/* Market Info */}
      <div className="flex items-center space-x-4 mb-4">
        <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded text-xs font-semibold">
          {signal.market?.toUpperCase() || 'FOREX'}
        </span>
        <span className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded text-xs font-semibold">
          {signal.timeframe || '1H'}
        </span>
        {!matchesUserPreference && userRiskReward && (
          <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded text-xs font-semibold">
            Below your {userRiskReward} R:R preference
          </span>
        )}
      </div>

      {/* Analysis */}
      {signal.analysis && (
        <div className="mb-4 p-4 bg-gray-700/30 rounded-lg">
          <p className="text-gray-300 text-sm leading-relaxed">{signal.analysis}</p>
        </div>
      )}

      {/* ICT Concepts */}
      {signal.ictConcepts && signal.ictConcepts.length > 0 && (
        <div className="mb-6">
          <p className="text-gray-400 text-sm mb-3 font-semibold">ICT Concepts</p>
          <div className="flex flex-wrap gap-2">
            {signal.ictConcepts.map((concept: string, index: number) => (
              <span key={index} className="px-3 py-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 text-blue-300 rounded-full text-xs font-medium border border-blue-500/20">
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!isTaken && (
          <>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Target Hit')}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-green-500/25"
            >
              ✅ Mark as Won
            </button>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Stop Loss Hit')}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-red-500/25"
            >
              ❌ Mark as Lost
            </button>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Breakeven')}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-yellow-500/25"
            >
              ⚖️ Break Even
            </button>
          </>
        )}
        <button 
          onClick={() => onAddToJournal(signal)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
        >
          📝 Add to Journal
        </button>
        <button 
          onClick={() => onChatWithNexus(signal)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
        >
          🤖 Chat with Nexus
        </button>
      </div>
      
      {/* Status Indicator */}
      {isTaken && (
        <div className="mt-4 p-3 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-sm font-medium">
          ✅ Signal taken and recorded
        </div>
      )}
      
      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        {signal.timestamp ? new Date(signal.timestamp).toLocaleString() : 'Just now'}
      </div>
    </div>
  );
};

interface AdminConnectedSignalsFeedProps {
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}

const AdminConnectedSignalsFeed: React.FC<AdminConnectedSignalsFeedProps> = ({ 
  onMarkAsTaken, 
  onAddToJournal, 
  onChatWithNexus 
}) => {
  const { user } = useUser();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [takenSignalIds, setTakenSignalIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recommended: 0,
    forex: 0,
    crypto: 0
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [adminSignalsCount, setAdminSignalsCount] = useState(0);
  
  // Get user's risk-reward preference
  const userRiskReward = user?.tradingData?.riskRewardRatio || '2';
  
  // Fetch signals from admin dashboard
  useEffect(() => {
    const fetchAdminSignals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching signals from admin dashboard...');
        
        // Try multiple endpoints to get admin signals
        const endpoints = [
          'https://backend-bkt7.onrender.com/api/signals/admin',
          'https://backend-bkt7.onrender.com/api/admin/forex/signals',
          'https://backend-bkt7.onrender.com/api/admin/crypto/signals'
        ];
        
        let adminSignals: any[] = [];
        
        for (const endpoint of endpoints) {
          try {
            const response = await fetch(endpoint, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
              mode: 'cors'
            });
            
            if (response.ok) {
              const data = await response.json();
              console.log(`Response from ${endpoint}:`, data);
              
              if (data.success && Array.isArray(data.signals)) {
                adminSignals = [...adminSignals, ...data.signals];
                console.log(`Found ${data.signals.length} signals from ${endpoint}`);
              } else if (Array.isArray(data)) {
                adminSignals = [...adminSignals, ...data];
                console.log(`Found ${data.length} signals from ${endpoint}`);
              }
            }
          } catch (endpointError) {
            console.warn(`Failed to fetch from ${endpoint}:`, endpointError);
          }
        }
        
        if (adminSignals.length > 0) {
          // Transform admin signals to match our interface
          const transformedSignals = adminSignals.map((signal: any) => ({
            id: signal.id || `admin-${Date.now()}-${Math.random()}`,
            pair: signal.symbol || signal.pair,
            direction: signal.action === 'BUY' ? 'LONG' : 'SHORT',
            entry: signal.entryPrice || signal.entry,
            entryPrice: signal.entryPrice || signal.entry,
            stopLoss: signal.stopLoss,
            takeProfit: signal.takeProfit,
            confidence: signal.confidence || 85,
            analysis: signal.analysis || 'Signal generated from admin dashboard',
            ictConcepts: signal.ictConcepts || ['Admin Signal'],
            timestamp: signal.createdAt || signal.timestamp || new Date().toISOString(),
            status: signal.status || 'active',
            market: signal.signalType || (signal.symbol?.includes('USDT') ? 'crypto' : 'forex'),
            timeframe: signal.timeframe || '1H',
            is_recommended: (signal.confidence || 85) > 85
          }));
          
          setSignals(transformedSignals);
          setAdminSignalsCount(transformedSignals.length);
          setConnectionStatus('connected');
          setLastUpdate(new Date());
          console.log('Successfully loaded admin signals:', transformedSignals.length);
        } else {
          // No admin signals found
          setSignals([]);
          setAdminSignalsCount(0);
          setConnectionStatus('connected');
          setLastUpdate(new Date());
          console.log('No admin signals found - admin dashboard may be empty');
        }
        
      } catch (err) {
        console.error('Error fetching admin signals:', err);
        setError('Failed to fetch signals from admin dashboard. Please check if admin dashboard has generated any signals.');
        setConnectionStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAdminSignals();
    
    // Refresh signals every 30 seconds
    const interval = setInterval(() => {
      fetchAdminSignals();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Apply market filter
  const filteredSignals = marketFilter === 'all' 
    ? signals 
    : signals.filter(s => s.market === marketFilter);
  
  // Calculate stats
  useEffect(() => {
    const total = signals.length;
    const active = signals.filter(s => s.status === 'active').length;
    const recommended = signals.filter(s => s.is_recommended).length;
    const forex = signals.filter(s => s.market === 'forex').length;
    const crypto = signals.filter(s => s.market === 'crypto').length;
    
    setStats({
      total,
      active,
      recommended,
      forex,
      crypto
    });
  }, [signals]);
  
  // Handle marking signal as taken
  const handleMarkAsTaken = async (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    try {
      // Store signal in database for persistent history
      const signalResult = outcome === 'Target Hit' ? 'win' : 
                          outcome === 'Stop Loss Hit' ? 'loss' : 'skipped';
      
      await botDataService.storeUserSignal({
        user_id: user?.id || 'current_user',
        pair: signal.pair,
        signal_type: signal.direction === 'LONG' ? 'buy' : 'sell',
        result: signalResult,
        confidence_pct: signal.confidence,
        is_recommended: signal.is_recommended,
        entry_price: typeof signal.entry === 'string' ? parseFloat(signal.entry) : signal.entryPrice,
        stop_loss: signal.stopLoss,
        take_profit: Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit,
        analysis: signal.analysis,
        ict_concepts: signal.ictConcepts,
        pnl: pnl,
        notes: `Signal outcome: ${outcome}`
      });
      
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
  };
  
  // Handle adding signal to journal
  const handleAddToJournal = (signal: Signal) => {
    onAddToJournal(signal);
  };
  
  // Handle chat with Nexus
  const handleChatWithNexus = (signal: Signal) => {
    onChatWithNexus(signal);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading signals from admin dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && signals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 text-lg mb-2">⚠️ No Admin Signals Found</div>
        <p className="text-gray-400 mb-4">{error}</p>
        <div className="bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-gray-300 mb-2">To see signals here:</p>
          <ol className="text-sm text-gray-400 text-left space-y-1">
            <li>1. Go to admin dashboard</li>
            <li>2. Generate signals in Crypto/Forex tabs</li>
            <li>3. Signals will appear here automatically</li>
          </ol>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
  
  // Render empty state
  if (filteredSignals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-white mb-2">No Signals from Admin Dashboard</h3>
        <p className="text-gray-400 mb-4">Signals will appear here when generated by the admin dashboard.</p>
        <div className="bg-gray-800/50 rounded-lg p-4 max-w-md mx-auto mb-4">
          <p className="text-sm text-gray-300 mb-2">Admin signals found: {adminSignalsCount}</p>
          <p className="text-sm text-gray-400">Connection Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}</p>
          <p className="text-sm text-gray-400">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-300 mb-2">💡 To generate signals:</p>
          <ol className="text-sm text-blue-200 text-left space-y-1">
            <li>1. Go to admin dashboard</li>
            <li>2. Click on "Crypto Data" or "Forex Data" tabs</li>
            <li>3. Generate signals using the admin interface</li>
            <li>4. Signals will appear here automatically</li>
          </ol>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-connected-signals-feed max-w-6xl mx-auto p-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">📡 Admin Dashboard Signals</h2>
            <p className="text-gray-400">Real-time signals from admin dashboard</p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdate.toLocaleTimeString()} | Admin signals: {adminSignalsCount}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              connectionStatus === 'connected' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
            }`}>
              {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            <div className="text-sm text-gray-400">
              Your R:R Preference: 1:{userRiskReward}
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-gray-400">Total Signals</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{stats.active}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats.recommended}</div>
            <div className="text-sm text-gray-400">Recommended</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.forex}</div>
            <div className="text-sm text-gray-400">Forex</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.crypto}</div>
            <div className="text-sm text-gray-400">Crypto</div>
          </div>
        </div>
        
        {/* Market Filter */}
        <div className="flex space-x-2">
          {['all', 'forex', 'crypto'].map((market) => (
            <button
              key={market}
              onClick={() => setMarketFilter(market)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                marketFilter === market
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {market === 'all' ? 'All Markets' : market.charAt(0).toUpperCase() + market.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Signals List */}
      <div className="signals-list">
        {filteredSignals.map(signal => (
          <AdminConnectedSignalCard
            key={signal.id}
            signal={signal}
            isTaken={takenSignalIds.includes(signal.id)}
            onMarkAsTaken={handleMarkAsTaken}
            onAddToJournal={handleAddToJournal}
            onChatWithNexus={handleChatWithNexus}
            userRiskReward={userRiskReward}
          />
        ))}
      </div>
    </div>
  );
};

export default AdminConnectedSignalsFeed;
