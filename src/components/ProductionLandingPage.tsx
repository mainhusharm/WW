import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Target, 
  Users, 
  BarChart3, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Award,
  DollarSign,
  Zap,
  ChevronDown
} from 'lucide-react';
import Header from './Header';
import MT5BotPortal from './MT5BotPortal';
import CombinedMembershipPlans from './CombinedMembershipPlans';
import Futuristic3DKey from './NeuralBackground';

const ProductionLandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 2000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
    };
  }, []);

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Professional Guidance",
      description: "Expert support for prop firm challenges with proven strategies and personalized coaching.",
      gradient: "from-cyan-500/10 to-blue-500/10",
      color: "text-cyan-400"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Precision Trading",
      description: "Advanced analytics and risk management tools to maximize your trading success.",
      gradient: "from-blue-500/10 to-purple-500/10",
      color: "text-blue-400"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Support",
      description: "Join thousands of successful traders in our exclusive community and Discord.",
      gradient: "from-purple-500/10 to-pink-500/10",
      color: "text-purple-400"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-time Analytics",
      description: "Comprehensive performance tracking and detailed reporting for your trades.",
      gradient: "from-pink-500/10 to-red-500/10",
      color: "text-pink-400"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Fast Execution",
      description: "Lightning-fast trade execution with minimal slippage and optimal pricing.",
      gradient: "from-red-500/10 to-orange-500/10",
      color: "text-red-400"
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Proven Results",
      description: "Over 2,847 successful traders have cleared their challenges with our help.",
      gradient: "from-orange-500/10 to-yellow-500/10",
      color: "text-orange-400"
    }
  ];

  const stats = [
    { number: "2,847+", label: "Successful Traders" },
    { number: "94%", label: "Success Rate" },
    { number: "$50M+", label: "Total Profits" },
    { number: "24/7", label: "Support Available" }
  ];

  const testimonials = [
    {
      author: "Sarah Chen",
      role: "Prop Trader",
      content: "The guidance and support I received was incredible. I cleared my challenge in just 3 weeks!",
      rating: 5,
      profit: "+$12,500"
    },
    {
      author: "Marcus Johnson",
      role: "Day Trader",
      content: "The analytics platform is game-changing. I can see exactly where I need to improve.",
      rating: 5,
      profit: "+$8,900"
    },
    {
      author: "Elena Rodriguez",
      role: "Swing Trader",
      content: "The community support and expert guidance made all the difference in my trading journey.",
      rating: 5,
      profit: "+$15,200"
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <Header />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden">
        {/* Futuristic 3D Key Background - Only in Hero Section */}
        <div className="absolute inset-0 z-0">
          <Futuristic3DKey />
        </div>
        
        {/* Hero Content Overlay */}
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center space-y-8 px-4">
            <div className="space-y-4">
              <h1 className="text-7xl md:text-9xl font-extralight tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400">
              Master  Your
              </h1>
              <h2 className="text-5xl md:text-7xl font-thin tracking-[0.2em] text-white/90">
              Funded Account Journey
              </h2>
            </div>
            <p className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto font-extralight leading-relaxed tracking-wide">
            Professional clearing service for prop firm challenges 
              <br className="hidden md:block" />
              with custom trading plans and expert guidance
            </p>
            
            {/* Enhanced CTA */}
            <div className="pt-12">
              <Link
                to="/membership"
                className="group relative px-12 py-5 bg-transparent border border-cyan-400/20 text-cyan-400/80 font-extralight tracking-[0.15em] text-lg hover:border-cyan-400/40 hover:text-cyan-400 transition-all duration-700 overflow-hidden backdrop-blur-sm inline-block"
              >
                <span className="relative z-10">EXPLORE TRADING</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute inset-0 border border-cyan-400/10 group-hover:border-cyan-400/20 transition-colors duration-700" />
              </Link>
            </div>
          </div>

          {/* Floating UI Elements */}
          <div className="absolute top-8 left-8 z-10 text-white/30 font-mono text-sm tracking-wider">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span>TRADING ACTIVITY: ACTIVE</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                
              </div>
            </div>
          </div>

          <div className="absolute top-8 right-8 z-10 text-white/30 font-mono text-sm tracking-wider text-right">
            <div className="space-y-1">
              <div>NEURAL FLOW</div>
              <div className="text-cyan-400/60"></div>
            </div>
          </div>

          {/* Enhanced Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-10">
            <div className="flex flex-col items-center space-y-4 text-white/30">
              <div className="text-xs font-mono tracking-[0.2em]">SCROLL TO EXPLORE</div>
              <div className="relative">
                <div className="w-px h-20 bg-gradient-to-b from-cyan-400/40 via-blue-400/60 to-transparent" />
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyan-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
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
                    {stat.number}
                  </div>
                  <div className="text-gray-300 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MT5 Bot Portal Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <MT5BotPortal />
        </div>
      </section>

      {/* Features Section with Enhanced 3D */}
      <section id="features" className="features-section py-20 px-4 sm:px-6 lg:px-8 relative z-10">
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
      <section className="parallax-section relative py-32 overflow-hidden">
        <div 
          className="parallax-bg absolute inset-0 z-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%)',
            transform: `translateY(${scrollY * 0.5}px) scale(1.1)`
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
              Experience the future of prop firm trading with our advanced analytics platform
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="testimonial-card group relative bg-gray-800/60 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden"
                style={{
                  transform: `perspective(1000px) rotateY(${mousePosition.x * 1}deg) rotateX(${mousePosition.y * 1}deg)`,
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
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.author.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{testimonial.author}</div>
                        <div className="text-gray-400 text-sm">{testimonial.role}</div>
                      </div>
                    </div>
                    <div className="text-cyan-400 font-bold text-lg">
                      {testimonial.profit}
                    </div>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 rounded-3xl blur-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Combined Membership Plans */}
      <CombinedMembershipPlans />

      {/* Final CTA with 3D Elements */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div 
            className="relative bg-gray-800/60 backdrop-blur-sm rounded-3xl p-16 border border-gray-700/50 overflow-hidden"
            style={{
              transform: `perspective(1000px) rotateX(${scrollY * 0.005}deg)`,
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
                Join thousands of successful traders who have cleared their challenges with our professional guidance
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  to="/membership"
                  className="group relative bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                
                <Link
                  to="/contact"
                  className="group relative bg-transparent border-2 border-cyan-400/50 hover:border-cyan-400 text-cyan-400 hover:text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 backdrop-blur-sm hover:bg-cyan-400/10"
                >
                  <span className="relative z-10">Get Support</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Loading Screen */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-cyan-400 text-xl font-semibold">Loading Experience...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionLandingPage;