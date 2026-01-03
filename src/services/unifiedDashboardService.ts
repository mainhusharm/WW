/**
 * Unified Dashboard Service
 * Fetches dashboard data from the unified trading_bots.db database
 * Replaces customer-service-dashboard dependencies
 */

export interface UnifiedDashboardData {
  userProfile: {
    email: string;
    username: string;
    planType: string;
    createdAt: string;
    propFirm: string;
    accountType: string;
    accountSize: number | string;
    experience: string;
    tradesPerDay: string;
    riskPerTrade: string;
    riskReward: string;
    session: string;
  };
  performance: {
    accountBalance: number;
    currentEquity: number;
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    winningTrades?: number;
    losingTrades?: number;
    averageWin?: number;
    averageLoss?: number;
    profitFactor?: number;
    maxDrawdown?: number;
    currentDrawdown?: number;
    grossProfit?: number;
    grossLoss?: number;
    consecutiveWins?: number;
    consecutiveLosses?: number;
  };
  paymentInfo: {
    planName: string;
    finalPrice: number;
    paymentMethod: string;
    paymentStatus: string;
    transactionId: string;
  };
  tradingSetup: {
    propFirm: string;
    accountSize: number;
    riskPercentage: number;
    tradesPerDay: string;
  };
  propFirmRules: any;
  riskProtocol: any;
  assets: {
    crypto: string[];
    forex: string[];
  };
  tradingState?: any;
  dataSource: string;
  lastUpdated: string;
}

export interface UnifiedUserSummary {
  email: string;
  username: string;
  planType: string;
  createdAt: string;
  paymentInfo: {
    planName: string;
    finalPrice: number;
    paymentStatus: string;
  };
  tradingSetup: {
    propFirm: string;
    accountSize: number;
    riskPercentage: number;
  };
  performance: {
    currentEquity: number;
    totalPnL: number;
    winRate: number;
    totalTrades: number;
  };
}

export interface UnifiedDashboardStats {
  totalUsers: number;
  totalPayments: number;
  totalQuestionnaires: number;
  totalDashboardUpdates: number;
  totalRevenue: number;
  paidUsers: number;
  averageEquity: number;
  averagePnL: number;
  averageWinRate: number;
  dataSource: string;
  lastUpdated: string;
}

class UnifiedDashboardService {
  private static instance: UnifiedDashboardService;
  private baseURL: string;

  private constructor() {
    // Use the appropriate base URL based on environment
    this.baseURL = window.location.hostname === 'localhost' 
      ? 'http://localhost:5004/api/dashboard'
      : 'https://traderedgepro.com/api/dashboard';
  }

  public static getInstance(): UnifiedDashboardService {
    if (!UnifiedDashboardService.instance) {
      UnifiedDashboardService.instance = new UnifiedDashboardService();
    }
    return UnifiedDashboardService.instance;
  }

  /**
   * Get comprehensive dashboard data for a specific user
   */
  async getUserDashboardData(userEmail: string): Promise<UnifiedDashboardData | null> {
    try {
      console.log(`🔄 Fetching unified dashboard data for: ${userEmail}`);
      
      const response = await fetch(`${this.baseURL}/user/${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Unified dashboard data retrieved for ${userEmail}:`, data);
      
      return data;
    } catch (error) {
      console.error(`❌ Error fetching unified dashboard data for ${userEmail}:`, error);
      return null;
    }
  }

  /**
   * Get dashboard data for all users
   */
  async getAllUsersDashboardData(): Promise<{ users: UnifiedUserSummary[]; count: number } | null> {
    try {
      console.log('🔄 Fetching unified dashboard data for all users');
      
      const response = await fetch(`${this.baseURL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Unified dashboard data retrieved for ${data.count} users`);
      
      return {
        users: data.users,
        count: data.count
      };
    } catch (error) {
      console.error('❌ Error fetching unified dashboard data for all users:', error);
      return null;
    }
  }

  /**
   * Get overall dashboard statistics
   */
  async getDashboardStats(): Promise<UnifiedDashboardStats | null> {
    try {
      console.log('🔄 Fetching unified dashboard statistics');
      
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const stats = await response.json();
      console.log('✅ Unified dashboard statistics retrieved:', stats);
      
      return stats;
    } catch (error) {
      console.error('❌ Error fetching unified dashboard statistics:', error);
      return null;
    }
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ Unified dashboard service health check failed:', error);
      return false;
    }
  }

  /**
   * Convert unified dashboard data to the format expected by existing Dashboard component
   */
  convertToLegacyFormat(unifiedData: UnifiedDashboardData): any {
    return {
      userProfile: unifiedData.userProfile,
      performance: unifiedData.performance,
      propFirmRules: unifiedData.propFirmRules,
      riskProtocol: unifiedData.riskProtocol,
      assets: unifiedData.assets,
      account: {
        balance: unifiedData.performance.accountBalance,
        equity: unifiedData.performance.currentEquity,
      },
      // Add trading state if available
      ...(unifiedData.tradingState && { tradingState: unifiedData.tradingState }),
      // Add data source information
      dataSource: unifiedData.dataSource,
      lastUpdated: unifiedData.lastUpdated
    };
  }

  /**
   * Enhanced method that tries unified service first, then falls back to existing methods
   */
  async getDashboardDataWithFallback(userEmail: string): Promise<any> {
    try {
      // Try unified service first
      const unifiedData = await this.getUserDashboardData(userEmail);
      
      if (unifiedData) {
        console.log('✅ Using unified dashboard data from trading_bots.db');
        return this.convertToLegacyFormat(unifiedData);
      }
      
      // If unified service fails, log it but don't throw
      console.warn('⚠️ Unified dashboard service unavailable, using fallback methods');
      return null;
      
    } catch (error) {
      console.error('❌ Error in unified dashboard service:', error);
      return null;
    }
  }
}

// Export singleton instance
const unifiedDashboardService = UnifiedDashboardService.getInstance();
export default unifiedDashboardService;

// Also export the class for direct instantiation if needed
export { UnifiedDashboardService };
