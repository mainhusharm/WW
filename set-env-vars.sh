#!/bin/bash

# AI Engineer Environment Variables Setup
# Run this script to set all environment variables for the AI Engineer system

echo "🔧 Setting AI Engineer Environment Variables..."

# Core Service Ports
export VITE_LIVE_METRICS_API_PORT=3008
export VITE_EMERGENCY_API_PORT=3007
export VITE_CUSTOMER_CARE_API_PORT=3006
export VITE_FRONTEND_PORT=5175

# API URLs
export VITE_LIVE_METRICS_API_URL=http://localhost:3008
export VITE_EMERGENCY_API_URL=http://localhost:3007
export VITE_CUSTOMER_CARE_API_URL=http://localhost:3006

# Monitoring Intervals (milliseconds)
export VITE_MONITORING_INTERVAL=2000
export VITE_ALERT_CHECK_INTERVAL=1000
export VITE_METRICS_UPDATE_INTERVAL=1000

# Critical Thresholds
export VITE_CPU_CRITICAL_THRESHOLD=90
export VITE_MEMORY_CRITICAL_THRESHOLD=95
export VITE_DISK_CRITICAL_THRESHOLD=90
export VITE_RESPONSE_TIME_CRITICAL_THRESHOLD=5000
export VITE_ERROR_RATE_CRITICAL_THRESHOLD=10

# High Priority Thresholds
export VITE_CPU_HIGH_THRESHOLD=80
export VITE_MEMORY_HIGH_THRESHOLD=85
export VITE_DISK_HIGH_THRESHOLD=80
export VITE_RESPONSE_TIME_HIGH_THRESHOLD=3000
export VITE_ERROR_RATE_HIGH_THRESHOLD=5

# Medium Priority Thresholds
export VITE_CPU_MEDIUM_THRESHOLD=70
export VITE_MEMORY_MEDIUM_THRESHOLD=75
export VITE_DISK_MEDIUM_THRESHOLD=70
export VITE_RESPONSE_TIME_MEDIUM_THRESHOLD=2000
export VITE_ERROR_RATE_MEDIUM_THRESHOLD=2

# Notification Settings
export VITE_EMAIL_NOTIFICATIONS=true
export VITE_SMS_NOTIFICATIONS=true
export VITE_SLACK_NOTIFICATIONS=true
export VITE_WEBHOOK_NOTIFICATIONS=true

# Emergency Contacts
export VITE_EMERGENCY_EMAIL=ai-engineer@traderedgepro.com
export VITE_EMERGENCY_SMS=+1-555-AI-HELP
export VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/ai-emergency-alerts
export VITE_API_WEBHOOK_URL=https://api.traderedgepro.com/emergency/notify

# AI Configuration
export VITE_AI_RESPONSE_TIME_TARGET=2000
export VITE_AI_RESOLUTION_RATE_TARGET=95
export VITE_AI_ESCALATION_THRESHOLD=3

# System Health
export VITE_SYSTEM_HEALTH_CHECK_INTERVAL=5000
export VITE_SERVICE_HEALTH_CHECK_INTERVAL=10000

# Customer Care
export VITE_CUSTOMER_CARE_AVAILABLE=true
export VITE_CHAT_RESPONSE_TIME_TARGET=2000
export VITE_QUERY_RESOLUTION_RATE=95

# Development Mode
export VITE_DEVELOPMENT_MODE=true
export VITE_DEBUG_MONITORING=false
export VITE_SIMULATE_ALERTS=false

echo "✅ Environment variables set successfully!"
echo ""
echo "🚀 Now you can start the services:"
echo "   node api-server/live-system-metrics-api.js &"
echo "   node api-server/emergency-notification-api.js &"
echo "   node api-server/ai-customer-care-engineer.js &"
echo "   npm run dev &"
echo ""
echo "📊 Or use the activation script:"
echo "   ./activate-ai-engineer.sh"
echo ""
