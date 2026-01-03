import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import CustomerDatabase from './CustomerDatabase';
import api from '../lib/api';

const EnhancedCustomerServiceDashboard = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [activePage, setActivePage] = useState('dashboard');
  const [tickets, setTickets] = useState([]);
  const [queries, setQueries] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [loading, setLoading] = useState(false);
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

          const customerServiceUrl = 'http://localhost:3005';
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
    console.log('Logging out...');
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{customerData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{tickets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Queries</p>
              <p className="text-2xl font-semibold text-gray-900">{queries.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>New customer registration - 2 minutes ago</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span>Support ticket resolved - 15 minutes ago</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-2" />
            <span>New query submitted - 1 hour ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Support Tickets</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket: any) => (
              <tr key={ticket.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                  <div className="text-sm text-gray-500">{ticket.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.customerName}</div>
                      <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                    ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.priority}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.createdAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQueries = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Customer Queries</h3>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Query
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {queries.map((query: any) => (
              <tr key={query.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{query.subject}</div>
                  <div className="text-sm text-gray-500">{query.message}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{query.customerName}</div>
                      <div className="text-sm text-gray-500">{query.customerEmail}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{query.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    query.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    query.status === 'answered' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {query.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{query.submittedAt}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Customer Service Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActivePage('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activePage === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActivePage('customer-database')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activePage === 'customer-database'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Customer Database
            </button>
          </nav>
        </div>

        {/* Content */}
        {activePage === 'dashboard' && (
          <div>
            {activeTab === 'tickets' ? renderTickets() : renderQueries()}
          </div>
        )}

        {activePage === 'customer-database' && (
          <CustomerDatabase />
        )}
      </div>
    </div>
  );
};

export default EnhancedCustomerServiceDashboard;
