import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import PaymentIntegration from './PaymentIntegration';
import { useUser } from '../contexts/UserContext';
import api from '../api';

const PaymentFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useUser();
  
  // Get selected plan from location state or URL parameters
  const selectedPlan = location.state?.selectedPlan || (() => {
    const planName = searchParams.get('plan')?.toLowerCase() || 'pro';
    const planPrice = parseInt(searchParams.get('price') || '599');
    
    // Define plans similar to MT5PaymentPage
    const plans = {
      starter: { name: "Starter", price: 299, period: "month" },
      pro: { name: "Pro", price: 599, period: "month" },
      elite: { name: "Elite", price: 1299, period: "month" },
      institutional: { name: "Institutional", price: 2499, period: "month" }
    };
    
    const plan = plans[planName as keyof typeof plans] || plans.pro;
    return { ...plan, price: planPrice || plan.price };
  })();

  useEffect(() => {
    if (!selectedPlan) {
      navigate('/membership');
    }
  }, [selectedPlan, navigate]);

  const handlePaymentComplete = async (paymentToken: string, paymentData?: any) => {
    if (user && selectedPlan) {
      try {
        // Get payment details from localStorage if available
        const paymentDetails = localStorage.getItem('payment_details');
        const parsedDetails = paymentDetails ? JSON.parse(paymentDetails) : null;
        
        // Handle free coupon checkout - bypass API call
        if (paymentToken === 'free_coupon_checkout' || (parsedDetails && parsedDetails.method === 'free_coupon')) {
          console.log('Processing free coupon checkout - bypassing payment verification');
          
          // Update user membership directly for free coupons
          setUser({
            ...user,
            membershipTier: selectedPlan?.name?.toLowerCase() || 'basic' as 'basic' | 'professional' | 'institutional' | 'elite',
          });
          
          // Check if this is an MT5 payment
          const isMT5Payment = selectedPlan?.name?.toLowerCase().includes('mt5') || 
                              selectedPlan?.name?.toLowerCase().includes('bot') ||
                              window.location.pathname.includes('mt5');
          
          if (isMT5Payment) {
            // Save payment record for MT5 dashboard access
            const paymentRecord = {
              status: 'completed',
              plan: selectedPlan?.name || 'Pro',
              amount: selectedPlan?.price || 599,
              method: 'stripe',
              orderId: `MT5-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('paymentRecord', JSON.stringify(paymentRecord));
            navigate('/mt5-dashboard');
          } else {
            navigate('/successful-payment', { state: { selectedPlan } });
          }
          return;
        }
        
        // Get the correct amount - prioritize paymentData, then parsedDetails, then fallback to plan price
        let amountPaid = selectedPlan?.price || 0;
        if (paymentData && paymentData.amount) {
          amountPaid = paymentData.amount;
        } else if (parsedDetails && parsedDetails.amount !== undefined) {
          amountPaid = parsedDetails.amount;
        }
        
        const requestData = {
          token: paymentToken,
          plan: selectedPlan?.name?.toLowerCase() || 'basic',
          user_id: user.id,
          amount_paid: amountPaid,
          coupon_code: paymentData?.coupon_code || parsedDetails?.coupon_code || null,
        };

        console.log('Sending payment verification request:', requestData);
        console.log('Amount being verified:', amountPaid);
        console.log('Original plan price:', selectedPlan?.price || 0);

        const response = await api.post('/payment/verify-payment', requestData);

        if (response.status === 200) {
          setUser({
            ...user,
            membershipTier: selectedPlan?.name?.toLowerCase() || 'basic' as 'basic' | 'professional' | 'institutional' | 'elite',
          });
          
          // Check if this is an MT5 payment
          const isMT5Payment = selectedPlan?.name?.toLowerCase().includes('mt5') || 
                              selectedPlan?.name?.toLowerCase().includes('bot') ||
                              window.location.pathname.includes('mt5');
          
          if (isMT5Payment) {
            // Save payment record for MT5 dashboard access
            const paymentRecord = {
              status: 'completed',
              plan: selectedPlan?.name || 'Pro',
              amount: selectedPlan?.price || 599,
              method: 'stripe',
              orderId: `MT5-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
              timestamp: new Date().toISOString()
            };
            localStorage.setItem('paymentRecord', JSON.stringify(paymentRecord));
            navigate('/mt5-dashboard');
          } else {
            navigate('/successful-payment', { state: { selectedPlan } });
          }
        } else {
          // Handle payment verification failure
          console.error('Payment verification failed with status:', response.status);
          alert('Payment verification failed. Please contact support.');
        }
      } catch (error: any) {
        console.error('Payment verification failed:', error);
        // Log more details about the error
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
        }
        alert('Payment verification failed. Please contact support.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-white">
                TraderEdge Pro
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">BETA</span>
              </h1>
            </div>
          </div>

          <div className="text-right">
            <div className="text-white font-semibold">Complete Your Setup</div>
            <div className="text-sm text-gray-400">Step 2 of 2</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Complete Your Subscription
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Get instant access to all premium features and start your trading journey
            </p>
          </div>

          {/* Payment Integration */}
          <PaymentIntegration 
            selectedPlan={selectedPlan}
            onPaymentComplete={(token: string) => {
              handlePaymentComplete(token);
            }}
          />

          {/* Confirmation Message */}
          <div className="text-center mt-8 text-gray-400">
            <p>After successful payment, you will proceed to the questionnaire.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFlow;
