import api from '../lib/api';

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class JournalService {
  private baseUrl = '/api/journal';

  // Save journal entry to both localStorage and database
  async saveEntry(entry: JournalEntry, userEmail: string): Promise<JournalEntry> {
    try {
      // First save to localStorage for immediate access
      const existingEntries = this.getLocalEntries(userEmail);
      const updatedEntries = existingEntries.filter(e => e.id !== entry.id);
      updatedEntries.push(entry);
      localStorage.setItem(`journal_entries_${userEmail}`, JSON.stringify(updatedEntries));

      // Then try to save to database
      try {
        const response = await api.post(`${this.baseUrl}/entries`, {
          ...entry,
          userEmail
        });
        return response.data;
      } catch (dbError) {
        console.warn('Failed to save to database, using localStorage only:', dbError);
        return entry;
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      throw error;
    }
  }

  // Get journal entries from localStorage (with database sync)
  async getEntries(userEmail: string): Promise<JournalEntry[]> {
    try {
      // First try to get from database
      try {
        const response = await api.get(`${this.baseUrl}/entries?userEmail=${userEmail}`);
        const dbEntries = response.data;
        
        // Ensure dbEntries is an array
        const entriesArray = Array.isArray(dbEntries) ? dbEntries : [];
        
        // Update localStorage with database data
        localStorage.setItem(`journal_entries_${userEmail}`, JSON.stringify(entriesArray));
        return entriesArray;
      } catch (dbError) {
        console.warn('Failed to fetch from database, using localStorage:', dbError);
        return this.getLocalEntries(userEmail);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return this.getLocalEntries(userEmail);
    }
  }

  // Get entries from localStorage only
  private getLocalEntries(userEmail: string): JournalEntry[] {
    try {
      const saved = localStorage.getItem(`journal_entries_${userEmail}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (error) {
      console.error('Error parsing journal entries from localStorage:', error);
      return [];
    }
  }

  // Delete journal entry
  async deleteEntry(entryId: string, userEmail: string): Promise<void> {
    try {
      // Remove from localStorage
      const existingEntries = this.getLocalEntries(userEmail);
      const updatedEntries = existingEntries.filter(e => e.id !== entryId);
      localStorage.setItem(`journal_entries_${userEmail}`, JSON.stringify(updatedEntries));

      // Try to delete from database
      try {
        await api.delete(`${this.baseUrl}/entries/${entryId}`);
      } catch (dbError) {
        console.warn('Failed to delete from database, using localStorage only:', dbError);
      }
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  }

  // Update journal entry
  async updateEntry(entry: JournalEntry, userEmail: string): Promise<JournalEntry> {
    return this.saveEntry(entry, userEmail);
  }

  // Sync localStorage with database
  async syncWithDatabase(userEmail: string): Promise<void> {
    try {
      const localEntries = this.getLocalEntries(userEmail);
      if (localEntries.length === 0) return;

      // Send all local entries to database
      await api.post(`${this.baseUrl}/sync`, {
        userEmail,
        entries: localEntries
      });
    } catch (error) {
      console.warn('Failed to sync with database:', error);
    }
  }
}

export const journalService = new JournalService();
export default journalService;
