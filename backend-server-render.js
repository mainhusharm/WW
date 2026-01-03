import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Resend } from 'resend';
import { User, Payment, Otp } from './models/index.js';

const app = express();

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.DATABASE_URL || 'mongodb+srv://giggletales18_db_user:oBGfhw630MSgOxib@cluster0.a7adbhy.mongodb.net/Traderedgepro?retryWrites=true&w=majority';
    await mongoose.connect(mongoUrl);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Initialize Resend (optional - will fail gracefully if no API key)
let resend = null;
if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_api_key_here' && process.env.RESEND_API_KEY !== 're_test_dummy_key') {
  try {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('Resend email service initialized');
  } catch (error) {
    console.warn('Failed to initialize Resend:', error.message);
  }
} else {
  console.warn('RESEND_API_KEY not set - email functionality will be disabled');
}

// Production CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://www.traderedgepro.com',
      'https://traderedgepro.com',
      'https://backend-ox9b.onrender.com',
      'https://node-backend-88pg.onrender.com'
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Origin',
    'Accept',
    'X-Client-Info'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

app.use(express.json());

// Validation schemas
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  country: z.string(),
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

// Database setup endpoint for Render (MongoDB - no setup needed)
app.get('/setup-db', async (req, res) => {
  try {
    console.log('MongoDB setup check...');

    // Check MongoDB connection
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('MongoDB setup check completed successfully');
    res.json({
      success: true,
      message: 'MongoDB connection verified - no setup needed',
      collections: collections.map(c => c.name),
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
    // Check MongoDB connection and get basic stats
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Get user count
    const userCount = await User.countDocuments();

    // Get sample users
    const users = await User.find({}, 'id email fullName status createdAt').limit(5).sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'Database connection successful',
      collections: collections.map(c => c.name),
      userCount: userCount,
      users: users,
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

// Debug database collections
app.get('/debug-db', async (req, res) => {
  try {
    // Check MongoDB collections and sample data
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const usersCount = await User.countDocuments();
    const usersSample = await User.find({}, 'id email fullName status createdAt').limit(3).sort({ createdAt: -1 });

    res.json({
      success: true,
      collections: collections.map(c => c.name),
      usersCount: usersCount,
      usersSample: usersSample,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple test endpoint for users
app.get('/test-users', async (req, res) => {
  try {
    // Get sample users from MongoDB
    const users = await User.find({}, 'id email fullName status createdAt').limit(5).sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users,
      count: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test users error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});



// Generate OTP code
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP endpoint
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please sign up first.'
      });
    }

    // Mark any existing unused OTPs as used (invalidate previous codes)
    await Otp.updateMany(
      { email: email.toLowerCase(), used: false },
      { used: true }
    );

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save new OTP to database using Mongoose
    await Otp.create({
      email: email.toLowerCase(),
      code: otp,
      expiresAt: expiresAt,
      used: false,
    });

    // Send email with Resend using the AuthEmail template
    if (!resend) {
      console.warn('Email service not configured - skipping OTP email');
      return res.json({
        success: true,
        message: 'OTP generated (email service not configured)'
      });
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'Trading Platform <noreply@traderedgepro.com>',
        to: [email],
        subject: 'Your Trader Edge Pro verification code: ' + otp,
        html: `
          <!DOCTYPE html>
          <html>
            <head></head>
            <body style="background-color: #0a0e27; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px 20px;">
              <div style="margin: 0 auto; padding: 0; max-width: 600px;">
                <!-- Logo -->
                <div style="text-align: center; padding: 30px 0 20px;">
                  <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); width: 60px; height: 60px; border-radius: 14px; display: inline-block; line-height: 60px;">
                    <span style="font-size: 26px; font-weight: bold; color: #ffffff; margin: 0;">TE</span>
                  </div>
                  <div style="color: #64748b; font-size: 12px; letter-spacing: 3px; margin: 15px 0 0;">SECURITY VERIFICATION</div>
                </div>

                <!-- Security Icon -->
                <div style="text-align: center; padding: 20px 0;">
                  <span style="font-size: 50px; margin: 0;">🔐</span>
                </div>

                <!-- Main Heading -->
                <h1 style="color: #ffffff; font-size: 26px; text-align: center; margin: 0 0 15px;">Verify Your Identity</h1>

                <p style="color: #94a3b8; font-size: 15px; text-align: center; line-height: 1.6;">
                  Use the verification code below to complete your sign-in.
                  This code will expire in <strong style="color: #a855f7;">10 minutes</strong>.
                </p>

                <!-- OTP Box -->
                <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px solid rgba(124, 58, 237, 0.4); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                  <div style="color: #64748b; font-size: 12px; letter-spacing: 2px; margin: 0 0 10px;">YOUR VERIFICATION CODE</div>
                  <div style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace; margin: 0;">${otp}</div>
                </div>

                <!-- Security Warning -->
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <div style="color: #fca5a5; font-size: 13px; font-weight: 600; margin: 0 0 5px;">⚠️ Security Notice</div>
                  <div style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                    If you didn't request this code, please ignore this email
                    or contact our support team immediately. Never share this
                    code with anyone.
                  </div>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; margin-top: 30px; text-align: center;">
                  <div style="color: #64748b; font-size: 12px;">© 2024 Trader Edge Pro. All rights reserved.</div>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send email'
        });
      }

      console.log('OTP sent successfully to:', email);
      res.json({
        success: true,
        message: 'OTP sent to your email'
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP email'
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify OTP endpoint
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required'
      });
    }

    // Find valid OTP using Mongoose
    const otpRecord = await Otp.findOne({
      email: email.toLowerCase(),
      code: otpCode,
      used: false,
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Mark OTP as used
    await Otp.findByIdAndUpdate(otpRecord._id, { used: true });

    // Get user data
    const user = await User.findOne(
      { email: email.toLowerCase() },
      {
        id: 1,
        email: 1,
        firstName: 1,
        lastName: 1,
        fullName: 1,
        phone: 1,
        company: 1,
        country: 1,
        tradingExperience: 1,
        tradingGoals: 1,
        riskTolerance: 1,
        preferredMarkets: 1,
        tradingStyle: 1,
        agreeToMarketing: 1,
        questionnaireData: 1,
        screenshotUrl: 1,
        riskManagementPlan: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully',
      user
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// User login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Return user data (without password)
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.passwordHash;

    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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

    // Check if user exists
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Create new user
    const user = await User.create({
      email: data.email.toLowerCase(),
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
      questionnaireData: data.questionnaire ? JSON.stringify(data.questionnaire) : null,
      screenshotUrl: data.screenshot,
      riskManagementPlan: data.riskManagementPlan,
      status: 'PENDING',
    });

    // Return user data without password
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.passwordHash;

    // Send welcome email after successful registration
    if (resend) {
      try {
        const { data: emailData, error } = await resend.emails.send({
          from: 'Trading Platform <noreply@traderedgepro.com>',
          to: [data.email],
          subject: 'Welcome to Trader Edge Pro!',
          html: `
            <!DOCTYPE html>
            <html>
              <head></head>
              <body style="background-color: #0a0e27; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px 20px;">
                <div style="margin: 0 auto; padding: 0; max-width: 600px;">
                  <!-- Logo -->
                  <div style="text-align: center; padding: 30px 0 20px;">
                    <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); width: 60px; height: 60px; border-radius: 14px; display: inline-block; line-height: 60px;">
                      <span style="font-size: 26px; font-weight: bold; color: #ffffff; margin: 0;">TE</span>
                    </div>
                    <div style="color: #64748b; font-size: 12px; letter-spacing: 3px; margin: 15px 0 0;">WELCOME</div>
                  </div>

                  <!-- Welcome Icon -->
                  <div style="text-align: center; padding: 20px 0;">
                    <span style="font-size: 50px; margin: 0;">🎉</span>
                  </div>

                  <!-- Main Heading -->
                  <h1 style="color: #ffffff; font-size: 26px; text-align: center; margin: 0 0 15px;">Welcome to Trader Edge Pro!</h1>

                  <p style="color: #94a3b8; font-size: 15px; text-align: center; line-height: 1.6;">
                    Thank you for registering! We're excited to have you join our community
                    of successful traders. Your account has been created successfully.
                  </p>

                  <!-- Success Box -->
                  <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px solid rgba(34, 197, 94, 0.4); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                    <div style="color: #22c55e; font-size: 18px; font-weight: bold; margin: 0 0 10px;">✅ ACCOUNT CREATED</div>
                    <div style="color: #ffffff; font-size: 14px; margin: 0;">Welcome aboard, ${data.firstName || data.fullName || 'Trader'}!</div>
                  </div>

                  <!-- What's Next -->
                  <div style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                    <div style="color: #a855f7; font-size: 13px; font-weight: 600; margin: 0 0 10px;">🚀 What's Next?</div>
                    <ul style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0; padding-left: 20px;">
                      <li>Complete your payment to unlock premium features</li>
                      <li>Fill out your trading questionnaire</li>
                      <li>Access your personalized dashboard</li>
                      <li>Start receiving trading signals</li>
                    </ul>
                  </div>

                  <!-- Login Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://www.traderedgepro.com/login"
                       style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                      🚀 Continue to Payment
                    </a>
                  </div>

                  <!-- Footer -->
                  <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; margin-top: 30px; text-align: center;">
                    <div style="color: #64748b; font-size: 12px;">© 2024 Trader Edge Pro. All rights reserved.</div>
                    <div style="color: #64748b; font-size: 10px; margin-top: 10px;">
                      Need help? Contact us at traderredgepro@gmail.com
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (error) {
          console.error('Welcome email error:', error);
          // Don't fail registration if email fails, but log it
        } else {
          console.log('Welcome email sent successfully to:', data.email);
        }
      } catch (emailError) {
        console.error('Email sending error during registration:', emailError);
        // Don't fail registration if email fails
      }
    }

    res.json({
      success: true,
      user: userWithoutPassword,
      message: 'Registration successful. Welcome to Trader Edge Pro!',
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
      {}; // Show all users if no status filter

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

// Payment completion endpoint
app.post('/api/payment/complete', async (req, res) => {
  try {
    const { email, paymentId, planData } = req.body;

    if (!email || !paymentId) {
      return res.status(400).json({
        success: false,
        error: 'Email and payment ID are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user status to COMPLETED
    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      }
    });

    // Send welcome email after successful payment
    try {
      const { data, error } = await resend.emails.send({
        from: 'Trading Platform <noreply@traderedgepro.com>',
        to: [email],
        subject: 'Welcome to Trader Edge Pro - Your Account is Ready!',
        html: `
          <!DOCTYPE html>
          <html>
            <head></head>
            <body style="background-color: #0a0e27; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 40px 20px;">
              <div style="margin: 0 auto; padding: 0; max-width: 600px;">
                <!-- Logo -->
                <div style="text-align: center; padding: 30px 0 20px;">
                  <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); width: 60px; height: 60px; border-radius: 14px; display: inline-block; line-height: 60px;">
                    <span style="font-size: 26px; font-weight: bold; color: #ffffff; margin: 0;">TE</span>
                  </div>
                  <div style="color: #64748b; font-size: 12px; letter-spacing: 3px; margin: 15px 0 0;">WELCOME</div>
                </div>

                <!-- Welcome Icon -->
                <div style="text-align: center; padding: 20px 0;">
                  <span style="font-size: 50px; margin: 0;">🎉</span>
                </div>

                <!-- Main Heading -->
                <h1 style="color: #ffffff; font-size: 26px; text-align: center; margin: 0 0 15px;">Welcome to Trader Edge Pro!</h1>

                <p style="color: #94a3b8; font-size: 15px; text-align: center; line-height: 1.6;">
                  Congratulations! Your payment has been processed successfully.
                  Your account is now fully activated and ready to use.
                </p>

                <!-- Success Box -->
                <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%); border: 2px solid rgba(34, 197, 94, 0.4); border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                  <div style="color: #22c55e; font-size: 18px; font-weight: bold; margin: 0 0 10px;">✅ PAYMENT CONFIRMED</div>
                  <div style="color: #ffffff; font-size: 14px; margin: 0;">Payment ID: ${paymentId}</div>
                  <div style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">Plan: ${planData?.name || 'Premium'}</div>
                </div>

                <!-- What's Next -->
                <div style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                  <div style="color: #a855f7; font-size: 13px; font-weight: 600; margin: 0 0 10px;">🚀 What's Next?</div>
                  <ul style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0; padding-left: 20px;">
                    <li>Complete your trading questionnaire</li>
                    <li>Access your personalized dashboard</li>
                    <li>Start receiving trading signals</li>
                    <li>Join our community forum</li>
                  </ul>
                </div>

                <!-- Login Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://www.traderedgepro.com/login"
                     style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); color: #ffffff; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    🚀 Access Your Dashboard
                  </a>
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px; margin-top: 30px; text-align: center;">
                  <div style="color: #64748b; font-size: 12px;">© 2024 Trader Edge Pro. All rights reserved.</div>
                  <div style="color: #64748b; font-size: 10px; margin-top: 10px;">
                    Need help? Contact us at traderredgepro@gmail.com
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      if (error) {
        console.error('Welcome email error:', error);
      } else {
        console.log('Welcome email sent successfully to:', email);
      }
    } catch (emailError) {
      console.error('Welcome email sending error:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment completed successfully',
      user: {
        id: user.id,
        email: user.email,
        status: 'COMPLETED'
      }
    });

  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete payment'
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

// ===== ADMIN ENDPOINTS =====

// Admin Dashboard - Main stats
app.get('/admin', async (req, res) => {
  try {
    // Get comprehensive stats
    const userCount = await prisma.user.count();
    const completedUsers = await prisma.user.count({ where: { status: 'COMPLETED' } });
    const pendingUsers = await prisma.user.count({ where: { status: 'PENDING' } });
    const activeUsers = await prisma.user.count({ where: { isActive: true } });

    const paymentCount = await prisma.payment.count();
    const completedPayments = await prisma.payment.count({ where: { status: 'completed' } });

    const signalCount = await prisma.signal.count();
    const questionnaireCount = await prisma.questionnaire.count({ where: { isCompleted: true } });

    // Recent users
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true,
      },
    });

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, fullName: true }
        }
      },
    });

    res.json({
      success: true,
      stats: {
        users: {
          total: userCount,
          completed: completedUsers,
          pending: pendingUsers,
          active: activeUsers,
        },
        payments: {
          total: paymentCount,
          completed: completedPayments,
        },
        signals: signalCount,
        questionnaires: questionnaireCount,
      },
      recentUsers,
      recentPayments,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin - List all users with pagination and filters
app.get('/admin/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      email,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (status) where.status = status;
    if (email) where.email = { contains: email, mode: 'insensitive' };

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phone: true,
        company: true,
        country: true,
        status: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            payments: true,
            signals: true,
            journalEntries: true,
          }
        }
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin - Get specific user details
app.get('/admin/user/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    // Find user by ID or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: identifier },
          { email: identifier }
        ]
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        questionnaire: true,
        signals: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        journalEntries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        aiChatMessages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        supportMessages: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        performanceMetrics: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            payments: true,
            signals: true,
            journalEntries: true,
            aiChatMessages: true,
            supportMessages: true,
            notifications: true,
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin user details error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin - Search users
app.get('/admin/search', async (req, res) => {
  try {
    const { q, type = 'users', limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    let results = [];

    if (type === 'users' || type === 'all') {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { fullName: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ]
        },
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          fullName: true,
          status: true,
          createdAt: true,
        },
      });
      results.push({ type: 'users', data: users });
    }

    if (type === 'payments' || type === 'all') {
      const payments = await prisma.payment.findMany({
        where: {
          OR: [
            { transactionId: { contains: q } },
            { user: { email: { contains: q, mode: 'insensitive' } } }
          ]
        },
        take: parseInt(limit),
        include: {
          user: { select: { email: true, fullName: true } }
        },
      });
      results.push({ type: 'payments', data: payments });
    }

    res.json({
      success: true,
      query: q,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin search error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin - Export data
app.get('/admin/export/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'json' } = req.query;

    let data = [];
    let filename = `${type}_export_${new Date().toISOString().split('T')[0]}`;

    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            fullName: true,
            firstName: true,
            lastName: true,
            phone: true,
            company: true,
            country: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        break;

      case 'payments':
        data = await prisma.payment.findMany({
          include: {
            user: { select: { email: true, fullName: true } }
          },
        });
        break;

      case 'questionnaires':
        data = await prisma.questionnaire.findMany({
          include: {
            user: { select: { email: true, fullName: true } }
          },
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid export type. Use: users, payments, questionnaires',
        });
    }

    if (format === 'csv') {
      // Simple CSV conversion (for basic data)
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({ data, count: data.length, exportedAt: new Date().toISOString() });
    }

  } catch (error) {
    console.error('Admin export error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Simple CSV conversion helper
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row).map(value =>
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    ).join(',')
  );

  return [headers, ...rows].join('\n');
}

// Bulk data endpoint for futures data (production fallback)
app.post('/api/bulk', async (req, res) => {
  try {
    const { symbols, timeframe } = req.body;

    if (!symbols || !Array.isArray(symbols)) {
      return res.status(400).json({
        success: false,
        error: 'Symbols array is required'
      });
    }

    // Generate mock futures data for production fallback
    const mockData = symbols.map(symbol => ({
      symbol,
      name: symbol,
      price: Math.random() * 1000 + 100,
      change: (Math.random() - 0.5) * 20,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 1000000),
      marketState: 'REGULAR',
      category: 'futures',
      timestamp: new Date().toISOString(),
      previousClose: Math.random() * 1000 + 100
    }));

    res.json({
      success: true,
      data: mockData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching bulk data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bulk data'
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
  console.log(`Backend server running on port ${PORT} - updated`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Database setup: http://localhost:${PORT}/setup-db`);
  console.log(`Database test: http://localhost:${PORT}/test-db`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});
