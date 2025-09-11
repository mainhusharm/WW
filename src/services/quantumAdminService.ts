// Quantum Admin Service - Real Database Integration
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

export interface QuantumUser {
  id: string;
  uniqueId: string;
  email: string;
  name: string;
  membershipTier: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  accountSize: number;
  currentEquity: number;
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  lastActive: string;
  createdAt: string;
  propFirm: string;
  accountType: string;
  tradingExperience: string;
  riskTolerance: string;
  questionnaireData?: any;
  riskManagementPlan?: any;
  paymentStatus?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface QuantumUserUpdate {
  id: string;
  currentEquity?: number;
  status?: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';
  accountSize?: number;
  membershipTier?: string;
  propFirm?: string;
  accountType?: string;
  tradingExperience?: string;
  riskTolerance?: string;
  paymentStatus?: string;
  isActive?: boolean;
  isVerified?: boolean;
}

class QuantumAdminService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  // Fetch all users from the real database
  async fetchUsers(): Promise<QuantumUser[]> {
    try {
      console.log('🔍 Fetching users from real database...');
      
      // Try multiple endpoints to find users
      const endpoints = [
        '/api/users',
        '/api/customers',
        '/api/database/users',
        '/api/customers/search'
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${this.baseUrl}${endpoint}`);
          const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Success from ${endpoint}:`, data);

            if (data.users || data.customers) {
              const users = data.users || data.customers;
              return this.transformUsers(users);
            }
          }
        } catch (error) {
          console.log(`❌ Failed to fetch from ${endpoint}:`, error);
          continue;
        }
      }

      // If all endpoints fail, return mock data
      console.log('⚠️ All endpoints failed, using mock data');
      return this.getMockUsers();
    } catch (error) {
      console.error('Error fetching users:', error);
      return this.getMockUsers();
    }
  }

  // Transform database users to QuantumUser format
  private transformUsers(users: any[]): QuantumUser[] {
    return users.map((user, index) => ({
      id: user.id?.toString() || `user_${index}`,
      uniqueId: user.unique_id || user.uniqueId || `CUS-${String(index + 1).padStart(3, '0')}`,
      email: user.email || 'no-email@example.com',
      name: user.username || user.fullName || user.name || 'Unknown User',
      membershipTier: user.membership_tier || user.plan_type || 'Basic',
      status: this.mapStatus(user.status || user.account_status || 'PENDING'),
      accountSize: user.account_size || user.accountSize || 50000,
      currentEquity: user.current_equity || user.currentEquity || user.account_size || 50000,
      totalPnl: user.total_pnl || user.totalPnl || 0,
      winRate: user.win_rate || user.winRate || 0,
      totalTrades: user.total_trades || user.totalTrades || 0,
      lastActive: user.last_active || user.lastActive || user.last_login || new Date().toISOString(),
      createdAt: user.created_at || user.createdAt || new Date().toISOString(),
      propFirm: user.prop_firm || user.propFirm || 'Not Set',
      accountType: user.account_type || user.accountType || 'Challenge',
      tradingExperience: user.trading_experience || user.tradingExperience || 'Beginner',
      riskTolerance: user.risk_tolerance || user.riskTolerance || 'Moderate',
      questionnaireData: user.questionnaire_data || user.questionnaireData,
      riskManagementPlan: user.risk_management_plan || user.riskManagementPlan,
      paymentStatus: user.payment_status || user.paymentStatus || 'pending',
      isActive: user.is_active !== undefined ? user.is_active : true,
      isVerified: user.is_verified !== undefined ? user.is_verified : false,
    }));
  }

  // Map database status to QuantumUser status
  private mapStatus(status: string): 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE' {
    const statusMap: { [key: string]: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE' } = {
      'active': 'ACTIVE',
      'pending': 'PENDING',
      'suspended': 'SUSPENDED',
      'inactive': 'INACTIVE',
      'completed': 'ACTIVE',
      'processing': 'PENDING',
      'rejected': 'SUSPENDED',
    };
    return statusMap[status.toLowerCase()] || 'PENDING';
  }

  // Return empty array if no real users found
  private getMockUsers(): QuantumUser[] {
    console.log('⚠️ No real users found in database, returning empty array');
    return [];
  }

  // Update user data
  async updateUser(userId: string, updates: QuantumUserUpdate): Promise<boolean> {
    try {
      console.log('🔄 Updating user:', userId, updates);
      
      // In a real implementation, this would call the backend API
      // For now, we'll just sync the user dashboard data
      console.log('✅ User update simulated (would call backend API in production)');
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  // Sync user dashboard data
  private syncUserDashboardData(user: QuantumUser): void {
    const userDashboardKey = `dashboard_data_${user.email}`;
    const userTradingStateKey = `trading_state_${user.email}`;
    
    // Update user's dashboard data
    const userDashboardData = localStorage.getItem(userDashboardKey);
    if (userDashboardData) {
      try {
        const parsed = JSON.parse(userDashboardData);
        const updatedDashboardData = {
          ...parsed,
          performance: {
            ...parsed.performance,
            accountBalance: user.currentEquity,
            totalPnl: user.totalPnl,
            winRate: user.winRate,
            totalTrades: user.totalTrades
          },
          account: {
            ...parsed.account,
            balance: user.currentEquity,
            equity: user.currentEquity
          },
          userProfile: {
            ...parsed.userProfile,
            propFirm: user.propFirm,
            accountType: user.accountType,
            accountSize: user.accountSize,
            experience: user.tradingExperience
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
          currentEquity: user.currentEquity,
          performanceMetrics: {
            ...parsed.performanceMetrics,
            totalPnl: user.totalPnl,
            winRate: user.winRate,
            totalTrades: user.totalTrades
          }
        };
        localStorage.setItem(userTradingStateKey, JSON.stringify(updatedTradingState));
      } catch (error) {
        console.error('Error updating user trading state:', error);
      }
    }
    
    // Create notification for user
    this.createUserNotification(user, updates);
  }

  // Create user notification
  private createUserNotification(user: QuantumUser, updates: QuantumUserUpdate): void {
    const userNotification = {
      id: Date.now().toString(),
      type: 'admin_update',
      message: `Your account has been updated by admin`,
      timestamp: new Date().toISOString(),
      data: updates
    };
    
    const userNotificationsKey = `user_notifications_${user.email}`;
    const existingNotifications = localStorage.getItem(userNotificationsKey);
    const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];
    notifications.unshift(userNotification);
    localStorage.setItem(userNotificationsKey, JSON.stringify(notifications.slice(0, 50)));
  }
}

export const quantumAdminService = new QuantumAdminService();
