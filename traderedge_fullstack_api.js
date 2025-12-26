const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);

// WebSocket server for real-time signals
const wss = new WebSocket.Server({ server });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5173', 'https://traderedgepro.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// JWT middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// =====================================================
// API ROUTES
// =====================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// =====================================================
// 1. LIVE PAYOUT TICKER ENDPOINT
// =====================================================
app.get('/api/v1/live-payouts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      SELECT
        username_alias,
        amount,
        prop_firm_name,
        timestamp,
        currency
      FROM payouts
      WHERE is_verified = true
      ORDER BY timestamp DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      disclaimer: 'For educational purposes only. Past performance does not guarantee future results.'
    });
  } catch (error) {
    console.error('Error fetching live payouts:', error);
    res.status(500).json({ error: 'Failed to fetch live payouts' });
  }
});

// =====================================================
// 2. EARNINGS PROJECTION CALCULATOR
// =====================================================
app.post('/api/v1/calculate-projection', async (req, res) => {
  try {
    const { accountSize, winRate, rrRatio, compoundingDays } = req.body;

    if (!accountSize || accountSize < 1000 || accountSize > 1000000) {
      return res.status(400).json({ error: 'Invalid account size (must be between $1,000-$1,000,000)' });
    }

    const days = compoundingDays || 30;
    const dailyRisk = 0.005; // 0.5% risk per day
    const riskReward = rrRatio || 2;

    const projections = [50, 60, 70, 80, 90].map(rate => {
      let balance = accountSize;
      const tradesPerDay = Math.floor(accountSize / 1000); // Assuming $10 per trade setup

      for (let day = 0; day < days; day++) {
        const winningTrades = Math.floor(tradesPerDay * (rate / 100));
        const losingTrades = tradesPerDay - winningTrades;

        const dailyPnL = (winningTrades * 20) - (losingTrades * 10); // $20 win, $10 loss
        const dailyReturn = dailyPnL / balance;

        if (Math.abs(dailyReturn) > dailyRisk) {
          balance += balance * dailyRisk * Math.sign(dailyReturn);
        } else {
          balance += dailyPnL;
        }
      }

      return {
        winRate: rate,
        finalBalance: Math.round(balance * 100) / 100,
        totalReturn: Math.round(((balance - accountSize) / accountSize) * 10000) / 100,
        totalProfit: Math.round((balance - accountSize) * 100) / 100
      };
    });

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: {
        accountSize,
        projections,
        disclaimer: 'Calculations are for educational purposes only and do not guarantee actual results.'
      }
    });
  } catch (error) {
    console.error('Error calculating projection:', error);
    res.status(500).json({ error: 'Failed to calculate projection' });
  }
});

// =====================================================
// 3. PROP FIRM RECOMMENDATION WIZARD
// =====================================================
app.post('/api/v1/recommend-firms', async (req, res) => {
  try {
    const { capital, style, payoutGoal } = req.body;

    let query = `
      SELECT
        name, display_name, description, website_url, affiliate_link,
        min_account_size, max_account_size, max_leverage,
        profit_split_percentage, min_trading_days, max_trading_days,
        min_payout_days, max_payout_days, success_rate, trust_score
      FROM prop_firms
      WHERE is_active = true
    `;

    const params = [];
    let paramCount = 1;

    // Filter by capital
    if (capital) {
      if (capital === 'under25k') {
        query += ` AND max_account_size >= 25000`;
      } else if (capital === '25k-100k') {
        query += ` AND min_account_size <= 100000 AND max_account_size >= 25000`;
      } else if (capital === 'over100k') {
        query += ` AND min_account_size <= 100000`;
      }
    }

    // Filter by trading style allowances
    if (style) {
      if (style === 'scalping') {
        query += ` AND allows_scalping = true`;
      } else if (style === 'swing') {
        query += ` AND allows_hedging = true`;
      } else if (style === 'automated') {
        query += ` AND allows_eas = true`;
      }
    }

    // Order by success rate and trust score
    query += ` ORDER BY success_rate DESC, trust_score DESC LIMIT 5`;

    const result = await pool.query(query, params);

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      disclaimer: 'Firm recommendations are for educational purposes only. Always conduct your own research.'
    });
  } catch (error) {
    console.error('Error recommending firms:', error);
    res.status(500).json({ error: 'Failed to recommend firms' });
  }
});

