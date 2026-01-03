import React, { useEffect, useRef } from 'react';

interface Enhanced3DBackgroundProps {
  intensity?: number;
  particleCount?: number;
}

const Enhanced3DBackground: React.FC<Enhanced3DBackgroundProps> = ({ 
  intensity = 1, 
  particleCount = 100 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    size: number;
    color: string;
    opacity: number;
  }>>([]);

  useEffect(() => {
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

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 1000,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      vz: (Math.random() - 0.5) * 5,
      size: Math.random() * 3 + 1,
      color: ['#00ffff', '#ff00ff', '#00ff88', '#ffaa00'][Math.floor(Math.random() * 4)],
      opacity: Math.random() * 0.8 + 0.2
    }));

    const animate = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx * intensity;
        particle.y += particle.vy * intensity;
        particle.z += particle.vz * intensity;

        // 3D perspective calculation
        const perspective = 500;
        const scale = perspective / (perspective + particle.z);
        const x2d = particle.x * scale + canvas.width / 2;
        const y2d = particle.y * scale + canvas.height / 2;

        // Wrap around edges
        if (particle.x > canvas.width / 2) particle.x = -canvas.width / 2;
        if (particle.x < -canvas.width / 2) particle.x = canvas.width / 2;
        if (particle.y > canvas.height / 2) particle.y = -canvas.height / 2;
        if (particle.y < -canvas.height / 2) particle.y = canvas.height / 2;
        if (particle.z > 500) particle.z = -500;
        if (particle.z < -500) particle.z = 500;

        // Draw particle
        if (scale > 0.1) {
          ctx.save();
          ctx.globalAlpha = particle.opacity * scale;
          ctx.fillStyle = particle.color;
          ctx.shadowBlur = 20;
          ctx.shadowColor = particle.color;
          
          ctx.beginPath();
          ctx.arc(x2d, y2d, particle.size * scale, 0, Math.PI * 2);
          ctx.fill();
          
          // Add glow effect
          ctx.globalAlpha = particle.opacity * scale * 0.3;
          ctx.beginPath();
          ctx.arc(x2d, y2d, particle.size * scale * 3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }

        // Connect nearby particles
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const dz = particle.z - otherParticle.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < 100) {
              const otherScale = perspective / (perspective + otherParticle.z);
              const otherX2d = otherParticle.x * otherScale + canvas.width / 2;
              const otherY2d = otherParticle.y * otherScale + canvas.height / 2;

              ctx.save();
              ctx.globalAlpha = (1 - distance / 100) * 0.2;
              ctx.strokeStyle = particle.color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(x2d, y2d);
              ctx.lineTo(otherX2d, otherY2d);
              ctx.stroke();
              ctx.restore();
            }
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity, particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
};

export default Enhanced3DBackground;
