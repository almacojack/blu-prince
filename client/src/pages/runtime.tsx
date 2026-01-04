import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Text, Html, Float, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { TossFile } from "@/lib/toss";
import { TingOsEngine, RuntimeState } from "@/lib/engine";
import { getAllCartridges, saveCartridge } from "@/lib/api";
import { getCommandRouter, CommandResult } from "@/lib/command-router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Play, RefreshCw, Zap, Maximize2, Minimize2, Terminal, ChevronUp, ChevronDown, Plus, X, Package } from "lucide-react";
import { useSearch } from "wouter";

import todoCartridge from "@/lib/toss-examples/todo-app.toss.json";
import journalCartridge from "@/lib/toss-examples/journal.toss.json";
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

const ScreenContent = ({ engineState, scale = 0.2 }: { engineState: RuntimeState | null; scale?: number }) => {
  if (!engineState) return (
    <Html transform scale={scale} position={[0, 0, 0]}>
      <div className="w-[320px] h-[240px] bg-black flex items-center justify-center text-green-500 font-mono text-xs">
        <div className="animate-pulse">BOOTING KERNEL...</div>
      </div>
    </Html>
  );

  return (
    <Html transform scale={scale} position={[0, 0, 0]}>
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

// Fullscreen 2D screen content (bypasses 3D device shell)
const FullscreenContent = ({ engineState, onButtonPress }: { engineState: RuntimeState | null; onButtonPress: (btn: string) => void }) => {
  if (!engineState) return (
    <div className="w-full h-full bg-black flex items-center justify-center text-green-500 font-mono text-2xl">
      <div className="animate-pulse">BOOTING KERNEL...</div>
    </div>
  );

  return (
    <div className="w-full h-full bg-black p-0 font-mono text-white overflow-hidden relative flex flex-col">
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
      
      {/* Status Bar */}
      <div className="flex justify-between bg-white/10 px-4 py-2 text-sm uppercase tracking-wider shrink-0">
        <span>TING_OS_RUNTIME</span>
        <span>GRP:MAIN • ID:DEMO</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="w-full bg-primary/20 border border-primary/50 p-4 mb-4 rounded flex items-center justify-between">
           <span className="font-bold text-primary text-2xl">{engineState.currentStateId.toUpperCase()}</span>
           <span className="animate-pulse w-4 h-4 bg-primary rounded-full"></span>
        </div>

        <div className="w-full flex-1 border border-white/10 rounded p-6 bg-white/5 flex flex-col items-center justify-center text-center">
           <p className="text-white/80 leading-relaxed text-xl">
             Content centered and filling available viewport space.
           </p>
           <p className="text-sm text-muted-foreground mt-4">
             Grouping Logic: Active
           </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="shrink-0 bg-black/80 border-t border-white/10 px-6 py-4 flex items-center justify-center gap-6">
        <button
          onClick={() => onButtonPress('A')}
          className="w-16 h-16 rounded-full bg-[#ff0055] hover:bg-[#ff3377] text-white font-bold text-xl shadow-lg shadow-[#ff0055]/30 active:scale-95 transition-all"
          data-testid="button-sim-a"
        >
          A
        </button>
        <button
          onClick={() => onButtonPress('B')}
          className="w-16 h-16 rounded-full bg-[#00ccff] hover:bg-[#33ddff] text-white font-bold text-xl shadow-lg shadow-[#00ccff]/30 active:scale-95 transition-all"
          data-testid="button-sim-b"
        >
          B
        </button>
      </div>

      {/* Context Debug Footer */}
      <div className="shrink-0 bg-black border-t border-white/10 px-4 py-2 text-xs font-mono text-muted-foreground truncate">
        CTX: {JSON.stringify(engineState.context)}
      </div>
    </div>
  );
};

// --- CLI PANEL ---

interface CliHistoryEntry {
  type: "input" | "output" | "error";
  text: string;
  timestamp: Date;
}

interface CliPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

const CliPanel = ({ isOpen, onToggle }: CliPanelProps) => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<CliHistoryEntry[]>([
    { type: "output", text: "TingOS Shell v1.0 - Type 'help' for commands", timestamp: new Date() }
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = getCommandRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const addOutput = (text: string, type: "output" | "error" = "output") => {
    setHistory(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const executeCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    
    setHistory(prev => [...prev, { type: "input", text: cmd, timestamp: new Date() }]);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);
    setInput("");

    // Built-in commands
    if (cmd === "help") {
      addOutput("Built-in commands:");
      addOutput("  help     - Show this help");
      addOutput("  path     - Show current PATH");
      addOutput("  clear    - Clear terminal");
      addOutput("  mounts   - List mounted cartridges");
      addOutput("");
      
      const commands = router.getAllCommands();
      if (commands.length === 0) {
        addOutput("No cartridge commands available (mount a cartridge first)");
      } else {
        addOutput("Cartridge commands:");
        commands.forEach(c => {
          const aliases = c.command.aliases?.length ? ` (${c.command.aliases.join(", ")})` : "";
          addOutput(`  ${c.source.namespace}:${c.command.tngli_id.padEnd(10)} - ${c.command.description}${aliases}`);
        });
      }
      return;
    }
    
    if (cmd === "mounts") {
      const ids = router.getMountedIds();
      if (ids.length === 0) {
        addOutput("No cartridges mounted");
      } else {
        addOutput(`Mounted cartridges (${ids.length}):`);
        ids.forEach((id, i) => addOutput(`  ${i === 0 ? "[BOOT] " : "       "}${id}`));
      }
      return;
    }

    if (cmd === "path") {
      const path = router.getPath();
      if (path.length === 0) {
        addOutput("PATH is empty (no cartridges mounted)");
      } else {
        addOutput(`PATH: ${path.join(":")}`);
      }
      return;
    }

    if (cmd === "clear") {
      setHistory([]);
      return;
    }

    // Try to resolve and execute command
    const result = await router.execute(cmd);
    if (result.success) {
      if (result.output) {
        addOutput(JSON.stringify(result.output, null, 2));
      } else {
        addOutput("OK");
      }
    } else {
      addOutput(result.error || "Unknown error", "error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 bg-black/95 border-t border-primary/30 transition-all duration-300 ${isOpen ? "h-64" : "h-10"}`}
      data-testid="cli-panel"
    >
      {/* Toggle Bar */}
      <button
        onClick={onToggle}
        className="w-full h-10 flex items-center justify-between px-4 text-primary/80 hover:text-primary hover:bg-white/5 transition-colors"
        data-testid="button-toggle-cli"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="font-mono text-sm">TingOS Shell</span>
          <span className="text-xs text-muted-foreground ml-2">
            PATH: {router.getPath().join(":") || "(empty)"}
          </span>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {/* Terminal Content */}
      {isOpen && (
        <div className="h-[calc(100%-2.5rem)] flex flex-col">
          {/* Output Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 font-mono text-sm"
          >
            {history.map((entry, i) => (
              <div 
                key={i} 
                className={`${
                  entry.type === "input" ? "text-primary" : 
                  entry.type === "error" ? "text-red-400" : "text-white/80"
                }`}
              >
                {entry.type === "input" ? (
                  <span><span className="text-green-400">{">"}</span> {entry.text}</span>
                ) : (
                  <span>{entry.text}</span>
                )}
              </div>
            ))}
          </div>

          {/* Input Line */}
          <div className="flex items-center border-t border-white/10 px-3 py-2">
            <span className="text-green-400 font-mono mr-2">{">"}</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
              placeholder="Type command..."
              autoComplete="off"
              spellCheck={false}
              data-testid="input-cli-command"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const EXAMPLE_CARTRIDGES = [
  { tngli_id: "todo_app", toss: todoCartridge as unknown as TossFile },
  { tngli_id: "journal", toss: journalCartridge as unknown as TossFile },
];

export default function RuntimeSimulator() {
  const [engine, setEngine] = useState<TingOsEngine | null>(null);
  const [engineState, setEngineState] = useState<RuntimeState | null>(null);
  const [cartridges, setCartridges] = useState<any[]>([]);
  const [selectedCartridgeId, setSelectedCartridgeId] = useState<string | null>(null);
  const [mountedCartridgeIds, setMountedCartridgeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreenMode, setFullscreenMode] = useState(true);
  const [cliOpen, setCliOpen] = useState(false);
  const router = getCommandRouter();
  
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const cartFromUrl = urlParams.get("cart");

  useEffect(() => {
    async function seedAndLoadCartridges() {
      try {
        for (const example of EXAMPLE_CARTRIDGES) {
          try {
            await saveCartridge(example.toss);
          } catch (e) {
          }
        }

        const data = await getAllCartridges();
        setCartridges(data);
        
        if (cartFromUrl) {
          const found = data.find((c: any) => c.tngli_id === cartFromUrl);
          if (found) {
            setSelectedCartridgeId(cartFromUrl);
          } else if (data.length > 0) {
            setSelectedCartridgeId(data[0].tngli_id);
          }
        } else if (data.length > 0) {
          setSelectedCartridgeId(data[0].tngli_id);
        }
      } catch (error) {
        console.error("Failed to load cartridges:", error);
      } finally {
        setIsLoading(false);
      }
    }
    seedAndLoadCartridges();
  }, [cartFromUrl]);

  // Mount/unmount cartridges to the CommandRouter
  useEffect(() => {
    // Clear all mounts using public API
    router.clearMounts();

    // Mount all selected cartridges
    mountedCartridgeIds.forEach((id, index) => {
      const cart = cartridges.find(c => c.tngli_id === id);
      if (cart?.toss_file) {
        router.mount(cart.toss_file, id, {
          namespace: id,
          priority: index,
          asBoot: index === 0
        });
      }
    });
  }, [mountedCartridgeIds, cartridges, router]);

  // Toggle mounting a cartridge
  const toggleMountCartridge = useCallback((tngli_id: string) => {
    setMountedCartridgeIds(prev => {
      if (prev.includes(tngli_id)) {
        return prev.filter(id => id !== tngli_id);
      } else {
        return [...prev, tngli_id];
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedCartridgeId) return;

    const selectedCartridge = cartridges.find(c => c.tngli_id === selectedCartridgeId);
    if (!selectedCartridge) return;

    // Auto-mount the selected cartridge if not already mounted
    if (!mountedCartridgeIds.includes(selectedCartridgeId)) {
      setMountedCartridgeIds([selectedCartridgeId]);
    }

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
      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
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

        {/* Mounted Cartridges (Multi-Cart) */}
        {mountedCartridgeIds.length > 0 && (
          <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
            <Package className="w-4 h-4 text-primary" />
            <span className="text-xs text-white/60">Mounted:</span>
            {mountedCartridgeIds.map(id => {
              const cart = cartridges.find(c => c.tngli_id === id);
              return (
                <div 
                  key={id}
                  className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full"
                  data-testid={`chip-mounted-cart-${id}`}
                >
                  <span className="truncate max-w-[80px]">{cart?.title || id}</span>
                  <button
                    onClick={() => toggleMountCartridge(id)}
                    className="hover:bg-primary/30 rounded-full p-0.5"
                    data-testid={`button-unmount-${id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {/* Add more cartridges */}
            {cartridges.filter(c => !mountedCartridgeIds.includes(c.tngli_id)).length > 0 && (
              <Select onValueChange={toggleMountCartridge}>
                <SelectTrigger className="w-8 h-6 bg-transparent border-none p-0">
                  <Plus className="w-4 h-4 text-white/60 hover:text-primary" />
                </SelectTrigger>
                <SelectContent>
                  {cartridges
                    .filter(c => !mountedCartridgeIds.includes(c.tngli_id))
                    .map(cart => (
                      <SelectItem key={cart.tngli_id} value={cart.tngli_id}>
                        {cart.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Fullscreen Toggle */}
        <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreenMode(!fullscreenMode)}
            className="text-white gap-2 h-8"
            data-testid="button-toggle-fullscreen"
          >
            {fullscreenMode ? (
              <>
                <Minimize2 className="w-4 h-4" /> Device View
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" /> Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Fullscreen Mode - 2D content fills screen */}
      {fullscreenMode ? (
        <div className="absolute inset-0 top-14 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <FullscreenContent engineState={engineState} onButtonPress={handleButtonPress} />
          </div>
          <CliPanel isOpen={cliOpen} onToggle={() => setCliOpen(!cliOpen)} />
        </div>
      ) : (
        /* Device Mode - 3D handheld mockup */
        <>
          <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 20]} />
            
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c3aed" />

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
        </>
      )}
    </div>
  );
}
