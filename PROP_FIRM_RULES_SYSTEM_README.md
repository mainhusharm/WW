# Prop Firm Rules Real-Time Tracking System

## Overview

This system provides real-time tracking and monitoring of prop firm trading rules for 150+ prop firms. It automatically scrapes rule updates from prop firm websites and provides real-time compliance checking to help traders avoid account violations.

## Features

### 🔄 Real-Time Rules Tracking
- **Automated scraping** of 150+ prop firm websites
- **Rule change detection** and automatic updates
- **Source verification** with timestamps
- **Fallback data** when scraping fails

### 📋 4 Critical Rules Tracking
1. **HFT (High Frequency Trading)**
   - Allowed/Not allowed
   - Minimum hold time (e.g., 60 seconds)
   - Maximum trades per day
   - Account termination warnings

2. **Martingale Strategy**
   - Allowed/Not allowed
   - Maximum positions allowed
   - Risk management warnings

3. **Maximum Lot Size**
   - Lot size limits
   - Risk per trade limits
   - Position sizing warnings

4. **Reverse Trading**
   - Allowed/Not allowed
   - Cooldown periods
   - Position switching warnings

### ✅ Real-Time Compliance Checking
- **Live compliance monitoring** during trading
- **Instant warnings** for rule violations
- **Actionable recommendations** to fix issues
- **Risk assessment** before taking trades

## System Architecture

### Backend Components

#### 1. Enhanced PropFirm Model (`journal/models.py`)
```python
class PropFirm(db.Model):
    # Core fields
    name = db.Column(db.String(100), unique=True, nullable=False)
    website = db.Column(db.String(255), nullable=True)
    
    # 4 Critical Rules
    hft_allowed = db.Column(db.Boolean, nullable=True)
    hft_min_hold_time = db.Column(db.Integer, nullable=True)
    hft_max_trades_per_day = db.Column(db.Integer, nullable=True)
    
    martingale_allowed = db.Column(db.Boolean, nullable=True)
    martingale_max_positions = db.Column(db.Integer, nullable=True)
    
    max_lot_size = db.Column(db.Float, nullable=True)
    max_risk_per_trade = db.Column(db.Float, nullable=True)
    
    reverse_trading_allowed = db.Column(db.Boolean, nullable=True)
    reverse_trading_cooldown = db.Column(db.Integer, nullable=True)
    
    # Real-time tracking
    last_updated = db.Column(db.DateTime, nullable=False)
    last_scraped = db.Column(db.DateTime, nullable=True)
    scraping_status = db.Column(db.String(50), nullable=True)
    rules_source_url = db.Column(db.String(500), nullable=True)
```

#### 2. Rules Scraper (`journal/prop_firm_scraper.py`)
- **FTMO Rules Scraper**: Specialized for FTMO website
- **MyForexFunds Scraper**: Specialized for MFF website
- **The5%ers Scraper**: Specialized for The5%ers website
- **QuantTekel Scraper**: Specialized for QuantTekel website
- **Generic Scraper**: For other prop firms

#### 3. API Endpoints (`journal/dashboard_routes.py`)
```python
# Get prop firm rules
GET /api/dashboard/prop-firm-rules?firm_name=FTMO

# Check compliance
POST /api/dashboard/prop-firm-compliance

# Update rules manually
POST /api/dashboard/prop-firm-rules/update

# Trigger scraping
POST /api/dashboard/prop-firm-rules/scrape

# Get all rules
GET /api/dashboard/prop-firm-rules/all
```

### Frontend Components

#### 1. Prop Firm Rules Service (`src/services/propFirmRulesService.ts`)
- API communication
- Compliance checking
- Rules formatting
- Warning generation

#### 2. Prop Firm Compliance Component (`src/components/PropFirmCompliance.tsx`)
- Rules display
- Trading activity input
- Real-time compliance checking
- Warning display

## Installation & Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Migration
```bash
# Run the database migration to add new fields
python -c "
from journal import create_app
from journal.models import db
app = create_app()
with app.app_context():
    db.create_all()
"
```

### 3. Populate Prop Firms Database
```bash
python populate_prop_firms.py
```

### 4. Start the System
```bash
python run.py
```

## Usage

### For Traders

#### 1. Select Your Prop Firm
- Choose from 150+ available prop firms
- View real-time rules and updates
- Check scraping status and last update time

#### 2. Input Trading Activity
- **Hold Time**: How long you plan to hold positions
- **Trades Today**: Number of trades taken today
- **Lot Size**: Size of your position
- **Martingale Positions**: Number of positions in martingale
- **Reverse Trading**: Whether you're taking opposite positions

#### 3. Get Real-Time Compliance
- **Green Checkmark**: Compliant with all rules
- **Red Warning**: Rule violation detected
- **Specific Warnings**: What rules you're breaking
- **Recommendations**: How to fix compliance issues

### For Administrators

#### 1. Manual Rules Update
```bash
curl -X POST http://localhost:5000/api/dashboard/prop-firm-rules/update \
  -H "Content-Type: application/json" \
  -d '{
    "firm_name": "FTMO",
    "rules": {
      "hft_allowed": false,
      "hft_min_hold_time": 60,
      "max_lot_size": 20.0
    }
  }'
```

#### 2. Trigger Mass Scraping
```bash
curl -X POST http://localhost:5000/api/dashboard/prop-firm-rules/scrape
```

#### 3. Monitor Scraping Status
```bash
curl "http://localhost:5000/api/dashboard/prop-firm-rules/all?status=failed"
```

## Real-Time Updates

