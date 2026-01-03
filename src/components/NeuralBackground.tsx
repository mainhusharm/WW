import React, { useEffect, useRef, useState } from 'react';

const Futuristic3DKey: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 0.01);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 0.5;
      const y = (e.clientY / window.innerHeight - 0.5) * 0.5;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900 overflow-hidden"
      style={{
        perspective: '1000px',
      }}
    >

      {/* Floating 3D Geometric Elements */}
      <div
        className="absolute inset-0"
        style={{
          transform: `rotateY(${mousePosition.x * 20}deg) rotateX(${mousePosition.y * 20}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Primary Geometric Shape */}
        <div 
          className="geometric-element primary-element"
          style={{
            transform: `
              translateX(${Math.sin(time) * 120}px)
              translateY(${Math.cos(time * 0.7) * 80}px)
              rotateY(${time * 20}deg)
              rotateX(${time * 15}deg)
            `,
          }}
        ></div>

        {/* Secondary Elements */}
        <div 
          className="geometric-element secondary-element"
          style={{
            transform: `
              translateX(${Math.sin(time * 1.2) * -180}px)
              translateY(${Math.cos(time * 0.9) * 110}px)
              rotateY(${-time * 25}deg)
              rotateZ(${time * 10}deg)
            `,
          }}
        ></div>

        <div 
          className="geometric-element tertiary-element"
          style={{
            transform: `
              translateX(${Math.sin(time * 0.8) * 150}px)
              translateY(${Math.cos(time * 1.1) * -120}px)
              rotateX(${time * 18}deg)
              rotateZ(${-time * 12}deg)
            `,
          }}
        ></div>

        {/* Orbiting Elements */}
        {[...Array(6)].map((_, i) => {
          const positions = [
            { top: '15%', left: '10%' },
            { top: '25%', right: '15%' },
            { top: '45%', left: '5%' },
            { top: '55%', right: '10%' },
            { top: '75%', left: '20%' },
            { top: '85%', right: '25%' }
          ];
          const pos = positions[i] || positions[0];
          return (
            <div
              key={i}
              className="orbiting-element"
              style={{
                ...pos,
                transform: `
                  rotateY(${time * 30 + i * 60}deg)
                  translateZ(150px)
                  rotateX(${Math.sin(time + i) * 20}deg)
                `,
              }}
            ></div>
          );
        })}
      </div>

      {/* Ambient Light Rays */}
      <div className="light-ray ray-1"></div>
      <div className="light-ray ray-2"></div>
      <div className="light-ray ray-3"></div>

    </div>
  );
};

export default Futuristic3DKey;