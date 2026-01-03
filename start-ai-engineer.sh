#!/bin/bash

# AI Engineer Activation Script
# This script starts all services needed for the AI Engineer to be active

echo "🤖 Starting AI Engineer System..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Port $1 is already in use${NC}"
        return 1
    else
        return 0
    fi
}

# Function to start service
start_service() {
    local service_name=$1
    local command=$2
    local port=$3
    
    echo -e "${BLUE}Starting $service_name...${NC}"
    
    if check_port $port; then
        eval "$command" &
        local pid=$!
        echo $pid > "logs/$service_name.pid"
        echo -e "${GREEN}✅ $service_name started (PID: $pid)${NC}"
    else
        echo -e "${RED}❌ $service_name failed to start - port $port in use${NC}"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

# Start Live System Metrics API
start_service "live-metrics-api" "node api-server/live-system-metrics-api.js" 3008

# Start Emergency Notification API
start_service "emergency-api" "node api-server/emergency-notification-api.js" 3007

# Start AI Customer Care API
start_service "customer-care-api" "node api-server/ai-customer-care-engineer.js" 3006

# Start Frontend
start_service "frontend" "npm run dev" 5175

# Wait a moment for services to start
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 5

# Check service health
echo -e "\n${BLUE}Checking service health...${NC}"

# Check Live Metrics API
if curl -s http://localhost:3008/health > /dev/null; then
    echo -e "${GREEN}✅ Live Metrics API: Healthy${NC}"
else
    echo -e "${RED}❌ Live Metrics API: Not responding${NC}"
fi

# Check Emergency API
if curl -s http://localhost:3007/health > /dev/null; then
    echo -e "${GREEN}✅ Emergency API: Healthy${NC}"
else
    echo -e "${RED}❌ Emergency API: Not responding${NC}"
fi

# Check Customer Care API
if curl -s http://localhost:3006/health > /dev/null; then
    echo -e "${GREEN}✅ Customer Care API: Healthy${NC}"
else
    echo -e "${RED}❌ Customer Care API: Not responding${NC}"
fi

# Check Frontend
if curl -s http://localhost:5175 > /dev/null; then
    echo -e "${GREEN}✅ Frontend: Running${NC}"
else
    echo -e "${RED}❌ Frontend: Not responding${NC}"
fi

echo -e "\n${GREEN}🎉 AI Engineer System is now ACTIVE!${NC}"
echo "=================================="
echo -e "${BLUE}📊 Access Points:${NC}"
echo -e "  • Live Emergency Monitoring: ${GREEN}http://localhost:5175/live-emergency-monitoring${NC}"
echo -e "  • AI Assistant Dashboard: ${GREEN}http://localhost:5175/ai-assistant-dashboard${NC}"
echo -e "  • Help & Contact: ${GREEN}http://localhost:5175/help-contact${NC}"
echo -e "  • Main Dashboard: ${GREEN}http://localhost:5175${NC}"

echo -e "\n${BLUE}🔧 API Endpoints:${NC}"
echo -e "  • Live Metrics: ${GREEN}http://localhost:3008/api/metrics${NC}"
echo -e "  • Emergency Status: ${GREEN}http://localhost:3007/api/emergency/status${NC}"
echo -e "  • Customer Care: ${GREEN}http://localhost:3006/api/stats${NC}"

echo -e "\n${YELLOW}🤖 AI Engineer is now monitoring your system 24/7!${NC}"
echo -e "${YELLOW}   - Real-time system monitoring every 1-2 seconds${NC}"
echo -e "${YELLOW}   - Automatic emergency detection and response${NC}"
echo -e "${YELLOW}   - Customer query processing with AI responses${NC}"
echo -e "${YELLOW}   - Multi-channel emergency notifications${NC}"

echo -e "\n${BLUE}To stop all services, run: ./stop-ai-engineer.sh${NC}"
echo ""
