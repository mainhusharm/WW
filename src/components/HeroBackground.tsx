import React, { useEffect, useRef } from 'react';

const HeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Matrix Rain Effect
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");

    const fontSize = 14;
    const columns = canvas.width / fontSize;

    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0F0';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 35);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Floating Particles Effect
    const particles = particlesRef.current;
    if (!particles) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse';
      
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      particle.style.animationDuration = (2 + Math.random() * 3) + 's';
      
      particles.appendChild(particle);

      // Animate particle movement
      const animate = () => {
        const x = startX + Math.sin(Date.now() * 0.001) * 100;
        const y = startY + Math.cos(Date.now() * 0.001) * 100;
        
        particle.style.transform = `translate(${x - startX}px, ${y - startY}px)`;
        requestAnimationFrame(animate);
      };
      
      animate();

      // Remove particle after some time
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 10000);
    };

    // Create particles periodically
    const interval = setInterval(createParticle, 500);
    
    // Create initial particles
    for (let i = 0; i < 15; i++) {
      setTimeout(createParticle, i * 200);
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[-1] overflow-hidden">
      {/* Matrix Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-20"
        style={{ filter: 'blur(0.5px)' }}
      />
      
      {/* Floating Particles */}
      <div ref={particlesRef} className="absolute inset-0" />
      
      {/* Holographic Grid */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      
      {/* Energy Waves */}
      <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-energy-flow" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-energy-flow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-energy-flow" style={{ animationDelay: '2s' }} />
      
      {/* Floating Geometric Shapes */}
      <div className="absolute top-1/4 left-1/4 w-24 h-24 border border-cyan-400/30 rounded-lg animate-geometric-float" />
      <div className="absolute top-1/3 right-1/4 w-16 h-16 border border-blue-400/30 rotate-45 animate-geometric-float" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-20 h-20 border border-purple-400/30 rounded-full animate-geometric-float" style={{ animationDelay: '2s' }} />
      
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-purple-500/5 animate-ambient-pulse" />
      
      {/* Holographic Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cyan-400/20 rounded-full animate-holographic-rotate" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-400/20 rounded-full animate-holographic-rotate" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-purple-400/20 rounded-full animate-holographic-rotate" style={{ animationDuration: '1.5s' }} />
      
      {/* Floating Data Streams */}
      <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-flowStream" />
      <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-flowStream" style={{ animationDelay: '2s' }} />
      
      {/* Particle Trails */}
      <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-particle-fade" />
      <div className="absolute top-2/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-particle-fade" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 left-2/3 w-1 h-1 bg-purple-400 rounded-full animate-particle-fade" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default HeroBackground;
