# 🗄️ TraderEdge Pro Database Schema Documentation

## 📋 Overview

This document describes the comprehensive database schema for TraderEdge Pro, including all tables, relationships, constraints, and features designed to support the payment page, questionnaire page, and user dashboard functionality.

## 🎯 Key Features

- **4 Plan Types**: kickstarter, basic, pro, enterprise
- **Data Immutability**: Prevents modification after creation for critical data
- **Comprehensive Payment Tracking**: All payment fields and transaction details
- **Detailed Questionnaire**: Complete trading preferences and risk assessment
- **Connected Dashboard Data**: User dashboard data linked to questionnaire answers
- **Audit Trail**: Complete tracking of data creation and modifications

## 📊 Database Tables

### 1. Users Table (Enhanced)

**Purpose**: Core user information with updated plan types

**Key Fields**:
- `id`: Primary key
- `uuid`: Unique identifier for API usage
- `plan_type`: ENUM('kickstarter', 'basic', 'pro', 'enterprise')
- `email`, `username`: User identification
- `trading_experience`, `risk_tolerance`: Trading preferences

**Constraints**:
- Plan type must be one of the 4 valid options
- Email must be unique
- UUID must be unique

### 2. Payment Details Table

**Purpose**: Comprehensive payment tracking for all transactions

**Key Fields**:
- `plan_type`: ENUM('kickstarter', 'basic', 'pro', 'enterprise')
- `original_price`, `final_price`: Pricing information
- `discount_amount`, `coupon_code`: Discount tracking
- `payment_method`: stripe, paypal, bank_transfer, crypto
- `payment_status`: pending, processing, completed, failed, cancelled, refunded
- `transaction_id`: Unique transaction identifier
- `billing_*`: Complete billing information
- `payment_data`: JSONB for provider-specific data

**Immutability**: Data cannot be modified after payment completion

**Indexes**:
- `idx_payment_details_user_id`
- `idx_payment_details_transaction_id`
- `idx_payment_details_payment_status`

### 3. Questionnaire Details Table

**Purpose**: Complete trading preferences and risk assessment

**Key Fields**:
- **Personal Info**: `first_name`, `last_name`, `phone`, `country`
- **Trading Experience**: `trading_experience`, `trading_goals`, `trading_style`
- **Trading Preferences**: `trades_per_day`, `trading_session`, `preferred_trading_hours`
- **Asset Preferences**: `crypto_assets[]`, `forex_assets[]`, `custom_forex_pairs[]`
- **Account Info**: `has_account`, `account_equity`, `prop_firm`, `account_type`, `account_size`
- **Risk Management**: `risk_percentage`, `risk_reward_ratio`, `max_daily_loss_percentage`
- **Risk Assessment**: `risk_tolerance`, `volatility_tolerance`, `drawdown_tolerance`
- **Trading Psychology**: `emotional_control`, `discipline_level`, `stress_management`
- **Screenshot**: `account_screenshot`, `screenshot_filename`, `screenshot_size`

**Immutability**: Data cannot be modified after completion

**Indexes**:
- `idx_questionnaire_details_user_id`
- `idx_questionnaire_details_trading_experience`

### 4. User Dashboard Data Table

**Purpose**: Dashboard data connected to questionnaire answers

**Key Fields**:
- **Profile Data**: `prop_firm`, `account_type`, `account_size`, `trading_experience`
- **Performance Metrics**: `account_balance`, `total_pnl`, `win_rate`, `total_trades`
- **Risk Metrics**: `max_drawdown`, `current_drawdown`, `sharpe_ratio`
- **Trading Statistics**: `winning_trades`, `losing_trades`, `average_win`, `average_loss`
- **Risk Protocol**: `max_daily_risk`, `risk_per_trade_amount`, `daily_loss_limit`
- **Dashboard Settings**: `selected_theme`, `notifications_enabled`, `auto_refresh`
- **Tab Data**:
  - `overview_stats`: Overview tab data
  - `risk_metrics`: Risk protocol tab data
  - `prop_firm_rules`: Prop firm rules tab data

**Connection**: Linked to questionnaire via `questionnaire_id`

**Indexes**:
- `idx_user_dashboard_data_user_id`
- `idx_user_dashboard_data_questionnaire_id`

## 🔗 Table Relationships

```mermaid
graph TD
    A[Users] -->|1:1| B[Payment Details]
    A -->|1:1| C[Questionnaire Details]
    C -->|1:1| D[User Dashboard Data]
    A -->|1:1| D
    
    A -->|id, uuid| B
    A -->|id, uuid| C
    C -->|questionnaire_id| D
    A -->|id, uuid| D
```

## 🔒 Security & Immutability

### Data Immutability Constraints

