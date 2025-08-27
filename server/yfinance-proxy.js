const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180', 'http://localhost:5181', 'http://localhost:5182'],
  credentials: true
}));

app.use(express.json());

// Symbol mapping for yfinance
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
  'AUD/NZD': 'AUDNZD=X',
  'XAU/USD': 'GC=F',
  'XAG/USD': 'SI=F',
  'USOIL': 'CL=F'
};

// Fetch historical data from yfinance
app.get('/api/yfinance/historical/:symbol/:timeframe', async (req, res) => {
  try {
    const { symbol, timeframe } = req.params;
    const formattedSymbol = symbolMap[symbol] || symbol;
    
    console.log(`Fetching historical data for ${symbol} (${formattedSymbol}) with timeframe ${timeframe}`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${timeframe}&range=7d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const quotes = result.indicators.quote[0];
      
      if (timestamps && quotes && timestamps.length > 0) {
        const history = timestamps.map((timestamp, index) => ({
          time: new Date(timestamp * 1000).toISOString(),
          open: quotes.open[index] || 0,
          high: quotes.high[index] || 0,
          low: quotes.low[index] || 0,
          close: quotes.close[index] || 0,
          volume: quotes.volume[index] || 0
        }));
        
        console.log(`✅ Successfully fetched ${history.length} bars for ${symbol}`);
        res.json({ history, provider: 'yfinance-server' });
      } else {
        throw new Error('No data in response');
      }
    } else {
      throw new Error('Invalid response structure');
    }
    
  } catch (error) {
    console.error(`❌ Error fetching ${req.params.symbol}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Fetch latest price from yfinance
app.get('/api/yfinance/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const formattedSymbol = symbolMap[symbol] || symbol;
    
    console.log(`Fetching latest price for ${symbol} (${formattedSymbol})`);
    
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1m&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.chart && data.chart.result && data.chart.result[0]) {
      const result = data.chart.result[0];
      const quotes = result.indicators.quote[0];
      
      if (quotes && quotes.close && quotes.close.length > 0) {
        const latestPrice = quotes.close[quotes.close.length - 1];
        if (latestPrice && !isNaN(latestPrice)) {
          console.log(`✅ Latest price for ${symbol}: ${latestPrice}`);
          res.json({ price: latestPrice.toString(), provider: 'yfinance-server' });
        } else {
          throw new Error('Invalid price data');
        }
      } else {
        throw new Error('No price data in response');
      }
    } else {
      throw new Error('Invalid response structure');
    }
    
  } catch (error) {
    console.error(`❌ Error fetching price for ${req.params.symbol}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

// Bulk fetch for multiple symbols
app.post('/api/yfinance/bulk', async (req, res) => {
  try {
    const { symbols, timeframe } = req.body;
    
    if (!symbols || !Array.isArray(symbols) || !timeframe) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    console.log(`Bulk fetching data for ${symbols.length} symbols with timeframe ${timeframe}`);
    
    const results = {};
    
    for (const symbol of symbols) {
      try {
        const formattedSymbol = symbolMap[symbol] || symbol;
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=${timeframe}&range=7d`;
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const timestamps = result.timestamp;
            const quotes = result.indicators.quote[0];
            
            if (timestamps && quotes && timestamps.length > 0) {
              const history = timestamps.map((timestamp, index) => ({
                time: new Date(timestamp * 1000).toISOString(),
                open: quotes.open[index] || 0,
                high: quotes.high[index] || 0,
                low: quotes.low[index] || 0,
                close: quotes.close[index] || 0,
                volume: quotes.volume[index] || 0
              }));
              
              results[symbol] = history;
              console.log(`✅ Successfully fetched ${symbol}`);
            } else {
              results[symbol] = [];
              console.log(`⚠️ No data for ${symbol}`);
            }
          } else {
            results[symbol] = [];
            console.log(`⚠️ Invalid response for ${symbol}`);
          }
        } else {
          results[symbol] = [];
          console.log(`❌ HTTP error for ${symbol}: ${response.status}`);
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error fetching ${symbol}:`, error.message);
        results[symbol] = [];
      }
    }
    
    console.log(`✅ Bulk fetch completed: ${Object.keys(results).filter(k => results[k].length > 0).length} successful`);
    res.json(results);
    
  } catch (error) {
    console.error('❌ Bulk fetch error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 YFinance Proxy Server running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /api/yfinance/historical/:symbol/:timeframe`);
  console.log(`   GET  /api/yfinance/price/:symbol`);
  console.log(`   POST /api/yfinance/bulk`);
  console.log(`   GET  /health`);
});
