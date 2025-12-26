import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Shield, 
  Database, 
  Activity,
  Bot,
  User,
  Settings,
  Bell,
  Eye,
  RefreshCw,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface Query {
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
  };
  timestamp: Date;
  resolution?: string;
  autoResolved: boolean;
}

interface Issue {
  id: string;
  type: 'error' | 'performance' | 'security' | 'feature';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'detected' | 'fixing' | 'fixed' | 'monitoring';
  description: string;
  component: string;
  timestamp: Date;
  fixApplied?: string;
  autoFixed: boolean;
}

const AICustomerCareEngineer: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [queries, setQueries] = useState<Query[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState({
    queriesProcessed: 0,
    issuesFixed: 0,
    avgResponseTime: 0,
    customerSatisfaction: 95,
    uptime: 99.9
  });
  const [selectedTab, setSelectedTab] = useState<'overview' | 'queries' | 'issues' | 'settings'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate real-time query monitoring
  const simulateQuery = () => {
    const queryTypes = [
      { type: 'customer', message: 'I can\'t access my premium features', priority: 'high' },
      { type: 'customer', message: 'How do I reset my password?', priority: 'medium' },
      { type: 'customer', message: 'My payment failed, can you help?', priority: 'urgent' },
      { type: 'customer', message: 'I want to upgrade my plan', priority: 'low' },
      { type: 'technical', message: 'Dashboard is loading slowly', priority: 'medium' },
      { type: 'technical', message: 'Login button not working', priority: 'high' },
      { type: 'technical', message: 'Payment form validation error', priority: 'urgent' }
    ];

    const randomQuery = queryTypes[Math.floor(Math.random() * queryTypes.length)];
    const customers = [
      { id: '1', name: 'John Smith', email: 'john@example.com', plan: 'Professional' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', plan: 'Elite' },
      { id: '3', name: 'Mike Chen', email: 'mike@example.com', plan: 'Basic' }
    ];

    const newQuery: Query = {
      id: `query_${Date.now()}`,
      ...randomQuery,
      customer: customers[Math.floor(Math.random() * customers.length)],
      timestamp: new Date(),
      status: 'pending',
      autoResolved: false
    };

    setQueries(prev => [newQuery, ...prev]);
    return newQuery;
  };

  // Simulate issue detection
  const simulateIssue = () => {
    const issueTypes = [
      { type: 'error', description: 'API endpoint returning 500 error', component: 'Backend API', severity: 'high' },
      { type: 'performance', description: 'Database query taking >2s', component: 'Database', severity: 'medium' },
      { type: 'security', description: 'Potential XSS vulnerability detected', component: 'Frontend', severity: 'critical' },
      { type: 'feature', description: 'Payment gateway timeout', component: 'Payment System', severity: 'high' }
    ];

    const randomIssue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
    const newIssue: Issue = {
      id: `issue_${Date.now()}`,
      ...randomIssue,
      timestamp: new Date(),
      status: 'detected',
      autoFixed: false
    };

    setIssues(prev => [newIssue, ...prev]);
    return newIssue;
  };

  // Auto-resolve customer queries
  const autoResolveQuery = async (query: Query) => {
    setIsProcessing(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let resolution = '';
    let autoResolved = false;

    // AI-powered resolution logic
    if (query.type === 'customer') {
      if (query.message.includes('premium features')) {
        resolution = 'I\'ve verified your account and restored access to premium features. Please refresh your browser and try again.';
        autoResolved = true;
      } else if (query.message.includes('password')) {
        resolution = 'I\'ve sent a password reset link to your email. Please check your inbox and follow the instructions.';
        autoResolved = true;
      } else if (query.message.includes('payment')) {
        resolution = 'I\'ve identified the payment issue and applied a fix. Please try your transaction again. If it still fails, I\'ll escalate this to our payment team.';
        autoResolved = true;
      } else if (query.message.includes('upgrade')) {
        resolution = 'I\'ve prepared your account for upgrade. You can now proceed with the plan change in your dashboard.';
        autoResolved = true;
      }
    } else if (query.type === 'technical') {
      if (query.message.includes('loading slowly')) {
        resolution = 'I\'ve optimized the dashboard performance by clearing cache and optimizing database queries. The issue should be resolved now.';
        autoResolved = true;
      } else if (query.message.includes('login button')) {
        resolution = 'I\'ve fixed the login button functionality. The issue was caused by a JavaScript error that I\'ve now resolved.';
        autoResolved = true;
      } else if (query.message.includes('validation error')) {
        resolution = 'I\'ve fixed the payment form validation. The error handling has been improved and should work correctly now.';
        autoResolved = true;
      }
    }

    if (!autoResolved) {
      resolution = 'I\'ve analyzed your query and escalated it to our specialized team. You\'ll receive a detailed response within 2 hours.';
    }

    // Update query status
    setQueries(prev => prev.map(q => 
      q.id === query.id 
        ? { ...q, status: 'resolved', resolution, autoResolved }
        : q
    ));

    // Update stats
    setStats(prev => ({
      ...prev,
      queriesProcessed: prev.queriesProcessed + 1,
      avgResponseTime: prev.avgResponseTime + (autoResolved ? 0.5 : 2)
    }));

    setIsProcessing(false);
  };

  // Auto-fix issues
  const autoFixIssue = async (issue: Issue) => {
    setIsProcessing(true);
    
    // Simulate fix processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    let fixApplied = '';
    let autoFixed = false;

    // AI-powered fix logic
    if (issue.type === 'error') {
      if (issue.description.includes('500 error')) {
        fixApplied = 'Restarted API service and cleared error logs. Applied database connection pool fix.';
        autoFixed = true;
      }
    } else if (issue.type === 'performance') {
      if (issue.description.includes('Database query')) {
        fixApplied = 'Optimized database queries and added proper indexing. Implemented query caching.';
        autoFixed = true;
      }
    } else if (issue.type === 'security') {
      if (issue.description.includes('XSS')) {
        fixApplied = 'Applied input sanitization and Content Security Policy headers. Updated validation logic.';
        autoFixed = true;
      }
    } else if (issue.type === 'feature') {
      if (issue.description.includes('Payment gateway')) {
        fixApplied = 'Switched to backup payment provider and implemented retry logic with exponential backoff.';
        autoFixed = true;
      }
    }

    if (!autoFixed) {
      fixApplied = 'Issue requires manual intervention. Alerted development team and created monitoring task.';
    }

    // Update issue status
    setIssues(prev => prev.map(i => 
      i.id === issue.id 
        ? { ...i, status: 'fixed', fixApplied, autoFixed }
        : i
    ));

    // Update stats
    setStats(prev => ({
      ...prev,
      issuesFixed: prev.issuesFixed + 1
    }));

    setIsProcessing(false);
  };

  // Start monitoring
  const startMonitoring = () => {
    setIsActive(true);
    
    // Simulate query arrivals every 5-15 seconds
    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance of new query
        const query = simulateQuery();
        autoResolveQuery(query);
      }
      
      if (Math.random() > 0.8) { // 20% chance of new issue
        const issue = simulateIssue();
        autoFixIssue(issue);
      }
    }, 5000 + Math.random() * 10000);
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsActive(false);
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'text-green-400 bg-green-500/20';
      case 'processing': return 'text-blue-400 bg-blue-500/20';
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'escalated': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
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
                <Bot className="w-8 h-8 text-cyan-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  AI Customer Care & Engineer
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                <span className="text-sm">{isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={isActive ? stopMonitoring : startMonitoring}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {isActive ? (
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
        <div className="flex h-[calc(100vh-80px)]">
          {/* Sidebar */}
          <aside className="w-64 bg-black/20 backdrop-blur-lg border-r border-white/10">
            <nav className="p-4 space-y-2">
              {[
                { id: 'overview', icon: Activity, label: 'Overview' },
                { id: 'queries', icon: MessageCircle, label: 'Customer Queries', badge: queries.filter(q => q.status === 'pending').length },
                { id: 'issues', icon: Wrench, label: 'Technical Issues', badge: issues.filter(i => i.status === 'detected').length },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTab(item.id as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    selectedTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
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
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Queries Processed', value: stats.queriesProcessed, icon: MessageCircle, color: 'cyan' },
                    { label: 'Issues Fixed', value: stats.issuesFixed, icon: Wrench, color: 'green' },
                    { label: 'Avg Response Time', value: `${stats.avgResponseTime.toFixed(1)}s`, icon: Clock, color: 'purple' },
                    { label: 'Uptime', value: `${stats.uptime}%`, icon: Shield, color: 'blue' }
                  ].map((stat, idx) => (
                    <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                        <span className="text-xs text-gray-400">Live</span>
                      </div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <MessageCircle className="w-5 h-5 mr-2 text-cyan-400" />
                      Recent Customer Queries
                    </h3>
                    <div className="space-y-3">
                      {queries.slice(0, 5).map(query => (
                        <div key={query.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                              {query.customer?.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{query.customer?.name}</div>
                              <div className="text-xs text-gray-400 truncate max-w-48">{query.message}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(query.priority)}`}>
                              {query.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(query.status)}`}>
                              {query.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Wrench className="w-5 h-5 mr-2 text-purple-400" />
                      Recent Technical Issues
                    </h3>
                    <div className="space-y-3">
                      {issues.slice(0, 5).map(issue => (
                        <div key={issue.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{issue.component}</div>
                            <div className="text-xs text-gray-400 truncate max-w-48">{issue.description}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              issue.severity === 'critical' ? 'text-red-400 bg-red-500/20' :
                              issue.severity === 'high' ? 'text-orange-400 bg-orange-500/20' :
                              issue.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                              'text-green-400 bg-green-500/20'
                            }`}>
                              {issue.severity}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${getStatusColor(issue.status)}`}>
                              {issue.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Status */}
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Bot className="w-5 h-5 mr-2 text-cyan-400" />
                    AI Assistant Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">95%</div>
                      <div className="text-sm text-gray-400">Auto-Resolution Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">2.3s</div>
                      <div className="text-sm text-gray-400">Avg Processing Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">24/7</div>
                      <div className="text-sm text-gray-400">Monitoring</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'queries' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Customer Queries</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Total: {queries.length}</span>
                    <button
                      onClick={() => {
                        const query = simulateQuery();
                        autoResolveQuery(query);
                      }}
                      className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
                    >
                      Simulate Query
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {queries.map(query => (
                    <div key={query.id} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-lg font-bold">
                            {query.customer?.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{query.customer?.name}</h3>
                            <p className="text-sm text-gray-400">{query.customer?.email}</p>
                            <p className="text-xs text-gray-500">{query.customer?.plan} Plan</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-sm rounded ${getPriorityColor(query.priority)}`}>
                            {query.priority.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 text-sm rounded ${getStatusColor(query.status)}`}>
                            {query.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Query:</h4>
                        <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{query.message}</p>
                      </div>

                      {query.resolution && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                            Resolution:
                          </h4>
                          <p className="text-gray-300 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            {query.resolution}
                          </p>
                          {query.autoResolved && (
                            <p className="text-xs text-green-400 mt-2 flex items-center">
                              <Bot className="w-3 h-3 mr-1" />
                              Auto-resolved by AI
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{query.timestamp.toLocaleString()}</span>
                        <span>Type: {query.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'issues' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Technical Issues</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">Total: {issues.length}</span>
                    <button
                      onClick={() => {
                        const issue = simulateIssue();
                        autoFixIssue(issue);
                      }}
                      className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                    >
                      Simulate Issue
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {issues.map(issue => (
                    <div key={issue.id} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{issue.component}</h3>
                          <p className="text-sm text-gray-400">{issue.type.toUpperCase()} Issue</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-sm rounded ${
                            issue.severity === 'critical' ? 'text-red-400 bg-red-500/20' :
                            issue.severity === 'high' ? 'text-orange-400 bg-orange-500/20' :
                            issue.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                            'text-green-400 bg-green-500/20'
                          }`}>
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className={`px-3 py-1 text-sm rounded ${getStatusColor(issue.status)}`}>
                            {issue.status.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Description:</h4>
                        <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{issue.description}</p>
                      </div>

                      {issue.fixApplied && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 flex items-center">
                            <Wrench className="w-4 h-4 mr-2 text-green-400" />
                            Fix Applied:
                          </h4>
                          <p className="text-gray-300 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                            {issue.fixApplied}
                          </p>
                          {issue.autoFixed && (
                            <p className="text-xs text-green-400 mt-2 flex items-center">
                              <Bot className="w-3 h-3 mr-1" />
                              Auto-fixed by AI
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{issue.timestamp.toLocaleString()}</span>
                        <span>Component: {issue.component}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'settings' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <h2 className="text-2xl font-bold">AI Assistant Settings</h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Query Processing</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Auto-Resolution Threshold</label>
                        <select className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white">
                          <option>High (90% auto-resolve)</option>
                          <option>Medium (75% auto-resolve)</option>
                          <option>Low (60% auto-resolve)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Response Time Target</label>
                        <select className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white">
                          <option>Ultra Fast (1-2 seconds)</option>
                          <option>Fast (2-5 seconds)</option>
                          <option>Standard (5-10 seconds)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Issue Detection</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Monitoring Frequency</label>
                        <select className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white">
                          <option>Real-time (Continuous)</option>
                          <option>High (Every 30 seconds)</option>
                          <option>Medium (Every 2 minutes)</option>
                          <option>Low (Every 5 minutes)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Auto-Fix Confidence</label>
                        <select className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-white">
                          <option>High (95% confidence required)</option>
                          <option>Medium (85% confidence required)</option>
                          <option>Low (75% confidence required)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Integration Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Customer Service Dashboard</h4>
                        <p className="text-sm text-gray-400">Integrate with existing customer service system</p>
                      </div>
                      <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                        Connect
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Error Monitoring</h4>
                        <p className="text-sm text-gray-400">Connect to error tracking and logging systems</p>
                      </div>
                      <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                        Connect
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Performance Monitoring</h4>
                        <p className="text-sm text-gray-400">Monitor website performance and speed</p>
                      </div>
                      <button className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                        Connect
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AICustomerCareEngineer;
