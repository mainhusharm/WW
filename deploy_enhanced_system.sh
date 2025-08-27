#!/bin/bash

# Enhanced Trading System Deployment Script
# This script sets up the complete enhanced trading system with all features

set -e

echo "🚀 Starting Enhanced Trading System Deployment..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on Render
if [ -n "$RENDER" ]; then
    print_status "Detected Render environment"
    RENDER_ENV=true
else
    print_status "Running in local environment"
    RENDER_ENV=false
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p instance
mkdir -p logs
mkdir -p data

# Install Python dependencies
print_status "Installing Python dependencies..."
if [ "$RENDER_ENV" = true ]; then
    pip install --upgrade pip
    pip install -r requirements.txt
else
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements.txt
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
npm install

# Install server dependencies
print_status "Installing server dependencies..."
cd server && npm install && cd ..

# Install binance service dependencies
print_status "Installing binance service dependencies..."
cd binance_service && npm install && cd ..

# Install chart analyzer dependencies
print_status "Installing chart analyzer dependencies..."
cd chart_analyzer_feature && npm install && cd ..

# Install lot size calculator dependencies
print_status "Installing lot size calculator dependencies..."
cd lot_size_calculator && npm install && cd ..

# Install trade mentor service dependencies
print_status "Installing trade mentor service dependencies..."
cd trade_mentor_service && npm install && cd ..

# Install trading signal bot dependencies
print_status "Installing trading signal bot dependencies..."
cd trading-signal-bot && npm install && cd ..

# Install automated trading system dependencies
print_status "Installing automated trading system dependencies..."
cd automated-trading-system && npm install && cd ..

# Install customer service dependencies
print_status "Installing customer service dependencies..."
cd customer-service && npm install && cd ..

# Install forex data service dependencies
print_status "Installing forex data service dependencies..."
cd forex_data_service && pip install -r requirements.txt && cd ..

# Install trading journal dependencies
print_status "Installing trading journal dependencies..."
cd trading-journal-frontend && npm install && cd ..

# Install signal generator dependencies
print_status "Installing signal generator dependencies..."
cd signal_generator && npm install && cd ..

# Initialize database
print_status "Initializing database..."
if [ "$RENDER_ENV" = true ]; then
    python enhanced_trading_server.py --init-db
else
    python3 enhanced_trading_server.py --init-db
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating environment file..."
    cat > .env << EOF
# Enhanced Trading System Environment Variables
NODE_ENV=production
PORT=5000
FLASK_ENV=production

# Database Configuration
DATABASE_URL=sqlite:///instance/trading_bot.db

# API Keys (Add your actual keys here)
BINANCE_API_KEY=
BINANCE_SECRET_KEY=

# WebSocket Configuration
WS_PORT=3001
WS_HOST=0.0.0.0

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/trading_system.log

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
MPIN_DATABASE=231806

# External APIs
YFINANCE_ENABLED=true
BINANCE_ENABLED=true
FINNHUB_API_KEY=

# Bot Configuration
CRYPTO_BOT_ENABLED=true
FOREX_BOT_ENABLED=true
SIGNAL_GENERATOR_ENABLED=true

# Risk Management
MAX_RISK_PER_TRADE=2.0
MAX_DAILY_RISK=6.0
MAX_MONTHLY_RISK=20.0

# Performance
TRADE_HISTORY_RETENTION_DAYS=365
SIGNAL_CACHE_TTL_MINUTES=5
BOT_UPDATE_INTERVAL_SECONDS=60
EOF
    print_success "Environment file created"
fi

# Create systemd service files for production
if [ "$RENDER_ENV" = false ]; then
    print_status "Creating systemd service files..."
    
    # Enhanced Trading Server Service
    cat > enhanced-trading-server.service << EOF
[Unit]
Description=Enhanced Trading Bot Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/.venv/bin
ExecStart=$(pwd)/.venv/bin/python enhanced_trading_server.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # YFinance Proxy Service
    cat > yfinance-proxy.service << EOF
[Unit]
Description=YFinance Proxy Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/server
ExecStart=/usr/bin/node yfinance-proxy.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Binance Service
    cat > binance-service.service << EOF
