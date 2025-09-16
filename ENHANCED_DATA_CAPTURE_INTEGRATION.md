# 📊 Enhanced Data Capture Integration

## Overview

The Enhanced Data Capture Integration extends the existing signup-enhanced system to automatically capture and store data from:
- **Payment-enhanced** endpoint
- **Questionnaire** endpoint  
- **Dashboard** endpoint

All data is stored in the same database (`trading_bots.db`) used by signup-enhanced, ensuring seamless integration without modifying existing functionality.

## 🏗️ Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Frontend Apps     │    │   Backend Services   │    │     Database        │
│                     │    │                     │    │                     │
│ • EnhancedPayment   │────│ • Signup Enhanced   │────│   trading_bots.db   │
│ • Questionnaire     │    │   (Port 5001)       │    │                     │
│ • Dashboard         │    │                     │    │ • users             │
│                     │    │ • Enhanced Data     │    │ • payment_data      │
│ • Frontend          │────│   Capture System    │────│ • questionnaire_data│
│   Integration       │    │   (Port 5003)       │    │ • dashboard_data    │
│   (Auto-capture)    │    │                     │    │ • audit_logs        │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

## 🚀 Quick Start

### 1. Start the Enhanced Data Capture System

```bash
# Method 1: Use the startup manager (Recommended)
python start_enhanced_data_capture.py

# Method 2: Start services manually
python enhanced_signup_handler.py &        # Port 5001
python enhanced_data_capture_system.py &   # Port 5003
```

### 2. Test the Integration

```bash
python test_enhanced_data_capture.py
```

### 3. Include Frontend Integration

Add to your HTML pages:
```html
<script src="frontend_data_capture_integration.js"></script>
```

## 📋 Database Schema

### Extended Tables (Added to existing `trading_bots.db`)

#### `payment_data`
Captures all payment information from payment-enhanced:
```sql
CREATE TABLE payment_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT NOT NULL,
    user_name TEXT,
    plan_name TEXT,
    original_price DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    final_price DECIMAL(10,2),
    coupon_code TEXT,
    payment_method TEXT,
    transaction_id TEXT,
    payment_status TEXT,
    payment_processor TEXT,
    crypto_transaction_hash TEXT,
    crypto_from_address TEXT,
    crypto_amount TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users (email)
);
```

#### `questionnaire_data`
Captures all questionnaire responses:
```sql
CREATE TABLE questionnaire_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT NOT NULL,
    user_name TEXT,
    trades_per_day TEXT,
    trading_session TEXT,
    crypto_assets TEXT, -- JSON array
    forex_assets TEXT, -- JSON array
    custom_forex_pairs TEXT, -- JSON array
    has_account TEXT,
    account_equity DECIMAL(12,2),
    prop_firm TEXT,
    account_type TEXT,
    account_size DECIMAL(12,2),
    risk_percentage DECIMAL(5,2),
    risk_reward_ratio TEXT,
    account_screenshot TEXT, -- base64 encoded
    screenshot_filename TEXT,
    screenshot_size INTEGER,
    screenshot_type TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users (email)
);
```

#### `dashboard_data`
Captures trading state and performance metrics:
```sql
CREATE TABLE dashboard_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT NOT NULL,
    user_name TEXT,
    -- Trading State Data
    initial_equity DECIMAL(12,2),
    current_equity DECIMAL(12,2),
    total_pnl DECIMAL(12,2),
    win_rate DECIMAL(5,2),
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    average_win DECIMAL(10,2),
    average_loss DECIMAL(10,2),
    profit_factor DECIMAL(10,4),
    max_drawdown DECIMAL(10,2),
    current_drawdown DECIMAL(10,2),
    gross_profit DECIMAL(12,2),
    gross_loss DECIMAL(12,2),
    consecutive_wins INTEGER,
    consecutive_losses INTEGER,
    -- Risk Settings
    risk_per_trade DECIMAL(5,2),
    daily_loss_limit DECIMAL(5,2),
    consecutive_losses_limit INTEGER,
    -- Account Balance Info
    account_balance DECIMAL(12,2),
    account_equity_dash DECIMAL(12,2),
    -- Theme and UI
    theme TEXT DEFAULT 'dark',
    -- Complete states (JSON)
    dashboard_state TEXT,
    trading_state TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users (email)
);
```

