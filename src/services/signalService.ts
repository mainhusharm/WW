import api from '../lib/api';

export interface Signal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  entry: string | number;
  stopLoss: string | number;
  takeProfit: string | number | string[];
  confidence: number;
  analysis?: string;
  ictConcepts?: string[];
  timestamp: string;
  status: 'active' | 'closed' | 'pending';
  market?: 'crypto' | 'forex';
  timeframe?: string;
}

export interface SignalRelay {
  signalId: string;
  uniqueKey: string;
  signal: Signal;
  timestamp: string;
  status: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  lastAttempt: string;
}

class SignalService {
  private static instance: SignalService;
  private signalQueue: SignalRelay[] = [];
  private isProcessing = false;
  private retryLimit = 3;
  private retryDelay = 5000; // 5 seconds

  private constructor() {
    this.startProcessing();
  }

  public static getInstance(): SignalService {
    if (!SignalService.instance) {
      SignalService.instance = new SignalService();
    }
    return SignalService.instance;
  }

  // Generate unique deduplication key
  private generateUniqueKey(signal: Signal): string {
    const timestampBucket = Math.floor(new Date(signal.timestamp).getTime() / (5 * 60 * 1000)); // 5-minute buckets
    const keyData = `${signal.pair}_${signal.timeframe || 'unknown'}_${signal.direction}_${signal.entry}_${signal.stopLoss}_${Array.isArray(signal.takeProfit) ? signal.takeProfit.join('_') : signal.takeProfit}_${timestampBucket}`;
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < keyData.length; i++) {
      const char = keyData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Add signal to relay queue
  public async addSignal(signal: Signal): Promise<boolean> {
    try {
      const uniqueKey = this.generateUniqueKey(signal);
      
      // Check if signal already exists
      const existingSignal = await this.checkSignalExists(uniqueKey);
      if (existingSignal) {
        console.log(`Signal with key ${uniqueKey} already exists, skipping duplicate`);
        return false;
      }

      const signalRelay: SignalRelay = {
        signalId: signal.id,
        uniqueKey,
        signal,
        timestamp: new Date().toISOString(),
        status: 'pending',
        retryCount: 0,
        lastAttempt: new Date().toISOString()
      };

      this.signalQueue.push(signalRelay);
      console.log(`Signal added to relay queue: ${signal.pair} ${signal.direction}`);
      
      // Trigger processing if not already running
      if (!this.isProcessing) {
        this.startProcessing();
      }

      return true;
    } catch (error) {
      console.error('Error adding signal to relay queue:', error);
      return false;
    }
  }

  // Check if signal already exists in user feed
  private async checkSignalExists(uniqueKey: string): Promise<boolean> {
    try {
      const response = await api.get(`/api/signals/check/${uniqueKey}`);
      return response.data.exists;
    } catch (error) {
      console.warn('Could not check signal existence, proceeding with relay:', error);
      return false;
    }
  }

  // Process signal queue
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.signalQueue.length > 0) {
      const signalRelay = this.signalQueue.shift();
      if (!signalRelay) continue;

      try {
        await this.relaySignal(signalRelay);
      } catch (error) {
        console.error(`Error relaying signal ${signalRelay.signalId}:`, error);
        
        // Handle retry logic
        if (signalRelay.retryCount < this.retryLimit) {
          signalRelay.retryCount++;
          signalRelay.status = 'pending';
          signalRelay.lastAttempt = new Date().toISOString();
          
          // Add back to queue with delay
          setTimeout(() => {
            this.signalQueue.push(signalRelay);
          }, this.retryDelay * signalRelay.retryCount);
        } else {
          signalRelay.status = 'failed';
          console.error(`Signal ${signalRelay.signalId} failed after ${this.retryLimit} retries`);
        }
      }
    }
    
    this.isProcessing = false;
  }

  // Relay signal to user feed
  private async relaySignal(signalRelay: SignalRelay): Promise<void> {
    try {
      // Convert signal to the format expected by the backend
      const backendSignal = {
        symbol: signalRelay.signal.pair,
        side: signalRelay.signal.direction === 'LONG' ? 'buy' : 'sell',
        entry_price: parseFloat(signalRelay.signal.entry.toString()),
        stop_loss: parseFloat(signalRelay.signal.stopLoss.toString()),
        take_profit: parseFloat(Array.isArray(signalRelay.signal.takeProfit) 
          ? signalRelay.signal.takeProfit[0].toString() 
          : signalRelay.signal.takeProfit.toString()),
        risk_tier: 'medium', // Default risk tier
        analysis: signalRelay.signal.analysis || '',
        confidence: signalRelay.signal.confidence || 80
      };

      // Send to backend signals endpoint (which will automatically relay to user feed)
      const response = await api.post('/api/signals', backendSignal);

      if (response.status === 201) {
        signalRelay.status = 'delivered';
        console.log(`Signal ${signalRelay.signalId} successfully sent to backend and relayed to user feed`);
        
        // Broadcast via WebSocket if available
        this.broadcastSignal(signalRelay.signal);
      } else {
        throw new Error(`Backend returned status ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to relay signal: ${error}`);
    }
  }

  // Broadcast signal via WebSocket
  private broadcastSignal(signal: Signal): void {
    try {
      // Check if WebSocket is available
      if (window.signalSocket && window.signalSocket.readyState === WebSocket.OPEN) {
        window.signalSocket.send(JSON.stringify({
          type: 'newSignal',
          signal: signal
        }));
      }
    } catch (error) {
      console.warn('WebSocket broadcast failed:', error);
    }
  }

  // Get signal statistics
  public getStats(): { queueLength: number; delivered: number; failed: number; pending: number } {
    const delivered = this.signalQueue.filter(s => s.status === 'delivered').length;
    const failed = this.signalQueue.filter(s => s.status === 'failed').length;
    const pending = this.signalQueue.filter(s => s.status === 'pending').length;

    return {
      queueLength: this.signalQueue.length,
      delivered,
      failed,
      pending
    };
  }

  // Clear failed signals
  public clearFailedSignals(): void {
    this.signalQueue = this.signalQueue.filter(s => s.status !== 'failed');
  }
}

// Global WebSocket interface
declare global {
  interface Window {
    signalSocket?: WebSocket;
  }
}

export default SignalService.getInstance();
