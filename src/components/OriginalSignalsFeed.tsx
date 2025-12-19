import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, AlertCircle, CheckCircle, X, BarChart3 } from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  description?: string;
  confidence?: number;
  rrRatio?: string;
  analysis?: string;
}

interface TradeOutcomeModalProps {
  signal: Signal | null;
  isOpen: boolean;
  onClose: () => void;
  onOutcome: (outcome: string, pnl?: number) => void;
}

const TradeOutcomeModal: React.FC<TradeOutcomeModalProps> = ({ signal, isOpen, onClose, onOutcome }) => {
  const [manualPnl, setManualPnl] = useState('');

  if (!isOpen || !signal) return null;

  const handleOutcome = (outcome: string) => {
    if (outcome === 'manual' && manualPnl) {
      onOutcome(outcome, parseFloat(manualPnl));
    } else {
      onOutcome(outcome);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">
            Select Trade Outcome for {signal.symbol}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={() => handleOutcome('target')}
            className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors font-medium"
          >
            Target Hit
          </button>
          <button 
            onClick={() => handleOutcome('stop')}
            className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors font-medium"
          >
            Stop Loss Hit
          </button>
          <button 
            onClick={() => handleOutcome('breakeven')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-lg transition-colors font-medium"
          >
            Breakeven
          </button>
          <button 
            onClick={() => handleOutcome('journal')}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors font-medium"
          >
            Add to Journal
          </button>
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => handleOutcome('nexus')}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors font-medium"
          >
            Chat with Nexus Coach
          </button>
          
          <div className="space-y-2">
            <input
              type="number"
              placeholder="Enter P&L for manual close"
              value={manualPnl}
              onChange={(e) => setManualPnl(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={() => handleOutcome('manual')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors font-medium"
            >
              Manual Close
            </button>
          </div>

          <button 
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const OriginalSignalsFeed: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Signals will be delivered via real-time system when admin creates them');
      // No API calls - signals come from real-time system only
      setSignals([]);
      console.log('No signals available - waiting for admin to create them');
    } catch (err) {
      console.error('Error fetching signals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch signals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSignals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsTaken = (signal: Signal) => {
    setSelectedSignal(signal);
    setShowOutcomeModal(true);
  };

  const handleSkipTrade = (signal: Signal) => {
    // Remove signal from list or mark as skipped
    setSignals(prev => prev.filter(s => s.id !== signal.id));
  };

  const handleTradeOutcome = (outcome: string, pnl?: number) => {
    if (selectedSignal) {
      console.log(`Trade outcome for ${selectedSignal.symbol}:`, outcome, pnl);
      // Here you would typically send this to your backend
      // For now, just remove the signal
      setSignals(prev => prev.filter(s => s.id !== selectedSignal.id));
    }
  };

  const getActionColor = (action: string) => {
    return action === 'BUY' || action === 'LONG' ? 'text-green-400' : 'text-red-400';
  };

  const getActionIcon = (action: string) => {
    return action === 'BUY' || action === 'LONG' ? 
      <TrendingUp className="w-5 h-5 text-green-400" /> : 
      <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading trading signals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Error loading signals: {error}</p>
          <button 
            onClick={fetchSignals}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No signals available at the moment</p>
          <p className="text-sm text-gray-500 mt-2">Check back later for new trading opportunities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Trading Signals</h1>
          <p className="text-gray-400">Real-time professional-grade signals with 85-95% accuracy</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            Active Signals
          </button>
          <button 
            onClick={fetchSignals}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {signals.map((signal) => (
          <div key={signal.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getActionIcon(signal.action)}
                <div>
                  <h3 className={`text-xl font-bold ${getActionColor(signal.action)}`}>
                    {signal.symbol}
                  </h3>
                  <p className="text-sm text-gray-400">{signal.timeframe}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Confidence</div>
                <div className="text-lg font-bold text-green-400">{signal.confidence}% Confidence</div>
              </div>
            </div>

            {signal.analysis && (
              <p className="text-gray-300 mb-4">{signal.analysis}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">ENTRY</p>
                <p className="text-lg font-semibold text-white">${signal.entryPrice}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">STOP LOSS</p>
                <p className="text-lg font-semibold text-red-400">${signal.stopLoss}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">TAKE PROFIT</p>
                <p className="text-lg font-semibold text-green-400">${signal.takeProfit}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">R:R RATIO</p>
                <p className="text-lg font-semibold text-blue-400">{signal.rrRatio}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Created: {new Date(signal.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleMarkAsTaken(signal)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Mark as Taken
                </button>
                <button 
                  onClick={() => handleSkipTrade(signal)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                >
                  Skip Trade
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TradeOutcomeModal
        signal={selectedSignal}
        isOpen={showOutcomeModal}
        onClose={() => setShowOutcomeModal(false)}
        onOutcome={handleTradeOutcome}
      />
    </div>
  );
};

export default OriginalSignalsFeed;
