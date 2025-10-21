// Environment configuration
// Updated: All forex service URLs now point to main backend
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  isAmplify: window.location.hostname.includes('amplifyapp.com'),
  isRender: window.location.hostname.includes('onrender.com'),
  apiBaseUrl: import.meta.env.PROD
    ? 'https://backend-topb.onrender.com'
    : 'http://localhost:3001',
  yfinanceServiceUrl: 'https://yfinance-service-kyce.onrender.com', // Use working yfinance service
  binanceServiceUrl: 'https://binance-service.onrender.com',
  telegramServiceUrl: 'https://yfinance-service-kyce.onrender.com/api/telegram',
};

// YFinance service configuration
export const YFINANCE_CONFIG = {
  baseUrl: 'https://yfinance-service-kyce.onrender.com', // Use working yfinance service
  endpoints: {
    price: '/api/price',
    bulk: '/api/bulk',
    historical: '/api/historical',
    health: '/health'
  }
};

// API configuration for different services
export const API_CONFIG = {
  // Main backend
  baseURL: ENV_CONFIG.apiBaseUrl,
  backendUrl: ENV_CONFIG.apiBaseUrl,

      // YFinance service (for forex and stocks) - Use working yfinance service
    yfinanceServiceUrl: 'https://yfinance-service-kyce.onrender.com',
    
    // Specific YFinance endpoints - Use working yfinance service
    yfinancePriceUrl: 'https://yfinance-service-kyce.onrender.com/api/price',
    yfinanceBulkUrl: 'https://yfinance-service-kyce.onrender.com/api/bulk',
    yfinanceHistoricalUrl: 'https://yfinance-service-kyce.onrender.com/api/historical',

  // Binance service (for crypto only)
  binanceServiceUrl: 'https://binance-service.onrender.com',

  // Customer service
  customerServiceUrl: import.meta.env.DEV ? 'http://localhost:3001' : 'https://backend-topb.onrender.com',

  // Telegram service
  telegramServiceUrl: 'https://yfinance-service-kyce.onrender.com/api/telegram',
};

// API endpoints
export const API_ENDPOINTS = {
  // Main API endpoints
  health: '/health',
  customers: '/api/customers',
  trades: '/trades',
  signals: '/api/signals',

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
    ? 'https://simple-auth-backend.onrender.com'
    : 'https://simple-auth-backend.onrender.com',
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
