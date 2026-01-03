import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, Target, AlertCircle, CheckCircle } from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  description?: string;
}

const NewSignalsFeed: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching signals from backend...');
      const response = await fetch('https://backend-8j0e.onrender.com/api/test/signals');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Signals response:', data);
      
      if (data.success && Array.isArray(data.signals)) {
        setSignals(data.signals);
        console.log('Signals loaded successfully:', data.signals.length);
      } else {
        throw new Error('Invalid response format from server');
      }
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

  const getActionIcon = (action: string) => {
    return action === 'BUY' ? 
      <TrendingUp className="w-5 h-5 text-green-400" /> : 
      <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  const getActionColor = (action: string) => {
    return action === 'BUY' ? 'text-green-400' : 'text-red-400';
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Trading Signals</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            {signals.length} signal{signals.length !== 1 ? 's' : ''} available
          </span>
          <button 
            onClick={fetchSignals}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {signals.map((signal) => (
          <div key={signal.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 hover:bg-gray-800/70 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getActionIcon(signal.action)}
                <div>
                  <h3 className={`text-xl font-bold ${getActionColor(signal.action)}`}>
                    {signal.action} {signal.symbol}
                  </h3>
                  <p className="text-sm text-gray-400">{signal.timeframe}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(signal.status)}`}>
                  {signal.status}
                </span>
              </div>
            </div>

            {signal.description && (
              <p className="text-gray-300 mb-4">{signal.description}</p>
            )}

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">Entry Price</p>
                <p className="text-lg font-semibold text-white">${signal.entryPrice}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Stop Loss</p>
                <p className="text-lg font-semibold text-red-400">${signal.stopLoss}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Take Profit</p>
                <p className="text-lg font-semibold text-green-400">${signal.takeProfit}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Created: {new Date(signal.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Take Trade
                </button>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                  Add to Journal
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewSignalsFeed;
