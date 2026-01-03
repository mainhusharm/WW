/**
 * Example of how to integrate Cryptomus routes into your existing backend
 * Choose the appropriate method based on your current setup
 */

// Option 1: If you're using Express.js
const express = require('express');
const cors = require('cors');
const { createCryptomusRoutes } = require('./cryptomus_routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Your existing routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Add Cryptomus routes
createCryptomusRoutes(app);

// Your other routes...

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Cryptomus integration`);
});

// Option 2: If you're extending an existing Flask app (Python)
/*
from flask import Flask
from flask_cors import CORS
from journal.cryptomus_routes import create_cryptomus_routes

app = Flask(__name__)
CORS(app)

# Your existing routes
@app.route('/api/health')
def health():
    return {'status': 'ok'}

# Add Cryptomus routes
create_cryptomus_routes(app)

# Your other routes...

if __name__ == '__main__':
    app.run(port=3001)
*/

module.exports = app;
