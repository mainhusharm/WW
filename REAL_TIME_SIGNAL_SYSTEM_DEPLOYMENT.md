# Real-time Signal System Deployment Guide

This guide covers the deployment of the robust, real-time signal pipeline that ensures every signal created in the Admin Dashboard is persisted to the database and forwarded in real-time to all matching connected user dashboards.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin         │    │   Backend       │    │   Redis         │
│   Dashboard     │────│   API           │────│   Pub/Sub       │
│   (React)       │    │   (Flask)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │   Socket.IO     │
                       │   Database      │    │   Server        │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                ┌─────────────────┐
                                                │   User          │
                                                │   Dashboards    │
                                                │   (React)       │
                                                └─────────────────┘
```

## 📋 Prerequisites

- **Node.js** 18.17.0 or higher
- **Python** 3.11.0 or higher
- **PostgreSQL** 13 or higher
- **Redis** 6.0 or higher
- **Docker** (optional, for containerized deployment)

## 🔧 Environment Variables

### Backend Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/trading_journal
SQLALCHEMY_DATABASE_URI=postgresql://username:password@localhost:5432/trading_journal

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-here
SECRET_KEY=your-flask-secret-key-here

# Flask Configuration
FLASK_ENV=production
FLASK_DEBUG=False

# Socket.IO Configuration
SOCKETIO_CORS_ALLOWED_ORIGINS=*

# API Configuration
API_BASE_URL=https://your-domain.com/api

# Security
ENCRYPTION_KEY=your-encryption-key-here

# Rate Limiting
RATE_LIMIT_STORAGE_URL=redis://localhost:6379
```

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
# API Configuration
VITE_API_URL=https://your-domain.com
VITE_SOCKET_URL=https://your-domain.com

# Environment
VITE_NODE_ENV=production
```

## 🗄️ Database Setup

### 1. Run Database Migrations

Execute the migration files in order:

```bash
# Connect to PostgreSQL
psql -U username -d trading_journal

# Run migrations
\i database_migrations/001_create_signals_tables.sql
\i database_migrations/002_add_user_risk_tier.sql
\i database_migrations/003_create_db_roles.sql
```

### 2. Verify Database Schema

```sql
-- Check if tables were created
\dt

-- Verify signals table structure
\d signals

-- Verify user_signals table structure
\d user_signals

-- Check indexes
\di
```

### 3. Set Up Database Roles and Permissions

```sql
-- Create application user
CREATE USER trading_app_user WITH PASSWORD 'secure_password';

-- Grant permissions to application user
GRANT CONNECT ON DATABASE trading_journal TO trading_app_user;
GRANT USAGE ON SCHEMA public TO trading_app_user;
GRANT SELECT, INSERT, UPDATE ON users TO trading_app_user;
GRANT SELECT, INSERT, UPDATE ON user_signals TO trading_app_user;
GRANT SELECT, INSERT ON signals TO trading_app_user;
GRANT SELECT ON signal_risk_map TO trading_app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO trading_app_user;

-- Create admin user
CREATE USER trading_admin_user WITH PASSWORD 'admin_secure_password';

-- Grant full permissions to admin user
GRANT CONNECT ON DATABASE trading_journal TO trading_admin_user;
GRANT USAGE ON SCHEMA public TO trading_admin_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO trading_admin_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO trading_admin_user;
```

## 🚀 Backend Deployment

### 1. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install additional dependencies for signal system
pip install redis socketio flask-socketio
```

### 2. Update Flask Application

Add the new blueprints to your Flask app:

```python
# In your main app.py or __init__.py
from journal.admin_signals_api import admin_signals_bp
from journal.user_signals_api import user_signals_bp
from journal.socketio_service import socketio_app
from journal.signal_broadcaster import start_signal_broadcaster

# Register blueprints
app.register_blueprint(admin_signals_bp, url_prefix='/api')
app.register_blueprint(user_signals_bp, url_prefix='/api')

# Initialize Socket.IO
socketio_app.init_app(app)

# Start signal broadcaster
start_signal_broadcaster(socketio_app)
```

### 3. Update WSGI Configuration

```python
# wsgi.py
from journal import create_app
from journal.socketio_service import socketio_app
from journal.signal_broadcaster import start_signal_broadcaster

app = create_app()
socketio_app.init_app(app)
start_signal_broadcaster(socketio_app)

if __name__ == "__main__":
    socketio_app.run(app, debug=False, host='0.0.0.0', port=5000)
```

### 4. Production Server Configuration

#### Using Gunicorn with Socket.IO

```bash
# Install gunicorn with gevent
pip install gunicorn gevent gevent-websocket

# Run with gevent worker
gunicorn --worker-class gevent --worker-connections 1000 --bind 0.0.0.0:5000 wsgi:app
```

#### Using uWSGI

```ini
# uwsgi.ini
[uwsgi]
module = wsgi:app
master = true
processes = 4
socket = /tmp/uwsgi.sock
chmod-socket = 666
vacuum = true
die-on-term = true
gevent = 1000
```

## 🌐 Frontend Deployment

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Socket.IO client
npm install socket.io-client
```

### 2. Update Frontend Components

Replace existing signal components with the new real-time version:

```typescript
// In your main dashboard component
import RealTimeSignalsFeed from './components/RealTimeSignalsFeed';

