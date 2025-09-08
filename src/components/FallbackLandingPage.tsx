import React from 'react';
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

const FallbackLandingPage = () => {
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

  const stats = [
    { number: "2,847", label: "Funded Accounts", description: "Successfully cleared" },
    { number: "86.7%", label: "Success Rate", description: "Challenge completion" },
    { number: "$47.2M", label: "Total Funded", description: "Across all prop firms" },
    { number: "150+", label: "Prop Firms", description: "Supported platforms" }
  ];

  const testimonials = [
    {
      name: "Alex Chen",
      role: "FTMO Trader",
      image: "AC",
      rating: 5,
      content: "TraderEdge Pro transformed my approach to prop firm challenges. The risk management strategies are game-changing.",
      profit: "+$127K"
    },
    {
      name: "Sarah Mitchell",
      role: "MyForexFunds",
      image: "SM",
      rating: 5,
      content: "Finally cleared my challenge phase! The personalized trading plan made all the difference.",
      profit: "+$89K"
    },
    {
      name: "Marcus Rodriguez",
      role: "The5%ers",
      image: "MR",
      rating: 5,
      content: "Professional-grade signals and expert guidance. This is what I was missing in my trading journey.",
      profit: "+$203K"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Simple animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-blue-500/10"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              #1 Prop Firm Success Platform
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Master Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              Prop Firm Challenge
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join thousands of successful traders who achieved funded account status with our proven methodology, 
            expert guidance, and professional-grade tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              to="/membership"
              className="group bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-cyan-500/50"
            >
              <span className="flex items-center">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            
            <Link
              to="/features"
              className="border-2 border-gray-600 text-gray-300 hover:border-cyan-500 hover:text-cyan-400 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 backdrop-blur-sm hover:bg-cyan-500/5"
            >
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools, strategies, and support you need to clear your prop firm challenge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-500 hover:transform hover:scale-105`}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={feature.color}>
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-400">
              See how our traders achieved their goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 overflow-hidden hover:border-cyan-500/50 transition-all duration-500"
              >
                <div className="relative z-10">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-gray-300 mb-8 leading-relaxed italic text-lg">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
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

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="relative bg-gray-800/60 backdrop-blur-sm rounded-3xl p-16 border border-gray-700/50 overflow-hidden">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
              Ready to Clear Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
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
      </section>
    </div>
  );
};

export default FallbackLandingPage;
