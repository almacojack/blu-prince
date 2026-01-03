// Default 3D assets for TingOs - including the canonical 3DBenchy
// The 3DBenchy is the "Hello World" of 3D printing

import { TossItem } from './toss-v1';

export const DEFAULT_ASSETS = {
  benchy: {
    id: 'benchy_default',
    name: '3DBenchy',
    description: 'The canonical 3D printing torture test - Hello World of 3D',
    stlPath: '/assets/3dbenchy.stl',
    color: '#ff9800',
    scale: 0.02, // STL is large, scale down
  },
  cube: {
    id: 'cube_default',
    name: 'Cube',
    description: 'Basic cube primitive',
    color: '#3b82f6',
  },
  sphere: {
    id: 'sphere_default', 
    name: 'Sphere',
    description: 'Basic sphere primitive',
    color: '#22c55e',
  },
  cylinder: {
    id: 'cylinder_default',
    name: 'Cylinder',
    description: 'Basic cylinder primitive',
    color: '#a855f7',
  }
};

// Create a TossItem from 3DBenchy STL
export function createBenchyItem(position?: { x: number; y: number; z: number }): TossItem {
  const pos = position || { x: 0, y: 0.5, z: 0 };
  return {
    id: `benchy_${Date.now()}`,
    component: 'stl_mesh',
    props: {
      label: '3DBenchy',
      description: 'The Hello World of 3D printing',
      stlPath: '/assets/3dbenchy.stl',
      scale: 0.02,
      asset_type: 'stl'
    },
    transform: {
      position: pos,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 0.02, y: 0.02, z: 0.02 }
    },
    bounds: {
      type: 'box',
      width: 0.6,
      height: 0.5,
      depth: 0.3
    },
    material: {
      color: '#ff9800',
      roughness: 0.7,
      metalness: 0.1
    },
    fsm: {
      initial: 'display',
      states: {
        display: { ROTATE: 'rotating', INSPECT: 'inspecting' },
        rotating: { STOP: 'display' },
        inspecting: { CLOSE: 'display' }
      }
    }
  };
}

// Create primitive items
export function createPrimitiveItem(
  type: 'box' | 'sphere' | 'cylinder',
  position?: { x: number; y: number; z: number }
): TossItem {
  const colors: Record<string, string> = {
    box: '#3b82f6',
    sphere: '#22c55e',
    cylinder: '#a855f7'
  };
  
  const dimensions: Record<string, { width: number; height: number; depth?: number; radius?: number }> = {
    box: { width: 1, height: 1, depth: 1 },
    sphere: { width: 1, height: 1, radius: 0.5 },
    cylinder: { width: 0.5, height: 1, radius: 0.25 }
  };
  
  const pos = position || { x: 0, y: 0.5, z: 0 };
  const dims = dimensions[type];
  
  return {
    id: `${type}_${Date.now()}`,
    component: 'primitive',
    props: {
      label: type.charAt(0).toUpperCase() + type.slice(1),
      primitive_type: type
    },
    transform: {
      position: pos,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 }
    },
    bounds: {
      type: type,
      width: dims.width,
      height: dims.height,
      depth: dims.depth,
      radius: dims.radius
    },
    material: {
      color: colors[type],
      roughness: 0.5,
      metalness: 0.2
    },
    fsm: {
      initial: 'idle',
      states: {
        idle: { ACTIVATE: 'active' },
        active: { DEACTIVATE: 'idle' }
      }
    }
  };
}

// Load STL from file path and return geometry info
export async function loadSTLFromPath(path: string): Promise<{
  vertexCount: number;
  faceCount: number;
  bounds: { min: number[]; max: number[] };
}> {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load STL: ${response.statusText}`);
    
    const buffer = await response.arrayBuffer();
    
    // Parse binary STL header (80 bytes header + 4 bytes triangle count)
    if (buffer.byteLength < 84) {
      throw new Error('Invalid STL file');
    }
    
    const dataView = new DataView(buffer);
    const triangleCount = dataView.getUint32(80, true);
    
    return {
      vertexCount: triangleCount * 3,
      faceCount: triangleCount,
      bounds: {
        min: [-30, 0, -15], // Approximate for benchy
        max: [30, 50, 15]
      }
    };
  } catch (error) {
    console.error('Error loading STL:', error);
    throw error;
  }
}
