# 24/7 Automated Trading System

A fully automated trading system that runs your forex and crypto bots continuously without manual intervention.

## Features

- **Automated Analysis**: Runs analysis on configured pairs at set intervals
- **Risk Management**: Built-in position sizing and daily loss limits
- **Multi-Market Support**: Forex and crypto trading
- **Real-time Monitoring**: Continuous trade monitoring and management
- **Configurable**: Easy JSON-based configuration
- **Notifications**: Webhook, email, and Telegram alerts
- **24/7 Operation**: Designed for cloud deployment

## Quick Start

### 1. Install Dependencies
```bash
cd automated-trading-system
npm install
```

### 2. Configure Your Settings
Edit `config.json` to set:
- Trading pairs and timeframes
- Risk management parameters
- Analysis intervals
- Notification settings

### 3. Start the System
```bash
npm start
```

### 4. Control via API
- **Start Trading**: `POST /start`
- **Stop Trading**: `POST /stop` 
- **Check Status**: `GET /status`
- **Update Config**: `POST /config`

## Configuration

### Trading Pairs
```json
{
  "symbol": "EUR/USD",
  "timeframes": ["1h", "4h"],
  "risk_reward": {
    "risk_percent": 2,
    "reward_ratio": 2.5
  },
  "enabled": true
}
```

### Risk Management
- `max_concurrent_trades`: Maximum simultaneous positions
- `daily_loss_limit_percent`: Stop trading if daily loss exceeds this
- `account_balance`: Your trading account balance
- `position_sizing`: Position calculation method

### Schedule
- `analysis_interval_minutes`: How often to analyze markets (default: 30)
- `market_hours`: Trading session times

## Deployment Options

### Option 1: Local Development
```bash
npm start
```

### Option 2: Docker Compose (Recommended)
```bash
docker-compose up -d
```

### Option 3: Cloud Deployment
Deploy to Render, AWS, or any cloud provider that supports Node.js

## API Endpoints

- `GET /status` - System status and active trades
- `POST /start` - Start automated trading
- `POST /stop` - Stop automated trading  
- `POST /config` - Update configuration

## How It Works

1. **Scheduler**: Runs analysis every X minutes based on config
2. **Analysis**: Calls your trading bot for each enabled pair/timeframe
3. **Execution**: Places trades when signals meet confidence threshold
4. **Monitoring**: Continuously monitors active trades for SL/TP
5. **Management**: Closes trades and manages risk automatically

## Safety Features

- Daily loss limits
- Maximum concurrent trades
- Confidence thresholds
- Market hours restrictions
- Emergency stop functionality

## Monitoring

The system provides real-time status via:
- API endpoints
- Console logging
- Notification alerts
- Daily statistics

## Next Steps

1. Configure your trading parameters in `config.json`
2. Test with small position sizes first
3. Monitor performance and adjust settings
4. Scale up once comfortable with automation
5. Deploy to cloud for true 24/7 operation
