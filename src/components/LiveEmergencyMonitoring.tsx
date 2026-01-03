import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw,
  Monitor,
  Gauge
} from 'lucide-react';
import { liveSystemMonitor, LiveSystemMetrics, LiveAlert } from '../services/LiveSystemMonitor';

const LiveEmergencyMonitoring: React.FC = () => {
  const [systemMetrics, setSystemMetrics] = useState<LiveSystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<LiveAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts' | 'settings'>('overview');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start live monitoring
  const startMonitoring = async () => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    await liveSystemMonitor.startMonitoring();
    
    // Set up real-time updates
    updateIntervalRef.current = setInterval(() => {
      const currentMetrics = liveSystemMonitor.getCurrentMetrics();
      const currentAlerts = liveSystemMonitor.getAllAlerts();
      const currentActiveAlerts = liveSystemMonitor.getActiveAlerts();
      
      setSystemMetrics(currentMetrics);
      setAlerts(currentAlerts);
      setActiveAlerts(currentActiveAlerts);
      setLastUpdate(new Date());
    }, 1000); // Update every second
  };

  // Stop live monitoring
  const stopMonitoring = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    liveSystemMonitor.stopMonitoring();
    setIsMonitoring(false);
  };

  // Initialize monitoring
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, []);

  // Get health status based on metrics
  const getHealthStatus = (): 'healthy' | 'warning' | 'critical' => {
    if (!systemMetrics) return 'healthy';
    
    const criticalThresholds = {
      cpu: 90,
      memory: 95,
      disk: 95,
      responseTime: 5000,
      errorRate: 10
    };
    
    const warningThresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 2000,
      errorRate: 5
    };

    if (systemMetrics.cpuUsage > criticalThresholds.cpu ||
        systemMetrics.memoryUsage > criticalThresholds.memory ||
        systemMetrics.diskUsage > criticalThresholds.disk ||
        systemMetrics.responseTime > criticalThresholds.responseTime ||
        systemMetrics.errorRate > criticalThresholds.errorRate) {
      return 'critical';
    }

    if (systemMetrics.cpuUsage > warningThresholds.cpu ||
        systemMetrics.memoryUsage > warningThresholds.memory ||
        systemMetrics.diskUsage > warningThresholds.disk ||
        systemMetrics.responseTime > warningThresholds.responseTime ||
        systemMetrics.errorRate > warningThresholds.errorRate) {
      return 'warning';
    }

    return 'healthy';
  };

  // Get color based on value and thresholds
  const getMetricColor = (value: number, warningThreshold: number, criticalThreshold: number): string => {
    if (value >= criticalThreshold) return 'text-red-400';
    if (value >= warningThreshold) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get health color
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Get alert color
  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  // Format uptime
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };

  // Format memory size
  const formatMemory = (bytes: number): string => {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Monitor className="w-8 h-8 text-red-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                Live Emergency Monitoring
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm">{isMonitoring ? 'Live Monitoring' : 'Stopped'}</span>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
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
              { id: 'metrics', icon: Gauge, label: 'Live Metrics' },
              { id: 'alerts', icon: AlertTriangle, label: 'Alerts', badge: activeAlerts.length },
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
              {/* System Health Status */}
              <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-cyan-400" />
                  System Health Status
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      getHealthStatus() === 'healthy' ? 'bg-green-500/20' :
                      getHealthStatus() === 'warning' ? 'bg-yellow-500/20' :
                      'bg-red-500/20'
                    }`}>
                      <Shield className={`w-8 h-8 ${
                        getHealthStatus() === 'healthy' ? 'text-green-400' :
                        getHealthStatus() === 'warning' ? 'text-yellow-400' :
                        'text-red-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">
                        {getHealthStatus().toUpperCase()}
                      </h4>
                      <p className="text-gray-400">
                        {systemMetrics ? 'Real-time monitoring active' : 'Loading system data...'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">Active Alerts</div>
                    <div className="text-3xl font-bold text-red-400">{activeAlerts.length}</div>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              {systemMetrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { 
                      label: 'CPU Usage', 
                      value: `${systemMetrics.cpuUsage.toFixed(1)}%`, 
                      icon: Cpu, 
                      color: getMetricColor(systemMetrics.cpuUsage, 80, 90),
                      threshold: '80%'
                    },
                    { 
                      label: 'Memory Usage', 
                      value: `${systemMetrics.memoryUsage.toFixed(1)}%`, 
                      icon: MemoryStick, 
                      color: getMetricColor(systemMetrics.memoryUsage, 85, 95),
                      threshold: '85%'
                    },
                    { 
                      label: 'Response Time', 
                      value: `${systemMetrics.responseTime}ms`, 
                      icon: Clock, 
                      color: getMetricColor(systemMetrics.responseTime, 2000, 5000),
                      threshold: '2s'
                    },
                    { 
                      label: 'Error Rate', 
                      value: `${systemMetrics.errorRate.toFixed(2)}%`, 
                      icon: AlertCircle, 
                      color: getMetricColor(systemMetrics.errorRate, 5, 10),
                      threshold: '5%'
                    }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <metric.icon className={`w-5 h-5 ${metric.color}`} />
                        <span className="text-xs text-gray-400">Threshold: {metric.threshold}</span>
                      </div>
                      <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                      <div className="text-sm text-gray-400">{metric.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Alerts */}
              <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  Recent Live Alerts
                </h3>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium">{alert.message}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            alert.resolved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {alert.resolved ? 'RESOLVED' : 'ACTIVE'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">Component: {alert.component}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Severity: {alert.severity}/10</span>
                        <span>Type: {alert.type.toUpperCase()}</span>
                        {alert.autoResolved && <span className="text-green-400">Auto-resolved</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'metrics' && systemMetrics && (
            <div className="p-6 space-y-6 overflow-y-auto h-full">
              <h2 className="text-2xl font-bold">Live System Metrics</h2>
              
              {/* System Resources */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Cpu className="w-5 h-5 mr-2 text-blue-400" />
                    CPU & Memory
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>CPU Usage</span>
                        <span className={getMetricColor(systemMetrics.cpuUsage, 80, 90)}>
                          {systemMetrics.cpuUsage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            systemMetrics.cpuUsage > 90 ? 'bg-red-500' :
                            systemMetrics.cpuUsage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(systemMetrics.cpuUsage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Memory Usage</span>
                        <span className={getMetricColor(systemMetrics.memoryUsage, 85, 95)}>
                          {systemMetrics.memoryUsage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            systemMetrics.memoryUsage > 95 ? 'bg-red-500' :
                            systemMetrics.memoryUsage > 85 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(systemMetrics.memoryUsage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Heap Used:</span>
                        <div className="font-mono">{formatMemory(systemMetrics.heapUsed)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Heap Total:</span>
                        <div className="font-mono">{formatMemory(systemMetrics.heapTotal)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <HardDrive className="w-5 h-5 mr-2 text-green-400" />
                    Storage & Network
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Disk Usage</span>
                        <span className={getMetricColor(systemMetrics.diskUsage, 90, 95)}>
                          {systemMetrics.diskUsage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            systemMetrics.diskUsage > 95 ? 'bg-red-500' :
                            systemMetrics.diskUsage > 90 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(systemMetrics.diskUsage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Network Latency:</span>
                        <div className={`font-mono ${
                          systemMetrics.networkLatency > 100 ? 'text-red-400' :
                          systemMetrics.networkLatency > 50 ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {systemMetrics.networkLatency.toFixed(1)}ms
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Active Connections:</span>
                        <div className="font-mono text-blue-400">
                          {systemMetrics.activeConnections}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-purple-400" />
                  Performance Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {systemMetrics.responseTime}ms
                    </div>
                    <div className="text-sm text-gray-400">Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {systemMetrics.errorRate.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-400">Error Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {formatUptime(systemMetrics.uptime)}
                    </div>
                    <div className="text-sm text-gray-400">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {systemMetrics.processCount}
                    </div>
                    <div className="text-sm text-gray-400">Processes</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'alerts' && (
            <div className="p-6 space-y-6 overflow-y-auto h-full">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Live Alerts</h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => liveSystemMonitor.clearAlerts()}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Alerts</h3>
                    <p className="text-gray-400">System is running smoothly with no active alerts.</p>
                  </div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className={`p-6 rounded-xl border ${getAlertColor(alert.type)}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-6 h-6 mt-1" />
                          <div>
                            <h3 className="text-lg font-semibold">{alert.message}</h3>
                            <p className="text-gray-300">Component: {alert.component}</p>
                            <p className="text-sm text-gray-400 mt-1">
                              Detected at: {alert.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-sm rounded ${
                            alert.resolved ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {alert.resolved ? 'RESOLVED' : 'ACTIVE'}
                          </span>
                          <span className="text-sm text-gray-400">
                            {alert.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-400">Severity:</span>
                          <div className="text-lg font-bold">{alert.severity}/10</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Type:</span>
                          <div className="text-lg font-bold capitalize">{alert.type}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Component:</span>
                          <div className="text-lg font-bold">{alert.component}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-400">Status:</span>
                          <div className="text-lg font-bold">
                            {alert.autoResolved ? 'Auto-resolved' : 'Manual'}
                          </div>
                        </div>
                      </div>

                      {alert.resolved && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="font-medium text-green-400">Alert Resolved</span>
                          </div>
                          <p className="text-sm text-green-300">
                            {alert.autoResolved ? 'This alert was automatically resolved by the system.' : 'This alert was manually resolved.'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Settings tab would be implemented here */}
        </main>
      </div>
    </div>
  );
};

export default LiveEmergencyMonitoring;
