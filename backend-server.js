const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
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
          questionnaireData: data.questionnaire,
          screenshotUrl: data.screenshot,
          riskManagementPlan: data.riskManagementPlan,
          status: 'PENDING',
        },
        select: {
          id: true,
          email: true,
          fullName: true,
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
