const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 10002;

// Helper function to format forex symbols for Yahoo Finance
const formatForexSymbol = (symbol) => {
  // Convert forex pairs to Yahoo Finance format
  const symbolMap = {
    'EUR/USD': 'EURUSD=X',
    'GBP/USD': 'GBPUSD=X',
    'USD/JPY': 'USDJPY=X',
    'USD/CHF': 'USDCHF=X',
    'AUD/USD': 'AUDUSD=X',
    'USD/CAD': 'USDCAD=X',
    'NZD/USD': 'NZDUSD=X',
    'EUR/JPY': 'EURJPY=X',
    'GBP/JPY': 'GBPJPY=X',
    'EUR/GBP': 'EURGBP=X',
    'EUR/AUD': 'EURAUD=X',
    'GBP/AUD': 'GBPAUD=X',
    'AUD/CAD': 'AUDCAD=X',
    'CAD/JPY': 'CADJPY=X',
    'CHF/JPY': 'CHFJPY=X',
    'AUD/CHF': 'AUDCHF=X',
    'CAD/CHF': 'CADCHF=X',
    'EUR/CHF': 'EURCHF=X',
    'GBP/CHF': 'GBPCHF=X',
    'NZD/CAD': 'NZDCAD=X',
    'NZD/JPY': 'NZDJPY=X',
    'AUD/NZD': 'AUDNZD=X'
  };
  
  return symbolMap[symbol] || symbol;
};

// Enhanced CORS configuration
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'https://www.traderedgepro.com',
      'https://traderedgepro.com',
      'https://traderedgepro.onrender.com',
      'https://frontend-01uh.onrender.com',
      'https://frontend-zwwl.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173'
    ];

// More permissive CORS for development and testing
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in our allowed list
    if (corsOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // For development, allow all onrender.com domains
    if (origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
}));

app.use(express.json());

// Handle preflight requests
app.options('*', cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'yfinance-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get real-time price for a single symbol
app.get('/api/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1m', range = '1d' } = req.query;
    
    console.log(`Fetching price for ${symbol} with timeframe ${timeframe} and range ${range}`);
    
    // Try to fetch real data from Yahoo Finance API
    const formattedSymbol = formatForexSymbol(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${timeframe}&range=${range}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.chart && response.data.chart.result) {
        const result = response.data.chart.result[0];
        const meta = result.meta;
        const indicators = result.indicators.quote[0];
        
        const latestPrice = meta.regularMarketPrice || meta.previousClose;
        const previousClose = meta.previousClose;
        const change = latestPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        
        const priceData = {
          symbol: symbol,
          price: latestPrice,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          volume: indicators.volume ? indicators.volume[indicators.volume.length - 1] : 0,
          timestamp: new Date().toISOString(),
          provider: 'yfinance-service',
          timeframe: timeframe,
          range: range
        };
        
        console.log(`✅ Successfully fetched real price for ${symbol}: $${latestPrice}`);
        res.json(priceData);
      } else {
        throw new Error('Invalid response format from Yahoo Finance');
      }
    } catch (error) {
      console.error(`❌ Error fetching real price for ${symbol}:`, error.message);
      res.status(500).json({ 
        error: 'Failed to fetch real price data',
        message: error.message,
        symbol: symbol,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error(`❌ Error fetching price for ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Failed to fetch price data',
      message: error.message,
      symbol: req.params.symbol,
      timestamp: new Date().toISOString()
    });
  }
});

// Get bulk prices for multiple symbols
app.post('/api/bulk', async (req, res) => {
  try {
    const { symbols = [], timeframe = '1m', range = '1d' } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    console.log(`Fetching bulk prices for ${symbols.length} symbols: ${symbols.join(', ')}`);
    
    // Try to fetch real data from Yahoo Finance API for each symbol
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const formattedSymbol = formatForexSymbol(symbol);
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${timeframe}&range=${range}`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 8000
        });
        
        if (response.data && response.data.chart && response.data.chart.result) {
          const result = response.data.chart.result[0];
          const meta = result.meta;
          const indicators = result.indicators.quote[0];
          
          const latestPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = latestPrice - previousClose;
          const changePercent = (change / previousClose) * 100;
          
          results.push({
            symbol: symbol,
            price: latestPrice,
            previousClose: previousClose,
            change: change,
            changePercent: changePercent,
            volume: indicators.volume ? indicators.volume[indicators.volume.length - 1] : 0,
            timestamp: new Date().toISOString(),
            provider: 'yfinance-service',
            timeframe: timeframe,
            range: range
          });
        }
      } catch (error) {
        console.warn(`Warning: Failed to fetch ${symbol}: ${error.message}`);
        // Skip failed symbols - no fallback data
      }
    }
    
    console.log(`✅ Successfully fetched real bulk prices for ${results.length} symbols`);
    
    res.json({
      success: true,
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in bulk price fetch:', error.message);
    res.status(500).json({ 
      error: 'Bulk price fetch failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get historical data for analysis
app.get('/api/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1m', range = '5d' } = req.query;
    
    console.log(`Fetching historical data for ${symbol} with timeframe ${timeframe} and range ${range}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${timeframe}&range=${range}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (response.data && response.data.chart && response.data.chart.result) {
      const result = response.data.chart.result[0];
      const timestamp = result.timestamp;
      const indicators = result.indicators.quote[0];
      
      const historicalData = timestamp.map((time, index) => ({
        timestamp: time * 1000,
        open: indicators.open ? indicators.open[index] : null,
        high: indicators.high ? indicators.high[index] : null,
        low: indicators.low ? indicators.low[index] : null,
        close: indicators.close ? indicators.close[index] : null,
        volume: indicators.volume ? indicators.volume[index] : null
      })).filter(candle => candle.open !== null && candle.close !== null);
      
      console.log(`✅ Successfully fetched ${historicalData.length} historical bars for ${symbol}`);
      
      res.json({
        symbol: symbol,
        timeframe: timeframe,
        range: range,
        data: historicalData,
        count: historicalData.length,
        timestamp: new Date().toISOString(),
        provider: 'yfinance-service'
      });
    } else {
      throw new Error('Invalid response format from Yahoo Finance');
    }
  } catch (error) {
    console.error(`❌ Error fetching historical data for ${req.params.symbol}:`, error.message);
    res.status(500).json({ 
      error: 'Historical data fetch failed',
      message: error.message,
      symbol: req.params.symbol,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'yfinance-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      price: '/api/price/:symbol',
      bulk: '/api/bulk (POST)',
      historical: '/api/historical/:symbol'
    },
    timestamp: new Date().toISOString()
  });
});

// Keep service alive with cron job
cron.schedule('*/5 * * * *', () => {
  console.log('🔄 Service keep-alive ping at:', new Date().toISOString());
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 YFinance service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Service ready for forex and stock data`);
  console.log(`🔧 CORS origins: ${corsOrigins.join(', ')}`);
});
