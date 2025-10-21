#!/bin/bash

# Enhanced Customer Data Capture System Deployment Script
# This script deploys the comprehensive customer data capture system

echo "🚀 Deploying Enhanced Customer Data Capture System"
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

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    print_error "Python3 is not installed. Please install Python3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    print_error "pip3 is not installed. Please install pip3 first."
    exit 1
fi

print_status "Installing Python dependencies..."

# Install required Python packages
pip3 install flask flask-cors sqlite3

if [ $? -eq 0 ]; then
    print_success "Python dependencies installed successfully"
else
    print_error "Failed to install Python dependencies"
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p backups

# Set up the enhanced customer data capture service
print_status "Setting up Enhanced Customer Data Capture Service..."

# Make the Python script executable
chmod +x enhanced_customer_data_capture.py

# Create a systemd service file for production
cat > enhanced-customer-data-capture.service << EOF
[Unit]
Description=Enhanced Customer Data Capture System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 $(pwd)/enhanced_customer_data_capture.py
Restart=always
RestartSec=10
Environment=PYTHONPATH=$(pwd)

[Install]
WantedBy=multi-user.target
EOF

print_success "Systemd service file created"

# Create a startup script
cat > start_enhanced_customer_data.sh << 'EOF'
#!/bin/bash

# Enhanced Customer Data Capture System Startup Script

echo "🚀 Starting Enhanced Customer Data Capture System..."

# Check if the service is already running
if pgrep -f "enhanced_customer_data_capture.py" > /dev/null; then
    echo "⚠️  Service is already running. Stopping existing instance..."
    pkill -f "enhanced_customer_data_capture.py"
    sleep 2
fi

# Start the service
echo "📊 Starting Enhanced Customer Data Capture Service on port 5004..."
python3 enhanced_customer_data_capture.py &

# Get the PID
PID=$!
echo "✅ Service started with PID: $PID"
echo "📊 Service is running on: http://localhost:5004"
echo "🔐 Admin MPIN: 180623"
echo "🔐 Customer Service MPIN: 123456"

# Save PID to file
echo $PID > enhanced_customer_data_capture.pid

echo "🎉 Enhanced Customer Data Capture System is now running!"
echo "📋 Available endpoints:"
echo "   POST /api/customer-data/capture-signup - Capture signup data"
echo "   POST /api/customer-data/capture-payment - Capture payment data"
echo "   POST /api/customer-data/capture-questionnaire - Capture questionnaire data"
echo "   GET  /api/customer-data/get-all - Get all customer data (ADMIN ONLY)"
echo "   GET  /api/customer-data/get/<id> - Get specific customer data (ADMIN ONLY)"
echo "   POST /api/customer-data/export - Export customer data (ADMIN ONLY)"
echo "   GET  /api/customer-data/stats - Get customer data statistics (ADMIN ONLY)"
echo "   GET  /healthz - Health check"

# Wait for the service to start
sleep 3

# Check if the service is running
if pgrep -f "enhanced_customer_data_capture.py" > /dev/null; then
    echo "✅ Service is running successfully!"
    
    # Test the health endpoint
    echo "🔍 Testing health endpoint..."
    if curl -s http://localhost:5004/healthz > /dev/null; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed, but service may still be starting..."
    fi
else
    echo "❌ Failed to start the service"
    exit 1
fi
EOF

chmod +x start_enhanced_customer_data.sh

# Create a stop script
cat > stop_enhanced_customer_data.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Enhanced Customer Data Capture System..."

