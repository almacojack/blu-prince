import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, GitBranch, Play, Pause, Box, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard, Line, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo } from "react";
import tossCartridgeImg from "@assets/generated_images/retro_futuristic_data_cartridge.png";
import loraDeviceImg from "@assets/generated_images/lora_handheld_with_pc_screen.png";

// Mini Vector Arcade Preview Scene
const VECTOR_THEME = {
  background: "#000008",
  nodeColor: "#00aaff",
  nodeSelectedColor: "#00ffff",
  nodeInitialColor: "#00ff88",
  transitionColor: "#0066cc",
  labelColor: "#00ddff",
};

function MiniVectorNode({ 
  name, 
  position, 
  isInitial, 
  phaseOffset 
}: { 
  name: string; 
  position: [number, number, number]; 
  isInitial: boolean; 
  phaseOffset: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!groupRef.current || !meshRef.current) return;
    const t = state.clock.elapsedTime;
    const wobble = Math.sin(t * 2 + phaseOffset) * 0.02;
    const spin = t * 0.3 + phaseOffset;
    const pulse = 1 + Math.sin(t * 4 + phaseOffset) * 0.05;
    
    groupRef.current.position.set(
      position[0] + Math.sin(t * 0.5 + phaseOffset) * 0.1 + wobble,
      position[1] + Math.cos(t * 0.7 + phaseOffset * 1.5) * 0.08,
      position[2] + Math.sin(t * 0.4 + phaseOffset * 0.5) * 0.06
    );
    meshRef.current.rotation.set(
      Math.sin(spin * 0.5) * 0.3,
      spin,
      Math.cos(spin * 0.7) * 0.2
    );
    meshRef.current.scale.setScalar(pulse);
  });

  const color = isInitial ? VECTOR_THEME.nodeInitialColor : VECTOR_THEME.nodeColor;

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh scale={1.02}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} wireframe />
      </mesh>
      <Billboard position={[0, 0.9, 0]}>
        <Text
          fontSize={0.25}
          color={VECTOR_THEME.labelColor}
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {name}
        </Text>
      </Billboard>
      {isInitial && (
        <group position={[-0.9, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.25, 4]} />
            <meshStandardMaterial 
              color={VECTOR_THEME.nodeInitialColor} 
              emissive={VECTOR_THEME.nodeInitialColor} 
              emissiveIntensity={1.5}
              wireframe
            />
          </mesh>
          <Line 
            points={[[-0.4, 0, 0], [-0.12, 0, 0]]}
            color={VECTOR_THEME.nodeInitialColor}
            lineWidth={2}
          />
        </group>
      )}
    </group>
  );
}

function VectorArcadePreview() {
  const states = [
    { name: "idle", position: [-3, 0, 0] as [number, number, number], isInitial: true },
    { name: "running", position: [3, 0, 0] as [number, number, number], isInitial: false },
    { name: "paused", position: [0, 2.5, 0] as [number, number, number], isInitial: false },
  ];

  return (
    <>
      <PerspectiveCamera makeDefault position={[8, 5, 8]} fov={45} />
      <ambientLight intensity={0.15} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color={VECTOR_THEME.nodeColor} />
      <fog attach="fog" args={["#000020", 15, 40]} />
      
      {states.map((state, idx) => (
        <MiniVectorNode
          key={state.name}
          name={state.name}
          position={state.position}
          isInitial={state.isInitial}
          phaseOffset={idx * 1.2}
        />
      ))}
      
      <OrbitControls 
        enablePan={false}
        enableZoom={false}
        enableRotate={true}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

interface Slide {
  id: string;
  title: string;
  description: string;
  link: string;
  linkText: string;
  renderContent: () => React.ReactNode;
}

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const slides: Slide[] = [
    {
      id: "vector-arcade",
      title: "Vector Arcade Statecharts",
      description: "Experience your state machines in stunning 3D. Classic 80s Asteroids-style vector graphics bring your FSMs to life.",
      link: "/statechart",
      linkText: "OPEN VECTOR ARCADE",
      renderContent: () => (
        <div className="w-full h-full bg-[#000008] overflow-hidden">
          <Canvas
            onCreated={({ gl }) => {
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
            }}
            gl={{ antialias: true, powerPreference: 'default' }}
          >
            <color attach="background" args={["#000008"]} />
            <VectorArcadePreview />
          </Canvas>
        </div>
      ),
    },
    {
      id: "toss-cartridge",
      title: "TOSS Cartridges",
      description: "Portable state machines you can share, remix, and deploy anywhere. Like game cartridges for the modern web.",
      link: "/editor",
      linkText: "CREATE CARTRIDGE",
      renderContent: () => (
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] overflow-hidden flex items-center justify-center p-8">
          <img 
            src={tossCartridgeImg} 
            alt="TOSS Cartridge" 
            className="max-h-full max-w-full object-contain drop-shadow-2xl"
          />
        </div>
      ),
    },
    {
      id: "lora-defense",
      title: "Cross-Platform Deployment",
      description: "From handhelds with LoRa antennas to browser windows and terminal interfaces. TingOs runs everywhere.",
      link: "/playground",
      linkText: "TRY PLAYGROUND",
      renderContent: () => (
        <div className="w-full h-full bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0d1b2a] overflow-hidden flex items-center justify-center">
          <img 
            src={loraDeviceImg} 
            alt="LoRa Device with Defense Tower" 
            className="w-full h-full object-cover"
          />
        </div>
      ),
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    const interval = setInterval(nextSlide, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, slides.length]);

  const slide = slides[currentSlide];

  const slideIcons = [GitBranch, Box, Radio];
  const SlideIcon = slideIcons[currentSlide] || GitBranch;

  return (
    <div className="relative w-full" data-testid="hero-carousel">
      {/* Soft glow behind carousel */}
      <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-orange-500/10 blur-3xl rounded-[3rem] pointer-events-none" />
      
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] shadow-2xl shadow-black/50">
        {/* Soft vignette overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 rounded-[2rem]" style={{
          boxShadow: 'inset 0 0 60px 20px rgba(0,0,0,0.4)'
        }} />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0"
          >
            {slide.renderContent()}
          </motion.div>
        </AnimatePresence>
        
        {/* Overlay Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <SlideIcon className="w-5 h-5 text-cyan-400 shrink-0" />
                <span className="truncate">{slide.title}</span>
              </h3>
              <p className="text-sm text-white/70 max-w-lg mt-1 line-clamp-2">
                {slide.description}
              </p>
            </div>
            <Link href={slide.link}>
              <Button 
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono shadow-lg shrink-0"
                data-testid="button-carousel-cta"
              >
                {slide.linkText}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Controls */}
      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="text-white/70 hover:text-white"
            data-testid="button-carousel-prev"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentSlide ? "bg-cyan-400" : "bg-white/30"
                }`}
                data-testid={`button-carousel-dot-${idx}`}
              />
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className="text-white/70 hover:text-white"
            data-testid="button-carousel-autoplay"
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="text-white/70 hover:text-white"
            data-testid="button-carousel-next"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
