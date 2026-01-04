import React, { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Text, Html, Float, PerspectiveCamera, Environment, ContactShadows } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import { TossFile } from "@/lib/toss";
import { TingOsEngine, RuntimeState } from "@/lib/engine";
import { getAllCartridges, saveCartridge } from "@/lib/api";
import { getCommandRouter, CommandResult } from "@/lib/command-router";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, RefreshCw, Zap, Maximize2, Minimize2, Terminal, ChevronUp, ChevronDown, Plus, X, Package, Gamepad2, FlaskConical, Timer, Wifi, Thermometer, Mouse, Send, Sparkles, Eye, Activity, Layers } from "lucide-react";
import { EventConsole } from "@/components/EventConsole";
import { DraggablePanel } from "@/components/DraggablePanel";
import { VirtualHandheld } from "@/components/VirtualHandheld";
import { GamepadInput } from "@/hooks/use-gamepad";
import { useSearch } from "wouter";
import { SimulatorPreview } from "@/components/SimulatorPreview";
import { CartridgeBrowser, CartridgeEntry } from "@/components/CartridgeBrowser";
import { Library } from "lucide-react";

import todoCartridge from "@/lib/toss-examples/todo-app.toss.json";
import journalCartridge from "@/lib/toss-examples/journal.toss.json";
import { Link } from "wouter";

// --- SPLASH SCREEN ---

interface SplashScreenProps {
  title: string;
  author: string;
  onComplete: () => void;
}

const SplashScreen = ({ title, author, onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"rainbow" | "logo" | "done">("rainbow");
  
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("logo"), 1200);
    const timer2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  // Atari-style rainbow colors
  const rainbowColors = [
    "#ff0000", "#ff4400", "#ff8800", "#ffcc00", "#ffff00",
    "#88ff00", "#00ff00", "#00ff88", "#00ffff", "#0088ff",
    "#0000ff", "#4400ff", "#8800ff", "#ff00ff", "#ff0088"
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Rainbow Stripes Animation */}
      <div className="absolute inset-0 overflow-hidden">
        {rainbowColors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-8"
            style={{
              backgroundColor: color,
              top: `${(i / rainbowColors.length) * 100}%`,
              opacity: 0.9,
            }}
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ 
              x: phase === "rainbow" ? "0%" : "100%",
              opacity: phase === "rainbow" ? 0.8 : 0,
            }}
            transition={{
              delay: i * 0.05,
              duration: 0.8,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* TingOs Logo & Cartridge Info */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: phase !== "rainbow" ? 1 : 0,
          scale: phase !== "rainbow" ? 1 : 0.8,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* TingOs Branding */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,255,0.5)]">
            <span className="text-3xl font-bold text-white">T</span>
          </div>
          <div className="text-left">
            <div className="text-3xl font-bold tracking-tight">
              <span className="text-cyan-400">Ting</span>
              <span className="text-purple-400">Os</span>
            </div>
            <div className="text-xs text-gray-500 font-mono">RUNTIME v1.1</div>
          </div>
        </div>

        {/* Cartridge Label - Paper texture style */}
        <motion.div
          className="relative"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {/* Paper label with texture */}
          <div 
            className="relative px-12 py-6 rounded-lg overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #f5f0e6 0%, #e8e0d0 50%, #f0ebe2 100%)",
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {/* Horizontal ridges/lines for paper texture */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute left-0 right-0 h-px bg-gray-400"
                  style={{ top: `${8 + i * 8}%` }}
                />
              ))}
            </div>
            
            {/* Title & Author */}
            <div className="relative text-center">
              <h1 className="text-2xl font-bold text-gray-800 tracking-wide mb-1">
                {title}
              </h1>
              <p className="text-sm text-gray-600">
                by <span className="font-medium">{author}</span>
              </p>
            </div>
          </div>
          
          {/* Cartridge body behind label */}
          <div 
            className="absolute -inset-x-4 -inset-y-2 -z-10 rounded-xl"
            style={{
              background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #222222 100%)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            }}
          />
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          className="flex items-center gap-2 text-cyan-400/80 font-mono text-sm"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Zap className="w-4 h-4" />
          LOADING CARTRIDGE...
        </motion.div>
      </motion.div>
    </div>
  );
};

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

