const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 10003;

// Futures symbols mapping for Yahoo Finance
const FUTURES_SYMBOLS = {
  // Stock Index Futures
  'S&P 500': 'ES=F',           // E-mini S&P 500
  'Nasdaq-100': 'NQ=F',        // E-mini Nasdaq-100
  'Dow Jones': 'YM=F',         // E-mini Dow Jones
  'Russell 2000': 'RTY=F',     // E-mini Russell 2000
  
  // Commodity Futures
  'Crude Oil': 'CL=F',         // WTI Crude Oil
  'Gold': 'GC=F',              // Gold
  'Silver': 'SI=F',            // Silver
  
  // Treasury Futures
  '10-Year T-Note': 'ZN=F',    // 10-Year Treasury Note
  '30-Year T-Bond': 'ZB=F',    // 30-Year Treasury Bond
  
  // Currency Futures
  'Euro FX': '6E=F',           // Euro FX
  'British Pound': '6B=F',     // British Pound
  'Japanese Yen': '6J=F'       // Japanese Yen
};

// Reverse mapping for easy lookup
const SYMBOL_TO_NAME = Object.fromEntries(
  Object.entries(FUTURES_SYMBOLS).map(([name, symbol]) => [symbol, name])
);

// Valid timeframes for futures data
const VALID_TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'];
const VALID_RANGES = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];

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
      'http://localhost:5173',
      'http://localhost:5175'
    ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
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
app.options('*', cors());

// Helper function to validate timeframe
const validateTimeframe = (timeframe) => {
  return VALID_TIMEFRAMES.includes(timeframe) ? timeframe : '1m';
};

// Helper function to validate range
const validateRange = (range) => {
  return VALID_RANGES.includes(range) ? range : '1d';
};

// Helper function to get futures symbol
const getFuturesSymbol = (input) => {
  // If input is a name, get the symbol
  if (FUTURES_SYMBOLS[input]) {
    return FUTURES_SYMBOLS[input];
  }
  // If input is already a symbol, return it
  if (Object.values(FUTURES_SYMBOLS).includes(input)) {
    return input;
  }
  // Default fallback
  return input;
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'futures-data-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    supportedAssets: Object.keys(FUTURES_SYMBOLS),
    timeframes: VALID_TIMEFRAMES
  });
});

// Get all available futures symbols
app.get('/api/symbols', (req, res) => {
  res.json({
    success: true,
    symbols: FUTURES_SYMBOLS,
    count: Object.keys(FUTURES_SYMBOLS).length,
    timeframes: VALID_TIMEFRAMES,
    ranges: VALID_RANGES,
    timestamp: new Date().toISOString()
  });
});

