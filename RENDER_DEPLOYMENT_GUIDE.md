# 🚀 Render Deployment Guide - Trading Platform

This guide will help you deploy your trading platform to Render with a PostgreSQL database, encrypted backend API, and frontend.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Render CLI** (optional): For command-line deployment

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `trading-platform-db`
   - **Database**: `trading_platform`
   - **User**: `trading_user`
   - **Plan**: Starter (Free)
4. Click **"Create Database"**

### 2. Initialize Database Schema

1. Copy the connection string from your database
2. Use a PostgreSQL client (like pgAdmin or psql) to connect
3. Run the SQL commands from `database_schema.sql`

**Or use the Render Shell:**
```bash
# Connect to your database
psql "postgresql://trading_user:password@host:port/trading_platform"

# Run the schema
\i database_schema.sql
```

## 🔧 Backend API Setup

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `trading-platform-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements-render.txt`
   - **Start Command**: `python render_backend_api.py`
   - **Plan**: Starter (Free)

### 2. Environment Variables

Add these environment variables in Render dashboard:

```
DATABASE_URL=postgresql://trading_user:password@host:port/trading_platform
ENCRYPTION_KEY=your-encryption-key-here
SECRET_KEY=your-secret-key-here
FLASK_ENV=production
PORT=10000
```

**Generate keys:**
```python
from cryptography.fernet import Fernet
import secrets

# Generate encryption key
encryption_key = Fernet.generate_key().decode()
print(f"ENCRYPTION_KEY={encryption_key}")

# Generate secret key
secret_key = secrets.token_hex(32)
print(f"SECRET_KEY={secret_key}")
```

## 🎨 Frontend Setup

### 1. Create Static Site

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `trading-platform-frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Starter (Free)

### 2. Environment Variables

Add this environment variable:

```
VITE_API_URL=https://backend-bkt7.onrender.com
```

### 3. Update Frontend API URL

Update your frontend code to use the Render API URL:

```typescript
// In your frontend code
const API_URL = import.meta.env.VITE_API_URL || 'https://backend-bkt7.onrender.com';
```

## 🔐 Security Features

### Data Encryption
- **Sensitive data** (names, phones, addresses) are encrypted using Fernet encryption
- **Passwords** are hashed using bcrypt
- **API keys** are generated securely

### Database Security
- **UUIDs** for all records
- **Indexes** for performance
- **Foreign key constraints**
- **Audit logging** for admin actions

### API Security
- **CORS** enabled for frontend
- **Input validation**
- **Error handling**
- **Rate limiting** (can be added)

## 📊 Database Schema

### Tables Created:
1. **users** - User accounts with authentication
2. **customer_data** - Enhanced customer information (encrypted)
3. **risk_plans** - Trading questionnaire data
4. **payment_transactions** - Payment history
5. **user_activities** - Activity logging
6. **admin_access_logs** - Admin action logging

### Views:
- **customer_dashboard_view** - Optimized view for dashboard

## 🚀 Deployment Steps

### Option 1: Manual Deployment

1. **Database**: Create PostgreSQL service in Render
2. **Backend**: Create Web Service, connect GitHub, set environment variables
3. **Frontend**: Create Static Site, connect GitHub, set environment variables
4. **Test**: Verify all services are running

### Option 2: CLI Deployment

```bash
# Install Render CLI
curl -fsSL https://cli.render.com/install | sh

# Login to Render
render auth login

# Deploy using the script
./deploy-to-render.sh
```

## 🔍 Testing Your Deployment

### 1. Health Check
```bash
curl https://backend-bkt7.onrender.com/health
```

### 2. Create Test User
```bash
curl -X POST https://backend-bkt7.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "plan_type": "free"
  }'
```

### 3. Get All Users
```bash
curl https://backend-bkt7.onrender.com/api/users
```

## 📱 Frontend Integration

Update your frontend to use the new API:

```typescript
// Update AdminProtectedCustomerData.tsx
const fetchCustomerData = async () => {
  try {
    const response = await fetch('https://backend-bkt7.onrender.com/api/users');
    const data = await response.json();
    
    if (data.success) {
      setCustomers(data.users);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};
```

## 🔧 Environment Variables Reference

### Backend API:
- `DATABASE_URL` - PostgreSQL connection string
- `ENCRYPTION_KEY` - Fernet encryption key
- `SECRET_KEY` - Flask secret key
- `FLASK_ENV` - Environment (production/development)
- `PORT` - Port number (10000 for Render)

### Frontend:
- `VITE_API_URL` - Backend API URL

## 🆘 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database is running
   - Check firewall settings

2. **Build Failed**
   - Check requirements-render.txt
   - Verify Python version
   - Check build logs

3. **Frontend Not Loading**
   - Check VITE_API_URL
   - Verify build command
   - Check static site settings

### Logs:
- View logs in Render dashboard
- Check service status
- Monitor resource usage

## 📈 Scaling

### Free Tier Limits:
- **Database**: 1GB storage, 1 connection
- **Backend**: 750 hours/month
- **Frontend**: 100GB bandwidth/month

### Upgrade Options:
- **Starter Plan**: $7/month per service
- **Standard Plan**: $25/month per service
- **Pro Plan**: $85/month per service

## 🔄 Updates and Maintenance

### Updating Code:
1. Push changes to GitHub
2. Render automatically redeploys
3. Check deployment logs

### Database Migrations:
1. Connect to database
2. Run migration scripts
3. Test changes

### Monitoring:
- Use Render dashboard
- Set up alerts
- Monitor performance

## 📞 Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Support**: [render.com/support](https://render.com/support)
- **Community**: [render.com/community](https://render.com/community)

---

## 🎉 Success!

Once deployed, your trading platform will have:
- ✅ **Secure PostgreSQL database** with encryption
- ✅ **Scalable backend API** with proper authentication
- ✅ **Modern frontend** with real-time data
- ✅ **Admin dashboard** with user management
- ✅ **Audit logging** for compliance
- ✅ **Production-ready** deployment

Your platform will be available at:
- **Frontend**: `https://trading-platform-frontend.onrender.com`
- **API**: `https://backend-bkt7.onrender.com`
- **Database**: Managed by Render
