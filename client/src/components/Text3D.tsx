/**
 * Text3D - 3D Text Rendering Component
 * 
 * Renders text in 3D space using Three.js and Troika text rendering.
 * Supports Google Fonts, user-uploaded fonts, and system fonts.
 * 
 * ## How Font Loading Works
 * 
 * Three.js/Troika text requires a direct URL to a font file (TTF, WOFF, WOFF2).
 * This is different from CSS font loading which just makes fonts available
 * for HTML rendering.
 * 
 * For Google Fonts:
 * - We fetch the CSS and extract the actual WOFF2 file URL
 * - This URL points to fonts.gstatic.com with the real font file
 * 
 * For User Fonts:
 * - We create a blob URL from the uploaded file's ArrayBuffer
 * - This URL works for the lifetime of the page session
 * 
 * For System Fonts:
 * - No font file URL is available (they're installed on the OS)
 * - We fall back to Troika's default font
 * 
 * ## Usage
 * 
 * ```tsx
 * <Text3D
 *   text="Hello World"
 *   font="Roboto"
 *   size={1}
 *   color="#ffffff"
 *   position={[0, 2, 0]}
 * />
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { fontLoader } from '@/lib/font-loader';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Text3DProps {
  /** The text content to display */
  text: string;
  
  /** Font family name (e.g., "Roboto", "Inter") */
  font?: string;
  
  /** Font size in world units */
  size?: number;
  
  /** Text color (hex string) */
  color?: string;
  
  /** Position in 3D space [x, y, z] */
  position?: [number, number, number];
  
  /** Rotation in degrees [x, y, z] */
  rotation?: [number, number, number];
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  
  /** Horizontal anchor point */
  anchorX?: 'left' | 'center' | 'right';
  
  /** Vertical anchor point */
  anchorY?: 'top' | 'middle' | 'bottom';
  
  /** Maximum width before wrapping */
  maxWidth?: number;
  
  /** Line height multiplier */
  lineHeight?: number;
  
  /** Letter spacing adjustment */
  letterSpacing?: number;
  
  /** Outline width (for visibility against backgrounds) */
  outlineWidth?: number;
  
  /** Outline color */
  outlineColor?: string;
  
  /** Fill opacity (0-1) */
  fillOpacity?: number;
  
  /** Stroke width */
  strokeWidth?: number;
  
  /** Stroke color */
  strokeColor?: string;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Hover enter handler */
  onPointerOver?: () => void;
  
  /** Hover leave handler */
  onPointerOut?: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function Text3D({
  text,
  font = 'Inter',
  size = 1,
  color = '#ffffff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
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
  const [fontUrl, setFontUrl] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Load the font when the font prop changes
  useEffect(() => {
    let mounted = true;

    const loadFont = async () => {
      setIsLoading(true);
      
      // Check if we already have a URL for this font
      let url = fontLoader.getFontFileUrl(font);
      
      if (!url) {
        // Try to load it as a Google Font
        const googleFonts = fontLoader.getGoogleFonts();
        const isGoogle = googleFonts.some(f => f.family === font);
        
        if (isGoogle) {
          await fontLoader.loadGoogleFont(font, ['400', '700']);
          url = fontLoader.getFontFileUrl(font);
        }
      }
      
      if (mounted) {
        setFontUrl(url);
        setIsLoading(false);
      }
    };

    loadFont();

    return () => {
      mounted = false;
    };
  }, [font]);

  // Convert rotation from degrees to radians
  const rotationRadians: [number, number, number] = [
    rotation[0] * Math.PI / 180,
    rotation[1] * Math.PI / 180,
    rotation[2] * Math.PI / 180,
  ];

  // Show loading state or render with fallback font
  if (isLoading) {
    return null;
  }

  return (
    <Text
      position={position}
      rotation={rotationRadians}
      fontSize={size}
      color={color}
      font={fontUrl} // If undefined, Troika uses its default font
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

// ============================================
// EXTRUDED TEXT (for 3D depth effect)
// ============================================

export interface ExtrudedText3DProps extends Text3DProps {
  /** Extrusion depth (not yet implemented - placeholder for future) */
  extrudeDepth?: number;
}

/**
 * ExtrudedText3D - Text with 3D depth effect
 * 
 * Note: True text extrusion requires converting fonts to geometry,
 * which is computationally expensive. This component provides a 
 * placeholder for future implementation. Currently renders flat text.
 */
export function ExtrudedText3D({
  text,
  font = 'Inter',
  size = 1,
  color = '#ffffff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  extrudeDepth = 0.5,
  onClick,
}: ExtrudedText3DProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Subtle animation on hover
  useFrame(() => {
    if (groupRef.current && hovered) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group 
      ref={groupRef}
      position={position} 
      rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
    >
      <Text3D
        text={text}
        font={font}
        size={size}
        color={color}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
    </group>
  );
}

// ============================================
// HELPER: Create text with custom material
// ============================================

export interface MaterialText3DProps extends Text3DProps {
  /** Material properties */
  material?: {
    roughness?: number;
    metalness?: number;
    emissive?: string;
    emissiveIntensity?: number;
  };
}

/**
 * MaterialText3D - Text with custom PBR material properties
 */
export function MaterialText3D({
  material,
  ...textProps
}: MaterialText3DProps) {
  const { roughness = 0.3, metalness = 0.2, emissive, emissiveIntensity = 0.5 } = material || {};
  
  return (
    <Text3D {...textProps}>
      <meshStandardMaterial
        color={textProps.color || '#ffffff'}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
      />
    </Text3D>
  );
}
