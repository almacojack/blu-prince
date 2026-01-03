import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  MousePointer2, Move, RotateCcw, Maximize2, 
  Zap, Target, Magnet, Link2, Sparkles,
  Hand, Circle, Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type PhysicsTool = 
  | 'select' 
  | 'move' 
  | 'rotate' 
  | 'scale'
  | 'flick'
  | 'pool_cue'
  | 'slingshot'
  | 'spring'
  | 'magnet'
  | 'water_hose';

interface ToolsPanelProps {
  activeTool: PhysicsTool;
  onToolChange: (tool: PhysicsTool) => void;
  toolPower: number;
  onToolPowerChange: (power: number) => void;
  magnetPolarity: 'attract' | 'repel';
  onMagnetPolarityChange: (polarity: 'attract' | 'repel') => void;
}

const TRANSFORM_TOOLS: { id: PhysicsTool; icon: React.ReactNode; label: string; shortcut?: string }[] = [
  { id: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select', shortcut: 'V' },
  { id: 'move', icon: <Move className="w-4 h-4" />, label: 'Move', shortcut: 'G' },
  { id: 'rotate', icon: <RotateCcw className="w-4 h-4" />, label: 'Rotate', shortcut: 'R' },
  { id: 'scale', icon: <Maximize2 className="w-4 h-4" />, label: 'Scale', shortcut: 'S' },
];

const PHYSICS_TOOLS: { id: PhysicsTool; icon: React.ReactNode; label: string; description: string }[] = [
  { id: 'flick', icon: <Hand className="w-4 h-4" />, label: 'Flick', description: 'Drag & release to throw' },
  { id: 'pool_cue', icon: <Target className="w-4 h-4" />, label: 'Pool Cue', description: 'Pull back & shoot' },
  { id: 'slingshot', icon: <Sparkles className="w-4 h-4" />, label: 'Slingshot', description: 'Stretch & BOING!' },
  { id: 'spring', icon: <Link2 className="w-4 h-4" />, label: 'Spring', description: 'Connect with springs' },
  { id: 'magnet', icon: <Magnet className="w-4 h-4" />, label: 'Magnet', description: 'Attract or repel' },
  { id: 'water_hose', icon: <Droplets className="w-4 h-4" />, label: 'Water Hose', description: 'Fill containers!' },
];

export function ToolsPanel({
  activeTool,
  onToolChange,
  toolPower,
  onToolPowerChange,
  magnetPolarity,
  onMagnetPolarityChange,
}: ToolsPanelProps) {
  return (
    <div className="p-2 space-y-3">
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-white/50">Transform</Label>
        <div className="grid grid-cols-4 gap-1">
          {TRANSFORM_TOOLS.map(tool => (
            <Button
              key={tool.id}
              size="sm"
              variant={activeTool === tool.id ? "default" : "ghost"}
              className={cn(
                "h-8 w-full flex flex-col items-center justify-center gap-0.5 p-1",
                activeTool === tool.id 
                  ? "bg-violet-600 hover:bg-violet-700 text-white" 
                  : "hover:bg-white/10 text-white/60"
              )}
              onClick={() => onToolChange(tool.id)}
              title={`${tool.label} (${tool.shortcut})`}
              data-testid={`tool-${tool.id}`}
            >
              {tool.icon}
              <span className="text-[8px]">{tool.shortcut}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          Game Controls
        </Label>
        <div className="space-y-1">
          {PHYSICS_TOOLS.map(tool => (
            <Button
              key={tool.id}
              size="sm"
              variant={activeTool === tool.id ? "default" : "ghost"}
              className={cn(
                "w-full h-auto py-1.5 px-2 flex items-center gap-2 justify-start",
                activeTool === tool.id 
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white" 
                  : "hover:bg-white/10 text-white/60"
              )}
              onClick={() => onToolChange(tool.id)}
              data-testid={`tool-${tool.id}`}
            >
              <span className={cn(
                "p-1 rounded",
                activeTool === tool.id ? "bg-white/20" : "bg-white/5"
              )}>
                {tool.icon}
              </span>
              <div className="text-left">
                <div className="text-xs font-medium">{tool.label}</div>
                <div className="text-[9px] opacity-60">{tool.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-white/10" />

      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-wider text-white/50">Power: {toolPower}%</Label>
        <Slider
          value={[toolPower]}
          onValueChange={([v]) => onToolPowerChange(v)}
          min={10}
          max={200}
          step={10}
          className="w-full"
          data-testid="slider-tool-power"
        />
      </div>

      {activeTool === 'magnet' && (
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-white/50">Polarity</Label>
          <div className="grid grid-cols-2 gap-1">
            <Button
              size="sm"
              variant={magnetPolarity === 'attract' ? "default" : "ghost"}
              className={cn(
                "h-7",
                magnetPolarity === 'attract' 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "hover:bg-white/10 text-white/60"
              )}
              onClick={() => onMagnetPolarityChange('attract')}
              data-testid="btn-magnet-attract"
            >
              <Circle className="w-3 h-3 mr-1 fill-current" />
              Attract
            </Button>
            <Button
              size="sm"
              variant={magnetPolarity === 'repel' ? "default" : "ghost"}
              className={cn(
                "h-7",
                magnetPolarity === 'repel' 
                  ? "bg-red-600 hover:bg-red-700" 
                  : "hover:bg-white/10 text-white/60"
              )}
              onClick={() => onMagnetPolarityChange('repel')}
              data-testid="btn-magnet-repel"
            >
              <Circle className="w-3 h-3 mr-1" />
              Repel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
