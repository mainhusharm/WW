const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Prop Firm Rules API
app.get('/api/prop-firm/rules', (req, res) => {
  const accountType = req.query.accountType || 'QuantTekel Instant';
  
  const rulesDatabase = {
    "QuantTekel Instant": {
      name: "QuantTekel Instant",
      accountSize: "$10,000",
      challengeType: "Instant",
      dailyLossLimit: "4%",
      maxDrawdown: "8%",
      profitTarget: "6%",
      minTradingDays: "4 days",
      weekendHolding: "Allowed with triple swap fees",
      newsTrading: "Restricted 5 minutes before/after high-impact news",
      leverage: {
        forex: "1:30",
        metals: "1:15", 
        crypto: "1:1"
      },
      consistencyRule: "30%",
      tradingHours: "24/7",
      minimumDeposit: "$100",
      spread: "0.1 pips",
      commission: "No commission",
      stopLoss: "Optional",
      takeProfit: "Optional"
    },
    "QuantTekel 2-Step": {
      name: "QuantTekel 2-Step",
      accountSize: "$10,000",
      challengeType: "2-step",
      dailyLossLimit: "4%",
      maxDrawdown: "8%",
      profitTarget: "6% per phase",
      minTradingDays: "4 days per phase",
      weekendHolding: "Allowed with triple swap fees",
      newsTrading: "Restricted 5 minutes before/after high-impact news",
      leverage: {
        forex: "1:30",
        metals: "1:15",
        crypto: "1:1"
      },
      consistencyRule: "30%",
      tradingHours: "24/7",
      minimumDeposit: "$250",
      spread: "0.2 pips",
      commission: "Low commission",
      stopLoss: "Required",
      takeProfit: "Required"
    }
  };
  
  const rules = rulesDatabase[accountType] || rulesDatabase["QuantTekel Instant"];
  
  res.json({
    success: true,
    accountType,
    rules,
    lastUpdated: new Date().toISOString()
  });
});

// Signals Dashboard API
app.get('/api/signals/dashboard', (req, res) => {
  const type = req.query.type || 'all';
  const limit = parseInt(req.query.limit) || 20;
  
  const baseSignals = [
    {
      id: 'signal-1',
      type: 'forex',
      symbol: 'EUR/USD',
      action: 'buy',
      entry: '1.0850',
      stopLoss: '1.0800',
      takeProfit: '1.0950',
      confidence: 85,
      source: 'forex_bot',
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      analysis: 'Strong bullish momentum with RSI oversold bounce',
      performance: {
        views: 45,
        trades: 12,
        successRate: 78
      }
    },
    {
      id: 'signal-2',
      type: 'crypto',
      symbol: 'BTC/USDT',
      action: 'sell',
      entry: '43250',
      stopLoss: '43800',
      takeProfit: '42500',
      confidence: 72,
      source: 'crypto_bot',
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      analysis: 'Resistance at 43500 with bearish divergence',
      performance: {
        views: 32,
        trades: 8,
        successRate: 65
      }
    },
    {
      id: 'signal-3',
      type: 'forex',
      symbol: 'GBP/USD',
      action: 'buy',
      entry: '1.2650',
      stopLoss: '1.2600',
      takeProfit: '1.2750',
      confidence: 90,
      source: 'forex_bot',
      status: 'active',
      createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
      analysis: 'Breakout above key resistance with volume confirmation',
      performance: {
        views: 28,
        trades: 15,
        successRate: 82
      }
    }
  ];
  
  let signals = baseSignals;
  if (type !== 'all') {
    signals = baseSignals.filter(signal => signal.type === type);
  }
  
  signals = signals.slice(0, limit);
  
  res.json({
    success: true,
    signals,
    total: signals.length,
    lastUpdated: new Date().toISOString()
  });
});

// Forex News API
app.get('/api/news/forex-factory', (req, res) => {
  const mockNews = [
    {
      id: 'news-1',
      title: 'US Non-Farm Payrolls',
      currency: 'USD',
      impact: 'High',
      forecast: '200K',
      previous: '187K',
      actual: 'TBD',
      time: '8:30 AM',
      date: new Date().toISOString().split('T')[0],
      description: 'Monthly employment report showing job creation in the US',
      source: 'ForexFactory',
      importance: 3
    },
    {
      id: 'news-2',
      title: 'ECB Interest Rate Decision',
      currency: 'EUR',
      impact: 'High',
      forecast: '4.25%',
      previous: '4.00%',
      actual: 'TBD',
      time: '1:15 PM',
      date: new Date().toISOString().split('T')[0],
      description: 'European Central Bank monetary policy decision',
      source: 'ForexFactory',
      importance: 3
    },
    {
      id: 'news-3',
      title: 'UK CPI Inflation',
      currency: 'GBP',
      impact: 'Medium',
      forecast: '4.2%',
      previous: '4.6%',
      actual: 'TBD',
      time: '7:00 AM',
      date: new Date().toISOString().split('T')[0],
      description: 'Consumer Price Index showing inflation rate',
      source: 'ForexFactory',
      importance: 2
    }
  ];
  
  res.json({
    success: true,
    news: mockNews,
    fromCache: false,
    rateLimited: false,
    lastUpdated: new Date().toISOString()
  });
});

// Customer Dashboard API
app.get('/api/customers/dashboard', (req, res) => {
  const mockCustomers = [
    {
      id: 'customer-1',
      email: 'john.doe@example.com',
      accountType: 'QuantTekel Instant',
      paymentStatus: 'completed',
      status: 'active',
      subscriptionId: 'sub_123456789',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      lastPayment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      questionnaire: {
        accountType: 'QuantTekel Instant',
        tradingRules: ['Risk Management', 'Position Sizing'],
        responses: {
          experience: 'intermediate',
          tradingGoals: 'Consistent monthly returns',
          riskTolerance: 'moderate'
        }
      },
      user: {
        id: 'user-1',
        username: 'John Doe',
        planType: 'premium'
      }
    },
    {
      id: 'customer-2',
      email: 'jane.smith@example.com',
      accountType: 'QuantTekel 2-Step',
      paymentStatus: 'completed',
      status: 'active',
      subscriptionId: 'sub_987654321',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      lastPayment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      questionnaire: {
        accountType: 'QuantTekel 2-Step',
        tradingRules: ['Stop Loss', 'Take Profit'],
        responses: {
          experience: 'advanced',
          tradingGoals: 'Professional trading career',
          riskTolerance: 'aggressive'
        }
      },
      user: {
        id: 'user-2',
        username: 'Jane Smith',
        planType: 'premium'
      }
    }
  ];
  
  res.json({
    success: true,
    customers: mockCustomers,
    total: mockCustomers.length,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/notifications', (req, res) => {
  res.json({
    success: true,
    notifications: [],
    total: 0,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/portfolio', (req, res) => {
  res.json({
    success: true,
    portfolio: {},
    lastUpdated: new Date().toISOString()
  });
});

app.post('/api/auth/refresh', (req, res) => {
  res.json({
    success: true,
    message: "Token refreshed successfully"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET /health`);
  console.log(`   GET /api/prop-firm/rules`);
  console.log(`   GET /api/signals/dashboard`);
  console.log(`   GET /api/news/forex-factory`);
  console.log(`   GET /api/customers/dashboard`);
});

module.exports = app;
