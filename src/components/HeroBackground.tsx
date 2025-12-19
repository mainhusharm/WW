import React, { useEffect, useRef, useState } from 'react';

const HeroBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Matrix Rain Effect
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, document.documentElement.scrollHeight);
    };

    updateCanvasSize();

    const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
    const matrixArray = matrix.split("");

    const fontSize = 14;
    const columns = canvas.width / fontSize;

    const drops: number[] = [];
    for (let x = 0; x < columns; x++) {
      drops[x] = Math.random() * -100;
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
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    // Enhanced Floating Particles with More Movement
    const particles = particlesRef.current;
    if (!particles) return;

    const createParticle = () => {
      const particle = document.createElement('div');
      const size = 1 + Math.random() * 2;
      particle.className = 'absolute rounded-full animate-pulse';

      const colors = ['bg-cyan-400', 'bg-blue-400', 'bg-purple-400', 'bg-green-400'];
      particle.classList.add(colors[Math.floor(Math.random() * colors.length)]);

      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * Math.max(window.innerHeight, document.documentElement.scrollHeight);

      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.left = startX + 'px';
      particle.style.top = startY + 'px';
      particle.style.animationDuration = (2 + Math.random() * 3) + 's';
      particle.style.opacity = (0.3 + Math.random() * 0.7).toString();

      particles.appendChild(particle);

      const speed = 0.5 + Math.random() * 1.5;
      const angle = Math.random() * Math.PI * 2;
      const radius = 50 + Math.random() * 150;
      let time = Date.now();

      const animate = () => {
        const elapsed = Date.now() - time;
        const x = startX + Math.sin(elapsed * 0.001 * speed + angle) * radius;
        const y = startY + Math.cos(elapsed * 0.001 * speed) * radius * 0.5 - elapsed * 0.02;

        particle.style.transform = `translate(${x - startX}px, ${y - startY}px)`;

        if (y < -50) {
          if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
          }
          return;
        }

        requestAnimationFrame(animate);
      };

      animate();

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 15000);
    };

    const interval = setInterval(createParticle, 300);

    for (let i = 0; i < 25; i++) {
      setTimeout(createParticle, i * 150);
    }

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden" style={{ height: '100%', minHeight: '100vh' }}>
      {/* Matrix Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-20"
        style={{
          filter: 'blur(0.5px)',
          transform: `translateY(${scrollY * 0.1}px)`
        }}
      />

      {/* Floating Particles */}
      <div ref={particlesRef} className="absolute inset-0" style={{ height: '100%' }} />

      {/* Holographic Grid */}
      <div className="absolute inset-0 bg-grid opacity-10" style={{ transform: `translateY(${scrollY * 0.05}px)` }} />

      {/* Energy Waves - More Dynamic */}
      <div
        className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-energy-flow"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      />
      <div
        className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-energy-flow"
        style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.15}px)` }}
      />
      <div
        className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent animate-energy-flow"
        style={{ animationDelay: '2s', transform: `translateY(${scrollY * 0.1}px)` }}
      />

      {/* Additional Energy Waves */}
      <div
        className="absolute top-[60%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-energy-flow"
        style={{ animationDelay: '0.5s', transform: `translateY(${scrollY * 0.12}px)` }}
      />
      <div
        className="absolute top-[85%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-energy-flow"
        style={{ animationDelay: '1.5s', transform: `translateY(${scrollY * 0.08}px)` }}
      />

      {/* Floating Geometric Shapes - More Movement */}
      <div
        className="absolute top-1/4 left-1/4 w-24 h-24 border border-cyan-400/30 rounded-lg animate-geometric-float"
        style={{ transform: `translateY(${scrollY * 0.3}px) rotate(${scrollY * 0.1}deg)` }}
      />
      <div
        className="absolute top-1/3 right-1/4 w-16 h-16 border border-blue-400/30 rotate-45 animate-geometric-float"
        style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.25}px) rotate(${45 + scrollY * 0.15}deg)` }}
      />
      <div
        className="absolute bottom-1/3 left-1/3 w-20 h-20 border border-purple-400/30 rounded-full animate-geometric-float"
        style={{ animationDelay: '2s', transform: `translateY(${scrollY * 0.2}px)` }}
      />
      <div
        className="absolute top-[40%] right-1/3 w-32 h-32 border border-green-400/20 rounded-lg animate-geometric-float"
        style={{ animationDelay: '0.5s', transform: `translateY(${scrollY * 0.28}px) rotate(${scrollY * 0.12}deg)` }}
      />
      <div
        className="absolute top-[70%] left-[15%] w-20 h-20 border border-yellow-400/30 rounded-full animate-geometric-float"
        style={{ animationDelay: '1.5s', transform: `translateY(${scrollY * 0.18}px)` }}
      />

      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-purple-500/5 animate-ambient-pulse" />

      {/* Holographic Rings - More Movement */}
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-cyan-400/20 rounded-full animate-holographic-rotate"
        style={{ transform: `translate(-50%, calc(-50% + ${scrollY * 0.15}px))` }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-blue-400/20 rounded-full animate-holographic-rotate"
        style={{ animationDirection: 'reverse', animationDuration: '3s', transform: `translate(-50%, calc(-50% + ${scrollY * 0.12}px))` }}
      />
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-purple-400/20 rounded-full animate-holographic-rotate"
        style={{ animationDuration: '1.5s', transform: `translate(-50%, calc(-50% + ${scrollY * 0.1}px))` }}
      />

      {/* Floating Data Streams */}
      <div
        className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-400/50 to-transparent animate-flowStream"
        style={{ transform: `translateY(${scrollY * 0.22}px)` }}
      />
      <div
        className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent animate-flowStream"
        style={{ animationDelay: '2s', transform: `translateY(${scrollY * 0.18}px)` }}
      />
      <div
        className="absolute top-[55%] left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent animate-flowStream"
        style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.16}px)` }}
      />

      {/* Particle Trails */}
      <div
        className="absolute top-1/3 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-particle-fade"
        style={{ transform: `translateY(${scrollY * 0.25}px)` }}
      />
      <div
        className="absolute top-2/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full animate-particle-fade"
        style={{ animationDelay: '0.5s', transform: `translateY(${scrollY * 0.2}px)` }}
      />
      <div
        className="absolute bottom-1/4 left-2/3 w-1 h-1 bg-purple-400 rounded-full animate-particle-fade"
        style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.15}px)` }}
      />
      <div
        className="absolute top-[45%] left-[40%] w-1 h-1 bg-green-400 rounded-full animate-particle-fade"
        style={{ animationDelay: '0.3s', transform: `translateY(${scrollY * 0.23}px)` }}
      />
      <div
        className="absolute top-[80%] right-[25%] w-1 h-1 bg-yellow-400 rounded-full animate-particle-fade"
        style={{ animationDelay: '1.5s', transform: `translateY(${scrollY * 0.17}px)` }}
      />
    </div>
  );
};

export default HeroBackground;
