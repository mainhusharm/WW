# Complete Deployment Guide - TraderEdge Pro

## Overview
This guide provides comprehensive deployment instructions for the TraderEdge Pro trading platform with all fixes implemented.

## Fixed Issues Summary

### ✅ 1. Payment Integration & Coupon System
- **Fixed**: Payment page errors and coupon validation
- **Implementation**: Enhanced payment routes with proper coupon handling
- **Features**: 
  - TRADERFREE coupon (100% discount)
  - INTERNAL_DEV_OVERRIDE_2024 coupon ($0.10 pricing)
  - Proper payment verification
  - Free checkout handling

### ✅ 2. Primary Confirmations Logic (Forex Data Bot)
- **Fixed**: Enhanced swing point detection with 50-candle lookback
- **Implementation**: Improved SMC analysis with proper primary confirmations
- **Features**:
  - Major swing high/low detection
  - Primary confirmation signals on structure breaks
  - Enhanced confidence scoring
  - Volume analysis integration

### ✅ 3. Forgot Password Functionality
- **Fixed**: Complete password reset system with email integration
- **Implementation**: Token-based reset with 24-hour expiration
- **Features**:
  - Secure token generation
  - Email notifications via Mailchimp
  - Token expiration handling
  - Professional email templates

### ✅ 4. Email Uniqueness Validation
- **Fixed**: Enhanced registration validation
- **Implementation**: Proper email uniqueness checks with error handling
- **Features**:
  - Case-insensitive email validation
  - Clear error messages
  - Duplicate prevention

### ✅ 5. Customer Service Dashboard
- **Fixed**: Complete customer database management system
- **Implementation**: Full-featured customer service API
- **Features**:
  - Customer CRUD operations
  - Activity tracking
  - Screenshot management
  - Questionnaire responses
  - Risk management plans
  - Dashboard data storage
  - Search and pagination

## Deployment Architecture

```
TraderEdge Pro Platform
├── Frontend (React/TypeScript)
├── Main Backend (Flask - journal/)
├── Forex Data Service (Python - forex_data_service/)
├── Customer Service API (Python - customer-service/)
├── Binance Service (Node.js - binance_service/)
├── Trading Signal Bot (Node.js - trading-signal-bot/)
└── Automated Trading System (Node.js - automated-trading-system/)
```

## Environment Setup

### 1. Main Application (Journal Backend)
```bash
cd journal/
pip install -r requirements.txt
export FLASK_APP=run.py
export FLASK_ENV=production
export DATABASE_URL=sqlite:///trading_journal.db
export JWT_SECRET_KEY=your-secret-key
export MAILCHIMP_API_KEY=your-mailchimp-key
flask db upgrade
python run.py
```

### 2. Forex Data Service
```bash
cd forex_data_service/
pip install -r requirements.txt
export PORT=3004
python server.py
```

### 3. Customer Service API
```bash
cd customer-service/
pip install flask flask-cors
export PORT=3005
python api.py
```

### 4. Binance Service
```bash
cd binance_service/
npm install
export PORT=3001
node server.js
```

### 5. Trading Signal Bot
```bash
cd trading-signal-bot/
npm install
export PORT=3002
node server.js
```

### 6. Frontend
```bash
npm install
npm run build
# Serve build/ directory with nginx or similar
```

## Docker Deployment

### Main Backend Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY journal/ .
COPY backend/ ./backend/

RUN pip install -r requirements.txt

EXPOSE 5000
CMD ["python", "run.py"]
```

### Forex Data Service Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY forex_data_service/ .

RUN pip install -r requirements.txt

EXPOSE 3004
CMD ["python", "server.py"]
```

### Customer Service Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY customer-service/ .

RUN pip install flask flask-cors

EXPOSE 3005
CMD ["python", "api.py"]
```

### Node.js Services Dockerfile
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
```

