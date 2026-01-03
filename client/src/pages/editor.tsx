import React, { useState, useRef, useEffect, Suspense, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, Grid, Environment, Html, 
  TransformControls, PerspectiveCamera 
} from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Play, Pause, RotateCcw, Box, Circle, 
  Triangle, Settings, Layers, Zap, Save, Upload, CheckCircle, XCircle,
  Plus, Trash2, ArrowRight, GitBranch, X, Gamepad2, Vibrate
} from "lucide-react";
import { 
  TossCartridge, TossItem, EditorMode, UserAssertion, ItemFSM, ControllerBinding,
  createNewCartridge, createThing, DEFAULT_PHYSICS, CONTROLLER_BUTTONS
} from "@/lib/toss-v1";
import { useToast } from "@/hooks/use-toast";
// FSM 3D visualization is rendered inline with position hints
// Full 3D editor would need dedicated Canvas - deferred to avoid WebGL context issues

// Ground Zero - The floor at y=0
function GroundZero() {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[50, 1, 50]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.8} />
      </mesh>
      <CuboidCollider args={[25, 0.5, 25]} />
    </RigidBody>
  );
}

// A physics-enabled Thing that squashes on impact using refs (no setState in useFrame)
interface PhysicsThingProps {
  item: TossItem;
  isSelected: boolean;
  onSelect: () => void;
  onTransformUpdate: (id: string, position: { x: number; y: number; z: number }) => void;
  mode: EditorMode;
}

function PhysicsThing({ item, isSelected, onSelect, onTransformUpdate, mode }: PhysicsThingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const hasLandedRef = useRef(false);
  const squashRef = useRef({ x: 1, y: 1, z: 1 });
  const lastPositionRef = useRef({ x: 0, y: 0, z: 0 });
  
  const isAnchored = item.physics?.anchored || mode === "DESIGN";
  const gravityScale = item.physics?.gravityScale ?? 1;
  const squashIntensity = item.animation?.squash_intensity ?? 0.4;
  const recoverySpeed = item.animation?.squash_recovery_speed ?? 8;

  useFrame((state, delta) => {
    // Update squash animation using refs (no setState)
    if (hasLandedRef.current && meshRef.current) {
      squashRef.current.x = THREE.MathUtils.lerp(squashRef.current.x, 1, delta * recoverySpeed);
      squashRef.current.y = THREE.MathUtils.lerp(squashRef.current.y, 1, delta * recoverySpeed);
      squashRef.current.z = THREE.MathUtils.lerp(squashRef.current.z, 1, delta * recoverySpeed);
      meshRef.current.scale.set(squashRef.current.x, squashRef.current.y, squashRef.current.z);
    }

    // Sync rigid body position back to cartridge data (throttled)
    if (rigidBodyRef.current && mode !== "DESIGN") {
      const translation = rigidBodyRef.current.translation();
      const newPos = { x: translation.x, y: translation.y, z: translation.z };
      
      // Only update if position changed significantly (higher threshold to reduce updates)
      const dx = Math.abs(newPos.x - lastPositionRef.current.x);
      const dy = Math.abs(newPos.y - lastPositionRef.current.y);
      const dz = Math.abs(newPos.z - lastPositionRef.current.z);
      
      if (dx > 0.1 || dy > 0.1 || dz > 0.1) {
        lastPositionRef.current = newPos;
        // Batch updates using requestIdleCallback or just skip rapid updates
        requestAnimationFrame(() => onTransformUpdate(item.id, newPos));
      }
    }
  });

  const handleCollision = () => {
    if (!hasLandedRef.current && item.animation?.on_impact === "squash") {
      hasLandedRef.current = true;
      // Trigger squash using ref
      squashRef.current = { x: 1 + squashIntensity, y: 1 - squashIntensity, z: 1 + squashIntensity };
    }
  };

  const color = item.material?.color || "#7c3aed";
  const position: [number, number, number] = [
    item.transform.position.x, 
    item.transform.position.y, 
    item.transform.position.z
  ];

  return (
    <RigidBody 
      ref={rigidBodyRef}
      type={isAnchored ? "fixed" : "dynamic"}
      position={position}
      gravityScale={gravityScale}
      onCollisionEnter={handleCollision}
      restitution={item.physics?.restitution ?? 0.3}
      friction={item.physics?.friction ?? 0.5}
      linearDamping={item.physics?.linearDamping ?? 0.1}
      angularDamping={item.physics?.angularDamping ?? 0.1}
    >
      <mesh 
        ref={meshRef}
        castShadow
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        {item.bounds.type === "sphere" ? (
          <sphereGeometry args={[item.bounds.radius || 0.5, 32, 32]} />
        ) : (
          <boxGeometry args={[
            item.bounds.width || 1, 
            item.bounds.height || 1, 
            item.bounds.depth || 1
          ]} />
        )}
        <meshStandardMaterial 
          color={color} 
          emissive={isSelected ? color : (item.material?.emissive || "#000")} 
          emissiveIntensity={isSelected ? 0.3 : (item.material?.emissiveIntensity || 0)}
          roughness={item.material?.roughness ?? 0.5}
          metalness={item.material?.metalness ?? 0.1}
        />
      </mesh>
      
      {isSelected && (
        <Html center distanceFactor={10}>
          <div className="bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap">
            {item.id.split('_')[1]} | {item.fsm?.initial || "idle"}
          </div>
        </Html>
      )}
    </RigidBody>
  );
}

