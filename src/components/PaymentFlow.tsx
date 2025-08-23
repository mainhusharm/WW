import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import PaymentIntegration from './PaymentIntegration';
import { useUser } from '../contexts/UserContext';
import api from '../api';

const PaymentFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useUser();
  
  // Get selected plan from location state
  const selectedPlan = location.state?.selectedPlan;

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
            membershipTier: selectedPlan.name.toLowerCase() as 'basic' | 'professional' | 'institutional' | 'elite',
          });
          
          // Navigate directly to success page
          navigate('/successful-payment', { state: { selectedPlan } });
          return;
        }
        
        const requestData = {
          token: paymentToken,
          plan: selectedPlan.name.toLowerCase(),
          user_id: user.id,
          amount_paid: paymentData?.amount || parsedDetails?.amount || selectedPlan.price,
          coupon_code: paymentData?.coupon_code || parsedDetails?.coupon_code || null,
        };

        console.log('Sending payment verification request:', requestData);

        const response = await api.post('/payment/verify-payment', requestData);

        if (response.status === 200) {
          setUser({
            ...user,
            membershipTier: selectedPlan.name.toLowerCase() as 'basic' | 'professional' | 'institutional' | 'elite',
          });
          navigate('/successful-payment', { state: { selectedPlan } });
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
              <h1 className="text-2xl font-bold text-white">TraderEdge Pro</h1>
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