#### `data_capture_audit`
Audit trail for all data capture operations:
```sql
CREATE TABLE data_capture_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT NOT NULL,
    capture_type TEXT NOT NULL, -- 'payment', 'questionnaire', 'dashboard'
    data_snapshot TEXT, -- JSON snapshot
    source_endpoint TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'success',
    error_details TEXT,
    FOREIGN KEY (user_email) REFERENCES users (email)
);
```

## 🔄 API Endpoints

### Enhanced Data Capture Service (Port 5003)

#### Capture Payment Data
```http
POST /api/data-capture/payment
Content-Type: application/json

{
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "plan_name_payment": "Premium Plan",
  "original_price": 99.99,
  "discount_amount": 10.00,
  "final_price": 89.99,
  "coupon_code": "SAVE10",
  "payment_method": "paypal",
  "transaction_id": "TXN-12345",
  "payment_status": "completed",
  "payment_processor": "PayPal"
}
```

#### Capture Questionnaire Data
```http
POST /api/data-capture/questionnaire
Content-Type: application/json

{
  "user_email": "user@example.com",
  "user_name": "John Doe",
  "tradesPerDay": "1-5",
  "tradingSession": "london",
  "cryptoAssets": ["BTC/USD", "ETH/USD"],
  "forexAssets": ["EUR/USD", "GBP/USD"],
  "hasAccount": "yes",
  "accountEquity": 50000,
  "propFirm": "FTMO",
  "accountType": "Challenge",
  "accountSize": 100000,
  "riskPercentage": 1.5,
  "riskRewardRatio": "1:2.5"
}
```

#### Capture Dashboard Data
```http
POST /api/data-capture/dashboard
Content-Type: application/json

{
  "user_email": "user@example.com",
  "dashboardData": {
    "account": {"balance": 102500.75, "equity": 102500.75},
    "performance": {"totalPnl": 2500.75, "winRate": 68.5, "totalTrades": 25}
  },
  "tradingState": {
    "initialEquity": 100000,
    "currentEquity": 102500.75,
    "performanceMetrics": {...},
    "riskSettings": {...}
  },
  "theme": "dark"
}
```

#### Get User Statistics
```http
GET /api/data-capture/stats/{user_email}
```

Response:
```json
{
  "user_email": "user@example.com",
  "data_counts": {
    "payments": 1,
    "questionnaires": 1,
    "dashboard_updates": 15,
    "activities": 45,
    "audit_records": 62
  },
  "latest_timestamps": {
    "payment": "2024-01-15T10:30:00Z",
    "questionnaire": "2024-01-15T11:00:00Z",
    "dashboard": "2024-01-15T15:45:00Z"
  },
  "total_data_points": 62
}
```

## 🔧 Frontend Integration

### Automatic Integration

The frontend integration automatically captures data from existing functions:

```javascript
// Include the integration script
<script src="frontend_data_capture_integration.js"></script>

// Your existing functions will automatically be enhanced:
// - savePaymentToSupabase()      → also captures to enhanced system
// - storeQuestionnaireData()     → also captures to enhanced system  
// - saveDashboardToSupabase()    → also captures to enhanced system
```

### Manual Integration

For custom implementations:

```javascript
// Payment capture
await enhancedDataCapture.capturePaymentData({
  user_email: user.email,
  plan_name_payment: "Premium Plan",
  final_price: 89.99,
  payment_method: "paypal",
  payment_status: "completed"
});

// Questionnaire capture
await enhancedDataCapture.captureQuestionnaireData({
  user_email: user.email,
  tradesPerDay: "1-5",
  propFirm: "FTMO",
  accountSize: 100000,
  riskPercentage: 1.5
});

// Dashboard capture
await enhancedDataCapture.captureDashboardData(
  dashboardData, 
  tradingState, 
  "dark"
);
```

## 💾 Data Flow

### 1. User Signup (Existing - Unchanged)
```
User fills signup form → Enhanced Signup Handler → users table
```

