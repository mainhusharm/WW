import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import PaymentIntegration from './PaymentIntegration';
import { useUser } from '../contexts/UserContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import PlanSelection from './PlanSelection';
import Header from './Header';
import { api } from '../lib/api';

const PaymentFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useUser();
  const { createSubscription, availablePlans } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');
  const [showPlanSelection, setShowPlanSelection] = useState(false);

  // Get selected plan - prioritize URL parameters for reliability
  const selectedPlan = (() => {
    const planName = searchParams.get('plan')?.toLowerCase();
    const priceParam = searchParams.get('price');

    // Debug: Show URL parameters
    console.log('PaymentFlow Debug - URL params:', {
      plan: searchParams.get('plan'),
      price: searchParams.get('price'),
      discountedPrice: searchParams.get('discountedPrice'),
      period: searchParams.get('period'),
      type: searchParams.get('type')
    });

    if (planName && priceParam) {
      // Construct plan object from URL parameters
      const plan = {
        id: planName,
        name: planName.charAt(0).toUpperCase() + planName.slice(1),
        price: parseFloat(priceParam),
        discountedPrice: searchParams.get('discountedPrice') ? parseFloat(searchParams.get('discountedPrice')!) : undefined,
        period: searchParams.get('period') || 'month',
        type: searchParams.get('type') || 'trading'
      };
      console.log('PaymentFlow Debug - Constructed plan:', plan);
      return plan;
    }

    // Fallback
    const fallback = location.state?.selectedPlan || availablePlans.find(p => p.id === 'pro') || availablePlans[0];
    console.log('PaymentFlow Debug - Using fallback plan:', fallback);
    return fallback;
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

          // Call payment completion endpoint even for free coupons to update user status
          try {
            if (!user.email) {
              console.log('User email not available for free coupon completion');
            } else {
              const completionData = {
                email: user.email,
                paymentId: paymentToken,
                planData: selectedPlan
              };

              console.log('Sending free coupon payment completion request:', completionData);
              const completionResult = await api.payment.complete(completionData);

              if (completionResult.success) {
                console.log('✅ Free coupon payment completed successfully');
              }
            }
          } catch (error) {
            console.log('Free coupon completion failed, but continuing:', error);
          }

          // Create subscription for the selected plan
          await createSubscription(selectedPlan.id);

          // Update user membership directly for free coupons
          setUser({
            ...user,
            membershipTier: selectedPlan?.name?.toLowerCase() || 'basic' as 'basic' | 'professional' | 'institutional' | 'elite',
            isAuthenticated: user.isAuthenticated || true,
          } as any);

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
          console.log('Free coupon payment flow completed successfully');
          return;
        }

        // Get the correct amount - prioritize paymentData, then parsedDetails, then fallback to plan price
        let amountPaid = selectedPlan?.price || 0;
        if (paymentData && paymentData.amount) {
          amountPaid = paymentData.amount;
        } else if (parsedDetails && parsedDetails.amount !== undefined) {
          amountPaid = parsedDetails.amount;
        }

        // Call payment completion endpoint to save user to database and send welcome email
        if (!user.email) {
          throw new Error('User email is required for payment completion');
        }

        const completionData = {
          email: user.email,
          paymentId: paymentToken,
          planData: selectedPlan
        };

        console.log('Sending payment completion request:', completionData);

        const completionResult = await api.payment.complete(completionData);

        if (completionResult.success) {
          console.log('✅ Payment completed successfully, user saved to database');

          // Mark payment as completed in localStorage
          localStorage.setItem(`payment_completed_${user.email}`, 'true');

          // Create subscription for the selected plan
          await createSubscription(selectedPlan.id);

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
          // Handle payment completion failure
          console.error('Payment completion failed:', completionResult.error);
          alert('Payment processing failed. Please contact support.');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20">
      <Header />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full">
          {/* Back Button */}
          <div className="text-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          </div>

          {/* Selected Plan Summary */}
          {selectedPlan && (
            <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4 mb-6">
              <div className="text-center">
                <div className="text-blue-400 font-semibold text-lg">{selectedPlan.name} Plan</div>
                <div className="text-white text-2xl font-bold">
                  ${selectedPlan.discountedPrice || selectedPlan.price}/{selectedPlan.period}
                </div>
                <div className="text-blue-300 text-sm">Complete your payment to get started</div>
              </div>
            </div>
          )}

          {/* Payment Integration */}
          <PaymentIntegration
            selectedPlan={selectedPlan}
            onPaymentComplete={(token: string) => {
              handlePaymentComplete(token);
            }}
          />

          {/* Confirmation Message */}
          <div className="text-center mt-6 text-gray-400 text-sm space-y-2">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
            <p>After successful payment, you will proceed to the questionnaire.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFlow;
