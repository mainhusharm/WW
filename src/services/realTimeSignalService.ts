/**
 * Real-time Signal Service
 * Handles Socket.IO connection and real-time signal updates
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

class RealTimeSignalService {
  private socket: Socket | null = null;
  private callbacks: SignalServiceCallbacks = {};
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private userToken: string | null = null;

  constructor() {
    this.userToken = localStorage.getItem('access_token') || sessionStorage.getItem('session_token');
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

      if (!this.userToken) {
        reject(new Error('No authentication token available'));
        return;
      }

      this.isConnecting = true;

      const socketUrl = 'https://backend-bkt7.onrender.com';
      
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
        this.isConnecting = false;
        this.callbacks.onDisconnected?.();

        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          // Manual disconnection, don't reconnect
          return;
        }

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
          console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect().catch(console.error);
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      });

      // Signal received
      this.socket.on('signal:new', (signalData: any) => {
        console.log('Received new signal:', signalData);
        
        // Transform signal data to match frontend interface
        const signal: Signal = {
          id: signalData.id,
          symbol: signalData.symbol,
          action: signalData.side?.toUpperCase() || 'BUY',
          entryPrice: parseFloat(signalData.entry_price) || 0,
          stopLoss: parseFloat(signalData.stop_loss) || 0,
          takeProfit: parseFloat(signalData.take_profit) || 0,
          timeframe: signalData.payload?.timeframe || '1H',
          status: signalData.status || 'active',
          createdAt: signalData.created_at,
          description: signalData.payload?.analysis || '',
          confidence: signalData.payload?.confidence || 85,
          rrRatio: signalData.rr_ratio ? `1:${signalData.rr_ratio.toFixed(1)}` : '1:2.0',
          analysis: signalData.payload?.analysis || 'Professional signal analysis',
          riskTier: signalData.risk_tier || 'medium'
        };

        this.callbacks.onSignalReceived?.(signal);
      });

      // System messages
      this.socket.on('system:message', (message: any) => {
        console.log('Received system message:', message);
        this.callbacks.onSystemMessage?.(message);
      });

      // Connection confirmation
      this.socket.on('connected', (data: any) => {
        console.log('Connection confirmed:', data);
      });

      // Ping/Pong for connection health
      this.socket.on('pong', (data: any) => {
        console.log('Pong received:', data);
      });
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting from Socket.IO');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
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
    return 'disconnected';
  }
}

// Export singleton instance
export const realTimeSignalService = new RealTimeSignalService();
export default realTimeSignalService;
