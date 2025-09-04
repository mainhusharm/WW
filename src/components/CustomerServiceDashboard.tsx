import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  fullName: string | null;
  questionnaireData: any;
  screenshotUrl: string | null;
  riskManagementPlan: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  success: boolean;
  users?: User[];
  count?: number;
  error?: string;
}

interface UserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

interface StatusUpdateResponse {
  success: boolean;
  user?: {
    id: string;
    status: string;
    updatedAt: string;
  };
  error?: string;
}

export default function CustomerServiceDashboard() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [localStorageData, setLocalStorageData] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Get current user from URL params or localStorage
  const currentUserId = searchParams.get('userId') || localStorage.getItem('userId');
  const isNewUser = searchParams.get('new') === 'true';

  // Load localStorage data
  useEffect(() => {
    const loadLocalStorageData = () => {
      const data = {
        userId: localStorage.getItem('userId'),
        userData: localStorage.getItem('userData'),
        userEmail: localStorage.getItem('userEmail'),
        userFullName: localStorage.getItem('userFullName'),
        registrationTime: localStorage.getItem('registrationTime'),
        questionnaireData: localStorage.getItem('questionnaireData'),
        riskManagementPlan: localStorage.getItem('riskManagementPlan'),
        screenshotUrl: localStorage.getItem('screenshotUrl'),
      };
      setLocalStorageData(data);
    };

    loadLocalStorageData();
  }, []);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/users');
      const data: UsersResponse = await response.json();

      if (data.success && data.users) {
        setUsers(data.users);
        setError(null);
        
        // If we have a current user ID, find and select them
        if (currentUserId) {
          const currentUser = data.users.find(user => user.id === currentUserId);
          if (currentUser) {
            setSelectedUser(currentUser);
          }
        }
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Network error while fetching users');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [currentUserId]);

  // Fetch specific user
  const fetchUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`);
      const data: UserResponse = await response.json();

      if (data.success && data.user) {
        setSelectedUser(data.user);
        // Update the user in the users list
        setUsers(prev => prev.map(user => 
          user.id === userId ? data.user! : user
        ));
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  }, []);

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      setUpdatingStatus(userId);
      const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data: StatusUpdateResponse = await response.json();

      if (data.success) {
        // Update the user in the list
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus as any, updatedAt: data.user!.updatedAt }
            : user
        ));
        
        // Update selected user if it's the same
        if (selectedUser?.id === userId) {
          setSelectedUser(prev => prev ? { ...prev, status: newStatus as any, updatedAt: data.user!.updatedAt } : null);
        }
      } else {
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Network error while updating status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Service Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time user management and monitoring
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchUsers}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Refresh
              </button>
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {isNewUser && currentUserId && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Welcome! Your account has been created successfully. You can see your registration in the list below.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  Registered Users ({users.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {user.fullName || 'No name provided'}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          {user.id === currentUserId && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Registered: {formatDate(user.createdAt)}
                        </p>
        </div>
                      <div className="flex space-x-2">
                        {['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED'].map((status) => (
                          <button
                            key={status}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateUserStatus(user.id, status);
                            }}
                            disabled={updatingStatus === user.id}
                            className={`px-2 py-1 text-xs rounded ${
                              user.status === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } ${updatingStatus === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
                    </div>
                  </div>
                  
          {/* User Details & localStorage Info */}
          <div className="space-y-6">
            {/* Selected User Details */}
            {selectedUser && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">User Details</h2>
                        </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.fullName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                      </div>
                      <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registered</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  {selectedUser.questionnaireData && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.experience || 'Not provided'}</p>
                    </div>
                  )}
                  {selectedUser.riskManagementPlan && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Risk Management</label>
                      <p className="mt-1 text-sm text-gray-900 line-clamp-3">{selectedUser.riskManagementPlan}</p>
                  </div>
                  )}
                </div>
                        </div>
            )}

            {/* localStorage Data */}
            {localStorageData && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">localStorage Data</h2>
                    </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{localStorageData.userId || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{localStorageData.userEmail || 'Not set'}</p>
                    </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-sm text-gray-900">{localStorageData.userFullName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Time</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {localStorageData.registrationTime ? formatDate(localStorageData.registrationTime) : 'Not set'}
                    </p>
                  </div>
                  {localStorageData.questionnaireData && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Questionnaire Data</label>
                      <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(JSON.parse(localStorageData.questionnaireData), null, 2)}
                      </pre>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => {
                        localStorage.clear();
                        setLocalStorageData(null);
                        alert('localStorage cleared!');
                      }}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Clear localStorage
                    </button>
                  </div>
                </div>
              </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}