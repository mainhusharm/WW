import { io, Socket } from 'socket.io-client';
import { API_CONFIG, WS_CONFIG } from '../api/config';
import { Signal } from '../trading/types';
import SignalPersistenceService from './signalPersistenceService';

interface SignalServiceCallbacks {
  onNewSignal?: (signal: Signal) => void;
  onSignalUpdate?: (signal: Signal) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

class RealTimeSignalService {
  private socket: Socket | null = null;
  private callbacks: SignalServiceCallbacks = {};
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000;
  private userToken: string | null = null;
  private signalCache: Map<string, Signal> = new Map();
  private isConnected = false;

  constructor() {
    this.loadUserToken();
    this.loadSignalCache();
  }

  private loadUserToken(): void {
    // Try to get token from localStorage or sessionStorage
    this.userToken = localStorage.getItem('auth_token') || 
                    sessionStorage.getItem('auth_token') || 
                    null;
  }

  private loadSignalCache(): void {
    try {
      // Load from persistent storage instead of simple cache
      const persistentSignals = SignalPersistenceService.getAllSignals();
      persistentSignals.forEach(signal => {
        this.signalCache.set(signal.id, signal);
      });
      console.log(`Loaded ${persistentSignals.length} persistent signals`);
    } catch (error) {
      console.error('Error loading signal cache:', error);
    }
  }

  private saveSignalCache(): void {
    // No need to save cache separately - persistence service handles this
    // This method is kept for compatibility but does nothing
  }

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

      if (!this.userToken) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.isConnecting = true;

      const socketUrl = WS_CONFIG.baseURL;
      
      console.log(`Connecting to Socket.IO at: ${socketUrl}`);

      this.socket = io(socketUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        forceNew: true,
        timeout: 20000,
        auth: {
          token: this.userToken
        }
      });

      // Connection success
      this.socket.on('connect', () => {
        console.log('Socket.IO connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.isConnected = true;
        this.callbacks.onConnected?.();
        resolve();
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
        reject(error);
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log(`Socket.IO disconnected: ${reason}`);
        this.isConnected = false;
        this.callbacks.onDisconnected?.();
        
        // Attempt reconnection if not manually disconnected
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
          console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
          setTimeout(() => {
            this.connect().catch(console.error);
          }, delay);
        }
      });

      // Listen for new signals
      this.socket.on('new_signal', (signal: Signal) => {
        console.log('Received new signal:', signal);
        this.handleNewSignal(signal);
      });

      // Listen for signal updates
      this.socket.on('signal_update', (signal: Signal) => {
        console.log('Received signal update:', signal);
        this.handleSignalUpdate(signal);
      });

      // Listen for connection confirmation
      this.socket.on('connected', (data) => {
        console.log('Server confirmed connection:', data);
      });

      // Listen for pong responses
      this.socket.on('pong', (data) => {
        console.log('Received pong:', data);
      });
    });
  }

  private handleNewSignal(signal: Signal): void {
    // Store permanently using persistence service
    SignalPersistenceService.storeSignal(signal, 'websocket');
    
    // Add to cache
    this.signalCache.set(signal.id, signal);
    
    // Notify callback
    this.callbacks.onNewSignal?.(signal);
  }

  private handleSignalUpdate(signal: Signal): void {
    // Update in persistent storage
    SignalPersistenceService.updateSignalStatus(
      signal.id, 
      signal.status || 'active', 
      signal.outcome, 
      signal.pnl
    );
    
    // Update cache
    this.signalCache.set(signal.id, signal);
    
    // Notify callback
    this.callbacks.onSignalUpdate?.(signal);
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send ping to server
   */
  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping', { timestamp: new Date().toISOString() });
    }
  }

  /**
   * Get cached signals (from persistent storage)
   */
  getCachedSignals(): Signal[] {
    return SignalPersistenceService.getAllSignals().sort((a, b) => 
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  }

  /**
   * Clear signal cache (WARNING: This violates the never-delete requirement)
   */
  clearCache(): void {
    console.warn('WARNING: Clearing signal cache violates the never-delete requirement!');
    this.signalCache.clear();
    // Note: We don't clear persistent storage as signals must never be deleted
  }

  /**
   * Check if connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.userToken = token;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Remove authentication token
   */
  clearAuthToken(): void {
    this.userToken = null;
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }
}

// Export singleton instance
export const realTimeSignalService = new RealTimeSignalService();
export default realTimeSignalService;