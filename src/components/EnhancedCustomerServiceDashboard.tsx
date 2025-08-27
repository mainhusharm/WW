import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Bell,
  Bot,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  Headphones,
  LogOut,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings,
  TrendingUp,
  Users,
  Zap,
  Activity,
} from 'lucide-react';
import CustomerDatabase from './CustomerDatabase';
import { api } from '../api';

const EnhancedCustomerServiceDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [queries, setQueries] = useState([]);
  const [activeTab, setActiveTab] = useState('tickets');
  const [activePage, setActivePage] = useState('dashboard');
  const [liveChats, setLiveChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    responseTime: 0,
    uptime: '0h 0m',
    activeConnections: 0,
  });
  const [agentSettings, setAgentSettings] = useState({
    notifications: true,
    autoResponse: false,
    workingHours: '9am - 5pm',
    maxChats: 5,
    responseTime: 60,
  });
  const [customerData, setCustomerData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get('/api/tickets');
        setTickets(response.data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };

    const fetchQueries = async () => {
      try {
        const response = await axios.get('/api/queries');
        setQueries(response.data);
      } catch (error) {
        console.error('Error fetching queries:', error);
      }
    };

    const fetchCustomerData = async () => {
      try {
        // Try to fetch from main API first with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const mainApiResponse = await api.get('/customers', {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (mainApiResponse.data) {
          setCustomerData(mainApiResponse.data);
          return;
        }
      } catch (mainApiError) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Main API not available:', mainApiError);
        }
      }

      // Only try customer service API in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const customerServiceUrl = 'http://localhost:5001';
          const response = await fetch(`${customerServiceUrl}/api/customers`, {
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            setCustomerData(data);
          }
        } catch (csError) {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.warn('Customer service API not available:', csError);
          }
          setError(
            'Customer data services are currently offline. This is normal during development.'
          );
        }
      }
    };

    if (activePage === 'customer-database') {
      fetchCustomerData();
    }

    if (activeTab === 'tickets') {
      fetchTickets();
    } else {
      fetchQueries();
    }
  }, [activeTab, activePage]);

  const handleLogout = () => {
    // Implement logout logic
  };

  const sendMessage = () => {
    // Implement send message logic
  };

  const updateSettings = (key, value) => {
    setAgentSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col border-r border-cyan-500/20">
        <div className="p-6 text-center border-b border-cyan-500/20">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Support Center
          </h1>
        </div>

        <nav className="flex-1 py-6">
          {[
            {
              id: 'dashboard',
              label: 'Support Dashboard',
              icon: BarChart3,
              badge: null,
            },
            {
              id: 'live-chats',
              label: 'Live Chats',
              icon: MessageSquare,
              badge: liveChats.filter((c) => c.status === 'active').length,
            },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null },
            { id: 'customers', label: 'User Profiles', icon: Users, badge: null },
            {
              id: 'support-queries',
              label: 'Support Queries',
              icon: Headphones,
              badge: null,
            },
            { id: 'system', label: 'System Status', icon: Server, badge: null },
            { id: 'settings', label: 'Settings', icon: Settings, badge: null },
            {
              id: 'customer-database',
              label: 'Customer Database',
              icon: Database,
              badge: null,
            },
          ].map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-6 py-4 cursor-pointer transition-all relative group ${
                activePage === item.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-r-2 border-cyan-400'
                  : 'hover:bg-white/5'
              }`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon
                className={`w-5 h-5 ${
                  activePage === item.id
                    ? 'text-cyan-400'
                    : 'text-gray-400 group-hover:text-cyan-300'
                }`}
              />
              <span
                className={`${
                  activePage === item.id
                    ? 'text-cyan-100'
                    : 'text-gray-300 group-hover:text-white'
                }`}
              >
                {item.label}
              </span>
              {item.badge > 0 && (
                <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>

        <div className="p-6 border-t border-cyan-500/20">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-lg text-red-300 hover:bg-red-500/30 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800/80 to-gray-900/80 backdrop-blur-xl px-8 py-6 border-b border-cyan-500/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {activePage === 'dashboard'
                  ? 'Support Dashboard'
                  : activePage === 'live-chats'
                  ? 'Live Chats'
                  : activePage === 'analytics'
                  ? 'Analytics'
                  : activePage === 'customers'
                  ? 'User Profiles'
                  : activePage === 'support-queries'
                  ? 'Support Queries'
                  : activePage === 'system'
                  ? 'System Status'
                  : activePage === 'customer-database'
                  ? 'Customer Database'
                  : 'Settings'}
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search database..."
                  className="pl-10 pr-4 py-3 bg-gray-700/50 border border-cyan-400/30 rounded-xl w-80 text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl cursor-pointer hover:from-cyan-500/30 hover:to-blue-500/30 transition-all">
                <Bell className="w-6 h-6 text-cyan-400" />
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-xl backdrop-blur-sm border border-cyan-400/20">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  QA
                </div>
                <div>
                  <div className="font-semibold text-cyan-100">Support Agent</div>
                  <div className="text-xs text-cyan-300">Trader Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <>
            {activePage === 'dashboard' && (
              <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Active Chats',
                    value: liveChats.filter((c) => c.status === 'active').length,
                    icon: MessageSquare,
                    color: 'cyan',
                  },
                  {
                    title: 'Avg. Response Time',
                    value: `${systemMetrics.responseTime.toFixed(1)}s`,
                    icon: Zap,
                    color: 'green',
                  },
                  {
                    title: 'System Uptime',
                    value: systemMetrics.uptime,
                    icon: Activity,
                    color: 'blue',
                  },
                  {
                    title: 'Active Connections',
                    value: systemMetrics.activeConnections,
                    icon: Globe,
                    color: 'purple',
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-cyan-200 text-sm font-medium">
                        {stat.title}
                      </span>
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${
                          stat.color === 'cyan'
                            ? 'from-cyan-500/20 to-cyan-600/20 text-cyan-400'
                            : stat.color === 'green'
                            ? 'from-green-500/20 to-green-600/20 text-green-400'
                            : stat.color === 'blue'
                            ? 'from-blue-500/20 to-blue-600/20 text-blue-400'
                            : 'from-purple-500/20 to-purple-600/20 text-purple-400'
                        }`}
                      >
                        <stat.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-white mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-green-400 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Optimal Performance</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* System Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-cyan-100 mb-6 flex items-center gap-2">
                    <Cpu className="w-6 h-6 text-cyan-400" />
                    System Metrics
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-cyan-200">CPU Usage</span>
                        <span className="text-white font-medium">
                          {systemMetrics.cpuUsage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${systemMetrics.cpuUsage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-cyan-200">Memory Usage</span>
                        <span className="text-white font-medium">
                          {systemMetrics.memoryUsage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${systemMetrics.memoryUsage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20">
                  <h3 className="text-xl font-bold text-cyan-100 mb-6 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    Live Activity Feed
                  </h3>
                  <div className="space-y-3">
                    {[
                      { time: '2 min ago', event: 'New chat initiated', type: 'info' },
                      {
                        time: '5 min ago',
                        event: 'System performance optimized',
                        type: 'success',
                      },
                      {
                        time: '8 min ago',
                        event: 'Agent response time improved',
                        type: 'success',
                      },
                      { time: '12 min ago', event: 'Network updated', type: 'info' },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.type === 'success' ? 'bg-green-400' : 'bg-cyan-400'
                          } animate-pulse`}
                        ></div>
                        <div className="flex-1">
                          <div className="text-sm text-white">{activity.event}</div>
                          <div className="text-xs text-gray-400">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'live-chats' && (
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Chat List */}
              <div className="col-span-4 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
                <div className="p-6 border-b border-cyan-500/20">
                  <h4 className="font-bold text-cyan-100 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-400" />
                    Conversations
                  </h4>
                  <div className="flex gap-2">
                    {['all', 'active', 'waiting'].map((filter) => (
                      <button
                        key={filter}
                        className="px-3 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-200 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all border border-cyan-400/30"
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-96">
                  {liveChats.map((chat) => (
                    <div
                      key={chat.chatId}
                      className={`p-4 border-b border-gray-700/50 cursor-pointer transition-all hover:bg-cyan-500/10 ${
                        currentChat === chat.chatId
                          ? 'bg-cyan-500/20 border-l-4 border-l-cyan-400'
                          : ''
                      }`}
                      onClick={() => setCurrentChat(chat.chatId)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-semibold text-cyan-100">
                          {chat.userName}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(chat.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-2 truncate">
                        {chat.query}
                      </div>
                      <div className="flex gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            chat.priority === 'high'
                              ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                              : chat.priority === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                              : 'bg-green-500/20 text-green-300 border border-green-400/30'
                          }`}
                        >
                          {chat.priority.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            chat.status === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : chat.status === 'waiting'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {chat.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {liveChats.length === 0 && (
                    <div className="p-8 text-center text-gray-400">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-cyan-400/50" />
                      <p>No active chats</p>
                      <p className="text-sm">Waiting for user connections...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Interface */}
              <div className="col-span-8 bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 flex flex-col">
                {currentChat ? (
                  <>
                    <div className="p-6 border-b border-cyan-500/20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {liveChats
                              .find((c) => c.chatId === currentChat)
                              ?.userName.split(' ')
                              .map((n) => n[0])
                              .join('') || 'U'}
                          </div>
                          <div>
                            <h3 className="font-bold text-cyan-100">
                              {
                                liveChats.find((c) => c.chatId === currentChat)
                                  ?.userName
                              }
                            </h3>
                            <p className="text-sm text-gray-400">Trader • Online</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const chatToTransfer = liveChats.find(
                                (c) => c.chatId === currentChat
                              );
                              if (chatToTransfer) {
                                const transferredChats = JSON.parse(
                                  localStorage.getItem('admin_transferred_chats') || '[]'
                                );
                                transferredChats.push(chatToTransfer);
                                localStorage.setItem(
                                  'admin_transferred_chats',
                                  JSON.stringify(transferredChats)
                                );

                                const updatedLiveChats = liveChats.filter(
                                  (c) => c.chatId !== currentChat
                                );
                                setLiveChats(updatedLiveChats);
                                localStorage.setItem(
                                  'cs_live_chats',
                                  JSON.stringify(updatedLiveChats)
                                );
                                setCurrentChat(null);
                              }
                            }}
                            className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg text-purple-400 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                          <button className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 transition-all">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all">
                            <RefreshCw className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto">
                      <div className="text-center text-gray-400 mb-4">
                        <p>Chat session initiated</p>
                      </div>
                      {/* Chat messages would go here */}
                    </div>

                    <div className="p-6 border-t border-cyan-500/20">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your response..."
                          className="flex-1 bg-gray-700/50 border border-cyan-400/30 rounded-xl px-4 py-3 text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-sm"
                        />
                        <button
                          onClick={sendMessage}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-400 hover:to-blue-500 font-medium transition-all hover:scale-105"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center">
                    <div>
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 text-cyan-400/50" />
                      <h3 className="text-xl font-bold text-cyan-100 mb-2">
                        Select a Chat
                      </h3>
                      <p className="text-gray-400">
                        Choose a conversation from the list to begin
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePage === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-8 rounded-2xl border border-cyan-500/20">
                <h3 className="text-2xl font-bold text-cyan-100 mb-6 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-cyan-400" />
                  Agent Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-cyan-200 text-sm font-medium mb-2">
                        Notifications
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={agentSettings.notifications}
                          onChange={(e) =>
                            updateSettings('notifications', e.target.checked)
                          }
                          className="w-5 h-5 text-cyan-500 bg-gray-700 border-cyan-400 rounded focus:ring-cyan-500"
                        />
                        <span className="text-gray-300">
                          Enable real-time notifications
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-cyan-200 text-sm font-medium mb-2">
                        Auto Response
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={agentSettings.autoResponse}
                          onChange={(e) =>
                            updateSettings('autoResponse', e.target.checked)
                          }
                          className="w-5 h-5 text-cyan-500 bg-gray-700 border-cyan-400 rounded focus:ring-cyan-500"
                        />
                        <span className="text-gray-300">
                          Enable auto-responses
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-cyan-200 text-sm font-medium mb-2">
                        Working Hours
                      </label>
                      <input
                        type="text"
                        value={agentSettings.workingHours}
                        onChange={(e) =>
                          updateSettings('workingHours', e.target.value)
                        }
                        className="w-full bg-gray-700/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-cyan-200 text-sm font-medium mb-2">
                        Max Concurrent Chats
                      </label>
                      <input
                        type="number"
                        value={agentSettings.maxChats}
                        onChange={(e) =>
                          updateSettings('maxChats', parseInt(e.target.value))
                        }
                        className="w-full bg-gray-700/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        min="1"
                        max="10"
                      />
                    </div>

                    <div>
                      <label className="block text-cyan-200 text-sm font-medium mb-2">
                        Response Time Target (seconds)
                      </label>
                      <input
                        type="number"
                        value={agentSettings.responseTime}
                        onChange={(e) =>
                          updateSettings('responseTime', parseInt(e.target.value))
                        }
                        className="w-full bg-gray-700/50 border border-cyan-400/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        min="10"
                        max="300"
                      />
                    </div>

                    <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg hover:from-cyan-400 hover:to-blue-500 font-medium transition-all hover:scale-105">
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'support-queries' && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl p-8 rounded-2xl border border-cyan-500/20">
                <h3 className="text-2xl font-bold text-cyan-100 mb-6 flex items-center gap-2">
                  <Headphones className="w-6 h-6 text-cyan-400" />
                  Contact Support Queries
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {[
                    { title: 'Total Queries', value: '0', icon: Mail, color: 'cyan' },
                    { title: 'Pending', value: '0', icon: Clock, color: 'yellow' },
                    {
                      title: 'Resolved',
                      value: '0',
                      icon: CheckCircle,
                      color: 'green',
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-gray-700/60 to-gray-800/60 p-6 rounded-xl border border-cyan-500/20"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-cyan-200 text-sm font-medium">
                          {stat.title}
                        </span>
                        <div
                          className={`p-2 rounded-lg bg-gradient-to-r ${
                            stat.color === 'cyan'
                              ? 'from-cyan-500/20 to-cyan-600/20 text-cyan-400'
                              : stat.color === 'yellow'
                              ? 'from-yellow-500/20 to-yellow-600/20 text-yellow-400'
                              : 'from-green-500/20 to-green-600/20 text-green-400'
                          }`}
                        >
                          <stat.icon className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-6 border border-cyan-500/10">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-cyan-100">
                      Recent Support Queries
                    </h4>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg text-cyan-200 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all text-sm">
                        All
                      </button>
                      <button className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-lg text-yellow-200 hover:from-yellow-500/30 hover:to-orange-500/30 transition-all text-sm">
                        Pending
                      </button>
                      <button className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 transition-all text-sm">
                        Resolved
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-center py-12 text-gray-400">
                      <Headphones className="w-16 h-16 mx-auto mb-4 text-cyan-400/30" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        No Support Queries Yet
                      </h3>
                      <p className="text-gray-400 mb-4">
                        Contact support queries from the website will appear here
                      </p>
                      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-cyan-200">
                          <strong>Note:</strong> Queries submitted through the
                          Contact Support page will be displayed here for agent
                          review and response.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePage === 'customer-database' && <CustomerDatabase />}
          </>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCustomerServiceDashboard;
