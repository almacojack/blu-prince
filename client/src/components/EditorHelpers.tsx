import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html, Line } from '@react-three/drei';
import { cn } from '@/lib/utils';

export interface CameraHelperProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  label?: string;
  fov?: number;
  near?: number;
  far?: number;
  selected?: boolean;
  onClick?: () => void;
}

export function CameraHelper({
  position,
  rotation = [0, 0, 0],
  color = '#4fc3f7',
  label = 'Camera',
  fov = 60,
  near = 0.1,
  far = 10,
  selected = false,
  onClick,
}: CameraHelperProps) {
  const frustumLines = useMemo(() => {
    const aspect = 1.5;
    const halfFovRad = (fov / 2) * (Math.PI / 180);
    const nearHeight = 2 * Math.tan(halfFovRad) * near;
    const nearWidth = nearHeight * aspect;
    const farHeight = 2 * Math.tan(halfFovRad) * far;
    const farWidth = farHeight * aspect;

    const nearTL: [number, number, number] = [-nearWidth / 2, nearHeight / 2, -near];
    const nearTR: [number, number, number] = [nearWidth / 2, nearHeight / 2, -near];
    const nearBL: [number, number, number] = [-nearWidth / 2, -nearHeight / 2, -near];
    const nearBR: [number, number, number] = [nearWidth / 2, -nearHeight / 2, -near];

    const farTL: [number, number, number] = [-farWidth / 2, farHeight / 2, -far];
    const farTR: [number, number, number] = [farWidth / 2, farHeight / 2, -far];
    const farBL: [number, number, number] = [-farWidth / 2, -farHeight / 2, -far];
    const farBR: [number, number, number] = [farWidth / 2, -farHeight / 2, -far];

    return {
      nearRect: [nearTL, nearTR, nearBR, nearBL, nearTL],
      farRect: [farTL, farTR, farBR, farBL, farTL],
      edges: [
        [nearTL, farTL],
        [nearTR, farTR],
        [nearBL, farBL],
        [nearBR, farBR],
      ],
    };
  }, [fov, near, far]);

  return (
    <group 
      position={position} 
      rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      <mesh>
        <boxGeometry args={[0.6, 0.4, 0.8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      
      <mesh position={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.25, 0.2, 0.3, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>
      
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>

      <Line
        points={frustumLines.nearRect as [number, number, number][]}
        color={color}
        lineWidth={selected ? 2 : 1}
        opacity={0.6}
        transparent
      />
      <Line
        points={frustumLines.farRect as [number, number, number][]}
        color={color}
        lineWidth={selected ? 2 : 1}
        opacity={0.3}
        transparent
      />
      {frustumLines.edges.map((edge, i) => (
        <Line
          key={i}
          points={edge as [number, number, number][]}
          color={color}
          lineWidth={selected ? 2 : 1}
          opacity={0.4}
          transparent
          dashed
          dashSize={0.5}
          gapSize={0.3}
        />
      ))}

      <Html
        position={[0, 0.8, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap",
            "backdrop-blur-sm border shadow-lg",
            selected ? "bg-white/20 border-white/40" : "bg-black/60 border-white/10"
          )}
          style={{ color }}
        >
          {label}
        </div>
      </Html>

      {selected && (
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color={color} wireframe opacity={0.2} transparent />
        </mesh>
      )}
    </group>
  );
}

export interface LightHelperProps {
  type: 'point' | 'spot' | 'directional' | 'ambient';
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  label?: string;
  intensity?: number;
  range?: number;
  angle?: number;
  selected?: boolean;
  onClick?: () => void;
}

export function LightHelper({
  type,
  position,
  rotation = [0, 0, 0],
  color = '#ffeb3b',
  label,
  intensity = 1,
  range = 10,
  angle = 45,
  selected = false,
  onClick,
}: LightHelperProps) {
  const displayLabel = label || `${type.charAt(0).toUpperCase() + type.slice(1)} Light`;

  return (
    <group 
      position={position}
      rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
    >
      {type === 'point' && <PointLightIcon color={color} intensity={intensity} selected={selected} />}
      {type === 'spot' && <SpotLightIcon color={color} intensity={intensity} angle={angle} range={range} selected={selected} />}
      {type === 'directional' && <DirectionalLightIcon color={color} intensity={intensity} selected={selected} />}
      {type === 'ambient' && <AmbientLightIcon color={color} intensity={intensity} selected={selected} />}

      <Html
        position={[0, type === 'directional' ? 1.5 : 1, 0]}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div 
          className={cn(
            "px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap",
            "backdrop-blur-sm border shadow-lg flex items-center gap-1",
            selected ? "bg-white/20 border-white/40" : "bg-black/60 border-white/10"
          )}
          style={{ color }}
        >
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          />
          {displayLabel}
        </div>
      </Html>
    </group>
  );
}

function PointLightIcon({ color, intensity, selected }: { color: string; intensity: number; selected: boolean }) {
  const scale = 0.3 + intensity * 0.1;
  
  return (
    <group scale={scale}>
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <Line
          key={i}
          points={[
            [0, 0, 0],
            [Math.cos(angle * Math.PI / 180) * 1.5, Math.sin(angle * Math.PI / 180) * 1.5, 0],
          ]}
          color={color}
          lineWidth={selected ? 2 : 1}
          opacity={0.6}
          transparent
        />
      ))}

      {selected && (
        <mesh>
          <sphereGeometry args={[2, 16, 16]} />
          <meshBasicMaterial color={color} wireframe opacity={0.15} transparent />
        </mesh>
      )}
    </group>
  );
}

