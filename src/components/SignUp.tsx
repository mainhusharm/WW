import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock, Database, Shield, Phone, Building, Globe } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import TemporaryAccountNotice from './TemporaryAccountNotice';
import api from '../api';
import { userFlowService } from '../services/userFlowService';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();

  // Get selected plan from location state or default
  const selectedPlan = location.state?.selectedPlan;

  useEffect(() => {
    if (!selectedPlan) {
      navigate('/membership');
    }
  }, [selectedPlan, navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    country: '',
    agreeToTerms: false,
    agreeToMarketing: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTempNotice, setShowTempNotice] = useState(false);
  const [dataCaptureStatus] = useState({
    signup: false,
    payment: false,
    questionnaire: false,
    complete: false
  });

  // Enhanced signup integration will be handled inline

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      return 'First name is required';
    }
    if (!formData.lastName.trim()) {
      return 'Last name is required';
    }
    if (!formData.email || !formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }
    if (!formData.phone.trim()) {
      return 'Phone number is required';
    }
    if (formData.password.length < 12) {
      return 'Password must be at least 12 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    if (!agreedToTerms) {
      return 'Please agree to the Terms of Service and Privacy Policy';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      // Check if account already exists with complete flow
      const accountExists = await userFlowService.checkAccountExists(formData.email);
      if (accountExists) {
        setError('An account with this email already exists and has completed the signup process. Please sign in instead.');
        setIsLoading(false);
        return;
      }

      // Register with unified customer service (saves to both users and customers tables)
      const response = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        company: formData.company,
        country: formData.country,
        agreeToMarketing: formData.agreeToMarketing,
        plan_type: selectedPlan.name.toLowerCase(),
      });

      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);

      const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();

      const userData = {
        uniqueId,
        id: `user_${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        membershipTier: selectedPlan.name.toLowerCase(),
        accountType: 'personal' as const,
        riskTolerance: 'moderate' as const,
        isAuthenticated: true,
        setupComplete: false,
        selectedPlan,
        token: access_token,
        // Initialize with empty trading data - will be populated by questionnaire
        tradingData: null
      };

      login(userData, access_token);
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('current_user', JSON.stringify(userData));

      // Successfully registered, redirect to payment
      console.log('✅ User registered and saved to customer service database');
      navigate('/payment-flow', { state: { selectedPlan } });
    } catch (err: any) {
      console.error('Backend signup failed, using fallback:', err);
      
      // Check for duplicate account error
      if (err.response?.status === 409 || err.message?.includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.');
        setIsLoading(false);
        return;
      }
      
      // Create temporary account for immediate access to payment flow
      const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('access_token', tempToken);
      
      const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();

      const userData = {
        uniqueId,
        id: `temp_user_${Date.now()}`,
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        membershipTier: selectedPlan.name.toLowerCase(),
        accountType: 'personal' as const,
        riskTolerance: 'moderate' as const,
        isAuthenticated: true,
        setupComplete: false,
        selectedPlan,
        token: tempToken,
        isTemporary: true,
      };

      login(userData, tempToken);
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('current_user', JSON.stringify(userData));
      
      // Store signup data for later backend sync and signin validation
      localStorage.setItem('pending_signup_data', JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        company: formData.company,
        country: formData.country,
        agreeToMarketing: formData.agreeToMarketing,
        plan_type: selectedPlan.name.toLowerCase(),
        timestamp: Date.now()
      }));

      // Redirect to payment page immediately
      navigate('/payment-flow', { state: { selectedPlan } });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <Header />
      <div className="flex items-center justify-center px-4">
        <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/membership" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Plans</span>
          </Link>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold text-white">
              TraderEdge Pro
              <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-1 rounded-full font-semibold">BETA</span>
            </span>
          </div>

          <h2 className="text-3xl font-bold text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-gray-400">
            Start your journey to funded trading success
          </p>
        </div>

        {/* Selected Plan Summary */}
        {selectedPlan && (
          <div className="bg-blue-600/20 border border-blue-600 rounded-xl p-4 mb-6">
            <div className="text-center">
              <div className="text-blue-400 font-semibold text-lg">{selectedPlan.name} Plan</div>
              <div className="text-white text-2xl font-bold">${selectedPlan.price}/{selectedPlan.period}</div>
              <div className="text-blue-300 text-sm">Professional trading guidance</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-600/20 border border-red-600 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name*</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your first name"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name*</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your last name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address*</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number*</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </div>

            {/* Company and Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Company (Optional)</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Country*</label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select your country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="JP">Japan</option>
                    <option value="SG">Singapore</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password*</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                  minLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password*</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>


            {/* Terms Agreement */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                  I agree to the{' '}
                  <a href="/terms-of-service" target="_blank" className="text-blue-400 hover:text-blue-300">Terms and Conditions</a>
                  {' '}and{' '}
                  <a href="/privacy-policy" target="_blank" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>
                  <span className="text-red-400">*</span>
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={formData.agreeToMarketing}
                  onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
                  className="mt-1 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="marketing" className="text-sm text-gray-300 leading-relaxed">
                  I would like to receive updates about new features and special offers
                </label>
              </div>
            </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                <>
                  <span>Create Account & Continue to Payment</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
        </form>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/signin" 
              state={{ selectedPlan }}
              className="text-blue-400 hover:text-blue-300 font-semibold"
            >
              Sign in here
            </Link>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
          <div className="text-center text-xs text-gray-400">
            <p>🔒 Your data is encrypted and secure</p>
            <p>Cancel anytime</p>
          </div>
        </div>
        </div>
      </div>
      
      <TemporaryAccountNotice 
        isVisible={showTempNotice} 
        onClose={() => setShowTempNotice(false)} 
      />
    </div>
  );
};

export default SignUp;
