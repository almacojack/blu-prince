import React, { useState, useRef, useEffect, Suspense, useCallback, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, Grid, Environment, Html, 
  TransformControls, PerspectiveCamera 
} from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
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
  Plus, Trash2, ArrowRight, GitBranch, X, Gamepad2, Vibrate,
  Pentagon, Hexagon, Diamond, Cone, FileImage, Eye, EyeOff,
  Palette, Move, RotateCw, Maximize2, Database, Wrench, Users, Share2, Copy, FolderOpen, Droplets, Atom, BookOpen
} from "lucide-react";
import { DockablePanel } from "@/components/DockablePanel";
import { ToolsPanel, type PhysicsTool } from "@/components/ToolsPanel";
import { EnvironmentalForcesPanel, DEFAULT_FORCES, type ForceConfig, type EnvironmentalForce } from "@/components/EnvironmentalForcesPanel";
import { ThingCatalog, type CatalogEntry } from "@/components/ThingCatalog";
import { ControllerMappingsPanel } from "@/components/ControllerMappingsPanel";
import { WaterContainer } from "@/components/WaterContainer";
import { BrassGearAssembly } from "@/components/BrassGear";
import { WaterControlPanel, createDefaultWaterContainer, type WaterContainerConfig } from "@/components/WaterControlPanel";
import { SceneTree } from "@/components/SceneTree";
import { ViewportAnglesPanel, ViewportAngle } from "@/components/ViewportAnglesPanel";
import { createNewTossFile, TossFile } from "@/lib/toss";
import {
  createGestureState, startGesture, updateGesture, endGesture,
  calculateFlickVelocity, calculatePoolCueImpulse, calculateSlingshotImpulse,
  applyFlickImpulse, applyDirectionalImpulse, type GestureState
} from "@/lib/gesture-physics";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { 
  TossCartridge, TossItem, EditorMode, UserAssertion, ItemFSM, ControllerBinding, Bounds, ControllerPreset,
  createNewCartridge, createThing, DEFAULT_PHYSICS, CONTROLLER_BUTTONS, createDefaultControllerPreset
} from "@/lib/toss-v1";
import { useToast } from "@/hooks/use-toast";
import { useCollaboration, type CollabUser } from "@/hooks/use-collaboration";
import { useAuth } from "@/hooks/use-auth";
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

// Magnet Force Manager - applies forces between magnetized objects
interface MagnetForceManagerProps {
  magnetizedObjects: Set<string>;
  rigidBodyRegistry: React.MutableRefObject<Map<string, RapierRigidBody>>;
  polarity: 'attract' | 'repel';
  power: number;
}

function MagnetForceManager({ magnetizedObjects, rigidBodyRegistry, polarity, power }: MagnetForceManagerProps) {
  useFrame((_, delta) => {
    if (magnetizedObjects.size < 2) return;
    
    const magnetIds = Array.from(magnetizedObjects);
    const baseForceMagnitude = (power / 100) * 15;
    
    for (let i = 0; i < magnetIds.length; i++) {
      for (let j = i + 1; j < magnetIds.length; j++) {
        const bodyA = rigidBodyRegistry.current.get(magnetIds[i]);
        const bodyB = rigidBodyRegistry.current.get(magnetIds[j]);
        
        if (!bodyA || !bodyB) continue;
        
        const posA = bodyA.translation();
        const posB = bodyB.translation();
        
        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dz = posB.z - posA.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq < 0.25 || distSq > 100) continue;
        
        const dist = Math.sqrt(distSq);
        const forceMag = (baseForceMagnitude / distSq) * delta;
        const nx = dx / dist;
        const ny = dy / dist;
        const nz = dz / dist;
        
        const sign = polarity === 'attract' ? 1 : -1;
        
        bodyA.applyImpulse({ x: nx * forceMag * sign, y: ny * forceMag * sign, z: nz * forceMag * sign }, true);
        bodyB.applyImpulse({ x: -nx * forceMag * sign, y: -ny * forceMag * sign, z: -nz * forceMag * sign }, true);
      }
    }
  });
  
  return null;
}

// A physics-enabled Thing that squashes on impact using refs (no setState in useFrame)
interface PhysicsThingProps {
  item: TossItem;
  isSelected: boolean;
  onSelect: () => void;
  onTransformUpdate: (id: string, position: { x: number; y: number; z: number }) => void;
  mode: EditorMode;
  activeTool?: PhysicsTool;
  toolPower?: number;
  isMagnetized?: boolean;
  onToggleMagnet?: () => void;
  onRegisterBody?: (id: string, body: RapierRigidBody | null) => void;
}

