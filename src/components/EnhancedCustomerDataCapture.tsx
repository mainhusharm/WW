import React, { useState, useEffect } from 'react';
import { 
  Database, Lock, Shield, Eye, Download, RefreshCw, 
  User, CreditCard, FileText, TrendingUp, AlertCircle,
  CheckCircle, Clock, Search, Filter, Calendar
} from 'lucide-react';

interface CustomerData {
  id: number;
  customer_id: number;
  unique_id: string;
  email: string;
  name: string;
  phone: string;
  membership_tier: string;
  payment_status: string;
  payment_method: string;
  payment_amount: number;
  payment_date: string;
  join_date: string;
  last_active: string;
  status: string;
  questionnaire_data: any;
  account_type: string;
  prop_firm: string;
  account_size: number;
  trading_experience: string;
  risk_tolerance: string;
  trading_goals: string;
  ip_address: string;
  signup_source: string;
  referral_code: string;
  data_capture_complete: boolean;
  admin_verified: boolean;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

interface CustomerStats {
  total_customers: number;
  payment_verified: number;
  payment_pending: number;
  data_capture_complete: number;
  admin_verified: number;
  recent_signups_7_days: number;
  completion_rate: number;
  payment_success_rate: number;
}

const EnhancedCustomerDataCapture: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('all');
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    const adminMpin = localStorage.getItem('admin_mpin_authenticated');
    setAdminAuthenticated(!!(adminToken || adminMpin));
  }, []);

  const fetchCustomerData = async () => {
    if (!adminAuthenticated) return;
    
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:5004/api';
      
      const adminToken = localStorage.getItem('admin_token');
      const adminMpin = localStorage.getItem('admin_mpin_authenticated');
      const adminUsername = localStorage.getItem('admin_username') || 'admin';
      
      const headers: any = {
        'Content-Type': 'application/json',
        'X-Admin-Username': adminUsername
      };
      
      if (adminMpin === 'true') {
        headers['X-Admin-MPIN'] = '180623';
      } else if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}/customer-data/get-all`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!adminAuthenticated) return;
    
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:5004/api';
      
      const adminToken = localStorage.getItem('admin_token');
      const adminMpin = localStorage.getItem('admin_mpin_authenticated');
      const adminUsername = localStorage.getItem('admin_username') || 'admin';
      
      const headers: any = {
        'Content-Type': 'application/json',
        'X-Admin-Username': adminUsername
      };
      
      if (adminMpin === 'true') {
        headers['X-Admin-MPIN'] = '180623';
      } else if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}/customer-data/stats`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (adminAuthenticated) {
      fetchCustomerData();
      fetchStats();
    }
  }, [adminAuthenticated]);

  const exportData = async () => {
    if (!adminAuthenticated) return;
    
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:5004/api';
      
      const adminToken = localStorage.getItem('admin_token');
      const adminMpin = localStorage.getItem('admin_mpin_authenticated');
      const adminUsername = localStorage.getItem('admin_username') || 'admin';
      
      const headers: any = {
        'Content-Type': 'application/json',
        'X-Admin-Username': adminUsername
      };
      
      if (adminMpin === 'true') {
        headers['X-Admin-MPIN'] = '180623';
      } else if (adminToken) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      
      const response = await fetch(`${apiBaseUrl}/customer-data/export`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          export_type: exportType,
          export_format: 'json'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Download the data as JSON file
        const blob = new Blob([JSON.stringify(data.export_data, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customer-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setShowExportModal(false);
        alert(`✅ Exported ${data.total_records} customer records successfully!`);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('❌ Error exporting data');
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.unique_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'payment_verified' && customer.payment_status === 'completed') ||
                         (filterStatus === 'payment_pending' && customer.payment_status === 'pending') ||
                         (filterStatus === 'data_complete' && customer.data_capture_complete) ||
                         (filterStatus === 'admin_verified' && customer.admin_verified);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!adminAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-purple-500/20 rounded-lg p-8 text-center">
          <Lock className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
          <p className="text-gray-300 mb-6">
            This section requires admin authentication to access customer data.
          </p>
          <button 
            onClick={() => window.location.href = '/admin-login'}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-purple-300">Enhanced Customer Data Capture</h1>
              <p className="text-gray-400">Comprehensive customer data management system</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchCustomerData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Customers</p>
                  <p className="text-2xl font-bold text-white">{stats.total_customers}</p>
                </div>
                <User className="w-8 h-8 text-purple-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Payment Verified</p>
                  <p className="text-2xl font-bold text-white">{stats.payment_verified}</p>
                </div>
                <CreditCard className="w-8 h-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Data Complete</p>
                  <p className="text-2xl font-bold text-white">{stats.data_capture_complete}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Success Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.payment_success_rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers by name, email, or ID..."
                className="w-full bg-gray-700/50 border border-purple-500/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="bg-gray-700/50 border border-purple-500/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Customers</option>
                <option value="payment_verified">Payment Verified</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="data_complete">Data Complete</option>
                <option value="admin_verified">Admin Verified</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-gray-800/30 rounded-lg border border-purple-500/20">
          <div className="p-4 border-b border-purple-500/20">
            <h3 className="text-lg font-semibold text-purple-300">
              Customer Data ({filteredCustomers.length} records)
            </h3>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-purple-400" />
                <p className="text-gray-400">Loading customer data...</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-8 text-center">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">No customer data found</p>
              </div>
            ) : (
              <div className="divide-y divide-purple-500/10">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-4 hover:bg-gray-700/20 transition-colors cursor-pointer"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-white">{customer.name}</h4>
                          <p className="text-sm text-gray-400">{customer.email}</p>
                          <p className="text-xs text-gray-500">ID: {customer.unique_id}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.payment_status)}`}>
                              {customer.payment_status}
                            </span>
                            {getStatusIcon(customer.payment_status)}
                          </div>
                          <p className="text-xs text-gray-400">
                            {customer.membership_tier} • {customer.account_type || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(customer.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {customer.data_capture_complete && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          {customer.admin_verified && (
                            <Shield className="w-4 h-4 text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-purple-500/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-purple-500/20">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-purple-300">Customer Details</h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-purple-300 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className="text-white">{selectedCustomer.name}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Email</label>
                    <p className="text-white">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Phone</label>
                    <p className="text-white">{selectedCustomer.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Unique ID</label>
                    <p className="text-white">{selectedCustomer.unique_id}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Information */}
              <div>
                <h4 className="text-lg font-semibold text-purple-300 mb-3">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Status</label>
                    <p className="text-white">{selectedCustomer.payment_status}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Method</label>
                    <p className="text-white">{selectedCustomer.payment_method || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Amount</label>
                    <p className="text-white">${selectedCustomer.payment_amount || 0}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Date</label>
                    <p className="text-white">
                      {selectedCustomer.payment_date ? new Date(selectedCustomer.payment_date).toLocaleDateString() : 'Not completed'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Trading Information */}
              <div>
                <h4 className="text-lg font-semibold text-purple-300 mb-3">Trading Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">Account Type</label>
                    <p className="text-white">{selectedCustomer.account_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Prop Firm</label>
                    <p className="text-white">{selectedCustomer.prop_firm || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Account Size</label>
                    <p className="text-white">${selectedCustomer.account_size || 0}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Experience</label>
                    <p className="text-white">{selectedCustomer.trading_experience || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              {/* System Information */}
              <div>
                <h4 className="text-lg font-semibold text-purple-300 mb-3">System Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm">IP Address</label>
                    <p className="text-white">{selectedCustomer.ip_address || 'Not recorded'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Signup Source</label>
                    <p className="text-white">{selectedCustomer.signup_source || 'Website'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Join Date</label>
                    <p className="text-white">{new Date(selectedCustomer.join_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Last Active</label>
                    <p className="text-white">
                      {selectedCustomer.last_active ? new Date(selectedCustomer.last_active).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Questionnaire Data */}
              {selectedCustomer.questionnaire_data && Object.keys(selectedCustomer.questionnaire_data).length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-purple-300 mb-3">Questionnaire Responses</h4>
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedCustomer.questionnaire_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Export Customer Data</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Export Type</label>
                <select
                  className="w-full bg-gray-700 border border-purple-500/20 rounded-lg px-3 py-2"
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                >
                  <option value="all">All Customers</option>
                  <option value="payment_verified">Payment Verified Only</option>
                  <option value="specific">Specific Customers</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={exportData}
                className="flex-1 bg-green-600 hover:bg-green-700 py-2 rounded-lg transition-colors"
              >
                Export
              </button>
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCustomerDataCapture;
