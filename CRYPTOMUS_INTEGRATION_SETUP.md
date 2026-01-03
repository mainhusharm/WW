# Cryptomus Payment Integration Setup Guide

## Overview
Cryptomus has been successfully integrated into your payment system! This guide will help you set up everything needed to start accepting cryptocurrency payments.

## What's Been Added

### Frontend Components
- ✅ **CryptomusPayment.tsx** - Complete payment component with QR codes and real-time status checking
- ✅ **Enhanced Payment Page** - Cryptomus option added to existing payment flow
- ✅ **Payment Configuration** - Updated to include Cryptomus endpoints

### Backend Routes
- ✅ **Python/Flask routes** (`journal/cryptomus_routes.py`)
- ✅ **Node.js/Express routes** (`journal/cryptomus_routes.js`)
- ✅ **API integration** (`src/api/cryptomus.ts`)

## Required Setup Steps

### 1. Create Cryptomus Account
1. Visit [https://cryptomus.com](https://cryptomus.com)
2. Sign up for a merchant account
3. Complete the verification process
4. Navigate to the API section in your dashboard

### 2. Get API Credentials
You'll need these credentials from your Cryptomus dashboard:

- **Merchant ID** - Your unique merchant identifier
- **Payment API Key** - For creating invoices and checking payment status
- **Payout API Key** - For handling payouts (optional)

### 3. Environment Variables
Add these variables to your `.env` file:

```bash
# Cryptomus Configuration
CRYPTOMUS_MERCHANT_ID=your_merchant_id_here
CRYPTOMUS_PAYMENT_API_KEY=your_payment_api_key_here
CRYPTOMUS_PAYOUT_API_KEY=your_payout_api_key_here

# Frontend Environment Variables (.env.local)
VITE_CRYPTOMUS_MERCHANT_ID=your_merchant_id_here
```

### 4. Install Required Dependencies

#### For Node.js Backend:
```bash
npm install axios crypto
```

#### For Python Backend:
```bash
pip install requests hashlib base64
```

### 5. Integrate Backend Routes

#### Option A: Node.js/Express
```javascript
const express = require('express');
const { createCryptomusRoutes } = require('./journal/cryptomus_routes');

const app = express();
app.use(express.json());

// Add Cryptomus routes
createCryptomusRoutes(app);

app.listen(3001, () => {
  console.log('Server running with Cryptomus integration');
});
```

#### Option B: Python/Flask
```python
from flask import Flask
from journal.cryptomus_routes import create_cryptomus_routes

app = Flask(__name__)

# Add Cryptomus routes
create_cryptomus_routes(app)

if __name__ == '__main__':
    app.run(port=3001)
```

### 6. Webhook Configuration
In your Cryptomus dashboard, set the webhook URL to:
- **Production**: `https://your-domain.com/api/cryptomus/webhook`
- **Development**: `https://your-ngrok-url.com/api/cryptomus/webhook`

### 7. Test the Integration
Use the test endpoint to verify everything is working:
```bash
curl http://localhost:3001/api/cryptomus/test
```

## Supported Cryptocurrencies

The integration supports these cryptocurrencies:
- **USDT** (Tether) - Tron, Ethereum, BSC networks
- **BTC** (Bitcoin)
- **ETH** (Ethereum)
- **BNB** (Binance Coin)
- **LTC** (Litecoin)
- **TRX** (Tron)
- **DOGE** (Dogecoin)
- **ADA** (Cardano)

## Features Included

### 🔥 Real-time Payment Processing
- Automatic invoice generation
- QR code for easy mobile payments
- Real-time payment status checking
- Automatic payment confirmation

### 🛡️ Security Features
- Webhook signature verification
- Secure API key handling
- Payment amount validation
- Network verification

### 💰 Payment Flow
1. User selects Cryptomus payment method
2. System generates payment invoice with QR code
3. User sends cryptocurrency to provided address
4. System automatically detects payment
5. User account is activated instantly

### 📱 Mobile-Friendly
- QR codes for mobile wallet scanning
- Responsive design
- Copy-to-clipboard functionality
- Network selection guidance

## Payment Status Handling

The system handles these payment statuses:
- `wait_payment` - Waiting for payment
- `paid` - Payment received and confirmed
- `paid_over` - Overpayment received
- `fail` - Payment failed
- `cancel` - Payment cancelled
- `system_fail` - System error
- `refund_paid` - Refund completed

## Fees and Limits

Cryptomus typically charges:
- **Payment fees**: 0.1% - 2% depending on cryptocurrency
- **Withdrawal fees**: Vary by network
- **Minimum amounts**: Usually $1-10 USD equivalent

Check your Cryptomus dashboard for exact fees and limits.

## Going Live Checklist

- [ ] Cryptomus account verified
- [ ] API credentials added to environment variables
- [ ] Backend routes integrated
- [ ] Webhook URL configured in Cryptomus dashboard
- [ ] Test payment completed successfully
- [ ] SSL certificate installed (required for webhooks)
- [ ] Payment flow tested on staging environment

## Support and Monitoring

### Logging
The integration includes comprehensive logging for:
- Payment creation
- Status updates
- Webhook processing
- Error handling

### Monitoring
Monitor these metrics:
- Payment success rate
- Average confirmation time
- Failed payments
- Webhook delivery status

### Support
- **Cryptomus Support**: [https://cryptomus.com/support](https://cryptomus.com/support)
- **Documentation**: [https://doc.cryptomus.com](https://doc.cryptomus.com)
- **API Status**: Check Cryptomus status page for service updates

## Troubleshooting

### Common Issues

1. **"Invalid signature" error**
   - Check API keys are correct
   - Verify merchant ID matches
   - Ensure request data format is correct

2. **Payment not detected**
   - Check network is correct (Tron vs Ethereum)
   - Verify exact amount was sent
   - Check transaction on blockchain explorer

3. **Webhook not received**
   - Verify webhook URL is accessible
   - Check SSL certificate is valid
   - Ensure server responds with 200 status

### Testing Tips
- Use testnet addresses for development
- Start with small amounts
- Test different cryptocurrencies
- Verify webhook handling

## Next Steps

1. **Test thoroughly** - Try different payment scenarios
2. **Monitor performance** - Watch payment success rates
3. **User feedback** - Gather feedback on the payment flow
4. **Optimize** - Adjust based on user behavior
5. **Scale** - Add more cryptocurrencies as needed

Your Cryptomus integration is now ready! Users can pay with cryptocurrency directly from your payment page with automatic confirmation and account activation.
