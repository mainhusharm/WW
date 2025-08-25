import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Calendar, Activity, Filter, Download, RefreshCw } from 'lucide-react';

interface Customer {
  _id?: string;
  user_id: string;
  unique_id: string;
  username: string;
  email: string;
  plan_type: string;
  created_at: string;
  last_updated: string;
  status: string;
  questionnaire_data?: any;
}

const CustomerDatabase: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterStatus, filterPlan]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let customerData: Customer[] = [];
      
      // Try main API first
      try {
        const response = await fetch('/api/customers', {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          customerData = await response.json();
        } else {
          throw new Error(`API responded with status: ${response.status}`);
        }
      } catch (mainApiError) {
        console.warn('Main API failed, trying customer service API:', mainApiError);
        
        // Try customer service API as backup
        try {
          const csResponse = await fetch('http://localhost:5001/api/customers', {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (csResponse.ok) {
            customerData = await csResponse.json();
          } else {
            throw new Error(`Customer service API responded with status: ${csResponse.status}`);
          }
        } catch (csApiError) {
          console.error('Customer service API also failed:', csApiError);
          throw new Error('All customer APIs are unavailable');
        }
      }

      setCustomers(customerData || []);
      setError('');
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customer data. Please ensure the backend services are running.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };


  const filterCustomers = () => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.unique_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => customer.status === filterStatus);
    }

    // Plan filter
    if (filterPlan !== 'all') {
      filtered = filtered.filter(customer => customer.plan_type === filterPlan);
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const exportCustomers = () => {
    const csvContent = [
      ['ID', 'Username', 'Email', 'Plan', 'Status', 'Created', 'Last Updated'],
      ...filteredCustomers.map(customer => [
        customer.unique_id,
        customer.username,
        customer.email,
        customer.plan_type,
        customer.status,
        new Date(customer.created_at).toLocaleDateString(),
        new Date(customer.last_updated).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Pagination
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-cyan-100">Loading customer database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Customer Database
          </h2>
          <p className="text-gray-400 mt-2">
            Manage and view all registered customers ({filteredCustomers.length} total)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCustomers}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg text-blue-400 hover:from-blue-500/30 hover:to-cyan-500/30 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportCustomers}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-700/50 border border-cyan-400/30 rounded-xl w-full text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-700/50 border border-cyan-400/30 rounded-xl w-full text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Plan Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="pl-10 pr-4 py-3 bg-gray-700/50 border border-cyan-400/30 rounded-xl w-full text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="all">All Plans</option>
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="Pro">Pro</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-center bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
            <span className="text-cyan-100 font-semibold">
              {filteredCustomers.length} Results
            </span>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-cyan-400/30">
              <tr>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Customer</th>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Plan</th>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Account Size</th>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Prop Firm</th>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Joined</th>
                <th className="px-6 py-4 text-left text-cyan-100 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {currentCustomers.map((customer, index) => (
                <tr
                  key={customer.user_id}
                  className="border-b border-gray-700/50 hover:bg-cyan-500/10 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {customer.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-cyan-100">{customer.username}</div>
                        <div className="text-sm text-gray-400">{customer.email}</div>
                        <div className="text-xs text-cyan-300">ID: {customer.unique_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      customer.plan_type === 'Pro' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' :
                      customer.plan_type === 'Premium' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    }`}>
                      {customer.plan_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      customer.status === 'active' 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-cyan-100 font-semibold">
                      ${customer.questionnaire_data?.accountSize ? 
                        parseInt(customer.questionnaire_data.accountSize).toLocaleString() : 
                        'N/A'
                      }
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">
                      {customer.questionnaire_data?.propFirm || 'Not specified'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-300">
                      {new Date(customer.last_updated).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 p-6 border-t border-cyan-500/20">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700/50 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600/50 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => paginate(pageNum)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                        : 'bg-gray-700/50 text-white hover:bg-gray-600/50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700/50 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600/50 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {filteredCustomers.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-bold text-gray-300 mb-2">No Customers Found</h3>
          <p className="text-gray-400">
            {searchTerm || filterStatus !== 'all' || filterPlan !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No customers have been registered yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerDatabase;
