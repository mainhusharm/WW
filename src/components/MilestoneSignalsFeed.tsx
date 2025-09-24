import React, { useState, useEffect } from 'react';
import { Signal, TradeOutcome } from '../trading/types';
import { SignalMeta, signalScoringService } from '../services/signalScoringService';
import { useUser } from '../contexts/UserContext';
import { Shield, Target, TrendingUp, Zap, Lock, Info, AlertTriangle } from 'lucide-react';

interface MilestoneSignalsFeedProps {
  signals: Signal[];
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
  takenSignalIds: string[];
  tradeOutcomes: Map<string, 'won' | 'lost' | 'breakeven'>;
}

interface MilestoneConfig {
  id: 'M1' | 'M2' | 'M3' | 'M4';
  name: string;
  description: string;
  targetWinRate: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  challenge: string;
}

const MILESTONE_CONFIGS: MilestoneConfig[] = [
  {
    id: 'M1',
    name: 'Milestone 1',
    description: '1-Step Challenge',
    targetWinRate: '~90%',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/20',
    borderColor: 'border-emerald-500/30',
    icon: <Shield className="w-6 h-6" />,
    challenge: 'High Confidence Signals'
  },
  {
    id: 'M2',
    name: 'Milestone 2',
    description: '2-Step Challenge',
    targetWinRate: '~60%',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500/30',
    icon: <Target className="w-6 h-6" />,
    challenge: 'Moderate Confidence'
  },
  {
    id: 'M3',
    name: 'Milestone 3',
    description: '3-Step Challenge',
    targetWinRate: '~40%',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500/30',
    icon: <TrendingUp className="w-6 h-6" />,
    challenge: 'Lower Confidence'
  },
  {
    id: 'M4',
    name: 'Milestone 4',
    description: 'Evaluation/Instant Funding',
    targetWinRate: '~25-30%',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-500/30',
    icon: <Zap className="w-6 h-6" />,
    challenge: 'All Signals'
  }
];

// Account type to milestone mapping
const getInitialMilestoneAccess = (accountType: string): ('M1' | 'M2' | 'M3' | 'M4')[] => {
  const type = accountType?.toLowerCase() || '';
  
  if (type.includes('demo') || type.includes('beginner')) {
    return ['M1'];
  } else if (type.includes('standard')) {
    return ['M1', 'M2'];
  } else if (type.includes('pro') || type.includes('experienced')) {
    return ['M1', 'M2', 'M3'];
  } else if (type.includes('funded') || type.includes('evaluation')) {
    return ['M1', 'M2', 'M3', 'M4'];
  }
  
  // Default to M1 only for unknown account types
  return ['M1'];
};

