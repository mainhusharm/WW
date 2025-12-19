import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import TradingJournalEntry, { JournalEntry } from './TradingJournalEntry';

const TradingJournalDashboard: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    const savedEntries = localStorage.getItem('journal_entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  const handleSaveEntry = (entry: JournalEntry) => {
    const updatedEntries = editingEntry
      ? entries.map(e => e.id === entry.id ? entry : e)
      : [...entries, entry];
    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
    setIsEntryModalOpen(false);
    setEditingEntry(null);
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setIsEntryModalOpen(true);
  };

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = entries.filter(e => e.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trading Journal</h1>
          <p className="page-subtitle">Review and analyze your past trades.</p>
        </div>
        <button onClick={() => { setEditingEntry(null); setIsEntryModalOpen(true); }} className="action-btn flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      <div className="glass-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-4 text-gray-400">Date</th>
                <th className="p-4 text-gray-400">Symbol</th>
                <th className="p-4 text-gray-400">Direction</th>
                <th className="p-4 text-gray-400">P&L</th>
                <th className="p-4 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="p-4 text-white">{new Date(entry.dateTime).toLocaleString()}</td>
                  <td className="p-4 text-white">{entry.symbol}</td>
                  <td className={`p-4 font-semibold ${entry.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>{entry.direction.toUpperCase()}</td>
                  <td className={`p-4 font-semibold ${entry.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>${entry.profitLoss.toFixed(2)}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditEntry(entry)} className="text-blue-400 hover:text-blue-300"><Edit size={18} /></button>
                      <button onClick={() => handleDeleteEntry(entry.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TradingJournalEntry
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onSave={handleSaveEntry}
        editEntry={editingEntry}
      />
    </div>
  );
};

export default TradingJournalDashboard;
