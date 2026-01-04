import { useState, useCallback, useRef, Suspense, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { OrbitControls, Text, Environment, Float, Html } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FolderOpen, 
  Download, 
  Upload,
  Search,
  Grid3X3,
  List,
  Gamepad2,
  ChevronLeft,
  Tag,
  Layers,
  RotateCcw,
  HelpCircle,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGamepad, GamepadInput } from "@/hooks/use-gamepad";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { TossCartridge, CartridgePreview, createNewCartridge } from "@/lib/toss";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { QRIconButton, TngliLink } from "@/components/QRCodePopup";

interface StoredCartridge {
  id: string;
  tngli_id: string;
  title: string;
  version: string;
  author: string;
  toss_file: TossCartridge;
  created_at: string;
  updated_at: string;
}

interface CartridgeCardData {
  id: string;
  tngliId: string;
  title: string;
  itemCount: number;
  assetCount: number;
  color: string;
  tags: string[];
  lastModified: string;
}

function Cartridge3D({ 
  cartridge, 
  position, 
  homePosition,
  isSelected, 
  isHovered,
  onSelect,
  shouldReset
}: { 
  cartridge: CartridgeCardData;
  position: [number, number, number];
  homePosition: [number, number, number];
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  shouldReset: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rigidBodyRef = useRef<any>(null);
  const [hovered, setHovered] = useState(false);
  
  useFrame((state) => {
    if (meshRef.current) {
      if (isSelected) {
        meshRef.current.rotation.y += 0.02;
      } else if (hovered || isHovered) {
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  useEffect(() => {
    if (shouldReset && rigidBodyRef.current) {
      rigidBodyRef.current.setTranslation({ x: homePosition[0], y: homePosition[1], z: homePosition[2] });
      rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 });
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 });
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 });
      // Wake up the body after reset so physics continues
      rigidBodyRef.current.wakeUp();
    }
  }, [shouldReset, homePosition]);

  const color = new THREE.Color(cartridge.color);
  const emissiveIntensity = isSelected ? 0.5 : hovered || isHovered ? 0.2 : 0;

  // Wake up the body when component mounts to ensure physics simulation starts
  useEffect(() => {
    if (rigidBodyRef.current) {
      rigidBodyRef.current.wakeUp();
    }
  }, []);
  
  return (
    <RigidBody 
      ref={rigidBodyRef}
      type="dynamic" 
      position={position} 
      colliders={false} 
      restitution={0.3} 
      friction={0.8}
      mass={1}
      linearDamping={0.1}
      angularDamping={0.1}
      ccd={true}
    >
      <CuboidCollider args={[0.6, 0.12, 0.85]} mass={1} />
      <group>
        <mesh
          ref={meshRef}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[1.2, 0.24, 1.7]} />
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            metalness={0.3}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
          />
        </mesh>
        
        <mesh position={[0, 0.125, 0]}>
          <boxGeometry args={[1.0, 0.02, 1.4]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} metalness={0.1} />
        </mesh>
        
        <mesh position={[0, 0.135, 0]}>
          <boxGeometry args={[0.95, 0.01, 1.35]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
        
        <mesh position={[0, 0.14, -0.55]}>
          <boxGeometry args={[0.85, 0.02, 0.2]} />
          <meshStandardMaterial color={new THREE.Color(cartridge.color).multiplyScalar(0.7)} roughness={0.5} />
        </mesh>
        
        <Text
          position={[0, 0.16, -0.08]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.11}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.9}
          font="/fonts/pixel.woff"
          letterSpacing={0.05}
        >
          {cartridge.title.toUpperCase()}
        </Text>
        
        <Text
          position={[0, 0.155, 0.25]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.05}
          color="#666666"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
        >
          {cartridge.itemCount} THINGS
        </Text>
        
        <Text
          position={[0, 0.155, 0.35]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.04}
          color="#444444"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.03}
        >
          TINGOS COMPATIBLE
        </Text>
        
        <mesh position={[0, -0.05, 0.7]}>
          <boxGeometry args={[0.3, 0.08, 0.2]} />
          <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
        </mesh>

        {isSelected && (
          <Html position={[0, 0.6, 0]} center>
            <div className="bg-black/90 px-3 py-2 rounded border border-violet-500/50 text-white text-xs whitespace-nowrap font-mono">
              <span className="text-green-400">A</span> OPEN | <span className="text-red-400">X</span> DELETE
            </div>
          </Html>
        )}
      </group>
    </RigidBody>
  );
}

function Ground() {
  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[50, 0.5, 50]} position={[0, -0.5, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#18181b" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      <gridHelper args={[50, 50, "#333333", "#222222"]} position={[0, 0.01, 0]} />
    </RigidBody>
  );
}

