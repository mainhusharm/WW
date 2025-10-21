import React, { useState, useEffect } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import { useUser } from '../contexts/UserContext';
import TradeManager from '../services/tradeManager';
import { lotSizeCalculator } from '../services/lotSizeCalculator';
import { tradeManagementService, Trade } from '../services/tradeManagementService';
import { userDataService } from '../services/userDataService';
import MilestoneSignalsFeed from './MilestoneSignalsFeed';
import { ToggleLeft, ToggleRight } from 'lucide-react';

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
      // Make taken trades grey
      return 'border-gray-500/50 bg-gray-800/60 opacity-60';
    } else if (signal.is_recommended) {
      return 'border-yellow-500/50 bg-yellow-900/10';
    } else {
      return 'border-gray-600/50 hover:border-blue-500/50';
    }
  };

  return (
    <div className={`signal-card bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-4 rounded-xl border-2 mb-4 transition-all duration-300 hover:scale-[1.01] ${getCardStyling()}`}>
      {/* Header with Lot Size */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-bold text-white">{signal.pair}</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
            signal.direction?.toLowerCase() === 'long' || signal.type?.toLowerCase() === 'buy'
              ? 'bg-green-600/80 text-white' 
              : 'bg-red-600/80 text-white'
          }`}>
            {signal.direction || signal.type?.toUpperCase()}
          </div>
          {signal.is_recommended && (
            <span className="px-2 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full flex items-center">
              ⭐ Recommended
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {lotSize > 0 && (
            <div className="text-right">
              <div className="text-xs text-gray-400">Lot Size</div>
              <div className="text-lg font-bold text-green-400">{lotSize.toFixed(2)}</div>
            </div>
          )}
          <div className="text-right">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-lg font-bold text-blue-400">{signal.confidence}%</div>
          </div>
        </div>
      </div>
      
      {/* Main Signal Details - Compact Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Entry Price</p>
          <p className="text-white font-bold text-sm">{signal.entry || signal.entryPrice}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Stop Loss</p>
          <p className="text-red-400 font-bold text-sm">{signal.stopLoss}</p>
          {stopLossDollar > 0 && (
            <p className="text-red-300 text-xs">-${stopLossDollar.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Take Profit</p>
          <p className="text-green-400 font-bold text-sm">{formatTakeProfit(signal.takeProfit)}</p>
          {takeProfitDollar > 0 && (
            <p className="text-green-300 text-xs">+${takeProfitDollar.toFixed(2)}</p>
          )}
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Risk:Reward</p>
          <p className={`font-bold text-sm ${matchesUserPreference ? 'text-green-400' : 'text-yellow-400'}`}>
            1:{riskReward}
          </p>
        </div>
        {lotSize > 0 && (
          <div className="bg-gray-700/50 rounded-lg p-2">
            <p className="text-gray-400 text-xs mb-1">Money at Risk</p>
            <p className="text-yellow-400 font-bold text-sm">${dollarAmount.toFixed(2)}</p>
          </div>
        )}
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Status</p>
          <p className={`font-bold text-sm ${
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
      <div className="flex flex-wrap gap-2">
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Chat with Nexus clicked for signal:', signal);
            
            // Redirect to AI Coach with signal context
            const signalData = encodeURIComponent(JSON.stringify({
              pair: signal.pair || signal.symbol,
              symbol: signal.pair || signal.symbol,
              direction: signal.direction || signal.action,
              action: signal.direction || signal.action,
              entry: signal.entry || signal.entryPrice,
              entryPrice: signal.entry || signal.entryPrice,
              stopLoss: signal.stopLoss,
              takeProfit: signal.takeProfit,
              confidence: signal.confidence,
              timeframe: signal.timeframe || '1H',
              riskReward: signal.riskReward,
              analysis: signal.analysis || signal.description
            }));
            
            console.log('Redirecting to AI Coach with signal data:', signalData);
            window.location.href = `/ai-coach?signal=${signalData}`;
          }}
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
  const [activeTab, setActiveTab] = useState<'Signals' | 'winning' | 'losing'>('Signals');
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
  const [userRiskPlan, setUserRiskPlan] = useState<any>(null);
  const [tradeOutcomes, setTradeOutcomes] = useState<Map<string, 'won' | 'lost' | 'breakeven'>>(new Map());
  
  // New state for milestone view toggle
  const [viewMode, setViewMode] = useState<'classic' | 'milestone'>(() => {
    // Restore view mode from localStorage, default to milestone
    return localStorage.getItem('signals_view_mode') as 'classic' | 'milestone' || 'milestone';
  });
  
  // Default risk plan for users without a comprehensive plan
  const defaultRiskPlan = {
    userProfile: {
      accountEquity: 10000
    },
    riskParameters: {
      baseTradeRiskPct: 2
    }
  };
  
  const riskPlan = userRiskPlan || defaultRiskPlan;
  
  // Get user's risk-reward preference
  const userRiskReward = user?.tradingData?.riskRewardRatio || '2';
  
  // Save view mode to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('signals_view_mode', viewMode);
  }, [viewMode]);

  // Load user risk plan and account performance
  useEffect(() => {
    const loadUserData = async () => {
      if (user?.email) {
        try {
          // Initialize user data service
          userDataService.setUserEmail(user.email);
          
          // Load user-specific account data
          const accountData = userDataService.getAccountData();
          
          // Load user-specific taken signals
          const takenSignals = userDataService.getTakenSignals();
          setTakenSignalIds(takenSignals);
          
          // Load trade outcomes from localStorage
          const storedOutcomes = localStorage.getItem(`trade_outcomes_${user.email}`);
          if (storedOutcomes) {
            const outcomesMap = new Map(JSON.parse(storedOutcomes));
            setTradeOutcomes(outcomesMap);
          }
          
          // Load user's risk management plan
          const riskPlan = localStorage.getItem('comprehensive_plan');
          if (riskPlan) {
            setUserRiskPlan(JSON.parse(riskPlan));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }
    };
    
    loadUserData();
  }, [user?.email]);

  // Load trades from TradeManager
  useEffect(() => {
    const loadTrades = async () => {
      if (user?.email) {
        try {
          const allTrades = await tradeManagementService.getTrades(user.email);
          const tradesMap = new Map();
          allTrades.forEach(trade => {
            tradesMap.set(trade.signalId, trade);
          });
          setTrades(tradesMap);
        } catch (error) {
          console.error('Error loading trades:', error);
        }
      }
    };
    
    loadTrades();
  }, [user?.email]);

  // Load signals from localStorage (from admin dashboard)
  useEffect(() => {
    const loadSignals = () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load signals from localStorage (stored by admin dashboard)
        // Check multiple possible keys for signals
        const telegramMessages = JSON.parse(localStorage.getItem('telegram_messages') || '[]');
        const adminSignals = JSON.parse(localStorage.getItem('admin_signals') || '[]');
        const generatedSignals = JSON.parse(localStorage.getItem('admin_generated_signals') || '[]');
        const futuresSignals = JSON.parse(localStorage.getItem('futures_signals') || '[]');
        
        // Combine all signal sources
        const allSignals = [...telegramMessages, ...adminSignals, ...generatedSignals, ...futuresSignals];
        console.log('Loaded signals from localStorage:', {
          telegramMessages: telegramMessages.length,
          adminSignals: adminSignals.length,
          generatedSignals: generatedSignals.length,
          futuresSignals: futuresSignals.length,
          total: allSignals.length
        });
        console.log('First few signals:', allSignals.slice(0, 3));
        
        if (allSignals.length === 0) {
          console.log('No signals found in localStorage');
          setSignals([]);
          setConnectionStatus('disconnected');
          return;
        }

        // Convert admin messages to Signal format with proper lot size calculations
        const convertedSignals: Signal[] = allSignals.map((msg: any) => {
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
          
          // Calculate lot size and dollar amounts based on user's actual account data
          let lotSize = 0.01;
          let moneyAtRisk = 0;
          let stopLossDollar = 0;
          let takeProfitDollar = 0;
          
          if (entryPrice && stopLoss) {
            // Get user's actual risk parameters from questionnaire data
            const questionnaireData = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
            const accountBalance = questionnaireData?.accountSize || questionnaireData?.accountEquity || 10000;
            const riskPercentage = questionnaireData?.riskPercentage || 1;
            
            // Calculate money at risk based on user's risk percentage
            moneyAtRisk = (accountBalance * riskPercentage) / 100;
            
            // Calculate stop loss in pips
            const pipValue = pair.includes('JPY') ? 0.01 : 0.0001;
            const stopLossPips = Math.abs(entryPrice - stopLoss) / pipValue;
            
            // Calculate lot size: Money at Risk / (Stop Loss Pips × Pip Value per Lot)
            const pipValuePerLot = 10; // $10 per pip for major pairs
            lotSize = Math.max(0.01, moneyAtRisk / (stopLossPips * pipValuePerLot));
            lotSize = Math.round(lotSize * 100) / 100;
            
            // Calculate dollar amounts
            const units = lotSize * 100000;
            stopLossDollar = Math.abs(entryPrice - stopLoss) * units;
            takeProfitDollar = takeProfit ? Math.abs(takeProfit - entryPrice) * units : 0;
          }
          
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
            type: direction === 'LONG' ? 'buy' : 'sell',
            is_recommended: confidence > 85, // Set recommended based on confidence
            lotSize,
            moneyAtRisk,
            stopLossDollar,
            takeProfitDollar
          };
          
          console.log('Converted signal with lot size:', signal); // Debug log
          return signal;
        });
        
        console.log('Converted signals:', convertedSignals.length);
        console.log('First converted signal:', convertedSignals[0]);
        
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
  
  // Calculate lot size and dollar amounts for a signal
  const calculateSignalMetrics = (signal: Signal) => {
    if (!user?.email) {
      return {
        lotSize: 0,
        dollarAmount: 0,
        stopLossDollar: 0,
        takeProfitDollar: 0,
        tradeStatus: 'active' as const
      };
    }

    try {
      const symbol = signal.pair || signal.symbol || 'EURUSD';
      const entryPrice = parseFloat(signal.entry || signal.entryPrice || '0');
      const stopLoss = parseFloat(signal.stopLoss || '0');
      
      if (!entryPrice || !stopLoss) {
        return {
          lotSize: 0,
          dollarAmount: 0,
          stopLossDollar: 0,
          takeProfitDollar: 0,
          tradeStatus: 'active' as const
        };
      }

      // Get user's actual risk parameters from questionnaire data
      const questionnaireData = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
      const accountBalance = questionnaireData?.accountSize || questionnaireData?.accountEquity || riskPlan?.accountBalance || riskPlan?.accountSize || 10000;
      const riskPercentage = questionnaireData?.riskPercentage || riskPlan?.riskPercentage || riskPlan?.riskPerTrade || 1;
      
      // Calculate money at risk based on user's risk percentage
      const moneyAtRisk = (accountBalance * riskPercentage) / 100;
      
      // Calculate stop loss in pips
      const pipValue = symbol.includes('JPY') ? 0.01 : 0.0001;
      const stopLossPips = Math.abs(entryPrice - stopLoss) / pipValue;
      
      // Calculate lot size: Money at Risk / (Stop Loss Pips × Pip Value per Lot)
      const pipValuePerLot = 10; // $10 per pip for major pairs
      const lotSize = Math.max(0.01, moneyAtRisk / (stopLossPips * pipValuePerLot));
      const roundedLotSize = Math.round(lotSize * 100) / 100;
      
      // Calculate dollar amounts
      const takeProfit = parseFloat(Array.isArray(signal.takeProfit) ? signal.takeProfit[0] : signal.takeProfit || '0');
      const takeProfitPips = takeProfit ? Math.abs(takeProfit - entryPrice) / pipValue : 0;
      
      const stopLossDollar = stopLossPips * roundedLotSize * pipValuePerLot;
      const takeProfitDollar = takeProfitPips * roundedLotSize * pipValuePerLot;
      
      // Check trade outcome from localStorage
      const tradeOutcome = tradeOutcomes.get(signal.id);
      let tradeStatus: 'active' | 'won' | 'lost' | 'breakeven' = 'active';
      if (tradeOutcome === 'won') tradeStatus = 'won';
      else if (tradeOutcome === 'lost') tradeStatus = 'lost';
      else if (tradeOutcome === 'breakeven') tradeStatus = 'breakeven';
      
      return {
        lotSize: roundedLotSize,
        dollarAmount: Math.round(moneyAtRisk * 100) / 100,
        stopLossDollar: Math.round(stopLossDollar * 100) / 100,
        takeProfitDollar: Math.round(takeProfitDollar * 100) / 100,
        tradeStatus
      };
    } catch (error) {
      console.error('Error calculating signal metrics:', error);
      return {
        lotSize: 0,
        dollarAmount: 0,
        stopLossDollar: 0,
        takeProfitDollar: 0,
        tradeStatus: 'active' as const
      };
    }
  };

  // Apply market and tab filters
  const filteredSignals = signals.filter(signal => {
    // First filter by market
    let marketMatch = true;
    if (marketFilter === 'forex') {
      marketMatch = signal.market === 'forex' || signal.pair?.includes('USD') || signal.pair?.includes('EUR') || 
                   signal.pair?.includes('GBP') || signal.pair?.includes('JPY') || signal.pair?.includes('CHF') ||
                   signal.pair?.includes('AUD') || signal.pair?.includes('CAD') || signal.pair?.includes('NZD');
    } else if (marketFilter === 'crypto') {
      marketMatch = signal.market === 'crypto' || signal.pair?.includes('BTC') || signal.pair?.includes('ETH') ||
                   signal.pair?.includes('USDT') || signal.pair?.includes('ADA') || signal.pair?.includes('BNB') ||
                   signal.pair?.includes('XRP') || signal.pair?.includes('SOL') || signal.pair?.includes('DOT');
    }
    
    if (!marketMatch) return false;
    
    // Then filter by tab
    if (activeTab === 'Signals') return true;
    if (activeTab === 'winning') return tradeOutcomes.get(signal.id) === 'won';
    if (activeTab === 'losing') return tradeOutcomes.get(signal.id) === 'lost';
    
    return true;
  });
  
  // Calculate stats
  useEffect(() => {
    const total = signals.length;
    const active = signals.filter(s => s.status === 'active').length;
    const recommended = signals.filter(s => s.is_recommended).length;
    const forex = signals.filter(s => s.market === 'forex').length;
    const crypto = signals.filter(s => s.market === 'crypto').length;
    
    console.log('Calculating stats:', {
      total,
      active,
      recommended,
      forex,
      crypto,
      signalsCount: signals.length,
      signals: signals.map(s => ({ 
        id: s.id, 
        status: s.status, 
        market: s.market, 
        is_recommended: s.is_recommended,
        pair: s.pair
      }))
    });
    
    setStats({
      total,
      active,
      recommended,
      forex,
      crypto
    });
  }, [signals]);
  
  // Save trade outcome to localStorage
  const saveTradeOutcome = (signalId: string, outcome: 'won' | 'lost' | 'breakeven') => {
    if (!user?.email) return;
    
    const newOutcomes = new Map(tradeOutcomes);
    newOutcomes.set(signalId, outcome);
    setTradeOutcomes(newOutcomes);
    
    // Save to localStorage
    localStorage.setItem(`trade_outcomes_${user.email}`, JSON.stringify(Array.from(newOutcomes.entries())));
  };

  // Handle marking signal as taken
  const handleMarkAsTaken = async (signal: Signal, outcome: TradeOutcome, pnl?: number) => {
    if (!user?.email) return;
    
    try {
      // Initialize user data service
      userDataService.setUserEmail(user.email);
      
      // Calculate P&L based on signal data
      const calculatedPnl = userDataService.calculatePnL(signal, outcome);
      
      // Update account balance with calculated P&L
      userDataService.updateAccountBalance(calculatedPnl);
      
      // Get updated account data
      const updatedAccountData = userDataService.getAccountData();
      
      // Add signal to taken signals
      userDataService.addTakenSignal(signal.id);
      const updatedTakenSignals = userDataService.getTakenSignals();
      setTakenSignalIds(updatedTakenSignals);
      
      // Save trade outcome
      const outcomeType = outcome === 'Target Hit' ? 'won' : outcome === 'Stop Loss Hit' ? 'lost' : 'breakeven';
      saveTradeOutcome(signal.id, outcomeType);
      
      // Call parent callback with calculated P&L
      onMarkAsTaken(signal, outcome, calculatedPnl);
      
      console.log('Signal marked as taken:', {
        signalId: signal.id,
        outcome,
        calculatedPnl,
        newBalance: updatedAccountData.accountBalance
      });
    } catch (error) {
      console.error('Error marking signal as taken:', error);
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

  // If milestone view is selected, render the MilestoneSignalsFeed component
  if (viewMode === 'milestone') {
    return (
      <div className="simple-signals-feed max-w-6xl mx-auto p-6">
        {/* Header with View Toggle */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Live Trading Signals</h2>
              <p className="text-gray-400">Real-time signals with milestone-based organization</p>
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

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-gray-400 text-sm">View Mode:</span>
            <button
              onClick={() => setViewMode(viewMode === 'classic' ? 'milestone' : 'classic')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-600"
            >
              {viewMode === 'classic' ? (
                <>
                  <ToggleLeft className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Classic View</span>
                </>
              ) : (
                <>
                  <ToggleRight className="w-5 h-5 text-cyan-400" />
                  <span className="text-cyan-400">Milestone View</span>
                </>
              )}
            </button>
            <div className="text-xs text-gray-500">
              Switch between classic list and milestone-based organization
            </div>
          </div>
        </div>

        <MilestoneSignalsFeed
          signals={signals}
          onMarkAsTaken={handleMarkAsTaken}
          onAddToJournal={handleAddToJournal}
          onChatWithNexus={handleChatWithNexus}
          takenSignalIds={takenSignalIds}
          tradeOutcomes={tradeOutcomes}
        />
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
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center space-x-4 mb-6">
          <span className="text-gray-400 text-sm">View Mode:</span>
          <button
            onClick={() => setViewMode(viewMode === 'classic' ? 'milestone' : 'classic')}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-600"
          >
            {viewMode === 'classic' ? (
              <>
                <ToggleLeft className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Classic View</span>
              </>
            ) : (
              <>
                <ToggleRight className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400">Milestone View</span>
              </>
            )}
          </button>
          <div className="text-xs text-gray-500">
            Switch between classic list and milestone-based organization
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
        
        {/* Trade Outcome Tabs */}
        <div className="flex space-x-2 mt-4">
          {[
            { key: 'Signals', label: 'All Markets' },
            { key: 'winning', label: 'Winning Trades' },
            { key: 'losing', label: 'Losing Trades' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'Signals' | 'winning' | 'losing')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Signals List */}
      <div className="signals-list">
        {filteredSignals.map(signal => {
          const trade = trades.get(signal.id);
          const metrics = calculateSignalMetrics(signal);
          const tradeOutcome = tradeOutcomes.get(signal.id);
          return (
            <SimpleSignalCard
              key={signal.id}
              signal={signal}
              isTaken={takenSignalIds.includes(signal.id)}
              onMarkAsTaken={handleMarkAsTaken}
              onAddToJournal={handleAddToJournal}
              onChatWithNexus={handleChatWithNexus}
              userRiskReward={userRiskReward}
              tradeStatus={metrics.tradeStatus}
              lotSize={metrics.lotSize}
              dollarAmount={metrics.dollarAmount}
              stopLossDollar={metrics.stopLossDollar}
              takeProfitDollar={metrics.takeProfitDollar}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SimpleSignalsFeed;
