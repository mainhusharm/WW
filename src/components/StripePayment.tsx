import React, { useState, useEffect } from 'react';
// Stripe imports removed
import CheckoutForm from './StripeCheckoutForm';
import { useLocation } from 'react-router-dom';
import { PAYMENT_CONFIG } from '../config/payment';

// Stripe removed - PayPal only

const StripePayment: React.FC = () => {
  const [clientSecret, setClientSecret] = useState('');
  const location = useLocation();
  const { selectedPlan, couponApplied, discountAmount, couponCode, finalAmount } = location.state || {};

  useEffect(() => {
    if (selectedPlan) {
      // Use discounted amount if coupon is applied, otherwise use original price
      const paymentAmount = finalAmount || selectedPlan.price;
      
      // Create PaymentIntent as soon as the page loads
      fetch(PAYMENT_CONFIG.endpoints.paypal.createOrder, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: paymentAmount * 100,
          metadata: {
            plan: selectedPlan.name,
            coupon_code: couponCode || '',
            coupon_applied: couponApplied ? 'true' : 'false',
            discount_amount: discountAmount || 0
          }
        }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    }
  }, [selectedPlan, finalAmount, couponCode, couponApplied, discountAmount]);

  const appearance: { theme: 'stripe' | 'night' | 'flat' | undefined } = {
    theme: 'stripe',
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div>
      {clientSecret && (
        <Elements options={options} stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      )}
    </div>
  );
};

export default StripePayment;
