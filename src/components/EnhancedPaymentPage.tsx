import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Lock, CreditCard, ArrowLeft, X, AlertTriangle, AlertCircle, Copy, CheckCircle, Zap, Sparkles, Shield, Cpu, Globe, Coins, Star } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

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

// Payment Configuration with fallbacks
const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_iSQmzHiUwz1pmfaVTSXSEpbx',
    currency: 'USD',
  },
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || 'ASUvkAyi9hd0D6xgfR9LgBvXWcsOg4spZd05tQrIE3LNW1RyQXmzJfaHTO908qTlpmljK2qcuM7xx8xW',
    currency: 'USD',
    environment: 'sandbox' as const, // Change to 'live' for production
  },
};

// Initialize Stripe
const stripePromise = loadStripe(PAYMENT_CONFIG.stripe.publishableKey);

// Stripe Checkout Form Component
const StripeCheckoutForm: React.FC<{
  clientSecret: string;
  selectedPlan: SelectedPlan;
  finalPrice: number;
  couponApplied: boolean;
  couponCode: string;
  discount: number;
  onPaymentSuccess: (paymentData: any) => void;
  onPaymentError: (error: string) => void;
}> = ({ clientSecret, selectedPlan, finalPrice, couponApplied, couponCode, discount, onPaymentSuccess, onPaymentError }) => {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      onPaymentError(error.message || 'Payment failed');
    } else {
      // Payment succeeded
      const paymentData = {
        method: 'stripe',
        amount: finalPrice,
        plan: selectedPlan.name,
        paymentId: 'stripe_payment_' + Date.now(),
        coupon_code: couponCode,
        coupon_applied: couponApplied,
        discount_amount: discount,
        timestamp: new Date().toISOString(),
      };
      onPaymentSuccess(paymentData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4 mb-4">
        <h3 className="text-white font-semibold mb-2">Order Summary</h3>
        <div className="flex justify-between text-white/80 text-sm mb-1">
          <span>Plan:</span>
          <span>{selectedPlan.name}</span>
        </div>
        <div className="flex justify-between text-white/80 text-sm mb-1">
          <span>Amount:</span>
          <span className="text-blue-400 font-semibold">${finalPrice.toFixed(2)}</span>
        </div>
        {couponApplied && (
          <div className="mt-2 p-2 bg-green-600/20 border border-green-600 rounded text-green-400 text-sm">
            Coupon applied: {couponCode} - Saved ${discount.toFixed(2)}
          </div>
        )}
      </div>
      
      <PaymentElement />
      <p className="text-white/70 text-sm">
        Please enter your card details above. All transactions are secure and encrypted.
      </p>
      <button
        type="submit"
        disabled={!stripe}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors"
      >
        Pay ${finalPrice.toFixed(2)} now
      </button>
    </form>
  );
};

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
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCryptoVerification, setShowCryptoVerification] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [verificationData, setVerificationData] = useState({
    transactionHash: '',
    screenshot: null as File | null,
    amount: '',
    fromAddress: ''
  });

  // Cryptocurrency addresses
  const cryptoAddresses = {
    ETH: {
      address: '0x461bBf1B66978fE97B1A2bcEc52FbaB6aEDDF256',
      name: 'Ethereum (ETH)',
      network: 'Ethereum Mainnet',
      symbol: 'ETH',
      explorer: 'https://etherscan.io/tx/'
    },
    SOL: {
      address: 'GZGsfmqx6bAYdXiVQs3QYfPFPjyfQggaMtBp5qm5R7r3',
      name: 'Solana (SOL)',
      network: 'Solana Mainnet',
      symbol: 'SOL',
      explorer: 'https://solscan.io/tx/'
    }
  };

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
      const response = await fetch('https://backend-bkt7.onrender.com/api/validate-coupon', {
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

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentForm(false);
    setError(null);
  };

  // Handle payment completion button click
  const handlePaymentComplete = async () => {
    setError(null);
    
    // Special handling for $0 payments (free coupons)
    if (finalPrice === 0) {
      console.log('Processing free payment (coupon applied)');
      console.log('User data:', userData);
      console.log('Selected plan:', selectedPlan);
      console.log('Coupon code:', couponCode);
      console.log('Discount:', discount);
      
      setPaymentProcessing(true);
      setPaymentMessage('Processing free access...');
      
      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create payment data for free coupon
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
      
      console.log('Free payment data:', paymentData);
      
      // Process the free payment
      await handlePaymentSuccess(paymentData);
      return;
    }
    
    // Regular payment flow for non-zero amounts
    switch (selectedPaymentMethod) {
      case 'paypal':
        setShowPaymentForm(true);
        break;
      case 'stripe':
        await initializeStripePayment();
        break;
      case 'crypto':
        setShowCryptoVerification(true);
        break;
      default:
        setError('Please select a payment method');
    }
  };

  // Initialize Stripe payment
  const initializeStripePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create real PaymentIntent
      const response = await fetch('https://backend-bkt7.onrender.com/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalPrice * 100, // Convert to cents
          currency: 'usd',
          metadata: {
            plan: selectedPlan.name,
            coupon_code: couponCode || '',
            coupon_applied: couponApplied ? 'true' : 'false',
            discount_amount: discount || 0,
            user_id: userData.id
          }
        }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        setStripeClientSecret(data.clientSecret);
        setShowPaymentForm(true);
      } else {
        setError(data.error || 'Failed to initialize Stripe payment');
      }
    } catch (error) {
      console.error('Stripe initialization error:', error);
      setError('Failed to initialize Stripe payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentData: any) => {
    setLoading(true);
    setError(null);

    try {
      // For free payments, use a default payment method if none selected
      const paymentMethod = finalPrice === 0 ? 'free_coupon' : selectedPaymentMethod;
      
      const paymentRequestData = {
        userId: userData.id,
        planName: selectedPlan.name,
        originalPrice: selectedPlan.price,
        discount: discount,
        finalPrice: finalPrice,
        couponCode: couponApplied ? couponCode : null,
        paymentMethod: paymentMethod,
        transactionId: paymentData.paymentId || paymentData.transactionId
      };
      
      console.log('Sending payment request:', paymentRequestData);
      
      // Store payment data in database
      const response = await fetch('https://backend-bkt7.onrender.com/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequestData),
      });

      const data = await response.json();
      
      console.log('Payment API response:', data);

      if (data.success) {
        // Payment stored successfully
        const successData = {
          ...data.payment,
          userData,
          selectedPlan,
          paymentData
        };

        // Redirect to success page
        navigate('/payment-success', {
          state: {
            paymentData: successData,
            userData
          }
        });
      } else {
        console.error('Payment API error:', data);
        setError(data.error || data.details || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Payment storage error:', error);
      setError('Payment was successful but failed to record. Please contact support.');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
    setShowPaymentForm(false);
  };

  // Cryptocurrency utility functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleCryptoSelection = (crypto: string) => {
    setSelectedCrypto(crypto);
    setVerificationData({
      transactionHash: '',
      screenshot: null,
      amount: finalPrice.toString(),
      fromAddress: ''
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVerificationData(prev => ({ ...prev, screenshot: file }));
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Store verification details
      const cryptoVerificationData = {
        crypto: selectedCrypto,
        address: cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].address,
        transactionHash: verificationData.transactionHash,
        amount: finalPrice,
        fromAddress: verificationData.fromAddress,
        screenshot: verificationData.screenshot?.name,
        timestamp: new Date().toISOString(),
        status: 'pending_verification',
        coupon_code: couponApplied ? couponCode : null,
        coupon_applied: couponApplied,
        discount_amount: discount
      };

      // Store in localStorage for now (in real app, send to backend)
      localStorage.setItem('crypto_verification', JSON.stringify(cryptoVerificationData));

      // Create payment data for database storage
      const paymentData = {
        method: 'crypto',
        amount: finalPrice,
        plan: selectedPlan.name,
        paymentId: 'crypto_' + verificationData.transactionHash,
        coupon_code: couponApplied ? couponCode : null,
        coupon_applied: couponApplied,
        discount_amount: discount,
        timestamp: new Date().toISOString(),
        crypto_verification: cryptoVerificationData
      };

      await handlePaymentSuccess(paymentData);
    } catch (error) {
      console.error('Crypto verification error:', error);
      setError('Failed to submit verification. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <div className="w-full max-w-7xl">
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
          {/* Left Column: Futuristic Order Summary */}
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

            {/* Futuristic Subscription Details */}
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

            {/* Futuristic Coupon Code */}
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
              
              {/* Coupon Message */}
              {couponMessage && (
                <div className="mt-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <p className="text-green-200 text-sm">{couponMessage}</p>
                </div>
              )}
            </div>

            {/* Futuristic Financial Breakdown */}
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

            {/* Futuristic What's Included */}
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

          {/* Right Column: Futuristic Payment Method */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/30">
              <div className="flex items-center mb-8">
                <Globe className="w-6 h-6 text-purple-400 mr-3" />
                <h2 className="text-2xl font-bold text-white">Payment Method</h2>
              </div>

            {/* Futuristic Payment Options */}
            <div className="space-y-4 mb-8">
              {/* PayPal */}
              <div
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                  selectedPaymentMethod === 'paypal'
                    ? 'border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/20'
                    : 'border-purple-400/30 hover:border-cyan-400/50 hover:bg-purple-500/10'
                }`}
                onClick={() => handlePaymentMethodSelect('paypal')}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-sm">PP</span>
                    </div>
                    <div>
                      <div className="text-white font-bold text-lg">PayPal</div>
                      <div className="text-cyan-200 text-sm">Pay with your PayPal account</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-cyan-200 text-sm mr-3">No additional fees</span>
                    {selectedPaymentMethod === 'paypal' && (
                      <div className="w-6 h-6 bg-cyan-400 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

            {/* Futuristic Redirection Message */}
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
            
            {/* Futuristic Free Access Message */}
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

            {/* Futuristic Secure Payment */}
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

            {/* Payment Processing Message */}
            {paymentProcessing && (
              <div className="bg-blue-500/20 border border-blue-500/30 text-blue-200 px-4 py-3 rounded-lg text-sm mb-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-200 mr-2"></div>
                  {paymentMessage}
                </div>
              </div>
            )}

            {/* PayPal Payment Form */}
            {showPaymentForm && selectedPaymentMethod === 'paypal' && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Complete PayPal Payment</h3>
                <PayPalScriptProvider options={{
                  clientId: PAYMENT_CONFIG.paypal.clientId,
                  currency: PAYMENT_CONFIG.paypal.currency,
                  environment: PAYMENT_CONFIG.paypal.environment,
                }}>
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        purchase_units: [
                          {
                            description: `${selectedPlan.name} Plan${couponApplied ? ` (Coupon: ${couponCode})` : ''}`,
                            amount: {
                              value: finalPrice.toFixed(2),
                            },
                          },
                        ],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      try {
                        const details = await actions.order?.capture();
                        console.log('PayPal payment successful', details);

                        const paymentData = {
                          method: 'paypal',
                          amount: finalPrice,
                          plan: selectedPlan.name,
                          paymentId: 'paypal_' + details?.id,
                          coupon_code: couponCode,
                          coupon_applied: couponApplied,
                          discount_amount: discount,
                          timestamp: new Date().toISOString(),
                        };

                        await handlePaymentSuccess(paymentData);
                      } catch (err) {
                        console.error('PayPal payment failed:', err);
                        handlePaymentError('PayPal payment failed. Please try again.');
                      }
                    }}
                    onError={(err) => {
                      console.error('PayPal error:', err);
                      handlePaymentError('An error occurred with PayPal. Please try again.');
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            )}

            {/* Stripe Payment Form */}
            {showPaymentForm && selectedPaymentMethod === 'stripe' && stripeClientSecret && (
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-4">Complete Credit Card Payment</h3>
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: stripeClientSecret,
                    appearance: {
                      theme: 'night',
                      variables: {
                        colorPrimary: '#3b82f6',
                        colorBackground: '#1f2937',
                        colorText: '#ffffff',
                        colorDanger: '#ef4444',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        spacingUnit: '4px',
                        borderRadius: '8px',
                      },
                    },
                  }}
                >
                  <StripeCheckoutForm
                    clientSecret={stripeClientSecret}
                    selectedPlan={selectedPlan}
                    finalPrice={finalPrice}
                    couponApplied={couponApplied}
                    couponCode={couponCode}
                    discount={discount}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentError={handlePaymentError}
                  />
                </Elements>
              </div>
            )}

            {/* Cryptocurrency Verification Form */}
            {showCryptoVerification && (
              <div className="mb-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">₿</div>
                  <h3 className="text-white font-semibold text-lg mb-2">Cryptocurrency Payment</h3>
                  <p className="text-white/70 text-sm">
                    Send payment to one of our crypto addresses and verify your transaction
                  </p>
                </div>

                {!selectedCrypto ? (
                  <div className="space-y-4">
                    <h4 className="text-white font-medium text-center mb-4">Select Cryptocurrency</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(cryptoAddresses).map(([key, crypto]) => (
                        <button
                          key={key}
                          onClick={() => handleCryptoSelection(key)}
                          className="p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 hover:border-blue-500 transition-all text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm">{crypto.symbol}</span>
                            </div>
                            <div>
                              <div className="text-white font-medium">{crypto.name}</div>
                              <div className="text-white/60 text-sm">{crypto.network}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Payment Instructions */}
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <h4 className="text-blue-300 font-semibold mb-3">Payment Instructions</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Send {cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].symbol} to this address:
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].address}
                              readOnly
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono text-sm"
                            />
                            <button
                              onClick={() => copyToClipboard(cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].address)}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-1"
                            >
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Amount:</span>
                            <span className="text-white font-semibold ml-2">${finalPrice} USD equivalent</span>
                          </div>
                          <div>
                            <span className="text-white/60">Network:</span>
                            <span className="text-white font-semibold ml-2">
                              {cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].network}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Verification Form */}
                    <form onSubmit={handleVerificationSubmit} className="space-y-4">
                      <h4 className="text-white font-semibold">Verify Your Payment</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Transaction Hash *
                          </label>
                          <input
                            type="text"
                            value={verificationData.transactionHash}
                            onChange={(e) => setVerificationData(prev => ({ ...prev, transactionHash: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter transaction hash"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Amount Sent (USD) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={verificationData.amount}
                            onChange={(e) => setVerificationData(prev => ({ ...prev, amount: e.target.value }))}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder={finalPrice.toString()}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Your Wallet Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={verificationData.fromAddress}
                          onChange={(e) => setVerificationData(prev => ({ ...prev, fromAddress: e.target.value }))}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                          placeholder="Your sending wallet address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Transaction Screenshot (Optional)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer file:text-sm"
                        />
                        {verificationData.screenshot && (
                          <p className="text-sm text-green-400 mt-1">
                            ✓ {verificationData.screenshot.name} uploaded
                          </p>
                        )}
                        <p className="text-xs text-white/60 mt-1">Max file size: 5MB</p>
                      </div>

                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-yellow-300 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium text-sm">Important Notes</span>
                        </div>
                        <ul className="text-sm text-white/80 space-y-1">
                          <li>• Send the exact USD equivalent amount in {cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].symbol}</li>
                          <li>• Use the correct network ({cryptoAddresses[selectedCrypto as keyof typeof cryptoAddresses].network})</li>
                          <li>• Verification may take 1-24 hours</li>
                          <li>• You'll receive email confirmation once verified</li>
                        </ul>
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCrypto('');
                            setVerificationData({ transactionHash: '', screenshot: null, amount: finalPrice.toString(), fromAddress: '' });
                          }}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                          Back to Selection
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <span>Submit for Verification</span>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Futuristic Complete Payment Button */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-sm"></div>
              <button
                onClick={handlePaymentComplete}
                disabled={loading || paymentProcessing}
                className="relative w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 hover:from-cyan-400 hover:via-purple-400 hover:to-cyan-400 disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-500 text-white py-6 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center group hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                {loading || paymentProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    <span className="text-lg">{paymentProcessing ? paymentMessage : 'Processing Payment...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Zap className="w-6 h-6 mr-3 group-hover:animate-pulse" />
                    <span className="text-lg">
                      {finalPrice === 0 ? 'Complete Free Access' : `Complete Payment - $${finalPrice.toFixed(2)}`}
                    </span>
                    <Sparkles className="w-6 h-6 ml-3 group-hover:animate-pulse" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
