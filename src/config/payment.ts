// Payment configuration - Multiple providers
export const PAYMENT_CONFIG = {
  // Stripe Configuration
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key_here',                                                              
    currency: 'USD',
  },

  // Cryptomus Configuration
  cryptomus: {
    merchantId: import.meta.env.VITE_CRYPTOMUS_MERCHANT_ID || '',
    currency: 'USD',
  },
  
  // Payment endpoints
  endpoints: {
    stripe: {
      createPaymentIntent: import.meta.env.PROD
        ? 'https://backend-topb.onrender.com/api/payment/stripe/create-payment-intent'
        : 'http://localhost:3001/api/payment/stripe/create-payment-intent',
    },
    cryptomus: {
      createInvoice: import.meta.env.PROD
        ? 'https://backend-topb.onrender.com/api/cryptomus/create-invoice'
        : 'http://localhost:3001/api/cryptomus/create-invoice',
      paymentInfo: import.meta.env.PROD
        ? 'https://backend-topb.onrender.com/api/cryptomus/payment-info'
        : 'http://localhost:3001/api/cryptomus/payment-info',
      services: import.meta.env.PROD
        ? 'https://backend-topb.onrender.com/api/cryptomus/services'
        : 'http://localhost:3001/api/cryptomus/services',
    }
  },
  
  // Plan configurations
  plans: {
    basic: {
      name: 'Basic Plan',
      price: 29.99,
      features: ['Basic signals', 'Email support', 'Basic analytics'],
      stripePriceId: 'price_basic_monthly'
    },
    pro: {
      name: 'Pro Plan',
      price: 79.99,
      features: ['Advanced signals', 'Priority support', 'Advanced analytics', 'Risk management'],
      stripePriceId: 'price_pro_monthly'
    },
    premium: {
      name: 'Premium Plan',
      price: 149.99,
      features: ['Premium signals', '24/7 support', 'AI coaching', 'Portfolio management'],
      stripePriceId: 'price_premium_monthly'
    }
  }
};

export default PAYMENT_CONFIG;
