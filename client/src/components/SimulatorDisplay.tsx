import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Zap, Flame, Snowflake, Droplets, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import cartridgeImage from "@assets/generated_images/retro_futuristic_data_cartridge.png";

interface SimulatorDisplayProps {
  className?: string;
  showControls?: boolean;
  autoAnimate?: boolean;
}

const FORCE_TYPES = [
  { id: "fire", icon: Flame, color: "#ef4444", label: "FIRE", glow: "shadow-red-500/50" },
  { id: "ice", icon: Snowflake, color: "#3b82f6", label: "ICE", glow: "shadow-blue-500/50" },
  { id: "water", icon: Droplets, color: "#06b6d4", label: "WATER", glow: "shadow-cyan-500/50" },
  { id: "wind", icon: Wind, color: "#22c55e", label: "WIND", glow: "shadow-green-500/50" },
];

export function SimulatorDisplay({ 
  className = "", 
  showControls = true,
  autoAnimate = true 
}: SimulatorDisplayProps) {
  const [isRunning, setIsRunning] = useState(autoAnimate);
  const [activeForce, setActiveForce] = useState<string | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [statusMessages, setStatusMessages] = useState<string[]>([
    "INITIALIZING SIMULATION ENGINE...",
    "LOADING CARTRIDGE DATA...",
    "PHYSICS SUBSYSTEM ONLINE",
  ]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setPulsePhase(p => (p + 1) % 360);
      }, 50);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    
    const messages = [
      "PROCESSING FSM TRANSITIONS...",
      "HITBOX COLLISION: 3 OBJECTS",
      "FORCE FIELD ACTIVE: MAGNITUDE 0.8",
      "SIDE EFFECT TRIGGERED: on_impact",
      "TEMPERATURE DELTA: +42.5K",
      "MAGNETIC FLUX: 1.2 TESLA",
      "BUOYANCY CALCULATION: STABLE",
      "WIND RESISTANCE: 0.3 Cd",
      "STATE MACHINE: 5 ACTIVE STATES",
      "CARTRIDGE HASH: 0x7F3A2B1C",
    ];
    
    const messageInterval = setInterval(() => {
      setStatusMessages(prev => {
        const newMsg = messages[Math.floor(Math.random() * messages.length)];
        return [...prev.slice(-4), newMsg];
      });
    }, 1500);
    
    return () => clearInterval(messageInterval);
  }, [isRunning]);

  const handleForceToggle = (forceId: string) => {
    setActiveForce(prev => prev === forceId ? null : forceId);
    setStatusMessages(prev => [
      ...prev.slice(-4), 
      `FORCE EMITTER ${forceId.toUpperCase()}: ${activeForce === forceId ? "DISABLED" : "ENABLED"}`
    ]);
  };

  const activeForceConfig = FORCE_TYPES.find(f => f.id === activeForce);
  const glowColor = activeForceConfig?.color || "#7c3aed";
  const pulseIntensity = Math.sin(pulsePhase * Math.PI / 180) * 0.3 + 0.7;

  return (
    <div className={`relative ${className}`} data-testid="simulator-display">
      <div className="relative w-full aspect-square max-w-[600px] mx-auto">
        <motion.div 
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `radial-gradient(circle at center, ${glowColor}20 0%, transparent 70%)`,
            opacity: isRunning ? pulseIntensity : 0.3,
          }}
          animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border-b border-white/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              <span className="text-[10px] font-mono text-zinc-400">
                {isRunning ? "SIMULATION ACTIVE" : "PAUSED"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-primary">tingOS v1.0</span>
              <Zap className="w-3 h-3 text-primary" />
            </div>
          </div>

          <div className="absolute top-10 left-0 right-0 bottom-0 flex flex-col">
            <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%237c3aed' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                }}
              />
              
              <motion.img
                src={cartridgeImage}
                alt="TOSS Cartridge"
                className="w-full max-w-[280px] h-auto object-contain drop-shadow-2xl relative z-10"
                style={{
                  filter: `drop-shadow(0 0 ${isRunning ? 30 : 10}px ${glowColor}50)`,
                }}
                animate={isRunning ? {
                  y: [0, -5, 0],
                  rotateY: [0, 2, 0, -2, 0],
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                data-testid="simulator-cartridge-image"
              />

              <AnimatePresence>
                {activeForce && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${glowColor}30 0%, transparent 50%)`,
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="h-20 bg-black/50 border-t border-white/10 p-2 overflow-hidden font-mono text-[9px]">
              <AnimatePresence mode="popLayout">
                {statusMessages.slice(-4).map((msg, i) => (
                  <motion.div
                    key={`${msg}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1 - i * 0.2, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="text-green-400/80 leading-tight"
                  >
                    &gt; {msg}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {showControls && (
          <>
            <motion.div 
              className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {FORCE_TYPES.map((force) => {
                const Icon = force.icon;
                const isActive = activeForce === force.id;
                return (
                  <Button
                    key={force.id}
                    size="icon"
                    variant={isActive ? "default" : "ghost"}
                    className={`h-11 w-11 touch-manipulation ${isActive ? force.glow + " shadow-lg" : "hover:bg-white/10"}`}
                    style={isActive ? { backgroundColor: force.color } : {}}
                    onClick={() => handleForceToggle(force.id)}
                    data-testid={`button-force-${force.id}`}
                  >
                    <Icon className="w-5 h-5" />
                  </Button>
                );
              })}
            </motion.div>

            <motion.div 
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 bg-zinc-900/80 border border-zinc-700 touch-manipulation"
                onClick={() => setIsRunning(false)}
                data-testid="button-simulator-pause"
              >
                <Pause className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant={isRunning ? "default" : "ghost"}
                className={`h-11 w-11 border touch-manipulation ${isRunning ? "bg-green-600 border-green-500" : "bg-zinc-900/80 border-zinc-700"}`}
                onClick={() => setIsRunning(true)}
                data-testid="button-simulator-play"
              >
                <Play className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-11 w-11 bg-zinc-900/80 border border-zinc-700 touch-manipulation"
                onClick={() => {
                  setActiveForce(null);
                  setStatusMessages(["SIMULATION RESET", "INITIALIZING..."]);
                }}
                data-testid="button-simulator-reset"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

export default SimulatorDisplay;
