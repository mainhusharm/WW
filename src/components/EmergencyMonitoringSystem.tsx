import React, { useState, useEffect, useRef } from 'react';
import { liveSystemMonitor, LiveSystemMetrics, LiveAlert } from '../services/LiveSystemMonitor';
import { 
  AlertTriangle, 
  Zap, 
  Shield, 
  Activity, 
  Bell, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingDown, 
  Server, 
  Database, 
  Globe, 
  Wifi, 
  Cpu, 
  HardDrive, 
  MemoryStick,
  Send,
  Phone,
  Mail,
  MessageSquare,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw
} from 'lucide-react';

interface EmergencyAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'system' | 'security' | 'performance' | 'availability' | 'data';
  title: string;
  description: string;
  component: string;
  timestamp: Date;
  status: 'detected' | 'acknowledged' | 'investigating' | 'fixing' | 'resolved';
  severity: number; // 1-10 scale
  impact: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: number;
  estimatedDowntime: number; // minutes
  autoFixAttempted: boolean;
  fixApplied?: string;
  escalationLevel: number; // 1-5
  notificationsSent: string[];
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical' | 'down';
  uptime: number;
  responseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  databaseConnections: number;
  apiResponseTime: number;
  lastCheck: Date;
}

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'webhook' | 'slack' | 'discord';
  enabled: boolean;
  endpoint: string;
  lastUsed: Date;
  successRate: number;
}

