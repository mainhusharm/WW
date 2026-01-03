import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import api from '../lib/api';

const AccountSettings: React.FC = () => {
  const { user, setUser } = useUser();
  const [riskPerTrade, setRiskPerTrade] = useState(user?.tradingData?.riskPerTrade || '1');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [canUpdate, setCanUpdate] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.tradingData && 'lastRiskUpdate' in user.tradingData) {
      const lastUpdateDate = new Date(user.tradingData.lastRiskUpdate as string);
      setLastUpdated(lastUpdateDate);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      if (lastUpdateDate > twoWeeksAgo) {
        setCanUpdate(false);
      }
    }
  }, [user]);

  const handleRiskChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRiskPerTrade(e.target.value);
  };

  const handleUpdateRisk = async () => {
    if (!canUpdate) {
      setError('You can only update your risk percentage once every two weeks.');
      return;
    }

    if (!user) {
      setError('You must be logged in to update your settings.');
      return;
    }

    try {
      const response = await api.post('/user/update-risk', {
        email: user.email,
        riskPerTrade,
      });
      setUser(response.data.user);
      setError(null);
      alert('Risk per trade updated successfully!');
    } catch (err) {
      setError('Failed to update risk per trade.');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your account details and preferences.</p>
        </div>
      </div>
      <div className="glass-panel">
        <h2 className="text-2xl font-bold text-white mb-6">Risk Management</h2>
        <div className="mb-6">
          <label htmlFor="riskPerTrade" className="block text-sm font-medium text-gray-400 mb-2">
            Risk Per Trade (%)
          </label>
          <input
            type="number"
            id="riskPerTrade"
            value={riskPerTrade}
            onChange={handleRiskChange}
            className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg focus:ring-2 focus:ring-primary-cyan"
            min="0.1"
            max="10"
            step="0.1"
          />
        </div>
        <button
          onClick={handleUpdateRisk}
          disabled={!canUpdate}
          className={`w-full py-3 rounded-lg font-bold transition-colors ${
            canUpdate
              ? 'bg-primary-cyan text-gray-900 hover:bg-cyan-300'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {canUpdate ? 'Update Risk' : 'Update Locked'}
        </button>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {lastUpdated.toLocaleDateString()}
          </p>
        )}
        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default AccountSettings;
