import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BrassGearProps {
  position?: [number, number, number];
  scale?: number;
  rotationSpeed?: number;
  teeth?: number;
  innerRadius?: number;
  outerRadius?: number;
  thickness?: number;
}

function createGearShape(teeth: number, innerRadius: number, outerRadius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const toothDepth = (outerRadius - innerRadius) * 0.4;
  const toothWidth = (2 * Math.PI) / teeth * 0.4;
  
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const nextAngle = ((i + 1) / teeth) * Math.PI * 2;
    
    const baseAngle1 = angle + toothWidth * 0.5;
    const tipAngle1 = angle + toothWidth;
    const tipAngle2 = nextAngle - toothWidth;
    const baseAngle2 = nextAngle - toothWidth * 0.5;
    
    if (i === 0) {
      shape.moveTo(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
    }
    
    shape.lineTo(
      Math.cos(baseAngle1) * (outerRadius - toothDepth),
      Math.sin(baseAngle1) * (outerRadius - toothDepth)
    );
    shape.lineTo(
      Math.cos(tipAngle1) * outerRadius,
      Math.sin(tipAngle1) * outerRadius
    );
    shape.lineTo(
      Math.cos(tipAngle2) * outerRadius,
      Math.sin(tipAngle2) * outerRadius
    );
    shape.lineTo(
      Math.cos(baseAngle2) * (outerRadius - toothDepth),
      Math.sin(baseAngle2) * (outerRadius - toothDepth)
    );
    shape.lineTo(
      Math.cos(nextAngle) * innerRadius,
      Math.sin(nextAngle) * innerRadius
    );
  }
  
  shape.closePath();
  
  const hole = new THREE.Path();
  const holeRadius = innerRadius * 0.3;
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, false);
  shape.holes.push(hole);
  
  return shape;
}

export function BrassGear({
  position = [0, 0, 0],
  scale = 1,
  rotationSpeed = 0.5,
  teeth = 16,
  innerRadius = 0.6,
  outerRadius = 1,
  thickness = 0.2,
}: BrassGearProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * rotationSpeed;
    }
  });
  
  const gearShape = createGearShape(teeth, innerRadius, outerRadius);
  
  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 3,
  };
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      castShadow
      receiveShadow
    >
      <extrudeGeometry args={[gearShape, extrudeSettings]} />
      <meshStandardMaterial
        color="#b8860b"
        metalness={0.9}
        roughness={0.15}
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

export function BrassGearAssembly({ position = [0, 0, 0] }: { position?: [number, number, number] }) {
  return (
    <group position={position}>
      <BrassGear 
        position={[0, 0, 0]} 
        scale={0.8} 
        rotationSpeed={0.5} 
        teeth={20}
      />
      <BrassGear 
        position={[1.4, 0.7, 0.1]} 
        scale={0.5} 
        rotationSpeed={-0.8} 
        teeth={12}
      />
      <BrassGear 
        position={[-1.2, 0.9, -0.1]} 
        scale={0.4} 
        rotationSpeed={1.0} 
        teeth={10}
      />
    </group>
  );
}
