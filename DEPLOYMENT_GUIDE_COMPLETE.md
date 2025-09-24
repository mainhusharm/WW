# Complete Deployment Guide - Trading Journal Application

## Overview
This guide covers the deployment of a multi-service trading journal application with the following components:
- Frontend (React/Vite)
- Backend API (Flask/Python)
- Customer Service Dashboard (Node.js/Express)
- Database (PostgreSQL + MongoDB)

## Fixed Issues Summary

### 1. ✅ Signals Transfer Issue
**Problem**: Signals generated from admin dashboard were not reaching user dashboard
**Solution**: 
- Fixed WebSocket connection configuration in `SignalsFeed.tsx`
- Added proper error handling and duplicate prevention
- Enhanced socket connection with fallback transports

### 2. ✅ Footer Pages Not Clickable
**Problem**: Footer links were not working properly
**Solution**:
- Added missing route for `/payment` in `App.tsx`
- All footer links now properly navigate to their respective pages

### 3. ✅ Account Balance/Type Data Not Fetching
**Problem**: Questionnaire data wasn't being properly stored and retrieved
**Solution**:
- Updated `UserContext.tsx` to fetch fresh user profile data from backend
- Fixed API endpoint in `Questionnaire.tsx` to use correct route
- Added proper data mapping in `user_routes.py`

### 4. ✅ User Data Not Transferring to Customer Service
**Problem**: User registration data wasn't appearing in customer service dashboard
**Solution**:
- Created new API endpoint `/user/questionnaire` in `user_routes.py`
- Added customer service integration with automatic data sync
- Created customer service routes and models
- Updated customer service dashboard to fetch real data

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │ Customer Service│
│   (React/Vite)  │────│   (Flask)       │────│   (Node.js)     │
│   Port: 3000    │    │   Port: 5000    │    │   Port: 5001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Databases     │
                    │ PostgreSQL:5432 │
                    │ MongoDB:27017   │
                    └─────────────────┘
```

## Prerequisites

### System Requirements
- Node.js 18+ and npm/yarn
- Python 3.9+
- PostgreSQL 13+
- MongoDB 5.0+
- Redis 6+ (optional, for caching)

### Environment Setup
1. Copy `.env.example` to `.env` and configure all variables
2. Install dependencies for all services
3. Set up databases

## Database Setup

### PostgreSQL (Main Application)
```sql
-- Create database
CREATE DATABASE trading_journal;

-- Create user
CREATE USER trading_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal TO trading_user;
```

### MongoDB (Customer Service)
```javascript
// Create database and user
use customer_service_db
db.createUser({
  user: "cs_user",
  pwd: "your_password",
  roles: ["readWrite"]
})
```

## Service Deployment

### 1. Frontend Deployment

#### Build for Production
```bash
npm install
npm run build
```

#### Deploy to Static Hosting (Netlify/Vercel/AWS S3)
```bash
# For Netlify
npm run build
# Upload dist/ folder

# For Vercel
vercel --prod

# For AWS S3 + CloudFront
aws s3 sync dist/ s3://your-bucket-name --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

#### Environment Variables for Frontend
```env
VITE_API_URL=https://your-backend-domain.com/api
```

### 2. Backend API Deployment

#### Using Docker
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "wsgi:app"]
```

#### Using Heroku
```bash
# Create Procfile
echo "web: gunicorn wsgi:app" > Procfile

# Deploy
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
git push heroku main
```

#### Using AWS EC2/ECS
```bash
# Install dependencies
sudo apt update
sudo apt install python3-pip nginx

# Install Python dependencies
pip3 install -r requirements.txt

# Configure Nginx
sudo nano /etc/nginx/sites-available/trading-journal
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Customer Service Deployment

#### Using PM2 (Recommended for Node.js)
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start customer-service/server.js --name "customer-service"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Environment Variables
```env
NODE_ENV=production
CS_API_PORT=5001
CS_DB_CONNECTION=mongodb://cs_user:password@localhost:27017/customer_service_db
```

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Application Monitoring
```bash
# Install monitoring tools
npm install -g pm2
pip install sentry-sdk

# Configure logging
mkdir -p /var/log/trading-journal
```

