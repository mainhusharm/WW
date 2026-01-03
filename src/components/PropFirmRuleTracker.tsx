import React, { useState, useEffect } from 'react';

const PropFirmRuleTracker: React.FC = () => {
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [dailyDrawdownPercent, setDailyDrawdownPercent] = useState<number>(5);
  const [riskPerTradePercent, setRiskPerTradePercent] = useState<number>(1);
  const [stopLossPips, setStopLossPips] = useState<number>(20);

  // Calculated values
  const maxDailyLoss = (accountBalance * dailyDrawdownPercent) / 100;
  const lotSize = (accountBalance * riskPerTradePercent / 100) / (stopLossPips * 10);
  const riskLevel = riskPerTradePercent > 2 ? 'Aggressive' : riskPerTradePercent > 1 ? 'Moderate' : 'Conservative';

  const riskColor = riskPerTradePercent > 2 ? 'bg-red-500' : riskPerTradePercent > 1 ? 'bg-yellow-500' : 'bg-green-500';
  const riskTextColor = riskPerTradePercent > 2 ? 'text-red-400' : riskPerTradePercent > 1 ? 'text-yellow-400' : 'text-green-400';

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.02] via-transparent to-blue-500/[0.02]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Prop Firm Success{" "}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
              Planner
            </span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
            Calculate your optimal trading parameters for prop firm challenges
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Input Controls */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Account Balance ($)
                </label>
                <input
                  type="number"
                  value={accountBalance}
                  onChange={(e) => setAccountBalance(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Daily Drawdown Limit ({dailyDrawdownPercent}%)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={dailyDrawdownPercent}
                  onChange={(e) => setDailyDrawdownPercent(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/40 mt-2">
                  <span>1%</span>
                  <span>10%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Risk Per Trade ({riskPerTradePercent}%)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={riskPerTradePercent}
                  onChange={(e) => setRiskPerTradePercent(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-white/40 mt-2">
                  <span>0.1%</span>
                  <span>5%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Stop Loss (Pips)
                </label>
                <input
                  type="number"
                  value={stopLossPips}
                  onChange={(e) => setStopLossPips(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-cyan-400 transition-colors"
                  placeholder="20"
                />
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Risk Assessment</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${riskColor} text-white`}>
                    {riskLevel}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Max Daily Loss</span>
                    <span className="text-white font-semibold">${maxDailyLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Recommended Lot Size</span>
                    <span className="text-white font-semibold">{lotSize.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Risk Level</span>
                    <span className={`font-semibold ${riskTextColor}`}>{riskLevel}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6">
                <h4 className="text-cyan-400 font-semibold mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-white/80">
                  {riskPerTradePercent <= 1
                    ? "Conservative approach - great for prop firm challenges!"
                    : riskPerTradePercent <= 2
                    ? "Balanced risk - suitable for most trading strategies."
                    : "High risk approach - monitor your drawdown closely!"}
                </p>
              </div>
            </div>
          </div>

          <style>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #06b6d4;
              cursor: pointer;
              border: 2px solid rgba(6, 182, 212, 0.3);
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #06b6d4;
              cursor: pointer;
              border: 2px solid rgba(6, 182, 212, 0.3);
            }
          `}</style>
        </div>
      </div>
    </section>
  );
};

export default PropFirmRuleTracker;
