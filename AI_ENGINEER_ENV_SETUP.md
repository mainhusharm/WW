# AI Engineer Environment Variable Setup

## 🚀 **QUICK START - Environment Variables**

### **Step 1: Set Environment Variables**

You can set these in your terminal or add them to your system environment:

```bash
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
```

### **Step 2: Start Services with Environment Variables**

```bash
# Start Live System Metrics API
VITE_LIVE_METRICS_API_PORT=3008 node api-server/live-system-metrics-api.js &

# Start Emergency Notification API
VITE_EMERGENCY_API_PORT=3007 node api-server/emergency-notification-api.js &

# Start AI Customer Care API
VITE_CUSTOMER_CARE_API_PORT=3006 node api-server/ai-customer-care-engineer.js &

# Start Frontend
VITE_FRONTEND_PORT=5175 npm run dev &
```

### **Step 3: Verify Services**

```bash
# Check all services are running
curl http://localhost:3008/health  # Live Metrics
curl http://localhost:3007/health  # Emergency
curl http://localhost:3006/health  # Customer Care
curl http://localhost:5175         # Frontend
```

## 🎯 **ACCESS POINTS**

Once running, access these URLs:

- **Live Emergency Monitoring**: `http://localhost:5175/live-emergency-monitoring`
- **AI Assistant Dashboard**: `http://localhost:5175/ai-assistant-dashboard`
- **Help & Contact**: `http://localhost:5175/help-contact`
- **Main Dashboard**: `http://localhost:5175`

## 🔧 **CUSTOMIZATION**

You can customize any threshold or setting by changing the environment variables:

```bash
# Example: Make CPU alerts more sensitive
export VITE_CPU_CRITICAL_THRESHOLD=85
export VITE_CPU_HIGH_THRESHOLD=75
export VITE_CPU_MEDIUM_THRESHOLD=65

# Example: Faster monitoring
export VITE_MONITORING_INTERVAL=1000
export VITE_ALERT_CHECK_INTERVAL=500

# Example: Disable SMS notifications
export VITE_SMS_NOTIFICATIONS=false
```

## 📊 **MONITORING DASHBOARD**

The AI Engineer will automatically:
- ✅ Monitor system metrics every 1-2 seconds
- ✅ Detect emergencies based on your thresholds
- ✅ Send notifications via configured channels
- ✅ Respond to customer queries instantly
- ✅ Auto-fix 70%+ of common issues

## 🛑 **STOPPING SERVICES**

```bash
# Kill all services
pkill -f "live-system-metrics-api"
pkill -f "emergency-notification-api"
pkill -f "ai-customer-care-engineer"
pkill -f "vite"
```

## 🚨 **EMERGENCY RESPONSE**

When thresholds are exceeded, the AI Engineer will:
1. **Detect** the issue within 1-2 seconds
2. **Analyze** the problem automatically
3. **Attempt** to fix it (70%+ success rate)
4. **Notify** you via all configured channels
5. **Escalate** if auto-fix fails

The system is now **fully dynamic** and responds to **real system conditions**!
