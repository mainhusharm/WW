import api from '../api';

export interface BotDataPayload {
  bot_type: 'crypto' | 'forex';
  pair: string;
  price: number;
  signal_type?: 'buy' | 'sell' | 'neutral';
  signal_strength?: number;
  is_recommended?: boolean;
  volume?: number;
  high?: number;
  low?: number;
  open_price?: number;
  close_price?: number;
  timeframe?: string;
}

export interface OHLCPayload {
  pair: string;
  timeframe: string;
  timestamp: string | number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface UserSignalPayload {
  user_id: string | number;
  pair: string;
  signal_type: 'buy' | 'sell' | 'neutral';
  result?: 'win' | 'loss' | 'skipped';
  confidence_pct?: number;
  is_recommended?: boolean;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  analysis?: string;
  ict_concepts?: string[];
  pnl?: number;
  notes?: string;
}

class BotDataService {
  /**
   * Store bot data in the database
   */
  async storeBotData(data: BotDataPayload): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const response = await api.post('/api/database/store-bot-data', data);
      return { success: true, id: response.data.id };
    } catch (error) {
      console.error('Error storing bot data:', error);
      return { success: false, error: 'Failed to store bot data' };
    }
  }

  /**
   * Store OHLC candle data in the database
   */
  async storeOHLCData(data: OHLCPayload): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const response = await api.post('/api/database/store-ohlc', data);
      return { success: true, id: response.data.id };
    } catch (error) {
      console.error('Error storing OHLC data:', error);
      return { success: false, error: 'Failed to store OHLC data' };
    }
  }

  /**
   * Store user signal in the database
   */
  async storeUserSignal(data: UserSignalPayload): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const response = await api.post('/api/database/user-signals', data);
      return { success: true, id: response.data.id };
    } catch (error) {
      console.error('Error storing user signal:', error);
      return { success: false, error: 'Failed to store user signal' };
    }
  }

  /**
   * Update signal outcome (win/loss/skipped)
   */
  async updateSignalOutcome(signalId: number, result: 'win' | 'loss' | 'skipped', pnl?: number, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post('/api/database/update-signal-outcome', {
        signal_id: signalId,
        result,
        pnl,
        notes
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating signal outcome:', error);
      return { success: false, error: 'Failed to update signal outcome' };
    }
  }

  /**
   * Get user signal history
   */
  async getUserSignals(userId: string | number, options?: { pair?: string; result?: string; limit?: number }): Promise<{ success: boolean; signals?: any[]; error?: string }> {
    try {
      const params = new URLSearchParams({ user_id: userId.toString() });
      if (options?.pair) params.append('pair', options.pair);
      if (options?.result) params.append('result', options.result);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await api.get(`/api/database/user-signals?${params.toString()}`);
      return { success: true, signals: response.data };
    } catch (error) {
      console.error('Error fetching user signals:', error);
      return { success: false, error: 'Failed to fetch user signals' };
    }
  }

  /**
   * Get signal statistics for a user
   */
  async getSignalStats(userId: string | number): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      const response = await api.get(`/api/database/signal-stats?user_id=${userId}`);
      return { success: true, stats: response.data };
    } catch (error) {
      console.error('Error fetching signal stats:', error);
      return { success: false, error: 'Failed to fetch signal stats' };
    }
  }

  /**
   * Get bot status
   */
  async getBotStatus(): Promise<{ success: boolean; status?: any[]; error?: string }> {
    try {
      const response = await api.get('/api/database/bot-status');
      return { success: true, status: response.data };
    } catch (error) {
      console.error('Error fetching bot status:', error);
      return { success: false, error: 'Failed to fetch bot status' };
    }
  }

  /**
   * Update bot status
   */
  async updateBotStatus(botType: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      await api.post(`/api/database/bot-status/${botType}`, { is_active: isActive });
      return { success: true };
    } catch (error) {
      console.error('Error updating bot status:', error);
      return { success: false, error: 'Failed to update bot status' };
    }
  }

  /**
   * Get bot data with optional filtering
   */
  async getBotData(options?: { bot_type?: string; pair?: string; limit?: number }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (options?.bot_type) params.append('bot_type', options.bot_type);
      if (options?.pair) params.append('pair', options.pair);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await api.get(`/api/database/bot-data?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching bot data:', error);
      return { success: false, error: 'Failed to fetch bot data' };
    }
  }

  /**
   * Get OHLC data for charting
   */
  async getOHLCData(options?: { pair?: string; timeframe?: string; limit?: number }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (options?.pair) params.append('pair', options.pair);
      if (options?.timeframe) params.append('timeframe', options.timeframe);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await api.get(`/api/database/ohlc-data?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      return { success: false, error: 'Failed to fetch OHLC data' };
    }
  }

  /**
   * Aggregate tick data into OHLC candles
   */
  aggregateToOHLC(tickData: Array<{ timestamp: number; price: number; volume?: number }>, timeframe: string): OHLCPayload[] {
    const candles: Record<string, OHLCPayload> = {};
    
    tickData.forEach(tick => {
      // Round timestamp to timeframe boundary
      let candleTime: number;
      const date = new Date(tick.timestamp);
      
      switch (timeframe) {
        case '1m':
          candleTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()).getTime();
          break;
        case '5m':
          candleTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 5) * 5).getTime();
          break;
        case '15m':
          candleTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), Math.floor(date.getMinutes() / 15) * 15).getTime();
          break;
        case '1h':
          candleTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).getTime();
          break;
        case '4h':
          candleTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(date.getHours() / 4) * 4).getTime();
          break;
        case '1d':
          candleTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
          break;
        default:
          candleTime = tick.timestamp;
      }
      
      const candleKey = candleTime.toString();
      
      if (!candles[candleKey]) {
        candles[candleKey] = {
          pair: 'UNKNOWN', // This should be set from context
          timeframe,
          timestamp: candleTime,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          volume: tick.volume || 0
        };
      } else {
        const candle = candles[candleKey];
        candle.high = Math.max(candle.high, tick.price);
        candle.low = Math.min(candle.low, tick.price);
        candle.close = tick.price;
        candle.volume += (tick.volume || 0);
      }
    });
    
    return Object.values(candles).sort((a, b) => a.timestamp - b.timestamp);
  }
}

export default new BotDataService();
