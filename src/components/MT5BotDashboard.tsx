import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  List, 
  Plus, 
  CreditCard, 
  Headphones, 
  Download, 
  User, 
  LogOut, 
  Eye, 
  MessageCircle, 
  FileText,
  Clock,
  Settings,
  Bell,
  TrendingUp,
  Target,
  Shield,
  Activity,
  X
} from 'lucide-react';

const MT5BotDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('orders');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Enhanced state variables
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Check if user is logged in and has completed payment
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const paymentRecord = JSON.parse(localStorage.getItem('paymentRecord') || 'null');
    
    if (!currentUser) {
      navigate('/mt5-bots');
      return;
    }
    
    if (!paymentRecord || paymentRecord.status !== 'completed') {
      navigate('/mt5-payment');
      return;
    }

    setUser(currentUser);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    // Load orders - start with empty array for dynamic data
    const savedOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    setOrders(savedOrders);

    // Load payments - start with empty array for dynamic data
    const savedPayments = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
    setPayments(savedPayments);

    // Load chat messages - start with empty array for dynamic data
    const savedMessages = JSON.parse(localStorage.getItem('chatMessages') || '[]');
    setChatMessages(savedMessages);
  };

  const switchTab = (tabName: string) => {
    setCurrentTab(tabName);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('selectedPlan');
      localStorage.removeItem('userOrders');
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('requirementsDraft');
      localStorage.removeItem('paymentRecord');
      
      navigate('/mt5-bots');
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || 'unknown@example.com'
    };

    setChatMessages(prev => [...prev, message]);
    
    // Save to admin support tickets
    const adminTickets = JSON.parse(localStorage.getItem('adminSupportTickets') || '[]');
    const ticketId = `TICKET-${Date.now()}`;
    const adminTicket = {
      id: ticketId,
      userId: user?.id || 'unknown',
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || 'unknown@example.com',
      subject: 'Support Chat Message',
      message: newMessage,
      status: 'open',
      priority: 'normal',
      createdAt: new Date().toISOString(),
      lastMessage: new Date().toISOString(),
      messages: [message]
    };
    
    // Check if there's an existing open ticket for this user
    const existingTicket = adminTickets.find((ticket: any) => 
      ticket.userEmail === user?.email && ticket.status === 'open'
    );
    
    if (existingTicket) {
      // Add message to existing ticket
      existingTicket.messages.push(message);
      existingTicket.lastMessage = new Date().toISOString();
    } else {
      // Create new ticket
      adminTickets.push(adminTicket);
    }
    
    localStorage.setItem('adminSupportTickets', JSON.stringify(adminTickets));
    setNewMessage('');

    // Simulate support response
    setTimeout(() => {
      const responses = [
        "Thank you for your message. Our team will review your request and get back to you shortly.",
        "I've forwarded your inquiry to our development team. You should receive an update within 24 hours.",
        "Thanks for reaching out! Let me check on the status of your order and provide you with an update.",
        "I understand your concern. Our team is working on your bot and will have an update for you soon."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const supportMessage = {
        id: Date.now() + 1,
        sender: 'support',
        content: randomResponse,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, supportMessage]);
    }, 1000 + Math.random() * 2000);
  };

  const submitRequirements = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const requirementData = {
      id: `MT5-${Date.now()}`,
      botName: formData.get('botName') as string || 'Custom Bot',
      planType: formData.get('planType') as string || 'Pro',
      amount: formData.get('planType') === 'starter' ? 299 : formData.get('planType') === 'pro' ? 599 : 1299,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      userName: user?.name || 'Unknown User',
      userEmail: user?.email || 'unknown@example.com',
      revisions: 0,
      strategies: 0,
      lastMessage: null,
      
      // Comprehensive bot creation data
      tradingStrategy: {
        description: formData.get('strategy') as string || '',
        timeframe: formData.get('timeframe') as string || 'H1',
        indicators: formData.get('indicators') as string || '',
        entryConditions: formData.get('entryConditions') as string || '',
        exitConditions: formData.get('exitConditions') as string || '',
        marketConditions: formData.get('marketConditions') as string || '',
        tradingPairs: formData.get('tradingPairs') as string || 'EURUSD,GBPUSD,USDJPY',
        session: formData.get('tradingSession') as string || 'All Sessions'
      },
      
      riskManagement: {
        stopLoss: parseInt(formData.get('stopLoss') as string) || 50,
        takeProfit: parseInt(formData.get('takeProfit') as string) || 100,
        lotSize: parseFloat(formData.get('lotSize') as string) || 0.1,
        maxDrawdown: parseInt(formData.get('maxDrawdown') as string) || 5,
        maxDailyLoss: parseInt(formData.get('maxDailyLoss') as string) || 2,
        riskPerTrade: parseFloat(formData.get('riskPerTrade') as string) || 1.0,
        maxOpenPositions: parseInt(formData.get('maxOpenPositions') as string) || 3,
        correlationLimit: parseInt(formData.get('correlationLimit') as string) || 2
      },
      
      technicalSpecifications: {
        platform: 'MT5',
        broker: formData.get('broker') as string || 'Any',
        accountType: formData.get('accountType') as string || 'Standard',
        leverage: formData.get('leverage') as string || '1:100',
        spread: formData.get('spread') as string || 'Variable',
        execution: formData.get('execution') as string || 'Market',
        slippage: parseInt(formData.get('slippage') as string) || 3
      },
      
      performanceTargets: {
        monthlyReturn: parseInt(formData.get('monthlyReturn') as string) || 10,
        maxDrawdown: parseInt(formData.get('maxDrawdown') as string) || 5,
        winRate: parseInt(formData.get('winRate') as string) || 60,
        profitFactor: parseFloat(formData.get('profitFactor') as string) || 1.5,
        sharpeRatio: parseFloat(formData.get('sharpeRatio') as string) || 1.0
      },
      
      additionalRequirements: {
        specialInstructions: formData.get('specialInstructions') as string || '',
        customIndicators: formData.get('customIndicators') as string || '',
        newsFilter: formData.get('newsFilter') as string || 'No',
        weekendTrading: formData.get('weekendTrading') as string || 'No',
        hedging: formData.get('hedging') as string || 'No',
        scalping: formData.get('scalping') as string || 'No',
        martingale: formData.get('martingale') as string || 'No',
        grid: formData.get('grid') as string || 'No'
      },
      
      // Claude Opus prompt generation
      claudePrompt: generateClaudePrompt(formData)
    };
    
    // Save to requirements storage for admin dashboard
    const existingRequirements = JSON.parse(localStorage.getItem('mt5Requirements') || '[]');
    existingRequirements.push(requirementData);
    localStorage.setItem('mt5Requirements', JSON.stringify(existingRequirements));
    
    // Also save to admin requirements with real-time timestamp
    const adminRequirements = JSON.parse(localStorage.getItem('adminRequirements') || '[]');
    const adminRequirement = {
      ...requirementData,
      adminId: `ADMIN-${Date.now()}`,
      status: 'pending',
      adminStatus: 'new',
      lastUpdated: new Date().toISOString(),
      assignedTo: null,
      priority: 'normal'
    };
    adminRequirements.push(adminRequirement);
    localStorage.setItem('adminRequirements', JSON.stringify(adminRequirements));
    
    // Create order for user dashboard
    const newOrder = {
      id: requirementData.id,
      botName: requirementData.botName,
      planType: requirementData.planType,
      amount: requirementData.amount,
      status: 'pending',
      progress: 0,
      createdAt: requirementData.createdAt
    };
    
    const updatedOrders = [...orders, newOrder];
    setOrders(updatedOrders);
    localStorage.setItem('userOrders', JSON.stringify(updatedOrders));
    
    // Add notification
    const notification = {
      id: Date.now(),
      title: 'New Order Created',
      message: `Your ${newOrder.botName} order has been submitted successfully. Our team will review your requirements and start development.`,
      time: 'Just now',
      unread: true
    };
    setNotifications(prev => [...prev, notification]);
    
    setCurrentTab('orders');
    alert('Requirements submitted successfully! Our development team will review your detailed specifications and begin bot creation.');
  };

  const generateClaudePrompt = (formData: FormData) => {
    return `Create a professional MT5 Expert Advisor (EA) with the following specifications:

**BOT OVERVIEW:**
- Name: ${formData.get('botName')}
- Plan: ${formData.get('planType')}
- Timeframe: ${formData.get('timeframe')}
- Trading Pairs: ${formData.get('tradingPairs')}
- Trading Session: ${formData.get('tradingSession')}

**TRADING STRATEGY:**
${formData.get('strategy')}

**TECHNICAL INDICATORS:**
${formData.get('indicators')}

**ENTRY CONDITIONS:**
${formData.get('entryConditions')}

**EXIT CONDITIONS:**
${formData.get('exitConditions')}

**MARKET CONDITIONS:**
${formData.get('marketConditions')}

**RISK MANAGEMENT:**
- Stop Loss: ${formData.get('stopLoss')} pips
- Take Profit: ${formData.get('takeProfit')} pips
- Lot Size: ${formData.get('lotSize')}
- Max Drawdown: ${formData.get('maxDrawdown')}%
- Max Daily Loss: ${formData.get('maxDailyLoss')}%
- Risk Per Trade: ${formData.get('riskPerTrade')}%
- Max Open Positions: ${formData.get('maxOpenPositions')}
- Correlation Limit: ${formData.get('correlationLimit')}

**TECHNICAL SPECIFICATIONS:**
- Platform: MT5
- Broker: ${formData.get('broker')}
- Account Type: ${formData.get('accountType')}
- Leverage: ${formData.get('leverage')}
- Spread: ${formData.get('spread')}
- Execution: ${formData.get('execution')}
- Slippage: ${formData.get('slippage')} pips

**PERFORMANCE TARGETS:**
- Monthly Return: ${formData.get('monthlyReturn')}%
- Max Drawdown: ${formData.get('maxDrawdown')}%
- Win Rate: ${formData.get('winRate')}%
- Profit Factor: ${formData.get('profitFactor')}
- Sharpe Ratio: ${formData.get('sharpeRatio')}

**ADDITIONAL REQUIREMENTS:**
- Special Instructions: ${formData.get('specialInstructions')}
- Custom Indicators: ${formData.get('customIndicators')}
- News Filter: ${formData.get('newsFilter')}
- Weekend Trading: ${formData.get('weekendTrading')}
- Hedging: ${formData.get('hedging')}
- Scalping: ${formData.get('scalping')}
- Martingale: ${formData.get('martingale')}
- Grid Trading: ${formData.get('grid')}

**REQUIREMENTS:**
1. Create a complete, production-ready MT5 Expert Advisor
2. Include proper error handling and logging
3. Implement all specified risk management rules
4. Add comprehensive input parameters for easy customization
5. Include backtesting capabilities
6. Ensure the EA is optimized for the specified timeframe and pairs
7. Add proper position sizing and money management
8. Include trade management features (trailing stop, breakeven, etc.)
9. Add performance monitoring and reporting
10. Ensure the EA follows MT5 best practices and coding standards

Please provide the complete MQL5 source code, along with:
- Detailed documentation
- Input parameter descriptions
- Usage instructions
- Backtesting recommendations
- Risk warnings and disclaimers

The EA should be ready for live trading after thorough testing.`;
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };


  const handleDownloadFile = (fileName: string) => {
    // Simulate file download
    const link = document.createElement('a');
    link.href = '#';
    link.download = fileName;
    link.click();
    alert(`Downloading ${fileName}...`);
  };

  const handleSaveDraft = () => {
    // Simulate saving draft
    localStorage.setItem('requirementsDraft', JSON.stringify({
      botName: (document.querySelector('input[name="botName"]') as HTMLInputElement)?.value || '',
      planType: (document.querySelector('select[name="planType"]') as HTMLSelectElement)?.value || '',
      strategy: (document.querySelector('textarea[name="strategy"]') as HTMLTextAreaElement)?.value || '',
      stopLoss: (document.querySelector('input[name="stopLoss"]') as HTMLInputElement)?.value || '',
      takeProfit: (document.querySelector('input[name="takeProfit"]') as HTMLInputElement)?.value || '',
      lotSize: (document.querySelector('input[name="lotSize"]') as HTMLInputElement)?.value || '',
      specialInstructions: (document.querySelector('textarea[name="specialInstructions"]') as HTMLTextAreaElement)?.value || ''
    }));
    alert('Draft saved successfully!');
  };


  const renderOrdersTab = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <List className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
                My Orders
              </h1>
              <p className="text-gray-400 text-xl">AI-Powered Trading Bot Development</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('submit')}
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 font-bold text-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative flex items-center space-x-3">
              <Plus className="w-6 h-6" />
              <span>Submit New Order</span>
            </div>
          </button>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-24">
            <div className="relative mb-12">
              <div className="w-48 h-48 mx-auto bg-gradient-to-r from-gray-800 to-gray-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-gray-600">
                <div className="w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-16 h-16 text-gray-400" />
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse delay-1000"></div>
            </div>
            <h2 className="text-4xl font-black text-white mb-6">No Orders Yet</h2>
            <p className="text-gray-400 mb-12 text-xl max-w-2xl mx-auto leading-relaxed">
              You haven't placed any MT5 bot orders yet. Start by submitting your detailed requirements for our AI-powered development.
            </p>
            <button
              onClick={() => setCurrentTab('submit')}
              className="group relative px-12 py-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 hover:from-cyan-400 hover:via-blue-400 hover:to-purple-500 text-white rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 font-bold text-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center space-x-4">
                <span className="text-2xl">🚀</span>
                <span>Submit Requirements</span>
              </div>
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {orders.map((order) => (
              <div key={order.id} className="group relative bg-gradient-to-r from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-600/30 hover:border-cyan-500/50 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-white mb-3">{order.botName || 'Custom Bot'}</h3>
                      <span className="text-gray-400 text-sm font-mono bg-gray-800/50 px-3 py-1 rounded-lg">#{order.id}</span>
                    </div>
                    <span className={`px-6 py-3 rounded-2xl text-sm font-bold ${
                      order.status === 'completed' ? 'bg-green-900/30 text-green-300 border border-green-500/30' :
                      order.status === 'in-progress' ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/30' :
                      'bg-gray-700/30 text-gray-300 border border-gray-500/30'
                    }`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30">
                      <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Plan</span>
                      <p className="text-white font-black text-2xl mt-2">{order.planType || 'Pro'} (${order.amount || 599})</p>
                    </div>
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30">
                      <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Ordered</span>
                      <p className="text-white font-black text-2xl mt-2">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30">
                      <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Progress</span>
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex-1 bg-gray-600/50 rounded-full h-4 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-4 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${order.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-300 font-bold">{order.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => handleViewOrderDetails(order)}
                      className="group/btn flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/30 hover:to-cyan-600/30 text-blue-300 rounded-2xl transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50 font-bold"
                    >
                      <Eye className="w-5 h-5" />
                      <span>View Details</span>
                    </button>
                    <button 
                      onClick={() => setCurrentTab('support')}
                      className="group/btn flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-300 rounded-2xl transition-all duration-300 border border-green-500/30 hover:border-green-400/50 font-bold"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat</span>
                    </button>
                    {order.status === 'completed' && (
                      <button 
                        onClick={() => handleDownloadFile(`${order.botName || 'Bot'}.ex5`)}
                        className="group/btn flex items-center space-x-3 px-6 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 text-purple-300 rounded-2xl transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 font-bold"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSubmitTab = () => (
    <div className="max-w-6xl mx-auto">
      <div className="bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">🤖 Advanced Bot Requirements</h2>
          <p className="text-gray-400 text-lg">Provide comprehensive details for professional MT5 bot development</p>
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-300 text-sm">
              💡 <strong>Pro Tip:</strong> The more detailed your requirements, the better our AI can create your perfect trading bot!
            </p>
          </div>
        </div>

        <form onSubmit={submitRequirements} className="space-y-10">
          {/* Basic Information */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-400" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bot Name *</label>
                <input
                  name="botName"
                  type="text"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ScalpingProBot, TrendMaster, GridTrader"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plan Type *</label>
                <select
                  name="planType"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Plan</option>
                  <option value="starter">Starter - $299 (Basic Strategy)</option>
                  <option value="pro">Pro - $599 (Advanced Strategy)</option>
                  <option value="elite">Elite - $1,299+ (Custom Strategy)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Trading Strategy */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Trading Strategy
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Description *</label>
                <textarea
                  name="strategy"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  placeholder="Describe your trading strategy in detail. Include: market analysis approach, entry/exit logic, trend following vs mean reversion, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe *</label>
                  <select
                    name="timeframe"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="M1">M1 (1 Minute)</option>
                    <option value="M5">M5 (5 Minutes)</option>
                    <option value="M15">M15 (15 Minutes)</option>
                    <option value="M30">M30 (30 Minutes)</option>
                    <option value="H1">H1 (1 Hour)</option>
                    <option value="H4">H4 (4 Hours)</option>
                    <option value="D1">D1 (Daily)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Trading Pairs *</label>
                  <input
                    name="tradingPairs"
                    type="text"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="EURUSD,GBPUSD,USDJPY,AUDUSD"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Technical Indicators</label>
                <textarea
                  name="indicators"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                  placeholder="List all indicators you want to use: RSI, MACD, Moving Averages, Bollinger Bands, etc."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Entry Conditions *</label>
                  <textarea
                    name="entryConditions"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    placeholder="Describe specific conditions for opening trades"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Exit Conditions *</label>
                  <textarea
                    name="exitConditions"
                    className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                    placeholder="Describe specific conditions for closing trades"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Market Conditions</label>
                <textarea
                  name="marketConditions"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                  placeholder="Describe market conditions when your strategy works best: trending, ranging, volatile, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Trading Session</label>
                <select
                  name="tradingSession"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All Sessions">All Sessions</option>
                  <option value="London Session">London Session (8:00-17:00 GMT)</option>
                  <option value="New York Session">New York Session (13:00-22:00 GMT)</option>
                  <option value="Asian Session">Asian Session (23:00-8:00 GMT)</option>
                  <option value="Overlap Sessions">Overlap Sessions Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-red-400" />
              Risk Management
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (pips) *</label>
                <input
                  name="stopLoss"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (pips) *</label>
                <input
                  name="takeProfit"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lot Size *</label>
                <input
                  name="lotSize"
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Drawdown (%) *</label>
                <input
                  name="maxDrawdown"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Daily Loss (%) *</label>
                <input
                  name="maxDailyLoss"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Risk Per Trade (%) *</label>
                <input
                  name="riskPerTrade"
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1.0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Open Positions *</label>
                <input
                  name="maxOpenPositions"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Correlation Limit *</label>
                <input
                  name="correlationLimit"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2"
                  required
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-400" />
              Technical Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Broker</label>
                <input
                  name="broker"
                  type="text"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any specific broker or 'Any'"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Account Type</label>
                <select
                  name="accountType"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Standard">Standard</option>
                  <option value="ECN">ECN</option>
                  <option value="STP">STP</option>
                  <option value="Micro">Micro</option>
                  <option value="Cent">Cent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Leverage</label>
                <select
                  name="leverage"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1:100">1:100</option>
                  <option value="1:200">1:200</option>
                  <option value="1:500">1:500</option>
                  <option value="1:1000">1:1000</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Spread Type</label>
                <select
                  name="spread"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Variable">Variable</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Raw">Raw</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Execution Type</label>
                <select
                  name="execution"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Market">Market</option>
                  <option value="Instant">Instant</option>
                  <option value="Request">Request</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Max Slippage (pips)</label>
                <input
                  name="slippage"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>
            </div>
          </div>

          {/* Performance Targets */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Target className="w-5 h-5 mr-2 text-yellow-400" />
              Performance Targets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Monthly Return Target (%)</label>
                <input
                  name="monthlyReturn"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Win Rate (%)</label>
                <input
                  name="winRate"
                  type="number"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Profit Factor Target</label>
                <input
                  name="profitFactor"
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sharpe Ratio Target</label>
                <input
                  name="sharpeRatio"
                  type="number"
                  step="0.1"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1.0"
                />
              </div>
            </div>
          </div>

          {/* Additional Requirements */}
          <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-400" />
              Additional Requirements
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Special Instructions</label>
                <textarea
                  name="specialInstructions"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  placeholder="Any special requirements, custom features, or specific behaviors you need in your bot..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Custom Indicators</label>
                <textarea
                  name="customIndicators"
                  className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                  placeholder="List any custom indicators you want to use (provide .mq5 files if available)..."
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="newsFilter" value="Yes" className="rounded" />
                  <label className="text-gray-300">News Filter</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="weekendTrading" value="Yes" className="rounded" />
                  <label className="text-gray-300">Weekend Trading</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="hedging" value="Yes" className="rounded" />
                  <label className="text-gray-300">Hedging</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="scalping" value="Yes" className="rounded" />
                  <label className="text-gray-300">Scalping</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="martingale" value="Yes" className="rounded" />
                  <label className="text-gray-300">Martingale</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" name="grid" value="Yes" className="rounded" />
                  <label className="text-gray-300">Grid Trading</label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-6">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-8 py-4 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition-colors font-medium"
            >
              💾 Save Draft
            </button>
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-colors font-medium shadow-lg"
            >
              🚀 Submit Requirements
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center space-x-6 mb-12">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
            <CreditCard className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
              Payments
            </h1>
            <p className="text-gray-400 text-xl">Transaction History & Billing</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-r from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-600/30 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Payment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30 text-center">
                <div className="text-4xl font-black text-green-400 mb-2">$0</div>
                <div className="text-gray-400 text-sm font-bold uppercase tracking-wider">Total Spent</div>
              </div>
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30 text-center">
                <div className="text-4xl font-black text-blue-400 mb-2">0</div>
                <div className="text-gray-400 text-sm font-bold uppercase tracking-wider">Orders Paid</div>
              </div>
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/30 text-center">
                <div className="text-4xl font-black text-purple-400 mb-2">$0</div>
                <div className="text-gray-400 text-sm font-bold uppercase tracking-wider">Pending</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-800/50 via-gray-700/30 to-gray-800/50 backdrop-blur-sm rounded-3xl p-8 border border-gray-600/30 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Payment History</h3>
            {payments.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mb-8">
                  <div className="w-32 h-32 mx-auto bg-gradient-to-r from-gray-800 to-gray-700 rounded-full flex items-center justify-center shadow-2xl border-4 border-gray-600">
                    <div className="w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                      <CreditCard className="w-10 h-10 text-gray-400" />
                    </div>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse delay-1000"></div>
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">No Payment History</h4>
                <p className="text-gray-400 text-lg">Your payment history will appear here once you complete your first order.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-6 bg-gradient-to-r from-gray-700/50 to-gray-600/50 rounded-2xl border border-gray-600/30">
                    <div>
                      <div className="font-bold text-white text-lg">#{payment.id || `MT5-2024-00${index + 1}`}</div>
                      <div className="text-sm text-gray-400">{payment.date || new Date().toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white text-xl">${payment.amount || '599.00'}</div>
                      <div className="text-sm text-green-400 font-bold">Paid</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Support Chat</h3>
            <div className="flex items-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm">Support Online</span>
            </div>
          </div>
        </div>
        
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8">
              <Headphones className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Start a conversation with our support team</p>
            </div>
          ) : (
            chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-6 border-t border-gray-700">
          <div className="flex space-x-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDownloadsTab = () => (
    <div className="space-y-6">
      <div className="grid gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">TrendFollowingBot.ex5</h4>
                <p className="text-sm text-gray-400">Order #MT5-2024-002 • 2.3 MB</p>
              </div>
            </div>
            <button 
              onClick={() => handleDownloadFile('TrendFollowingBot.ex5')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">Backtest_Report.pdf</h4>
                <p className="text-sm text-gray-400">Order #MT5-2024-002 • 1.8 MB</p>
              </div>
            </div>
            <button 
              onClick={() => handleDownloadFile('Backtest_Report.pdf')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 opacity-50">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white">ScalpingBot.ex5</h4>
                <p className="text-sm text-gray-400">Order #MT5-2024-001 • In Progress</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg cursor-not-allowed" disabled>
              <Clock className="w-4 h-4 inline mr-2" />
              Pending
            </button>
          </div>
        </div>
      </div>
    </div>
  );



  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Notifications</h3>
        <button 
          onClick={() => setNotifications([])}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Mark All as Read
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Notifications</h3>
            <p className="text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:bg-gray-750 transition-colors">
              <div className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-white font-medium">{notification.title}</h4>
                    <span className="text-xs text-gray-400">{notification.time}</span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{notification.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">General Settings</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
            <select 
              value={timezone} 
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="EST">EST</option>
              <option value="PST">PST</option>
              <option value="GMT">GMT</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Auto Refresh</div>
              <div className="text-sm text-gray-400">Automatically refresh data every 30 seconds</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">Notification Settings</h3>
        <div className="space-y-4">
          {[
            { label: 'Email Notifications', description: 'Receive updates via email' },
            { label: 'SMS Notifications', description: 'Get SMS alerts for important events' },
            { label: 'Push Notifications', description: 'Browser push notifications' },
            { label: 'Trading Alerts', description: 'Real-time trading notifications' }
          ].map((setting, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{setting.label}</div>
                <div className="text-sm text-gray-400">{setting.description}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">Account Information</h3>
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input
                type="text"
                defaultValue={user?.name || ''}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                defaultValue={user?.email || ''}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Update Profile
          </button>
        </form>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">Account Settings</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-white">Email Notifications</div>
              <div className="text-sm text-gray-400">Receive updates about your orders</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-medium text-white">SMS Notifications</div>
              <div className="text-sm text-gray-400">Get SMS updates for important events</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Dashboard...</h2>
          <p className="text-gray-300">Please wait while we prepare your MT5 bot dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Futuristic Sidebar */}
      <aside className="w-96 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-cyan-500/20 flex flex-col relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-500/5 to-purple-500/5"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"></div>
        
        {/* Header */}
        <div className="relative p-8 border-b border-cyan-500/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse delay-1000"></div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                TraderEdgePro
              </h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm px-4 py-2 rounded-full font-bold shadow-lg">
                  BETA
                </span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-bold">LIVE</span>
                </div>
              </div>
            </div>
          </div>
          <button className="group relative w-full bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 hover:from-cyan-500 hover:via-blue-500 hover:to-purple-500 text-white px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 font-bold text-sm uppercase tracking-wider overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center space-x-3">
              <span>MT5 BOTS</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="relative flex-1 p-6">
          <ul className="space-y-4">
            {[
              { id: 'orders', label: 'My Orders', icon: List, badge: orders.length, color: 'from-cyan-500 to-blue-500', desc: 'View & manage orders' },
              { id: 'submit', label: 'Submit Requirements', icon: Plus, color: 'from-green-500 to-emerald-500', desc: 'Create new bot requests' },
              { id: 'payments', label: 'Payments', icon: CreditCard, color: 'from-purple-500 to-pink-500', desc: 'Transaction history' },
              { id: 'notifications', label: 'Notifications', icon: Bell, badge: notifications.length, color: 'from-orange-500 to-red-500', desc: 'Alerts & updates' },
              { id: 'support', label: 'Support', icon: Headphones, color: 'from-blue-500 to-cyan-500', status: 'online', desc: '24/7 assistance' },
              { id: 'downloads', label: 'Downloads', icon: Download, color: 'from-indigo-500 to-purple-500', desc: 'Files & resources' },
              { id: 'settings', label: 'Settings', icon: Settings, color: 'from-gray-500 to-gray-600', desc: 'Preferences' },
              { id: 'profile', label: 'Profile', icon: User, color: 'from-pink-500 to-rose-500', desc: 'Account settings' }
            ].filter((tab, index) => {
              // Hide tabs with specific values (-1, 2, 3, 4)
              const hiddenTabValues = [-1, 2, 3, 4];
              return !hiddenTabValues.includes(index) && !hiddenTabValues.includes(parseInt(tab.id)) && !hiddenTabValues.includes(tab.id);
            }).map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => switchTab(tab.id)}
                  className={`group relative w-full flex items-center space-x-4 px-6 py-5 rounded-2xl transition-all duration-300 ${
                    currentTab === tab.id
                      ? 'bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 text-white shadow-2xl shadow-cyan-500/25 border border-cyan-500/30 transform scale-105'
                      : 'text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-gray-700/50 hover:to-gray-600/50 hover:shadow-xl hover:transform hover:scale-105'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    currentTab === tab.id 
                      ? `bg-gradient-to-r ${tab.color} shadow-lg` 
                      : 'bg-gray-700/50 group-hover:bg-gradient-to-r group-hover:' + tab.color
                  }`}>
                    <tab.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-lg">{tab.label}</span>
                      {tab.status === 'online' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-400 font-bold">ONLINE</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-medium">{tab.desc}</p>
                  </div>
                  {tab.badge && tab.badge > 0 && (
                    <div className="relative">
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold rounded-full px-3 py-1 min-w-[28px] text-center shadow-lg">
                        {tab.badge}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-full animate-ping opacity-30"></div>
                    </div>
                  )}
                  {currentTab === tab.id && (
                    <div className="absolute right-3 w-3 h-3 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User Profile */}
        <div className="relative p-6 border-t border-cyan-500/20">
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-white font-bold text-xl">{user.name}</div>
              <div className="text-gray-400 text-sm font-medium">{user.email}</div>
              <div className="flex items-center space-x-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-bold">ACTIVE USER</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group relative w-full flex items-center space-x-4 px-6 py-4 text-gray-300 hover:text-white bg-gradient-to-r from-gray-700/50 to-gray-600/50 hover:from-red-600/20 hover:to-red-500/20 rounded-2xl transition-all duration-300 hover:shadow-xl hover:transform hover:scale-105 font-bold"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-500 group-hover:from-red-500 group-hover:to-red-400 rounded-2xl flex items-center justify-center transition-all duration-300">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-lg">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">

        {/* Tab Content */}
        {currentTab === 'orders' && renderOrdersTab()}
        {currentTab === 'submit' && renderSubmitTab()}
        {currentTab === 'payments' && renderPaymentsTab()}
        {currentTab === 'notifications' && renderNotificationsTab()}
        {currentTab === 'support' && renderSupportTab()}
        {currentTab === 'downloads' && renderDownloadsTab()}
        {currentTab === 'settings' && renderSettingsTab()}
        {currentTab === 'profile' && renderProfileTab()}
      </main>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-white">Order Details</h3>
              <button 
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Order ID</label>
                  <p className="text-white font-medium">{selectedOrder.id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <p className="text-white font-medium">{selectedOrder.status}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Bot Name</label>
                  <p className="text-white font-medium">{selectedOrder.botName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Plan Type</label>
                  <p className="text-white font-medium">{selectedOrder.planType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Amount</label>
                  <p className="text-white font-medium">${selectedOrder.amount}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Created</label>
                  <p className="text-white font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-700">
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setCurrentTab('support')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Contact Support
                  </button>
                  <button 
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MT5BotDashboard;