const MilestoneSignalCard: React.FC<{
  signal: Signal;
  signalMeta: SignalMeta;
  isTaken: boolean;
  tradeOutcome?: 'won' | 'lost' | 'breakeven';
  onMarkAsTaken: (signal: Signal, outcome: TradeOutcome, pnl?: number) => void;
  onAddToJournal: (signal: Signal) => void;
  onChatWithNexus: (signal: Signal) => void;
}> = ({ signal, signalMeta, isTaken, tradeOutcome, onMarkAsTaken, onAddToJournal, onChatWithNexus }) => {
  
  // Calculate risk:reward ratio
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

  const getCardStyling = () => {
    if (tradeOutcome === 'won') {
      return 'border-green-500/50 bg-green-900/20 opacity-75';
    } else if (tradeOutcome === 'lost') {
      return 'border-red-500/50 bg-red-900/20 opacity-75';
    } else if (tradeOutcome === 'breakeven') {
      return 'border-yellow-500/50 bg-yellow-900/20 opacity-75';
    } else if (isTaken) {
      return 'border-gray-500/50 bg-gray-800/60 opacity-60';
    } else {
      return 'border-cyan-500/30 hover:border-cyan-400/50 bg-gray-800/40';
    }
  };

  const formatTakeProfit = (tp: any) => {
    if (Array.isArray(tp)) {
      return tp.join(', ');
    }
    return tp;
  };

  const riskReward = calculateRiskReward();

  return (
    <div className={`signal-card bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-4 rounded-xl border-2 mb-4 transition-all duration-300 hover:scale-[1.01] ${getCardStyling()}`}>
      {/* Header */}
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
          <div className="text-right">
            <div className="text-xs text-gray-400">Confidence</div>
            <div className="text-lg font-bold text-cyan-400">{Math.round(signalMeta.confidence_score * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Main Signal Details - Full Width Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Entry Price</p>
          <p className="text-white font-bold text-sm">{signal.entry || signal.entryPrice}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Stop Loss</p>
          <p className="text-red-400 font-bold text-sm">{signal.stopLoss}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Take Profit</p>
          <p className="text-green-400 font-bold text-sm">{formatTakeProfit(signal.takeProfit)}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Risk:Reward</p>
          <p className="text-green-400 font-bold text-sm">1:{riskReward}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Milestone</p>
          <p className="text-cyan-400 font-bold text-sm">{signalMeta.assigned_milestone}</p>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-gray-400 text-xs mb-1">Status</p>
          <p className={`font-bold text-sm ${
            tradeOutcome === 'won' ? 'text-green-400' :
            tradeOutcome === 'lost' ? 'text-red-400' :
            tradeOutcome === 'breakeven' ? 'text-yellow-400' :
            isTaken ? 'text-gray-400' : 'text-blue-400'
          }`}>
            {tradeOutcome === 'won' ? 'Won' :
             tradeOutcome === 'lost' ? 'Lost' :
             tradeOutcome === 'breakeven' ? 'Breakeven' :
             isTaken ? 'Taken' : 'Active'}
          </p>
        </div>
      </div>

      {/* Secondary Confirmations */}
      {signalMeta.secondary_matches.length > 0 && (
        <div className="mb-3">
          <p className="text-gray-400 text-xs mb-2">Secondary Confirmations ({signalMeta.secondary_count})</p>
          <div className="flex flex-wrap gap-1">
            {signalMeta.secondary_matches.map((confirmation, index) => (
              <span key={index} className="px-2 py-1 bg-cyan-600/20 text-cyan-300 rounded text-xs font-medium border border-cyan-500/20">
                {confirmation.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Row - Milestone Badge and Timestamp */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Primary Logic: ✓</span>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(signal.timestamp || Date.now()).toLocaleTimeString()}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!isTaken && !tradeOutcome ? (
          <>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Target Hit')}
              className="px-3 py-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded text-xs font-semibold transition-all duration-200"
            >
              ✅ Won
            </button>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Stop Loss Hit')}
              className="px-3 py-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded text-xs font-semibold transition-all duration-200"
            >
              ❌ Lost
            </button>
            <button 
              onClick={() => onMarkAsTaken(signal, 'Breakeven')}
              className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded text-xs font-semibold transition-all duration-200"
            >
              ⚖️ BE
            </button>
          </>
        ) : (
          <div className={`font-semibold flex items-center px-3 py-1 rounded text-xs ${
            tradeOutcome === 'won' ? 'text-green-400 bg-green-900/30' :
            tradeOutcome === 'lost' ? 'text-red-400 bg-red-900/30' :
            tradeOutcome === 'breakeven' ? 'text-yellow-400 bg-yellow-900/30' :
            'text-gray-400 bg-gray-900/30'
          }`}>
            {tradeOutcome === 'won' ? '✅ Won' :
             tradeOutcome === 'lost' ? '❌ Lost' :
             tradeOutcome === 'breakeven' ? '⚖️ BE' :
             '✅ Taken'}
          </div>
        )}
        <button 
          onClick={() => onAddToJournal(signal)}
          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-semibold transition-all duration-200"
        >
          📝 Journal
        </button>
        <button 
          onClick={() => onChatWithNexus(signal)}
          className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded text-xs font-semibold transition-all duration-200"
        >
          🤖 Nexus
        </button>
      </div>
    </div>
  );
};

const MilestoneSignalsFeed: React.FC<MilestoneSignalsFeedProps> = ({
  signals,
  onMarkAsTaken,
  onAddToJournal,
  onChatWithNexus,
  takenSignalIds,
  tradeOutcomes
}) => {
  const { user } = useUser();
  const [signalMetas, setSignalMetas] = useState<Map<string, SignalMeta>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState<'M1' | 'M2' | 'M3' | 'M4' | 'ALL'>('ALL');
  const [accountType, setAccountType] = useState<string>('Demo');
  const [accessibleMilestones, setAccessibleMilestones] = useState<string[]>(['M1']);

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user ID from context or token
        const userId = user?.id || localStorage.getItem('userId');
        if (!userId) {
          console.warn('No user ID found, using default settings');
          return;
        }

        // Import user API service
        const { userApiService } = await import('../api/userApi');
        
        // Get user profile from database
        const profileResponse = await userApiService.getUserProfile(userId);
        
        if (profileResponse.success && profileResponse.profile) {
          const { questionnaire, dashboardSettings } = profileResponse.profile;
          
          if (questionnaire) {
            setAccountType(questionnaire.account_type);
            const milestones = getInitialMilestoneAccess(questionnaire.account_type);
            setAccessibleMilestones(milestones);
          } else {
            // Fallback to localStorage if no questionnaire data
            const questionnaireAnswers = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
            const fallbackAccountType = questionnaireAnswers.accountType || 'Demo';
            setAccountType(fallbackAccountType);
            setAccessibleMilestones(getInitialMilestoneAccess(fallbackAccountType));
          }
        } else {
          // Fallback to localStorage
          const questionnaireAnswers = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
          const fallbackAccountType = questionnaireAnswers.accountType || 'Demo';
          setAccountType(fallbackAccountType);
          setAccessibleMilestones(getInitialMilestoneAccess(fallbackAccountType));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to localStorage
        const questionnaireAnswers = JSON.parse(localStorage.getItem('questionnaireAnswers') || '{}');
        const fallbackAccountType = questionnaireAnswers.accountType || 'Demo';
        setAccountType(fallbackAccountType);
        setAccessibleMilestones(getInitialMilestoneAccess(fallbackAccountType));
      }
    };

    loadUserData();
  }, [user]);

  // Score signals and generate metadata
  useEffect(() => {
    const scoreSignals = async () => {
      if (signals.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Try to use real API first
        const { signalMetaApi } = await import('../api/signalMetaApi');
        
        // Fetch signals with metadata from API
        const signalsWithMeta = await signalMetaApi.getSignalsWithMeta({
          with_meta: true,
          limit: 100
        });

        // Create metadata map from API response
        const metaMap = new Map<string, SignalMeta>();
        
        for (const signalWithMeta of signalsWithMeta) {
          if (signalWithMeta.meta) {
            metaMap.set(signalWithMeta.id, signalWithMeta.meta);
          }
        }

        // For signals not in API response, generate metadata using scoring service
        for (const signal of signals) {
          if (!metaMap.has(signal.id)) {
            try {
              const meta = await signalScoringService.scoreSignal(signal);
              metaMap.set(signal.id, meta);
              
              // Optionally save to API for future use
              try {
                await fetch(`${process.env.REACT_APP_API_BASE_URL}/signals/${signal.id}/meta`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(meta),
                });
              } catch (saveError) {
                console.warn('Failed to save metadata to API:', saveError);
              }
            } catch (scoringError) {
              console.error(`Failed to score signal ${signal.id}:`, scoringError);
            }
          }
        }

        setSignalMetas(metaMap);
      } catch (error) {
        console.error('Error fetching signal metadata from API, falling back to local scoring:', error);
        
        // Fallback to local scoring service
        try {
          const metas = await signalScoringService.batchScoreSignals(signals);
          const metaMap = new Map<string, SignalMeta>();
          metas.forEach(meta => {
            metaMap.set(meta.signal_id, meta);
          });
          setSignalMetas(metaMap);
        } catch (fallbackError) {
          console.error('Error with fallback scoring:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    scoreSignals();
  }, [signals]);

  // Group signals by milestone
  const groupedSignals = React.useMemo(() => {
    const groups: Record<'M1' | 'M2' | 'M3' | 'M4', Signal[]> = {
      M1: [],
      M2: [],
      M3: [],
      M4: []
    };

    signals.forEach(signal => {
      const meta = signalMetas.get(signal.id);
      if (meta) {
        groups[meta.assigned_milestone].push(signal);
      } else {
        // Default to M4 if no metadata
        groups.M4.push(signal);
      }
    });

    return groups;
  }, [signals, signalMetas]);

  // Filter signals based on selected milestone
  const filteredSignals = selectedMilestone === 'ALL' 
    ? signals 
    : groupedSignals[selectedMilestone] || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Scoring signals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="milestone-signals-feed max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Milestone Trading Signals</h2>
            <p className="text-gray-400">Signals organized by confidence levels</p>
            <p className="text-sm text-cyan-400 mt-1">Account Type: {accountType} • Access: {accessibleMilestones.join(', ')}</p>
          </div>
        </div>

        {/* Milestone Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedMilestone('ALL')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
              selectedMilestone === 'ALL'
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Milestones
          </button>
          {MILESTONE_CONFIGS.map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedMilestone(config.id)}
              disabled={!accessibleMilestones.includes(config.id)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                selectedMilestone === config.id
                  ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                  : accessibleMilestones.includes(config.id)
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              {!accessibleMilestones.includes(config.id) && <Lock className="w-4 h-4" />}
              {config.icon}
              <span>{config.name}</span>
              <span className="text-xs">({groupedSignals[config.id].length})</span>
            </button>
          ))}
        </div>

        {/* Milestone Stats - Only show when viewing all milestones */}
        {selectedMilestone === 'ALL' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {MILESTONE_CONFIGS.map((config) => (
              <div key={config.id} className={`${config.bgColor} rounded-lg p-4 border ${config.borderColor}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <div className={config.color}>{config.icon}</div>
                  <div>
                    <div className={`font-bold ${config.color}`}>{config.name}</div>
                    <div className="text-xs text-gray-400">{config.description}</div>
                  </div>
                </div>
                <div className="text-lg font-bold text-white">{groupedSignals[config.id].length} signals</div>
                {!accessibleMilestones.includes(config.id) && (
                  <div className="flex items-center space-x-1 mt-2">
                    <Lock className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">Locked</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trading Disclaimer */}
      <div className="mb-6 p-4 bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-bold mb-2">⚠️ IMPORTANT TRADING DISCLAIMER</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Our signals can only perform well according to the market sentiments and we do not guarantee any profits or losses. 
              We are not responsible for any trading outcomes, as you have signed the legal agreement as well. Trading involves 
              substantial risk and is not suitable for all investors. Past performance does not guarantee future results. 
              The milestone system is designed to help categorize signals by confidence levels, but all trading decisions are your own responsibility.
            </p>
          </div>
        </div>
      </div>

      {/* Signals Display */}
      {selectedMilestone === 'ALL' ? (
        // Show all milestones in lanes
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {MILESTONE_CONFIGS.map((config) => (
            <div key={config.id} className={`${config.bgColor} rounded-lg p-4 border ${config.borderColor}`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={config.color}>{config.icon}</div>
                <div>
                  <h3 className={`font-bold ${config.color}`}>{config.name}</h3>
                  <p className="text-xs text-gray-400">{config.description}</p>
                </div>
              </div>
              
              {!accessibleMilestones.includes(config.id) ? (
                <div className="text-center py-8">
                  <Lock className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Upgrade account type to unlock</p>
                </div>
              ) : groupedSignals[config.id].length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-400 text-sm">No signals in this milestone</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {groupedSignals[config.id].map(signal => {
                    const meta = signalMetas.get(signal.id);
                    if (!meta) return null;
                    
                    return (
                      <MilestoneSignalCard
                        key={signal.id}
                        signal={signal}
                        signalMeta={meta}
                        isTaken={takenSignalIds.includes(signal.id)}
                        tradeOutcome={tradeOutcomes.get(signal.id)}
                        onMarkAsTaken={onMarkAsTaken}
                        onAddToJournal={onAddToJournal}
                        onChatWithNexus={onChatWithNexus}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Show selected milestone only in full page
        <div className="space-y-4">
          {/* Selected Milestone Header */}
          {(() => {
            const selectedConfig = MILESTONE_CONFIGS.find(c => c.id === selectedMilestone);
            if (!selectedConfig) return null;
            
            return (
              <div className={`${selectedConfig.bgColor} rounded-lg p-6 border ${selectedConfig.borderColor} mb-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={selectedConfig.color}>{selectedConfig.icon}</div>
                    <div>
                      <h2 className={`text-2xl font-bold ${selectedConfig.color}`}>{selectedConfig.name}</h2>
                      <p className="text-gray-400">{selectedConfig.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{selectedConfig.challenge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{filteredSignals.length}</div>
                    <div className="text-sm text-gray-400">Active Signals</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Check if milestone is accessible */}
          {!accessibleMilestones.includes(selectedMilestone) ? (
            <div className="text-center py-16">
              <Lock className="w-20 h-20 text-gray-500 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">Milestone Locked</h3>
              <p className="text-gray-400 mb-6">Upgrade your account type to access {selectedMilestone} signals</p>
              <button 
                onClick={() => setSelectedMilestone('ALL')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                View All Available Milestones
              </button>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📊</div>
              <h3 className="text-2xl font-semibold text-white mb-4">No Signals in {selectedMilestone}</h3>
              <p className="text-gray-400 mb-6">Signals will appear here when they meet the {selectedMilestone} criteria.</p>
              <button 
                onClick={() => setSelectedMilestone('ALL')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all duration-200"
              >
                View All Milestones
              </button>
            </div>
          ) : (
            // Show signals in full width layout
            <div className="space-y-6">
              {filteredSignals.map(signal => {
                const meta = signalMetas.get(signal.id);
                if (!meta) return null;
                
                return (
                  <MilestoneSignalCard
                    key={signal.id}
                    signal={signal}
                    signalMeta={meta}
                    isTaken={takenSignalIds.includes(signal.id)}
                    tradeOutcome={tradeOutcomes.get(signal.id)}
                    onMarkAsTaken={onMarkAsTaken}
                    onAddToJournal={onAddToJournal}
                    onChatWithNexus={onChatWithNexus}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MilestoneSignalsFeed;
