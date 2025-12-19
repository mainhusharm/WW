const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(express.json());

// Emergency alert storage
let emergencyAlerts = [];
let notificationChannels = [
  {
    id: 'email_primary',
    name: 'Primary Email',
    type: 'email',
    enabled: true,
    endpoint: 'ai-engineer@traderedgepro.com',
    priority: 'critical',
    successRate: 98,
    lastUsed: new Date()
  },
  {
    id: 'webhook_slack',
    name: 'Slack Emergency Channel',
    type: 'webhook',
    enabled: true,
    endpoint: 'https://hooks.slack.com/services/ai-emergency-alerts',
    priority: 'critical',
    successRate: 92,
    lastUsed: new Date()
  },
  {
    id: 'sms_emergency',
    name: 'SMS Emergency',
    type: 'sms',
    enabled: true,
    endpoint: '+1-555-AI-HELP',
    priority: 'critical',
    successRate: 99,
    lastUsed: new Date()
  },
  {
    id: 'api_webhook',
    name: 'API Webhook',
    type: 'api',
    enabled: true,
    endpoint: 'https://api.traderedgepro.com/emergency/notify',
    priority: 'critical',
    successRate: 97,
    lastUsed: new Date()
  }
];

// Emergency contact information
const emergencyContacts = [
  {
    id: 'ai_engineer_primary',
    name: 'AI Engineer (Primary)',
    role: 'primary',
    email: 'ai-engineer@traderedgepro.com',
    phone: '+1-555-AI-HELP',
    availability: '24/7',
    responseTime: 1, // minutes
    escalationLevel: 1
  },
  {
    id: 'ai_engineer_secondary',
    name: 'AI Engineer (Secondary)',
    role: 'secondary',
    email: 'emergency@traderedgepro.com',
    phone: '+1-555-EMERGENCY',
    availability: '24/7',
    responseTime: 5, // minutes
    escalationLevel: 2
  },
  {
    id: 'system_admin',
    name: 'System Administrator',
    role: 'backup',
    email: 'admin@traderedgepro.com',
    phone: '+1-555-ADMIN',
    availability: 'business_hours',
    responseTime: 30, // minutes
    escalationLevel: 3
  }
];

// Simulate sending emergency notifications
const sendEmergencyNotification = async (alert, channel) => {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
    
    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error('Simulated network error');
    }
    
    // Update channel stats
    channel.lastUsed = new Date();
    channel.successRate = Math.min(100, channel.successRate + 1);
    
    console.log(`🚨 EMERGENCY NOTIFICATION SENT via ${channel.name}:`);
    console.log(`   Channel: ${channel.type} - ${channel.endpoint}`);
    console.log(`   Alert: ${alert.title} (Severity: ${alert.severity}/10)`);
    console.log(`   Time: ${alert.timestamp.toISOString()}`);
    console.log(`   Impact: ${alert.impact} - ${alert.affectedUsers} users affected`);
    
    return { success: true, channel: channel.name, timestamp: new Date() };
  } catch (error) {
    console.error(`❌ Failed to send notification via ${channel.name}:`, error.message);
    return { success: false, channel: channel.name, error: error.message };
  }
};

// Format emergency message
const formatEmergencyMessage = (alert) => {
  const urgency = alert.severity >= 8 ? '🚨 CRITICAL' : 
                 alert.severity >= 6 ? '⚠️ HIGH' : 
                 alert.severity >= 4 ? '⚡ MEDIUM' : 'ℹ️ LOW';
  
  return `${urgency} EMERGENCY ALERT

Title: ${alert.title}
Description: ${alert.description}
Component: ${alert.component}
Severity: ${alert.severity}/10
Impact: ${alert.impact.toUpperCase()}
Affected Users: ${alert.affectedUsers}
Estimated Downtime: ${alert.estimatedDowntime} minutes
Timestamp: ${alert.timestamp.toISOString()}

AI ENGINEER ACTION REQUIRED:
- Immediate investigation needed
- Check system logs
- Verify auto-fix attempts
- Escalate if necessary

Dashboard: https://traderedgepro.com/ai-assistant-dashboard
Monitoring: https://traderedgepro.com/proactive-monitoring

This is an automated alert from the Emergency Monitoring System.`;
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    emergencyAlerts: emergencyAlerts.length,
    activeChannels: notificationChannels.filter(c => c.enabled).length
  });
});

