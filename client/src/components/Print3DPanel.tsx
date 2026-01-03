import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Center, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Droplets, Box, AlertTriangle, CheckCircle, Wrench, 
  Download, RotateCw, Layers, Ruler, Volume2, Upload,
  Printer, Eye, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "react-i18next";
import { Hint } from "@/components/ui/Hint";

interface MeshAnalysis {
  isWatertight: boolean;
  boundaryEdges: number;
  nonManifoldEdges: number;
  volume: number;
  surfaceArea: number;
  triangleCount: number;
  leakPoints: THREE.Vector3[];
}

interface LeakParticle {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
}

function LeakParticles({ leakPoints, active }: { leakPoints: THREE.Vector3[]; active: boolean }) {
  const particlesRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<LeakParticle[]>([]);
  const particleCount = 500;

  useEffect(() => {
    if (!active || leakPoints.length === 0) {
      setParticles([]);
      return;
    }

    const newParticles: LeakParticle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const leakPoint = leakPoints[Math.floor(Math.random() * leakPoints.length)];
      newParticles.push({
        id: i,
        position: leakPoint.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1,
          (Math.random() - 0.5) * 0.1
        )),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          -0.02 - Math.random() * 0.03,
          (Math.random() - 0.5) * 0.02
        ),
        life: Math.random(),
      });
    }
    setParticles(newParticles);
  }, [active, leakPoints]);

  useFrame((_, delta) => {
    if (!active || particles.length === 0) return;

    setParticles(prev => prev.map(p => {
      const newPos = p.position.clone().add(p.velocity.clone().multiplyScalar(delta * 60));
      const newLife = p.life - delta * 0.5;
      
      if (newLife <= 0) {
        const leakPoint = leakPoints[Math.floor(Math.random() * leakPoints.length)];
        return {
          ...p,
          position: leakPoint.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.1
          )),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            -0.02 - Math.random() * 0.03,
            (Math.random() - 0.5) * 0.02
          ),
          life: 1,
        };
      }
      
      return { ...p, position: newPos, life: newLife };
    }));

    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position;
      const colors = particlesRef.current.geometry.attributes.color;
      
      particles.forEach((p, i) => {
        positions.setXYZ(i, p.position.x, p.position.y, p.position.z);
        colors.setXYZ(i, 0.2, 0.6 + p.life * 0.4, 1);
      });
      
      positions.needsUpdate = true;
      colors.needsUpdate = true;
    }
  });

  if (!active || particles.length === 0) return null;

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  particles.forEach((p, i) => {
    positions[i * 3] = p.position.x;
    positions[i * 3 + 1] = p.position.y;
    positions[i * 3 + 2] = p.position.z;
    colors[i * 3] = 0.2;
    colors[i * 3 + 1] = 0.6 + p.life * 0.4;
    colors[i * 3 + 2] = 1;
  });

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, colors]);

  return (
    <points ref={particlesRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function DemoMesh({ showLeaks, analysis }: { showLeaks: boolean; analysis: MeshAnalysis }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.TorusKnotGeometry(0.6, 0.2, 64, 16);
    return geo;
  }, []);

  return (
    <Center>
      <group>
        <mesh
          ref={meshRef}
          geometry={geometry}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial
            color={analysis.isWatertight ? "#22c55e" : "#ef4444"}
            wireframe={showLeaks && !analysis.isWatertight}
            transparent
            opacity={hovered ? 0.9 : 0.8}
          />
        </mesh>
        
        <LeakParticles 
          leakPoints={analysis.leakPoints} 
          active={showLeaks && !analysis.isWatertight} 
        />

        {showLeaks && !analysis.isWatertight && analysis.leakPoints.map((point, i) => (
          <mesh key={i} position={point}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        ))}
      </group>
    </Center>
  );
}

function PrintBed({ width = 220, depth = 220, height = 250 }: { width?: number; depth?: number; height?: number }) {
  const scale = 0.01;
  
  return (
    <group position={[0, -1, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * scale, depth * scale]} />
        <meshStandardMaterial color="#333" opacity={0.5} transparent />
      </mesh>
      
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(width * scale, height * scale, depth * scale)]} />
        <lineBasicMaterial color="#666" />
      </lineSegments>
    </group>
  );
}

function SceneSetup() {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  
  return null;
}

export type PrintMode = 'view' | 'validate' | 'repair';

interface Print3DPanelProps {
  className?: string;
}

