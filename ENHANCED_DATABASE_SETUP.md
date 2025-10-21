# Enhanced Database Integration Setup Guide

This guide will help you integrate the enhanced signup, payment, and questionnaire forms with your PostgreSQL database.

## 🎯 What This Integration Provides

- **Enhanced Signup Form**: Captures first name, last name, email, phone, password, company, country, and marketing preferences
- **Enhanced Payment Processing**: Supports Cryptomus payments with cryptocurrency selection and network options
- **Advanced Questionnaire**: Collects trading preferences including prop firms, account types, risk settings, and asset preferences
- **Complete User Profiles**: Unified dashboard data with all user information in one place

## 📋 Prerequisites

1. **PostgreSQL Database**: Running PostgreSQL instance (local or cloud)
2. **Python Environment**: Python 3.8+ with pip
3. **Environment Variables**: DATABASE_URL configured

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
pip install -r requirements-enhanced.txt
```

### 2. Set Environment Variables

```bash
# For local PostgreSQL
export DATABASE_URL="postgresql://username:password@localhost:5432/traderedgepro"

# For production (example with Render/Heroku)
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

### 3. Initialize Database Schema

```bash
# Connect to your PostgreSQL database and run:
psql $DATABASE_URL -f enhanced_database_schema.sql
```

### 4. Start the Enhanced API Server

```bash
python enhanced_working_flask_app.py
```

### 5. Test the Integration

```bash
python test_enhanced_database_integration.py
```

## 📊 Database Schema

The enhanced integration creates these tables:

### `users` Table
- `id` (SERIAL PRIMARY KEY)
- `first_name`, `last_name` (VARCHAR)
- `email` (VARCHAR UNIQUE)
- `password_hash` (VARCHAR)
- `phone`, `company`, `country` (VARCHAR)
- `agree_to_marketing` (BOOLEAN)
- `plan_type` (VARCHAR)
- Timestamps: `created_at`, `updated_at`, `last_login`

### `payments` Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `amount`, `currency` (DECIMAL, VARCHAR)
- `payment_method`, `cryptocurrency`, `network` (VARCHAR)
- `payment_status`, `transaction_id` (VARCHAR)
- `plan_name` (VARCHAR)
- Timestamps: `created_at`, `updated_at`

### `questionnaire_responses` Table
- `id` (SERIAL PRIMARY KEY)
- `user_id` (FOREIGN KEY)
- `prop_firm`, `account_type`, `challenge_step` (VARCHAR)
- `account_size`, `risk_per_trade` (DECIMAL)
- `risk_reward_ratio` (VARCHAR)
- `crypto_assets`, `forex_pairs` (JSONB arrays)
- `account_number` (VARCHAR)
- Timestamps: `created_at`, `updated_at`

## 🔗 API Endpoints

All endpoints are available at `/api/working/`:

### Health Check
```
GET /api/working/health
```

### User Registration
```
POST /api/working/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "SecurePassword123!",
  "company": "Trading LLC",
  "country": "US",
  "terms": true,
  "newsletter": false
}
```

### Payment Processing
```
POST /api/working/payment
Content-Type: application/json

{
  "user_id": 123,
  "payment": {
    "method": "cryptomus",
    "amount": 199.99,
    "currency": "USD",
    "cryptocurrency": "USDT",
    "network": "tron",
    "plan": "Premium Trading Plan"
  }
}
```

### Questionnaire Submission
```
POST /api/working/questionnaire
Content-Type: application/json
Authorization: Bearer token_123_abc...

{
  "user_id": 123,
  "questionnaire": {
    "propFirm": "FTMO",
    "accountType": "Challenge",
    "challengeStep": "Step 1",
    "accountSize": 100000,
    "riskPerTrade": 2.0,
    "riskRewardRatio": "1:2",
    "cryptoAssets": ["BTC", "ETH", "USDT"],
    "forexPairs": ["EURUSD", "GBPUSD"],
    "accountNumber": "FTMO123456"
  }
}
```

### Dashboard Data
```
GET /api/working/dashboard-data
Authorization: Bearer token_123_abc...
```

## 🌐 Frontend Integration

### Update API Base URL

In your HTML files, ensure the API_BASE is set correctly:

```javascript
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000' 
  : 'https://your-api-domain.com';
```

### Form Submission Updates

The enhanced forms now send structured data:

1. **Signup Form**: Sends all user details in a single request
2. **Payment Form**: Includes cryptocurrency and network selection
3. **Questionnaire Form**: Supports arrays of selected assets and detailed preferences

## 🔧 Production Deployment

### 1. Environment Setup

```bash
# Set your production DATABASE_URL
export DATABASE_URL="postgresql://prod_user:prod_pass@prod_host:5432/prod_db"

# Optional: Set Flask environment
export FLASK_ENV="production"
```

### 2. Database Migration

```sql
-- Run on production database
\i enhanced_database_schema.sql
```

### 3. Deploy Enhanced API

Deploy `enhanced_working_flask_app.py` to your production server (Render, Heroku, etc.)

### 4. Update Frontend

Update your frontend to point to the production API URL.

## 🧪 Testing

Run the comprehensive test suite:

```bash
python test_enhanced_database_integration.py
```

This tests:
- ✅ Health endpoint
- ✅ Enhanced registration
- ✅ Enhanced payment processing  
- ✅ Enhanced questionnaire
- ✅ Enhanced dashboard data
- ✅ CORS functionality

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check DATABASE_URL format
   echo $DATABASE_URL
   # Should be: postgresql://user:pass@host:port/dbname
   ```

2. **CORS Errors**
   - Ensure Flask-CORS is installed
   - Check that origins are configured correctly
   - Verify preflight requests are handled

3. **Missing Dependencies**
   ```bash
   pip install -r requirements-enhanced.txt
   ```

4. **Schema Errors**
   ```bash
   # Re-run schema creation
   psql $DATABASE_URL -f enhanced_database_schema.sql
   ```

## 📈 Benefits

- **Complete Data Capture**: All form data is properly stored in PostgreSQL
- **Structured Storage**: Uses proper data types and relationships
- **Performance**: Indexed queries and optimized schema
- **Scalability**: PostgreSQL can handle production workloads
- **Data Integrity**: Foreign key constraints and validation
- **Flexibility**: JSONB fields for complex data structures

## 🎉 Success!

Once setup is complete, your enhanced forms will:

1. **Signup**: Create complete user profiles with all details
2. **Payment**: Process and store payment information with crypto details
3. **Questionnaire**: Capture detailed trading preferences and prop firm data
4. **Dashboard**: Display unified user data from all sources

Your PostgreSQL database now contains all the data from your enhanced signup, payment, and questionnaire pages!