### Automatic Scraping
- **Scheduled**: Runs every 24 hours
- **Triggered**: Manual scraping on demand
- **Smart**: Only scrapes firms with websites
- **Fallback**: Uses cached data when scraping fails

### Change Detection
- **Rule Changes**: Automatically detected and updated
- **New Rules**: Added to database
- **Removed Rules**: Marked as deprecated
- **Source Updates**: New URLs and verification dates

### Compliance Monitoring
- **Live Checking**: Real-time during trading
- **Warning System**: Immediate alerts for violations
- **Risk Assessment**: Before taking trades
- **Historical Tracking**: Rule change history

## Integration with User Dashboard

### Risk Protocol Tab
- **Prop Firm Selection**: Choose your firm
- **Rules Display**: View all current rules
- **Compliance Checker**: Real-time monitoring
- **Warning System**: Violation alerts

### Signal Taking
- **Pre-Trade Check**: Compliance before execution
- **Risk Assessment**: Lot size and strategy validation
- **Warning Display**: Show compliance issues
- **Recommendations**: How to fix violations

### Account Management
- **Rule Updates**: Notify users of changes
- **Compliance History**: Track rule violations
- **Risk Scoring**: Overall account risk assessment
- **Training Recommendations**: Based on violations

## Supported Prop Firms

### Major Firms (Specialized Scrapers)
- **FTMO**: Complete rules coverage
- **MyForexFunds**: Full compliance tracking
- **The5%ers**: Real-time updates
- **QuantTekel**: Comprehensive monitoring

### Additional Firms (Generic Scraping)
- Apex Trader Funding
- Topstep
- Earn2Trade
- OneUp Trader
- Leeloo Trading
- Traders With Edge
- Fidelcrest
- SurgeTrader
- City Traders Imperium
- Trading Capital
- FundedNext
- The Funded Trader
- BluFX
- Traders Central
- Trading Pro
- Funded Trading Plus
- Traders Academy
- Funded Trader Pro
- Trading Elite

## Compliance Rules Examples

### FTMO Rules
```json
{
  "hft_allowed": false,
  "hft_min_hold_time": 60,
  "hft_max_trades_per_day": 10,
  "martingale_allowed": false,
  "max_lot_size": 20.0,
  "max_risk_per_trade": 5.0,
  "reverse_trading_allowed": false,
  "daily_loss_limit": 5.0,
  "max_drawdown": 10.0
}
```

### MyForexFunds Rules
```json
{
  "hft_allowed": false,
  "hft_min_hold_time": 60,
  "hft_max_trades_per_day": 15,
  "martingale_allowed": false,
  "max_lot_size": 15.0,
  "max_risk_per_trade": 4.0,
  "reverse_trading_allowed": false,
  "daily_loss_limit": 4.0,
  "max_drawdown": 8.0
}
```

## Error Handling

### Scraping Failures
- **Network Issues**: Retry with exponential backoff
- **Website Changes**: Fallback to cached data
- **Rate Limiting**: Respectful delays between requests
- **Invalid Data**: Validation and sanitization

### Database Issues
- **Connection Failures**: Automatic reconnection
- **Data Corruption**: Backup and recovery
- **Migration Errors**: Rollback and retry
- **Constraint Violations**: Data validation

### Frontend Errors
- **API Failures**: Graceful degradation
- **Data Loading**: Loading states and retry buttons
- **Validation Errors**: User-friendly error messages
- **Network Issues**: Offline mode with cached data

## Monitoring & Maintenance

### System Health
- **Scraping Status**: Success/failure rates
- **Database Performance**: Query optimization
- **API Response Times**: Performance monitoring
- **Error Rates**: Automatic alerting

### Data Quality
- **Rule Validation**: Data integrity checks
- **Source Verification**: URL accessibility
- **Update Frequency**: Last update tracking
- **Completeness**: Missing data detection

### Performance Optimization
- **Caching**: Redis for frequently accessed data
- **Background Jobs**: Celery for scraping tasks
- **Database Indexing**: Optimized queries
- **CDN**: Static asset delivery

## Security Considerations

### API Protection
- **Rate Limiting**: Prevent abuse
- **Authentication**: Admin-only endpoints
- **Input Validation**: SQL injection prevention
- **CORS**: Cross-origin request handling

### Data Privacy
- **User Data**: No personal information stored
- **Scraping Ethics**: Respectful web scraping
- **Source Attribution**: Proper credit to sources
- **Terms Compliance**: Website terms adherence

## Future Enhancements

### Planned Features
- **Machine Learning**: Rule change prediction
- **Advanced Scraping**: JavaScript-heavy sites
- **Mobile App**: Native mobile compliance
- **API Integration**: Third-party trading platforms
- **Analytics Dashboard**: Compliance metrics
- **Alert System**: Email/SMS notifications

### Scalability Improvements
- **Microservices**: Distributed architecture
- **Load Balancing**: Multiple server instances
- **Database Sharding**: Horizontal scaling
- **CDN Integration**: Global content delivery

## Support & Troubleshooting

### Common Issues
1. **Scraping Failures**: Check website accessibility
2. **Database Errors**: Verify connection and migrations
3. **API Timeouts**: Increase timeout values
4. **Memory Issues**: Optimize scraping processes

### Getting Help
- **Documentation**: This README and code comments
- **Logs**: Check application and scraping logs
- **Monitoring**: System health dashboard
- **Community**: Developer forums and support

## License

This system is proprietary software. All rights reserved.

---

**Note**: This system is designed to help traders comply with prop firm rules but should not be considered legal or financial advice. Always verify rules directly with your prop firm and consult with qualified professionals.