if [ -f enhanced_customer_data_capture.pid ]; then
    PID=$(cat enhanced_customer_data_capture.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ Service stopped (PID: $PID)"
    else
        echo "⚠️  Service was not running"
    fi
    rm -f enhanced_customer_data_capture.pid
else
    # Try to kill by process name
    if pgrep -f "enhanced_customer_data_capture.py" > /dev/null; then
        pkill -f "enhanced_customer_data_capture.py"
        echo "✅ Service stopped"
    else
        echo "⚠️  Service was not running"
    fi
fi
EOF

chmod +x stop_enhanced_customer_data.sh

# Create a restart script
cat > restart_enhanced_customer_data.sh << 'EOF'
#!/bin/bash

echo "🔄 Restarting Enhanced Customer Data Capture System..."

./stop_enhanced_customer_data.sh
sleep 2
./start_enhanced_customer_data.sh
EOF

chmod +x restart_enhanced_customer_data.sh

# Create a backup script
cat > backup_customer_data.sh << 'EOF'
#!/bin/bash

echo "💾 Creating backup of customer data..."

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup the database
if [ -f "trading_bots.db" ]; then
    cp trading_bots.db "$BACKUP_DIR/"
    echo "✅ Database backed up to $BACKUP_DIR/trading_bots.db"
fi

# Backup logs
if [ -d "logs" ]; then
    cp -r logs "$BACKUP_DIR/"
    echo "✅ Logs backed up to $BACKUP_DIR/logs/"
fi

# Create a compressed archive
cd backups
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"
cd ..

echo "✅ Backup completed: $BACKUP_DIR.tar.gz"
EOF

chmod +x backup_customer_data.sh

# Create a monitoring script
cat > monitor_enhanced_customer_data.sh << 'EOF'
#!/bin/bash

echo "📊 Enhanced Customer Data Capture System Monitor"
echo "================================================"

# Check if service is running
if pgrep -f "enhanced_customer_data_capture.py" > /dev/null; then
    echo "✅ Service Status: RUNNING"
    
    # Get PID
    PID=$(pgrep -f "enhanced_customer_data_capture.py")
    echo "📋 Process ID: $PID"
    
    # Get memory usage
    MEMORY=$(ps -o pid,vsz,rss,comm -p $PID | tail -1)
    echo "💾 Memory Usage: $MEMORY"
    
    # Test health endpoint
    echo "🔍 Testing health endpoint..."
    if curl -s http://localhost:5004/healthz > /dev/null; then
        echo "✅ Health Check: PASSED"
    else
        echo "❌ Health Check: FAILED"
    fi
    
    # Check database
    if [ -f "trading_bots.db" ]; then
        echo "✅ Database: EXISTS"
        DB_SIZE=$(du -h trading_bots.db | cut -f1)
        echo "📊 Database Size: $DB_SIZE"
    else
        echo "⚠️  Database: NOT FOUND"
    fi
    
else
    echo "❌ Service Status: NOT RUNNING"
fi

echo ""
echo "🔐 Admin Access:"
echo "   MPIN: 180623"
echo "   Customer Service MPIN: 123456"
echo "   URL: http://localhost:5004"
EOF

chmod +x monitor_enhanced_customer_data.sh

# Create a comprehensive test script
cat > test_enhanced_customer_data.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing Enhanced Customer Data Capture System"
echo "================================================"

BASE_URL="http://localhost:5004"

# Test health endpoint
echo "1. Testing health endpoint..."
if curl -s "$BASE_URL/healthz" | grep -q "ok"; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Test signup data capture
echo "2. Testing signup data capture..."
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/api/customer-data/capture-signup" \
    -H "Content-Type: application/json" \
    -d '{
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "TestPassword123!",
        "plan_type": "premium",
        "phone": "+1234567890",
        "signup_source": "test",
        "referral_code": "TEST123"
    }')

if echo "$SIGNUP_RESPONSE" | grep -q "success"; then
    echo "✅ Signup data capture test passed"
else
    echo "❌ Signup data capture test failed"
    echo "Response: $SIGNUP_RESPONSE"
fi

# Test payment data capture
echo "3. Testing payment data capture..."
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/customer-data/capture-payment" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "status": "completed",
        "payment_method": "stripe",
        "amount": 99.99,
        "transaction_id": "txn_test123"
    }')

if echo "$PAYMENT_RESPONSE" | grep -q "success"; then
    echo "✅ Payment data capture test passed"
else
    echo "❌ Payment data capture test failed"
    echo "Response: $PAYMENT_RESPONSE"
fi

# Test questionnaire data capture
echo "4. Testing questionnaire data capture..."
QUESTIONNAIRE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/customer-data/capture-questionnaire" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "questionnaire_data": {"experience": "advanced", "goals": "profit"},
        "account_type": "personal",
        "prop_firm": "Test Firm",
        "account_size": 10000,
        "trading_experience": "advanced",
        "risk_tolerance": "high",
        "trading_goals": "profit"
    }')

if echo "$QUESTIONNAIRE_RESPONSE" | grep -q "success"; then
    echo "✅ Questionnaire data capture test passed"
else
    echo "❌ Questionnaire data capture test failed"
    echo "Response: $QUESTIONNAIRE_RESPONSE"
