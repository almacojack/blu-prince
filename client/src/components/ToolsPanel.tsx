import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  MousePointer2, Move, RotateCcw, Maximize2, 
  Zap, Target, Magnet, Link2, Sparkles,
  Hand, Circle, Flame, Snowflake, Wind, 
  Droplets, Atom, RadioTower
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

// Environmental force types with scientific units
export type EnvironmentalForce = 'FIRE' | 'ICE' | 'WIND' | 'WATER' | 'VACUUM' | 'NUKE';

export interface ForceConfig {
  type: EnvironmentalForce;
  intensity: number;
  enabled: boolean;
}

interface ForceDefinition {
  type: EnvironmentalForce;
  icon: React.ReactNode;
  label: string;
  unit: string;
  unitLabel: string;
  min: number;
  max: number;
  defaultValue: number;
  color: string;
  bgColor: string;
}

const ENVIRONMENTAL_FORCES: ForceDefinition[] = [
  { 
    type: 'FIRE', 
    icon: <Flame className="w-3.5 h-3.5" />, 
    label: 'Fire', 
    unit: 'K', 
    unitLabel: 'Kelvin',
    min: 300, 
    max: 5000, 
    defaultValue: 1200,
    color: 'text-orange-400',
    bgColor: 'bg-gradient-to-r from-orange-600 to-red-600'
  },
  { 
    type: 'ICE', 
    icon: <Snowflake className="w-3.5 h-3.5" />, 
    label: 'Ice', 
    unit: 'K', 
    unitLabel: 'Kelvin',
    min: 0, 
    max: 273, 
    defaultValue: 77,
    color: 'text-cyan-400',
    bgColor: 'bg-gradient-to-r from-cyan-600 to-blue-600'
  },
  { 
    type: 'WIND', 
    icon: <Wind className="w-3.5 h-3.5" />, 
    label: 'Wind', 
    unit: 'm/s', 
    unitLabel: 'meters/sec',
    min: 0, 
    max: 150, 
    defaultValue: 25,
    color: 'text-sky-400',
    bgColor: 'bg-gradient-to-r from-sky-600 to-teal-600'
  },
  { 
    type: 'WATER', 
    icon: <Droplets className="w-3.5 h-3.5" />, 
    label: 'Water', 
    unit: 'L', 
    unitLabel: 'Liters',
    min: 0, 
    max: 1000, 
    defaultValue: 100,
    color: 'text-blue-400',
    bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-600'
  },
  { 
    type: 'VACUUM', 
    icon: <Atom className="w-3.5 h-3.5" />, 
    label: 'Vacuum', 
    unit: 'Pa', 
    unitLabel: 'Pascals',
    min: 0, 
    max: 101325, 
    defaultValue: 1,
    color: 'text-purple-400',
    bgColor: 'bg-gradient-to-r from-purple-600 to-violet-900'
  },
  { 
    type: 'NUKE', 
    icon: <RadioTower className="w-3.5 h-3.5" />, 
    label: 'Nuke', 
    unit: 'Sv', 
    unitLabel: 'Sieverts',
    min: 0, 
    max: 100, 
    defaultValue: 1,
    color: 'text-green-400',
    bgColor: 'bg-gradient-to-r from-green-600 to-yellow-600'
  },
];

interface ToolsPanelProps {
  activeTool: PhysicsTool;
  onToolChange: (tool: PhysicsTool) => void;
  toolPower: number;
  onToolPowerChange: (power: number) => void;
  magnetPolarity: 'attract' | 'repel';
  onMagnetPolarityChange: (polarity: 'attract' | 'repel') => void;
  environmentalForces: ForceConfig[];
  onForceToggle: (type: EnvironmentalForce) => void;
  onForceIntensityChange: (type: EnvironmentalForce, intensity: number) => void;
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
];

export function ToolsPanel({
  activeTool,
  onToolChange,
  toolPower,
  onToolPowerChange,
  magnetPolarity,
  onMagnetPolarityChange,
  environmentalForces,
  onForceToggle,
  onForceIntensityChange,
}: ToolsPanelProps) {
  const getForceConfig = (type: EnvironmentalForce) => 
    environmentalForces.find(f => f.type === type) || { type, intensity: 0, enabled: false };
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

      <Separator className="bg-white/10" />

      {/* Environmental Forces */}
      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
          <Atom className="w-3 h-3 text-purple-400" />
          Environmental Forces
        </Label>
        <div className="space-y-1">
          {ENVIRONMENTAL_FORCES.map(force => {
            const config = getForceConfig(force.type);
            const isActive = config.enabled;
            
            return (
              <div key={force.type} className="space-y-0.5">
                <Button
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full h-auto py-1 px-2 flex items-center gap-2 justify-between",
                    isActive 
                      ? `${force.bgColor} hover:opacity-90 text-white` 
                      : "hover:bg-white/10 text-white/60"
                  )}
                  onClick={() => onForceToggle(force.type)}
                  data-testid={`force-${force.type.toLowerCase()}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn("p-0.5 rounded", isActive ? "bg-white/20" : "bg-white/5", force.color)}>
                      {force.icon}
                    </span>
                    <span className="text-[10px] font-medium">{force.label}</span>
                  </div>
                  <span className="text-[9px] opacity-70 font-mono">
                    {config.intensity.toLocaleString()} {force.unit}
                  </span>
                </Button>
                
                {isActive && (
                  <div className="flex items-center gap-1 px-1">
                    <Slider
                      value={[config.intensity]}
                      onValueChange={([v]) => onForceIntensityChange(force.type, v)}
                      min={force.min}
                      max={force.max}
                      step={force.max > 1000 ? 100 : force.max > 100 ? 10 : 1}
                      className="flex-1"
                      data-testid={`slider-${force.type.toLowerCase()}`}
                    />
                    <Input
                      type="number"
                      value={config.intensity}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        onForceIntensityChange(force.type, Math.max(force.min, Math.min(force.max, v)));
                      }}
                      className="w-14 h-5 text-[9px] px-1 py-0 bg-black/40 border-white/10"
                      data-testid={`input-${force.type.toLowerCase()}`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
