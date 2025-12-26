import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  ArrowLeft,
  Star,
  TrendingUp,
  Users,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from './Header';

const PropPassGuarantee: React.FC = () => {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-40 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Minimal Header */}
          <div className="text-center mb-16">
            <motion.h1
              className="text-3xl md:text-5xl font-light mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Prop Pass Guarantee
            </motion.h1>
            <motion.p
              className="text-lg text-white/60 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your success is guaranteed. If you use our Pro Signals and fail your challenge,
              your next 3 months are completely FREE.
            </motion.p>
          </div>

        {/* Main Guarantee Section */}
        <motion.div
          className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-3xl p-8 md:p-12 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              100% Risk-Free Challenge Clearing
            </h2>
            <p className="text-lg text-white/70">
              We're so confident in our signals that we're willing to back them with our money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white mb-4">How It Works</h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-400 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Subscribe to Pro Signals</h4>
                    <p className="text-white/60">Get access to our AI-powered trading signals with 85%+ accuracy.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-400 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Use Signals in Your Challenge</h4>
                    <p className="text-white/60">Follow our signals during your prop firm evaluation phase.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-400 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Contact Support If Needed</h4>
                    <p className="text-white/60">If you fail despite following signals, contact support within 7 days.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-400 font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-1">Get 3 Months FREE</h4>
                    <p className="text-white/60">Receive 3 months of Pro Signals at no additional cost.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-white mb-4">Why We're Confident</h3>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-white">94% Success Rate</span>
                  </div>
                  <p className="text-sm text-white/60">Our traders have a 94% success rate in clearing prop firm challenges.</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">85%+ Signal Accuracy</span>
                  </div>
                  <p className="text-sm text-white/60">Our AI signals have proven accuracy across thousands of trades.</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="font-semibold text-white">2,847+ Successful Traders</span>
                  </div>
                  <p className="text-sm text-white/60">Real results from real traders who've cleared their challenges.</p>
                </div>

                <div className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-white">$50M+ Profits Generated</span>
                  </div>
                  <p className="text-sm text-white/60">Total profits our signals have helped traders achieve.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Terms & Conditions */}
        <motion.div
          className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h3 className="text-2xl font-semibold text-white mb-6">Terms & Conditions</h3>

          <div className="space-y-4 text-white/70">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p>Guarantee applies to Pro Signals subscription during active prop firm challenge phase.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p>You must follow our signal instructions exactly as provided (entry, stop loss, take profit).</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p>Challenge failure must be due to market conditions, not user error or platform issues.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p>Request must be submitted within 7 business days of challenge end date.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p>3 months free credit applied to your account automatically upon approval.</p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <p>Guarantee is limited to one use per trader and cannot be combined with other offers.</p>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Ready to Start Your
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-orange-300">
              {" "}Risk-Free Challenge?
            </span>
          </h2>

          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Join thousands of traders who have cleared their prop firm challenges with zero financial risk.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              to="/membership"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
            >
              Start Risk-Free Challenge
              <Shield className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/prop-comparison"
              className="inline-flex items-center px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              Compare Prop Firms
              <TrendingUp className="ml-2 w-5 h-5" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-white/40">
            <span>✓ 100% Risk-Free</span>
            <span>✓ 94% Success Rate</span>
            <span>✓ 2,847+ Happy Traders</span>
          </div>
        </motion.div>

        {/* Back Navigation */}
        <div className="text-center mt-12">
          <Link
            to="/prop-comparison"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Prop Firm Comparison
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PropPassGuarantee;