const ScreenContent = ({ engineState, cartridge, scale = 0.2 }: { engineState: RuntimeState | null; cartridge?: any; scale?: number }) => {
  if (!engineState) return (
    <Html transform scale={scale} position={[0, 0, 0]}>
      <div className="w-[320px] h-[240px] bg-black flex items-center justify-center text-green-500 font-mono text-xs">
        <div className="animate-pulse">BOOTING KERNEL...</div>
      </div>
    </Html>
  );

  const title = cartridge?.title || "Cartridge";
  const stateLabel = engineState.currentStateId.replace(/_/g, " ").toUpperCase();

  return (
    <Html transform scale={scale} position={[0, 0, 0]}>
      <div className="w-[320px] h-[240px] bg-black border-none p-0 font-mono text-xs text-white overflow-hidden relative flex flex-col">
        {/* Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
        
        {/* Status Bar */}
        <div className="flex justify-between bg-cyan-500/20 px-2 py-1 text-[8px] uppercase tracking-wider shrink-0 border-b border-cyan-500/30">
          <span className="text-cyan-400">{title}</span>
          <span className="text-cyan-400/60">v{cartridge?.version || "1.0"}</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-2 overflow-y-auto">
          {/* Current State Display */}
          <div className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 p-2 mb-2 rounded flex items-center justify-between">
             <span className="font-bold text-cyan-400">{stateLabel}</span>
             <span className="animate-pulse w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#00ffff]"></span>
          </div>

          {/* Context Variables */}
          <div className="w-full flex-1 border border-white/10 rounded p-2 bg-white/5 overflow-y-auto">
            <div className="text-[8px] text-gray-500 uppercase mb-1">Context</div>
            {Object.entries(engineState.context || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between text-[10px] py-0.5 border-b border-white/5 last:border-0">
                <span className="text-gray-400">{key}:</span>
                <span className="text-cyan-300 truncate max-w-[150px]">
                  {typeof value === 'object' ? JSON.stringify(value).slice(0, 30) : String(value)}
                </span>
              </div>
            ))}
            {Object.keys(engineState.context || {}).length === 0 && (
              <div className="text-gray-500 text-[10px] italic">No context variables</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-black border-t border-white/10 px-2 py-1 text-[8px] font-mono text-gray-600 flex justify-between">
          <span>TingOs Runtime</span>
          <span>Press A/B to interact</span>
        </div>
      </div>
    </Html>
  );
};

// Fullscreen 2D screen content (bypasses 3D device shell)
const FullscreenContent = ({ engineState, cartridge, onButtonPress }: { engineState: RuntimeState | null; cartridge?: any; onButtonPress: (btn: string) => void }) => {
  if (!engineState) return (
    <div className="w-full h-full bg-black flex items-center justify-center text-cyan-500 font-mono text-2xl">
      <div className="animate-pulse">BOOTING KERNEL...</div>
    </div>
  );

  const title = cartridge?.title || "Cartridge";
  const author = cartridge?.toss_file?.manifest?.meta?.author || "Unknown";
  const stateLabel = engineState.currentStateId.replace(/_/g, " ").toUpperCase();

  return (
    <div className="w-full h-full bg-black p-0 font-mono text-white overflow-hidden relative flex flex-col">
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
      
      {/* Status Bar */}
      <div className="flex justify-between bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-4 py-2 text-sm uppercase tracking-wider shrink-0 border-b border-cyan-500/30">
        <span className="text-cyan-400">{title}</span>
        <span className="text-cyan-400/60">by {author} • v{cartridge?.version || "1.0"}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        {/* Current State */}
        <div className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/40 p-4 mb-4 rounded-lg flex items-center justify-between">
           <div className="flex items-center gap-3">
             <span className="animate-pulse w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_12px_#00ffff]"></span>
             <span className="font-bold text-cyan-400 text-2xl">{stateLabel}</span>
           </div>
           <span className="text-xs text-gray-500">Current State</span>
        </div>

        {/* Context Variables */}
        <div className="w-full flex-1 border border-white/10 rounded-lg p-4 bg-white/5 overflow-y-auto">
          <div className="text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Context Variables
          </div>
          <div className="grid gap-2">
            {Object.entries(engineState.context || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between items-start py-2 px-3 bg-black/30 rounded border border-white/5">
                <span className="text-gray-400 text-sm">{key}</span>
                <span className="text-cyan-300 text-sm max-w-[60%] truncate text-right">
                  {typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value)}
                </span>
              </div>
            ))}
            {Object.keys(engineState.context || {}).length === 0 && (
              <div className="text-gray-500 italic text-center py-4">No context variables defined</div>
            )}
          </div>
        </div>
      </div>

      {/* Full Controller Layout - Anbernic/Ayaneo Style */}
      <div className="shrink-0 bg-gradient-to-t from-gray-900 to-black/80 border-t border-white/10 px-4 py-3">
        {/* Shoulder Buttons */}
        <div className="flex justify-between mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => onButtonPress('LB')}
              className="px-4 py-1.5 rounded-t-lg bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white text-xs font-bold shadow-lg active:scale-95 transition-all border border-gray-500"
              data-testid="button-sim-lb"
            >
              LB
            </button>
            <button
              onClick={() => onButtonPress('LT')}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 text-xs font-bold shadow-lg active:scale-95 transition-all border border-gray-600"
              data-testid="button-sim-lt"
            >
              LT
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onButtonPress('RT')}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 text-xs font-bold shadow-lg active:scale-95 transition-all border border-gray-600"
              data-testid="button-sim-rt"
            >
              RT
            </button>
            <button
              onClick={() => onButtonPress('RB')}
              className="px-4 py-1.5 rounded-t-lg bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white text-xs font-bold shadow-lg active:scale-95 transition-all border border-gray-500"
              data-testid="button-sim-rb"
            >
              RB
            </button>
          </div>
        </div>

        {/* Main Controls Row */}
        <div className="flex justify-between items-center">
          {/* Left Side: D-Pad + Left Analog */}
          <div className="flex items-center gap-4">
            {/* D-Pad */}
            <div className="relative w-20 h-20">
              <button
                onClick={() => onButtonPress('UP')}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-t-lg bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 active:scale-95 transition-all border border-gray-500 flex items-center justify-center"
                data-testid="button-sim-up"
              >
                <ChevronUp className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => onButtonPress('DOWN')}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-7 h-7 rounded-b-lg bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 active:scale-95 transition-all border border-gray-500 flex items-center justify-center"
                data-testid="button-sim-down"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => onButtonPress('LEFT')}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-l-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 active:scale-95 transition-all border border-gray-500 flex items-center justify-center"
                data-testid="button-sim-left"
              >
                <ChevronUp className="w-4 h-4 text-white -rotate-90" />
              </button>
              <button
                onClick={() => onButtonPress('RIGHT')}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-r-lg bg-gradient-to-l from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 active:scale-95 transition-all border border-gray-500 flex items-center justify-center"
                data-testid="button-sim-right"
              >
                <ChevronUp className="w-4 h-4 text-white rotate-90" />
              </button>
            </div>

            {/* Left Analog Stick */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-600 shadow-inner flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border border-gray-500 shadow-lg hover:from-gray-500 hover:to-gray-600 cursor-pointer" />
              </div>
              <span className="text-[8px] text-gray-500 mt-1 font-mono">L3</span>
            </div>
          </div>

          {/* Center: Select/Start */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-4">
              <button
                onClick={() => onButtonPress('SELECT')}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-400 text-[10px] font-bold shadow-lg active:scale-95 transition-all border border-gray-600"
                data-testid="button-sim-select"
              >
                SELECT
              </button>
              <button
                onClick={() => onButtonPress('START')}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-400 text-[10px] font-bold shadow-lg active:scale-95 transition-all border border-gray-600"
                data-testid="button-sim-start"
              >
                START
              </button>
            </div>
            <Gamepad2 className="w-5 h-5 text-gray-600" />
          </div>

          {/* Right Side: Right Analog + Face Buttons */}
          <div className="flex items-center gap-4">
            {/* Right Analog Stick */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gray-800 border-2 border-gray-600 shadow-inner flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 border border-gray-500 shadow-lg hover:from-gray-500 hover:to-gray-600 cursor-pointer" />
              </div>
              <span className="text-[8px] text-gray-500 mt-1 font-mono">R3</span>
            </div>

            {/* Face Buttons (ABXY) */}
            <div className="relative w-20 h-20">
              {/* Y - Top */}
              <button
                onClick={() => onButtonPress('Y')}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-bold text-sm shadow-lg shadow-yellow-500/30 active:scale-95 transition-all"
                data-testid="button-sim-y"
              >
                Y
              </button>
              {/* X - Left */}
              <button
                onClick={() => onButtonPress('X')}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-300 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
                data-testid="button-sim-x"
              >
                X
              </button>
              {/* B - Right */}
              <button
                onClick={() => onButtonPress('B')}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 hover:from-red-300 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                data-testid="button-sim-b"
              >
                B
              </button>
              {/* A - Bottom */}
              <button
                onClick={() => onButtonPress('A')}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 hover:from-green-300 hover:to-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/30 active:scale-95 transition-all"
                data-testid="button-sim-a"
              >
                A
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 bg-black border-t border-white/10 px-4 py-2 text-xs font-mono text-gray-600 flex justify-between">
        <span>TingOs Runtime v1.1</span>
        <span>Press A/B to trigger transitions</span>
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

// --- EVENT TESTER PANEL ---

interface EventTesterPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendEvent: (event: string) => void;
}

const TEST_EVENTS = {
  "Timer": [
    { id: "TICK", label: "Tick", icon: Timer },
    { id: "TIMEOUT", label: "Timeout", icon: Timer },
    { id: "INTERVAL", label: "Interval", icon: Timer },
    { id: "DELAY_COMPLETE", label: "Delay Complete", icon: Timer },
  ],
  "Sensors": [
    { id: "TEMPERATURE_HIGH", label: "Temp High", icon: Thermometer },
    { id: "TEMPERATURE_LOW", label: "Temp Low", icon: Thermometer },
    { id: "MOTION_DETECTED", label: "Motion", icon: Mouse },
    { id: "PROXIMITY_NEAR", label: "Proximity Near", icon: Mouse },
    { id: "PROXIMITY_FAR", label: "Proximity Far", icon: Mouse },
  ],
  "Network": [
    { id: "NETWORK_CONNECTED", label: "Connected", icon: Wifi },
    { id: "NETWORK_DISCONNECTED", label: "Disconnected", icon: Wifi },
    { id: "DATA_RECEIVED", label: "Data Received", icon: Wifi },
    { id: "SYNC_COMPLETE", label: "Sync Complete", icon: Wifi },
  ],
  "System": [
    { id: "POWER_LOW", label: "Low Battery", icon: Zap },
    { id: "POWER_CHARGING", label: "Charging", icon: Zap },
    { id: "ERROR", label: "Error", icon: Zap },
    { id: "RESET", label: "Reset", icon: RefreshCw },
  ],
};

const EventTesterPanel = ({ isOpen, onToggle, onSendEvent }: EventTesterPanelProps) => {
  const [customEvent, setCustomEvent] = useState("");

  const handleCustomEventSend = () => {
    if (customEvent.trim()) {
      onSendEvent(customEvent.trim().toUpperCase());
      setCustomEvent("");
    }
  };

  return (
    <div 
      className={`absolute top-16 right-4 bg-black/95 border border-yellow-500/30 rounded-lg transition-all duration-300 overflow-hidden ${isOpen ? "w-80" : "w-auto"}`}
      data-testid="event-tester-panel"
    >
      <button
        onClick={onToggle}
        className="w-full px-4 py-2 flex items-center justify-between text-yellow-500/80 hover:text-yellow-500 hover:bg-white/5 transition-colors"
        data-testid="button-toggle-event-tester"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4" />
          <span className="font-mono text-sm">Event Tester</span>
        </div>
        {isOpen && <X className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="p-3 max-h-[60vh] overflow-y-auto">
          {Object.entries(TEST_EVENTS).map(([category, events]) => (
            <div key={category} className="mb-3">
              <div className="text-[10px] uppercase text-yellow-500/60 font-mono mb-1.5 tracking-wider">
                {category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {events.map((evt) => {
                  const Icon = evt.icon;
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onSendEvent(evt.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-500/40 text-yellow-400 text-xs font-mono transition-all active:scale-95"
                      data-testid={`button-event-${evt.id.toLowerCase()}`}
                    >
                      <Icon className="w-3 h-3" />
                      {evt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="border-t border-yellow-500/20 pt-3 mt-3">
            <div className="text-[10px] uppercase text-yellow-500/60 font-mono mb-1.5 tracking-wider">
              Custom Event
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customEvent}
                onChange={(e) => setCustomEvent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomEventSend()}
                placeholder="EVENT_NAME"
                className="flex-1 bg-black/50 border border-yellow-500/30 rounded px-2 py-1.5 text-yellow-400 font-mono text-sm placeholder:text-yellow-500/30 outline-none focus:border-yellow-500/60"
                data-testid="input-custom-event"
              />
              <button
                onClick={handleCustomEventSend}
                className="px-3 py-1.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 transition-all active:scale-95"
                data-testid="button-send-custom-event"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
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
  const [eventTesterOpen, setEventTesterOpen] = useState(false);
  const [eventConsoleOpen, setEventConsoleOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [splashCartridge, setSplashCartridge] = useState<any>(null);
  const [showController, setShowController] = useState(false);
  const [showCartridgeBrowser, setShowCartridgeBrowser] = useState(false);
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

    // Show splash screen for this cartridge
    setSplashCartridge(selectedCartridge);
    setShowSplash(true);

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

  const handleTestEvent = (event: string) => {
    if (engine) {
      engine.send(event);
    }
  };

  const handleEventConsoleTrigger = useCallback((eventId: string, path: string) => {
    if (!engine || !engineState) {
      return { success: false, message: "Engine not running" };
    }
    
    const previousState = engineState.currentStateId;
    const currentStates = engineState.currentStateId;
    
    const tossFile = cartridges.find(c => c.tngli_id === selectedCartridgeId)?.toss_file;
    if (!tossFile?.logic?.states) {
      return { success: false, message: "No cartridge loaded" };
    }
    
    const stateObj = tossFile.logic.states[currentStates];
    const hasTransition = stateObj?.transitions?.some((t: any) => t.event === eventId);
    
    if (!hasTransition) {
      return { 
        success: false, 
        message: `Event "${eventId}" not applicable from state "${currentStates}"`,
        previousState 
      };
    }
    
    engine.send(eventId);
    
    const newState = engine.getState().currentStateId;
    return { 
      success: true, 
      message: `Transitioned from "${previousState}" to "${newState}"`,
      previousState,
      newState
    };
  }, [engine, engineState, cartridges, selectedCartridgeId]);

  // Handle full gamepad input from VirtualHandheld
  const handleGamepadInput = useCallback((input: GamepadInput) => {
    if (!engine) return;
    
    // Map gamepad buttons to engine events
    if (input.a) engine.send("BUTTON_A");
    if (input.b) engine.send("BUTTON_B");
    if (input.x) engine.send("BUTTON_X");
    if (input.y) engine.send("BUTTON_Y");
    if (input.start) engine.send("BUTTON_START");
    if (input.select) engine.send("BUTTON_SELECT");
    if (input.leftBumper) engine.send("BUTTON_LB");
    if (input.rightBumper) engine.send("BUTTON_RB");
    if (input.dpadUp) engine.send("DPAD_UP");
    if (input.dpadDown) engine.send("DPAD_DOWN");
    if (input.dpadLeft) engine.send("DPAD_LEFT");
    if (input.dpadRight) engine.send("DPAD_RIGHT");
  }, [engine]);

  const selectedCartridge = cartridges.find(c => c.tngli_id === selectedCartridgeId);

  return (
    <div className="w-full h-screen bg-[#050505] relative overflow-hidden">
      {/* Splash Screen */}
      {showSplash && splashCartridge && (
        <SplashScreen
          title={splashCartridge.title || "Cartridge"}
          author={splashCartridge.toss_file?.manifest?.meta?.author || "Unknown"}
          onComplete={() => setShowSplash(false)}
        />
      )}

      {/* Cartridge Browser (Cover Flow) */}
      {showCartridgeBrowser && (
        <CartridgeBrowser
          cartridges={cartridges.map((cart): CartridgeEntry => ({
            id: cart.tngli_id,
            title: cart.title || "Untitled",
            author: cart.toss_file?.manifest?.meta?.author || "Unknown",
            description: cart.toss_file?.manifest?.meta?.description,
            color: cart.toss_file?.manifest?.meta?.color || "#1a1a2e",
            labelColor: cart.toss_file?.manifest?.meta?.labelColor || "#f8f8f8",
          }))}
          onSelect={(entry) => {
            console.log("Selected cartridge details:", entry);
          }}
          onLoad={(entry) => {
            setSelectedCartridgeId(entry.id);
            setShowCartridgeBrowser(false);
          }}
          onClose={() => setShowCartridgeBrowser(false)}
        />
      )}

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-50 flex gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <Link href="/">
            <Button variant="ghost" className="text-white gap-2">
              <ArrowLeft className="w-4 h-4" /> Exit Simulator
            </Button>
          </Link>
          
          {!isLoading && cartridges.length > 0 && (
            <>
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
              
              <Button
                variant="ghost"
                onClick={() => setShowCartridgeBrowser(true)}
                className="text-white gap-2 bg-black/50 border border-white/20 hover:bg-white/10"
                data-testid="button-open-cart-browser"
              >
                <Library className="w-4 h-4" />
                Browse
              </Button>
            </>
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

      {/* Event Tester Panel */}
      <EventTesterPanel 
        isOpen={eventTesterOpen} 
        onToggle={() => setEventTesterOpen(!eventTesterOpen)} 
        onSendEvent={handleTestEvent}
      />

      {/* Event Console - Draggable & Dockable (starts at bottom-left near footer) */}
      {eventConsoleOpen && (
        <DraggablePanel
          title="Event Console"
          icon={<Zap className="w-4 h-4 text-purple-400" />}
          defaultPosition={{ x: 16, y: 400 }}
          defaultDock="bottom-left"
          minWidth={420}
          onClose={() => setEventConsoleOpen(false)}
          storageKey="event-console"
        >
          <EventConsole
            cartridges={mountedCartridgeIds.map(id => {
              const cart = cartridges.find(c => c.tngli_id === id);
              return cart ? { id: cart.tngli_id, label: cart.title || cart.tngli_id, toss: cart.toss_file } : null;
            }).filter(Boolean) as any[]}
            currentState={engineState?.currentStateId || ""}
            onTriggerEvent={handleEventConsoleTrigger}
            collapsed={false}
            onToggleCollapse={() => setEventConsoleOpen(false)}
          />
        </DraggablePanel>
      )}
      
      {/* Event Console Toggle Button (when closed) - positioned at bottom-left footer area */}
      {!eventConsoleOpen && (
        <div className="absolute bottom-4 left-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEventConsoleOpen(true)}
            className="h-8 px-3 gap-2 bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:bg-purple-900/50 hover:scale-105 transition-transform"
            data-testid="button-expand-event-console"
          >
            <Zap className="w-4 h-4" />
            Events
          </Button>
        </div>
      )}

      {/* Fullscreen Mode - Tabbed simulator with Preview/State/Timeline */}
      {fullscreenMode ? (
        <div className="absolute inset-0 top-14 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <SimulatorPreview 
              cartridge={selectedCartridge}
              currentState={engineState?.currentStateId || 'idle'}
              context={engineState?.context || {}}
              onStateChange={(state) => engine?.send(`STATE_${state}`)}
            />
          </div>
          <CliPanel isOpen={cliOpen} onToggle={() => setCliOpen(!cliOpen)} />
        </div>
      ) : (
        /* Device Mode - 3D handheld mockup */
        <>
          <Canvas 
            shadows 
            camera={{ position: [0, 0, 10], fov: 45 }}
            gl={{ 
              antialias: true, 
              powerPreference: "high-performance",
              failIfMajorPerformanceCaveat: false
            }}
            frameloop="demand"
          >
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 20]} />
            
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="#7c3aed" />

            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
              <DeviceShell>
                <ScreenContent engineState={engineState} cartridge={selectedCartridge} />
                
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
