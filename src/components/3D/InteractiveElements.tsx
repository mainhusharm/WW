import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface InteractiveButtonProps {
  position: [number, number, number];
  text: string;
  onClick?: () => void;
  color?: string;
}

const InteractiveButton: React.FC<InteractiveButtonProps> = ({ 
  position, 
  text, 
  onClick,
  color = '#00ffff' 
}) => {
  const [hovered, setHovered] = useState(false);
  const buttonRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (buttonRef.current) {
      buttonRef.current.scale.setScalar(hovered ? 1.1 : 1);
      buttonRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });

  return (
    <group 
      ref={buttonRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={onClick}
    >
      <RoundedBox args={[2, 0.5, 0.2]} radius={0.1}>
        <meshStandardMaterial 
          color={hovered ? '#ffffff' : color}
          metalness={0.8}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={hovered ? 0.3 : 0.1}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.11]}
        fontSize={0.2}
        color={hovered ? '#000000' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

interface FloatingCardProps {
  position: [number, number, number];
  title: string;
  value: string;
  color: string;
}

const FloatingCard: React.FC<FloatingCardProps> = ({ position, title, value, color }) => {
  const cardRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (cardRef.current) {
      cardRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.2;
      cardRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      if (hovered) {
        cardRef.current.scale.setScalar(1.05);
      } else {
        cardRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group 
      ref={cardRef}
      position={position}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Card Background */}
      <RoundedBox args={[2.5, 1.5, 0.1]} radius={0.1}>
        <meshStandardMaterial 
          color={hovered ? '#ffffff' : '#1a1a2e'}
          metalness={0.9}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </RoundedBox>
      
      {/* Card Border Glow */}
      <RoundedBox args={[2.6, 1.6, 0.05]} radius={0.1}>
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          transparent
          opacity={0.3}
        />
      </RoundedBox>
      
      {/* Title Text */}
      <Text
        position={[0, 0.3, 0.06]}
        fontSize={0.15}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
      
      {/* Value Text */}
      <Text
        position={[0, -0.2, 0.06]}
        fontSize={0.25}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>
    </group>
  );
};

const TradingGraph3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const graphRef = useRef<THREE.Group>(null);
  
  const graphData = React.useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      x: i * 0.2 - 2,
      y: Math.sin(i * 0.3) * 0.5 + Math.random() * 0.3,
      z: 0
    }));
  }, []);

  useFrame((state) => {
    if (graphRef.current) {
      graphRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={graphRef} position={position}>
      {/* Graph Points */}
      {graphData.map((point, i) => (
        <Sphere key={i} position={[point.x, point.y, point.z]} scale={0.05}>
          <meshStandardMaterial 
            color="#00ff88" 
            emissive="#00ff88"
            emissiveIntensity={0.3}
          />
        </Sphere>
      ))}
      
      {/* Connecting Lines */}
      {graphData.slice(0, -1).map((point, i) => {
        const nextPoint = graphData[i + 1];
        const midPoint = [
          (point.x + nextPoint.x) / 2,
          (point.y + nextPoint.y) / 2,
          (point.z + nextPoint.z) / 2
        ] as [number, number, number];
        
        return (
          <Box 
            key={`line-${i}`}
            position={midPoint}
            scale={[Math.abs(nextPoint.x - point.x), 0.02, 0.02]}
          >
            <meshStandardMaterial color="#00ffff" transparent opacity={0.7} />
          </Box>
        );
      })}
    </group>
  );
};

export { InteractiveButton, FloatingCard, TradingGraph3D };
