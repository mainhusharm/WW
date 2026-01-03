import React from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Shield, CheckCircle, Users } from 'lucide-react';

const TraderSuccessProfiles: React.FC = () => {
  const profiles = [
    {
      type: 'Part-Time Trader',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      description: 'Uses Nexus AI to manage trades while working a 9-5 job',
      stats: {
        accounts: '3 Funded',
        profit: '$45K+',
        time: '2 hours/day'
      },
      quote: 'I work full-time but still wanted to build a trading career. Nexus handles the heavy lifting while I focus on my day job.',
      name: 'Sarah Chen',
      location: 'Singapore'
    },
    {
      type: 'Challenge Scaler',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      description: 'Uses the Pro plan to clear multiple $200k accounts simultaneously',
      stats: {
        accounts: '12 Funded',
        profit: '$180K+',
        time: '6 hours/day'
      },
      quote: 'I run multiple prop firm challenges at once. The AI manages risk across all accounts while I focus on strategy.',
      name: 'Marcus Rodriguez',
      location: 'Mexico City'
    },
    {
      type: 'Risk-Averse Beginner',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      description: 'Uses Risk Guard features to protect their first-ever funded account',
      stats: {
        accounts: '1 Funded',
        profit: '$8K+',
        time: '1 hour/day'
      },
      quote: 'I was terrified of losing money. The automated stop-losses gave me confidence to start trading seriously.',
      name: 'Emma Thompson',
      location: 'London'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Real Traders, Real Success
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            See how different types of traders are achieving consistent results with our AI-powered platform
          </p>
        </motion.div>

        {/* Success Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-green-400 mb-2">2,500+</div>
            <div className="text-sm text-gray-400">Funded Accounts</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-blue-400 mb-2">$12M+</div>
            <div className="text-sm text-gray-400">Profits Generated</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-purple-400 mb-2">87%</div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 text-center border border-gray-700">
            <div className="text-3xl font-bold text-orange-400 mb-2">50+</div>
            <div className="text-sm text-gray-400">Countries</div>
          </div>
        </motion.div>

        {/* Profile Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {profiles.map((profile, index) => (
            <motion.div
              key={profile.type}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all duration-300 group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className={`w-14 h-14 bg-gradient-to-r ${profile.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <profile.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Verified User</span>
                </div>
              </div>

              {/* Profile Type */}
              <h3 className="text-xl font-bold text-white mb-2">{profile.type}</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">{profile.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{profile.stats.accounts}</div>
                  <div className="text-xs text-gray-500">Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{profile.stats.profit}</div>
                  <div className="text-xs text-gray-500">Profit</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">{profile.stats.time}</div>
                  <div className="text-xs text-gray-500">Daily</div>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="text-gray-300 text-sm italic mb-6 border-l-2 border-gray-600 pl-4">
                "{profile.quote}"
              </blockquote>

              {/* Profile Info */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold text-sm">{profile.name}</div>
                  <div className="text-gray-500 text-xs">{profile.location}</div>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-400">Community</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-xl p-8 max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-green-400 font-semibold text-lg">Community Success</span>
            </div>
            <p className="text-gray-300 mb-6">
              Join over 2,500 successful traders who have cleared their prop firm challenges and built profitable trading careers with our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105">
                Join Our Community
              </button>
              <button className="border border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300">
                Read More Stories
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TraderSuccessProfiles;
