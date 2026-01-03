import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedBadge } from './ui/animated-badge';

const OpeningAnimation = () => {
  console.log('OpeningAnimation component rendered');
  const [showAnimation, setShowAnimation] = useState(true);
  const navigate = useNavigate();

  const handleContinue = () => {
    setShowAnimation(false);
    // Navigate to the main landing page after animation
    setTimeout(() => {
      navigate('/home');
    }, 500); // Small delay for smooth transition
  };

  // Auto-continue after 8 seconds if user doesn't click
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showAnimation) {
        handleContinue();
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [showAnimation]);

  if (!showAnimation) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      {/* Background subtle animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-2xl">TEP</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            TraderEdge Pro
          </h1>
        </div>

        {/* Animated Badge */}
        <div className="mb-8">
          <div onClick={handleContinue} className="cursor-pointer">
            <AnimatedBadge
              text="Welcome to the Future of Trading"
              color="#22d3ee"
            />
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg mb-8 max-w-md mx-auto">
          Experience AI-powered trading precision and risk management
        </p>

        {/* Click to continue hint */}
        <div className="text-slate-500 text-sm">
          Click the badge above to continue
        </div>
      </div>
    </div>
  );
};

export default OpeningAnimation;
