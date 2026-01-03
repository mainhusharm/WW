import React from 'react';
import { motion } from 'framer-motion';

const CompatiblePropFirms: React.FC = () => {
  const firms = [
    { name: 'FTMO', logo: 'FTMO' },
    { name: 'Funding Pips', logo: 'FP' },
    { name: 'MyFundedFX', logo: 'MFX' },
    { name: 'FundedNext', logo: 'FN' },
    { name: 'E8 Funding', logo: 'E8' },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-blue-500/[0.02]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Optimized for the World's{" "}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
              Leading Prop Firms
            </span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
            Our AI algorithms are specifically tuned for compatibility with the most popular proprietary trading firms
          </p>
        </div>

        {/* Logo Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          {firms.map((firm, index) => (
            <motion.div
              key={firm.name}
              className="group flex items-center justify-center p-8 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:bg-gray-800/70 hover:scale-105 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center">
                {/* Placeholder Logo - Replace with actual SVG logos */}
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300">
                  <span className="text-xl font-bold text-white group-hover:text-white">
                    {firm.logo}
                  </span>
                </div>
                <div className="text-gray-400 group-hover:text-white font-semibold transition-colors duration-300">
                  {firm.name}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
              </div>
              <span className="text-blue-400 font-semibold">Verified Compatibility</span>
            </div>
            <p className="text-gray-300">
              All strategies are regularly tested and optimized for each firm's specific rules, drawdown limits, and trading conditions.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CompatiblePropFirms;
