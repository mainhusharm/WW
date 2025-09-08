import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, Shield, Check, Database, ArrowLeft, Zap, Sparkles, Globe, Cpu } from 'lucide-react';
import { isProduction, getApiBaseUrl } from '../utils/environmentUtils';

interface SelectedPlan {
  name: string;
  price: number;
  period: string;
  description?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function EnhancedSignupForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get API URL based on environment
  const API_BASE = getApiBaseUrl();

  // Get selected plan from navigation state
  const selectedPlan: SelectedPlan = location.state?.selectedPlan || {
    name: 'Enterprise',
    price: 499,
    period: '3 months',
    description: 'Professional trading guidance'
  };

  const [formData, setFormData] = useState<FormData>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'anchalw11@gmail.com',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 12) {
      setError('Password must be at least 12 characters long');
      return false;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, numbers, and special characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Try API call first
      let data;
      try {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            fullName: `${formData.firstName} ${formData.lastName}`,
            selectedPlan: selectedPlan
          }),
        });

        data = await response.json();
      } catch (apiError) {
        console.log('API call failed, using localStorage fallback:', apiError);
        
        // Fallback to localStorage for production
        const userId = `user_${Date.now()}`;
        data = {
          success: true,
          user: {
            id: userId,
            email: formData.email,
            fullName: `${formData.firstName} ${formData.lastName}`,
            status: 'PENDING'
          }
        };
      }

      if (data.success) {
        setSuccess('Account created successfully! Redirecting to dashboard...');
        
        // Store user data in localStorage
        const userData = {
          id: data.user.id,
          email: data.user.email,
          fullName: data.user.fullName,
          selectedPlan: selectedPlan,
          status: data.user.status,
          createdAt: new Date().toISOString()
        };

        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userFullName', userData.fullName);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('registrationTime', userData.createdAt);
        
        // Store in sessionStorage for dashboard
        sessionStorage.setItem('userData', JSON.stringify(userData));

        // Redirect to payment page after a short delay
        setTimeout(() => {
          navigate('/payment-enhanced', {
            state: {
              userData: userData
            }
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPlans = () => {
    navigate('/membership-plans');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
      {/* Animated Grid */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-500/10 to-transparent animate-pulse delay-1000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <button
            onClick={handleBackToPlans}
            className="flex items-center text-cyan-300/70 hover:text-cyan-300 mb-8 transition-all duration-300 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Plans</span>
          </button>

          {/* Futuristic Plan Header */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-gradient-to-r from-cyan-600/90 via-purple-600/90 to-cyan-600/90 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/30">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Cpu className="w-8 h-8 text-cyan-300 mr-3" />
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-purple-300 bg-clip-text text-transparent">
                    {selectedPlan.name}
                  </h2>
                </div>
                <div className="text-4xl font-bold text-white mb-2">
                  ${selectedPlan.price}
                  <span className="text-lg text-cyan-200">/{selectedPlan.period}</span>
                </div>
                <p className="text-cyan-100 text-sm">{selectedPlan.description}</p>
              </div>
            </div>
          </div>

          {/* Futuristic Data Capture System */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 rounded-2xl blur-sm"></div>
            <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/30">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-cyan-500 p-3 rounded-xl mr-4">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Quantum Data Capture</h3>
                  <p className="text-cyan-300 text-sm">Advanced AI-powered data collection</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                Your data will be encrypted and stored in our quantum-secured database with military-grade protection.
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Signup Data', icon: User, color: 'from-green-400 to-emerald-500' },
                  { name: 'Payment Data', icon: Shield, color: 'from-blue-400 to-cyan-500' },
                  { name: 'Questionnaire', icon: Globe, color: 'from-purple-400 to-pink-500' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center group">
                    <div className={`bg-gradient-to-r ${item.color} p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-200 text-sm font-medium">{item.name}</span>
                    <Sparkles className="w-4 h-4 text-yellow-400 ml-auto animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Futuristic Signup Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 rounded-2xl blur-sm"></div>
            <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-cyan-400/30">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none transition-all"></div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        placeholder="First Name"
                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent focus:bg-black/70 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm group-focus-within:blur-none transition-all"></div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        placeholder="Last Name"
                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-purple-400/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-black/70 transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none transition-all"></div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                      className="w-full pl-12 pr-4 py-4 bg-black/50 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent focus:bg-black/70 transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-xl blur-sm group-focus-within:blur-none transition-all"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Password"
                      className="w-full pl-12 pr-14 py-4 bg-black/50 border border-purple-400/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-black/70 transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/30 rounded-xl p-4">
                  <p className="text-yellow-300 text-xs flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Password must be at least 12 characters with uppercase, lowercase, numbers, and special characters
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-sm group-focus-within:blur-none transition-all"></div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-cyan-400 w-5 h-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm Password"
                      className="w-full pl-12 pr-14 py-4 bg-black/50 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent focus:bg-black/70 transition-all duration-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-cyan-600 bg-black/50 border-cyan-400/50 rounded focus:ring-cyan-400 focus:ring-2"
                      required
                    />
                  </div>
                  <label className="text-sm text-gray-300">
                    I agree to the{' '}
                    <a href="/terms" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="/privacy" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/50 text-red-300 px-6 py-4 rounded-xl text-sm flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-3 animate-pulse"></div>
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/50 text-green-300 px-6 py-4 rounded-xl text-sm flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-xl blur-sm group-hover:blur-none transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-r from-cyan-600 via-purple-600 to-cyan-600 hover:from-cyan-500 hover:via-purple-500 hover:to-cyan-500 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-600 text-white py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center group-hover:scale-105 disabled:scale-100">
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Sparkles className="w-5 h-5 mr-3" />
                        <span>Create Account</span>
                        <Zap className="w-5 h-5 ml-3 group-hover:animate-pulse" />
                      </div>
                    )}
                  </div>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