// =====================================================
// 4. SIGNALS API ENDPOINTS
// =====================================================

// Get signals feed
app.get('/api/v1/signals', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const query = `
      SELECT
        signal_id, pair, direction, entry, stop_loss, take_profit,
        confidence_score, ai_rationale, market_sentiment,
        created_at, expires_at, expiry_minutes
      FROM signals
      WHERE is_active = true AND expires_at > NOW()
      ORDER BY confidence_score DESC, created_at DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [limit]);

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      disclaimer: 'Signals are for educational purposes only and do not constitute trading advice.'
    });
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({ error: 'Failed to fetch signals' });
  }
});

// Get specific signal logic
app.get('/api/v1/signals/:id/logic', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        signal_id, pair, ai_rationale, technical_signals,
        confidence_score, market_sentiment, created_at
      FROM signals
      WHERE signal_id = $1 AND is_active = true
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: result.rows[0],
      disclaimer: 'AI analysis is for educational purposes only.'
    });
  } catch (error) {
    console.error('Error fetching signal logic:', error);
    res.status(500).json({ error: 'Failed to fetch signal logic' });
  }
});

// =====================================================
// 5. LEAD CAPTURE & EMAIL AUTOMATION
// =====================================================
app.post('/api/v1/leads/register', async (req, res) => {
  try {
    const { email, name, source, accountSize, riskTolerance, ip, userAgent } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    // Insert lead
    const insertQuery = `
      INSERT INTO leads (
        email, name, source, source_url, ip_address, user_agent,
        account_size_interest, trading_experience
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        follow_up_count = leads.follow_up_count + 1
      RETURNING id, email
    `;

    const result = await pool.query(insertQuery, [
      email, name || null, source || 'landing_page', req.headers.referer || null,
      ip || req.ip, userAgent || req.headers['user-agent'],
      accountSize || null, riskTolerance || null
    ]);

    // Send welcome email with PDF
    try {
      const pdfUrl = `${process.env.APP_URL || 'https://traderedgepro.com'}/downloads/prop-firm-risk-management-calculator.pdf`;

      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@traderedgepro.com',
        to: email,
        subject: 'Your Free Prop Firm Risk Management Calculator',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">Welcome to TraderEdge Pro!</h1>
            <p>Thank you for your interest in our prop firm training program.</p>
            <p>As requested, here's your <strong>Free Prop Firm Risk Management Calculator</strong>:</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">📊 Position Sizing Calculator</h3>
              <p>This essential tool will help you:</p>
              <ul>
                <li>Calculate proper position sizes for any account</li>
                <li>Manage risk effectively (1-2% per trade)</li>
                <li>Avoid catastrophic losses</li>
                <li>Maximize profit potential</li>
              </ul>
            </div>

            <a href="${pdfUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
              📥 Download Your Calculator
            </a>

            <p><small><em>This is for educational purposes only and does not constitute financial advice.</em></small></p>

            <hr style="margin: 30px 0;">
            <p>Ready to take your trading to the next level?</p>
            <a href="https://traderedgepro.com/signup" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              🚀 Start Your Challenge Today
            </a>
          </div>
        `,
        attachments: [{
          filename: 'prop-firm-risk-management-calculator.pdf',
          path: './downloads/prop-firm-risk-management-calculator.pdf' // You'll need to create this file
        }]
      });

      // Update email sent status
      await pool.query(
        'UPDATE leads SET email_sent = true, email_sent_at = NOW() WHERE email = $1',
        [email]
      );

    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Lead registered successfully',
      data: { email: result.rows[0].email }
    });
  } catch (error) {
    console.error('Error registering lead:', error);
    res.status(500).json({ error: 'Failed to register lead' });
  }
});

