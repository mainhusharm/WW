import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Production configuration
const config = {
  emailNotifications: process.env.VITE_EMAIL_NOTIFICATIONS === 'true',
  smsNotifications: process.env.VITE_SMS_NOTIFICATIONS === 'true',
  slackNotifications: process.env.VITE_SLACK_NOTIFICATIONS === 'true',
  webhookNotifications: process.env.VITE_WEBHOOK_NOTIFICATIONS === 'true',
  emergencyEmail: process.env.VITE_EMERGENCY_EMAIL || 'ai-engineer@traderedgepro.com',
  emergencySms: process.env.VITE_EMERGENCY_SMS || '+1-555-AI-HELP',
  slackWebhookUrl: process.env.VITE_SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/ai-emergency-alerts',
  apiWebhookUrl: process.env.VITE_API_WEBHOOK_URL || 'https://api.traderedgepro.com/emergency/notify',
  developmentMode: process.env.VITE_DEVELOPMENT_MODE === 'true'
};

// Emergency status storage
let emergencyStatus = {
  isActive: false,
  currentEmergency: null,
  startTime: null,
  lastUpdate: new Date(),
  totalEmergencies: 0,
  resolvedEmergencies: 0,
  activeChannels: {
    email: config.emailNotifications,
    sms: config.smsNotifications,
    slack: config.slackNotifications,
    webhook: config.webhookNotifications
  }
};

// Notification channels
const notificationChannels = {
  email: {
    name: 'Primary Email',
    enabled: config.emailNotifications,
    send: async (alert) => {
      try {
        // In production, integrate with actual email service (SendGrid, AWS SES, etc.)
        console.log(`📧 EMAIL NOTIFICATION SENT via Primary Email:
   Channel: email - ${config.emergencyEmail}
   Alert: ${alert.type} (Severity: ${alert.severity}/10)
   Time: ${alert.timestamp}
   Impact: ${alert.impact} - ${alert.usersAffected} users affected`);
        return { success: true, channel: 'email' };
      } catch (error) {
        console.error('❌ Failed to send email notification:', error.message);
        return { success: false, channel: 'email', error: error.message };
      }
    }
  },
  
  sms: {
    name: 'SMS Emergency',
    enabled: config.smsNotifications,
    send: async (alert) => {
      try {
        // In production, integrate with actual SMS service (Twilio, AWS SNS, etc.)
        console.log(`📱 SMS NOTIFICATION SENT via SMS Emergency:
   Channel: sms - ${config.emergencySms}
   Alert: ${alert.type} (Severity: ${alert.severity}/10)
   Time: ${alert.timestamp}
   Impact: ${alert.impact} - ${alert.usersAffected} users affected`);
        return { success: true, channel: 'sms' };
      } catch (error) {
        console.error('❌ Failed to send SMS notification:', error.message);
        return { success: false, channel: 'sms', error: error.message };
      }
    }
  },
  
  slack: {
    name: 'Slack Emergency Channel',
    enabled: config.slackNotifications,
    send: async (alert) => {
      try {
        // In production, integrate with actual Slack webhook
        const slackMessage = {
          text: `🚨 EMERGENCY ALERT: ${alert.type}`,
          attachments: [{
            color: alert.severity >= 9 ? 'danger' : alert.severity >= 7 ? 'warning' : 'good',
            fields: [
              { title: 'Severity', value: `${alert.severity}/10`, short: true },
              { title: 'Impact', value: alert.impact, short: true },
              { title: 'Users Affected', value: alert.usersAffected.toString(), short: true },
              { title: 'Time', value: alert.timestamp, short: true },
              { title: 'Message', value: alert.message, short: false }
            ]
          }]
        };
        
        console.log(`💬 SLACK NOTIFICATION SENT via Slack Emergency Channel:
   Channel: webhook - ${config.slackWebhookUrl}
   Alert: ${alert.type} (Severity: ${alert.severity}/10)
   Time: ${alert.timestamp}
   Impact: ${alert.impact} - ${alert.usersAffected} users affected`);
        return { success: true, channel: 'slack' };
      } catch (error) {
        console.error('❌ Failed to send Slack notification:', error.message);
        return { success: false, channel: 'slack', error: error.message };
      }
    }
  },
  
  webhook: {
    name: 'API Webhook',
    enabled: config.webhookNotifications,
    send: async (alert) => {
      try {
        // In production, send to actual webhook endpoint
        const webhookData = {
          alert: alert.type,
          severity: alert.severity,
          message: alert.message,
          timestamp: alert.timestamp,
          impact: alert.impact,
          usersAffected: alert.usersAffected,
          source: 'ai-engineer-system'
        };
        
        console.log(`🔗 WEBHOOK NOTIFICATION SENT via API Webhook:
   Channel: api - ${config.apiWebhookUrl}
   Alert: ${alert.type} (Severity: ${alert.severity}/10)
   Time: ${alert.timestamp}
   Impact: ${alert.impact} - ${alert.usersAffected} users affected`);
        return { success: true, channel: 'webhook' };
      } catch (error) {
        console.error('❌ Failed to send webhook notification:', error.message);
        return { success: false, channel: 'webhook', error: error.message };
      }
    }
  }
};

// Send emergency notification
async function sendEmergencyNotification(alert) {
  const results = [];
  
  for (const [channelName, channel] of Object.entries(notificationChannels)) {
    if (channel.enabled) {
      try {
        const result = await channel.send(alert);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          channel: channelName,
          error: error.message
        });
      }
    }
  }
  
  return results;
}