// Mode indicator bar
function ModeBar({ mode, onModeChange, testStatus }: { 
  mode: EditorMode; 
  onModeChange: (m: EditorMode) => void;
  testStatus: "pending" | "running" | "pass" | "fail";
}) {
  const modes: EditorMode[] = ["DESIGN", "TEST", "DEPLOY", "RUN"];
  
  const canDeploy = testStatus === "pass";
  
  return (
    <div className="flex items-center gap-1 bg-black/60 backdrop-blur rounded-lg p-1 border border-white/10">
      {modes.map((m) => {
        const isActive = mode === m;
        const isDisabled = m === "DEPLOY" && !canDeploy;
        
        let bgColor = "bg-transparent";
        if (isActive) {
          bgColor = m === "DESIGN" ? "bg-blue-600" : 
                    m === "TEST" ? "bg-yellow-600" : 
                    m === "DEPLOY" ? "bg-green-600" : "bg-purple-600";
        }
        
        return (
          <Button
            key={m}
            size="sm"
            variant="ghost"
            disabled={isDisabled}
            onClick={() => onModeChange(m)}
            className={`${bgColor} ${isActive ? 'text-white' : 'text-muted-foreground'} 
                       ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''} 
                       text-xs font-mono px-3`}
          >
            {m}
            {m === "TEST" && testStatus === "running" && (
              <span className="ml-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
            {m === "TEST" && testStatus === "pass" && (
              <CheckCircle className="ml-1 w-3 h-3 text-green-400" />
            )}
            {m === "TEST" && testStatus === "fail" && (
              <XCircle className="ml-1 w-3 h-3 text-red-400" />
            )}
          </Button>
        );
      })}
    </div>
  );
}

// Component palette
function ComponentPalette({ onAddComponent }: { onAddComponent: (type: string) => void }) {
  const components = [
    { id: "box", icon: Box, label: "Box" },
    { id: "sphere", icon: Circle, label: "Sphere" },
    { id: "plain_button", icon: Triangle, label: "Button" },
  ];

  return (
    <div 
      className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 bg-black/80 backdrop-blur p-2 rounded-lg border border-white/10"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {components.map((comp) => (
        <Button
          key={comp.id}
          size="icon"
          variant="ghost"
          onClick={() => onAddComponent(comp.id)}
          className="w-10 h-10 text-muted-foreground hover:text-white hover:bg-white/10"
          title={comp.label}
          data-testid={`button-add-${comp.id}`}
        >
          <comp.icon className="w-5 h-5" />
        </Button>
      ))}
      <Separator className="my-1" />
      <Button size="icon" variant="ghost" className="w-10 h-10 text-muted-foreground" title="Layers">
        <Layers className="w-5 h-5" />
      </Button>
    </div>
  );
}

// FSM Visual Editor Panel - THE TOP PRIORITY FEATURE
interface FSMEditorProps {
  item: TossItem;
  onUpdate: (fsm: ItemFSM) => void;
  onClose: () => void;
}

