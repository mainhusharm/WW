import React, { useState, useEffect } from 'react';
import SignalPersistenceService from '../services/signalPersistenceService';

interface SignalStats {
  total: number;
  active: number;
  completed: number;
  wins: number;
  losses: number;
  winRate: number;
  byMarket: { crypto: number; forex: number };
  bySource: { websocket: number; api: number; admin: number };
}

interface StorageInfo {
  signalCount: number;
  estimatedSize: string;
  lastBackup: string | null;
}

const SignalPersistenceManager: React.FC = () => {
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [exportData, setExportData] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; errors: string[] } | null>(null);

  useEffect(() => {
    loadStats();
    loadStorageInfo();
  }, []);

  const loadStats = () => {
    const signalStats = SignalPersistenceService.getSignalStats();
    setStats(signalStats);
  };

  const loadStorageInfo = () => {
    const info = SignalPersistenceService.getStorageInfo();
    setStorageInfo(info);
  };

  const handleExport = () => {
    const data = SignalPersistenceService.exportSignals();
    setExportData(data);
    setShowExport(true);
  };

  const handleImport = () => {
    if (!importData.trim()) {
      setImportResult({ success: false, imported: 0, errors: ['No data provided'] });
      return;
    }

    const result = SignalPersistenceService.importSignals(importData);
    setImportResult(result);
    
    if (result.success) {
      loadStats();
      loadStorageInfo();
      setImportData('');
    }
  };

  const handleRestoreBackup = () => {
    const result = SignalPersistenceService.restoreFromBackup();
    if (result.success) {
      alert(`Restored ${result.restored} signals from backup`);
      loadStats();
      loadStorageInfo();
    } else {
      alert('No backup found or restore failed');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  if (!stats || !storageInfo) {
    return <div>Loading persistence information...</div>;
  }

  return (
    <div className="signal-persistence-manager bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">Signal Persistence Manager</h2>
      
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Signals</div>
        </div>
        <div className="bg-green-700/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.active}</div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-blue-700/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{stats.winRate}%</div>
          <div className="text-sm text-gray-400">Win Rate</div>
        </div>
        <div className="bg-purple-700/50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-white">{storageInfo.estimatedSize}</div>
          <div className="text-sm text-gray-400">Storage Used</div>
        </div>
      </div>

      {/* Market Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">By Market</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Crypto</span>
              <span className="text-white font-semibold">{stats.byMarket.crypto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Forex</span>
              <span className="text-white font-semibold">{stats.byMarket.forex}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">By Source</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">WebSocket</span>
              <span className="text-white font-semibold">{stats.bySource.websocket}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">API</span>
              <span className="text-white font-semibold">{stats.bySource.api}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Admin</span>
              <span className="text-white font-semibold">{stats.bySource.admin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-gray-700/30 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Storage Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400">Signal Count</div>
            <div className="text-white font-semibold">{storageInfo.signalCount}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Estimated Size</div>
            <div className="text-white font-semibold">{storageInfo.estimatedSize}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Last Backup</div>
            <div className="text-white font-semibold">
              {storageInfo.lastBackup ? new Date(storageInfo.lastBackup).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Export Signals
          </button>
          <button
            onClick={handleRestoreBackup}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Restore from Backup
          </button>
          <button
            onClick={() => {
              loadStats();
              loadStorageInfo();
            }}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Refresh Stats
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-gray-700/30 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Import Signals</h3>
          <textarea
            value={importData}
            onChange={(e) => setImportData(e.target.value)}
            placeholder="Paste JSON data here..."
            className="w-full h-32 p-3 bg-gray-800 text-white rounded-lg border border-gray-600 resize-none"
          />
          <div className="flex gap-3 mt-3">
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => {
                setImportData('');
                setImportResult(null);
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Clear
            </button>
          </div>
          {importResult && (
            <div className={`mt-3 p-3 rounded-lg ${
              importResult.success ? 'bg-green-600/20 border border-green-500' : 'bg-red-600/20 border border-red-500'
            }`}>
              <div className={`font-semibold ${importResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </div>
              <div className="text-sm text-gray-300">
                Imported: {importResult.imported} signals
              </div>
              {importResult.errors.length > 0 && (
                <div className="text-sm text-red-300 mt-2">
                  Errors: {importResult.errors.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Export Signals</h3>
              <button
                onClick={() => setShowExport(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <textarea
              value={exportData}
              readOnly
              className="w-full h-96 p-3 bg-gray-900 text-white rounded-lg border border-gray-600 resize-none font-mono text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => copyToClipboard(exportData)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-500 rounded-lg">
        <div className="text-yellow-300 font-semibold mb-2">⚠️ Important Notice</div>
        <div className="text-sm text-yellow-200">
          Signals are stored permanently and cannot be deleted. This ensures that all trading signals 
          remain available regardless of logout, login, or page reload. The system automatically manages 
          storage space by keeping the most recent signals.
        </div>
      </div>
    </div>
  );
};

export default SignalPersistenceManager;
