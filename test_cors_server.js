const express = require('express');
const cors = require('cors');

const app = express();

// Explicit CORS middleware - this will definitely work
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow specific origins
  if (origin && (
    origin.includes('frontend-tkxf.onrender.com') ||
    origin.includes('frontend-i6xs.onrender.com') ||
    origin.includes('frontend-01uh.onrender.com') ||
    origin.includes('frontend-zwwl.onrender.com') ||
    origin.includes('traderedgepro.com') ||
    origin.includes('localhost')
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Origin, Accept');
  res.header('Access-Control-Max-Age', '3600');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    users: [
      { id: '1', email: 'test@example.com', fullName: 'Test User', status: 'PENDING' }
    ],
    count: 1
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Test CORS server running on port ${PORT}`);
  console.log(`Test with: curl -H "Origin: https://frontend-tkxf.onrender.com" http://localhost:${PORT}/api/users -v`);
});
