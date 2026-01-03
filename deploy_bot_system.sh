#!/bin/bash

# Deploy Bot System to Render
# This script deploys the forex and crypto trading bot systems

set -e

echo "🚀 Starting Bot System Deployment to Render..."

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please run this script from the project root."
    exit 1
fi

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    echo "📦 Installing Render CLI..."
    curl -s https://render.com/download.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Check if logged in to Render
if ! render whoami &> /dev/null; then
    echo "🔐 Please log in to Render first:"
    echo "   render login"
    exit 1
fi

echo "✅ Render CLI ready"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p config

# Set up environment variables
echo "🔧 Setting up environment variables..."
if [ ! -f ".env.bots" ]; then
    cat > .env.bots << EOF
# Bot System Environment Variables
FLASK_ENV=production
FLASK_APP=enhanced_trading_server.py
PORT=5000

# Database Configuration
DATABASE_URL=sqlite:///data/trading_bots.db
FOREX_DB_PATH=data/forex_bot.db
CRYPTO_DB_PATH=data/crypto_bot.db

# API Configuration
FOREX_API_URL=https://your-forex-service.onrender.com
BINANCE_API_URL=https://your-binance-service.onrender.com

# Bot Configuration
MAX_BOTS=10
DEFAULT_RISK_LEVEL=medium
UPDATE_INTERVAL=30
MIN_CONFIDENCE=0.7

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/bot_system.log

# Security
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)
EOF
    echo "✅ Created .env.bots file"
fi

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Additional bot-specific dependencies
echo "📦 Installing bot-specific dependencies..."
pip install numpy pandas ta-lib requests flask-cors

# Test the bot systems
echo "🧪 Testing bot systems..."
echo "Testing Forex Bot System..."
python3 -c "
from forex_bot_system import ForexBotSystem
print('✅ Forex Bot System imported successfully')
"

echo "Testing Crypto Trading Bot..."
python3 -c "
from crypto_trading_bot import CryptoTradingBot
print('✅ Crypto Trading Bot imported successfully')
"

echo "Testing Enhanced Trading Server..."
python3 -c "
from enhanced_trading_server import app
print('✅ Enhanced Trading Server imported successfully')
"

# Create startup script
echo "📝 Creating startup script..."
cat > start_bots.sh << 'EOF'
#!/bin/bash

# Start Bot System
echo "🤖 Starting Trading Bot System..."

# Set environment
export FLASK_ENV=production
export FLASK_APP=enhanced_trading_server.py

# Create data directory if it doesn't exist
mkdir -p data
mkdir -p logs

# Start the enhanced trading server
echo "🚀 Starting Enhanced Trading Server..."
python3 enhanced_trading_server.py &

# Wait a moment for server to start
sleep 5

# Check if server is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Enhanced Trading Server is running"
else
    echo "❌ Failed to start Enhanced Trading Server"
    exit 1
fi

echo "🎉 Bot System is now running!"
echo "📊 Dashboard: http://localhost:5000"
echo "🔍 Health Check: http://localhost:5000/health"

# Keep script running
wait
EOF

chmod +x start_bots.sh

# Create systemd service file (for Linux systems)
if command -v systemctl &> /dev/null; then
    echo "📋 Creating systemd service..."
    sudo tee /etc/systemd/system/trading-bots.service > /dev/null << EOF
[Unit]
Description=Trading Bot System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/venv/bin
ExecStart=$(pwd)/start_bots.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    echo "🔄 Reloading systemd..."
    sudo systemctl daemon-reload
    
    echo "📋 Service created: trading-bots.service"
    echo "   To start: sudo systemctl start trading-bots"
    echo "   To enable: sudo systemctl enable trading-bots"
    echo "   To check status: sudo systemctl status trading-bots"
fi

# Create Docker Compose file for containerized deployment
echo "🐳 Creating Docker Compose file..."
cat > docker-compose.bots.yml << EOF
version: '3.8'