1. **Payment Data**: Cannot be modified after `payment_status = 'completed'`
2. **Questionnaire Data**: Cannot be modified after `completed_at` is set
3. **Dashboard Data**: Core data protected with audit constraints

### Audit Trail

All tables include:
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp
- `created_by`: Who created the record
- `updated_by`: Who last modified the record

## 📈 Views for Common Queries

### 1. User Complete Profile View

```sql
SELECT 
    u.id, u.uuid, u.username, u.email, u.plan_type,
    pd.plan_name, pd.payment_status, pd.final_price,
    qd.trading_experience, qd.prop_firm, qd.account_size,
    udd.account_balance, udd.total_pnl, udd.win_rate
FROM users u
LEFT JOIN payment_details pd ON u.id = pd.user_id
LEFT JOIN questionnaire_details qd ON u.id = qd.user_id
LEFT JOIN user_dashboard_data udd ON u.id = udd.user_id;
```

### 2. Dashboard Overview View

```sql
SELECT 
    udd.user_id, udd.prop_firm, udd.account_balance,
    udd.total_pnl, udd.win_rate, udd.total_trades,
    udd.max_drawdown, udd.overview_stats
FROM user_dashboard_data udd;
```

## 🎯 Dashboard Integration

### Overview Tab Data Structure

```json
{
  "overview_stats": {
    "account_balance": 10000.00,
    "total_pnl": 1500.00,
    "win_rate": 65.5,
    "total_trades": 45,
    "daily_pnl": 125.50,
    "weekly_pnl": 750.00,
    "monthly_pnl": 1500.00
  },
  "performance_summary": {
    "profit_factor": 1.85,
    "sharpe_ratio": 1.42,
    "max_drawdown": 5.2,
    "current_drawdown": 1.8
  }
}
```

### Risk Protocol Tab Data Structure

```json
{
  "risk_metrics": {
    "max_daily_risk": 200.00,
    "risk_per_trade": 100.00,
    "daily_loss_limit": 500.00,
    "consecutive_losses": 3
  },
  "risk_alerts": [
    {
      "type": "daily_loss_limit",
      "message": "Approaching daily loss limit",
      "severity": "warning"
    }
  ]
}
```

### Prop Firm Rules Tab Data Structure

```json
{
  "prop_firm_rules": {
    "max_daily_loss": 5.0,
    "max_drawdown": 10.0,
    "profit_target": 8.0,
    "trading_days": 30
  },
  "rule_violations": [],
  "compliance_status": "compliant"
}
```

## 🚀 Setup Instructions

### 1. Run Database Schema

```bash
# Set your database URL
export DATABASE_URL="postgresql://username:password@host:port/database"

# Run the setup script
python execute_database_setup.py
```

### 2. Manual Setup (Alternative)

```sql
-- Run in your PostgreSQL client
\i comprehensive_database_schema.sql
\i database_migration_script.sql
```

## 📊 Data Validation

### Plan Type Validation

```sql
-- All plan types must be valid
SELECT plan_type, COUNT(*) 
FROM users 
GROUP BY plan_type;
-- Should only show: kickstarter, basic, pro, enterprise
```

### Data Integrity Checks

```sql
-- Check questionnaire completion
SELECT 
    COUNT(*) as total_users,
    COUNT(qd.id) as completed_questionnaires,
    COUNT(udd.id) as dashboard_records
FROM users u
LEFT JOIN questionnaire_details qd ON u.id = qd.user_id
LEFT JOIN user_dashboard_data udd ON u.id = udd.user_id;
```

## 🔧 Maintenance

### Regular Tasks

1. **Monitor Data Integrity**: Check foreign key constraints
2. **Audit Trail Review**: Monitor data modification patterns
3. **Performance Monitoring**: Check index usage
4. **Backup Verification**: Ensure data immutability is working

### Common Queries

```sql
-- Get user with complete profile
SELECT * FROM user_complete_profile WHERE user_id = ?;

-- Get dashboard data for user
SELECT * FROM dashboard_overview WHERE user_id = ?;

-- Check payment status
SELECT user_email, plan_type, payment_status, final_price 
FROM payment_details 
WHERE payment_status = 'completed';
```

## 🎉 Benefits

1. **Complete Data Capture**: All payment, questionnaire, and dashboard fields
2. **Data Integrity**: Immutability constraints prevent data corruption
3. **Performance**: Optimized indexes for fast queries
4. **Scalability**: JSONB fields for flexible data storage
5. **Audit Trail**: Complete tracking of all data changes
6. **Dashboard Integration**: Seamless connection between questionnaire and dashboard
7. **Plan Management**: Proper support for all 4 plan types

## 📞 Support

For questions about this database schema, please refer to:
- Database migration logs
- Application error logs
- PostgreSQL documentation
- TraderEdge Pro development team

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Database**: PostgreSQL 12+
