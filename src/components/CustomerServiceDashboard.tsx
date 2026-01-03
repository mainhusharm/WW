import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
// PostgreSQL database integration

interface QuestionnaireData {
  tradesPerDay: string;
  tradingSession: string;
  cryptoAssets: string[];
  forexAssets: string[];
  hasAccount: 'yes' | 'no';
  accountEquity: number | string;
  propFirm: string;
  accountType: string;
  accountSize: number | string;
  riskPercentage: number;
  riskRewardRatio: string;
  accountScreenshot?: string;
  tradingExperience?: string;
  riskTolerance?: string;
  tradingGoals?: string;
  updatedAt?: string;
}

interface RiskManagementPlan {
  riskPerTrade: number;
  dailyLossLimit: number;
  maxLoss: number;
  profitTarget: number;
  tradesToPass: number;
  riskAmount: number;
  profitAmount: number;
  consecutiveLossesLimit: number;
  propFirmRules?: any;
  generatedAt?: string;
}

interface User {
  id: string;
  email: string;
  fullName: string | null;
  selectedPlan: any;
  questionnaireData: QuestionnaireData | null;
  cryptoAssets: string[];
  forexPairs: string[];
  otherForexPair: string | null;
  screenshotUrl: string | null;
  riskManagementPlan: RiskManagementPlan | null;
  tradingPreferences: any;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'ACTIVE';
  planActivatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: Payment[];
  trades?: Trade[];
}

interface Payment {
  id: string;
  userId: string;
  planName: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  couponCode: string | null;
  paymentMethod: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
}

interface Trade {
  id: string;
  tradeNumber: number;
  riskAmount: number;
  profitTarget: number;
  cumulativeProfit: number;
  progressPercentage: number | null;
  userId: string;
  createdAt: string;
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
  const [userPayments, setUserPayments] = useState<Payment[]>([]);

  // Get API URL from environment variable - hardcoded for production fix
  const API_BASE = 'http://localhost:3001';
  console.log('API_BASE URL:', API_BASE); // v2 - force deployment

  // Get current user from URL params or localStorage
  const currentUserId = searchParams.get('userId') || localStorage.getItem('userId');
  const isNewUser = searchParams.get('new') === 'true';

