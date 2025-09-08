import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Sparkles, Zap, TrendingUp, ArrowRight } from 'lucide-react';
import FuturisticBackground from './FuturisticBackground';
import { useUser } from '../contexts/UserContext';
import { userFlowService } from '../services/userFlowService';

const SuccessfulPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();
  const [countdown, setCountdown] = useState(10);
  const selectedPlan = location.state?.selectedPlan;
  const paymentData = location.state?.paymentData;

  useEffect(() => {
    // Set up user authentication after successful payment
    const setupUserAfterPayment = () => {
      // Get user data from localStorage or create a new user
      const storedUser = localStorage.getItem('current_user');
      let userData;
      
      if (storedUser) {
        userData = JSON.parse(storedUser);
      } else {
        // Create a new user if none exists
        userData = {
          id: `user_${Date.now()}`,
          email: `user_${Date.now()}@example.com`,
          name: 'New User',
          membershipTier: 'professional',
          isAuthenticated: true,
          setupComplete: false
        };
      }
      
      // Update user with payment information
      const updatedUserData = {
        ...userData,
        membershipTier: selectedPlan?.name?.toLowerCase() || 'professional',
        isAuthenticated: true,
        setupComplete: false,
        selectedPlan: selectedPlan,
        paymentData: paymentData
      };
      
      // Generate a demo token for authentication
      const demoToken = `demo-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Login the user
      login(updatedUserData, demoToken, true);
      
      // Store user data
      localStorage.setItem('current_user', JSON.stringify(updatedUserData));
      localStorage.setItem('access_token', demoToken);
      
      // Mark payment step as completed
      if (updatedUserData.email) {
        userFlowService.markStepCompleted(updatedUserData.email, 'payment');
        localStorage.setItem(`payment_success_${updatedUserData.email}`, 'true');
        localStorage.setItem('payment_success_data', JSON.stringify({
          email: updatedUserData.email,
          plan: selectedPlan,
          paymentData: paymentData,
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    setupUserAfterPayment();
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/questionnaire', { state: { fromPayment: true, plan: selectedPlan } });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, selectedPlan, login, paymentData]);

  return (
    <div className="min-h-screen text-white flex items-center justify-center relative overflow-hidden bg-gray-950">
      <FuturisticBackground />
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto px-6 animate-fade-in-up">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-green-500/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-green-400/80 to-cyan-400/80 rounded-full p-8 mx-auto w-40 h-40 flex items-center justify-center shadow-2xl shadow-green-500/20">
            <CheckCircle className="w-24 h-24 text-white transform transition-transform duration-500 hover:scale-110" />
          </div>
          <Sparkles className="w-10 h-10 text-yellow-300 absolute -top-4 -right-4 animate-spin-slow" />
          <Zap className="w-8 h-8 text-blue-300 absolute -bottom-4 -left-4 animate-ping" />
        </div>

        <div className="space-y-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-green-300 via-cyan-300 to-purple-300 bg-clip-text text-transparent">
            Payment Confirmed
          </h1>
          
          {selectedPlan && (
            <div className="bg-gray-800/50 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-8 transform transition-transform duration-500 hover:scale-105">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <TrendingUp className="w-10 h-10 text-cyan-300" />
                <h2 className="text-3xl font-bold text-cyan-300">{selectedPlan.name} Plan Activated</h2>
              </div>
              <p className="text-gray-300 text-xl">
                Welcome to the next level of your trading journey.
              </p>
            </div>
          )}

          <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
            <p className="text-2xl text-gray-200 mb-4">
              🚀 Your account is being upgraded.
            </p>
            <p className="text-gray-400">
              Redirecting to your personalized setup in{' '}
              <span className="text-cyan-300 font-bold text-3xl">{countdown}</span>
            </p>
          </div>

          <div className="w-full bg-gray-700/50 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-green-400 transition-all duration-1000 ease-linear"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            />
          </div>

          <button
            onClick={() => navigate('/questionnaire', { state: { fromPayment: true, plan: selectedPlan } })}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full overflow-hidden transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-cyan-500/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="relative flex items-center">
              Proceed to Setup <ArrowRight className="ml-2 w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessfulPaymentPage;
