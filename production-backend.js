const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enhanced CORS configuration for production
const corsOrigins = [
  'https://www.traderedgepro.com',
  'https://traderedgepro.com',
  'https://frontend-tkxf.onrender.com',
  'https://frontend-i6xs.onrender.com',
  'https://frontend-01uh.onrender.com',
  'https://frontend-zwwl.onrender.com',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000'
];

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in our allowed list
    if (corsOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // For development, allow all onrender.com domains
    if (origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'production-backend'
  });
});

// User profile endpoint
app.get('/user/profile', (req, res) => {
  try {
    // Return a default profile for production
    const defaultProfile = {
      id: 'production_user',
      email: 'user@traderedgepro.com',
      fullName: 'Production User',
      membershipTier: 'premium',
      setupComplete: true,
      tradingData: null
    };
    
    res.json(defaultProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// User progress endpoint
app.post('/user/progress', (req, res) => {
  try {
    const progressData = req.body;
    
    // Log the progress data for debugging
    console.log('User progress saved:', progressData);
    
    res.json({ 
      success: true, 
      message: 'Progress saved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving user progress:', error);
    res.status(500).json({ error: 'Failed to save user progress' });
  }
});

// Bulk API endpoint for futures data
app.post('/api/bulk', (req, res) => {
  try {
    const { symbols, timeframe } = req.body;
    
    // Mock futures data for production
    const mockData = symbols.map(symbol => ({
      symbol,
      timeframe: timeframe || '1h',
      price: (Math.random() * 1000 + 100).toFixed(2),
      change: (Math.random() * 20 - 10).toFixed(2),
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString()
    }));
    
    res.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching bulk data:', error);
    res.status(500).json({ error: 'Failed to fetch bulk data' });
  }
});

// Stripe payment endpoint
app.post('/api/stripe/create-payment-intent', (req, res) => {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    // Mock Stripe payment intent for production
    const mockPaymentIntent = {
      clientSecret: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount || 1000,
      currency: currency,
      metadata: {},
      status: 'requires_payment_method'
    };
    
    res.json(mockPaymentIntent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Cryptomus payment endpoints
app.post('/api/cryptomus/create-invoice', (req, res) => {
  try {
    const { amount, currency = 'USD' } = req.body;
    
    // Mock Cryptomus invoice for production
    const mockInvoice = {
      uuid: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount || '100.00',
      currency: currency,
      status: 'pending',
      url: `https://pay.cryptomus.com/pay/${Date.now()}`,
      created_at: new Date().toISOString()
    };
    
    res.json(mockInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

app.get('/api/cryptomus/payment-info/:uuid', (req, res) => {
  try {
    const { uuid } = req.params;
    
    // Mock payment info for production
    const mockPaymentInfo = {
      uuid: uuid,
      status: 'completed',
      amount: '100.00',
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json(mockPaymentInfo);
  } catch (error) {
    console.error('Error fetching payment info:', error);
    res.status(500).json({ error: 'Failed to fetch payment info' });
  }
});

app.get('/api/cryptomus/services', (req, res) => {
  try {
    // Mock services for production
    const mockServices = {
      services: [
        {
          id: 'crypto',
          name: 'Cryptocurrency',
          currencies: ['BTC', 'ETH', 'USDT', 'USDC']
        }
      ]
    };
    
    res.json(mockServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Serve static files if needed
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler for SPA
app.get('*', (req, res) => {
  res.json({ 
    message: 'Production Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Production backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${corsOrigins.join(', ')}`);
});

module.exports = app;
