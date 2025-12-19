import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import PaymentIntegration from './PaymentIntegration';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { supabaseService } from '../services/supabaseService';
import { useTradingPlan } from '../contexts/TradingPlanContext';

const PaymentFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, userProfile, updateProfile } = useSupabaseAuth();
  const { tradingPlan } = useTradingPlan();
  
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  
  // Get selected plan from location state or URL parameters
  const selectedPlan = location.state?.selectedPlan || {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: 'month'
  };

  // Use selectedPlan.id directly for subscription creation
  const planIdForSubscription = selectedPlan?.id || 'starter';

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

        // Handle free coupon checkout - create subscription and save payment record
        if (paymentToken === 'free_coupon_checkout' || (parsedDetails && parsedDetails.method === 'free_coupon')) {
          console.log('Processing free coupon checkout - creating subscription');

          // Create subscription for the selected plan
          await supabaseService.createSubscription(user.id, planIdForSubscription);

          // Save payment record to database
          await supabaseService.createPaymentRecord({
            user_id: user.id,
            plan_name: selectedPlan.name,
            plan_id: planIdForSubscription,
            amount: 0,
            discount_amount: selectedPlan.price,
            final_amount: 0,
            coupon_code: parsedDetails?.coupon_code || 'FREETRIAL100',
            payment_method: 'coupon',
            payment_status: 'completed',
            currency: 'USD',
            payment_date: new Date().toISOString()
          });

          // Update user profile with membership tier
          await updateProfile({
            membership_tier: selectedPlan.name.toLowerCase(),
            setup_complete: true
          });

          navigate('/questionnaire', { state: { selectedPlan } });
          return;
        }

        // Handle paid transactions - create payment record and subscription
        let amountPaid = selectedPlan.price || 0;
        let discountAmount = 0;
        let couponCode = null;

        if (parsedDetails) {
          amountPaid = parsedDetails.amount || selectedPlan.price;
          discountAmount = parsedDetails.discount_amount || 0;
          couponCode = parsedDetails.coupon_code;
        }

        // For demo purposes, we'll simulate payment success and create records
        console.log('Processing payment for plan:', selectedPlan.name);

        // Create subscription
        await supabaseService.createSubscription(user.id, planIdForSubscription);

        // Save payment record
        await supabaseService.createPaymentRecord({
          user_id: user.id,
          plan_name: selectedPlan.name,
          plan_id: planIdForSubscription,
          amount: selectedPlan.price,
          discount_amount: discountAmount,
          final_amount: amountPaid,
          coupon_code: couponCode,
          payment_method: parsedDetails?.method || 'crypto',
          payment_status: 'completed',
          transaction_id: paymentToken,
          currency: 'USD',
          payment_date: new Date().toISOString()
        });

        // Update user profile
        await updateProfile({
          membership_tier: selectedPlan.name.toLowerCase(),
          setup_complete: true
        });

        navigate('/questionnaire', { state: { selectedPlan } });

      } catch (error: any) {
        console.error('Payment processing failed:', error);
        alert('Payment processing failed. Please contact support.');
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
