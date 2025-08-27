import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Torus, Float, Text3D, Environment, PerspectiveCamera, Points } from '@react-three/drei';
import * as THREE from 'three';

// Client-side only wrapper to prevent SSR issues
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};

interface AnimatedGeometryProps {
  position: [number, number, number];
  color: string;
  scale?: number;
  rotationSpeed?: number;
}

const AnimatedSphere: React.FC<AnimatedGeometryProps> = ({ position, color, scale = 1, rotationSpeed = 0.01 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed;
      meshRef.current.rotation.y += rotationSpeed * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
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
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed;
      meshRef.current.rotation.z += rotationSpeed * 0.3;
      meshRef.current.position.x = position[0] + Math.cos(state.clock.elapsedTime * 0.5) * 0.3;
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

const TradingChart3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Trading chart bars */}
      {Array.from({ length: 10 }, (_, i) => (
        <Box
          key={i}
          position={[i * 0.3 - 1.5, Math.random() * 2 - 1, 0]}
          scale={[0.2, Math.random() * 2 + .5, 0.2]}
        >
          <meshStandardMaterial 
            color={Math.random() > 0.5 ? '#00ff88' : '#ff4444'} 
            metalness={0.7} 
            roughness={0.3} 
          />
        </Box>
      ))}
    </group>
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

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x = state.clock.elapsedTime * 0.05;
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
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
  const { camera } = useThree();
  
  useFrame(() => {
    camera.position.z = 5 + scrollY * 0.01;
    camera.position.y = scrollY * 0.005;
    camera.lookAt(0, 0, 0);
  });

  return null;
};

interface Scene3DProps {
  scrollY: number;
  isVisible: boolean;
}

const Scene3D: React.FC<Scene3DProps> = ({ scrollY, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <ClientOnly>
        <Canvas>
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
          
          {/* Trading Chart */}
          <TradingChart3D position={[0, -1, 0]} />
          
          {/* Particle Field */}
          <ParticleField />
          
          {/* Environment */}
          <Environment preset="night" />
        </Canvas>
      </ClientOnly>
    </div>
  );
};

export default Scene3D;
