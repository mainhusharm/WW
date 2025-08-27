import React, { useEffect, useRef, useCallback, useState } from 'react';
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
import HeroBackground from './HeroBackground';
import landingStatsService from '../services/landingStatsService';

const LandingPage: React.FC = () => {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  const [stats] = useState([
    { number: "2,436", label: "Funded Accounts", description: "Successfully cleared" },
    { number: "82.3%", label: "Success Rate", description: "Challenge completion" },
    { number: "$12.8M", label: "Total Funded", description: "Across all prop firms" },
    { number: "150+", label: "Prop Firms", description: "Supported platforms" }
  ]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Enhanced scroll and mouse tracking
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic landing page statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoadingStats(true);
        const landingStats = await landingStatsService.getLandingStats();
        const formattedStats = landingStatsService.formatStats(landingStats);
        // setStats(formattedStats); // Commented out for now
      } catch (error) {
        console.error('Error fetching landing stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Performance optimization: detect low-end devices
  useEffect(() => {
    const checkPerformance = () => {
      // Less aggressive performance detection
      const isLowEnd = navigator.hardwareConcurrency < 2 || 
                      ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 2);
      
      setIsPerformanceMode(isLowEnd && prefersReducedMotion);
    };
    
    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, [prefersReducedMotion]);

  // Enhanced scroll animations with parallax
  const handleScroll = useCallback(() => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    const currentScrollY = window.scrollY;
    setScrollY(currentScrollY);
    setIsScrolling(true);
    
    // Parallax effects for different sections
    if (heroRef.current) {
      const heroElement = heroRef.current;
      const speed = 0.5;
      heroElement.style.transform = `translateY(${currentScrollY * speed}px)`;
    }
    
    if (featuresRef.current) {
      const featuresElement = featuresRef.current;
      const speed = 0.3;
      featuresElement.style.transform = `translateY(${currentScrollY * speed}px)`;
    }
    
    if (processRef.current) {
      const processElement = processRef.current;
      const speed = 0.2;
      processElement.style.transform = `translateY(${currentScrollY * speed}px)`;
    }
    
    if (ctaRef.current) {
      const ctaElement = ctaRef.current;
      const speed = 0.1;
      ctaElement.style.transform = `translateY(${currentScrollY * speed}px)`;
    }
    
    // Clear scrolling state after animation
    setTimeout(() => setIsScrolling(false), 100);
  }, [isPerformanceMode, prefersReducedMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1
    });
  }, [isPerformanceMode, prefersReducedMotion]);

  useEffect(() => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPerformanceMode, prefersReducedMotion, handleScroll]);

  useEffect(() => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    // Enhanced intersection observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in', 'animate-slide-up');
          
          // Add staggered animations for child elements
          const children = entry.target.querySelectorAll('.animate-stagger');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('animate-fade-in', 'animate-slide-up');
            }, index * 100);
          });
        }
      });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [isPerformanceMode, prefersReducedMotion]);

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
      title: "Generate Plan",
      description: "Get your personalized trading plan with exact position sizes and risk management",
      icon: <BarChart3 className="w-6 h-6" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative" onMouseMove={handleMouseMove}>
      <Header />
      <HeroBackground />
      
      {/* Performance Toggle */}
      {!prefersReducedMotion && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => setIsPerformanceMode(!isPerformanceMode)}
            className="bg-gray-800/80 backdrop-blur-sm hover:bg-gray-700/80 text-white px-3 py-2 rounded-lg text-sm transition-all duration-300 border border-gray-600/50 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/25"
          >
            {isPerformanceMode ? '🚀 Enable Animations' : '⚡ Disable Animations'}
          </button>
        </div>
      )}

      {/* Hero Section with enhanced animations */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-5xl mx-auto relative z-10">
          {/* Floating badge with enhanced animation */}
          <div className="inline-flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-full px-4 py-2 mb-8 animate-fade-in hover:scale-105 transition-transform duration-300 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/25">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              Professional Prop Firm Clearing Service
            </span>
          </div>

          {/* Main title with enhanced styling and animations */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-8 leading-tight animate-fade-in animate-slide-up">
            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-500 animate-pulse hover:animate-none transition-all duration-500 hover:scale-105 inline-block">Funded Account</span> Journey
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Professional clearing service for prop firm challenges with custom trading plans and expert guidance
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto animate-fade-in animate-slide-up" style={{ animationDelay: '0.4s' }}>
            Join <span className="text-blue-400 font-semibold hover:text-cyan-400 transition-colors duration-300">2,847 successful traders</span> who cleared their challenges with our proven methodology.
          </p>
          
          {/* Enhanced CTA buttons with hover effects */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-fade-in animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <Link
              to="/signup"
              className="group bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 hover:from-blue-700 hover:via-cyan-700 hover:to-purple-700 text-white px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 flex items-center gap-3 border border-blue-400/30 hover:border-cyan-400/50 relative overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              <span className="relative z-10">Start Your Journey</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300 relative z-10" />
            </Link>
            <Link
              to="/features"
              className="group border-2 border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transform"
            >
              View Pricing
            </Link>
            <Link
              to="/affiliate-links"
              className="group bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-10 py-5 rounded-2xl text-xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 flex items-center gap-3 hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Get Free Access <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
          
          {/* Enhanced stats with staggered animations and 3D effects */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto animate-fade-in animate-slide-up" style={{ animationDelay: '0.8s' }}>
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="group relative bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden animate-stagger"
                style={{ 
                  animationDelay: `${1.0 + (index * 0.1)}s`,
                  transform: `perspective(1000px) rotateY(${mousePosition.x * 3}deg) rotateX(${mousePosition.y * 3}deg)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2 group-hover:scale-110 transition-transform duration-300 relative z-10 group-hover:text-cyan-400">
                  {isLoadingStats ? (
                    <div className="animate-pulse bg-blue-400/20 rounded h-10 w-20 mx-auto"></div>
                  ) : (
                    stat.number
                  )}
                </div>
                <div className="text-white font-semibold mb-1 relative z-10 group-hover:text-blue-200 transition-colors duration-300">{stat.label}</div>
                <div className="text-sm text-gray-400 relative z-10 group-hover:text-gray-300 transition-colors duration-300">{stat.description}</div>
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20 rounded-2xl blur-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Process Flow with parallax */}
      <section ref={processRef} className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-900/30 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-on-scroll">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">5-Step Clearing Process</h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Our proven methodology takes you from prop firm selection to funded account success
            </p>
          </div>
          
          <div className="relative">
            {/* Animated connection line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500 transform -translate-y-1/2 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {processSteps.map((step, index) => (
                <div 
                  key={index} 
                  className="relative animate-on-scroll animate-stagger"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-3xl border border-gray-700/50 hover:border-blue-500/50 transition-all duration-500 group hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 transform">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-blue-500/25">
                        <span className="text-white font-bold text-2xl">{step.step}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">{step.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section with 3D effects */}
      <section ref={featuresRef} className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-on-scroll">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Professional-Grade Features</h2>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto">
              Everything you need to successfully clear prop firm challenges and manage funded accounts
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group relative bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 transition-all duration-500 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden animate-on-scroll animate-stagger hover:scale-105 transform"
                style={{ 
                  animationDelay: `${index * 0.1}s`,
                  transform: `perspective(1000px) rotateY(${mousePosition.x * 2}deg) rotateX(${mousePosition.y * 2}deg)`,
                  transformStyle: 'preserve-3d'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className={`${feature.color} mb-6 group-hover:scale-110 transition-all duration-500 relative z-10 group-hover:text-blue-400`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300 relative z-10">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed relative z-10 group-hover:text-gray-300 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Enhanced hover glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-transparent to-purple-500/20 rounded-3xl blur-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section with parallax - TEMPORARILY COMMENTED OUT TO FIX OVERLAPPING ISSUE */}
      {/* <section ref={ctaRef} className="py-24 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl border border-blue-500/20 p-16 animate-on-scroll hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-500">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 hover:from-cyan-400 hover:to-blue-500 transition-all duration-500">Start</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
              Join thousands of successful traders and start your journey to funded account status today
            </p>
            <Link
              to="/signup"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-5 rounded-2xl text-2xl font-semibold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 border border-blue-400/30 hover:border-cyan-400/50 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              <span className="relative z-10">Get Started Now</span>
            </Link>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default LandingPage;
