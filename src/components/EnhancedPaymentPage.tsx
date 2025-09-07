import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, Lock, CreditCard, ArrowLeft, X, AlertTriangle, AlertCircle, Copy, CheckCircle } from 'lucide-react';
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

// Payment Configuration
const PAYMENT_CONFIG = {
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
    currency: 'USD',
  },
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
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
                onClick={() => handlePaymentMethodSelect('paypal')}
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
                onClick={() => handlePaymentMethodSelect('stripe')}
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
                onClick={() => handlePaymentMethodSelect('crypto')}
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
            {selectedPaymentMethod === 'paypal' && finalPrice > 0 && (
              <div className="flex items-center text-white/70 text-sm mb-6">
                <CreditCard className="w-4 h-4 mr-2" />
                <span>You'll be redirected to PayPal to complete your payment</span>
              </div>
            )}
            
            {/* Free Access Message */}
            {finalPrice === 0 && (
              <div className="flex items-center text-green-400 text-sm mb-6">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Free access granted! No payment required.</span>
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
                finalPrice === 0 ? 'Complete Free Access' : `Complete Payment - $${finalPrice.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
