import { ENV_CONFIG } from '../api/config';

interface WebSocketMessage {
  type: 'notification' | 'ticket_update' | 'stats_update' | 'customer_update';
  data: any;
  timestamp: string;
}

interface WebSocketCallbacks {
  onNotification?: (data: any) => void;
  onTicketUpdate?: (data: any) => void;
  onStatsUpdate?: (data: any) => void;
  onCustomerUpdate?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000;
  private callbacks: WebSocketCallbacks = {};
  private isConnecting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs = 30000; // 30 seconds
  private heartbeatTimeoutMs = 10000; // 10 seconds
  private lastHeartbeat = 0;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.disconnect();
      } else {
        this.connect();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => this.connect());
    window.addEventListener('offline', () => this.disconnect());
  }

  public connect() {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    
    try {
      const wsUrl = ENV_CONFIG.isProduction
        ? `wss://www.traderedgepro.com/ws/dashboard`
        : `ws://localhost:3005/ws/dashboard`;

      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        this.startHeartbeat();
        this.callbacks.onConnect?.();
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.stopHeartbeat();
        this.callbacks.onDisconnect?.();
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Handle heartbeat responses
    if (message.type === 'pong' || message.data?.type === 'pong') {
      this.lastHeartbeat = Date.now();
      this.clearHeartbeatTimeout();
      return;
    }

    switch (message.type) {
      case 'notification':
        this.callbacks.onNotification?.(message.data);
        break;
      case 'ticket_update':
        this.callbacks.onTicketUpdate?.(message.data);
        break;
      case 'stats_update':
        this.callbacks.onStatsUpdate?.(message.data);
        break;
      case 'customer_update':
        this.callbacks.onCustomerUpdate?.(message.data);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastHeartbeat = Date.now();
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
        this.setHeartbeatTimeout();
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.clearHeartbeatTimeout();
  }

  private setHeartbeatTimeout() {
    this.clearHeartbeatTimeout();
    this.heartbeatTimeout = setTimeout(() => {
      console.warn('WebSocket heartbeat timeout, reconnecting...');
      this.socket?.close();
    }, this.heartbeatTimeoutMs);
  }

  private clearHeartbeatTimeout() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting');
      this.socket = null;
    }
    this.isConnecting = false;
  }

  public subscribe(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  public unsubscribe() {
    this.callbacks = {};
  }

  public send(message: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected, cannot send message');
    }
  }

  public isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  public getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  public getConnectionHealth(): {
    state: string;
    reconnectAttempts: number;
    lastHeartbeat: number;
    isHealthy: boolean;
  } {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - this.lastHeartbeat;
    const isHealthy = this.isConnected() && timeSinceLastHeartbeat < this.heartbeatIntervalMs * 2;

    return {
      state: this.getConnectionState(),
      reconnectAttempts: this.reconnectAttempts,
      lastHeartbeat: this.lastHeartbeat,
      isHealthy
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