const EmergencyMonitoringSystem: React.FC = () => {
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<LiveSystemMetrics | null>(null);
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
    {
      id: 'email',
      name: 'Email Alerts',
      type: 'email',
      enabled: true,
      endpoint: 'ai-engineer@traderedgepro.com',
      lastUsed: new Date(),
      successRate: 98
    },
    {
      id: 'webhook',
      name: 'Webhook Notifications',
      type: 'webhook',
      enabled: true,
      endpoint: 'https://hooks.slack.com/services/ai-emergency',
      lastUsed: new Date(),
      successRate: 95
    },
    {
      id: 'sms',
      name: 'SMS Alerts',
      type: 'sms',
      enabled: true,
      endpoint: '+1-555-AI-HELP',
      lastUsed: new Date(),
      successRate: 99
    }
  ]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'alerts' | 'health' | 'notifications' | 'settings'>('overview');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const emergencyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Emergency alert types
  const emergencyTypes = [
    {
      type: 'critical',
      title: 'System Down',
      description: 'Complete system failure detected',
      component: 'Main Server',
      severity: 10,
      impact: 'critical',
      affectedUsers: 1000
    },
    {
      type: 'critical',
      title: 'Database Failure',
      description: 'Database connection lost',
      component: 'Database',
      severity: 9,
      impact: 'critical',
      affectedUsers: 500
    },
    {
      type: 'high',
      title: 'API Timeout',
      description: 'API response time exceeded 5 seconds',
      component: 'API Gateway',
      severity: 8,
      impact: 'high',
      affectedUsers: 200
    },
    {
      type: 'high',
      title: 'Memory Leak',
      description: 'Memory usage exceeded 90%',
      component: 'Application Server',
      severity: 7,
      impact: 'high',
      affectedUsers: 100
    },
    {
      type: 'medium',
      title: 'High Error Rate',
      description: 'Error rate exceeded 5%',
      component: 'Error Handler',
      severity: 6,
      impact: 'medium',
      affectedUsers: 50
    },
    {
      type: 'medium',
      title: 'Slow Response',
      description: 'Response time exceeded 2 seconds',
      component: 'Load Balancer',
      severity: 5,
      impact: 'medium',
      affectedUsers: 25
    }
  ];

  // Simulate system health monitoring
  const updateSystemHealth = () => {
    setSystemHealth(prev => {
      const variation = (Math.random() - 0.5) * 20;
      const newCpuUsage = Math.max(0, Math.min(100, prev.cpuUsage + variation));
      const newMemoryUsage = Math.max(0, Math.min(100, prev.memoryUsage + variation * 0.5));
      const newResponseTime = Math.max(50, prev.responseTime + variation * 10);
      const newErrorRate = Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.5);
      
      // Determine overall health
      let overall: SystemHealth['overall'] = 'healthy';
      if (newCpuUsage > 90 || newMemoryUsage > 95 || newResponseTime > 5000 || newErrorRate > 5) {
        overall = 'critical';
      } else if (newCpuUsage > 80 || newMemoryUsage > 85 || newResponseTime > 2000 || newErrorRate > 2) {
        overall = 'warning';
      }

      return {
        ...prev,
        cpuUsage: Math.round(newCpuUsage * 10) / 10,
        memoryUsage: Math.round(newMemoryUsage * 10) / 10,
        responseTime: Math.round(newResponseTime),
        errorRate: Math.round(newErrorRate * 100) / 100,
        overall,
        lastCheck: new Date()
      };
    });
  };

  // Generate emergency alerts
  const generateEmergencyAlert = () => {
    if (Math.random() > 0.95) { // 5% chance of emergency
      const emergencyType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
      
      const alert: EmergencyAlert = {
        id: `emergency_${Date.now()}`,
        type: emergencyType.type as any,
        category: 'system',
        title: emergencyType.title,
        description: emergencyType.description,
        component: emergencyType.component,
        timestamp: new Date(),
        status: 'detected',
        severity: emergencyType.severity,
        impact: emergencyType.impact as any,
        affectedUsers: emergencyType.affectedUsers,
        estimatedDowntime: Math.floor(Math.random() * 60) + 5,
        autoFixAttempted: false,
        escalationLevel: 1,
        notificationsSent: []
      };

      setAlerts(prev => [alert, ...prev]);
      
      // Trigger emergency notifications
      sendEmergencyNotifications(alert);
      
      // Set emergency mode
      if (alert.type === 'critical') {
        setEmergencyMode(true);
      }
    }
  };

  // Send emergency notifications
  const sendEmergencyNotifications = async (alert: EmergencyAlert) => {
    const notificationPromises = notificationChannels
      .filter(channel => channel.enabled)
      .map(async (channel) => {
        try {
          // Simulate sending notification
          await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
          
          // Update notification success
          setNotificationChannels(prev => prev.map(c => 
            c.id === channel.id 
              ? { ...c, lastUsed: new Date(), successRate: Math.min(100, c.successRate + 1) }
              : c
          ));

          // Add to notifications sent
          setAlerts(prev => prev.map(a => 
            a.id === alert.id 
              ? { ...a, notificationsSent: [...a.notificationsSent, channel.name] }
              : a
          ));

          return { success: true, channel: channel.name };
        } catch (error) {
          return { success: false, channel: channel.name, error };
        }
      });

    await Promise.all(notificationPromises);
  };

  // Auto-fix emergency alerts
  const autoFixAlert = async (alert: EmergencyAlert) => {
    setAlerts(prev => prev.map(a => 
      a.id === alert.id 
        ? { ...a, status: 'fixing', autoFixAttempted: true }
        : a
    ));

    // Simulate fix attempt
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const fixSuccess = Math.random() > 0.3; // 70% success rate

    if (fixSuccess) {
      setAlerts(prev => prev.map(a => 
        a.id === alert.id 
          ? { 
              ...a, 
              status: 'resolved', 
              fixApplied: `Auto-fix applied: ${alert.description} resolved automatically`,
              escalationLevel: 0
            }
          : a
      ));
    } else {
      setAlerts(prev => prev.map(a => 
        a.id === alert.id 
          ? { 
              ...a, 
              status: 'acknowledged', 
              escalationLevel: Math.min(5, a.escalationLevel + 1)
            }
          : a
      ));
    }
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    
    // Regular health monitoring
    intervalRef.current = setInterval(() => {
      updateSystemHealth();
      generateEmergencyAlert();
    }, 2000);

    // Emergency response monitoring
    emergencyIntervalRef.current = setInterval(() => {
      // Check for unresolved critical alerts
      const criticalAlerts = alerts.filter(a => 
        a.type === 'critical' && 
        a.status !== 'resolved' && 
        a.status !== 'fixing'
      );

      criticalAlerts.forEach(alert => {
        if (alert.escalationLevel < 5) {
          // Escalate alert
          setAlerts(prev => prev.map(a => 
            a.id === alert.id 
              ? { ...a, escalationLevel: a.escalationLevel + 1 }
              : a
          ));
          
          // Send additional notifications
          sendEmergencyNotifications(alert);
        }
      });
    }, 10000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (emergencyIntervalRef.current) {
      clearInterval(emergencyIntervalRef.current);
      emergencyIntervalRef.current = null;
    }
  };

  // Initialize live monitoring
  useEffect(() => {
    // Start live system monitoring
    liveSystemMonitor.startMonitoring();
    
    // Set up real-time updates
    const updateInterval = setInterval(() => {
      const currentMetrics = liveSystemMonitor.getCurrentMetrics();
      const currentAlerts = liveSystemMonitor.getAllAlerts();
      const activeAlerts = liveSystemMonitor.getActiveAlerts();
      
      setSystemHealth(currentMetrics);
      setAlerts(currentAlerts);
      setLiveAlerts(activeAlerts);
    }, 1000); // Update every second

    return () => {
      clearInterval(updateInterval);
      liveSystemMonitor.stopMonitoring();
    };
  }, []);

  // Auto-fix alerts
  useEffect(() => {
    const unresolvedAlerts = alerts.filter(a => 
      a.status === 'detected' && 
      a.autoFixAttempted === false
    );

    unresolvedAlerts.forEach(alert => {
      // Auto-fix after 30 seconds
      setTimeout(() => {
        autoFixAlert(alert);
      }, 30000);
    });
  }, [alerts]);

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      case 'down': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected': return 'text-red-400 bg-red-500/20';
      case 'acknowledged': return 'text-yellow-400 bg-yellow-500/20';
      case 'investigating': return 'text-blue-400 bg-blue-500/20';
      case 'fixing': return 'text-purple-400 bg-purple-500/20';
      case 'resolved': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white">
      {/* Emergency Header */}
      {emergencyMode && (
        <div className="bg-red-600 text-white p-4 text-center font-bold text-lg animate-pulse">
          🚨 EMERGENCY MODE ACTIVATED - AI ENGINEER NOTIFIED 🚨
        </div>
      )}

      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Emergency Monitoring System
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm">{isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isMonitoring 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/10">
          <nav className="p-4 space-y-2">
            {[
              { id: 'overview', icon: Activity, label: 'Overview' },
              { id: 'alerts', icon: AlertTriangle, label: 'Emergency Alerts', badge: alerts.filter(a => a.status !== 'resolved').length },
              { id: 'health', icon: Shield, label: 'System Health' },
              { id: 'notifications', icon: Bell, label: 'Notifications' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                  selectedTab === item.id
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-white/20'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-hidden">
          {selectedTab === 'overview' && (
            <div className="p-6 space-y-6 overflow-y-auto h-full">
              {/* Emergency Stats */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'System Health', value: systemHealth.overall.toUpperCase(), icon: Shield, color: getHealthColor(systemHealth.overall) },
                  { label: 'Active Alerts', value: alerts.filter(a => a.status !== 'resolved').length, icon: AlertTriangle, color: 'text-red-400' },
                  { label: 'Critical Alerts', value: alerts.filter(a => a.type === 'critical' && a.status !== 'resolved').length, icon: XCircle, color: 'text-red-600' },
                  { label: 'Auto-Fixed', value: alerts.filter(a => a.autoFixAttempted && a.status === 'resolved').length, icon: CheckCircle, color: 'text-green-400' },
                  { label: 'Uptime', value: `${systemHealth.uptime}%`, icon: Clock, color: 'text-blue-400' },
                  { label: 'Response Time', value: `${systemHealth.responseTime}ms`, icon: Zap, color: 'text-purple-400' },
                  { label: 'Error Rate', value: `${systemHealth.errorRate}%`, icon: TrendingDown, color: 'text-orange-400' },
                  { label: 'Notifications Sent', value: alerts.reduce((acc, a) => acc + a.notificationsSent.length, 0), icon: Send, color: 'text-cyan-400' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      <span className="text-xs text-gray-400">Live</span>
                    </div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Alerts */}
              <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  Recent Emergency Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className="text-xs text-gray-400">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{alert.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Component: {alert.component}</span>
                        <span>Severity: {alert.severity}/10</span>
                        <span>Affected Users: {alert.affectedUsers}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="p-6 space-y-6 overflow-y-auto h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Emergency Alerts</h2>
                <div className="flex items-center space-x-2">
                  <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                    <RefreshCw className="w-4 h-4 mr-2 inline" />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {alerts.map(alert => (
                  <div key={alert.id} className={`p-6 rounded-xl border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-6 h-6 mt-1" />
                        <div>
                          <h3 className="text-lg font-semibold">{alert.title}</h3>
                          <p className="text-gray-300">{alert.description}</p>
                          <p className="text-sm text-gray-400 mt-1">Component: {alert.component}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm rounded ${getStatusColor(alert.status)}`}>
                          {alert.status.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-400">
                          {alert.timestamp.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-sm text-gray-400">Severity:</span>
                        <div className="text-lg font-bold">{alert.severity}/10</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Impact:</span>
                        <div className="text-lg font-bold capitalize">{alert.impact}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Affected Users:</span>
                        <div className="text-lg font-bold">{alert.affectedUsers}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">Est. Downtime:</span>
                        <div className="text-lg font-bold">{alert.estimatedDowntime}min</div>
                      </div>
                    </div>

                    {alert.fixApplied && (
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="font-medium text-green-400">Fix Applied</span>
                        </div>
                        <p className="text-sm text-green-300">{alert.fixApplied}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-400">
                          Escalation Level: {alert.escalationLevel}/5
                        </span>
                        <span className="text-sm text-gray-400">
                          Auto-Fix: {alert.autoFixAttempted ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.notificationsSent.map((notification, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {notification}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other tabs would be implemented here */}
        </main>
      </div>
    </div>
  );
};

export default EmergencyMonitoringSystem;
