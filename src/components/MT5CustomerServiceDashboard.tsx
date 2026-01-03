import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, MessageCircle, User, FileText, Shield, TrendingUp, 
  Bell, Settings, ChevronRight, Circle, AlertCircle, Clock, 
  Star, Upload, Database, Activity, Zap, Globe, Lock, 
  CreditCard, HelpCircle, Plus, Filter, Download, RefreshCw,
  Eye, Edit, Trash, Phone, Mail, MapPin, Calendar, Key,
  Bot, Code, Download as DownloadIcon, CheckCircle, XCircle
} from 'lucide-react';

interface MT5Customer {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  selectedPlan: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'ACTIVE';
  createdAt: string;
  updatedAt: string;
  isMT5Customer: boolean;
  agreeToMarketing: boolean;
  orders?: MT5Order[];
  payments?: MT5Payment[];
  supportTickets?: MT5SupportTicket[];
}

interface MT5Order {
  id: string;
  customerId: string;
  botName: string;
  planType: string;
  strategy: string;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  specialInstructions: string;
  files: any[];
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  progress: number;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
}

interface MT5Payment {
  id: string;
  customerId: string;
  orderId: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId: string;
  createdAt: string;
}

interface MT5SupportTicket {
  id: string;
  customerId: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
}

const MT5CustomerServiceDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<MT5Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<MT5Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<MT5Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTab, setCurrentTab] = useState('customers');
  const [isLoading, setIsLoading] = useState(true);

  // Load MT5 customers from localStorage
  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers based on search and status
  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.company.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, statusFilter]);

  const loadCustomers = () => {
    try {
      const savedCustomers = JSON.parse(localStorage.getItem('mt5Customers') || '[]');
      setCustomers(savedCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomerStatus = (customerId: string, newStatus: string) => {
    const updatedCustomers = customers.map(customer =>
      customer.id === customerId
        ? { ...customer, status: newStatus as any, updatedAt: new Date().toISOString() }
        : customer
    );
    setCustomers(updatedCustomers);
    localStorage.setItem('mt5Customers', JSON.stringify(updatedCustomers));
    
    if (selectedCustomer?.id === customerId) {
      setSelectedCustomer({ ...selectedCustomer, status: newStatus as any, updatedAt: new Date().toISOString() });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-800';
      case 'PENDING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-purple-100 text-purple-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'PROCESSING': return <Clock className="w-4 h-4" />;
      case 'PENDING': return <AlertCircle className="w-4 h-4" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'REJECTED': return <XCircle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const renderCustomersTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <button
            onClick={loadCustomers}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.fullName}</div>
                        <div className="text-sm text-gray-500">{customer.company || 'No company'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{customer.email}</div>
                    <div className="text-sm text-gray-500">{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{customer.selectedPlan?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">${customer.selectedPlan?.price || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {getStatusIcon(customer.status)}
                      <span className="ml-1">{customer.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {/* Edit customer */}}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {/* Delete customer */}}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No MT5 customers found</h3>
          <p className="text-gray-500">No customers match your current search criteria.</p>
        </div>
      )}
    </div>
  );

  const renderCustomerDetail = () => {
    if (!selectedCustomer) return null;

    return (
      <div className="space-y-6">
        {/* Customer Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer.fullName}</h2>
                <p className="text-gray-600">{selectedCustomer.email}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedCustomer.status)}`}>
                {getStatusIcon(selectedCustomer.status)}
                <span className="ml-2">{selectedCustomer.status}</span>
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Member since {new Date(selectedCustomer.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{selectedCustomer.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{selectedCustomer.phone}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Building className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{selectedCustomer.company || 'No company'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{selectedCustomer.country}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium text-gray-900">{selectedCustomer.selectedPlan?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-gray-900">${selectedCustomer.selectedPlan?.price || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Period:</span>
                <span className="font-medium text-gray-900">{selectedCustomer.selectedPlan?.period || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marketing:</span>
                <span className="font-medium text-gray-900">
                  {selectedCustomer.agreeToMarketing ? 'Opted in' : 'Opted out'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
          <div className="flex flex-wrap gap-2">
            {['PENDING', 'PROCESSING', 'ACTIVE', 'COMPLETED', 'REJECTED'].map((status) => (
              <button
                key={status}
                onClick={() => updateCustomerStatus(selectedCustomer.id, status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCustomer.status === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-start">
          <button
            onClick={() => setSelectedCustomer(null)}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  };

  const renderOrdersTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">MT5 Bot Orders</h3>
        <p className="text-gray-600">Order management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Management</h3>
        <p className="text-gray-600">Payment tracking and management functionality will be implemented here.</p>
      </div>
    </div>
  );

  const renderSupportTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Support Tickets</h3>
        <p className="text-gray-600">Support ticket management functionality will be implemented here.</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading MT5 Customer Service Dashboard...</h2>
          <p className="text-gray-600">Please wait while we load customer data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MT5 Customer Service</h1>
                <p className="text-gray-600">Manage MT5 bot development customers</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-6 h-6" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'customers', label: 'Customers', icon: User },
              { id: 'orders', label: 'Orders', icon: FileText },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'support', label: 'Support', icon: MessageCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedCustomer ? (
          renderCustomerDetail()
        ) : (
          <>
            {currentTab === 'customers' && renderCustomersTab()}
            {currentTab === 'orders' && renderOrdersTab()}
            {currentTab === 'payments' && renderPaymentsTab()}
            {currentTab === 'support' && renderSupportTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default MT5CustomerServiceDashboard;
