import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Text, Html, Float, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { TossFile } from "@/lib/toss";
import { TingOsEngine, RuntimeState } from "@/lib/engine";
import { getAllCartridges } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, RefreshCw, Zap } from "lucide-react";
import { Link } from "wouter";

// --- 3D COMPONENTS ---

const DeviceShell = ({ children }: { children: React.ReactNode }) => {
  return (
    <group>
      {/* Main Body */}
      <RoundedBox args={[4, 6, 0.5]} radius={0.2} smoothness={4} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.8} />
      </RoundedBox>
      
      {/* Screen Bezel */}
      <RoundedBox args={[3.6, 3.6, 0.1]} radius={0.1} position={[0, 0.8, 0.26]}>
        <meshStandardMaterial color="#000000" roughness={0.2} metalness={0.9} />
      </RoundedBox>

      {/* The Screen Content (HTML overlay or Canvas texture) */}
      <group position={[0, 0.8, 0.32]}>
        {children}
      </group>

      {/* Physical Controls Area */}
      <group position={[0, -1.8, 0.26]}>
        <DeviceButton position={[-1, 0, 0]} color="#ff0055" label="A" />
        <DeviceButton position={[1, 0, 0]} color="#00ccff" label="B" />
        
        {/* D-Pad approximation */}
        <RoundedBox args={[0.8, 0.8, 0.1]} radius={0.1} position={[-0, 0, 0]}>
           <meshStandardMaterial color="#333" />
        </RoundedBox>
      </group>
    </group>
  );
};

const DeviceButton = ({ position, color, label, onClick }: any) => {
  const [hovered, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <group position={position}>
      <RoundedBox 
        args={[0.6, 0.6, 0.2]} 
        radius={0.3} 
        position={[0, 0, pressed ? -0.05 : 0]}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        onPointerDown={() => { setPressed(true); onClick?.(); }}
        onPointerUp={() => setPressed(false)}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={hovered ? 0.8 : 0.2} 
        />
      </RoundedBox>
      <Text position={[0, -0.5, 0]} fontSize={0.2} color="white">
        {label}
      </Text>
    </group>
  );
};

// --- SCREEN RENDERER (The "TingOs" UI Layer) ---

