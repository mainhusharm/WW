import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabaseApi } from '../lib/supabase';

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
  accountNumber?: string;
  customForexPairs?: string[];
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
  paymentData?: any;
  dashboardData?: any;
}

interface LocalStorageData {
  userId: string;
  userData: string;
  userEmail: string;
  userFullName: string;
  registrationTime: string;
  questionnaireData: string | null;
  questionnaireAnswers: string | null;
  riskManagementData: string | null;
  additionalData: string | null;
  propFirmRules: string | null;
}

export default function CustomerServiceDashboardSupabase() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localStorageData, setLocalStorageData] = useState<LocalStorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [searchParams] = useSearchParams();
  const currentUserId = searchParams.get('userId');

  // Load localStorage data for selected user
  useEffect(() => {
    const loadLocalStorageData = () => {
      if (selectedUser) {
        // Show selected user's actual data from Supabase
        const data = {
          userId: selectedUser.id,
          userData: selectedUser.email,
          userEmail: selectedUser.email,
          userFullName: selectedUser.fullName || selectedUser.email.split('@')[0],
          registrationTime: selectedUser.createdAt,
          questionnaireData: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
          questionnaireAnswers: selectedUser.questionnaireData ? JSON.stringify(selectedUser.questionnaireData) : null,
          riskManagementData: selectedUser.riskManagementPlan ? JSON.stringify(selectedUser.riskManagementPlan) : null,
          additionalData: selectedUser.dashboardData ? JSON.stringify(selectedUser.dashboardData) : null,
          propFirmRules: selectedUser.questionnaireData?.propFirm ? JSON.stringify({
            name: `${selectedUser.questionnaireData.propFirm} ${selectedUser.questionnaireData.accountType}`,
            challengeType: selectedUser.questionnaireData.accountType,
            dailyLossLimit: `$${selectedUser.questionnaireData.accountSize ? (selectedUser.questionnaireData.accountSize * 0.05).toFixed(0) : '500'}`,
            maxDrawdown: `$${selectedUser.questionnaireData.accountSize ? (selectedUser.questionnaireData.accountSize * 0.1).toFixed(0) : '1000'}`,
            profitTarget: `$${selectedUser.questionnaireData.accountSize ? (selectedUser.questionnaireData.accountSize * 0.1).toFixed(0) : '1000'}`,
            minTradingDays: '5',
            weekendHolding: 'Allowed',
            newsTrading: 'Allowed',
            description: `Professional trading rules for ${selectedUser.questionnaireData.accountType.toLowerCase()} account. Focus on consistent profitability while managing risk effectively.`
          }) : null
        };
        setLocalStorageData(data);
      }
    };

    loadLocalStorageData();
  }, [selectedUser]);

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Starting fetchUsers from Supabase...');
      setLoading(true);
      
      // Fetch all user data from Supabase tables
      const [userDetails, paymentDetails, questionnaireDetails, dashboardDetails] = await Promise.all([
        supabaseApi.getUserDetails().catch(() => []),
        supabaseApi.getPaymentDetails().catch(() => []),
        supabaseApi.getQuestionnaireDetails().catch(() => []),
        supabaseApi.getUserDashboards().catch(() => [])
      ]);
      
      console.log('Supabase data fetched:', {
        userDetails: userDetails.length,
        paymentDetails: paymentDetails.length,
        questionnaireDetails: questionnaireDetails.length,
        dashboardDetails: dashboardDetails.length
      });
      
      // Combine all data by user email
      const userMap = new Map();
      
      // Process user details
      userDetails.forEach((user: any) => {
        userMap.set(user.email, {
          id: user.id,
          email: user.email,
          fullName: user.full_name || user.name || user.email.split('@')[0],
          selectedPlan: null,
          questionnaireData: null,
          cryptoAssets: [],
          forexPairs: [],
          otherForexPair: null,
          screenshotUrl: null,
          riskManagementPlan: null,
          tradingPreferences: {},
          status: 'PENDING',
          planActivatedAt: null,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          paymentData: null,
          dashboardData: null
        });
      });
      
      // Process payment details
      paymentDetails.forEach((payment: any) => {
        const user = userMap.get(payment.user_email);
        if (user) {
          user.paymentData = payment;
          user.selectedPlan = {
            name: payment.plan_name_payment,
            price: payment.original_price,
            finalPrice: payment.final_price,
            status: payment.payment_status
          };
          user.status = payment.payment_status === 'completed' ? 'ACTIVE' : 'PENDING';
        }
      });
      
      // Process questionnaire details
      questionnaireDetails.forEach((questionnaire: any) => {
        const user = userMap.get(questionnaire.user_email);
        if (user) {
          user.questionnaireData = {
            tradesPerDay: questionnaire.trades_per_day,
            tradingSession: questionnaire.trading_session,
            cryptoAssets: questionnaire.crypto_assets || [],
            forexAssets: questionnaire.forex_assets || [],
            hasAccount: questionnaire.has_account,
            accountEquity: questionnaire.account_equity,
            propFirm: questionnaire.prop_firm,
            accountType: questionnaire.account_type,
            accountSize: questionnaire.account_size,
            riskPercentage: questionnaire.risk_percentage,
            riskRewardRatio: questionnaire.risk_reward_ratio,
            accountNumber: questionnaire.account_number,
            customForexPairs: questionnaire.custom_forex_pairs || []
          };
          user.cryptoAssets = questionnaire.crypto_assets || [];
          user.forexPairs = questionnaire.forex_assets || [];
          user.otherForexPair = questionnaire.custom_forex_pairs?.[0] || null;
        }
      });
      
      // Process dashboard details
      dashboardDetails.forEach((dashboard: any) => {
        const user = userMap.get(dashboard.user_email);
        if (user) {
          user.dashboardData = dashboard;
          user.riskManagementPlan = {
            riskPerTrade: dashboard.risk_per_trade_percentage || 1,
            dailyLossLimit: dashboard.daily_loss_limit || 5,
            maxLoss: dashboard.max_drawdown_limit || 1000,
            profitTarget: dashboard.total_pnl || 0,
            tradesToPass: dashboard.total_trades || 0,
            riskAmount: dashboard.risk_per_trade_amount || 100,
            profitAmount: dashboard.total_pnl || 0,
            consecutiveLossesLimit: dashboard.consecutive_losses_limit || 3
          };
        }
      });
      
      // Convert map to array
      const transformedUsers = Array.from(userMap.values());
      
      console.log('Transformed users from Supabase:', transformedUsers.length);
      setUsers(transformedUsers);
      setError(null);
      
      // If we have a current user ID, find and select them
      if (currentUserId) {
        const currentUser = transformedUsers.find((user: any) => user.id === currentUserId);
        if (currentUser) {
          setSelectedUser(currentUser);
        }
      }
      
    } catch (error) {
      console.error('Error fetching users from Supabase:', error);
      setError('Failed to load users from Supabase. Please try again.');
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, [currentUserId]);

  // Initial load
  useEffect(() => {
    console.log('CustomerServiceDashboardSupabase mounted, calling fetchUsers...');
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
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Customer Service Dashboard (Supabase)
              </h1>
              <p className="mt-2 text-gray-600">
                Real-time user management and monitoring from Supabase database
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
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Users List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Users ({users.length})</h2>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName || 'No Name'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                            {user.status}
                          </span>
                          {user.selectedPlan && (
                            <span className="text-xs text-gray-500">
                              {user.selectedPlan.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Joined: {formatDate(user.createdAt)}
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No users found in Supabase database
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="lg:col-span-2">
            {selectedUser ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">User Details</h2>
                </div>
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h3>
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm text-gray-500">Name</dt>
                        <dd className="text-sm text-gray-900">{selectedUser.fullName || 'No Name'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{selectedUser.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd className="text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                            {selectedUser.status}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Joined</dt>
                        <dd className="text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Questionnaire Data */}
                  {selectedUser.questionnaireData && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Questionnaire Data (Supabase)</h3>
                      <div className="bg-gray-50 rounded-md p-4">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedUser.questionnaireData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Risk Management Data */}
                  {selectedUser.riskManagementPlan && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Risk Management Data (Supabase)</h3>
                      <div className="bg-gray-50 rounded-md p-4">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedUser.riskManagementPlan, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Dashboard Data */}
                  {selectedUser.dashboardData && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Dashboard Data (Supabase)</h3>
                      <div className="bg-gray-50 rounded-md p-4">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedUser.dashboardData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Payment Data */}
                  {selectedUser.paymentData && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Payment Data (Supabase)</h3>
                      <div className="bg-gray-50 rounded-md p-4">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {JSON.stringify(selectedUser.paymentData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No user selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a user from the list to view their details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
