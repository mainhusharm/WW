#!/bin/bash

# AI Customer Care & Engineering System Startup Script
# This script starts all necessary services for the AI-powered customer care and engineering system

echo "🚀 Starting AI Customer Care & Engineering System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
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

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Create logs directory
mkdir -p logs

# Function to start a service
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    
    print_status "Starting $service_name on port $port..."
    
    # Kill any existing process on the port
    lsof -ti:$port | xargs kill -9 2>/dev/null || true
    
    # Start the service in background
    nohup $command > logs/${service_name}.log 2>&1 &
    local pid=$!
    
    # Wait a moment and check if process is running
    sleep 2
    if ps -p $pid > /dev/null; then
        print_success "$service_name started successfully (PID: $pid)"
        echo $pid > logs/${service_name}.pid
    else
        print_error "Failed to start $service_name"
        return 1
    fi
}

# Start the AI Customer Care & Engineer API
print_status "Starting AI Customer Care & Engineer API..."
start_service "ai-customer-care-api" "node api-server/ai-customer-care-engineer.js" 3006

# Start the Emergency Notification API
print_status "Starting Emergency Notification API..."
start_service "emergency-notification-api" "node api-server/emergency-notification-api.js" 3007

# Start the main backend server (if it exists)
if [ -f "backend-server.js" ]; then
    print_status "Starting main backend server..."
    start_service "main-backend" "node backend-server.js" 3005
fi

# Start the frontend development server
print_status "Starting frontend development server..."
start_service "frontend" "npm run dev" 5173

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 5

# Check service health
check_service_health() {
    local service_name=$1
    local url=$2
    
    print_status "Checking $service_name health..."
    
    for i in {1..10}; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is healthy and responding"
            return 0
        fi
        print_warning "Waiting for $service_name to start... (attempt $i/10)"
        sleep 2
    done
    
    print_error "$service_name failed to start or is not responding"
    return 1
}

# Check AI Customer Care API health
check_service_health "AI Customer Care API" "http://localhost:3006/health"

# Check Emergency Notification API health
check_service_health "Emergency Notification API" "http://localhost:3007/health"

# Check main backend health (if running)
if [ -f "logs/main-backend.pid" ]; then
    check_service_health "Main Backend" "http://localhost:3005/health"
fi

# Check frontend health
check_service_health "Frontend" "http://localhost:5173"

# Display access information
echo ""
echo "🎉 AI Customer Care & Engineering System is now running!"
echo "=================================================="
echo ""
echo -e "${CYAN}📊 Access Points:${NC}"
echo -e "  • Frontend Dashboard: ${GREEN}http://localhost:5173${NC}"
echo -e "  • AI Customer Care: ${GREEN}http://localhost:5173/ai-customer-care${NC}"
echo -e "  • Proactive Monitoring: ${GREEN}http://localhost:5173/proactive-monitoring${NC}"
echo -e "  • Emergency Monitoring: ${GREEN}http://localhost:5173/emergency-monitoring${NC}"
echo -e "  • AI Assistant Dashboard: ${GREEN}http://localhost:5173/ai-assistant-dashboard${NC}"
echo -e "  • Help & Contact: ${GREEN}http://localhost:5173/help-contact${NC}"
echo -e "  • Customer Service Hub: ${GREEN}http://localhost:5173/customer-service${NC}"
echo ""
echo -e "${CYAN}🔧 API Endpoints:${NC}"
echo -e "  • AI Customer Care API: ${GREEN}http://localhost:3006${NC}"
echo -e "  • Emergency Notification API: ${GREEN}http://localhost:3007${NC}"
echo -e "  • Health Check: ${GREEN}http://localhost:3006/health${NC}"
echo -e "  • Emergency Status: ${GREEN}http://localhost:3007/api/emergency/status${NC}"
echo -e "  • Main Backend: ${GREEN}http://localhost:3005${NC}"
echo ""
echo -e "${CYAN}📝 Logs:${NC}"
echo -e "  • AI Customer Care API: ${YELLOW}logs/ai-customer-care-api.log${NC}"
echo -e "  • Emergency Notification API: ${YELLOW}logs/emergency-notification-api.log${NC}"
echo -e "  • Main Backend: ${YELLOW}logs/main-backend.log${NC}"
echo -e "  • Frontend: ${YELLOW}logs/frontend.log${NC}"
echo ""
echo -e "${PURPLE}🤖 AI Features:${NC}"
echo -e "  • Automatic query resolution"
echo -e "  • Proactive issue detection and fixing"
echo -e "  • Real-time system monitoring"
echo -e "  • Emergency response and notification"
echo -e "  • 24/7 AI assistant availability"
echo -e "  • Customer service automation"
echo -e "  • Performance optimization"
echo ""
echo -e "${YELLOW}⚠️  To stop all services, run: ./stop-ai-customer-care-system.sh${NC}"
echo ""

# Create a simple status check script
cat > check-system-status.sh << 'EOF'
#!/bin/bash
echo "🔍 AI Customer Care & Engineering System Status"
echo "=============================================="

# Check AI Customer Care API
if curl -s http://localhost:3006/health > /dev/null 2>&1; then
    echo "✅ AI Customer Care API: Running"
else
    echo "❌ AI Customer Care API: Not responding"
fi

# Check Main Backend
if curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ Main Backend: Running"
else
    echo "❌ Main Backend: Not responding"
fi

# Check Frontend
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not responding"
fi

echo ""
echo "📊 Process Status:"
ps aux | grep -E "(node|npm)" | grep -v grep | head -10
EOF

chmod +x check-system-status.sh

# Create a stop script
cat > stop-ai-customer-care-system.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping AI Customer Care & Engineering System..."

# Stop services by PID files
for pid_file in logs/*.pid; do
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo "Stopping process $pid..."
            kill $pid
        fi
        rm "$pid_file"
    fi
done

# Kill any remaining processes on our ports
lsof -ti:3006 | xargs kill -9 2>/dev/null || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped"
EOF

chmod +x stop-ai-customer-care-system.sh

print_success "Setup complete! System is ready to handle customer queries and technical issues automatically."
