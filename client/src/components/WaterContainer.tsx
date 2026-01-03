import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export type ContainerType = 'cylinder' | 'cube' | 'sphere' | 'cone';

export interface WaterContainerProps {
  position?: [number, number, number];
  containerType?: ContainerType;
  maxVolume?: number;
  currentVolume: number;
  containerRadius?: number;
  containerHeight?: number;
  waterColor?: string;
  containerColor?: string;
  showWaves?: boolean;
  windIntensity?: number;
  onVolumeChange?: (volume: number) => void;
}

interface WaterMeshProps {
  fillLevel: number;
  radius: number;
  maxHeight: number;
  color: string;
  showWaves: boolean;
  windIntensity: number;
}

function WaterMesh({ fillLevel, radius, maxHeight, color, showWaves, windIntensity }: WaterMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const waterHeight = fillLevel * maxHeight;
  
  const waterMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0,
      transmission: 0.9,
      thickness: 0.5,
      envMapIntensity: 1,
      clearcoat: 0.5,
      clearcoatRoughness: 0.1,
    });
  }, [color]);

  useFrame((state) => {
    if (!meshRef.current || !showWaves) return;
    
    const time = state.clock.getElapsedTime();
    const geometry = meshRef.current.geometry as THREE.CylinderGeometry;
    const positions = geometry.attributes.position;
    
    if (!positions) return;
    
    const waveAmplitude = 0.03 + (windIntensity / 150) * 0.05;
    const waveFrequency = 2 + (windIntensity / 150) * 3;
    
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i);
      if (y > waterHeight * 0.9) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const wave = Math.sin(x * waveFrequency + time * 2) * waveAmplitude +
                     Math.cos(z * waveFrequency + time * 1.5) * waveAmplitude * 0.5;
        positions.setY(i, y + wave);
      }
    }
    
    positions.needsUpdate = true;
  });

  if (waterHeight <= 0.001) return null;

  return (
    <mesh
      ref={meshRef}
      position={[0, -maxHeight / 2 + waterHeight / 2, 0]}
      material={waterMaterial}
    >
      <cylinderGeometry args={[radius * 0.95, radius * 0.95, waterHeight, 32, 8]} />
    </mesh>
  );
}

function ContainerMesh({ 
  type, 
  radius, 
  height, 
  color 
}: { 
  type: ContainerType; 
  radius: number; 
  height: number; 
  color: string;
}) {
  const containerMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
      roughness: 0.05,
      metalness: 0,
      transmission: 0.95,
      thickness: 0.2,
      envMapIntensity: 1.5,
      side: THREE.DoubleSide,
    });
  }, [color]);

  switch (type) {
    case 'cylinder':
      return (
        <mesh material={containerMaterial}>
          <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
        </mesh>
      );
    case 'cube':
      return (
        <mesh material={containerMaterial}>
          <boxGeometry args={[radius * 2, height, radius * 2]} />
        </mesh>
      );
    case 'sphere':
      return (
        <mesh material={containerMaterial}>
          <sphereGeometry args={[radius, 32, 32, 0, Math.PI * 2, 0, Math.PI]} />
        </mesh>
      );
    case 'cone':
      return (
        <mesh material={containerMaterial}>
          <coneGeometry args={[radius, height, 32, 1, true]} />
        </mesh>
      );
    default:
      return (
        <mesh material={containerMaterial}>
          <cylinderGeometry args={[radius, radius, height, 32, 1, true]} />
        </mesh>
      );
  }
}

function ContainerBase({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 32]} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={0.4}
        roughness={0.05}
        metalness={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export function WaterContainer({
  position = [0, 0, 0],
  containerType = 'cylinder',
  maxVolume = 1000,
  currentVolume,
  containerRadius = 1,
  containerHeight = 2,
  waterColor = '#4fc3f7',
  containerColor = '#e0e0e0',
  showWaves = true,
  windIntensity = 0,
}: WaterContainerProps) {
  const fillLevel = Math.min(1, Math.max(0, currentVolume / maxVolume));

  return (
    <group position={position}>
      <ContainerMesh
        type={containerType}
        radius={containerRadius}
        height={containerHeight}
        color={containerColor}
      />
      
      <group position={[0, -containerHeight / 2, 0]}>
        <ContainerBase radius={containerRadius} color={containerColor} />
      </group>
      
      <WaterMesh
        fillLevel={fillLevel}
        radius={containerRadius}
        maxHeight={containerHeight}
        color={waterColor}
        showWaves={showWaves}
        windIntensity={windIntensity}
      />
      
      {fillLevel > 0 && (
        <mesh position={[0, -containerHeight / 2 + fillLevel * containerHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[containerRadius * 0.95, 32]} />
          <meshPhysicalMaterial
            color={waterColor}
            transparent
            opacity={0.5}
            roughness={0.1}
            metalness={0}
          />
        </mesh>
      )}
    </group>
  );
}

export const CONTAINER_TYPES: { value: ContainerType; label: string }[] = [
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'cube', label: 'Cube' },
  { value: 'sphere', label: 'Bowl' },
  { value: 'cone', label: 'Cone' },
];