function SpotLightIcon({ color, intensity, angle, range, selected }: { 
  color: string; 
  intensity: number; 
  angle: number;
  range: number;
  selected: boolean;
}) {
  const coneRadius = Math.tan((angle / 2) * Math.PI / 180) * range;

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.3, 0.5, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
      </mesh>

      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <Line
        points={[
          [0, 0, 0],
          [-coneRadius * 0.3, -range * 0.3, 0],
        ]}
        color={color}
        lineWidth={selected ? 2 : 1}
        opacity={0.5}
        transparent
      />
      <Line
        points={[
          [0, 0, 0],
          [coneRadius * 0.3, -range * 0.3, 0],
        ]}
        color={color}
        lineWidth={selected ? 2 : 1}
        opacity={0.5}
        transparent
      />
      <Line
        points={[
          [0, 0, 0],
          [0, -range * 0.3, -coneRadius * 0.3],
        ]}
        color={color}
        lineWidth={selected ? 2 : 1}
        opacity={0.5}
        transparent
      />
      <Line
        points={[
          [0, 0, 0],
          [0, -range * 0.3, coneRadius * 0.3],
        ]}
        color={color}
        lineWidth={selected ? 2 : 1}
        opacity={0.5}
        transparent
      />

      {selected && (
        <mesh position={[0, -range * 0.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[coneRadius * 0.3, range * 0.3, 16, 1, true]} />
          <meshBasicMaterial color={color} wireframe opacity={0.2} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function DirectionalLightIcon({ color, intensity, selected }: { color: string; intensity: number; selected: boolean }) {
  return (
    <group>
      <mesh>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>

      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <Line
          key={i}
          points={[
            [Math.cos(angle * Math.PI / 180) * 0.7, Math.sin(angle * Math.PI / 180) * 0.7, 0],
            [Math.cos(angle * Math.PI / 180) * 1.2, Math.sin(angle * Math.PI / 180) * 1.2, 0],
          ]}
          color={color}
          lineWidth={selected ? 2 : 1}
        />
      ))}

      <Line
        points={[
          [0, 0, 0],
          [0, 0, -3],
        ]}
        color={color}
        lineWidth={2}
        opacity={0.7}
        transparent
      />
      <mesh position={[0, 0, -3]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {selected && (
        <mesh>
          <planeGeometry args={[4, 4]} />
          <meshBasicMaterial color={color} wireframe opacity={0.15} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function AmbientLightIcon({ color, intensity, selected }: { color: string; intensity: number; selected: boolean }) {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
      
      <mesh>
        <icosahedronGeometry args={[0.6, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>

      {selected && (
        <mesh>
          <icosahedronGeometry args={[1.5, 1]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
}

export interface SceneObjectHelpers {
  cameras: Array<CameraHelperProps & { id: string }>;
  lights: Array<LightHelperProps & { id: string }>;
}

export function RenderSceneHelpers({ 
  helpers, 
  selectedId,
  onSelect 
}: { 
  helpers: SceneObjectHelpers;
  selectedId?: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <group>
      {helpers.cameras.map(cam => (
        <CameraHelper
          key={cam.id}
          {...cam}
          selected={selectedId === cam.id}
          onClick={() => onSelect?.(cam.id)}
        />
      ))}
      {helpers.lights.map(light => (
        <LightHelper
          key={light.id}
          {...light}
          selected={selectedId === light.id}
          onClick={() => onSelect?.(light.id)}
        />
      ))}
    </group>
  );
}
