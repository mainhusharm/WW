const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const app = express();
const prisma = new PrismaClient();

// Enhanced CORS configuration for production
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'https://frontend-tkxf.onrender.com',
      'https://frontend-i6xs.onrender.com',
      'https://frontend-01uh.onrender.com',
      'https://frontend-zwwl.onrender.com',
      'https://www.traderedgepro.com',
      'https://traderedgepro.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000'
    ];

// More permissive CORS for development and testing
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

// Add CORS preflight handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '3600');
  res.sendStatus(200);
});

// Add after_request handler for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  next();
});

app.use(express.json());

// Validation schemas
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
  questionnaire: z.object({
    experience: z.string(),
    goals: z.string(),
    preferences: z.string(),
  }).optional(),
  screenshot: z.string().url().optional().or(z.literal('')),
  riskManagementPlan: z.string().optional(),
});

const StatusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED']),
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database setup endpoint for Render (since shell scripts aren't available)
app.get('/setup-db', async (req, res) => {
  try {
    console.log('Setting up database tables...');
    
    // Create Status enum type if it doesn't exist
    try {
      await prisma.$executeRaw`CREATE TYPE "Status" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED')`;
      console.log('Status enum created successfully');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Status enum already exists, skipping...');
      } else {
        console.error('Error creating Status enum:', error.message);
        throw error;
      }
    }
    
    // Create users table if it doesn't exist (matching Prisma schema)
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "password_hash" TEXT NOT NULL,
      "full_name" TEXT,
      "questionnaire_data" JSONB,
      "screenshot_url" TEXT,
      "risk_management_plan" TEXT,
      "status" "Status" NOT NULL DEFAULT 'PENDING',
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`;
    
    // Create payments table if it doesn't exist
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "payments" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "user_id" TEXT NOT NULL,
      "plan_name" TEXT NOT NULL,
      "original_price" DOUBLE PRECISION NOT NULL,
      "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "final_price" DOUBLE PRECISION NOT NULL,
      "coupon_code" TEXT,
      "payment_method" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "transaction_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    )`;
    
    // Create indexes one by one
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users"("status")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("created_at")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments"("user_id")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments"("created_at")`;
    
    // Create updated_at function
    await prisma.$executeRaw`CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'`;
    
    // Drop existing trigger if it exists
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS update_users_updated_at ON "users"`;
    
    // Create trigger
    await prisma.$executeRaw`CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON "users"
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`;
    
    // Create trigger for payments table
    await prisma.$executeRaw`DROP TRIGGER IF EXISTS update_payments_updated_at ON "payments"`;
    await prisma.$executeRaw`CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON "payments"
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column()`;
    
    console.log('Database setup completed successfully');
    res.json({
      success: true,
      message: 'Database tables, indexes, Status enum, and triggers created successfully',
      timestamp: new Date().toISOString(),
      details: {
        statusEnum: 'Created or already exists',
        usersTable: 'Created or already exists',
        paymentsTable: 'Created or already exists',
        indexes: 'Created or already exist',
        triggers: 'Created or already exist'
      }
    });
  } catch (error) {
    console.error('Database setup error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test database connection
app.get('/test-db', async (req, res) => {
  try {
    // Try to query the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test Prisma client with users table
app.get('/test-prisma', async (req, res) => {
  try {
    // Try to query the users table using Prisma
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
    res.json({ 
      success: true, 
      message: 'Prisma client working with users table',
      users: users,
      count: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Prisma test error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Coupon validation endpoint
app.post('/api/validate-coupon', async (req, res) => {
  try {
    const { coupon_code, plan_id, original_price } = req.body;
    
    if (!coupon_code) {
      return res.status(400).json({
        valid: false,
        error: 'Coupon code is required'
      });
    }

    console.log(`Validating coupon: ${coupon_code} for plan: ${plan_id} with price: ${original_price}`);

    // Handle the two available coupons
    if (coupon_code === 'TRADERFREE') {
      const discount_amount = original_price;
      const final_price = 0.00;
      console.log(`TRADERFREE coupon applied: discount=$${discount_amount}, final_price=$${final_price}`);
      return res.json({
        valid: true,
        discount_amount: discount_amount,
        final_price: final_price,
        message: 'Free access coupon applied!'
      });
    } else if (coupon_code === 'INTERNAL_DEV_OVERRIDE_2024') {
      const discount_amount = original_price - 0.10;
      const final_price = 0.10;
      console.log(`INTERNAL_DEV_OVERRIDE_2024 coupon applied: discount=$${discount_amount}, final_price=$${final_price}`);
      return res.json({
        valid: true,
        discount_amount: discount_amount,
        final_price: final_price,
        message: 'Development override coupon applied!'
      });
    } else {
      console.log(`Unknown coupon code: ${coupon_code}`);
      return res.json({
        valid: false,
        error: 'Invalid coupon code'
      });
    }
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Coupon validation failed'
    });
  }
});

// Payment creation endpoint
app.post('/api/payments', async (req, res) => {
  try {
    const { userId, planName, originalPrice, discount, finalPrice, couponCode, paymentMethod } = req.body;
    
    console.log('Payment request received:', { userId, planName, originalPrice, discount, finalPrice, couponCode, paymentMethod });
    
    // Validate required fields (allow 0 for free payments)
    if (!userId || !planName || originalPrice === undefined || finalPrice === undefined || !paymentMethod) {
      console.log('Payment validation failed:', { userId, planName, originalPrice, finalPrice, paymentMethod });
      return res.status(400).json({
        success: false,
        error: 'Missing required payment fields',
        details: { userId: !!userId, planName: !!planName, originalPrice, finalPrice, paymentMethod: !!paymentMethod }
      });
    }

    // Create payment record and activate user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          userId,
          planName,
          originalPrice: parseFloat(originalPrice),
          discount: parseFloat(discount || 0),
          finalPrice: parseFloat(finalPrice),
          couponCode: couponCode || null,
          paymentMethod,
          status: 'completed',
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        select: {
          id: true,
          userId: true,
          planName: true,
          originalPrice: true,
          discount: true,
          finalPrice: true,
          couponCode: true,
          paymentMethod: true,
          status: true,
          transactionId: true,
          createdAt: true
        }
      });

      // Activate user
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          status: 'COMPLETED'
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true
        }
      });

      return { payment, user };
    });

    res.json({
      success: true,
      payment: result.payment,
      user: result.user,
      message: 'Payment recorded and user activated successfully'
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record payment',
      details: error.message
    });
  }
});

// Get user payments endpoint
app.get('/api/payments/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        planName: true,
        originalPrice: true,
        discount: true,
        finalPrice: true,
        couponCode: true,
        paymentMethod: true,
        status: true,
        transactionId: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      payments,
      count: payments.length
    });

  } catch (error) {
    console.error('Error fetching user payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user payments',
      details: error.message
    });
  }
});

// Update user screenshot endpoint
app.post('/api/users/:userId/screenshot', async (req, res) => {
  try {
    const { userId } = req.params;
    const { screenshotUrl } = req.body;
    
    if (!screenshotUrl) {
      return res.status(400).json({
        success: false,
        error: 'Screenshot URL is required'
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { screenshotUrl },
      select: {
        id: true,
        email: true,
        fullName: true,
        screenshotUrl: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      user,
      message: 'Screenshot updated successfully'
    });

  } catch (error) {
    console.error('Error updating user screenshot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update screenshot',
      details: error.message
    });
  }
});

// Stripe Payment Intent Creation
app.post('/api/stripe/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Create a mock PaymentIntent for testing (bypasses Stripe key issues)
    console.log(`Creating mock PaymentIntent for testing: amount=${amount}, currency=${currency}, metadata=`, metadata);
    
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: currency,
      status: 'requires_payment_method',
      metadata: metadata,
      created: Math.floor(Date.now() / 1000)
    };
    
    res.json({
      clientSecret: mockPaymentIntent.client_secret,
      amount: amount,
      currency: currency,
      metadata: metadata,
      status: mockPaymentIntent.status
    });
  } catch (error) {
    console.error('Stripe PaymentIntent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent', 
      details: error.message,
      code: error.code || 'STRIPE_ERROR'
    });
  }
});

// PayPal Order Creation
app.post('/api/payment/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', plan_name = 'Trading Plan', coupon_code = '' } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // PayPal configuration
    const paypalClientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || 'ASUvkAyi9hd0D6xgfR9LgBvXWcsOg4spZd05tprIE3LNW1RyQXmzJfaHTO908qTlpmljK2qcuM7xx8xW';
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || 'EK3TSSwjQny6zybyX5Svwokawg9dhq1MdJd_AzpRanhaGrxLx0P6eqpWKewkVzINe2vpVRZFz4u9g-qr';
    const paypalBaseUrl = 'https://api.sandbox.paypal.com';

    // Get PayPal access token
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create PayPal order
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        description: `${plan_name}${coupon_code ? ` (Coupon: ${coupon_code})` : ''}`,
        amount: {
          currency_code: currency,
          value: amount.toString()
        }
      }],
      application_context: {
        return_url: 'https://www.traderedgepro.com/payment-success',
        cancel_url: 'https://www.traderedgepro.com/payment-cancelled'
      }
    };

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const order = await orderResponse.json();
    
    res.json({
      order_id: order.id,
      status: order.status,
      links: order.links
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create PayPal order', 
      details: error.message 
    });
  }
});

// PayPal Order Capture
app.post('/api/payment/paypal/capture-order', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // PayPal configuration
    const paypalClientId = process.env.PAYPAL_CLIENT_ID || process.env.VITE_PAYPAL_CLIENT_ID || 'ASUvkAyi9hd0D6xgfR9LgBvXWcsOg4spZd05tprIE3LNW1RyQXmzJfaHTO908qTlpmljK2qcuM7xx8xW';
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.VITE_PAYPAL_CLIENT_SECRET || 'EK3TSSwjQny6zybyX5Svwokawg9dhq1MdJd_AzpRanhaGrxLx0P6eqpWKewkVzINe2vpVRZFz4u9g-qr';
    const paypalBaseUrl = 'https://api.sandbox.paypal.com';

    // Get PayPal access token
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Capture PayPal order
    const captureResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      throw new Error(`PayPal order capture failed: ${errorText}`);
    }

    const captureData = await captureResponse.json();
    
    res.json({
      order_id: captureData.id,
      status: captureData.status,
      payment_id: captureData.purchase_units[0].payments.captures[0].id,
      amount: captureData.purchase_units[0].payments.captures[0].amount.value,
      currency: captureData.purchase_units[0].payments.captures[0].amount.currency_code
    });
  } catch (error) {
    console.error('PayPal order capture error:', error);
    res.status(500).json({ 
      error: 'Failed to capture PayPal order', 
      details: error.message 
    });
  }
});

// Update user status to COMPLETED after payment
app.patch('/api/users/:userId/activate', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'COMPLETED'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      user,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('User activation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate user',
      details: error.message
    });
  }
});

// User registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const body = req.body;
    
    // Validate input
    const validationResult = SignupSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
    }

    const data = validationResult.data;

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const existing = await tx.user.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new Error('User already exists');
      }

      // Create new user
      return await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          fullName: data.fullName,
          // selectedPlan: data.selectedPlan, // Temporarily commented out until DB is updated
          questionnaireData: data.questionnaire,
          screenshotUrl: data.screenshot,
          riskManagementPlan: data.riskManagementPlan,
          status: 'PENDING',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          // selectedPlan: true, // Temporarily commented out until DB is updated
          createdAt: true,
        },
      });
    });

    res.json({
      success: true,
      user,
      message: 'Registration successful',
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    if (error.message === 'User already exists') {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Fetch users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    // Simplified query without orderBy to test
    const users = await prisma.user.findMany({
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        fullName: true,
        questionnaireData: true,
        screenshotUrl: true,
        riskManagementPlan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      users,
      count: users.length,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error.message
    });
  }
});

// Update user status endpoint
app.patch('/api/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;
    
    const validationResult = StatusUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        status: validationResult.data.status,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    });
  }
});

// Get user by ID endpoint
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        questionnaireData: true,
        screenshotUrl: true,
        riskManagementPlan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Database setup: http://localhost:${PORT}/setup-db`);
  console.log(`Database test: http://localhost:${PORT}/test-db`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
