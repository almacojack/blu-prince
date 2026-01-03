import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { GripVertical, Minimize2, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AtariDockPanelProps {
  title: string;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  resizable?: boolean;
  collapsible?: boolean;
  onClose?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function AtariDockPanel({
  title,
  children,
  initialPosition = { x: 16, y: 16 },
  initialSize = { width: 200, height: 120 },
  minWidth = 140,
  minHeight = 60,
  maxWidth = 600,
  maxHeight = 400,
  resizable = true,
  collapsible = true,
  onClose,
  className = "",
  "data-testid": testId,
}: AtariDockPanelProps) {
  const [size, setSize] = useState(initialSize);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragControls = useDragControls();
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - resizeStartRef.current.x;
      const dy = moveEvent.clientY - resizeStartRef.current.y;
      setSize({
        width: Math.min(maxWidth, Math.max(minWidth, resizeStartRef.current.width + dx)),
        height: Math.min(maxHeight, Math.max(minHeight, resizeStartRef.current.height + dy)),
      });
    };

    const handleUp = () => {
      setIsResizing(false);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [size, minWidth, minHeight, maxWidth, maxHeight]);

  return (
    <motion.div
      ref={panelRef}
      className={`absolute z-50 select-none ${className}`}
      style={{
        x,
        y,
        width: size.width,
      }}
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      data-testid={testId}
    >
      <div className="relative overflow-hidden rounded-lg shadow-2xl">
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            background: `
              repeating-linear-gradient(
                90deg,
                transparent 0px,
                transparent 18px,
                rgba(0,0,0,0.4) 18px,
                rgba(0,0,0,0.4) 22px
              ),
              linear-gradient(
                180deg,
                #5c3d2e 0%,
                #8b5a3c 15%,
                #6b4423 30%,
                #8b5a3c 45%,
                #5c3d2e 60%,
                #7a4a2f 75%,
                #5c3d2e 100%
              )
            `,
            backgroundSize: '40px 100%, 100% 100%',
          }}
        />
        
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(139,90,60,0.15) 2px,
                rgba(139,90,60,0.15) 4px
              )
            `,
            mixBlendMode: 'overlay',
          }}
        />
        
        <div 
          className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
          }}
        />
        
        <div 
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col">
          <div 
            className="flex items-center justify-between px-2 py-1.5 cursor-move border-b border-black/20"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-3 h-3 text-amber-100/60" />
              <span 
                className="font-pixel text-[9px] tracking-wider text-amber-100 uppercase"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {title}
              </span>
            </div>
            
            <div className="flex items-center gap-0.5">
              {collapsible && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-amber-100/60 hover:text-amber-100 hover:bg-black/20"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  data-testid={`${testId}-collapse`}
                >
                  {isCollapsed ? (
                    <Maximize2 className="w-2.5 h-2.5" />
                  ) : (
                    <Minimize2 className="w-2.5 h-2.5" />
                  )}
                </Button>
              )}
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-amber-100/60 hover:text-red-400 hover:bg-black/20"
                  onClick={onClose}
                  data-testid={`${testId}-close`}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          </div>

          <motion.div
            className="overflow-hidden"
            initial={false}
            animate={{
              height: isCollapsed ? 0 : "auto",
              opacity: isCollapsed ? 0 : 1,
            }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div 
              className="p-2"
              style={{ 
                minHeight: isCollapsed ? 0 : minHeight - 32,
                height: isCollapsed ? 0 : size.height - 32,
              }}
            >
              {children}
            </div>
          </motion.div>
        </div>

        {resizable && !isCollapsed && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
            onPointerDown={handleResizeStart}
          >
            <svg
              className="w-full h-full text-amber-100/40 hover:text-amber-100/80 transition-colors"
              viewBox="0 0 16 16"
            >
              <path
                d="M14 14L8 14L14 8L14 14Z"
                fill="currentColor"
              />
              <path
                d="M14 14L11 14L14 11L14 14Z"
                fill="currentColor"
                opacity="0.6"
              />
            </svg>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function AtariMiniPanel({ 
  children, 
  className = "",
  "data-testid": testId 
}: { 
  children: ReactNode; 
  className?: string;
  "data-testid"?: string;
}) {
  return (
    <div className={`relative ${className}`} data-testid={testId}>
      <div 
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 18px,
              rgba(0,0,0,0.4) 18px,
              rgba(0,0,0,0.4) 22px
            ),
            linear-gradient(
              180deg,
              #5c3d2e 0%,
              #8b5a3c 15%,
              #6b4423 30%,
              #8b5a3c 45%,
              #5c3d2e 60%,
              #7a4a2f 75%,
              #5c3d2e 100%
            )
          `,
          backgroundSize: '40px 100%, 100% 100%',
        }}
      />
      
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(139,90,60,0.15) 2px,
              rgba(139,90,60,0.15) 4px
            )
          `,
          mixBlendMode: 'overlay',
        }}
      />
      
      <div 
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
        }}
      />
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)',
        }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function Atari5200CartridgeSlot({ 
  children, 
  label,
  className = "" 
}: { 
  children: ReactNode; 
  label?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="relative rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #1a1a1a 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.5)',
        }}
      >
        <div 
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 3px,
                rgba(255,255,255,0.02) 3px,
                rgba(255,255,255,0.02) 6px
              )
            `,
          }}
        />
        
        <div 
          className="absolute top-0 left-4 right-4 h-2"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}
        />
        
        <div className="relative z-10 p-3">
          {label && (
            <div 
              className="text-center mb-2 font-pixel text-[8px] tracking-[0.3em] text-gray-500 uppercase"
              style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.8)' }}
            >
              {label}
            </div>
          )}
          {children}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-3 h-0.5 rounded-t-sm"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AtariSilverRail({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`h-2 rounded-full ${className}`}
      style={{
        background: 'linear-gradient(180deg, #666 0%, #333 40%, #555 60%, #444 100%)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
      }}
    />
  );
}
