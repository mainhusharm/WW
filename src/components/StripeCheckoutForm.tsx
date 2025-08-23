import React from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './FuturisticStripeForm.css';

const StripeCheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
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
          Pay now
        </button>
      </form>
    </div>
  );
};

export default StripeCheckoutForm;
