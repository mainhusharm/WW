import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Info, Shield, AlertCircle } from 'lucide-react';
import propFirmRulesService, { PropFirmRules, TradingActivity, ComplianceResult } from '../services/propFirmRulesService';

interface PropFirmComplianceProps {
  userPropFirm?: string;
  onComplianceChange?: (compliant: boolean, warnings: string[]) => void;
}

const PropFirmCompliance: React.FC<PropFirmComplianceProps> = ({ 
  userPropFirm, 
  onComplianceChange 
}) => {
  const [propFirmRules, setPropFirmRules] = useState<PropFirmRules | null>(null);
  const [complianceResult, setComplianceResult] = useState<ComplianceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState(userPropFirm || '');
  const [availableFirms, setAvailableFirms] = useState<PropFirmRules[]>([]);
  const [tradingActivity, setTradingActivity] = useState<TradingActivity>({
    hold_time_seconds: 60,
    trades_today: 5,
    martingale_positions: 1,
    lot_size: 0.1,
    reverse_trading: false
  });

  // Load available prop firms
  useEffect(() => {
    const loadFirms = async () => {
      try {
        const result = await propFirmRulesService.getAllPropFirmRules(200);
        setAvailableFirms(result.firms);
      } catch (error) {
        console.error('Error loading prop firms:', error);
      }
    };
    loadFirms();
  }, []);

  // Load prop firm rules when selected
  useEffect(() => {
    if (selectedFirm) {
      loadPropFirmRules(selectedFirm);
    }
  }, [selectedFirm]);

  // Check compliance when rules or activity changes
  useEffect(() => {
    if (propFirmRules && selectedFirm) {
      checkCompliance();
    }
  }, [propFirmRules, tradingActivity, selectedFirm]);

  const loadPropFirmRules = async (firmName: string) => {
    setIsLoading(true);
    try {
      const rules = await propFirmRulesService.getPropFirmRules(firmName);
      setPropFirmRules(rules);
    } catch (error) {
      console.error('Error loading prop firm rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCompliance = async () => {
    if (!selectedFirm || !propFirmRules) return;
    
    try {
      const result = await propFirmRulesService.checkCompliance(selectedFirm, tradingActivity);
      setComplianceResult(result);
      
      // Notify parent component
      if (onComplianceChange) {
        onComplianceChange(result.compliant, result.warnings);
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
    }
  };

  const handleTradingActivityChange = (field: keyof TradingActivity, value: any) => {
    setTradingActivity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatRules = () => {
    if (!propFirmRules) return null;
    
    return propFirmRulesService.formatRulesForDisplay(propFirmRules);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-400">Loading prop firm rules...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-white">Prop Firm Compliance</h2>
            <p className="text-gray-400">Real-time rules tracking and compliance checking</p>
          </div>
        </div>
        <button
          onClick={() => selectedFirm && loadPropFirmRules(selectedFirm)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Rules</span>
        </button>
      </div>

      {/* Prop Firm Selection */}
      <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Select Prop Firm</h3>
        <select
          value={selectedFirm}
          onChange={(e) => setSelectedFirm(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a prop firm...</option>
          {availableFirms.map((firm) => (
            <option key={firm.id} value={firm.name}>
              {firm.name}
            </option>
          ))}
        </select>
      </div>

      {/* Prop Firm Rules Display */}
      {propFirmRules && (
        <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Rules for {propFirmRules.name}</h3>
            <div className="flex items-center space-x-2 text-sm">
              {getStatusIcon(propFirmRules.scraping_status || 'unknown')}
              <span className="text-gray-400">
                Last updated: {new Date(propFirmRules.last_updated).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* HFT Rules */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                High Frequency Trading (HFT)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Allowed:</span>
                  <span className={formatRules()?.hft.allowed ? 'text-green-400' : 'text-red-400'}>
                    {formatRules()?.hft.allowed ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {formatRules()?.hft.details}
                </div>
              </div>
            </div>

            {/* Martingale Rules */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                Martingale Strategy
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Allowed:</span>
                  <span className={formatRules()?.martingale.allowed ? 'text-green-400' : 'text-red-400'}>
                    {formatRules()?.martingale.allowed ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {formatRules()?.martingale.details}
                </div>
              </div>
            </div>

            {/* Lot Size Rules */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                Lot Size Limits
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Max Lot Size:</span>
                  <span className="text-white">{formatRules()?.lotSize.limit}</span>
                </div>
                <div className="text-sm text-gray-300">
                  {formatRules()?.lotSize.details}
                </div>
              </div>
            </div>

            {/* Reverse Trading Rules */}
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <h4 className="font-semibold text-white mb-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                Reverse Trading
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Allowed:</span>
                  <span className={formatRules()?.reverseTrading.allowed ? 'text-green-400' : 'text-red-400'}>
                    {formatRules()?.reverseTrading.allowed ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {formatRules()?.reverseTrading.details}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Rules */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Daily Loss Limit</div>
              <div className="text-white font-semibold">{propFirmRules.daily_loss_limit}%</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Max Drawdown</div>
              <div className="text-white font-semibold">{propFirmRules.max_drawdown}%</div>
            </div>
            <div className="bg-gray-700/50 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Min Trading Days</div>
              <div className="text-white font-semibold">{propFirmRules.min_trading_days} days</div>
            </div>
          </div>
        </div>
      )}

      {/* Trading Activity Input */}
      {propFirmRules && (
        <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Trading Activity Input</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Hold Time (seconds)
              </label>
              <input
                type="number"
                value={tradingActivity.hold_time_seconds}
                onChange={(e) => handleTradingActivityChange('hold_time_seconds', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trades Today
              </label>
              <input
                type="number"
                value={tradingActivity.trades_today}
                onChange={(e) => handleTradingActivityChange('trades_today', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lot Size
              </label>
              <input
                type="number"
                step="0.01"
                value={tradingActivity.lot_size}
                onChange={(e) => handleTradingActivityChange('lot_size', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Martingale Positions
              </label>
              <input
                type="number"
                value={tradingActivity.martingale_positions}
                onChange={(e) => handleTradingActivityChange('martingale_positions', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg text-white p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={tradingActivity.reverse_trading}
                  onChange={(e) => handleTradingActivityChange('reverse_trading', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-300">Reverse Trading</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Results */}
      {complianceResult && (
        <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            {complianceResult.compliant ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            )}
            <h3 className="text-lg font-semibold text-white">
              Compliance Status: {complianceResult.compliant ? 'Compliant' : 'Non-Compliant'}
            </h3>
          </div>

          {complianceResult.warnings.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-red-400 mb-2">⚠️ Warnings:</h4>
              <ul className="space-y-1">
                {complianceResult.warnings.map((warning, index) => (
                  <li key={index} className="text-red-300 text-sm flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {complianceResult.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">💡 Recommendations:</h4>
              <ul className="space-y-1">
                {complianceResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-blue-300 text-sm flex items-start">
                    <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Rules Source Info */}
      {propFirmRules?.rules_source_url && (
        <div className="bg-gray-800/60 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Rules source: <a 
                href={propFirmRules.rules_source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {propFirmRules.rules_source_url}
              </a>
            </span>
            <span className="text-gray-400">
              Last verified: {propFirmRules.rules_last_verified ? 
                new Date(propFirmRules.rules_last_verified).toLocaleDateString() : 
                'Unknown'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropFirmCompliance;
