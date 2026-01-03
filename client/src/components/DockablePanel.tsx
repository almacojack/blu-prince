import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, useDragControls, useMotionValue, animate } from 'framer-motion';
import { GripVertical, Settings, X, Pin, PinOff, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateSnap, bounceTransition } from '@/lib/magnetic-snap';
import { SnapFlash } from '@/components/SnapFlash';

export type PanelMode = 'docked' | 'floating';

export interface DockablePanelProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultDocked?: boolean;
  defaultCollapsed?: boolean;
  defaultPosition?: { x: number; y: number };
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  dockSide?: 'left' | 'right';
  onClose?: () => void;
  onSettingsClick?: () => void;
  showSettings?: boolean;
  className?: string;
}

export function DockablePanel({
  id,
  title,
  icon,
  children,
  defaultDocked = true,
  defaultCollapsed = false,
  defaultPosition = { x: 100, y: 100 },
  defaultWidth = 280,
  minWidth = 180,
  maxWidth = 500,
  dockSide = 'left',
  onClose,
  onSettingsClick,
  showSettings = false,
  className,
}: DockablePanelProps) {
  const [docked, setDocked] = useState(defaultDocked);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [width, setWidth] = useState(defaultWidth);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  
  // Framer Motion for floating mode
  const dragControls = useDragControls();
  const motionX = useMotionValue(defaultPosition.x);
  const motionY = useMotionValue(defaultPosition.y);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Resize state
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleModeToggle = useCallback(() => {
    setDocked(prev => !prev);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (docked || !panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // Check if near dock edge
    const currentX = motionX.get();
    if (dockSide === 'left' && currentX < 60) {
      setDocked(true);
      return;
    }
    if (dockSide === 'right' && currentX > containerWidth - rect.width - 60) {
      setDocked(true);
      return;
    }
    
    const snap = calculateSnap(
      currentX,
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
  }, [docked, motionX, motionY, dockSide]);

  // Horizontal resize handlers
  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startWidth: width };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [width]);

  useEffect(() => {
    if (!isResizing) return;
    
    const handleMove = (e: PointerEvent) => {
      if (!resizeRef.current) return;
      const deltaX = dockSide === 'left' 
        ? e.clientX - resizeRef.current.startX
        : resizeRef.current.startX - e.clientX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, resizeRef.current.startWidth + deltaX));
      setWidth(newWidth);
    };
    
    const handleUp = () => {
      setIsResizing(false);
      resizeRef.current = null;
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isResizing, dockSide, minWidth, maxWidth]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Resize handle component
  const ResizeHandle = (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-1.5 cursor-col-resize group z-50",
        dockSide === 'left' ? 'right-0' : 'left-0',
        isResizing && 'bg-cyan-500'
      )}
      onPointerDown={handleResizeStart}
      data-testid={`resize-handle-${id}`}
    >
      <div className={cn(
        "absolute top-1/2 -translate-y-1/2 w-1 h-16 rounded-full transition-colors",
        dockSide === 'left' ? 'right-0.5' : 'left-0.5',
        "bg-white/10 group-hover:bg-cyan-500/50",
        isResizing && 'bg-cyan-500'
      )} />
    </div>
  );

  // Collapsed docked state - just show icon button
  if (docked && collapsed) {
    return (
      <button
        data-panel-id={id}
        onClick={toggleCollapse}
        className="w-10 h-10 flex items-center justify-center bg-black/80 backdrop-blur border-r border-b border-white/10 hover:bg-white/10 text-violet-400 hover:text-violet-300 transition-colors touch-manipulation"
        title={`Expand ${title}`}
        data-testid={`button-expand-${id}`}
      >
        {icon}
      </button>
    );
  }

  // Docked state - resizable panel
  if (docked) {
    return (
      <div
        ref={panelRef}
        data-panel-id={id}
        className={cn(
          "relative bg-black/90 backdrop-blur flex flex-col",
          dockSide === 'left' ? 'border-r' : 'border-l',
          "border-white/10",
          className
        )}
        style={{ width }}
        data-testid={`panel-${id}`}
      >
        {/* Title bar */}
        <div className="h-9 flex items-center justify-between px-2 border-b border-white/10 bg-black/40 shrink-0 select-none">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded hover:bg-white/10 text-violet-400 hover:text-violet-300 transition-colors touch-manipulation"
              title={`Collapse ${title}`}
              data-testid={`button-collapse-${id}`}
            >
              {icon}
            </button>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{title}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {showSettings && onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                title="Panel settings"
                data-testid={`button-settings-${id}`}
              >
                <Settings className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleModeToggle}
              className="p-1 rounded hover:bg-white/10 text-cyan-400/70 hover:text-cyan-300 transition-colors"
              title="Float panel"
              data-testid={`button-float-${id}`}
            >
              <PinOff className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
        
        {ResizeHandle}
      </div>
    );
  }

  // Floating state with Framer Motion
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
        style={{ x: motionX, y: motionY, width }}
        className={cn(
          "fixed z-50 pointer-events-auto rounded-lg overflow-hidden",
          className
        )}
        data-panel-id={id}
        data-testid={`panel-${id}`}
      >
        <div 
          className="relative bg-gradient-to-b from-gray-900/98 to-black/98 backdrop-blur-xl border border-white/20 rounded-lg"
          style={{
            boxShadow: `
              0 0 0 1px rgba(0, 255, 255, 0.15),
              0 0 30px rgba(0, 255, 255, 0.08),
              0 20px 50px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Title bar with drag handle */}
          <div 
            className="h-9 flex items-center justify-between px-2 border-b border-white/10 bg-black/40 shrink-0 select-none cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              // Don't start drag if clicking on a button
              if ((e.target as HTMLElement).closest('button')) return;
              dragControls.start(e);
            }}
          >
            <div className="flex items-center gap-1.5">
              <GripVertical className="w-3 h-3 text-white/30" />
              <span className="p-1 text-violet-400">
                {icon}
              </span>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{title}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={toggleCollapse}
                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                title={collapsed ? 'Expand' : 'Minimize'}
                data-testid={`button-minimize-${id}`}
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              {showSettings && onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
                  title="Panel settings"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={handleModeToggle}
                className="p-1 rounded hover:bg-white/10 text-cyan-400/70 hover:text-cyan-300 transition-colors"
                title="Dock panel"
                data-testid={`button-dock-${id}`}
              >
                <Pin className="w-3 h-3" />
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                  title="Close"
                  data-testid={`button-close-${id}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          {!collapsed && (
            <div className="max-h-[70vh] overflow-auto">
              {children}
            </div>
          )}
          
          {!collapsed && ResizeHandle}
        </div>
      </motion.div>
    </>
  );
}