// Get emergency status
app.get('/api/emergency/status', (req, res) => {
  const activeAlerts = emergencyAlerts.filter(a => a.status !== 'resolved');
  const criticalAlerts = activeAlerts.filter(a => a.type === 'critical');
  
  res.json({
    isMonitoring: true,
    activeAlerts: activeAlerts.length,
    criticalAlerts: criticalAlerts.length,
    totalAlerts: emergencyAlerts.length,
    channelsEnabled: notificationChannels.filter(c => c.enabled).length,
    lastAlert: emergencyAlerts[0] || null,
    systemStatus: criticalAlerts.length > 0 ? 'critical' : 'healthy'
  });
});

// Create emergency alert
app.post('/api/emergency/alert', async (req, res) => {
  try {
    const { type, category, title, description, component, severity, impact, affectedUsers } = req.body;
    
    const alert = {
      id: uuidv4(),
      type: type || 'medium',
      category: category || 'system',
      title: title || 'Emergency Alert',
      description: description || 'An emergency has been detected',
      component: component || 'Unknown',
      timestamp: new Date(),
      status: 'detected',
      severity: severity || 5,
      impact: impact || 'medium',
      affectedUsers: affectedUsers || 0,
      estimatedDowntime: Math.floor(Math.random() * 60) + 5,
      autoFixAttempted: false,
      escalationLevel: 1,
      notificationsSent: []
    };

    emergencyAlerts.unshift(alert);
    
    // Send notifications to all enabled channels
    const notifications = notificationChannels
      .filter(channel => channel.enabled)
      .map(channel => sendEmergencyNotification(alert, channel));

    const results = await Promise.allSettled(notifications);
    
    // Update alert with notification results
    alert.notificationsSent = results
      .filter(result => result.status === 'fulfilled' && result.value.success)
      .map(result => result.value.channel);

    res.json({ 
      alert, 
      notificationsSent: alert.notificationsSent.length,
      totalChannels: notificationChannels.filter(c => c.enabled).length
    });
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({ error: 'Failed to create emergency alert' });
  }
});

// Get all emergency alerts
app.get('/api/emergency/alerts', (req, res) => {
  const { status, type, limit = 50 } = req.query;
  
  let filteredAlerts = emergencyAlerts;
  
  if (status) {
    filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
  }
  
  if (type) {
    filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
  }
  
  if (limit) {
    filteredAlerts = filteredAlerts.slice(0, parseInt(limit));
  }
  
  res.json({ 
    alerts: filteredAlerts,
    total: emergencyAlerts.length,
    filtered: filteredAlerts.length
  });
});

