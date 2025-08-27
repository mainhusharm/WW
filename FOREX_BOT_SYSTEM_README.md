# Forex Data Bot System

## Overview

The Forex Data Bot System is a comprehensive solution for fetching real-time forex and crypto data, performing market analysis, and storing all data in a database for dashboard display. The system ensures **NO MOCK OR PREFILLED DATA** - all data comes from live sources.

## 🚀 Key Features

### ✅ Real-Time Data Fetching
- **YFinance Integration**: Fetches live forex data from Yahoo Finance
- **Binance Integration**: Fetches live crypto data from Binance API
- **No Mock Data**: All data is fetched in real-time from live sources
- **Rate Limiting**: Built-in protection against API rate limits

### ✅ Comprehensive Data Storage
- **bot_data Table**: Stores all price data, signals, and market information
- **ohlc_data Table**: Stores OHLC (Open, High, Low, Close) data for charting
- **Real-Time Updates**: Data is updated every 5 seconds
- **Historical Data**: Maintains historical price data for analysis

### ✅ Advanced Data Validation
- **Price Validation**: Ensures all prices are valid and logical
- **Data Integrity**: Validates OHLC relationships (High ≥ Open/Close, Low ≤ Open/Close)
- **Error Handling**: Graceful handling of API failures and invalid data
- **Retry Logic**: Automatic retry with exponential backoff

### ✅ Performance & Reliability
- **Connection Pooling**: Efficient API connection management
- **Health Monitoring**: Real-time service health checks
- **Memory Management**: Optimized memory usage and garbage collection
- **Service Recovery**: Automatic service restart on failures

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   YFinance       │    │   Database      │
│   Dashboard     │◄──►│   Proxy Server   │◄──►│   (bot_data,    │
│                 │    │   (Port 3001)    │    │    ohlc_data)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Binance        │
                       │   Service        │
                       │   (Port 5010)    │
                       └──────────────────┘
```

## 📊 Data Flow

1. **Data Fetching**: Services fetch real-time data every 5 seconds
2. **Validation**: All data is validated for accuracy and integrity
3. **Storage**: Valid data is stored in database tables
4. **Dashboard**: Data is displayed in real-time on the dashboard
5. **Analysis**: Historical data is used for SMC analysis and signals

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Database (PostgreSQL/MySQL/SQLite)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   cd ..
   
   # Install binance service dependencies (if available)
   cd binance_service
   npm install
   cd ..
   ```

3. **Start the system**
   ```bash
   ./start_forex_bot_system.sh
   ```

### Manual Setup

1. **Start YFinance Proxy Server**
   ```bash
   cd server
   node yfinance-proxy.js
   ```

2. **Start Binance Service (optional)**
   ```bash
   cd binance_service
   node server.js
   ```

3. **Test the system**
   ```bash
   node test_forex_bot.js
   ```

## 🔧 Configuration

### YFinance Configuration
The YFinance proxy server supports the following configuration:

```javascript
// server/yfinance-proxy.js
const PORT = 3001;
const MAX_REQUESTS_PER_MINUTE = 30;
const symbolMap = {
  'EUR/USD': 'EURUSD=X',
  'GBP/USD': 'GBPUSD=X',
  // ... more symbols
};
```

### Supported Timeframes
- **Intraday**: 1m, 2m, 5m, 15m, 30m, 60m, 90m
- **Daily**: 1d, 5d, 1wk, 1mo, 3mo

### Supported Symbols
- **Major Pairs**: EUR/USD, GBP/USD, USD/JPY, USD/CHF
- **Commodity Pairs**: AUD/USD, USD/CAD, NZD/USD
- **Cross Pairs**: EUR/JPY, GBP/JPY, EUR/GBP
- **Commodities**: XAU/USD (Gold), XAG/USD (Silver), USOIL

## 📡 API Endpoints

### Health Check
```
GET /health
```
Returns server status, uptime, memory usage, and rate limit information.

### Price Data
```
GET /api/yfinance/price/{symbol}
```
Fetches latest price for a specific symbol with OHLC data.

### Historical Data
```
GET /api/yfinance/historical/{symbol}/{timeframe}
```
Fetches historical price data for analysis.

### Bulk Fetch
```
POST /api/yfinance/bulk
Body: { "symbols": ["EUR/USD", "GBP/USD"], "timeframe": "5m" }
```
Fetches data for multiple symbols in a single request.

### Real-Time Stream
```
GET /api/yfinance/stream/{symbols}
```
Server-Sent Events stream for real-time price updates.

## 💾 Database Schema

### bot_data Table
Stores all bot-related data including prices, signals, and market information.

```sql
CREATE TABLE bot_data (
    id SERIAL PRIMARY KEY,
    bot_type VARCHAR(20) NOT NULL,  -- 'forex' or 'crypto'
    pair VARCHAR(20) NOT NULL,      -- e.g., 'EUR/USD'
    timestamp TIMESTAMP NOT NULL,
    price DECIMAL(20,8) NOT NULL,   -- Last fetched price
    signal_type VARCHAR(10),        -- 'buy', 'sell', 'neutral'
    signal_strength DECIMAL(5,2),
    is_recommended BOOLEAN DEFAULT FALSE,
    volume DECIMAL(20,8),
    high DECIMAL(20,8),
    low DECIMAL(20,8),
    open_price DECIMAL(20,8),
    close_price DECIMAL(20,8),
    timeframe VARCHAR(10)
);
```

### ohlc_data Table
Stores OHLC data for charting and technical analysis.

