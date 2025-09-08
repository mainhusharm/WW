import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, CheckCircle, ArrowRight, Star, Shield, Clock, Settings, Globe, Newspaper, Layers, FileText, Headphones, Gauge } from 'lucide-react';
import Header from './Header';

const MT5BotsPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Settings className="w-8 h-8" />,
      title: "Tailored to Your Rules",
      description: "Every bot is custom-built based on your exact trading strategy, risk parameters, and market conditions."
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Universal Broker Compatibility",
      description: "Works seamlessly with all MT5 brokers worldwide. No compatibility issues, just plug and play."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Advanced Risk Management",
      description: "Built-in stop loss, take profit, trailing stops, and position sizing based on your risk tolerance."
    },
    {
      icon: <Newspaper className="w-8 h-8" />,
      title: "News Filter Integration",
      description: "Automatically pause trading during high-impact news events to protect your capital."
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Multi-Timeframe Logic",
      description: "Analyze multiple timeframes simultaneously for more accurate entry and exit signals."
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Complete Testing Report",
      description: "Receive detailed backtesting results and optimization reports with your finished bot."
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "Dedicated Support",
      description: "Direct communication with our developers through your personal dashboard and chat system."
    },
    {
      icon: <Gauge className="w-8 h-8" />,
      title: "Client Dashboard",
      description: "Track your project progress, download files, and communicate with developers in real-time."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: 299,
      period: "one-time",
      description: "Basic strategy automation",
      icon: <Bot className="w-6 h-6" />,
      color: "border-orange-500",
      bgColor: "bg-orange-500/10",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
      features: [
        "Basic strategy automation",
        "EX5 file delivery",
        "Basic risk management",
        "1 revision included",
        "5-7 business days delivery",
        "Email support"
      ]
    },
    {
      name: "Pro",
      price: 599,
      period: "one-time",
      description: "Advanced strategy automation",
      icon: <CheckCircle className="w-6 h-6" />,
      color: "border-purple-500",
      bgColor: "bg-purple-500/10",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      popular: true,
      features: [
        "Advanced strategy automation",
        "Custom indicators integration",
        "Multi-timeframe analysis",
        "EX5 + Backtest report",
        "Advanced risk filters",
        "2 revisions included",
        "5-7 business days delivery",
        "Dashboard + chat support"
      ]
    },
    {
      name: "Elite",
      price: 1299,
      period: "one-time",
      description: "Full professional development",
      icon: <Star className="w-6 h-6" />,
      color: "border-green-500",
      bgColor: "bg-green-500/10",
      buttonColor: "bg-green-600 hover:bg-green-700",
      features: [
        "Full professional bot development",
        "EX5 + Source Code (MQ5)",
        "Custom risk management modules",
        "News filter integration",
        "Multi-currency support",
        "Lifetime updates included",
        "Unlimited revisions",
        "Priority support",
        "7-10 business days delivery"
      ]
    }
  ];

  const faqs = [
    {
      question: "How long does development take?",
      answer: "Development typically takes 5-10 business days depending on the complexity of your strategy and the plan you choose. Starter and Pro plans are usually completed within 5-7 days, while Elite plans may take 7-10 days due to additional features and testing."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Refunds are allowed only before coding begins. Once our developers start working on your bot, refunds are not available. However, we include revisions in all plans to ensure your bot meets your exact requirements."
    },
    {
      question: "Do you guarantee profits with your bots?",
      answer: "No, we do not guarantee profits. Our bots are sophisticated tools designed to execute your trading strategy automatically, but market conditions and strategy performance can vary. All trading involves risk, and our bots are for educational and automation purposes only."
    },
    {
      question: "Will my trading strategy remain confidential?",
      answer: "Absolutely. We take confidentiality very seriously. All client strategies are protected under strict NDAs and data protection policies. Your trading logic and parameters are never shared with third parties or used for any other purpose."
    },
    {
      question: "What information do I need to provide?",
      answer: "You'll need to provide a detailed description of your trading strategy, including entry/exit rules, risk management parameters (stop loss, take profit, position sizing), timeframes, and any specific indicators you use. The more detailed your requirements, the better we can build your bot."
    },
    {
      question: "Do you provide ongoing support after delivery?",
      answer: "Yes! All plans include post-delivery support. Starter and Pro plans include 30 days of support for bug fixes and minor adjustments. Elite plans include lifetime updates and priority support for any issues or MT5 platform changes."
    }
  ];

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan.name);
    // Navigate to signup page with plan details
    window.location.href = `/mt5-signup?plan=${plan.name}&price=${plan.price}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm border border-purple-500/30 rounded-full px-6 py-3">
                <Bot className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300 font-medium">Custom MT5 Bot Development</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Your Strategy, Our Code –{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  Custom MT5 Bots
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 leading-relaxed">
                We build Expert Advisors tailored to your exact rules. Automate and scale like a pro with professional-grade MT5 bots that execute your strategy flawlessly.
              </p>
              
              <div className="grid grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">500+</div>
                  <div className="text-sm text-gray-400">Bots Delivered</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">98%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">7</div>
                  <div className="text-sm text-gray-400">Avg. Days Delivery</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center"
                >
                  Choose Your Plan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <Link
                  to="/mt5-signin"
                  className="border-2 border-gray-600 text-gray-300 hover:border-purple-500 hover:text-purple-400 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 backdrop-blur-sm hover:bg-purple-500/5 flex items-center justify-center"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8">
                <div className="bg-gray-900 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-400">YourStrategy.mq5</span>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="text-blue-400">
                      <span className="text-gray-500">1</span> <span className="text-purple-400">input</span> <span className="text-cyan-400">double</span> <span className="text-white">StopLoss</span> = <span className="text-yellow-400">50.0</span>;
                    </div>
                    <div className="text-blue-400">
                      <span className="text-gray-500">2</span> <span className="text-purple-400">input</span> <span className="text-cyan-400">double</span> <span className="text-white">TakeProfit</span> = <span className="text-yellow-400">100.0</span>;
                    </div>
                    <div className="text-blue-400">
                      <span className="text-gray-500">3</span> <span className="text-purple-400">input</span> <span className="text-cyan-400">double</span> <span className="text-white">LotSize</span> = <span className="text-yellow-400">0.1</span>;
                    </div>
                    <div className="text-green-400 bg-green-500/10 px-2 py-1 rounded">
                      <span className="text-gray-500">4</span> <span className="text-purple-400">if</span>(<span className="text-cyan-400">SignalBuy</span>()) <span className="text-cyan-400">OpenBuy</span>();
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-900 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-300">Live Performance</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">+24.7%</div>
                      <div className="text-xs text-gray-400">Monthly Return</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">1.47</div>
                      <div className="text-xs text-gray-400">Profit Factor</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Why Choose Our MT5 Bot Development?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Professional-grade Expert Advisors built to your exact specifications
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 text-center hover:border-purple-500/50 transition-all duration-300">
                <div className="text-purple-400 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Choose Your Development Plan
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Professional MT5 bot development tailored to your needs and budget
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gray-800/60 backdrop-blur-sm rounded-3xl border-2 ${plan.color} p-8 transition-all duration-500 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20 ${
                  plan.popular ? 'scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      MOST POPULAR
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className="text-purple-400 mb-4 flex justify-center">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400">/{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handlePlanSelect(plan)}
                  className={`w-full ${plan.buttonColor} text-white py-3 rounded-lg font-semibold transition-colors`}
                >
                  Choose {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need to know about our MT5 bot development service
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
                <h3 className="text-xl font-bold text-white mb-4">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Educational Purpose</h3>
              <p className="text-gray-400 text-sm">All MT5 bots are developed for educational and automation purposes only. They are tools to help execute your trading strategy, not financial advice.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Profit Guarantee</h3>
              <p className="text-gray-400 text-sm">We do not guarantee profitability. Trading involves substantial risk, and past performance does not guarantee future results.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Clear Refund Policy</h3>
              <p className="text-gray-400 text-sm">Refunds are available only before development begins. Once coding starts, refunds are not available, but revisions are included.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Data Protection</h3>
              <p className="text-gray-400 text-sm">Your trading strategies and personal information are protected under strict confidentiality agreements and are never shared.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Automate Your Trading Strategy?
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            Join hundreds of traders who have automated their strategies with our custom MT5 bots. Start your journey to automated trading success today.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-purple-500/50 flex items-center justify-center"
            >
              Choose Your Plan
              <ArrowRight className="w-6 h-6 ml-2" />
            </button>
            <Link
              to="/mt5-signin"
              className="border-2 border-gray-600 text-gray-300 hover:border-purple-500 hover:text-purple-400 px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-300 backdrop-blur-sm hover:bg-purple-500/5 flex items-center justify-center"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MT5BotsPage;
