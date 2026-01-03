const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3006;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo purposes
let queries = [];
let issues = [];
let stats = {
  queriesProcessed: 0,
  issuesFixed: 0,
  avgResponseTime: 0,
  customerSatisfaction: 95,
  uptime: 99.9
};

// AI-powered query resolution logic
const resolveQuery = async (query) => {
  const startTime = Date.now();
  
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  let resolution = '';
  let autoResolved = false;
  let confidence = 0;

  // Customer query resolution
  if (query.type === 'customer') {
    if (query.message.toLowerCase().includes('premium features') || 
        query.message.toLowerCase().includes('premium access')) {
      resolution = 'I\'ve verified your account and restored access to premium features. Please refresh your browser and try again. If the issue persists, I\'ve escalated this to our technical team.';
      autoResolved = true;
      confidence = 95;
    } else if (query.message.toLowerCase().includes('password') || 
               query.message.toLowerCase().includes('reset')) {
      resolution = 'I\'ve sent a password reset link to your registered email address. Please check your inbox and follow the instructions. The link will expire in 24 hours for security reasons.';
      autoResolved = true;
      confidence = 98;
    } else if (query.message.toLowerCase().includes('payment') || 
               query.message.toLowerCase().includes('billing') ||
               query.message.toLowerCase().includes('charge')) {
      resolution = 'I\'ve identified the payment issue and applied a fix. Please try your transaction again. If it still fails, I\'ll escalate this to our payment team immediately. I\'ve also created a backup payment method for you.';
      autoResolved = true;
      confidence = 90;
    } else if (query.message.toLowerCase().includes('upgrade') || 
               query.message.toLowerCase().includes('plan')) {
      resolution = 'I\'ve prepared your account for upgrade. You can now proceed with the plan change in your dashboard. I\'ve also applied a 10% discount for your loyalty.';
      autoResolved = true;
      confidence = 92;
    } else if (query.message.toLowerCase().includes('login') || 
               query.message.toLowerCase().includes('signin')) {
      resolution = 'I\'ve cleared your session cache and reset your login credentials. Please try logging in again. If the issue persists, I\'ve created a temporary access link for you.';
      autoResolved = true;
      confidence = 88;
    } else {
      resolution = 'I\'ve analyzed your query and escalated it to our specialized team. You\'ll receive a detailed response within 2 hours. I\'ve also created a priority ticket for you.';
      autoResolved = false;
      confidence = 60;
    }
  } 
  // Technical query resolution
  else if (query.type === 'technical') {
    if (query.message.toLowerCase().includes('loading') || 
        query.message.toLowerCase().includes('slow')) {
      resolution = 'I\'ve optimized the dashboard performance by clearing cache, optimizing database queries, and implementing lazy loading. The issue should be resolved now. I\'ve also enabled performance monitoring.';
      autoResolved = true;
      confidence = 94;
    } else if (query.message.toLowerCase().includes('button') || 
               query.message.toLowerCase().includes('click')) {
      resolution = 'I\'ve fixed the button functionality. The issue was caused by a JavaScript error that I\'ve now resolved. I\'ve also added better error handling to prevent future occurrences.';
      autoResolved = true;
      confidence = 96;
    } else if (query.message.toLowerCase().includes('validation') || 
               query.message.toLowerCase().includes('form')) {
      resolution = 'I\'ve fixed the form validation logic and improved error handling. The validation should work correctly now. I\'ve also added real-time validation feedback.';
      autoResolved = true;
      confidence = 93;
    } else if (query.message.toLowerCase().includes('api') || 
               query.message.toLowerCase().includes('error')) {
      resolution = 'I\'ve identified and fixed the API issue. The service has been restarted and error handling improved. I\'ve also implemented retry logic for better reliability.';
      autoResolved = true;
      confidence = 91;
    } else {
      resolution = 'I\'ve analyzed the technical issue and applied several fixes. The system is now more stable. I\'ve also created monitoring alerts to catch similar issues early.';
      autoResolved = true;
      confidence = 85;
    }
  }

  const processingTime = (Date.now() - startTime) / 1000;
  
  return {
    resolution,
    autoResolved,
    confidence,
    processingTime
  };
};

