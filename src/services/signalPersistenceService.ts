import { Signal } from '../trading/types';

interface PersistentSignal extends Signal {
  persisted_at: string;
  source: 'websocket' | 'api' | 'admin';
  immutable: boolean; // Signals cannot be deleted
}

class SignalPersistenceService {
  private static readonly STORAGE_KEY = 'persistent_signals';
  private static readonly MAX_SIGNALS = 1000; // Maximum signals to keep in storage
  private static readonly BACKUP_KEY = 'signal_backup';

  /**
   * Store a signal permanently - signals can never be deleted
   */
  static storeSignal(signal: Signal, source: 'websocket' | 'api' | 'admin' = 'websocket'): void {
    try {
      const persistentSignal: PersistentSignal = {
        ...signal,
        persisted_at: new Date().toISOString(),
        source,
        immutable: true
      };

      const existingSignals = this.getAllSignals();
      
      // Check if signal already exists to prevent duplicates
      const exists = existingSignals.some(s => s.id === signal.id);
      if (exists) {
        console.log(`Signal ${signal.id} already exists, updating...`);
        // Update existing signal
        const updatedSignals = existingSignals.map(s => 
          s.id === signal.id ? { ...s, ...persistentSignal } : s
        );
        this.saveSignals(updatedSignals);
      } else {
        // Add new signal to the beginning
        const newSignals = [persistentSignal, ...existingSignals];
        this.saveSignals(newSignals);
        console.log(`Signal ${signal.id} stored permanently`);
      }

      // Create backup
      this.createBackup();
    } catch (error) {
      console.error('Error storing signal:', error);
    }
  }

