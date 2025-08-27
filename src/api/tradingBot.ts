import api from './index';

// Bot management endpoints
export const botAPI = {
  // Start a bot
  startBot: (botType: string, config: any) => 
    api.post('/api/bot/start', { bot_type: botType, config, updated_by: 'trading_bot_manager' }),

  // Stop a bot
  stopBot: (botType: string) => 
    api.post('/api/bot/stop', { bot_type: botType, updated_by: 'trading_bot_manager' }),

  // Get bot status
  getBotStatus: (botType: string) => 
    api.get(`/api/bot/status?bot_type=${botType}`),

  // Store bot data (prices, signals, etc.)
  storeBotData: (data: any) => 
    api.post('/api/bot/data', data),

  // Get bot configurations
  getBotConfigs: () => 
    api.get('/api/bot/configs'),

  // Save bot configuration
  saveBotConfig: (config: any) => 
    config.id ? api.put(`/api/bot/configs/${config.id}`, config) : api.post('/api/bot/configs', config),

  // Delete bot configuration
  deleteBotConfig: (configId: string) => 
    api.delete(`/api/bot/configs/${configId}`),
};

// Signal management endpoints
export const signalAPI = {
  // Get all signals
  getSignals: (market?: string) => 
    api.get('/api/signals', { params: { market } }),

  // Create a new signal
  createSignal: (signal: any) => 
    api.post('/api/signals', signal),

  // Update a signal
  updateSignal: (signalId: string, updates: any) => 
    api.put(`/api/signals/${signalId}`, updates),

  // Delete a signal
  deleteSignal: (signalId: string) => 
    api.delete(`/api/signals/${signalId}`),

  // Get signal statistics
  getSignalStats: () => 
    api.get('/api/signals/stats'),
};

// Price data endpoints
export const priceAPI = {
  // Get latest prices for symbols
  getLatestPrices: (symbols: string[], market: string) => 
    api.post('/api/prices/latest', { symbols, market }),

  // Get price history
  getPriceHistory: (symbol: string, timeframe: string, limit: number = 100) => 
    api.get(`/api/prices/history/${symbol}`, { params: { timeframe, limit } }),

  // Store price data
  storePriceData: (priceData: any) => 
    api.post('/api/prices/store', priceData),
};

// Analysis endpoints
export const analysisAPI = {
  // Analyze a symbol
  analyzeSymbol: (symbol: string, timeframe: string, market: string) => 
    api.post('/api/analysis/symbol', { symbol, timeframe, market }),

  // Get analysis results
  getAnalysisResults: (symbol: string, timeframe: string) => 
    api.get(`/api/analysis/results/${symbol}`, { params: { timeframe } }),

  // Store analysis results
  storeAnalysisResults: (results: any) => 
    api.post('/api/analysis/store', results),
};

export default {
  bot: botAPI,
  signal: signalAPI,
  price: priceAPI,
  analysis: analysisAPI,
};
