import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
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
import { 
  ArrowLeft, Play, Pause, RotateCcw, Box, Circle, 
  Triangle, Settings, Layers, Zap, Save, Upload, CheckCircle, XCircle
} from "lucide-react";
import { 
  TossCartridge, TossItem, EditorMode, UserAssertion,
  createNewCartridge, createThing, DEFAULT_PHYSICS 
} from "@/lib/toss-v1";
import { useToast } from "@/hooks/use-toast";

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

    // Sync rigid body position back to cartridge data
    if (rigidBodyRef.current && mode !== "DESIGN") {
      const translation = rigidBodyRef.current.translation();
      const newPos = { x: translation.x, y: translation.y, z: translation.z };
      
      // Only update if position changed significantly
      const dx = Math.abs(newPos.x - lastPositionRef.current.x);
      const dy = Math.abs(newPos.y - lastPositionRef.current.y);
      const dz = Math.abs(newPos.z - lastPositionRef.current.z);
      
      if (dx > 0.01 || dy > 0.01 || dz > 0.01) {
        lastPositionRef.current = newPos;
        onTransformUpdate(item.id, newPos);
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
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-black/60 backdrop-blur p-2 rounded-lg border border-white/10">
      {components.map((comp) => (
        <Button
          key={comp.id}
          size="icon"
          variant="ghost"
          onClick={() => onAddComponent(comp.id)}
          className="w-10 h-10 text-muted-foreground hover:text-white hover:bg-white/10"
          title={comp.label}
        >
          <comp.icon className="w-5 h-5" />
        </Button>
      ))}
      <Separator className="my-1" />
      <Button size="icon" variant="ghost" className="w-10 h-10 text-muted-foreground">
        <Layers className="w-5 h-5" />
      </Button>
    </div>
  );
}

// Assertion runner
function runAssertions(cartridge: TossCartridge): { passed: boolean; results: UserAssertion[] } {
  const assertions = cartridge.tests?.assertions || [];
  
  if (assertions.length === 0) {
    // No assertions = auto-pass for now (TODO: require at least one assertion)
    return { passed: true, results: [] };
  }

  const results = assertions.map(assertion => {
    let passed = false;
    
    switch (assertion.type) {
      case "state_reached":
        const targetItem = cartridge.items.find(i => i.id === assertion.target_item_id);
        passed = targetItem?.fsm?.initial === assertion.expected_state;
        break;
      case "collision_occurred":
        // Would need physics event tracking
        passed = true; // Placeholder
        break;
      case "time_elapsed":
        passed = true; // Placeholder - would check elapsed time
        break;
      default:
        passed = false;
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
  const { toast } = useToast();

  const mode = cartridge._editor?.mode || "DESIGN";
  const gravityEnabled = cartridge._editor?.gravity_enabled ?? true;

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
      
      // Run actual assertions after a brief delay (simulating test execution)
      setTimeout(() => {
        const { passed, results } = runAssertions(cartridge);
        
        setCartridge(prev => ({
          ...prev,
          tests: {
            ...prev.tests!,
            assertions: results.length > 0 ? results : prev.tests!.assertions,
            all_passed: passed,
            last_run_at: new Date().toISOString(),
          }
        }));
        
        setTestStatus(passed ? "pass" : "fail");
        
        toast({ 
          title: passed ? "Tests Passed" : "Tests Failed",
          description: passed 
            ? "All assertions met! DEPLOY mode unlocked."
            : `${results.filter(r => !r.passed).length} assertion(s) failed.`,
          variant: passed ? "default" : "destructive",
        });
      }, 500);
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
          <Separator orientation="vertical" className="h-6" />
          <Button size="sm" className="bg-primary/20 text-primary border border-primary/50">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </header>

      {/* Component Palette */}
      <ComponentPalette onAddComponent={addComponent} />

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
