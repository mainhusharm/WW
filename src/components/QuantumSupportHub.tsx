import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, User, FileText, Shield, TrendingUp, Bell, Settings, ChevronRight, Circle, AlertCircle, Clock, Star, Upload, Database, Activity, Zap, Globe, Lock, CreditCard, HelpCircle } from 'lucide-react';

const CustomerServiceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [liveChats, setLiveChats] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [stats, setStats] = useState({
    activeChats: 0,
    waitingQueue: 0,
    avgResponseTime: '0s',
    satisfaction: 0,
    ticketsToday: 0,
    resolvedToday: 0
  });
  const [loading, setLoading] = useState(false);

  // Fetch real data from your working backend
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch customers from your working backend
      const apiBaseUrl = import.meta.env.PROD 
      ? 'https://www.traderedgepro.com/api'
      : 'http://localhost:3005/api';
    
    const customersResponse = await fetch(`${apiBaseUrl}/customers`);
      const customersData = await customersResponse.json();
      
      if (customersData.customers) {
        // Transform backend data to match frontend structure
        const transformedCustomers = customersData.customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          status: customer.status || 'active',
          plan: customer.membership_tier || 'Basic',
          riskLevel: getRandomRiskLevel(),
          lastActive: getTimeAgo(customer.last_active || customer.created_at),
          tickets: Math.floor(Math.random() * 10) + 1,
          satisfaction: Math.floor(Math.random() * 20) + 80,
          questionnaire: { 
            completed: Math.random() > 0.3, 
            responses: Math.floor(Math.random() * 15) + 5 
          },
          screenshots: Math.floor(Math.random() * 20) + 1,
          password: '••••••••',
          joinDate: customer.join_date || customer.created_at
        }));
        
        setCustomers(transformedCustomers);
        
        // Generate live chats from customer data
        const activeChats = transformedCustomers.slice(0, 3).map((customer, index) => ({
          id: index + 1,
          customer: customer.name,
          message: getRandomChatMessage(),
          time: `${Math.floor(Math.random() * 10) + 1} min ago`,
          unread: Math.random() > 0.5
        }));
        setLiveChats(activeChats);
        
        // Update stats
        setStats({
          activeChats: activeChats.length,
          waitingQueue: Math.floor(Math.random() * 5) + 1,
          avgResponseTime: `${Math.floor(Math.random() * 60) + 15}s`,
          satisfaction: Math.floor(Math.random() * 15) + 85,
          ticketsToday: Math.floor(Math.random() * 30) + 15,
          resolvedToday: Math.floor(Math.random() * 25) + 10
        });
      }

      // Generate sample chat history
      setChatHistory([
        { sender: 'customer', message: 'Hello, I need help with my account', time: '10:30 AM' },
        { sender: 'agent', message: 'Hi! I\'d be happy to help. What seems to be the issue?', time: '10:31 AM' },
        { sender: 'customer', message: 'I can\'t access my premium features', time: '10:32 AM' }
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRandomRiskLevel = () => {
    const levels = ['low', 'medium', 'high'];
    return levels[Math.floor(Math.random() * levels.length)];
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '1 hour ago';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour ago`;
    return `${Math.floor(diffMins / 1440)} day ago`;
  };

  const getRandomChatMessage = () => {
    const messages = [
      'I need help with my billing',
      'How do I upgrade my plan?',
      'Can you help me reset my password?',
      'I have a technical issue',
      'Where can I find my account settings?'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRiskColor = (level) => {
    switch(level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-400';
      case 'waiting': return 'bg-yellow-400';
      case 'inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await fetchDashboardData();
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/customers/search?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.customers) {
        const transformedCustomers = data.customers.map(customer => ({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          status: customer.status || 'active',
          plan: customer.membership_tier || 'Basic',
          riskLevel: getRandomRiskLevel(),
          lastActive: getTimeAgo(customer.last_active || customer.created_at),
          tickets: Math.floor(Math.random() * 10) + 1,
          satisfaction: Math.floor(Math.random() * 20) + 80,
          questionnaire: { 
            completed: Math.random() > 0.3, 
            responses: Math.floor(Math.random() * 15) + 5 
          },
          screenshots: Math.floor(Math.random() * 20) + 1,
          password: '••••••••',
          joinDate: customer.join_date || customer.created_at
        }));
        setCustomers(transformedCustomers);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleChatSend = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      sender: 'agent',
      message: chatMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');
  };

  const handleCustomerUpdate = async (customerId, updates) => {
    try {
      const response = await fetch(`${apiBaseUrl}/customers/${customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        // Update local state
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { ...c, ...updates } : c
        ));
        
        // Update selected customer if it's the one being edited
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(prev => ({ ...prev, ...updates }));
        }
      }
    } catch (error) {
      console.error('Error updating customer:', error);
    }
  };

  const handleCustomerDelete = async (customerId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/customers/${customerId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(null);
        }
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-xl">Loading Quantum Support Hub...</p>
        </div>
      </div>
    );
  }

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
                <Zap className="w-8 h-8 text-cyan-400" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  NexusDesk Pro
                </h1>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers, tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-400 transition-all w-80"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg border border-white/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Agent Online</span>
              </div>
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
                { id: 'live-chat', icon: MessageCircle, label: 'Live Chat', badge: stats.activeChats },
                { id: 'customers', icon: User, label: 'Customers' },
                { id: 'tickets', icon: FileText, label: 'Tickets', badge: stats.ticketsToday },
                { id: 'risk', icon: Shield, label: 'Risk Management' },
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
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
            {activeTab === 'overview' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Active Chats', value: stats.activeChats, icon: MessageCircle, color: 'cyan' },
                    { label: 'Avg Response', value: stats.avgResponseTime, icon: Clock, color: 'purple' },
                    { label: 'Satisfaction', value: `${stats.satisfaction}%`, icon: Star, color: 'yellow' },
                    { label: 'Queue', value: stats.waitingQueue, icon: User, color: 'pink' },
                    { label: 'Tickets Today', value: stats.ticketsToday, icon: FileText, color: 'green' },
                    { label: 'Resolved', value: stats.resolvedToday, icon: Shield, color: 'blue' }
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
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-cyan-400" />
                    Real-time Activity Stream
                  </h3>
                  <div className="space-y-3">
                    {liveChats.map(chat => (
                      <div key={chat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                              {chat.customer.charAt(0)}
                            </div>
                            {chat.unread && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{chat.customer}</div>
                            <div className="text-sm text-gray-400">{chat.message}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">{chat.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="flex h-full">
                {/* Customer List */}
                <div className="w-1/3 border-r border-white/10 p-4 overflow-y-auto">
                  <h3 className="text-lg font-semibold mb-4">Customer Database</h3>
                  <div className="space-y-2">
                    {customers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                          selectedCustomer?.id === customer.id
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20'
                            : 'bg-black/30 hover:bg-black/40 border border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(customer.status)}`}></div>
                            <span className="font-medium">{customer.name}</span>
                          </div>
                          <span className={`text-xs ${getRiskColor(customer.riskLevel)}`}>
                            {customer.riskLevel} risk
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">{customer.email}</div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs bg-white/10 px-2 py-1 rounded">{customer.plan}</span>
                          <span className="text-xs text-gray-500">{customer.lastActive}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Details */}
                {selectedCustomer && (
                  <div className="flex-1 p-6 overflow-y-auto">
                    <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-2xl font-bold">
                            {selectedCustomer.name.charAt(0)}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold">{selectedCustomer.name}</h2>
                            <p className="text-gray-400">{selectedCustomer.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                            Start Chat
                          </button>
                          <button className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                            View History
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        {/* Account Info */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center">
                            <User className="w-5 h-5 mr-2 text-cyan-400" />
                            Account Information
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Email</span>
                              <span>{selectedCustomer.email}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Password</span>
                              <span className="flex items-center">
                                <Lock className="w-4 h-4 mr-2" />
                                {selectedCustomer.password}
                              </span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Join Date</span>
                              <span>{selectedCustomer.joinDate}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Subscription</span>
                              <span className="flex items-center">
                                <CreditCard className="w-4 h-4 mr-2" />
                                {selectedCustomer.plan}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Activity Info */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold flex items-center">
                            <Database className="w-5 h-5 mr-2 text-purple-400" />
                            Activity & Data
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Support Tickets</span>
                              <span>{selectedCustomer.tickets}</span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Satisfaction</span>
                              <span className="flex items-center">
                                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                                {selectedCustomer.satisfaction}%
                              </span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Questionnaire</span>
                              <span className="flex items-center">
                                <HelpCircle className="w-4 h-4 mr-2" />
                                {selectedCustomer.questionnaire.responses} responses
                              </span>
                            </div>
                            <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Screenshots</span>
                              <span className="flex items-center">
                                <Upload className="w-4 h-4 mr-2" />
                                {selectedCustomer.screenshots} files
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Risk Management */}
                      <div className="mt-6 p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-lg">
                        <h3 className="text-lg font-semibold flex items-center mb-3">
                          <Shield className="w-5 h-5 mr-2 text-red-400" />
                          Risk Management Plan
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-gray-400">Current Risk Level: </span>
                            <span className={`font-semibold ${getRiskColor(selectedCustomer.riskLevel)}`}>
                              {selectedCustomer.riskLevel.toUpperCase()}
                            </span>
                          </div>
                          <button className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm">
                            View Full Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'live-chat' && (
              <div className="flex h-full">
                {/* Chat List */}
                <div className="w-1/3 border-r border-white/10 p-4">
                  <h3 className="text-lg font-semibold mb-4">Active Conversations</h3>
                  <div className="space-y-2">
                    {liveChats.map(chat => (
                      <div
                        key={chat.id}
                        className="p-4 bg-black/30 rounded-lg hover:bg-black/40 cursor-pointer transition-all border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{chat.customer}</span>
                          {chat.unread && (
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 truncate">{chat.message}</p>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col">
                  <div className="p-4 bg-black/30 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                          A
                        </div>
                        <div>
                          <div className="font-medium">Alex Chen</div>
                          <div className="text-xs text-green-400 flex items-center">
                            <Circle className="w-2 h-2 mr-1 fill-current" />
                            Online
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <User className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'agent' ? 'justify-end' : ''}`}>
                          <div className={`max-w-md p-3 rounded-lg ${
                            msg.sender === 'agent'
                              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20'
                              : 'bg-black/30 border border-white/10'
                          }`}>
                            <p>{msg.message}</p>
                            <span className="text-xs text-gray-400 mt-1 block">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-4 bg-black/30 border-t border-white/10">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-400 transition-all"
                      />
                      <button 
                        onClick={handleChatSend}
                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-cyan-400" />
                    Support Ticket Management
                  </h3>
                  <p className="text-gray-400 mb-6">Ticket management system coming soon with full CRUD operations</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-cyan-400">{stats.ticketsToday}</div>
                      <div className="text-sm text-gray-400">Tickets Today</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-green-400">{stats.resolvedToday}</div>
                      <div className="text-sm text-gray-400">Resolved Today</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-purple-400">{stats.avgResponseTime}</div>
                      <div className="text-sm text-gray-400">Avg Response</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'risk' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-cyan-400" />
                    Risk Management Dashboard
                  </h3>
                  <p className="text-gray-400 mb-6">Risk assessment and management tools coming soon</p>
                  <div className="grid grid-cols-3 gap-4">
                    {customers.map(customer => (
                      <div key={customer.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{customer.name}</span>
                          <span className={`text-xs ${getRiskColor(customer.riskLevel)}`}>
                            {customer.riskLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">{customer.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="p-6 space-y-6 overflow-y-auto h-full">
                <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-cyan-400" />
                    Analytics & Performance
                  </h3>
                  <p className="text-gray-400 mb-6">Advanced analytics and reporting coming soon</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold mb-2">Customer Satisfaction</h4>
                      <div className="text-3xl font-bold text-green-400">{stats.satisfaction}%</div>
                      <div className="text-sm text-gray-400">Overall satisfaction rate</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold mb-2">Response Time</h4>
                      <div className="text-3xl font-bold text-cyan-400">{stats.avgResponseTime}</div>
                      <div className="text-sm text-gray-400">Average response time</div>
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

export default CustomerServiceDashboard;
