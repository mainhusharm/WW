#!/bin/bash

# AI Engineer Activation Script (Environment Variable Based)
# This script sets all environment variables and starts the AI Engineer system

echo "🤖 Activating AI Engineer System with Environment Variables..."
echo "=============================================================="

# Set all environment variables
export VITE_LIVE_METRICS_API_PORT=3008
export VITE_EMERGENCY_API_PORT=3007
export VITE_CUSTOMER_CARE_API_PORT=3006
export VITE_FRONTEND_PORT=5175

export VITE_LIVE_METRICS_API_URL=http://localhost:3008
export VITE_EMERGENCY_API_URL=http://localhost:3007
export VITE_CUSTOMER_CARE_API_URL=http://localhost:3006

export VITE_MONITORING_INTERVAL=2000
export VITE_ALERT_CHECK_INTERVAL=1000
export VITE_METRICS_UPDATE_INTERVAL=1000

export VITE_CPU_CRITICAL_THRESHOLD=90
export VITE_MEMORY_CRITICAL_THRESHOLD=95
export VITE_DISK_CRITICAL_THRESHOLD=90
export VITE_RESPONSE_TIME_CRITICAL_THRESHOLD=5000
export VITE_ERROR_RATE_CRITICAL_THRESHOLD=10

export VITE_CPU_HIGH_THRESHOLD=80
export VITE_MEMORY_HIGH_THRESHOLD=85
export VITE_DISK_HIGH_THRESHOLD=80
export VITE_RESPONSE_TIME_HIGH_THRESHOLD=3000
export VITE_ERROR_RATE_HIGH_THRESHOLD=5

export VITE_CPU_MEDIUM_THRESHOLD=70
export VITE_MEMORY_MEDIUM_THRESHOLD=75
export VITE_DISK_MEDIUM_THRESHOLD=70
export VITE_RESPONSE_TIME_MEDIUM_THRESHOLD=2000
export VITE_ERROR_RATE_MEDIUM_THRESHOLD=2

export VITE_EMAIL_NOTIFICATIONS=true
export VITE_SMS_NOTIFICATIONS=true
export VITE_SLACK_NOTIFICATIONS=true
export VITE_WEBHOOK_NOTIFICATIONS=true

export VITE_EMERGENCY_EMAIL=ai-engineer@traderedgepro.com
export VITE_EMERGENCY_SMS=+1-555-AI-HELP
export VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/ai-emergency-alerts
export VITE_API_WEBHOOK_URL=https://api.traderedgepro.com/emergency/notify

export VITE_AI_RESPONSE_TIME_TARGET=2000
export VITE_AI_RESOLUTION_RATE_TARGET=95
export VITE_AI_ESCALATION_THRESHOLD=3

export VITE_SYSTEM_HEALTH_CHECK_INTERVAL=5000
export VITE_SERVICE_HEALTH_CHECK_INTERVAL=10000

export VITE_CUSTOMER_CARE_AVAILABLE=true
export VITE_CHAT_RESPONSE_TIME_TARGET=2000
export VITE_QUERY_RESOLUTION_RATE=95

export VITE_DEVELOPMENT_MODE=true
export VITE_DEBUG_MONITORING=false
export VITE_SIMULATE_ALERTS=false

echo "✅ Environment variables set successfully!"

# Start services
echo "🚀 Starting AI Engineer services..."

# Start Live System Metrics API
echo "📊 Starting Live System Metrics API..."
node api-server/live-system-metrics-api.js &
LIVE_METRICS_PID=$!

# Start Emergency Notification API
echo "🚨 Starting Emergency Notification API..."
node api-server/emergency-notification-api.js &
EMERGENCY_PID=$!

# Start AI Customer Care API
echo "🤖 Starting AI Customer Care API..."
node api-server/ai-customer-care-engineer.js &
CUSTOMER_CARE_PID=$!

# Start Frontend
echo "🌐 Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

# Save PIDs for cleanup
echo $LIVE_METRICS_PID > logs/live-metrics.pid
echo $EMERGENCY_PID > logs/emergency.pid
echo $CUSTOMER_CARE_PID > logs/customer-care.pid
echo $FRONTEND_PID > logs/frontend.pid

# Create logs directory
mkdir -p logs

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 5

# Check service health
echo "🔍 Checking service health..."

# Check Live Metrics API
if curl -s http://localhost:3008/health > /dev/null; then
    echo "✅ Live Metrics API: Healthy"
else
    echo "❌ Live Metrics API: Not responding"
fi

# Check Emergency API
if curl -s http://localhost:3007/health > /dev/null; then
    echo "✅ Emergency API: Healthy"
else
    echo "❌ Emergency API: Not responding"
fi

# Check Customer Care API
if curl -s http://localhost:3006/health > /dev/null; then
    echo "✅ Customer Care API: Healthy"
else
    echo "❌ Customer Care API: Not responding"
fi

# Check Frontend
if curl -s http://localhost:5175 > /dev/null; then
    echo "✅ Frontend: Running"
else
    echo "❌ Frontend: Not responding"
fi

echo ""
echo "🎉 AI Engineer System is now ACTIVE!"
echo "====================================="
echo "📊 Access Points:"
echo "  • Live Emergency Monitoring: http://localhost:5175/live-emergency-monitoring"
echo "  • AI Assistant Dashboard: http://localhost:5175/ai-assistant-dashboard"
echo "  • Help & Contact: http://localhost:5175/help-contact"
echo "  • Main Dashboard: http://localhost:5175"
echo ""
echo "🔧 API Endpoints:"
echo "  • Live Metrics: http://localhost:3008/api/metrics"
echo "  • Emergency Status: http://localhost:3007/api/emergency/status"
echo "  • Customer Care: http://localhost:3006/api/stats"
echo ""
echo "🤖 AI Engineer is now monitoring your system 24/7!"
echo "   - Real-time system monitoring every 1-2 seconds"
echo "   - Automatic emergency detection and response"
echo "   - Customer query processing with AI responses"
echo "   - Multi-channel emergency notifications"
echo ""
echo "🛑 To stop all services, run: ./deactivate-ai-engineer.sh"
echo ""
