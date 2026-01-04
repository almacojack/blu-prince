import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface SidebarPanel {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  badge?: string | number;
}

interface VSCodeSidebarProps {
  panels: SidebarPanel[];
  defaultActivePanel?: string;
  defaultCollapsed?: boolean;
  side?: 'left' | 'right';
  className?: string;
}

export function VSCodeSidebar({
  panels,
  defaultActivePanel,
  defaultCollapsed = false,
  side = 'left',
  className,
}: VSCodeSidebarProps) {
  const [activePanel, setActivePanel] = useState<string | null>(defaultActivePanel || (panels[0]?.id ?? null));
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handlePanelClick = useCallback((panelId: string) => {
    if (activePanel === panelId) {
      setActivePanel(null);
    } else {
      setActivePanel(panelId);
      if (collapsed) setCollapsed(false);
    }
  }, [activePanel, collapsed]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const activePanelData = panels.find(p => p.id === activePanel);
  const showContent = !collapsed && activePanel && activePanelData;

  return (
    <div 
      className={cn(
        "flex h-full",
        side === 'right' && "flex-row-reverse",
        className
      )}
    >
      {/* Icon Strip - Always visible */}
      <div 
        className={cn(
          "flex flex-col w-12 bg-[#1e1e1e]",
          side === 'left' ? "border-r border-white/10" : "border-l border-white/10"
        )}
        style={{
          boxShadow: side === 'left' 
            ? 'inset -1px 0 0 rgba(255,255,255,0.05)' 
            : 'inset 1px 0 0 rgba(255,255,255,0.05)',
        }}
      >
        {/* Panel icons */}
        <div className="flex-1 flex flex-col pt-1">
          <TooltipProvider delayDuration={200}>
            {panels.map((panel) => {
              const isActive = activePanel === panel.id && !collapsed;
              return (
                <Tooltip key={panel.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handlePanelClick(panel.id)}
                      className={cn(
                        "relative w-full h-12 flex items-center justify-center transition-all",
                        "hover:bg-white/5",
                        isActive && "bg-white/5",
                        isActive && side === 'left' && "border-l-2 border-primary",
                        isActive && side === 'right' && "border-r-2 border-primary",
                      )}
                      data-testid={`sidebar-icon-${panel.id}`}
                    >
                      <div className={cn(
                        "transition-colors",
                        isActive ? "text-white" : "text-white/50 hover:text-white/80"
                      )}>
                        {panel.icon}
                      </div>
                      {panel.badge && (
                        <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                          {panel.badge}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side={side === 'left' ? 'right' : 'left'} className="font-medium">
                    {panel.title}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>

        {/* Collapse toggle at bottom */}
        <div className="border-t border-white/10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleCollapse}
                  className="w-full h-10 flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
                  data-testid="sidebar-collapse-toggle"
                >
                  {side === 'left' ? (
                    collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
                  ) : (
                    collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side={side === 'left' ? 'right' : 'left'}>
                {collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Panel Content - Collapsible */}
      <div 
        className={cn(
          "bg-[#252526] overflow-hidden transition-all duration-200",
          side === 'left' ? "border-r border-white/10" : "border-l border-white/10",
          showContent ? "w-72" : "w-0"
        )}
      >
        {showContent && (
          <div className="w-72 h-full flex flex-col">
            {/* Panel Header */}
            <div className="h-9 px-4 flex items-center justify-between border-b border-white/10 bg-[#1e1e1e]">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {activePanelData.title}
              </span>
            </div>
            
            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {activePanelData.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VSCodeSidebar;
