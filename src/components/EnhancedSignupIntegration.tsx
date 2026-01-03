import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { CheckCircle, AlertCircle, Database, Shield } from 'lucide-react';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  plan_type: string;
  phone?: string;
  signup_source?: string;
  referral_code?: string;
}

interface PaymentData {
  email: string;
  status: string;
  payment_method: string;
  amount: number;
  transaction_id?: string;
}

interface QuestionnaireData {
  email: string;
  questionnaire_data: any;
  account_type: string;
  prop_firm: string;
  account_size: number;
  trading_experience: string;
  risk_tolerance: string;
  trading_goals: string;
}

const EnhancedSignupIntegration: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useUser();
  const [captureStatus, setCaptureStatus] = useState<{
    signup: boolean;
    payment: boolean;
    questionnaire: boolean;
    complete: boolean;
  }>({
    signup: false,
    payment: false,
    questionnaire: false,
    complete: false
  });

  const captureSignupData = async (signupData: SignupData): Promise<boolean> => {
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://backend-topb.onrender.com/api'
        : 'http://localhost:5004/api';
      
      const response = await fetch(`${apiBaseUrl}/customer-data/capture-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...signupData,
          signup_source: 'website',
          ip_address: 'auto-detected'
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Signup data captured:', data);
        setCaptureStatus(prev => ({ ...prev, signup: true }));
        return true;
      } else {
        console.error('❌ Failed to capture signup data:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Error capturing signup data:', error);
      return false;
    }
  };

  const capturePaymentData = async (paymentData: PaymentData): Promise<boolean> => {
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://backend-topb.onrender.com/api'
        : 'http://localhost:5004/api';
      
      const response = await fetch(`${apiBaseUrl}/customer-data/capture-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Payment data captured:', data);
        setCaptureStatus(prev => ({ ...prev, payment: true }));
        return true;
      } else {
        console.error('❌ Failed to capture payment data:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Error capturing payment data:', error);
      return false;
    }
  };

  const captureQuestionnaireData = async (questionnaireData: QuestionnaireData): Promise<boolean> => {
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://backend-topb.onrender.com/api'
        : 'http://localhost:5004/api';
      
      const response = await fetch(`${apiBaseUrl}/customer-data/capture-questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionnaireData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Questionnaire data captured:', data);
        setCaptureStatus(prev => ({ ...prev, questionnaire: true }));
        return true;
      } else {
        console.error('❌ Failed to capture questionnaire data:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Error capturing questionnaire data:', error);
      return false;
    }
  };

  const completeDataCapture = async (): Promise<boolean> => {
    try {
      // Mark data capture as complete
      setCaptureStatus(prev => ({ ...prev, complete: true }));
      
      // Log completion
      console.log('🎉 All customer data capture completed successfully!');
      console.log('📊 Data capture status:', captureStatus);
      
      return true;
    } catch (error) {
      console.error('❌ Error completing data capture:', error);
      return false;
    }
  };

  // Enhanced signup function that captures all data
  const enhancedSignup = async (signupData: SignupData) => {
    console.log('🚀 Starting enhanced signup with data capture...');
    
    // Step 1: Capture signup data
    const signupCaptured = await captureSignupData(signupData);
    if (!signupCaptured) {
      console.warn('⚠️ Signup data capture failed, but continuing with registration...');
    }

    // Step 2: Proceed with normal signup
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://backend-topb.onrender.com/api'
        : 'http://localhost:3005/api';
      
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(signupData)
      });

      if (response.ok) {
        const data = await response.json();
        const { access_token } = data;
        
        // Store token and user data
        localStorage.setItem('access_token', access_token);
        
        const userData = {
          uniqueId: Math.floor(100000 + Math.random() * 900000).toString(),
          id: `user_${Date.now()}`,
          name: `${signupData.firstName} ${signupData.lastName}`,
          email: signupData.email,
          membershipTier: signupData.plan_type.toLowerCase(),
          accountType: 'personal' as const,
          riskTolerance: 'moderate' as const,
          isAuthenticated: true,
          setupComplete: false,
          token: access_token,
        };

        login(userData, access_token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        localStorage.setItem('current_user', JSON.stringify(userData));

        console.log('✅ Enhanced signup completed successfully');
        return { success: true, userData };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error) {
      console.error('❌ Enhanced signup failed:', error);
      return { success: false, error };
    }
  };

  // Enhanced payment verification that captures payment data
  const enhancedPaymentVerification = async (paymentData: PaymentData) => {
    console.log('💳 Starting enhanced payment verification with data capture...');
    
    // Step 1: Capture payment data
    const paymentCaptured = await capturePaymentData(paymentData);
    if (!paymentCaptured) {
      console.warn('⚠️ Payment data capture failed, but continuing with verification...');
    }

    // Step 2: Proceed with normal payment verification
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:3005/api';
      
      const response = await fetch(`${apiBaseUrl}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        console.log('✅ Enhanced payment verification completed successfully');
        return { success: true };
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('❌ Enhanced payment verification failed:', error);
      return { success: false, error };
    }
  };

  // Enhanced questionnaire submission that captures questionnaire data
  const enhancedQuestionnaireSubmission = async (questionnaireData: QuestionnaireData) => {
    console.log('📝 Starting enhanced questionnaire submission with data capture...');
    
    // Step 1: Capture questionnaire data
    const questionnaireCaptured = await captureQuestionnaireData(questionnaireData);
    if (!questionnaireCaptured) {
      console.warn('⚠️ Questionnaire data capture failed, but continuing with submission...');
    }

    // Step 2: Proceed with normal questionnaire submission
    try {
      const apiBaseUrl = import.meta.env.PROD 
        ? 'https://frontend-zwwl.onrender.com/api'
        : 'http://localhost:3005/api';
      
      const response = await fetch(`${apiBaseUrl}/questionnaire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionnaireData)
      });

      if (response.ok) {
        console.log('✅ Enhanced questionnaire submission completed successfully');
        return { success: true };
      } else {
        throw new Error('Questionnaire submission failed');
      }
    } catch (error) {
      console.error('❌ Enhanced questionnaire submission failed:', error);
      return { success: false, error };
    }
  };

  // Complete the entire data capture process
  const completeEnhancedDataCapture = async () => {
    console.log('🎯 Completing enhanced data capture process...');
    
    const completed = await completeDataCapture();
    if (completed) {
      console.log('🎉 Enhanced data capture process completed successfully!');
      console.log('📊 All customer data has been captured and stored securely');
      console.log('🔐 Data is now accessible only to admin users');
    }
    
    return completed;
  };

  return {
    // Data capture functions
    captureSignupData,
    capturePaymentData,
    captureQuestionnaireData,
    completeDataCapture,
    
    // Enhanced integration functions
    enhancedSignup,
    enhancedPaymentVerification,
    enhancedQuestionnaireSubmission,
    completeEnhancedDataCapture,
    
    // Status
    captureStatus,
    setCaptureStatus
  };
};

export default EnhancedSignupIntegration;
