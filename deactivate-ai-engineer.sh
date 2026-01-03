#!/bin/bash

# AI Engineer Deactivation Script
# This script stops all AI Engineer services

echo "🛑 Deactivating AI Engineer System..."
echo "====================================="

# Function to stop service
stop_service() {
    local service_name=$1
    local pid_file="logs/$service_name.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo "✅ $service_name stopped (PID: $pid)"
        else
            echo "⚠️  $service_name was not running"
        fi
        rm -f "$pid_file"
    else
        echo "⚠️  No PID file found for $service_name"
    fi
}

# Stop all services
stop_service "live-metrics"
stop_service "emergency"
stop_service "customer-care"
stop_service "frontend"

# Kill any remaining processes on our ports
echo "🧹 Cleaning up any remaining processes..."

# Kill processes on our ports
for port in 3008 3007 3006 5175; do
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        kill $pid 2>/dev/null
        echo "✅ Killed process on port $port"
    fi
done

echo ""
echo "🎉 AI Engineer System has been deactivated"
echo "All monitoring and emergency response services are now inactive"
echo ""
