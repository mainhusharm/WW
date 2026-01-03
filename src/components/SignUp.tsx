import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle, User, Mail, Lock, Database, Shield, Phone, Building, Globe } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import Header from './Header';
import TemporaryAccountNotice from './TemporaryAccountNotice';
import api from '../lib/api';
import { userFlowService } from '../services/userFlowService';
import { productionApi, isProductionBackendUnavailable } from '../utils/productionFallback';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '../lib/utils';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useUser();

  // Get selected plan from URL parameters (more reliable than state)
  const searchParams = new URLSearchParams(location.search);
  const planParam = searchParams.get('plan');
  const selectedPlan = planParam ? {
    id: planParam,
    name: planParam.charAt(0).toUpperCase() + planParam.slice(1),
    price: parseFloat(searchParams.get('price') || '199'),
    discountedPrice: searchParams.get('discountedPrice') ? parseFloat(searchParams.get('discountedPrice')!) : undefined,
    period: searchParams.get('period') || 'month',
    type: searchParams.get('type') || 'trading'
  } : location.state?.selectedPlan;

  // Removed automatic redirect - allow users to access signup without pre-selected plan

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
      // Prepare user data for backend
      const userData = {
        email: formData.email,
        password: formData.password,
        fullName: `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company || '',
        country: formData.country,
        agreeToMarketing: formData.agreeToMarketing
      };

      console.log('🔄 Calling backend registration API...');
      console.log('📋 Request data:', userData);

      // Call backend registration endpoint using api client
      const result = await api.auth.register(userData);

      console.log(' API Response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      console.log('✅ User registered successfully');
      console.log('📧 Email should be sent to:', formData.email);

      // Store user data in localStorage for later use
      localStorage.setItem('pendingVerificationEmail', formData.email);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userFullName', userData.fullName);
      localStorage.setItem('selectedPlan', JSON.stringify(selectedPlan));

      console.log('🔀 Redirecting to payment page...');

      // Redirect to payment page using React Router (maintains SPA state)
      console.log('🚀 Redirecting to payment page:', `/payment-flow`);
      navigate('/payment-flow');

    } catch (err: any) {
      console.error('Signup failed:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 pt-20">
      <Header />
      <div className="flex items-center justify-center px-4">
        <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/membership" className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Plans</span>
          </Link>
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

        {/* Futuristic Form Card */}
        <div className="w-full max-w-2xl relative z-10" style={{ perspective: 1500 }}>
          <motion.div
            className="relative"
            style={{
              rotateX: useTransform(useMotionValue(0), [-300, 300], [10, -10]),
              rotateY: useTransform(useMotionValue(0), [-300, 300], [-10, 10])
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              // Simple hover effect
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
                    Create Your Account
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-white/60 text-xs"
                  >
                    Start your journey to funded trading success
                  </motion.p>
                </div>

                {/* Signup form */}
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

                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.firstName ? 'text-white' : 'text-white/40'}`} />
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                            placeholder="First name"
                            required
                          />
                        </div>
                      </motion.div>

                      <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <User className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.lastName ? 'text-white' : 'text-white/40'}`} />
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                            placeholder="Last name"
                            required
                          />
                        </div>
                      </motion.div>
                    </div>

                    {/* Email */}
                    <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Mail className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.email ? 'text-white' : 'text-white/40'}`} />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                          placeholder="Email address"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Phone */}
                    <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Phone className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.phone ? 'text-white' : 'text-white/40'}`} />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                          placeholder="Phone number"
                          required
                        />
                      </div>
                    </motion.div>

                    {/* Company and Country */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <Building className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.company ? 'text-white' : 'text-white/40'}`} />
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => handleInputChange('company', e.target.value)}
                            className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                            placeholder="Company (optional)"
                          />
                        </div>
                      </motion.div>

                      <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                        <div className="relative flex items-center overflow-hidden rounded-lg">
                          <Globe className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.country ? 'text-white' : 'text-white/40'}`} />
                          <select
                            value={formData.country}
                            onChange={(e) => handleInputChange('country', e.target.value)}
                            className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-3 focus:bg-white/10 rounded-lg"
                            required
                          >
                            <option value="" className="bg-gray-800">Select country</option>
                            <option value="AF" className="bg-gray-800">Afghanistan</option>
                            <option value="AL" className="bg-gray-800">Albania</option>
                            <option value="DZ" className="bg-gray-800">Algeria</option>
                            <option value="AS" className="bg-gray-800">American Samoa</option>
                            <option value="AD" className="bg-gray-800">Andorra</option>
                            <option value="AO" className="bg-gray-800">Angola</option>
                            <option value="AI" className="bg-gray-800">Anguilla</option>
                            <option value="AQ" className="bg-gray-800">Antarctica</option>
                            <option value="AG" className="bg-gray-800">Antigua and Barbuda</option>
                            <option value="AR" className="bg-gray-800">Argentina</option>
                            <option value="AM" className="bg-gray-800">Armenia</option>
                            <option value="AW" className="bg-gray-800">Aruba</option>
                            <option value="AU" className="bg-gray-800">Australia</option>
                            <option value="AT" className="bg-gray-800">Austria</option>
                            <option value="AZ" className="bg-gray-800">Azerbaijan</option>
                            <option value="BS" className="bg-gray-800">Bahamas</option>
                            <option value="BH" className="bg-gray-800">Bahrain</option>
                            <option value="BD" className="bg-gray-800">Bangladesh</option>
                            <option value="BB" className="bg-gray-800">Barbados</option>
                            <option value="BY" className="bg-gray-800">Belarus</option>
                            <option value="BE" className="bg-gray-800">Belgium</option>
                            <option value="BZ" className="bg-gray-800">Belize</option>
                            <option value="BJ" className="bg-gray-800">Benin</option>
                            <option value="BM" className="bg-gray-800">Bermuda</option>
                            <option value="BT" className="bg-gray-800">Bhutan</option>
                            <option value="BO" className="bg-gray-800">Bolivia</option>
                            <option value="BA" className="bg-gray-800">Bosnia and Herzegovina</option>
                            <option value="BW" className="bg-gray-800">Botswana</option>
                            <option value="BR" className="bg-gray-800">Brazil</option>
                            <option value="BN" className="bg-gray-800">Brunei</option>
                            <option value="BG" className="bg-gray-800">Bulgaria</option>
                            <option value="BF" className="bg-gray-800">Burkina Faso</option>
                            <option value="BI" className="bg-gray-800">Burundi</option>
                            <option value="KH" className="bg-gray-800">Cambodia</option>
                            <option value="CM" className="bg-gray-800">Cameroon</option>
                            <option value="CA" className="bg-gray-800">Canada</option>
                            <option value="CV" className="bg-gray-800">Cape Verde</option>
                            <option value="KY" className="bg-gray-800">Cayman Islands</option>
                            <option value="CF" className="bg-gray-800">Central African Republic</option>
                            <option value="TD" className="bg-gray-800">Chad</option>
                            <option value="CL" className="bg-gray-800">Chile</option>
                            <option value="CN" className="bg-gray-800">China</option>
                            <option value="CO" className="bg-gray-800">Colombia</option>
                            <option value="KM" className="bg-gray-800">Comoros</option>
                            <option value="CG" className="bg-gray-800">Congo</option>
                            <option value="CD" className="bg-gray-800">Congo, Democratic Republic</option>
                            <option value="CK" className="bg-gray-800">Cook Islands</option>
                            <option value="CR" className="bg-gray-800">Costa Rica</option>
                            <option value="CI" className="bg-gray-800">Cote d'Ivoire</option>
                            <option value="HR" className="bg-gray-800">Croatia</option>
                            <option value="CU" className="bg-gray-800">Cuba</option>
                            <option value="CW" className="bg-gray-800">Curaçao</option>
                            <option value="CY" className="bg-gray-800">Cyprus</option>
                            <option value="CZ" className="bg-gray-800">Czech Republic</option>
                            <option value="DK" className="bg-gray-800">Denmark</option>
                            <option value="DJ" className="bg-gray-800">Djibouti</option>
                            <option value="DM" className="bg-gray-800">Dominica</option>
                            <option value="DO" className="bg-gray-800">Dominican Republic</option>
                            <option value="EC" className="bg-gray-800">Ecuador</option>
                            <option value="EG" className="bg-gray-800">Egypt</option>
                            <option value="SV" className="bg-gray-800">El Salvador</option>
                            <option value="GQ" className="bg-gray-800">Equatorial Guinea</option>
                            <option value="ER" className="bg-gray-800">Eritrea</option>
                            <option value="EE" className="bg-gray-800">Estonia</option>
                            <option value="ET" className="bg-gray-800">Ethiopia</option>
                            <option value="FK" className="bg-gray-800">Falkland Islands</option>
                            <option value="FO" className="bg-gray-800">Faroe Islands</option>
                            <option value="FJ" className="bg-gray-800">Fiji</option>
                            <option value="FI" className="bg-gray-800">Finland</option>
                            <option value="FR" className="bg-gray-800">France</option>
                            <option value="GF" className="bg-gray-800">French Guiana</option>
                            <option value="PF" className="bg-gray-800">French Polynesia</option>
                            <option value="GA" className="bg-gray-800">Gabon</option>
                            <option value="GM" className="bg-gray-800">Gambia</option>
                            <option value="GE" className="bg-gray-800">Georgia</option>
                            <option value="DE" className="bg-gray-800">Germany</option>
                            <option value="GH" className="bg-gray-800">Ghana</option>
                            <option value="GI" className="bg-gray-800">Gibraltar</option>
                            <option value="GR" className="bg-gray-800">Greece</option>
                            <option value="GL" className="bg-gray-800">Greenland</option>
                            <option value="GD" className="bg-gray-800">Grenada</option>
                            <option value="GP" className="bg-gray-800">Guadeloupe</option>
                            <option value="GU" className="bg-gray-800">Guam</option>
                            <option value="GT" className="bg-gray-800">Guatemala</option>
                            <option value="GG" className="bg-gray-800">Guernsey</option>
                            <option value="GN" className="bg-gray-800">Guinea</option>
                            <option value="GW" className="bg-gray-800">Guinea-Bissau</option>
                            <option value="GY" className="bg-gray-800">Guyana</option>
                            <option value="HT" className="bg-gray-800">Haiti</option>
                            <option value="HN" className="bg-gray-800">Honduras</option>
                            <option value="HK" className="bg-gray-800">Hong Kong</option>
                            <option value="HU" className="bg-gray-800">Hungary</option>
                            <option value="IS" className="bg-gray-800">Iceland</option>
                            <option value="IN" className="bg-gray-800">India</option>
                            <option value="ID" className="bg-gray-800">Indonesia</option>
                            <option value="IR" className="bg-gray-800">Iran</option>
                            <option value="IQ" className="bg-gray-800">Iraq</option>
                            <option value="IE" className="bg-gray-800">Ireland</option>
                            <option value="IM" className="bg-gray-800">Isle of Man</option>
                            <option value="IL" className="bg-gray-800">Israel</option>
                            <option value="IT" className="bg-gray-800">Italy</option>
                            <option value="JM" className="bg-gray-800">Jamaica</option>
                            <option value="JP" className="bg-gray-800">Japan</option>
                            <option value="JE" className="bg-gray-800">Jersey</option>
                            <option value="JO" className="bg-gray-800">Jordan</option>
                            <option value="KZ" className="bg-gray-800">Kazakhstan</option>
                            <option value="KE" className="bg-gray-800">Kenya</option>
                            <option value="KI" className="bg-gray-800">Kiribati</option>
                            <option value="KW" className="bg-gray-800">Kuwait</option>
                            <option value="KG" className="bg-gray-800">Kyrgyzstan</option>
                            <option value="LA" className="bg-gray-800">Laos</option>
                            <option value="LV" className="bg-gray-800">Latvia</option>
                            <option value="LB" className="bg-gray-800">Lebanon</option>
                            <option value="LS" className="bg-gray-800">Lesotho</option>
                            <option value="LR" className="bg-gray-800">Liberia</option>
                            <option value="LY" className="bg-gray-800">Libya</option>
                            <option value="LI" className="bg-gray-800">Liechtenstein</option>
                            <option value="LT" className="bg-gray-800">Lithuania</option>
                            <option value="LU" className="bg-gray-800">Luxembourg</option>
                            <option value="MO" className="bg-gray-800">Macao</option>
                            <option value="MK" className="bg-gray-800">Macedonia</option>
                            <option value="MG" className="bg-gray-800">Madagascar</option>
                            <option value="MW" className="bg-gray-800">Malawi</option>
                            <option value="MY" className="bg-gray-800">Malaysia</option>
                            <option value="MV" className="bg-gray-800">Maldives</option>
                            <option value="ML" className="bg-gray-800">Mali</option>
                            <option value="MT" className="bg-gray-800">Malta</option>
                            <option value="MH" className="bg-gray-800">Marshall Islands</option>
                            <option value="MQ" className="bg-gray-800">Martinique</option>
                            <option value="MR" className="bg-gray-800">Mauritania</option>
                            <option value="MU" className="bg-gray-800">Mauritius</option>
                            <option value="YT" className="bg-gray-800">Mayotte</option>
                            <option value="MX" className="bg-gray-800">Mexico</option>
                            <option value="FM" className="bg-gray-800">Micronesia</option>
                            <option value="MD" className="bg-gray-800">Moldova</option>
                            <option value="MC" className="bg-gray-800">Monaco</option>
                            <option value="MN" className="bg-gray-800">Mongolia</option>
                            <option value="ME" className="bg-gray-800">Montenegro</option>
                            <option value="MS" className="bg-gray-800">Montserrat</option>
                            <option value="MA" className="bg-gray-800">Morocco</option>
                            <option value="MZ" className="bg-gray-800">Mozambique</option>
                            <option value="MM" className="bg-gray-800">Myanmar</option>
                            <option value="NA" className="bg-gray-800">Namibia</option>
                            <option value="NR" className="bg-gray-800">Nauru</option>
                            <option value="NP" className="bg-gray-800">Nepal</option>
                            <option value="NL" className="bg-gray-800">Netherlands</option>
                            <option value="NC" className="bg-gray-800">New Caledonia</option>
                            <option value="NZ" className="bg-gray-800">New Zealand</option>
                            <option value="NI" className="bg-gray-800">Nicaragua</option>
                            <option value="NE" className="bg-gray-800">Niger</option>
                            <option value="NG" className="bg-gray-800">Nigeria</option>
                            <option value="NU" className="bg-gray-800">Niue</option>
                            <option value="NF" className="bg-gray-800">Norfolk Island</option>
                            <option value="KP" className="bg-gray-800">North Korea</option>
                            <option value="MP" className="bg-gray-800">Northern Mariana Islands</option>
                            <option value="NO" className="bg-gray-800">Norway</option>
                            <option value="OM" className="bg-gray-800">Oman</option>
                            <option value="PK" className="bg-gray-800">Pakistan</option>
                            <option value="PW" className="bg-gray-800">Palau</option>
                            <option value="PS" className="bg-gray-800">Palestine</option>
                            <option value="PA" className="bg-gray-800">Panama</option>
                            <option value="PG" className="bg-gray-800">Papua New Guinea</option>
                            <option value="PY" className="bg-gray-800">Paraguay</option>
                            <option value="PE" className="bg-gray-800">Peru</option>
                            <option value="PH" className="bg-gray-800">Philippines</option>
                            <option value="PN" className="bg-gray-800">Pitcairn</option>
                            <option value="PL" className="bg-gray-800">Poland</option>
                            <option value="PT" className="bg-gray-800">Portugal</option>
                            <option value="PR" className="bg-gray-800">Puerto Rico</option>
                            <option value="QA" className="bg-gray-800">Qatar</option>
                            <option value="RE" className="bg-gray-800">Réunion</option>
                            <option value="RO" className="bg-gray-800">Romania</option>
                            <option value="RU" className="bg-gray-800">Russia</option>
                            <option value="RW" className="bg-gray-800">Rwanda</option>
                            <option value="BL" className="bg-gray-800">Saint Barthélemy</option>
                            <option value="SH" className="bg-gray-800">Saint Helena</option>
                            <option value="KN" className="bg-gray-800">Saint Kitts and Nevis</option>
                            <option value="LC" className="bg-gray-800">Saint Lucia</option>
                            <option value="MF" className="bg-gray-800">Saint Martin</option>
                            <option value="PM" className="bg-gray-800">Saint Pierre and Miquelon</option>
                            <option value="VC" className="bg-gray-800">Saint Vincent and the Grenadines</option>
                            <option value="WS" className="bg-gray-800">Samoa</option>
                            <option value="SM" className="bg-gray-800">San Marino</option>
                            <option value="ST" className="bg-gray-800">São Tomé and Príncipe</option>
                            <option value="SA" className="bg-gray-800">Saudi Arabia</option>
                            <option value="SN" className="bg-gray-800">Senegal</option>
                            <option value="RS" className="bg-gray-800">Serbia</option>
                            <option value="SC" className="bg-gray-800">Seychelles</option>
                            <option value="SL" className="bg-gray-800">Sierra Leone</option>
                            <option value="SG" className="bg-gray-800">Singapore</option>
                            <option value="SX" className="bg-gray-800">Sint Maarten</option>
                            <option value="SK" className="bg-gray-800">Slovakia</option>
                            <option value="SI" className="bg-gray-800">Slovenia</option>
                            <option value="SB" className="bg-gray-800">Solomon Islands</option>
                            <option value="SO" className="bg-gray-800">Somalia</option>
                            <option value="ZA" className="bg-gray-800">South Africa</option>
                            <option value="GS" className="bg-gray-800">South Georgia and the South Sandwich Islands</option>
                            <option value="KR" className="bg-gray-800">South Korea</option>
                            <option value="SS" className="bg-gray-800">South Sudan</option>
                            <option value="ES" className="bg-gray-800">Spain</option>
                            <option value="LK" className="bg-gray-800">Sri Lanka</option>
                            <option value="SD" className="bg-gray-800">Sudan</option>
                            <option value="SR" className="bg-gray-800">Suriname</option>
                            <option value="SJ" className="bg-gray-800">Svalbard and Jan Mayen</option>
                            <option value="SZ" className="bg-gray-800">Swaziland</option>
                            <option value="SE" className="bg-gray-800">Sweden</option>
                            <option value="CH" className="bg-gray-800">Switzerland</option>
                            <option value="SY" className="bg-gray-800">Syria</option>
                            <option value="TW" className="bg-gray-800">Taiwan</option>
                            <option value="TJ" className="bg-gray-800">Tajikistan</option>
                            <option value="TZ" className="bg-gray-800">Tanzania</option>
                            <option value="TH" className="bg-gray-800">Thailand</option>
                            <option value="TL" className="bg-gray-800">Timor-Leste</option>
                            <option value="TG" className="bg-gray-800">Togo</option>
                            <option value="TK" className="bg-gray-800">Tokelau</option>
                            <option value="TO" className="bg-gray-800">Tonga</option>
                            <option value="TT" className="bg-gray-800">Trinidad and Tobago</option>
                            <option value="TN" className="bg-gray-800">Tunisia</option>
                            <option value="TR" className="bg-gray-800">Turkey</option>
                            <option value="TM" className="bg-gray-800">Turkmenistan</option>
                            <option value="TC" className="bg-gray-800">Turks and Caicos Islands</option>
                            <option value="TV" className="bg-gray-800">Tuvalu</option>
                            <option value="UG" className="bg-gray-800">Uganda</option>
                            <option value="UA" className="bg-gray-800">Ukraine</option>
                            <option value="AE" className="bg-gray-800">United Arab Emirates</option>
                            <option value="GB" className="bg-gray-800">United Kingdom</option>
                            <option value="US" className="bg-gray-800">United States</option>
                            <option value="UY" className="bg-gray-800">Uruguay</option>
                            <option value="UZ" className="bg-gray-800">Uzbekistan</option>
                            <option value="VU" className="bg-gray-800">Vanuatu</option>
                            <option value="VA" className="bg-gray-800">Vatican City</option>
                            <option value="VE" className="bg-gray-800">Venezuela</option>
                            <option value="VN" className="bg-gray-800">Vietnam</option>
                            <option value="VG" className="bg-gray-800">Virgin Islands, British</option>
                            <option value="VI" className="bg-gray-800">Virgin Islands, U.S.</option>
                            <option value="WF" className="bg-gray-800">Wallis and Futuna</option>
                            <option value="EH" className="bg-gray-800">Western Sahara</option>
                            <option value="YE" className="bg-gray-800">Yemen</option>
                            <option value="ZM" className="bg-gray-800">Zambia</option>
                            <option value="ZW" className="bg-gray-800">Zimbabwe</option>
                          </select>
                        </div>
                      </motion.div>
                    </div>

                    {/* Password */}
                    <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.password ? 'text-white' : 'text-white/40'}`} />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10 rounded-lg"
                          placeholder="Password"
                          required
                          minLength={12}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 cursor-pointer"
                        >
                          {showPassword ? (
                            <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                          )}
                        </button>
                      </div>
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div whileFocus={{ scale: 1.02 }} whileHover={{ scale: 1.01 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                      <div className="relative flex items-center overflow-hidden rounded-lg">
                        <Lock className={`absolute left-3 w-4 h-4 transition-all duration-300 ${formData.confirmPassword ? 'text-white' : 'text-white/40'}`} />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          className="w-full bg-white/5 border-transparent focus:border-white/20 text-white placeholder:text-white/30 h-10 transition-all duration-300 pl-10 pr-10 focus:bg-white/10 rounded-lg"
                          placeholder="Confirm password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 cursor-pointer"
                        >
                          {showConfirmPassword ? (
                            <Eye className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-white/40 hover:text-white transition-colors duration-300" />
                          )}
                        </button>
                      </div>
                    </motion.div>

                    {/* Terms Agreement */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200 cursor-pointer"
                          />
                          {agreedToTerms && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute top-1 left-0 flex items-center justify-center text-black pointer-events-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        <label htmlFor="terms" className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200 leading-relaxed cursor-pointer" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                          I agree to the{' '}
                          <Link to="/terms-of-service" className="text-white/70 hover:text-white transition-colors duration-300 underline">Terms</Link>
                          {' '}and{' '}
                          <Link to="/privacy-policy" className="text-white/70 hover:text-white transition-colors duration-300 underline">Privacy Policy</Link>
                          <span className="text-red-400">*</span>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <input
                            type="checkbox"
                            id="marketing"
                            checked={formData.agreeToMarketing}
                            onChange={(e) => handleInputChange('agreeToMarketing', e.target.checked)}
                            className="mt-1 appearance-none h-4 w-4 rounded border border-white/20 bg-white/5 checked:bg-white checked:border-white focus:outline-none focus:ring-1 focus:ring-white/30 transition-all duration-200 cursor-pointer"
                          />
                          {formData.agreeToMarketing && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute top-1 left-0 flex items-center justify-center text-black pointer-events-none"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </motion.div>
                          )}
                        </div>
                        <label htmlFor="marketing" className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200 leading-relaxed cursor-pointer" onClick={() => handleInputChange('agreeToMarketing', !formData.agreeToMarketing)}>
                          I would like to receive updates about new features
                        </label>
                      </div>
                    </div>
                  </motion.div>

                  {/* Sign up button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
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
                            Create Account
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>

                  {/* Sign in link */}
                  <motion.p
                    className="text-center text-xs text-white/60 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    Already have an account?{' '}
                    <Link
                      to="/signin"
                      state={{ selectedPlan }}
                      className="relative inline-block group/signup"
                    >
                      <span className="relative z-10 text-white group-hover/signup:text-white/70 transition-colors duration-300 font-medium">
                        Sign in
                      </span>
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-white group-hover/signup:w-full transition-all duration-300" />
                    </Link>
                  </motion.p>
                </form>
              </div>
            </div>
          </motion.div>
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
