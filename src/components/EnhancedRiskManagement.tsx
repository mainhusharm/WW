import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface RiskRule {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'position-sizing' | 'stop-loss' | 'take-profit' | 'exposure' | 'correlation';
  isActive: boolean;
  parameters: Record<string, any>;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface RiskMetrics {
  totalPositions: number;
  totalExposure: number;
  maxDrawdown: number;
  sharpeRatio: number;
  var95: number;
  correlationRisk: number;
}

const EnhancedRiskManagement: React.FC = () => {
  const [riskRules, setRiskRules] = useState<RiskRule[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    totalPositions: 0,
    totalExposure: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    var95: 0,
    correlationRisk: 0
  });
  const [selectedRule, setSelectedRule] = useState<RiskRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState('all');

  // Fetch real risk data from API
  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const [rulesResponse, metricsResponse] = await Promise.all([
          fetch('/api/risk-management/rules'),
          fetch('/api/risk-management/metrics')
        ]);
        
        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          setRiskRules(rulesData.rules || []);
        }
        
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setRiskMetrics(metricsData.metrics || {});
        }
      } catch (error) {
        console.error('Error fetching risk data:', error);
        setRiskRules([]);
        setRiskMetrics({});
      }
    };
    
    fetchRiskData();
    // Refresh risk data every 60 seconds
    const interval = setInterval(fetchRiskData, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredRules = riskRules.filter(rule => {
    if (filter === 'all') return true;
    if (filter === 'active') return rule.isActive;
    if (filter === 'inactive') return !rule.isActive;
    return rule.riskLevel === filter;
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'position-sizing': return '📊';
      case 'stop-loss': return '🛑';
      case 'take-profit': return '🎯';
      case 'exposure': return '⚖️';
      case 'correlation': return '🔗';
      default: return '⚙️';
    }
  };

  const handleCreateRule = () => {
    setIsCreating(true);
    setSelectedRule({
      id: Date.now().toString(),
      name: '',
      description: '',
      riskLevel: 'medium',
      category: 'position-sizing',
      isActive: true,
      parameters: {},
      createdAt: new Date().toISOString().split('T')[0],
      triggerCount: 0
    });
  };

  const handleEditRule = (rule: RiskRule) => {
    setSelectedRule(rule);
    setIsEditing(true);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('Are you sure you want to delete this risk rule?')) {
      setRiskRules(riskRules.filter(r => r.id !== id));
    }
  };

  const handleSaveRule = (rule: RiskRule) => {
    if (isCreating) {
      setRiskRules([...riskRules, rule]);
    } else {
      setRiskRules(riskRules.map(r => r.id === rule.id ? rule : r));
    }
    setIsEditing(false);
    setIsCreating(false);
    setSelectedRule(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Risk Management</h1>
          <p className="text-gray-600 mt-2">Advanced risk monitoring and control systems</p>
        </div>

        {/* Risk Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Positions</p>
                <p className="text-2xl font-semibold text-gray-900">{riskMetrics.totalPositions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exposure</p>
                <p className="text-2xl font-semibold text-gray-900">{(riskMetrics.totalExposure * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Max Drawdown</p>
                <p className="text-2xl font-semibold text-gray-900">{(riskMetrics.maxDrawdown * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CogIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sharpe Ratio</p>
                <p className="text-2xl font-semibold text-gray-900">{riskMetrics.sharpeRatio.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">VaR (95%)</p>
                <p className="text-2xl font-semibold text-gray-900">{(riskMetrics.var95 * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Correlation Risk</p>
                <p className="text-2xl font-semibold text-gray-900">{(riskMetrics.correlationRisk * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Rules</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
            <button
              onClick={handleCreateRule}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Rule
            </button>
          </div>
        </div>

        {/* Risk Rules Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Triggers
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(rule.category)}</span>
                        <span className="text-sm text-gray-900 capitalize">{rule.category.replace('-', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskLevelColor(rule.riskLevel)}`}>
                        {rule.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.triggerCount} times
                      {rule.lastTriggered && (
                        <div className="text-xs text-gray-400">
                          Last: {rule.lastTriggered}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRule(rule)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit Rule"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Rule"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rule Modal */}
        {(isEditing || isCreating) && selectedRule && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {isCreating ? 'Create New Rule' : 'Edit Rule'}
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveRule(selectedRule);
                }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedRule.name}
                      onChange={(e) => setSelectedRule({...selectedRule, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedRule.description}
                      onChange={(e) => setSelectedRule({...selectedRule, description: e.target.value})}
                      rows={3}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Risk Level
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedRule.riskLevel}
                      onChange={(e) => setSelectedRule({...selectedRule, riskLevel: e.target.value as any})}
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={selectedRule.category}
                      onChange={(e) => setSelectedRule({...selectedRule, category: e.target.value as any})}
                      required
                    >
                      <option value="position-sizing">Position Sizing</option>
                      <option value="stop-loss">Stop Loss</option>
                      <option value="take-profit">Take Profit</option>
                      <option value="exposure">Exposure</option>
                      <option value="correlation">Correlation</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedRule.isActive}
                        onChange={(e) => setSelectedRule({...selectedRule, isActive: e.target.checked})}
                      />
                      <span className="ml-2 text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        setSelectedRule(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      {isCreating ? 'Create' : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedRiskManagement;
