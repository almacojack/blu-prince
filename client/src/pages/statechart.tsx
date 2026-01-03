import React, { useState, useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line, Billboard, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Plus, Trash2, Play, GitBranch, Save, 
  Zap, Circle, ArrowRight, Palette
} from "lucide-react";
import { ItemFSM } from "@/lib/toss-v1";

// 3D THEMES - Motion behaviors and visual styles
interface Theme3D {
  id: string;
  name: string;
  description: string;
  background: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  nodeColor: string;
  nodeSelectedColor: string;
  nodeInitialColor: string;
  transitionColor: string;
  labelColor: string;
  wireframe: boolean;
  emissiveIntensity: number;
  glowIntensity: number;
  motionFn: (t: number, phase: number, pos: [number, number, number]) => {
    x: number; y: number; z: number;
    rotX: number; rotY: number; rotZ: number;
    scale: number;
  };
}

const THEMES: Theme3D[] = [
  {
    id: "vector-arcade",
    name: "Vector Arcade",
    description: "Classic 80s Asteroids-style vector graphics",
    background: "#000008",
    fogColor: "#000020",
    fogNear: 20,
    fogFar: 50,
    nodeColor: "#00aaff",
    nodeSelectedColor: "#00ffff",
    nodeInitialColor: "#00ff88",
    transitionColor: "#0066cc",
    labelColor: "#00ddff",
    wireframe: true,
    emissiveIntensity: 1.5,
    glowIntensity: 0.8,
    motionFn: (t, phase, pos) => {
      const wobble = Math.sin(t * 2 + phase) * 0.02;
      const spin = t * 0.3 + phase;
      const pulse = 1 + Math.sin(t * 4 + phase) * 0.05;
      return {
        x: pos[0] + Math.sin(t * 0.5 + phase) * 0.1 + wobble,
        y: pos[1] + Math.cos(t * 0.7 + phase * 1.5) * 0.08,
        z: pos[2] + Math.sin(t * 0.4 + phase * 0.5) * 0.06,
        rotX: Math.sin(spin * 0.5) * 0.3,
        rotY: spin,
        rotZ: Math.cos(spin * 0.7) * 0.2,
        scale: pulse
      };
    }
  },
  {
    id: "neon-grid",
    name: "Neon Grid",
    description: "Tron-inspired glowing grid aesthetic",
    background: "#0a0015",
    fogColor: "#1a0030",
    fogNear: 15,
    fogFar: 40,
    nodeColor: "#ff00ff",
    nodeSelectedColor: "#ffff00",
    nodeInitialColor: "#00ff00",
    transitionColor: "#ff0088",
    labelColor: "#ff88ff",
    wireframe: false,
    emissiveIntensity: 0.8,
    glowIntensity: 0.6,
    motionFn: (t, phase, pos) => {
      const float = Math.sin(t * 0.3 + phase) * 0.2;
      const sway = Math.sin(t * 0.5 + phase * 2) * 0.05;
      return {
        x: pos[0] + sway,
        y: pos[1] + float,
        z: pos[2] + Math.cos(t * 0.4 + phase) * 0.03,
        rotX: 0,
        rotY: Math.sin(t * 0.2 + phase) * 0.1,
        rotZ: 0,
        scale: 1 + Math.sin(t * 2 + phase) * 0.03
      };
    }
  },
  {
    id: "cosmic-drift",
    name: "Cosmic Drift",
    description: "Dreamy space float with gentle rotation",
    background: "#050510",
    fogColor: "#0a0a20",
    fogNear: 25,
    fogFar: 60,
    nodeColor: "#8855ff",
    nodeSelectedColor: "#ff55aa",
    nodeInitialColor: "#55ffaa",
    transitionColor: "#5588ff",
    labelColor: "#aaaaff",
    wireframe: false,
    emissiveIntensity: 0.5,
    glowIntensity: 0.4,
    motionFn: (t, phase, pos) => {
      const drift = Math.sin(t * 0.15 + phase) * 0.3;
      const bob = Math.cos(t * 0.25 + phase * 1.3) * 0.15;
      return {
        x: pos[0] + drift * 0.5,
        y: pos[1] + bob,
        z: pos[2] + Math.sin(t * 0.2 + phase * 0.7) * 0.2,
        rotX: Math.sin(t * 0.1 + phase) * 0.05,
        rotY: t * 0.1 + phase,
        rotZ: Math.cos(t * 0.15 + phase) * 0.05,
        scale: 1
      };
    }
  },
  {
    id: "retro-crt",
    name: "Retro CRT",
    description: "Phosphor green terminal vibes",
    background: "#000a00",
    fogColor: "#001a00",
    fogNear: 18,
    fogFar: 45,
    nodeColor: "#00ff00",
    nodeSelectedColor: "#88ff88",
    nodeInitialColor: "#ffff00",
    transitionColor: "#008800",
    labelColor: "#00dd00",
    wireframe: true,
    emissiveIntensity: 1.2,
    glowIntensity: 0.7,
    motionFn: (t, phase, pos) => {
      const jitter = (Math.random() - 0.5) * 0.01;
      const scanline = Math.sin(t * 60 + pos[1] * 10) * 0.002;
      return {
        x: pos[0] + jitter + scanline,
        y: pos[1] + Math.sin(t * 0.8 + phase) * 0.05,
        z: pos[2] + jitter,
        rotX: 0,
        rotY: Math.sin(t * 0.3 + phase) * 0.15,
        rotZ: 0,
        scale: 1 + scanline * 5
      };
    }
  }
];

