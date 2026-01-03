# TraderEdge Pro - Professional Trading Signals Platform

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start backend
npm start
```

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
./build-production.sh --test

# Serve production build
npm run serve
```

## 🚀 Render Deployment

### Quick Deploy

```bash
# Use the deployment helper script
./deploy-to-render.sh
```

### Manual Deployment

1. Push your code to a Git repository
2. Connect the repository to Render
3. Render will automatically detect `render.yaml` and deploy all services

## 📋 Project Structure

```
├── src/                          # React frontend source
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   ├── services/                 # API services
│   └── types/                    # TypeScript types
├── journal/                      # Python Flask backend
├── binance_service/              # Binance API service
├── forex_data_service/           # Forex data service
├── customer-service/             # Customer service dashboard
├── lot_size_calculator/          # Lot size calculator service
├── render.yaml                   # Render deployment configuration
├── build-production.sh           # Production build script
├── deploy-to-render.sh           # Deployment helper script
└── RENDER_DEPLOYMENT_GUIDE.md    # Complete deployment guide
```

## 🔧 Configuration

### Environment Variables

* `NODE_ENV`: Environment (development/production)
* `VITE_API_URL`: Backend API URL
* `VITE_APP_ENV`: Application environment

### Build Configuration

* **Vite**: Optimized for React 18 and production
* **TypeScript**: Strict mode enabled
* **Tailwind CSS**: Utility-first CSS framework
* **ESLint**: Code quality and consistency

## 🚨 Recent Fixes & Updates

### ✅ Payment Coupon System Fixed
* **Issue**: Coupons were not properly applying discounted amounts to PayPal/Stripe
* **Fix**: Updated payment flow to properly calculate and pass discounted amounts
* **Result**: Coupons now correctly reduce payment amounts in all payment processors

### ✅ Customer Service & Database Dashboard
* **Issue**: Customer service was using port 5001 with localhost references
* **Fix**: Updated to use port 3005 with proper `/database` route
* **Result**: Access via `/database` instead of `localhost:5001`

### ✅ Real-time Forex News Bot
* **Issue**: Forex news was not getting real-time data
* **Fix**: Integrated RapidAPI Forex Factory scraper with real-time endpoints
* **Result**: Live forex news updates in overview tab of all dashboards

### ✅ Signal Flow System
* **Issue**: Signals from admin weren't properly reaching user dashboard
* **Fix**: Implemented proper signal relay system with WebSocket broadcasting
* **Result**: Real-time signal delivery from admin to user signal feed

### ✅ Enhanced Customer Database
* **Issue**: Missing comprehensive customer data fields
* **Fix**: Added all 4 plan options and comprehensive questionnaire fields
* **Result**: Complete customer profiles with risk management plans

## 🔗 Service URLs (Updated)

### Production Services
* **Main Backend**: `/api` (relative to main domain)
* **Customer Service**: `/customer-service`
* **Database Dashboard**: `/database`
* **Forex Data Service**: `/forex-data`
* **Binance Service**: `/binance-service`

### Local Development
* **Main Backend**: `http://localhost:5000`
* **Customer Service**: `http://localhost:3005`
* **Database Dashboard**: `http://localhost:3005/database`
* **Forex Data Service**: `http://localhost:3004`

## 🧪 Testing

### Run System Tests
```bash
# Test signal flow and system functionality
python test_signals.py

# Test payment system and coupons
python test_payments.py
```

### Test Coverage
* ✅ Signal creation and relay
* ✅ User dashboard signal feed
* ✅ Forex news API integration
* ✅ Customer database functionality
* ✅ Payment coupon system
* ✅ WebSocket connections

## 📊 Forex News Integration

### RapidAPI Configuration
* **Host**: `forex-factory-scraper1.p.rapidapi.com`
* **API Key**: `68dc9d220amsh35ccd500e6b2ff1p13e4e9jsn989df0c5acd2`
* **Endpoint**: `/get_calendar_details`
* **Features**: Real-time forex calendar events, impact levels, currency filtering

### News Features
* Real-time forex economic calendar
* Impact level indicators (High/Medium/Low)
* Currency-specific filtering
* Timezone support
* Fallback to mock data if API fails

## 💳 Payment System

