const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5010;

// Binance API credentials - Updated with provided keys
const BINANCE_API_KEY = process.env.BINANCE_API_KEY || 'hFIuHmjyXgckLjXH74HgSnz4N1jFuZGgxKSV4ZDgQqanzfm5MBxvrDI5245VJGaO';
const BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY || 'znlONjSaSQb67CpfHya5vz0nfIXUGm5yqFd7bJTctO2HJ94wFNOROGE41nW1iKnX';

// CORS configuration
app.use(cors({
  origin: ["https://traderedgepro.com", "http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Function to create Binance signature
function createSignature(queryString, secret) {
  return crypto.createHmac('sha256', secret).update(queryString).digest('hex');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'binance-api-service',
    timestamp: Date.now()
  });
});

// Crypto price endpoint using Binance API
app.get('/api/ticker/price', async (req, res) => {
  try {
    const { symbol } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    // Call Binance API directly for real-time prices
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol },
      timeout: 10000,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });

    res.json({
      symbol: response.data.symbol,
      price: response.data.price
    });

  } catch (error) {
    console.error(`Error fetching price for ${req.query.symbol}:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json({ 
        error: error.response.data?.msg || 'Binance API error' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch price data from Binance' 
      });
    }
  }
});

// Bulk ticker prices endpoint using Binance API
app.get('/api/ticker/prices', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    const symbolArray = symbols.split(',');
    
    // Fetch all prices from Binance API
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      timeout: 15000,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });

    // Filter and format the response for requested symbols
    const allPrices = response.data;
    const prices = {};
    
    symbolArray.forEach(symbol => {
      const priceData = allPrices.find(item => item.symbol === symbol);
      if (priceData) {
        prices[symbol] = {
          symbol: priceData.symbol,
          price: priceData.price
        };
      } else {
        prices[symbol] = { error: 'Symbol not found on Binance' };
      }
    });

    res.json(prices);
  } catch (error) {
    console.error('Error in bulk price fetch:', error.message);
    
    if (error.response?.status === 429) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch bulk prices from Binance' });
    }
  }
});

// Klines/Candlestick data endpoint
app.get('/api/klines', async (req, res) => {
  try {
    const { symbol, interval = '1h', limit = 500 } = req.query;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const response = await axios.get('https://api.binance.com/api/v3/klines', {
      params: { symbol, interval, limit },
      timeout: 15000,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });

    // Format the klines data
    const formattedData = response.data.map(kline => ({
      openTime: kline[0],
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      closeTime: kline[6],
      quoteAssetVolume: parseFloat(kline[7]),
      numberOfTrades: kline[8],
      takerBuyBaseAssetVolume: parseFloat(kline[9]),
      takerBuyQuoteAssetVolume: parseFloat(kline[10])
    }));

    res.json(formattedData);

  } catch (error) {
    console.error(`Error fetching klines for ${req.query.symbol}:`, error.message);
    
    if (error.response) {
      res.status(error.response.status).json({ 
        error: error.response.data?.msg || 'Binance API error' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch klines data from Binance' 
      });
    }
  }
});

// Account information endpoint (requires signature)
app.get('/api/account', async (req, res) => {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createSignature(queryString, BINANCE_SECRET_KEY);

    const response = await axios.get('https://api.binance.com/api/v3/account', {
      params: { timestamp, signature },
      timeout: 10000,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });

    // Return only essential account information for security
    const accountInfo = {
      canTrade: response.data.canTrade,
      canWithdraw: response.data.canWithdraw,
      canDeposit: response.data.canDeposit,
      updateTime: response.data.updateTime,
      accountType: response.data.accountType,
      balances: response.data.balances.filter(balance => 
        parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
      ).map(balance => ({
        asset: balance.asset,
        free: balance.free,
        locked: balance.locked
      }))
    };

    res.json(accountInfo);

  } catch (error) {
    console.error('Error fetching account info:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({ 
        error: error.response.data?.msg || 'Binance API error' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch account information from Binance' 
      });
    }
  }
});

// 24hr ticker statistics endpoint
app.get('/api/ticker/24hr', async (req, res) => {
  try {
    const { symbol } = req.query;
    
    const params = symbol ? { symbol } : {};
    
    const response = await axios.get('https://api.binance.com/api/v3/ticker/24hr', {
      params,
      timeout: 15000,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });

    res.json(response.data);

  } catch (error) {
    console.error('Error fetching 24hr ticker:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({ 
        error: error.response.data?.msg || 'Binance API error' 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch 24hr ticker data from Binance' 
      });
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Binance API service running on port ${PORT}`);
  console.log(`Using API Key: ${BINANCE_API_KEY.substring(0, 8)}...`);
});