### Health Check Endpoints
- Frontend: `https://your-domain.com/`
- Backend: `https://api.your-domain.com/health`
- Customer Service: `https://cs.your-domain.com/health`

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files
- Use secure secret management (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly

### 2. Database Security
```sql
-- PostgreSQL security
ALTER USER trading_user SET default_transaction_isolation TO 'read committed';
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO trading_user;
```

### 3. API Security
- Enable CORS properly
- Use HTTPS everywhere
- Implement rate limiting
- Validate all inputs
- Use JWT tokens with short expiration

### 4. Network Security
```bash
# Firewall rules (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5000/tcp  # Block direct access to backend
sudo ufw deny 5001/tcp  # Block direct access to customer service
sudo ufw enable
```

## Performance Optimization

### 1. Frontend Optimization
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react']
        }
      }
    }
  }
})
```

### 2. Backend Optimization
```python
# Add caching
from flask_caching import Cache
cache = Cache(app, config={'CACHE_TYPE': 'redis'})

# Database connection pooling
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 20,
    'pool_recycle': 3600,
    'pool_pre_ping': True
}
```

### 3. Database Optimization
```sql
-- Add indexes
CREATE INDEX idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_trades_user_id ON trades(user_id);
```

## Backup Strategy

### 1. Database Backups
```bash
#!/bin/bash
# backup_db.sh
DATE=$(date +%Y%m%d_%H%M%S)

# PostgreSQL backup
pg_dump -h localhost -U trading_user trading_journal > /backups/postgres_$DATE.sql

# MongoDB backup
mongodump --host localhost --db customer_service_db --out /backups/mongo_$DATE/

# Upload to S3
aws s3 cp /backups/ s3://your-backup-bucket/ --recursive
```

### 2. Application Backups
```bash
# Code backup (automated via Git)
git push origin main

# File uploads backup
rsync -av /app/uploads/ /backups/uploads/
```

## Troubleshooting

### Common Issues

#### 1. WebSocket Connection Issues
```javascript
// Check socket connection
const socket = io(API_URL, {
  transports: ['websocket', 'polling'],
  timeout: 20000,
  forceNew: true
});
```

#### 2. CORS Issues
```python
# Flask CORS configuration
CORS(app, 
     origins=["https://your-domain.com"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     supports_credentials=True)
```

#### 3. Database Connection Issues
```python
# Check database connection
try:
    db.session.execute('SELECT 1')
    print("Database connected successfully")
except Exception as e:
    print(f"Database connection failed: {e}")
```

### Log Locations
- Frontend: Browser console
- Backend: `/var/log/trading-journal/backend.log`
- Customer Service: `/var/log/trading-journal/customer-service.log`
- Nginx: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`

## Maintenance

### Regular Tasks
1. **Daily**: Check application health and logs
2. **Weekly**: Review performance metrics and user feedback
3. **Monthly**: Update dependencies and security patches
4. **Quarterly**: Review and rotate secrets

### Update Process
```bash
# 1. Backup current version
git tag v$(date +%Y%m%d)

# 2. Deploy new version
git pull origin main
npm run build
pm2 restart all

# 3. Run database migrations if needed
python manage.py db upgrade

# 4. Verify deployment
curl -f https://your-domain.com/health || echo "Deployment failed"
```

## Support and Monitoring

### Monitoring Stack
- **Application**: PM2, New Relic, or DataDog
- **Infrastructure**: CloudWatch, Prometheus + Grafana
- **Logs**: ELK Stack or CloudWatch Logs
- **Uptime**: Pingdom, UptimeRobot

### Alerting
Set up alerts for:
- Application downtime
- High error rates
- Database connection issues
- High CPU/memory usage
- SSL certificate expiration

## Conclusion

This deployment guide ensures:
- ✅ All identified issues are resolved
- ✅ Proper service architecture
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Monitoring and maintenance procedures

The application is now production-ready with proper error handling, data flow, and deployment configuration.
