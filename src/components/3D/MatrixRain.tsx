import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  intensity?: number;
  color?: string;
  speed?: number;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ 
  intensity = 0.1, 
  color = '#00ff88',
  speed = 50 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

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

    // Matrix characters
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(0);

    const draw = () => {
      // Semi-transparent black background for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = color;
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = chars[Math.floor(Math.random() * chars.length)];
        
        // Draw character
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillText(char, x, y);
        
        // Reset drop randomly or when it reaches bottom
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        
        drops[i]++;
      }
    };

    const animate = () => {
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Control animation speed
    const interval = setInterval(() => {
      if (Math.random() < intensity) {
        draw();
      }
    }, speed);

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [intensity, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-20"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default MatrixRain;
