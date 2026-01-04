import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { fontLoader } from '@/lib/font-loader';

export interface Text3DProps {
  text: string;
  font?: string;
  size?: number;
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  depth?: number;
  bevel?: boolean;
  align?: 'left' | 'center' | 'right';
  anchorX?: 'left' | 'center' | 'right';
  anchorY?: 'top' | 'middle' | 'bottom';
  maxWidth?: number;
  lineHeight?: number;
  letterSpacing?: number;
  outlineWidth?: number;
  outlineColor?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  strokeColor?: string;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

export function Text3D({
  text,
  font = 'Inter',
  size = 1,
  color = '#ffffff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  depth = 0.2,
  bevel = false,
  align = 'center',
  anchorX = 'center',
  anchorY = 'middle',
  maxWidth = Infinity,
  lineHeight = 1,
  letterSpacing = 0,
  outlineWidth = 0,
  outlineColor = '#000000',
  fillOpacity = 1,
  strokeWidth = 0,
  strokeColor = '#000000',
  onClick,
  onPointerOver,
  onPointerOut,
}: Text3DProps) {
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontUrl, setFontUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadFont = async () => {
      const googleFonts = fontLoader.getGoogleFonts();
      const isGoogle = googleFonts.some(f => f.family === font);
      
      if (isGoogle) {
        await fontLoader.loadGoogleFont(font, ['400', '700']);
        setFontUrl(`https://fonts.gstatic.com/s/${font.toLowerCase().replace(/\s+/g, '')}/v1/${font.replace(/\s+/g, '')}-Regular.ttf`);
      }
      setFontLoaded(true);
    };
    loadFont();
  }, [font]);

  if (!fontLoaded) {
    return null;
  }

  return (
    <Text
      position={position}
      rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
      fontSize={size}
      color={color}
      font={fontUrl}
      anchorX={anchorX}
      anchorY={anchorY}
      textAlign={align}
      maxWidth={maxWidth}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      outlineWidth={outlineWidth}
      outlineColor={outlineColor}
      fillOpacity={fillOpacity}
      strokeWidth={strokeWidth}
      strokeColor={strokeColor}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      {text}
    </Text>
  );
}

export interface ExtrudedText3DProps extends Text3DProps {
  extrudeDepth?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelSegments?: number;
}

export function ExtrudedText3D({
  text,
  font = 'Inter',
  size = 1,
  color = '#ffffff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  extrudeDepth = 0.5,
  bevelEnabled = true,
  bevelThickness = 0.05,
  bevelSize = 0.03,
  bevelSegments = 3,
  onClick,
}: ExtrudedText3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current && hovered) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position} rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}>
      <Text
        ref={meshRef}
        fontSize={size}
        color={color}
        anchorX="center"
        anchorY="middle"
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {text}
        <meshStandardMaterial 
          color={color} 
          roughness={0.3} 
          metalness={0.2}
        />
      </Text>
    </group>
  );
}
