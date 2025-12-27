// Load environment variables - try .env.local first (dev), then fallback to system env vars (production)
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { Resend } = require('resend');

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

console.log('🔧 CORS Origins configured:', corsOrigins);

// More permissive CORS for development and testing
app.use(cors({
  origin: function (origin, callback) {
    console.log('🔒 CORS origin request:', origin);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }

    // Allow localhost for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      console.log('✅ CORS: Allowing localhost origin:', origin);
      return callback(null, true);
    }

    // Check if origin is in our allowed list
    if (corsOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowing whitelisted origin:', origin);
      return callback(null, true);
    }

    // For development, allow all onrender.com domains
    if (origin && origin.includes('onrender.com')) {
      console.log('✅ CORS: Allowing onrender.com domain:', origin);
      return callback(null, true);
    }

    // TEMPORARILY allow traderedgepro.com domains for debugging
    if (origin && origin.includes('traderedgepro.com')) {
      console.log('✅ CORS: Allowing traderedgepro.com domain (temp):', origin);
      return callback(null, true);
    }

    console.log('❌ CORS: Rejecting origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
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

    // Create User table if it doesn't exist - simplified for SQLite
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        questionnaire_data TEXT,
        screenshot_url TEXT,
        risk_management_plan TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        company TEXT,
        country TEXT,
        trading_experience TEXT,
        trading_goals TEXT,
        risk_tolerance TEXT,
        preferred_markets TEXT,
        trading_style TEXT,
        agree_to_marketing BOOLEAN DEFAULT 0
      );
    `;

    console.log('Database setup completed successfully');
    res.json({
      success: true,
      message: 'Database tables created successfully',
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
      result: 1,
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

// User login endpoint - sends auth email
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const requestTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/verify?token=${otpCode}&email=${encodeURIComponent(email)}`;

    const htmlContent = generateAuthEmailHTML({
      otpCode,
      verificationUrl,
      requestTime,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      location: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'
    });

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: 'Your verification code',
      html: htmlContent,
      text: `Your Trader Edge Pro verification code: ${otpCode}

This code expires in 10 minutes.

Verify here: ${verificationUrl}

© 2024 Trader Edge Pro`
    });

    if (error) {
      console.error('Auth email error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    // Store OTP temporarily (use Redis/database in production)
    otpStore.set(email, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      messageId: data?.id,
      // Don't return OTP in production!
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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

      // Store user data temporarily until payment is completed
    const tempUserData = {
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
    };

    // Store in temporary storage until payment is completed
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (!global.tempUsers) global.tempUsers = new Map();
    global.tempUsers.set(tempUserId, tempUserData);

    // Return temporary user data (not saved to database yet)
    const user = {
      id: tempUserId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: tempUserData.fullName,
      phone: data.phone,
      company: data.company,
      country: data.country,
      tradingExperience: data.tradingExperience,
      tradingGoals: data.tradingGoals,
      riskTolerance: data.riskTolerance,
      preferredMarkets: data.preferredMarkets,
      tradingStyle: data.tradingStyle,
      agreeToMarketing: tempUserData.agreeToMarketing,
      createdAt: new Date().toISOString(),
      isTemporary: true, // Mark as temporary
    };

    // Send OTP verification email after successful registration
    try {
      // Generate 6-digit OTP for email verification
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      const requestTime = new Date().toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'UTC',
      }) + ' UTC';

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/verify?token=${otpCode}&email=${encodeURIComponent(user.email)}`;

      const htmlContent = generateAuthEmailHTML({
        otpCode,
        verificationUrl,
        requestTime,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        location: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'
      });

      await resend.emails.send({
        from: emailConfig.from,
        to: user.email,
        replyTo: emailConfig.replyTo,
        subject: 'Verify your Trader Edge Pro account',
        html: htmlContent,
        text: `Welcome to Trader Edge Pro!

Your verification code: ${otpCode}

This code expires in 10 minutes.

Verify here: ${verificationUrl}

Complete your account setup to access premium trading tools.

© 2024 Trader Edge Pro`
      });

      // Store OTP for verification
      otpStore.set(user.email, {
        code: otpCode,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        attempts: 0
      });

      console.log(`Verification email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Verification email failed to send:', emailError);
      // Don't fail registration if email fails - user can request new code
    }

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

// In-memory OTP storage (use Redis/database in production)
const otpStore = new Map();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const emailConfig = {
  from: 'Trader Edge Pro <noreply@traderedgepro.com>',
  replyTo: 'support@traderedgepro.com',
};

// Generate welcome email HTML
function generateWelcomeEmailHTML({ userName, dashboardUrl }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Trader Edge Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0e27;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background: linear-gradient(135deg, #0a0e27 0%, #1a1f3c 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(124, 58, 237, 0.25);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 0;">
                            <div style="height: 6px; background: linear-gradient(90deg, #7c3aed, #3b82f6, #8b5cf6, #2563eb, #7c3aed); background-size: 200% 100%;"></div>
                        </td>
                    </tr>

                    <!-- Logo Section -->
                    <tr>
                        <td align="center" style="padding: 50px 40px 30px;">
                            <table role="presentation" style="border-collapse: collapse;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); width: 70px; height: 70px; border-radius: 16px; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 32px; font-weight: bold; color: #ffffff;">TE</span>
                                    </td>
                                </tr>
                            </table>
                            <h1 style="color: #ffffff; font-size: 28px; margin: 20px 0 0; letter-spacing: -0.5px;">
                                TRADER EDGE <span style="background: linear-gradient(90deg, #7c3aed, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">PRO</span>
                            </h1>
                        </td>
                    </tr>

                    <!-- Welcome Message -->
                    <tr>
                        <td align="center" style="padding: 0 40px;">
                            <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 16px; padding: 30px;">
                                <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 10px;">
                                    Welcome to the Future of Trading 🚀
                                </h2>
                                <p style="color: #a5b4fc; font-size: 16px; margin: 0;">
                                    You've just unlocked access to elite trading tools
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="color: #e2e8f0; font-size: 16px; line-height: 1.8; margin: 0 0 25px;">
                                Hey <strong style="color: #ffffff;">${userName}</strong>,
                            </p>
                            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.8; margin: 0 0 25px;">
                                Congratulations on taking the first step towards clearing your funded account! You've joined an exclusive community of traders who are leveraging cutting-edge AI technology to achieve prop firm success.
                            </p>

                            <!-- CTA Button -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-weight: 600; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 10px 30px -5px rgba(124, 58, 237, 0.5);">
                                            Launch Your Dashboard →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: rgba(0,0,0,0.3); padding: 30px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <p style="color: #64748b; font-size: 12px; margin: 0 0 10px;">
                                            © 2024 Trader Edge Pro. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Generate auth email HTML
function generateAuthEmailHTML({ otpCode, verificationUrl, requestTime, ipAddress, location }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Identity - Trader Edge Pro</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0e27;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background: linear-gradient(180deg, #0a0e27 0%, #1a1f3c 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(124, 58, 237, 0.25);">

                    <!-- Logo Section -->
                    <tr>
                        <td align="center" style="padding: 50px 40px 20px;">
                            <table role="presentation" style="border-collapse: collapse;">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); width: 60px; height: 60px; border-radius: 14px; text-align: center; vertical-align: middle;">
                                        <span style="font-size: 26px; font-weight: bold; color: #ffffff;">TE</span>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #64748b; font-size: 12px; letter-spacing: 3px; margin: 15px 0 0; text-transform: uppercase;">
                                Security Verification
                            </p>
                        </td>
                    </tr>

                    <!-- Main Heading -->
                    <tr>
                        <td align="center" style="padding: 20px 40px 10px;">
                            <h1 style="color: #ffffff; font-size: 26px; margin: 0; letter-spacing: -0.5px;">
                                Verify Your Identity
                            </h1>
                        </td>
                    </tr>

                    <!-- Subtext -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px;">
                            <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0;">
                                Use the verification code below to complete your sign-in.<br>
                                This code will expire in <strong style="color: #a855f7;">10 minutes</strong>.
                            </p>
                        </td>
                    </tr>

                    <!-- OTP Code Box -->
                    <tr>
                        <td align="center" style="padding: 0 40px 30px;">
                            <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px solid rgba(124, 58, 237, 0.4); border-radius: 16px; padding: 30px 50px; display: inline-block;">
                                <p style="color: #64748b; font-size: 12px; margin: 0 0 10px; letter-spacing: 2px; text-transform: uppercase;">
                                    Your Verification Code
                                </p>
                                <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
                                    ${otpCode}
                                </div>
                            </div>
                        </td>
                    </tr>

                    <!-- Magic Link Button -->
                    <tr>
                        <td align="center" style="padding: 10px 40px 40px;">
                            <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 12px; font-weight: 600; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 10px 30px -5px rgba(124, 58, 237, 0.4);">
                                ✨ Verify My Account
                            </a>
                        </td>
                    </tr>

                    <!-- Security Warning -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px;">
                                <p style="color: #fca5a5; font-size: 13px; font-weight: 600; margin: 0 0 5px;">
                                    Security Notice
                                </p>
                                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                                    If you didn't request this code, please ignore this email or contact our support team immediately. Never share this code with anyone.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Request Details -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px;">
                                <p style="color: #64748b; font-size: 11px; margin: 0 0 15px; text-transform: uppercase; letter-spacing: 1px;">
                                    Request Details
                                </p>
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                            <span style="color: #64748b; font-size: 12px;">Time</span>
                                        </td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">
                                            <span style="color: #e2e8f0; font-size: 12px;">${requestTime}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                            <span style="color: #64748b; font-size: 12px;">IP Address</span>
                                        </td>
                                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: right;">
                                            <span style="color: #e2e8f0; font-size: 12px;">${ipAddress}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0;">
                                            <span style="color: #64748b; font-size: 12px;">Location</span>
                                        </td>
                                        <td style="padding: 8px 0; text-align: right;">
                                            <span style="color: #e2e8f0; font-size: 12px;">${location}</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: rgba(0,0,0,0.3); padding: 30px 40px;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td align="center">
                                        <p style="color: #64748b; font-size: 12px; margin: 0 0 10px;">
                                            © 2024 Trader Edge Pro. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Welcome email endpoint
app.post('/api/email/welcome', async (req, res) => {
  try {
    const { email, userName } = req.body;

    if (!email || !userName) {
      return res.status(400).json({
        success: false,
        error: 'Email and userName are required'
      });
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/dashboard`;
    const htmlContent = generateWelcomeEmailHTML({ userName, dashboardUrl });

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: '🚀 Welcome to Trader Edge Pro - Your Trading Journey Begins!',
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send email'
      });
    }

    res.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// OTP verification endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP code are required'
      });
    }

    // Check for login OTP first (has completion status)
    const loginKey = `${email}_login`;
    let otpData = otpStore.get(loginKey);

    if (otpData) {
      // This is a login verification
      console.log(`🔐 Processing login verification for ${email}`);

      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        otpStore.delete(loginKey);
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired. Please request a new one.'
        });
      }

      // Check if too many attempts
      if (otpData.attempts >= 3) {
        otpStore.delete(loginKey);
        return res.status(429).json({
          success: false,
          error: 'Too many failed attempts. Please request a new verification code.'
        });
      }

      // Verify OTP code
      if (otpData.code !== otpCode) {
        otpData.attempts += 1;
        otpStore.set(loginKey, otpData);
        return res.status(400).json({
          success: false,
          error: `Invalid verification code. ${3 - otpData.attempts} attempts remaining.`
        });
      }

      // Login OTP verified successfully
      otpStore.delete(loginKey);

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          questionnaireData: true,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Generate session token
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        success: true,
        message: 'Login successful',
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status
        },
        completionStatus: otpData.completionStatus, // Include completion status for routing
      });

    } else {
      // Check for signup OTP
      otpData = otpStore.get(email);

      if (!otpData) {
        return res.status(400).json({
          success: false,
          error: 'No verification code found. Please request a new one.'
        });
      }

      console.log(`🔐 Processing signup verification for ${email}`);

      // Check if OTP has expired
      if (Date.now() > otpData.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({
          success: false,
          error: 'Verification code has expired. Please request a new one.'
        });
      }

      // Check if too many attempts
      if (otpData.attempts >= 3) {
        otpStore.delete(email);
        return res.status(429).json({
          success: false,
          error: 'Too many failed attempts. Please request a new verification code.'
        });
      }

      // Verify OTP code
      if (otpData.code !== otpCode) {
        otpData.attempts += 1;
        otpStore.set(email, otpData);
        return res.status(400).json({
          success: false,
          error: `Invalid verification code. ${3 - otpData.attempts} attempts remaining.`
        });
      }

      // Signup OTP verified successfully
      otpStore.delete(email);

      // Check if user exists in database (might be a temporary user)
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Check if this is a temporary user (signup not completed)
        if (!global.tempUsers) global.tempUsers = new Map();

        let tempUserData = null;
        for (const [id, userData] of global.tempUsers.entries()) {
          if (userData.email === email) {
            tempUserData = userData;
            break;
          }
        }

        if (tempUserData) {
          return res.json({
            success: true,
            message: 'Email verified successfully. Please complete payment to finish registration.',
            sessionToken: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            user: {
              id: `temp_${email}`,
              email: email,
              fullName: tempUserData.fullName,
              status: 'EMAIL_VERIFIED'
            },
            requiresPayment: true,
          });
        }

        return res.status(404).json({
          success: false,
          error: 'User registration data not found. Please sign up again.'
        });
      }

      // Generate session token
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Update user status if needed
      if (user.status === 'PENDING') {
        await prisma.user.update({
          where: { email },
          data: { status: 'VERIFIED' }
        });
      }

      res.json({
        success: true,
        message: 'Verification successful',
        sessionToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status
        }
      });
    }

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Resend OTP endpoint
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const requestTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/verify?token=${otpCode}&email=${encodeURIComponent(email)}`;

    const htmlContent = generateAuthEmailHTML({
      otpCode,
      verificationUrl,
      requestTime,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      location: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'
    });

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: 'Your verification code (resent)',
      html: htmlContent,
      text: `Your Trader Edge Pro verification code (resent): ${otpCode}

This code expires in 10 minutes.

Verify here: ${verificationUrl}

© 2024 Trader Edge Pro`
    });

    if (error) {
      console.error('Resend OTP error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to resend verification email'
      });
    }

    // Store new OTP (overwrite any existing)
    otpStore.set(email, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0
    });

    res.json({
      success: true,
      message: 'Verification code resent to your email',
      messageId: data?.id,
      // Don't return OTP in production!
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Auth email endpoint
app.post('/api/email/auth', async (req, res) => {
  try {
    const { email, ipAddress, location } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const requestTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/verify?token=${otpCode}&email=${encodeURIComponent(email)}`;

    const htmlContent = generateAuthEmailHTML({
      otpCode,
      verificationUrl,
      requestTime,
      ipAddress: ipAddress || 'Unknown',
      location: location || 'Unknown'
    });

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: `🔐 Your Trader Edge Pro verification code: ${otpCode}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      messageId: data?.id,
      // Don't return OTP in production!
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });
  } catch (error) {
    console.error('Auth email error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Payment completion endpoint - saves user to database
app.post('/api/payment/complete', async (req, res) => {
  try {
    const { email, paymentId, planData } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user data exists in temporary storage
    if (!global.tempUsers) {
      global.tempUsers = new Map();
    }

    // Find temporary user data by email
    let tempUserId = null;
    let tempUserData = null;

    for (const [id, userData] of global.tempUsers.entries()) {
      if (userData.email === email) {
        tempUserId = id;
        tempUserData = userData;
        break;
      }
    }

    if (!tempUserData) {
      return res.status(404).json({
        success: false,
        error: 'User registration data not found. Please sign up again.'
      });
    }

    // Check if user already exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Save user to database now that payment is complete
    const user = await prisma.user.create({
      data: {
        email: tempUserData.email,
        passwordHash: tempUserData.passwordHash,
        firstName: tempUserData.firstName,
        lastName: tempUserData.lastName,
        fullName: tempUserData.fullName,
        phone: tempUserData.phone,
        company: tempUserData.company,
        country: tempUserData.country,
        tradingExperience: tempUserData.tradingExperience,
        tradingGoals: tempUserData.tradingGoals,
        riskTolerance: tempUserData.riskTolerance,
        preferredMarkets: tempUserData.preferredMarkets,
        tradingStyle: tempUserData.tradingStyle,
        agreeToMarketing: tempUserData.agreeToMarketing,
        questionnaireData: tempUserData.questionnaireData,
        screenshotUrl: tempUserData.screenshotUrl,
        riskManagementPlan: tempUserData.riskManagementPlan,
        status: 'PAYMENT_COMPLETED', // Mark as payment completed
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

    // Remove from temporary storage
    if (tempUserId) {
      global.tempUsers.delete(tempUserId);
    }

    console.log(`✅ User ${email} saved to database after payment completion`);

    // Send welcome email
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/dashboard`;
      const htmlContent = generateWelcomeEmailHTML({
        userName: user.fullName || user.firstName || 'Trader',
        dashboardUrl
      });

      await resend.emails.send({
        from: emailConfig.from,
        to: user.email,
        replyTo: emailConfig.replyTo,
        subject: '🎉 Welcome to Trader Edge Pro - Payment Confirmed!',
        html: htmlContent,
      });

      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Welcome email failed to send:', emailError);
      // Don't fail the payment completion if email fails
    }

    res.json({
      success: true,
      user,
      message: 'Payment completed successfully. User account created.',
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete payment processing'
    });
  }
});

// Login endpoint with completion status checking
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        questionnaireData: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Account not found. Please sign up first.'
      });
    }

    // Determine completion status
    const hasQuestionnaire = user.questionnaireData && Object.keys(user.questionnaireData).length > 0;
    const completionStatus = {
      paymentCompleted: true, // User exists in DB means payment was completed
      questionnaireCompleted: hasQuestionnaire,
      canAccessDashboard: hasQuestionnaire, // Can access dashboard only if questionnaire is done
      needsQuestionnaire: !hasQuestionnaire,
    };

    // Generate OTP for login verification
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const requestTime = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://traderedgepro.com'}/verify?token=${otpCode}&email=${encodeURIComponent(email)}`;

    const htmlContent = generateAuthEmailHTML({
      otpCode,
      verificationUrl,
      requestTime,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      location: req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'Unknown'
    });

    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: email,
      replyTo: emailConfig.replyTo,
      subject: '🔐 Your Trader Edge Pro login code',
      html: htmlContent,
      text: `Your Trader Edge Pro login code: ${otpCode}

This code expires in 10 minutes.

Verify here: ${verificationUrl}

© 2024 Trader Edge Pro`
    });

    if (error) {
      console.error('Login email error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send login verification email'
      });
    }

    // Store OTP for login verification
    otpStore.set(`${email}_login`, {
      code: otpCode,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      completionStatus, // Include completion status
    });

    res.json({
      success: true,
      message: 'Login verification code sent to your email',
      messageId: data?.id,
      completionStatus,
      // Don't return OTP in production!
      otpCode: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
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
