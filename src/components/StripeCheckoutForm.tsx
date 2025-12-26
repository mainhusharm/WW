import React from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useLocation } from 'react-router-dom';
import './FuturisticStripeForm.css';

const StripeCheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const location = useLocation();
  const { selectedPlan, couponApplied, discountAmount, couponCode, finalAmount } = location.state || {};
  
  // Use discounted amount if coupon is applied, otherwise use original price
  const paymentAmount = finalAmount || selectedPlan?.price || 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    // Store payment details including coupon information before redirect
    if (selectedPlan) {
      localStorage.setItem('payment_details', JSON.stringify({
        method: 'stripe',
        amount: paymentAmount,
        plan: selectedPlan.name,
        paymentId: 'pending_stripe_payment',
        coupon_code: couponCode,
        coupon_applied: couponApplied,
        discount_amount: discountAmount,
        timestamp: new Date().toISOString()
      }));
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Otherwise, your customer will be redirected to
      // your `return_url`. For some payment methods like iDEAL, your customer will
      // be redirected to an intermediate site first to authorize the payment, then
      // redirected to the `return_url`.
      console.error(error);
    }
  };

  return (
    <div className="form-container">
      {selectedPlan && (
        <div className="order-summary mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
          <div className="flex justify-between items-center mb-2">
            <span>Plan:</span>
            <span className="font-semibold">{selectedPlan.name}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Amount:</span>
            <span className="font-semibold text-blue-400">${paymentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Billing Cycle:</span>
            <span>3 months</span>
          </div>
          {couponApplied && (
            <div className="mt-3 p-2 bg-green-600/20 border border-green-600 rounded text-green-400 text-sm">
              Coupon applied: {couponCode} - Saved ${discountAmount.toFixed(2)}
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="futuristic-form">
        <PaymentElement />
        <p className="payment-instructions">
          Please enter your card details above. All transactions are secure and encrypted.
        </p>
        <button
          type="submit"
          disabled={!stripe}
          className="pay-button"
        >
          Pay ${paymentAmount.toFixed(2)} now
        </button>
      </form>
    </div>
  );
};

export default StripeCheckoutForm;
