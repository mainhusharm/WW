const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: ['https://frontend-tkxf.onrender.com', 'https://frontend-i6xs.onrender.com'],
  credentials: true
}));
app.use(express.json());

// Simple in-memory user storage
const users = {
  'anchlshrma18@gmail.com': {
    id: 'user-123',
    username: 'anchal',
    email: 'anchlshrma18@gmail.com',
    password: 'password', // In production, this should be hashed
    plan_type: 'premium'
  }
};

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication endpoints
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }
    
    const user = users[email];
    if (!user || user.password !== password) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    
    // Create a simple token (in production, use JWT)
    const token = `token_${user.id}_${Date.now()}`;
    
    res.json({
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        plan_type: user.plan_type
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ msg: 'Email, password, and username are required' });
    }
    
    if (users[email]) {
      return res.status(400).json({ msg: 'User already exists' });
    }
    
    const userId = `user_${Date.now()}`;
    users[email] = {
      id: userId,
      username,
      email,
      password,
      plan_type: 'free'
    };
    
    const token = `token_${userId}_${Date.now()}`;
    
    res.json({
      access_token: token,
      user: {
        id: userId,
        username,
        email,
        plan_type: 'free'
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

app.get('/api/auth/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }
    
    // Simple token validation (in production, use JWT)
    const userId = token.split('_')[1];
    const user = Object.values(users).find(u => u.id === userId);
    
    if (!user) {
      return res.status(401).json({ msg: 'Invalid token' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      plan_type: user.plan_type
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Users endpoint (already working)
app.get('/api/users', (req, res) => {
  try {
    const userList = Object.values(users).map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      plan_type: user.plan_type
    }));
    
    res.json(userList);
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple Auth Service running on port ${PORT}`);
  console.log(`📧 Test user: anchlshrma18@gmail.com / password`);
});