services:
  trading-bots:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - FLASK_APP=enhanced_trading_server.py
      - PORT=5000
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  forex-bot:
    build: .
    command: python3 forex_bot_system.py
    environment:
      - FLASK_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  crypto-bot:
    build: .
    command: python3 crypto_trading_bot.py
    environment:
      - FLASK_ENV=production
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

volumes:
  data:
  logs:
EOF

# Create Dockerfile for bot system
echo "🐳 Creating Dockerfile..."
cat > Dockerfile.bots << EOF
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install bot-specific dependencies
RUN pip install --no-cache-dir numpy pandas requests flask-cors

# Copy bot system files
COPY enhanced_trading_server.py .
COPY forex_bot_system.py .
COPY crypto_trading_bot.py .
COPY start_bots.sh .

# Create necessary directories
RUN mkdir -p data logs config

# Make startup script executable
RUN chmod +x start_bots.sh

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:5000/health || exit 1

# Start the bot system
CMD ["./start_bots.sh"]
EOF

# Create deployment configuration for Render
echo "⚙️ Creating Render deployment configuration..."
cat > render.bots.yaml << EOF
services:
  - type: web
    name: trading-bots
    env: python
    plan: starter
    buildCommand: |
      pip install -r requirements.txt
      pip install numpy pandas requests flask-cors
    startCommand: python3 enhanced_trading_server.py
    envVars:
      - key: FLASK_ENV
        value: production
      - key: FLASK_APP
        value: enhanced_trading_server.py
      - key: PORT
        value: 5000
      - key: DATABASE_URL
        value: sqlite:///data/trading_bots.db
      - key: FOREX_DB_PATH
        value: data/forex_bot.db
      - key: CRYPTO_DB_PATH
        value: data/crypto_bot.db
      - key: SECRET_KEY
        generateValue: true
      - key: JWT_SECRET_KEY
        generateValue: true
    healthCheckPath: /health
    autoDeploy: true

  - type: worker
    name: forex-bot-worker
    env: python
    plan: starter
    buildCommand: |
      pip install -r requirements.txt
      pip install numpy pandas requests flask-cors
    startCommand: python3 forex_bot_system.py
    envVars:
      - key: FLASK_ENV
        value: production
      - key: FOREX_DB_PATH
        value: data/forex_bot.db
      - key: SECRET_KEY
        generateValue: true

  - type: worker
    name: crypto-bot-worker
    env: python
    plan: starter
    buildCommand: |
      pip install -r requirements.txt
      pip install numpy pandas requests flask-cors
    startCommand: python3 crypto_trading_bot.py
    envVars:
      - key: FLASK_ENV
        value: production
      - key: CRYPTO_DB_PATH
        value: data/crypto_bot.db
      - key: SECRET_KEY
        generateValue: true
EOF

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > monitor_bots.sh << 'EOF'
#!/bin/bash

# Monitor Bot System Status
echo "🔍 Bot System Status Monitor"
echo "=============================="

