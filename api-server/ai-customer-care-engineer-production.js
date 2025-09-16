import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3006;

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
  customerCareAvailable: process.env.VITE_CUSTOMER_CARE_AVAILABLE !== 'false',
  chatResponseTimeTarget: parseInt(process.env.VITE_CHAT_RESPONSE_TIME_TARGET) || 2000,
  queryResolutionRate: parseInt(process.env.VITE_QUERY_RESOLUTION_RATE) || 95,
  aiResponseTimeTarget: parseInt(process.env.VITE_AI_RESPONSE_TIME_TARGET) || 2000,
  aiResolutionRateTarget: parseInt(process.env.VITE_AI_RESOLUTION_RATE_TARGET) || 95,
  aiEscalationThreshold: parseInt(process.env.VITE_AI_ESCALATION_THRESHOLD) || 3,
  developmentMode: process.env.VITE_DEVELOPMENT_MODE === 'true'
};

// Customer care data storage
let conversations = [];
let stats = {
  totalQueries: 0,
  resolvedQueries: 0,
  escalatedQueries: 0,
  averageResponseTime: 0,
  customerSatisfaction: 0,
  uptime: process.uptime(),
  startTime: new Date()
};

// AI response templates
const aiResponses = {
  greeting: [
    "Hello! I'm your AI Customer Care Assistant. How can I help you today?",
    "Hi there! I'm here to assist you with any questions or issues. What can I do for you?",
    "Welcome! I'm your AI support agent. How may I help you today?"
  ],
  
  account: [
    "I can help you with account-related questions. What specific account issue are you experiencing?",
    "Let me assist you with your account. Could you please provide more details about your concern?",
    "I'm here to help with account matters. What would you like to know about your account?"
  ],
  
  trading: [
    "I can help you with trading-related questions. What trading issue can I assist you with?",
    "Let me help you with your trading concerns. Could you please describe the specific problem?",
    "I'm here to support your trading needs. What trading question do you have?"
  ],
  
  technical: [
    "I can help you with technical issues. Please describe the technical problem you're experiencing.",
    "Let me assist you with the technical issue. What specific error or problem are you seeing?",
    "I'm here to help resolve technical problems. Could you provide more details about the issue?"
  ],
  
  payment: [
    "I can help you with payment-related questions. What payment issue are you experiencing?",
    "Let me assist you with payment matters. Could you please describe the payment problem?",
    "I'm here to help with payment concerns. What specific payment question do you have?"
  ],
  
  general: [
    "I understand your concern. Let me help you with that. Could you provide more details?",
    "I'm here to assist you. Please give me more information about your issue.",
    "I can help you with that. Could you please elaborate on your question or concern?"
  ],
  
  escalation: [
    "I understand this is a complex issue. Let me escalate this to our specialized team for you.",
    "This requires specialized attention. I'm connecting you with our expert team.",
    "I'm escalating this to our technical team who can provide more detailed assistance."
  ],
  
  resolution: [
    "I've resolved your issue. Is there anything else I can help you with?",
    "Problem solved! Do you have any other questions or concerns?",
    "I've taken care of that for you. Is there anything else I can assist you with?"
  ]
};

// AI response generation
function generateAIResponse(query, context = {}) {
  const startTime = Date.now();
  
  // Simple keyword-based response selection
  const queryLower = query.toLowerCase();
  let responseType = 'general';
  
  if (queryLower.includes('account') || queryLower.includes('login') || queryLower.includes('profile')) {
    responseType = 'account';
  } else if (queryLower.includes('trade') || queryLower.includes('trading') || queryLower.includes('market')) {
    responseType = 'trading';
  } else if (queryLower.includes('error') || queryLower.includes('bug') || queryLower.includes('technical') || queryLower.includes('issue')) {
    responseType = 'technical';
  } else if (queryLower.includes('payment') || queryLower.includes('billing') || queryLower.includes('subscription')) {
    responseType = 'payment';
  } else if (queryLower.includes('hello') || queryLower.includes('hi') || queryLower.includes('help')) {
    responseType = 'greeting';
  }
  
  // Check if escalation is needed
  const needsEscalation = context.escalationCount >= config.aiEscalationThreshold || 
                         queryLower.includes('urgent') || 
                         queryLower.includes('critical') ||
                         queryLower.includes('emergency');
  
  if (needsEscalation) {
    responseType = 'escalation';
  }
  
  // Generate response
  const responses = aiResponses[responseType] || aiResponses.general;
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  const responseTime = Date.now() - startTime;
  
  return {
    response,
    responseType,
    responseTime,
    needsEscalation,
    confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
    timestamp: new Date()
  };
}

