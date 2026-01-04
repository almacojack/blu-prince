/**
 * SimulatorPreview - Live 3D mesh preview in the runtime simulator
 * 
 * Shows cartridge meshes as they'd appear at runtime, with:
 * - Animation patterns playing based on current state
 * - Materials and transforms applied
 * - Interactive timeline scrubbing
 * 
 * ## Design Philosophy
 * "Objects live in their state" - Unlike static 3D editors,
 * meshes here animate and respond to the FSM state.
 */

import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Float, RoundedBox, Sphere, Box as DreiBox, Cone, Cylinder, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Box, 
  Layers, 
  Activity, 
  Eye,
  Grid3X3,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AnimationPattern, 
  ANIMATION_PATTERNS, 
  getTransformAtTime,
  PRINCIPLE_NAMES 
} from '@/lib/animation-patterns';

interface SimulatorPreviewProps {
  cartridge: any;
  currentState: string;
  context: Record<string, any>;
  onStateChange?: (state: string) => void;
}

export function SimulatorPreview({ cartridge, currentState, context, onStateChange }: SimulatorPreviewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'state' | 'timeline'>('preview');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [selectedPattern, setSelectedPattern] = useState<AnimationPattern | null>(ANIMATION_PATTERNS[0]);

  return (
    <div className="w-full h-full flex flex-col bg-black/90" data-testid="simulator-preview">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
          <TabsList className="bg-white/5">
            <TabsTrigger value="preview" className="gap-1.5 text-xs" data-testid="tab-preview">
              <Eye className="w-3 h-3" /> Preview
            </TabsTrigger>
            <TabsTrigger value="state" className="gap-1.5 text-xs" data-testid="tab-state">
              <Activity className="w-3 h-3" /> State
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1.5 text-xs" data-testid="tab-timeline">
              <Layers className="w-3 h-3" /> Timeline
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7"
                  onClick={() => setShowGrid(!showGrid)}
                  data-testid="button-toggle-grid"
                >
                  <Grid3X3 className={cn("w-4 h-4", showGrid ? "text-cyan-400" : "text-white/40")} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-7 h-7"
                  onClick={() => setDarkMode(!darkMode)}
                  data-testid="button-toggle-lighting"
                >
                  {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={isPlaying ? "default" : "ghost"}
                  className="w-7 h-7"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="button-toggle-animation"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        </div>

        <TabsContent value="preview" className="flex-1 m-0 relative">
          <PreviewCanvas 
            cartridge={cartridge}
            currentState={currentState}
            isPlaying={isPlaying}
            showGrid={showGrid}
            darkMode={darkMode}
            selectedPattern={selectedPattern}
          />
          
          <div className="absolute bottom-3 left-3 right-3">
            <PatternSelector 
              selected={selectedPattern} 
              onSelect={setSelectedPattern}
            />
          </div>
        </TabsContent>

        <TabsContent value="state" className="flex-1 m-0 p-4 overflow-auto">
          <StateInspector currentState={currentState} context={context} />
        </TabsContent>

        <TabsContent value="timeline" className="flex-1 m-0">
          <TimelinePreview 
            pattern={selectedPattern}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(!isPlaying)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface PreviewCanvasProps {
  cartridge: any;
  currentState: string;
  isPlaying: boolean;
  showGrid: boolean;
  darkMode: boolean;
  selectedPattern: AnimationPattern | null;
}

function PreviewCanvas({ cartridge, currentState, isPlaying, showGrid, darkMode, selectedPattern }: PreviewCanvasProps) {
  return (
    <Canvas
      shadows
      camera={{ position: [5, 5, 5], fov: 50 }}
      gl={{ 
        antialias: true, 
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false
      }}
      dpr={[1, 1.5]}
      onCreated={({ gl }) => {
        gl.setClearColor(darkMode ? '#0a0a0a' : '#f0f0f0');
        gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={darkMode ? 0.3 : 0.6} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={darkMode ? 0.8 : 1} 
          castShadow 
          shadow-mapSize={1024}
        />
        {darkMode && <pointLight position={[-5, 5, -5]} intensity={0.3} color="#7c3aed" />}
        
        <AnimatedMesh 
          pattern={selectedPattern} 
          isPlaying={isPlaying} 
          currentState={currentState}
        />
        
        {showGrid && (
          <Grid
            position={[0, -0.01, 0]}
            args={[20, 20]}
            cellSize={0.5}
            cellThickness={0.5}
            cellColor={darkMode ? '#333' : '#ccc'}
            sectionSize={2}
            sectionThickness={1}
            sectionColor={darkMode ? '#555' : '#999'}
            fadeDistance={30}
            fadeStrength={1}
          />
        )}
        
        <ContactShadows 
          position={[0, -0.01, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2} 
          far={4}
        />
        
        <OrbitControls 
          makeDefault 
          minDistance={2} 
          maxDistance={20}
          enableDamping
          dampingFactor={0.05}
        />
        
        <Environment preset={darkMode ? "night" : "apartment"} />
      </Suspense>
    </Canvas>
  );
}

interface AnimatedMeshProps {
  pattern: AnimationPattern | null;
  isPlaying: boolean;
  currentState: string;
}

function AnimatedMesh({ pattern, isPlaying, currentState }: AnimatedMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [time, setTime] = useState(0);

  useFrame((_, delta) => {
    if (!meshRef.current || !pattern || !isPlaying) return;

    setTime(prev => prev + delta);
    
    const transform = getTransformAtTime(pattern, time);
    
    meshRef.current.position.set(...transform.position);
    meshRef.current.rotation.set(
      THREE.MathUtils.degToRad(transform.rotation[0]),
      THREE.MathUtils.degToRad(transform.rotation[1]),
      THREE.MathUtils.degToRad(transform.rotation[2])
    );
    meshRef.current.scale.set(...transform.scale);
    
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    if (material && 'opacity' in material) {
      material.opacity = transform.opacity;
      material.transparent = transform.opacity < 1;
    }
  });

  const principleColor = pattern?.color || '#06b6d4';

  return (
    <group>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color={principleColor}
          roughness={0.3}
          metalness={0.5}
          emissive={principleColor}
          emissiveIntensity={0.1}
        />
      </mesh>
      
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={0.5} 
          />
        </mesh>
      </Float>
    </group>
  );
}

interface PatternSelectorProps {
  selected: AnimationPattern | null;
  onSelect: (pattern: AnimationPattern) => void;
}

function PatternSelector({ selected, onSelect }: PatternSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-white/10 overflow-hidden">
      <button
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
        data-testid="button-pattern-selector"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">
            {selected ? selected.name : 'Select Pattern'}
          </span>
          {selected && (
            <Badge 
              variant="outline" 
              className="text-[9px] border-white/20"
              style={{ borderColor: selected.color, color: selected.color }}
            >
              {PRINCIPLE_NAMES[selected.principle]}
            </Badge>
          )}
        </div>
        <span className="text-xs text-white/50">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <ScrollArea className="h-40 border-t border-white/10">
          <div className="p-2 grid grid-cols-3 gap-1">
            {ANIMATION_PATTERNS.map(pattern => (
              <button
                key={pattern.id}
                className={cn(
                  "p-2 rounded text-left transition-all text-xs",
                  selected?.id === pattern.id 
                    ? "bg-white/10 ring-1 ring-white/30" 
                    : "hover:bg-white/5"
                )}
                style={{ borderLeft: `3px solid ${pattern.color}` }}
                onClick={() => { onSelect(pattern); setExpanded(false); }}
                data-testid={`pattern-option-${pattern.id}`}
              >
                <div className="font-medium text-white truncate">{pattern.name}</div>
                <div className="text-[9px] text-white/50 truncate">
                  {PRINCIPLE_NAMES[pattern.principle]}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

interface StateInspectorProps {
  currentState: string;
  context: Record<string, any>;
}

function StateInspector({ currentState, context }: StateInspectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Current State</div>
        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-lg px-4 py-2">
          {currentState || 'idle'}
        </Badge>
      </div>

      <div>
        <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Context</div>
        <div className="bg-black/50 rounded-lg border border-white/10 p-3 font-mono text-xs">
          {Object.keys(context).length === 0 ? (
            <span className="text-white/30">No context variables</span>
          ) : (
            <pre className="text-green-400 overflow-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

interface TimelinePreviewProps {
  pattern: AnimationPattern | null;
  isPlaying: boolean;
  onPlayPause: () => void;
}

function TimelinePreview({ pattern, isPlaying, onPlayPause }: TimelinePreviewProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    if (!pattern || !isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime(prev => {
        const next = prev + delta;
        return pattern.loop ? next % pattern.duration : Math.min(next, pattern.duration);
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [pattern, isPlaying]);

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full text-white/30">
        Select a pattern to view timeline
      </div>
    );
  }

  const PIXELS_PER_SECOND = 150;
  const timelineWidth = pattern.duration * PIXELS_PER_SECOND;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-3 border-b border-white/10">
        <Button
          size="icon"
          variant={isPlaying ? "default" : "outline"}
          className="w-8 h-8"
          onClick={onPlayPause}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8"
          onClick={() => { setCurrentTime(0); lastTimeRef.current = 0; }}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        <div className="flex-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={pattern.duration}
            step={0.01}
            onValueChange={([v]) => setCurrentTime(v)}
          />
        </div>

        <div className="font-mono text-xs text-cyan-400 min-w-[80px] text-right">
          {currentTime.toFixed(2)}s / {pattern.duration}s
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-3">
        <div className="relative h-32" style={{ width: Math.max(timelineWidth + 50, 300) }}>
          {Array.from({ length: Math.ceil(pattern.duration / 0.5) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: i * 0.5 * PIXELS_PER_SECOND }}
            >
              <span className="absolute -top-5 left-0 text-[9px] text-white/40 -translate-x-1/2">
                {(i * 0.5).toFixed(1)}s
              </span>
            </div>
          ))}

          <div className="absolute top-6 bottom-0 left-0 right-0">
            <div className="h-6 bg-white/5 rounded flex items-center px-2 text-[10px] text-white/60">
              Position
            </div>
            <div className="h-6 bg-white/5 rounded flex items-center px-2 text-[10px] text-white/60 mt-1">
              Rotation
            </div>
            <div className="h-6 bg-white/5 rounded flex items-center px-2 text-[10px] text-white/60 mt-1">
              Scale
            </div>

            {pattern.keyframes.map((kf, idx) => (
              <div
                key={idx}
                className="absolute top-0"
                style={{ left: kf.time * PIXELS_PER_SECOND }}
              >
                {kf.position && (
                  <div 
                    className="absolute w-2.5 h-2.5 bg-cyan-500 rotate-45 cursor-pointer hover:scale-125 transition-transform"
                    style={{ top: 8, left: -5 }}
                    title={`pos: [${kf.position.join(', ')}]`}
                  />
                )}
                {kf.rotation && (
                  <div 
                    className="absolute w-2.5 h-2.5 bg-orange-500 rotate-45 cursor-pointer hover:scale-125 transition-transform"
                    style={{ top: 36, left: -5 }}
                    title={`rot: [${kf.rotation.join('°, ')}°]`}
                  />
                )}
                {kf.scale && (
                  <div 
                    className="absolute w-2.5 h-2.5 bg-green-500 rotate-45 cursor-pointer hover:scale-125 transition-transform"
                    style={{ top: 64, left: -5 }}
                    title={`scale: [${kf.scale.join(', ')}]`}
                  />
                )}
              </div>
            ))}
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: currentTime * PIXELS_PER_SECOND }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimulatorPreview;
