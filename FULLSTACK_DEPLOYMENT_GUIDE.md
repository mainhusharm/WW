# TraderEdge Pro Full-Stack Deployment Guide

This guide covers the complete deployment of the TraderEdge Pro AI-powered trading ecosystem, including database setup, API server, and frontend integration.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server    │    │   Database      │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • Landing Page  │    │ • REST API      │    │ • Users         │
│ • Live Signals  │    │ • WebSocket     │    │ • Signals       │
│ • Lead Capture  │    │ • Email Service │    │ • Payouts       │
│ • Calculators   │    │ • JWT Auth      │    │ • Leads         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- SMTP email service (SendGrid, Mailgun, etc.)
- SSL certificate for production
- Domain name (traderedgepro.com)

## 🗄️ Database Setup

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE traderedge_prod;
CREATE USER traderedge_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE traderedge_prod TO traderedge_user;
```

### 2. Run Schema Migration

```bash
# Apply the full-stack schema
psql -U traderedge_user -d traderedge_prod -f traderedge_fullstack_schema.sql
```

### 3. Verify Tables

```sql
-- Check all tables were created
\dt

-- Verify sample data
SELECT COUNT(*) FROM payouts;
SELECT COUNT(*) FROM signals;
SELECT COUNT(*) FROM prop_firms;
```

## 🔧 API Server Configuration

### 1. Environment Variables

Create `.env` file in the API directory:

```env
# Database
DATABASE_URL=postgresql://traderedge_user:your-secure-password@localhost:5432/traderedge_prod

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key-256-bits

# CORS
CORS_ORIGIN=https://traderedgepro.com,https://www.traderedgepro.com

# Email Service
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@traderedgepro.com

# App
APP_URL=https://traderedgepro.com
NODE_ENV=production
PORT=3001
```

### 2. Install Dependencies

```bash
cd /path/to/api
npm install
```

### 3. Create Required Directories and Files

```bash
# Create downloads directory for PDFs
mkdir -p downloads

# You'll need to create the position sizing calculator PDF
# Place it at: downloads/prop-firm-risk-management-calculator.pdf
```

### 4. Test API Server

```bash
# Start the server
npm start

# Test health endpoint
curl http://localhost:3001/api/health

# Test payouts endpoint
curl "http://localhost:3001/api/v1/live-payouts?limit=5"
```

## 🎨 Frontend Integration

### 1. Update API Service

Update your frontend API service to connect to the new endpoints:

```typescript
// src/services/api.ts
const API_BASE_URL = import.meta.env.PROD
  ? 'https://api.traderedgepro.com'
  : 'http://localhost:3001';