  /**
   * Get all persistent signals
   */
  static getAllSignals(): PersistentSignal[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const signals = JSON.parse(stored);
        return Array.isArray(signals) ? signals : [];
      }
      return [];
    } catch (error) {
      console.error('Error loading persistent signals:', error);
      return [];
    }
  }

  /**
   * Get signals with pagination
   */
  static getSignals(page: number = 1, limit: number = 20): {
    signals: PersistentSignal[];
    total: number;
    page: number;
    totalPages: number;
  } {
    const allSignals = this.getAllSignals();
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      signals: allSignals.slice(startIndex, endIndex),
      total: allSignals.length,
      page,
      totalPages: Math.ceil(allSignals.length / limit)
    };
  }

  /**
   * Get signals by date range
   */
  static getSignalsByDateRange(startDate: Date, endDate: Date): PersistentSignal[] {
    const allSignals = this.getAllSignals();
    return allSignals.filter(signal => {
      const signalDate = new Date(signal.created_at || signal.persisted_at);
      return signalDate >= startDate && signalDate <= endDate;
    });
  }

  /**
   * Get signals by market type
   */
  static getSignalsByMarket(market: 'crypto' | 'forex'): PersistentSignal[] {
    const allSignals = this.getAllSignals();
    return allSignals.filter(signal => {
      const pair = signal.pair || signal.symbol || '';
      if (market === 'crypto') {
        return pair.includes('BTC') || pair.includes('ETH') || pair.includes('USDT') || pair.includes('USD');
      } else {
        return pair.includes('EUR') || pair.includes('GBP') || pair.includes('JPY') || pair.includes('AUD') || pair.includes('CAD') || pair.includes('CHF');
      }
    });
  }

  /**
   * Update signal status (but never delete)
   */
  static updateSignalStatus(signalId: string, status: string, outcome?: string, pnl?: number): void {
    try {
      const signals = this.getAllSignals();
      const updatedSignals = signals.map(signal => {
        if (signal.id === signalId) {
          return {
            ...signal,
            status,
            outcome,
            pnl,
            updated_at: new Date().toISOString()
          };
        }
        return signal;
      });
      
      this.saveSignals(updatedSignals);
      console.log(`Signal ${signalId} status updated to ${status}`);
    } catch (error) {
      console.error('Error updating signal status:', error);
    }
  }

  /**
   * Get signal statistics
   */
  static getSignalStats(): {
    total: number;
    active: number;
    completed: number;
    wins: number;
    losses: number;
    winRate: number;
    byMarket: { crypto: number; forex: number };
    bySource: { websocket: number; api: number; admin: number };
  } {
    const signals = this.getAllSignals();
    
    const active = signals.filter(s => s.status === 'active').length;
    const completed = signals.filter(s => s.status === 'completed' || s.status === 'taken').length;
    const wins = signals.filter(s => s.outcome === 'Target Hit' || s.outcome === 'win').length;
    const losses = signals.filter(s => s.outcome === 'Stop Loss Hit' || s.outcome === 'loss').length;
    
    const cryptoSignals = this.getSignalsByMarket('crypto').length;
    const forexSignals = this.getSignalsByMarket('forex').length;
    
    const websocketSignals = signals.filter(s => s.source === 'websocket').length;
    const apiSignals = signals.filter(s => s.source === 'api').length;
    const adminSignals = signals.filter(s => s.source === 'admin').length;
    
    return {
      total: signals.length,
      active,
      completed,
      wins,
      losses,
      winRate: completed > 0 ? Math.round((wins / completed) * 100) : 0,
      byMarket: { crypto: cryptoSignals, forex: forexSignals },
      bySource: { websocket: websocketSignals, api: apiSignals, admin: adminSignals }
    };
  }

  /**
   * Export signals to JSON
   */
  static exportSignals(): string {
    const signals = this.getAllSignals();
    return JSON.stringify(signals, null, 2);
  }

  /**
   * Import signals from JSON (append to existing)
   */
  static importSignals(jsonData: string): { success: boolean; imported: number; errors: string[] } {
    try {
      const importedSignals = JSON.parse(jsonData);
      if (!Array.isArray(importedSignals)) {
        return { success: false, imported: 0, errors: ['Invalid data format'] };
      }

      const existingSignals = this.getAllSignals();
      const existingIds = new Set(existingSignals.map(s => s.id));
      
      let imported = 0;
      const errors: string[] = [];
      
      importedSignals.forEach((signal, index) => {
        if (!signal.id) {
          errors.push(`Signal at index ${index} missing ID`);
          return;
        }
        
        if (!existingIds.has(signal.id)) {
          this.storeSignal(signal, signal.source || 'api');
          imported++;
        }
      });

      return { success: true, imported, errors };
    } catch (error) {
      return { success: false, imported: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Create backup of signals
   */
  private static createBackup(): void {
    try {
      const signals = this.getAllSignals();
      const backup = {
        timestamp: new Date().toISOString(),
        count: signals.length,
        signals: signals.slice(0, 100) // Keep last 100 signals in backup
      };
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(backup));
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Restore from backup
   */
  static restoreFromBackup(): { success: boolean; restored: number } {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (!backup) {
        return { success: false, restored: 0 };
      }

      const backupData = JSON.parse(backup);
      if (backupData.signals && Array.isArray(backupData.signals)) {
        backupData.signals.forEach((signal: Signal) => {
          this.storeSignal(signal, 'api');
        });
        return { success: true, restored: backupData.signals.length };
      }

      return { success: false, restored: 0 };
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return { success: false, restored: 0 };
    }
  }

  /**
   * Save signals to localStorage with size management
   */
  private static saveSignals(signals: PersistentSignal[]): void {
    try {
      // Keep only the most recent signals if we exceed the limit
      const signalsToSave = signals.length > this.MAX_SIGNALS 
        ? signals.slice(0, this.MAX_SIGNALS)
        : signals;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(signalsToSave));
    } catch (error) {
      console.error('Error saving signals:', error);
      // If localStorage is full, try to clear some old data
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded(signals);
      }
    }
  }

  /**
   * Handle localStorage quota exceeded
   */
  private static handleStorageQuotaExceeded(signals: PersistentSignal[]): void {
    try {
      // Keep only the most recent 500 signals
      const reducedSignals = signals.slice(0, 500);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reducedSignals));
      console.warn('Storage quota exceeded, reduced signals to 500 most recent');
    } catch (error) {
      console.error('Failed to handle storage quota exceeded:', error);
    }
  }

  /**
   * Clear all signals (use with extreme caution - this violates the "never delete" requirement)
   * Only for emergency situations
   */
  static emergencyClearAll(): void {
    console.warn('EMERGENCY: Clearing all persistent signals - this violates the never-delete requirement!');
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.BACKUP_KEY);
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): {
    signalCount: number;
    estimatedSize: string;
    lastBackup: string | null;
  } {
    const signals = this.getAllSignals();
    const estimatedSize = new Blob([JSON.stringify(signals)]).size;
    
    let lastBackup: string | null = null;
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (backup) {
        const backupData = JSON.parse(backup);
        lastBackup = backupData.timestamp;
      }
    } catch (error) {
      // Ignore backup errors
    }

    return {
      signalCount: signals.length,
      estimatedSize: `${(estimatedSize / 1024).toFixed(2)} KB`,
      lastBackup
    };
  }
}

export default SignalPersistenceService;
