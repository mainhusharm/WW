#!/bin/bash

# AI Engineer Deactivation Script
# This script stops all AI Engineer services

echo "🛑 Stopping AI Engineer System..."
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop service
stop_service() {
    local service_name=$1
    local pid_file="logs/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo -e "${GREEN}✅ $service_name stopped (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
}

# Stop all services
stop_service "live-metrics-api"
stop_service "emergency-api"
stop_service "customer-care-api"
stop_service "frontend"

# Kill any remaining processes on our ports
echo -e "${BLUE}Cleaning up any remaining processes...${NC}"

# Kill processes on our ports
for port in 3008 3007 3006 5175; do
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null
        echo -e "${GREEN}✅ Killed process on port $port${NC}"
    fi
done

echo -e "\n${GREEN}🎉 AI Engineer System has been stopped${NC}"
echo -e "${YELLOW}All monitoring and emergency response services are now inactive${NC}"
echo ""
