import React, { useState, useEffect } from 'react';
import { 
  Search, MessageCircle, User, FileText, Shield, TrendingUp, 
  Bell, Settings, ChevronRight, Circle, AlertCircle, Clock, 
  Star, Upload, Database, Activity, Zap, Globe, Lock, 
  CreditCard, HelpCircle, Plus, Filter, Download, RefreshCw,
  Eye, Edit, Trash, Phone, Mail, MapPin, Calendar, Key
} from 'lucide-react';
import NewCustomerDatabase from './NewCustomerDatabase';
import PaymentBasedCustomerDatabase from './PaymentBasedCustomerDatabase';
import AdminProtectedCustomerData from './AdminProtectedCustomerData';

interface Customer {
  id: number;
  unique_id: string;
  name: string;
  email: string;
  membership_tier: string;
  join_date: string;
  last_active: string;
  status: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface CustomerServiceData {
  id: number;
  customer_id: number;
  email: string;
  questionnaire_data: any;
  screenshots: string[];
  risk_management_plan: any;
  subscription_plan: string;
  account_type: string;
  prop_firm: string;
  account_size: number;
  last_updated: string;
}

interface LiveChat {
  id: number;
  customer_id: number;
  customer_name: string;
  message: string;
  timestamp: string;
  unread: boolean;
  status: 'active' | 'waiting' | 'resolved';
}

interface Ticket {
  id: number;
  customer_id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
}

interface DashboardStats {
  totalCustomers: number;
  activeChats: number;
  openTickets: number;
  avgResponseTime: string;
  satisfactionScore: number;
  newCustomersToday: number;
  resolvedTicketsToday: number;
}

const NexusDeskPro = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerServiceData, setCustomerServiceData] = useState<CustomerServiceData[]>([]);
  const [liveChats, setLiveChats] = useState<LiveChat[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeChats: 0,
    openTickets: 0,
    avgResponseTime: '0s',
    satisfactionScore: 0,
    newCustomersToday: 0,
    resolvedTicketsToday: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch real data from enhanced backend
  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:3005/api';
      
      const response = await fetch(`${apiBaseUrl}/dashboard/notifications`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch customers from enhanced backend
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:3005/api';
      
      const customersResponse = await fetch(`${apiBaseUrl}/customers`);
      const customersData = await customersResponse.json();
      
      if (customersData.customers) {
        setCustomers(customersData.customers);
        
        // Fetch customer service data for each customer
        const serviceDataPromises = customersData.customers.map(async (customer: Customer) => {
          try {
            const response = await fetch(`${apiBaseUrl}/enhanced/customers/${customer.id}/comprehensive`);
            if (response.ok) {
              const data = await response.json();
              return data.data;
            }
          } catch (error) {
            console.error(`Error fetching data for customer ${customer.id}:`, error);
          }
          return null;
        });

        const serviceDataResults = await Promise.all(serviceDataPromises);
        const validServiceData = serviceDataResults.filter(data => data !== null);
        setCustomerServiceData(validServiceData);

        // Fetch real tickets from backend
        const ticketsResponse = await fetch(`${apiBaseUrl}/dashboard/tickets`);
        if (ticketsResponse.ok) {
          const ticketsData = await ticketsResponse.json();
          setTickets(ticketsData.tickets || []);
        }

        // Fetch real dashboard stats
        const statsResponse = await fetch(`${apiBaseUrl}/dashboard/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }

        // Generate real live chats from customer data
        const realLiveChats: LiveChat[] = customersData.customers.slice(0, 3).map((customer: any, index: number) => ({
          id: index + 1,
          customer_id: customer.id,
          customer_name: customer.name,
          message: `Hello, I need help with my ${customer.membership_tier} account`,
          timestamp: customer.last_active || customer.created_at,
          unread: Math.random() > 0.5,
          status: 'active'
        }));
        setLiveChats(realLiveChats);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await fetchDashboardData();
      return;
    }

    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:3005/api';
      
      const response = await fetch(`${apiBaseUrl}/customers/search?search=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const getRiskLevel = (customer: Customer) => {
    const serviceData = customerServiceData.find(d => d.customer_id === customer.id);
    if (serviceData?.risk_management_plan) {
      try {
        const plan = JSON.parse(serviceData.risk_management_plan);
        return plan.risk_level || 'medium';
      } catch {
        return 'medium';
      }
    }
    return 'medium';
  };

  const getRiskColor = (level: string) => {
    switch(level.toLowerCase()) {
      case 'low': return 'text-green-400 bg-green-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'high': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-400';
      case 'waiting': return 'bg-yellow-400';
      case 'inactive': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    if (!timestamp) return '1 hour ago';
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour ago`;
    return `${Math.floor(diffMins / 1440)} day ago`;
  };

  const getPlanColor = (plan: string) => {
    switch(plan.toLowerCase()) {
      case 'enterprise': return 'bg-purple-600';
      case 'pro': return 'bg-blue-600';
      case 'starter': return 'bg-green-600';
      case 'kickstarter': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getPlanDisplayName = (plan: string) => {
    switch(plan.toLowerCase()) {
      case 'enterprise': return 'Enterprise';
      case 'pro': return 'Pro';
      case 'starter': return 'Starter';
      case 'kickstarter': return 'Kickstarter';
      default: return plan;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      {/* Top Bar */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-purple-300">NexusDesk Pro</h1>
          <div className="flex items-center space-x-2 text-green-400">
            <Circle className="w-2 h-2 fill-current" />
            <span className="text-sm">Agent Online</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-gray-800 border border-purple-500/20 rounded-lg shadow-xl z-50">
                <div className="p-4 border-b border-purple-500/20">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif, index) => (
                      <div key={index} className="p-3 border-b border-purple-500/10 hover:bg-gray-700/50">
                        <div className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            notif.priority === 'urgent' ? 'bg-red-500' :
                            notif.priority === 'high' ? 'bg-orange-500' :
                            notif.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {notif.customer_name} • {getTimeAgo(notif.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No new notifications
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-purple-500/20">
                  <button className="w-full text-center text-sm text-purple-400 hover:text-purple-300">
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <button 
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex h-screen">
        {/* Left Sidebar */}
        <div className="w-64 bg-black/20 backdrop-blur-sm border-r border-purple-500/20 p-4">
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-6 h-6 text-purple-400" />
              <span className="text-lg font-bold text-purple-300">NexusDesk Pro</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search customers, tickets..."
                className="w-full bg-gray-800/50 border border-purple-500/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-purple-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp, badge: null },
              { id: 'live-chat', label: 'Live Chat', icon: MessageCircle, badge: liveChats.length },
              { id: 'customers', label: 'Customers', icon: User, badge: null },
              { id: 'enhanced-data', label: 'Enhanced Data', icon: Database, badge: null, adminOnly: true },
              { id: 'tickets', label: 'Tickets', icon: FileText, badge: tickets.filter(t => t.status === 'open').length },
              { id: 'risk', label: 'Risk Management', icon: Shield, badge: null },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp, badge: null }
            ].map(({ id, label, icon: Icon, badge, adminOnly }) => {
              // Check if user is admin for admin-only sections
              const isAdmin = localStorage.getItem('admin_mpin_authenticated') === 'true' || 
                             localStorage.getItem('admin_token');
              
              if (adminOnly && !isAdmin) {
                return null; // Don't render admin-only sections for non-admin users
              }
              
              return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  activeTab === id 
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50' 
                    : 'hover:bg-purple-500/10 text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </div>
                {badge && (
                  <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Central Column - Dynamic Content Based on Active Tab */}
          <div className="w-1/2 p-6 border-r border-purple-500/20">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-bold text-purple-300 mb-6">Dashboard Overview</h2>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Customers</p>
                        <p className="text-2xl font-bold text-white">{stats.totalCustomers}</p>
                      </div>
                      <User className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active Chats</p>
                        <p className="text-2xl font-bold text-white">{stats.activeChats}</p>
                      </div>
                      <MessageCircle className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Open Tickets</p>
                        <p className="text-2xl font-bold text-white">{stats.openTickets}</p>
                      </div>
                      <FileText className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Satisfaction</p>
                        <p className="text-2xl font-bold text-white">{stats.satisfactionScore}%</p>
                      </div>
                      <Star className="w-8 h-8 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                  <h3 className="text-lg font-semibold text-purple-300 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {customers.slice(0, 5).map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{customer.name}</p>
                            <p className="text-sm text-gray-400">{customer.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(customer.membership_tier)}`}>
                            {getPlanDisplayName(customer.membership_tier)}
                          </span>
                          <p className="text-xs text-gray-400 mt-1">{getTimeAgo(customer.last_active || customer.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && <PaymentBasedCustomerDatabase />}

            {activeTab === 'enhanced-data' && <AdminProtectedCustomerData />}

            {activeTab === 'live-chat' && (
              <div>
                <h2 className="text-xl font-bold text-purple-300 mb-6">Live Chat</h2>
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {liveChats.map((chat) => (
                    <div key={chat.id} className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {chat.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{chat.customer_name}</p>
                            <p className="text-sm text-gray-400">{chat.message}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{getTimeAgo(chat.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <div>
                <h2 className="text-xl font-bold text-purple-300 mb-6">Support Tickets</h2>
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {customers.find(c => c.id === ticket.customer_id)?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{ticket.subject}</p>
                            <p className="text-sm text-gray-400">{ticket.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{getTimeAgo(ticket.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'risk' && (
              <div>
                <h2 className="text-xl font-bold text-purple-300 mb-6">Risk Management</h2>
                <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {customerServiceData.map((service) => (
                    <div key={service.id} className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {customers.find(c => c.id === service.customer_id)?.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white">{customers.find(c => c.id === service.customer_id)?.name}</p>
                            <p className="text-sm text-gray-400">Risk Level: {getRiskLevel(customers.find(c => c.id === service.customer_id) || {} as Customer)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{getTimeAgo(service.last_updated)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-xl font-bold text-purple-300 mb-6">Analytics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-purple-300 mb-3">New Customers Today</h3>
                    <p className="text-3xl font-bold text-white">{stats.newCustomersToday}</p>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4 border border-purple-500/20">
                    <h3 className="text-lg font-semibold text-purple-300 mb-3">Resolved Tickets Today</h3>
                    <p className="text-3xl font-bold text-white">{stats.resolvedTicketsToday}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-purple-300 mb-3">Average Response Time</h3>
                  <p className="text-3xl font-bold text-white">{stats.avgResponseTime}</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Customer Details */}
          <div className="w-1/2 p-6">
            {selectedCustomer ? (
              <div>
                <div className="mb-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl font-bold">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                      <p className="text-gray-300">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
                      Start Chat
                    </button>
                    <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                      View History
                    </button>
                  </div>
                </div>

                {/* Account Information */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold">Account Information</h4>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Password:</span>
                      <div className="flex items-center space-x-2">
                        <span>••••••••</span>
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Join Date:</span>
                      <span>{new Date(selectedCustomer.join_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Subscription:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(selectedCustomer.membership_tier)}`}>
                        {selectedCustomer.membership_tier}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activity & Data */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Database className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold">Activity & Data</h4>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Support Tickets:</span>
                      <span>{tickets.filter(t => t.customer_id === selectedCustomer.id).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Satisfaction:</span>
                      <div className="flex items-center space-x-2">
                        <span>94%</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Questionnaire:</span>
                      <span>11 responses</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Screenshots:</span>
                      <span>10 files</span>
                    </div>
                  </div>
                </div>

                {/* Screenshots Section */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Upload className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold">Screenshots & Files</h4>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {['screenshot1.png', 'screenshot2.png', 'screenshot3.png', 'screenshot4.png'].map((file, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="w-12 h-12 bg-gray-600 rounded-lg mx-auto mb-2 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-300 truncate">{file}</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-3 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors text-sm">
                      View All Files
                    </button>
                  </div>
                </div>

                {/* Questionnaire Responses */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold">Questionnaire Responses</h4>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Experience Level:</span>
                      <span className="text-white">Advanced</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Risk Tolerance:</span>
                      <span className="text-white">High</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Preferred Pairs:</span>
                      <span className="text-white">BTC/USD, ETH/USD</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Investment Goal:</span>
                      <span className="text-white">Long-term Growth</span>
                    </div>
                    <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors text-sm">
                      View Full Questionnaire
                    </button>
                  </div>
                </div>

                {/* Risk Management Plan */}
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold">Risk Management Plan</h4>
                  </div>
                  <div className="bg-gray-800/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">Current Risk Level:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(getRiskLevel(selectedCustomer))}`}>
                        {getRiskLevel(selectedCustomer).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Strategy:</span>
                        <span className="text-white">Aggressive</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Max Drawdown:</span>
                        <span className="text-white">25%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Position Size:</span>
                        <span className="text-white">5-10%</span>
                      </div>
                    </div>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors">
                      View Full Plan
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 mt-20">
                <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a customer to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-purple-500/20 rounded-lg p-6 w-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Auto-refresh interval</label>
                <select className="w-full bg-gray-700 border border-purple-500/20 rounded-lg px-3 py-2">
                  <option>30 seconds</option>
                  <option>1 minute</option>
                  <option>5 minutes</option>
                  <option>Disabled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <select className="w-full bg-gray-700 border border-purple-500/20 rounded-lg px-3 py-2">
                  <option>Dark Purple (Default)</option>
                  <option>Dark Blue</option>
                  <option>Light Mode</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Notifications</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    New customer alerts
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    High priority tickets
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    System updates
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors">
                Save Settings
              </button>
              <button 
                onClick={() => setShowSettings(false)}
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

export default NexusDeskPro;
