import React, { useState, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  OrbitControls, Text, Line, Billboard, Float,
  PerspectiveCamera, Environment, Stars
} from "@react-three/drei";
import * as THREE from "three";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Plus, Trash2, Play, GitBranch, Save, 
  Zap, Circle, ArrowRight
} from "lucide-react";
import { ItemFSM } from "@/lib/toss-v1";

interface StatePosition {
  name: string;
  position: [number, number, number];
}

function calculateGeometricLayout(states: string[], radius: number = 4): StatePosition[] {
  const n = states.length;
  
  if (n === 0) return [];
  if (n === 1) return [{ name: states[0], position: [0, 0, 0] }];
  if (n === 2) return states.map((name, i) => ({ 
    name, 
    position: [i === 0 ? -radius : radius, 0, 0] as [number, number, number]
  }));
  
  if (n === 3) {
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

interface FloatingStateNodeProps {
  name: string;
  position: [number, number, number];
  isInitial: boolean;
  isSelected: boolean;
  onSelect: () => void;
  phaseOffset: number;
}

function FloatingStateNode({ name, position, isInitial, isSelected, onSelect, phaseOffset }: FloatingStateNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.position.y = position[1] + Math.sin(t * 0.5 + phaseOffset) * 0.15;
      groupRef.current.position.x = position[0] + Math.sin(t * 0.3 + phaseOffset * 2) * 0.05;
      groupRef.current.rotation.y = Math.sin(t * 0.2 + phaseOffset) * 0.1;
    }
    if (glowRef.current && isSelected) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1);
    }
  });

  const baseColor = isInitial ? "#22c55e" : "#3b82f6";
  const color = isSelected ? "#a855f7" : hovered ? "#60a5fa" : baseColor;

  return (
    <group ref={groupRef} position={position}>
      {isSelected && (
        <mesh ref={glowRef} scale={1.8}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#a855f7" transparent opacity={0.15} />
        </mesh>
      )}
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <dodecahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial 
            color={color}
            emissive={color}
            emissiveIntensity={isSelected ? 0.6 : 0.3}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </Float>
      
      <Billboard position={[0, 0.9, 0]}>
        <Text
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {name}
        </Text>
      </Billboard>
      
      {isInitial && (
        <group position={[-1, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.12, 0.3, 8]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
          </mesh>
          <Line 
            points={[[-0.5, 0, 0], [-0.15, 0, 0]]}
            color="#22c55e"
            lineWidth={3}
          />
        </group>
      )}
    </group>
  );
}

interface TransitionCurveProps {
  from: [number, number, number];
  to: [number, number, number];
  event: string;
  isHighlighted: boolean;
  isSelfLoop: boolean;
}