interface StatePosition {
  name: string;
  position: [number, number, number];
}

function calculateGeometricLayout(states: string[], radius: number = 4): StatePosition[] {
  const n = states.length;
  if (n === 0) return [];
  if (n === 1) return [{ name: states[0], position: [0, 0, 0] }];
  if (n === 2) return states.map((name, i) => ({ 
    name, position: [i === 0 ? -radius : radius, 0, 0] as [number, number, number]
  }));
  if (n === 3) {
    return states.map((name, i) => {
      const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
      return { name, position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number] };
    });
  }
  if (n === 4) {
    const h = radius * Math.sqrt(2/3);
    return [
      { name: states[0], position: [0, h * 1.2, 0] },
      { name: states[1], position: [radius, -h/3, 0] },
      { name: states[2], position: [-radius/2, -h/3, radius * 0.866] },
      { name: states[3], position: [-radius/2, -h/3, -radius * 0.866] },
    ] as StatePosition[];
  }
  if (n === 5) {
    return states.map((name, i) => {
      if (i === 0) return { name, position: [0, radius, 0] as [number, number, number] };
      const angle = ((i - 1) * 2 * Math.PI / 4) - Math.PI / 4;
      return { name, position: [Math.cos(angle) * radius, -radius/2, Math.sin(angle) * radius] as [number, number, number] };
    });
  }
  if (n === 6) {
    return [
      { name: states[0], position: [0, radius, 0] },
      { name: states[1], position: [0, -radius, 0] },
      { name: states[2], position: [radius, 0, 0] },
      { name: states[3], position: [-radius, 0, 0] },
      { name: states[4], position: [0, 0, radius] },
      { name: states[5], position: [0, 0, -radius] },
    ] as StatePosition[];
  }
  return states.map((name, i) => {
    const angle = (i * 2 * Math.PI / n);
    const y = (i / (n - 1) - 0.5) * radius * 1.5;
    return { name, position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number] };
  });
}

interface VectorNodeProps {
  name: string;
  position: [number, number, number];
  isInitial: boolean;
  isSelected: boolean;
  onSelect: () => void;
  phaseOffset: number;
  theme: Theme3D;
  nodePositionsRef: NodePositionsRef;
}

function VectorNode({ name, position, isInitial, isSelected, onSelect, phaseOffset, theme, nodePositionsRef }: VectorNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const frameCount = useRef(0);
  
  useFrame((state) => {
    frameCount.current++;
    if (frameCount.current % 2 !== 0) return;
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;
    const motion = theme.motionFn(t, phaseOffset, position);
    
    groupRef.current.position.set(motion.x, motion.y, motion.z);
    meshRef.current.rotation.set(motion.rotX, motion.rotY, motion.rotZ);
    meshRef.current.scale.setScalar(motion.scale);
    
    if (!nodePositionsRef.current[name]) {
      nodePositionsRef.current[name] = new THREE.Vector3();
    }
    nodePositionsRef.current[name].set(motion.x, motion.y, motion.z);
  });

  const color = isInitial ? theme.nodeInitialColor : isSelected ? theme.nodeSelectedColor : hovered ? theme.nodeSelectedColor : theme.nodeColor;

  return (
    <group ref={groupRef} position={position}>
      {isSelected && (
        <mesh scale={1.5}>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshBasicMaterial color={theme.nodeSelectedColor} transparent opacity={0.1} wireframe />
        </mesh>
      )}
      
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[0.5, theme.wireframe ? 0 : 1]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={theme.emissiveIntensity}
          wireframe={theme.wireframe}
          transparent
          opacity={theme.wireframe ? 0.9 : 1}
        />
      </mesh>
      
      {theme.wireframe && (
        <mesh scale={1.02}>
          <icosahedronGeometry args={[0.5, 0]} />
          <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
        </mesh>
      )}
      
      <Billboard position={[0, 0.9, 0]}>
        <Text
          fontSize={0.28}
          color={theme.labelColor}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {name}
        </Text>
      </Billboard>
      
      {isInitial && (
        <group position={[-0.9, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.25, 4]} />
            <meshStandardMaterial 
              color={theme.nodeInitialColor} 
              emissive={theme.nodeInitialColor} 
              emissiveIntensity={theme.emissiveIntensity}
              wireframe={theme.wireframe}
            />
          </mesh>
          <Line 
            points={[[-0.4, 0, 0], [-0.12, 0, 0]]}
            color={theme.nodeInitialColor}
            lineWidth={2}
          />
        </group>
      )}
    </group>
  );
}

