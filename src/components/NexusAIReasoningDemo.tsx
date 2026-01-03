import React, { useState, useEffect } from 'react';

interface Signal {
  pair: string;
  action: 'BUY' | 'SELL';
  reasoning: string;
}

const NexusAIReasoningDemo: React.FC = () => {
  const [currentSignalIndex, setCurrentSignalIndex] = useState(0);

  const signals: Signal[] = [
    {
      pair: 'XAUUSD',
      action: 'SELL',
      reasoning: 'H4 Bearish Divergence on RSI. Liquidity sweep detected at 2055.00 resistance. AI predicts a mean reversion to 2038.00.'
    },
    {
      pair: 'EURUSD',
      action: 'BUY',
      reasoning: 'Institutional accumulation zone identified at 1.0820. Volume profile indicates low selling pressure. Target 1.0910.'
    },
    {
      pair: 'BTCUSD',
      action: 'BUY',
      reasoning: 'Bullish engulfing on 1H timeframe. Funding rates stabilized. Nexus identifies a high-probability breakout of the current pennant.'
    }
  ];

  const currentSignal = signals[currentSignalIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSignalIndex((prev) => (prev + 1) % signals.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [signals.length]);

  const actionColor = currentSignal.action === 'BUY' ? 'text-green-400' : 'text-red-400';
  const actionBg = currentSignal.action === 'BUY' ? 'bg-green-500/20 border-green-500/50' : 'bg-red-500/20 border-red-500/50';

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] via-transparent to-cyan-500/[0.02]" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              Live Signal Feed &{" "}
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-cyan-300">
              AI Logic
            </span>
          </h2>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-light">
            See exactly how our AI analyzes markets and generates precise trading signals with complete transparency
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm rounded-3xl p-8 md:p-12">
          <div className="space-y-6">
            {/* Signal Display */}
            <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-mono font-bold text-white">{currentSignal.pair}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${actionBg} ${actionColor} border`}>
                    {currentSignal.action}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {signals.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentSignalIndex ? 'bg-cyan-400' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-black/40 rounded-lg p-4 border border-white/[0.1]">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white font-bold">AI</span>
                  </div>
                  <div>
                    <div className="text-xs text-cyan-400 font-medium mb-1">NEXUS AI LOGIC</div>
                    <div className="text-sm text-white/80 font-mono leading-relaxed">
                      {currentSignal.reasoning}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-green-400">87%</div>
                <div className="text-xs text-white/60">Win Rate</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">24/7</div>
                <div className="text-xs text-white/60">Monitoring</div>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">50+</div>
                <div className="text-xs text-white/60">Factors</div>
              </div>
            </div>

            {/* Real-time Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">AI Active - Scanning Markets</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NexusAIReasoningDemo;
