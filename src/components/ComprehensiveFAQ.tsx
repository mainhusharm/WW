import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Bot, Shield, DollarSign, HelpCircle } from 'lucide-react';

const ComprehensiveFAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  const faqs = [
    {
      question: 'Is this an EA or a Signal service?',
      answer: 'It is a hybrid platform offering both AI-powered signals and automated execution via our MT5 Bot Portal. You can choose to receive signals manually or let our algorithms execute trades automatically while you focus on strategy.',
      icon: Bot,
      category: 'Product'
    },
    {
      question: 'Does this violate Prop Firm "No Bot" rules?',
      answer: 'No. Our logic is designed to mimic professional human trading patterns and respects all major prop firm consistency and IP rules. The algorithms follow strict risk management protocols and avoid detectable automation patterns.',
      icon: Shield,
      category: 'Compliance'
    },
    {
      question: 'What is the minimum account size?',
      answer: 'Our strategies are scalable from $5k accounts up to $400k+ "Whale" accounts. We optimize position sizing and risk parameters based on your account size and prop firm requirements.',
      icon: DollarSign,
      category: 'Requirements'
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes, you can manage or cancel your subscription at any time through your dashboard. We offer flexible plans with no long-term commitments, and you can pause/resume service as needed.',
      icon: HelpCircle,
      category: 'Billing'
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/[0.02] via-transparent to-blue-500/[0.02]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Everything You Need to{" "}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-300 to-blue-300">
              Know
            </span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
            Common questions about our AI-powered trading platform
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-800/50 transition-colors duration-300"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 bg-gradient-to-r ${
                    faq.category === 'Product' ? 'from-blue-500 to-cyan-500' :
                    faq.category === 'Compliance' ? 'from-green-500 to-emerald-500' :
                    faq.category === 'Requirements' ? 'from-purple-500 to-pink-500' :
                    'from-orange-500 to-red-500'
                  } rounded-lg flex items-center justify-center`}>
                    <faq.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      faq.category === 'Product' ? 'bg-blue-500/20 text-blue-400' :
                      faq.category === 'Compliance' ? 'bg-green-500/20 text-green-400' :
                      faq.category === 'Requirements' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {faq.category}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                    openItems.has(index) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openItems.has(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6">
                      <div className="border-t border-gray-700 pt-6">
                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Additional Help */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <HelpCircle className="w-8 h-8 text-blue-400 mr-3" />
              <span className="text-blue-400 font-semibold text-lg">Need More Help?</span>
            </div>
            <p className="text-gray-300 mb-6">
              Can't find what you're looking for? Our support team is here to help you get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@traderedgepro.com"
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 inline-block text-center"
              >
                Contact Support
              </a>
              <a
                href="#live-chat"
                className="border border-gray-600 text-gray-300 px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 inline-block text-center"
              >
                Live Chat
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ComprehensiveFAQ;