function TransitionCurve({ from, to, event, isHighlighted, isSelfLoop }: TransitionCurveProps) {
  const curve = useMemo(() => {
    if (isSelfLoop) {
      const loopHeight = 1.5;
      const loopRadius = 0.8;
      return new THREE.CubicBezierCurve3(
        new THREE.Vector3(from[0] + 0.5, from[1], from[2]),
        new THREE.Vector3(from[0] + loopRadius, from[1] + loopHeight, from[2]),
        new THREE.Vector3(from[0] - loopRadius, from[1] + loopHeight, from[2]),
        new THREE.Vector3(from[0] - 0.5, from[1], from[2])
      );
    }
    
    const midPoint: THREE.Vector3 = new THREE.Vector3(
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2 + 1,
      (from[2] + to[2]) / 2
    );
    
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      midPoint,
      new THREE.Vector3(...to)
    );
  }, [from, to, isSelfLoop]);

  const points = useMemo(() => curve.getPoints(30), [curve]);
  
  const color = isHighlighted ? "#f59e0b" : "#64748b";

  const arrowData = useMemo(() => {
    const t = 0.85;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t).normalize();
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      tangent
    );
    return { position: point, quaternion };
  }, [curve]);

  const labelPos = useMemo(() => {
    const t = isSelfLoop ? 0.5 : 0.5;
    const point = curve.getPoint(t);
    return [point.x, point.y + 0.3, point.z] as [number, number, number];
  }, [curve, isSelfLoop]);

  return (
    <group>
      <Line
        points={points}
        color={color}
        lineWidth={isHighlighted ? 3 : 2}
      />
      
      <mesh position={arrowData.position} quaternion={arrowData.quaternion}>
        <coneGeometry args={[0.08, 0.2, 6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      <Billboard position={labelPos}>
        <Text
          fontSize={0.18}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {event}
        </Text>
      </Billboard>
    </group>
  );
}

function StatechartScene({ 
  fsm, 
  selectedState, 
  onSelectState 
}: { 
  fsm: ItemFSM; 
  selectedState: string | null;
  onSelectState: (s: string) => void;
}) {
  const states = Object.keys(fsm.states);
  const positions = useMemo(() => calculateGeometricLayout(states), [states]);
  
  const positionMap = useMemo(() => {
    const map: Record<string, [number, number, number]> = {};
    positions.forEach(p => { map[p.name] = p.position; });
    return map;
  }, [positions]);

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
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={50} />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#8b5cf6" />
      <pointLight position={[0, -10, 0]} intensity={0.3} color="#3b82f6" />
      
      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={0.5} />
      
      {positions.map(({ name, position }, idx) => (
        <FloatingStateNode
          key={name}
          name={name}
          position={position}
          isInitial={name === fsm.initial}
          isSelected={name === selectedState}
          onSelect={() => onSelectState(name)}
          phaseOffset={idx * 1.5}
        />
      ))}
      
      {transitions.map(({ from, to, event }, idx) => {
        const fromPos = positionMap[from];
        const toPos = positionMap[to];
        if (!fromPos || !toPos) return null;
        
        const isSelfLoop = from === to;
        
        if (!isSelfLoop) {
          const dir = new THREE.Vector3(...toPos).sub(new THREE.Vector3(...fromPos)).normalize();
          const startOffset = dir.clone().multiplyScalar(0.6);
          const endOffset = dir.clone().multiplyScalar(-0.6);
          
          return (
            <TransitionCurve
              key={`${from}-${event}-${to}-${idx}`}
              from={[fromPos[0] + startOffset.x, fromPos[1] + startOffset.y, fromPos[2] + startOffset.z]}
              to={[toPos[0] + endOffset.x, toPos[1] + endOffset.y, toPos[2] + endOffset.z]}
              event={event}
              isHighlighted={from === selectedState}
              isSelfLoop={false}
            />
          );
        }
        
        return (
          <TransitionCurve
            key={`${from}-${event}-${to}-${idx}`}
            from={fromPos}
            to={toPos}
            event={event}
            isHighlighted={from === selectedState}
            isSelfLoop={true}
          />
        );
      })}
      
      <OrbitControls 
        makeDefault 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function StatechartEditor() {
  const [, navigate] = useLocation();
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

  const states = Object.keys(fsm.states);
  const layoutName = states.length === 3 ? "Triangle" : 
                     states.length === 4 ? "Tetrahedron" : 
                     states.length === 5 ? "Pyramid" : 
                     states.length === 6 ? "Octahedron" : 
                     states.length > 6 ? "Helix" : "Linear";

  const addState = () => {
    if (!newStateName.trim() || fsm.states[newStateName]) return;
    setFsm(prev => ({
      ...prev,
      states: { ...prev.states, [newStateName]: {} }
    }));
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
      states: {
        ...prev.states,
        [selectedState]: { ...prev.states[selectedState], [newEvent]: newTarget }
      }
    }));
    setNewEvent("");
    setNewTarget("");
  };

  const setInitial = (name: string) => {
    setFsm(prev => ({ ...prev, initial: name }));
  };

  return (
    <div className="h-screen w-screen flex bg-slate-950">
      <div className="w-80 bg-black/50 backdrop-blur border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/editor">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Physics Editor
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-primary" />
            Statechart Editor
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Logical realm - no gravity
          </p>
        </div>

        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Layout</span>
            <Badge variant="outline" className="font-mono">{layoutName}</Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {states.length} states auto-arranged
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">Add State</Label>
            <div className="flex gap-2">
              <Input
                value={newStateName}
                onChange={(e) => setNewStateName(e.target.value)}
                placeholder="State name"
                className="h-8 text-sm bg-white/5"
                data-testid="input-new-state"
                onKeyDown={(e) => e.key === "Enter" && addState()}
              />
              <Button size="sm" onClick={addState} data-testid="button-add-state">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">States</Label>
            <div className="space-y-1">
              {states.map(name => (
                <div 
                  key={name}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-all
                    ${selectedState === name ? 'bg-primary/20 border border-primary' : 'bg-white/5 hover:bg-white/10'}`}
                  onClick={() => setSelectedState(name)}
                  data-testid={`state-item-${name}`}
                >
                  <div className="flex items-center gap-2">
                    <Circle className={`w-3 h-3 ${name === fsm.initial ? 'fill-green-500 text-green-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm text-white font-mono">{name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {name !== fsm.initial && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-6 h-6"
                        onClick={(e) => { e.stopPropagation(); setInitial(name); }}
                        title="Set as initial"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    )}
                    {name !== fsm.initial && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-6 h-6 text-red-400 hover:text-red-300"
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
            <div className="mb-4 p-3 bg-white/5 rounded border border-white/10">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Transitions from <span className="text-primary font-mono">{selectedState}</span>
              </Label>
              
              <div className="space-y-1 mb-3">
                {Object.entries(fsm.states[selectedState] || {}).map(([event, target]) => (
                  <div key={event} className="flex items-center gap-2 text-xs p-1.5 bg-white/5 rounded">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-yellow-400 font-mono">{event}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-blue-400 font-mono">{target}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Input
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  placeholder="Event name"
                  className="h-7 text-xs bg-white/5"
                  data-testid="input-new-event"
                />
                <select
                  value={newTarget}
                  onChange={(e) => setNewTarget(e.target.value)}
                  className="w-full h-7 text-xs bg-white/5 border border-white/10 rounded px-2 text-white"
                  data-testid="select-target-state"
                >
                  <option value="">Target state...</option>
                  {states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button 
                  size="sm" 
                  className="w-full h-7 text-xs"
                  onClick={addTransition}
                  disabled={!newEvent || !newTarget}
                  data-testid="button-add-transition"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Transition
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          <Button className="w-full" data-testid="button-save-fsm">
            <Save className="w-4 h-4 mr-2" />
            Save Statechart
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas>
          <color attach="background" args={["#0a0a1a"]} />
          <fog attach="fog" args={["#0a0a1a", 15, 40]} />
          <StatechartScene 
            fsm={fsm} 
            selectedState={selectedState}
            onSelectState={setSelectedState}
          />
        </Canvas>
        
        <div className="absolute bottom-4 left-4 text-xs text-white/50 font-mono">
          Drag to orbit | Scroll to zoom | Click nodes to select
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Badge variant="secondary" className="font-mono">
            {states.length} states
          </Badge>
          <Badge variant="outline" className="font-mono text-purple-400 border-purple-400/50">
            Logical Realm
          </Badge>
        </div>
      </div>
    </div>
  );
}
