import { useState, useCallback, useEffect, useRef } from "react";
import { 
  Compass, Clock, MapPin, Thermometer, Gauge, 
  Wind, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  RotateCcw, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
}

export function FlightControlsDashboard({
  onFlightInput,
  position = { x: 0, y: 0, z: 0 },
  velocity = 0,
  heading = 0,
}: FlightControlsDashboardProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const inputRef = useRef({ forward: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0 });

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
    <div 
      className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/95 to-black/80 backdrop-blur-lg border-t border-cyan-500/30 z-50"
      data-testid="flight-dashboard"
    >
      <div className="flex items-center justify-between h-full px-4 max-w-screen-2xl mx-auto gap-4">
        
        {/* Left: Telemetry Display */}
        <div className="flex items-center gap-6">
          {/* Position */}
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Position</span>
            <div className="flex items-center gap-1 font-mono text-xs text-cyan-300">
              <MapPin className="w-3 h-3" />
              <span data-testid="text-position-x">{position.x.toFixed(1)}</span>
              <span className="text-cyan-500/50">/</span>
              <span data-testid="text-position-y">{position.y.toFixed(1)}</span>
              <span className="text-cyan-500/50">/</span>
              <span data-testid="text-position-z">{position.z.toFixed(1)}</span>
            </div>
          </div>
          
          {/* Heading */}
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Heading</span>
            <div className="flex items-center gap-1 font-mono text-xs text-cyan-300">
              <Compass className="w-3 h-3" />
              <span data-testid="text-heading">{heading.toFixed(0)}°</span>
            </div>
          </div>
          
          {/* Velocity */}
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Velocity</span>
            <div className="flex items-center gap-1 font-mono text-xs text-cyan-300">
              <Gauge className="w-3 h-3" />
              <span data-testid="text-velocity">{velocity.toFixed(1)} m/s</span>
            </div>
          </div>
          
          {/* Time */}
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Time</span>
            <div className="flex items-center gap-1 font-mono text-xs text-cyan-300">
              <Clock className="w-3 h-3" />
              <span data-testid="text-time">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          
          {/* Weather */}
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400/60 uppercase tracking-wider">Conditions</span>
            <div className="flex items-center gap-1 font-mono text-xs text-cyan-300">
              <Thermometer className="w-3 h-3" />
              <span>21°C</span>
              <Wind className="w-3 h-3 ml-1" />
              <span>5kn</span>
            </div>
          </div>
        </div>
        
        {/* Center: Flight Controls */}
        <div className="flex items-center gap-6">
          {/* Vertical Controls */}
          <div className="flex flex-col items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border ${isActive(' ') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
              onMouseDown={() => handleButtonPress(' ', true)}
              onMouseUp={() => handleButtonPress(' ', false)}
              onMouseLeave={() => handleButtonPress(' ', false)}
              data-testid="button-fly-up"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
            <span className="text-[8px] text-cyan-400/50">SPACE</span>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border ${isActive('shift') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
              onMouseDown={() => handleButtonPress('shift', true)}
              onMouseUp={() => handleButtonPress('shift', false)}
              onMouseLeave={() => handleButtonPress('shift', false)}
              data-testid="button-fly-down"
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
            <span className="text-[8px] text-cyan-400/50">SHIFT</span>
          </div>
          
          {/* Directional Pad */}
          <div className="grid grid-cols-3 gap-0.5">
            <div />
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border ${isActive('w') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
              onMouseDown={() => handleButtonPress('w', true)}
              onMouseUp={() => handleButtonPress('w', false)}
              onMouseLeave={() => handleButtonPress('w', false)}
              data-testid="button-fly-forward"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <div />
            
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border ${isActive('a') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
              onMouseDown={() => handleButtonPress('a', true)}
              onMouseUp={() => handleButtonPress('a', false)}
              onMouseLeave={() => handleButtonPress('a', false)}
              data-testid="button-fly-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border border-cyan-500/30 text-cyan-400/50`}
              onClick={() => onFlightInput({ forward: 0, strafe: 0, vertical: 0, yaw: 0, pitch: 0 })}
              data-testid="button-fly-stop"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border ${isActive('d') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
              onMouseDown={() => handleButtonPress('d', true)}
              onMouseUp={() => handleButtonPress('d', false)}
              onMouseLeave={() => handleButtonPress('d', false)}
              data-testid="button-fly-right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            <div />
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded border ${isActive('s') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
              onMouseDown={() => handleButtonPress('s', true)}
              onMouseUp={() => handleButtonPress('s', false)}
              onMouseLeave={() => handleButtonPress('s', false)}
              data-testid="button-fly-back"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <div />
          </div>
          
          {/* Yaw Controls */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded border ${isActive('q') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
                onMouseDown={() => handleButtonPress('q', true)}
                onMouseUp={() => handleButtonPress('q', false)}
                onMouseLeave={() => handleButtonPress('q', false)}
                data-testid="button-yaw-left"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 rounded border ${isActive('e') ? 'bg-cyan-500 text-black border-cyan-400' : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'}`}
                onMouseDown={() => handleButtonPress('e', true)}
                onMouseUp={() => handleButtonPress('e', false)}
                onMouseLeave={() => handleButtonPress('e', false)}
                data-testid="button-yaw-right"
              >
                <RotateCcw className="w-4 h-4 scale-x-[-1]" />
              </Button>
            </div>
            <span className="text-[8px] text-cyan-400/50">Q / E</span>
          </div>
        </div>
        
        {/* Right: Status */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-green-500/50 text-green-400 font-mono text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
            ONLINE
          </Badge>
          <div className="text-[9px] text-cyan-400/40 font-mono">
            WASD + QE + SPACE/SHIFT
          </div>
        </div>
      </div>
    </div>
  );
}