// AI-powered issue fixing logic
const fixIssue = async (issue) => {
  const startTime = Date.now();
  
  // Simulate fix processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  let fixApplied = '';
  let autoFixed = false;
  let confidence = 0;

  if (issue.type === 'error') {
    if (issue.description.includes('500 error') || issue.description.includes('server error')) {
      fixApplied = 'Restarted API service, cleared error logs, and applied database connection pool fix. Implemented circuit breaker pattern for better error handling.';
      autoFixed = true;
      confidence = 96;
    } else if (issue.description.includes('404') || issue.description.includes('not found')) {
      fixApplied = 'Fixed routing configuration and updated API endpoints. Added proper error handling for missing resources.';
      autoFixed = true;
      confidence = 94;
    } else if (issue.description.includes('timeout')) {
      fixApplied = 'Increased timeout values, optimized database queries, and implemented connection pooling. Added retry logic with exponential backoff.';
      autoFixed = true;
      confidence = 92;
    }
  } else if (issue.type === 'performance') {
    if (issue.description.includes('Database query') || issue.description.includes('slow query')) {
      fixApplied = 'Optimized database queries, added proper indexing, and implemented query caching. Database performance improved by 60%.';
      autoFixed = true;
      confidence = 95;
    } else if (issue.description.includes('memory') || issue.description.includes('leak')) {
      fixApplied = 'Fixed memory leaks, optimized garbage collection, and implemented memory monitoring. Memory usage reduced by 40%.';
      autoFixed = true;
      confidence = 93;
    } else if (issue.description.includes('load time') || issue.description.includes('slow loading')) {
      fixApplied = 'Implemented code splitting, lazy loading, and CDN optimization. Page load time improved by 50%.';
      autoFixed = true;
      confidence = 91;
    }
  } else if (issue.type === 'security') {
    if (issue.description.includes('XSS') || issue.description.includes('cross-site')) {
      fixApplied = 'Applied input sanitization, Content Security Policy headers, and XSS protection. Updated validation logic and added security headers.';
      autoFixed = true;
      confidence = 98;
    } else if (issue.description.includes('SQL injection') || issue.description.includes('injection')) {
      fixApplied = 'Implemented parameterized queries, input validation, and SQL injection protection. Added security scanning and monitoring.';
      autoFixed = true;
      confidence = 97;
    } else if (issue.description.includes('CSRF') || issue.description.includes('forgery')) {
      fixApplied = 'Added CSRF tokens, SameSite cookies, and request validation. Implemented proper authentication checks.';
      autoFixed = true;
      confidence = 96;
    }
  } else if (issue.type === 'feature') {
    if (issue.description.includes('Payment gateway') || issue.description.includes('payment')) {
      fixApplied = 'Switched to backup payment provider, implemented retry logic with exponential backoff, and added payment monitoring.';
      autoFixed = true;
      confidence = 94;
    } else if (issue.description.includes('email') || issue.description.includes('notification')) {
      fixApplied = 'Fixed email service configuration, implemented queue system, and added fallback notification methods.';
      autoFixed = true;
      confidence = 92;
    } else if (issue.description.includes('file upload') || issue.description.includes('upload')) {
      fixApplied = 'Fixed file upload service, implemented proper validation, and added virus scanning. File processing now works reliably.';
      autoFixed = true;
      confidence = 90;
    }
  }

  if (!autoFixed) {
    fixApplied = 'Issue requires manual intervention. Alerted development team, created monitoring task, and implemented temporary workaround.';
    confidence = 70;
  }

  const processingTime = (Date.now() - startTime) / 1000;
  
  return {
    fixApplied,
    autoFixed,
    confidence,
    processingTime
  };
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Get all queries
app.get('/api/queries', (req, res) => {
  res.json({ queries, total: queries.length });
});

// Get all issues
app.get('/api/issues', (req, res) => {
  res.json({ issues, total: issues.length });
});

// Get statistics
app.get('/api/stats', (req, res) => {
  res.json(stats);
});

// Create new query
app.post('/api/queries', async (req, res) => {
  try {
    const { type, priority, message, customer } = req.body;
    
    const query = {
      id: uuidv4(),
      type,
      priority,
      message,
      customer,
      timestamp: new Date(),
      status: 'pending',
      autoResolved: false
    };

    queries.unshift(query);
    
    // Auto-resolve query
    const resolution = await resolveQuery(query);
    
    query.status = 'resolved';
    query.resolution = resolution.resolution;
    query.autoResolved = resolution.autoResolved;
    query.confidence = resolution.confidence;
    query.processingTime = resolution.processingTime;

    // Update stats
    stats.queriesProcessed++;
    stats.avgResponseTime = (stats.avgResponseTime + resolution.processingTime) / 2;

    res.json({ query, resolution });
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Create new issue
app.post('/api/issues', async (req, res) => {
  try {
    const { type, severity, description, component } = req.body;
    
    const issue = {
      id: uuidv4(),
      type,
      severity,
      description,
      component,
      timestamp: new Date(),
      status: 'detected',
      autoFixed: false
    };

    issues.unshift(issue);
    
    // Auto-fix issue
    const fix = await fixIssue(issue);
    
    issue.status = 'fixed';
    issue.fixApplied = fix.fixApplied;
    issue.autoFixed = fix.autoFixed;
    issue.confidence = fix.confidence;
    issue.processingTime = fix.processingTime;

    // Update stats
    stats.issuesFixed++;

    res.json({ issue, fix });
  } catch (error) {
    console.error('Error processing issue:', error);
    res.status(500).json({ error: 'Failed to process issue' });
  }
});

// Update query status
app.put('/api/queries/:id', (req, res) => {
  const { id } = req.params;
  const { status, resolution } = req.body;
  
  const queryIndex = queries.findIndex(q => q.id === id);
  if (queryIndex === -1) {
    return res.status(404).json({ error: 'Query not found' });
  }
  
  queries[queryIndex] = { ...queries[queryIndex], status, resolution };
  res.json({ query: queries[queryIndex] });
});

// Update issue status
app.put('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const { status, fixApplied } = req.body;
  
  const issueIndex = issues.findIndex(i => i.id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  
  issues[issueIndex] = { ...issues[issueIndex], status, fixApplied };
  res.json({ issue: issues[issueIndex] });
});

// Delete query
app.delete('/api/queries/:id', (req, res) => {
  const { id } = req.params;
  const queryIndex = queries.findIndex(q => q.id === id);
  
  if (queryIndex === -1) {
    return res.status(404).json({ error: 'Query not found' });
  }
  
  queries.splice(queryIndex, 1);
  res.json({ message: 'Query deleted successfully' });
});

// Delete issue
app.delete('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const issueIndex = issues.findIndex(i => i.id === id);
  
  if (issueIndex === -1) {
    return res.status(404).json({ error: 'Issue not found' });
  }
  
  issues.splice(issueIndex, 1);
  res.json({ message: 'Issue deleted successfully' });
});

// Simulate real-time monitoring
app.post('/api/simulate/query', async (req, res) => {
  try {
    const queryTypes = [
      { type: 'customer', message: 'I can\'t access my premium features', priority: 'high' },
      { type: 'customer', message: 'How do I reset my password?', priority: 'medium' },
      { type: 'customer', message: 'My payment failed, can you help?', priority: 'urgent' },
      { type: 'customer', message: 'I want to upgrade my plan', priority: 'low' },
      { type: 'technical', message: 'Dashboard is loading slowly', priority: 'medium' },
      { type: 'technical', message: 'Login button not working', priority: 'high' },
      { type: 'technical', message: 'Payment form validation error', priority: 'urgent' }
    ];

    const customers = [
      { id: '1', name: 'John Smith', email: 'john@example.com', plan: 'Professional' },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', plan: 'Elite' },
      { id: '3', name: 'Mike Chen', email: 'mike@example.com', plan: 'Basic' }
    ];

    const randomQuery = queryTypes[Math.floor(Math.random() * queryTypes.length)];
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];

    const query = {
      id: uuidv4(),
      ...randomQuery,
      customer: randomCustomer,
      timestamp: new Date(),
      status: 'pending',
      autoResolved: false
    };

    queries.unshift(query);
    
    // Auto-resolve query
    const resolution = await resolveQuery(query);
    
    query.status = 'resolved';
    query.resolution = resolution.resolution;
    query.autoResolved = resolution.autoResolved;
    query.confidence = resolution.confidence;
    query.processingTime = resolution.processingTime;

    // Update stats
    stats.queriesProcessed++;
    stats.avgResponseTime = (stats.avgResponseTime + resolution.processingTime) / 2;

    res.json({ query, resolution });
  } catch (error) {
    console.error('Error simulating query:', error);
    res.status(500).json({ error: 'Failed to simulate query' });
  }
});

// Simulate issue detection
app.post('/api/simulate/issue', async (req, res) => {
  try {
    const issueTypes = [
      { type: 'error', description: 'API endpoint returning 500 error', component: 'Backend API', severity: 'high' },
      { type: 'performance', description: 'Database query taking >2s', component: 'Database', severity: 'medium' },
      { type: 'security', description: 'Potential XSS vulnerability detected', component: 'Frontend', severity: 'critical' },
      { type: 'feature', description: 'Payment gateway timeout', component: 'Payment System', severity: 'high' },
      { type: 'error', description: 'Memory leak in user session handling', component: 'Session Manager', severity: 'medium' },
      { type: 'performance', description: 'Image loading taking >5s', component: 'Media Service', severity: 'low' }
    ];

    const randomIssue = issueTypes[Math.floor(Math.random() * issueTypes.length)];

    const issue = {
      id: uuidv4(),
      ...randomIssue,
      timestamp: new Date(),
      status: 'detected',
      autoFixed: false
    };

    issues.unshift(issue);
    
    // Auto-fix issue
    const fix = await fixIssue(issue);
    
    issue.status = 'fixed';
    issue.fixApplied = fix.fixApplied;
    issue.autoFixed = fix.autoFixed;
    issue.confidence = fix.confidence;
    issue.processingTime = fix.processingTime;

    // Update stats
    stats.issuesFixed++;

    res.json({ issue, fix });
  } catch (error) {
    console.error('Error simulating issue:', error);
    res.status(500).json({ error: 'Failed to simulate issue' });
  }
});

// Get monitoring status
app.get('/api/monitoring/status', (req, res) => {
  res.json({
    isActive: true,
    lastCheck: new Date().toISOString(),
    queriesInQueue: queries.filter(q => q.status === 'pending').length,
    issuesInQueue: issues.filter(i => i.status === 'detected').length,
    systemHealth: 'excellent',
    uptime: process.uptime()
  });
});

// Start monitoring
app.post('/api/monitoring/start', (req, res) => {
  res.json({ message: 'Monitoring started', status: 'active' });
});

// Stop monitoring
app.post('/api/monitoring/stop', (req, res) => {
  res.json({ message: 'Monitoring stopped', status: 'inactive' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Customer Care & Engineer API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

module.exports = app;
