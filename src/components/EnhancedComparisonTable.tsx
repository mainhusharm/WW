import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Shield, TrendingUp, Clock, Brain } from 'lucide-react';

const EnhancedComparisonTable: React.FC = () => {
  const features = [
    {
      feature: 'Risk Guard',
      description: 'Automated risk management and position protection',
      manual: { value: 'None', icon: X, color: 'text-red-400' },
      standard: { value: 'Basic Alerts', icon: X, color: 'text-yellow-400' },
      traderEdge: { value: 'Automated Stop-Loss/Breakeven', icon: CheckCircle, color: 'text-green-400' }
    },
    {
      feature: 'Analysis',
      description: 'Technical and fundamental market analysis',
      manual: { value: 'Subjective', icon: X, color: 'text-red-400' },
      standard: { value: 'Basic Technicals', icon: CheckCircle, color: 'text-yellow-400' },
      traderEdge: { value: 'Nexus AI Multi-Factor Analysis', icon: CheckCircle, color: 'text-green-400' }
    },
    {
      feature: 'Availability',
      description: 'When signals and analysis are available',
      manual: { value: '8 hours/day', icon: X, color: 'text-red-400' },
      standard: { value: 'Intermittent', icon: X, color: 'text-yellow-400' },
      traderEdge: { value: '24/7 Global Market Monitoring', icon: CheckCircle, color: 'text-green-400' }
    },
    {
      feature: 'Psychology',
      description: 'Emotional impact on trading decisions',
      manual: { value: 'High Stress', icon: X, color: 'text-red-400' },
      standard: { value: 'High FOMO', icon: X, color: 'text-yellow-400' },
      traderEdge: { value: 'Emotionless Execution Logic', icon: CheckCircle, color: 'text-green-400' }
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-blue-500/[0.02]" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Why Choose{" "}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
              Trader Edge Pro?
            </span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
            See how our AI-powered platform outperforms traditional approaches
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8 md:p-12">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-gray-300 font-semibold">Features</th>
                  <th className="text-center py-4 px-6">
                    <div className="text-gray-400 font-medium">Manual Trading</div>
                    <div className="text-xs text-gray-500 mt-1">Traditional approach</div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="text-blue-400 font-medium">Standard Signal Groups</div>
                    <div className="text-xs text-gray-500 mt-1">Basic automation</div>
                  </th>
                  <th className="text-center py-4 px-6">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-bold">
                      Trader Edge Pro
                    </div>
                    <div className="text-xs text-gray-400 mt-1">AI-powered platform</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((item, index) => (
                  <motion.tr
                    key={item.feature}
                    className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <td className="py-6 px-6">
                      <div className="flex items-center space-x-3">
                        {item.feature === 'Risk Guard' && <Shield className="w-5 h-5 text-red-400" />}
                        {item.feature === 'Analysis' && <TrendingUp className="w-5 h-5 text-blue-400" />}
                        {item.feature === 'Availability' && <Clock className="w-5 h-5 text-green-400" />}
                        {item.feature === 'Psychology' && <Brain className="w-5 h-5 text-purple-400" />}
                        <div>
                          <div className="text-white font-semibold">{item.feature}</div>
                          <div className="text-gray-400 text-sm">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <div className={`flex items-center justify-center space-x-2 ${item.manual.color}`}>
                        <item.manual.icon className="w-5 h-5" />
                        <span className="font-medium">{item.manual.value}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <div className={`flex items-center justify-center space-x-2 ${item.standard.color}`}>
                        <item.standard.icon className="w-5 h-5" />
                        <span className="font-medium">{item.standard.value}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-center">
                      <div className={`flex items-center justify-center space-x-2 ${item.traderEdge.color}`}>
                        <item.traderEdge.icon className="w-5 h-5" />
                        <span className="font-bold">{item.traderEdge.value}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTA Section */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-6 border border-purple-500/20">
              <h3 className="text-xl font-bold text-white mb-2">Ready to Level Up Your Trading?</h3>
              <p className="text-gray-300 mb-4">Join thousands of traders who have eliminated emotional decision-making</p>
              <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-8 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                Start Your Free Trial
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedComparisonTable;
