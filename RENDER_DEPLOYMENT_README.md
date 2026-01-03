# Render Deployment Guide

## Overview

This guide explains how to deploy the Trading Journal backend to Render using the backend URL: `https://backend-ox9b.onrender.com`.

## 🚀 Quick Start

### 1. Automatic Deployment (Recommended)

```bash
# Make the script executable
chmod +x deploy-render.sh

# Run the deployment script
./deploy-render.sh
```

### 2. Manual Deployment

Follow the step-by-step instructions below.

## 📋 Prerequisites

- Git installed
- Python 3.9+ installed
- Render account (free tier available)
- Render CLI installed

## 🔧 Environment Setup

### Install Render CLI

```bash
curl -fsSL https://cli.render.com/install.sh | sh
```

### Login to Render

```bash
render login
```

## 🗄️ Database Setup

### Initialize Database

```bash
# Create instance directory
mkdir -p instance

# Initialize database
python3 -c "
from journal import create_app
from journal.models import db
app = create_app()
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
"
```

### Populate Prop Firms

```bash
python3 populate_prop_firms.py
```

## 📦 Dependencies Installation

```bash
pip install -r requirements.txt
```

## 🌐 Render Configuration

### render.yaml

The `render.yaml` file is already configured with:

```yaml
services:
  - type: web
    name: trading-journal-backend
    env: python
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 wsgi:application
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.16
      - key: FLASK_ENV
        value: production
      - key: FLASK_DEBUG
        value: false
      - key: SECRET_KEY
        generateValue: true
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: DATABASE_URL
        value: sqlite:///instance/trading_bot.db
      - key: CORS_ORIGINS
        value: https://your-frontend-domain.com,https://localhost:5173,https://backend-ox9b.onrender.com
    healthCheckPath: /healthz
    autoDeploy: true
    region: oregon
```

## 🔑 Environment Variables

### Required Environment Variables

Set these in your Render dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `FLASK_ENV` | `production` | Flask environment |
| `FLASK_DEBUG` | `false` | Debug mode disabled |
| `SECRET_KEY` | Auto-generated | Flask secret key |
| `JWT_SECRET_KEY` | Auto-generated | JWT secret key |
| `DATABASE_URL` | `sqlite:///instance/trading_bot.db` | Database connection |
| `CORS_ORIGINS` | `https://your-frontend-domain.com,https://localhost:5173,https://backend-ox9b.onrender.com` | Allowed origins |

### Optional Environment Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe key | Stripe payments |
| `STRIPE_SECRET_KEY` | Your Stripe secret | Stripe payments |
| `PAYPAL_CLIENT_ID` | Your PayPal ID | PayPal payments |
| `PAYPAL_CLIENT_SECRET` | Your PayPal secret | PayPal payments |
| `GEMINI_API_KEY` | Your Gemini key | AI coaching |

## 🚀 Deployment Steps

### 1. Create Service

```bash
render services create
```

### 2. Deploy Service

```bash
render services update trading-journal-backend
```

### 3. Monitor Deployment

```bash
render services logs trading-journal-backend
```

## ✅ Health Check

### Health Endpoint

```
https://backend-ox9b.onrender.com/healthz
```

### Expected Response

```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": 1234567890
}
```

## 🔍 Testing the Deployment

### Test API Endpoints

```bash
# Health check
curl https://backend-ox9b.onrender.com/healthz

# Test authentication
curl https://backend-ox9b.onrender.com/api/auth/test

# Test prop firm rules
curl https://backend-ox9b.onrender.com/api/dashboard/prop-firm-rules/all
```

### Test CORS

```bash
# Test from frontend
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://backend-ox9b.onrender.com/api/auth/test
```

## 📱 Frontend Integration

### Update Frontend Configuration

Update your frontend environment variables:

