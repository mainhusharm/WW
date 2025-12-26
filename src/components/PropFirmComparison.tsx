import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Filter,
  ExternalLink,
  Mail,
  CheckCircle,
  X,
  Star,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from './Header';

interface PropFirm {
  id: string;
  firm: string;
  name: string;
  payout_speed: string;
  drawdown: string;
  profit_split: string;
  edge_score: number;
  highlight: string;
  affiliate_link: string | null;
  trader_edge_insight: string;
  compatibility_score: number;
}

const PropFirmComparison: React.FC = () => {
  const [firms, setFirms] = useState<PropFirm[]>([]);
  const [filteredFirms, setFilteredFirms] = useState<PropFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'fastest' | 'cheapest' | 'ai-friendly'>('all');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [selectedFirm, setSelectedFirm] = useState<string>('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch prop firm data
  useEffect(() => {
    const fetchFirmData = async () => {
      try {
        // Try API first
        const response = await fetch('/api/v1/prop-comparison');
        const data = await response.json();
        if (data.success) {
          setFirms(data.data);
          setFilteredFirms(data.data);
          setLastUpdated(data.meta.lastUpdated);
        }
      } catch (error) {
        console.error('API not available, using local data:', error);
        // Fallback to local data if API is not running
        const localData = [
          {
            id: "fundednext",
            firm: "FundedNext",
            name: "FundedNext",
            payout_speed: "24h Guarantee",
            drawdown: "Balance-Based",
            profit_split: "Up to 95%",
            edge_score: 98,
            highlight: "15% Challenge Phase Profit Share",
            affiliate_link: null,
            trader_edge_insight: "Our AI scalping algorithms are perfectly optimized for FundedNext's flexible balance-based drawdown, capturing their 15% challenge profit share.",
            compatibility_score: 98
          },
          {
            id: "ftmo",
            firm: "FTMO",
            name: "FTMO",
            payout_speed: "1-2 Business Days",
            drawdown: "Static (Daily 5% / 10% Total)",
            profit_split: "Up to 90%",
            edge_score: 92,
            highlight: "Regulated Broker (OANDA) Partnership",
            affiliate_link: null,
            trader_edge_insight: "Our MT5 bots excel with FTMO's static drawdown limits, providing precise risk management that maximizes your 80% profit split potential.",
            compatibility_score: 92
          },
          {
            id: "fundingpips",
            firm: "FundingPips",
            name: "FundingPips",
            payout_speed: "Weekly (Tuesday)",
            drawdown: "Static",
            profit_split: "Up to 100%",
            edge_score: 96,
            highlight: "Lowest entry cost ($29)",
            affiliate_link: null,
            trader_edge_insight: "FundingPips' zero reward denial policy pairs perfectly with our Nexus AI signals, ensuring every profitable trade gets its full 100% payout.",
            compatibility_score: 96
          },
          {
            id: "e8",
            firm: "E8 Markets",
            name: "E8 Markets",
            payout_speed: "On-Demand (Avg 21 Hours)",
            drawdown: "Customizable (up to 14%)",
            profit_split: "80% - 100%",
            edge_score: 95,
            highlight: "User-defined drawdown targets",
            affiliate_link: null,
            trader_edge_insight: "Our bots dynamically adapt to E8's customizable drawdown targets, providing superior risk management compared to manual trading approaches.",
            compatibility_score: 95
          },
          {
            id: "the5ers",
            firm: "The5ers",
            name: "The5ers",
            payout_speed: "Every 14 Days",
            drawdown: "Equity/Balance Hybrid",
            profit_split: "Up to 100% (Scaling)",
            edge_score: 94,
            highlight: "Hyper-growth: Double funding every 10% gain",
            affiliate_link: null,
            trader_edge_insight: "The5ers' scaling model rewards consistent performance - our AI coaches ensure you maximize their hyper-growth potential without emotional interference.",
            compatibility_score: 94
          }
        ];
        setFirms(localData);
        setFilteredFirms(localData);
        setLastUpdated(new Date().toISOString().split('T')[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchFirmData();
  }, []);

  // Filter firms based on selection
  useEffect(() => {
    let filtered = [...firms];

    switch (filter) {
      case 'fastest':
        filtered = filtered.sort((a, b) => {
          // Simple heuristic for payout speed
          const speedOrder = ['8 - 24 Hours', 'On-Demand', 'Guaranteed < 24h', 'Weekly', 'Every 14 Days'];
          return speedOrder.indexOf(a.payout_speed) - speedOrder.indexOf(b.payout_speed);
        });
        break;
      case 'cheapest':
        // Sort by actual fee amounts (hardcoded in our data)
        const feeMap: { [key: string]: number } = {
          '92': 160,  // FTMO
          '98': 32,   // FundedNext
          '96': 29,   // FundingPips
          '95': 40,   // E8 Markets
          '94': 39    // The5ers
        };
        filtered = filtered.sort((a, b) => {
          const feeA = feeMap[a.edge_score.toString()] || 0;
          const feeB = feeMap[b.edge_score.toString()] || 0;
          return feeA - feeB;
        });
        break;
      case 'ai-friendly':
        filtered = filtered.sort((a, b) => b.compatibility_score - a.compatibility_score);
        break;
      default:
        // Keep default sorting by compatibility score
        break;
    }

    setFilteredFirms(filtered);
  }, [filter, firms]);

  const handleFirmClick = (firm: PropFirm) => {
    if (firm.affiliate_link) {
      // Track click for analytics
      window.open(firm.affiliate_link, '_blank');
    } else {
      // Show waitlist modal
      setSelectedFirm(firm.firm);
      setShowWaitlistModal(true);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);

    try {
      const response = await fetch('/api/v1/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: waitlistEmail,
          firm: selectedFirm,
          name: waitlistName
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Thank you! You're now on the VIP list for ${selectedFirm}. Check your email for your exclusive discount code!`);
        setShowWaitlistModal(false);
        setWaitlistEmail('');
        setWaitlistName('');
        setSelectedFirm('');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting waitlist:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setWaitlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p>Loading prop firm comparison...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="pt-40 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Minimal Header */}
          <div className="text-center mb-16">
            <motion.h1
              className="text-3xl md:text-5xl font-light mb-6 tracking-tight text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Prop Firm Comparison
            </motion.h1>
            <motion.p
              className="text-lg text-white/60 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Compare prop firms side-by-side. Updated {lastUpdated} with real-time data.
            </motion.p>
          </div>

        {/* Filter Bar */}
        <motion.div
          className="mb-8 p-6 bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-cyan-400" />
              <span className="text-lg font-semibold">Filter by Priority:</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {[
              { key: 'all', label: 'All Firms', icon: Award },
              { key: 'fastest', label: 'Fastest Payout', icon: Clock },
              { key: 'cheapest', label: 'Lowest Fee', icon: DollarSign },
              { key: 'ai-friendly', label: 'AI Friendly', icon: Zap }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  filter === key
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          className="overflow-x-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <table className="w-full bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl overflow-hidden">
            <thead>
              <tr className="border-b border-white/[0.1] bg-white/[0.05]">
                <th className="text-left p-6 text-white font-bold text-lg">Firm</th>
                <th className="text-center p-4 text-white/80 font-semibold">Payout Speed</th>
                <th className="text-center p-4 text-white/80 font-semibold">Drawdown</th>
                <th className="text-center p-4 text-white/80 font-semibold">Profit Split</th>
                <th className="text-center p-4 text-white/80 font-semibold">AI Compatibility</th>
                <th className="text-center p-4 text-white/80 font-semibold">Min Capital</th>
                <th className="text-center p-4 text-white/80 font-semibold">Entry Fee</th>
                <th className="text-center p-4 text-white/80 font-semibold">Trader Edge Insight</th>
                <th className="text-center p-4 text-white font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFirms.map((firm, index) => (
                <motion.tr
                  key={firm.firm}
                  className="border-b border-white/[0.05] hover:bg-white/[0.02] transition-colors duration-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-lg">{firm.firm}</div>
                        <div className="text-sm text-white/60">{firm.highlight}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center text-white/90">{firm.payout_speed}</td>
                  <td className="p-4 text-center text-white/90 text-sm">{firm.drawdown}</td>
                  <td className="p-4 text-center text-green-400 font-semibold">{firm.profit_split}</td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-semibold ${firm.edge_score >= 95 ? 'text-cyan-400 drop-shadow-lg' : 'text-cyan-400'}`}>
                        {firm.edge_score}% Edge Score
                      </span>
                      {firm.edge_score >= 95 && <Star className="w-4 h-4 text-yellow-400 fill-current animate-pulse" />}
                    </div>
                  </td>
                  <td className="p-4 text-center text-white/90">${firm.edge_score === 92 ? '10,000' : '5,000'}</td>
                  <td className="p-4 text-center text-white/90 font-semibold">${firm.edge_score === 92 ? '160' : firm.edge_score === 98 ? '32' : firm.edge_score === 96 ? '29' : firm.edge_score === 95 ? '40' : '39'}</td>
                  <td className="p-4 text-center text-white/80 text-sm max-w-xs">{firm.trader_edge_insight}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleFirmClick(firm)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                        firm.affiliate_link
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                          : 'bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600 text-white'
                      }`}
                    >
                      {firm.affiliate_link ? (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Visit Firm
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          Get Discount
                        </>
                      )}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Risk Reversal Guarantee */}
        <motion.div
          className="mb-12 p-8 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-3xl"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-400 mr-3" />
              <span className="text-red-400 font-bold text-xl">Prop Pass Guarantee</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              If You Use Our Pro Signals and Fail Your Challenge
            </h3>
            <p className="text-xl text-white/80 mb-6">
              Your next 3 months of Trader Edge Pro are <span className="text-green-400 font-bold">100% FREE</span>
            </p>

            <div className="bg-white/5 rounded-2xl p-6 max-w-2xl mx-auto">
              <h4 className="font-semibold text-white mb-3">How it works:</h4>
              <ul className="text-left space-y-2 text-white/70">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Use our Pro Signals subscription during your prop firm challenge
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  If you fail the challenge despite following our signals
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Contact support within 7 days of challenge end
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  Get 3 months of Pro subscription at no additional cost
                </li>
              </ul>
            </div>

            <div className="mt-6">
              <Link
                to="/prop-pass-guarantee"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-full hover:from-red-600 hover:to-orange-600 transition-all duration-300"
              >
                Learn More About Our Guarantee
                <Shield className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Ready to Start Your
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-green-300">
              {" "}Challenge?
            </span>
          </h2>

          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            Use our comparison engine to find the perfect prop firm, then supercharge your success with our AI-powered tools.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/membership"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              Get Pro Signals
              <TrendingUp className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/mt5-development"
              className="inline-flex items-center px-8 py-4 border border-white/20 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              Custom Automation
              <Zap className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-[#030303] border border-white/[0.1] rounded-3xl p-8 max-w-md w-full relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={() => setShowWaitlistModal(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Join the VIP List</h3>
              <p className="text-white/60">
                We're negotiating an <strong className="text-orange-400">exclusive 20% discount</strong> with {selectedFirm} for Trader Edge community members.
              </p>
            </div>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                  placeholder="Your name (optional)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                />
              </div>

              <div>
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-orange-400 transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={waitlistLoading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-purple-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {waitlistLoading ? 'Joining...' : 'Get My Exclusive Discount Code'}
              </button>
            </form>

            <p className="text-xs text-white/40 text-center mt-4">
              No spam, unsubscribe anytime. Partnership in development.
            </p>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PropFirmComparison;
