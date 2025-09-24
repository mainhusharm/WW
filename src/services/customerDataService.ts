import api from '../api';

export interface CustomerProfile {
  userId: string;
  email: string;
  plan: string;
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface QuestionnaireData {
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
  updatedAt: string;
}

export interface SignalStats {
  wins: number;
  losses: number;
  skipped: number;
  lastUpdated: string;
}

export interface TradeRecord {
  timestamp: string;
  symbol: string;
  side: 'BUY' | 'SELL' | 'LONG' | 'SHORT';
  entry: number;
  stopLoss: number;
  takeProfit: number;
  result: 'win' | 'loss' | 'breakeven' | 'pending';
  pnl?: number;
  signalId?: string;
}

export interface ActivityLog {
  timestamp: string;
  type: string;
  meta: any;
}

export interface AccountMeta {
  propFirm: string;
  model: string;
  accountType: string;
  accountSize: number;
  equity: number;
}

export interface CustomerData {
  profile: CustomerProfile;
  questionnaire: QuestionnaireData;
  signals: SignalStats;
  trades: TradeRecord[];
  activityLog: ActivityLog[];
  accountMeta: AccountMeta;
}

class CustomerDataService {
  private static instance: CustomerDataService;
  private retryLimit = 3;
  private retryDelay = 2000;

  private constructor() {}

  public static getInstance(): CustomerDataService {
    if (!CustomerDataService.instance) {
      CustomerDataService.instance = new CustomerDataService();
    }
    return CustomerDataService.instance;
  }

  // Save customer data with atomic upsert
  public async saveCustomerData(userId: string, data: Partial<CustomerData>): Promise<boolean> {
    let retryCount = 0;
    
    while (retryCount < this.retryLimit) {
      try {
        const response = await api.post('/api/customer-data/save', {
          userId,
          data,
          timestamp: new Date().toISOString()
        });
        
        if (response.status === 200) {
          console.log(`Customer data saved successfully for user ${userId}`);
          return true;
        } else {
          throw new Error(`Backend returned status ${response.status}`);
        }
      } catch (error) {
        retryCount++;
        console.error(`Attempt ${retryCount} failed to save customer data for user ${userId}:`, error);
        
        if (retryCount >= this.retryLimit) {
          console.error(`Failed to save customer data after ${this.retryLimit} attempts`);
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * retryCount));
      }
    }
    
    return false;
  }

  // Get customer data by ID or email
  public async getCustomerData(identifier: string, type: 'id' | 'email' = 'id'): Promise<CustomerData | null> {
    try {
      const response = await api.get(`/api/customer-data/${type}/${identifier}`);
      
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error fetching customer data for ${type} ${identifier}:`, error);
      return null;
    }
  }

  // Save questionnaire response
  public async saveQuestionnaire(userId: string, questionnaireData: QuestionnaireData): Promise<boolean> {
    try {
      const success = await this.saveCustomerData(userId, {
        questionnaire: {
          ...questionnaireData,
          updatedAt: new Date().toISOString()
        }
      });
      
      if (success) {
        // Also update account meta if available
        if (questionnaireData.propFirm && questionnaireData.accountSize) {
          await this.saveCustomerData(userId, {
            accountMeta: {
              propFirm: questionnaireData.propFirm,
              model: questionnaireData.accountType,
              accountType: questionnaireData.accountType,
              accountSize: typeof questionnaireData.accountSize === 'string' ? parseFloat(questionnaireData.accountSize) : questionnaireData.accountSize,
              equity: typeof questionnaireData.accountEquity === 'string' ? parseFloat(questionnaireData.accountEquity) : (questionnaireData.accountEquity || 0)
            }
          });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      return false;
    }
  }

  // Record trade outcome
  public async recordTrade(userId: string, trade: TradeRecord): Promise<boolean> {
    try {
      // Get current customer data
      const currentData = await this.getCustomerData(userId);
      if (!currentData) {
        console.error(`Customer data not found for user ${userId}`);
        return false;
      }

      // Add new trade
      const updatedTrades = [...currentData.trades, trade];
      
      // Update signal stats
      const updatedSignals = { ...currentData.signals };
      if (trade.result === 'win') {
        updatedSignals.wins++;
      } else if (trade.result === 'loss') {
        updatedSignals.losses++;
      } else if (trade.result === 'breakeven') {
        updatedSignals.skipped++;
      }
      updatedSignals.lastUpdated = new Date().toISOString();

      // Save updated data
      const success = await this.saveCustomerData(userId, {
        trades: updatedTrades,
        signals: updatedSignals
      });

      if (success) {
        // Log activity
        await this.logActivity(userId, 'trade_recorded', {
          tradeId: trade.signalId || 'manual',
          symbol: trade.symbol,
          result: trade.result,
          pnl: trade.pnl
        });
      }

      return success;
    } catch (error) {
      console.error('Error recording trade:', error);
      return false;
    }
  }

  // Log user activity
  public async logActivity(userId: string, activityType: string, meta: any): Promise<boolean> {
    try {
      const activity: ActivityLog = {
        timestamp: new Date().toISOString(),
        type: activityType,
        meta
      };

      const currentData = await this.getCustomerData(userId);
      if (!currentData) {
        console.error(`Customer data not found for user ${userId}`);
        return false;
      }

      const updatedActivities = [...currentData.activityLog, activity];
      
      return await this.saveCustomerData(userId, {
        activityLog: updatedActivities
      });
    } catch (error) {
      console.error('Error logging activity:', error);
      return false;
    }
  }

  // Search customers
  public async searchCustomers(query: string): Promise<CustomerProfile[]> {
    try {
      const response = await api.get(`/api/customer-data/search?q=${encodeURIComponent(query)}`);
      
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      return [];
    }
  }

  // Get customer statistics
  public async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    newThisMonth: number;
    topPerforming: CustomerProfile[];
  }> {
    try {
      const response = await api.get('/api/customer-data/stats');
      
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        return {
          totalCustomers: 0,
          activeCustomers: 0,
          newThisMonth: 0,
          topPerforming: []
        };
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        newThisMonth: 0,
        topPerforming: []
      };
    }
  }

  // Export customer data
  public async exportCustomerData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string | null> {
    try {
      const response = await api.get(`/api/customer-data/export/${userId}?format=${format}`);
      
      if (response.status === 200 && response.data) {
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error exporting customer data:', error);
      return null;
    }
  }
}

export default CustomerDataService.getInstance();