[Unit]
Description=Binance Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/binance_service
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    print_success "Systemd service files created"
fi

# Create startup script
print_status "Creating startup script..."
cat > start_enhanced_system.sh << 'EOF'
#!/bin/bash

# Enhanced Trading System Startup Script

echo "🚀 Starting Enhanced Trading System..."

# Function to start service
start_service() {
    local service_name=$1
    local command=$2
    local working_dir=$3
    
    echo "Starting $service_name..."
    
    if [ -n "$working_dir" ]; then
        cd "$working_dir"
    fi
    
    nohup $command > "logs/${service_name}.log" 2>&1 &
    echo $! > "logs/${service_name}.pid"
    
    if [ -n "$working_dir" ]; then
        cd - > /dev/null
    fi
    
    echo "$service_name started with PID $(cat logs/${service_name}.pid)"
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Start Enhanced Trading Server
start_service "enhanced-trading-server" "python enhanced_trading_server.py"

# Start YFinance Proxy
start_service "yfinance-proxy" "node yfinance-proxy.js" "server"

# Start Binance Service
start_service "binance-service" "node server.js" "binance_service"

# Start Chart Analyzer
start_service "chart-analyzer" "node server.js" "chart_analyzer_feature"

# Start Lot Size Calculator
start_service "lot-calculator" "node server.js" "lot_size_calculator"

# Start Trade Mentor Service
start_service "trade-mentor" "node server.js" "trade_mentor_service"

# Start Trading Signal Bot
start_service "signal-bot" "node server.js" "trading-signal-bot"

# Start Automated Trading System
start_service "auto-trader" "node automated_trader.js" "automated-trading-system"

# Start Customer Service
start_service "customer-service" "node server.js" "customer-service"

# Start Forex Data Service
start_service "forex-data" "python server.py" "forex_data_service"

# Start Trading Journal
start_service "trading-journal" "npm start" "trading-journal-frontend"

# Start Signal Generator
start_service "signal-generator" "node index.js" "signal_generator"

echo "✅ All services started!"
echo "📊 Check logs in the logs/ directory"
echo "🌐 Main server: http://localhost:5000"
echo "🔐 Database Dashboard M-PIN: 231806"

# Show running services
echo ""
echo "Running Services:"
ps aux | grep -E "(enhanced_trading_server|yfinance-proxy|binance-service)" | grep -v grep || echo "No services found"
EOF

chmod +x start_enhanced_system.sh

# Create stop script
print_status "Creating stop script..."
cat > stop_enhanced_system.sh << 'EOF'
#!/bin/bash

# Enhanced Trading System Stop Script

echo "🛑 Stopping Enhanced Trading System..."

# Function to stop service
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        echo "Stopping $service_name (PID: $pid)..."
        
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "$service_name stopped"
        else
            echo "$service_name not running"
        fi
        
        rm -f "$pid_file"
    else
        echo "$service_name PID file not found"
    fi
}

# Stop all services
stop_service "enhanced-trading-server"
stop_service "yfinance-proxy"
stop_service "binance-service"
stop_service "chart-analyzer"
stop_service "lot-calculator"
stop_service "trade-mentor"
stop_service "signal-bot"
stop_service "auto-trader"
stop_service "customer-service"
stop_service "forex-data"
stop_service "trading-journal"
stop_service "signal-generator"

# Kill any remaining processes
pkill -f "enhanced_trading_server" || true
pkill -f "yfinance-proxy" || true
pkill -f "binance-service" || true
pkill -f "chart-analyzer" || true
pkill -f "lot-calculator" || true
pkill -f "trade-mentor" || true
pkill -f "signal-bot" || true
pkill -f "auto-trader" || true
pkill -f "customer-service" || true
pkill -f "forex-data" || true
pkill -f "trading-journal" || true
pkill -f "signal-generator" || true

echo "✅ All services stopped!"
EOF

chmod +x stop_enhanced_system.sh

# Create health check script
print_status "Creating health check script..."
cat > health_check.sh << 'EOF'
#!/bin/bash

# Enhanced Trading System Health Check

