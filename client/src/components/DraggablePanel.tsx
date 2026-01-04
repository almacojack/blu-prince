import { useState, useRef, useCallback, useEffect } from "react";
import { motion, useDragControls, PanInfo } from "framer-motion";
import { GripVertical, Pin, PinOff, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DockPosition = "float" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface DraggablePanelProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultDock?: DockPosition;
  minWidth?: number;
  minHeight?: number;
  onClose?: () => void;
  className?: string;
  storageKey?: string;
}

const DOCK_POSITIONS: Record<Exclude<DockPosition, "float">, { x: string; y: string }> = {
  "top-left": { x: "16px", y: "16px" },
  "top-right": { x: "calc(100% - 16px)", y: "16px" },
  "bottom-left": { x: "16px", y: "calc(100% - 16px)" },
  "bottom-right": { x: "calc(100% - 16px)", y: "calc(100% - 16px)" },
};

const DOCK_TRANSFORMS: Record<Exclude<DockPosition, "float">, string> = {
  "top-left": "translate(0, 0)",
  "top-right": "translate(-100%, 0)",
  "bottom-left": "translate(0, -100%)",
  "bottom-right": "translate(-100%, -100%)",
};

export function DraggablePanel({
  children,
  title,
  icon,
  defaultPosition = { x: 100, y: 100 },
  defaultDock = "float",
  minWidth = 280,
  minHeight = 100,
  onClose,
  className,
  storageKey,
}: DraggablePanelProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [dockPosition, setDockPosition] = useState<DockPosition>(defaultDock);
  const [isPinned, setIsPinned] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`panel_${storageKey}`);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.position) setPosition(data.position);
          if (data.dock) setDockPosition(data.dock);
          if (data.pinned !== undefined) setIsPinned(data.pinned);
          if (data.minimized !== undefined) setIsMinimized(data.minimized);
        } catch {}
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`panel_${storageKey}`, JSON.stringify({
        position,
        dock: dockPosition,
        pinned: isPinned,
        minimized: isMinimized,
      }));
    }
  }, [position, dockPosition, isPinned, isMinimized, storageKey]);

  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (isPinned) return;
    
    // Use the actual drop point position instead of offset calculation
    // This fixes the undocking issue where position state was stale
    const dropX = info.point.x;
    const dropY = info.point.y;
    
    const threshold = 80;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Check if dropped near corners for docking
    if (dropX < threshold && dropY < threshold) {
      setDockPosition("top-left");
      setPosition({ x: 16, y: 16 }); // Update position for when undocked
    } else if (dropX > windowWidth - threshold && dropY < threshold) {
      setDockPosition("top-right");
      setPosition({ x: windowWidth - minWidth - 16, y: 16 });
    } else if (dropX < threshold && dropY > windowHeight - threshold) {
      setDockPosition("bottom-left");
      setPosition({ x: 16, y: windowHeight - 200 });
    } else if (dropX > windowWidth - threshold && dropY > windowHeight - threshold) {
      setDockPosition("bottom-right");
      setPosition({ x: windowWidth - minWidth - 16, y: windowHeight - 200 });
    } else {
      // Free floating - use the actual bounding rect if available
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        setPosition({ x: rect.left, y: rect.top });
      } else {
        // Fallback: estimate position from drop point
        setPosition({ x: Math.max(0, dropX - 100), y: Math.max(0, dropY - 20) });
      }
      setDockPosition("float");
    }
  }, [isPinned, minWidth]);

  const startDrag = (e: React.PointerEvent) => {
    if (!isPinned) {
      dragControls.start(e);
    }
  };

  const isDocked = dockPosition !== "float";

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />
      
      <motion.div
        ref={panelRef}
        drag={!isPinned}
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        initial={false}
        animate={
          isDocked
            ? {
                left: DOCK_POSITIONS[dockPosition as Exclude<DockPosition, "float">].x,
                top: DOCK_POSITIONS[dockPosition as Exclude<DockPosition, "float">].y,
                x: 0,
                y: 0,
              }
            : {
                left: position.x,
                top: position.y,
                x: 0,
                y: 0,
              }
        }
        style={{
          minWidth,
          ...(isDocked ? { transform: DOCK_TRANSFORMS[dockPosition as Exclude<DockPosition, "float">] } : {}),
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed z-50 rounded-lg border shadow-xl backdrop-blur-md",
          isDocked 
            ? "border-cyan-500/50 bg-black/80" 
            : "border-purple-500/30 bg-black/70",
          className
        )}
        data-testid={`panel-${title.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div
          onPointerDown={startDrag}
          className={cn(
            "flex items-center justify-between px-3 py-2 rounded-t-lg cursor-grab active:cursor-grabbing select-none",
            isDocked 
              ? "bg-cyan-900/30 border-b border-cyan-500/30" 
              : "bg-purple-900/30 border-b border-purple-500/30"
          )}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-500" />
            {icon}
            <span className="text-sm font-semibold text-white">{title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPinned(!isPinned)}
              className={cn(
                "h-6 w-6 p-0",
                isPinned ? "text-cyan-400" : "text-gray-400 hover:text-white"
              )}
              title={isPinned ? "Unpin" : "Pin position"}
              data-testid="button-pin-panel"
            >
              {isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              title={isMinimized ? "Expand" : "Minimize"}
              data-testid="button-minimize-panel"
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </Button>
            
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                data-testid="button-close-panel"
              >
                ×
              </Button>
            )}
          </div>
        </div>
        
        <motion.div
          initial={false}
          animate={{ height: isMinimized ? 0 : "auto", opacity: isMinimized ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
        
        {isDocked && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
        )}
      </motion.div>
    </>
  );
}
