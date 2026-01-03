export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://www.traderedgepro.com',
    timeout: 30000,
    retries: 3,
  },

  // Forex Service Configuration
  forex: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://www.traderedgepro.com',
    refreshInterval: 5000,
    maxSymbols: 20,
  },

  // Trading Bot Configuration
  tradingBot: {
    maxBots: 10,
    defaultRiskLevel: 'medium',
    maxPositionSize: 0.05,
    defaultStopLoss: 0.03,
    defaultTakeProfit: 0.06,
  },

  // UI Configuration
  ui: {
    theme: 'light',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'HH:mm:ss',
    currency: 'USD',
  },

  // Feature Flags
  features: {
    forexEnabled: true,
    tradingBotsEnabled: true,
    riskManagementEnabled: true,
    signalsEnabled: true,
    realTimeUpdates: true,
  },

  // WebSocket Configuration
  websocket: {
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
  },

  // Chart Configuration
  charts: {
    defaultTimeframe: '1h',
    maxDataPoints: 1000,
    updateInterval: 1000,
    themes: ['light', 'dark'],
  },

  // Notification Configuration
  notifications: {
    enabled: true,
    sound: true,
    desktop: true,
    email: false,
    telegram: false,
  },

  // Security Configuration
  security: {
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    require2FA: false,
  },
};

export default config;
