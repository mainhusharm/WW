import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Bot, 
  User, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  BarChart3, 
  Filter, 
  Search, 
  RefreshCw, 
  Settings, 
  Eye, 
  MessageSquare, 
  Phone, 
  Mail, 
  Video,
  Star,
  ThumbsUp,
  ThumbsDown,
  Download,
  Archive,
  Flag,
  MoreVertical
} from 'lucide-react';

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPlan: string;
  status: 'active' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startTime: Date;
  lastMessage: Date;
  messageCount: number;
  aiConfidence: number;
  resolution: string;
  satisfaction: number;
  tags: string[];
  channel: 'chat' | 'email' | 'phone' | 'video';
}

interface Message {
  id: string;
  conversationId: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  aiConfidence?: number;
  resolution?: string;
}

interface AIStats {
  totalConversations: number;
  activeConversations: number;
  resolvedToday: number;
  avgResponseTime: number;
  satisfaction: number;
  autoResolutionRate: number;
  uptime: number;
  totalMessages: number;
  aiConfidence: number;
}

const AIAssistantDashboard: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stats, setStats] = useState<AIStats>({
    totalConversations: 0,
    activeConversations: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    satisfaction: 0,
    autoResolutionRate: 0,
    uptime: 0,
    totalMessages: 0,
    aiConfidence: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isLive, setIsLive] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'conversations' | 'analytics' | 'settings'>('overview');
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate sample data
  const generateSampleConversations = (): Conversation[] => {
    const users = [
      { name: 'John Smith', email: 'john@example.com', plan: 'Professional' },
      { name: 'Sarah Johnson', email: 'sarah@example.com', plan: 'Elite' },
      { name: 'Mike Chen', email: 'mike@example.com', plan: 'Basic' },
      { name: 'Emily Davis', email: 'emily@example.com', plan: 'Professional' },
      { name: 'David Wilson', email: 'david@example.com', plan: 'Elite' },
      { name: 'Lisa Brown', email: 'lisa@example.com', plan: 'Basic' },
      { name: 'Alex Garcia', email: 'alex@example.com', plan: 'Professional' },
      { name: 'Maria Rodriguez', email: 'maria@example.com', plan: 'Elite' }
    ];

    const statuses: Array<Conversation['status']> = ['active', 'resolved', 'escalated', 'closed'];
    const priorities: Array<Conversation['priority']> = ['low', 'medium', 'high', 'urgent'];
    const channels: Array<Conversation['channel']> = ['chat', 'email', 'phone', 'video'];

    return Array.from({ length: 20 }, (_, i) => {
      const user = users[Math.floor(Math.random() * users.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      
      return {
        id: `conv_${i + 1}`,
        userId: `user_${i + 1}`,
        userName: user.name,
        userEmail: user.email,
        userPlan: user.plan,
        status,
        priority,
        startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        lastMessage: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        messageCount: Math.floor(Math.random() * 20) + 1,
        aiConfidence: Math.floor(Math.random() * 20) + 80,
        resolution: status === 'resolved' ? 'Issue resolved automatically by AI' : '',
        satisfaction: Math.floor(Math.random() * 20) + 80,
        tags: ['account', 'technical', 'billing', 'upgrade'].slice(0, Math.floor(Math.random() * 3) + 1),
        channel
      };
    });
  };

  // Generate sample messages for a conversation
  const generateSampleMessages = (conversationId: string): Message[] => {
    const messageCount = Math.floor(Math.random() * 10) + 5;
    const messages: Message[] = [];
    
    for (let i = 0; i < messageCount; i++) {
      const isUser = Math.random() > 0.4;
      const timestamp = new Date(Date.now() - (messageCount - i) * 60 * 1000);
      
      messages.push({
        id: `msg_${conversationId}_${i}`,
        conversationId,
        type: isUser ? 'user' : 'ai',
        content: isUser 
          ? `User message ${i + 1}: I need help with my account`
          : `AI Response ${i + 1}: I understand your concern. Let me help you with that.`,
        timestamp,
        status: 'delivered',
        aiConfidence: isUser ? undefined : Math.floor(Math.random() * 20) + 80,
        resolution: isUser ? undefined : 'Issue resolved automatically'
      });
    }
    
    return messages;
  };

  // Update stats
  const updateStats = () => {
    const totalConversations = conversations.length;
    const activeConversations = conversations.filter(c => c.status === 'active').length;
    const resolvedToday = conversations.filter(c => 
      c.status === 'resolved' && 
      c.lastMessage.toDateString() === new Date().toDateString()
    ).length;
    const avgResponseTime = Math.random() * 3 + 1;
    const satisfaction = conversations.reduce((acc, c) => acc + c.satisfaction, 0) / conversations.length || 0;
    const autoResolutionRate = Math.random() * 20 + 80;
    const uptime = Math.random() * 2 + 98;
    const totalMessages = conversations.reduce((acc, c) => acc + c.messageCount, 0);
    const aiConfidence = conversations.reduce((acc, c) => acc + c.aiConfidence, 0) / conversations.length || 0;

    setStats({
      totalConversations,
      activeConversations,
      resolvedToday,
      avgResponseTime,
      satisfaction,
      autoResolutionRate,
      uptime,
      totalMessages,
      aiConfidence
    });
  };

  // Initialize data
  useEffect(() => {
    const sampleConversations = generateSampleConversations();
    setConversations(sampleConversations);
    updateStats();
  }, []);

  // Start live updates
  useEffect(() => {
    if (isLive) {
      intervalRef.current = setInterval(() => {
        // Simulate new conversations
        if (Math.random() > 0.8) {
          const newConversation = generateSampleConversations()[0];
          setConversations(prev => [newConversation, ...prev]);
        }
        
        // Update existing conversations
        setConversations(prev => prev.map(conv => {
          if (conv.status === 'active' && Math.random() > 0.9) {
            return {
              ...conv,
              lastMessage: new Date(),
              messageCount: conv.messageCount + 1
            };
          }
          return conv;
        }));
        
        updateStats();
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const sampleMessages = generateSampleMessages(selectedConversation.id);
      setMessages(sampleMessages);
    }
  }, [selectedConversation]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || conv.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || conv.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/20';
      case 'resolved': return 'text-blue-400 bg-blue-500/20';
      case 'escalated': return 'text-orange-400 bg-orange-500/20';
      case 'closed': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'chat': return MessageCircle;
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'video': return Video;
      default: return MessageCircle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bot className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AI Assistant Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-sm">{isLive ? 'Live Monitoring' : 'Paused'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                isLive 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              }`}
            >
              {isLive ? 'Pause' : 'Resume'}
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
              { id: 'overview', icon: BarChart3, label: 'Overview' },
              { id: 'conversations', icon: MessageCircle, label: 'Conversations', badge: stats.activeConversations },
              { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
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
                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full animate-pulse">
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
                  { label: 'Total Conversations', value: stats.totalConversations, icon: MessageCircle, color: 'cyan' },
                  { label: 'Active Now', value: stats.activeConversations, icon: Users, color: 'green' },
                  { label: 'Resolved Today', value: stats.resolvedToday, icon: CheckCircle, color: 'blue' },
                  { label: 'Avg Response Time', value: `${stats.avgResponseTime.toFixed(1)}s`, icon: Clock, color: 'purple' },
                  { label: 'Satisfaction', value: `${stats.satisfaction.toFixed(0)}%`, icon: Star, color: 'yellow' },
                  { label: 'Auto Resolution', value: `${stats.autoResolutionRate.toFixed(0)}%`, icon: Zap, color: 'green' },
                  { label: 'Uptime', value: `${stats.uptime.toFixed(1)}%`, icon: Shield, color: 'blue' },
                  { label: 'Total Messages', value: stats.totalMessages, icon: MessageSquare, color: 'purple' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
                      <span className="text-xs text-gray-400">Live</span>
                    </div>
                    <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Conversations */}
              <div className="bg-black/30 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-cyan-400" />
                  Recent Conversations
                </h3>
                <div className="space-y-3">
                  {conversations.slice(0, 5).map(conv => (
                    <div key={conv.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all cursor-pointer"
                         onClick={() => setSelectedConversation(conv)}>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                          {conv.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{conv.userName}</div>
                          <div className="text-sm text-gray-400">{conv.userEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(conv.status)}`}>
                          {conv.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(conv.priority)}`}>
                          {conv.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'conversations' && (
            <div className="flex h-full">
              {/* Conversation List */}
              <div className="w-1/3 border-r border-white/10 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Conversations</h3>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-400 transition-all w-48"
                      />
                    </div>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-400 transition-all"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="resolved">Resolved</option>
                      <option value="escalated">Escalated</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedConversation?.id === conv.id
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20'
                          : 'bg-black/30 hover:bg-black/40 border border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold">
                            {conv.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{conv.userName}</div>
                            <div className="text-xs text-gray-400">{conv.userPlan}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {React.createElement(getChannelIcon(conv.channel), { className: "w-4 h-4 text-gray-400" })}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(conv.status)}`}>
                          {conv.status}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(conv.priority)}`}>
                          {conv.priority}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {conv.messageCount} messages • {conv.lastMessage.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversation Details */}
              {selectedConversation && (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 bg-black/30 border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-lg font-bold">
                          {selectedConversation.userName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedConversation.userName}</h3>
                          <p className="text-sm text-gray-400">{selectedConversation.userEmail}</p>
                          <p className="text-xs text-gray-500">{selectedConversation.userPlan} Plan</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm rounded ${getStatusColor(selectedConversation.status)}`}>
                          {selectedConversation.status}
                        </span>
                        <span className={`px-3 py-1 text-sm rounded ${getPriorityColor(selectedConversation.priority)}`}>
                          {selectedConversation.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.map(message => (
                        <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md p-3 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/20'
                              : 'bg-black/30 border border-white/10'
                          }`}>
                            <div className="flex items-start space-x-2">
                              {message.type === 'ai' && <Bot className="w-4 h-4 mt-1 text-cyan-400" />}
                              {message.type === 'user' && <User className="w-4 h-4 mt-1 text-white" />}
                              <div className="flex-1">
                                <p className="text-sm">{message.content}</p>
                                {message.aiConfidence && (
                                  <div className="mt-2 text-xs text-gray-400">
                                    AI Confidence: {message.aiConfidence}%
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other tabs would be implemented here */}
        </main>
      </div>
    </div>
  );
};

export default AIAssistantDashboard;