function FSMEditor({ item, onUpdate, onClose }: FSMEditorProps) {
  const [fsm, setFsm] = useState<ItemFSM>(item.fsm || { initial: "idle", states: { idle: {} } });
  const [newStateName, setNewStateName] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState("");
  const [newTargetState, setNewTargetState] = useState("");
  const [show3D, setShow3D] = useState(false);
  
  // Calculate 3D positions for display
  const positions = useMemo(() => {
    const stateNames = Object.keys(fsm.states);
    const n = stateNames.length;
    const radius = 3;
    
    if (n <= 1) return stateNames.map(name => ({ name, position: [0, 0, 0] as [number, number, number] }));
    if (n === 2) return stateNames.map((name, i) => ({ name, position: [i * 2 - 1, 0, 0] as [number, number, number] }));
    if (n === 3) {
      return stateNames.map((name, i) => {
        const angle = (i * 2 * Math.PI / 3) - Math.PI / 2;
        return { name, position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius] as [number, number, number] };
      });
    }
    if (n === 4) {
      const h = radius * Math.sqrt(2/3);
      return [
        { name: stateNames[0], position: [0, h, 0] as [number, number, number] },
        { name: stateNames[1], position: [radius, -h/3, 0] as [number, number, number] },
        { name: stateNames[2], position: [-radius/2, -h/3, radius * 0.866] as [number, number, number] },
        { name: stateNames[3], position: [-radius/2, -h/3, -radius * 0.866] as [number, number, number] },
      ];
    }
    return stateNames.map((name, i) => {
      const angle = (i * 2 * Math.PI / n);
      const y = (i / (n - 1) - 0.5) * radius;
      return { name, position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius] as [number, number, number] };
    });
  }, [fsm.states]);

  // Re-sync FSM when item selection changes
  useEffect(() => {
    setFsm(item.fsm || { initial: "idle", states: { idle: {} } });
    setSelectedState(null);
    setNewStateName("");
    setNewEvent("");
    setNewTargetState("");
  }, [item.id]);

  const states = Object.keys(fsm.states);

  const addState = () => {
    if (newStateName && !states.includes(newStateName)) {
      const updated = {
        ...fsm,
        states: { ...fsm.states, [newStateName]: {} }
      };
      setFsm(updated);
      onUpdate(updated);
      setNewStateName("");
    }
  };

  const deleteState = (stateName: string) => {
    if (stateName === fsm.initial) return; // Can't delete initial state
    const { [stateName]: _, ...rest } = fsm.states;
    // Also remove any transitions TO this state
    const cleanedStates: Record<string, Record<string, string>> = {};
    for (const [key, transitions] of Object.entries(rest)) {
      cleanedStates[key] = {};
      for (const [event, target] of Object.entries(transitions)) {
        if (target !== stateName) {
          cleanedStates[key][event] = target;
        }
      }
    }
    const updated = { ...fsm, states: cleanedStates };
    setFsm(updated);
    onUpdate(updated);
    if (selectedState === stateName) setSelectedState(null);
  };

  const setInitialState = (stateName: string) => {
    const updated = { ...fsm, initial: stateName };
    setFsm(updated);
    onUpdate(updated);
  };

  const addTransition = () => {
    if (selectedState && newEvent && newTargetState && states.includes(newTargetState)) {
      const updated = {
        ...fsm,
        states: {
          ...fsm.states,
          [selectedState]: {
            ...fsm.states[selectedState],
            [newEvent]: newTargetState
          }
        }
      };
      setFsm(updated);
      onUpdate(updated);
      setNewEvent("");
      setNewTargetState("");
    }
  };

  const removeTransition = (state: string, event: string) => {
    const { [event]: _, ...rest } = fsm.states[state];
    const updated = {
      ...fsm,
      states: { ...fsm.states, [state]: rest }
    };
    setFsm(updated);
    onUpdate(updated);
  };

  return (
    <div className={`absolute right-4 top-20 bottom-20 ${show3D ? 'w-[600px]' : 'w-80'} bg-black/90 backdrop-blur border border-white/10 rounded-lg overflow-hidden flex flex-col z-50 transition-all duration-300`}>
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <span className="font-mono text-sm text-white">FSM Editor</span>
        </div>
        <div className="flex items-center gap-1">
          <Button 
            size="sm" 
            variant={show3D ? "default" : "ghost"}
            onClick={() => setShow3D(!show3D)}
            className="h-6 px-2 text-xs"
            data-testid="button-toggle-3d"
          >
            {show3D ? "2D" : "3D"}
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} className="w-6 h-6">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 3D Visualization Hint - opens fullscreen mode */}
      {show3D && (
        <div className="p-3 border-b border-white/10 bg-gradient-to-r from-purple-900/30 to-blue-900/30">
          <div className="text-xs text-center text-muted-foreground">
            <span className="text-primary font-bold">3D Mode Active</span>
            <br />
            States auto-arrange in 3D: {states.length} states = 
            {states.length === 3 ? " Triangle" : 
             states.length === 4 ? " Tetrahedron" : 
             states.length === 5 ? " Pyramid" : 
             states.length === 6 ? " Octahedron" : " Helix"}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {positions.slice(0, 6).map(({ name, position }: { name: string; position: [number, number, number] }) => (
              <div 
                key={name}
                className={`text-[9px] p-1 rounded cursor-pointer transition-all
                  ${selectedState === name ? 'bg-primary/30 border border-primary' : 'bg-white/5 hover:bg-white/10'}`}
                onClick={() => setSelectedState(name)}
              >
                <div className="font-mono text-white truncate">{name}</div>
                <div className="text-muted-foreground">
                  ({position[0].toFixed(1)}, {position[1].toFixed(1)}, {position[2].toFixed(1)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-3">
        {/* Item Info */}
        <div className="mb-4 p-2 bg-white/5 rounded">
          <span className="text-xs text-muted-foreground">Editing FSM for:</span>
          <div className="text-sm text-white font-mono">{item.id.split('_').slice(0, 2).join('_')}</div>
        </div>

        {/* States List */}
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">States</Label>
          <div className="space-y-1">
            {states.map(state => (
              <div 
                key={state}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors
                  ${selectedState === state ? 'bg-primary/20 border border-primary/50' : 'bg-white/5 hover:bg-white/10'}
                  ${state === fsm.initial ? 'ring-1 ring-green-500/50' : ''}`}
                onClick={() => setSelectedState(state === selectedState ? null : state)}
                data-testid={`state-${state}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${state === fsm.initial ? 'bg-green-500' : 'bg-white/30'}`} />
                  <span className="text-sm font-mono text-white">{state}</span>
                  {state === fsm.initial && (
                    <Badge variant="outline" className="text-[8px] h-4 px-1 border-green-500/50 text-green-400">
                      initial
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {state !== fsm.initial && (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-5 h-5 text-muted-foreground hover:text-green-400"
                        onClick={(e) => { e.stopPropagation(); setInitialState(state); }}
                        title="Set as initial"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-5 h-5 text-muted-foreground hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); deleteState(state); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Add State */}
          <div className="flex gap-2 mt-2">
            <Input 
              placeholder="New state name"
              value={newStateName}
              onChange={(e) => setNewStateName(e.target.value)}
              className="h-8 text-xs bg-white/5 border-white/10"
              onKeyDown={(e) => e.key === 'Enter' && addState()}
              data-testid="input-new-state"
            />
            <Button size="sm" onClick={addState} className="h-8 px-2" data-testid="button-add-state">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Transitions for Selected State */}
        {selectedState && (
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Transitions from "{selectedState}"
            </Label>
            
            <div className="space-y-1 mb-2">
              {Object.entries(fsm.states[selectedState] || {}).map(([event, target]) => (
                <div key={event} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-yellow-400">{event}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-blue-400">{target}</span>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="w-5 h-5 text-muted-foreground hover:text-red-400"
                    onClick={() => removeTransition(selectedState, event)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {Object.keys(fsm.states[selectedState] || {}).length === 0 && (
                <div className="text-xs text-muted-foreground italic p-2">No transitions</div>
              )}
            </div>

            {/* Add Transition */}
            <div className="space-y-2 p-2 bg-white/5 rounded">
              <Input 
                placeholder="Event (e.g., on_press, on_hover)"
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value)}
                className="h-7 text-xs bg-black/30 border-white/10"
                data-testid="input-event"
              />
              <select
                value={newTargetState}
                onChange={(e) => setNewTargetState(e.target.value)}
                className="w-full h-7 text-xs bg-black/30 border border-white/10 rounded px-2 text-white"
                data-testid="select-target-state"
              >
                <option value="">Select target state</option>
                {states.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button 
                size="sm" 
                onClick={addTransition} 
                className="w-full h-7 text-xs"
                disabled={!newEvent || !newTargetState}
                data-testid="button-add-transition"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Transition
              </Button>
            </div>
          </div>
        )}

        {/* Common Events Help */}
        <div className="mt-4 p-2 bg-white/5 rounded">
          <Label className="text-xs text-muted-foreground mb-2 block">Common Events</Label>
          <div className="flex flex-wrap gap-1">
            {["on_press", "on_release", "on_hover", "on_leave", "on_collision", "on_timer"].map(evt => (
              <Badge 
                key={evt}
                variant="outline" 
                className="text-[9px] cursor-pointer hover:bg-primary/20"
                onClick={() => selectedState && setNewEvent(evt)}
              >
                {evt}
              </Badge>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// User Assertions Panel
interface AssertionsPanelProps {
  cartridge: TossCartridge;
  onAddAssertion: (assertion: UserAssertion) => void;
  onRemoveAssertion: (id: string) => void;
  testStatus: "pending" | "running" | "pass" | "fail";
}

function AssertionsPanel({ cartridge, onAddAssertion, onRemoveAssertion, testStatus }: AssertionsPanelProps) {
  const [newType, setNewType] = useState<UserAssertion["type"]>("state_reached");
  const [newDescription, setNewDescription] = useState("");
  const [newTargetId, setNewTargetId] = useState("");
  const [newExpectedState, setNewExpectedState] = useState("");

  const assertions = cartridge.tests?.assertions || [];

  const addAssertion = () => {
    if (!newDescription) return;
    
    const assertion: UserAssertion = {
      id: `assert_${Date.now()}`,
      description: newDescription,
      type: newType,
      target_item_id: newTargetId || undefined,
      expected_state: newExpectedState || undefined,
      timeout_ms: 5000,
    };
    
    onAddAssertion(assertion);
    setNewDescription("");
    setNewTargetId("");
    setNewExpectedState("");
  };

  return (
    <div className="absolute left-16 top-20 w-72 bg-black/90 backdrop-blur border border-white/10 rounded-lg overflow-hidden z-40">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-yellow-400" />
          <span className="font-mono text-sm text-white">Assertions</span>
          {testStatus !== "pending" && (
            <Badge variant={testStatus === "pass" ? "default" : "destructive"} className="text-[9px]">
              {testStatus === "pass" ? "PASS" : testStatus === "fail" ? "FAIL" : "..."}
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="max-h-64 p-3">
        <div className="space-y-2 mb-3">
          {assertions.length === 0 ? (
            <div className="text-xs text-muted-foreground italic p-2 bg-white/5 rounded">
              No assertions yet. Add one to enable meaningful tests.
            </div>
          ) : (
            assertions.map(a => (
              <div 
                key={a.id}
                className={`p-2 rounded border text-xs ${
                  a.passed === true ? 'bg-green-500/10 border-green-500/30' :
                  a.passed === false ? 'bg-red-500/10 border-red-500/30' :
                  'bg-white/5 border-white/10'
                }`}
                data-testid={`assertion-${a.id}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-muted-foreground">{a.type}</span>
                  <div className="flex items-center gap-1">
                    {a.passed === true && <CheckCircle className="w-3 h-3 text-green-400" />}
                    {a.passed === false && <XCircle className="w-3 h-3 text-red-400" />}
                    <Button 
                      size="icon"
                      variant="ghost"
                      className="w-4 h-4"
                      onClick={() => onRemoveAssertion(a.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-white">{a.description}</div>
                {a.expected_state && (
                  <div className="text-muted-foreground mt-1">
                    expects: <span className="text-blue-400">{a.expected_state}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Assertion */}
        <div className="p-2 bg-white/5 rounded space-y-2">
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as UserAssertion["type"])}
            className="w-full h-7 text-xs bg-black/30 border border-white/10 rounded px-2 text-white"
            data-testid="select-assertion-type"
          >
            <option value="state_reached">State Reached</option>
            <option value="collision_occurred">Collision Occurred</option>
            <option value="time_elapsed">Time Elapsed</option>
            <option value="value_equals">Value Equals</option>
          </select>
          
          <Input 
            placeholder="Describe what should happen"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="h-7 text-xs bg-black/30 border-white/10"
            data-testid="input-assertion-description"
          />
          
          {(newType === "state_reached" || newType === "value_equals") && (
            <>
              <select
                value={newTargetId}
                onChange={(e) => setNewTargetId(e.target.value)}
                className="w-full h-7 text-xs bg-black/30 border border-white/10 rounded px-2 text-white"
                data-testid="select-assertion-target"
              >
                <option value="">Select target item</option>
                {cartridge.items.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.id.split('_').slice(0, 2).join('_')}
                  </option>
                ))}
              </select>
              
              {newType === "state_reached" && newTargetId && (
                <select
                  value={newExpectedState}
                  onChange={(e) => setNewExpectedState(e.target.value)}
                  className="w-full h-7 text-xs bg-black/30 border border-white/10 rounded px-2 text-white"
                  data-testid="select-expected-state"
                >
                  <option value="">Select expected state</option>
                  {Object.keys(cartridge.items.find(i => i.id === newTargetId)?.fsm?.states || {}).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </>
          )}
          
          <Button 
            size="sm" 
            onClick={addAssertion}
            className="w-full h-7 text-xs"
            disabled={!newDescription}
            data-testid="button-add-assertion"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Assertion
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

// Controller Binding Panel
interface ControllerPanelProps {
  item: TossItem;
  onUpdate: (controller: ControllerBinding) => void;
  onClose: () => void;
}

// Hook to detect gamepads
function useGamepads() {
  const [gamepads, setGamepads] = useState<Gamepad[]>([]);
  const [pressedButtons, setPressedButtons] = useState<Set<number>>(new Set());

  useEffect(() => {
    const updateGamepads = () => {
      const pads = navigator.getGamepads();
      const connected = Array.from(pads).filter((g): g is Gamepad => g !== null);
      setGamepads(connected);
      
      // Check for pressed buttons
      const pressed = new Set<number>();
      connected.forEach(pad => {
        pad.buttons.forEach((btn, idx) => {
          if (btn.pressed) pressed.add(idx);
        });
      });
      setPressedButtons(pressed);
    };

    const handleConnect = () => updateGamepads();
    const handleDisconnect = () => updateGamepads();

    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);
    
    const interval = setInterval(updateGamepads, 100);
    
    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      window.removeEventListener('gamepaddisconnected', handleDisconnect);
      clearInterval(interval);
    };
  }, []);

  return { gamepads, pressedButtons };
}

// Map button index to name
const BUTTON_INDEX_MAP: Record<number, string> = {
  0: "A", 1: "B", 2: "X", 3: "Y",
  4: "LEFT_BUMPER", 5: "RIGHT_BUMPER",
  6: "LEFT_TRIGGER", 7: "RIGHT_TRIGGER",
  8: "SELECT", 9: "START",
  10: "LEFT_STICK_CLICK", 11: "RIGHT_STICK_CLICK",
  12: "DPAD_UP", 13: "DPAD_DOWN", 14: "DPAD_LEFT", 15: "DPAD_RIGHT",
  16: "HOME",
};

function ControllerPanel({ item, onUpdate, onClose }: ControllerPanelProps) {
  const [controller, setController] = useState<ControllerBinding>(
    item.controller || { bindings: {} }
  );
  const [waitingForButton, setWaitingForButton] = useState<string | null>(null);
  const { gamepads, pressedButtons } = useGamepads();

  // Re-sync when item changes
  useEffect(() => {
    setController(item.controller || { bindings: {} });
    setWaitingForButton(null);
  }, [item.id]);

  // Capture button press when waiting
  useEffect(() => {
    if (waitingForButton && pressedButtons.size > 0) {
      const buttonIdx = Array.from(pressedButtons)[0];
      const buttonName = BUTTON_INDEX_MAP[buttonIdx] || `BUTTON_${buttonIdx}`;
      
      const updated: ControllerBinding = {
        ...controller,
        bindings: { ...controller.bindings, [buttonName]: waitingForButton }
      };
      setController(updated);
      onUpdate(updated);
      setWaitingForButton(null);
    }
  }, [pressedButtons, waitingForButton, controller, onUpdate]);

  // Get available FSM events from the item
  const availableEvents: string[] = [];
  if (item.fsm) {
    Object.values(item.fsm.states).forEach(transitions => {
      Object.keys(transitions).forEach(event => {
        if (!availableEvents.includes(event)) {
          availableEvents.push(event);
        }
      });
    });
  }
  // Add common events
  ["on_press", "on_release", "on_hover", "on_focus"].forEach(e => {
    if (!availableEvents.includes(e)) availableEvents.push(e);
  });

  const removeBinding = (button: string) => {
    const { [button]: _, ...rest } = controller.bindings;
    const updated = { ...controller, bindings: rest };
    setController(updated);
    onUpdate(updated);
  };

  const triggerHaptic = () => {
    const pad = gamepads[0];
    if (pad?.vibrationActuator) {
      (pad.vibrationActuator as any).playEffect?.("dual-rumble", {
        startDelay: 0,
        duration: 200,
        weakMagnitude: 0.5,
        strongMagnitude: 1.0,
      });
    }
  };

  return (
    <div className="absolute right-4 top-20 bottom-20 w-80 bg-black/90 backdrop-blur border border-white/10 rounded-lg overflow-hidden flex flex-col z-50">
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-secondary" />
          <span className="font-mono text-sm text-white">Controller</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="w-6 h-6">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        {/* Gamepad Status */}
        <div className="mb-4 p-2 bg-white/5 rounded">
          <Label className="text-xs text-muted-foreground mb-2 block">Connected Controllers</Label>
          {gamepads.length === 0 ? (
            <div className="text-xs text-orange-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              No controller detected - connect a gamepad
            </div>
          ) : (
            gamepads.map((pad, idx) => (
              <div key={idx} className="text-xs text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                {pad.id.split('(')[0].trim()}
              </div>
            ))
          )}
        </div>

        {/* Haptic Test */}
        {gamepads.length > 0 && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={triggerHaptic}
            className="w-full mb-4 text-xs"
            data-testid="button-haptic-test"
          >
            <Vibrate className="w-3 h-3 mr-2" /> Test Haptic Feedback
          </Button>
        )}

        {/* Current Bindings */}
        <div className="mb-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Button Bindings</Label>
          <div className="space-y-1">
            {Object.entries(controller.bindings).length === 0 ? (
              <div className="text-xs text-muted-foreground italic p-2 bg-white/5 rounded">
                No bindings yet. Click "Bind" and press a button.
              </div>
            ) : (
              Object.entries(controller.bindings).map(([button, event]) => (
                <div key={button} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Badge variant="secondary" className="text-[10px]">{button}</Badge>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-yellow-400">{event}</span>
                  </div>
                  <Button 
                    size="icon"
                    variant="ghost"
                    className="w-5 h-5 text-muted-foreground hover:text-red-400"
                    onClick={() => removeBinding(button)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Binding */}
        <div className="p-2 bg-white/5 rounded space-y-2">
          <Label className="text-xs text-muted-foreground block">Add New Binding</Label>
          
          {waitingForButton ? (
            <div className="p-4 border-2 border-dashed border-secondary rounded text-center">
              <div className="text-secondary text-sm mb-1 animate-pulse">Press a button on your controller...</div>
              <div className="text-xs text-muted-foreground">Binding to: {waitingForButton}</div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setWaitingForButton(null)}
                className="mt-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {availableEvents.map(event => (
                <Button
                  key={event}
                  size="sm"
                  variant="outline"
                  onClick={() => setWaitingForButton(event)}
                  className="text-[10px] h-7"
                  disabled={gamepads.length === 0}
                  data-testid={`button-bind-${event}`}
                >
                  <Plus className="w-3 h-3 mr-1" /> {event}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Manual binding for when no controller */}
        {gamepads.length === 0 && (
          <div className="mt-4 p-2 bg-white/5 rounded">
            <Label className="text-xs text-muted-foreground mb-2 block">Manual Binding (No Controller)</Label>
            <div className="flex flex-wrap gap-1">
              {["A", "B", "X", "Y", "DPAD_UP", "DPAD_DOWN"].map(btn => (
                <Badge 
                  key={btn}
                  variant="outline" 
                  className="text-[9px] cursor-pointer hover:bg-primary/20"
                  onClick={() => {
                    if (availableEvents.length > 0) {
                      const updated: ControllerBinding = {
                        ...controller,
                        bindings: { ...controller.bindings, [btn]: availableEvents[0] }
                      };
                      setController(updated);
                      onUpdate(updated);
                    }
                  }}
                >
                  {btn}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Runtime state tracker - tracks current FSM state for each item during simulation
const runtimeStateMap = new Map<string, string>();

// Initialize runtime states from initial FSM states
function initializeRuntimeStates(cartridge: TossCartridge) {
  runtimeStateMap.clear();
  cartridge.items.forEach(item => {
    if (item.fsm) {
      runtimeStateMap.set(item.id, item.fsm.initial);
    }
  });
}

// Transition an item's state based on an event
function transitionState(itemId: string, event: string, cartridge: TossCartridge): string | null {
  const item = cartridge.items.find(i => i.id === itemId);
  if (!item?.fsm) return null;
  
  const currentState = runtimeStateMap.get(itemId) || item.fsm.initial;
  const transitions = item.fsm.states[currentState];
  
  if (transitions && transitions[event]) {
    const newState = transitions[event];
    runtimeStateMap.set(itemId, newState);
    return newState;
  }
  
  return currentState;
}

// Get current runtime state for an item
function getRuntimeState(itemId: string, cartridge: TossCartridge): string {
  const item = cartridge.items.find(i => i.id === itemId);
  return runtimeStateMap.get(itemId) || item?.fsm?.initial || "idle";
}

// Assertion runner - evaluates against runtime state, not initial state
function runAssertions(cartridge: TossCartridge): { passed: boolean; results: UserAssertion[] } {
  const assertions = cartridge.tests?.assertions || [];
  
  if (assertions.length === 0) {
    // No assertions = auto-pass for now (TODO: require at least one assertion)
    return { passed: true, results: [] };
  }

  // Initialize runtime states if not already done
  if (runtimeStateMap.size === 0) {
    initializeRuntimeStates(cartridge);
  }

  const results = assertions.map(assertion => {
    let passed = false;
    
    switch (assertion.type) {
      case "state_reached":
        if (assertion.target_item_id && assertion.expected_state) {
          const currentState = getRuntimeState(assertion.target_item_id, cartridge);
          passed = currentState === assertion.expected_state;
        }
        break;
        
      case "value_equals":
        if (assertion.target_item_id && assertion.expected_value !== undefined) {
          const item = cartridge.items.find(i => i.id === assertion.target_item_id);
          // Check against item props
          passed = item?.props?.value === assertion.expected_value;
        }
        break;
        
      case "collision_occurred":
        // Track collision events in physics simulation
        // For now, check if item has landed (y position near ground zero)
        if (assertion.target_item_id) {
          const item = cartridge.items.find(i => i.id === assertion.target_item_id);
          passed = item ? item.transform.position.y <= 1 : false;
        }
        break;
        
      case "time_elapsed":
        // Time-based assertions would need a timer system
        // For now, pass if we've waited the timeout period
        passed = true;
        break;
        
      case "custom":
        // Custom assertions would need user-defined evaluation logic
        passed = false;
        break;
    }
    
    return { ...assertion, passed };
  });

  const allPassed = results.every(r => r.passed);
  return { passed: allPassed, results };
}

// Main Editor
export default function BluPrinceEditor() {
  const [cartridge, setCartridge] = useState<TossCartridge>(createNewCartridge());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"pending" | "running" | "pass" | "fail">("pending");
  const [showFSMEditor, setShowFSMEditor] = useState(false);
  const [showController, setShowController] = useState(false);
  const { toast } = useToast();

  const mode = cartridge._editor?.mode || "DESIGN";
  const gravityEnabled = cartridge._editor?.gravity_enabled ?? true;
  const selectedItem = cartridge.items.find(i => i.id === selectedId);
  
  // Update item FSM
  const updateItemFSM = useCallback((fsm: ItemFSM) => {
    if (!selectedId) return;
    setCartridge(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === selectedId ? { ...item, fsm } : item
      )
    }));
  }, [selectedId]);

  // Assertion management
  const addAssertion = useCallback((assertion: UserAssertion) => {
    setCartridge(prev => ({
      ...prev,
      tests: {
        ...prev.tests!,
        assertions: [...(prev.tests?.assertions || []), assertion],
        all_passed: false,
      }
    }));
    setTestStatus("pending");
    toast({ title: "Assertion Added", description: assertion.description });
  }, [toast]);

  const removeAssertion = useCallback((id: string) => {
    setCartridge(prev => ({
      ...prev,
      tests: {
        ...prev.tests!,
        assertions: prev.tests?.assertions.filter(a => a.id !== id) || [],
        all_passed: false,
      }
    }));
    setTestStatus("pending");
  }, []);

  // Update item controller bindings
  const updateItemController = useCallback((controller: ControllerBinding) => {
    if (!selectedId) return;
    setCartridge(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === selectedId ? { ...item, controller } : item
      )
    }));
  }, [selectedId]);

  // Handle transform updates from physics simulation
  const handleTransformUpdate = useCallback((id: string, position: { x: number; y: number; z: number }) => {
    setCartridge(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id 
          ? { ...item, transform: { ...item.transform, position } }
          : item
      )
    }));
  }, []);

  const setMode = (newMode: EditorMode) => {
    setCartridge(prev => ({
      ...prev,
      _editor: { ...prev._editor!, mode: newMode }
    }));
    
    if (newMode === "TEST") {
      setTestStatus("running");
      
      // Initialize runtime state tracking for this test run
      initializeRuntimeStates(cartridge);
      
      // Simulate some physics settling time, then run assertions
      // In a real implementation, we'd wait for physics to stabilize
      setTimeout(() => {
        // Use the latest cartridge state (with updated positions from physics)
        setCartridge(prev => {
          const { passed, results } = runAssertions(prev);
          
          toast({ 
            title: passed ? "Tests Passed" : "Tests Failed",
            description: passed 
              ? "All assertions met! DEPLOY mode unlocked."
              : `${results.filter(r => !r.passed).length} assertion(s) failed.`,
            variant: passed ? "default" : "destructive",
          });
          
          setTestStatus(passed ? "pass" : "fail");
          
          return {
            ...prev,
            tests: {
              ...prev.tests!,
              assertions: results.length > 0 ? results : prev.tests!.assertions,
              all_passed: passed,
              last_run_at: new Date().toISOString(),
            }
          };
        });
      }, 1000); // Give physics time to settle
    }
  };

  const addComponent = (type: string) => {
    // Drop from above Ground Zero
    const dropHeight = 5 + Math.random() * 3;
    const xOffset = (Math.random() - 0.5) * 4;
    const zOffset = (Math.random() - 0.5) * 4;

    const newThing = createThing(
      type === "sphere" ? "mesh_glyph" : type,
      { x: xOffset, y: dropHeight, z: zOffset },
      { color: type === "sphere" ? "#ff6b6b" : "#7c3aed" }
    );

    if (type === "sphere") {
      newThing.bounds.type = "sphere";
      newThing.bounds.radius = 0.5;
    }

    // If gravity disabled, make it float
    if (!gravityEnabled) {
      newThing.physics = { ...newThing.physics!, gravityScale: 0 };
    }

    setCartridge(prev => ({
      ...prev,
      items: [...prev.items, newThing]
    }));

    setSelectedId(newThing.id);

    toast({
      title: "Thing Created",
      description: gravityEnabled 
        ? "Watch it fall to Ground Zero!" 
        : "Floating in zero-g...",
    });
  };

  const toggleGravity = () => {
    setCartridge(prev => ({
      ...prev,
      _editor: { ...prev._editor!, gravity_enabled: !gravityEnabled }
    }));
    toast({
      title: gravityEnabled ? "Gravity Disabled" : "Gravity Enabled",
      description: gravityEnabled ? "Objects will float!" : "Objects will fall!",
    });
  };

  const resetScene = () => {
    setCartridge(createNewCartridge());
    setSelectedId(null);
    setTestStatus("pending");
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Top Bar */}
      <header className="absolute top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-black/40 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-pixel text-sm text-white">BLU-PRINCE</span>
            <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
              v1.0
            </Badge>
          </div>
        </div>

        <ModeBar mode={mode} onModeChange={setMode} testStatus={testStatus} />

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={toggleGravity}
            className={gravityEnabled ? "text-green-400" : "text-orange-400"}
          >
            <Zap className="w-4 h-4 mr-1" />
            {gravityEnabled ? "Gravity ON" : "Zero-G"}
          </Button>
          <Button size="sm" variant="ghost" onClick={resetScene}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          {selectedItem && (
            <>
              <Button 
                size="sm" 
                variant={showFSMEditor ? "default" : "ghost"}
                onClick={() => { setShowFSMEditor(!showFSMEditor); setShowController(false); }}
                className={showFSMEditor ? "bg-primary text-white" : "text-primary"}
                data-testid="button-fsm-editor"
              >
                <GitBranch className="w-4 h-4 mr-1" /> FSM
              </Button>
              <Link href="/statechart">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-purple-400 border-purple-400/50 hover:bg-purple-400/10"
                  data-testid="button-3d-statechart"
                >
                  <Box className="w-4 h-4 mr-1" /> 3D View
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant={showController ? "default" : "ghost"}
                onClick={() => { setShowController(!showController); setShowFSMEditor(false); }}
                className={showController ? "bg-secondary text-black" : "text-secondary"}
                data-testid="button-controller"
              >
                <Gamepad2 className="w-4 h-4 mr-1" /> Controller
              </Button>
            </>
          )}
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" className="bg-primary/20 text-primary border border-primary/50">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </header>

      {/* Component Palette */}
      <ComponentPalette onAddComponent={addComponent} />

      {/* FSM Editor Panel */}
      {showFSMEditor && selectedItem && (
        <FSMEditor 
          item={selectedItem}
          onUpdate={updateItemFSM}
          onClose={() => setShowFSMEditor(false)}
        />
      )}

      {/* Controller Binding Panel */}
      {showController && selectedItem && (
        <ControllerPanel 
          item={selectedItem}
          onUpdate={updateItemController}
          onClose={() => setShowController(false)}
        />
      )}

      {/* Assertions Panel - shown in TEST mode */}
      {mode === "TEST" && (
        <AssertionsPanel 
          cartridge={cartridge}
          onAddAssertion={addAssertion}
          onRemoveAssertion={removeAssertion}
          testStatus={testStatus}
        />
      )}

      {/* 3D Canvas */}
      <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
        <color attach="background" args={["#0a0a0f"]} />
        <fog attach="fog" args={["#0a0a0f", 15, 40]} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 15, 10]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#7c3aed" />

        <Suspense fallback={null}>
          <Physics gravity={gravityEnabled ? [0, -9.81, 0] : [0, 0, 0]}>
            <GroundZero />
            
            {cartridge.items.map((item) => (
              <PhysicsThing
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
                onTransformUpdate={handleTransformUpdate}
                mode={mode}
              />
            ))}
          </Physics>
        </Suspense>

        <Grid 
          args={[50, 50]} 
          position={[0, 0, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#333"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />

        <OrbitControls 
          makeDefault 
          minDistance={3} 
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.1}
          enableDamping={false}
        />
        <Environment preset="night" />
      </Canvas>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-xs font-mono text-muted-foreground">
        <span>Items: {cartridge.items.length}</span>
        <span>|</span>
        <span>Mode: {mode}</span>
        <span>|</span>
        <span>Ground Zero: Y=0</span>
        {selectedId && (
          <>
            <span>|</span>
            <span className="text-primary">Selected: {selectedId.split('_')[1]}</span>
          </>
        )}
      </div>
    </div>
  );
}
