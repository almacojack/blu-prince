import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Flame, Snowflake, Wind, Droplets, Atom, RadioTower
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  dangerLevel: 'safe' | 'caution' | 'danger';
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
    bgColor: 'bg-gradient-to-r from-orange-600 to-red-600',
    dangerLevel: 'caution'
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
    bgColor: 'bg-gradient-to-r from-cyan-600 to-blue-600',
    dangerLevel: 'safe'
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
    bgColor: 'bg-gradient-to-r from-sky-600 to-teal-600',
    dangerLevel: 'safe'
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
    bgColor: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    dangerLevel: 'safe'
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
    bgColor: 'bg-gradient-to-r from-purple-600 to-violet-900',
    dangerLevel: 'caution'
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
    bgColor: 'bg-gradient-to-r from-green-600 to-yellow-600',
    dangerLevel: 'danger'
  },
];

interface EnvironmentalForcesPanelProps {
  forces: ForceConfig[];
  onForceToggle: (type: EnvironmentalForce) => void;
  onForceIntensityChange: (type: EnvironmentalForce, intensity: number) => void;
}

export const DEFAULT_FORCES: ForceConfig[] = [
  { type: 'FIRE', intensity: 1200, enabled: false },
  { type: 'ICE', intensity: 77, enabled: false },
  { type: 'WIND', intensity: 25, enabled: false },
  { type: 'WATER', intensity: 100, enabled: false },
  { type: 'VACUUM', intensity: 1, enabled: false },
  { type: 'NUKE', intensity: 1, enabled: false },
];

export function EnvironmentalForcesPanel({
  forces = DEFAULT_FORCES,
  onForceToggle,
  onForceIntensityChange,
}: EnvironmentalForcesPanelProps) {
  const getForceConfig = (type: EnvironmentalForce) => 
    forces.find(f => f.type === type) || { type, intensity: 0, enabled: false };

  const activeCount = forces.filter(f => f.enabled).length;

  return (
    <div className="p-2 space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
          <Atom className="w-3 h-3 text-purple-400" />
          Forces Active
        </Label>
        <span className="text-[10px] font-mono text-purple-400">{activeCount}/6</span>
      </div>

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
                    : "hover:bg-white/10 text-white/60",
                  force.dangerLevel === 'danger' && isActive && "animate-pulse"
                )}
                onClick={() => onForceToggle(force.type)}
                data-testid={`force-${force.type.toLowerCase()}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "p-0.5 rounded", 
                    isActive ? "bg-white/20" : "bg-white/5", 
                    force.color
                  )}>
                    {force.icon}
                  </span>
                  <span className="text-[10px] font-medium">{force.label}</span>
                  {force.dangerLevel === 'danger' && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/30 text-red-300 font-bold">
                      CAUTION!
                    </span>
                  )}
                </div>
                <span className="text-[9px] opacity-70 font-mono">
                  {config.intensity.toLocaleString()} {force.unit}
                </span>
              </Button>
              
              {isActive && (
                <div className="flex items-center gap-1 px-1 py-0.5 bg-black/30 rounded">
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

      {activeCount > 0 && (
        <div className="text-[9px] text-center text-white/40 border-t border-white/10 pt-2 mt-2">
          {activeCount === 6 ? "🌪️ MAXIMUM CHAOS MODE! 🔥" : `${activeCount} force${activeCount > 1 ? 's' : ''} active`}
        </div>
      )}
    </div>
  );
}
