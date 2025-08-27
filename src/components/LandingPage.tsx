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
  const prefersReducedMotion = false; // Simplified for now
  
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
      
      setIsPerformanceMode(isLowEnd || prefersReducedMotion);
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
      title: "Generate Plan",
      description: "Get your personalized trading plan with exact position sizes and risk management",
      icon: <BarChart3 className="w-6 h-6" />
    }
  ];

  // Simple scroll handler without framer-motion
  const handleScroll = useCallback(() => {
    // Simple scroll handling for now
  }, []);

  useEffect(() => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPerformanceMode, prefersReducedMotion, handleScroll]);

  useEffect(() => {
    if (isPerformanceMode || prefersReducedMotion) return;
    
    // Simple animation setup
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, [isPerformanceMode, prefersReducedMotion]);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      <Header />
      <HeroBackground />
      
      {/* Performance Toggle */}
      {!prefersReducedMotion && (
        <div className="fixed top-20 right-4 z-50">
          <button
            onClick={() => setIsPerformanceMode(!isPerformanceMode)}
            className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            {isPerformanceMode ? 'Enable Animations' : 'Disable Animations'}
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <div className="animate-fade-in">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Prop Firm</span> Challenges
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Expert guidance, risk management, and proven strategies to successfully clear prop firm challenges and secure funded accounts
            </p>
            <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto">
              Join 2,436+ traders who have successfully cleared challenges and are now trading with funded accounts
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="group bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/features"
              className="group border border-gray-600 hover:border-cyan-500 text-gray-300 hover:text-cyan-400 px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 flex items-center gap-2"
            >
              Learn More
              <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Proven <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Results</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our platform has helped thousands of traders successfully clear prop firm challenges
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center group animate-on-scroll"
              >
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20">
                  <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {isLoadingStats ? (
                      <div className="animate-pulse bg-gray-700 h-10 rounded"></div>
                    ) : (
                      stat.number
                    )}
                  </div>
                  <div className="text-lg font-semibold text-white mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-400">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
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
                className="group relative bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden animate-on-scroll"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`${feature.color} mb-6 group-hover:scale-110 transition-all duration-500`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
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

      {/* Process Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Simple <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Get your personalized trading plan in just 4 easy steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div 
                key={index} 
                className="text-center group animate-on-scroll"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20">
                  <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl group-hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                  
                  <div className="text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                    {step.icon}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl border border-cyan-500/20 p-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Start</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of successful traders and start your journey to funded account status today
            </p>
            <Link
              to="/signup"
              className="inline-block bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-10 py-4 rounded-full text-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
