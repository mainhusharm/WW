import { SignalMeta } from '../services/signalScoringService';

export interface SignalWithMeta {
  id: string;
  symbol: string;
  pair: string;
  direction: string;
  entry: string;
  stopLoss: string;
  takeProfit: string | string[];
  timestamp: string;
  confidence?: string;
  is_recommended?: boolean;
  // Add other existing signal fields
  meta?: SignalMeta;
}

class SignalMetaApiService {
  private baseUrl: string;

  constructor() {
    // Use your ForexData bot API base URL
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
  }

  /**
   * Fetch signals with metadata
   */
  async getSignalsWithMeta(params?: {
    limit?: number;
    offset?: number;
    milestone?: 'M1' | 'M2' | 'M3' | 'M4';
    with_meta?: boolean;
  }): Promise<SignalWithMeta[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.milestone) queryParams.append('milestone', params.milestone);
      if (params?.with_meta !== false) queryParams.append('with_meta', 'true');

      const response = await fetch(`${this.baseUrl}/signals?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.signals || [];
    } catch (error) {
      console.error('Error fetching signals with metadata:', error);
      throw error;
    }
  }

  /**
   * Get metadata for a specific signal
   */
  async getSignalMeta(signalId: string): Promise<SignalMeta | null> {
    try {
      const response = await fetch(`${this.baseUrl}/signals/${signalId}/meta`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No metadata found
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching metadata for signal ${signalId}:`, error);
      return null;
    }
  }

  /**
   * Trigger scoring for a specific signal (for manual rescoring)
   */
  async triggerSignalScoring(signalId: string): Promise<SignalMeta> {
    try {
      const response = await fetch(`${this.baseUrl}/signals/${signalId}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error triggering scoring for signal ${signalId}:`, error);
      throw error;
    }
  }

  /**
   * Get milestone statistics
   */
  async getMilestoneStats(): Promise<{
    M1: { count: number; winRate: number };
    M2: { count: number; winRate: number };
    M3: { count: number; winRate: number };
    M4: { count: number; winRate: number };
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/signals/milestone-stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching milestone statistics:', error);
      throw error;
    }
  }

  /**
   * Update scoring configuration (for calibration)
   */
  async updateScoringConfig(config: {
    weights?: Record<string, number>;
    thresholds?: {
      M1?: { min_confidence: number; min_confirmations: number };
      M2?: { min_confidence: number; min_confirmations: number };
      M3?: { min_confidence: number; min_confirmations: number };
      M4?: { min_confidence: number; min_confirmations: number };
    };
  }): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/signals/scoring-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating scoring configuration:', error);
      throw error;
    }
  }
}

export const signalMetaApi = new SignalMetaApiService();
export default signalMetaApi;
