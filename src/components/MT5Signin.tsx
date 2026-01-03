import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import Header from './Header';

const MT5Signin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const paymentRecord = JSON.parse(localStorage.getItem('paymentRecord') || 'null');
    
    if (currentUser && paymentRecord && paymentRecord.status === 'completed') {
      navigate('/mt5-dashboard');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if user has completed payment
      const paymentRecord = JSON.parse(localStorage.getItem('paymentRecord') || 'null');
      if (!paymentRecord || paymentRecord.status !== 'completed') {
        setError('Please complete your payment first before accessing the dashboard.');
        setIsLoading(false);
        return;
      }

      // Check if email exists in either mt5_users or mt5Customers
      const mt5Users = JSON.parse(localStorage.getItem('mt5_users') || '[]');
      const mt5Customers = JSON.parse(localStorage.getItem('mt5Customers') || '[]');
      
      let existingUser = mt5Users.find((user: any) => user.email === email);
      let existingCustomer = mt5Customers.find((customer: any) => customer.email === email);
      
      if (!existingUser && !existingCustomer) {
        setError('No account found with this email. Please complete your purchase first.');
        setIsLoading(false);
        return;
      }
      
      // Use existing user or create from customer data
      if (!existingUser && existingCustomer) {
        existingUser = {
          id: existingCustomer.id,
          name: existingCustomer.fullName,
          email: existingCustomer.email,
          plan: existingCustomer.selectedPlan?.name || 'Elite',
          status: existingCustomer.status === 'COMPLETED' ? 'active' : 'pending',
          joinDate: existingCustomer.createdAt
        };
        // Update mt5_users with this user
        mt5Users.push(existingUser);
        localStorage.setItem('mt5_users', JSON.stringify(mt5Users));
      }

      // Simple password validation (in real app, this would be server-side)
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        setIsLoading(false);
        return;
      }

      // Set current user and redirect to dashboard
      localStorage.setItem('currentUser', JSON.stringify(existingUser));
      setSuccess('Login successful! Redirecting to dashboard...');
      
      setTimeout(() => {
        navigate('/mt5-dashboard');
      }, 1500);

    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToPayment = () => {
    navigate('/mt5-bots');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      
      <div className="flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">MT5 Bot Dashboard</h2>
            <p className="text-gray-400">Sign in to access your custom MT5 bot dashboard</p>
          </div>

          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-green-400 text-sm">{success}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 disabled:from-gray-500 disabled:to-gray-500 text-white py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In to Dashboard'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm mb-4">
                Don't have an account yet?
              </p>
              <button
                onClick={handleGoToPayment}
                className="text-purple-400 hover:text-purple-300 font-medium text-sm transition-colors"
              >
                Complete your purchase first →
              </button>
            </div>

            <div className="mt-4 text-center space-x-4">
              <button
                onClick={() => {
                  console.log('MT5 Users:', JSON.parse(localStorage.getItem('mt5_users') || '[]'));
                  console.log('MT5 Customers:', JSON.parse(localStorage.getItem('mt5Customers') || '[]'));
                  console.log('Payment Record:', JSON.parse(localStorage.getItem('paymentRecord') || 'null'));
                  alert('Check console for debug info');
                }}
                className="text-gray-500 hover:text-gray-400 text-xs transition-colors"
              >
                Debug: Check Data
              </button>
              <button
                onClick={() => {
                  if (confirm('This will clear all MT5 data. Are you sure?')) {
                    localStorage.removeItem('mt5_users');
                    localStorage.removeItem('mt5Customers');
                    localStorage.removeItem('paymentRecord');
                    localStorage.removeItem('currentUser');
                    localStorage.removeItem('mt5_payment_record');
                    alert('Data cleared. Please try signing up again.');
                    window.location.reload();
                  }
                }}
                className="text-red-500 hover:text-red-400 text-xs transition-colors"
              >
                Reset Data
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-blue-400 font-semibold text-sm mb-2">Important:</h3>
              <ul className="text-blue-300 text-xs space-y-1">
                <li>• You must complete your MT5 bot purchase before signing in</li>
                <li>• One email address = one account only</li>
                <li>• Your account is linked to your payment record</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MT5Signin;