// =====================================================
// 6. POSITION SIZING CALCULATOR
// =====================================================
app.post('/api/v1/calculator/position-size', async (req, res) => {
  try {
    const {
      accountBalance,
      riskPercentage,
      stopLossPips,
      entryPrice,
      stopLossPrice,
      currencyPair
    } = req.body;

    // Validation
    if (!accountBalance || accountBalance <= 0) {
      return res.status(400).json({ error: 'Valid account balance is required' });
    }
    if (!riskPercentage || riskPercentage <= 0 || riskPercentage > 10) {
      return res.status(400).json({ error: 'Risk percentage must be between 0.1% and 10%' });
    }

    // Calculate position size
    const riskAmount = accountBalance * (riskPercentage / 100);

    let positionSize = 0;
    let pipValue = 0;

    if (currencyPair && currencyPair.includes('JPY')) {
      // JPY pairs: pip value = position size * 0.01 (for 2 decimal places)
      pipValue = riskAmount / stopLossPips;
      positionSize = pipValue / 0.01;
    } else {
      // Other pairs: pip value = position size * 0.0001 (for 4 decimal places)
      pipValue = riskAmount / stopLossPips;
      positionSize = pipValue / 0.0001;
    }

    // Round to reasonable lot size
    positionSize = Math.floor(positionSize / 1000) * 1000; // Round to nearest 1000 units

    const potentialLoss = riskAmount;
    const potentialProfit = riskAmount * 2; // Assuming 1:2 RR

    // Store calculation session
    const sessionId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(`
      INSERT INTO calculator_sessions (
        session_id, ip_address, user_agent,
        account_balance, risk_percentage, stop_loss_pips,
        entry_price, stop_loss_price, position_size,
        risk_amount, potential_loss, potential_profit, currency_pair
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      sessionId, req.ip, req.headers['user-agent'],
      accountBalance, riskPercentage, stopLossPips || null,
      entryPrice || null, stopLossPrice || null, positionSize,
      riskAmount, potentialLoss, potentialProfit, currencyPair || 'EURUSD'
    ]);

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: {
        sessionId,
        positionSize,
        riskAmount,
        potentialLoss,
        potentialProfit,
        pipValue,
        recommendedLots: positionSize / 100000, // Convert to standard lots
        maxPositionSize: accountBalance * 0.02, // Max 2% of account
        disclaimer: 'Calculator results are for educational purposes only. Always verify calculations manually.'
      }
    });
  } catch (error) {
    console.error('Error calculating position size:', error);
    res.status(500).json({ error: 'Failed to calculate position size' });
  }
});

// =====================================================
// 7. PROP FIRM COMPARISON ENGINE
// =====================================================
app.get('/api/v1/prop-comparison', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');

    // Read the prop firm data from JSON file
    const dataPath = path.join(__dirname, 'prop_firm_data.json');
    const data = await fs.readFile(dataPath, 'utf8');
    let firms = JSON.parse(data);

    // Sort by edge compatibility score (highest first)
    firms = firms.sort((a, b) => b.compatibility_score - a.compatibility_score);

    // Add last updated timestamp
    const lastUpdated = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Add educational disclaimer header
    res.set('X-Educational-Purpose', 'true');

    res.json({
      success: true,
      data: firms,
      meta: {
        lastUpdated,
        totalFirms: firms.length,
        sortedBy: 'edge_compatibility',
        disclaimer: 'Prop firm data is for educational purposes only. Always verify current terms directly with the firm.'
      }
    });
  } catch (error) {
    console.error('Error fetching prop firm comparison:', error);
    res.status(500).json({ error: 'Failed to fetch prop firm comparison data' });
  }
});

// =====================================================
// 8. PROP FIRM WAITLIST (Lead Capture)
// =====================================================
app.post('/api/v1/waitlist', async (req, res) => {
  try {
    const { email, firm, name, accountSize, expectedStartDate } = req.body;

    if (!email || !firm) {
      return res.status(400).json({ error: 'Email and firm are required' });
    }

    // Insert waitlist entry
    const insertQuery = `
      INSERT INTO leads (
        email, name, source, source_url, ip_address, user_agent,
        prop_firm_interest, account_size_interest, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (email) DO UPDATE SET
        prop_firm_interest = array_append(leads.prop_firm_interest, $7),
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, email
    `;

    const result = await pool.query(insertQuery, [
      email, name || null, 'prop_firm_waitlist', `https://traderedgepro.com/prop-comparison?firm=${firm}`,
      req.ip, req.headers['user-agent'],
      [firm], accountSize || null, 'qualified'
    ]);

    // Send confirmation email
    try {
      const discountCode = `TEP${Date.now().toString().slice(-6)}`; // Generate unique discount code

      await emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@traderedgepro.com',
        to: email,
        subject: `You're on the VIP List for ${firm} Partnership!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981;">🎯 You're on the VIP List!</h1>
            <p>Thank you for your interest in our exclusive partnership with <strong>${firm}</strong>.</p>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">🚀 What happens next?</h3>
              <ul>
                <li>We'll negotiate your exclusive 20% discount code</li>
                <li>You'll be the first to know when it's available</li>
                <li>Get priority access to our prop firm optimization tools</li>
              </ul>
            </div>

            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #10b981;">Your Exclusive Discount Code</h3>
              <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 10px 0;">${discountCode}</p>
              <p>Keep this code safe - you'll use it when our partnership goes live!</p>
            </div>

            <p><small><em>This partnership is in development. We'll notify you as soon as the exclusive discount becomes available.</em></small></p>

            <hr style="margin: 30px 0;">
            <p>Questions? Reply to this email or visit our <a href="https://traderedgepro.com/prop-comparison">comparison tool</a>.</p>
          </div>
        `
      });

    } catch (emailError) {
      console.error('Error sending waitlist confirmation:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Successfully added to waitlist',
      data: {
        email: result.rows[0].email,
        firm,
        discountCode: `TEP${Date.now().toString().slice(-6)}`
      }
    });
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    res.status(500).json({ error: 'Failed to add to waitlist' });
  }
});

