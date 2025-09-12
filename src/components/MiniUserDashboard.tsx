import React, { useState, useEffect } from 'react';
import { 
  User, Settings, DollarSign, TrendingUp, Activity, 
  Shield, Target, Edit, Save, X, AlertCircle, CheckCircle,
  CreditCard, Award, Globe, Lock, Zap
} from 'lucide-react';

import { QuantumUser } from '../services/quantumAdminService';

interface MiniUserDashboardProps {
  user: QuantumUser;
  onUpdate: (userId: string, updates: Partial<QuantumUser>) => void;
  onClose: () => void;
}

const MiniUserDashboard: React.FC<MiniUserDashboardProps> = ({ user, onUpdate, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<QuantumUser>(user);
  const [activeSection, setActiveSection] = useState<'overview' | 'account' | 'trading' | 'risk' | 'settings'>('overview');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setEditedData(user);
  }, [user]);

  const handleSave = () => {
    onUpdate(user.id, editedData);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setEditedData(user);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof QuantumUser, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/20';
      case 'SUSPENDED': return 'text-red-400 bg-red-400/20';
      case 'INACTIVE': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4" />;
      case 'SUSPENDED': return <X className="w-4 h-4" />;
      case 'INACTIVE': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* User Info Card */}
      <div className="mini-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <User className="w-5 h-5 mr-2" />
            User Information
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(editedData.status)}`}>
              {getStatusIcon(editedData.status)}
              <span className="ml-1">{editedData.status}</span>
            </span>
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all"
                  title="Save Changes"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all"
                title="Edit User"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">User ID</label>
            <input
              type="text"
              value={editedData.uniqueId}
              onChange={(e) => handleFieldChange('uniqueId', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={editedData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={editedData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Status</label>
            <select
              value={editedData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="mini-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300">Account Balance</p>
              <p className="text-2xl font-bold text-white">${editedData.currentEquity.toLocaleString()}</p>
            </div>
            <DollarSign className="w-6 h-6 text-cyan-400" />
          </div>
        </div>
        
        <div className="mini-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">Total P&L</p>
              <p className={`text-2xl font-bold ${editedData.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {editedData.totalPnl >= 0 ? '+' : ''}${editedData.totalPnl.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
        </div>
        
        <div className="mini-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">Win Rate</p>
              <p className="text-2xl font-bold text-white">{editedData.winRate.toFixed(1)}%</p>
            </div>
            <Activity className="w-6 h-6 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="space-y-6">
      <div className="mini-card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Account Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Account Size</label>
            <input
              type="number"
              value={editedData.accountSize}
              onChange={(e) => handleFieldChange('accountSize', parseFloat(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Current Equity</label>
            <input
              type="number"
              value={editedData.currentEquity}
              onChange={(e) => handleFieldChange('currentEquity', parseFloat(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Prop Firm</label>
            <select
              value={editedData.propFirm}
              onChange={(e) => handleFieldChange('propFirm', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="FTMO">FTMO</option>
              <option value="MyForexFunds">MyForexFunds</option>
              <option value="TopStep">TopStep</option>
              <option value="The5ers">The5ers</option>
              <option value="Not Set">Not Set</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Account Type</label>
            <select
              value={editedData.accountType}
              onChange={(e) => handleFieldChange('accountType', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="Challenge">Challenge</option>
              <option value="Funded">Funded</option>
              <option value="Live">Live</option>
              <option value="Demo">Demo</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Membership Tier</label>
            <select
              value={editedData.membershipTier}
              onChange={(e) => handleFieldChange('membershipTier', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="Basic">Basic</option>
              <option value="Professional">Professional</option>
              <option value="Elite">Elite</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Payment Status</label>
            <select
              value={editedData.paymentStatus}
              onChange={(e) => handleFieldChange('paymentStatus', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTrading = () => (
    <div className="space-y-6">
      <div className="mini-card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Trading Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Total P&L</label>
            <input
              type="number"
              value={editedData.totalPnl}
              onChange={(e) => handleFieldChange('totalPnl', parseFloat(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Win Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={editedData.winRate}
              onChange={(e) => handleFieldChange('winRate', parseFloat(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Total Trades</label>
            <input
              type="number"
              value={editedData.totalTrades}
              onChange={(e) => handleFieldChange('totalTrades', parseInt(e.target.value))}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Trading Experience</label>
            <select
              value={editedData.tradingExperience}
              onChange={(e) => handleFieldChange('tradingExperience', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRisk = () => (
    <div className="space-y-6">
      <div className="mini-card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Risk Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Risk Tolerance</label>
            <select
              value={editedData.riskTolerance}
              onChange={(e) => handleFieldChange('riskTolerance', e.target.value)}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            >
              <option value="Conservative">Conservative</option>
              <option value="Moderate">Moderate</option>
              <option value="Aggressive">Aggressive</option>
              <option value="Very Aggressive">Very Aggressive</option>
            </select>
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Account Verification</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedData.isVerified}
                  onChange={(e) => handleFieldChange('isVerified', e.target.checked)}
                  disabled={!isEditing}
                  className="mr-2"
                />
                <span className="text-white">Verified</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedData.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  disabled={!isEditing}
                  className="mr-2"
                />
                <span className="text-white">Active</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="mini-card">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Advanced Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Last Active</label>
            <input
              type="datetime-local"
              value={new Date(editedData.lastActive).toISOString().slice(0, 16)}
              onChange={(e) => handleFieldChange('lastActive', new Date(e.target.value).toISOString())}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-cyan-300 text-sm font-medium mb-1">Created At</label>
            <input
              type="datetime-local"
              value={new Date(editedData.createdAt).toISOString().slice(0, 16)}
              onChange={(e) => handleFieldChange('createdAt', new Date(e.target.value).toISOString())}
              disabled={!isEditing}
              className="w-full bg-gray-800 border border-cyan-400/30 rounded px-3 py-2 text-white focus:border-cyan-400 disabled:opacity-50"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mini-dashboard">
      <style>{`
        .mini-dashboard {
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 15px;
          padding: 20px;
          margin-bottom: 20px;
          position: relative;
          backdrop-filter: blur(10px);
          animation: holo-float 6s ease-in-out infinite;
        }
        @keyframes holo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .mini-card {
          background: rgba(0, 20, 40, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .mini-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(0, 255, 255, 0.2);
          padding-bottom: 10px;
        }
        .mini-nav-item {
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 14px;
          font-weight: 500;
        }
        .mini-nav-item.active {
          background: rgba(0, 255, 255, 0.2);
          color: #00ffff;
        }
        .mini-nav-item:not(.active) {
          color: #fff;
          background: transparent;
        }
        .mini-nav-item:hover:not(.active) {
          background: rgba(0, 255, 255, 0.1);
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">{editedData.name}</h2>
          <p className="text-sm text-cyan-400">{editedData.uniqueId} • {editedData.email}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          User updated successfully!
        </div>
      )}

      {/* Navigation */}
      <div className="mini-nav">
        <div
          className={`mini-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <User className="w-4 h-4 inline mr-1" />
          Overview
        </div>
        <div
          className={`mini-nav-item ${activeSection === 'account' ? 'active' : ''}`}
          onClick={() => setActiveSection('account')}
        >
          <CreditCard className="w-4 h-4 inline mr-1" />
          Account
        </div>
        <div
          className={`mini-nav-item ${activeSection === 'trading' ? 'active' : ''}`}
          onClick={() => setActiveSection('trading')}
        >
          <TrendingUp className="w-4 h-4 inline mr-1" />
          Trading
        </div>
        <div
          className={`mini-nav-item ${activeSection === 'risk' ? 'active' : ''}`}
          onClick={() => setActiveSection('risk')}
        >
          <Shield className="w-4 h-4 inline mr-1" />
          Risk
        </div>
        <div
          className={`mini-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveSection('settings')}
        >
          <Settings className="w-4 h-4 inline mr-1" />
          Settings
        </div>
      </div>

      {/* Content */}
      {activeSection === 'overview' && renderOverview()}
      {activeSection === 'account' && renderAccount()}
      {activeSection === 'trading' && renderTrading()}
      {activeSection === 'risk' && renderRisk()}
      {activeSection === 'settings' && renderSettings()}
    </div>
  );
};

export default MiniUserDashboard;
