import React, { useRef, useEffect } from 'react';

interface HolographicTextProps {
  text: string;
  className?: string;
  glowColor?: string;
  scanlineSpeed?: number;
}

const HolographicText: React.FC<HolographicTextProps> = ({ 
  text, 
  className = '', 
  glowColor = '#00ffff',
  scanlineSpeed = 2
}) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Add holographic effect
    element.style.setProperty('--glow-color', glowColor);
    element.style.setProperty('--scanline-speed', `${scanlineSpeed}s`);
  }, [glowColor, scanlineSpeed]);

  return (
    <div 
      ref={textRef}
      className={`holographic-text ${className}`}
      data-text={text}
    >
      {text}
    </div>
  );
};

interface HolographicCardProps {
  children: React.ReactNode;
  className?: string;
  glowIntensity?: number;
}

const HolographicCard: React.FC<HolographicCardProps> = ({ 
  children, 
  className = '',
  glowIntensity = 0.5 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div 
      ref={cardRef}
      className={`holographic-card ${className}`}
      style={{
        '--glow-intensity': glowIntensity,
        transition: 'transform 0.3s ease-out'
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

interface NeonButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  onClick, 
  variant = 'primary',
  className = '' 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseEnter = () => {
      button.style.transform = 'scale(1.05) translateZ(10px)';
      button.style.boxShadow = variant === 'primary' 
        ? '0 0 30px rgba(0, 255, 255, 0.8), inset 0 0 30px rgba(0, 255, 255, 0.2)'
        : '0 0 30px rgba(255, 0, 255, 0.8), inset 0 0 30px rgba(255, 0, 255, 0.2)';
    };

    const handleMouseLeave = () => {
      button.style.transform = 'scale(1) translateZ(0px)';
      button.style.boxShadow = variant === 'primary'
        ? '0 0 15px rgba(0, 255, 255, 0.4)'
        : '0 0 15px rgba(255, 0, 255, 0.4)';
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [variant]);

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`neon-button neon-button--${variant} ${className}`}
      style={{
        transition: 'all 0.3s ease-out',
        transformStyle: 'preserve-3d'
      }}
    >
      {children}
    </button>
  );
};

export { HolographicText, HolographicCard, NeonButton };
