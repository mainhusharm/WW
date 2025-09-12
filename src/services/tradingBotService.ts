export interface BotConfig {
  id: string;
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

export interface BotPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  dailyPnl: number[];
}

export interface BotStatus {
  id: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  lastActive: string;
  currentPositions: number;
  dailyPnl: number;
}

class TradingBotService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  async getBots(): Promise<BotConfig[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bots:', error);
      throw error;
    }
  }

  async createBot(botConfig: Omit<BotConfig, 'id'>): Promise<BotConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botConfig),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating bot:', error);
      throw error;
    }
  }

  async updateBot(id: string, botConfig: Partial<BotConfig>): Promise<BotConfig> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botConfig),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating bot:', error);
      throw error;
    }
  }

  async deleteBot(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting bot:', error);
      throw error;
    }
  }

  async startBot(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error starting bot:', error);
      throw error;
    }
  }

  async pauseBot(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}/pause`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error pausing bot:', error);
      throw error;
    }
  }

  async stopBot(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
      throw error;
    }
  }

  async getBotPerformance(id: string): Promise<BotPerformance> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}/performance`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bot performance:', error);
      throw error;
    }
  }

  async getBotStatus(id: string): Promise<BotStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/${id}/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching bot status:', error);
      throw error;
    }
  }

  async getAllBotsStatus(): Promise<BotStatus[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/bots/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching all bots status:', error);
      throw error;
    }
  }

  async subscribeToBotUpdates(callback: (data: BotStatus) => void): Promise<void> {
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/bots`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'subscribe' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }
}

export default new TradingBotService();