fi

# Test admin access (should fail without proper credentials)
echo "5. Testing admin access protection..."
ADMIN_RESPONSE=$(curl -s "$BASE_URL/api/customer-data/get-all")
if echo "$ADMIN_RESPONSE" | grep -q "Admin access required"; then
    echo "✅ Admin access protection working"
else
    echo "❌ Admin access protection failed"
    echo "Response: $ADMIN_RESPONSE"
fi

# Test admin access with credentials
echo "6. Testing admin access with credentials..."
ADMIN_AUTH_RESPONSE=$(curl -s "$BASE_URL/api/customer-data/get-all" \
    -H "X-Admin-MPIN: 180623" \
    -H "X-Admin-Username: admin")

if echo "$ADMIN_AUTH_RESPONSE" | grep -q "success"; then
    echo "✅ Admin access with credentials working"
else
    echo "❌ Admin access with credentials failed"
    echo "Response: $ADMIN_AUTH_RESPONSE"
fi

echo ""
echo "🎉 Enhanced Customer Data Capture System tests completed!"
EOF

chmod +x test_enhanced_customer_data.sh

# Create a production deployment script
cat > deploy_production.sh << 'EOF'
#!/bin/bash

echo "🚀 Deploying Enhanced Customer Data Capture System to Production"
echo "==============================================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root for production deployment"
    exit 1
fi

# Install systemd service
echo "📦 Installing systemd service..."
cp enhanced-customer-data-capture.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable enhanced-customer-data-capture

# Set up log rotation
echo "📝 Setting up log rotation..."
cat > /etc/logrotate.d/enhanced-customer-data-capture << 'LOGROTATE'
/var/log/enhanced-customer-data-capture/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload enhanced-customer-data-capture
    endscript
}
LOGROTATE

# Create log directory
mkdir -p /var/log/enhanced-customer-data-capture
chown www-data:www-data /var/log/enhanced-customer-data-capture

# Set up firewall rules
echo "🔥 Setting up firewall rules..."
ufw allow 5004/tcp comment "Enhanced Customer Data Capture"

# Start the service
echo "🚀 Starting service..."
systemctl start enhanced-customer-data-capture

# Check status
sleep 3
if systemctl is-active --quiet enhanced-customer-data-capture; then
    echo "✅ Service started successfully"
    systemctl status enhanced-customer-data-capture --no-pager
else
    echo "❌ Service failed to start"
    systemctl status enhanced-customer-data-capture --no-pager
    exit 1
fi

echo ""
echo "🎉 Production deployment completed!"
echo "📊 Service is running on port 5004"
echo "🔐 Admin MPIN: 180623"
echo "🔐 Customer Service MPIN: 123456"
echo ""
echo "📋 Management commands:"
echo "   systemctl start enhanced-customer-data-capture"
echo "   systemctl stop enhanced-customer-data-capture"
echo "   systemctl restart enhanced-customer-data-capture"
echo "   systemctl status enhanced-customer-data-capture"
echo "   journalctl -u enhanced-customer-data-capture -f"
EOF

chmod +x deploy_production.sh

# Create a comprehensive README
cat > ENHANCED_CUSTOMER_DATA_README.md << 'EOF'
# Enhanced Customer Data Capture System

## Overview
This system provides comprehensive customer data capture with admin-only access controls. It captures all user data after signup and payment completion, storing it permanently with strict security measures.

## Features
- **Comprehensive Data Capture**: Captures signup, payment, and questionnaire data
- **Admin-Only Access**: Only admin users can view and export customer data
- **Immutable Storage**: Customer data cannot be modified by non-admin users
- **Audit Logging**: All data access and modifications are logged
- **Export Functionality**: Admin users can export customer data in various formats
- **Real-time Statistics**: Dashboard with customer data statistics

## Security Features
- **MPIN Authentication**: Admin access requires MPIN (180623 for admin, 123456 for customer service)
- **Access Logging**: All admin actions are logged with IP addresses and timestamps
- **Data Protection**: Customer data is stored in immutable tables
- **Export Tracking**: All data exports are logged and tracked

## Installation

### Development Setup
```bash
# Make the deployment script executable
chmod +x deploy_enhanced_customer_data_system.sh

# Run the deployment script
./deploy_enhanced_customer_data_system.sh

# Start the service
./start_enhanced_customer_data.sh
```

