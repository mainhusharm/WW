import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Lock, CreditCard, ArrowLeft, X } from 'lucide-react';

interface SelectedPlan {
  name: string;
  price: number;
  period: string;
  description?: string;
}

interface UserData {
  id: string;
  email: string;
  fullName: string;
  selectedPlan: SelectedPlan;
  status: string;
}

interface CouponResponse {
  valid: boolean;
  discount_amount?: number;
  final_price?: number;
  message?: string;
  error?: string;
}

export default function EnhancedPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paypal');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  // Get user data from location state or sessionStorage
  const userData: UserData = location.state?.userData || JSON.parse(sessionStorage.getItem('userData') || '{}');
  const selectedPlan: SelectedPlan = userData.selectedPlan || {
    name: 'Enterprise',
    price: 499,
    period: '3 months',
    description: 'Professional trading guidance'
  };

  // Initialize pricing
  useEffect(() => {
    setFinalPrice(selectedPlan.price);
  }, [selectedPlan.price]);

  const handleCouponApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://node-backend-g1mk.onrender.com/api/validate-coupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupon_code: couponCode,
          plan_id: selectedPlan.name.toLowerCase(),
          original_price: selectedPlan.price
        }),
      });

      const data: CouponResponse = await response.json();

      if (data.valid) {
        setCouponApplied(true);
        setCouponMessage(data.message || 'Coupon applied successfully!');
        setDiscount(data.discount_amount || 0);
        setFinalPrice(data.final_price || 0);
        setError(null);
      } else {
        setError(data.error || 'Invalid coupon code');
        setCouponApplied(false);
        setCouponMessage('');
        setDiscount(0);
        setFinalPrice(selectedPlan.price);
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      setError('Failed to validate coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponApplied(false);
    setCouponMessage('');
    setDiscount(0);
    setFinalPrice(selectedPlan.price);
    setError(null);
  };

  const handlePaymentComplete = async () => {
    setLoading(true);
    setPaymentProcessing(true);
    setError(null);

    try {
      // Simulate payment processing based on selected method
      let paymentSuccess = false;
      let currentPaymentMessage = '';

      switch (selectedPaymentMethod) {
        case 'paypal':
          // Simulate PayPal payment processing
          currentPaymentMessage = 'Redirecting to PayPal...';
          setPaymentMessage(currentPaymentMessage);
          // In a real app, this would redirect to PayPal
          // For demo purposes, we'll simulate a successful payment after a delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          currentPaymentMessage = 'Payment successful!';
          setPaymentMessage(currentPaymentMessage);
          paymentSuccess = true;
          break;
          
        case 'stripe':
          // Simulate Stripe payment processing
          currentPaymentMessage = 'Processing credit card payment...';
          setPaymentMessage(currentPaymentMessage);
          // In a real app, this would use Stripe API
          await new Promise(resolve => setTimeout(resolve, 2000));
          currentPaymentMessage = 'Payment successful!';
          setPaymentMessage(currentPaymentMessage);
          paymentSuccess = true;
          break;
          
        case 'crypto':
          // Simulate crypto payment processing
          currentPaymentMessage = 'Processing cryptocurrency payment...';
          setPaymentMessage(currentPaymentMessage);
          // In a real app, this would handle crypto transactions
          await new Promise(resolve => setTimeout(resolve, 2000));
          currentPaymentMessage = 'Payment successful!';
          setPaymentMessage(currentPaymentMessage);
          paymentSuccess = true;
          break;
          
        default:
          throw new Error('Invalid payment method selected');
      }

      if (paymentSuccess) {
        // Only store payment data in database after successful payment
        const response = await fetch('https://node-backend-g1mk.onrender.com/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userData.id,
            planName: selectedPlan.name,
            originalPrice: selectedPlan.price,
            discount: discount,
            finalPrice: finalPrice,
            couponCode: couponApplied ? couponCode : null,
            paymentMethod: selectedPaymentMethod
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Payment stored successfully
          const paymentData = {
            ...data.payment,
            userData,
            selectedPlan
          };

          // Redirect to success page
          navigate('/payment-success', {
            state: {
              paymentData,
              userData
            }
          });
        } else {
          setError(data.error || 'Failed to record payment');
        }
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  const handleBackToSignup = () => {
    navigate('/signup-enhanced', {
      state: { selectedPlan }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        {/* Back Button */}
        <button
          onClick={handleBackToSignup}
          className="flex items-center text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Signup
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Complete Your Subscription</h1>
          <p className="text-blue-100 text-lg">Get instant access to all premium features and start your trading journey</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Order Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Order Summary</h2>
              <button className="text-blue-300 hover:text-blue-200 text-sm">Change</button>
            </div>

            {/* Subscription Details */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{selectedPlan.name}</span>
                <span className="text-white font-bold">${selectedPlan.price}/{selectedPlan.period}</span>
              </div>
            </div>

            {/* Coupon Code */}
            <div className="mb-6">
              <label className="block text-white text-sm font-medium mb-2">Enter coupon code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={couponApplied}
                />
                {couponApplied ? (
                  <button
                    onClick={handleRemoveCoupon}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleCouponApply}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                  >
                    {loading ? 'Applying...' : 'Apply'}
                  </button>
                )}
              </div>
              
              {/* Coupon Message */}
              {couponMessage && (
                <div className="mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 text-sm">{couponMessage}</p>
                </div>
              )}
            </div>

            {/* Financial Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-white">
                <span>Subtotal</span>
                <span>${selectedPlan.price.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-300">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-3">
                <div className="flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>${finalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div>
              <div className="flex items-center mb-4">
                <Check className="w-5 h-5 text-blue-400 mr-2" />
                <h3 className="text-white font-semibold">What's Included</h3>
              </div>
              <ul className="space-y-2">
                {[
                  'Full access to all features',
                  'Unlimited trading signals',
                  'Custom trading plans',
                  'Risk management tools',
                  '24/7 customer support',
                  'Advanced analytics dashboard'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center text-white/80">
                    <Check className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Payment Method */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-6">Payment Method</h2>

            {/* Payment Options */}
            <div className="space-y-4 mb-6">
              {/* PayPal */}
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onClick={() => setSelectedPaymentMethod('paypal')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-xs">PP</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">PayPal</div>
                      <div className="text-white/70 text-sm">Pay with your PayPal account</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white/70 text-sm mr-2">No additional fees</span>
                    {selectedPaymentMethod === 'paypal' && (
                      <Check className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Stripe */}
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'stripe'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onClick={() => setSelectedPaymentMethod('stripe')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center mr-3">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Stripe</div>
                      <div className="text-white/70 text-sm">Pay with your credit card</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white/70 text-sm mr-2">No additional fees</span>
                    {selectedPaymentMethod === 'stripe' && (
                      <Check className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Cryptocurrency */}
              <div
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedPaymentMethod === 'crypto'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/20 hover:border-white/40'
                }`}
                onClick={() => setSelectedPaymentMethod('crypto')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-xs">₿</span>
                    </div>
                    <div>
                      <div className="text-white font-medium">Cryptocurrency</div>
                      <div className="text-white/70 text-sm">Ethereum (ETH), Solana (SOL)</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-white/70 text-sm mr-2">Manual verification required</span>
                    {selectedPaymentMethod === 'crypto' && (
                      <Check className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Redirection Message */}
            {selectedPaymentMethod === 'paypal' && (
              <div className="flex items-center text-white/70 text-sm mb-6">
                <CreditCard className="w-4 h-4 mr-2" />
                <span>You'll be redirected to PayPal to complete your payment</span>
              </div>
            )}

            {/* Secure Payment */}
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <Lock className="w-4 h-4 text-green-400 mr-2" />
                <h3 className="text-white font-semibold">Secure Payment</h3>
              </div>
              <p className="text-white/70 text-sm">
                Your payment information is encrypted and secure. We use industry-standard SSL encryption and never store your payment details.
              </p>
            </div>

            {/* Payment Processing Message */}
            {paymentProcessing && (
              <div className="bg-blue-500/20 border border-blue-500/30 text-blue-200 px-4 py-3 rounded-lg text-sm mb-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200 mr-2"></div>
                  {paymentMessage}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Complete Payment Button */}
            <button
              onClick={handlePaymentComplete}
              disabled={loading || paymentProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {loading || paymentProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {paymentProcessing ? paymentMessage : 'Processing Payment...'}
                </div>
              ) : (
                `Complete Payment - $${finalPrice.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
