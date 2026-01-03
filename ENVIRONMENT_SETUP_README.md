# 🌍 Environment Configuration Setup Guide

This guide explains how to set up your environment configuration using `.env` files to securely manage API keys and configuration.

## 🚀 Quick Start

### 1. Run the Setup Script
```bash
python setup_env.py
```

This will automatically create the necessary `.env` files from the examples.

### 2. Install Required Dependencies
```bash
pip install python-dotenv
```

## 📁 Environment File Structure

```
your-project/
├── .env                    # Fallback environment (gitignored)
├── .env.local             # Local development (gitignored)
├── .env.production        # Production environment (gitignored)
├── env.local.example      # Development template
├── env.production.example # Production template
├── journal/config.py      # Python configuration loader
└── setup_env.py          # Setup script
```

## 🔑 API Keys Configuration

### Development Environment (`.env.local`)
```bash
# Safe test keys for development
STRIPE_PUBLISHABLE_KEY=pk_test_iSQmzHiUwz1pmfaVTSXSEpbx
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
PAYPAL_CLIENT_ID=ASUvkAyi9hd0D6xgfR9LgBvXWcsOg4spZd05tprIE3LNW1RyQXmzJfaHTO908qTlpmljK2qcuM7xx8xW
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
GEMINI_API_KEY=AIzaSyB8MET9moqtVKdCMeP71fGLJ9vsRcA-9_w
```

### Production Environment (`.env.production`)
```bash
# Real production keys (real money involved)
STRIPE_PUBLISHABLE_KEY=pk_live_your_production_stripe_key
STRIPE_SECRET_KEY=sk_live_your_production_stripe_secret
PAYPAL_CLIENT_ID=your_production_paypal_client_id
PAYPAL_CLIENT_SECRET=your_production_paypal_client_secret
GEMINI_API_KEY=your_production_gemini_api_key
```

## 🛡️ Security Features

### 1. Git Ignore Protection
All `.env` files are automatically ignored by git:
```gitignore
# Environment files
.env
.env.local
.env.production
.env.*.local
```

### 2. Environment Variable Loading Priority
The system loads environment variables in this order:
1. `.env.local` (highest priority)
2. `.env.production`
3. `.env`
4. System environment variables (lowest priority)

### 3. Configuration Validation
The system automatically checks if required keys are present:
```python
from journal.config import config

# Check payment system status
status = config.get_payment_status()
print(f"Stripe: {status['stripe']}")
print(f"PayPal: {status['paypal']}")
print(f"AI Coach: {status['ai_coach']}")
```

## 🔧 Usage Examples

### Python Backend
```python
from journal.config import config

# Access configuration
stripe_key = config.STRIPE_SECRET_KEY
paypal_id = config.PAYPAL_CLIENT_ID
gemini_key = config.GEMINI_API_KEY

# Check environment
if config.is_production():
    print("Running in production mode")
elif config.is_development():
    print("Running in development mode")

# Check if payment systems are configured
if config.has_payment_keys():
    print("Payment systems are ready")
else:
    print("Payment systems are not configured")
```

### Frontend (Vite)
```typescript
// Access environment variables
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const paypalId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Check if features are enabled
const paymentsEnabled = import.meta.env.VITE_ENABLE_PAYMENTS === 'true';
const realtimeEnabled = import.meta.env.VITE_ENABLE_REALTIME_DATA === 'true';
```

## 🚨 Important Security Notes

### ❌ Never Do This
- Commit `.env` files to version control
- Share API keys in code or documentation
- Use production keys in development
- Hardcode API keys in source code

### ✅ Always Do This
- Use `.env.local` for development
- Use `.env.production` for production
- Keep API keys secret and secure
- Use test keys for development
- Rotate production keys regularly

## 🔄 Environment Switching

### Development Mode
```bash
# Use .env.local
cp env.local.example .env.local
# Edit .env.local with your development keys
```

### Production Mode
```bash
# Use .env.production
cp env.production.example .env.production
# Edit .env.production with your production keys
```

### Environment Detection
The system automatically detects the environment:
```python
if config.is_production():
    # Use production settings
    stripe_key = config.STRIPE_SECRET_KEY
    paypal_env = 'live'
else:
    # Use development settings
    stripe_key = config.STRIPE_SECRET_KEY
    paypal_env = 'sandbox'
```

## 🧪 Testing Your Configuration

### 1. Check Configuration Status
```python
python -c "
from journal.config import config
print('Payment Status:', config.get_payment_status())
print('Environment:', config.FLASK_ENV)
print('Stripe Key:', '✅' if config.STRIPE_SECRET_KEY else '❌')
print('PayPal ID:', '✅' if config.PAYPAL_CLIENT_ID else '❌')
print('Gemini Key:', '✅' if config.GEMINI_API_KEY else '❌')
"
```

### 2. Test Payment Systems
```bash
# Test Stripe
curl -X POST http://localhost:3005/api/payment/stripe/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Test PayPal
curl -X POST http://localhost:3005/api/payment/paypal/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount": 29.99}'
```

## 🆘 Troubleshooting

### Common Issues

#### 1. "ModuleNotFoundError: No module named 'dotenv'"
```bash
pip install python-dotenv
```

#### 2. "API key not found" errors
- Check if `.env` files exist
- Verify API keys are correctly set
- Ensure no extra spaces or quotes around values

#### 3. Payment systems not working
- Verify API keys are valid
- Check if keys are for the correct environment (test vs live)
- Ensure required environment variables are set

#### 4. Environment not detected correctly
- Check `FLASK_ENV` variable in your `.env` file
- Verify file naming is correct
- Restart your application after changes

### Debug Mode
Enable debug logging to see what's happening:
```bash
# In your .env file
LOG_LEVEL=DEBUG
FLASK_DEBUG=true
```

## 📋 Checklist

- [ ] Run `python setup_env.py`
- [ ] Install `python-dotenv`
- [ ] Edit `.env.local` with development keys
- [ ] Edit `.env.production` with production keys
- [ ] Test configuration with status check
- [ ] Verify payment systems work
- [ ] Test AI coach functionality
- [ ] Ensure `.env` files are gitignored

## 🎯 Next Steps

1. **Set up your API keys** in the respective `.env` files
2. **Test the configuration** using the provided examples
3. **Deploy to production** using `.env.production`
4. **Monitor and rotate** your production API keys regularly

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your `.env` file syntax
3. Ensure all required dependencies are installed
4. Check the logs for detailed error messages

---

**Remember**: Your `.env` files contain sensitive information. Keep them secure and never share them publicly!
