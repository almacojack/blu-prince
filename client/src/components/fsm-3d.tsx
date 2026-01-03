import React, { useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, Text, Line, Html, Float, 
  Sphere, Box as DreiBox, Billboard
} from "@react-three/drei";
import * as THREE from "three";
import { ItemFSM } from "@/lib/toss-v1";

interface StatePosition {
  name: string;
  position: [number, number, number];
}

// Calculate positions for states in geometric patterns
function calculateStatePositions(states: string[], radius: number = 3): StatePosition[] {
  const n = states.length;
  
  if (n === 0) return [];
  if (n === 1) return [{ name: states[0], position: [0, 0, 0] }];
  if (n === 2) return states.map((name, i) => ({ 
    name, 
    position: [i === 0 ? -radius : radius, 0, 0] as [number, number, number]
  }));
  
  // For 3+ states, use 3D geometric arrangements
  if (n === 3) {
    // Equilateral triangle in XZ plane
    return states.map((name, i) => {
      const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
      return {
        name,
        position: [
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        ] as [number, number, number]
      };
    });
  }
  
  if (n === 4) {
    // Tetrahedron
    const h = radius * Math.sqrt(2/3);
    return [
      { name: states[0], position: [0, h, 0] },
      { name: states[1], position: [radius, -h/3, 0] },
      { name: states[2], position: [-radius/2, -h/3, radius * Math.sqrt(3)/2] },
      { name: states[3], position: [-radius/2, -h/3, -radius * Math.sqrt(3)/2] },
    ] as StatePosition[];
  }
  
  if (n === 5) {
    // Pentagon base with apex
    return states.map((name, i) => {
      if (i === 0) return { name, position: [0, radius, 0] as [number, number, number] };
      const angle = ((i - 1) * 2 * Math.PI / 4) - Math.PI / 4;
      return {
        name,
        position: [
          Math.cos(angle) * radius,
          -radius/2,
          Math.sin(angle) * radius
        ] as [number, number, number]
      };
    });
  }
  
  if (n === 6) {
    // Octahedron
    return [
      { name: states[0], position: [0, radius, 0] },
      { name: states[1], position: [0, -radius, 0] },
      { name: states[2], position: [radius, 0, 0] },
      { name: states[3], position: [-radius, 0, 0] },
      { name: states[4], position: [0, 0, radius] },
      { name: states[5], position: [0, 0, -radius] },
    ] as StatePosition[];
  }
  
  // For 7+ states, arrange in a helix/spiral
  return states.map((name, i) => {
    const angle = (i * 2 * Math.PI / Math.min(n, 8));
    const y = (i / (n - 1) - 0.5) * radius * 2;
    return {
      name,
      position: [
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      ] as [number, number, number]
    };
  });
}

// 3D State Node
interface StateNodeProps {
  name: string;
  position: [number, number, number];
  isInitial: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

function StateNode({ name, position, isInitial, isSelected, onSelect }: StateNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05;
    }
  });

  const color = isInitial ? "#22c55e" : isSelected ? "#8b5cf6" : hovered ? "#60a5fa" : "#3b82f6";
  const scale = isSelected ? 1.2 : hovered ? 1.1 : 1;

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={scale}
      >
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
      
      {/* State name label */}
      <Billboard position={[0, 0.7, 0]}>
        <Text
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
          font="/fonts/inter-medium.woff"
        >
          {name}
        </Text>
      </Billboard>
      
      {/* Initial state indicator */}
      {isInitial && (
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.15, 0.3, 8]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
        </mesh>
      )}
    </group>
  );
}

// 3D Transition Arrow
interface TransitionArrowProps {
  from: [number, number, number];
  to: [number, number, number];
  event: string;
  isSelected: boolean;
}

