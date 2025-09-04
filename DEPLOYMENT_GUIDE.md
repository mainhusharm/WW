# Dynamic Trading Platform - Deployment Guide

## Overview
This guide covers the complete deployment of your dynamic trading platform with real-time data flow and proper database connectivity.

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB instance
- Stripe account for payments
- RapidAPI account for ForexFactory data
- Pusher account for real-time updates

## Environment Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB=trading_platform

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# RapidAPI Configuration
RAPIDAPI_KEY=68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2

# Pusher Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret

# Email Configuration
EMAIL_SERVICE_API_KEY=your_email_service_key
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Database Setup
```bash
npm run setup-db
```

This will create all necessary collections and indexes in MongoDB.

## Key Features Implemented

### 1. Dynamic Questionnaire Flow
- **File**: `src/api/questionnaire/submit.js`
- **Component**: `src/components/Questionnaire/QuestionnaireForm.jsx`
- **Features**:
  - Returns correct onboarding steps based on account type selection
  - Stores questionnaire data in MongoDB
  - Dynamic step mapping (instant: 2 steps, standard: 3 steps, pro: 4 steps)

### 2. Payment Integration with Database
- **File**: `src/api/payment/webhook.js`
- **Features**:
  - Stripe webhook integration
  - Automatic customer creation in database
  - User status updates after payment
  - Welcome email sending

### 3. Real-time Performance Analytics
- **File**: `src/api/analytics/performance.js`
- **Component**: `src/components/PerformanceAnalytics.tsx`
- **Features**:
  - No mock data - only real trading data
  - Dynamic calculations (win rate, Sharpe ratio, max drawdown)
  - Real-time chart generation
  - Proper error handling for no data scenarios

### 4. ForexFactory News Integration
- **File**: `src/api/news/forex-factory.js`
- **Component**: `src/components/News/ForexNews.jsx`
- **Features**:
  - Real-time news fetching from ForexFactory API
  - 5-minute caching for performance
  - Fallback to cached data if API fails
  - Currency filtering

### 5. Signal Flow System
- **Files**: 
  - `src/api/signals/generate.js` (Admin)
  - `src/api/signals/user-signals.js` (User)
  - `src/components/Signals/UserSignalDashboard.jsx`
- **Features**:
  - Real-time signal generation from admin
  - Instant delivery to user dashboards via Pusher
  - Signal expiration (24 hours)
  - Performance tracking (views, trades, success rate)

## Database Collections

### Collections Created:
1. **users** - User accounts and authentication
2. **customers** - Customer service data
3. **questionnaires** - Questionnaire responses
4. **trades** - Trading history and performance
5. **signals** - Trading signals with TTL
6. **notifications** - User notifications
7. **news_cache** - Cached news data with TTL

### Indexes Created:
- Email uniqueness constraints
- Performance-optimized query indexes
- TTL indexes for automatic cleanup

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage:
- Questionnaire flow integration
- Payment webhook processing
- Performance analytics calculations
- News API functionality
- Signal generation and distribution

## Deployment Steps

### 1. Build Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Verify Deployment
- Test questionnaire flow
- Verify payment processing
- Check real-time data feeds
- Confirm signal distribution

## Monitoring & Maintenance

### Key Metrics to Monitor:
- Database connection health
- API response times
- Signal delivery success rate
- Payment processing success rate
- News API rate limits

### Regular Maintenance:
- Monitor MongoDB indexes performance
- Clean up expired signals and cached data
- Update API keys as needed
- Monitor Pusher connection limits

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**
   - Verify MongoDB URI and credentials
   - Check network connectivity
   - Ensure database exists

2. **API Rate Limits**
   - Monitor ForexFactory API usage
   - Implement proper caching
   - Consider API key rotation

3. **Real-time Updates Not Working**
   - Verify Pusher configuration
   - Check WebSocket connections
   - Monitor Pusher dashboard

4. **Payment Processing Issues**
   - Verify Stripe webhook configuration
   - Check webhook endpoint accessibility
   - Monitor Stripe dashboard for errors

## Security Considerations

- All API keys stored in environment variables
- Database connections use SSL/TLS
- Webhook signatures verified
- User data properly encrypted
- Rate limiting implemented

## Performance Optimization

- Database indexes for fast queries
- News data caching (5-minute TTL)
- Signal expiration (24-hour TTL)
- Efficient real-time updates via Pusher
- Optimized API response formats

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify environment variables
3. Test individual API endpoints
4. Monitor database and external API health
5. Review Pusher and Stripe dashboards

This deployment ensures a fully dynamic, real-time trading platform with proper database connectivity and no mock data dependencies.