import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { bindTilt } from '../utils/parallax';
import { motion, useScroll, useTransform, useSpring, useReducedMotion } from 'framer-motion';
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
  Zap
} from 'lucide-react';
import Header from './Header';
import KickstarterPlan from './KickstarterPlan';
import MembershipPlans from './MembershipPlans';
import HeroBackground from './HeroBackground';
import ExtractedCard from './ExtractedCard';
import landingStatsService from '../services/landingStatsService';

const LandingPage = () => {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  const [stats, setStats] = useState([
    { number: "2,436", label: "Funded Accounts", description: "Successfully cleared" },
    { number: "82.3%", label: "Success Rate", description: "Challenge completion" },
    { number: "$12.8M", label: "Total Funded", description: "Across all prop firms" },
    { number: "150+", label: "Prop Firms", description: "Supported platforms" }
  ]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const prefersReducedMotion = useReducedMotion();
  
  // Fetch dynamic landing page statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const landingStats = await landingStatsService.getLandingStats();
        const formattedStats = landingStatsService.formatStats(landingStats);
        setStats(formattedStats);
      } catch (error) {
        console.error('Error fetching landing stats:', error);
        // Keep default stats on error
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Performance optimization: detect low-end devices
  useEffect(() => {
    const checkPerformance = () => {
      const isLowEnd = navigator.hardwareConcurrency < 4 || 
                      ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) ||
                      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      setIsPerformanceMode(isLowEnd || (prefersReducedMotion === true));
    };
    
    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, [prefersReducedMotion]);

  const features = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Prop Firm Mastery",
      description: "Expert guidance for FTMO, MyForexFunds, The5%ers, and 150+ prop firms with proven success strategies",
      color: "text-blue-400"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Risk Management Excellence",
      description: "Advanced position sizing and drawdown protection tailored to each prop firm's specific rules",
      color: "text-green-400"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Custom Trading Plans",
      description: "Personalized multi-phase trading strategies designed for your account size and risk tolerance",
      color: "text-purple-400"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Real-Time Signals",
      description: "Professional-grade trading signals with precise entry, stop loss, and take profit levels",
      color: "text-yellow-400"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Phase Tracking",
      description: "Complete progress monitoring through challenge phases to live funded account status",
      color: "text-red-400"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Expert Support",
      description: "Dedicated support team with extensive prop firm experience and proven track record",
      color: "text-cyan-400"
    }
  ];

  const processSteps = [
    {
      step: 1,
      title: "Select Your Prop Firm",
      description: "Choose from 150+ supported prop firms with automatic rule extraction",
      icon: <Target className="w-6 h-6" />
    },
    {
      step: 2,
      title: "Configure Account",
      description: "Set your account size and challenge type (1-step, 2-step, instant funding)",
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      step: 3,
      title: "Risk Parameters",
      description: "Define your risk percentage and reward ratios for optimal position sizing",
      icon: <Shield className="w-6 h-6" />
    },
    {
      step: 4,
      title: "Custom Trading Plan",
      description: "Receive a detailed, downloadable trading plan tailored to your setup",
      icon: <BarChart3 className="w-6 h-6" />
    },
    {
      step: 5,
      title: "Live Dashboard",
      description: "Track progress, receive signals, and monitor your funded account journey",
      icon: <TrendingUp className="w-6 h-6" />
    }
  ];



  const testimonials = [
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
  ];

  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<(HTMLDivElement | null)[]>([]);
  const processRef = useRef<(HTMLDivElement | null)[]>([]);
  const testimonialsRef = useRef<(HTMLDivElement | null)[]>([]);
  const ctaRef = useRef<HTMLElement>(null);

  // Optimized scroll animations using GPU-friendly transforms
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);
  
  // Smooth spring animations
  const smoothHeroY = useSpring(heroY, { stiffness: 100, damping: 30 });
  const smoothHeroOpacity = useSpring(heroOpacity, { stiffness: 100, damping: 30 });

  // Throttled scroll handler for performance
  const handleScroll = useCallback(() => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      // Minimal scroll handling for performance
    });
  }, [isPerformanceMode, prefersReducedMotion]);

  useEffect(() => {
    if (isPerformanceMode || prefersReducedMotion) return;

    // Bind tilt effects only if performance allows
    if (heroRef.current) {
      bindTilt(heroRef.current);
    }
    if (ctaRef.current) {
      bindTilt(ctaRef.current);
    }
    
    // Bind tilt to interactive elements with reduced frequency
    featuresRef.current.forEach((el) => {
      if (el && !isPerformanceMode) {
        bindTilt(el);
      }
    });
    processRef.current.forEach((el) => {
      if (el && !isPerformanceMode) {
        bindTilt(el);
      }
    });
    testimonialsRef.current.forEach((el) => {
      if (el && !isPerformanceMode) {
        bindTilt(el);
      }
    });

    // Add scroll listener with throttling
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isPerformanceMode, prefersReducedMotion, handleScroll]);

  // Performance toggle component
  const PerformanceToggle = () => (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setIsPerformanceMode(!isPerformanceMode)}
        className="bg-gray-800/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700/80 transition-colors"
        title="Toggle performance mode"
      >
        {isPerformanceMode ? '🚀' : '⚡'} Performance
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      {!prefersReducedMotion && <PerformanceToggle />}
      
      {/* Hero Section with optimized animations */}
      <motion.section 
        ref={heroRef} 
        className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={{
          y: isPerformanceMode ? 0 : smoothHeroY,
          opacity: isPerformanceMode ? 1 : smoothHeroOpacity,
          willChange: isPerformanceMode ? 'auto' : 'transform, opacity'
        }}
      >
        <HeroBackground />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-full px-4 py-2 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">
                Professional Prop Firm Clearing Service
              </span>
            </motion.div>

            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight hero-text-3d"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            >
              Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Funded Account</span> Journey
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              Professional clearing service for prop firm challenges with custom trading plans and expert guidance
            </motion.p>
            
            <motion.p 
              className="text-base text-gray-400 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
            >
              Join <span className="text-blue-400 font-semibold">2,847 successful traders</span> who cleared their challenges with our proven methodology.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
            >
              <Link
                to="/membership"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-xl hover:shadow-blue-500/25"
              >
                Start Your Journey <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/membership"
                className="border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300"
              >
                View Pricing
              </Link>
              <Link
                to="/affiliate-links"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 shadow-xl hover:shadow-green-500/25"
              >
                Get Free Access <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Stats with staggered animations */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 1.0 }}
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="text-center p-4 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut", 
                    delay: 1.2 + (index * 0.1) 
                  }}
                  whileHover={!isPerformanceMode ? { scale: 1.05 } : {}}
                >
                  <div className="text-2xl md:text-3xl font-bold text-blue-400 mb-1">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-blue-400/20 rounded h-8 w-20 mx-auto"></div>
                    ) : (
                      stat.number
                    )}
                  </div>
                  <div className="text-white font-medium mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-400">{stat.description}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Process Flow with optimized animations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">5-Step Clearing Process</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Our proven methodology takes you from prop firm selection to funded account success
            </p>
          </motion.div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {processSteps.map((step, index) => (
                <motion.div 
                  key={index} 
                  className="relative" 
                  ref={(el) => (processRef.current[index] = el)}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.6, 
                    ease: "easeOut", 
                    delay: index * 0.1 
                  }}
                  whileHover={!isPerformanceMode ? { scale: 1.05 } : {}}
                >
                  <div className="bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-xl">{step.step}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with optimized animations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Professional-Grade Features</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Everything you need to successfully clear prop firm challenges and manage funded accounts
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                ref={(el) => (featuresRef.current[index] = el)}
                className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300 group card-3d lightning-border"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut", 
                  delay: index * 0.1 
                }}
                whileHover={!isPerformanceMode ? { scale: 1.05 } : {}}
                whileTap={!isPerformanceMode ? { scale: 0.95 } : {}}
                style={{
                  willChange: isPerformanceMode ? 'auto' : 'transform'
                }}
              >
                <div className={`${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Kickstarter Plan Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Kickstarter Plan</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Get started with our free plan by using our affiliate links.
            </p>
          </motion.div>
          <div className="max-w-md mx-auto">
            <KickstarterPlan />
          </div>
        </div>
      </section>

      {/* Testimonials with optimized animations */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Success Stories</h2>
            <p className="text-lg text-gray-400 mb-2">Real results from traders who cleared their challenges</p>
            <div className="flex items-center justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-gray-300">4.9/5 from 2,847 reviews</span>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                ref={(el) => (testimonialsRef.current[index] = el)} 
                className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeOut", 
                  delay: index * 0.1 
                }}
                whileHover={!isPerformanceMode ? { scale: 1.02 } : {}}
              >
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{testimonial.image}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">{testimonial.profit}</div>
                    <div className="text-xs text-gray-400">Total Profit</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <ExtractedCard />

      {/* Membership Plans Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Membership Plans</h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">
              Choose the plan that's right for you.
            </p>
          </motion.div>
          <MembershipPlans />
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
