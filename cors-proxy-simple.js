const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'CORS Proxy',
    timestamp: new Date().toISOString()
  });
});

// Proxy all requests to the backend
app.use('/', createProxyMiddleware({
  target: 'https://node-backend-g1mk.onrender.com',
  changeOrigin: true,
  onProxyRes: function (proxyRes, req, res) {
    // Add CORS headers to the response
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Origin, Accept';
    proxyRes.headers['Access-Control-Max-Age'] = '3600';
  },
  onError: function (err, req, res) {
    res.status(500).json({ 
      error: 'Proxy error', 
      message: err.message 
    });
  }
}));

const PORT = process.env.PORT || 3003;

app.listen(PORT, () => {
  console.log(`CORS Proxy server running on port ${PORT}`);
  console.log(`Proxying requests to: https://node-backend-g1mk.onrender.com`);
  console.log(`Test with: curl -H "Origin: https://frontend-tkxf.onrender.com" http://localhost:${PORT}/api/users`);
});