const ScreenContent = ({ engineState }: { engineState: RuntimeState | null }) => {
  if (!engineState) return (
    <Html transform scale={0.2} position={[0, 0, 0]}>
      <div className="w-[320px] h-[240px] bg-black flex items-center justify-center text-green-500 font-mono text-xs">
        <div className="animate-pulse">BOOTING KERNEL...</div>
      </div>
    </Html>
  );

  return (
    <Html transform scale={0.2} position={[0, 0, 0]}>
      <div className="w-[320px] h-[240px] bg-black border-none p-0 font-mono text-xs text-white overflow-hidden relative flex flex-col">
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
        
        {/* Status Bar - Compact & Full Width */}
        <div className="flex justify-between bg-white/10 px-2 py-1 text-[8px] uppercase tracking-wider shrink-0">
          <span>TING_OS_RUNTIME</span>
          <span>GRP:MAIN • ID:DEMO</span>
        </div>

        {/* Main Content Area - FILLS SPACE */}
        <div className="flex-1 flex flex-col p-2 overflow-y-auto">
          {/* Example of "Collection" filling width */}
          <div className="w-full bg-primary/20 border border-primary/50 p-2 mb-2 rounded flex items-center justify-between">
             <span className="font-bold text-primary">{engineState.currentStateId.toUpperCase()}</span>
             <span className="animate-pulse w-2 h-2 bg-primary rounded-full"></span>
          </div>

          <div className="w-full flex-1 border border-white/10 rounded p-2 bg-white/5 flex flex-col items-center justify-center text-center">
             <p className="text-white/80 leading-relaxed">
               Content centered and filling available viewport space.
             </p>
             <p className="text-[10px] text-muted-foreground mt-2">
               Grouping Logic: Active
             </p>
          </div>
        </div>

        {/* Context Debug - Minimal Footer */}
        <div className="shrink-0 bg-black border-t border-white/10 px-2 py-1 text-[8px] font-mono text-muted-foreground truncate">
          CTX: {JSON.stringify(engineState.context)}
        </div>
      </div>
    </Html>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function RuntimeSimulator() {
  const [engine, setEngine] = useState<TingOsEngine | null>(null);
  const [engineState, setEngineState] = useState<RuntimeState | null>(null);
  const [cartridges, setCartridges] = useState<any[]>([]);
  const [selectedCartridgeId, setSelectedCartridgeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load available cartridges
  useEffect(() => {
    async function loadCartridges() {
      try {
        const data = await getAllCartridges();
        setCartridges(data);
        if (data.length > 0) {
          setSelectedCartridgeId(data[0].tngli_id);
        }
      } catch (error) {
        console.error("Failed to load cartridges:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadCartridges();
  }, []);

  useEffect(() => {
    if (!selectedCartridgeId) return;

    const selectedCartridge = cartridges.find(c => c.tngli_id === selectedCartridgeId);
    if (!selectedCartridge) return;

    // 1. Load the selected cartridge's TOSS file
    const tossFile: TossFile = selectedCartridge.toss_file;

    // Fallback mock if no cartridges exist
    const mockFile: TossFile = {
      manifest: {
        id: "demo",
        tngli_id: "demo",
        spec_version: "1.0",
        meta: { title: "Demo Cart", version: "1.0", description: "Test", author: "User" }
      },
      logic: {
        initial: "idle",
        states: {
          "idle": {
            id: "idle",
            type: "state",
            on_entry: ["LOG:Ready"],
            transitions: [
              { event: "BUTTON_A", target: "active", action: ["LOG:ButtonPressed"] }
            ]
          },
          "active": {
            id: "active",
            type: "state",
            on_entry: ["LOG:Working..."],
            transitions: [
              { event: "BUTTON_B", target: "idle", action: ["LOG:Reset"] }
            ]
          }
        }
      },
      memory: { schema: {} },
      assets: {}
    };

    const fileToRun = selectedCartridge ? tossFile : mockFile;

    // 2. Initialize Engine
    const newEngine = new TingOsEngine(fileToRun);
    setEngine(newEngine);

    // 3. Subscribe
    const unsub = newEngine.subscribe((state) => {
      setEngineState(state);
    });

    // 4. Start
    newEngine.start();

    return () => { unsub(); };
  }, [selectedCartridgeId, cartridges]);

  const handleButtonPress = (btn: string) => {
    if (engine) {
      engine.send(`BUTTON_${btn}`);
    }
  };

  return (
    <div className="w-full h-screen bg-[#050505] relative overflow-hidden">
      <div className="absolute top-4 left-4 z-50 flex gap-4 items-center">
        <Link href="/">
          <Button variant="ghost" className="text-white gap-2">
            <ArrowLeft className="w-4 h-4" /> Exit Simulator
          </Button>
        </Link>
        
        {!isLoading && cartridges.length > 0 && (
          <Select value={selectedCartridgeId || undefined} onValueChange={setSelectedCartridgeId}>
            <SelectTrigger className="w-[250px] bg-black/50 border-white/20 text-white">
              <SelectValue placeholder="Select Cartridge" />
            </SelectTrigger>
            <SelectContent>
              {cartridges.map((cart) => (
                <SelectItem key={cart.tngli_id} value={cart.tngli_id}>
                  {cart.title} v{cart.version}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 10, 20]} />
        
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#primary" />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <DeviceShell>
            <ScreenContent engineState={engineState} />
            
            {/* Interactive Areas mapped to 3D space */}
            <group position={[0, -1.8, 0.26]}>
              {/* Invisible click targets for the engine mapping */}
              <mesh position={[-1, 0, 0]} visible={false} onClick={() => handleButtonPress('A')}>
                <boxGeometry args={[0.6, 0.6, 0.2]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
              <mesh position={[1, 0, 0]} visible={false} onClick={() => handleButtonPress('B')}>
                <boxGeometry args={[0.6, 0.6, 0.2]} />
                <meshBasicMaterial transparent opacity={0} />
              </mesh>
            </group>
          </DeviceShell>
        </Float>

        <Environment preset="city" />
        <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center text-xs text-muted-foreground font-mono">
        <p>INTERACTIVE DEVICE SIMULATOR • THREE.JS RENDERER</p>
        <p className="opacity-50">Use A/B Buttons to Trigger Transitions</p>
      </div>
    </div>
  );
}
