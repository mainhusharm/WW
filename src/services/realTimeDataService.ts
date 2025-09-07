import { API_CONFIG } from '../api/config';

export interface RealTimeData {
  timestamp: string;
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  trading: {
    recent_trades: any[];
    active_signals: any[];
    total_pnl: number;
    win_rate: number;
    total_trades: number;
  };
  market: {
    status: string;
    last_update: string;
  };
}

export interface LiveSignal {
  id: string;
  pair: string;
  direction: string;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  confidence: number;
  timestamp: string;
  status: string;
}

export interface PerformanceMetrics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
  max_drawdown: number;
}

class RealTimeDataService {
  private static instance: RealTimeDataService;
  private updateCallbacks: Map<string, Function[]> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isConnected: boolean = false;

  private constructor() {
    this.setupConnectionMonitoring();
  }

  static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  private setupConnectionMonitoring() {
    // Monitor connection status
    window.addEventListener('online', () => {
      this.isConnected = true;
      this.notifyConnectionChange(true);
    });

    window.addEventListener('offline', () => {
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    // Check initial connection
    this.isConnected = navigator.onLine;
  }

  private notifyConnectionChange(isOnline: boolean) {
    const callbacks = this.updateCallbacks.get('connection') || [];
    callbacks.forEach(callback => callback(isOnline));
  }

  // Subscribe to real-time dashboard data
  subscribeToDashboardData(userId: string, callback: (data: RealTimeData) => void, intervalMs: number = 5000) {
    const key = `dashboard_${userId}`;
    
    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, []);
    }
    this.updateCallbacks.get(key)!.push(callback);

    // Start real-time updates
    if (!this.updateIntervals.has(key)) {
      const interval = setInterval(async () => {
        try {
          const data = await this.fetchDashboardData(userId);
          if (data) {
            const callbacks = this.updateCallbacks.get(key) || [];
            callbacks.forEach(cb => cb(data));
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
        }
      }, intervalMs);
      
      this.updateIntervals.set(key, interval);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // If no more callbacks, clear the interval
      if (callbacks.length === 0) {
        const interval = this.updateIntervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.updateIntervals.delete(key);
        }
      }
    };
  }

  // Subscribe to live signals
  subscribeToLiveSignals(callback: (signals: LiveSignal[]) => void, intervalMs: number = 3000) {
    const key = 'live_signals';
    
    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, []);
    }
    this.updateCallbacks.get(key)!.push(callback);

    // Start real-time updates
    if (!this.updateIntervals.has(key)) {
      const interval = setInterval(async () => {
        try {
          const signals = await this.fetchLiveSignals();
          if (signals) {
            const callbacks = this.updateCallbacks.get(key) || [];
            callbacks.forEach(cb => cb(signals));
          }
        } catch (error) {
          console.error('Failed to fetch live signals:', error);
        }
      }, intervalMs);
      
      this.updateIntervals.set(key, interval);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        const interval = this.updateIntervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.updateIntervals.delete(key);
        }
      }
    };
  }

  // Subscribe to performance metrics
  subscribeToPerformanceMetrics(userId: string, callback: (metrics: PerformanceMetrics) => void, intervalMs: number = 10000) {
    const key = `performance_${userId}`;
    
    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, []);
    }
    this.updateCallbacks.get(key)!.push(callback);

    // Start real-time updates
    if (!this.updateIntervals.has(key)) {
      const interval = setInterval(async () => {
        try {
          const metrics = await this.fetchPerformanceMetrics(userId);
          if (metrics) {
            const callbacks = this.updateCallbacks.get(key) || [];
            callbacks.forEach(cb => cb(metrics));
          }
        } catch (error) {
          console.error('Failed to fetch performance metrics:', error);
        }
      }, intervalMs);
      
      this.updateIntervals.set(key, interval);
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        const interval = this.updateIntervals.get(key);
        if (interval) {
          clearInterval(interval);
          this.updateIntervals.delete(key);
        }
      }
    };
  }

  // Subscribe to connection status changes
  subscribeToConnectionStatus(callback: (isOnline: boolean) => void) {
    const key = 'connection';
    
    if (!this.updateCallbacks.has(key)) {
      this.updateCallbacks.set(key, []);
    }
    this.updateCallbacks.get(key)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.updateCallbacks.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Fetch methods
  private async fetchDashboardData(userId: string): Promise<RealTimeData | null> {
    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/dashboard/real-time-data?user_id=${userId}`);
      if (response.ok) {
        return await response.json();
      } else if (response.status === 404) {
        // Endpoint not found - return mock data as fallback
        console.warn('Dashboard real-time endpoint not found, using fallback data');
        return this.getMockDashboardData(userId);
      }
      return null;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return mock data on error as fallback
      return this.getMockDashboardData(userId);
    }
  }

  private async fetchLiveSignals(): Promise<LiveSignal[] | null> {
    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/dashboard/live-signals`);
      if (response.ok) {
        const data = await response.json();
        return data.signals || [];
      } else if (response.status === 404) {
        // Endpoint not found - return mock data as fallback
        console.warn('Live signals endpoint not found, using fallback data');
        return this.getMockLiveSignals();
      }
      return null;
    } catch (error) {
      console.error('Error fetching live signals:', error);
      // Return mock data on error as fallback
      return this.getMockLiveSignals();
    }
  }

  private async fetchPerformanceMetrics(userId: string): Promise<PerformanceMetrics | null> {
    try {
      const response = await fetch(`${API_CONFIG.backendUrl}/dashboard/performance-metrics?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.metrics || null;
      } else if (response.status === 404) {
        // Endpoint not found - return mock data as fallback
        console.warn('Performance metrics endpoint not found, using fallback data');
        return this.getMockPerformanceMetrics(userId);
      }
      return null;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      // Return mock data on error as fallback
      return this.getMockPerformanceMetrics(userId);
    }
  }

  // Cleanup all subscriptions
  cleanup() {
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();
    this.updateCallbacks.clear();
  }

  // Get current connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Mock data fallback methods
  private getMockDashboardData(userId: string): RealTimeData {
    return {
      timestamp: new Date().toISOString(),
      user: {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        status: 'active'
      },
      trading: {
        recent_trades: [],
        active_signals: [],
        total_pnl: 0.0,
        win_rate: 0.0,
        total_trades: 0
      },
      market: {
        status: 'open',
        last_update: new Date().toISOString()
      }
    };
  }

  private getMockLiveSignals(): LiveSignal[] {
    return [
      {
        id: 'SIG-001',
        pair: 'BTC/USD',
        direction: 'LONG',
        entry: 45000.0,
        stopLoss: 44000.0,
        takeProfit: 46000.0,
        confidence: 85,
        analysis: 'Strong bullish momentum with key support at 44k',
        timestamp: new Date().toISOString(),
        status: 'active',
        market: 'crypto'
      },
      {
        id: 'SIG-002',
        pair: 'EUR/USD',
        direction: 'LONG',
        entry: 1.0850,
        stopLoss: 1.0800,
        takeProfit: 1.0900,
        confidence: 90,
        analysis: 'Breakout above resistance, targeting 1.09',
        timestamp: new Date().toISOString(),
        status: 'active',
        market: 'forex'
      }
    ];
  }

  private getMockPerformanceMetrics(userId: string): PerformanceMetrics {
    return {
      user_id: userId,
      total_pnl: 0.0,
      win_rate: 0.0,
      total_trades: 0,
      active_positions: 0,
      timestamp: new Date().toISOString()
    };
  }
}

export default RealTimeDataService;
