import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  Send,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FormData {
  // Contact Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  timezone: string;

  // Trading Background
  experienceLevel: string;
  propFirms: string[];
  currentStrategy: string;
  dailyTimeCommitment: string;

  // Strategy Details
  strategyType: string;
  timeframes: string[];
  indicators: string;
  entryRules: string;
  exitRules: string;
  riskManagement: string;

  // Technical Requirements
  platform: string;
  broker: string;
  accountSize: string;
  riskPerTrade: string;

  // Project Details
  timeline: string;
  budget: string;
  specialRequirements: string;
  additionalNotes: string;
}

const MT5InquiryForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    timezone: '',
    experienceLevel: '',
    propFirms: [],
    currentStrategy: '',
    dailyTimeCommitment: '',
    strategyType: '',
    timeframes: [],
    indicators: '',
    entryRules: '',
    exitRules: '',
    riskManagement: '',
    platform: 'MT5',
    broker: '',
    accountSize: '',
    riskPerTrade: '',
    timeline: '',
    budget: '',
    specialRequirements: '',
    additionalNotes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalSteps = 4;

  const steps = [
    {
      title: "Contact Information",
      description: "Let's start with your basic details",
      icon: <User className="w-5 h-5" />
    },
    {
      title: "Trading Background",
      description: "Tell us about your trading experience",
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      title: "Strategy Details",
      description: "Describe your trading strategy",
      icon: <FileText className="w-5 h-5" />
    },
    {
      title: "Project Requirements",
      description: "Technical details and timeline",
      icon: <Clock className="w-5 h-5" />
    }
  ];

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter(item => item !== value)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/mt5-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitSuccess(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center p-4">
        <motion.div
          className="max-w-md w-full text-center p-8 rounded-3xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Inquiry Submitted Successfully!</h2>
          <p className="text-white/70 mb-6">
            Thank you for your interest in custom MT5 development. Our team will review your requirements and get back to you within 24 hours with a detailed proposal.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-white/50">
              What happens next?
            </p>
            <div className="text-left space-y-2 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Strategy analysis (1-2 business days)</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Detailed proposal and timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Technical consultation call</span>
              </div>
            </div>
          </div>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-full hover:from-green-600 hover:to-emerald-600 transition-all duration-300"
          >
            Return to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-white/80 font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-white/80 font-medium mb-2">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  <option value="">Select timezone</option>
                  <option value="EST">Eastern Time (EST)</option>
                  <option value="CST">Central Time (CST)</option>
                  <option value="MST">Mountain Time (MST)</option>
                  <option value="PST">Pacific Time (PST)</option>
                  <option value="GMT">Greenwich Mean Time (GMT)</option>
                  <option value="CET">Central European Time (CET)</option>
                  <option value="JST">Japan Standard Time (JST)</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-white/80 font-medium mb-2">Trading Experience Level *</label>
              <select
                required
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
              >
                <option value="">Select experience level</option>
                <option value="beginner">Beginner (0-6 months)</option>
                <option value="intermediate">Intermediate (6-24 months)</option>
                <option value="advanced">Advanced (2+ years)</option>
                <option value="expert">Expert (5+ years)</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Prop Firms You're Interested In</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['FTMO', 'MyForexFunds', 'The5ers', 'FundingPips', 'E8', 'Other'].map(firm => (
                  <label key={firm} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.propFirms.includes(firm)}
                      onChange={(e) => handleCheckboxChange('propFirms', firm, e.target.checked)}
                      className="rounded border-white/20 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-white/70">{firm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Briefly Describe Your Current Strategy</label>
              <textarea
                value={formData.currentStrategy}
                onChange={(e) => handleInputChange('currentStrategy', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={4}
                placeholder="e.g., I use RSI divergence on 4H charts with trendline breaks for entries..."
              />
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Daily Time Commitment to Manual Trading</label>
              <select
                value={formData.dailyTimeCommitment}
                onChange={(e) => handleInputChange('dailyTimeCommitment', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
              >
                <option value="">Select time commitment</option>
                <option value="1-2">1-2 hours per day</option>
                <option value="2-4">2-4 hours per day</option>
                <option value="4-8">4-8 hours per day</option>
                <option value="full-time">Full-time (8+ hours)</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-white/80 font-medium mb-2">Strategy Type *</label>
              <select
                required
                value={formData.strategyType}
                onChange={(e) => handleInputChange('strategyType', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
              >
                <option value="">Select strategy type</option>
                <option value="trend-following">Trend Following</option>
                <option value="mean-reversion">Mean Reversion</option>
                <option value="breakout">Breakout Trading</option>
                <option value="scalping">Scalping</option>
                <option value="swing">Swing Trading</option>
                <option value="arbitrage">Arbitrage</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Timeframes Used</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['1M', '5M', '15M', '1H', '4H', 'Daily', 'Weekly'].map(tf => (
                  <label key={tf} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.timeframes.includes(tf)}
                      onChange={(e) => handleCheckboxChange('timeframes', tf, e.target.checked)}
                      className="rounded border-white/20 text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-white/70">{tf}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Indicators Used</label>
              <textarea
                value={formData.indicators}
                onChange={(e) => handleInputChange('indicators', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={3}
                placeholder="e.g., RSI(14), MACD(12,26,9), Moving Averages (20,50), Bollinger Bands..."
              />
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Entry Rules</label>
              <textarea
                value={formData.entryRules}
                onChange={(e) => handleInputChange('entryRules', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={4}
                placeholder="Describe your entry criteria in detail..."
              />
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Exit Rules</label>
              <textarea
                value={formData.exitRules}
                onChange={(e) => handleInputChange('exitRules', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={4}
                placeholder="Describe your exit criteria (take profit, stop loss, trailing stops, etc.)..."
              />
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Risk Management Approach</label>
              <textarea
                value={formData.riskManagement}
                onChange={(e) => handleInputChange('riskManagement', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={3}
                placeholder="e.g., 1-2% risk per trade, maximum drawdown limits, position sizing rules..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 font-medium mb-2">Preferred Broker</label>
                <input
                  type="text"
                  value={formData.broker}
                  onChange={(e) => handleInputChange('broker', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="e.g., IC Markets, Pepperstone, FTMO Broker"
                />
              </div>
              <div>
                <label className="block text-white/80 font-medium mb-2">Account Size</label>
                <select
                  value={formData.accountSize}
                  onChange={(e) => handleInputChange('accountSize', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  <option value="">Select account size</option>
                  <option value="5k-25k">$5K - $25K</option>
                  <option value="25k-100k">$25K - $100K</option>
                  <option value="100k-500k">$100K - $500K</option>
                  <option value="500k+">$500K+</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Risk Per Trade (%)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={formData.riskPerTrade}
                onChange={(e) => handleInputChange('riskPerTrade', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                placeholder="1.0"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white/80 font-medium mb-2">Project Timeline</label>
                <select
                  value={formData.timeline}
                  onChange={(e) => handleInputChange('timeline', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  <option value="">Select timeline</option>
                  <option value="asap">ASAP (Rush order)</option>
                  <option value="1-2weeks">1-2 weeks</option>
                  <option value="2-4weeks">2-4 weeks</option>
                  <option value="1-2months">1-2 months</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 font-medium mb-2">Budget Range</label>
                <select
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-400 transition-colors"
                >
                  <option value="">Select budget</option>
                  <option value="starter">$299 (Starter)</option>
                  <option value="pro">$599 (Pro)</option>
                  <option value="elite">$1299 (Elite)</option>
                  <option value="custom">Custom Quote</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Special Requirements or Features</label>
              <textarea
                value={formData.specialRequirements}
                onChange={(e) => handleInputChange('specialRequirements', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={3}
                placeholder="e.g., News filtering, custom indicators, multi-pair support, etc."
              />
            </div>

            <div>
              <label className="block text-white/80 font-medium mb-2">Additional Notes</label>
              <textarea
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                rows={3}
                placeholder="Any other information or questions..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-purple-300">
              Custom MT5 Development
            </span>
            <br />
            <span className="text-white/70">Project Inquiry</span>
          </motion.h1>

          <motion.p
            className="text-xl text-white/60 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Tell us about your strategy and we'll create a custom Expert Advisor that automates your edge
          </motion.p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  index + 1 <= currentStep
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-white/20 text-white/40'
                }`}>
                  {step.icon}
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
                    index + 1 < currentStep ? 'bg-orange-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-6">
            <h3 className="text-lg font-semibold text-white mb-1">
              {steps[currentStep - 1].title}
            </h3>
            <p className="text-white/60">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }}
          className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-8 border-t border-white/10">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-6 py-3 border border-white/20 text-white/70 rounded-xl hover:bg-white/5 hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </button>

            <button
              type={currentStep === totalSteps ? 'submit' : 'button'}
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : currentStep === totalSteps ? (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Inquiry
                </>
              ) : (
                <>
                  Next Step
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </motion.form>

        {/* Back to Development Link */}
        <div className="text-center mt-8">
          <Link
            to="/mt5-development"
            className="text-orange-400 hover:text-orange-300 transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to MT5 Development
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MT5InquiryForm;
