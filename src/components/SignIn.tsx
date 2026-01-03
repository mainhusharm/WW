import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Eye, EyeOff, AlertCircle, Mail, Lock, Key, Smartphone } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { mockLogin } from '../utils/mockAuth';
import Header from './Header';
import { userFlowService } from '../services/userFlowService';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Get selected plan from location state
  const selectedPlan = location.state?.selectedPlan;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (loginMethod === 'password' && !password) {
      setError('Please enter your password');
      setIsLoading(false);
      return;
    }

    try {
      if (loginMethod === 'otp') {
        console.log('🔐 Attempting OTP login for:', email);

        // Call backend send OTP endpoint
        const data = await api.auth.sendOtp(email);

        console.log('✅ Login OTP sent successfully');
        setSuccess(true);

        // Store email for OTP verification
        localStorage.setItem('pendingVerificationEmail', email);

        // Redirect to OTP verification page
        setTimeout(() => {
          navigate(`/verify?email=${encodeURIComponent(email)}`);
        }, 2000);
      } else {
        console.log('🔐 Attempting password login for:', email);

        // Call backend password login endpoint
        const data = await api.auth.loginWithPassword({ email, password });

        console.log('✅ Password login successful');

        // Handle successful password login
        if (data.user) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.fullName || data.user.email,
            uniqueId: data.user.id,
            accountType: 'personal' as const,
            riskTolerance: 'moderate' as const,
            setupComplete: data.completionStatus?.questionnaireCompleted || false,
          };

          login(userData, data.sessionToken || '', true);

          // Navigate based on completion status
          if (data.completionStatus?.questionnaireCompleted) {
            navigate('/dashboard');
          } else {
            navigate('/questionnaire');
          }
        } else {
          setError('Login successful but user data not found');
        }
      }

    } catch (error: any) {
      console.error('❌ Login failed:', error);
      setError(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20">
      <Header />
      <div className="flex items-center justify-center px-4">
        <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            to={selectedPlan ? "/membership" : "/"}
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to {selectedPlan ? "Plans" : "Home"}</span>
          </Link>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4 mb-6">
            <div className="text-center">
              <div className="text-blue-400 font-semibold text-lg">{selectedPlan.name} Plan</div>
              <div className="text-white text-2xl font-bold">${selectedPlan.price}/{selectedPlan.period}</div>
              <div className="text-blue-300 text-sm">Continue with your selected plan</div>
            </div>
          </div>
        )}

        {/* Futuristic Form Card */}
        <div className="w-full max-w-sm relative z-10" style={{ perspective: 1500 }}>
          {/* Login Method Toggle - Moved outside complex motion.div */}
          <motion.div
            className="flex rounded-lg bg-white/5 p-1 mb-6 mx-auto w-fit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <button
              type="button"
              onClick={() => {
                console.log('OTP button clicked');
                setLoginMethod('otp');
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 cursor-pointer",
                loginMethod === 'otp'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              )}
            >
              <Smartphone className="w-4 h-4" />
              OTP
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Password button clicked');
                setLoginMethod('password');
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 cursor-pointer",
                loginMethod === 'password'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/10'
              )}
            >
              <Key className="w-4 h-4" />
              Password
            </button>
          </motion.div>

          <motion.div
            className="relative"
            style={{
              rotateX: useTransform(useMotionValue(0), [-300, 300], [10, -10]),
              rotateY: useTransform(useMotionValue(0), [-300, 300], [-10, 10])
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              // Simple hover effect - could be enhanced
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
              <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-white/[0.05] shadow-2xl overflow-hidden">
                {/* Subtle card inner patterns */}
                <div className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)`,
                    backgroundSize: '30px 30px'
                  }}
                />

                {/* Logo and header */}
                <div className="text-center space-y-1 mb-5">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.8 }}
                    className="mx-auto w-10 h-10 rounded-full border border-white/10 flex items-center justify-center relative overflow-hidden"
                  >
                    <TrendingUp className="w-6 h-6 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                  </motion.div>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80"
                  >
                    Welcome Back
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/60 text-xs"
                  >
                    Sign in to continue your trading journey
                  </motion.p>
                </div>



                {/* Login form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div className="space-y-3">
                    {/* Error Message */}
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2"
                      >
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-xs">{error}</span>
                      </motion.div>
                    )}

                    {/* Success Message */}
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-green-600/20 border border-green-600 rounded-lg flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-green-400 text-xs">OTP sent to your email! Redirecting...</span>
                      </motion.div>
                    )}

                    {/* Email input */}
                    <motion.div
                      whileFocus={{ scale: 1.02 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                          email ? 'text-white' : 'text-white/40'
                        }`} />

                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setError(''); // Clear error when user starts typing
                          }}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                          placeholder="Email address"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Password input - only show for password login */}
                    <AnimatePresence>
                      {loginMethod === 'password' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            whileFocus={{ scale: 1.02 }}
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className="relative flex items-center overflow-hidden rounded-lg">
                              <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${
                                password ? 'text-white' : 'text-white/40'
                              }`} />

                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                  setPassword(e.target.value);
                                  setError(''); // Clear error when user starts typing
                                }}
                                className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-12 focus:bg-white/10 rounded-lg"
                                placeholder="Password"
                                required={loginMethod === 'password'}
                              />

                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 w-4 h-4 text-white/40 hover:text-white/60 transition-colors duration-300"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Info text */}
                  <motion.div
                    className="text-center pt-1"
                    key={loginMethod}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-xs text-white/60">
                      {loginMethod === 'otp'
                        ? 'Enter your email to receive a verification code'
                        : 'Enter your email and password to sign in'
                      }
                    </p>
                  </motion.div>

                  {/* Sign in button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || (loginMethod === 'password' && !password)}
                    className="w-full relative group/button mt-5"
                  >
                    <div className="absolute inset-0 bg-white/10 rounded-lg blur-lg opacity-0 group-hover/button:opacity-70 transition-opacity duration-300" />

                    <div className="relative overflow-hidden bg-white text-black font-medium h-10 rounded-lg transition-all duration-300 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isLoading ? (
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
                            {loginMethod === 'otp' ? 'Send OTP' : 'Sign In'}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>

                  {/* Sign up link */}
                  <motion.p
                    className="text-center text-xs text-white/60 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Don't have an account?{' '}
                    <Link
                      to="/signup"
                      state={{ selectedPlan }}
                      className="relative inline-block group/signup"
                    >
                      <span className="relative z-10 text-white group-hover/signup:text-white/70 transition-colors duration-300 font-medium">
                        Sign up
                      </span>
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/signup:w-full transition-all duration-300" />
                    </Link>
                  </motion.p>
                </form>
              </div>
            </div>
          </motion.div>
        </div>


        {/* Sign Up Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              state={{ selectedPlan }}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Create account
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
          <div className="text-center text-xs text-gray-400">
            <p>🔒 Your login is secured with industry-standard encryption</p>
            {selectedPlan && <p>Continue with your {selectedPlan.name} plan after signing in</p>}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
