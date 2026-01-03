import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface ParticleTrailProps {
  enabled?: boolean;
  particleCount?: number;
  colors?: string[];
}

const ParticleTrail: React.FC<ParticleTrailProps> = ({ 
  enabled = true,
  particleCount = 50,
  colors = ['#00ffff', '#ff00ff', '#00ff88', '#ffaa00']
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      
      // Create new particles at mouse position
      for (let i = 0; i < 3; i++) {
        if (particlesRef.current.length < particleCount) {
          particlesRef.current.push({
            x: e.clientX + (Math.random() - 0.5) * 20,
            y: e.clientY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 60,
            maxLife: 60,
            size: Math.random() * 4 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        // Apply gravity and friction
        particle.vy += 0.1;
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        const alpha = particle.life / particle.maxLife;
        
        if (alpha > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = particle.color;
          ctx.shadowBlur = 20;
          ctx.shadowColor = particle.color;
          
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          
          // Add inner glow
          ctx.globalAlpha = alpha * 0.5;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * alpha * 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          return true;
        }
        return false;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, particleCount, colors]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-10 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default ParticleTrail;