## Docker Compose Configuration

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:5000
      - REACT_APP_FOREX_API_URL=http://forex-service:3004
      - REACT_APP_CUSTOMER_API_URL=http://customer-service:3005

  backend:
    build: 
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=sqlite:///trading_journal.db
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - MAILCHIMP_API_KEY=${MAILCHIMP_API_KEY}
    volumes:
      - ./data:/app/data

  forex-service:
    build:
      context: .
      dockerfile: Dockerfile.forex
    ports:
      - "3004:3004"
    environment:
      - PORT=3004

  customer-service:
    build:
      context: .
      dockerfile: Dockerfile.customer
    ports:
      - "3005:3005"
    environment:
      - PORT=3005
    volumes:
      - ./customer-data:/app/data

  binance-service:
    build:
      context: .
      dockerfile: Dockerfile.binance
    ports:
      - "3001:3001"
    environment:
      - PORT=3001

  trading-bot:
    build:
      context: .
      dockerfile: Dockerfile.trading-bot
    ports:
      - "3002:3002"
    environment:
      - PORT=3002

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
```

## Render.com Deployment

### render.yaml (Complete)
```yaml
services:
  # Frontend
  - type: web
    name: traderedge-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

  # Main Backend
  - type: web
    name: traderedge-backend
    env: python
    buildCommand: cd journal && pip install -r requirements.txt
    startCommand: cd journal && python run.py
    envVars:
      - key: FLASK_ENV
        value: production
      - key: PORT
        value: 5000
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: MAILCHIMP_API_KEY
        sync: false

  # Forex Data Service
  - type: web
    name: forex-data-service
    env: python
    buildCommand: cd forex_data_service && pip install -r requirements.txt
    startCommand: cd forex_data_service && python server.py
    envVars:
      - key: PORT
        value: 3004

  # Customer Service API
  - type: web
    name: customer-service-api
    env: python
    buildCommand: cd customer-service && pip install flask flask-cors
    startCommand: cd customer-service && python api.py
    envVars:
      - key: PORT
        value: 3005

  # Binance Service
  - type: web
    name: binance-service
    env: node
    buildCommand: cd binance_service && npm install
    startCommand: cd binance_service && node server.js
    envVars:
      - key: PORT
        value: 3001

  # Trading Signal Bot
  - type: web
    name: trading-signal-bot
    env: node
    buildCommand: cd trading-signal-bot && npm install
    startCommand: cd trading-signal-bot && node server.js
    envVars:
      - key: PORT
        value: 3002

databases:
  - name: traderedge-db
    databaseName: traderedge_prod
    user: traderedge_user
```

## Environment Variables

### Required Environment Variables
```bash
# Main Backend
FLASK_ENV=production
JWT_SECRET_KEY=your-super-secret-jwt-key
MAILCHIMP_API_KEY=your-mailchimp-api-key
DATABASE_URL=sqlite:///trading_journal.db

# Frontend
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_FOREX_API_URL=https://your-forex-service-url.com
REACT_APP_CUSTOMER_API_URL=https://your-customer-service-url.com

# Services
PORT=5000  # Main backend
FOREX_SERVICE_PORT=3004
CUSTOMER_SERVICE_PORT=3005
BINANCE_SERVICE_PORT=3001
TRADING_BOT_PORT=3002
```

## Database Migrations

### Main Database Setup
```bash
# Create tables
python -c "
from journal.extensions import db
from journal.models import *
db.create_all()
print('Database tables created successfully')
"
```

### Customer Service Database
```bash
# Automatically initialized on first run
python customer-service/api.py
```

## Nginx Configuration

```nginx
upstream backend {
    server backend:5000;
}

upstream forex_service {
    server forex-service:3004;
}

upstream customer_service {
    server customer-service:3005;
}

server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API Routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Forex Data Service
    location /forex-api/ {
        proxy_pass http://forex_service/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Customer Service API
    location /customer-api/ {
        proxy_pass http://customer_service/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Health Checks

### Health Check Endpoints
- Main Backend: `GET /health`
- Forex Service: `GET /health`
- Customer Service: `GET /health`
- Binance Service: `GET /health`
- Trading Bot: `GET /health`

### Monitoring Script
```bash
#!/bin/bash
# health-check.sh

services=(
    "http://localhost:5000/health"
    "http://localhost:3004/health"
    "http://localhost:3005/health"
    "http://localhost:3001/health"
    "http://localhost:3002/health"
)

for service in "${services[@]}"; do
    if curl -f -s "$service" > /dev/null; then
        echo "✅ $service - OK"
    else
        echo "❌ $service - FAILED"
    fi
done
```

## Security Considerations

### 1. Environment Variables
- Use secure secret keys
- Never commit sensitive data
- Use environment-specific configurations

### 2. Database Security
- Use proper database credentials
- Enable SSL connections in production
- Regular backups

### 3. API Security
- CORS configuration
- Rate limiting
- Input validation
- JWT token security

## Deployment Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Health checks passing

### Post-Deployment
- [ ] All services responding
- [ ] Payment system tested
- [ ] Email functionality verified
- [ ] Customer dashboard accessible
- [ ] Forex data service operational
- [ ] Trading signals working

## Troubleshooting

### Common Issues

1. **Payment Errors**
   - Check coupon system configuration
   - Verify payment route