export const api = {
  // Live Payout Ticker
  getLivePayouts: (limit = 10) =>
    fetch(`${API_BASE_URL}/api/v1/live-payouts?limit=${limit}`)
      .then(res => res.json()),

  // Earnings Calculator
  calculateProjection: (data) =>
    fetch(`${API_BASE_URL}/api/v1/calculate-projection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),

  // Prop Firm Recommendations
  getFirmRecommendations: (data) =>
    fetch(`${API_BASE_URL}/api/v1/recommend-firms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),

  // Signals (requires JWT)
  getSignals: (token) =>
    fetch(`${API_BASE_URL}/api/v1/signals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json()),

  // Lead Capture
  registerLead: (data) =>
    fetch(`${API_BASE_URL}/api/v1/leads/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()),

  // Position Sizing Calculator
  calculatePositionSize: (data) =>
    fetch(`${API_BASE_URL}/api/v1/calculator/position-size`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json())
};
```

### 2. WebSocket Integration

Add WebSocket connection for real-time signals:

```typescript
// src/services/websocket.ts
export class SignalWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;

  constructor(private onSignal: (signal: any) => void) {}

  connect() {
    const wsUrl = import.meta.env.PROD
      ? 'wss://api.traderedgepro.com'
      : 'ws://localhost:3001';

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to signals stream');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_signal') {
          this.onSignal(data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

## 🚀 Production Deployment

### 1. API Server Deployment

#### Option A: Railway
```bash
# Deploy to Railway
railway login
railway init
railway up
```

#### Option B: Render
```yaml
# render.yaml
services:
  - type: web
    name: traderedge-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        fromSecret: database-url
      - key: JWT_SECRET
        fromSecret: jwt-secret
      - key: SMTP_HOST
        value: smtp.sendgrid.net
      - key: SMTP_USER
        value: apikey
      - key: SMTP_PASS
        fromSecret: sendgrid-api-key
```

#### Option C: DigitalOcean App Platform
```yaml
# .do/app.yaml
name: traderedge-api
services:
- name: api
  source_dir: /
  github:
    repo: your-org/traderedge-api
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: ${DATABASE_URL}
  - key: JWT_SECRET
    value: ${JWT_SECRET}
```

### 2. Database Deployment

#### Option A: Supabase
```bash
# Use Supabase CLI
supabase init
supabase db push
```

#### Option B: Neon
```bash
# Neon provides serverless PostgreSQL
# Just update your DATABASE_URL
```

#### Option C: AWS RDS
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier traderedge-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username traderedge \
  --master-user-password your-password \
  --allocated-storage 20
```

### 3. Frontend Deployment

Update your frontend to use production API URLs:

```typescript
// src/config/production.ts
export const config = {
  apiUrl: 'https://api.traderedgepro.com',
  wsUrl: 'wss://api.traderedgepro.com',
  appUrl: 'https://traderedgepro.com'
};
```

## 🔒 Security Checklist

- [ ] JWT tokens expire within 24 hours
- [ ] Rate limiting active (100 requests/15min)
- [ ] CORS configured for production domains only
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Database credentials stored as environment variables
- [ ] Email service API keys secured
- [ ] Row Level Security (RLS) enabled on sensitive tables
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention with parameterized queries

## 📊 Monitoring & Analytics

### API Monitoring
```bash
# Check API health
curl https://api.traderedgepro.com/api/health

# Monitor database connections
SELECT count(*) FROM pg_stat_activity WHERE datname = 'traderedge_prod';
```

### Business Metrics
```sql
-- Daily active users
SELECT DATE(created_at), COUNT(*) FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at) ORDER BY DATE(created_at);

-- Conversion funnel
SELECT
  COUNT(*) as visitors,
  COUNT(CASE WHEN converted_to_signup THEN 1 END) as signups,
  ROUND(COUNT(CASE WHEN converted_to_signup THEN 1 END)::float / COUNT(*)::float * 100, 2) as conversion_rate
FROM leads WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Signal performance
SELECT pair, direction, AVG(confidence_score) as avg_confidence,
       COUNT(*) as total_signals
FROM signals WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY pair, direction ORDER BY total_signals DESC;
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database credentials
   psql "postgresql://user:pass@host:port/db"
   ```

2. **WebSocket Connection Issues**
   ```javascript
   // Check if WebSocket port is open
   telnet api.traderedgepro.com 3001
   ```

3. **Email Not Sending**
   ```bash
   # Test SMTP connection
   npm install -g smtp-tester
   smtp-tester --host smtp.sendgrid.net --port 587 --user apikey --pass your-key
   ```

4. **CORS Errors**
   ```bash
   # Check CORS headers
   curl -I -H "Origin: https://traderedgepro.com" https://api.traderedgepro.com/api/health
   ```

### Performance Optimization

1. **Database Indexing**
   ```sql
   CREATE INDEX CONCURRENTLY idx_signals_active_expires ON signals(is_active, expires_at);
   CREATE INDEX CONCURRENTLY idx_payouts_recent ON payouts(is_verified, timestamp DESC);
   ```

2. **API Caching**
   ```javascript
   const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes
   ```

3. **Connection Pooling**
   ```javascript
   const pool = new Pool({
     max: 20,
     min: 5,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

## 📈 Scaling Strategy

### Horizontal Scaling
- Deploy multiple API server instances behind a load balancer
- Use Redis for session storage and caching
- Implement database read replicas for analytics queries

### Vertical Scaling
- Monitor API response times and database query performance
- Upgrade server instances based on CPU/memory usage
- Implement database partitioning for large tables

### CDN Integration
- Serve static assets through Cloudflare or AWS CloudFront
- Cache API responses for public endpoints
- Implement edge computing for geographic distribution

## 🎯 Success Metrics

- **API Response Time**: <200ms average
- **WebSocket Latency**: <50ms
- **Database Query Time**: <100ms average
- **Email Delivery Rate**: >99%
- **Uptime**: >99.9%
- **Lead Conversion Rate**: >5%

## 📞 Support

For technical support or questions:
- Email: support@traderedgepro.com
- Documentation: https://docs.traderedgepro.com
- Status Page: https://status.traderedgepro.com

---

**Deployment completed successfully! 🚀**

Your TraderEdge Pro full-stack system is now live with:
- ✅ Real-time payout ticker
- ✅ AI-powered earnings calculator
- ✅ Prop firm recommendation wizard
- ✅ Live signal feed with WebSocket streaming
- ✅ Lead capture with email automation
- ✅ Position sizing calculator
- ✅ Comprehensive security & compliance
- ✅ Production monitoring & analytics
