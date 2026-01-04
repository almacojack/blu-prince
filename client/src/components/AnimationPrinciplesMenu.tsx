import { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox, Sphere, Environment } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from "three";
import { 
  ANIMATION_PATTERNS, 
  PRINCIPLE_NAMES, 
  PRINCIPLE_DESCRIPTIONS,
  AnimationPattern,
  AnimationPrinciple,
  getTransformAtTime 
} from "@/lib/animation-patterns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Circle, ArrowUp, Eye, Move, Activity, TrendingUp, 
  RotateCw, Footprints, Zap, Maximize, Box, Sparkles,
  Play, Pause, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PRINCIPLE_ICONS: Record<AnimationPrinciple, React.ReactNode> = {
  squash_stretch: <Circle className="w-4 h-4" />,
  anticipation: <ArrowUp className="w-4 h-4" />,
  staging: <Eye className="w-4 h-4" />,
  straight_ahead: <Move className="w-4 h-4" />,
  follow_through: <Activity className="w-4 h-4" />,
  slow_in_out: <TrendingUp className="w-4 h-4" />,
  arcs: <RotateCw className="w-4 h-4" />,
  secondary_action: <Footprints className="w-4 h-4" />,
  timing: <Zap className="w-4 h-4" />,
  exaggeration: <Maximize className="w-4 h-4" />,
  solid_drawing: <Box className="w-4 h-4" />,
  appeal: <Sparkles className="w-4 h-4" />,
};

function AnimatedPreviewMesh({ pattern, isPlaying }: { pattern: AnimationPattern; isPlaying: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || !isPlaying) return;
    
    timeRef.current += delta;
    if (pattern.loop) {
      timeRef.current = timeRef.current % pattern.duration;
    } else {
      timeRef.current = Math.min(timeRef.current, pattern.duration);
    }
    
    const transform = getTransformAtTime(pattern, timeRef.current);
    
    meshRef.current.position.set(...transform.position);
    meshRef.current.rotation.set(
      THREE.MathUtils.degToRad(transform.rotation[0]),
      THREE.MathUtils.degToRad(transform.rotation[1]),
      THREE.MathUtils.degToRad(transform.rotation[2])
    );
    meshRef.current.scale.set(...transform.scale);
  });

  return (
    <RoundedBox ref={meshRef} args={[0.8, 0.8, 0.8]} radius={0.1}>
      <meshStandardMaterial color={pattern.color} roughness={0.3} metalness={0.6} />
    </RoundedBox>
  );
}

function MiniPreview({ pattern, isPlaying }: { pattern: AnimationPattern; isPlaying: boolean }) {
  return (
    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-900/50 border border-gray-700/50">
      <Canvas
        camera={{ position: [2, 2, 2], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        frameloop={isPlaying ? "always" : "demand"}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <AnimatedPreviewMesh pattern={pattern} isPlaying={isPlaying} />
      </Canvas>
    </div>
  );
}

interface AnimationPrinciplesMenuProps {
  onSelectPattern?: (pattern: AnimationPattern) => void;
  onApplyPattern?: (pattern: AnimationPattern) => void;
  selectedPatternId?: string;
}

export function AnimationPrinciplesMenu({
  onSelectPattern,
  onApplyPattern,
  selectedPatternId,
}: AnimationPrinciplesMenuProps) {
  const [expandedPrinciple, setExpandedPrinciple] = useState<AnimationPrinciple | null>("squash_stretch");
  const [playingPatternId, setPlayingPatternId] = useState<string | null>(null);

  const principles = Object.keys(PRINCIPLE_NAMES) as AnimationPrinciple[];

  const togglePlay = (patternId: string) => {
    setPlayingPatternId(playingPatternId === patternId ? null : patternId);
  };

  return (
    <div className="flex flex-col h-full" data-testid="animation-principles-menu">
      <div className="px-3 py-2 border-b border-purple-900/30 bg-purple-900/20">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          12 Principles of Animation
        </h3>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Disney's timeless animation wisdom
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">
          {principles.map((principle, index) => {
            const patterns = ANIMATION_PATTERNS.filter(p => p.principle === principle);
            const isExpanded = expandedPrinciple === principle;
            const number = index + 1;

            return (
              <div key={principle} className="mb-1">
                <button
                  onClick={() => setExpandedPrinciple(isExpanded ? null : principle)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-all",
                    isExpanded 
                      ? "bg-gradient-to-r from-purple-900/40 to-cyan-900/40 border border-purple-500/30" 
                      : "hover:bg-white/5"
                  )}
                  data-testid={`button-principle-${number}`}
                >
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "w-6 h-6 p-0 flex items-center justify-center text-[10px] font-bold",
                      isExpanded 
                        ? "bg-purple-500/30 text-purple-300 border-purple-400/50" 
                        : "bg-gray-800 text-gray-400 border-gray-600"
                    )}
                  >
                    {number}
                  </Badge>
                  
                  <div className={cn(
                    "p-1 rounded",
                    isExpanded ? "text-cyan-400" : "text-gray-500"
                  )}>
                    {PRINCIPLE_ICONS[principle]}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "text-xs font-medium truncate",
                      isExpanded ? "text-white" : "text-gray-300"
                    )}>
                      {PRINCIPLE_NAMES[principle].replace(/^\d+\.\s*/, '')}
                    </div>
                  </div>
                  
                  <Badge 
                    variant="outline" 
                    className="text-[9px] h-4 px-1 bg-transparent text-gray-500 border-gray-700"
                  >
                    {patterns.length}
                  </Badge>
                  
                  <ChevronRight 
                    className={cn(
                      "w-3 h-3 text-gray-500 transition-transform",
                      isExpanded && "rotate-90"
                    )} 
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 py-2 ml-8 border-l border-purple-500/20">
                        <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                          {PRINCIPLE_DESCRIPTIONS[principle]}
                        </p>
                        
                        {patterns.map(pattern => {
                          const isSelected = selectedPatternId === pattern.id;
                          const isPlaying = playingPatternId === pattern.id;
                          
                          return (
                            <motion.div
                              key={pattern.id}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg mb-2 transition-all cursor-pointer",
                                isSelected 
                                  ? "bg-cyan-900/30 border border-cyan-500/40" 
                                  : "hover:bg-white/5 border border-transparent"
                              )}
                              onClick={() => onSelectPattern?.(pattern)}
                              data-testid={`pattern-${pattern.id}`}
                            >
                              <MiniPreview pattern={pattern} isPlaying={isPlaying} />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: pattern.color }}
                                  />
                                  <span className="text-xs font-medium text-white">
                                    {pattern.name}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">
                                  {pattern.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className="text-[8px] h-3 px-1 bg-transparent text-gray-500 border-gray-700"
                                  >
                                    {pattern.duration}s
                                  </Badge>
                                  {pattern.loop && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-[8px] h-3 px-1 bg-transparent text-cyan-500 border-cyan-700"
                                    >
                                      loop
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    togglePlay(pattern.id);
                                  }}
                                  className={cn(
                                    "h-6 w-6 p-0",
                                    isPlaying ? "text-cyan-400" : "text-gray-400"
                                  )}
                                  data-testid={`button-play-${pattern.id}`}
                                >
                                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                </Button>
                                
                                {onApplyPattern && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onApplyPattern(pattern);
                                    }}
                                    className="h-6 px-2 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                                    data-testid={`button-apply-${pattern.id}`}
                                  >
                                    Apply
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
