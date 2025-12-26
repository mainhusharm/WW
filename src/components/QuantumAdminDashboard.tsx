import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Search, Settings, Shield, Activity, DollarSign, 
  TrendingUp, AlertTriangle, CheckCircle, XCircle, 
  Eye, Edit, Trash2, MessageSquare, Database, 
  Cpu, Zap, Target, BarChart3, Globe, Lock, RefreshCw
} from 'lucide-react';
import { quantumAdminService, QuantumUser, QuantumUserUpdate } from '../services/quantumAdminService';
import MiniUserDashboard from './MiniUserDashboard';

// Use QuantumUser from service instead of local interface
type User = QuantumUser;

interface UserChatMessage {
  id: string;
  type: 'admin' | 'user' | 'system';
  message: string;
  timestamp: string;
  action?: 'equity_update' | 'status_change' | 'settings_update';
  data?: any;
}

const QuantumAdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'settings'>('overview');
  const [userChatMessages, setUserChatMessages] = useState<UserChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showUserChat, setShowUserChat] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [equityUpdate, setEquityUpdate] = useState({ amount: '', reason: '' });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'info' | 'warning' | 'error', timestamp: Date}>>([]);
  const [showMiniDashboard, setShowMiniDashboard] = useState(false);
  const [selectedUserForMini, setSelectedUserForMini] = useState<User | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load users from real database
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Loading users from real database...');
      
      const fetchedUsers = await quantumAdminService.fetchUsers();
      console.log('✅ Fetched users:', fetchedUsers.length);
      
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      
      addNotification(`Loaded ${fetchedUsers.length} real users from database`, 'success');
    } catch (error) {
      console.error('❌ Error loading users:', error);
      addNotification('Failed to load users from database - no real users available', 'error');
      
      // Don't fallback to localStorage - only show real users
      console.log('❌ No real users available from database');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    loadUsers();
    
  }, [loadUsers]);

  // Save users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('quantum_admin_users', JSON.stringify(users));
      setLastUpdate(new Date());
    }
  }, [users]);

  // Real-time updates simulation
  useEffect(() => {
    const simulateRealTimeUpdates = () => {
      setUsers(prevUsers => 
        prevUsers.map(user => {
          // Simulate small equity changes
          const change = (Math.random() - 0.5) * 100;
          const newEquity = Math.max(0, user.currentEquity + change);
          const newPnl = newEquity - user.accountSize;
          
          return {
            ...user,
            currentEquity: Math.round(newEquity * 100) / 100,
            totalPnl: Math.round(newPnl * 100) / 100,
            lastActive: new Date().toISOString()
          };
        })
      );
    };

    // Update every 30 seconds
    refreshInterval.current = setInterval(simulateRealTimeUpdates, 30000);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, []);

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadUsers();
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [loadUsers]);

  // Add notification function
  const addNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Search functionality
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.uniqueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setShowUserChat(true);
    setUserChatMessages([
      {
        id: '1',
        type: 'system',
        message: `Connected to ${user.name}'s dashboard`,
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const handleMiniDashboardOpen = (user: User) => {
    setSelectedUserForMini(user);
    setShowMiniDashboard(true);
  };

  const handleMiniDashboardClose = () => {
    setShowMiniDashboard(false);
    setSelectedUserForMini(null);
  };

  const handleUserUpdate = async (userId: string, updates: Partial<User>) => {
    try {
      const success = await quantumAdminService.updateUser(userId, updates as QuantumUserUpdate);
      if (success) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ));
        setFilteredUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, ...updates } : user
        ));
        
        // Update selected user if it's the same
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
        }
        
        addNotification(`User ${updates.name || 'data'} updated successfully`, 'success');
      } else {
        addNotification('Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      addNotification('Error updating user', 'error');
    }
  };

  const handleRefreshUser = async (userId: string) => {
    try {
      const user = await quantumAdminService.fetchUserById(userId);
      if (user) {
        // Update local state
        setUsers(prev => prev.map(u => u.id === userId ? user : u));
        setFilteredUsers(prev => prev.map(u => u.id === userId ? user : u));
        
        // Update selected user if it's the same
        if (selectedUser?.id === userId) {
          setSelectedUser(user);
        }
        
        addNotification(`User ${user.name} data refreshed from database`, 'success');
      } else {
        addNotification('Failed to refresh user data', 'error');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      addNotification('Error refreshing user data', 'error');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    const message: UserChatMessage = {
      id: Date.now().toString(),
      type: 'admin',
      message: newMessage,
      timestamp: new Date().toISOString()
    };

    setUserChatMessages(prev => [...prev, message]);
    setNewMessage('');

    // Simulate user response
    setTimeout(() => {
      const response: UserChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'user',
        message: `Thank you for your message. I understand you want to discuss my account status.`,
        timestamp: new Date().toISOString()
      };
      setUserChatMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleEquityUpdate = () => {
    if (!selectedUser || !equityUpdate.amount) return;

    const newEquity = parseFloat(equityUpdate.amount);
    const oldEquity = selectedUser.currentEquity;
    const newPnl = newEquity - selectedUser.accountSize;
    
    const message: UserChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      message: `Equity updated from $${oldEquity.toLocaleString()} to $${newEquity.toLocaleString()}. Reason: ${equityUpdate.reason}`,
      timestamp: new Date().toISOString(),
      action: 'equity_update',
      data: { oldEquity, newEquity, reason: equityUpdate.reason }
    };

    setUserChatMessages(prev => [...prev, message]);
    
    // Update user equity with real-time sync
    const updatedUser = { 
      ...selectedUser, 
      currentEquity: newEquity, 
      totalPnl: newPnl,
      lastActive: new Date().toISOString()
    };
    
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id ? updatedUser : user
    ));
    
    setSelectedUser(updatedUser);
    
    // Sync to user's individual dashboard data
    const userDashboardKey = `dashboard_data_${selectedUser.email}`;
    const userTradingStateKey = `trading_state_${selectedUser.email}`;
    
    // Update user's dashboard data
    const userDashboardData = localStorage.getItem(userDashboardKey);
    if (userDashboardData) {
      try {
        const parsed = JSON.parse(userDashboardData);
        const updatedDashboardData = {
          ...parsed,
          performance: {
            ...parsed.performance,
            accountBalance: newEquity,
            totalPnl: newPnl
          },
          account: {
            ...parsed.account,
            balance: newEquity,
            equity: newEquity
          }
        };
        localStorage.setItem(userDashboardKey, JSON.stringify(updatedDashboardData));
      } catch (error) {
        console.error('Error updating user dashboard data:', error);
      }
    }
    
    // Update user's trading state
    const userTradingState = localStorage.getItem(userTradingStateKey);
    if (userTradingState) {
      try {
        const parsed = JSON.parse(userTradingState);
        const updatedTradingState = {
          ...parsed,
          currentEquity: newEquity,
          performanceMetrics: {
            ...parsed.performanceMetrics,
            totalPnl: newPnl
          }
        };
        localStorage.setItem(userTradingStateKey, JSON.stringify(updatedTradingState));
      } catch (error) {
        console.error('Error updating user trading state:', error);
      }
    }
    
    // Create a system notification for the user
    const userNotification = {
      id: Date.now().toString(),
      type: 'equity_update',
      message: `Your account equity has been updated to $${newEquity.toLocaleString()}`,
      timestamp: new Date().toISOString(),
      data: { oldEquity, newEquity, reason: equityUpdate.reason }
    };
    
    // Store notification for user to see
    const userNotificationsKey = `user_notifications_${selectedUser.email}`;
    const existingNotifications = localStorage.getItem(userNotificationsKey);
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
    notifications.unshift(userNotification);
    localStorage.setItem(userNotificationsKey, JSON.stringify(notifications.slice(0, 50))); // Keep last 50 notifications
    
    setEquityUpdate({ amount: '', reason: '' });
    
    // Add success notification
    addNotification(`Equity updated for ${selectedUser.name} to $${newEquity.toLocaleString()}`, 'success');
    
    // Show success message
    const successMessage: UserChatMessage = {
      id: (Date.now() + 1).toString(),
      type: 'system',
      message: `✅ Equity update successful! User dashboard has been synchronized.`,
      timestamp: new Date().toISOString()
    };
    setUserChatMessages(prev => [...prev, successMessage]);
  };

  const handleStatusUpdate = (status: User['status']) => {
    if (!selectedUser) return;

    const message: UserChatMessage = {
      id: Date.now().toString(),
      type: 'system',
      message: `Account status changed from ${selectedUser.status} to ${status}`,
      timestamp: new Date().toISOString(),
      action: 'status_change',
      data: { oldStatus: selectedUser.status, newStatus: status }
    };

    setUserChatMessages(prev => [...prev, message]);
    
    setUsers(prev => prev.map(user => 
      user.id === selectedUser.id ? { ...user, status } : user
    ));
    
    setSelectedUser(prev => prev ? { ...prev, status } : null);
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-400 bg-green-400/20';
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/20';
      case 'SUSPENDED': return 'text-red-400 bg-red-400/20';
      case 'INACTIVE': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: User['status']) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="w-4 h-4" />;
      case 'PENDING': return <AlertTriangle className="w-4 h-4" />;
      case 'SUSPENDED': return <XCircle className="w-4 h-4" />;
      case 'INACTIVE': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="quantum-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-cyan-300">Total Users</p>
              <p className="text-3xl font-bold text-white">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        
        <div className="quantum-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">Active Users</p>
              <p className="text-3xl font-bold text-white">
                {users.filter(u => u.status === 'ACTIVE').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="quantum-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-300">Total Equity</p>
              <p className="text-3xl font-bold text-white">
                ${users.reduce((sum, u) => sum + u.currentEquity, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="quantum-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-300">Avg Win Rate</p>
              <p className="text-3xl font-bold text-white">
                {(users.reduce((sum, u) => sum + u.winRate, 0) / users.length || 0).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="quantum-card">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <BarChart3 className="w-6 h-6 mr-2" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {users.slice(0, 5).map(user => (
            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-900/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(user.status).split(' ')[0].replace('text-', 'bg-')}`}></div>
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-sm text-gray-400">{user.uniqueId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Last Active</p>
                <p className="text-white">{new Date(user.lastActive).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsersList = () => (
    <div className="space-y-6">
      <div className="quantum-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <Users className="w-6 h-6 mr-2" />
            User Management
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-900/50 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 w-80"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Database className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-gray-400 mb-4">
                {isLoading ? 'Loading users from database...' : 'No real users found in the customer service database.'}
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Make sure your customer service database is running</p>
                <p>• Check that users exist in the database</p>
                <p>• Verify API endpoints are accessible</p>
              </div>
              <button
                onClick={loadUsers}
                className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Retry Loading
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/20">
                  <th className="text-left py-3 px-4 text-cyan-300">User ID</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Name</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Status</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Account Size</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Equity</th>
                  <th className="text-left py-3 px-4 text-cyan-300">P&L</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Win Rate</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Prop Firm</th>
                  <th className="text-left py-3 px-4 text-cyan-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-900/30">
                    <td className="py-3 px-4 text-white font-mono">{user.uniqueId}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        <span className="ml-1">{user.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white">${user.accountSize.toLocaleString()}</td>
                    <td className="py-3 px-4 text-white">${user.currentEquity.toLocaleString()}</td>
                    <td className={`py-3 px-4 ${user.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {user.totalPnl >= 0 ? '+' : ''}${user.totalPnl.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white">{user.winRate.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-white text-sm">{user.propFirm}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUserSelect(user)}
                          className="p-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 rounded-lg transition-all"
                          title="View Chat Dashboard"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMiniDashboardOpen(user)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all"
                          title="Mini User Dashboard"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRefreshUser(user.id)}
                          className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-all"
                          title="Refresh User Data"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/10 rounded-lg transition-all"
                          title="Quick Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );

  const renderUserChat = () => (
    <div className="quantum-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-cyan-400/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {selectedUser?.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <h3 className="text-white font-semibold">{selectedUser?.name}</h3>
            <p className="text-sm text-gray-400">{selectedUser?.uniqueId}</p>
          </div>
        </div>
        <button
          onClick={() => setShowUserChat(false)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* User Dashboard Preview */}
      <div className="mb-4 p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <Database className="w-4 h-4 mr-2" />
          User Dashboard Data
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Account Size:</span>
            <span className="text-white ml-2">${selectedUser?.accountSize.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400">Current Equity:</span>
            <span className="text-white ml-2">${selectedUser?.currentEquity.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-400">Total P&L:</span>
            <span className={`ml-2 ${selectedUser && selectedUser.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {selectedUser && selectedUser.totalPnl >= 0 ? '+' : ''}${selectedUser?.totalPnl.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Win Rate:</span>
            <span className="text-white ml-2">{selectedUser?.winRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Equity Update Form */}
      <div className="mb-4 p-4 bg-gray-900/30 rounded-lg border border-cyan-400/20">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Quick Actions
        </h4>
        <div className="space-y-3">
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="New Equity Amount"
              value={equityUpdate.amount}
              onChange={(e) => setEquityUpdate(prev => ({ ...prev, amount: e.target.value }))}
              className="flex-1 px-3 py-2 bg-gray-800 border border-cyan-400/30 rounded text-white focus:border-cyan-400"
            />
            <input
              type="text"
              placeholder="Reason"
              value={equityUpdate.reason}
              onChange={(e) => setEquityUpdate(prev => ({ ...prev, reason: e.target.value }))}
              className="flex-1 px-3 py-2 bg-gray-800 border border-cyan-400/30 rounded text-white focus:border-cyan-400"
            />
            <button
              onClick={handleEquityUpdate}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded transition-all"
            >
              Update
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusUpdate('ACTIVE')}
              className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded hover:bg-green-500/30 transition-all"
            >
              Activate
            </button>
            <button
              onClick={() => handleStatusUpdate('SUSPENDED')}
              className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-all"
            >
              Suspend
            </button>
            <button
              onClick={() => handleStatusUpdate('INACTIVE')}
              className="px-3 py-1 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded hover:bg-gray-500/30 transition-all"
            >
              Deactivate
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {userChatMessages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.type === 'admin'
                  ? 'bg-cyan-500 text-white'
                  : message.type === 'system'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-800 text-white'
              }`}
            >
              <p className="text-sm">{message.message}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 px-4 py-2 bg-gray-800 border border-cyan-400/30 rounded-lg text-white focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all"
        >
          Send
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading Quantum Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <style>{`
        .quantum-bg {
          background: radial-gradient(ellipse at center, #0a0a1f 0%, #000000 100%);
          position: relative;
          overflow: hidden;
        }
        .quantum-grid {
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        .quantum-card {
          background: rgba(0, 20, 40, 0.6);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          position: relative;
          backdrop-filter: blur(10px);
          animation: holo-float 6s ease-in-out infinite;
        }
        @keyframes holo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .quantum-sidebar {
          width: 250px;
          height: 100vh;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(0, 255, 255, 0.3);
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }
        .quantum-menu-item {
          padding: 20px 30px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 15px;
          color: #fff;
        }
        .quantum-menu-item.active {
          background: rgba(0, 255, 255, 0.1);
          border-left: 3px solid #00ffff;
          color: #00ffff;
        }
        .quantum-menu-item::before {
          content: '';
          position: absolute;
          left: -100%;
          top: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          transition: left 0.5s;
        }
        .quantum-menu-item:hover::before {
          left: 100%;
        }
        .quantum-main {
          margin-left: 250px;
          padding: 40px;
          min-height: 100vh;
        }
      `}</style>
      
      <div className="quantum-bg">
        <div className="quantum-grid"></div>
        
        {/* Sidebar */}
        <div className="quantum-sidebar">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-cyan-400 mb-2">Quantum Admin</h1>
            <p className="text-sm text-gray-400">User Management System</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Live</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          
          <nav className="mt-8">
            <div
              className={`quantum-menu-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </div>
            <div
              className={`quantum-menu-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
            </div>
            <div
              className={`quantum-menu-item ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Analytics</span>
            </div>
            <div
              className={`quantum-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </div>
          </nav>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-md border transition-all duration-300 ${
                  notification.type === 'success' 
                    ? 'bg-green-500/20 border-green-500/30 text-green-300'
                    : notification.type === 'error'
                    ? 'bg-red-500/20 border-red-500/30 text-red-300'
                    : notification.type === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                    : 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    notification.type === 'success' ? 'bg-green-400' :
                    notification.type === 'error' ? 'bg-red-400' :
                    notification.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}></div>
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mini User Dashboard Modal */}
        {showMiniDashboard && selectedUserForMini && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <MiniUserDashboard
                user={selectedUserForMini}
                onUpdate={handleUserUpdate}
                onClose={handleMiniDashboardClose}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="quantum-main">
          {showUserChat ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              <div className="lg:col-span-2">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'users' && renderUsersList()}
                {activeTab === 'analytics' && (
                  <div className="quantum-card">
                    <h3 className="text-xl font-semibold text-white mb-4">Analytics</h3>
                    <p className="text-gray-400">Analytics dashboard coming soon...</p>
                  </div>
                )}
                {activeTab === 'settings' && (
                  <div className="quantum-card">
                    <h3 className="text-xl font-semibold text-white mb-4">Settings</h3>
                    <p className="text-gray-400">Settings panel coming soon...</p>
                  </div>
                )}
              </div>
              <div className="lg:col-span-1">
                {renderUserChat()}
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsersList()}
              {activeTab === 'analytics' && (
                <div className="quantum-card">
                  <h3 className="text-xl font-semibold text-white mb-4">Analytics</h3>
                  <p className="text-gray-400">Analytics dashboard coming soon...</p>
                </div>
              )}
              {activeTab === 'settings' && (
                <div className="quantum-card">
                  <h3 className="text-xl font-semibold text-white mb-4">Settings</h3>
                  <p className="text-gray-400">Settings panel coming soon...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuantumAdminDashboard;