// =====================================================
// WEBSOCKET SIGNAL BROADCASTING
// =====================================================
const broadcastSignal = (signal) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'new_signal',
        data: signal,
        timestamp: new Date().toISOString()
      }));
    }
  });
};

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to TraderEdge Pro Signals Stream',
    timestamp: new Date().toISOString()
  }));

  // Send recent signals on connection
  pool.query(`
    SELECT signal_id, pair, direction, entry, stop_loss, take_profit, confidence_score, created_at
    FROM signals
    WHERE is_active = true AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 5
  `).then(result => {
    ws.send(JSON.stringify({
      type: 'recent_signals',
      data: result.rows,
      timestamp: new Date().toISOString()
    }));
  }).catch(error => {
    console.error('Error fetching recent signals:', error);
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

// Periodic signal broadcast (every 5 minutes)
setInterval(async () => {
  try {
    // Generate or fetch a new signal
    const signals = await pool.query(`
      SELECT * FROM signals
      WHERE is_active = true AND expires_at > NOW()
      ORDER BY confidence_score DESC
      LIMIT 1
    `);

    if (signals.rows.length > 0) {
      broadcastSignal(signals.rows[0]);
    }
  } catch (error) {
    console.error('Error broadcasting signal:', error);
  }
}, 5 * 60 * 1000); // 5 minutes

// =====================================================
// ERROR HANDLING & STARTUP
// =====================================================

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 TraderEdge Pro API Server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready for real-time signals`);
  console.log(`📧 Email service: ${emailTransporter ? 'Connected' : 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    pool.end(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

module.exports = app;
