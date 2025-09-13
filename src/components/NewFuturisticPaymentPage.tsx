import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Lock, CreditCard, ArrowLeft, X, AlertTriangle, AlertCircle, Copy, CheckCircle, Zap, Sparkles, Shield, Cpu, Globe, Coins, Star } from 'lucide-react';
// Stripe imports removed
// PayPal imports removed
import { PAYMENT_CONFIG } from '../config/payment';

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

// Use the imported payment configuration

// Stripe removed - PayPal only

// Stripe Payment Component
const StripePaymentForm = ({ 
  amount, 
  onSuccess, 
  onError, 
  disabled 
}: { 
  amount: number; 
  onSuccess: (paymentData: any) => void; 
  onError: (error: string) => void;
  disabled: boolean;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent using the working payment service
      const response = await fetch(PAYMENT_CONFIG.endpoints.paypal.createOrder, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amount * 100, // Convert to cents
          metadata: {
            plan: selectedPlan.name,
            coupon_code: '',
            coupon_applied: 'false',
            discount_amount: 0
          }
        }),
      });
      
      const { clientSecret } = await response.json();
      
      if (!stripe || !elements) {
        throw new Error('Stripe not loaded');
      }
      
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/successful-payment`,
        },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      onSuccess({
        method: 'stripe',
        amount: amount,
        paymentId: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'succeeded',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-white text-sm mb-4">
        Amount: ${amount.toFixed(2)}
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <PaymentElement />
        <button
          type="submit"
          disabled={!stripe || isProcessing || disabled}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:from-gray-500 disabled:to-gray-600 text-white py-3 px-6 rounded-xl font-bold transition-all duration-300 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)} with Stripe`}
        </button>
      </form>
    </div>
  );
};

// PayPal Payment Component removed

