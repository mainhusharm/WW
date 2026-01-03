'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { api } from '../lib/api';
import { motion, useMotionValue } from 'framer-motion';
import Header from './Header';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20">
        <div className="flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="w-full max-w-2xl relative z-10" style={{ perspective: 1500 }}>
              <motion.div
                className="relative"
                style={{
                  rotateX: useMotionValue(0),
                  rotateY: useMotionValue(0)
                }}
                whileHover={{ z: 10 }}
              >
                <div className="relative group">
                  <motion.div
                    className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
                    animate={{
                      boxShadow: [
                        "0 0 10px 2px rgba(255,255,255,0.03)",
                        "0 0 15px 5px rgba(255,255,255,0.05)",
                        "0 0 10px 2px rgba(255,255,255,0.03)"
                      ],
                      opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatType: "mirror"
                    }}
                  />

                  <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.05] shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                        backgroundSize: '30px 30px'
                      }}
                    />

                    <div className="text-center space-y-4 mb-6 relative z-10">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", duration: 0.8 }}
                        className="mx-auto w-16 h-16 rounded-full border border-green-400/50 flex items-center justify-center relative overflow-hidden bg-green-400/10"
                      >
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>

                      <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                      >
                        Verification Successful!
                      </motion.h1>

                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/60 text-sm"
                      >
                        Your email has been verified. Redirecting...
                      </motion.p>
                    </div>

                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/30 border-t-white"></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <div className="flex items-center justify-center px-4 pt-24 pb-8">
        <div className="max-w-md w-full mt-8">
          <div className="w-full max-w-2xl relative z-10" style={{ perspective: 1500 }}>
            <motion.div
              className="relative"
              style={{
                rotateX: useMotionValue(0),
                rotateY: useMotionValue(0)
              }}
              whileHover={{ z: 10 }}
            >
              <div className="relative group">
                {/* Card glow effect */}
                <motion.div
                  className="absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-700"
                  animate={{
                    boxShadow: [
                      "0 0 10px 2px rgba(255,255,255,0.03)",
                      "0 0 15px 5px rgba(255,255,255,0.05)",
                      "0 0 10px 2px rgba(255,255,255,0.03)"
                    ],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    repeatType: "mirror"
                  }}
                />

                {/* Traveling light beams */}
                <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-[3px] w-[50%] bg-gradient-to-r from-transparent via-white to-transparent opacity-70"
                    animate={{
                      left: ["-50%", "100%"],
                    }}
                    transition={{
                      left: {
                        duration: 2.5,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1
                      }
                    }}
                  />
                </div>

                {/* Glass card background */}
                <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.05] shadow-2xl overflow-hidden">
                  {/* Subtle card inner patterns */}
                  <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                      backgroundSize: '30px 30px'
                    }}
                  />

                  {/* Logo and header */}
                  <div className="text-center space-y-1 mb-6">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 0.8 }}
                      className="mx-auto w-10 h-10 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden"
                    >
                      <span className="text-white font-bold">TE</span>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                    >
                      Verify Your Email
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white/60 text-xs"
                    >
                      We've sent a 6-digit code to <strong className="text-white/80">{email}</strong>
                    </motion.p>
                  </div>

                  {/* OTP Input */}
                  <div className="mb-6 relative z-20">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-center mb-4"
                    >
                      <label className="block text-sm font-medium text-white/80">
                        Enter verification code
                      </label>
                    </motion.div>
                    <div className="flex justify-center space-x-2 relative z-30">
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
                          className="w-12 h-12 text-center text-xl font-bold bg-white/5 border border-white/20 text-white placeholder:text-white/30 rounded-lg focus:border-white/50 focus:bg-white/10 focus:outline-none transition-all duration-300 relative z-40"
                          disabled={loading}
                          autoComplete="off"
                          autoFocus={index === 0}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2"
                    >
                      <span className="text-red-400 text-xs">{error}</span>
                    </motion.div>
                  )}

                  {/* Verify Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleVerify}
                    disabled={loading || otp.some(digit => digit === '')}
                    className="w-full relative group mt-5"
                  >
                    <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover:opacity-70 transition-opacity duration-300" />

                    <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                      {loading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center"
                        >
                          <div className="w-4 h-4 border-2 border-black/70 border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="button-text"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center justify-center gap-1 text-sm font-medium"
                        >
                          Verify Email
                        </motion.span>
                      )}
                    </div>
                  </motion.button>

                  {/* Resend Code */}
                  <motion.div
                    className="text-center mt-4 relative z-30"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-white/60 text-xs mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      onClick={handleResendCode}
                      disabled={countdown > 0 || loading}
                      className="text-white/70 hover:text-white transition-colors duration-300 font-medium disabled:text-white/30 disabled:cursor-not-allowed relative z-40 px-4 py-2 rounded-lg hover:bg-white/10 disabled:hover:bg-transparent"
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                    </button>
                  </motion.div>

                  {/* Help Text */}
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <p className="text-xs text-white/40">
                      Check your spam/junk folder if you don't see the email.
                      <br />
                      The code expires in 10 minutes.
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
