// Real-time WebSocket Service for Live Data Updates
import { QuantumUser } from './quantumAdminService';

class RealtimeService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      console.log('🔌 Connecting to real-time WebSocket...');
      this.socket = new WebSocket('ws://localhost:5001');
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.emit('connected', { message: 'Connected to real-time updates' });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Real-time data received:', data);
          
          if (data.type === 'users_updated') {
            this.emit('users_updated', data);
          } else if (data.type === 'users_data') {
            this.emit('users_data', data);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('🔌 WebSocket connection closed');
        this.emit('disconnected', { message: 'Disconnected from real-time updates' });
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
      };

    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', { message: 'Max reconnection attempts reached' });
    }
  }

  // Request real-time user data
  public requestUsers(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'request_users' }));
      console.log('📡 Requested real-time user data');
    } else {
      console.log('⚠️ WebSocket not connected, cannot request users');
    }
  }

  // Subscribe to events
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Unsubscribe from events
  public off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit events to listeners
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  // Disconnect
  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// export const realtimeService = new RealtimeService();
