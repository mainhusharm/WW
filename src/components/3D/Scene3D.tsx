import React, { useRef, useEffect, useState, Suspense } from 'react';
// Temporarily comment out Three.js imports to prevent crashes
// import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { OrbitControls, Sphere, Box, Torus, Float, Text3D, Environment, PerspectiveCamera } from '@react-three/drei';
// import * as THREE from 'three';

// Error boundary for Three.js components
class ThreeJSErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError?: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Three.js Error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-900 text-white">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">3D Visualization Unavailable</h3>
            <p className="text-sm text-gray-300">Please refresh the page to try again.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Temporarily simplified components without Three.js
const AnimatedSphere: React.FC<any> = ({ position, color, scale = 1, rotationSpeed = 0.01 }) => {
  return (
    <div className="absolute w-4 h-4 bg-blue-500 rounded-full animate-pulse" 
         style={{ 
           left: `${position[0] * 100 + 50}%`, 
           top: `${position[1] * 100 + 50}%`,
           transform: `scale(${scale})`
         }}>
    </div>
  );
};

const AnimatedTorus: React.FC<any> = ({ position, color, scale = 1, rotationSpeed = 0.02 }) => {
  return (
    <div className="absolute w-6 h-6 border-2 border-green-500 rounded-full animate-spin" 
         style={{ 
           left: `${position[0] * 100 + 50}%`, 
           top: `${position[1] * 100 + 50}%`,
           transform: `scale(${scale})`
         }}>
    </div>
  );
};

const TradingChart3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <div className="absolute w-32 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-80"
         style={{ 
           left: `${position[0] * 100 + 50}%`, 
           top: `${position[1] * 100 + 50}%`
         }}>
      <div className="text-white text-xs p-2">Trading Chart</div>
    </div>
  );
};

const ParticleField: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

const CameraController: React.FC<{ scrollY: number }> = ({ scrollY }) => {
  return null; // No-op for now
};

interface Scene3DProps {
  scrollY: number;
  isVisible: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ scrollY, isVisible }) => {
  if (!isVisible) return null;

  // Simple fallback without Three.js
  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* Simple animated elements */}
      <AnimatedSphere position={[-0.3, 0.2, -0.2]} color="#00ffff" scale={0.8} />
      <AnimatedSphere position={[0.3, -0.1, -0.1]} color="#ff00ff" scale={0.6} />
      <AnimatedTorus position={[0, 0, -0.3]} color="#00ff88" scale={1.2} />
      <AnimatedTorus position={[-0.2, -0.2, -0.4]} color="#ffaa00" scale={0.8} />
      
      {/* Trading Chart */}
      <TradingChart3D position={[0, -0.35, 0]} />
      
      {/* Particle Field */}
      <ParticleField />
      
      {/* Overlay text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white">
          <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Trading Platform
          </h3>
          <p className="text-xl text-blue-200">Advanced Trading Solutions</p>
        </div>
      </div>
    </div>
  );
};

export default Scene3D;