### Supported Coupons
* **TRADERFREE**: Sets price to $0.00 (Free access)
* **INTERNAL_DEV_OVERRIDE_2024**: Sets price to $0.10 (Development testing)

### Payment Processors
* **PayPal**: Full integration with coupon support
* **Stripe**: Credit card processing with coupon support
* **Crypto**: Manual verification system

### Coupon Validation
* Backend validation before payment processing
* Proper amount calculation and verification
* Metadata tracking for audit purposes

## 📈 Signal System

### Signal Flow
1. **Admin Dashboard**: Create signals in crypto/forex data tabs
2. **Signal Relay**: Automatic relay to user feed
3. **WebSocket Broadcast**: Real-time delivery to connected users
4. **User Dashboard**: Display in signal feed tab

### Signal Features
* Real-time WebSocket delivery
* Deduplication and validation
* Confidence scoring
* ICT concepts integration
* Risk management parameters

## 👥 Customer Management

### Enhanced Customer Profiles
* **Plan Selection**: Basic, Professional, Institutional, Elite
* **Trading Experience**: Beginner to Expert levels
* **Risk Tolerance**: Conservative, Moderate, Aggressive
* **Account Balance**: Under $1K to $100K+
* **Trading Goals**: Capital preservation, income generation, growth, speculation

### Risk Management Plans
* **Plan Types**: Conservative, Balanced, Aggressive, Custom
* **Risk Parameters**: Per-trade, daily, weekly, monthly limits
* **Position Sizing**: Maximum position and open trade limits
* **Market Conditions**: Preferred markets, volatility filters
* **Time Restrictions**: Trading hours, news avoidance

## 🚀 Deployment

### Render Services
* **trading-journal-backend**: Main Python backend (Port 5000)
* **trading-bot-frontend**: React frontend (Port 3000)
* **customer-service**: Customer management (Port 3005)
* **forex-data-service**: Forex data and news (Port 3004)
* **binance-service**: Crypto data (Port 5010)

### Health Checks
* All services include health check endpoints
* Automatic monitoring and restart on failure
* Proper error handling and logging

## 📚 Documentation

* **RENDER_DEPLOYMENT_GUIDE.md**: Complete deployment guide
* **RENDER_FIXES_SUMMARY.md**: Technical fixes summary
* **production.env**: Production environment variables
* **test_signals.py**: System functionality tests
* **test_payments.py**: Payment system tests

## 🛠️ Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run build:production # Production build with optimizations
npm run serve            # Serve production build locally
npm run lint             # Run ESLint
npm start                # Start Python backend
```

## 🚀 Deployment Scripts

```bash
./build-production.sh    # Automated production build
./deploy-to-render.sh    # Deploy to Render helper
```

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**: Check Node.js version (18.17.0+)
2. **Runtime Errors**: Verify environment variables
3. **Performance Issues**: Check bundle optimization
4. **Payment Issues**: Verify coupon validation
5. **Signal Issues**: Check WebSocket connections

### Getting Help

* Check the deployment guides
* Review build logs in Render dashboard
* Test builds locally before deploying
* Run test scripts to verify functionality

## 📊 Performance

### Build Optimizations

* **Chunk Splitting**: Optimized vendor bundle organization
* **Minification**: Terser optimization for production
* **Asset Optimization**: Proper CSS, JS, and image handling
* **Code Splitting**: Efficient module loading

### Production Features

* **Error Boundaries**: Graceful error handling
* **Loading States**: User-friendly loading experiences
* **Performance Monitoring**: Bundle size optimization
* **Health Checks**: Service availability monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly using provided test scripts
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

---

**Status**: ✅ **Production Ready** - All issues resolved and tested  
**Deployment**: 🚀 **Render Optimized** - Complete deployment configuration  
**Performance**: ⚡ **Optimized** - Build and runtime optimizations complete  
**Testing**: 🧪 **Comprehensive** - Automated test scripts included  
**Coupons**: 💳 **Fixed** - Payment system properly handles discounts  
**News**: 📰 **Real-time** - Live forex news integration complete  
**Signals**: 📡 **Real-time** - WebSocket-based signal delivery  
**Database**: 🗄️ **Enhanced** - Complete customer profiles and plans
