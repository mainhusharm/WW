#!/bin/bash

echo "🚀 Deploying Bot Trading System..."
echo "=================================="

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

# Check if we're in the right directory
if [ ! -f "journal/__init__.py" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Starting deployment process..."

# Step 1: Install Python dependencies
print_status "Installing Python dependencies..."
cd journal
if command -v pip3 &> /dev/null; then
    pip3 install -r requirements.txt
elif command -v pip &> /dev/null; then
    pip install -r requirements.txt
else
    print_error "pip not found. Please install Python and pip first."
    exit 1
fi

# Check if yfinance is installed
python3 -c "import yfinance" 2>/dev/null
if [ $? -ne 0 ]; then
    print_warning "yfinance not found, installing..."
    pip3 install yfinance pandas
fi

print_success "Python dependencies installed"

# Step 2: Initialize database
print_status "Initializing database tables..."
cd ..
python3 journal/create_bot_tables.py
if [ $? -eq 0 ]; then
    print_success "Database tables initialized"
else
    print_error "Failed to initialize database tables"
    exit 1
fi

# Step 3: Install frontend dependencies
print_status "Installing frontend dependencies..."
if command -v npm &> /dev/null; then
    npm install
    print_success "Frontend dependencies installed"
else
    print_warning "npm not found. Please install Node.js and npm first."
fi

# Step 4: Build frontend
print_status "Building frontend..."
if command -v npm &> /dev/null; then
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Frontend built successfully"
    else
        print_error "Frontend build failed"
        exit 1
    fi
fi

# Step 5: Test backend
print_status "Testing backend..."
cd journal
python3 -c "
from journal import create_app
from journal.extensions import db
app = create_app()
with app.app_context():
    try:
        db.session.execute('SELECT 1')
        print('✅ Database connection successful')
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        exit(1)
"
if [ $? -eq 0 ]; then
    print_success "Backend test passed"
else
    print_error "Backend test failed"
    exit 1
fi

cd ..

# Step 6: Create systemd service for production
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/trading-bot.service > /dev/null <<EOF
[Unit]
Description=Trading Bot Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=PATH=$(pwd)/journal/.venv/bin
ExecStart=$(pwd)/journal/.venv/bin/python $(pwd)/journal/run_journal.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service created"

# Step 7: Enable and start service
print_status "Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable trading-bot.service
sudo systemctl start trading-bot.service

# Check service status
sleep 3
if sudo systemctl is-active --quiet trading-bot.service; then
    print_success "Trading bot service is running"
else
    print_error "Trading bot service failed to start"
    sudo systemctl status trading-bot.service
fi

# Step 8: Create startup script
print_status "Creating startup script..."
cat > start_bot_system.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Trading Bot System..."

# Start the backend
cd journal
python3 run_journal.py &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start the bot service
python3 -c "
from journal.bot_service import start_bot_service
start_bot_service()
"

echo "✅ Trading Bot System started"
echo "Backend PID: $BACKEND_PID"
echo "Press Ctrl+C to stop"

# Wait for interrupt
trap "echo '🛑 Stopping system...'; kill $BACKEND_PID; exit 0" INT
wait
EOF

chmod +x start_bot_system.sh
print_success "Startup script created"

# Step 9: Create health check script
print_status "Creating health check script..."
cat > check_bot_health.sh << 'EOF'
#!/bin/bash

echo "🏥 Checking Trading Bot System Health..."

# Check backend status
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not responding"
fi

# Check bot status
if curl -s http://localhost:5000/api/bot/status > /dev/null; then
    echo "✅ Bot API is responding"
    curl -s http://localhost:5000/api/bot/status | python3 -m json.tool
else
    echo "❌ Bot API is not responding"
fi

# Check service status
if sudo systemctl is-active --quiet trading-bot.service; then
    echo "✅ Systemd service is running"
else
    echo "❌ Systemd service is not running"
fi
EOF

chmod +x check_bot_health.sh
print_success "Health check script created"

# Step 10: Create deployment summary
print_status "Creating deployment summary..."
cat > DEPLOYMENT_SUMMARY.md << EOF
# Trading Bot System Deployment Summary

## ✅ Deployment Completed Successfully

### What was deployed:
1. **Backend API** - Flask-based trading bot API
2. **Bot Service** - Background service for crypto and forex bots
3. **Database Tables** - Bot data storage and status management
4. **Frontend Components** - Enhanced dashboard with bot controls
5. **System Service** - Systemd service for production deployment

### Key Features:
- **Active/Inactive Toggle Switches** for both Crypto and Forex bots
- **M-PIN Protected Database Dashboard** (PIN: 231806)
- **Real-time Data Storage** from yfinance API
- **Interactive Charts** using Lightweight Charts
- **Persistent Bot Status** stored in database
- **Background Service** that runs continuously

### API Endpoints:
- \`/api/bot/status\` - Get bot status
- \`/api/bot/start\` - Start a bot
- \`/api/bot/stop\` - Stop a bot
- \`/api/bot/data\` - Store/get bot data
- \`/api/bot/ohlc\` - Get chart data
- \`/api/bot/dashboard/auth\` - Authenticate dashboard
- \`/api/bot/dashboard/stats\` - Get dashboard statistics

### Database Tables:
- \`bot_status\` - Bot active/inactive status
- \`bot_data\` - Raw bot data and signals
- \`ohlc_data\` - Chart data for visualization

### How to use:

#### Start the system:
\`\`\`bash
./start_bot_system.sh
\`\`\`

#### Check system health:
\`\`\`bash
./check_bot_health.sh
\`\`\`

#### Access Database Dashboard:
1. Navigate to the database dashboard
2. Enter M-PIN: \`231806\`
3. View real-time bot data and charts

#### Control Bots:
1. Go to Crypto Dashboard or Forex Data Dashboard
2. Use the Active/Inactive toggle switches
3. Bots will start/stop immediately and persist across sessions

### Production Deployment:
The system is configured as a systemd service and will:
- Start automatically on boot
- Restart automatically if it crashes
- Run continuously in the background
- Store all data persistently in the database

### Troubleshooting:
- Check service status: \`sudo systemctl status trading-bot.service\`
- View logs: \`sudo journalctl -u trading-bot.service -f\`
- Restart service: \`sudo systemctl restart trading-bot.service\`

## 🎉 System is ready for production use!
EOF

print_success "Deployment summary created"

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "======================================"
echo ""
echo "📋 Next steps:"
echo "1. Start the system: ./start_bot_system.sh"
echo "2. Check health: ./check_bot_health.sh"
echo "3. Access dashboard with M-PIN: 231806"
echo "4. Control bots from Crypto/Forex dashboards"
echo ""
echo "📚 See DEPLOYMENT_SUMMARY.md for detailed information"
echo ""
echo "🚀 Your Trading Bot System is ready!"
