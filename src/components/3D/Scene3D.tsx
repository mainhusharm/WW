import React, { useRef, useEffect, useState, Suspense, ErrorBoundary } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Torus, Float, Environment, PerspectiveCamera, Points } from '@react-three/drei';
import * as THREE from 'three';

// Enhanced Client-side only wrapper with better error handling
const ClientOnly = ({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      setHasError(true);
      return;
    }

    try {
      // Additional checks for required WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) {
        console.warn('WebGL not supported, falling back to static background');
        setHasError(true);
        return;
      }

      setHasMounted(true);
    } catch (error) {
      console.error('Error mounting 3D component:', error);
      setHasError(true);
    }
  }, []);

  if (hasError) {
    return fallback || (
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-xl font-semibold">Trading Excellence</div>
          <div className="text-sm text-gray-300">Professional-grade trading solutions</div>
        </div>
      </div>
    );
  }

  if (!hasMounted) {
    return fallback || (
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-sm text-cyan-400">Loading 3D Experience...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Error boundary for 3D components
class Scene3DErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.warn('3D Scene error caught by boundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('3D Scene error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="text-4xl mb-4">🎯</div>
            <div className="text-xl font-semibold">Trading Excellence</div>
            <div className="text-sm text-gray-300">Professional-grade trading solutions</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe hook wrapper to prevent undefined hook errors
const useSafeFrame = (callback: (state: any) => void) => {
  try {
    return useFrame((state, delta) => {
      try {
        if (state && typeof callback === 'function') {
          callback(state);
        }
      } catch (error) {
        console.warn('Frame callback error:', error);
      }
    });
  } catch (error) {
    console.warn('useFrame hook error:', error);
    return null;
  }
};

const useSafeThree = () => {
  try {
    return useThree();
  } catch (error) {
    console.warn('useThree hook error:', error);
    return null;
  }
};

interface AnimatedGeometryProps {
  position: [number, number, number];
  color: string;
  scale?: number;
  rotationSpeed?: number;
}

const AnimatedSphere: React.FC<AnimatedGeometryProps> = ({ position, color, scale = 1, rotationSpeed = 0.01 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useSafeFrame((state) => {
    try {
      if (meshRef.current && state?.clock && typeof state.clock.elapsedTime === 'number') {
        meshRef.current.rotation.x += rotationSpeed;
        meshRef.current.rotation.y += rotationSpeed * 0.5;
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
      }
    } catch (error) {
      console.warn('AnimatedSphere frame error:', error);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <Sphere ref={meshRef} position={position} scale={scale} args={[1, 32, 32]}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Sphere>
    </Float>
  );
};

const AnimatedTorus: React.FC<AnimatedGeometryProps> = ({ position, color, scale = 1, rotationSpeed = 0.02 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useSafeFrame((state) => {
    try {
      if (meshRef.current && state?.clock && typeof state.clock.elapsedTime === 'number') {
        meshRef.current.rotation.x += rotationSpeed;
        meshRef.current.rotation.z += rotationSpeed * 0.3;
        meshRef.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * 0.5) * 0.3;
      }
    } catch (error) {
      console.warn('AnimatedTorus frame error:', error);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={2} floatIntensity={0.8}>
      <Torus ref={meshRef} position={position} scale={scale} args={[1, 0.3, 16, 100]}>
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
      </Torus>
    </Float>
  );
};


const ParticleField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 1000;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    
    colors[i * 3] = Math.random() * 0.5 + 0.5; // R
    colors[i * 3 + 1] = Math.random() * 0.5 + 0.5; // G
    colors[i * 3 + 2] = 1; // B
  }

  useSafeFrame((state) => {
    try {
      if (pointsRef.current && state?.clock && typeof state.clock.elapsedTime === 'number') {
        pointsRef.current.rotation.x = state.clock.elapsedTime * 0.05;
        pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      }
    } catch (error) {
      console.warn('ParticleField frame error:', error);
    }
  });

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} vertexColors transparent opacity={0.6} />
    </Points>
  );
};

const CameraController: React.FC<{ scrollY: number }> = ({ scrollY }) => {
  const three = useSafeThree();
  const camera = three?.camera;
  
  useSafeFrame(() => {
    try {
      if (camera && typeof scrollY === 'number') {
        camera.position.z = 5 + scrollY * 0.01;
        camera.position.y = scrollY * 0.005;
        camera.lookAt(0, 0, 0);
      }
    } catch (error) {
      console.warn('CameraController frame error:', error);
    }
  });

  return null;
};

interface Scene3DProps {
  scrollY: number;
  isVisible: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ scrollY, isVisible }) => {
  const [hasError, setHasError] = useState(false);

  if (!isVisible) return null;
  if (hasError) {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🎯</div>
          <div className="text-xl font-semibold">Trading Excellence</div>
          <div className="text-sm text-gray-300">Professional-grade trading solutions</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <ClientOnly fallback={
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-cyan-400">Loading 3D Experience...</div>
          </div>
        </div>
      }>
        <Scene3DErrorBoundary fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-xl font-semibold">Trading Excellence</div>
              <div className="text-sm text-gray-300">Professional-grade trading solutions</div>
            </div>
          </div>
        }>
          <Canvas onError={() => setHasError(true)}>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <CameraController scrollY={scrollY} />
            
            {/* Lighting */}
            <ambientLight intensity={0.3} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00ffff" />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff00ff" />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} color="#ffffff" />

            {/* 3D Objects */}
            <AnimatedSphere position={[-3, 2, -2]} color="#00ffff" scale={0.8} />
            <AnimatedSphere position={[3, -1, -1]} color="#ff00ff" scale={0.6} />
            <AnimatedTorus position={[0, 0, -3]} color="#00ff88" scale={1.2} />
            <AnimatedTorus position={[-2, -2, -4]} color="#ffaa00" scale={0.8} />
            
            
            {/* Particle Field */}
            <ParticleField />
            
            {/* Environment */}
            <Environment preset="night" />
          </Canvas>
        </Scene3DErrorBoundary>
      </ClientOnly>
    </div>
  );
};

export default Scene3D;