### 2. Payment Data Capture (New)
```
User completes payment → Frontend payment handler → Enhanced Data Capture → payment_data table
                      → Original Supabase save   → [existing flow continues]
```

### 3. Questionnaire Data Capture (New)
```
User submits questionnaire → Frontend questionnaire handler → Enhanced Data Capture → questionnaire_data table
                          → Original processing             → [existing flow continues]
```

### 4. Dashboard Data Capture (New)
```
Dashboard state changes → Frontend dashboard component → Enhanced Data Capture → dashboard_data table
                       → Original Supabase save        → [existing flow continues]
```

## 🛡️ Security & Privacy

### Data Protection
- All data captured includes IP address and user agent for audit trails
- Database uses SQLite with foreign key constraints
- No sensitive data stored in plaintext (follows existing patterns)

### Access Control
- Enhanced data capture service runs on separate port (5003)
- Inherits same database permissions as signup-enhanced
- All operations logged in audit trail

### GDPR Compliance
- Complete audit trail of all data capture operations
- User email used as primary identifier for data retrieval/deletion
- All timestamps in ISO format for precise record keeping

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Check service health
curl http://localhost:5003/api/data-capture/health

# Check user statistics
curl http://localhost:5003/api/data-capture/stats/user@example.com
```

### Database Queries
```sql
-- Check all data for a user
SELECT 'payment' as type, created_at, user_email FROM payment_data WHERE user_email = 'user@example.com'
UNION ALL
SELECT 'questionnaire' as type, created_at, user_email FROM questionnaire_data WHERE user_email = 'user@example.com'
UNION ALL
SELECT 'dashboard' as type, updated_at, user_email FROM dashboard_data WHERE user_email = 'user@example.com'
ORDER BY created_at DESC;

-- Check audit trail
SELECT * FROM data_capture_audit WHERE user_email = 'user@example.com' ORDER BY timestamp DESC;
```

### Log Analysis
```bash
# View service logs
tail -f enhanced_data_capture.log

# Test specific endpoint
python test_enhanced_data_capture.py
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Services Not Starting
```bash
# Check if ports are available
netstat -an | grep :5001
netstat -an | grep :5003

# Check database permissions
ls -la trading_bots.db
```

#### 2. Data Not Being Captured
- Verify frontend integration is loaded
- Check browser console for errors
- Confirm user email is being passed correctly
- Check service health endpoints

#### 3. Database Errors
```bash
# Check database integrity
sqlite3 trading_bots.db ".schema"
sqlite3 trading_bots.db "PRAGMA integrity_check;"
```

#### 4. Frontend Integration Issues
- Ensure integration script loads before other scripts
- Check that existing functions are being called
- Verify network connectivity to port 5003

### Support Commands

```bash
# Full system test
python test_enhanced_data_capture.py

# Start with debug logging
python enhanced_data_capture_system.py --debug

# Check database content
sqlite3 trading_bots.db "SELECT COUNT(*) FROM payment_data;"
sqlite3 trading_bots.db "SELECT COUNT(*) FROM questionnaire_data;"
sqlite3 trading_bots.db "SELECT COUNT(*) FROM dashboard_data;"
```

## 📈 Benefits

### ✅ **Zero Code Changes Required**
- Existing signup-enhanced functionality remains completely unchanged
- Frontend components continue working as before
- All existing flows preserved

### ✅ **Comprehensive Data Capture**
- Payment transactions with full details
- Complete questionnaire responses
- Real-time dashboard state and trading metrics
- Audit trail for all operations

### ✅ **Unified Database**
- All data stored in same database as signup-enhanced
- Consistent user identification via email
- Easy cross-referencing of user data

### ✅ **Automatic Integration**
- Frontend integration captures data automatically
- No manual intervention required
- Graceful degradation if service unavailable

### ✅ **Production Ready**
- Health checks and monitoring
- Error handling and retry logic
- Comprehensive logging and audit trails
- Easy deployment and management

## 📞 Support

For issues or questions:
1. Run the test suite: `python test_enhanced_data_capture.py`
2. Check the logs for error details
3. Verify all services are running with health checks
4. Review the audit trail in the database

The system is designed to be completely non-intrusive and will not affect existing functionality even if the enhanced data capture service is unavailable.
