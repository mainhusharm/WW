import React from 'react';

const FuturisticBackground: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
      {/* Animated wave layers */}
      <div className="absolute w-full h-full">
        <div 
          className="absolute w-full h-full opacity-10"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(0, 150, 255, 0.2) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(100, 255, 200, 0.2) 0%, transparent 50%)
            `,
            animation: 'waveMotion 15s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Flowing energy streams */}
      <div className="absolute w-full h-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute h-px opacity-20"
            style={{
              left: '0%',
              top: `${10 + i * 12}%`,
              width: '100%',
              background: `linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.6), transparent)`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${8 + Math.random() * 4}s`,
              animation: 'flowStream infinite linear'
            }}
          />
        ))}
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute w-full h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute opacity-10 border border-cyan-400"
            style={{
              width: `${20 + Math.random() * 40}px`,
              height: `${20 + Math.random() * 40}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              borderRadius: Math.random() > 0.5 ? '50%' : '0%',
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${20 + Math.random() * 15}s`,
              animation: 'floatGeometry infinite ease-in-out'
            }}
          />
        ))}
      </div>
      
      {/* Subtle particles */}
      <div className="absolute w-full h-full">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-cyan-300 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${12 + Math.random() * 8}s`,
              animation: 'gentleFloat infinite ease-in-out'
            }}
          />
        ))}
      </div>
      
      {/* Pulsing ambient glow */}
      <div className="absolute w-full h-full">
        <div 
          className="absolute w-full h-full opacity-5"
          style={{
            background: `
              radial-gradient(ellipse at center, rgba(0, 255, 255, 0.4) 0%, transparent 70%)
            `,
            animation: 'ambientPulse 8s ease-in-out infinite'
          }}
        />
      </div>
    </div>
  );
};

export default FuturisticBackground;
