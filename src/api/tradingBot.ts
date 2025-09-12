import { BotConfig, BotPerformance, BotStatus } from '../services/tradingBotService';

export interface CreateBotRequest {
  name: string;
  strategy: string;
  symbols: string[];
  riskLevel: 'low' | 'medium' | 'high';
  settings: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxDailyLoss: number;
    tradingHours: {
      start: string;
      end: string;
    };
  };
}

export interface UpdateBotRequest extends Partial<CreateBotRequest> {}

export interface BotResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class TradingBotAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<BotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async getBots(): Promise<BotResponse> {
    return this.makeRequest('/api/bots');
  }

  async getBot(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}`);
  }

  async createBot(botData: CreateBotRequest): Promise<BotResponse> {
    return this.makeRequest('/api/bots', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  }

  async updateBot(id: string, botData: UpdateBotRequest): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(botData),
    });
  }

  async deleteBot(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}`, {
      method: 'DELETE',
    });
  }

  async startBot(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/start`, {
      method: 'POST',
    });
  }

  async pauseBot(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/pause`, {
      method: 'POST',
    });
  }

  async stopBot(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/stop`, {
      method: 'POST',
    });
  }

  async getBotPerformance(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/performance`);
  }

  async getBotStatus(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/status`);
  }

  async getAllBotsStatus(): Promise<BotResponse> {
    return this.makeRequest('/api/bots/status');
  }

  async getBotLogs(id: string, limit: number = 100): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/logs?limit=${limit}`);
  }

  async getBotMetrics(id: string, timeframe: string = '1d'): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/metrics?timeframe=${timeframe}`);
  }

  async getBotPositions(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/positions`);
  }

  async getBotTrades(id: string, limit: number = 100): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/trades?limit=${limit}`);
  }

  async getBotSettings(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/settings`);
  }

  async updateBotSettings(id: string, settings: any): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async getBotStrategies(): Promise<BotResponse> {
    return this.makeRequest('/api/bots/strategies');
  }

  async getBotTemplates(): Promise<BotResponse> {
    return this.makeRequest('/api/bots/templates');
  }

  async cloneBot(id: string, newName: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/clone`, {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    });
  }

  async exportBot(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/export`);
  }

  async importBot(botData: any): Promise<BotResponse> {
    return this.makeRequest('/api/bots/import', {
      method: 'POST',
      body: JSON.stringify(botData),
    });
  }

  async getBotBacktest(id: string, startDate: string, endDate: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/backtest?start=${startDate}&end=${endDate}`);
  }

  async runBotBacktest(botData: CreateBotRequest, startDate: string, endDate: string): Promise<BotResponse> {
    return this.makeRequest('/api/bots/backtest', {
      method: 'POST',
      body: JSON.stringify({ ...botData, startDate, endDate }),
    });
  }

  async getBotOptimization(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/optimization`);
  }

  async runBotOptimization(id: string, parameters: any): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/optimization`, {
      method: 'POST',
      body: JSON.stringify(parameters),
    });
  }

  async getBotAlerts(id: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/alerts`);
  }

  async createBotAlert(id: string, alertData: any): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/alerts`, {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async updateBotAlert(botId: string, alertId: string, alertData: any): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${botId}/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(alertData),
    });
  }

  async deleteBotAlert(botId: string, alertId: string): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${botId}/alerts/${alertId}`, {
      method: 'DELETE',
    });
  }

  async getBotReports(id: string, reportType: string = 'performance'): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/reports?type=${reportType}`);
  }

  async generateBotReport(id: string, reportType: string, parameters: any = {}): Promise<BotResponse> {
    return this.makeRequest(`/api/bots/${id}/reports/generate`, {
      method: 'POST',
      body: JSON.stringify({ type: reportType, parameters }),
    });
  }
}

export default new TradingBotAPI();
