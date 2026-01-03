import { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Circle,
  Maximize2,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewportAngle = 
  | "front" 
  | "back" 
  | "left" 
  | "right" 
  | "top" 
  | "bottom" 
  | "perspective";

interface ViewportAnglesPanelProps {
  currentAngle: ViewportAngle;
  onAngleChange: (angle: ViewportAngle) => void;
  className?: string;
}

const ANGLE_CONFIG: Record<ViewportAngle, { 
  label: string; 
  shortcut: string;
  position: [number, number];
}> = {
  top: { label: "TOP", shortcut: "7", position: [1, 0] },
  front: { label: "FRONT", shortcut: "1", position: [1, 1] },
  right: { label: "RIGHT", shortcut: "3", position: [2, 1] },
  left: { label: "LEFT", shortcut: "4", position: [0, 1] },
  back: { label: "BACK", shortcut: "Ctrl+1", position: [1, 2] },
  bottom: { label: "BOTTOM", shortcut: "Ctrl+7", position: [1, 2] },
  perspective: { label: "PERSP", shortcut: "5", position: [0, 0] },
};

export function ViewportAnglesPanel({
  currentAngle,
  onAngleChange,
  className,
}: ViewportAnglesPanelProps) {
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const key = e.key;
    const ctrl = e.ctrlKey || e.metaKey;
    
    if (key === "1" && !ctrl) {
      e.preventDefault();
      onAngleChange("front");
    } else if (key === "1" && ctrl) {
      e.preventDefault();
      onAngleChange("back");
    } else if (key === "3" && !ctrl) {
      e.preventDefault();
      onAngleChange("right");
    } else if (key === "3" && ctrl) {
      e.preventDefault();
      onAngleChange("left");
    } else if (key === "7" && !ctrl) {
      e.preventDefault();
      onAngleChange("top");
    } else if (key === "7" && ctrl) {
      e.preventDefault();
      onAngleChange("bottom");
    } else if (key === "5") {
      e.preventDefault();
      onAngleChange("perspective");
    } else if (key === "4") {
      e.preventDefault();
      onAngleChange("left");
    }
  }, [onAngleChange]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const AngleButton = ({ 
    angle, 
    icon, 
    active 
  }: { 
    angle: ViewportAngle; 
    icon: React.ReactNode; 
    active: boolean;
  }) => (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onAngleChange(angle)}
      className={cn(
        "w-10 h-10 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all",
        active
          ? "bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
          : "bg-black/40 border-white/10 text-zinc-400 hover:border-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10"
      )}
      title={`${ANGLE_CONFIG[angle].label} (${ANGLE_CONFIG[angle].shortcut})`}
      data-testid={`viewport-${angle}`}
    >
      {icon}
      <span className="text-[7px] font-mono font-bold">{ANGLE_CONFIG[angle].shortcut}</span>
    </motion.button>
  );

  return (
    <div 
      className={cn(
        "bg-gradient-to-br from-gray-900/95 to-black/95 border border-white/10 rounded-xl p-2 backdrop-blur-sm",
        className
      )}
      data-testid="viewport-angles-panel"
    >
      <div className="text-[8px] font-mono uppercase text-zinc-500 text-center mb-2 tracking-wider">
        VIEWPORT
      </div>
      
      <div className="grid grid-cols-3 gap-1">
        <AngleButton 
          angle="perspective" 
          icon={<Maximize2 className="w-4 h-4" />} 
          active={currentAngle === "perspective"} 
        />
        <AngleButton 
          angle="top" 
          icon={<ArrowUp className="w-4 h-4" />} 
          active={currentAngle === "top"} 
        />
        <div className="w-10 h-10" />
        
        <AngleButton 
          angle="left" 
          icon={<ArrowLeft className="w-4 h-4" />} 
          active={currentAngle === "left"} 
        />
        <AngleButton 
          angle="front" 
          icon={<Circle className="w-4 h-4" />} 
          active={currentAngle === "front"} 
        />
        <AngleButton 
          angle="right" 
          icon={<ArrowRight className="w-4 h-4" />} 
          active={currentAngle === "right"} 
        />
        
        <AngleButton 
          angle="back" 
          icon={<RotateCcw className="w-4 h-4" />} 
          active={currentAngle === "back"} 
        />
        <AngleButton 
          angle="bottom" 
          icon={<ArrowDown className="w-4 h-4" />} 
          active={currentAngle === "bottom"} 
        />
        <div className="w-10 h-10" />
      </div>
      
      <div className="mt-2 pt-2 border-t border-white/5 text-[7px] font-mono text-zinc-600 text-center">
        NUMPAD SHORTCUTS
      </div>
    </div>
  );
}
