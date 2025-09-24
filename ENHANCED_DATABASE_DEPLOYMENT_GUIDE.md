# 🚀 Enhanced Database Deployment Guide

## 📋 Overview
This guide will help you deploy the enhanced database schema and routes to fix the data storage issue on https://www.traderedgepro.com/

## ⚠️ CRITICAL: The Problem
Your live site is **NOT saving data** because:
1. Your Flask routes are using old SQLAlchemy models (`User`, `RiskPlan`, `UserProgress`)
2. The new enhanced database schema is not connected to your live routes
3. Forms are submitting to endpoints that don't use the comprehensive database structure

## 🎯 Solution: Enhanced Routes
I've created new Flask routes that connect directly to your PostgreSQL database using the enhanced schema.

---

## 📁 Files Created

### 1. **Enhanced Routes**
- `journal/enhanced_user_routes.py` - New routes using PostgreSQL directly
- `journal/enhanced_app.py` - Standalone Flask app (optional)
- `journal/requirements-enhanced.txt` - Dependencies

### 2. **Database Schema** (Already Created)
- `database_migration_complete.sql` - Complete migration script
- `comprehensive_enhanced_database_schema*.sql` - Schema parts
- `src/services/enhancedDatabaseService.ts` - TypeScript service

---

## 🔧 Deployment Steps

### Step 1: Run Database Migration
```bash
# Connect to your PostgreSQL database
psql -h dpg-d37pd8nfte5s73bfl1ug-a.oregon-postgres.render.com \
     -U pghero_dpg_d2v9i7er433s73f0878g_a_cdm2_user \
     -d pghero_dpg_d2v9i7er433s73f0878g_a_cdm2 \
     -f database_migration_complete.sql
```

### Step 2: Install Enhanced Dependencies
```bash
cd journal
pip install -r requirements-enhanced.txt
```

### Step 3: Test Enhanced Routes Locally
```bash
# Test the enhanced Flask app
python enhanced_app.py

# Test health endpoint
curl http://localhost:5000/api/enhanced/health
```

### Step 4: Update Your Live Application

#### Option A: Update Existing Flask App (Recommended)
Your main Flask app (`journal/__init__.py`) has been updated to include the enhanced routes automatically.

#### Option B: Deploy Separate Enhanced Service
Deploy `enhanced_app.py` as a separate service on Render.com

---

## 🌐 New API Endpoints

### Enhanced Registration
```
POST /api/enhanced/register
```
**Captures ALL signup data:**
- first_name, last_name, email, phone, company, country
- agree_to_terms, agree_to_marketing, privacy_policy_accepted
- registration_ip, user_agent, referral_source

### Enhanced Payment Processing
```
POST /api/enhanced/payment
```
**Captures ALL payment data:**
- plan_type, plan_name, original_price, final_price
- coupon_code, discount_amount, payment_method
- transaction_id, crypto details, billing info

### Enhanced Questionnaire
```
POST /api/enhanced/questionnaire
```
**Captures ALL questionnaire data:**
- trading_experience, prop_firm, account_type, account_size
- risk_percentage, crypto_assets, forex_assets
- trading_psychology, risk_tolerance, account_screenshot

### Enhanced Dashboard Data
```
GET /api/enhanced/dashboard-data
```
**Returns comprehensive dashboard data:**
- current_equity, total_pnl, win_rate
- signals_taken, signals_won, signals_lost
- milestone_access_level, prop_firm details

---

## 🔄 Frontend Integration

### Update Your Frontend Forms

#### 1. Signup Form
```javascript
// Change from:
fetch('/api/user/register', ...)

// To:
fetch('/api/enhanced/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: formData.email,
    password: formData.password,
    first_name: formData.firstName,
    last_name: formData.lastName,
    phone: formData.phone,
    company: formData.company,
    country: formData.country,
    agree_to_terms: formData.agreeToTerms,
    agree_to_marketing: formData.agreeToMarketing,
    privacy_policy_accepted: formData.privacyAccepted
  })
})
```

#### 2. Payment Form
```javascript
// Change from:
fetch('/api/verify-payment', ...)

// To:
fetch('/api/enhanced/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: userId,
    plan_type: 'pro',
    plan_name: 'Pro Plan',
    payment_method: 'stripe',
    original_price: 199.00,
    final_price: 179.10,
    coupon_code: 'SAVE10',
    transaction_id: paymentIntent.id
  })
})
```

#### 3. Questionnaire Form
```javascript
// Change from:
fetch('/api/user/questionnaire', ...)

// To:
fetch('/api/enhanced/questionnaire', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    trades_per_day: '3-5',
    trading_session: 'us',
    crypto_assets: ['BTC', 'ETH'],
    forex_assets: ['EURUSD', 'GBPUSD'],
    has_account: 'yes',
    prop_firm: 'FTMO',
    account_type: 'Pro',
    account_size: 100000,
    risk_percentage: 2.0
  })
})
```

---

## 🧪 Testing

### 1. Test Database Connection
```bash
node src/scripts/testEnhancedDatabase.js
```

### 2. Test Enhanced Health Endpoint
```bash
curl https://your-app.onrender.com/api/enhanced/health
```

### 3. Test Registration
```bash
curl -X POST https://your-app.onrender.com/api/enhanced/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "+1234567890",
    "company": "Test Corp",
    "country": "USA"
  }'
```

---

## 📊 Data Verification

After deployment, verify data is being saved:

### 1. Check User Registration
```sql
SELECT * FROM users ORDER BY created_at DESC LIMIT 5;
```

### 2. Check Payment Details
```sql
SELECT * FROM payment_details ORDER BY created_at DESC LIMIT 5;
```

### 3. Check Questionnaire Data
```sql
SELECT * FROM questionnaire_details ORDER BY created_at DESC LIMIT 5;
```

### 4. Check Dashboard Data
```sql
SELECT * FROM user_dashboard_data ORDER BY created_at DESC LIMIT 5;
```

---

## 🚨 Immediate Action Required

1. **Run the database migration** to create the enhanced tables
2. **Update your frontend forms** to use the new `/api/enhanced/*` endpoints
3. **Deploy the enhanced routes** to your live server
4. **Test thoroughly** with real form submissions

---

## 🎯 Expected Results

After deployment:
- ✅ **Signup forms** will save: first_name, last_name, phone, company, country, agreements
- ✅ **Payment forms** will save: complete transaction details, coupon info, billing data
- ✅ **Questionnaire forms** will save: prop firm, account details, risk settings, trading preferences
- ✅ **Dashboard** will display: equity tracking, signals taken/won/lost, milestone access

---

## 🆘 Troubleshooting

### Issue: "Table doesn't exist"
**Solution:** Run the database migration script first

### Issue: "Connection refused"
**Solution:** Check your DATABASE_URL environment variable

### Issue: "Data still not saving"
**Solution:** Verify your frontend is calling the new `/api/enhanced/*` endpoints

### Issue: "CORS errors"
**Solution:** The enhanced routes include proper CORS headers for traderedgepro.com

---

## 📞 Support

If you encounter issues:
1. Check the enhanced health endpoint: `/api/enhanced/health`
2. Review server logs for error messages
3. Verify database connection with the test script
4. Ensure frontend forms are updated to use new endpoints

**The enhanced database system will capture EVERY detail from your forms and provide comprehensive tracking as requested!**
