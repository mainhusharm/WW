export interface ForexData {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

export interface ForexPair {
  base: string;
  quote: string;
  symbol: string;
  name: string;
  category: 'major' | 'minor' | 'exotic';
}

class RenderForexService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_FOREX_API_URL || 'http://localhost:3004';
  }

  async getForexPairs(): Promise<ForexPair[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/forex/pairs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching forex pairs:', error);
      throw error;
    }
  }

  async getRealTimeRates(symbols: string[]): Promise<ForexData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/forex/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching real-time rates:', error);
      throw error;
    }
  }

  async getHistoricalData(symbol: string, timeframe: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/forex/history?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  async getCurrencyInfo(currency: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/forex/currency/${currency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching currency info:', error);
      throw error;
    }
  }

  async subscribeToForexUpdates(symbols: string[], callback: (data: ForexData) => void): Promise<void> {
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/forex`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: 'subscribe', symbols }));
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

export default new RenderForexService();
