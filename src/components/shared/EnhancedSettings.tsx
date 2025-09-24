import React from 'react';
import { Settings } from 'lucide-react';

interface EnhancedSettingsProps {
  userSettings: any;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;
  handleSettingsUpdate: (key: string, value: any) => void;
  handleNestedSettingsUpdate: (category: string, key: string, value: any) => void;
  handleNotificationUpdate: (key: string, value: boolean) => void;
}

const EnhancedSettings: React.FC<EnhancedSettingsProps> = ({
  userSettings,
  activeSettingsTab,
  setActiveSettingsTab,
  handleSettingsUpdate,
  handleNestedSettingsUpdate,
  handleNotificationUpdate
}) => {
  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'risk', label: 'Risk Management', icon: '⚠️' },
    { id: 'trading', label: 'Trading', icon: '📈' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'data', label: 'Data & Export', icon: '💾' },
    { id: 'api', label: 'API & Integrations', icon: '🔗' }
  ];

  return (
    <div className="space-y-6">
      <div className="holo-card">
        <h2 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          Settings
        </h2>
        
        {/* Settings Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-900/30 rounded-lg">
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeSettingsTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Settings Content */}
        {activeSettingsTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={userSettings.profile?.firstName || ''}
                  onChange={(e) => handleNestedSettingsUpdate('profile', 'firstName', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={userSettings.profile?.lastName || ''}
                  onChange={(e) => handleNestedSettingsUpdate('profile', 'lastName', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'risk' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Risk Management</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2">Risk Per Trade (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={userSettings.riskPerTrade}
                      onChange={(e) => handleSettingsUpdate('riskPerTrade', parseFloat(e.target.value))}
                      className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                    <div className="absolute right-3 top-3 text-cyan-400">%</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">Recommended: 1-2% per trade</div>
                </div>
                
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2">Max Daily Risk (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={userSettings.maxDailyRisk}
                      onChange={(e) => handleSettingsUpdate('maxDailyRisk', parseFloat(e.target.value))}
                      className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                    />
                    <div className="absolute right-3 top-3 text-cyan-400">%</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Preferences</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2">Base Currency</label>
                  <select
                    value={userSettings.currency}
                    onChange={(e) => handleSettingsUpdate('currency', e.target.value)}
                    className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-cyan-300 text-sm font-medium mb-2">Timezone</label>
                  <select
                    value={userSettings.timezone}
                    onChange={(e) => handleSettingsUpdate('timezone', e.target.value)}
                    className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
                  >
                    <option value="America/New_York">New York (EST)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Australia/Sydney">Sydney (AEDT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'trading' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Trading Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Default Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  value={userSettings.trading?.defaultLotSize || 0.1}
                  onChange={(e) => handleNestedSettingsUpdate('trading', 'defaultLotSize', parseFloat(e.target.value))}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Max Positions</label>
                <input
                  type="number"
                  value={userSettings.trading?.maxPositions || 5}
                  onChange={(e) => handleNestedSettingsUpdate('trading', 'maxPositions', parseInt(e.target.value))}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'display' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Display & Theme</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Theme</label>
                <select
                  value={userSettings.display?.theme || 'dark'}
                  onChange={(e) => handleNestedSettingsUpdate('display', 'theme', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Accent Color</label>
                <select
                  value={userSettings.display?.accentColor || 'cyan'}
                  onChange={(e) => handleNestedSettingsUpdate('display', 'accentColor', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="cyan">Cyan</option>
                  <option value="blue">Blue</option>
                  <option value="purple">Purple</option>
                  <option value="green">Green</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Notification Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(userSettings.notifications || {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
                  <span className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1')} Alerts</span>
                  <button
                    onClick={() => handleNotificationUpdate(key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Security Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
                <div>
                  <span className="text-white font-medium">Two-Factor Authentication</span>
                  <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                </div>
                <button
                  onClick={() => handleNestedSettingsUpdate('security', 'twoFactorAuth', !userSettings.security?.twoFactorAuth)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    userSettings.security?.twoFactorAuth ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      userSettings.security?.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'data' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">Data & Export</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Export Format</label>
                <select
                  value={userSettings.data?.exportFormat || 'csv'}
                  onChange={(e) => handleNestedSettingsUpdate('data', 'exportFormat', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="xlsx">Excel</option>
                </select>
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Data Retention</label>
                <select
                  value={userSettings.data?.dataRetention || '1year'}
                  onChange={(e) => handleNestedSettingsUpdate('data', 'dataRetention', e.target.value)}
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                >
                  <option value="1month">1 Month</option>
                  <option value="6months">6 Months</option>
                  <option value="1year">1 Year</option>
                  <option value="forever">Forever</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {activeSettingsTab === 'api' && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white border-b border-cyan-400/30 pb-2">API & Integrations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">API Key</label>
                <input
                  type="password"
                  value={userSettings.api?.apiKey || ''}
                  onChange={(e) => handleNestedSettingsUpdate('api', 'apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-cyan-300 text-sm font-medium mb-2">Webhook URL</label>
                <input
                  type="url"
                  value={userSettings.api?.webhookUrl || ''}
                  onChange={(e) => handleNestedSettingsUpdate('api', 'webhookUrl', e.target.value)}
                  placeholder="https://your-webhook-url.com"
                  className="w-full bg-gray-900/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSettings;
