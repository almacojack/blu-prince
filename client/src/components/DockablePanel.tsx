import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DockablePanelProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultDocked?: boolean;
  defaultCollapsed?: boolean;
  defaultPosition?: { x: number; y: number };
  onClose?: () => void;
  className?: string;
}

interface PanelState {
  docked: boolean;
  collapsed: boolean;
  position: { x: number; y: number };
}

export function DockablePanel({
  id,
  title,
  icon,
  children,
  defaultDocked = true,
  defaultCollapsed = false,
  defaultPosition = { x: 100, y: 100 },
  onClose,
  className,
}: DockablePanelProps) {
  const [state, setState] = useState<PanelState>({
    docked: defaultDocked,
    collapsed: defaultCollapsed,
    position: defaultPosition,
  });
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (state.docked) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: state.position.x,
      startPosY: state.position.y,
    };
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [state.docked, state.position]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    const newX = dragRef.current.startPosX + dx;
    const newY = dragRef.current.startPosY + dy;
    
    if (newX < 60) {
      setState(prev => ({ ...prev, docked: true, position: { x: 0, y: newY } }));
    } else {
      setState(prev => ({ ...prev, position: { x: newX, y: newY } }));
    }
  }, [isDragging]);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isDragging]);

  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  const undock = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      docked: false, 
      position: { x: 100, y: prev.position.y || 100 } 
    }));
  }, []);

  if (state.docked && state.collapsed) {
    return (
      <div
        data-panel-id={id}
        className="w-10 bg-black/80 backdrop-blur border-r border-white/10 flex flex-col items-center py-2 cursor-pointer hover:bg-black/90 transition-colors"
        onClick={toggleCollapse}
        title={title}
      >
        <div className="p-2 rounded hover:bg-white/10 text-violet-400">
          {icon}
        </div>
      </div>
    );
  }

  if (state.docked) {
    return (
      <div
        ref={panelRef}
        data-panel-id={id}
        className={cn(
          "w-56 bg-black/80 backdrop-blur border-r border-white/10 flex flex-col",
          className
        )}
      >
        <div className="h-7 flex items-center justify-between px-2 border-b border-white/10 bg-black/40 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-violet-400">{icon}</span>
            <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{title}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={undock}
              className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              title="Undock panel"
            >
              <GripVertical className="w-3 h-3" />
            </button>
            <button
              onClick={toggleCollapse}
              className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
              title="Collapse panel"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      data-panel-id={id}
      className={cn(
        "absolute w-56 bg-black/90 backdrop-blur border border-white/20 rounded-lg shadow-2xl flex flex-col overflow-hidden",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: state.position.x,
        top: state.position.y,
        zIndex: 1000,
      }}
    >
      <div
        className="h-7 flex items-center justify-between px-2 border-b border-white/10 bg-black/60 shrink-0 cursor-grab select-none"
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="flex items-center gap-1.5 pointer-events-none">
          <span className="text-violet-400">{icon}</span>
          <span className="text-xs font-medium text-white/80 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggleCollapse}
            className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors pointer-events-auto"
            title={state.collapsed ? "Expand" : "Collapse"}
          >
            {state.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors pointer-events-auto"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {!state.collapsed && (
        <div className="flex-1 overflow-auto max-h-[60vh]">
          {children}
        </div>
      )}
    </div>
  );
}
