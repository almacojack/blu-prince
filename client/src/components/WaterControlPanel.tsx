import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Droplets, Waves, Wind, Plus, Minus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONTAINER_TYPES, type ContainerType } from './WaterContainer';

export interface WaterContainerConfig {
  id: string;
  containerType: ContainerType;
  maxVolume: number;
  currentVolume: number;
  containerRadius: number;
  containerHeight: number;
  position: [number, number, number];
  showWaves: boolean;
}

interface WaterControlPanelProps {
  containers: WaterContainerConfig[];
  onAddContainer: () => void;
  onRemoveContainer: (id: string) => void;
  onUpdateContainer: (id: string, updates: Partial<WaterContainerConfig>) => void;
  windIntensity: number;
  activeContainerId: string | null;
  onSelectContainer: (id: string | null) => void;
}

export function WaterControlPanel({
  containers,
  onAddContainer,
  onRemoveContainer,
  onUpdateContainer,
  windIntensity,
  activeContainerId,
  onSelectContainer,
}: WaterControlPanelProps) {
  const activeContainer = containers.find(c => c.id === activeContainerId);

  return (
    <div className="p-2 space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
          <Droplets className="w-3 h-3 text-blue-400" />
          Water Containers
        </Label>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-blue-500/20 text-blue-400"
          onClick={onAddContainer}
          data-testid="button-add-water-container"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      {containers.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <Droplets className="w-6 h-6 mx-auto mb-2 opacity-30" />
          <p className="text-[10px]">No water containers</p>
          <p className="text-[9px] opacity-60">Add one to simulate water!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {containers.map(container => (
            <Button
              key={container.id}
              size="sm"
              variant={activeContainerId === container.id ? "default" : "ghost"}
              className={cn(
                "w-full h-auto py-1.5 px-2 flex items-center justify-between",
                activeContainerId === container.id 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "hover:bg-white/10 text-white/60"
              )}
              onClick={() => onSelectContainer(container.id)}
              data-testid={`water-container-${container.id}`}
            >
              <div className="flex items-center gap-1.5">
                <Droplets className="w-3 h-3" />
                <span className="text-[10px]">{container.containerType}</span>
              </div>
              <span className="text-[9px] font-mono opacity-70">
                {container.currentVolume.toFixed(0)}L / {container.maxVolume}L
              </span>
            </Button>
          ))}
        </div>
      )}

      {activeContainer && (
        <>
          <Separator className="bg-white/10" />

          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-wider text-white/50">
              Container Type
            </Label>
            <Select
              value={activeContainer.containerType}
              onValueChange={(value: ContainerType) => 
                onUpdateContainer(activeContainer.id, { containerType: value })
              }
            >
              <SelectTrigger className="h-7 text-xs bg-black/40 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTAINER_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-400" />
                Volume
              </Label>
              <span className="text-[10px] font-mono text-blue-400">
                {activeContainer.currentVolume.toFixed(1)}L
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[activeContainer.currentVolume]}
                onValueChange={([v]) => onUpdateContainer(activeContainer.id, { currentVolume: v })}
                min={0}
                max={activeContainer.maxVolume}
                step={1}
                className="flex-1"
                data-testid="slider-water-volume"
              />
              <Input
                type="number"
                value={activeContainer.currentVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0;
                  onUpdateContainer(activeContainer.id, { 
                    currentVolume: Math.max(0, Math.min(activeContainer.maxVolume, v)) 
                  });
                }}
                className="w-14 h-5 text-[9px] px-1 py-0 bg-black/40 border-white/10"
                data-testid="input-water-volume"
              />
            </div>
            <div className="flex justify-between text-[8px] text-white/40 px-0.5">
              <span>0L</span>
              <span>{activeContainer.maxVolume}L</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[9px] uppercase tracking-wider text-white/40">Radius</Label>
              <Input
                type="number"
                value={activeContainer.containerRadius}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 0.5;
                  onUpdateContainer(activeContainer.id, { containerRadius: Math.max(0.1, v) });
                }}
                step={0.1}
                min={0.1}
                className="h-6 text-[9px] px-1.5 bg-black/40 border-white/10"
                data-testid="input-container-radius"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[9px] uppercase tracking-wider text-white/40">Height</Label>
              <Input
                type="number"
                value={activeContainer.containerHeight}
                onChange={(e) => {
                  const v = parseFloat(e.target.value) || 1;
                  onUpdateContainer(activeContainer.id, { containerHeight: Math.max(0.5, v) });
                }}
                step={0.1}
                min={0.5}
                className="h-6 text-[9px] px-1.5 bg-black/40 border-white/10"
                data-testid="input-container-height"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase tracking-wider text-white/50 flex items-center gap-1">
              <Waves className="w-3 h-3 text-cyan-400" />
              Waves
            </Label>
            <Switch
              checked={activeContainer.showWaves}
              onCheckedChange={(checked) => 
                onUpdateContainer(activeContainer.id, { showWaves: checked })
              }
              data-testid="switch-show-waves"
            />
          </div>

          {windIntensity > 0 && (
            <div className="text-[9px] text-sky-400 flex items-center gap-1 px-1">
              <Wind className="w-3 h-3" />
              Wind affecting waves: {windIntensity} m/s
            </div>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="w-full h-7 text-[10px] text-red-400 hover:bg-red-500/20 hover:text-red-300"
            onClick={() => {
              onRemoveContainer(activeContainer.id);
              onSelectContainer(null);
            }}
            data-testid="button-remove-water-container"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Remove Container
          </Button>
        </>
      )}
    </div>
  );
}

export function createDefaultWaterContainer(): WaterContainerConfig {
  return {
    id: `water_${Date.now()}`,
    containerType: 'cylinder',
    maxVolume: 1000,
    currentVolume: 500,
    containerRadius: 1,
    containerHeight: 2,
    position: [3, 1, 0],
    showWaves: true,
  };
}
