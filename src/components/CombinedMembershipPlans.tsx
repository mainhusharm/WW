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
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
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
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
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
      buttonColor: 'bg-orange-600 hover:bg-orange-700',
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
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
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
      buttonColor: 'bg-green-600 hover:bg-green-700',
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
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Membership</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
            Select the perfect plan to accelerate your trading success with our professional services.
          </p>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-2 border border-gray-700/50">
              <button
                onClick={() => setActiveTab('trading')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'trading'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Trading Platform Access
              </button>
              <button
                onClick={() => setActiveTab('mt5')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'mt5'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MT5 Bot Development
              </button>
            </div>
          </div>
        </div>

        {/* Trading Platform Plans */}
        {activeTab === 'trading' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {tradingPlans.map((plan, index) => (
              <div
                key={index}
                className={`group relative bg-transparent backdrop-blur-xl rounded-2xl border border-white/20 p-8 transition-all duration-500 hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden ${
                  plan.popular ? 'scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold shadow-lg">
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
        )}

        {/* MT5 Bot Development Plans */}
        {activeTab === 'mt5' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {mt5Plans.map((plan, index) => (
              <div
                key={index}
                className={`group relative bg-transparent backdrop-blur-xl rounded-2xl border border-white/20 p-8 transition-all duration-500 hover:border-purple-400/50 hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden ${
                  plan.popular ? 'scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
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
        )}
      </div>
    </section>
  );
};

export default CombinedMembershipPlans;