function PhysicsThing({ 
  item, isSelected, onSelect, onTransformUpdate, mode, 
  activeTool = 'select', toolPower = 100,
  isMagnetized = false, onToggleMagnet, onRegisterBody
}: PhysicsThingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  
  useEffect(() => {
    if (onRegisterBody) {
      if (rigidBodyRef.current) {
        onRegisterBody(item.id, rigidBodyRef.current);
      }
      return () => onRegisterBody(item.id, null);
    }
  }, [item.id, onRegisterBody]);
  
  const hasLandedRef = useRef(false);
  const squashRef = useRef({ x: 1, y: 1, z: 1 });
  const lastPositionRef = useRef({ x: 0, y: 0, z: 0 });
  
  const gestureRef = useRef<{ 
    active: boolean; 
    startPos: THREE.Vector3 | null; 
    points: Array<{ pos: THREE.Vector3; time: number }>;
  }>({ active: false, startPos: null, points: [] });
  
  // In DESIGN mode, items are anchored unless they have the special 'dropping' flag
  // This allows newly created items to drop briefly, then anchor for positioning
  const isDropping = item.physics?.dropping === true;
  const isAnchored = item.physics?.anchored || (mode === "DESIGN" && !isDropping);
  const gravityScale = item.physics?.gravityScale ?? 1;
  const squashIntensity = item.animation?.squash_intensity ?? 0.4;
  const recoverySpeed = item.animation?.squash_recovery_speed ?? 8;
  
  const isPhysicsTool = ['flick', 'pool_cue', 'slingshot'].includes(activeTool);
  
  const getCanvas = (e: any): HTMLCanvasElement | null => {
    const nativeEvent = e.nativeEvent || e.event;
    if (nativeEvent?.target instanceof HTMLCanvasElement) {
      return nativeEvent.target;
    }
    return null;
  };
  
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    onSelect();
    
    if (activeTool === 'magnet' && onToggleMagnet) {
      onToggleMagnet();
      return;
    }
    
    if (isPhysicsTool && rigidBodyRef.current) {
      const point = e.point as THREE.Vector3;
      gestureRef.current = {
        active: true,
        startPos: point.clone(),
        points: [{ pos: point.clone(), time: performance.now() }],
      };
      const canvas = getCanvas(e);
      const pointerId = e.nativeEvent?.pointerId ?? e.event?.pointerId;
      if (canvas && pointerId !== undefined) {
        canvas.setPointerCapture(pointerId);
      }
    }
  };
  
  const handlePointerMove = (e: any) => {
    if (!gestureRef.current.active || !isPhysicsTool) return;
    
    const point = e.point as THREE.Vector3;
    if (point) {
      gestureRef.current.points.push({ pos: point.clone(), time: performance.now() });
      if (gestureRef.current.points.length > 10) {
        gestureRef.current.points.shift();
      }
    }
  };
  
  const handlePointerUp = (e: any) => {
    const canvas = getCanvas(e);
    const pointerId = e.nativeEvent?.pointerId ?? e.event?.pointerId;
    
    try {
      if (!gestureRef.current.active || !rigidBodyRef.current || !isPhysicsTool) {
        return;
      }
      
      const body = rigidBodyRef.current;
      const power = toolPower / 100;
      const points = gestureRef.current.points;
      const startPos = gestureRef.current.startPos;
      
      if (points.length >= 2 && startPos) {
        const lastPoint = points[points.length - 1];
        const firstPoint = points[0];
        
        if (activeTool === 'flick') {
          const dt = (lastPoint.time - firstPoint.time) / 1000;
          if (dt > 0) {
            const velocity = new THREE.Vector3()
              .subVectors(lastPoint.pos, firstPoint.pos)
              .divideScalar(dt)
              .multiplyScalar(power * 0.5);
            velocity.clampLength(0, 30);
            body.applyImpulse({ x: velocity.x, y: velocity.y, z: velocity.z }, true);
          }
        } else if (activeTool === 'pool_cue') {
          const pullback = new THREE.Vector3().subVectors(startPos, lastPoint.pos);
          const magnitude = Math.min(pullback.length() * power * 0.5, 50);
          const direction = pullback.normalize();
          body.applyImpulse({ 
            x: direction.x * magnitude, 
            y: direction.y * magnitude, 
            z: direction.z * magnitude 
          }, true);
        } else if (activeTool === 'slingshot') {
          const stretch = new THREE.Vector3().subVectors(startPos, lastPoint.pos);
          const magnitude = Math.min(Math.pow(stretch.length(), 1.5) * power * 0.3, 80);
          const direction = stretch.normalize();
          body.applyImpulse({ 
            x: direction.x * magnitude, 
            y: Math.abs(direction.y) * magnitude * 0.5 + magnitude * 0.3, 
            z: direction.z * magnitude 
          }, true);
        }
      }
    } finally {
      gestureRef.current = { active: false, startPos: null, points: [] };
      if (canvas && pointerId !== undefined) {
        try { canvas.releasePointerCapture(pointerId); } catch {}
      }
    }
  };

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

  const baseColor = item.material?.color || "#7c3aed";
  const color = isMagnetized ? "#ff6b00" : baseColor;
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {item.bounds.type === "sphere" && (
          <sphereGeometry args={[item.bounds.radius || 0.5, 32, 32]} />
        )}
        {item.bounds.type === "box" && (
          <boxGeometry args={[
            item.bounds.width || 1, 
            item.bounds.height || 1, 
            item.bounds.depth || 1
          ]} />
        )}
        {item.bounds.type === "cone" && (
          <coneGeometry args={[0.5, 1, 32]} />
        )}
        {item.bounds.type === "tetrahedron" && (
          <tetrahedronGeometry args={[0.6]} />
        )}
        {item.bounds.type === "octahedron" && (
          <octahedronGeometry args={[0.5]} />
        )}
        {item.bounds.type === "icosahedron" && (
          <icosahedronGeometry args={[0.5]} />
        )}
        {item.bounds.type === "dodecahedron" && (
          <dodecahedronGeometry args={[0.5]} />
        )}
        {item.bounds.type === "cylinder" && (
          <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
        )}
        {item.bounds.type === "torus" && (
          <torusGeometry args={[0.4, 0.15, 16, 48]} />
        )}
        {!item.bounds.type || !["sphere", "box", "cone", "tetrahedron", "octahedron", "icosahedron", "dodecahedron", "cylinder", "torus"].includes(item.bounds.type) && (
          <boxGeometry args={[1, 1, 1]} />
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
  const modes: EditorMode[] = ["DESIGN", "TEST", "DEPLOY", "PLAY"];
  
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

// Component palette with color icons support
interface ComponentPaletteProps {
  onAddComponent: (type: string) => void;
  onToggleLayers: () => void;
  showLayers: boolean;
  colorIcons: boolean;
}

function ComponentPalette({ onAddComponent, onToggleLayers, showLayers, colorIcons }: ComponentPaletteProps) {
  const primitives = [
    { id: "box", icon: Box, label: "Box", color: "#7c3aed" },
    { id: "sphere", icon: Circle, label: "Sphere", color: "#ff6b6b" },
    { id: "cone", icon: Triangle, label: "Cone", color: "#fbbf24" },
    { id: "cylinder", icon: Hexagon, label: "Cylinder", color: "#34d399" },
  ];
  
  const platonic = [
    { id: "tetrahedron", icon: Triangle, label: "Tetrahedron (4)", color: "#f472b6" },
    { id: "octahedron", icon: Diamond, label: "Octahedron (8)", color: "#60a5fa" },
    { id: "icosahedron", icon: Pentagon, label: "Icosahedron (20)", color: "#a78bfa" },
    { id: "dodecahedron", icon: Hexagon, label: "Dodecahedron (12)", color: "#2dd4bf" },
  ];
  
  const special = [
    { id: "torus", icon: Circle, label: "Torus", color: "#fb923c" },
  ];
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const { importAsset } = await import('@/lib/asset-importer');
    const result = await importAsset(file, (progress) => {
      console.log(`Import progress: ${progress.percent}% - ${progress.message}`);
    });
    
    if (result.success && result.asset) {
      onAddComponent(`imported_${result.asset.id}`);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div 
      className="flex flex-col"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <ScrollArea className="max-h-[60vh]">
        <div className="p-2 space-y-1">
          <div className="text-[9px] uppercase text-muted-foreground font-bold px-1 mb-1">Primitives</div>
          {primitives.map((comp) => (
            <Button
              key={comp.id}
              size="icon"
              variant="ghost"
              onClick={() => onAddComponent(comp.id)}
              className="w-10 h-10 hover:bg-white/10"
              style={colorIcons ? { color: comp.color } : { color: 'inherit' }}
              title={comp.label}
              data-testid={`button-add-${comp.id}`}
            >
              <comp.icon className="w-5 h-5" />
            </Button>
          ))}
          
          <Separator className="my-2 bg-white/10" />
          <div className="text-[9px] uppercase text-muted-foreground font-bold px-1 mb-1">Platonic Solids</div>
          {platonic.map((comp) => (
            <Button
              key={comp.id}
              size="icon"
              variant="ghost"
              onClick={() => onAddComponent(comp.id)}
              className="w-10 h-10 hover:bg-white/10"
              style={colorIcons ? { color: comp.color } : { color: 'inherit' }}
              title={comp.label}
              data-testid={`button-add-${comp.id}`}
            >
              <comp.icon className="w-5 h-5" />
            </Button>
          ))}
          
          <Separator className="my-2 bg-white/10" />
          <div className="text-[9px] uppercase text-muted-foreground font-bold px-1 mb-1">Special</div>
          {special.map((comp) => (
            <Button
              key={comp.id}
              size="icon"
              variant="ghost"
              onClick={() => onAddComponent(comp.id)}
              className="w-10 h-10 hover:bg-white/10"
              style={colorIcons ? { color: comp.color } : { color: 'inherit' }}
              title={comp.label}
              data-testid={`button-add-${comp.id}`}
            >
              <comp.icon className="w-5 h-5" />
            </Button>
          ))}
          
          <Separator className="my-2 bg-white/10" />
          <div className="text-[9px] uppercase text-muted-foreground font-bold px-1 mb-1">Import</div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,.gltf,.glb,.obj,.stl,.json"
            onChange={handleFileImport}
            className="hidden"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 hover:bg-white/10"
            style={colorIcons ? { color: '#10b981' } : { color: 'inherit' }}
            title="Import SVG/3D File"
            data-testid="button-import-file"
          >
            <FileImage className="w-5 h-5" />
          </Button>
        </div>
      </ScrollArea>
      
      <Separator className="bg-white/10" />
      <div className="p-2">
        <Button 
          size="icon" 
          variant="ghost" 
          className={`w-10 h-10 ${showLayers ? 'text-cyan-400 bg-cyan-400/10' : 'text-muted-foreground'}`}
          title="Toggle Layers"
          onClick={onToggleLayers}
          data-testid="button-toggle-layers"
        >
          <Layers className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Layers Panel - Now uses DockablePanel for consistency
interface LayersPanelProps {
  items: TossItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  hiddenLayers: Set<string>;
  onClose: () => void;
}

function LayersPanel({ items, selectedId, onSelect, onToggleVisibility, onDelete, hiddenLayers, onClose }: LayersPanelProps) {
  return (
    <div className="absolute left-60 top-14 bottom-4 z-40">
      <DockablePanel
        id="layers"
        title="Layers"
        icon={<Layers className="w-4 h-4" />}
        defaultDocked={false}
        defaultCollapsed={false}
        defaultPosition={{ x: 240, y: 80 }}
        onClose={onClose}
      >
        <ScrollArea className="max-h-[400px]">
          <div className="p-2 space-y-1">
            {items.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2 text-center">No objects in scene</div>
            ) : (
              items.map((item) => {
                const isHidden = hiddenLayers.has(item.id);
                const isSelected = selectedId === item.id;
                return (
                  <div 
                    key={item.id}
                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/20 border border-primary/50' : 'hover:bg-white/5'
                    } ${isHidden ? 'opacity-50' : ''}`}
                    onClick={() => onSelect(item.id)}
                    data-testid={`layer-item-${item.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.material?.color || '#7c3aed' }}
                      />
                      <span className="text-xs text-white font-mono truncate max-w-[100px]">
                        {item.props?.label || item.id.split('_')[1] || item.id}
                      </span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-white/20">
                        {item.bounds.type || 'box'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(item.id); }}
                        data-testid={`button-visibility-${item.id}`}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-red-400 hover:text-red-300"
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        data-testid={`button-delete-${item.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DockablePanel>
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
  
  // Manipulation actions for transform control
  const manipulationActions = [
    { id: "nudge_x_pos", label: "Nudge +X", icon: Move },
    { id: "nudge_x_neg", label: "Nudge -X", icon: Move },
    { id: "nudge_y_pos", label: "Nudge +Y", icon: Move },
    { id: "nudge_y_neg", label: "Nudge -Y", icon: Move },
    { id: "nudge_z_pos", label: "Nudge +Z", icon: Move },
    { id: "nudge_z_neg", label: "Nudge -Z", icon: Move },
    { id: "scale_up", label: "Scale Up", icon: Maximize2 },
    { id: "scale_down", label: "Scale Down", icon: Maximize2 },
    { id: "rotate_cw", label: "Rotate CW", icon: RotateCw },
    { id: "rotate_ccw", label: "Rotate CCW", icon: RotateCw },
    { id: "snap_to_grid", label: "Snap to Grid", icon: Move },
    { id: "reset_transform", label: "Reset Transform", icon: RotateCcw },
  ];

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

        {/* Transform Manipulation Actions */}
        <div className="mt-4 p-2 bg-white/5 rounded">
          <Label className="text-xs text-muted-foreground mb-2 block flex items-center gap-2">
            <Move className="w-3 h-3" /> Transform Actions
          </Label>
          <p className="text-[10px] text-muted-foreground mb-2">
            Bind controller buttons to manipulate objects in 3D space
          </p>
          {waitingForButton ? null : (
            <div className="grid grid-cols-2 gap-1">
              {manipulationActions.map(action => {
                const isBound = Object.values(controller.bindings).includes(action.id);
                return (
                  <Button
                    key={action.id}
                    size="sm"
                    variant={isBound ? "secondary" : "outline"}
                    onClick={() => setWaitingForButton(action.id)}
                    className={`text-[9px] h-6 ${isBound ? 'bg-primary/20' : ''}`}
                    disabled={gamepads.length === 0}
                    data-testid={`button-bind-${action.id}`}
                  >
                    <action.icon className="w-2 h-2 mr-1" /> {action.label}
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="mt-4 p-2 bg-white/5 rounded">
          <Label className="text-xs text-muted-foreground mb-2 block">Quick Presets</Label>
          <div className="space-y-1">
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] h-7"
              onClick={() => {
                const preset: ControllerBinding = {
                  ...controller,
                  bindings: {
                    ...controller.bindings,
                    "DPAD_UP": "nudge_z_neg",
                    "DPAD_DOWN": "nudge_z_pos",
                    "DPAD_LEFT": "nudge_x_neg",
                    "DPAD_RIGHT": "nudge_x_pos",
                    "LEFT_BUMPER": "scale_down",
                    "RIGHT_BUMPER": "scale_up",
                    "LEFT_TRIGGER": "rotate_ccw",
                    "RIGHT_TRIGGER": "rotate_cw",
                  }
                };
                setController(preset);
                onUpdate(preset);
              }}
              data-testid="button-preset-standard"
            >
              Standard Transform Controls
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full text-[10px] h-7"
              onClick={() => {
                const preset: ControllerBinding = {
                  ...controller,
                  bindings: {
                    "A": "on_press",
                    "B": "on_release",
                    "X": "snap_to_grid",
                    "Y": "reset_transform",
                  }
                };
                setController(preset);
                onUpdate(preset);
              }}
              data-testid="button-preset-minimal"
            >
              Minimal (A/B/X/Y only)
            </Button>
          </div>
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

// Collaboration UI Components
function CollaboratorAvatars({ users, myColor }: { users: CollabUser[]; myColor: string }) {
  if (users.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1">
      <Users className="w-3 h-3 text-muted-foreground mr-1" />
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: user.color }}
            title={user.name || user.id.slice(0, 8)}
          >
            {(user.name || user.id).slice(0, 2).toUpperCase()}
          </motion.div>
        ))}
        {users.length > 5 && (
          <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[8px] font-bold">
            +{users.length - 5}
          </div>
        )}
      </div>
      <div 
        className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-[8px] font-bold text-white ml-1"
        style={{ backgroundColor: myColor }}
        title="You"
      >
        ME
      </div>
    </div>
  );
}

function RemoteCursor({ user }: { user: CollabUser }) {
  if (!user.cursor) return null;
  
  // Cursor coordinates are normalized (0-1), convert to percentages
  const left = `${user.cursor.x * 100}%`;
  const top = `${user.cursor.y * 100}%`;
  
  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      style={{ left, top }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path 
          d="M5 3L19 12L12 13L9 20L5 3Z" 
          fill={user.color} 
          stroke="white" 
          strokeWidth="1"
        />
      </svg>
      <div 
        className="absolute left-5 top-4 px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name || user.id.slice(0, 8)}
      </div>
    </motion.div>
  );
}

// Main Editor
export default function BluPrinceEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartridge, setCartridge] = useState<TossCartridge>(createNewCartridge());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"pending" | "running" | "pass" | "fail">("pending");
  const [showFSMEditor, setShowFSMEditor] = useState(false);
  const [showController, setShowController] = useState(false);
  const [showControllerMappings, setShowControllerMappings] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);
  const [colorIcons, setColorIcons] = useState(true);
  const [activeTool, setActiveTool] = useState<PhysicsTool>('select');
  const [toolPower, setToolPower] = useState(100);
  const [magnetPolarity, setMagnetPolarity] = useState<'attract' | 'repel'>('attract');
  const [magnetizedObjects, setMagnetizedObjects] = useState<Set<string>>(new Set());
  const [environmentalForces, setEnvironmentalForces] = useState<ForceConfig[]>(DEFAULT_FORCES);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [collaborationEnabled, setCollaborationEnabled] = useState(false);
  const [gestureState, setGestureState] = useState<GestureState>(createGestureState());
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{ percent: number; stage: string; message: string } | null>(null);
  const [waterContainers, setWaterContainers] = useState<WaterContainerConfig[]>([]);
  const [activeWaterContainerId, setActiveWaterContainerId] = useState<string | null>(null);
  const [viewportAngle, setViewportAngle] = useState<ViewportAngle>("perspective");
  const [tossFile] = useState<TossFile>(createNewTossFile());
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const rigidBodyRegistry = useRef<Map<string, RapierRigidBody>>(new Map());
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const roomId = useMemo(() => {
    return `editor-${cartridge.meta?.title?.replace(/\s+/g, '-').toLowerCase() || 'default'}`;
  }, [cartridge.meta?.title]);
  
  const collab = useCollaboration<TossCartridge>({
    roomId,
    userId: user?.id || `anon-${Math.random().toString(36).slice(2, 8)}`,
    userName: user?.firstName || 'Anonymous',
    initialState: cartridge,
    autoConnect: collaborationEnabled && !!user,
    onStateChange: useCallback((newState: TossCartridge, userId: string) => {
      if (userId !== user?.id) {
        setCartridge(newState);
      }
    }, [user?.id]),
    onUserJoin: useCallback((joinedUser: CollabUser) => {
      toast({
        title: "User Joined",
        description: `${joinedUser.name || joinedUser.id.slice(0, 8)} joined the session`,
      });
    }, [toast]),
    onUserLeave: useCallback((leftUserId: string) => {
      toast({
        title: "User Left",
        description: "A collaborator left the session",
      });
    }, [toast]),
  });
  
  const handleRegisterBody = useCallback((id: string, body: RapierRigidBody | null) => {
    if (body) {
      rigidBodyRegistry.current.set(id, body);
    } else {
      rigidBodyRegistry.current.delete(id);
    }
  }, []);

  const mode = cartridge._editor?.mode || "DESIGN";
  const gravityEnabled = cartridge._editor?.gravity_enabled ?? true;
  const selectedItem = cartridge.items.find(i => i.id === selectedId);
  
  // Sync collaboration: Simple debounced broadcast, remote updates handled via onStateChange callback
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced sync of local cartridge changes to collaboration
  const syncCartridgeToCollab = useCallback((newCartridge: TossCartridge) => {
    if (!collaborationEnabled || !collab.isJoined) return;
    
    // Clear any pending sync
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Debounce syncs by 150ms to batch rapid edits
    syncTimeoutRef.current = setTimeout(() => {
      collab.sendFullState(newCartridge);
    }, 150);
  }, [collaborationEnabled, collab.isJoined, collab.sendFullState]);
  
  // Wrapper that updates cartridge AND syncs to collab
  const updateCartridgeWithSync = useCallback((
    updater: TossCartridge | ((prev: TossCartridge) => TossCartridge)
  ) => {
    setCartridge(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      syncCartridgeToCollab(next);
      return next;
    });
  }, [syncCartridgeToCollab]);
  
  // Update item FSM (syncs to collab)
  const updateItemFSM = useCallback((fsm: ItemFSM) => {
    if (!selectedId) return;
    updateCartridgeWithSync(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === selectedId ? { ...item, fsm } : item
      )
    }));
  }, [selectedId, updateCartridgeWithSync]);

  // Assertion management (syncs to collab)
  const addAssertion = useCallback((assertion: UserAssertion) => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      tests: {
        ...prev.tests!,
        assertions: [...(prev.tests?.assertions || []), assertion],
        all_passed: false,
      }
    }));
    setTestStatus("pending");
    toast({ title: "Assertion Added", description: assertion.description });
  }, [toast, updateCartridgeWithSync]);

  const removeAssertion = useCallback((id: string) => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      tests: {
        ...prev.tests!,
        assertions: prev.tests?.assertions.filter(a => a.id !== id) || [],
        all_passed: false,
      }
    }));
    setTestStatus("pending");
  }, [updateCartridgeWithSync]);

  // Update item controller bindings (syncs to collab)
  const updateItemController = useCallback((controller: ControllerBinding) => {
    if (!selectedId) return;
    updateCartridgeWithSync(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === selectedId ? { ...item, controller } : item
      )
    }));
  }, [selectedId, updateCartridgeWithSync]);

  // Update controller presets (syncs to collab)
  const updateControllerPresets = useCallback((presets: ControllerPreset[]) => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      controllerPresets: presets,
    }));
  }, [updateCartridgeWithSync]);

  // Set active controller preset
  const setActiveControllerPreset = useCallback((presetId: string) => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      _editor: {
        ...prev._editor!,
        activeControllerPresetId: presetId,
      },
    }));
  }, [updateCartridgeWithSync]);

  // Handle 3D asset import
  const handleImport3DAsset = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileToImport = files[0];
    const fileName = fileToImport.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const allowedFormats = ['gltf', 'glb', 'obj', 'stl', 'json'];
    if (!allowedFormats.includes(ext)) {
      toast({
        title: "Invalid Format",
        description: `Only ${allowedFormats.join(', ').toUpperCase()} files are supported`,
        variant: "destructive",
      });
      return;
    }
    
    setImportProgress({ percent: 10, stage: 'Reading file', message: 'Loading...' });
    
    try {
      const buffer = await fileToImport.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      
      setImportProgress({ percent: 50, stage: 'Processing', message: 'Parsing...' });
      
      const newAsset = {
        id: `asset_${Date.now()}`,
        type: 'model' as const,
        metadata: {
          name: fileName.replace(/\.[^.]+$/, ''),
          format: ext as any,
          fileSize: buffer.byteLength,
          importedAt: new Date().toISOString(),
          originalFilename: fileName,
        },
        data: base64,
      };
      
      setImportProgress({ percent: 90, stage: 'Saving', message: 'Adding to cartridge...' });
      
      updateCartridgeWithSync(prev => ({
        ...prev,
        assets: {
          ...prev.assets,
          models: [...(prev.assets?.models || []), newAsset],
        },
      }));
      
      toast({
        title: "3D Asset Imported",
        description: `${newAsset.metadata.name} (${ext.toUpperCase()}) added`,
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setImportProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [updateCartridgeWithSync, toast]);

  // Handle 3D asset deletion
  const handleDeleteAsset = useCallback((assetId: string) => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        models: (prev.assets?.models || []).filter(a => a.id !== assetId),
      },
    }));
    
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
    }
    
    toast({
      title: "Asset Deleted",
      description: "3D asset removed from cartridge",
    });
  }, [updateCartridgeWithSync, selectedAssetId, toast]);

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

  // Handle controller transform actions (syncs to collab)
  const applyTransformAction = useCallback((action: string) => {
    if (!selectedId) return;
    
    const nudgeAmount = 0.25;
    const scaleAmount = 0.1;
    const rotateAmount = 15; // degrees
    
    updateCartridgeWithSync(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== selectedId) return item;
        
        const pos = { ...item.transform.position };
        const rot = { ...item.transform.rotation };
        const scale = { ...item.transform.scale };
        
        switch (action) {
          case "nudge_x_pos": pos.x += nudgeAmount; break;
          case "nudge_x_neg": pos.x -= nudgeAmount; break;
          case "nudge_y_pos": pos.y += nudgeAmount; break;
          case "nudge_y_neg": pos.y -= nudgeAmount; break;
          case "nudge_z_pos": pos.z += nudgeAmount; break;
          case "nudge_z_neg": pos.z -= nudgeAmount; break;
          case "scale_up":
            scale.x *= (1 + scaleAmount);
            scale.y *= (1 + scaleAmount);
            scale.z *= (1 + scaleAmount);
            break;
          case "scale_down":
            scale.x *= (1 - scaleAmount);
            scale.y *= (1 - scaleAmount);
            scale.z *= (1 - scaleAmount);
            break;
          case "rotate_cw":
            rot.y += rotateAmount;
            break;
          case "rotate_ccw":
            rot.y -= rotateAmount;
            break;
          case "snap_to_grid":
            pos.x = Math.round(pos.x);
            pos.y = Math.round(pos.y);
            pos.z = Math.round(pos.z);
            break;
          case "reset_transform":
            return {
              ...item,
              transform: {
                position: { x: 0, y: 2, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 }
              }
            };
        }
        
        return {
          ...item,
          transform: { position: pos, rotation: rot, scale }
        };
      })
    }));
  }, [selectedId, updateCartridgeWithSync]);

  // Controller input loop - poll for button presses and execute bound actions
  const lastPressedRef = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    if (!selectedItem?.controller) return;
    
    const pollController = () => {
      const gamepads = navigator.getGamepads();
      const pad = gamepads[0];
      if (!pad) return;
      
      const bindings = selectedItem.controller!.bindings;
      const buttonIndexMap: Record<string, number> = {
        "A": 0, "B": 1, "X": 2, "Y": 3,
        "LEFT_BUMPER": 4, "RIGHT_BUMPER": 5,
        "LEFT_TRIGGER": 6, "RIGHT_TRIGGER": 7,
        "SELECT": 8, "START": 9,
        "LEFT_STICK_CLICK": 10, "RIGHT_STICK_CLICK": 11,
        "DPAD_UP": 12, "DPAD_DOWN": 13, "DPAD_LEFT": 14, "DPAD_RIGHT": 15,
        "HOME": 16,
      };
      
      // Check each binding
      Object.entries(bindings).forEach(([button, action]) => {
        const idx = buttonIndexMap[button];
        if (idx === undefined) return;
        
        const isPressed = pad.buttons[idx]?.pressed;
        const wasPressed = lastPressedRef.current.has(idx);
        
        // Trigger on button down (not held)
        if (isPressed && !wasPressed) {
          applyTransformAction(action);
          lastPressedRef.current.add(idx);
        } else if (!isPressed && wasPressed) {
          lastPressedRef.current.delete(idx);
        }
      });
    };
    
    const interval = setInterval(pollController, 50);
    return () => clearInterval(interval);
  }, [selectedItem?.controller, applyTransformAction]);

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

  // Shape type to color mapping
  const shapeColors: Record<string, string> = {
    box: "#7c3aed",
    sphere: "#ff6b6b", 
    cone: "#fbbf24",
    cylinder: "#34d399",
    tetrahedron: "#f472b6",
    octahedron: "#60a5fa",
    icosahedron: "#a78bfa",
    dodecahedron: "#2dd4bf",
    torus: "#fb923c",
  };

  const addComponent = (type: string) => {
    // Drop from above Ground Zero
    const dropHeight = 5 + Math.random() * 3;
    const xOffset = (Math.random() - 0.5) * 4;
    const zOffset = (Math.random() - 0.5) * 4;
    
    const color = shapeColors[type] || "#7c3aed";

    const newThing = createThing(
      `mesh_${type}`,
      { x: xOffset, y: dropHeight, z: zOffset },
      { color }
    );

    // Set the correct bounds type for all shapes
    newThing.bounds.type = type as Bounds["type"];
    if (type === "sphere") {
      newThing.bounds.radius = 0.5;
    }

    // If gravity disabled, make it float
    if (!gravityEnabled) {
      newThing.physics = { ...newThing.physics!, gravityScale: 0 };
    } else {
      // Enable dropping animation - item will fall, then anchor after landing
      newThing.physics = { ...newThing.physics!, dropping: true };
    }

    updateCartridgeWithSync(prev => ({
      ...prev,
      items: [...prev.items, newThing]
    }));

    setSelectedId(newThing.id);

    // After a delay, remove the dropping flag so item becomes anchored in DESIGN mode
    if (gravityEnabled) {
      const itemId = newThing.id;
      setTimeout(() => {
        updateCartridgeWithSync(prev => ({
          ...prev,
          items: prev.items.map(item => 
            item.id === itemId 
              ? { ...item, physics: { ...item.physics!, dropping: false } }
              : item
          )
        }));
      }, 2500); // Give 2.5 seconds for drop animation
    }

    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Created`,
      description: gravityEnabled 
        ? "Watch it fall to Ground Zero!" 
        : "Floating in zero-g...",
    });
  };

  // Layer visibility management
  const toggleLayerVisibility = useCallback((id: string) => {
    setHiddenLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Delete item from scene (syncs to collab)
  const deleteItem = useCallback((id: string) => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
    if (selectedId === id) {
      setSelectedId(null);
    }
    setHiddenLayers(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast({ title: "Item Deleted" });
  }, [selectedId, toast, updateCartridgeWithSync]);
  
  // Track mouse position for collaboration cursors (normalized 0-1)
  useEffect(() => {
    if (!collaborationEnabled || !collab.isJoined || !editorRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = editorRef.current?.getBoundingClientRect();
      if (rect && rect.width > 0 && rect.height > 0) {
        // Send normalized coordinates (0-1 range)
        collab.sendCursor({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };
    
    const editor = editorRef.current;
    editor.addEventListener('mousemove', handleMouseMove);
    return () => editor.removeEventListener('mousemove', handleMouseMove);
  }, [collaborationEnabled, collab.isJoined, collab.sendCursor]);

  const toggleGravity = () => {
    updateCartridgeWithSync(prev => ({
      ...prev,
      _editor: { ...prev._editor!, gravity_enabled: !gravityEnabled }
    }));
    toast({
      title: gravityEnabled ? "Gravity Disabled" : "Gravity Enabled",
      description: gravityEnabled ? "Objects will float!" : "Objects will fall!",
    });
  };

  // Environmental force handlers
  const handleForceToggle = useCallback((type: EnvironmentalForce) => {
    setEnvironmentalForces(prev => prev.map(f => 
      f.type === type ? { ...f, enabled: !f.enabled } : f
    ));
  }, []);

  const handleForceIntensityChange = useCallback((type: EnvironmentalForce, intensity: number) => {
    setEnvironmentalForces(prev => prev.map(f => 
      f.type === type ? { ...f, intensity } : f
    ));
  }, []);

  // Water container handlers
  const handleAddWaterContainer = useCallback(() => {
    const newContainer = createDefaultWaterContainer();
    setWaterContainers(prev => [...prev, newContainer]);
    setActiveWaterContainerId(newContainer.id);
    toast({ title: "Water Container Added", description: "SPLISH SPLASH!" });
  }, [toast]);

  const handleRemoveWaterContainer = useCallback((id: string) => {
    setWaterContainers(prev => prev.filter(c => c.id !== id));
    if (activeWaterContainerId === id) {
      setActiveWaterContainerId(null);
    }
  }, [activeWaterContainerId]);

  const handleUpdateWaterContainer = useCallback((id: string, updates: Partial<WaterContainerConfig>) => {
    setWaterContainers(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  }, []);

  // Get wind intensity for water waves
  const windForce = environmentalForces.find(f => f.type === 'WIND');
  const windIntensity = windForce?.enabled ? windForce.intensity : 0;

  const resetScene = () => {
    updateCartridgeWithSync(createNewCartridge());
    setSelectedId(null);
    setTestStatus("pending");
  };

  return (
    <div ref={editorRef} className="w-full h-screen bg-[#0a0a0f] relative overflow-hidden">
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
              <Link href="/data-tables">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-emerald-400 border-emerald-400/50 hover:bg-emerald-400/10"
                  data-testid="button-data-tables"
                >
                  <Database className="w-4 h-4 mr-1" /> Data
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant={showController ? "default" : "ghost"}
                onClick={() => { setShowController(!showController); setShowFSMEditor(false); }}
                className={showController ? "bg-secondary text-black" : "text-secondary"}
                data-testid="button-controller"
              >
                <Gamepad2 className="w-4 h-4 mr-1" /> Bind
              </Button>
              <Button 
                size="sm" 
                variant={showControllerMappings ? "default" : "ghost"}
                onClick={() => setShowControllerMappings(!showControllerMappings)}
                className={showControllerMappings ? "bg-orange-500 text-white" : "text-orange-400"}
                data-testid="button-controller-mappings"
              >
                <Settings className="w-4 h-4 mr-1" /> Mappings
              </Button>
              <Link href="/library">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-amber-400 border-amber-400/50 hover:bg-amber-400/10"
                  data-testid="button-library"
                >
                  <FolderOpen className="w-4 h-4 mr-1" /> Library
                </Button>
              </Link>
            </>
          )}
          <Separator orientation="vertical" className="h-6" />
          
          {/* Collaboration UI */}
          {collaborationEnabled && collab.isConnected && (
            <CollaboratorAvatars users={collab.otherUsers} myColor={collab.myColor} />
          )}
          
          <Button
            size="sm"
            variant={collaborationEnabled ? "default" : "ghost"}
            onClick={() => setShowShareDialog(true)}
            className={collaborationEnabled ? "bg-cyan-600 text-white" : "text-cyan-400"}
            data-testid="button-share"
          >
            {collaborationEnabled ? <Users className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
            {collaborationEnabled ? `${collab.otherUsers.length + 1}` : "Share"}
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowPreferences(true)}
            title="Preferences"
            data-testid="button-preferences"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button size="sm" className="bg-primary/20 text-primary border border-primary/50">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>
      </header>

      {/* Preferences Dialog */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-md bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" /> Editor Preferences
            </DialogTitle>
            <DialogDescription>
              Customize your editing experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Color Icons</Label>
                <p className="text-xs text-muted-foreground">Show shape icons in their assigned colors</p>
              </div>
              <Switch
                checked={colorIcons}
                onCheckedChange={setColorIcons}
                data-testid="switch-color-icons"
              />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Show Layers Panel</Label>
                <p className="text-xs text-muted-foreground">Display the layer management panel</p>
              </div>
              <Switch
                checked={showLayers}
                onCheckedChange={setShowLayers}
                data-testid="switch-show-layers"
              />
            </div>
            <Separator className="bg-white/10" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-white">Gravity</Label>
                <p className="text-xs text-muted-foreground">Enable physics simulation gravity</p>
              </div>
              <Switch
                checked={gravityEnabled}
                onCheckedChange={() => toggleGravity()}
                data-testid="switch-gravity"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Left Docked Panels */}
      <div className="absolute left-0 top-14 z-40 flex items-start">
        {/* Solids Panel */}
        <DockablePanel
          id="solids"
          title="Solids"
          icon={<Box className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={false}
        >
          <ComponentPalette 
            onAddComponent={addComponent} 
            onToggleLayers={() => setShowLayers(!showLayers)}
            showLayers={showLayers}
            colorIcons={colorIcons}
          />
        </DockablePanel>

        {/* Tools Panel */}
        <DockablePanel
          id="tools"
          title="Tools"
          icon={<Wrench className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={false}
        >
          <ToolsPanel
            activeTool={activeTool}
            onToolChange={setActiveTool}
            toolPower={toolPower}
            onToolPowerChange={setToolPower}
            magnetPolarity={magnetPolarity}
            onMagnetPolarityChange={setMagnetPolarity}
          />
        </DockablePanel>

        {/* Forces Panel */}
        <DockablePanel
          id="forces"
          title="Forces"
          icon={<Atom className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={true}
        >
          <EnvironmentalForcesPanel
            forces={environmentalForces}
            onForceToggle={handleForceToggle}
            onForceIntensityChange={handleForceIntensityChange}
          />
        </DockablePanel>

        {/* Water Panel */}
        <DockablePanel
          id="water"
          title="Water"
          icon={<Droplets className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={true}
        >
          <WaterControlPanel
            containers={waterContainers}
            onAddContainer={handleAddWaterContainer}
            onRemoveContainer={handleRemoveWaterContainer}
            onUpdateContainer={handleUpdateWaterContainer}
            windIntensity={windIntensity}
            activeContainerId={activeWaterContainerId}
            onSelectContainer={setActiveWaterContainerId}
          />
        </DockablePanel>

        {/* Outliner Panel - Scene Hierarchy */}
        <DockablePanel
          id="outliner"
          title="Outliner"
          icon={<Layers className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={false}
        >
          <SceneTree
            file={tossFile}
            selectedStateId={selectedStateId}
            selectedAssetId={selectedAssetId}
            onSelectState={setSelectedStateId}
            onSelectAsset={setSelectedAssetId}
            onRenameState={() => {}}
            onRenameAsset={() => {}}
            onAddState={() => {}}
          />
        </DockablePanel>

        {/* Files Panel */}
        <DockablePanel
          id="files"
          title="Files"
          icon={<FolderOpen className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={true}
        >
          <div className="p-2 space-y-3">
            <div className="text-[10px] uppercase text-muted-foreground font-bold">3D Assets</div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".gltf,.glb,.obj,.stl,.json"
              onChange={handleImport3DAsset}
              className="hidden"
              data-testid="input-3d-asset-file"
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs justify-start border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!importProgress}
              data-testid="button-import-3d-asset"
            >
              <Upload className="w-3 h-3 mr-2" /> 
              {importProgress ? importProgress.message : "Import 3D Model"}
            </Button>
            
            {importProgress && (
              <div className="mb-2">
                <div className="h-1 bg-white/10 rounded overflow-hidden">
                  <div 
                    className="h-full bg-cyan-500 transition-all"
                    style={{ width: `${importProgress.percent}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 block">{importProgress.stage}</span>
              </div>
            )}
            
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {(!cartridge.assets?.models || cartridge.assets.models.length === 0) ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Box className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-[10px]">No 3D assets</p>
                    <p className="text-[9px] opacity-60">glTF, GLB, OBJ, STL</p>
                  </div>
                ) : (
                  cartridge.assets.models.map((asset) => (
                    <div
                      key={asset.id}
                      className={`group relative p-2 rounded border transition-colors cursor-pointer ${
                        selectedAssetId === asset.id 
                          ? 'border-cyan-500/50 bg-cyan-500/10' 
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                      onClick={() => setSelectedAssetId(asset.id)}
                      data-testid={`asset-${asset.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-mono text-white truncate">
                            {asset.metadata.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[8px] h-3 px-1 border-purple-500/50 text-purple-400">
                              {asset.metadata.format.toUpperCase()}
                            </Badge>
                            <span className="text-[8px] text-muted-foreground">
                              {(asset.metadata.fileSize / 1024).toFixed(0)}KB
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAsset(asset.id);
                          }}
                          data-testid={`delete-asset-${asset.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DockablePanel>

        {/* Thing Catalog Panel */}
        <DockablePanel
          id="catalog"
          title="Catalog"
          icon={<BookOpen className="w-4 h-4" />}
          defaultDocked={true}
          defaultCollapsed={true}
        >
          <ThingCatalog 
            onSelectEntry={(entry) => console.log('Selected:', entry)}
            className="max-h-[calc(100vh-200px)]"
          />
        </DockablePanel>
      </div>

      {/* Layers Panel */}
      {showLayers && (
        <LayersPanel
          items={cartridge.items}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleVisibility={toggleLayerVisibility}
          onDelete={deleteItem}
          hiddenLayers={hiddenLayers}
          onClose={() => setShowLayers(false)}
        />
      )}

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

      {/* Controller Mappings Panel */}
      {showControllerMappings && (
        <div className="fixed right-4 top-20 bottom-4 w-80 z-40">
          <div className="h-full rounded-xl border border-zinc-700 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-3 bg-zinc-800 border-b border-zinc-700">
              <span className="text-sm font-medium text-white">Controller Mappings</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowControllerMappings(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ControllerMappingsPanel
              presets={cartridge.controllerPresets || [createDefaultControllerPreset()]}
              activePresetId={cartridge._editor?.activeControllerPresetId}
              onPresetsChange={updateControllerPresets}
              onActivePresetChange={setActiveControllerPreset}
            />
          </div>
        </div>
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
            
            {cartridge.items
              .filter(item => !hiddenLayers.has(item.id))
              .map((item) => (
                <PhysicsThing
                  key={item.id}
                  item={item}
                  isSelected={selectedId === item.id}
                  onSelect={() => setSelectedId(item.id)}
                  onTransformUpdate={handleTransformUpdate}
                  mode={mode}
                  activeTool={activeTool}
                  toolPower={toolPower}
                  isMagnetized={magnetizedObjects.has(item.id)}
                  onToggleMagnet={() => {
                    setMagnetizedObjects(prev => {
                      const next = new Set(prev);
                      if (next.has(item.id)) {
                        next.delete(item.id);
                      } else {
                        next.add(item.id);
                      }
                      return next;
                    });
                  }}
                  onRegisterBody={handleRegisterBody}
                />
              ))}
            
            <MagnetForceManager
              magnetizedObjects={magnetizedObjects}
              rigidBodyRegistry={rigidBodyRegistry}
              polarity={magnetPolarity}
              power={toolPower}
            />
            
            {/* Water Containers */}
            {waterContainers.map(container => (
              <WaterContainer
                key={container.id}
                position={container.position}
                containerType={container.containerType}
                maxVolume={container.maxVolume}
                currentVolume={container.currentVolume}
                containerRadius={container.containerRadius}
                containerHeight={container.containerHeight}
                showWaves={container.showWaves}
                windIntensity={windIntensity}
              />
            ))}
          </Physics>
          
          {/* Decorative Brass Gear Assembly */}
          <BrassGearAssembly position={[-6, 2, -4]} />
          
          {/* Environment for metallic reflections */}
          <Environment preset="city" />
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

      {/* Viewport Angles Panel - Top Right */}
      <div className="absolute top-16 right-4 z-40">
        <ViewportAnglesPanel
          currentAngle={viewportAngle}
          onAngleChange={setViewportAngle}
        />
      </div>

      {/* Remote Cursors */}
      {collaborationEnabled && collab.isConnected && (
        <AnimatePresence>
          {collab.otherUsers.map(u => (
            <RemoteCursor key={u.id} user={u} />
          ))}
        </AnimatePresence>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Real-Time Collaboration
            </DialogTitle>
            <DialogDescription>
              Enable real-time collaboration to edit this statechart with others simultaneously.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div>
                <div className="font-medium">Enable Collaboration</div>
                <div className="text-sm text-muted-foreground">
                  {collaborationEnabled ? "Sharing enabled" : "Click to enable sharing"}
                </div>
              </div>
              <Switch
                checked={collaborationEnabled}
                onCheckedChange={(checked) => {
                  setCollaborationEnabled(checked);
                  if (checked && !collab.isConnected) {
                    collab.connect();
                  } else if (!checked) {
                    collab.disconnect();
                  }
                }}
              />
            </div>
            
            {collaborationEnabled && (
              <>
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={`${window.location.origin}/editor?room=${encodeURIComponent(roomId)}`}
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/editor?room=${encodeURIComponent(roomId)}`);
                        toast({ title: "Link Copied", description: "Share link copied to clipboard" });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Connected Users ({collab.users.length})</Label>
                  <div className="space-y-1">
                    {collab.users.map(u => (
                      <div key={u.id} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: u.color }}
                        />
                        <span className="text-sm">{u.name || u.id.slice(0, 8)}</span>
                        {u.id === user?.id && (
                          <Badge variant="outline" className="ml-auto text-[10px]">You</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {collab.isConnected ? (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Connected (v{collab.version})
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Connecting...
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
        {collaborationEnabled && collab.isConnected && (
          <>
            <span>|</span>
            <span className="text-cyan-400">
              <Users className="w-3 h-3 inline mr-1" />
              {collab.users.length} online
            </span>
          </>
        )}
      </div>
    </div>
  );
}
