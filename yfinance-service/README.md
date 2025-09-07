# YFinance Service

A reliable Node.js service for fetching real-time forex and stock data from Yahoo Finance.

## 🚀 Features

- **Real-time Prices**: Get current prices for any forex pair or stock symbol
- **Bulk Data**: Fetch prices for multiple symbols in one request
- **Historical Data**: Retrieve historical OHLCV data for analysis
- **CORS Enabled**: Properly configured for web applications
- **Fallback Support**: Mock data when API fails
- **Health Monitoring**: Built-in health check endpoint

## 📊 Endpoints

### Health Check
```
GET /health
```

### Single Price
```
GET /api/price/:symbol?timeframe=1m&range=1d
```

### Bulk Prices
```
POST /api/bulk
Body: { "symbols": ["EUR/USD", "GBP/USD"], "timeframe": "1m", "range": "1d" }
```

### Historical Data
```
GET /api/historical/:symbol?timeframe=1m&range=5d
```

## 🛠️ Deployment to Render

1. **Connect Repository**: Link this folder to your Render account
2. **Create Web Service**: Use the provided `render.yaml` configuration
3. **Environment Variables**: Set automatically by render.yaml
4. **Deploy**: Service will be available at `https://yfinance-service.onrender.com`

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📈 Usage Examples

### Frontend Integration
```typescript
// Get real-time price
const price = await fetch('https://yfinance-service.onrender.com/api/price/EUR%2FUSD');
const data = await price.json();
console.log(`EUR/USD: $${data.price}`);

// Get bulk prices
const bulk = await fetch('https://yfinance-service.onrender.com/api/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ symbols: ['EUR/USD', 'GBP/USD'] })
});
const bulkData = await bulk.json();
```

## 🚨 Important Notes

- **Forex Symbols**: Use format like `EUR/USD`, `GBP/USD`
- **Stock Symbols**: Use format like `AAPL`, `GOOGL`
- **Timeframes**: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
- **Ranges**: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max

## 🔄 Service Keep-Alive

The service includes a cron job that pings every 5 minutes to keep the free Render instance active.

## 📝 Logs

All API calls and errors are logged to the console for debugging and monitoring.