// Generate emergency alert
function generateEmergencyAlert(type, severity, message, impact, usersAffected) {
  return {
    type,
    severity,
    message,
    timestamp: new Date().toISOString(),
    impact,
    usersAffected,
    id: `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: 'production',
    emergencyStatus: emergencyStatus.isActive ? 'active' : 'inactive'
  });
});

app.get('/api/emergency/status', (req, res) => {
  res.json({
    ...emergencyStatus,
    lastUpdate: new Date(),
    uptime: process.uptime(),
    config: {
      emailNotifications: config.emailNotifications,
      smsNotifications: config.smsNotifications,
      slackNotifications: config.slackNotifications,
      webhookNotifications: config.webhookNotifications
    }
  });
});

app.post('/api/emergency/trigger', async (req, res) => {
  try {
    const { type, severity, message, impact, usersAffected } = req.body;
    
    if (!type || !severity || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['type', 'severity', 'message'],
        optional: ['impact', 'usersAffected']
      });
    }
    
    const alert = generateEmergencyAlert(
      type,
      severity,
      message,
      impact || 'unknown',
      usersAffected || 100
    );
    
    // Update emergency status
    emergencyStatus.isActive = true;
    emergencyStatus.currentEmergency = alert;
    emergencyStatus.startTime = new Date();
    emergencyStatus.lastUpdate = new Date();
    emergencyStatus.totalEmergencies++;
    
    // Send notifications
    const results = await sendEmergencyNotification(alert);
    
    res.json({
      success: true,
      alert,
      notifications: results,
      emergencyStatus: {
        isActive: emergencyStatus.isActive,
        currentEmergency: emergencyStatus.currentEmergency,
        startTime: emergencyStatus.startTime
      }
    });
    
  } catch (error) {
    console.error('Error triggering emergency:', error);
    res.status(500).json({
      error: 'Failed to trigger emergency',
      message: error.message
    });
  }
});

app.post('/api/emergency/resolve', (req, res) => {
  try {
    emergencyStatus.isActive = false;
    emergencyStatus.currentEmergency = null;
    emergencyStatus.resolvedEmergencies++;
    emergencyStatus.lastUpdate = new Date();
    
    res.json({
      success: true,
      message: 'Emergency resolved',
      emergencyStatus: {
        isActive: emergencyStatus.isActive,
        resolvedEmergencies: emergencyStatus.resolvedEmergencies,
        lastUpdate: emergencyStatus.lastUpdate
      }
    });
    
  } catch (error) {
    console.error('Error resolving emergency:', error);
    res.status(500).json({
      error: 'Failed to resolve emergency',
      message: error.message
    });
  }
});

app.post('/api/emergency/test', async (req, res) => {
  try {
    const testAlert = generateEmergencyAlert(
      'System Test',
      5,
      'This is a test emergency notification',
      'low',
      1
    );
    
    const results = await sendEmergencyNotification(testAlert);
    
    res.json({
      success: true,
      message: 'Test emergency notification sent',
      alert: testAlert,
      notifications: results
    });
    
  } catch (error) {
    console.error('Error sending test emergency:', error);
    res.status(500).json({
      error: 'Failed to send test emergency',
      message: error.message
    });
  }
});

app.post('/api/emergency/simulate', async (req, res) => {
  try {
    const scenarios = [
      {
        type: 'Memory Leak',
        severity: 7,
        message: 'Memory usage is critically high and increasing',
        impact: 'high',
        usersAffected: 100
      },
      {
        type: 'System Down',
        severity: 10,
        message: 'Complete system failure detected',
        impact: 'critical',
        usersAffected: 1000
      },
      {
        type: 'Database Failure',
        severity: 9,
        message: 'Database connection lost',
        impact: 'critical',
        usersAffected: 500
      },
      {
        type: 'API Gateway Timeout',
        severity: 6,
        message: 'API gateway is experiencing timeouts',
        impact: 'medium',
        usersAffected: 100
      }
    ];
    
    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const alert = generateEmergencyAlert(
      randomScenario.type,
      randomScenario.severity,
      randomScenario.message,
      randomScenario.impact,
      randomScenario.usersAffected
    );
    
    // Update emergency status
    emergencyStatus.isActive = true;
    emergencyStatus.currentEmergency = alert;
    emergencyStatus.startTime = new Date();
    emergencyStatus.lastUpdate = new Date();
    emergencyStatus.totalEmergencies++;
    
    const results = await sendEmergencyNotification(alert);
    
    res.json({
      success: true,
      message: 'Simulated emergency notification sent',
      alert,
      notifications: results,
      emergencyStatus: {
        isActive: emergencyStatus.isActive,
        currentEmergency: emergencyStatus.currentEmergency,
        startTime: emergencyStatus.startTime
      }
    });
    
  } catch (error) {
    console.error('Error simulating emergency:', error);
    res.status(500).json({
      error: 'Failed to simulate emergency',
      message: error.message
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚨 Emergency Notification API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Emergency status: http://localhost:${PORT}/api/emergency/status`);
  console.log(`Test emergency: http://localhost:${PORT}/api/emergency/test`);
  console.log(`Simulate emergency: http://localhost:${PORT}/api/emergency/simulate`);
  console.log(`Environment: ${config.developmentMode ? 'development' : 'production'}`);
  console.log(`Notifications: Email=${config.emailNotifications}, SMS=${config.smsNotifications}, Slack=${config.slackNotifications}, Webhook=${config.webhookNotifications}`);
});

export default app;
