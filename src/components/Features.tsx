import React, { useState, useEffect } from 'react';
import { Target, Shield, BarChart3, Zap, Award, Users } from 'lucide-react';
import Header from './Header';
// import ScrollAnimations from './3D/ScrollAnimations';

const Features: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

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

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Prop Firm Mastery",
      description: "Expert guidance for FTMO, MyForexFunds, The5%ers, and 150+ prop firms with proven success strategies",
      color: "text-blue-400",
      gradient: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Risk Management Excellence",
      description: "Advanced position sizing and drawdown protection tailored to each prop firm's specific rules",
      color: "text-green-400",
      gradient: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Custom Trading Plans",
      description: "Personalized multi-phase trading strategies designed for your account size and risk tolerance",
      color: "text-purple-400",
      gradient: "from-purple-500/20 to-pink-500/20"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Signals",
      description: "Professional-grade trading signals with precise entry, stop loss, and take profit levels",
      color: "text-yellow-400",
      gradient: "from-yellow-500/20 to-orange-500/20"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Phase Tracking",
      description: "Complete progress monitoring through challenge phases to live funded account status",
      color: "text-red-400",
      gradient: "from-red-500/20 to-pink-500/20"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Expert Support",
      description: "Dedicated support team with extensive prop firm experience and proven track record",
      color: "text-cyan-400",
      gradient: "from-cyan-500/20 to-blue-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      <Header />
      
      
      
      <div className="fixed inset-0 z-0 pointer-events-none">
        
        
        
        
      </div>

      {/* <ScrollAnimations> */}
        <section className="features-section py-20 px-4 sm:px-6 lg:px-8 relative z-10 mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Professional-Grade <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Features</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Everything you need to successfully clear prop firm challenges and manage funded accounts
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="feature-card group relative bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden"
                  style={{
                    transform: `perspective(1000px) rotateY(${mousePosition.x * 2}deg) rotateX(${mousePosition.y * 2}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
                  
                  <div 
                    className={`${feature.color} mb-6 group-hover:scale-110 transition-all duration-500 relative z-10`}
                    style={{
                      transform: `translateZ(20px) rotateY(${scrollY * 0.1}deg)`,
                      filter: 'drop-shadow(0 0 20px currentColor)'
                    }}
                  >
                    {feature.icon}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300 relative z-10">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed relative z-10">
                    {feature.description}
                  </p>

                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 rounded-3xl blur-xl"></div>
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

export default Features;
