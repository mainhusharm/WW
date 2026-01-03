import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, AlertCircle, CheckCircle, X, BarChart3, Plus } from 'lucide-react';

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
  createdBy: string;
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

const AdminSignalsFeed: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching signals from admin dashboard...');
      const response = await fetch('https://backend-8j0e.onrender.com/api/signals/admin');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Admin signals response:', data);
      
      if (data.success && Array.isArray(data.signals)) {
        setSignals(data.signals);
        console.log('Admin signals loaded successfully:', data.signals.length);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching admin signals:', err);
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
    // Mark signal as skipped but keep it in the list
    setSignals(prev => prev.map(s => 
      s.id === signal.id ? { ...s, status: 'cancelled' } : s
    ));
  };

  const handleTradeOutcome = (outcome: string, pnl?: number) => {
    if (selectedSignal) {
      console.log(`Trade outcome for ${selectedSignal.symbol}:`, outcome, pnl);
      // Mark signal as completed but keep it in the list
      setSignals(prev => prev.map(s => 
        s.id === selectedSignal.id ? { ...s, status: 'completed' } : s
      ));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'completed': return 'bg-blue-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading admin signals...</p>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Trading Signals</h1>
          <p className="text-gray-400">Signals created by admin - persist forever</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
            Active Signals ({signals.filter(s => s.status === 'active').length})
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
        {signals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No admin signals available</p>
            <p className="text-gray-500 text-sm">Admin needs to create signals from the admin dashboard</p>
          </div>
        ) : (
          signals.map((signal) => (
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
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(signal.status)}`}>
                    {signal.status}
                  </span>
                  {signal.confidence && (
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Confidence</div>
                      <div className="text-lg font-bold text-green-400">{signal.confidence}%</div>
                    </div>
                  )}
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
                  <span className="mx-2">•</span>
                  <span>By: {signal.createdBy}</span>
                </div>
                {signal.status === 'active' && (
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
                )}
              </div>
            </div>
          ))
        )}
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

export default AdminSignalsFeed;
