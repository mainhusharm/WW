import React from 'react';

const HeroBackground: React.FC = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 animate-pulse"></div>
      
      {/* Animated particles using CSS */}
      <div className="absolute inset-0">
        {Array.from({ length: 50 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-ping opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-blue-400/30 rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
      <div className="absolute top-3/4 right-1/4 w-24 h-24 border border-purple-400/30 rotate-45 animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 border border-cyan-400/30 rounded-full animate-bounce" style={{ animationDuration: '3s' }}></div>
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>
    </div>
  );
};

export default HeroBackground;
