import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

interface TradingVisualizationProps {
  position: [number, number, number];
  data?: {
    price: number;
    volume: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

const TradingVisualization: React.FC<TradingVisualizationProps> = ({ 
  position, 
  data = { price: 1.0850, volume: 1000000, trend: 'up' } 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const priceRef = useRef<THREE.Mesh>(null);
  
  // Generate candlestick data
  const candlesticks = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const open = 1.08 + Math.random() * 0.01;
      const close = open + (Math.random() - 0.5) * 0.005;
      const high = Math.max(open, close) + Math.random() * 0.002;
      const low = Math.min(open, close) - Math.random() * 0.002;
      
      return {
        x: i * 0.3 - 3,
        open,
        high,
        low,
        close,
        isGreen: close > open
      };
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
    
    if (priceRef.current) {
      priceRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Price display */}
      <Text
        ref={priceRef}
        position={[0, 2, 0]}
        fontSize={0.3}
        color="#00ffff"
        anchorX="center"
        anchorY="middle"
      >
        ${data.price.toFixed(5)}
      </Text>
      
      {/* Candlestick chart */}
      {candlesticks.map((candle, i) => (
        <group key={i} position={[candle.x, 0, 0]}>
          {/* Wick */}
          <Line
            points={[[0, candle.low - 1.08, 0], [0, candle.high - 1.08, 0]]}
            color={candle.isGreen ? '#00ff88' : '#ff4444'}
            lineWidth={1}
          />
          
          {/* Body */}
          <Box
            position={[0, (candle.open + candle.close) / 2 - 1.08, 0]}
            scale={[0.1, Math.abs(candle.close - candle.open) * 100, 0.1]}
          >
            <meshStandardMaterial 
              color={candle.isGreen ? '#00ff88' : '#ff4444'}
              metalness={0.8}
              roughness={0.2}
            />
          </Box>
        </group>
      ))}
      
      {/* Volume bars */}
      {candlesticks.map((candle, i) => (
        <Box
          key={`volume-${i}`}
          position={[candle.x, -1.5, 0]}
          scale={[0.08, Math.random() * 0.5 + 0.1, 0.08]}
        >
          <meshStandardMaterial 
            color="#4444ff" 
            transparent 
            opacity={0.6}
            metalness={0.5}
            roughness={0.5}
          />
        </Box>
      ))}
      
      {/* Trend indicator */}
      <Sphere position={[0, 1, 1]} scale={0.2}>
        <meshStandardMaterial 
          color={data.trend === 'up' ? '#00ff88' : data.trend === 'down' ? '#ff4444' : '#ffaa00'}
          emissive={data.trend === 'up' ? '#00ff88' : data.trend === 'down' ? '#ff4444' : '#ffaa00'}
          emissiveIntensity={0.3}
        />
      </Sphere>
    </group>
  );
};

export default TradingVisualization;