type NodePositionsRef = React.MutableRefObject<Record<string, THREE.Vector3>>;

interface VectorTransitionProps {
  fromState: string;
  toState: string;
  event: string;
  isHighlighted: boolean;
  isSelfLoop: boolean;
  theme: Theme3D;
  nodePositionsRef: NodePositionsRef;
}

function VectorTransition({ fromState, toState, event, isHighlighted, isSelfLoop, theme, nodePositionsRef }: VectorTransitionProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<any>(null);
  const arrowRef = useRef<THREE.Mesh>(null);
  const labelRef = useRef<THREE.Group>(null);
  const frameCount = useRef(0);
  const [ready, setReady] = useState(false);
  
  const color = isHighlighted ? theme.nodeSelectedColor : theme.transitionColor;

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 2 !== 0) return;
    
    const fromPos = nodePositionsRef.current[fromState];
    const toPos = nodePositionsRef.current[toState];
    
    if (!fromPos || !toPos) {
      if (ready) setReady(false);
      return;
    }
    
    if (!ready) setReady(true);
    
    let curve: THREE.Curve<THREE.Vector3>;
    if (isSelfLoop) {
      curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(fromPos.x + 0.5, fromPos.y, fromPos.z),
        new THREE.Vector3(fromPos.x + 0.8, fromPos.y + 1.5, fromPos.z),
        new THREE.Vector3(fromPos.x - 0.8, fromPos.y + 1.5, fromPos.z),
        new THREE.Vector3(fromPos.x - 0.5, fromPos.y, fromPos.z)
      );
    } else {
      const dir = new THREE.Vector3().subVectors(toPos, fromPos).normalize();
      const start = new THREE.Vector3().copy(fromPos).addScaledVector(dir, 0.55);
      const end = new THREE.Vector3().copy(toPos).addScaledVector(dir, -0.55);
      const mid = new THREE.Vector3(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 + 0.8,
        (start.z + end.z) / 2
      );
      curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    }
    
    const points = curve.getPoints(16);
    if (lineRef.current?.geometry) {
      lineRef.current.geometry.setPositions(points.flatMap(p => [p.x, p.y, p.z]));
    }
    
    if (arrowRef.current) {
      const arrowPos = curve.getPoint(0.85);
      const tangent = curve.getTangent(0.85).normalize();
      arrowRef.current.position.copy(arrowPos);
      arrowRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    }
    
    if (labelRef.current) {
      const labelP = curve.getPoint(0.5);
      labelRef.current.position.set(labelP.x, labelP.y + 0.25, labelP.z);
    }
  });

  return (
    <group ref={groupRef} visible={ready}>
      <Line
        ref={lineRef}
        points={[[0,0,0], [0.01,0.01,0.01]]}
        color={color}
        lineWidth={isHighlighted ? 2.5 : 1.5}
        transparent
        opacity={theme.id === "vector-arcade" ? 0.7 : 0.8}
      />
      
      <mesh ref={arrowRef}>
        <coneGeometry args={[0.06, 0.15, 4]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={theme.emissiveIntensity * 0.5}
          wireframe={theme.wireframe}
        />
      </mesh>
      
      <group ref={labelRef}>
        <Billboard>
          <Text
            fontSize={0.16}
            color={theme.labelColor}
            anchorX="center"
            anchorY="bottom"
            outlineWidth={0.01}
            outlineColor="#000000"
          >
            {event}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}

function StatechartScene({ 
  fsm, 
  selectedState, 
  onSelectState,
  theme
}: { 
  fsm: ItemFSM; 
  selectedState: string | null;
  onSelectState: (s: string) => void;
  theme: Theme3D;
}) {
  const states = Object.keys(fsm.states);
  const positions = useMemo(() => calculateGeometricLayout(states), [states]);
  const nodePositionsRef = useRef<Record<string, THREE.Vector3>>({});

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
      <PerspectiveCamera makeDefault position={[10, 6, 10]} fov={45} />
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color={theme.nodeColor} />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color={theme.nodeSelectedColor} />
      
      {positions.map(({ name, position }, idx) => (
        <VectorNode
          key={name}
          name={name}
          position={position}
          isInitial={name === fsm.initial}
          isSelected={name === selectedState}
          onSelect={() => onSelectState(name)}
          phaseOffset={idx * 1.2}
          theme={theme}
          nodePositionsRef={nodePositionsRef}
        />
      ))}
      
      {transitions.map(({ from, to, event }, idx) => (
        <VectorTransition
          key={`${from}-${event}-${to}-${idx}`}
          fromState={from}
          toState={to}
          event={event}
          isHighlighted={from === selectedState}
          isSelfLoop={from === to}
          theme={theme}
          nodePositionsRef={nodePositionsRef}
        />
      ))}
      
      <OrbitControls 
        makeDefault 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={6}
        maxDistance={25}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

export default function StatechartEditor() {
  const [fsm, setFsm] = useState<ItemFSM>({
    initial: "idle",
    states: {
      idle: { start: "running", configure: "settings" },
      running: { stop: "idle", pause: "paused" },
      paused: { resume: "running", stop: "idle" },
      settings: { save: "idle", cancel: "idle" }
    }
  });
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [newStateName, setNewStateName] = useState("");
  const [newEvent, setNewEvent] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [themeIndex, setThemeIndex] = useState(0);

  const theme = THEMES[themeIndex];
  const states = Object.keys(fsm.states);
  const layoutName = states.length === 3 ? "Triangle" : 
                     states.length === 4 ? "Tetrahedron" : 
                     states.length === 5 ? "Pyramid" : 
                     states.length === 6 ? "Octahedron" : 
                     states.length > 6 ? "Helix" : "Linear";

  const addState = () => {
    if (!newStateName.trim() || fsm.states[newStateName]) return;
    setFsm(prev => ({ ...prev, states: { ...prev.states, [newStateName]: {} } }));
    setNewStateName("");
  };

  const removeState = (name: string) => {
    if (name === fsm.initial) return;
    const newStates = { ...fsm.states };
    delete newStates[name];
    Object.keys(newStates).forEach(s => {
      Object.entries(newStates[s]).forEach(([event, target]) => {
        if (target === name) delete newStates[s][event];
      });
    });
    setFsm(prev => ({ ...prev, states: newStates }));
    if (selectedState === name) setSelectedState(null);
  };

  const addTransition = () => {
    if (!selectedState || !newEvent.trim() || !newTarget) return;
    setFsm(prev => ({
      ...prev,
      states: { ...prev.states, [selectedState]: { ...prev.states[selectedState], [newEvent]: newTarget } }
    }));
    setNewEvent("");
    setNewTarget("");
  };

  const setInitial = (name: string) => setFsm(prev => ({ ...prev, initial: name }));

  const cycleTheme = () => setThemeIndex((themeIndex + 1) % THEMES.length);

  return (
    <div className="h-screen w-screen flex" style={{ background: theme.background }}>
      <div className="w-80 bg-black/70 backdrop-blur border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/editor">
            <Button variant="ghost" size="sm" className="mb-2 text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Physics Realm
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: theme.nodeColor }}>
            <GitBranch className="w-5 h-5" />
            Statechart
          </h1>
          <p className="text-xs text-white/50 mt-1">Logical realm - zero gravity</p>
        </div>

        <div className="p-3 border-b border-white/10">
          <Label className="text-xs text-white/50 mb-2 block">3D Theme</Label>
          <Button 
            onClick={cycleTheme}
            className="w-full justify-between"
            variant="outline"
            style={{ borderColor: theme.nodeColor + '50', color: theme.nodeColor }}
            data-testid="button-cycle-theme"
          >
            <span className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              {theme.name}
            </span>
            <Badge variant="secondary" className="text-[10px]">{themeIndex + 1}/{THEMES.length}</Badge>
          </Button>
          <p className="text-[10px] text-white/40 mt-1">{theme.description}</p>
        </div>

        <div className="p-3 border-b border-white/10" style={{ background: `linear-gradient(135deg, ${theme.nodeColor}10, transparent)` }}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">Layout</span>
            <Badge variant="outline" className="font-mono text-xs" style={{ borderColor: theme.nodeColor + '50', color: theme.nodeColor }}>
              {layoutName}
            </Badge>
          </div>
          <div className="text-[10px] text-white/40 mt-1">{states.length} states</div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="mb-4">
            <Label className="text-xs text-white/50 mb-2 block">Add State</Label>
            <div className="flex gap-2">
              <Input
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="State name"
                className="h-8 text-sm bg-white/5 border-white/10"
                data-testid="input-new-state"
                onKeyDown={(e) => e.key === "Enter" && addState()}
              />
              <Button size="sm" onClick={addState} style={{ background: theme.nodeColor }} data-testid="button-add-state">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs text-white/50 mb-2 block">States</Label>
            <div className="space-y-1">
              {states.map(name => (
                <div 
                  key={name}
                  className="flex items-center justify-between p-2 rounded cursor-pointer transition-all border"
                  style={{
                    background: selectedState === name ? theme.nodeColor + '20' : 'rgba(255,255,255,0.02)',
                    borderColor: selectedState === name ? theme.nodeColor + '60' : 'transparent'
                  }}
                  onClick={() => setSelectedState(name)}
                  data-testid={`state-item-${name}`}
                >
                  <div className="flex items-center gap-2">
                    <Circle 
                      className="w-3 h-3" 
                      style={{ 
                        fill: name === fsm.initial ? theme.nodeInitialColor : 'transparent',
                        color: name === fsm.initial ? theme.nodeInitialColor : theme.nodeColor 
                      }} 
                    />
                    <span className="text-sm font-mono" style={{ color: theme.labelColor }}>{name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {name !== fsm.initial && (
                      <Button 
                        size="icon" variant="ghost" className="w-6 h-6 text-white/40 hover:text-white"
                        onClick={(e) => { e.stopPropagation(); setInitial(name); }}
                        title="Set as initial"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                    {name !== fsm.initial && (
                      <Button 
                        size="icon" variant="ghost" className="w-6 h-6 text-red-400/60 hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); removeState(name); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedState && (
            <div className="mb-4 p-3 rounded border" style={{ background: theme.nodeColor + '08', borderColor: theme.nodeColor + '30' }}>
              <Label className="text-xs text-white/50 mb-2 block">
                Transitions from <span style={{ color: theme.nodeColor }} className="font-mono">{selectedState}</span>
              </Label>
              
              <div className="space-y-1 mb-3">
                {Object.entries(fsm.states[selectedState] || {}).map(([event, target]) => (
                  <div key={event} className="flex items-center gap-2 text-xs p-1.5 bg-black/30 rounded">
                    <Zap className="w-3 h-3" style={{ color: theme.labelColor }} />
                    <span className="font-mono" style={{ color: theme.labelColor }}>{event}</span>
                    <ArrowRight className="w-3 h-3 text-white/30" />
                    <span className="font-mono" style={{ color: theme.nodeColor }}>{target}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Input
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder="Event name"
                  className="h-7 text-xs bg-black/30 border-white/10"
                  data-testid="input-new-event"
                />
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full h-7 text-xs bg-black/30 border border-white/10 rounded px-2 text-white"
                  data-testid="select-target-state"
                >
                  <option value="">Target state...</option>
                  {states.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button 
                  size="sm" className="w-full h-7 text-xs"
                  onClick={addTransition}
                  disabled={!newEvent || !newTarget}
                  style={{ background: theme.nodeColor }}
                  data-testid="button-add-transition"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Transition
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-white/10">
          <Button className="w-full" style={{ background: theme.nodeColor }} data-testid="button-save-fsm">
            <Save className="w-4 h-4 mr-2" /> Save Statechart
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas 
          key={theme.id}
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.warn('WebGL context lost - will auto-restore');
            });
            canvas.addEventListener('webglcontextrestored', () => {
              console.log('WebGL context restored');
            });
          }}
          gl={{ antialias: true, powerPreference: 'default' }}
        >
          <color attach="background" args={[theme.background]} />
          <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />
          <StatechartScene 
            fsm={fsm} 
            selectedState={selectedState}
            onSelectState={setSelectedState}
            theme={theme}
          />
        </Canvas>
        
        <div className="absolute bottom-4 left-4 text-xs font-mono" style={{ color: theme.nodeColor + '80' }}>
          Orbit: drag | Zoom: scroll | Select: click
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Badge variant="secondary" className="font-mono text-xs" style={{ background: theme.nodeColor + '20', color: theme.nodeColor }}>
            {states.length} states
          </Badge>
          <Badge className="font-mono text-xs" style={{ background: theme.nodeColor, color: '#000' }}>
            {theme.name}
          </Badge>
        </div>
      </div>
    </div>
  );
}