```bash
# .env.production
VITE_API_BASE_URL=https://backend-ox9b.onrender.com
VITE_YFINANCE_PROXY_URL=https://backend-ox9b.onrender.com
VITE_BINANCE_SERVICE_URL=https://backend-ox9b.onrender.com
VITE_FOREX_DATA_SERVICE_URL=https://backend-ox9b.onrender.com
```

### Update API Configuration

```typescript
// src/config/index.ts
export const config = {
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://backend-ox9b.onrender.com',
    timeout: 30000,
    retries: 3,
  },
  // ... rest of config
};
```

### Update Vite Configuration

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: env.VITE_API_URL || 'https://backend-ox9b.onrender.com',
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path,
  },
},
```

## 🔒 Security Considerations

### CORS Configuration

The backend is configured to allow requests from:

- `https://your-frontend-domain.com` (Production)
- `https://localhost:5173` (Local development)
- `https://backend-ox9b.onrender.com` (Backend itself)

### Environment Variables

- Never commit sensitive keys to version control
- Use Render's environment variable management
- Generate new keys for production

### SSL/TLS

- Render automatically provides SSL certificates
- All communication is encrypted
- Use `https://` for all production URLs

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
render services logs trading-journal-backend --follow

# Recent logs
render services logs trading-journal-backend --tail 100
```

### Monitor Performance

- Check Render dashboard for metrics
- Monitor response times
- Watch for errors in logs

## 🚨 Troubleshooting

### Common Issues

#### 1. Service Won't Start

```bash
# Check logs
render services logs trading-journal-backend

# Check environment variables
render services env-vars trading-journal-backend
```

#### 2. Database Connection Issues

```bash
# Verify database file exists
ls -la instance/

# Check database permissions
chmod 755 instance/
chmod 644 instance/trading_bot.db
```

#### 3. CORS Issues

```bash
# Test CORS from browser console
fetch('https://backend-ox9b.onrender.com/api/auth/test', {
  method: 'GET',
  credentials: 'include'
})
```

#### 4. Health Check Failing

```bash
# Check if service is running
render services list

# Restart service
render services restart trading-journal-backend
```

### Debug Commands

```bash
# Check service status
render services list

# View service details
render services show trading-journal-backend

# Check environment variables
render services env-vars trading-journal-backend

# View deployment history
render services deployments trading-journal-backend
```

## 🔄 Updates & Maintenance

### Update Service

```bash
# Push changes to git
git add .
git commit -m "Update backend configuration"
git push

# Render will auto-deploy if autoDeploy is enabled
```

### Manual Update

```bash
render services update trading-journal-backend
```

### Rollback

```bash
# List deployments
render services deployments trading-journal-backend

# Rollback to previous version
render services rollback trading-journal-backend <deployment-id>
```

## 📚 Additional Resources

### Render Documentation

- [Render Documentation](https://render.com/docs)
- [Python Web Services](https://render.com/docs/python-web-services)
- [Environment Variables](https://render.com/docs/environment-variables)

### Flask Documentation

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-CORS](https://flask-cors.readthedocs.io/)
- [Gunicorn](https://gunicorn.org/)

### Trading Journal System

- [Prop Firm Rules System](PROP_FIRM_RULES_SYSTEM_README.md)
- [Enhanced Features](ENHANCED_FEATURES_README.md)
- [Deployment Guide](DEPLOYMENT_GUIDE_COMPLETE.md)

## 🎯 Next Steps

1. **Deploy Backend**: Run `./deploy-render.sh`
2. **Update Frontend**: Configure frontend to use new backend URL
3. **Test Integration**: Verify all API endpoints work
4. **Monitor Performance**: Watch logs and metrics
5. **Set Production Keys**: Update Stripe, PayPal, and other API keys

## 🆘 Support

If you encounter issues:

1. Check the logs: `render services logs trading-journal-backend`
2. Review this documentation
3. Check Render status page
4. Contact Render support if needed

---

**Note**: This deployment uses Render's free tier. For production use, consider upgrading to a paid plan for better performance and reliability.