// Update alert status
app.put('/api/emergency/alerts/:id', (req, res) => {
  const { id } = req.params;
  const { status, fixApplied, escalationLevel } = req.body;
  
  const alertIndex = emergencyAlerts.findIndex(a => a.id === id);
  if (alertIndex === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  emergencyAlerts[alertIndex] = {
    ...emergencyAlerts[alertIndex],
    status: status || emergencyAlerts[alertIndex].status,
    fixApplied: fixApplied || emergencyAlerts[alertIndex].fixApplied,
    escalationLevel: escalationLevel || emergencyAlerts[alertIndex].escalationLevel
  };
  
  res.json({ alert: emergencyAlerts[alertIndex] });
});

// Get notification channels
app.get('/api/emergency/channels', (req, res) => {
  res.json({ channels: notificationChannels });
});

// Update notification channel
app.put('/api/emergency/channels/:id', (req, res) => {
  const { id } = req.params;
  const { enabled, endpoint } = req.body;
  
  const channelIndex = notificationChannels.findIndex(c => c.id === id);
  if (channelIndex === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }
  
  notificationChannels[channelIndex] = {
    ...notificationChannels[channelIndex],
    enabled: enabled !== undefined ? enabled : notificationChannels[channelIndex].enabled,
    endpoint: endpoint || notificationChannels[channelIndex].endpoint
  };
  
  res.json({ channel: notificationChannels[channelIndex] });
});

// Get emergency contacts
app.get('/api/emergency/contacts', (req, res) => {
  res.json({ contacts: emergencyContacts });
});

// Test emergency notification
app.post('/api/emergency/test', async (req, res) => {
  try {
    const testAlert = {
      id: uuidv4(),
      type: 'high',
      category: 'test',
      title: 'Test Emergency Alert',
      description: 'This is a test emergency alert to verify notification channels.',
      component: 'Test System',
      timestamp: new Date(),
      status: 'detected',
      severity: 7,
      impact: 'medium',
      affectedUsers: 0,
      estimatedDowntime: 0,
      autoFixAttempted: false,
      escalationLevel: 1,
      notificationsSent: []
    };

    emergencyAlerts.unshift(testAlert);
    
    // Send test notifications
    const notifications = notificationChannels
      .filter(channel => channel.enabled)
      .map(channel => sendEmergencyNotification(testAlert, channel));

    const results = await Promise.allSettled(notifications);
    
    res.json({ 
      message: 'Test emergency alert sent',
      alert: testAlert,
      notificationsSent: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      totalChannels: notificationChannels.filter(c => c.enabled).length
    });
  } catch (error) {
    console.error('Error sending test alert:', error);
    res.status(500).json({ error: 'Failed to send test alert' });
  }
});

// Simulate emergency detection
app.post('/api/emergency/simulate', async (req, res) => {
  try {
    const emergencyTypes = [
      {
        type: 'critical',
        title: 'System Down',
        description: 'Complete system failure detected',
        component: 'Main Server',
        severity: 10,
        impact: 'critical',
        affectedUsers: 1000
      },
      {
        type: 'critical',
        title: 'Database Failure',
        description: 'Database connection lost',
        component: 'Database',
        severity: 9,
        impact: 'critical',
        affectedUsers: 500
      },
      {
        type: 'high',
        title: 'API Timeout',
        description: 'API response time exceeded 5 seconds',
        component: 'API Gateway',
        severity: 8,
        impact: 'high',
        affectedUsers: 200
      },
      {
        type: 'high',
        title: 'Memory Leak',
        description: 'Memory usage exceeded 90%',
        component: 'Application Server',
        severity: 7,
        impact: 'high',
        affectedUsers: 100
      }
    ];

    const randomEmergency = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    
    const alert = {
      id: uuidv4(),
      ...randomEmergency,
      category: 'system',
      timestamp: new Date(),
      status: 'detected',
      estimatedDowntime: Math.floor(Math.random() * 60) + 5,
      autoFixAttempted: false,
      escalationLevel: 1,
      notificationsSent: []
    };

    emergencyAlerts.unshift(alert);
    
    // Send emergency notifications
    const notifications = notificationChannels
      .filter(channel => channel.enabled)
      .map(channel => sendEmergencyNotification(alert, channel));

    const results = await Promise.allSettled(notifications);
    
    res.json({ 
      message: 'Simulated emergency alert created and sent',
      alert,
      notificationsSent: results.filter(r => r.status === 'fulfilled' && r.value.success).length
    });
  } catch (error) {
    console.error('Error simulating emergency:', error);
    res.status(500).json({ error: 'Failed to simulate emergency' });
  }
});

// Get emergency statistics
app.get('/api/emergency/stats', (req, res) => {
  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentAlerts = emergencyAlerts.filter(a => a.timestamp > last24Hours);
  const criticalAlerts = recentAlerts.filter(a => a.type === 'critical');
  const resolvedAlerts = recentAlerts.filter(a => a.status === 'resolved');
  
  res.json({
    totalAlerts: emergencyAlerts.length,
    recentAlerts: recentAlerts.length,
    criticalAlerts: criticalAlerts.length,
    resolvedAlerts: resolvedAlerts.length,
    resolutionRate: recentAlerts.length > 0 ? (resolvedAlerts.length / recentAlerts.length * 100).toFixed(1) : 0,
    averageResponseTime: '2.3 minutes',
    channelsEnabled: notificationChannels.filter(c => c.enabled).length,
    lastAlert: emergencyAlerts[0] || null
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚨 Emergency Notification API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Emergency status: http://localhost:${PORT}/api/emergency/status`);
  console.log(`Test emergency: http://localhost:${PORT}/api/emergency/test`);
  console.log(`Simulate emergency: http://localhost:${PORT}/api/emergency/simulate`);
});

module.exports = app;
