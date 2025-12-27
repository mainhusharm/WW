'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { api } from '../lib/api';

export default function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  const searchParams = useSearchParams()[0];
  const navigate = useNavigate();
  const { login } = useUser();

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get('email');
    const storedEmail = localStorage.getItem('pendingVerificationEmail');

    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem('pendingVerificationEmail', emailParam);
    } else if (storedEmail) {
      setEmail(storedEmail);
    }

    // Start countdown for resend
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all digits are entered
    if (value && index === 5 && newOtp.every(digit => digit !== '')) {
      handleVerify();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.verifyOtp({ email, otpCode });

      if (data.success) {
        console.log('✅ OTP verification successful, data:', data);
        setSuccess(true);
        localStorage.removeItem('pendingVerificationEmail');

        // Store session token
        if (data.sessionToken) {
          localStorage.setItem('sessionToken', data.sessionToken);
          console.log('💾 Stored session token in localStorage');
        }

        // Authenticate user in frontend context
        if (data.user) {
          console.log('👤 User data from backend:', data.user);
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.fullName || data.user.email,
            uniqueId: data.user.id,
            accountType: 'personal' as const,
            riskTolerance: 'moderate' as const,
            setupComplete: false, // Will be updated based on completion status
          };

          console.log('🔐 Calling login function with:', { userData, token: data.sessionToken || '', rememberMe: true });

          try {
            // Login the user in frontend context
            login(userData, data.sessionToken || '', true);
            console.log('✅ User authenticated in frontend context');
          } catch (loginError) {
            console.error('❌ Login function failed:', loginError);
          }
        } else {
          console.warn('⚠️ No user data in OTP verification response');
        }

        // Handle different verification scenarios
        setTimeout(() => {
          console.log('🔄 OTP Verification - Completion status:', data.completionStatus);
          console.log('🔄 OTP Verification - Requires payment:', data.requiresPayment);

          if (data.completionStatus) {
            // This is a login verification - check completion status
            if (data.completionStatus.questionnaireCompleted) {
              // Case 1: Questionnaire done → Dashboard
              console.log('✅ Login successful - questionnaire completed, redirecting to dashboard');
              navigate('/dashboard');
            } else {
              // Case 2: Payment done but questionnaire not done → Force questionnaire completion
              console.log('⚠️ Login successful - payment completed but questionnaire not done, redirecting to questionnaire');
              navigate('/questionnaire');
            }
          } else if (data.requiresPayment) {
            // This is signup verification but payment not completed
            console.log('⚠️ Email verified but payment required, staying on verification page');
            // Stay on current page or redirect to payment
            const selectedPlan = localStorage.getItem('selectedPlan');
            if (selectedPlan) {
              try {
                const planData = JSON.parse(selectedPlan);
                const urlParams = new URLSearchParams();
                urlParams.set('plan', planData.id || planData.name?.toLowerCase() || 'starter');
                urlParams.set('price', planData.price?.toString() || '199');
                if (planData.discountedPrice) {
                  urlParams.set('discountedPrice', planData.discountedPrice.toString());
                }
                urlParams.set('period', planData.period || 'month');
                urlParams.set('type', planData.type || 'trading');
                navigate(`/payment-flow?${urlParams.toString()}`);
              } catch (error) {
                console.error('Error parsing selected plan:', error);
                navigate('/payment-flow');
              }
            } else {
              navigate('/payment-flow');
            }
          } else {
            // This is successful signup verification → Payment flow
            console.log('✅ Signup verification successful, redirecting to payment');
            const selectedPlan = localStorage.getItem('selectedPlan');
            if (selectedPlan) {
              try {
                const planData = JSON.parse(selectedPlan);
                const urlParams = new URLSearchParams();
                urlParams.set('plan', planData.id || planData.name?.toLowerCase() || 'starter');
                urlParams.set('price', planData.price?.toString() || '199');
                if (planData.discountedPrice) {
                  urlParams.set('discountedPrice', planData.discountedPrice.toString());
                }
                urlParams.set('period', planData.period || 'month');
                urlParams.set('type', planData.type || 'trading');
                navigate(`/payment-flow?${urlParams.toString()}`);
              } catch (error) {
                console.error('Error parsing selected plan:', error);
                navigate('/payment-flow');
              }
            } else {
              navigate('/payment-flow');
            }
          }
        }, 2000);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    setError('');

    try {
      const data = await api.auth.resendOtp(email);

      if (data.success) {
        setCountdown(60);
        setError('');
        // Show success message
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => (input as HTMLInputElement).value = '');
        setOtp(['', '', '', '', '', '']);
        inputs[0]?.focus();
      } else {
        setError(data.error || 'Failed to resend code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Verification Successful!</h2>
          <p className="text-gray-600 mb-6">Your email has been verified. Redirecting...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">TE</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We've sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-600 focus:outline-none transition-colors"
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.some(digit => digit === '')}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mb-4"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Verifying...
            </div>
          ) : (
            'Verify Email'
          )}
        </button>

        {/* Resend Code */}
        <div className="text-center">
          <p className="text-gray-600 text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendCode}
            disabled={countdown > 0 || loading}
            className="text-purple-600 hover:text-purple-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Check your spam/junk folder if you don't see the email.
            <br />
            The code expires in 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