// Replace existing signals feed
<RealTimeSignalsFeed 
  onMarkAsTaken={handleMarkAsTaken}
  onAddToJournal={handleAddToJournal}
  onChatWithNexus={handleChatWithNexus}
/>
```

### 3. Build for Production

```bash
# Build the frontend
npm run build

# The build files will be in the dist/ directory
```

## 🔄 Redis Setup

### 1. Install Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS
brew install redis

# Start Redis
sudo systemctl start redis-server
# or
brew services start redis
```

### 2. Configure Redis

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Set the following:
bind 127.0.0.1
port 6379
timeout 300
tcp-keepalive 60
```

### 3. Test Redis Connection

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG
```

## 🧪 Testing

### 1. Run Backend Tests

```bash
# Install test dependencies
pip install pytest pytest-flask

# Run tests
pytest tests/test_signal_system.py -v
```

### 2. Run Frontend Tests

```bash
# Install test dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# Run tests
npm run test
```

### 3. Integration Testing

```bash
# Test the complete pipeline
python tests/test_integration.py

# Test Socket.IO connection
node tests/test_socketio_connection.js
```

## 📊 Monitoring and Logging

### 1. Application Logs

```python
# Configure logging in your Flask app
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('signal_system.log'),
        logging.StreamHandler()
    ]
)
```

### 2. Redis Monitoring

```bash
# Monitor Redis commands
redis-cli monitor

# Check Redis info
redis-cli info

# Check connected clients
redis-cli client list
```

### 3. Database Monitoring

```sql
-- Monitor active connections
SELECT * FROM pg_stat_activity;

-- Check signal table statistics
SELECT 
    risk_tier,
    COUNT(*) as signal_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count
FROM signals 
GROUP BY risk_tier;
```

## 🔒 Security Considerations

### 1. Database Security

- Use strong passwords for database users
- Limit application user permissions (no DELETE on signals table)
- Enable SSL connections for production
- Regular security updates

### 2. API Security

- Use HTTPS in production
- Implement rate limiting
- Validate all input data
- Use secure JWT secrets

### 3. Redis Security

- Set Redis password: `requirepass your_redis_password`
- Bind to localhost only in production
- Use Redis AUTH in application

## 🚨 Troubleshooting

### Common Issues

#### 1. Socket.IO Connection Failed

```bash
# Check if Socket.IO server is running
curl -I http://localhost:5000/socket.io/

# Check firewall settings
sudo ufw status
```

#### 2. Redis Connection Error

```bash
# Check Redis status
sudo systemctl status redis-server

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

#### 3. Database Connection Issues

```bash
# Test database connection
psql -h localhost -U username -d trading_journal -c "SELECT 1;"

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Add additional indexes for performance
CREATE INDEX CONCURRENTLY idx_signals_created_at_desc ON signals (created_at DESC);
CREATE INDEX CONCURRENTLY idx_user_signals_delivered_at ON user_signals (delivered_at);
```

#### 2. Redis Optimization

```bash
# Configure Redis for better performance
echo "maxmemory 256mb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf
```

#### 3. Socket.IO Optimization

```javascript
// Configure Socket.IO for production
const io = require('socket.io')(server, {
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling

- Use Redis Cluster for multiple Redis instances
- Implement Socket.IO Redis adapter for multiple server instances
- Use load balancer with sticky sessions

### 2. Database Scaling

- Implement read replicas for user signal queries
- Use connection pooling
- Consider partitioning for large signal tables

### 3. Monitoring

- Set up application performance monitoring (APM)
- Monitor Redis memory usage
- Track Socket.IO connection counts
- Monitor database query performance

## ✅ Deployment Checklist

- [ ] Database migrations executed
- [ ] Environment variables configured
- [ ] Redis server running and accessible
- [ ] Backend API endpoints responding
- [ ] Socket.IO server running
- [ ] Frontend built and deployed
- [ ] Real-time signal flow tested
- [ ] Admin signal creation tested
- [ ] User signal reception tested
- [ ] Database permissions verified
- [ ] Security measures implemented
- [ ] Monitoring and logging configured
- [ ] Performance optimization applied
- [ ] Backup strategy implemented

## 🎯 Acceptance Criteria Verification

### 1. Signal Creation Flow

```bash
# Test admin signal creation
curl -X POST http://localhost:5000/api/admin/signals \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "side": "buy",
    "entry_price": 46000,
    "stop_loss": 45500,
    "take_profit": 48000,
    "risk_tier": "medium",
    "payload": {"analysis": "Test signal"}
  }'
```

### 2. Real-time Delivery

- Create signal in admin dashboard
- Verify signal appears in user dashboard within 2 seconds
- Check Redis pub/sub logs
- Verify Socket.IO delivery logs

### 3. User Signal Fetch

```bash
# Test user signal fetch
curl -X GET http://localhost:5000/api/user/signals \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### 4. Signal Immutability

- Verify users cannot delete signals via API
- Check database constraints
- Test admin-only archive functionality

This deployment guide ensures a robust, scalable, and secure real-time signal system that meets all the specified requirements.
