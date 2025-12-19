import React, { useState, useEffect } from 'react';
import { GradientTracing } from './ui/gradient-tracing';

const LoadingPage: React.FC = () => {
  const [progress, setProgress] = useState({ core: 0, data: 0, ui: 0 });

  useEffect(() => {
    const intervals = [
      setInterval(() => setProgress(p => ({ ...p, core: Math.min(p.core + Math.random() * 3, 85) })), 100),
      setInterval(() => setProgress(p => ({ ...p, data: Math.min(p.data + Math.random() * 2, 72) })), 150),
      setInterval(() => setProgress(p => ({ ...p, ui: Math.min(p.ui + Math.random() * 4, 91) })), 80),
    ];

    return () => intervals.forEach(clearInterval);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />

      {/* Animated gradient tracing background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/6 left-1/6">
          <GradientTracing
            width={300}
            height={150}
            gradientColors={["#FF6B6B", "#FF6B6B", "#4ECDC4"]}
            animationDuration={3}
            strokeWidth={2}
            path="M0,75 C37.5,0 75,150 112.5,75 S187.5,0 225,75 S300,150 337.5,75 S412.5,0 450,75"
          />
        </div>

        <div className="absolute bottom-1/6 right-1/6">
          <GradientTracing
            width={350}
            height={120}
            gradientColors={["#4ECDC4", "#4ECDC4", "#FF6B6B"]}
            animationDuration={4}
            strokeWidth={2}
            path="M0,60 C42,18 84,102 126,60 S210,18 252,60 S336,102 378,60"
          />
        </div>

        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <GradientTracing
            width={400}
            height={200}
            gradientColors={["#7B68EE", "#7B68EE", "#3498DB"]}
            animationDuration={5}
            strokeWidth={3}
            path="M0,100 C50,0 100,200 150,100 S250,0 300,100 S400,200 450,100 M0,100 C50,200 100,0 150,100 S250,200 300,100 S400,0 450,100"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-4">
        {/* Logo/Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <h1 className="text-3xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-white to-blue-300">
          TRADEREDGE PRO BETA
        </h1>

        <p className="text-lg text-cyan-300 mb-8 font-light tracking-wide">
          INITIALIZING TRADING SYSTEMS...
        </p>

        {/* System Status */}
        <div className="mb-8 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/80">CORE_SYS</span>
            <span className="text-cyan-400 font-mono">{Math.round(progress.core)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress.core}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-white/80">DATA_SYNC</span>
            <span className="text-cyan-400 font-mono">{Math.round(progress.data)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress.data}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-sm">
            <span className="text-white/80">UI_LOAD</span>
            <span className="text-cyan-400 font-mono">{Math.round(progress.ui)}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress.ui}%` }}
            ></div>
          </div>
        </div>

        {/* Status Messages */}
        <div className="mb-8 text-left max-w-md mx-auto">
          <div className="space-y-2 text-sm text-white/60 font-mono">
            <div className="flex items-center">
              <span className="text-cyan-400 mr-2">»</span>
              <span>Establishing secure connection...</span>
            </div>
            <div className="flex items-center">
              <span className="text-cyan-400 mr-2">»</span>
              <span>Loading market data streams...</span>
            </div>
            <div className="flex items-center">
              <span className="text-cyan-400 mr-2">»</span>
              <span>Initializing trading algorithms...</span>
            </div>
          </div>
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
        </div>

        {/* Progress indicator */}
        <div className="w-80 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/30 rounded-full animate-ping"
          style={{
            left: `${15 + (i * 7)}%`,
            top: `${20 + (i * 6)}%`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: `${2 + i * 0.3}s`
          }}
        />
      ))}

      {/* Corner decorations */}
      <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-cyan-400/30"></div>
      <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-blue-400/30"></div>
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-purple-400/30"></div>
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30"></div>
    </div>
  );
};

export default LoadingPage;
