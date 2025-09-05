export interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface OHLCData {
  symbol: string;
  timeframe: string;
  data: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

class PriceDataService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'https://backend-8j0e.onrender.com';
  }

  async getRealTimePrices(symbols: string[]): Promise<PriceData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/prices/realtime`, {
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
      console.error('Error fetching real-time prices:', error);
      throw error;
    }
  }

  async getOHLCData(symbol: string, timeframe: string, limit: number = 100): Promise<OHLCData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/prices/ohlc?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching OHLC data:', error);
      throw error;
    }
  }

  async getPriceHistory(symbol: string, days: number = 30): Promise<PriceData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/prices/history?symbol=${symbol}&days=${days}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching price history:', error);
      throw error;
    }
  }

  async subscribeToPriceUpdates(symbols: string[], callback: (data: PriceData) => void): Promise<void> {
    // WebSocket implementation for real-time updates
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws/prices`);
    
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

export default new PriceDataService();
