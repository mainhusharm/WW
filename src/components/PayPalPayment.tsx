import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Shield } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

const PayPalPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPlan } = location.state || {};
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Plan</h2>
          <p>No plan selected. Please go back and select a plan.</p>
          <button
            onClick={() => navigate('/membership')}
            className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
          >
            Go to Membership Plans
          </button>
        </div>
      </div>
    );
  }

  const paypalOptions = {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID as string,
    currency: 'USD',
  };

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          description: selectedPlan.name,
          amount: {
            value: selectedPlan.price.toFixed(2),
          },
        },
      ],
    });
  };

  const onApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      const details = await actions.order.capture();
      console.log('PayPal payment successful', details);

      const paymentToken = 'paypal_' + details.id;

      localStorage.setItem(
        'payment_details',
        JSON.stringify({
          method: 'paypal',
          amount: selectedPlan.price,
          plan: selectedPlan.name,
          paymentId: paymentToken,
          timestamp: new Date().toISOString(),
        })
      );

      navigate('/payment-flow', {
        state: {
          selectedPlan,
          paymentToken,
        },
      });
    } catch (err) {
      console.error('PayPal payment failed:', err);
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const onError = (err: any) => {
    console.error('PayPal error:', err);
    setError('An error occurred with the PayPal payment. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold">Pay with PayPal</h1>
        </div>
      </header>

      <main className="py-12">
        <div className="max-w-md mx-auto p-6 bg-gray-800 rounded-2xl border border-gray-700">
          <div className="text-center mb-6">
            <Shield className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Complete Your Payment</h2>
            <p className="text-gray-400">
              You are paying for the{' '}
              <span className="font-semibold text-white">{selectedPlan.name}</span> plan.
            </p>
          </div>

          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Amount:</span>
              <span className="text-2xl font-bold text-white">
                ${selectedPlan.price.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          <PayPalScriptProvider options={paypalOptions}>
            <PayPalButtons
              style={{ layout: 'vertical' }}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={onError}
            />
          </PayPalScriptProvider>

          {isProcessing && (
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          )}

          <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 mt-6">
            <div className="flex items-center space-x-2 text-blue-400 mb-2">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Secure Transaction</span>
            </div>
            <p className="text-sm text-gray-400">
              Your payment is processed securely. We do not store your PayPal
              details.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PayPalPayment;
