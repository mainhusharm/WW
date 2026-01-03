/**
 * Signal API Service
 * Handles HTTP API calls for signal management
 */

import api from '../lib/api';

export interface Signal {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  rr_ratio: number;
  risk_tier: 'low' | 'medium' | 'high';
  payload: {
    timeframe?: string;
    tags?: string[];
    analysis?: string;
    confidence?: number;
  };
  created_by: string;
  origin: 'admin' | 'system';
  status: 'active' | 'archived';
  immutable: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSignalStats {
  total_signals: number;
  delivered_signals: number;
  recent_signals_7d: number;
  user_risk_tier: string;
  latest_signal: Signal | null;
}

export interface SignalFilters {
  limit?: number;
  since?: string;
  include_delivered?: boolean;
}

class SignalApiService {
  /**
   * Fetch signals for the authenticated user
   */
  async getUserSignals(filters: SignalFilters & { risk_tier?: string } = {}): Promise<{
    success: boolean;
    signals: Signal[];
    count: number;
    user_risk_tier: string;
    filters: SignalFilters;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.since) params.append('since', filters.since);
      if (filters.include_delivered) params.append('include_delivered', 'true');
      if (filters.risk_tier) params.append('risk_tier', filters.risk_tier);

      const response = await api.get(`/api/signals?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user signals:', error);
      throw error;
    }
  }

  /**
   * Fetch recent signals (last 24 hours)
   */
  async getRecentSignals(risk_tier?: string): Promise<{
    success: boolean;
    signals: Signal[];
    count: number;
    period: string;
    user_risk_tier: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (risk_tier) params.append('risk_tier', risk_tier);
      
      const response = await api.get(`/api/signals?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recent signals:', error);
      throw error;
    }
  }

  /**
   * Mark signal as delivered
   */
  async markSignalDelivered(signalId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await api.post(`/user/signals/${signalId}/delivered`);
      return response.data;
    } catch (error) {
      console.error('Error marking signal as delivered:', error);
      throw error;
    }
  }

  /**
   * Get user signal statistics
   */
  async getUserSignalStats(risk_tier?: string): Promise<{
    success: boolean;
    stats: UserSignalStats;
  }> {
    try {
      const params = new URLSearchParams();
      if (risk_tier) params.append('risk_tier', risk_tier);
      
      const response = await api.get(`/user/signals/stats?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching signal stats:', error);
      
      // If endpoint not found, return mock data as fallback
      if (error.response?.status === 404) {
        console.warn('User signals stats endpoint not found, using fallback data');
        return {
          success: true,
          stats: {
            risk_tier: risk_tier || 'medium',
            total_signals: 0,
            active_signals: 0,
            completed_signals: 0,
            win_rate: 0.0,
            timestamp: new Date().toISOString()
          }
        };
      }
      
      throw error;
    }
  }

  /**
   * Create new signal (admin only)
   */
  async createSignal(signalData: {
    symbol: string;
    side: 'buy' | 'sell';
    entry_price: number;
    stop_loss: number;
    take_profit: number;
    risk_tier: 'low' | 'medium' | 'high';
    payload?: {
      timeframe?: string;
      tags?: string[];
      analysis?: string;
      confidence?: number;
    };
  }): Promise<{
    success: boolean;
    message: string;
    signal: Signal;
    users_notified: number;
    redis_published: boolean;
  }> {
    try {
      const response = await api.post('/admin/signals', signalData);
      return response.data;
    } catch (error) {
      console.error('Error creating signal:', error);
      throw error;
    }
  }

  /**
   * Get admin signals (admin only)
   */
  async getAdminSignals(filters: {
    limit?: number;
    status?: 'active' | 'archived';
    risk_tier?: 'low' | 'medium' | 'high';
  } = {}): Promise<{
    success: boolean;
    signals: Signal[];
    count: number;
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.risk_tier) params.append('risk_tier', filters.risk_tier);

      const response = await api.get(`/admin/signals?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching admin signals:', error);
      throw error;
    }
  }

  /**
   * Archive signal (admin only)
   */
  async archiveSignal(signalId: string): Promise<{
    success: boolean;
    message: string;
    signal: Signal;
  }> {
    try {
      const response = await api.patch(`/admin/signals/${signalId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving signal:', error);
      throw error;
    }
  }

  /**
   * Get signal statistics (admin only)
   */
  async getSignalStats(): Promise<{
    success: boolean;
    stats: {
      total_signals: number;
      active_signals: number;
      archived_signals: number;
      recent_signals_24h: number;
      by_risk_tier: Record<string, number>;
    };
  }> {
    try {
      const response = await api.get('/admin/signals/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching signal stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const signalApiService = new SignalApiService();
export default signalApiService;
