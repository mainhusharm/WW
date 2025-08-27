import React, { useState, useEffect, useRef, Suspense, memo, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Shield, 
  Target, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Award,
  Clock,
  DollarSign,
  Zap,
  Play,
  ChevronDown
} from 'lucide-react';
import Header from './Header';

// Temporarily disable 3D components to prevent crashes
// const Scene3D = React.lazy(() => import('./3D/Scene3D'));
// const ScrollAnimations = React.lazy(() => import('./3D/ScrollAnimations'));

const Enhanced3DLandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(() => {
    setScrollY(window.scrollY);
  }, []);

  // Throttled mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    });
  }, []);

  useEffect(() => {
    // Add a small delay to ensure all elements are ready before fading in
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    // Throttle scroll events for better performance
    let scrollTimeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
    };

    // Throttle mouse move events
    let mouseTimeout: NodeJS.Timeout;
    const throttledMouseMove = (e: MouseEvent) => {
      if (mouseTimeout) clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => handleMouseMove(e), 16); // ~60fps
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    window.addEventListener('mousemove', throttledMouseMove, { passive: true });

    return () => {
      clearTimeout(timer);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (mouseTimeout) clearTimeout(mouseTimeout);
      window.removeEventListener('scroll', throttledScroll);
      window.removeEventListener('mousemove', throttledMouseMove);
    };
  }, [handleScroll, handleMouseMove]);

  // Memoize static data to prevent re-renders
  const features = useMemo(() => [
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
  ], []);

  const [stats, setStats] = useState([
    { number: "0", label: "Funded Accounts", description: "Successfully cleared" },
    { number: "0", label: "Success Rate", description: "Challenge completion" },
    { number: "0", label: "Total Funded", description: "Million USD" },
    { number: "0", label: "Prop Firms", description: "Supported platforms" }
  ]);

  // Fetch real stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch('/api/stats', {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          setStats([
            { number: data.fundedAccounts || "0", label: "Funded Accounts", description: "Successfully cleared" },
            { number: data.successRate || "0", label: "Success Rate", description: "Challenge completion" },
            { number: data.totalFunded || "0", label: "Total Funded", description: "Million USD" },
            { number: data.propFirms || "0", label: "Prop Firms", description: "Supported platforms" }
          ]);
        }
      } catch (error) {
        // Only log errors in development mode
        if (process.env.NODE_ENV === 'development') {
          console.warn('Stats API not available:', error);
        }
        // Keep default values of "0" if API fails - this is normal during development
      }
    };

    fetchStats();
  }, []);

  const testimonials = useMemo(() => [
    {
      name: "Marcus Chen",
      role: "FTMO $200K Funded Trader",
      content: "The custom trading plan was exactly what I needed. Cleared my FTMO challenge in 18 days following their strategy.",
      rating: 5,
      profit: "$47,230",
      image: "MC"
    },
    {
      name: "Sarah Williams", 
      role: "MyForexFunds Elite",
      content: "Professional service with detailed risk management. Now managing a $500K funded account thanks to their guidance.",
      rating: 5,
      profit: "$89,450",
      image: "SW"
    },
    {
      name: "David Rodriguez",
      role: "The5%ers Funded",
      content: "The phase tracking and signals helped me stay disciplined. Cleared all phases without any rule violations.",
      rating: 5,
      profit: "$34,680",
      image: "DR"
    }
  ], []);

  // Memoize expensive calculations
  const heroTransform = useMemo(() => 
    `perspective(1000px) rotateX(${mousePosition.y * 5}deg) rotateY(${mousePosition.x * 5}deg)`,
    [mousePosition.x, mousePosition.y]
  );

  const parallaxTransform = useMemo(() => 
    `translateY(${scrollY * 0.5}px) scale(1.1)`,
    [scrollY]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      <Header />
      
      {/* 3D Scene Background - Lazy loaded */}
      <Suspense fallback={<div className="fixed inset-0 bg-gray-950" />}>
        {/* <Scene3D scrollY={scrollY} isVisible={isLoaded} /> */}
        <div className="fixed inset-0 bg-gray-950">
          <div className="w-full h-full bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20"></div>
        </div>
      </Suspense>
      
      {/* Animated Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Gradient Orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #00ffff 0%, transparent 70%)',
            transform: `translate(${mousePosition.x * 50}px, ${mousePosition.y * 50}px)`,
            transition: 'transform 0.3s ease-out',
            left: '10%',
            top: '20%'
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #ff00ff 0%, transparent 70%)',
            transform: `translate(${mousePosition.x * -30}px, ${mousePosition.y * 30}px)`,
            transition: 'transform 0.3s ease-out',
            right: '10%',
            bottom: '20%'
          }}
        />
        
        {/* Floating Geometric Shapes */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 border border-cyan-400/30 rotate-45 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              transform: `rotate(${Math.random() * 360}deg) translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)`
            }}
          />
        ))}
      </div>

      <Suspense fallback={<div />}>
        {/* <ScrollAnimations> */}
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center relative z-10">
            {/* Hero Badge */}
            <div className="inline-flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-cyan-500/30 rounded-full px-6 py-3 mb-8 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300 font-medium">
                Professional Prop Firm Clearing Service
              </span>
            </div>

            {/* Main Title with 3D Effect */}
            <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight">
              <span className="block text-white mb-4">Master Your</span>
              <span 
                className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500"
                style={{
                  textShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
                  transform: heroTransform
                }}
              >
                Funded Account
              </span>
              <span className="block text-white mt-4">Journey</span>
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Professional clearing service for prop firm challenges with custom trading plans and expert guidance
            </p>

            {/* Stats Preview */}
            <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">{stats[0]?.number || "0"} Successful Traders</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300">{stats[1]?.number || "0"}% Success Rate</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">${stats[2]?.number || "0"}M Total Funded</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                to="/signup"
                className="group relative border-2 border-cyan-500/50 text-cyan-400 hover:text-white hover:border-cyan-400 px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-cyan-500/10 backdrop-blur-sm">
                <span className="flex items-center">
                  GET FREE ACCESS
                </span>
              </Link>
              <Link
                to="/membership"
                className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50"
              >
                <span className="relative z-10 flex items-center">
                  Start Your Journey 
                  <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
              </Link>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          {/* Hero Video Background */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="w-full h-full bg-gradient-to-br from-cyan-900/20 via-transparent to-purple-900/20"></div>
          </div>
        </section>

        {/* Stats Section with 3D Cards */}
        <section className="stats-section py-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="hover-3d group relative bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 text-center transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20"
                  style={{
                    transform: `perspective(1000px) rotateX(${scrollY * 0.01}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div 
                      className="stat-number text-4xl md:text-5xl font-bold text-cyan-400 mb-2"
                      data-value={stat.number}
                    >
                      0
                    </div>
                    <div className="text-white font-semibold mb-1">{stat.label}</div>
                    <div className="text-sm text-gray-400">{stat.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section with Enhanced 3D */}
        <section className="features-section py-20 px-4 sm:px-6 lg:px-8 relative z-10">
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
                  {/* Animated Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-all duration-500`}></div>
                  
                  {/* Floating Icon */}
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

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 rounded-3xl blur-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Parallax Section */}
        <section className="parallax-section relative py-32 overflow-hidden z-20">
          <div 
            className="parallax-bg absolute inset-0 z-0"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)',
              transform: parallaxTransform
            }}
          />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-8">
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
                  style={{
                    transform: `perspective(1000px) rotateX(${scrollY * 0.02}deg)`,
                    textShadow: '0 0 50px rgba(0, 255, 255, 0.3)'
                  }}
                >
                  Next-Level Trading
                </span>
              </h2>
              <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
                Experience the future of prop firm trading with our advanced 3D analytics platform
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials with 3D Cards */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Success Stories</h2>
              <p className="text-xl text-gray-400 mb-4">Real results from traders who cleared their challenges</p>
              <div className="flex items-center justify-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
                <span className="ml-3 text-gray-300 text-lg">4.9/5 from 2,847 reviews</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="hover-3d group relative bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden"
                  style={{
                    transform: `perspective(1000px) rotateY(${index % 2 === 0 ? mousePosition.x * 3 : -mousePosition.x * 3}deg)`,
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Animated Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    {/* Rating Stars */}
                    <div className="flex mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <p className="text-gray-300 mb-8 leading-relaxed italic text-lg">
                      "{testimonial.content}"
                    </p>
                    
                    {/* Author Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg"
                          style={{
                            transform: 'translateZ(10px)',
                            boxShadow: '0 0 20px rgba(0, 255, 255, 0.3)'
                          }}
                        >
                          {testimonial.image}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{testimonial.name}</div>
                          <div className="text-sm text-gray-400">{testimonial.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-xl">{testimonial.profit}</div>
                        <div className="text-xs text-gray-400">Total Profit</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA with 3D Elements */}
        <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <div 
              className="relative bg-gray-800/60 backdrop-blur-sm rounded-3xl p-16 border border-gray-700/50 overflow-hidden"
              style={{
                transform: `perspective(1000px) rotateX(${scrollY * 0.01}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-blue-500/10 opacity-50"></div>
              
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
                  Ready to Clear Your{' '}
                  <span 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
                    style={{
                      textShadow: '0 0 30px rgba(0, 255, 255, 0.5)'
                    }}
                  >
                    Prop Firm Challenge
                  </span>
                  ?
                </h2>
                
                <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
                  Join thousands of successful traders who achieved funded account status with our proven methodology.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                  <Link
                    to="/membership"
                    className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50"
                  >
                    <span className="relative z-10">Start Your Journey</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
                  </Link>
                  
                  <Link
                    to="/membership"
                    className="border-2 border-gray-600 text-gray-300 hover:border-cyan-500 hover:text-cyan-400 px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 backdrop-blur-sm hover:bg-cyan-500/5"
                  >
                    View Pricing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* </ScrollAnimations> */}
      </Suspense>

      {/* Loading Screen */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-400 text-xl font-semibold">Loading 3D Experience...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enhanced3DLandingPage;
