#!/bin/bash

# Forex Bot System Startup Script
# This script starts all necessary services for the forex data bot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}================================${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            print_status "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start after $max_attempts attempts"
    return 1
}

# Function to start a service
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    local health_url=$4
    
    print_status "Starting $service_name..."
    
    if check_port $port; then
        print_warning "$service_name is already running on port $port"
        return 0
    fi
    
    # Start the service in the background
    eval "$command" &
    local pid=$!
    
    # Wait for the service to be ready
    if wait_for_service "$health_url" "$service_name"; then
        print_status "$service_name started successfully (PID: $pid)"
        return 0
    else
        print_error "Failed to start $service_name"
        kill $pid 2>/dev/null || true
        return 1
    fi
}

# Main startup sequence
main() {
    print_header "Starting Forex Bot System"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Node.js version: $(node --version)"
    print_status "npm version: $(npm --version)"
    
    # Install dependencies if needed
    print_header "Installing Dependencies"
    
    if [ -d "server" ]; then
        print_status "Installing server dependencies..."
        cd server
        if [ ! -d "node_modules" ]; then
            npm install
        else
            print_status "Server dependencies already installed"
        fi
        cd ..
    fi
    
    if [ -d "binance_service" ]; then
        print_status "Installing Binance service dependencies..."
        cd binance_service
        if [ ! -d "node_modules" ]; then
            npm install
        else
            print_status "Binance service dependencies already installed"
        fi
        cd ..
    fi
    
    # Start YFinance Proxy Server
    print_header "Starting YFinance Proxy Server"
    
    if ! start_service "YFinance Proxy Server" \
        "cd server && node yfinance-proxy.js" \
        3001 \
        "http://localhost:3001/health"; then
        print_error "Failed to start YFinance Proxy Server"
        exit 1
    fi
    
    # Start Binance Service (if available)
    if [ -d "binance_service" ]; then
        print_header "Starting Binance Service"
        
        if ! start_service "Binance Service" \
            "cd binance_service && node server.js" \
            5010 \
            "http://localhost:5010/health"; then
            print_warning "Failed to start Binance Service (continuing without it)"
        fi
    else
        print_warning "Binance service directory not found, skipping..."
    fi
    
    # Wait a moment for services to stabilize
    print_status "Waiting for services to stabilize..."
    sleep 5
    
    # Test the system
    print_header "Testing System"
    
    print_status "Testing YFinance server..."
    if curl -s "http://localhost:3001/health" | grep -q "OK"; then
        print_status "✅ YFinance server is healthy"
    else
        print_error "❌ YFinance server health check failed"
    fi
    
    # Test price endpoint
    print_status "Testing price endpoint..."
    if curl -s "http://localhost:3001/api/yfinance/price/EUR%2FUSD" | grep -q "price"; then
        print_status "✅ Price endpoint is working"
    else
        print_error "❌ Price endpoint test failed"
    fi
    
    # Run the test suite if available
    if [ -f "test_forex_bot.js" ]; then
        print_header "Running Test Suite"
        
        # Check if node-fetch is installed
        if [ ! -d "node_modules" ]; then
            print_status "Installing test dependencies..."
            npm install node-fetch
        fi
        
        print_status "Running forex bot test suite..."
        node test_forex_bot.js
    else
        print_warning "Test suite not found, skipping..."
    fi
    
    print_header "System Status"
    
    # Check running services
    print_status "Checking running services..."
    
    if check_port 3001; then
        print_status "✅ YFinance Proxy Server: Running on port 3001"
    else
        print_error "❌ YFinance Proxy Server: Not running"
    fi
    
    if check_port 5010; then
        print_status "✅ Binance Service: Running on port 5010"
    else
        print_warning "⚠️ Binance Service: Not running"
    fi
    
    print_header "Startup Complete"
    
    print_status "Forex Bot System is now running!"
    print_status ""
    print_status "Services:"
    print_status "  • YFinance Proxy Server: http://localhost:3001"
    print_status "  • Binance Service: http://localhost:5010 (if available)"
    print_status ""
    print_status "Endpoints:"
    print_status "  • Health Check: http://localhost:3001/health"
    print_status "  • Price Data: http://localhost:3001/api/yfinance/price/{symbol}"
    print_status "  • Historical Data: http://localhost:3001/api/yfinance/historical/{symbol}/{timeframe}"
    print_status "  • Bulk Fetch: POST http://localhost:3001/api/yfinance/bulk"
    print_status "  • Real-time Stream: http://localhost:3001/api/yfinance/stream/{symbols}"
    print_status ""
    print_status "Next Steps:"
    print_status "  1. Start your trading bot application"
    print_status "  2. Monitor the database for stored price data"
    print_status "  3. Check the dashboard for real-time updates"
    print_status ""
    print_status "To stop all services, run: pkill -f 'node.*yfinance-proxy' && pkill -f 'node.*server.js'"
}

# Trap to handle script interruption
trap 'print_error "Script interrupted. Stopping services..."; pkill -f "node.*yfinance-proxy" 2>/dev/null || true; pkill -f "node.*server.js" 2>/dev/null || true; exit 1' INT TERM

# Run the main function
main "$@"
