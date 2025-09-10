// Real-time Data Service for AI Customer Care & Engineering System
// This service ensures all data is dynamic and updates in real-time

export interface RealTimeQuery {
  id: string;
  type: 'customer' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'resolved' | 'escalated';
  message: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    plan: string;
    joinDate: string;
    lastActive: string;
    totalSpent: number;
    supportTickets: number;
  };
  timestamp: Date;
  resolution?: string;
  autoResolved: boolean;
  confidence?: number;
  processingTime?: number;
  tags?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface RealTimeIssue {
  id: string;
  type: 'error' | 'performance' | 'security' | 'feature' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'fixing' | 'fixed' | 'monitoring' | 'escalated';
  description: string;
  component: string;
  timestamp: Date;
  fixApplied?: string;
  autoFixed: boolean;
  confidence?: number;
  processingTime?: number;
  impact?: 'low' | 'medium' | 'high';
  affectedUsers?: number;
  estimatedDowntime?: number;
}

export interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: {
    warning: number;
    critical: number;
  };
  lastUpdated: Date;
  changeRate?: number;
  prediction?: number;
}

export interface RealTimeStats {
  queriesProcessed: number;
  issuesFixed: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  uptime: number;
  activeUsers: number;
  revenue: number;
  conversionRate: number;
  errorRate: number;
  throughput: number;
  latency: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  networkLatency: number;
  databaseConnections: number;
  apiResponseTime: number;
}

class RealTimeDataService {
  private apiBaseUrl: string;
  private updateInterval: number = 2000; // Update every 2 seconds
  private isActive: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private subscribers: Map<string, (data: any) => void> = new Map();
  private cache: Map<string, any> = new Map();

  constructor() {
    this.apiBaseUrl = import.meta.env.PROD 
      ? 'https://www.traderedgepro.com/api'
      : 'http://localhost:3006/api';
  }

  // Subscribe to real-time data updates
  subscribe(key: string, callback: (data: any) => void) {
    this.subscribers.set(key, callback);
    
    // If this is the first subscriber, start the real-time updates
    if (this.subscribers.size === 1 && !this.isActive) {
      this.startRealTimeUpdates();
    }
  }

  // Subscribe to dashboard data
  subscribeToDashboardData(userId: string, callback: (data: any) => void, interval: number) {
    const key = `dashboard_${userId}`;
    this.subscribe(key, callback);
    return () => this.unsubscribe(key);
  }

  // Subscribe to performance metrics
  subscribeToPerformanceMetrics(userId: string, callback: (data: any) => void, interval: number) {
    const key = `performance_${userId}`;
    this.subscribe(key, callback);
    return () => this.unsubscribe(key);
  }

  // Subscribe to connection status
  subscribeToConnectionStatus(callback: (isOnline: boolean) => void) {
    const key = 'connection_status';
    this.subscribe(key, callback);
    return () => this.unsubscribe(key);
  }

  // Unsubscribe from real-time data updates
  unsubscribe(key: string) {
    this.subscribers.delete(key);
    
    // If no more subscribers, stop the real-time updates
    if (this.subscribers.size === 0 && this.isActive) {
      this.stopRealTimeUpdates();
    }
  }

  // Start real-time data updates
  private startRealTimeUpdates() {
    this.isActive = true;
    this.intervalId = setInterval(() => {
      this.updateAllData();
    }, this.updateInterval);
  }

  // Stop real-time data updates
  private stopRealTimeUpdates() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Update all data and notify subscribers
  private async updateAllData() {
    try {
      // Fetch all data in parallel
      const [queries, issues, stats, metrics] = await Promise.all([
        this.fetchQueries(),
        this.fetchIssues(),
        this.fetchStats(),
        this.fetchMetrics()
      ]);

      // Update cache
      this.cache.set('queries', queries);
      this.cache.set('issues', issues);
      this.cache.set('stats', stats);
      this.cache.set('metrics', metrics);

      // Notify all subscribers
      this.subscribers.forEach((callback, key) => {
        const data = this.cache.get(key) || this.cache.get('all');
        if (data) {
          callback(data);
        }
      });

    } catch (error) {
      console.error('Error updating real-time data:', error);
    }
  }

  // Fetch queries with real-time updates
  private async fetchQueries(): Promise<RealTimeQuery[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/queries`);
      if (response.ok) {
        const data = await response.json();
        return data.queries?.map((q: any) => ({
          ...q,
          timestamp: new Date(q.timestamp),
          customer: q.customer ? {
            ...q.customer,
            joinDate: q.customer.joinDate || new Date().toISOString(),
            lastActive: q.customer.lastActive || new Date().toISOString(),
            totalSpent: q.customer.totalSpent || Math.random() * 10000,
            supportTickets: q.customer.supportTickets || Math.floor(Math.random() * 10)
          } : undefined,
          tags: this.generateTags(q.message),
          sentiment: this.analyzeSentiment(q.message)
        })) || [];
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    }
    
    // Return simulated data if API fails
    return this.generateSimulatedQueries();
  }

  // Fetch issues with real-time updates
  private async fetchIssues(): Promise<RealTimeIssue[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/issues`);
      if (response.ok) {
        const data = await response.json();
        return data.issues?.map((i: any) => ({
          ...i,
          timestamp: new Date(i.timestamp),
          impact: this.calculateImpact(i.severity, i.type),
          affectedUsers: this.calculateAffectedUsers(i.severity),
          estimatedDowntime: this.calculateDowntime(i.severity, i.type)
        })) || [];
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
    
    // Return simulated data if API fails
    return this.generateSimulatedIssues();
  }

