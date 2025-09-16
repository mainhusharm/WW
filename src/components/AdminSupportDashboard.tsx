import React, { useState, useEffect } from 'react';
import { SupportTicket, TicketResponse, SupportStats, TicketFilter } from '../types/support';
import { supportService } from '../services/supportService';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Send,
  Filter,
  Search,
  Calendar,
  Tag,
  User,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  BarChart3,
  TrendingUp,
  Users,
  MessageCircle
} from 'lucide-react';

const AdminSupportDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketFilter>({});
  const [newMessage, setNewMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    loadTickets();
    loadStats();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const allTickets = await supportService.getAllTickets(filter);
      setTickets(allTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const supportStats = await supportService.getSupportStats();
      setStats(supportStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await supportService.updateTicketStatus(ticketId, status, adminNotes);
      setAdminNotes('');
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = await supportService.getTicket(ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      await supportService.assignTicket(ticketId, assignedTo);
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        const updatedTicket = await supportService.getTicket(ticketId);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    try {
      await supportService.addResponse(selectedTicket.id, {
        ticketId: selectedTicket.id,
        authorId: 'admin',
        authorName: 'Admin',
        authorType: 'admin',
        message: newMessage.trim()
      });

      setNewMessage('');
      loadTickets();
      // Refresh selected ticket
      const updatedTicket = await supportService.getTicket(selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await supportService.deleteTicket(ticketId);
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(null);
        }
      } catch (error) {
        console.error('Error deleting ticket:', error);
      }
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
          <h2 className="text-2xl font-bold text-white">Support Management</h2>
          <p className="text-gray-400">Manage customer support tickets</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistics</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">Total Tickets</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats.totalTickets}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-400">Open</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats.openTickets}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats.inProgressTickets}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats.resolvedTickets}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={filter.status || 'all'}
          onChange={(e) => setFilter({ ...filter, status: e.target.value === 'all' ? undefined : e.target.value })}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={filter.category || 'all'}
          onChange={(e) => setFilter({ ...filter, category: e.target.value === 'all' ? undefined : e.target.value })}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
        >
          <option value="all">All Categories</option>
          <option value="technical">Technical</option>
          <option value="billing">Billing</option>
          <option value="trading">Trading</option>
          <option value="account">Account</option>
          <option value="general">General</option>
        </select>
        <select
          value={filter.priority || 'all'}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value === 'all' ? undefined : e.target.value })}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={loadTickets}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Apply Filters
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tickets List */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-white mb-4">All Tickets ({tickets.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tickets.map((ticket) => (
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
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(ticket.status)}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{ticket.userName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {ticket.assignedTo && (
                  <div className="mt-2">
                    <span className="text-xs text-blue-400">Assigned to: {ticket.assignedTo}</span>
                  </div>
                )}
              </div>
            ))}
            {tickets.length === 0 && (
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
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">From: {selectedTicket.userName} ({selectedTicket.userEmail})</span>
                </div>
                <span className="text-sm text-gray-400">
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                </span>
                {selectedTicket.assignedTo && (
                  <div className="mt-1">
                    <span className="text-sm text-blue-400">Assigned to: {selectedTicket.assignedTo}</span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-white mb-2">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Admin Actions */}
              <div className="mb-6 p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Admin Actions</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Update Status</label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusUpdate(selectedTicket.id, e.target.value as any)}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assign To</label>
                    <input
                      type="text"
                      placeholder="Admin name"
                      value={selectedTicket.assignedTo || ''}
                      onChange={(e) => handleAssignTicket(selectedTicket.id, e.target.value)}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Admin Notes</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes (not visible to user)"
                    rows={3}
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg border border-gray-500"
                  />
                </div>
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
                        {response.authorType === 'admin' && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Admin</span>
                        )}
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{response.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Form */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your response..."
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
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Ticket</h3>
              <p className="text-gray-400">Choose a ticket from the list to view details and manage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSupportDashboard;
