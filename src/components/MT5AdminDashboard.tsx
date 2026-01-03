import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Send,
  Eye,
  Download,
  Trash2,
  Filter,
  Search,
  Bell,
  Settings,
  LogOut,
  User,
  FileText,
  BarChart3,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  RefreshCw,
  Archive,
  Flag,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

const MT5AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('requirements');
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [requirements, setRequirements] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    // Load requirements from admin localStorage
    const savedRequirements = JSON.parse(localStorage.getItem('adminRequirements') || '[]');
    setRequirements(savedRequirements);

    // Load support tickets from admin localStorage
    const savedTickets = JSON.parse(localStorage.getItem('adminSupportTickets') || '[]');
    setSupportTickets(savedTickets);
  };

  // Real-time updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAdminData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleViewRequirement = (requirement: any) => {
    setSelectedRequirement(requirement);
    setShowChatModal(true);
    
    // Load chat messages for this requirement
    const savedMessages = JSON.parse(localStorage.getItem(`mt5Chat_${requirement.id}`) || '[]');
    setChatMessages(savedMessages);
  };

  const sendMessage = (message: string, sender: 'admin' | 'user' = 'admin') => {
    if (!message.trim() || !selectedRequirement) return;

    const newMsg = {
      id: Date.now(),
      sender,
      content: message,
      timestamp: new Date().toISOString(),
      requirementId: selectedRequirement.id
    };

    const updatedMessages = [...chatMessages, newMsg];
    setChatMessages(updatedMessages);
    setNewMessage('');

    // Save to localStorage
    localStorage.setItem(`mt5Chat_${selectedRequirement.id}`, JSON.stringify(updatedMessages));

    // Update requirement status
    const updatedRequirements = requirements.map(req => 
      req.id === selectedRequirement.id 
        ? { ...req, lastMessage: new Date().toISOString(), status: 'in-progress' }
        : req
    );
    setRequirements(updatedRequirements);
    localStorage.setItem('mt5Requirements', JSON.stringify(updatedRequirements));
  };

  const handleCloseRequirement = (requirementId: string) => {
    const updatedRequirements = requirements.map(req => 
      req.id === requirementId 
        ? { ...req, adminStatus: 'closed', lastUpdated: new Date().toISOString() }
        : req
    );
    setRequirements(updatedRequirements);
    localStorage.setItem('adminRequirements', JSON.stringify(updatedRequirements));
    setShowChatModal(false);
    setSelectedRequirement(null);
  };

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowChatModal(true);
  };

  const handleResolveTicket = (ticketId: string) => {
    const updatedTickets = supportTickets.map(ticket => 
      ticket.id === ticketId 
        ? { ...ticket, status: 'resolved', lastMessage: new Date().toISOString() }
        : ticket
    );
    setSupportTickets(updatedTickets);
    localStorage.setItem('adminSupportTickets', JSON.stringify(updatedTickets));
  };

  const handleApproveRequirement = (requirementId: string) => {
    const updatedRequirements = requirements.map(req => 
      req.id === requirementId 
        ? { ...req, adminStatus: 'approved', lastUpdated: new Date().toISOString() }
        : req
    );
    setRequirements(updatedRequirements);
    localStorage.setItem('adminRequirements', JSON.stringify(updatedRequirements));
  };

  const filteredRequirements = requirements.filter(req => {
    const matchesSearch = req.botName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || (req.adminStatus || req.status) === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const renderRequirementsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Requirements Management</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6">
        {filteredRequirements.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Requirements Found</h3>
            <p className="text-gray-400">No requirements match your current filters.</p>
          </div>
        ) : (
          filteredRequirements.map((requirement) => (
            <div key={requirement.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{requirement.botName}</h3>
                  <p className="text-gray-400">by {requirement.userName} ({requirement.userEmail})</p>
                  <p className="text-sm text-gray-500">Plan: {requirement.planType} - ${requirement.amount}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    requirement.adminStatus === 'completed' ? 'bg-green-900 text-green-300' :
                    requirement.adminStatus === 'in-progress' ? 'bg-yellow-900 text-yellow-300' :
                    requirement.adminStatus === 'approved' ? 'bg-blue-900 text-blue-300' :
                    requirement.adminStatus === 'new' ? 'bg-purple-900 text-purple-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {requirement.adminStatus || requirement.status}
                  </span>
                  <span className="text-sm text-gray-400">
                    {requirement.revisions || 0} revisions
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <span className="text-gray-400 text-sm">Created:</span>
                  <p className="text-white font-medium">{new Date(requirement.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Last Updated:</span>
                  <p className="text-white font-medium">
                    {requirement.lastUpdated ? new Date(requirement.lastUpdated).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Priority:</span>
                  <p className="text-white font-medium capitalize">{requirement.priority || 'Normal'}</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewRequirement(requirement)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open Chat</span>
                </button>
                <button
                  onClick={() => handleApproveRequirement(requirement.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleCloseRequirement(requirement.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSupportTicketsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Support Tickets</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {supportTickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-gray-400">No support tickets have been submitted yet.</p>
          </div>
        ) : (
          supportTickets.map((ticket) => (
            <div key={ticket.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{ticket.subject}</h3>
                  <p className="text-gray-400">from {ticket.userName} ({ticket.userEmail})</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ticket.status === 'resolved' ? 'bg-green-900 text-green-300' :
                    ticket.status === 'in-progress' ? 'bg-yellow-900 text-yellow-300' :
                    ticket.status === 'open' ? 'bg-blue-900 text-blue-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {ticket.status}
                  </span>
                  <span className="text-sm text-gray-400">
                    {ticket.messages?.length || 0} messages
                  </span>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4">{ticket.message}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-gray-400 text-sm">Created:</span>
                  <p className="text-white font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Last Message:</span>
                  <p className="text-white font-medium">
                    {ticket.lastMessage ? new Date(ticket.lastMessage).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleViewTicket(ticket)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>View Chat</span>
                </button>
                <button 
                  onClick={() => handleResolveTicket(ticket.id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Resolve</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Dashboard Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Requirements</p>
              <p className="text-3xl font-bold">{requirements.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Completed</p>
              <p className="text-3xl font-bold">{requirements.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">In Progress</p>
              <p className="text-3xl font-bold">{requirements.filter(r => r.status === 'in-progress').length}</p>
            </div>
            <Activity className="w-8 h-8 text-orange-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Support Tickets</p>
              <p className="text-3xl font-bold">{supportTickets.length}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">MT5 Admin Dashboard</h1>
            <p className="text-gray-400">Manage requirements and support tickets</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-8">
          {[
            { id: 'requirements', label: 'Requirements', icon: FileText },
            { id: 'support', label: 'Support Tickets', icon: MessageCircle },
            { id: 'stats', label: 'Statistics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                currentTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="p-6">
        {currentTab === 'requirements' && renderRequirementsTab()}
        {currentTab === 'support' && renderSupportTicketsTab()}
        {currentTab === 'stats' && renderStatsTab()}
      </main>

      {/* Chat Modal */}
      {showChatModal && selectedRequirement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl w-full max-w-4xl h-[80vh] mx-4 border border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedRequirement.botName}</h3>
                  <p className="text-gray-400">by {selectedRequirement.userName}</p>
                </div>
                <button
                  onClick={() => setShowChatModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender === 'admin'
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
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(newMessage)}
                />
                <button
                  onClick={() => sendMessage(newMessage)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MT5AdminDashboard;