// Process customer query
async function processCustomerQuery(query, customerId = null, context = {}) {
  const startTime = Date.now();
  
  try {
    // Generate AI response
    const aiResponse = generateAIResponse(query, context);
    
    // Create conversation entry
    const conversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: customerId || `customer-${Date.now()}`,
      query,
      response: aiResponse.response,
      responseType: aiResponse.responseType,
      responseTime: aiResponse.responseTime,
      needsEscalation: aiResponse.needsEscalation,
      confidence: aiResponse.confidence,
      timestamp: new Date(),
      status: aiResponse.needsEscalation ? 'escalated' : 'resolved'
    };
    
    // Add to conversations
    conversations.push(conversation);
    
    // Update stats
    stats.totalQueries++;
    if (conversation.status === 'resolved') {
      stats.resolvedQueries++;
    } else {
      stats.escalatedQueries++;
    }
    
    // Update average response time
    stats.averageResponseTime = (stats.averageResponseTime + aiResponse.responseTime) / 2;
    
    // Update customer satisfaction (simulated)
    stats.customerSatisfaction = Math.min(100, stats.customerSatisfaction + (aiResponse.confidence * 10));
    
    // Keep only last 1000 conversations
    if (conversations.length > 1000) {
      conversations = conversations.slice(-1000);
    }
    
    return {
      success: true,
      conversation,
      stats: {
        totalQueries: stats.totalQueries,
        resolvedQueries: stats.resolvedQueries,
        escalatedQueries: stats.escalatedQueries,
        averageResponseTime: stats.averageResponseTime,
        customerSatisfaction: stats.customerSatisfaction
      }
    };
    
  } catch (error) {
    console.error('Error processing customer query:', error);
    return {
      success: false,
      error: error.message,
      conversation: null
    };
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: 'production',
    customerCareAvailable: config.customerCareAvailable
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'AI Customer Care & Engineer API',
    version: '1.0.0',
    description: 'AI-powered customer care and engineering system',
    endpoints: {
      health: '/health',
      stats: '/api/stats',
      conversations: '/api/conversations',
      processQuery: '/api/process-query',
      resolveQuery: '/api/resolve-query',
      escalateQuery: '/api/escalate-query'
    },
    config: {
      customerCareAvailable: config.customerCareAvailable,
      chatResponseTimeTarget: config.chatResponseTimeTarget,
      queryResolutionRate: config.queryResolutionRate,
      aiResponseTimeTarget: config.aiResponseTimeTarget,
      aiResolutionRateTarget: config.aiResolutionRateTarget,
      aiEscalationThreshold: config.aiEscalationThreshold
    }
  });
});

app.get('/api/stats', (req, res) => {
  res.json({
    ...stats,
    uptime: process.uptime(),
    conversations: {
      total: conversations.length,
      resolved: conversations.filter(c => c.status === 'resolved').length,
      escalated: conversations.filter(c => c.status === 'escalated').length,
      active: conversations.filter(c => c.status === 'active').length
    },
    performance: {
      averageResponseTime: stats.averageResponseTime,
      customerSatisfaction: stats.customerSatisfaction,
      resolutionRate: stats.totalQueries > 0 ? (stats.resolvedQueries / stats.totalQueries) * 100 : 0,
      escalationRate: stats.totalQueries > 0 ? (stats.escalatedQueries / stats.totalQueries) * 100 : 0
    },
    config: {
      customerCareAvailable: config.customerCareAvailable,
      chatResponseTimeTarget: config.chatResponseTimeTarget,
      queryResolutionRate: config.queryResolutionRate,
      aiResponseTimeTarget: config.aiResponseTimeTarget,
      aiResolutionRateTarget: config.aiResolutionRateTarget,
      aiEscalationThreshold: config.aiEscalationThreshold
    }
  });
});

app.get('/api/conversations', (req, res) => {
  const { customerId, status, limit = 50, offset = 0 } = req.query;
  
  let filteredConversations = conversations;
  
  if (customerId) {
    filteredConversations = filteredConversations.filter(c => c.customerId === customerId);
  }
  
  if (status) {
    filteredConversations = filteredConversations.filter(c => c.status === status);
  }
  
  // Sort by timestamp (newest first)
  filteredConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Pagination
  const paginatedConversations = filteredConversations.slice(
    parseInt(offset),
    parseInt(offset) + parseInt(limit)
  );
  
  res.json({
    conversations: paginatedConversations,
    total: conversations.length,
    filtered: filteredConversations.length,
    paginated: paginatedConversations.length,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < filteredConversations.length
    }
  });
});

app.post('/api/process-query', async (req, res) => {
  try {
    const { query, customerId, context = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['query'],
        optional: ['customerId', 'context']
      });
    }
    
    const result = await processCustomerQuery(query, customerId, context);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({
        error: 'Failed to process query',
        message: result.error
      });
    }
    
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.post('/api/resolve-query', (req, res) => {
  try {
    const { conversationId } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['conversationId']
      });
    }
    
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        conversationId
      });
    }
    
    conversation.status = 'resolved';
    conversation.resolvedAt = new Date();
    
    // Update stats
    stats.resolvedQueries++;
    stats.customerSatisfaction = Math.min(100, stats.customerSatisfaction + 5);
    
    res.json({
      success: true,
      message: 'Query resolved successfully',
      conversation
    });
    
  } catch (error) {
    console.error('Error resolving query:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.post('/api/escalate-query', (req, res) => {
  try {
    const { conversationId, reason } = req.body;
    
    if (!conversationId) {
      return res.status(400).json({
        error: 'Missing required field',
        required: ['conversationId'],
        optional: ['reason']
      });
    }
    
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation not found',
        conversationId
      });
    }
    
    conversation.status = 'escalated';
    conversation.escalatedAt = new Date();
    conversation.escalationReason = reason || 'Manual escalation';
    
    // Update stats
    stats.escalatedQueries++;
    
    res.json({
      success: true,
      message: 'Query escalated successfully',
      conversation
    });
    
  } catch (error) {
    console.error('Error escalating query:', error);
    res.status(500).json({
      error: 'Internal Server Error',
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
  console.log(`AI Customer Care & Engineer API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
  console.log(`Environment: ${config.developmentMode ? 'development' : 'production'}`);
  console.log(`Customer Care Available: ${config.customerCareAvailable}`);
  console.log(`Response Time Target: ${config.chatResponseTimeTarget}ms`);
  console.log(`Resolution Rate Target: ${config.queryResolutionRate}%`);
});

export default app;