### Production Setup
```bash
# Run as root for production deployment
sudo ./deploy_production.sh
```

## Usage

### Starting the Service
```bash
./start_enhanced_customer_data.sh
```

### Stopping the Service
```bash
./stop_enhanced_customer_data.sh
```

### Restarting the Service
```bash
./restart_enhanced_customer_data.sh
```

### Monitoring the Service
```bash
./monitor_enhanced_customer_data.sh
```

### Testing the System
```bash
./test_enhanced_customer_data.sh
```

### Creating Backups
```bash
./backup_customer_data.sh
```

## API Endpoints

### Data Capture Endpoints
- `POST /api/customer-data/capture-signup` - Capture signup data
- `POST /api/customer-data/capture-payment` - Capture payment data
- `POST /api/customer-data/capture-questionnaire` - Capture questionnaire data

### Admin-Only Endpoints (Require MPIN)
- `GET /api/customer-data/get-all` - Get all customer data
- `GET /api/customer-data/get/<id>` - Get specific customer data
- `POST /api/customer-data/export` - Export customer data
- `GET /api/customer-data/stats` - Get customer data statistics

### System Endpoints
- `GET /healthz` - Health check

## Admin Access

### Admin MPIN: 180623
- Full access to all customer data
- Can export all data
- Can view all statistics

### Customer Service MPIN: 123456
- Limited access to customer data
- Can view customer information
- Cannot export sensitive data

## Data Structure

### Customer Data Fields
- Basic Information: name, email, phone, unique_id
- Payment Information: status, method, amount, date
- Trading Information: account_type, prop_firm, account_size, experience
- System Information: ip_address, signup_source, timestamps
- Questionnaire Data: JSON object with all responses

### Audit Logs
- All admin access is logged
- Data exports are tracked
- Modification attempts are recorded

## Security Considerations

1. **MPIN Protection**: Admin access requires valid MPIN
2. **Access Logging**: All admin actions are logged
3. **Data Immutability**: Customer data cannot be modified by non-admins
4. **Export Tracking**: All data exports are logged
5. **IP Tracking**: Admin access includes IP address logging

## Troubleshooting

### Service Not Starting
```bash
# Check logs
journalctl -u enhanced-customer-data-capture -f

# Check if port is in use
netstat -tlnp | grep 5004

# Restart service
systemctl restart enhanced-customer-data-capture
```

### Database Issues
```bash
# Check database file
ls -la trading_bots.db

# Create backup
./backup_customer_data.sh

# Check database integrity
sqlite3 trading_bots.db "PRAGMA integrity_check;"
```

### Authentication Issues
- Verify MPIN is correct (180623 for admin, 123456 for customer service)
- Check that headers are properly set
- Ensure service is running on correct port

## Support

For issues or questions:
1. Check the logs: `journalctl -u enhanced-customer-data-capture -f`
2. Run the test script: `./test_enhanced_customer_data.sh`
3. Check service status: `./monitor_enhanced_customer_data.sh`

## License

This system is part of the TraderEdge Pro platform and is proprietary software.
EOF

print_success "Enhanced Customer Data Capture System deployment completed!"
print_status "Created the following files:"
echo "  📄 enhanced_customer_data_capture.py - Main service"
echo "  🔧 start_enhanced_customer_data.sh - Start script"
echo "  🛑 stop_enhanced_customer_data.sh - Stop script"
echo "  🔄 restart_enhanced_customer_data.sh - Restart script"
echo "  💾 backup_customer_data.sh - Backup script"
echo "  📊 monitor_enhanced_customer_data.sh - Monitor script"
echo "  🧪 test_enhanced_customer_data.sh - Test script"
echo "  🚀 deploy_production.sh - Production deployment"
echo "  📋 enhanced-customer-data-capture.service - Systemd service"
echo "  📖 ENHANCED_CUSTOMER_DATA_README.md - Documentation"

print_status "To start the service:"
echo "  ./start_enhanced_customer_data.sh"

print_status "Admin Access:"
echo "  🔐 Admin MPIN: 180623"
echo "  🔐 Customer Service MPIN: 123456"
echo "  🌐 Service URL: http://localhost:5004"

print_status "To test the system:"
echo "  ./test_enhanced_customer_data.sh"

print_success "🎉 Enhanced Customer Data Capture System is ready for deployment!"