# Check if services are running
echo "📊 Service Status:"
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Enhanced Trading Server: RUNNING"
    HEALTH_DATA=$(curl -s http://localhost:5000/health)
    echo "   Bots Count: $(echo $HEALTH_DATA | jq -r '.bots_count // "N/A"')"
    echo "   Active Bots: $(echo $HEALTH_DATA | jq -r '.active_bots // "N/A"')"
    echo "   Price Feeds: $(echo $HEALTH_DATA | jq -r '.price_feeds // "N/A"')"
    echo "   Signals Count: $(echo $HEALTH_DATA | jq -r '.signals_count // "N/A"')"
else
    echo "❌ Enhanced Trading Server: NOT RUNNING"
fi

# Check database files
echo ""
echo "🗄️ Database Status:"
if [ -f "data/trading_bots.db" ]; then
    echo "✅ Trading Bots DB: EXISTS"
    echo "   Size: $(du -h data/trading_bots.db | cut -f1)"
else
    echo "❌ Trading Bots DB: MISSING"
fi

if [ -f "data/forex_bot.db" ]; then
    echo "✅ Forex Bot DB: EXISTS"
    echo "   Size: $(du -h data/forex_bot.db | cut -f1)"
else
    echo "❌ Forex Bot DB: MISSING"
fi

if [ -f "data/crypto_bot.db" ]; then
    echo "✅ Crypto Bot DB: EXISTS"
    echo "   Size: $(du -h data/crypto_bot.db | cut -f1)"
else
    echo "❌ Crypto Bot DB: MISSING"
fi

# Check log files
echo ""
echo "📝 Log Status:"
if [ -f "logs/bot_system.log" ]; then
    echo "✅ Bot System Log: EXISTS"
    echo "   Size: $(du -h logs/bot_system.log | cut -f1)"
    echo "   Last 5 lines:"
    tail -5 logs/bot_system.log | sed 's/^/   /'
else
    echo "❌ Bot System Log: MISSING"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Start the bot system: ./start_bots.sh"
echo "2. Monitor status: ./monitor_bots.sh"
echo "3. View dashboard: http://localhost:5000"
echo "4. Check logs: tail -f logs/bot_system.log"
EOF

chmod +x monitor_bots.sh

# Create test script
echo "🧪 Creating test script..."
cat > test_bots.sh << 'EOF'
#!/bin/bash

# Test Bot System
echo "🧪 Testing Bot System Components..."

# Test Python imports
echo "Testing Python imports..."
python3 -c "
try:
    from forex_bot_system import ForexBotSystem
    print('✅ Forex Bot System: OK')
except Exception as e:
    print(f'❌ Forex Bot System: {e}')

try:
    from crypto_trading_bot import CryptoTradingBot
    print('✅ Crypto Trading Bot: OK')
except Exception as e:
    print(f'❌ Crypto Trading Bot: {e}')

try:
    from enhanced_trading_server import app
    print('✅ Enhanced Trading Server: OK')
except Exception as e:
    print(f'❌ Enhanced Trading Server: {e}')
"

# Test database creation
echo ""
echo "Testing database creation..."
python3 -c "
import sqlite3
import os

# Test trading bots DB
try:
    conn = sqlite3.connect('data/trading_bots.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"')
    tables = cursor.fetchall()
    print(f'✅ Trading Bots DB: {len(tables)} tables created')
    conn.close()
except Exception as e:
    print(f'❌ Trading Bots DB: {e}')

# Test forex bot DB
try:
    conn = sqlite3.connect('data/forex_bot.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"')
    tables = cursor.fetchall()
    print(f'✅ Forex Bot DB: {len(tables)} tables created')
    conn.close()
except Exception as e:
    print(f'❌ Forex Bot DB: {e}')

# Test crypto bot DB
try:
    conn = sqlite3.connect('data/crypto_bot.db')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\"')
    tables = cursor.fetchall()
    print(f'✅ Crypto Bot DB: {len(tables)} tables created')
    conn.close()
except Exception as e:
    print(f'❌ Crypto Bot DB: {e}')
"

echo ""
echo "🎉 Bot System testing completed!"
EOF

chmod +x test_bots.sh

echo ""
echo "🎉 Bot System Deployment Setup Complete!"
echo ""
echo "📋 What was created:"
echo "   ✅ .env.bots - Environment configuration"
echo "   ✅ start_bots.sh - Startup script"
echo "   ✅ monitor_bots.sh - Monitoring script"
echo "   ✅ test_bots.sh - Testing script"
echo "   ✅ docker-compose.bots.yml - Docker deployment"
echo "   ✅ Dockerfile.bots - Docker configuration"
echo "   ✅ render.bots.yaml - Render deployment config"
echo ""
echo "🚀 To deploy to Render:"
echo "   1. render blueprint apply render.bots.yaml"
echo ""
echo "🔧 To run locally:"
echo "   1. ./test_bots.sh"
echo "   2. ./start_bots.sh"
echo "   3. ./monitor_bots.sh"
echo ""
echo "📊 Dashboard will be available at: http://localhost:5000"
echo "🔍 Health check at: http://localhost:5000/health"
