import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Zap, Crown, Shield, Bot, CheckCircle, Plus, ArrowDown, Search } from 'lucide-react';

const CombinedMembershipPlans: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trading' | 'mt5'>('trading');

  const tradingPlans = [
    {
      id: 'kickstarter',
      name: 'Kickstarter',
      price: 0,
      period: 'month',
      description: 'Buy funded account with our affiliate link',
      icon: <Shield className="w-8 h-8" />,
      iconBg: 'bg-green-500',
      color: 'border-gray-600',
      bgColor: 'bg-gray-800',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      isAffiliate: true,
      features: [
        'Risk management plan for 1 month',
        'Trading signals for 1 week',
        'Standard risk management calculator',
        'Phase tracking dashboard',
        '3 prop firm rule analyzer'
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      period: 'month',
      description: 'Essential features for serious traders',
      icon: <Plus className="w-8 h-8" />,
      iconBg: 'bg-blue-500',
      color: 'border-blue-500',
      bgColor: 'bg-blue-500/10',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      features: [
        'Risk management plan for 1 month',
        'Trading signals for 1 month',
        'Standard risk management calculator',
        'Phase tracking dashboard',
        '5 prop firm rule analyzer',
        'Email support',
        'Auto lot size calculator'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 199,
      period: 'month',
      description: 'Advanced features for professional traders',
      icon: <ArrowDown className="w-8 h-8" />,
      iconBg: 'bg-yellow-500',
      color: 'border-yellow-500',
      bgColor: 'bg-yellow-500/10',
      buttonColor: 'bg-yellow-500 hover:bg-yellow-600',
      popular: true,
      features: [
        'Risk management plan for 1 month',
        'Trading signals for 1 month',
        'Standard risk management calculator',
        'Phase tracking dashboard',
        '15 prop firm rule analyzer',
        'Priority chat and email support',
        'Auto lot size calculator',
        'Access to private community',
        'Multi account tracker',
        'Advanced trading journal',
        'Backtesting tools',
        'AI Trading Coach (Nexus) - Personalized guidance',
        'AI-powered market analysis and insights',
        'Instant access to new features'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 499,
      period: '3 months',
      description: 'Ultimate solution for trading teams',
      icon: <Crown className="w-8 h-8" />,
      iconBg: 'bg-purple-500',
      color: 'border-purple-500',
      bgColor: 'bg-purple-500/10',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      features: [
        'Risk management plan for 3 months',
        'Trading signals for 3 months',
        'Standard risk management calculator',
        'Phase tracking dashboard',
        '15 prop firm rule analyzer',
        '24/7 priority chat and email support',
        'Auto lot size calculator',
        'Access to private community',
        'Multi account tracker',
        'Advanced trading journal',
        'Professional backtesting suite',
        'Chart analysis tools',
        'AI Trading Coach (Nexus) - Advanced personalized guidance',
        'AI-powered market analysis and real-time insights',
        'AI strategy optimization and recommendations',
        'Instant access to new features'
      ]
    }
  ];

  const mt5Plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 299,
      period: 'one-time',
      description: 'Basic strategy automation',
      icon: <Search className="w-8 h-8" />,
      iconBg: 'bg-orange-500',
      color: 'border-orange-500',
      bgColor: 'bg-orange-500/10',
      buttonColor: 'bg-orange-500 hover:bg-orange-600',
      features: [
        'Basic strategy automation',
        'EX5 file delivery',
        'Basic risk management',
        '1 revision included',
        '5-7 business days delivery',
        'Email support'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 599,
      period: 'one-time',
      description: 'Advanced strategy automation',
      icon: <Plus className="w-8 h-8" />,
      iconBg: 'bg-purple-500',
      color: 'border-purple-500',
      bgColor: 'bg-purple-500/10',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
      popular: true,
      features: [
        'Advanced strategy automation',
        'Custom indicators integration',
        'Multi-timeframe analysis',
        'EX5 + Backtest report',
        'Advanced risk filters',
        '2 revisions included',
        '5-7 business days delivery',
        'Dashboard + chat support'
      ]
    },
    {
      id: 'elite',
      name: 'Elite',
      price: 1299,
      period: 'one-time',
      description: 'Full professional development',
      icon: <Crown className="w-8 h-8" />,
      iconBg: 'bg-green-500',
      color: 'border-green-500',
      bgColor: 'bg-green-500/10',
      buttonColor: 'bg-green-500 hover:bg-green-600',
      features: [
        'Full professional bot development',
        'EX5 + Source Code (MQ5)',
        'Custom risk management modules',
        'News filter integration',
        'Multi-currency support',
        'Lifetime updates included',
        'Unlimited revisions',
        'Priority support',
        '7-10 business days delivery'
      ]
    }
  ];

  const handlePlanSelect = (plan: any, type: 'trading' | 'mt5') => {
    if (plan.isAffiliate) return;
    
    if (type === 'mt5') {
      // Navigate to MT5 payment page
      window.location.href = `/mt5-payment?plan=${plan.id}&price=${plan.price}`;
    } else {
      // Navigate to trading membership signup
      window.location.href = `/signup-enhanced?plan=${plan.id}&price=${plan.price}&type=trading`;
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Trading Platform Access Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Trading Platform Access
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Get access to our comprehensive trading platform with advanced tools, signals, and analytics.
          </p>
        </div>

        {/* Trading Platform Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {tradingPlans.map((plan, index) => (
            <div
              key={index}
              className={`futuristic-pricing-card group relative bg-gray-800/30 backdrop-blur-md rounded-2xl border ${plan.color} p-8 transition-all duration-700 hover:shadow-2xl ${
                plan.popular ? 'scale-105 shadow-yellow-500/30' : 'hover:shadow-blue-500/30'
              } ${plan.popular ? '' : 'overflow-hidden'}`}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.2) 0%, rgba(15, 23, 42, 0.3) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${plan.popular ? 'rgba(251, 191, 36, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                boxShadow: plan.popular 
                  ? '0 8px 32px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {plan.popular && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
                  <div 
                    className="popular-tag bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-pulse"
                    style={{
                      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                      boxShadow: '0 12px 35px rgba(251, 191, 36, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3), 0 0 20px rgba(251, 191, 36, 0.4)',
                      transform: 'translateY(0px)',
                      animation: 'popularFloat 3s ease-in-out infinite',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    MOST POPULAR
                  </div>
                </div>
              )}

              <div className="text-center mb-8 relative z-10">
                  <div className={`w-12 h-12 ${plan.iconBg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <div className="text-white">
                      {plan.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-white">FREE</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-white">${plan.price}</span>
                        <span className="text-gray-400">/{plan.period}</span>
                      </>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6 relative z-10">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative z-10">
                  {plan.isAffiliate ? (
                    <Link
                      to="/affiliate-links"
                      className={`w-full ${plan.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center`}
                    >
                      Get Started
                    </Link>
                  ) : (
                    <button
                      onClick={() => handlePlanSelect(plan, 'trading')}
                      className={`w-full ${plan.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors`}
                    >
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        {/* Custom Expert Advisor Development Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-4">
            MT5 BOT DEVELOPMENT SERVICE
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Custom Expert Advisor Development
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Professional MT5 bot development tailored to your needs and budget.
          </p>
        </div>

        {/* MT5 Bot Development Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mt5Plans.map((plan, index) => (
            <div
              key={index}
              className={`futuristic-pricing-card group relative bg-gray-800/30 backdrop-blur-md rounded-2xl border ${plan.color} p-8 transition-all duration-700 hover:shadow-2xl ${
                plan.popular ? 'scale-105 shadow-purple-500/30' : 'hover:shadow-blue-500/30'
              } ${plan.popular ? '' : 'overflow-hidden'}`}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.2) 0%, rgba(15, 23, 42, 0.3) 100%)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${plan.popular ? 'rgba(147, 51, 234, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                boxShadow: plan.popular 
                  ? '0 8px 32px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                  : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {plan.popular && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
                  <div 
                    className="popular-tag bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-pulse"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                      boxShadow: '0 12px 35px rgba(139, 92, 246, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3), 0 0 20px rgba(139, 92, 246, 0.4)',
                      transform: 'translateY(0px)',
                      animation: 'popularFloat 3s ease-in-out infinite',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    MOST POPULAR
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                  <div className={`w-12 h-12 ${plan.iconBg} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                    <div className="text-white">
                      {plan.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePlanSelect(plan, 'mt5')}
                  className={`w-full ${plan.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
      </div>
    </section>
  );
};

export default CombinedMembershipPlans;
