import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, Shield, Bot, CheckCircle, Plus, ArrowDown, Search } from 'lucide-react';
import Header from './Header';

interface CombinedMembershipPlansProps {
  showHeader?: boolean;
}

const CombinedMembershipPlans: React.FC<CombinedMembershipPlansProps> = ({ showHeader = true }) => {
  const [activeTab, setActiveTab] = useState<'trading' | 'mt5'>('trading');
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();

  const tradingPlans = [
    {
      id: 'kickstarter',
      name: 'Kickstarter',
      price: 0,
      period: 'month',
      description: 'Buy funded account with our affiliate link',
      icon: <Shield className="w-8 h-8" />,
      iconBg: 'bg-green-500/20',
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
      discountedPrice: 49.50,
      period: 'month',
      description: 'Essential features for serious traders',
      icon: <Plus className="w-8 h-8" />,
      iconBg: 'bg-blue-500/20',
      color: 'border-blue-500',
      bgColor: 'bg-blue-500/10',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      christmasOffer: true,
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
      iconBg: 'bg-yellow-500/20',
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
      iconBg: 'bg-purple-500/20',
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
      iconBg: 'bg-orange-500/20',
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
      iconBg: 'bg-purple-500/20',
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
      iconBg: 'bg-green-500/20',
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
    console.log('Plan selected:', plan);
    if (plan.isAffiliate) return;

    if (type === 'mt5') {
      // Navigate to MT5 payment page
      window.location.href = `/mt5-payment?plan=${plan.id}&price=${plan.price}`;
    } else {
      // Calculate actual payment amount based on yearly toggle
      let actualPrice = plan.price;
      let actualPeriod = plan.period;
      let billingType = 'monthly';

      if (isYearly) {
        billingType = 'yearly';
        if (plan.id === 'starter') {
          actualPrice = 468; // $39 * 12 = $468 annual
          actualPeriod = 'year';
        } else if (plan.id === 'pro') {
          actualPrice = 1908; // $159 * 12 = $1,908 annual
          actualPeriod = 'year';
        } else if (plan.id === 'enterprise') {
          actualPrice = 4788; // $399 * 12 = $4,788 annual
          actualPeriod = 'year';
        }
      }

      // Navigate to trading membership signup with URL parameters (more reliable than state)
      window.location.href = `/signup?plan=${plan.id}&price=${actualPrice}&billingType=${billingType}&period=${actualPeriod}&type=trading&isYearly=${isYearly}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {showHeader && <Header />}

      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
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

        {/* Monthly/Yearly Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-full p-1 border border-gray-700">
            <div className="flex items-center">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  !isYearly
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isYearly
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Yearly
                <span className="text-xs bg-green-600/80 text-white px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Trading Platform Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
          {tradingPlans.map((plan, index) => (
            <div
              key={index}
              className={`group relative bg-gray-800/30 backdrop-blur-md rounded-3xl border ${plan.color} p-8 transition-all duration-500 ${
                plan.popular ? 'scale-105' : ''
              }`}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.15) 0%, rgba(15, 23, 42, 0.2) 100%)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${plan.popular ? 'rgba(251, 191, 36, 0.2)' : 'rgba(148, 163, 184, 0.15)'}`,
                transform: 'perspective(1000px) translateZ(0px)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s ease-out, border 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) translateZ(30px) rotateY(2deg) rotateX(-2deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'perspective(1000px) translateZ(0px) rotateY(0deg) rotateX(0deg)';
              }}
            >
              {plan.popular && (
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-2 rounded-full text-xs font-bold"
                    style={{
                      background: 'linear-gradient(135deg, rgb(251, 191, 36) 0%, rgb(245, 158, 11) 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
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
                  {plan.christmasOffer && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30">
                      <div
                        className="bg-gradient-to-r from-red-500 to-green-500 text-white px-4 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(34, 197, 94) 100%)',
                          border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        🎄 CHRISTMAS 50% OFF
                      </div>
                    </div>
                  )}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-white">FREE</span>
                    ) : (
                      <div className="flex flex-col items-center transition-all duration-300">
                        {(() => {
                          // Calculate pricing based on toggle
                          let displayPrice = plan.discountedPrice || plan.price;
                          let displayPeriod = plan.period;
                          let savingsText = '';
                          let totalYearly = 0;

                          if (isYearly) {
                            if (plan.id === 'starter') {
                              displayPrice = 39;
                              displayPeriod = 'month';
                              totalYearly = 468;
                              savingsText = 'Save $126/year';
                            } else if (plan.id === 'pro') {
                              displayPrice = 159;
                              displayPeriod = 'month';
                              totalYearly = 1908;
                              savingsText = 'Save $480/year';
                            } else if (plan.id === 'enterprise') {
                              displayPrice = 399;
                              displayPeriod = 'month';
                              totalYearly = 4788;
                              savingsText = 'Save $1,200/year';
                            }
                          }

                          return (
                            <>
                              <span className="text-3xl font-bold text-white">${displayPrice}</span>
                              <span className="text-gray-400 text-sm">/{displayPeriod}</span>
                              {isYearly && totalYearly > 0 && (
                                <span className="text-green-400 text-xs mt-1">
                                  Billed ${totalYearly}/year • {savingsText}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
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
                      className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                        plan.id === 'pro'
                          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 hover:border-cyan-400/40 text-white'
                          : 'bg-white/[0.03] border border-white/[0.1] hover:bg-white/[0.05] hover:border-white/[0.15] text-white/90 hover:text-white'
                      }`}
                    >
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>


      </div>
    </section>
    </div>
  );
};

export default CombinedMembershipPlans;
