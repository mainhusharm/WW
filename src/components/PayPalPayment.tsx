import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, CreditCard, Shield, CheckCircle } from 'lucide-react';

const PayPalPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get payment data from location state
  const paymentData = location.state || {};
  const {
    selectedPlan,
    couponApplied = false,
    discountAmount = 0,
    couponCode = '',
    finalAmount
  } = paymentData;

  // Calculate the correct amount to charge
  const amountToCharge = finalAmount !== undefined ? finalAmount :
                        couponApplied ? (selectedPlan?.price || 0) - discountAmount :
                        (selectedPlan?.price || 0);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // For demo purposes, simulate PayPal payment
      // In production, this would integrate with PayPal SDK

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create payment data for completion
      const paymentResult = {
        method: 'paypal',
        amount: amountToCharge,
        plan: selectedPlan?.name || 'Unknown Plan',
        paymentId: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        coupon_code: couponApplied ? couponCode : null,
        coupon_applied: couponApplied,
        discount_amount: discountAmount,
        timestamp: new Date().toISOString(),
      };

      // Store payment details
      localStorage.setItem('payment_details', JSON.stringify(paymentResult));

      // Navigate back to payment flow with success
      navigate('/payment-flow', {
        state: {
          paymentComplete: true,
          paymentData: paymentResult
        }
      });

    } catch (error) {
      console.error('PayPal payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // If no plan data, redirect back
  if (!selectedPlan) {
    useEffect(() => {
      navigate('/membership');
    }, [navigate]);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20">
      <div className="w-full max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Payment Options</span>
          </button>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4 mb-6">
            <div className="text-center">
              <div className="text-blue-400 font-semibold text-lg">{selectedPlan.name} Plan</div>
              <div className="text-white text-2xl font-bold">
                ${amountToCharge.toFixed(2)}/{selectedPlan.period}
                {couponApplied && (
                  <span className="text-green-400 text-sm ml-2">
                    (Original: ${selectedPlan.price}, Saved: ${discountAmount.toFixed(2)})
                  </span>
                )}
              </div>
              <div className="text-blue-300 text-sm">Professional trading guidance</div>
            </div>
          </div>
        )}

        {/* PayPal Payment Card */}
        <div className="bg-gray-800/30 backdrop-blur-md rounded-3xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🅿️</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">PayPal Payment</h1>
            <p className="text-gray-400">Complete your secure payment</p>
          </div>

          {/* Payment Summary */}
          <div className="bg-gray-700/50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">{selectedPlan.name} Plan</span>
                <span className="text-white">${selectedPlan.price}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between">
                  <span className="text-green-400">Discount ({couponCode})</span>
                  <span className="text-green-400">-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-600 pt-3">
                <div className="flex justify-between">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-white font-bold">${amountToCharge.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PayPal Integration Placeholder */}
          <div className="text-center mb-6">
            <p className="text-gray-400 mb-4">
              Click the button below to complete your payment securely with PayPal
            </p>

            {/* Demo PayPal Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`w-full max-w-md mx-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-4 px-8 rounded-xl font-semibold transition-colors flex items-center justify-center space-x-3 ${
                isProcessing ? 'cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">🅿️</span>
                  <span>Pay ${amountToCharge.toFixed(2)} with PayPal</span>
                </>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
            <div className="flex items-center justify-center space-x-2 text-green-400 mb-2">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Secure Payment</span>
            </div>
            <p className="text-center text-sm text-gray-400">
              Your payment is secured by PayPal's industry-leading security measures.
              We never store your payment information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalPayment;
