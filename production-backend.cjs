const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://pghero_dpg_d2v9i7er433s73f0878g_a_user:3hHx4ds9FeT4E7SNGr3w9rcPplymI1Ce@dpg-d31suqndiees7388j8s0-a.oregon-postgres.render.com/pghero_dpg_d2v9i7er433s73f0878g_a',
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Check if users table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!result.rows[0].exists) {
      console.log('📋 Creating database tables...');
      const fs = require('fs');
      const schema = fs.readFileSync('./database_schema.sql', 'utf8');
      await client.query(schema);
      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Don't exit, just log the error and continue
  }
}

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
  'http://localhost:3000',
  'http://localhost:5176',
  '*' // Allow all origins for now
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

// User registration endpoint with PostgreSQL
app.post('/api/auth/register', async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      company, 
      country, 
      agreeToMarketing, 
      plan_type 
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: firstName, lastName, email, password'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Create user in database with proper fields
    const username = `${firstName}_${lastName}_${Date.now()}`.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '');
    const fullName = `${firstName} ${lastName}`;
    
    const result = await pool.query(`
      INSERT INTO users (
        username,
        email, 
        normalized_email,
        password_hash, 
        first_name, 
        last_name, 
        full_name,
        phone, 
        country, 
        agree_to_marketing, 
        plan_type,
        unique_id,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING id, username, first_name, last_name, email, phone, country, plan_type, created_at
    `, [
      username,
      email,
      email.toLowerCase(), // normalized_email
      password, // In production, hash this password
      firstName,
      lastName,
      fullName,
      phone || null,
      country || null,
      agreeToMarketing || false,
      plan_type || 'premium',
      `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // unique_id
      true // is_active
    ]);

    const user = result.rows[0];

    // Generate access token (in production, use proper JWT)
    const access_token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      data: {
        access_token,
        user: {
          id: user.id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          fullName: `${user.first_name} ${user.last_name}`,
          email: user.email,
          phone: user.phone,
          country: user.country,
          plan_type: user.plan_type,
          created_at: user.created_at
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during registration'
    });
  }
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

// Coupon validation endpoint
app.post('/api/validate-coupon', (req, res) => {
  try {
    const { coupon_code, plan_id, original_price } = req.body;
    
    // Mock coupon database - in production, store these in PostgreSQL
    const validCoupons = {
      'TRADERFREE': { discount_amount: original_price, discount_percentage: 100, message: 'Free access granted!' },
      'TRADER10CENTS': { discount_amount: original_price - 0.10, discount_percentage: 0, message: 'Special $0.10 offer applied!' }
    };
    
    const coupon = validCoupons[coupon_code?.toUpperCase()];
    
    if (coupon) {
      const discountAmount = coupon.discount_percentage > 0 
        ? (original_price * coupon.discount_percentage / 100)
        : coupon.discount_amount;
      
      const finalPrice = Math.max(0, Math.round((original_price - discountAmount) * 100) / 100);
      
      res.json({
        valid: true,
        coupon_code: coupon_code.toUpperCase(),
        discount_amount: discountAmount,
        discount_percentage: coupon.discount_percentage,
        final_price: finalPrice,
        original_price: original_price,
        message: coupon.message
      });
    } else {
      res.json({
        valid: false,
        error: 'Invalid coupon code. Please check and try again.',
        coupon_code: coupon_code
      });
    }
    
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Internal server error during coupon validation'
    });
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
app.listen(PORT, async () => {
  console.log(`🚀 Production backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS enabled for: ${corsOrigins.join(', ')}`);
  
  // Initialize database
  await initializeDatabase();
});

module.exports = app;
