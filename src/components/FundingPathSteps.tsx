import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Zap, Trophy, ArrowRight } from 'lucide-react';

const FundingPathSteps: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Setup & Configure',
      description: 'Choose your prop firm and configure your trading parameters. No account connection required - just follow our signals manually to avoid permanent bans.',
      icon: Settings,
      color: 'from-blue-500 to-cyan-500',
      details: [
        'Select your preferred prop firm',
        'Configure account size and drawdown limits',
        'Set risk management parameters',
        'Follow our signals manually (no API connection needed)'
      ]
    },
    {
      step: 2,
      title: 'AI-Powered Execution',
      description: 'Our AI analyzes the markets 24/7, identifying high-probability setups and managing risk automatically.',
      icon: Zap,
      color: 'from-purple-500 to-pink-500',
      details: [
        'Real-time market scanning',
        'AI-driven entry and exit signals',
        'Automated risk management',
        '24/7 market monitoring'
      ]
    },
    {
      step: 3,
      title: 'Get Funded',
      description: 'Reach your profit targets while staying within drawdown limits. Scale your capital and start receiving payouts.',
      icon: Trophy,
      color: 'from-green-500 to-emerald-500',
      details: [
        'Achieve profit targets consistently',
        'Scale up account sizes',
        'Receive profit payouts',
        'Build funded trading career'
      ]
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] via-transparent to-blue-500/[0.02]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              The 3-Step Path to{" "}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-blue-300">
              Funding
            </span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
            From prop firm challenge to funded trader in just three simple steps
          </p>
        </div>

        {/* Steps Timeline */}
        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-30"></div>

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                {/* Step Card */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 group">
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Step</span>
                      <span className={`px-3 py-1 bg-gradient-to-r ${step.color} text-white text-sm font-bold rounded-full`}>
                        {step.step}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-4 group-hover:text-gray-200 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Details List */}
                  <ul className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <motion.li
                        key={detailIndex}
                        className="flex items-start space-x-3"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: (index * 0.2) + (detailIndex * 0.1) }}
                        viewport={{ once: true }}
                      >
                        <div className={`w-2 h-2 bg-gradient-to-r ${step.color} rounded-full mt-2 flex-shrink-0`}></div>
                        <span className="text-sm text-gray-300">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Arrow for next step */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute -right-6 top-1/2 transform -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your Journey?</h3>
            <p className="text-gray-300 mb-6">
              Join thousands of traders who have successfully navigated the path to funding with our AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105">
                Start Free Trial
              </button>
              <button className="border border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300">
                View Success Stories
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FundingPathSteps;
