// Environment configuration
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  isAmplify: window.location.hostname.includes('amplifyapp.com'),
  isRender: window.location.hostname.includes('onrender.com'),
  apiBaseUrl: import.meta.env.PROD
    ? 'https://www.traderedgepro.com'
    : 'http://localhost:5000',
  yfinanceServiceUrl: 'https://forex-data-service.onrender.com', // Temporary fix - use forex-data-service
  binanceServiceUrl: 'https://binance-service.onrender.com',
  telegramServiceUrl: 'https://yfinance-service-kyce.onrender.com/api/telegram',
};

// YFinance service configuration
export const YFINANCE_CONFIG = {
  baseUrl: 'https://forex-data-service.onrender.com', // Temporary fix
  endpoints: {
    price: '/api/forex-price',
    bulk: '/api/bulk-forex-price',
    historical: '/api/forex-data',
    health: '/health'
  }
};

// API configuration for different services
export const API_CONFIG = {
  // Main backend
  backendUrl: ENV_CONFIG.apiBaseUrl,

  // YFinance service (for forex and stocks) - TEMPORARY FIX
  yfinanceServiceUrl: 'https://forex-data-service.onrender.com',

  // Specific YFinance endpoints - TEMPORARY FIX
  yfinancePriceUrl: 'https://forex-data-service.onrender.com/api/forex-price',
  yfinanceBulkUrl: 'https://forex-data-service.onrender.com/api/bulk-forex-price',
  yfinanceHistoricalUrl: 'https://forex-data-service.onrender.com/api/forex-data',

  // Binance service (for crypto only)
  binanceServiceUrl: 'https://binance-service.onrender.com',

  // Customer service
  customerServiceUrl: import.meta.env.DEV ? 'http://localhost:3005' : 'https://customer-service.onrender.com',

  // Telegram service
  telegramServiceUrl: 'https://yfinance-service-kyce.onrender.com/api/telegram',
};

// API endpoints
export const API_ENDPOINTS = {
  // Main API endpoints
  health: '/health',
  customers: '/customers',
  trades: '/trades',
  signals: '/signals',

  // Forex data endpoints
  forexData: '/api/forex-data',
  forexPrice: '/api/forex-price',
  bulkForexPrice: '/api/bulk-forex-price',

  // Binance endpoints
  binancePrice: '/api/binance/price',
  binanceKlines: '/api/binance/klines',

  // Telegram endpoints
  telegramMessages: '/api/telegram/messages',
  telegramStream: '/api/telegram/stream',

  // Chart analysis endpoints
  chartAnalysis: '/api/chart/analyze',
  chartSignal: '/api/chart/signal',

  // Settings endpoints
  settings: '/api/settings',
  setApiKey: '/api/settings/set-key',
};

// WebSocket configuration
export const WS_CONFIG = {
  baseURL: import.meta.env.DEV
    ? 'wss://forex-data-service.onrender.com'
    : `wss://${window.location.hostname}`,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
};

// Export default config
export default {
  API_CONFIG,
  ENV_CONFIG,
  API_ENDPOINTS,
  WS_CONFIG,
};
