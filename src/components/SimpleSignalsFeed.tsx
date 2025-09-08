import React, { useState, useEffect } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import { useUser } from '../contexts/UserContext';
import TradeManager from '../services/tradeManager';

interface SimpleSignalCardProps {
  signal: Signal;
  isTaken: boolean;
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
  userRiskReward?: string;
  tradeStatus?: 'active' | 'won' | 'lost' | 'breakeven';
  lotSize?: number;
  dollarAmount?: number;
  stopLossDollar?: number;
  takeProfitDollar?: number;
}

const SimpleSignalCard: React.FC<SimpleSignalCardProps> = ({ 
  signal, 
  isTaken, 
  onMarkAsTaken, 
  onAddToJournal, 
  onChatWithNexus,
  userRiskReward,
  tradeStatus = 'active',
  lotSize = 0,
  dollarAmount = 0,
  stopLossDollar = 0,
  takeProfitDollar = 0
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

  // Determine card styling based on trade status
  const getCardStyling = () => {
    if (tradeStatus === 'won') {
      return 'border-green-500/50 bg-green-900/20 opacity-75';
    } else if (tradeStatus === 'lost') {
      return 'border-red-500/50 bg-red-900/20 opacity-75';
    } else if (tradeStatus === 'breakeven') {
      return 'border-yellow-500/50 bg-yellow-900/20 opacity-75';
    } else if (isTaken) {
      return 'border-green-500/50 bg-green-900/20';
    } else if (signal.is_recommended) {
      return 'border-yellow-500/50 bg-yellow-900/10';
    } else {
      return 'border-gray-600/50 hover:border-blue-500/50';
    }
  };

  return (
    <div className={`signal-card bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border-2 mb-6 transition-all duration-300 hover:scale-[1.02] ${getCardStyling()}`}>
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
          {stopLossDollar > 0 && (
            <p className="text-red-300 text-xs">${stopLossDollar.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Take Profit</p>
          <p className="text-green-400 font-bold text-lg">{formatTakeProfit(signal.takeProfit)}</p>
          {takeProfitDollar > 0 && (
            <p className="text-green-300 text-xs">${takeProfitDollar.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3">
          <p className="text-gray-400 text-sm mb-1">Risk:Reward</p>
          <p className={`font-bold text-lg ${matchesUserPreference ? 'text-green-400' : 'text-yellow-400'}`}>
            1:{riskReward}
          </p>
        </div>
      </div>

      {/* Lot Size and Risk Management Info */}
      {lotSize > 0 && (
        <div className="bg-blue-900/30 rounded-lg p-4 mb-6 border border-blue-500/30">
          <h4 className="text-blue-300 font-semibold mb-3 flex items-center">
            📊 Risk Management
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-gray-400 text-sm mb-1">Lot Size</p>
              <p className="text-white font-bold text-lg">{lotSize}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Money at Risk</p>
              <p className="text-yellow-400 font-bold text-lg">${dollarAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Units</p>
              <p className="text-white font-bold text-lg">{(lotSize * 100000).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-1">Status</p>
              <p className={`font-bold text-lg ${
                tradeStatus === 'won' ? 'text-green-400' :
                tradeStatus === 'lost' ? 'text-red-400' :
                tradeStatus === 'breakeven' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                {tradeStatus === 'active' ? 'Active' : 
                 tradeStatus === 'won' ? 'Won' :
                 tradeStatus === 'lost' ? 'Lost' :
                 tradeStatus === 'breakeven' ? 'Break Even' : 'Active'}
              </p>
            </div>
          </div>
        </div>
      )}

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
        {tradeStatus === 'active' ? (
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
        ) : (
          <div className={`font-semibold flex items-center px-4 py-2 rounded-lg ${
            tradeStatus === 'won' ? 'text-green-400 bg-green-900/30' :
            tradeStatus === 'lost' ? 'text-red-400 bg-red-900/30' :
            tradeStatus === 'breakeven' ? 'text-yellow-400 bg-yellow-900/30' :
            'text-gray-400 bg-gray-900/30'
          }`}>
            {tradeStatus === 'won' ? '✅ Trade Won' :
             tradeStatus === 'lost' ? '❌ Trade Lost' :
             tradeStatus === 'breakeven' ? '⚖️ Break Even' :
             '✅ Trade Completed'}
          </div>
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

interface SimpleSignalsFeedProps {
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}

const SimpleSignalsFeed: React.FC<SimpleSignalsFeedProps> = ({ 
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
  const [trades, setTrades] = useState<Map<string, any>>(new Map());
  const tradeManager = TradeManager.getInstance();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recommended: 0,
    forex: 0,
    crypto: 0
  });
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  
  // Get user's risk-reward preference
  const userRiskReward = user?.tradingData?.riskRewardRatio || '2';
  
  // No sample signals - only real signals from admin dashboard

  // Load trades from TradeManager
  useEffect(() => {
    const loadTrades = () => {
      const allTrades = tradeManager.getAllTrades();
      const tradesMap = new Map();
      allTrades.forEach(trade => {
        tradesMap.set(trade.signalId, trade);
      });
      setTrades(tradesMap);
    };
    
    loadTrades();
  }, []);

  // Load signals from localStorage (from admin dashboard)
  useEffect(() => {
    const loadSignals = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load signals from localStorage (stored by admin dashboard)
        const adminSignals = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
        console.log('Loaded admin signals from localStorage:', adminSignals);
        
        if (adminSignals.length === 0) {
          console.log('No signals found in localStorage');
          setSignals([]);
          setConnectionStatus('disconnected');
          return;
        }

        // Convert admin messages to Signal format
        const convertedSignals: Signal[] = adminSignals.map((msg: any) => {
          console.log('Converting signal:', msg); // Debug log
          
          const lines = msg.text.split('\n');
          const pair = lines[0] || 'UNKNOWN';
          const direction = lines[1]?.includes('BUY') ? 'LONG' : lines[1]?.includes('SELL') ? 'SHORT' : 'LONG';
          
          // Extract prices from text
          const entryMatch = msg.text.match(/Entry\s+([0-9.]+)/i);
          const slMatch = msg.text.match(/Stop Loss\s+([0-9.]+)/i);
          const tpMatch = msg.text.match(/Take Profit\s+([0-9.,\s]+)/i);
          const confidenceMatch = msg.text.match(/Confidence\s+([0-9]+)%/i);
          
          const entryPrice = entryMatch ? parseFloat(entryMatch[1]) : 0;
          const stopLoss = slMatch ? parseFloat(slMatch[1]) : 0;
          const takeProfit = tpMatch ? parseFloat(tpMatch[1].split(',')[0]) : 0;
          const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 85;
          
          // Determine market type based on pair
          const isCrypto = pair.includes('USDT') || pair.includes('BTC') || pair.includes('ETH') || 
                         pair.includes('ADA') || pair.includes('BNB') || pair.includes('XRP') ||
                         pair.includes('SOL') || pair.includes('DOT') || pair.includes('DOGE') ||
                         pair.includes('AVAX') || pair.includes('LINK') || pair.includes('LTC') ||
                         pair.includes('XLM') || pair.includes('FIL') || pair.includes('AAVE');
          
          const signal = {
            id: msg.id.toString(),
            pair,
            direction,
            entry: entryPrice.toString(),
            entryPrice,
            stopLoss: stopLoss.toString(),
            takeProfit: takeProfit.toString(),
            confidence,
            riskRewardRatio: '1:2',
            timestamp: msg.timestamp,
            description: msg.text.split('\n\n')[1] || 'Professional trading signal',
            analysis: msg.text.split('\n\n')[1] || 'Professional trading signal',
            market: isCrypto ? 'crypto' : 'forex',
            status: 'active',
            type: direction === 'LONG' ? 'buy' : 'sell'
          };
          
          console.log('Converted signal:', signal); // Debug log
          return signal;
        });
        
        setSignals(convertedSignals);
        setConnectionStatus('connected');
        
      } catch (err) {
        console.error('Error loading signals:', err);
        setError('No signals available. Signals will appear when admin creates them.');
        setSignals([]);
        setConnectionStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    loadSignals();
    
    // Listen for new signals from admin
    const handleNewSignal = () => {
      loadSignals();
    };
    
    window.addEventListener('newSignalSent', handleNewSignal);
    window.addEventListener('newSignalGenerated', handleNewSignal);
    
    // Refresh signals every 5 seconds
    const interval = setInterval(loadSignals, 5000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('newSignalSent', handleNewSignal);
      window.removeEventListener('newSignalGenerated', handleNewSignal);
    };
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
      // Get or create trade
      let trade = tradeManager.getTradeBySignalId(signal.id);
      if (!trade) {
        // Create new trade if it doesn't exist
        trade = tradeManager.createTrade(signal);
      }
      
      // Determine trade status based on outcome
      let tradeStatus: 'won' | 'lost' | 'breakeven';
      switch (outcome) {
        case 'Target Hit':
          tradeStatus = 'won';
          break;
        case 'Stop Loss Hit':
          tradeStatus = 'lost';
          break;
        case 'Breakeven':
          tradeStatus = 'breakeven';
          break;
        default:
          tradeStatus = 'won'; // Default to won for other outcomes
      }
      
      // Update trade status
      tradeManager.updateTradeStatus(trade.id, tradeStatus, pnl);
      
      // Update local trades state
      const allTrades = tradeManager.getAllTrades();
      const tradesMap = new Map();
      allTrades.forEach(t => {
        tradesMap.set(t.signalId, t);
      });
      setTrades(tradesMap);
      
      // Update taken signal IDs
      setTakenSignalIds(prev => [...prev, signal.id]);
      
      // Call parent callback
      onMarkAsTaken(signal, outcome, pnl);
      
      console.log('Trade status updated:', tradeStatus, 'Trade ID:', trade.id);
    } catch (error) {
      console.error('Error updating trade status:', error);
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
          <p className="text-gray-400">Loading signals...</p>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error && signals.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-red-400 text-lg mb-2">⚠️ Error</div>
        <p className="text-gray-400">{error}</p>
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
        <h3 className="text-xl font-semibold text-white mb-2">No Signals Available</h3>
        <p className="text-gray-400">New signals will appear here when generated by the admin dashboard.</p>
        <div className="mt-4 text-sm text-gray-500">
          Connection Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        <div className="mt-6">
          <button 
            onClick={() => {
              console.log('Manual refresh clicked');
              const adminSignals = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
              console.log('Current localStorage signals:', adminSignals);
              window.location.reload();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            🔄 Refresh Signals
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="simple-signals-feed max-w-6xl mx-auto p-6">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Live Trading Signals</h2>
            <p className="text-gray-400">Real-time signals with enhanced UI and filtering</p>
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
        {filteredSignals.map(signal => {
          const trade = trades.get(signal.id);
          return (
            <SimpleSignalCard
              key={signal.id}
              signal={signal}
              isTaken={takenSignalIds.includes(signal.id)}
              onMarkAsTaken={handleMarkAsTaken}
              onAddToJournal={handleAddToJournal}
              onChatWithNexus={handleChatWithNexus}
              userRiskReward={userRiskReward}
              tradeStatus={trade?.status || 'active'}
              lotSize={trade?.lotSize || 0}
              dollarAmount={trade?.dollarAmount || 0}
              stopLossDollar={trade?.stopLossDollar || 0}
              takeProfitDollar={trade?.takeProfitDollar || 0}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SimpleSignalsFeed;
