import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Star, Zap, Crown, Shield } from 'lucide-react';
import Header from './Header';
// import ScrollAnimations from './3D/ScrollAnimations';

const MembershipPlans: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoaded(true);
    
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const plans = [
    {
      id: 'kickstarter',
      name: 'Kickstarter',
      price: 0,
      period: 'month',
      description: 'Buy funded account with our affiliate link and get access to premium features',
      icon: <Shield className="w-8 h-8" />,
      color: 'border-gray-600',
      bgColor: 'bg-gray-800',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      isAffiliate: true,
      features: [
        'Risk management plan for 1 month',
        'Trading signals for 1 week',
        'Standard risk management calculator',
        'Phase tracking dashboard',
        '3 prop firm rule analyzer',
        'Access via affiliate purchase only'
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 99,
      period: 'month',
      description: 'Essential features for serious traders',
      icon: <Star className="w-8 h-8" />,
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
      icon: <Zap className="w-8 h-8" />,
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
      description: 'Ultimate solution for trading teams and professionals',
      icon: <Crown className="w-8 h-8" />,
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
        'AI Trading Coach (Nexus) - Advanced personalized guidance',
        'AI-powered market analysis and real-time insights',
        'AI strategy optimization and recommendations',
        'Instant access to new features'
      ]
    }
  ];

  const handlePlanSelect = (plan: any) => {
    if (plan.isAffiliate) return;
    
    navigate('/signup-enhanced', {
      state: { 
        selectedPlan: { 
          name: plan.name, 
          price: plan.price, 
          period: plan.period,
          description: plan.description
        } 
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      <Header />
      
      
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        
        
        
        
      </div>

      {/* <ScrollAnimations> */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Choose Your Plan</h1>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
                Select the perfect plan to accelerate your prop firm success with our professional clearing service.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`futuristic-pricing-card hover-3d group relative bg-gray-800/30 backdrop-blur-md rounded-3xl border-2 ${plan.color} p-8 transition-all duration-700 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 ${
                    plan.popular ? 'scale-105' : 'overflow-hidden'
                  }`}
                  style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.2) 0%, rgba(15, 23, 42, 0.3) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: `2px solid ${plan.popular ? 'rgba(251, 191, 36, 0.3)' : 'rgba(148, 163, 184, 0.2)'}`,
                    boxShadow: plan.popular 
                      ? '0 8px 32px rgba(251, 191, 36, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                      : '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    transform: `perspective(1000px) rotateY(${mousePosition.x * 2}deg) rotateX(${mousePosition.y * 2}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Minimal Lightning Background Effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                    style={{
                      background: `linear-gradient(45deg, transparent 30%, ${plan.color.includes('gray') ? 'rgba(59, 130, 246, 0.03)' : 
                        plan.color.includes('blue') ? 'rgba(59, 130, 246, 0.05)' :
                        plan.color.includes('yellow') ? 'rgba(251, 191, 36, 0.05)' :
                        plan.color.includes('purple') ? 'rgba(147, 51, 234, 0.05)' : 'rgba(59, 130, 246, 0.03)'} 50%, transparent 70%)`,
                      animation: 'lightningSweep 3s ease-in-out infinite'
                    }}
                  />
                  
                  {plan.popular && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-30">
                      <div 
                        className="popular-tag bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full text-sm font-bold shadow-2xl animate-pulse"
                        style={{
                          background: 'linear-gradient(135deg,rgb(252, 193, 44) 0%,rgb(251, 169, 28) 100%)',
                          boxShadow: '0 12px 35px rgba(255, 194, 40, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3), 0 0 20px rgba(251, 191, 36, 0.4)',
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
                    <div className="text-blue-500 mb-4 flex justify-center">
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    <div className="mb-6">
                      {plan.price === 0 ? (
                        <span className="text-3xl font-bold text-green-400">FREE</span>
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
                        <Check className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="relative z-10">
                    {(plan as any).isAffiliate ? (
                      <Link
                        to="/affiliate-links"
                        className={`w-full ${plan.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center`}
                      >
                        Get Started
                      </Link>
                    ) : (
                      <button
                        onClick={() => handlePlanSelect(plan)}
                        className={`w-full ${plan.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors`}
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
              {/* </ScrollAnimations> */}
    </div>
  );
};

export default MembershipPlans;
