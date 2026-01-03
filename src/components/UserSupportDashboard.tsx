import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketResponse } from '../types/support';
import { supportService } from '../services/supportService';
import { useUser } from '../contexts/UserContext';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Send,
  Paperclip,
  Filter,
  Search,
  Calendar,
  Tag,
  User,
  Eye,
  Edit
} from 'lucide-react';

const UserSupportDashboard: React.FC = () => {
  const { user } = useUser();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'all',
    category: 'all'
  });

  // Form state for creating new ticket
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general' as const,
    priority: 'medium' as const
  });

  useEffect(() => {
    if (user?.email) {
      loadUserTickets();
    }
  }, [user?.email]);

  const loadUserTickets = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      const userTickets = await supportService.getUserTickets(user.email);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !user?.name) return;

    try {
      await supportService.createTicket({
        userId: user.email,
        userEmail: user.email,
        userName: user.name,
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
        status: 'open'
      });

      setNewTicket({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium'
      });
      setShowCreateForm(false);
      loadUserTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user?.email || !user?.name) return;

    try {
      await supportService.addResponse(selectedTicket.id, {
        ticketId: selectedTicket.id,
        authorId: user.email,
        authorName: user.name,
        authorType: 'user',
        message: newMessage.trim()
      });

      setNewMessage('');
      loadUserTickets();
      // Refresh selected ticket
      const updatedTicket = await supportService.getTicket(selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter.status !== 'all' && ticket.status !== filter.status) return false;
    if (filter.category !== 'all' && ticket.category !== filter.category) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Support Center</h2>
          <p className="text-gray-400">Get help with your trading platform</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">Total Tickets</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">{tickets.length}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-400">Open</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {tickets.filter(t => t.status === 'open').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-400">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {tickets.filter(t => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-400">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-white mt-2">
            {tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filter.category}
          onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
        >
          <option value="all">All Categories</option>
          <option value="technical">Technical</option>
          <option value="billing">Billing</option>
          <option value="trading">Trading</option>
          <option value="account">Account</option>
          <option value="general">General</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">Your Tickets</h3>
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white truncate">{ticket.subject}</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(ticket.status)}
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">{ticket.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="text-xs text-gray-500">
                    {ticket.responses.length} responses
                  </span>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No tickets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTicket.subject}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(selectedTicket.status)}`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm border ${getPriorityColor(selectedTicket.priority)}`}>
                      {selectedTicket.priority}
                    </span>
                    <span className="text-sm text-gray-400">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Messages */}
              <div className="mb-6">
                <h4 className="font-semibold text-white mb-4">Conversation</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedTicket.responses.map((response) => (
                    <div
                      key={response.id}
                      className={`p-4 rounded-lg ${
                        response.authorType === 'user'
                          ? 'bg-blue-900/30 ml-8'
                          : 'bg-gray-700 mr-8'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-white">{response.authorName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' && (
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Ticket</h3>
              <p className="text-gray-400">Choose a ticket from the list to view details and responses</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Ticket</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value as any })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="trading">Trading</option>
                    <option value="account">Account</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={6}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                  placeholder="Please describe your issue in detail..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSupportDashboard;