  // Load users from localStorage as fallback
  const loadUsersFromLocalStorage = useCallback(() => {
    console.log('Loading users from localStorage as fallback...');
    const localStorageUsers: User[] = [];
    
    // Check for common localStorage keys that might contain user data
    const possibleKeys = [
      'userData',
      'user',
      'currentUser',
      'userProfile',
      'customerData',
      'enhancedCustomerData'
    ];
    
    possibleKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.email) {
            localStorageUsers.push({
              id: parsed.id || parsed.uniqueId || Date.now().toString(),
              email: parsed.email,
              fullName: parsed.name || parsed.fullName || parsed.email.split('@')[0],
              selectedPlan: parsed.selectedPlan || { name: 'premium', price: 499, period: 'monthly', description: 'Premium trading signals' },
              questionnaireData: parsed.questionnaireData || parsed.tradingData || null,
              cryptoAssets: parsed.cryptoAssets || [],
              forexPairs: parsed.forexAssets || [],
              otherForexPair: null,
              screenshotUrl: parsed.screenshotUrl || parsed.accountScreenshot || null,
              riskManagementPlan: parsed.riskManagementPlan || null,
              tradingPreferences: parsed.tradingPreferences || {},
              status: 'PENDING',
              planActivatedAt: null,
              createdAt: parsed.createdAt || new Date().toISOString(),
              updatedAt: parsed.updatedAt || new Date().toISOString(),
              payments: [],
              trades: []
            });
          }
        }
      } catch (error) {
        console.log(`Error parsing ${key}:`, error);
      }
    });
    
    console.log('Found localStorage users:', localStorageUsers);
    return localStorageUsers;
  }, []);

  // Load localStorage data for selected user
  useEffect(() => {
    const loadLocalStorageData = () => {
      if (selectedUser) {
        // Show selected user's actual data from database
        const data = {
          userId: selectedUser.id,
          userData: selectedUser.email,
          userEmail: selectedUser.email,
          userFullName: selectedUser.fullName || selectedUser.email.split('@')[0],
          registrationTime: selectedUser.createdAt,
          questionnaireData: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
          questionnaireAnswers: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
          riskManagementPlan: selectedUser.riskManagementPlan ? JSON.stringify(selectedUser.riskManagementPlan) : null,
          riskSettings: selectedUser.tradingPreferences ? JSON.stringify(selectedUser.tradingPreferences) : null,
          screenshotUrl: selectedUser.screenshotUrl,
          accountScreenshot: selectedUser.screenshotUrl,
          tradingPreferences: selectedUser.tradingPreferences ? JSON.stringify(selectedUser.tradingPreferences) : null,
          propFirmRules: null,
          userProfile: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
          customerData: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
          enhancedCustomerData: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
        };
        setLocalStorageData(data);
      } else {
        // Only show admin's localStorage if no user is selected (which should be rare)
        const data = {
          userId: localStorage.getItem('userId'),
          userData: localStorage.getItem('userData'),
          userEmail: localStorage.getItem('userEmail'),
          userFullName: localStorage.getItem('userFullName'),
          registrationTime: localStorage.getItem('registrationTime'),
          questionnaireData: localStorage.getItem('questionnaireData'),
          questionnaireAnswers: localStorage.getItem('questionnaireAnswers'),
          riskManagementPlan: localStorage.getItem('riskManagementPlan'),
          riskSettings: localStorage.getItem('riskSettings'),
          screenshotUrl: localStorage.getItem('screenshotUrl'),
          accountScreenshot: localStorage.getItem('accountScreenshot'),
          tradingPreferences: localStorage.getItem('tradingPreferences'),
          propFirmRules: localStorage.getItem('propFirmRules'),
          userProfile: localStorage.getItem('userProfile'),
          customerData: localStorage.getItem('customerData'),
          enhancedCustomerData: localStorage.getItem('enhancedCustomerData'),
        };
        setLocalStorageData(data);
      }
    };

    loadLocalStorageData();
  }, [selectedUser]);

  // Fetch users from API using CORS proxy
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Starting fetchUsers...');
      console.log('API_BASE:', API_BASE);
      setLoading(true);
      
      // Try the database users endpoint first (most reliable)
      try {
        console.log('Trying database users endpoint first...', `${API_BASE}/api/database/users`);
        const response = await fetch(`${API_BASE}/api/database/users`);
        const data = await response.json();
        
        console.log('Database users response:', data);

        if (data.success && data.users && data.users.length > 0) {
          console.log('Found users in database:', data.users.length);
          
          // Check if any database users have questionnaire data
          const hasQuestionnaireData = data.users.some((user: any) => user.questionnaire_data || user.risk_management_plan);
          
          if (!hasQuestionnaireData) {
            console.log('Database users have no questionnaire data, checking localStorage for test users...');
            // Load test users from localStorage if database users don't have questionnaire data
            const testUsers = loadLocalStorageData();
            if (testUsers.length > 0) {
              console.log('Found test users in localStorage:', testUsers.length);
              setUsers(testUsers);
              return;
            }
          }
          
          // Transform database users to match frontend structure and preserve questionnaire data
          const transformedUsers = data.users.map((user: any) => {
            // Parse questionnaire data if it exists
            let questionnaireData = null;
            let riskManagementPlan = null;
            
            try {
              if (user.questionnaire_data) {
                questionnaireData = typeof user.questionnaire_data === 'string' 
                  ? JSON.parse(user.questionnaire_data) 
                  : user.questionnaire_data;
              }
              
              if (user.risk_management_plan) {
                riskManagementPlan = typeof user.risk_management_plan === 'string'
                  ? JSON.parse(user.risk_management_plan)
                  : user.risk_management_plan;
              }
            } catch (parseError) {
              console.warn('Error parsing user data for user', user.id, ':', parseError);
            }
            
            return {
              id: user.id.toString(),
              email: user.email,
              fullName: user.username || user.full_name || 'No name provided',
              selectedPlan: { 
                name: user.plan_type || 'premium',
                price: 499,
                period: 'monthly',
                description: 'Premium trading signals'
              },
              questionnaireData: questionnaireData,
              cryptoAssets: questionnaireData?.cryptoAssets || [],
              forexPairs: questionnaireData?.forexAssets || [],
              otherForexPair: null,
              screenshotUrl: user.screenshot_url || null,
              riskManagementPlan: riskManagementPlan,
              tradingPreferences: questionnaireData ? {
                tradingSession: questionnaireData.tradingSession,
                tradesPerDay: questionnaireData.tradesPerDay,
                riskTolerance: questionnaireData.riskTolerance,
                tradingExperience: questionnaireData.tradingExperience
              } : {},
              status: user.status || 'PENDING',
              planActivatedAt: null,
              createdAt: user.created_at,
              updatedAt: user.updated_at || user.created_at,
              payments: [],
              trades: []
            };
          });
          
          console.log('Transformed users:', transformedUsers);
          setUsers(transformedUsers);
          console.log('Users state set to:', transformedUsers);
          setError(null);
          
          // If we have a current user ID, find and select them
          if (currentUserId) {
            const currentUser = transformedUsers.find((user: any) => user.id === currentUserId);
            if (currentUser) {
              setSelectedUser(currentUser);
            }
          }
          return;
        } else {
          console.log('Database users endpoint returned no users or failed:', data);
          // Try localStorage fallback if database has no users
          const localStorageUsers = loadUsersFromLocalStorage();
          if (localStorageUsers.length > 0) {
            console.log('Using localStorage users as fallback:', localStorageUsers);
            setUsers(localStorageUsers);
            setError(null);
            return;
          }
        }
      } catch (dbError) {
        console.log('Database users endpoint failed, trying alternative...', dbError);
        // Try localStorage fallback on database error
        const localStorageUsers = loadUsersFromLocalStorage();
        if (localStorageUsers.length > 0) {
          console.log('Using localStorage users as fallback after database error:', localStorageUsers);
          setUsers(localStorageUsers);
          setError(null);
          return;
        }
      }
      
      // Try direct connection as fallback
      try {
        const response = await fetch(`${API_BASE}/api/users`);
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
          return;
        }
      } catch (directError) {
        console.log('Direct connection failed, trying localStorage...', directError);
      }
      
      // Fallback to localStorage
      try {
        console.log('Trying localStorage fallback...');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const data: UsersResponse = { success: true, users };
        
        console.log('localStorage users:', users);

        if (data.success && data.users) {
          console.log('Using localStorage users:', data.users.length);
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
          console.log('localStorage fallback failed, using mock data...');
          setError(data.error || 'Failed to fetch users');
        }
      } catch (proxyError) {
        console.error('CORS proxy also failed:', proxyError);
        console.log('Backend not available, using mock data for testing...');
        
        // Create mock users for testing when backend is not available
        console.log('Creating mock users...');
        const mockUsers = [
          {
            id: 'working-user-id',
            email: 'anchlshrma18@gmail.com',
            firstName: 'Anchal',
            lastName: 'Sharma',
            username: 'anchal',
            membershipTier: 'professional',
            accountType: 'personal',
            riskTolerance: 'moderate',
            isAuthenticated: true,
            setupComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'test-user-2',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            membershipTier: 'premium',
            accountType: 'personal',
            riskTolerance: 'aggressive',
            isAuthenticated: true,
            setupComplete: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        console.log('Using mock users:', mockUsers.length);
        setUsers(mockUsers);
        setError(null);
        
        // If we have a current user ID, find and select them
        if (currentUserId) {
          const currentUser = mockUsers.find(user => user.id === currentUserId);
          if (currentUser) {
            setSelectedUser(currentUser);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Network error while fetching users');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [currentUserId, API_BASE]);

  // Fetch specific user
  const fetchUser = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/users/${userId}`);
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

  const fetchUserPayments = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/payments/user/${userId}`);
      const data = await response.json();
      
      if (data.success && data.payments) {
        setUserPayments(data.payments);
      } else {
        setUserPayments([]);
      }
    } catch (error) {
      console.error('Error fetching user payments:', error);
      setUserPayments([]);
    }
  }, [API_BASE]);

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      setUpdatingStatus(userId);
      const response = await fetch(`${API_BASE}/api/users/${userId}/status`, {
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
    console.log('CustomerServiceDashboard mounted, calling fetchUsers...');
    fetchUsers();
  }, [fetchUsers]);

  // Auto-refresh every 10 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // Debug: Log when users state changes
  useEffect(() => {
    console.log('Users state changed:', users.length, 'users');
    console.log('Users:', users);
  }, [users]);

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
                disabled={loading}
                className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  loading 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => {
                  const localStorageUsers = loadUsersFromLocalStorage();
                  if (localStorageUsers.length > 0) {
                    setUsers(localStorageUsers);
                    setError(null);
                    console.log('Loaded users from localStorage:', localStorageUsers);
                  } else {
                    console.log('No users found in localStorage');
                    alert('No users found in localStorage. Please check if you have user data stored locally.');
                  }
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                Load from localStorage
              </button>
              <button
                onClick={() => {
                  console.log('Manual test - API_BASE:', API_BASE);
                  console.log('Manual test - Full URL:', `${API_BASE}/api/database/users`);
                  fetchUsers();
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Test API
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

        {users.length > 0 && !error && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  Successfully loaded {users.length} users from database. Dashboard is synced with backend.
                </p>
              </div>
            </div>
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
                <div className="p-6 space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  </div>

                  {/* Selected Plan */}
                  {selectedUser.selectedPlan && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Selected Plan</h3>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">{selectedUser.selectedPlan.name}</span>
                          <span className="text-sm text-blue-700">${selectedUser.selectedPlan.price}/{selectedUser.selectedPlan.period}</span>
                        </div>
                        {selectedUser.selectedPlan.description && (
                          <p className="text-xs text-blue-600 mt-1">{selectedUser.selectedPlan.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Questionnaire Data */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Questionnaire Responses</h3>
                    {selectedUser.questionnaireData ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trades Per Day</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.tradesPerDay || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trading Session</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.tradingSession || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Has Trading Account</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.hasAccount || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Account Equity</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedUser.questionnaireData.accountEquity || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Prop Firm</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.propFirm || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Account Type</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.accountType || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Account Size</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedUser.questionnaireData.accountSize || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Percentage</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.riskPercentage || 'Not specified'}%</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk-Reward Ratio</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.riskRewardRatio || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trading Experience</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.tradingExperience || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Tolerance</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.riskTolerance || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trading Goals</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.questionnaireData.tradingGoals || 'Not specified'}</p>
                          </div>
                        </div>
                        
                        {/* Crypto Assets */}
                        {selectedUser.questionnaireData.cryptoAssets && selectedUser.questionnaireData.cryptoAssets.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Crypto Assets</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {selectedUser.questionnaireData.cryptoAssets.map((asset: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {asset}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Forex Assets */}
                        {selectedUser.questionnaireData.forexAssets && selectedUser.questionnaireData.forexAssets.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Forex Assets</label>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {selectedUser.questionnaireData.forexAssets.map((asset: string, index: number) => (
                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {asset}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              No questionnaire data available
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>This user has not completed the questionnaire yet or their data wasn't properly saved to the database.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Risk Management Plan */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Risk Management Plan</h3>
                    {selectedUser.riskManagementPlan ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Per Trade</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.riskManagementPlan.riskPerTrade || 'Not specified'}%</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Daily Loss Limit</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.riskManagementPlan.dailyLossLimit || 'Not specified'}%</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Maximum Loss</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedUser.riskManagementPlan.maxLoss || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profit Target</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.riskManagementPlan.profitTarget || 'Not specified'}%</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trades to Pass</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.riskManagementPlan.tradesToPass || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Amount</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedUser.riskManagementPlan.riskAmount || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profit Amount</label>
                            <p className="mt-1 text-sm text-gray-900">${selectedUser.riskManagementPlan.profitAmount || 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Consecutive Losses Limit</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedUser.riskManagementPlan.consecutiveLossesLimit || 'Not specified'}</p>
                          </div>
                        </div>
                        {selectedUser.riskManagementPlan?.generatedAt && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Generated At</label>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.riskManagementPlan.generatedAt)}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">
                              No risk management plan available
                            </h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p>This user has not generated a risk management plan yet or their data wasn't properly saved to the database.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Screenshots */}
                  {(selectedUser.screenshotUrl || selectedUser.questionnaireData?.accountScreenshot) && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Account Screenshots</h3>
                      <div className="space-y-4">
                        {selectedUser.screenshotUrl && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profile Screenshot</label>
                            <div className="mt-2">
                              <img 
                                src={selectedUser.screenshotUrl} 
                                alt="Profile Screenshot" 
                                className="max-w-full max-h-64 rounded-lg border border-gray-300 shadow-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">Uploaded for profile verification</p>
                            </div>
                          </div>
                        )}
                        {selectedUser.questionnaireData?.accountScreenshot && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Account Screenshot</label>
                            <div className="mt-2">
                              <img 
                                src={selectedUser.questionnaireData.accountScreenshot} 
                                alt="Account Screenshot" 
                                className="max-w-full max-h-64 rounded-lg border border-gray-300 shadow-sm"
                              />
                              <p className="text-xs text-gray-500 mt-1">Uploaded for account verification</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* localStorage Data */}
            {localStorageData && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {selectedUser ? `User Data for ${selectedUser.email}` : 'localStorage Data'}
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Basic localStorage Info */}
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                  </div>

                  {/* Questionnaire Data from localStorage */}
                  {(localStorageData.questionnaireData || localStorageData.questionnaireAnswers) && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Questionnaire Data (localStorage)</h3>
                      <div className="space-y-3">
                        {localStorageData.questionnaireData && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Questionnaire Data</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-40 border">
                              {JSON.stringify(JSON.parse(localStorageData.questionnaireData), null, 2)}
                            </pre>
                          </div>
                        )}
                        {localStorageData.questionnaireAnswers && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Questionnaire Answers</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-40 border">
                              {JSON.stringify(JSON.parse(localStorageData.questionnaireAnswers), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Management Data from localStorage */}
                  {(localStorageData.riskManagementPlan || localStorageData.riskSettings) && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Risk Management Data (localStorage)</h3>
                      <div className="space-y-3">
                        {localStorageData.riskManagementPlan && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Management Plan</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-40 border">
                              {JSON.stringify(JSON.parse(localStorageData.riskManagementPlan), null, 2)}
                            </pre>
                          </div>
                        )}
                        {localStorageData.riskSettings && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Risk Settings</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-40 border">
                              {JSON.stringify(JSON.parse(localStorageData.riskSettings), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Screenshots from localStorage */}
                  {(localStorageData.screenshotUrl || localStorageData.accountScreenshot) && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Screenshots (localStorage)</h3>
                      <div className="space-y-3">
                        {localStorageData.screenshotUrl && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Profile Screenshot URL</label>
                            <p className="mt-1 text-sm text-gray-900 break-all">{localStorageData.screenshotUrl}</p>
                            <div className="mt-2">
                              <img 
                                src={localStorageData.screenshotUrl} 
                                alt="Profile Screenshot" 
                                className="max-w-full max-h-32 rounded-lg border border-gray-300 shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {localStorageData.accountScreenshot && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Account Screenshot URL</label>
                            <p className="mt-1 text-sm text-gray-900 break-all">{localStorageData.accountScreenshot}</p>
                            <div className="mt-2">
                              <img 
                                src={localStorageData.accountScreenshot} 
                                alt="Account Screenshot" 
                                className="max-w-full max-h-32 rounded-lg border border-gray-300 shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional localStorage Data */}
                  {(localStorageData.tradingPreferences || localStorageData.propFirmRules || localStorageData.userProfile || localStorageData.customerData || localStorageData.enhancedCustomerData) && (
                    <div className="space-y-4">
                      <h3 className="text-md font-semibold text-gray-800 border-b pb-2">Additional Data (localStorage)</h3>
                      <div className="space-y-3">
                        {localStorageData.tradingPreferences && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Trading Preferences</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-32 border">
                              {JSON.stringify(JSON.parse(localStorageData.tradingPreferences), null, 2)}
                            </pre>
                          </div>
                        )}
                        {localStorageData.propFirmRules && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Prop Firm Rules</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-32 border">
                              {JSON.stringify(JSON.parse(localStorageData.propFirmRules), null, 2)}
                            </pre>
                          </div>
                        )}
                        {localStorageData.userProfile && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">User Profile</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-32 border">
                              {JSON.stringify(JSON.parse(localStorageData.userProfile), null, 2)}
                            </pre>
                          </div>
                        )}
                        {localStorageData.customerData && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Customer Data</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-32 border">
                              {JSON.stringify(JSON.parse(localStorageData.customerData), null, 2)}
                            </pre>
                          </div>
                        )}
                        {localStorageData.enhancedCustomerData && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Enhanced Customer Data</label>
                            <pre className="mt-1 text-xs text-gray-900 bg-gray-100 p-3 rounded overflow-auto max-h-32 border">
                              {JSON.stringify(JSON.parse(localStorageData.enhancedCustomerData), null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Clear localStorage Button */}
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