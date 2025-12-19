// Quantum Admin Service - REAL Database Integration (NO PREFILLED DATA)
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5002';
const API_KEY = 'quantum_key_2025'; // API key for secure access

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

  // Fetch all users from the real-time database with API key authentication
  async fetchUsers(): Promise<QuantumUser[]> {
    try {
      console.log('🔍 Fetching users from real-time database with API key...');
      
      const response = await fetch(`${this.baseUrl}/api/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real-time data fetched successfully:', data);

        if (data.success && data.users && Array.isArray(data.users)) {
          const transformedUsers = this.transformUsers(data.users);
          console.log(`📊 Transformed ${transformedUsers.length} real users from database`);
          return transformedUsers;
        } else {
          console.log('❌ Invalid response format:', data);
          return [];
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ API request failed: ${response.status}`, errorText);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching users from real-time database:', error);
      return [];
    }
  }

  // Transform database users to QuantumUser format with comprehensive account data
  private transformUsers(users: any[]): QuantumUser[] {
    return users.map((user, index) => {
      // Calculate current equity and P&L based on account data
      const accountSize = user.account_size || user.accountSize || 50000;
      const currentEquity = user.current_equity || user.currentEquity || accountSize;
      const totalPnl = currentEquity - accountSize;
      
      // Calculate win rate and total trades from trading data
      const winRate = user.win_rate || user.winRate || 0;
      const totalTrades = user.total_trades || user.totalTrades || 0;
      
      // Determine status from multiple possible fields
      const status = this.mapStatus(
        user.status || 
        user.account_status || 
        user.payment_status || 
        'PENDING'
      );

      return {
        id: user.id?.toString() || `user_${index}`,
        uniqueId: user.unique_id || user.uniqueId || user.uuid || `CUS-${String(index + 1).padStart(3, '0')}`,
        email: user.email || 'no-email@example.com',
        name: user.username || user.fullName || user.name || 'Unknown User',
        membershipTier: user.membership_tier || user.plan_type || 'Basic',
        status: status,
        accountSize: accountSize,
        currentEquity: currentEquity,
        totalPnl: totalPnl,
        winRate: winRate,
        totalTrades: totalTrades,
        lastActive: user.last_active || user.lastActive || user.last_login || new Date().toISOString(),
        createdAt: user.created_at || user.createdAt || new Date().toISOString(),
        propFirm: user.prop_firm || user.propFirm || 'Not Set',
        accountType: user.account_type || user.accountType || 'Challenge',
        tradingExperience: user.trading_experience || user.tradingExperience || 'Beginner',
        riskTolerance: user.risk_tolerance || user.riskTolerance || 'Moderate',
        questionnaireData: user.questionnaire_data || user.questionnaireData || null,
        riskManagementPlan: user.risk_management_plan || user.riskManagementPlan || null,
        paymentStatus: user.payment_status || user.paymentStatus || 'pending',
        isActive: user.is_active !== undefined ? user.is_active : true,
        isVerified: user.is_verified !== undefined ? user.is_verified : false,
      };
    });
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

  // Fetch individual user with API key authentication
  async fetchUserById(userId: string): Promise<QuantumUser | null> {
    try {
      console.log(`🔍 Fetching user ${userId} from real-time database...`);
      
      const response = await fetch(`${this.baseUrl}/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const transformedUser = this.transformUsers([data.user])[0];
          console.log(`✅ Fetched user ${userId} from real-time database`);
          return transformedUser;
        }
      }
      
      console.log(`❌ Failed to fetch user ${userId}`);
      return null;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      return null;
    }
  }

  // Update user data with real-time API call
  async updateUser(userId: string, updates: QuantumUserUpdate): Promise<boolean> {
    try {
      console.log('🔄 Updating user in real-time database:', userId, updates);
      
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ User updated successfully in real-time database');
          return true;
        }
      }
      
      console.log(`❌ Failed to update user ${userId}`);
      return false;
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
