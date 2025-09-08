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
  CheckCircle,
  AlertCircle,
  Upload,
  Settings,
  Bell
} from 'lucide-react';

const MT5BotDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('orders');
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

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
    // Load orders
    const savedOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    setOrders(savedOrders);

    // Load payments
    const savedPayments = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
    setPayments(savedPayments);

    // Load chat messages
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
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, message]);
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
    // Handle requirements submission
    console.log('Requirements submitted');
  };

  const renderOrdersTab = () => (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
          <p className="text-gray-400 mb-6">You haven't placed any MT5 bot orders yet. Start by submitting your requirements.</p>
          <button
            onClick={() => switchTab('submit')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Submit Requirements
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{order.botName || 'MT5 Bot'}</h3>
                  <span className="text-sm text-gray-400">#{order.id}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  order.status === 'completed' ? 'bg-green-900 text-green-300' :
                  order.status === 'in-progress' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-gray-700 text-gray-300'
                }`}>
                  {order.status || 'Pending'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-gray-400 text-sm">Plan:</span>
                  <p className="text-white font-medium">{order.planType || 'Pro'} (${order.amount || 599})</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Ordered:</span>
                  <p className="text-white font-medium">{new Date(order.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Progress:</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${order.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-400">{order.progress || 0}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </button>
                {order.status === 'completed' && (
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSubmitTab = () => (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Submit Your Bot Requirements</h2>
          <p className="text-gray-400">Provide detailed information about your trading strategy and requirements.</p>
        </div>

        <form onSubmit={submitRequirements} className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Bot Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a name for your bot"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Plan Type</label>
                <select
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Plan</option>
                  <option value="starter">Starter - $299</option>
                  <option value="pro">Pro - $599</option>
                  <option value="elite">Elite - $1,299+</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Trading Strategy</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Strategy Description</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                placeholder="Describe your trading strategy in detail. Include entry/exit rules, indicators used, timeframes, etc."
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Risk Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stop Loss (pips)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Take Profit (pips)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Lot Size</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.1"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Additional Requirements</h3>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Special Instructions</label>
              <textarea
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
                placeholder="Any additional requirements, custom indicators, or special features you need."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Save Draft
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Submit Requirements
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$898</div>
            <div className="text-sm text-gray-400">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">2</div>
            <div className="text-sm text-gray-400">Orders Paid</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$0</div>
            <div className="text-sm text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No payment history available</p>
            </div>
          ) : (
            payments.map((payment, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-white">#{payment.id || `MT5-2024-00${index + 1}`}</div>
                  <div className="text-sm text-gray-400">{payment.date || new Date().toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">${payment.amount || '599.00'}</div>
                  <div className="text-sm text-green-400">Paid</div>
                </div>
              </div>
            ))
          )}
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
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
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
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
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
      {/* Sidebar */}
      <aside className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2">TraderEdgePro</h2>
          <span className="inline-block bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
            MT5 Bots
          </span>
        </div>
        
        <nav className="flex-1 p-6">
          <ul className="space-y-2">
            {[
              { id: 'orders', label: 'My Orders', icon: List },
              { id: 'submit', label: 'Submit Requirements', icon: Plus },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'support', label: 'Support', icon: Headphones },
              { id: 'downloads', label: 'Downloads', icon: Download },
              { id: 'profile', label: 'Profile', icon: User }
            ].map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => switchTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'support' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full ml-auto"></div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-medium">{user.name}</div>
              <div className="text-gray-400 text-sm">{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">
              {currentTab === 'orders' && 'My Orders'}
              {currentTab === 'submit' && 'Submit Requirements'}
              {currentTab === 'payments' && 'Payments'}
              {currentTab === 'support' && 'Support'}
              {currentTab === 'downloads' && 'Downloads'}
              {currentTab === 'profile' && 'Profile Settings'}
            </h1>
            {currentTab === 'orders' && (
              <button
                onClick={() => switchTab('submit')}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>New Order</span>
              </button>
            )}
          </div>
        </header>

        {/* Tab Content */}
        {currentTab === 'orders' && renderOrdersTab()}
        {currentTab === 'submit' && renderSubmitTab()}
        {currentTab === 'payments' && renderPaymentsTab()}
        {currentTab === 'support' && renderSupportTab()}
        {currentTab === 'downloads' && renderDownloadsTab()}
        {currentTab === 'profile' && renderProfileTab()}
      </main>
    </div>
  );
};

export default MT5BotDashboard;
