import React from 'react';
import { motion } from 'framer-motion';
import CombinedMembershipPlans from './CombinedMembershipPlans';
import Header from './Header';
import Footer from './Footer';
import SEOWrapper from './SEOWrapper';

const PricingPage: React.FC = () => {
  return (
    <SEOWrapper
      pageType="features"
      customTitle="Pricing Plans - TraderEdge Pro | AI-Powered Trading Platform"
      customDescription="Choose the perfect trading plan for your journey. Monthly or yearly options available with 20% savings on annual plans. AI-powered signals, risk management, and 94% success rate."
      customKeywords={[
        "trading platform pricing",
        "subscription plans",
        "AI trading signals",
        "prop firm tools",
        "trading software",
        "monthly subscription",
        "yearly plans",
        "trading costs",
        "funded trading account",
        "trading signals service"
      ]}
    >
      <div className="min-h-screen bg-[#030303] text-white">
        <Header />

        {/* Hero Section for Pricing Page */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-blue-500/[0.02]" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Choose Your{" "}
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-blue-300">
                  Trading Plan
                </span>
              </h1>
              <p className="text-xl text-white/40 max-w-3xl mx-auto font-light mb-8">
                Start your journey to consistent profits with our AI-powered trading platform.
                Choose monthly or save 20% with annual billing.
              </p>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-12 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>94% Success Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>24/7 AI Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>30-Day Money Back</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Cancel Anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Plans */}
        <CombinedMembershipPlans />

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Frequently Asked{" "}
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-red-300">
                  Questions
                </span>
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Can I switch between monthly and yearly billing?</h3>
                <p className="text-white/70">Yes, you can change your billing cycle at any time from your account settings. The savings apply immediately when switching to annual billing.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">What happens if I need to cancel?</h3>
                <p className="text-white/70">You can cancel your subscription at any time with no penalties. For annual plans, you'll continue to have access until the end of your billing period.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Do you offer refunds?</h3>
                <p className="text-white/70">Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service, we'll refund your payment in full.</p>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">Can I upgrade or downgrade my plan?</h3>
                <p className="text-white/70">Absolutely! You can change your plan at any time. Upgrades take effect immediately, while downgrades apply at the next billing cycle.</p>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </SEOWrapper>
  );
};

export default PricingPage;