```sql
CREATE TABLE ohlc_data (
    id SERIAL PRIMARY KEY,
    pair VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open_price DECIMAL(20,8) NOT NULL,
    high_price DECIMAL(20,8) NOT NULL,
    low_price DECIMAL(20,8) NOT NULL,
    close_price DECIMAL(20,8) NOT NULL,
    volume DECIMAL(20,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 Testing

### Run Test Suite
```bash
node test_forex_bot.js
```

The test suite verifies:
- ✅ Server health and connectivity
- ✅ Price endpoint functionality
- ✅ Historical data retrieval
- ✅ Bulk fetch operations
- ✅ Real-time streaming
- ✅ Database storage simulation
- ✅ Performance and reliability

### Manual Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test price endpoint
curl http://localhost:3001/api/yfinance/price/EUR%2FUSD

# Test historical endpoint
curl http://localhost:3001/api/yfinance/historical/EUR%2FUSD/5m
```

## 📊 Monitoring & Logging

### Real-Time Logs
The system provides comprehensive logging with color-coded output:
- 🚀 **Startup**: Service initialization and configuration
- 📊 **Data Fetching**: Real-time data retrieval status
- ✅ **Success**: Successful operations and data storage
- ⚠️ **Warnings**: Non-critical issues and fallbacks
- ❌ **Errors**: Critical failures and error details

### Health Monitoring
- **Uptime Tracking**: Service uptime and availability
- **Memory Usage**: Real-time memory consumption monitoring
- **Rate Limiting**: Current request count and limits
- **Error Rates**: Failed request tracking and analysis

## 🚨 Troubleshooting

### Common Issues

1. **YFinance Server Not Starting**
   ```bash
   # Check if port 3001 is available
   lsof -i :3001
   
   # Check Node.js version
   node --version
   
   # Check dependencies
   cd server && npm install
   ```

2. **Data Not Being Stored**
   - Verify database connection
   - Check database table structure
   - Verify API endpoints are accessible
   - Check console logs for errors

3. **Rate Limiting Issues**
   - Reduce update frequency (increase interval)
   - Implement request queuing
   - Use bulk endpoints for multiple symbols

4. **Invalid Data**
   - Check symbol mapping
   - Verify timeframe support
   - Review data validation logic

### Debug Mode
Enable detailed logging by setting environment variables:
```bash
export DEBUG=true
export LOG_LEVEL=debug
```

## 🔒 Security & Rate Limiting

### Rate Limiting
- **Default**: 30 requests per minute per endpoint
- **Configurable**: Adjustable via configuration
- **Per-Service**: Separate limits for different services

### Data Validation
- **Input Sanitization**: All inputs are validated and sanitized
- **Price Validation**: Ensures logical price relationships
- **Symbol Validation**: Only allows supported symbols
- **Timeframe Validation**: Restricts to supported intervals

## 📈 Performance Optimization

### Best Practices
1. **Use Bulk Endpoints**: Fetch multiple symbols in single requests
2. **Implement Caching**: Cache frequently accessed data
3. **Optimize Intervals**: Balance update frequency with API limits
4. **Monitor Memory**: Regular memory usage monitoring
5. **Database Indexing**: Proper indexing for query performance

### Scaling Considerations
- **Horizontal Scaling**: Multiple server instances
- **Load Balancing**: Distribute requests across instances
- **Database Sharding**: Partition data by time or symbol
- **CDN Integration**: Cache static data and reduce latency

## 🔄 Updates & Maintenance

### Regular Maintenance
- **Log Rotation**: Prevent log file bloat
- **Database Cleanup**: Archive old data periodically
- **Performance Monitoring**: Track response times and throughput
- **Security Updates**: Keep dependencies updated

### Version Updates
- **Backup Data**: Always backup before updates
- **Test Environment**: Test updates in staging first
- **Rollback Plan**: Maintain ability to rollback changes
- **Documentation**: Update documentation with changes

## 📞 Support & Contributing

### Getting Help
1. Check the troubleshooting section
2. Review console logs and error messages
3. Test individual endpoints manually
4. Verify system requirements and dependencies

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📋 Changelog

### Version 2.0.0 (Current)
- ✅ **Real-time data fetching** from YFinance and Binance
- ✅ **No mock data** - all data is live
- ✅ **Enhanced data validation** and error handling
- ✅ **Comprehensive database storage** for all data
- ✅ **Real-time streaming** capabilities
- ✅ **Advanced rate limiting** and retry logic
- ✅ **Performance monitoring** and health checks

### Version 1.0.0 (Previous)
- Basic YFinance integration
- Simple data storage
- Limited error handling

## 🎯 Roadmap

### Upcoming Features
- [ ] **WebSocket Support**: Real-time bidirectional communication
- [ ] **Advanced Analytics**: Technical indicators and patterns
- [ ] **Alert System**: Price and pattern-based notifications
- [ ] **Mobile App**: Native mobile application
- [ ] **API Documentation**: Interactive API documentation
- [ ] **Docker Support**: Containerized deployment

### Long-term Goals
- [ ] **Machine Learning**: AI-powered market analysis
- [ ] **Multi-Exchange**: Support for additional exchanges
- [ ] **Social Trading**: Community-driven trading signals
- [ ] **Portfolio Management**: Advanced portfolio tracking
- [ ] **Risk Management**: Automated risk assessment

---

## 🚀 Quick Start Summary

1. **Install**: `npm install` in server and binance_service directories
2. **Start**: `./start_forex_bot_system.sh`
3. **Test**: `node test_forex_bot.js`
4. **Monitor**: Check dashboard and database for real-time data
5. **Verify**: Ensure no mock/prefilled data is being used

The system is now ready to fetch real-time forex and crypto data, store it in the database, and provide it to your dashboard for real-time monitoring and analysis.