echo "🏥 Health Check for Enhanced Trading System"
echo "=========================================="

# Check if main server is running
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Enhanced Trading Server: RUNNING"
else
    echo "❌ Enhanced Trading Server: NOT RUNNING"
fi

# Check if YFinance proxy is running
if curl -s http://localhost:10001/health > /dev/null; then
    echo "✅ YFinance Proxy: RUNNING"
else
    echo "❌ YFinance Proxy: NOT RUNNING"
fi

# Check if Binance service is running
if curl -s http://localhost:10002/health > /dev/null; then
    echo "✅ Binance Service: RUNNING"
else
    echo "❌ Binance Service: NOT RUNNING"
fi

# Check database
if [ -f "instance/trading_bot.db" ]; then
    echo "✅ Database: EXISTS"
    db_size=$(du -h "instance/trading_bot.db" | cut -f1)
    echo "   Size: $db_size"
else
    echo "❌ Database: NOT FOUND"
fi

# Check logs
echo ""
echo "📋 Recent Log Entries:"
if [ -d "logs" ]; then
    for log_file in logs/*.log; do
        if [ -f "$log_file" ]; then
            echo "   $(basename "$log_file"):"
            tail -3 "$log_file" | sed 's/^/     /'
        fi
    done
else
    echo "   No logs directory found"
fi

# Check system resources
echo ""
echo "💻 System Resources:"
echo "   CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "   Memory Usage: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "   Disk Usage: $(df -h . | awk 'NR==2{print $5}')"

echo ""
echo "🔐 Database Dashboard M-PIN: 231806"
echo "🌐 Main Server: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/api/health"
EOF

chmod +x health_check.sh

# Create production deployment script
print_status "Creating production deployment script..."
cat > deploy_production.sh << 'EOF'
#!/bin/bash

# Production Deployment Script for Enhanced Trading System

set -e

echo "🚀 Starting Production Deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt install -y python3 python3-pip python3-venv nodejs npm nginx sqlite3 supervisor

# Create system user
echo "👤 Creating system user..."
if ! id "trading" &>/dev/null; then
    useradd -m -s /bin/bash trading
fi

# Set up application directory
APP_DIR="/opt/enhanced-trading-system"
echo "📁 Setting up application directory: $APP_DIR"
mkdir -p $APP_DIR
cp -r . $APP_DIR/
chown -R trading:trading $APP_DIR

# Set up Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd $APP_DIR
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install server dependencies
cd server && npm install && cd ..
cd binance_service && npm install && cd ..
cd chart_analyzer_feature && npm install && cd ..
cd lot_size_calculator && npm install && cd ..
cd trade_mentor_service && npm install && cd ..
cd trading-signal-bot && npm install && cd ..
cd automated-trading-system && npm install && cd ..
cd customer-service && npm install && cd ..
cd forex_data_service && pip install -r requirements.txt && cd ..
cd trading-journal-frontend && npm install && cd ..
cd signal_generator && npm install && cd ..

# Build frontend
echo "🏗️ Building frontend..."
npm run build:prod

# Set up supervisor configuration
echo "⚙️ Setting up supervisor configuration..."
cat > /etc/supervisor/conf.d/enhanced-trading.conf << 'SUPERVISOR_EOF'
[program:enhanced-trading-server]
command=/opt/enhanced-trading-system/venv/bin/python /opt/enhanced-trading-system/enhanced_trading_server.py
directory=/opt/enhanced-trading-system
user=trading
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/enhanced-trading-server.err.log
stdout_logfile=/var/log/supervisor/enhanced-trading-server.out.log

[program:yfinance-proxy]
command=/usr/bin/node /opt/enhanced-trading-system/server/yfinance-proxy.js
directory=/opt/enhanced-trading-system/server
user=trading
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/yfinance-proxy.err.log
stdout_logfile=/var/log/supervisor/yfinance-proxy.out.log

[program:binance-service]
command=/usr/bin/node /opt/enhanced-trading-system/binance_service/server.js
directory=/opt/enhanced-trading-system/binance_service
user=trading
autostart=true
autorestart=true
stderr_logfile=/var/log/supervisor/binance-service.err.log
stdout_logfile=/var/log/supervisor/binance-service.out.log
SUPERVISOR_EOF

# Set up Nginx configuration
echo "🌐 Setting up Nginx configuration..."
cat > /etc/nginx/sites-available/enhanced-trading << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # Main application
    location / {
        root /opt/enhanced-trading-system/dist;
        try_files $uri $uri/ /index.html;
    }

    # API endpoints
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # YFinance proxy
    location /yfinance/ {
        proxy_pass http://localhost:10001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Binance service
    location /binance/ {
        proxy_pass http://localhost:10002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/enhanced-trading /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Restart services
echo "🔄 Restarting services..."
systemctl restart nginx
supervisorctl reread
supervisorctl update
supervisorctl start all

# Set up firewall
echo "🔥 Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "✅ Production deployment completed!"
echo "🌐 Application: http://your-server-ip"
echo "🔐 Database Dashboard M-PIN: 231806"
echo "📊 Supervisor: supervisorctl status"
echo "📋 Logs: /var/log/supervisor/"
EOF

chmod +x deploy_production.sh

# Create README
print_status "Creating comprehensive README..."
cat > ENHANCED_SYSTEM_README.md << 'EOF'
# Enhanced Trading System - Complete Implementation

## 🚀 Overview

This enhanced trading system includes all requested features:

### ✅ Implemented Features

1. **Recommended Signal Tagging**
   - AI-powered signal strength calculation
   - Green "Recommended" badges for optimal signals
   - Automatic tagging based on price action and volume

2. **Active/Inactive Bot Toggle**
   - Real-time bot status control
   - Persistent state storage in database
   - Background worker management

3. **Database Dashboard with M-PIN Security**
   - Secure access with M-PIN: 231806
   - Complete bot data storage and retrieval
   - Historical signal tracking

4. **Self-Created Charting**
   - Database-driven candlestick charts
   - Signal plotting on charts
   - Multiple timeframe support

5. **Persistent Signal History**
   - Permanent storage of all signals
   - Win/loss/skipped trade tracking
   - User-specific signal management

6. **Enhanced Risk Management**
   - Compounding vs Flat Risk methods
   - Earnings projections for different win rates
   - Real-time risk calculations

7. **Signal Delivery System**
   - Deduplication by unique keys
   - Real-time signal broadcasting
   - WebSocket integration

8. **Customer Database**
   - Complete user activity tracking
   - Questionnaire and risk plan storage
   - Performance analytics

## 🏗️ Architecture

### Backend Services
- **Enhanced Trading Server** (Python/Flask)
- **YFinance Proxy** (Node.js)
- **Binance Service** (Node.js)
- **Chart Analyzer** (Node.js)
- **Signal Generator** (Node.js)
- **Customer Service** (Node.js)

### Frontend Components
- **Enhanced Signal Feed** with recommended tagging
- **Bot Control Dashboard** with active/inactive toggles
- **Database Dashboard** with M-PIN security
- **Enhanced Risk Management** with compounding
- **Trade History** with persistent storage

### Database Schema
- `bot_status` - Bot activation states
- `bot_data` - Signal and price data
- `user_signals` - User trade history
- `signal_feed` - Admin-generated signals
- `customer_database` - User profiles and activities

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
./deploy_enhanced_system.sh

# Start the system
./start_enhanced_system.sh

# Check health
./health_check.sh
```

### Production Deployment
```bash
# Run as root
sudo ./deploy_production.sh
```

## 🔐 Access Credentials

- **Database Dashboard M-PIN**: 231806
- **Main Server**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 📊 API Endpoints

### Core Endpoints
- `GET /api/health` - System health check
- `GET /api/dashboard-data` - Dashboard data
- `GET /api/user/profile` - User profile
- `GET /api/user/progress` - User progress

### Bot Management
- `GET /api/bot/status` - Bot status
- `POST /api/bot/start` - Start bot
- `POST /api/bot/stop` - Stop bot
- `GET /api/database/bot-status` - Database bot status

### Signal Management
- `GET /api/signals` - Get signals
- `POST /api/signals` - Create signal
- `GET /api/user/signals` - User signals
- `POST /api/user/signals` - Create user signal

### Data Services
- `GET /api/yfinance/historical/<symbol>/<timeframe>` - Historical data
- `GET /api/yfinance/price/<symbol>` - Current price
- `POST /api/yfinance/bulk` - Bulk data

## 🔧 Configuration

### Environment Variables
- `BINANCE_API_KEY` - Binance API key
- `BINANCE_SECRET_KEY` - Binance secret key
- `JWT_SECRET` - JWT signing secret
- `MPIN_DATABASE` - Database dashboard M-PIN

### Bot Configuration
- `CRYPTO_BOT_ENABLED` - Enable crypto bot
- `FOREX_BOT_ENABLED` - Enable forex bot
- `BOT_UPDATE_INTERVAL_SECONDS` - Update frequency

## 📈 Features in Detail

### Recommended Signal Tagging
Signals are automatically tagged as "Recommended" when:
- Signal strength > 50%
- Volume > 100
- Price change > 0.5%
- Strong technical indicators

### Active/Inactive Bot Toggle
- Bots run as background services
- State persists across restarts
- Real-time status updates
- Database-driven control

### Compounding vs Flat Risk
- **Flat Risk**: Fixed dollar amount per trade
- **Compounding**: Risk percentage of current balance
- Side-by-side comparison
- Earnings projections for both methods

### Signal Deduplication
- Unique key generation: `hash(symbol + timeframe + direction + entry + sl + tp + timestampBucket)`
- Prevents duplicate signals
- Maintains signal integrity

## 🚨 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 5000, 10001, 10002 are available
2. **Database errors**: Ensure SQLite is installed and writable
3. **API failures**: Check API keys and network connectivity
4. **Bot not starting**: Verify database permissions and bot status

### Logs
- Application logs: `logs/` directory
- System logs: `journalctl -u enhanced-trading-server`
- Nginx logs: `/var/log/nginx/`

## 🔄 Updates and Maintenance

### Regular Maintenance
- Monitor bot performance
- Review signal accuracy
- Update risk parameters
- Backup database regularly

### System Updates
```bash
git pull origin main
./deploy_enhanced_system.sh
sudo systemctl restart enhanced-trading-server
```

## 📞 Support

For technical support or feature requests:
- Check logs for error details
- Verify configuration settings
- Test individual components
- Review system requirements

## 🎯 Next Steps

1. **Configure API Keys**: Add your Binance and other API credentials
2. **Customize Risk Parameters**: Adjust risk percentages and limits
3. **Set Up Monitoring**: Configure alerts and notifications
4. **Backup Strategy**: Implement regular database backups
5. **Performance Tuning**: Optimize based on usage patterns

---

**System Status**: ✅ Fully Implemented and Ready for Production
**Last Updated**: $(date)
**Version**: 2.0.0 - Enhanced Edition
EOF

print_success "Enhanced Trading System deployment completed!"
echo ""
echo "🎉 All components have been installed and configured!"
echo ""
echo "📋 What's been implemented:"
echo "   ✅ Recommended Signal Tagging"
echo "   ✅ Active/Inactive Bot Toggle"
echo "   ✅ Database Dashboard with M-PIN (231806)"
echo "   ✅ Self-Created Charting from Database"
echo "   ✅ Persistent Signal History"
echo "   ✅ Enhanced Risk Management with Compounding"
echo "   ✅ Signal Delivery System with Deduplication"
echo "   ✅ Customer Database with Complete Tracking"
echo "   ✅ All Required Dependencies"
echo "   ✅ Production-Ready Deployment Scripts"
echo ""
echo "🚀 To start the system:"
echo "   ./start_enhanced_system.sh"
echo ""
echo "🔍 To check system health:"
echo "   ./health_check.sh"
echo ""
echo "🛑 To stop the system:"
echo "   ./stop_enhanced_system.sh"
echo ""
echo "🌐 Main server will be available at: http://localhost:5000"
echo "🔐 Database Dashboard M-PIN: 231806"
echo ""
echo "📚 For detailed information, see: ENHANCED_SYSTEM_README.md"
echo ""
print_success "Deployment completed successfully!"
