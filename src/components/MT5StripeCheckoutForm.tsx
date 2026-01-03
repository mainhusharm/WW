import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { CreditCard, Lock } from 'lucide-react';
import { PAYMENT_CONFIG } from '../config/payment';

interface MT5StripeCheckoutFormProps {
  selectedPlan: any;
  finalPrice: number;
  couponCode: string;
  discountAmount: number;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const MT5StripeCheckoutForm: React.FC<MT5StripeCheckoutFormProps> = ({
  selectedPlan,
  finalPrice,
  couponCode,
  discountAmount,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  setIsProcessing
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardholderName, setCardholderName] = useState('John Doe');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Handle free coupon checkout
      if (finalPrice === 0) {
        console.log('Processing free coupon checkout...');
        setTimeout(() => {
          setIsProcessing(false);
          onPaymentSuccess();
        }, 1500);
        return;
      }

      // Create payment intent
      const response = await fetch(PAYMENT_CONFIG.endpoints.paypal.createOrder, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(finalPrice * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            plan: selectedPlan?.name || 'MT5 Bot Development',
            coupon_code: couponCode || null,
            original_price: selectedPlan?.price || 0,
            discount_amount: discountAmount
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { client_secret } = await response.json();

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (error) {
        console.error('Stripe payment error:', error);
        onPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded, calling onPaymentSuccess');
        onPaymentSuccess();
      }
    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#9ca3af',
        },
        backgroundColor: '#374151',
      },
      invalid: {
        color: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cardholder Name
        </label>
        <input
          type="text"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          placeholder="John Doe"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Card Information
        </label>
        <div className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20">
          <CardElement
            options={cardElementOptions}
            className="text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 text-sm text-gray-400">
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 disabled:from-gray-500 disabled:to-gray-500 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 mt-6 flex items-center justify-center"
      >
        {isProcessing ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Processing...
          </div>
        ) : (
          <div className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            {finalPrice === 0 ? 'Complete Free Order' : `Pay $${finalPrice}`}
          </div>
        )}
      </button>
    </form>
  );
};

export default MT5StripeCheckoutForm;
