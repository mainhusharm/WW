import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Shield, 
  Database, 
  Globe,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Play,
  Pause,
  Square,
  Bell,
  Settings
} from 'lucide-react';

interface SystemMetric {
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
}

interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  component: string;
  timestamp: Date;
  resolved: boolean;
  autoResolved: boolean;
}

const ProactiveMonitoringSystem: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemHealth, setSystemHealth] = useState<'excellent' | 'good' | 'warning' | 'critical'>('excellent');
  const [uptime, setUptime] = useState(99.9);
  const [responseTime, setResponseTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize system metrics
  useEffect(() => {
    const initialMetrics: SystemMetric[] = [
      {
        id: 'cpu',
        name: 'CPU Usage',
        value: 45,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        threshold: { warning: 70, critical: 90 },
        lastUpdated: new Date()
      },
      {
        id: 'memory',
        name: 'Memory Usage',
        value: 62,
        unit: '%',
        status: 'healthy',
        trend: 'up',
        threshold: { warning: 80, critical: 95 },
        lastUpdated: new Date()
      },
      {
        id: 'disk',
        name: 'Disk Usage',
        value: 38,
        unit: '%',
        status: 'healthy',
        trend: 'stable',
        threshold: { warning: 85, critical: 95 },
        lastUpdated: new Date()
      },
      {
        id: 'network',
        name: 'Network Latency',
        value: 45,
        unit: 'ms',
        status: 'healthy',
        trend: 'down',
        threshold: { warning: 100, critical: 200 },
        lastUpdated: new Date()
      },
      {
        id: 'database',
        name: 'Database Connections',
        value: 23,
        unit: 'connections',
        status: 'healthy',
        trend: 'stable',
        threshold: { warning: 80, critical: 100 },
        lastUpdated: new Date()
      },
      {
        id: 'api',
        name: 'API Response Time',
        value: 120,
        unit: 'ms',
        status: 'healthy',
        trend: 'down',
        threshold: { warning: 500, critical: 1000 },
        lastUpdated: new Date()
      }
    ];

    setMetrics(initialMetrics);
  }, []);

  // Simulate real-time monitoring
  const updateMetrics = () => {
    setMetrics(prev => prev.map(metric => {
      const variation = (Math.random() - 0.5) * 10; // ±5% variation
      let newValue = Math.max(0, metric.value + variation);
      
      // Keep values within realistic ranges
      if (metric.id === 'cpu' || metric.id === 'memory' || metric.id === 'disk') {
        newValue = Math.min(100, newValue);
      } else if (metric.id === 'network' || metric.id === 'api') {
        newValue = Math.max(1, newValue);
      } else if (metric.id === 'database') {
        newValue = Math.max(0, Math.min(100, newValue));
      }

      // Determine status based on thresholds
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (newValue >= metric.threshold.critical) {
        status = 'critical';
      } else if (newValue >= metric.threshold.warning) {
        status = 'warning';
      }

      // Determine trend
      const trend: 'up' | 'down' | 'stable' = 
        newValue > metric.value + 2 ? 'up' :
        newValue < metric.value - 2 ? 'down' : 'stable';

      return {
        ...metric,
        value: Math.round(newValue * 10) / 10,
        status,
        trend,
        lastUpdated: new Date()
      };
    }));
  };

  // Generate alerts based on metrics
  const generateAlerts = () => {
    const newAlerts: Alert[] = [];

    metrics.forEach(metric => {
      if (metric.status === 'critical') {
        newAlerts.push({
          id: `alert_${Date.now()}_${metric.id}`,
          type: 'performance',
          severity: 'critical',
          message: `${metric.name} is at critical level: ${metric.value}${metric.unit}`,
          component: metric.id,
          timestamp: new Date(),
          resolved: false,
          autoResolved: false
        });
      } else if (metric.status === 'warning') {
        newAlerts.push({
          id: `alert_${Date.now()}_${metric.id}`,
          type: 'performance',
          severity: 'high',
          message: `${metric.name} is approaching critical level: ${metric.value}${metric.unit}`,
          component: metric.id,
          timestamp: new Date(),
          resolved: false,
          autoResolved: false
        });
      }
    });

    // Simulate random system alerts
    if (Math.random() > 0.95) {
      const alertTypes = [
        { type: 'error', message: 'API endpoint returning 500 errors', component: 'Backend API', severity: 'high' },
        { type: 'security', message: 'Unusual login pattern detected', component: 'Authentication', severity: 'medium' },
        { type: 'availability', message: 'Service degradation detected', component: 'Load Balancer', severity: 'high' },
        { type: 'performance', message: 'Database query timeout', component: 'Database', severity: 'medium' }
      ];

      const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      newAlerts.push({
        id: `alert_${Date.now()}_random`,
        ...randomAlert,
        timestamp: new Date(),
        resolved: false,
        autoResolved: false
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev]);
    }
  };

  // Auto-resolve alerts
  const autoResolveAlerts = () => {
    setAlerts(prev => prev.map(alert => {
      if (!alert.resolved && Math.random() > 0.7) {
        return {
          ...alert,
          resolved: true,
          autoResolved: true
        };
      }
      return alert;
    }));
  };

  // Calculate overall system health
  const calculateSystemHealth = () => {
    const criticalCount = metrics.filter(m => m.status === 'critical').length;
    const warningCount = metrics.filter(m => m.status === 'warning').length;
    const totalMetrics = metrics.length;

    if (criticalCount > 0) {
      setSystemHealth('critical');
    } else if (warningCount > totalMetrics * 0.3) {
      setSystemHealth('warning');
    } else if (warningCount > 0) {
      setSystemHealth('good');
    } else {
      setSystemHealth('excellent');
    }

    // Update uptime based on system health
    if (systemHealth === 'excellent') {
      setUptime(99.9);
    } else if (systemHealth === 'good') {
      setUptime(99.5);
    } else if (systemHealth === 'warning') {
      setUptime(98.0);
    } else {
      setUptime(95.0);
    }

    // Update response time
    const avgResponseTime = metrics.find(m => m.id === 'api')?.value || 120;
    setResponseTime(avgResponseTime);
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsMonitoring(true);
    
    intervalRef.current = setInterval(() => {
      updateMetrics();
      generateAlerts();
      autoResolveAlerts();
      calculateSystemHealth();
    }, 2000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update system health when metrics change
  useEffect(() => {
    calculateSystemHealth();
  }, [metrics]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'critical': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-blue-400 bg-blue-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'critical': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-green-400" />;
      case 'stable': return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-xl border-b border-white/10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-8 h-8 text-cyan-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Proactive Monitoring System
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-sm">{isMonitoring ? 'Monitoring' : 'Stopped'}</span>
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
                {isMonitoring ? (
                  <>
                    <Pause className="w-4 h-4 mr-2 inline" />
                    Stop Monitoring
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 inline" />
                    Start Monitoring
                  </>
                )}
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-80px)]">
          {/* System Health Overview */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { 
                label: 'System Health', 
                value: systemHealth.toUpperCase(), 
                icon: Shield, 
                color: getSystemHealthColor(systemHealth),
                subtitle: 'Overall Status'
              },
              { 
                label: 'Uptime', 
                value: `${uptime}%`, 
                icon: Clock, 
                color: 'text-green-400',
                subtitle: 'Service Availability'
              },
              { 
                label: 'Response Time', 
                value: `${responseTime}ms`, 
                icon: Zap, 
                color: 'text-blue-400',
                subtitle: 'Average API Response'
              },
              { 
                label: 'Active Alerts', 
                value: alerts.filter(a => !a.resolved).length, 
                icon: AlertTriangle, 
                color: 'text-orange-400',
                subtitle: 'Unresolved Issues'
              }
            ].map((stat, idx) => (
              <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-gray-400">Live</span>
                </div>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.subtitle}</div>
              </div>
            ))}
          </div>

          {/* System Metrics */}
          <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-cyan-400" />
              System Metrics
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map(metric => (
                <div key={metric.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{metric.name}</span>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1">
                    {metric.value}{metric.unit}
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        metric.status === 'critical' ? 'bg-red-500' :
                        metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(100, (metric.value / metric.threshold.critical) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {metric.lastUpdated.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-400" />
              System Alerts
            </h3>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <p>No active alerts. System is running smoothly.</p>
                </div>
              ) : (
                alerts.slice(0, 10).map(alert => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${
                    alert.resolved 
                      ? 'bg-green-500/10 border-green-500/20' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          alert.resolved ? 'bg-green-500/20' : 'bg-orange-500/20'
                        }`}>
                          {alert.resolved ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{alert.component}</span>
                            <span className={`px-2 py-1 text-xs rounded ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              alert.resolved ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {alert.resolved ? 'Resolved' : 'Active'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 mb-2">{alert.message}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{alert.timestamp.toLocaleString()}</span>
                            {alert.autoResolved && (
                              <span className="text-green-400 flex items-center">
                                <Zap className="w-3 h-3 mr-1" />
                                Auto-resolved
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Charts Placeholder */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                Performance Trends
              </h3>
              <div className="h-48 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Performance charts will be displayed here</p>
                  <p className="text-sm">Real-time monitoring data visualization</p>
                </div>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-400" />
                Service Status
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'API Gateway', status: 'operational', uptime: '99.9%' },
                  { name: 'Database', status: 'operational', uptime: '99.8%' },
                  { name: 'Payment Service', status: 'operational', uptime: '99.7%' },
                  { name: 'Email Service', status: 'degraded', uptime: '98.5%' },
                  { name: 'File Storage', status: 'operational', uptime: '99.9%' }
                ].map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        service.status === 'operational' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}></div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <div className="text-sm text-gray-400">{service.uptime}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProactiveMonitoringSystem;
