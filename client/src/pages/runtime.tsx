import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Text, Html, Float, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { TossFile } from "@/lib/toss";
import { TingOsEngine, RuntimeState } from "@/lib/engine";
import { Button } from "@/components/ui/button";
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
      <div className="w-[320px] h-[240px] bg-black border-2 border-white/10 p-4 font-mono text-xs text-white overflow-hidden relative">
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
        
        {/* Status Bar */}
        <div className="flex justify-between border-b border-white/20 pb-1 mb-2">
          <span>TING_OS v1.0</span>
          <span>BAT: 98%</span>
        </div>

        {/* Main Content Area */}
        <div className="h-[160px] flex flex-col items-center justify-center text-center space-y-4">
          <div className="text-xl font-bold text-primary animate-pulse">
            {engineState.currentStateId.toUpperCase()}
          </div>
          <div className="text-muted-foreground">
            Waiting for input...
          </div>
        </div>

        {/* Context Debug */}
        <div className="absolute bottom-0 left-0 w-full bg-white/10 p-1 text-[10px]">
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

  useEffect(() => {
    // 1. Create a Mock Cartridge
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

    // 2. Initialize Engine
    const newEngine = new TingOsEngine(mockFile);
    setEngine(newEngine);

    // 3. Subscribe
    const unsub = newEngine.subscribe((state) => {
      setEngineState(state);
    });

    // 4. Start
    newEngine.start();

    return () => { unsub(); };
  }, []);

  const handleButtonPress = (btn: string) => {
    if (engine) {
      engine.send(`BUTTON_${btn}`);
    }
  };

  return (
    <div className="w-full h-screen bg-[#050505] relative overflow-hidden">
      <div className="absolute top-4 left-4 z-50">
        <Link href="/">
          <Button variant="ghost" className="text-white gap-2">
            <ArrowLeft className="w-4 h-4" /> Exit Simulator
          </Button>
        </Link>
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
