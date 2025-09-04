/**
 * Enhanced Real-time Signal Service
 * Handles persistent signal storage and real-time delivery from admin to users
 */

import { io, Socket } from 'socket.io-client';
import { Signal } from '../trading/types';

interface SignalServiceCallbacks {
  onSignalReceived?: (signal: Signal) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onSystemMessage?: (message: any) => void;
}

interface StoredSignal extends Signal {
  timestamp: string;
  isPersistent: boolean;
  source: 'admin' | 'bot' | 'system';
}

class EnhancedSignalService {
  private socket: Socket | null = null;
  private callbacks: SignalServiceCallbacks = {};
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private userToken: string | null = null;
  private signals: StoredSignal[] = [];
  private isInitialized = false;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.userToken = localStorage.getItem('access_token') || sessionStorage.getItem('session_token');
    // Clear all existing signals to start fresh - only show new signals from admin dashboard
    this.clearAllSignals();
  }

  /**
   * Clear all signals from storage and memory
   */
  private clearAllSignals() {
    this.signals = [];
    localStorage.removeItem('persistent_signals');
    console.log('🧹 Cleared all existing signals - starting fresh');
  }

  /**
   * Load persistent signals from localStorage
   */
  private loadPersistentSignals() {
    try {
      const stored = localStorage.getItem('persistent_signals');
      if (stored) {
        this.signals = JSON.parse(stored);
        console.log(`Loaded ${this.signals.length} persistent signals`);
      }
    } catch (error) {
      console.error('Error loading persistent signals:', error);
      this.signals = [];
    }
  }

  /**
   * Save persistent signals to localStorage
   */
  private savePersistentSignals() {
    try {
      localStorage.setItem('persistent_signals', JSON.stringify(this.signals));
    } catch (error) {
      console.error('Error saving persistent signals:', error);
    }
  }

  /**
   * Add signal to persistent storage
   */
  private addPersistentSignal(signal: Signal, source: 'admin' | 'bot' | 'system' = 'admin') {
    const storedSignal: StoredSignal = {
      ...signal,
      timestamp: new Date().toISOString(),
      isPersistent: true,
      source
    };

    // Check for duplicates
    const existingIndex = this.signals.findIndex(s => s.id === signal.id);
    if (existingIndex === -1) {
      this.signals.unshift(storedSignal);
      this.savePersistentSignals();
      console.log(`Added persistent signal: ${signal.id}`);
    }
  }

  /**
   * Get all persistent signals
   */
  getPersistentSignals(): StoredSignal[] {
    return [...this.signals];
  }

  /**
   * Set user authentication token
   */
  setToken(token: string) {
    this.userToken = token;
    localStorage.setItem('access_token', token);
  }

  /**
   * Clear user authentication token
   */
  clearToken() {
    this.userToken = null;
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('session_token');
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: SignalServiceCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Connect to Socket.IO server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      const socketUrl = 'https://backend-bkt7.onrender.com';
      
      console.log(`🔌 Connecting to Socket.IO at: ${socketUrl}`);

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.isConnecting) {
          console.error('❌ Connection timeout after 15 seconds');
          this.isConnecting = false;
          this.callbacks.onError?.(new Error('Connection timeout'));
          reject(new Error('Connection timeout'));
        }
      }, 15000); // 15 second timeout

      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        forceNew: true,
        timeout: 20000,
        auth: this.userToken ? { token: this.userToken } : undefined,
        query: {
          t: Date.now() // Cache busting
        }
      });

      // Connection success
      this.socket.on('connect', () => {
        console.log('✅ Socket.IO connected successfully');
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.callbacks.onConnected?.();
        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ Socket.IO connection error:', error);
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
        reject(error);
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket.IO disconnected: ${reason}`);
        this.isConnecting = false;
        this.callbacks.onDisconnected?.();

        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          return;
        }

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`🔄 Attempting to reconnect in ${delay/1000} seconds...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect().catch(console.error);
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
        }
      });

      // Signal received from admin
      this.socket.on('new_signal', (signalData: any) => {
        console.log('📡 Received new signal from admin:', signalData);
        
        // Transform signal data to match frontend interface
        const signal: Signal = {
          id: signalData.id || Date.now().toString(),
          pair: signalData.pair || signalData.symbol,
          direction: signalData.direction || signalData.side?.toUpperCase() || 'BUY',
          entry: signalData.entry || signalData.entry_price,
          entryPrice: parseFloat(signalData.entry_price || signalData.entry) || 0,
          stopLoss: signalData.stopLoss || signalData.stop_loss,
          takeProfit: signalData.takeProfit || signalData.take_profit,
          timeframe: signalData.timeframe || '1H',
          status: signalData.status || 'active',
          createdAt: signalData.created_at || new Date().toISOString(),
          description: signalData.analysis || signalData.description || '',
          confidence: signalData.confidence || 85,
          analysis: signalData.analysis || 'Professional signal analysis',
          ictConcepts: signalData.ictConcepts || signalData.ict_concepts || [],
          is_recommended: signalData.is_recommended || false,
          market: signalData.market || 'forex'
        };

        // Add to persistent storage
        this.addPersistentSignal(signal, 'admin');

        // Notify callbacks
        this.callbacks.onSignalReceived?.(signal);
      });

      // System messages
      this.socket.on('system:message', (message: any) => {
        console.log('📢 Received system message:', message);
        this.callbacks.onSystemMessage?.(message);
      });

      // Connection confirmation
      this.socket.on('connected', (data: any) => {
        console.log('✅ Connection confirmed:', data);
      });

      // Ping/Pong for connection health
      this.socket.on('pong', (data: any) => {
        console.log('🏓 Pong received:', data);
      });
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from Socket.IO');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.stopPolling();
  }

  /**
   * Send ping to server
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping', { timestamp: new Date().toISOString() });
    }
  }

  /**
   * Join additional room
   */
  joinRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_room', { room });
    }
  }

  /**
   * Leave room
   */
  leaveRoom(room: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_room', { room });
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.socket?.connected) return 'connected';
    if (this.pollingInterval) return 'connected'; // API polling is active
    return 'disconnected';
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    // Always start with API loading first to get existing signals
    try {
      console.log('🔄 Loading existing signals from API...');
      await this.loadSignalsFromAPI();
      console.log('✅ Loaded existing signals from API');
    } catch (error) {
      console.error('❌ Failed to load existing signals:', error);
    }
    
    // Try WebSocket connection
    try {
      await this.connect();
      this.isInitialized = true;
      console.log('🚀 Enhanced Signal Service initialized with WebSocket');
    } catch (error) {
      console.error('❌ WebSocket connection failed, using API fallback:', error);
      
      // Set up polling for new signals every 10 seconds
      this.startPolling();
      this.isInitialized = true;
      console.log('🚀 Enhanced Signal Service initialized with API fallback');
      
      // Set connection status to connected since we're using API polling
      this.callbacks.onConnected?.();
    }
  }

  /**
   * Start polling for new signals from API
   */
  private startPolling() {
    if (this.pollingInterval) return;
    
    console.log('🔄 Starting API polling for signals...');
    this.pollingInterval = setInterval(async () => {
      try {
        await this.loadSignalsFromAPI();
      } catch (error) {
        console.error('❌ Error during API polling:', error);
      }
    }, 10000); // Poll every 10 seconds
  }

  /**
   * Stop polling for signals
   */
  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('🛑 Stopped API polling');
    }
  }

  /**
   * Fallback method to load signals from API
   */
  private async loadSignalsFromAPI() {
    try {
      console.log('🔄 Loading signals from API as fallback...');
      console.log('🔍 Current signals count:', this.signals.length);
      
      // Try multiple possible endpoints
      const endpoints = [
        'https://backend-bkt7.onrender.com/api/signals',
        'https://backend-bkt7.onrender.com/api/admin/signals',
        'https://backend-bkt7.onrender.com/signals',
        'https://backend-bkt7.onrender.com/api/get-signals'
      ];
      
      let signals: any[] = [];
      let endpointUsed = '';
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': this.userToken ? `Bearer ${this.userToken}` : '',
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              signals = data;
              endpointUsed = endpoint;
              break;
            } else if (data.signals && Array.isArray(data.signals)) {
              signals = data.signals;
              endpointUsed = endpoint;
              break;
            }
          }
        } catch (error) {
          console.log(`❌ Endpoint ${endpoint} failed:`, error);
          continue;
        }
      }
      
      if (signals.length > 0) {
        console.log(`✅ Loaded ${signals.length} signals from ${endpointUsed}`);
        console.log('🔍 Raw signals from backend:', signals);
        const existingSignalIds = new Set(this.signals.map(s => s.id));
        console.log('🔍 Existing signal IDs:', Array.from(existingSignalIds));
        let newSignalsCount = 0;
        
        signals.forEach(signal => {
          // Only process signals generated from admin dashboard (admin_generated source)
          if (signal.source === 'admin_generated' && !existingSignalIds.has(signal.id)) {
            // Transform backend signal format to frontend format
            const transformedSignal: Signal = {
              id: signal.id,
              pair: signal.pair,
              symbol: signal.pair,
              direction: signal.direction === 'BUY' ? 'LONG' : signal.direction === 'SELL' ? 'SHORT' : signal.direction,
              action: signal.direction === 'LONG' || signal.direction === 'BUY' ? 'BUY' : 'SELL',
              entry: signal.entry_price,
              entryPrice: parseFloat(signal.entry_price) || 0,
              stopLoss: parseFloat(signal.stop_loss) || 0,
              takeProfit: parseFloat(signal.take_profit) || 0,
              timeframe: signal.timeframe || '1h',
              status: signal.status || 'active',
              createdAt: signal.created_at,
              description: signal.analysis || '',
              confidence: signal.confidence || 85,
              rrRatio: '1:2',
              analysis: signal.analysis || 'Professional signal analysis',
              riskTier: 'medium',
              market: signal.market || 'forex',
              ictConcepts: signal.ict_concepts || [],
              is_recommended: signal.confidence > 80
            };
            
            // This is a new signal from admin dashboard
            this.addPersistentSignal(transformedSignal, 'admin');
            this.callbacks.onSignalReceived?.(transformedSignal);
            newSignalsCount++;
          }
        });
        
        if (newSignalsCount > 0) {
          console.log(`✅ Found ${newSignalsCount} new signals from API`);
        }
      } else {
        console.log('ℹ️ No signals endpoint found, waiting for admin to generate signals');
        // Don't generate test signals - only show real signals from admin
      }
    } catch (error) {
      console.error('❌ Failed to load signals from API:', error);
      // Don't generate test signals - only show real signals from admin
    }
  }



  /**
   * Get signal statistics
   */
  getSignalStats() {
    const total = this.signals.length;
    const recent = this.signals.filter(s => {
      const signalDate = new Date(s.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return signalDate > weekAgo;
    }).length;
    
    return {
      total,
      recent,
      delivered: total // All signals are considered delivered since they're persistent
    };
  }

  /**
   * Manually trigger API loading for testing
   */
  async forceLoadSignals() {
    console.log('🧪 Manually triggering signal loading...');
    await this.loadSignalsFromAPI();
  }

  /**
   * Get current signals count for debugging
   */
  getSignalsCount() {
    return this.signals.length;
  }

  /**
   * Get all signals for debugging
   */
  getAllSignals() {
    return this.signals;
  }

  /**
   * Clear all signals and reload from API
   */
  async clearAndReload() {
    console.log('🧹 Clearing all signals and reloading...');
    this.clearAllSignals();
    await this.loadSignalsFromAPI();
    console.log(`✅ Reloaded ${this.signals.length} signals`);
  }

  /**
   * Force refresh signals from backend
   */
  async refreshSignals() {
    console.log('🔄 Force refreshing signals from backend...');
    await this.loadSignalsFromAPI();
    console.log(`✅ Refreshed ${this.signals.length} signals`);
  }
}

// Export singleton instance
export const enhancedSignalService = new EnhancedSignalService();

// Make service available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).enhancedSignalService = enhancedSignalService;
}

export default enhancedSignalService;
