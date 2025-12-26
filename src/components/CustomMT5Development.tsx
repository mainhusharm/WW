import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot,
  Shield,
  Clock,
  Star,
  CheckCircle,
  ArrowRight,
  Play,
  Code,
  Zap,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';

const CustomMT5Development: React.FC = () => {
  const valueCards = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Advanced Algorithms",
      description: "Precision-coded MQL5 logic that executes your entries and exits in milliseconds—faster than any human hand.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Institutional Risk Management",
      description: "Hard-coded drawdown protection and dynamic position sizing tailored specifically to pass FTMO, FundingPips, and other major prop firm rules.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "24/7 Market Mastery",
      description: "Your strategy never sleeps. Our bots monitor the markets around the clock, capturing opportunities in London, New York, and Asia while you rest.",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: 299,
      description: "Perfect for simple indicator-based strategies. Includes basic risk management and 1 revision.",
      features: [
        "Basic strategy automation",
        "EX5 file delivery",
        "Basic risk management",
        "1 revision included",
        "5-7 business days delivery",
        "Email support"
      ],
      icon: <Bot className="w-6 h-6" />,
      color: "border-orange-500/50 bg-orange-500/10",
      buttonColor: "bg-orange-500 hover:bg-orange-600"
    },
    {
      name: "Pro",
      price: 599,
      description: "Advanced multi-timeframe analysis and custom dashboard integration. Ideal for serious traders scaling their funded accounts.",
      features: [
        "Advanced strategy automation",
        "Custom indicators integration",
        "Multi-timeframe analysis",
        "EX5 + Backtest report",
        "Advanced risk filters",
        "2 revisions included",
        "5-7 business days delivery",
        "Dashboard + chat support"
      ],
      icon: <Zap className="w-6 h-6" />,
      color: "border-purple-500/50 bg-purple-500/10",
      buttonColor: "bg-purple-500 hover:bg-purple-600",
      popular: true
    },
    {
      name: "Elite",
      price: 1299,
      description: "Full professional suite including source code (MQ5), complex news-filtering, and lifetime updates. The ultimate choice for institutional-grade automation.",
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
      ],
      icon: <Award className="w-6 h-6" />,
      color: "border-green-500/50 bg-green-500/10",
      buttonColor: "bg-green-500 hover:bg-green-600"
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-purple-500/[0.01] to-green-500/[0.02]" />

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(249,115,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.05)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Your Strategy,
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-300 via-purple-300 to-green-300">
              Fully Automated
            </span>
          </motion.h2>

          <motion.p
            className="text-xl text-white/60 max-w-4xl mx-auto font-light leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Move beyond manual limitations. We transform your unique trading rules into high-performance
            MetaTrader 5 Expert Advisors (EAs) built for the demands of prop firm challenges.
          </motion.p>
        </div>

        {/* Value Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {valueCards.map((card, index) => (
            <motion.div
              key={index}
              className="group relative p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-500 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ rotateY: 5, rotateX: 5 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className={`mb-6 w-16 h-16 rounded-2xl bg-gradient-to-r ${card.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <div className="text-white">
                  {card.icon}
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-white transition-colors duration-300">
                {card.title}
              </h3>

              <p className="text-white/60 leading-relaxed group-hover:text-white/70 transition-colors duration-300">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Human-in-the-Loop Emphasis */}
        <motion.div
          className="text-center mb-16 p-8 rounded-3xl bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/20"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center mb-4">
            <Star className="w-6 h-6 text-yellow-400 mr-2" />
            <span className="text-yellow-400 font-semibold">Human-in-the-Loop Design</span>
          </div>
          <p className="text-white/80 text-lg max-w-3xl mx-auto">
            Your bot isn't a "black box" mystery—it's your proven strategy, just more disciplined.
            Every trade follows your exact rules, but executes with perfect timing and emotional control.
          </p>
        </motion.div>

        {/* Pricing Tiers */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Elite Development
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-green-300">
                {" "}Tiers
              </span>
            </h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Choose the perfect package for your strategy complexity and automation needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={index}
                className={cn(
                  "relative p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 group hover:scale-105",
                  tier.color,
                  tier.popular && "scale-105"
                )}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                {tier.popular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-30">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4 text-white">
                    {tier.icon}
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-2">{tier.name}</h4>
                  <div className="text-4xl font-bold text-white mb-2">${tier.price}</div>
                  <div className="text-white/60">one-time payment</div>
                </div>

                <p className="text-white/70 text-center mb-6 leading-relaxed">
                  {tier.description}
                </p>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/mt5-development?plan=${tier.name.toLowerCase()}`}
                  className={cn(
                    "w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 text-white text-center block hover:scale-105",
                    tier.buttonColor
                  )}
                >
                  Choose {tier.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Demo Video Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="mb-8">
            <h3 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                See Your Strategy in Action
              </span>
            </h3>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Watch how we transform a client's manual strategy into a high-performance automated system
            </p>
          </div>

          <div className="inline-flex items-center justify-center">
            <button className="group relative overflow-hidden bg-gradient-to-r from-orange-500/10 to-purple-500/10 border border-orange-500/30 hover:border-orange-400/50 text-white backdrop-blur-sm px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/25">
              <Play className="w-5 h-5 mr-2 inline" />
              Watch Custom Bot Demo
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </div>
        </motion.div>

        {/* CTA & Trust Signals */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="p-12 rounded-3xl bg-gradient-to-r from-orange-500/5 to-purple-500/5 border border-white/10 backdrop-blur-sm max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                Ready to Automate Your Edge?
              </span>
            </h3>

            <p className="text-lg text-white/60 mb-8 leading-relaxed">
              Join 500+ traders who have eliminated emotional trading and scaled their results with custom MT5 automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                to="/mt5-inquiry"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-purple-500 text-white font-semibold rounded-full hover:from-orange-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Start Your Custom Build
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>98.7% Success Rate on Technical Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-orange-400" />
                <span>500+ Bots Built</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Expert Support</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomMT5Development;