export default function NewFuturisticPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
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

  // Handle coupon application
  const handleCouponApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate coupon validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coupon validation
      const mockCoupons: { [key: string]: { discount: number; message: string } } = {
        'WELCOME20': { discount: 20, message: 'Welcome discount applied!' },
        'SAVE50': { discount: 50, message: 'Great savings!' },
        'FREE': { discount: 100, message: 'Free access granted!' },
        'TRIAL': { discount: 100, message: 'Trial period activated!' }
      };

      const coupon = mockCoupons[couponCode.toUpperCase()];
      if (coupon) {
        setCouponApplied(true);
        setCouponMessage(coupon.message);
        setDiscount(coupon.discount);
        setFinalPrice(Math.max(0, selectedPlan.price - coupon.discount));
        setError(null);
      } else {
        setError('Invalid coupon code');
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

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setError(null);
  };

  // Handle payment success
  const handlePaymentSuccess = (paymentData: any) => {
    setPaymentProcessing(true);
    setPaymentMessage('Payment successful! Redirecting...');
    
    const fullPaymentData = {
      ...paymentData,
      plan: selectedPlan.name,
      coupon_code: couponCode,
      coupon_applied: couponApplied,
      discount_amount: discount,
    };
    
    console.log('Payment successful:', fullPaymentData);
    
    setTimeout(() => {
      navigate('/successful-payment', { state: { paymentData: fullPaymentData, selectedPlan } });
    }, 2000);
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setPaymentProcessing(false);
    setPaymentMessage('');
  };

  // Handle free payment (coupon)
  const handleFreePayment = async () => {
    setError(null);
    setPaymentProcessing(true);
    setPaymentMessage('Processing free access...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const paymentData = {
      method: 'free_coupon',
      amount: 0,
      plan: selectedPlan.name,
      paymentId: `FREE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      coupon_code: couponCode,
      coupon_applied: true,
      discount_amount: discount,
      timestamp: new Date().toISOString(),
    };
    
    handlePaymentSuccess(paymentData);
  };

  const handleBackToSignup = () => {
    navigate('/signup-enhanced', {
      state: { selectedPlan }
    });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Animated Grid */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent animate-pulse delay-1000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Back Button */}
          <button
            onClick={handleBackToSignup}
            className="flex items-center text-cyan-300/70 hover:text-cyan-300 mb-8 transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Signup</span>
          </button>

          {/* Futuristic Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Cpu className="w-12 h-12 text-cyan-400 mr-4 animate-pulse" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Complete Your Subscription
              </h1>
              <Sparkles className="w-12 h-12 text-purple-400 ml-4 animate-pulse" />
            </div>
            <p className="text-cyan-100 text-xl max-w-3xl mx-auto">
              Get instant access to all premium features and start your trading journey
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Order Summary */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/30">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center">
                    <Cpu className="w-6 h-6 text-cyan-400 mr-3" />
                    <h2 className="text-2xl font-bold text-white">Order Summary</h2>
                  </div>
                  <button className="text-cyan-300 hover:text-cyan-200 text-sm font-medium transition-colors group">
                    <span className="group-hover:underline">Change</span>
                  </button>
                </div>

                {/* Subscription Details */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl blur-sm"></div>
                  <div className="relative bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 mr-3" />
                        <span className="text-white font-bold text-lg">{selectedPlan.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-300">${selectedPlan.price}</div>
                        <div className="text-cyan-200 text-sm">/{selectedPlan.period}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coupon Code */}
                <div className="mb-8">
                  <label className="block text-cyan-200 text-sm font-medium mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Enter coupon code
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm"></div>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="relative w-full px-4 py-3 bg-black/50 border border-cyan-400/30 rounded-xl text-white placeholder-cyan-300/50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300"
                        disabled={couponApplied}
                      />
                    </div>
                    {couponApplied ? (
                      <button
                        onClick={handleRemoveCoupon}
                        className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 text-red-300 rounded-xl transition-all duration-300 hover:scale-105"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleCouponApply}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:from-gray-500 disabled:to-gray-600 text-white rounded-xl transition-all duration-300 hover:scale-105 font-medium"
                      >
                        {loading ? 'Applying...' : 'Apply'}
                      </button>
                    )}
                  </div>
                  
                  {couponMessage && (
                    <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <p className="text-green-200 text-sm">{couponMessage}</p>
                    </div>
                  )}
                </div>

                {/* Financial Breakdown */}
                <div className="space-y-4 mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl blur-sm"></div>
                    <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-purple-400/20">
                      <div className="flex justify-between text-cyan-200">
                        <span className="font-medium">Subtotal</span>
                        <span className="font-bold">${selectedPlan.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  {discount > 0 && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-sm"></div>
                      <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
                        <div className="flex justify-between text-green-300">
                          <span className="font-medium flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Discount
                          </span>
                          <span className="font-bold">-${discount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-sm"></div>
                    <div className="relative bg-black/50 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/40">
                      <div className="flex justify-between text-white font-bold text-xl">
                        <span className="flex items-center">
                          <Star className="w-6 h-6 mr-2 text-yellow-400" />
                          Total
                        </span>
                        <span className="text-cyan-300">${finalPrice.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* What's Included */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl blur-sm"></div>
                  <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-cyan-400/20">
                    <div className="flex items-center mb-6">
                      <Shield className="w-6 h-6 text-cyan-400 mr-3" />
                      <h3 className="text-white font-bold text-lg">What's Included</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                        'Full access to all features',
                        'Unlimited trading signals',
                        'Custom trading plans',
                        'Risk management tools',
                        '24/7 customer support',
                        'Advanced analytics dashboard'
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center text-cyan-100 group">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                            <Check className="w-4 h-4 text-black" />
                          </div>
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Method */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30">
                <div className="flex items-center mb-8">
                  <Globe className="w-6 h-6 text-purple-400 mr-3" />
                  <h2 className="text-2xl font-bold text-white">Payment Method</h2>
                </div>

                {/* Payment Method Selection */}
                <div className="space-y-4 mb-8">
                  {/* PayPal removed */}

                  {/* Stripe */}
                  <div
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                      selectedPaymentMethod === 'stripe'
                        ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                        : 'border-purple-400/30 hover:border-purple-400/50 hover:bg-purple-500/10'
                    }`}
                    onClick={() => handlePaymentMethodSelect('stripe')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">Stripe</div>
                          <div className="text-purple-200 text-sm">Pay with your credit card</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-purple-200 text-sm mr-3">No additional fees</span>
                        {selectedPaymentMethod === 'stripe' && (
                          <div className="w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-black" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cryptocurrency */}
                  <div
                    className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                      selectedPaymentMethod === 'crypto'
                        ? 'border-orange-400 bg-orange-500/20 shadow-lg shadow-orange-500/20'
                        : 'border-orange-400/30 hover:border-orange-400/50 hover:bg-orange-500/10'
                    }`}
                    onClick={() => handlePaymentMethodSelect('crypto')}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                          <Coins className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-bold text-lg">Cryptocurrency</div>
                          <div className="text-orange-200 text-sm">Ethereum (ETH), Solana (SOL)</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-orange-200 text-sm mr-3">Manual verification required</span>
                        {selectedPaymentMethod === 'crypto' && (
                          <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-black" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Forms */}
                {finalPrice > 0 && (
                  <div className="mb-8">
                    {/* PayPal payment form removed */}

                    {selectedPaymentMethod === 'stripe' && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl blur-sm"></div>
                        <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-purple-400/30">
                          <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                            <CreditCard className="w-5 h-5 mr-2 text-purple-400" />
                            Credit Card Payment
                          </h3>
                          <Elements stripe={stripePromise} options={{
                            mode: 'payment',
                            amount: Math.round(finalPrice * 100),
                            currency: 'usd',
                          }}>
                            <StripePaymentForm
                              amount={finalPrice}
                              onSuccess={handlePaymentSuccess}
                              onError={handlePaymentError}
                              disabled={paymentProcessing}
                            />
                          </Elements>
                        </div>
                      </div>
                    )}

                    {selectedPaymentMethod === 'crypto' && (
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl blur-sm"></div>
                        <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-orange-400/30">
                          <h3 className="text-white font-bold text-lg mb-4 flex items-center">
                            <Coins className="w-5 h-5 mr-2 text-orange-400" />
                            Cryptocurrency Payment
                          </h3>
                          <div className="text-center py-8">
                            <p className="text-orange-200 mb-4">Crypto payment integration coming soon!</p>
                            <p className="text-gray-400 text-sm">For now, please use PayPal or Stripe</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Redirection Message */}
                {selectedPaymentMethod === 'paypal' && finalPrice > 0 && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-sm"></div>
                    <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-cyan-400/30">
                      <div className="flex items-center text-cyan-200 text-sm">
                        <Globe className="w-5 h-5 mr-3 text-cyan-400" />
                        <span>You'll be redirected to PayPal to complete your payment</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Free Access Message */}
                {finalPrice === 0 && (
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl blur-sm"></div>
                    <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-green-400/30">
                      <div className="flex items-center text-green-300 text-sm">
                        <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                        <span className="font-medium">Free access granted! No payment required.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Secure Payment */}
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl blur-sm"></div>
                  <div className="relative bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-green-400/20">
                    <div className="flex items-center mb-3">
                      <Shield className="w-6 h-6 text-green-400 mr-3" />
                      <h3 className="text-white font-bold text-lg">Secure Payment</h3>
                    </div>
                    <p className="text-cyan-200 text-sm leading-relaxed">
                      Your payment information is encrypted and secure. We use industry-standard SSL encryption and never store your payment details.
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
                    {error}
                  </div>
                )}

                {/* Payment Processing Message */}
                {paymentProcessing && (
                  <div className="bg-blue-500/20 border border-blue-500/30 text-blue-200 px-4 py-3 rounded-lg text-sm mb-6">
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200 mr-2"></div>
                      {paymentMessage}
                    </div>
                  </div>
                )}

                {/* Free Payment Button */}
                {finalPrice === 0 && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-2xl blur-sm"></div>
                    <button
                      onClick={handleFreePayment}
                      disabled={loading || paymentProcessing}
                      className="relative w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 hover:from-green-400 hover:via-emerald-400 hover:to-green-400 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-500 text-white py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center group hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
                    >
                      {loading || paymentProcessing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          <span className="text-lg">{paymentMessage}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CheckCircle className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                          <span className="text-lg">Complete Free Access</span>
                          <Sparkles className="w-6 h-6 ml-3 group-hover:animate-pulse" />
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
