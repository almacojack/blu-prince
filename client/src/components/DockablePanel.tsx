import React, { useState, useRef, useCallback } from 'react';
import { GripVertical, Settings, X } from 'lucide-react';
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
  onSettingsClick?: () => void;
  showSettings?: boolean;
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
  onSettingsClick,
  showSettings = false,
  className,
}: DockablePanelProps) {
  const [state, setState] = useState<PanelState>({
    docked: defaultDocked,
    collapsed: defaultCollapsed,
    position: defaultPosition,
  });
  
  const panelRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    // Don't start drag if clicking on a button
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    if (state.docked) {
      setState(prev => ({ 
        ...prev, 
        docked: false, 
        position: { x: 100, y: e.clientY - 20 } 
      }));
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: state.docked ? 100 : state.position.x,
      startPosY: state.docked ? e.clientY - 20 : state.position.y,
    };
    
    // Use titleBar for capture to allow full bar dragging
    titleBarRef.current?.setPointerCapture(e.pointerId);
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
      setState(prev => ({ ...prev, docked: false, position: { x: newX, y: newY } }));
    }
  }, [isDragging]);

  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    dragRef.current = null;
    titleBarRef.current?.releasePointerCapture(e.pointerId);
  }, [isDragging]);

  const toggleCollapse = useCallback(() => {
    setState(prev => ({ ...prev, collapsed: !prev.collapsed }));
  }, []);

  // Collapsed docked state - just show icon button (minimal height)
  if (state.docked && state.collapsed) {
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

  // Docked state - compact panel
  if (state.docked) {
    return (
      <div
        ref={panelRef}
        data-panel-id={id}
        className={cn(
          "w-48 bg-black/90 backdrop-blur border-r border-white/10 flex flex-col max-h-[70vh]",
          className
        )}
      >
        {/* Title bar - compact */}
        <div 
          ref={titleBarRef}
          className={cn(
            "h-8 flex items-center justify-between px-1.5 border-b border-white/10 bg-black/40 shrink-0 select-none",
            "cursor-grab active:cursor-grabbing touch-manipulation"
          )}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded hover:bg-white/10 text-violet-400 hover:text-violet-300 transition-colors touch-manipulation"
              title={`Collapse ${title}`}
              data-testid={`button-collapse-${id}`}
            >
              {icon}
            </button>
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">{title}</span>
          </div>
          <div className="flex items-center">
            {showSettings && onSettingsClick && (
              <button
                onClick={onSettingsClick}
                className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors touch-manipulation"
                title="Panel settings"
                data-testid={`button-settings-${id}`}
              >
                <Settings className="w-3 h-3" />
              </button>
            )}
            <div className="p-0.5 text-white/30">
              <GripVertical className="w-3 h-3" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  // Undocked/floating state - compact
  return (
    <div
      ref={panelRef}
      data-panel-id={id}
      className={cn(
        "absolute w-48 bg-black/95 backdrop-blur border border-white/20 rounded-lg shadow-2xl flex flex-col overflow-hidden",
        isDragging && "cursor-grabbing",
        className
      )}
      style={{
        left: state.position.x,
        top: state.position.y,
        zIndex: 1000,
      }}
    >
      {/* Title bar - compact */}
      <div 
        ref={titleBarRef}
        className={cn(
          "h-8 flex items-center justify-between px-1.5 border-b border-white/10 bg-black/60 shrink-0 select-none",
          "cursor-grab active:cursor-grabbing touch-manipulation"
        )}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={toggleCollapse}
            className="p-1.5 rounded hover:bg-white/10 text-violet-400 hover:text-violet-300 transition-colors touch-manipulation"
            title={state.collapsed ? `Expand ${title}` : `Collapse ${title}`}
            data-testid={`button-toggle-${id}`}
          >
            {icon}
          </button>
          <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center">
          {showSettings && onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors touch-manipulation"
              title="Panel settings"
            >
              <Settings className="w-3 h-3" />
            </button>
          )}
          <div className="p-0.5 text-white/30">
            <GripVertical className="w-3 h-3" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors touch-manipulation"
              title="Close"
              data-testid={`button-close-${id}`}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {!state.collapsed && (
        <div className="flex-1 overflow-auto max-h-[50vh]">
          {children}
        </div>
      )}
    </div>
  );
}