function TransitionArrow({ from, to, event, isSelected }: TransitionArrowProps) {
  // Calculate curve control point for a nice arc
  const midPoint = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 0.5, // Arc upward
      (from[2] + to[2]) / 2
    ];
    return mid;
  }, [from, to]);

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...midPoint),
      new THREE.Vector3(...to)
    );
  }, [from, to, midPoint]);

  const points = useMemo(() => curve.getPoints(20), [curve]);

  const color = isSelected ? "#f59e0b" : "#64748b";

  // Arrow head position and rotation
  const arrowPos = useMemo(() => {
    const t = 0.85; // Position arrow near the end
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    return { position: point, tangent };
  }, [curve]);

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={isSelected ? 3 : 2}
        dashed={false}
      />
      
      {/* Arrow head */}
      <mesh 
        position={arrowPos.position}
        quaternion={new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          arrowPos.tangent
        )}
      >
        <coneGeometry args={[0.08, 0.2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Event label */}
      <Billboard position={[midPoint[0], midPoint[1] + 0.2, midPoint[2]]}>
        <Text
          fontSize={0.15}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"
        >
          {event}
        </Text>
      </Billboard>
    </group>
  );
}

// Main 3D FSM Visualization
interface FSM3DProps {
  fsm: ItemFSM;
  selectedState: string | null;
  onSelectState: (state: string) => void;
  onAddTransition?: (from: string, event: string, to: string) => void;
}

export function FSM3DVisualization({ fsm, selectedState, onSelectState }: FSM3DProps) {
  const states = Object.keys(fsm.states);
  const positions = useMemo(() => calculateStatePositions(states), [states]);
  
  // Build position lookup
  const positionMap = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    positions.forEach(p => { map[p.name] = p.position; });
    return map;
  }, [positions]);

  // Collect all transitions
  const transitions = useMemo(() => {
    const result: { from: string; to: string; event: string }[] = [];
    Object.entries(fsm.states).forEach(([stateName, stateTransitions]) => {
      Object.entries(stateTransitions).forEach(([event, targetState]) => {
        result.push({ from: stateName, to: targetState, event });
      });
    });
    return result;
  }, [fsm]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#8b5cf6" />
      
      {/* State Nodes */}
      {positions.map(({ name, position }) => (
        <StateNode
          key={name}
          name={name}
          position={position}
          isInitial={name === fsm.initial}
          isSelected={name === selectedState}
          onSelect={() => onSelectState(name)}
        />
      ))}
      
      {/* Transition Arrows */}
      {transitions.map(({ from, to, event }, idx) => {
        const fromPos = positionMap[from];
        const toPos = positionMap[to];
        if (!fromPos || !toPos) return null;
        
        // Offset slightly from center of spheres
        const dir = new THREE.Vector3(...toPos).sub(new THREE.Vector3(...fromPos)).normalize();
        const startOffset = dir.clone().multiplyScalar(0.45);
        const endOffset = dir.clone().multiplyScalar(-0.45);
        
        return (
          <TransitionArrow
            key={`${from}-${event}-${to}-${idx}`}
            from={[fromPos[0] + startOffset.x, fromPos[1] + startOffset.y, fromPos[2] + startOffset.z]}
            to={[toPos[0] + endOffset.x, toPos[1] + endOffset.y, toPos[2] + endOffset.z]}
            event={event}
            isSelected={from === selectedState}
          />
        );
      })}
      
      <OrbitControls 
        makeDefault 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={20}
      />
    </>
  );
}

// Wrapper component with Canvas
interface FSM3DEditorProps {
  fsm: ItemFSM;
  onUpdate: (fsm: ItemFSM) => void;
}

export function FSM3DEditor({ fsm, onUpdate }: FSM3DEditorProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null);

  return (
    <div className="w-full h-full min-h-[400px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <color attach="background" args={["#0f172a"]} />
        <fog attach="fog" args={["#0f172a", 10, 30]} />
        
        <FSM3DVisualization
          fsm={fsm}
          selectedState={selectedState}
          onSelectState={setSelectedState}
        />
      </Canvas>
      
      {/* Overlay info */}
      <div className="absolute bottom-2 left-2 text-xs text-muted-foreground font-mono">
        {Object.keys(fsm.states).length} states | Drag to rotate | Scroll to zoom
      </div>
    </div>
  );
}

export default FSM3DEditor;
