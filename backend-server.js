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
    console.log('CORS origin:', origin); // Add this line for debugging
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
    
    // Create User table if it doesn't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "password_hash" TEXT NOT NULL,
        "full_name" TEXT,
        "questionnaire_data" JSONB,
        "screenshot_url" TEXT,
        "risk_management_plan" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("created_at");`;
    
    // Create updated_at trigger
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `;
    
    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
      CREATE TRIGGER update_user_updated_at
        BEFORE UPDATE ON "User"
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;
    
    console.log('Database setup completed successfully');
    res.json({ 
      success: true, 
      message: 'Database tables and indexes created successfully',
      timestamp: new Date().toISOString()
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
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          phone: data.phone,
          company: data.company,
          country: data.country,
          tradingExperience: data.tradingExperience,
          tradingGoals: data.tradingGoals,
          riskTolerance: data.riskTolerance,
          preferredMarkets: data.preferredMarkets,
          tradingStyle: data.tradingStyle,
          agreeToMarketing: data.agreeToMarketing || false,
          questionnaireData: data.questionnaire,
          screenshotUrl: data.screenshot,
          riskManagementPlan: data.riskManagementPlan,
          status: 'PENDING',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          fullName: true,
          phone: true,
          company: true,
          country: true,
          tradingExperience: true,
          tradingGoals: true,
          riskTolerance: true,
          preferredMarkets: true,
          tradingStyle: true,
          agreeToMarketing: true,
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
      error: 'Internal server error'
    });
  }
});

// Fetch users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    
    const where = status ? 
      { status: status } : 
      { status: { in: ['PENDING', 'PROCESSING'] } };

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      error: 'Failed to fetch users'
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