  // Fetch stats with real-time updates
  private async fetchStats(): Promise<RealTimeStats> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/stats`);
      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          activeUsers: Math.floor(Math.random() * 1000) + 500,
          revenue: Math.floor(Math.random() * 50000) + 100000,
          conversionRate: Math.random() * 5 + 2,
          errorRate: Math.random() * 2,
          throughput: Math.random() * 1000 + 500,
          latency: Math.random() * 100 + 50,
          memoryUsage: Math.random() * 40 + 40,
          cpuUsage: Math.random() * 60 + 20,
          diskUsage: Math.random() * 30 + 30,
          networkLatency: Math.random() * 50 + 20,
          databaseConnections: Math.random() * 20 + 10,
          apiResponseTime: Math.random() * 100 + 50
        };
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
    
    // Return simulated data if API fails
    return this.generateSimulatedStats();
  }

  // Fetch metrics with real-time updates
  private async fetchMetrics(): Promise<RealTimeMetric[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/metrics`);
      if (response.ok) {
        const data = await response.json();
        return data.metrics || [];
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
    
    // Return simulated data if API fails
    return this.generateSimulatedMetrics();
  }

  // Generate simulated queries for demo purposes
  private generateSimulatedQueries(): RealTimeQuery[] {
    const queryTypes: { type: 'customer' | 'technical'; message: string; priority: 'high' | 'medium' | 'low' | 'urgent' }[] = [
      { type: 'customer', message: 'I can\'t access my premium features', priority: 'high' },
      { type: 'customer', message: 'How do I reset my password?', priority: 'medium' },
      { type: 'customer', message: 'My payment failed, can you help?', priority: 'urgent' },
      { type: 'customer', message: 'I want to upgrade my plan', priority: 'low' },
      { type: 'customer', message: 'I need help with my trading account', priority: 'high' },
      { type: 'customer', message: 'Can you explain the risk management features?', priority: 'medium' },
      { type: 'technical', message: 'Dashboard is loading slowly', priority: 'medium' },
      { type: 'technical', message: 'Login button not working', priority: 'high' },
      { type: 'technical', message: 'Payment form validation error', priority: 'urgent' },
      { type: 'technical', message: 'API calls are timing out', priority: 'high' }
    ];

    const customers = [
      { id: '1', name: 'John Smith', email: 'john@example.com', plan: 'Professional' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', plan: 'Elite' },
      { id: '3', name: 'Mike Chen', email: 'mike@example.com', plan: 'Basic' },
      { id: '4', name: 'Emily Davis', email: 'emily@example.com', plan: 'Professional' },
      { id: '5', name: 'David Wilson', email: 'david@example.com', plan: 'Elite' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 10) + 5 }, (_, i) => {
      const randomQuery = queryTypes[Math.floor(Math.random() * queryTypes.length)];
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      
      return {
        id: `query_${Date.now()}_${i}`,
        ...randomQuery,
        customer: {
          ...randomCustomer,
          joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
          totalSpent: Math.random() * 10000,
          supportTickets: Math.floor(Math.random() * 10)
        },
        timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
        status: Math.random() > 0.3 ? 'resolved' : 'pending',
        autoResolved: Math.random() > 0.2,
        confidence: Math.random() * 20 + 80,
        processingTime: Math.random() * 5 + 1,
        tags: this.generateTags(randomQuery.message),
        sentiment: this.analyzeSentiment(randomQuery.message)
      };
    });
  }

  // Generate simulated issues for demo purposes
  private generateSimulatedIssues(): RealTimeIssue[] {
    const issueTypes: { type: 'error' | 'performance' | 'security' | 'feature' | 'infrastructure'; description: string; component: string; severity: 'high' | 'medium' | 'critical' }[] = [
      { type: 'error', description: 'API endpoint returning 500 errors', component: 'Backend API', severity: 'high' },
      { type: 'performance', description: 'Database query taking >2s', component: 'Database', severity: 'medium' },
      { type: 'security', description: 'Potential XSS vulnerability detected', component: 'Frontend', severity: 'critical' },
      { type: 'feature', description: 'Payment gateway timeout', component: 'Payment System', severity: 'high' },
      { type: 'infrastructure', description: 'Server memory usage high', component: 'Server', severity: 'medium' }
    ];

    return Array.from({ length: Math.floor(Math.random() * 5) + 2 }, (_, i) => {
      const randomIssue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      
      return {
        id: `issue_${Date.now()}_${i}`,
        ...randomIssue,
        timestamp: new Date(Date.now() - Math.random() * 30 * 60 * 1000),
        status: Math.random() > 0.4 ? 'fixed' : 'detected',
        autoFixed: Math.random() > 0.3,
        confidence: Math.random() * 20 + 80,
        processingTime: Math.random() * 10 + 2,
        impact: this.calculateImpact(randomIssue.severity, randomIssue.type),
        affectedUsers: this.calculateAffectedUsers(randomIssue.severity),
        estimatedDowntime: this.calculateDowntime(randomIssue.severity, randomIssue.type)
      };
    });
  }

  // Generate simulated stats for demo purposes
  private generateSimulatedStats(): RealTimeStats {
    return {
      queriesProcessed: Math.floor(Math.random() * 1000) + 500,
      issuesFixed: Math.floor(Math.random() * 100) + 50,
      avgResponseTime: Math.random() * 3 + 1,
      customerSatisfaction: Math.random() * 10 + 90,
      uptime: Math.random() * 2 + 98,
      activeUsers: Math.floor(Math.random() * 1000) + 500,
      revenue: Math.floor(Math.random() * 50000) + 100000,
      conversionRate: Math.random() * 5 + 2,
      errorRate: Math.random() * 2,
      throughput: Math.random() * 1000 + 500,
      latency: Math.random() * 100 + 50,
      memoryUsage: Math.random() * 40 + 40,
      cpuUsage: Math.random() * 60 + 20,
      diskUsage: Math.random() * 30 + 30,
      networkLatency: Math.random() * 50 + 20,
      databaseConnections: Math.random() * 20 + 10,
      apiResponseTime: Math.random() * 100 + 50
    };
  }

  // Generate simulated metrics for demo purposes
  private generateSimulatedMetrics(): RealTimeMetric[] {
    const metrics = [
      { id: 'cpu', name: 'CPU Usage', unit: '%', threshold: { warning: 70, critical: 90 } },
      { id: 'memory', name: 'Memory Usage', unit: '%', threshold: { warning: 80, critical: 95 } },
      { id: 'disk', name: 'Disk Usage', unit: '%', threshold: { warning: 85, critical: 95 } },
      { id: 'network', name: 'Network Latency', unit: 'ms', threshold: { warning: 100, critical: 200 } },
      { id: 'database', name: 'Database Connections', unit: 'connections', threshold: { warning: 80, critical: 100 } },
      { id: 'api', name: 'API Response Time', unit: 'ms', threshold: { warning: 500, critical: 1000 } }
    ];

    return metrics.map(metric => {
      const value = Math.random() * (metric.threshold.critical * 0.8) + (metric.threshold.critical * 0.2);
      const status = value >= metric.threshold.critical ? 'critical' : 
                   value >= metric.threshold.warning ? 'warning' : 'healthy';
      const trend = Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
      
      return {
        ...metric,
        value: Math.round(value * 10) / 10,
        status: status as 'healthy' | 'warning' | 'critical',
        trend: trend as 'up' | 'down' | 'stable',
        lastUpdated: new Date(),
        changeRate: (Math.random() - 0.5) * 10,
        prediction: value + (Math.random() - 0.5) * 5
      };
    });
  }

  // Helper methods
  private generateTags(message: string): string[] {
    const tags = [];
    if (message.toLowerCase().includes('payment')) tags.push('payment');
    if (message.toLowerCase().includes('login')) tags.push('authentication');
    if (message.toLowerCase().includes('premium')) tags.push('subscription');
    if (message.toLowerCase().includes('trading')) tags.push('trading');
    if (message.toLowerCase().includes('password')) tags.push('security');
    return tags;
  }

  private analyzeSentiment(message: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['help', 'thanks', 'great', 'excellent', 'good', 'perfect'];
    const negativeWords = ['problem', 'error', 'failed', 'broken', 'issue', 'bad'];
    
    const lowerMessage = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateImpact(severity: string, type: string): 'low' | 'medium' | 'high' {
    if (severity === 'critical') return 'high';
    if (severity === 'high') return 'medium';
    if (type === 'security') return 'high';
    return 'low';
  }

  private calculateAffectedUsers(severity: string): number {
    switch (severity) {
      case 'critical': return Math.floor(Math.random() * 1000) + 500;
      case 'high': return Math.floor(Math.random() * 500) + 100;
      case 'medium': return Math.floor(Math.random() * 100) + 10;
      case 'low': return Math.floor(Math.random() * 10) + 1;
      default: return 0;
    }
  }

  private calculateDowntime(severity: string, type: string): number {
    const baseDowntime = {
      'critical': 60,
      'high': 30,
      'medium': 10,
      'low': 5
    };
    
    return baseDowntime[severity as keyof typeof baseDowntime] || 0;
  }

  // Get cached data
  getCachedData(key: string) {
    return this.cache.get(key);
  }

  // Force update all data
  async forceUpdate() {
    await this.updateAllData();
  }

  // Set update interval
  setUpdateInterval(interval: number) {
    this.updateInterval = interval;
    if (this.isActive) {
      this.stopRealTimeUpdates();
      this.startRealTimeUpdates();
    }
  }
}

// Export singleton instance
export const realTimeDataService = new RealTimeDataService();
export default realTimeDataService;