function CartridgeScene({ 
  cartridges, 
  selectedId, 
  hoveredId,
  onSelect,
  resetTrigger
}: {
  cartridges: CartridgeCardData[];
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  resetTrigger: number;
}) {
  const homePositions = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(cartridges.length));
    return cartridges.map((_, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      return [
        (col - (cols - 1) / 2) * 2.2,
        0.5,
        (row - Math.floor(cartridges.length / cols) / 2) * 2.8
      ] as [number, number, number];
    });
  }, [cartridges.length]);

  return (
    <Physics gravity={[0, -9.81, 0]}>
      <Ground />
      {cartridges.map((cartridge, i) => (
        <Cartridge3D
          key={cartridge.id}
          cartridge={cartridge}
          position={homePositions[i]}
          homePosition={homePositions[i]}
          isSelected={selectedId === cartridge.id}
          isHovered={hoveredId === cartridge.id}
          onSelect={() => onSelect(cartridge.id)}
          shouldReset={resetTrigger > 0}
        />
      ))}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} color="#7c3aed" />
    </Physics>
  );
}

export default function CartridgeLibrary() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"3d" | "list">("3d");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleReset = useCallback(() => {
    setResetTrigger(prev => prev + 1);
    setTimeout(() => setResetTrigger(0), 100);
    toast({ title: "Cartridges Reset", description: "All cartridges returned to home positions" });
  }, [toast]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newCartridgeName, setNewCartridgeName] = useState("");
  const [newCartridgeDescription, setNewCartridgeDescription] = useState("");

  const { data: cartridges = [], isLoading } = useQuery<StoredCartridge[]>({
    queryKey: ["/api/cartridges"],
    queryFn: async () => {
      const res = await fetch("/api/cartridges");
      if (!res.ok) throw new Error("Failed to load cartridges");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      const newCartridge = createNewCartridge();
      newCartridge.meta.title = data.title;
      newCartridge.meta.description = data.description;
      newCartridge.meta.author_platform_id = user?.id;
      
      const res = await apiRequest("POST", "/api/cartridges", {
        tngli_id: `tngl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title,
        version: "0.1.0",
        author: user?.firstName || "Anonymous",
        toss_file: newCartridge,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
      toast({ title: "Cartridge Created", description: `Created "${newCartridgeName}"` });
      setShowNewDialog(false);
      setNewCartridgeName("");
      setNewCartridgeDescription("");
    },
    onError: (error) => {
      toast({ title: "Error", description: "Failed to create cartridge", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cartridges/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cartridges"] });
      toast({ title: "Cartridge Deleted" });
      setSelectedId(null);
      setShowDeleteDialog(false);
    },
  });

  const cartridgeCards: CartridgeCardData[] = useMemo(() => 
    cartridges.map(c => ({
      id: c.id,
      tngliId: c.tngli_id,
      title: c.title,
      itemCount: c.toss_file?.items?.length || 0,
      assetCount: c.toss_file?.assets?.models?.length || 0,
      color: c.toss_file?.preview?.primaryColor || "#7c3aed",
      tags: c.toss_file?.preview?.tags || [],
      lastModified: c.updated_at,
    })),
    [cartridges]
  );

  const filteredCartridges = useMemo(() => 
    cartridgeCards.filter(c => 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [cartridgeCards, searchQuery]
  );

  const selectedCartridge = cartridges.find(c => c.id === selectedId);
  const hoveredCartridge = filteredCartridges[hoveredIndex];

  const { input, hasGamepad } = useGamepad({
    onInput: useCallback((input: GamepadInput) => {
      if (input.dpadDown || input.leftStickY > 0.5) {
        setHoveredIndex(prev => Math.min(prev + 1, filteredCartridges.length - 1));
      }
      if (input.dpadUp || input.leftStickY < -0.5) {
        setHoveredIndex(prev => Math.max(prev - 1, 0));
      }
      if (input.a && hoveredCartridge) {
        if (selectedId === hoveredCartridge.id) {
          setLocation(`/editor?cartridge=${hoveredCartridge.id}`);
        } else {
          setSelectedId(hoveredCartridge.id);
        }
      }
      if (input.b) {
        setSelectedId(null);
      }
      if (input.x && selectedId) {
        setShowDeleteDialog(true);
      }
      if (input.y) {
        setShowNewDialog(true);
      }
    }, [filteredCartridges.length, hoveredCartridge, selectedId]),
  });

  const handleOpenCartridge = useCallback((id: string) => {
    setLocation(`/editor?cartridge=${id}`);
  }, [setLocation]);

  return (
    <div className="h-screen w-full bg-zinc-950 text-white flex flex-col overflow-hidden" data-testid="cartridge-library-page">
      <header className="sticky top-0 z-10 p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Home
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-violet-400" />
            <h1 className="text-lg font-semibold">Cartridge Library</h1>
          </div>
          <Badge variant="outline" className="text-zinc-400">
            {filteredCartridges.length} cartridges
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cartridges..."
              className="pl-9 w-64 bg-zinc-900 border-zinc-700"
              data-testid="input-search-cartridges"
            />
          </div>

          <div className="flex items-center border border-zinc-700 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "3d" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("3d")}
              className="rounded-none"
              data-testid="button-view-3d"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          {viewMode === "3d" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleReset}
              className="bg-gradient-to-b from-zinc-600 to-zinc-800 border-2 border-zinc-500 hover:from-zinc-500 hover:to-zinc-700 text-white font-mono tracking-wider shadow-lg"
              data-testid="button-reset"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              RESET
            </Button>
          )}
          
          <Link href="/library?load=help">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-violet-400 hover:text-violet-300"
              data-testid="button-help"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </Link>

          <Button onClick={() => setShowNewDialog(true)} data-testid="button-new-cartridge">
            <Plus className="w-4 h-4 mr-2" />
            New Cartridge
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {viewMode === "3d" ? (
          <div className="flex-1 relative">
            <Canvas shadows camera={{ position: [8, 8, 8], fov: 50 }}>
              <Suspense fallback={null}>
                <CartridgeScene
                  cartridges={filteredCartridges}
                  selectedId={selectedId}
                  hoveredId={hoveredCartridge?.id || null}
                  onSelect={setSelectedId}
                  resetTrigger={resetTrigger}
                />
                <OrbitControls 
                  makeDefault 
                  minPolarAngle={Math.PI / 6} 
                  maxPolarAngle={Math.PI / 2.5}
                  minDistance={5}
                  maxDistance={30}
                />
                <Environment preset="night" />
              </Suspense>
            </Canvas>

            {hasGamepad && (
              <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
                  <Gamepad2 className="w-4 h-4" />
                  Controller Connected
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>D-Pad/Stick: Navigate</span>
                  <span>A: Select/Open</span>
                  <span>B: Deselect</span>
                  <span>X: Delete</span>
                  <span>Y: New Cartridge</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCartridges.map((cartridge, index) => (
                <motion.div
                  key={cartridge.id}
                  className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                    selectedId === cartridge.id
                      ? 'bg-violet-500/20 border-violet-500'
                      : hoveredIndex === index
                        ? 'bg-zinc-800 border-zinc-600'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                  onClick={() => setSelectedId(cartridge.id)}
                  onDoubleClick={() => handleOpenCartridge(cartridge.id)}
                  whileHover={{ scale: 1.02 }}
                  data-testid={`card-cartridge-${cartridge.id}`}
                >
                  <div 
                    className="w-full h-24 rounded-lg mb-3 relative"
                    style={{ backgroundColor: cartridge.color }}
                  >
                    <QRIconButton 
                      tngliId={cartridge.tngliId} 
                      title={cartridge.title}
                      size="sm"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                    />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{cartridge.title}</h3>
                  <p className="text-xs text-zinc-400 mb-2">
                    {cartridge.itemCount} items | {cartridge.assetCount} assets
                  </p>
                  {cartridge.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cartridge.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {selectedCartridge && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-zinc-800 bg-zinc-900 overflow-hidden"
            >
              <div className="p-4 space-y-4 w-80">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{selectedCartridge.title}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedId(null)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>

                <div 
                  className="w-full h-32 rounded-lg"
                  style={{ backgroundColor: selectedCartridge.toss_file?.preview?.primaryColor || "#7c3aed" }}
                />

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-zinc-500">tng.li ID:</span>
                  <TngliLink 
                    tngliId={selectedCartridge.tngli_id} 
                    title={selectedCartridge.title}
                    showFull={false}
                    size="sm"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Version</span>
                    <span>{selectedCartridge.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Author</span>
                    <span>{selectedCartridge.author}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Items</span>
                    <span>{selectedCartridge.toss_file?.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">3D Assets</span>
                    <span>{selectedCartridge.toss_file?.assets?.models?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Controller Presets</span>
                    <span>{selectedCartridge.toss_file?.controllerPresets?.length || 0}</span>
                  </div>
                </div>

                {(selectedCartridge.toss_file?.preview?.tags?.length ?? 0) > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs text-zinc-400">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedCartridge.toss_file?.preview?.tags?.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 space-y-3">
                  <Link href={`/runtime?cartridge=${selectedCartridge.tngli_id}`}>
                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-lg shadow-lg shadow-green-500/20" 
                      data-testid="button-play-cartridge"
                    >
                      <Play className="w-6 h-6 mr-2 fill-current" />
                      PLAY
                    </Button>
                  </Link>
                  <Button 
                    variant="outline"
                    className="w-full" 
                    onClick={() => handleOpenCartridge(selectedCartridge.id)}
                    data-testid="button-open-cartridge"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Open in Editor
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-red-400 hover:text-red-300"
                      onClick={() => setShowDeleteDialog(true)}
                      data-testid="button-delete-cartridge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Create New Cartridge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newCartridgeName}
                onChange={(e) => setNewCartridgeName(e.target.value)}
                placeholder="My Awesome Cartridge"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-cartridge-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={newCartridgeDescription}
                onChange={(e) => setNewCartridgeDescription(e.target.value)}
                placeholder="What's this cartridge for?"
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-cartridge-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => createMutation.mutate({ 
                title: newCartridgeName, 
                description: newCartridgeDescription 
              })}
              disabled={!newCartridgeName.trim() || createMutation.isPending}
              data-testid="button-create-cartridge"
            >
              {createMutation.isPending ? "Creating..." : "Create Cartridge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Delete Cartridge</DialogTitle>
          </DialogHeader>
          <p className="text-zinc-400">
            Are you sure you want to delete "{selectedCartridge?.title}"? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive"
              onClick={() => selectedId && deleteMutation.mutate(selectedId)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