// Get real-time price for a single futures contract
app.get('/api/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = validateTimeframe(req.query.timeframe || '1m');
    const range = validateRange(req.query.range || '1d');
    
    const futuresSymbol = getFuturesSymbol(symbol);
    const assetName = SYMBOL_TO_NAME[futuresSymbol] || symbol;
    
    console.log(`🔍 Fetching futures price for ${assetName} (${futuresSymbol}) - ${timeframe}/${range}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${futuresSymbol}?interval=${timeframe}&range=${range}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 15000
      });
      
      if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
        const result = response.data.chart.result[0];
        const meta = result.meta;
        const indicators = result.indicators.quote[0];
        
        const latestPrice = meta.regularMarketPrice || meta.previousClose || meta.chartPreviousClose;
        const previousClose = meta.previousClose || meta.chartPreviousClose;
        const change = latestPrice - previousClose;
        const changePercent = previousClose ? (change / previousClose) * 100 : 0;
        
        // Get latest OHLCV data if available
        let latestCandle = null;
        if (result.timestamp && result.timestamp.length > 0) {
          const lastIndex = result.timestamp.length - 1;
          latestCandle = {
            timestamp: result.timestamp[lastIndex] * 1000,
            open: indicators.open ? indicators.open[lastIndex] : null,
            high: indicators.high ? indicators.high[lastIndex] : null,
            low: indicators.low ? indicators.low[lastIndex] : null,
            close: indicators.close ? indicators.close[lastIndex] : null,
            volume: indicators.volume ? indicators.volume[lastIndex] : null
          };
        }
        
        const priceData = {
          symbol: futuresSymbol,
          name: assetName,
          price: latestPrice,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          volume: latestCandle ? latestCandle.volume : (meta.regularMarketVolume || 0),
          marketState: meta.marketState || 'UNKNOWN',
          currency: meta.currency || 'USD',
          exchangeName: meta.exchangeName || 'FUTURES',
          latestCandle: latestCandle,
          timestamp: new Date().toISOString(),
          provider: 'futures-data-service',
          timeframe: timeframe,
          range: range,
          category: getCategoryBySymbol(futuresSymbol)
        };
        
        console.log(`✅ Successfully fetched ${assetName}: $${latestPrice} (${changePercent.toFixed(2)}%)`);
        res.json(priceData);
      } else {
        throw new Error('Invalid response format from Yahoo Finance');
      }
    } catch (error) {
      console.error(`❌ Error fetching ${assetName}:`, error.message);
      res.status(500).json({ 
        error: 'Failed to fetch futures price data',
        message: error.message,
        symbol: futuresSymbol,
        name: assetName,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error(`❌ Error in price endpoint:`, error.message);
    res.status(500).json({ 
      error: 'Failed to process request',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get bulk prices for multiple futures contracts
app.post('/api/bulk', async (req, res) => {
  try {
    const { symbols = [], timeframe = '1m', range = '1d' } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }
    
    const validTimeframe = validateTimeframe(timeframe);
    const validRange = validateRange(range);
    
    console.log(`📊 Fetching bulk futures prices for ${symbols.length} symbols - ${validTimeframe}/${validRange}`);
    
    const results = [];
    const errors = [];
    
    // Process symbols in parallel with controlled concurrency
    const promises = symbols.map(async (symbol) => {
      try {
        const futuresSymbol = getFuturesSymbol(symbol);
        const assetName = SYMBOL_TO_NAME[futuresSymbol] || symbol;
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${futuresSymbol}?interval=${validTimeframe}&range=${validRange}`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 12000
        });
        
        if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
          const result = response.data.chart.result[0];
          const meta = result.meta;
          const indicators = result.indicators.quote[0];
          
          const latestPrice = meta.regularMarketPrice || meta.previousClose || meta.chartPreviousClose;
          const previousClose = meta.previousClose || meta.chartPreviousClose;
          const change = latestPrice - previousClose;
          const changePercent = previousClose ? (change / previousClose) * 100 : 0;
          
          return {
            symbol: futuresSymbol,
            name: assetName,
            price: latestPrice,
            previousClose: previousClose,
            change: change,
            changePercent: changePercent,
            volume: meta.regularMarketVolume || 0,
            marketState: meta.marketState || 'UNKNOWN',
            currency: meta.currency || 'USD',
            timestamp: new Date().toISOString(),
            provider: 'futures-data-service',
            timeframe: validTimeframe,
            range: validRange,
            category: getCategoryBySymbol(futuresSymbol)
          };
        }
        return null;
      } catch (error) {
        errors.push({ symbol, error: error.message });
        return null;
      }
    });
    
    const responses = await Promise.all(promises);
    const validResults = responses.filter(result => result !== null);
    
    console.log(`✅ Successfully fetched ${validResults.length}/${symbols.length} futures prices`);
    
    res.json({
      success: true,
      count: validResults.length,
      total: symbols.length,
      data: validResults,
      errors: errors,
      timestamp: new Date().toISOString(),
      timeframe: validTimeframe,
      range: validRange
    });
    
  } catch (error) {
    console.error('❌ Error in bulk futures fetch:', error.message);
    res.status(500).json({ 
      error: 'Bulk futures fetch failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get historical data for futures analysis
app.get('/api/historical/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const timeframe = validateTimeframe(req.query.timeframe || '1h');
    const range = validateRange(req.query.range || '5d');
    
    const futuresSymbol = getFuturesSymbol(symbol);
    const assetName = SYMBOL_TO_NAME[futuresSymbol] || symbol;
    
    console.log(`📈 Fetching historical data for ${assetName} (${futuresSymbol}) - ${timeframe}/${range}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${futuresSymbol}?interval=${timeframe}&range=${range}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
      const result = response.data.chart.result[0];
      const timestamp = result.timestamp;
      const indicators = result.indicators.quote[0];
      
      const historicalData = timestamp.map((time, index) => ({
        timestamp: time * 1000,
        datetime: new Date(time * 1000).toISOString(),
        open: indicators.open ? indicators.open[index] : null,
        high: indicators.high ? indicators.high[index] : null,
        low: indicators.low ? indicators.low[index] : null,
        close: indicators.close ? indicators.close[index] : null,
        volume: indicators.volume ? indicators.volume[index] : null
      })).filter(candle => candle.open !== null && candle.close !== null);
      
      console.log(`✅ Successfully fetched ${historicalData.length} historical bars for ${assetName}`);
      
      res.json({
        symbol: futuresSymbol,
        name: assetName,
        timeframe: timeframe,
        range: range,
        data: historicalData,
        count: historicalData.length,
        timestamp: new Date().toISOString(),
        provider: 'futures-data-service',
        category: getCategoryBySymbol(futuresSymbol)
      });
    } else {
      throw new Error('Invalid response format from Yahoo Finance');
    }
  } catch (error) {
    console.error(`❌ Error fetching historical data:`, error.message);
    res.status(500).json({ 
      error: 'Historical futures data fetch failed',
      message: error.message,
      symbol: req.params.symbol,
      timestamp: new Date().toISOString()
    });
  }
});

// Get futures by category
app.get('/api/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const timeframe = validateTimeframe(req.query.timeframe || '1m');
    
    const categorySymbols = Object.entries(FUTURES_SYMBOLS).filter(([name, symbol]) => {
      const cat = getCategoryBySymbol(symbol);
      return cat.toLowerCase() === category.toLowerCase();
    });
    
    if (categorySymbols.length === 0) {
      return res.status(404).json({ 
        error: 'Category not found',
        availableCategories: ['indices', 'commodities', 'treasuries', 'currencies']
      });
    }
    
    const symbols = categorySymbols.map(([name, symbol]) => name);
    
    // Use bulk endpoint logic
    const results = [];
    for (const [name, symbol] of categorySymbols) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${timeframe}&range=1d`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        if (response.data && response.data.chart && response.data.chart.result && response.data.chart.result.length > 0) {
          const result = response.data.chart.result[0];
          const meta = result.meta;
          
          const latestPrice = meta.regularMarketPrice || meta.previousClose;
          const previousClose = meta.previousClose;
          const change = latestPrice - previousClose;
          const changePercent = previousClose ? (change / previousClose) * 100 : 0;
          
          results.push({
            symbol: symbol,
            name: name,
            price: latestPrice,
            change: change,
            changePercent: changePercent,
            volume: meta.regularMarketVolume || 0,
            marketState: meta.marketState || 'UNKNOWN'
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch ${name}: ${error.message}`);
      }
    }
    
    res.json({
      category: category,
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`❌ Error fetching category ${req.params.category}:`, error.message);
    res.status(500).json({ 
      error: 'Category fetch failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to categorize futures
function getCategoryBySymbol(symbol) {
  if (['ES=F', 'NQ=F', 'YM=F', 'RTY=F'].includes(symbol)) return 'indices';
  if (['CL=F', 'GC=F', 'SI=F'].includes(symbol)) return 'commodities';
  if (['ZN=F', 'ZB=F'].includes(symbol)) return 'treasuries';
  if (['6E=F', '6B=F', '6J=F'].includes(symbol)) return 'currencies';
  return 'other';
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'futures-data-service',
    version: '1.0.0',
    status: 'running',
    description: 'Real-time futures data service for major contracts',
    endpoints: {
      health: '/health',
      symbols: '/api/symbols',
      price: '/api/price/:symbol',
      bulk: '/api/bulk (POST)',
      historical: '/api/historical/:symbol',
      category: '/api/category/:category'
    },
    supportedAssets: Object.keys(FUTURES_SYMBOLS),
    categories: ['indices', 'commodities', 'treasuries', 'currencies'],
    timeframes: VALID_TIMEFRAMES,
    timestamp: new Date().toISOString()
  });
});

// Keep service alive with cron job
cron.schedule('*/3 * * * *', () => {
  console.log('🔄 Futures service keep-alive ping at:', new Date().toISOString());
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
  console.log(`🚀 Futures Data Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔮 Supported assets: ${Object.keys(FUTURES_SYMBOLS).join(', ')}`);
  console.log(`⏰ Timeframes: ${VALID_TIMEFRAMES.join(', ')}`);
  console.log(`🌐 Service ready for futures data`);
});
