// Payment configuration with environment variables
export const PAYMENT_CONFIG = {
  // Stripe Configuration
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_iSQmzHiUwz1pmfaVTSXSEpbx',
    secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || 'sk_test_Njv0R96TKWGPmh9FOD27rrJs', // Only used on backend
    currency: 'USD',
    apiVersion: '2023-10-16' as const,
  },
  
  // PayPal Configuration
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'ASUvkAyi9hd0D6xgfR9LgBvXWcsOg4spZd05tprIE3LNW1RyQXmzJfaHTO908qTlpmljK2qcuM7xx8xW',
    secret: import.meta.env.VITE_PAYPAL_CLIENT_SECRET || 'EK3TSSwjQny6zybyX5Svwokawg9dhq1MdJd_AzpRanhaGrxLx0P6eqpWKewkVzINe2vpVRZFz4u9g-qr', // Only used on backend
    currency: 'USD',
    environment: 'sandbox' as const, // Change to 'live' for production
  },
  
  // Payment endpoints
  endpoints: {
    stripe: {
      createPaymentIntent: import.meta.env.PROD 
        ? 'https://www.traderedgepro.com/api/payment/stripe/create-payment-intent'
        : 'https://backend-bkt7.onrender.com/api/payment/stripe/create-payment-intent',
      confirmPayment: import.meta.env.PROD
        ? 'https://www.traderedgepro.com/api/payment/stripe/confirm-payment'
        : 'https://backend-bkt7.onrender.com/api/payment/stripe/confirm-payment',
    },
    paypal: {
      createOrder: import.meta.env.PROD
        ? 'https://www.traderedgepro.com/api/payment/paypal/create-order'
        : 'https://backend-bkt7.onrender.com/api/payment/paypal/create-order',
      captureOrder: import.meta.env.PROD
        ? 'https://www.traderedgepro.com/api/payment/paypal/capture-order'
        : 'https://backend-bkt7.onrender.com/api/payment/paypal/capture-order',
    }
  },
  
  // Plan configurations
  plans: {
    basic: {
      name: 'Basic Plan',
      price: 29.99,
      features: ['Basic signals', 'Email support', 'Basic analytics'],
      stripePriceId: 'price_basic_monthly',
      paypalPlanId: 'P-BASIC-MONTHLY'
    },
    pro: {
      name: 'Pro Plan',
      price: 79.99,
      features: ['Advanced signals', 'Priority support', 'Advanced analytics', 'Risk management'],
      stripePriceId: 'price_pro_monthly',
      paypalPlanId: 'P-PRO-MONTHLY'
    },
    premium: {
      name: 'Premium Plan',
      price: 149.99,
      features: ['Premium signals', '24/7 support', 'AI coaching', 'Portfolio management'],
      stripePriceId: 'price_premium_monthly',
      paypalPlanId: 'P-PREMIUM-MONTHLY'
    }
  }
};

export default PAYMENT_CONFIG;