export function Print3DPanel({ className = "" }: Print3DPanelProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<PrintMode>('view');
  const [showLeaks, setShowLeaks] = useState(true);
  const [bedSize, setBedSize] = useState({ width: 220, depth: 220, height: 250 });
  
  const demoAnalysis: MeshAnalysis = useMemo(() => ({
    isWatertight: false,
    boundaryEdges: 12,
    nonManifoldEdges: 3,
    volume: 15234.5,
    surfaceArea: 8432.1,
    triangleCount: 4096,
    leakPoints: [
      new THREE.Vector3(0.5, 0.3, 0.2),
      new THREE.Vector3(-0.4, -0.2, 0.5),
      new THREE.Vector3(0.1, 0.6, -0.3),
    ],
  }), []);

  return (
    <div className={`flex flex-col h-full bg-gray-950 rounded-xl overflow-hidden border border-purple-500/20 ${className}`}>
      <div className="flex items-center justify-between p-3 border-b border-purple-900/30 bg-black/30">
        <div className="flex items-center gap-3">
          <Printer className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-white">3D Print Lab</span>
        </div>
        
        <Tabs value={mode} onValueChange={(v) => setMode(v as PrintMode)} className="w-auto">
          <TabsList className="bg-black/50 border border-purple-900/30 h-8">
            <Hint text="View and rotate model">
              <TabsTrigger value="view" className="text-xs h-7 px-3 data-[state=active]:bg-purple-900/50">
                <Eye className="w-3 h-3 mr-1" />
                View
              </TabsTrigger>
            </Hint>
            <Hint text="Check for printing issues">
              <TabsTrigger value="validate" className="text-xs h-7 px-3 data-[state=active]:bg-purple-900/50">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Validate
              </TabsTrigger>
            </Hint>
            <Hint text="Fix mesh problems">
              <TabsTrigger value="repair" className="text-xs h-7 px-3 data-[state=active]:bg-purple-900/50">
                <Wrench className="w-3 h-3 mr-1" />
                Repair
              </TabsTrigger>
            </Hint>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2">
          <Hint text="Import STL/OBJ model">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-400">
              <Upload className="w-3 h-3 mr-1" />
              Import
            </Button>
          </Hint>
          <Hint text="Export watertight STL">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-cyan-400">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
          </Hint>
        </div>
      </div>

      <div className="flex-1 relative">
        <Canvas shadows camera={{ fov: 50 }}>
          <SceneSetup />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.3} color="#7c3aed" />
          
          <Suspense fallback={null}>
            <DemoMesh showLeaks={mode === 'validate' && showLeaks} analysis={demoAnalysis} />
          </Suspense>
          
          <PrintBed {...bedSize} />
          
          <Grid
            args={[10, 10]}
            position={[0, -1.01, 0]}
            cellSize={0.5}
            cellThickness={0.3}
            cellColor="#333"
            sectionSize={2}
            sectionThickness={0.5}
            sectionColor="#444"
            fadeDistance={15}
          />
          
          <OrbitControls enablePan enableZoom enableRotate minDistance={2} maxDistance={15} />
        </Canvas>

        {mode === 'validate' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-64 bg-black/80 backdrop-blur rounded-lg border border-purple-500/30 p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                {demoAnalysis.isWatertight ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
                <span className="font-semibold text-white text-sm">
                  {demoAnalysis.isWatertight ? "Watertight" : "Leaks Detected"}
                </span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Boundary Edges</span>
                  <span className={demoAnalysis.boundaryEdges > 0 ? "text-red-400" : "text-green-400"}>
                    {demoAnalysis.boundaryEdges}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Non-manifold</span>
                  <span className={demoAnalysis.nonManifoldEdges > 0 ? "text-yellow-400" : "text-green-400"}>
                    {demoAnalysis.nonManifoldEdges}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume</span>
                  <span className="text-white font-mono">{demoAnalysis.volume.toFixed(1)} mm³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Surface Area</span>
                  <span className="text-white font-mono">{demoAnalysis.surfaceArea.toFixed(1)} mm²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Triangles</span>
                  <span className="text-white font-mono">{demoAnalysis.triangleCount.toLocaleString()}</span>
                </div>
              </div>
              
              {!demoAnalysis.isWatertight && (
                <div className="mt-4 pt-3 border-t border-purple-900/30">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLeaks}
                      onChange={(e) => setShowLeaks(e.target.checked)}
                      className="accent-cyan-500"
                    />
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    Show leak animation
                  </label>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {mode === 'repair' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur rounded-lg border border-purple-500/30 p-4"
          >
            <div className="flex items-center gap-4">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Wrench className="w-3 h-3 mr-1" />
                Auto-Repair Holes
              </Button>
              <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400">
                <Layers className="w-3 h-3 mr-1" />
                Fill Selected
              </Button>
              <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400">
                <RotateCw className="w-3 h-3 mr-1" />
                Recalc Normals
              </Button>
              <div className="flex-1" />
              <Badge variant="outline" className="text-[10px] bg-black/50 border-yellow-500/50 text-yellow-400">
                {demoAnalysis.leakPoints.length} holes detected
              </Badge>
            </div>
          </motion.div>
        )}

        <div className="absolute bottom-4 left-4 flex gap-2">
          <Badge variant="outline" className="text-[10px] bg-black/50 backdrop-blur border-white/20">
            <RotateCw className="w-3 h-3 mr-1 animate-spin" style={{ animationDuration: '3s' }} />
            Drag to rotate
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-black/50 backdrop-blur border-white/20">
            <Ruler className="w-3 h-3 mr-1" />
            {bedSize.width}×{bedSize.depth}×{bedSize.height}mm
          </Badge>
        </div>
      </div>
    </div>
  );
}
