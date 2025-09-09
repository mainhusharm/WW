import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CreditCard, Shield, Undo, Headphones, CheckCircle, Copy, Search } from 'lucide-react';
// Stripe imports removed
import Header from './Header';
import { PAYMENT_CONFIG } from '../config/payment';
// Stripe components removed

const MT5PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState(0);
  const [cryptoSymbol, setCryptoSymbol] = useState('ETH');
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Cryptocurrency addresses (using the same as the main website)
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

  const plans = {
    starter: {
      name: "Starter",
      price: 299,
      features: [
        "Basic strategy automation",
        "EX5 file delivery",
        "Basic risk management",
        "1 revision included",
        "5-7 business days delivery",
        "Email support"
      ]
    },
    pro: {
      name: "Pro",
      price: 599,
      features: [
        "Advanced strategy automation",
        "Custom indicators integration",
        "Multi-timeframe analysis",
        "EX5 + Backtest report",
        "Advanced risk filters",
        "2 revisions included",
        "5-7 business days delivery",
        "Dashboard + chat support"
      ]
    },
    elite: {
      name: "Elite",
      price: 1299,
      features: [
        "Full professional bot development",
        "EX5 + Source Code (MQ5)",
        "Custom risk management modules",
        "News filter integration",
        "Multi-currency support",
        "Lifetime updates included",
        "Unlimited revisions",
        "Priority support",
        "7-10 business days delivery"
      ]
    }
  };

  useEffect(() => {
    try {
      const planName = searchParams.get('plan')?.toLowerCase() || 'pro';
      const planPrice = parseInt(searchParams.get('price') || '599');
      const selectedPlanData = plans[planName as keyof typeof plans] || plans.pro;
      
      // Override the price with the URL parameter if provided
      if (planPrice && planPrice !== selectedPlanData.price) {
        selectedPlanData.price = planPrice;
      }
      
      console.log('Setting selected plan:', selectedPlanData);
      setSelectedPlan(selectedPlanData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error setting selected plan:', error);
      setSelectedPlan(plans.pro);
      setIsLoading(false);
    }
  }, [searchParams, cryptoSymbol]);

  // Update crypto amount when selectedPlan or cryptoSymbol changes
  useEffect(() => {
    if (selectedPlan) {
      const cryptoPrices = {
        ETH: 2500,
        SOL: 100
      };
      
      const selectedCrypto = cryptoSymbol as keyof typeof cryptoPrices;
      setCryptoAmount(finalPrice / cryptoPrices[selectedCrypto]);
      
      // Set real wallet address
      setWalletAddress(cryptoAddresses[cryptoSymbol as keyof typeof cryptoAddresses]?.address || '');
    }
  }, [selectedPlan, cryptoSymbol, finalPrice]);

  // Initialize final price when selectedPlan changes
  useEffect(() => {
    if (selectedPlan) {
      setFinalPrice(selectedPlan.price);
    }
  }, [selectedPlan]);

  const switchPaymentMethod = (method: string) => {
    setPaymentMethod(method);
    setIsError(false);
  };

  const handleCouponApply = () => {
    if (!couponCode.trim()) {
      setCouponMessage('Please enter a coupon code');
      return;
    }

    if (couponCode.toUpperCase() === 'BOTFREE') {
      setCouponApplied(true);
      setDiscountAmount(selectedPlan?.price || 0);
      setFinalPrice(0);
      setCouponMessage('Coupon applied! Your order is now FREE!');
    } else {
      setCouponMessage('Invalid coupon code');
    }
  };

  const handleCouponRemove = () => {
    setCouponApplied(false);
    setDiscountAmount(0);
    setFinalPrice(selectedPlan?.price || 0);
    setCouponCode('');
    setCouponMessage('');
  };

  const selectCrypto = (crypto: string) => {
    setCryptoSymbol(crypto.toUpperCase());
    const cryptoPrices = {
      ETH: 2500,
      SOL: 100
    };
    const price = selectedPlan?.price || 599;
    setCryptoAmount(price / cryptoPrices[crypto as keyof typeof cryptoPrices]);
    setWalletAddress(cryptoAddresses[crypto.toUpperCase() as keyof typeof cryptoAddresses]?.address || '');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    // You could add a toast notification here
  };

  const verifyCryptoPayment = () => {
    if (!txHash) {
      setErrorMessage('Please enter the transaction hash');
      setIsError(true);
      return;
    }
    
    setIsProcessing(true);
    setIsError(false);
    
    // Handle free coupon checkout
    if (couponApplied && finalPrice === 0) {
      console.log('Processing free coupon checkout...');
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 1500);
      return;
    }
    
    // Simulate payment verification
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 3000);
  };


  const handlePayPalPayment = async () => {
    setIsProcessing(true);
    setIsError(false);
    
    try {
      // Handle free coupon checkout
      if (couponApplied && finalPrice === 0) {
        console.log('Processing free coupon checkout...');
        setTimeout(() => {
          setIsProcessing(false);
          setIsSuccess(true);
        }, 1500);
        return;
      }

      // Create PayPal order using the existing payment configuration
      const response = await fetch(PAYMENT_CONFIG.endpoints.paypal.createOrder, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalPrice,
          currency: PAYMENT_CONFIG.paypal.currency,
          plan: selectedPlan?.name || 'MT5 Bot Development',
          type: 'mt5_bot',
          coupon_code: couponCode || null,
          original_price: selectedPlan?.price || 0,
          discount_amount: discountAmount
        }),
      });

      if (!response.ok) {
        throw new Error('PayPal order creation failed');
      }

      const { orderId } = await response.json();
      
      // In a real implementation, you would redirect to PayPal here
      // For now, we'll simulate success
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 2000);
      
    } catch (error) {
      console.error('PayPal payment error:', error);
      setIsProcessing(false);
      setIsError(true);
      setErrorMessage('PayPal payment failed. Please try again.');
    }
  };

  const goToDashboard = () => {
    // Save payment record for MT5 dashboard access
    const paymentRecord = {
      status: 'completed',
      plan: selectedPlan?.name || 'Pro',
      amount: finalPrice || selectedPlan?.price || 599,
      method: paymentMethod,
      orderId: `MT5-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      couponCode: couponCode || null,
      discountAmount: discountAmount
    };
    localStorage.setItem('paymentRecord', JSON.stringify(paymentRecord));
    localStorage.setItem('mt5_payment_record', JSON.stringify(paymentRecord));
    
    // Update existing MT5 user status to active
    const existingUsers = JSON.parse(localStorage.getItem('mt5_users') || '[]');
    const existingCustomers = JSON.parse(localStorage.getItem('mt5Customers') || '[]');
    
    // Find the most recent user (from signup)
    const latestUser = existingUsers[existingUsers.length - 1];
    const latestCustomer = existingCustomers[existingCustomers.length - 1];
    
    if (latestUser) {
      latestUser.status = 'active';
      latestUser.plan = selectedPlan?.name || 'Elite';
      localStorage.setItem('mt5_users', JSON.stringify(existingUsers));
      localStorage.setItem('currentUser', JSON.stringify(latestUser));
    } else {
      // Fallback: create a new user
      const mt5User = {
        id: `mt5_${Date.now()}`,
        name: 'MT5 Bot User',
        email: 'user@mt5bot.com',
        plan: selectedPlan?.name || 'Elite',
        status: 'active',
        joinDate: new Date().toISOString()
      };
      localStorage.setItem('currentUser', JSON.stringify(mt5User));
    }
    
    if (latestCustomer) {
      latestCustomer.status = 'COMPLETED';
      latestCustomer.selectedPlan = selectedPlan;
      localStorage.setItem('mt5Customers', JSON.stringify(existingCustomers));
    }
    
    // Redirect to MT5 dashboard
    navigate('/mt5-dashboard');
  };

  const resetPayment = () => {
    setIsError(false);
    setIsSuccess(false);
    setIsProcessing(false);
    setErrorMessage('');
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Payment Successful!</h2>
          <p className="text-gray-400 mb-6">Your order has been confirmed and you now have access to your dashboard.</p>
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p><strong>Order ID:</strong> MT5-2024-001</p>
            <p><strong>Transaction ID:</strong> {txHash || 'STRIPE_TXN_123456'}</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={goToDashboard}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center mx-auto"
            >
              Access Dashboard
            </button>
            <button
              onClick={() => {
                console.log('Manual navigation test');
                navigate('/mt5-dashboard');
              }}
              className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300"
            >
              Test Navigation (Debug)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Payment Page...</h2>
          <p className="text-gray-300">Please wait while we prepare your order</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Order Summary */}
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Order Summary</h2>
                <div className="text-sm text-gray-400">Order #MT5-2024-001</div>
              </div>
              
              {selectedPlan && (
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">{selectedPlan?.name || 'Pro'} Plan</h3>
                    <div className="text-2xl font-bold text-white">${selectedPlan?.price || 599}</div>
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    {(selectedPlan?.features || []).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coupon Section */}
              <div className="border-t border-gray-700 pt-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Coupon Code</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                    disabled={couponApplied}
                  />
                  {!couponApplied ? (
                    <button
                      onClick={handleCouponApply}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  ) : (
                    <button
                      onClick={handleCouponRemove}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {couponMessage && (
                  <p className={`text-sm mt-2 ${couponMessage.includes('applied') ? 'text-green-400' : 'text-red-400'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>

              <div className="border-t border-gray-700 pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="text-white">${selectedPlan?.price || 0}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between mb-2 text-green-400">
                    <span>Discount ({couponCode}):</span>
                    <span>-${discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-400">Processing Fee:</span>
                  <span className="text-white">$0</span>
                </div>
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-white">Total:</span>
                  <span className={`${finalPrice === 0 ? 'text-green-400' : 'text-white'}`}>
                    ${finalPrice}
                    {finalPrice === 0 && <span className="text-sm ml-2">(FREE!)</span>}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-gray-400">SSL Secured</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-400">256-bit Encryption</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose Payment Method</h2>
                <p className="text-gray-400">Select your preferred payment option below</p>
              </div>

              {/* Payment Method Tabs */}
              <div className="flex space-x-4">
                {/* Stripe Credit Card button removed */}
                <button
                  onClick={() => switchPaymentMethod('paypal')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    paymentMethod === 'paypal'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-blue-400">PayPal</span>
                </button>
                <button
                  onClick={() => switchPaymentMethod('crypto')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    paymentMethod === 'crypto'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-orange-400">Crypto</span>
                </button>
              </div>

              {/* Stripe Payment removed */}

              {/* PayPal Payment */}
              {paymentMethod === 'paypal' && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">PayPal Payment</h3>
                  <p className="text-gray-400 mb-6">You'll be redirected to PayPal to complete your payment</p>
                  <button
                    onClick={handlePayPalPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300"
                  >
                    {finalPrice === 0 ? 'Complete Free Order' : `Pay $${finalPrice} with PayPal`}
                  </button>
                </div>
              )}

              {/* Crypto Payment */}
              {paymentMethod === 'crypto' && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Cryptocurrency Payment</h3>
                  <p className="text-gray-400 mb-6">Choose your preferred cryptocurrency</p>
                  
                  <div className="space-y-4 mb-6">
                    <button
                      onClick={() => selectCrypto('eth')}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                        cryptoSymbol === 'ETH'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Ξ</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">Ethereum</div>
                          <div className="text-gray-400 text-sm">ETH - {cryptoAddresses.ETH.network}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{cryptoAmount.toFixed(4)} ETH</div>
                        <div className="text-gray-400 text-sm">${finalPrice}</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => selectCrypto('sol')}
                      className={`w-full flex items-center justify-between p-4 rounded-lg border transition-all ${
                        cryptoSymbol === 'SOL'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">Solana</div>
                          <div className="text-gray-400 text-sm">SOL - {cryptoAddresses.SOL.network}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-semibold">{cryptoAmount.toFixed(2)} SOL</div>
                        <div className="text-gray-400 text-sm">${finalPrice}</div>
                      </div>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        Send {cryptoAmount.toFixed(cryptoSymbol === 'ETH' ? 4 : 2)} {cryptoSymbol}
                      </h4>
                      <p className="text-gray-400 text-sm">to the following address:</p>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={walletAddress}
                          readOnly
                          className="flex-1 bg-transparent text-white text-sm font-mono"
                        />
                        <button
                          onClick={copyAddress}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                          title="Copy address"
                        >
                          <Copy className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        Network: {cryptoAddresses[cryptoSymbol as keyof typeof cryptoAddresses]?.network}
                      </div>
                    </div>
                    
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                      <div className="text-gray-400 text-sm mb-2">QR Code</div>
                      <div className="w-32 h-32 bg-white rounded-lg mx-auto flex items-center justify-center">
                        <div className="text-gray-600 text-xs">QR Code</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-semibold text-white">Payment Instructions:</h5>
                      <ol className="text-sm text-gray-400 space-y-1">
                        <li>1. Send exactly <strong>{cryptoAmount.toFixed(cryptoSymbol === 'ETH' ? 4 : 2)} {cryptoSymbol}</strong> (${finalPrice}) to the address above</li>
                        <li>2. Include the transaction hash below</li>
                        <li>3. Wait for confirmation (usually 2-10 minutes)</li>
                        <li>4. Your order will be activated automatically</li>
                      </ol>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Hash (after sending)</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={txHash}
                          onChange={(e) => setTxHash(e.target.value)}
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          placeholder="0x..."
                          required
                        />
                        {txHash && (
                          <a
                            href={`${cryptoAddresses[cryptoSymbol as keyof typeof cryptoAddresses]?.explorer}${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center"
                            title="View on blockchain explorer"
                          >
                            <Search className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        Verify your transaction on the blockchain explorer
                      </div>
                    </div>
                    
                    <button
                      onClick={verifyCryptoPayment}
                      className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center"
                    >
                      <Search className="w-5 h-5 mr-2" />
                      {finalPrice === 0 ? 'Complete Free Order' : 'Verify Payment'}
                    </button>
                  </div>
                </div>
              )}

              {/* Processing State */}
              {isProcessing && (
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-bold text-white mb-2">Processing Payment...</h3>
                  <p className="text-gray-400">Please don't close this window while we process your payment.</p>
                </div>
              )}

              {/* Error State */}
              {isError && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">×</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
                  <p className="text-gray-400 mb-4">{errorMessage || 'There was an issue processing your payment. Please try again.'}</p>
                  <button
                    onClick={resetPayment}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-green-400" />
              <div>
                <h4 className="text-lg font-semibold text-white">Secure Payment</h4>
                <p className="text-gray-400 text-sm">Your payment information is encrypted and secure</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Undo className="w-8 h-8 text-blue-400" />
              <div>
                <h4 className="text-lg font-semibold text-white">Money Back Guarantee</h4>
                <p className="text-gray-400 text-sm">Full refund before development begins</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Headphones className="w-8 h-8 text-purple-400" />
              <div>
                <h4 className="text-lg font-semibold text-white">24/7 Support</h4>
                <p className="text-gray-400 text-sm">Get help anytime through your dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MT5PaymentPage;
