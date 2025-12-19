import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Target, Clock, DollarSign, TrendingUp, TrendingDown, CheckCircle, XCircle } from 'lucide-react';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { useDatabaseData } from '../hooks/useDatabaseData';

interface PropFirmRule {
  name: string;
  challengeType: string;
  dailyLossLimit: string;
  maxDrawdown: string;
  profitTarget: string;
  minTradingDays: string;
  weekendHolding: string;
  newsTrading: string;
  description: string;
}

const NewPropFirmRules: React.FC = () => {
  const { user } = useSupabaseAuth();
  const { dashboardData } = useDatabaseData();
  const [rules, setRules] = useState<PropFirmRule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearCacheAndRetry = () => {
    localStorage.removeItem('propFirmRules');
    fetchPropFirmRules();
  };

  const fetchPropFirmRules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to load from localStorage
      const savedRules = localStorage.getItem('propFirmRules');
      if (savedRules) {
        try {
          const parsedRules = JSON.parse(savedRules);
          setRules(parsedRules);
          console.log('Prop firm rules loaded from localStorage:', parsedRules.name);
          setLoading(false);
          return;
        } catch (e) {
          console.warn('Failed to parse saved rules from localStorage');
        }
      }
      
      // If no saved rules, try to fetch from API
      const accountType = dashboardData?.userProfile?.accountType || 'QuantTekel Instant';
      console.log('Fetching prop firm rules from backend for account type:', accountType);
      const response = await fetch(`http://localhost:3001/api/test/prop-firm-rules?accountType=${encodeURIComponent(accountType)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const data = await response.json();
      console.log('Prop firm rules response:', data);
      
      if (data.success && data.rules) {
        setRules(data.rules);
        // Save to localStorage for future use
        localStorage.setItem('propFirmRules', JSON.stringify(data.rules));
        console.log('Prop firm rules loaded successfully:', data.rules.name);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching prop firm rules:', err);
      
      // If API fails, use default rules
      const defaultRules: PropFirmRule = {
        name: 'QuantTekel Instant',
        challengeType: 'Instant Funding',
        dailyLossLimit: '$500',
        maxDrawdown: '$2,500',
        profitTarget: '$2,500',
        minTradingDays: '5',
        weekendHolding: 'Allowed',
        newsTrading: 'Allowed',
        description: 'Professional trading rules for instant funding account. Focus on consistent profitability while managing risk effectively.'
      };
      
      setRules(defaultRules);
      // Save default rules to localStorage
      localStorage.setItem('propFirmRules', JSON.stringify(defaultRules));
      setError('Using default rules - API unavailable');
      console.log('Using default prop firm rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dashboardData?.userProfile?.accountType) {
      fetchPropFirmRules();
    }
  }, [dashboardData?.userProfile?.accountType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading prop firm rules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Error loading rules: {error}</p>
          <div className="space-x-4">
            <button 
              onClick={fetchPropFirmRules}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={clearCacheAndRetry}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Cache & Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No prop firm rules available</p>
        </div>
      </div>
    );
  }

  const ruleCards = [
    {
      id: 'daily-loss',
      title: 'Daily Loss Limit',
      value: rules.dailyLossLimit,
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      id: 'max-drawdown',
      title: 'Maximum Drawdown',
      value: rules.maxDrawdown,
      icon: <TrendingDown className="w-6 h-6" />,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      id: 'profit-target',
      title: 'Profit Target',
      value: rules.profitTarget,
      icon: <Target className="w-6 h-6" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      id: 'min-trading-days',
      title: 'Minimum Trading Days',
      value: rules.minTradingDays,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'weekend-holding',
      title: 'Weekend Holding',
      value: rules.weekendHolding,
      icon: rules.weekendHolding === 'Allowed' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />,
      color: rules.weekendHolding === 'Allowed' ? 'text-green-400' : 'text-red-400',
      bgColor: rules.weekendHolding === 'Allowed' ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: rules.weekendHolding === 'Allowed' ? 'border-green-500/20' : 'border-red-500/20'
    },
    {
      id: 'news-trading',
      title: 'News Trading',
      value: rules.newsTrading,
      icon: rules.newsTrading === 'Allowed' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />,
      color: rules.newsTrading === 'Allowed' ? 'text-green-400' : 'text-red-400',
      bgColor: rules.newsTrading === 'Allowed' ? 'bg-green-500/10' : 'bg-red-500/10',
      borderColor: rules.newsTrading === 'Allowed' ? 'border-green-500/20' : 'border-red-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">{rules.name} Rules</h1>
        <p className="text-gray-400 mb-4">{rules.description}</p>
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2">
          <Shield className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 font-medium">{rules.challengeType}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ruleCards.map((rule) => (
          <div 
            key={rule.id} 
            className={`${rule.bgColor} ${rule.borderColor} border rounded-xl p-6 hover:scale-105 transition-transform`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={rule.color}>
                {rule.icon}
              </div>
              <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
            </div>
            <div className={`text-2xl font-bold ${rule.color}`}>
              {rule.value}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-400" />
          Account Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-400">Account Type</p>
            <p className="text-lg font-semibold text-white">{rules.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Challenge Type</p>
            <p className="text-lg font-semibold text-white">{rules.challengeType}</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button 
          onClick={fetchPropFirmRules}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Refresh Rules
        </button>
      </div>
    </div>
  );
};

export default NewPropFirmRules;
