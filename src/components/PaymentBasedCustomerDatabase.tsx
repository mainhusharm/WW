import React, { useState, useEffect } from 'react';
import { Users, Mail, Calendar, DollarSign, TrendingUp, RefreshCw, Search, Filter, CreditCard, CheckCircle } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  accountType: string;
  paymentStatus: string;
  status: string;
  subscriptionId: string;
  createdAt: string;
  lastPayment: string;
  paymentAmount: number;
  paymentMethod: string;
  questionnaire: {
    accountType: string;
    tradingRules: string[];
    responses: {
      experience: string;
      tradingGoals: string;
      riskTolerance: string;
    };
  };
}

const PaymentBasedCustomerDatabase: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching customers from payment system...');
      const response = await fetch('https://backend-bkt7.onrender.com/api/payment/customers');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Payment-verified customers response:', data);
      
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
        console.log('Payment-verified customers loaded successfully:', data.customers.length);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching payment-verified customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.accountType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading payment-verified customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Error loading customers: {error}</p>
          <button 
            onClick={fetchCustomers}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Payment-Verified Customers</h1>
          <p className="text-gray-400">Customers who completed signup and payment process</p>
        </div>
        <button 
          onClick={fetchCustomers}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{customers.length}</div>
            <div className="text-sm text-gray-400">Total Customers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {customers.filter(c => c.paymentStatus === 'completed').length}
            </div>
            <div className="text-sm text-gray-400">Paid</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {customers.filter(c => c.accountType === 'QuantTekel Instant').length}
            </div>
            <div className="text-sm text-gray-400">QuantTekel</div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg text-white px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Account Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-white font-medium">{customer.email}</span>
                      </div>
                      <div className="text-sm text-gray-400">ID: {customer.id.slice(0, 8)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white">{customer.accountType}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getPaymentStatusColor(customer.paymentStatus)}`}>
                        {customer.paymentStatus}
                      </span>
                      {customer.paymentStatus === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">${customer.paymentAmount}</span>
                    </div>
                    <div className="text-xs text-gray-400">{customer.paymentMethod}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                        View
                      </button>
                      <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors">
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No payment-verified customers found</p>
          <p className="text-gray-500 text-sm">Customers will appear here after completing signup and payment</p>
        </div>
      )}
    </div>
  );
};

export default PaymentBasedCustomerDatabase;
