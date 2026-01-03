import { useState, useCallback, useEffect, useRef } from "react";
import { motion, useDragControls, useMotionValue, animate } from "framer-motion";
import { 
  Compass, Clock, MapPin, Gauge, 
  Wind, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RotateCcw, ArrowUp, ArrowDown, GripVertical, X, Gamepad2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { calculateSnap, bounceTransition } from "@/lib/magnetic-snap";
import { SnapFlash } from "@/components/SnapFlash";

interface FlightControlsDashboardProps {
  onFlightInput: (input: { 
    forward: number; 
    strafe: number; 
    vertical: number; 
    yaw: number;
    pitch: number;
  }) => void;
  position?: { x: number; y: number; z: number };
  velocity?: number;
  heading?: number;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
}

export function FlightControlsDashboard({
  onFlightInput,
  position = { x: 0, y: 0, z: 0 },
  velocity = 0,
  heading = 0,
  onClose,
  initialPosition,
}: FlightControlsDashboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const inputRef = useRef({ forward: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0 });
  
  // Drag controls
  const dragControls = useDragControls();
  const defaultX = initialPosition?.x ?? (typeof window !== 'undefined' ? window.innerWidth - 340 : 100);
  const defaultY = initialPosition?.y ?? (typeof window !== 'undefined' ? window.innerHeight - 320 : 100);
  const motionX = useMotionValue(defaultX);
  const motionY = useMotionValue(defaultY);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback(() => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    const snap = calculateSnap(
      motionX.get(),
      motionY.get(),
      rect.width,
      rect.height,
      containerWidth,
      containerHeight
    );
    
    if (snap.snappedX || snap.snappedY) {
      setSnapLines({ x: snap.snapLineX, y: snap.snapLineY });
      setTimeout(() => setSnapLines({ x: null, y: null }), 50);
    }
    
    animate(motionX, snap.x, bounceTransition);
    animate(motionY, snap.y, bounceTransition);
  }, [motionX, motionY]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift'].includes(key)) {
        e.preventDefault();
        setActiveKeys(prev => new Set(prev).add(key));
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Process input
  useEffect(() => {
    const input = { forward: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0 };
    
    if (activeKeys.has('w') || activeKeys.has('arrowup')) input.forward = 1;
    if (activeKeys.has('s') || activeKeys.has('arrowdown')) input.forward = -1;
    if (activeKeys.has('a')) input.strafe = -1;
    if (activeKeys.has('d')) input.strafe = 1;
    if (activeKeys.has(' ')) input.vertical = 1;
    if (activeKeys.has('shift')) input.vertical = -1;
    if (activeKeys.has('q') || activeKeys.has('arrowleft')) input.yaw = -1;
    if (activeKeys.has('e') || activeKeys.has('arrowright')) input.yaw = 1;
    
    inputRef.current = input;
    onFlightInput(input);
  }, [activeKeys, onFlightInput]);

  const handleButtonPress = useCallback((action: string, pressed: boolean) => {
    setActiveKeys(prev => {
      const next = new Set(prev);
      if (pressed) {
        next.add(action);
      } else {
        next.delete(action);
      }
      return next;
    });
  }, []);

  const isActive = (key: string) => activeKeys.has(key);

  return (
    <>
      <SnapFlash 
        snapLineX={snapLines.x} 
        snapLineY={snapLines.y} 
        containerWidth={typeof window !== 'undefined' ? window.innerWidth : 1920}
        containerHeight={typeof window !== 'undefined' ? window.innerHeight : 1080}
      />
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />
      <motion.div
        ref={panelRef}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        style={{ x: motionX, y: motionY }}
        className="fixed z-50 pointer-events-auto"
        data-testid="flight-dashboard"
      >
        {/* Gameboy-style handheld controller */}
        <div className="relative">
          {/* Main body - rounded rectangle like Gameboy */}
          <div 
            className="rounded-[24px] p-1"
            style={{
              background: 'linear-gradient(145deg, #2a2a3a 0%, #1a1a2e 50%, #0f0f1a 100%)',
              boxShadow: `
                0 0 0 2px rgba(0, 255, 255, 0.3),
                0 0 20px rgba(0, 255, 255, 0.1),
                inset 0 2px 4px rgba(255, 255, 255, 0.1),
                0 8px 32px rgba(0, 0, 0, 0.5)
              `,
            }}
          >
            {/* Inner bezel */}
            <div className="rounded-[20px] bg-gradient-to-b from-gray-800/50 to-gray-900/80 p-3">
              {/* Header with drag handle */}
              <div 
                className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-cyan-400/50" />
                  <Gamepad2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400 tracking-wider">FLIGHT CTRL</span>
                </div>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 text-gray-500 hover:text-red-400"
                    onClick={onClose}
                    data-testid="button-close-controller"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              {/* Screen area - telemetry display */}
              <div 
                className="rounded-lg p-2 mb-3"
                style={{
                  background: 'linear-gradient(180deg, #0a1628 0%, #0d1d35 100%)',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)',
                  border: '2px solid #1a2a4a',
                }}
              >
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  {/* Position */}
                  <div className="flex items-center gap-1 text-cyan-300">
                    <MapPin className="w-3 h-3 text-cyan-500" />
                    <span data-testid="text-position-x">{position.x.toFixed(1)}</span>
                    <span className="text-cyan-500/40">/</span>
                    <span data-testid="text-position-y">{position.y.toFixed(1)}</span>
                    <span className="text-cyan-500/40">/</span>
                    <span data-testid="text-position-z">{position.z.toFixed(1)}</span>
                  </div>
                  
                  {/* Heading */}
                  <div className="flex items-center gap-1 text-cyan-300">
                    <Compass className="w-3 h-3 text-cyan-500" />
                    <span data-testid="text-heading">{heading.toFixed(0)}°</span>
                  </div>
                  
                  {/* Velocity */}
                  <div className="flex items-center gap-1 text-cyan-300">
                    <Gauge className="w-3 h-3 text-cyan-500" />
                    <span data-testid="text-velocity">{velocity.toFixed(1)} m/s</span>
                  </div>
                  
                  {/* Time */}
                  <div className="flex items-center gap-1 text-cyan-300">
                    <Clock className="w-3 h-3 text-cyan-500" />
                    <span data-testid="text-time">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
                
                {/* Status bar */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyan-500/20">
                  <Badge variant="outline" className="h-4 border-green-500/50 text-green-400 font-mono text-[8px] px-1">
                    <span className="w-1 h-1 rounded-full bg-green-500 mr-1 animate-pulse" />
                    ONLINE
                  </Badge>
                  <div className="flex items-center gap-1 text-[8px] text-cyan-400/40">
                    <Wind className="w-2.5 h-2.5" />
                    <span>5kn</span>
                  </div>
                </div>
              </div>
              
              {/* Controls area */}
              <div className="flex items-center justify-between gap-4">
                {/* D-Pad (Left side) */}
                <div className="flex flex-col items-center">
                  <div className="grid grid-cols-3 gap-0.5">
                    <div />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-lg border-2 ${isActive('w') ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'border-gray-600 text-gray-400 hover:bg-gray-700/50 bg-gray-800/50'}`}
                      onMouseDown={() => handleButtonPress('w', true)}
                      onMouseUp={() => handleButtonPress('w', false)}
                      onMouseLeave={() => handleButtonPress('w', false)}
                      data-testid="button-fly-forward"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </Button>
                    <div />
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-lg border-2 ${isActive('a') ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'border-gray-600 text-gray-400 hover:bg-gray-700/50 bg-gray-800/50'}`}
                      onMouseDown={() => handleButtonPress('a', true)}
                      onMouseUp={() => handleButtonPress('a', false)}
                      onMouseLeave={() => handleButtonPress('a', false)}
                      data-testid="button-fly-left"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg border-2 border-gray-700 text-gray-500 bg-gray-900/50"
                      onClick={() => onFlightInput({ forward: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0 })}
                      data-testid="button-fly-stop"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-lg border-2 ${isActive('d') ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'border-gray-600 text-gray-400 hover:bg-gray-700/50 bg-gray-800/50'}`}
                      onMouseDown={() => handleButtonPress('d', true)}
                      onMouseUp={() => handleButtonPress('d', false)}
                      onMouseLeave={() => handleButtonPress('d', false)}
                      data-testid="button-fly-right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                    
                    <div />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-9 w-9 rounded-lg border-2 ${isActive('s') ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_10px_rgba(0,255,255,0.5)]' : 'border-gray-600 text-gray-400 hover:bg-gray-700/50 bg-gray-800/50'}`}
                      onMouseDown={() => handleButtonPress('s', true)}
                      onMouseUp={() => handleButtonPress('s', false)}
                      onMouseLeave={() => handleButtonPress('s', false)}
                      data-testid="button-fly-back"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </Button>
                    <div />
                  </div>
                  <span className="text-[8px] text-gray-500 mt-1">WASD</span>
                </div>
                
                {/* Action buttons (Right side - Gameboy style) */}
                <div className="flex flex-col items-center gap-2">
                  {/* Vertical controls - circular buttons like Gameboy A/B */}
                  <div className="flex items-center gap-3">
                    {/* Down button */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full border-2 ${isActive('shift') ? 'bg-purple-500 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]' : 'border-purple-600/50 text-purple-400 hover:bg-purple-900/30 bg-purple-900/20'}`}
                        onMouseDown={() => handleButtonPress('shift', true)}
                        onMouseUp={() => handleButtonPress('shift', false)}
                        onMouseLeave={() => handleButtonPress('shift', false)}
                        data-testid="button-fly-down"
                      >
                        <ArrowDown className="w-5 h-5" />
                      </Button>
                      <span className="text-[7px] text-purple-400/60 mt-0.5">SHIFT</span>
                    </div>
                    
                    {/* Up button */}
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-10 w-10 rounded-full border-2 ${isActive(' ') ? 'bg-pink-500 text-white border-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.6)]' : 'border-pink-600/50 text-pink-400 hover:bg-pink-900/30 bg-pink-900/20'}`}
                        onMouseDown={() => handleButtonPress(' ', true)}
                        onMouseUp={() => handleButtonPress(' ', false)}
                        onMouseLeave={() => handleButtonPress(' ', false)}
                        data-testid="button-fly-up"
                      >
                        <ArrowUp className="w-5 h-5" />
                      </Button>
                      <span className="text-[7px] text-pink-400/60 mt-0.5">SPACE</span>
                    </div>
                  </div>
                  
                  {/* Yaw controls - smaller buttons below */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 rounded-md border ${isActive('q') ? 'bg-amber-500 text-black border-amber-400' : 'border-amber-600/30 text-amber-400/70 hover:bg-amber-900/20 bg-gray-800/30'}`}
                      onMouseDown={() => handleButtonPress('q', true)}
                      onMouseUp={() => handleButtonPress('q', false)}
                      onMouseLeave={() => handleButtonPress('q', false)}
                      data-testid="button-yaw-left"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <span className="text-[8px] text-gray-500">YAW</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 rounded-md border ${isActive('e') ? 'bg-amber-500 text-black border-amber-400' : 'border-amber-600/30 text-amber-400/70 hover:bg-amber-900/20 bg-gray-800/30'}`}
                      onMouseDown={() => handleButtonPress('e', true)}
                      onMouseUp={() => handleButtonPress('e', false)}
                      onMouseLeave={() => handleButtonPress('e', false)}
                      data-testid="button-yaw-right"
                    >
                      <RotateCcw className="w-3 h-3 scale-x-[-1]" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Bottom label */}
              <div className="flex justify-center mt-3 pt-2 border-t border-gray-700/50">
                <span className="text-[9px] font-bold tracking-[0.2em] text-gray-500">tng.li / CTRL</span>
              </div>
            </div>
          </div>
          
          {/* Speaker grille decorations (bottom of handheld) */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-0.5 h-2 rounded-full bg-gray-600/50" />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
