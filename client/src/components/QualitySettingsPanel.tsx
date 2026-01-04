import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Zap, 
  Gauge, 
  Sparkles, 
  Box, 
  Camera, 
  Sun, 
  Layers,
  Monitor,
  Smartphone,
  Cpu
} from 'lucide-react';
import { usePerformance, QualityLevel, CameraMode } from '@/lib/performance-context';
import { cn } from '@/lib/utils';

const QUALITY_INFO: Record<QualityLevel, { label: string; description: string; icon: React.ReactNode; color: string }> = {
  low: {
    label: 'LEGO Mode',
    description: 'Flat shading, no shadows. Best for mobile & low-end devices.',
    icon: <Box className="w-4 h-4" />,
    color: 'text-green-400 border-green-400/50 bg-green-400/10',
  },
  medium: {
    label: 'Balanced',
    description: 'Shadows, smooth shading. Good balance of quality and speed.',
    icon: <Gauge className="w-4 h-4" />,
    color: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
  },
  high: {
    label: 'Ultra',
    description: 'Full PBR, post-processing, reflections. For powerful GPUs.',
    icon: <Sparkles className="w-4 h-4" />,
    color: 'text-purple-400 border-purple-400/50 bg-purple-400/10',
  },
};

interface QualitySettingsPanelProps {
  compact?: boolean;
}

export function QualitySettingsPanel({ compact = false }: QualitySettingsPanelProps) {
  const { state, setQuality, setCameraMode, toggleCameraMode, setAutoAdjust } = usePerformance();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {(['low', 'medium', 'high'] as QualityLevel[]).map((level) => {
            const info = QUALITY_INFO[level];
            const isActive = state.quality === level;
            return (
              <button
                key={level}
                onClick={() => setQuality(level)}
                className={cn(
                  "px-2 py-1 text-[10px] font-mono font-bold uppercase transition-all",
                  isActive ? info.color : "bg-black/40 text-white/50 hover:text-white/80"
                )}
                data-testid={`button-quality-${level}`}
              >
                {level === 'low' ? 'LEGO' : level === 'medium' ? 'BAL' : 'HD'}
              </button>
            );
          })}
        </div>
        <button
          onClick={toggleCameraMode}
          className={cn(
            "px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border transition-all",
            state.cameraMode === 'orthographic' 
              ? "text-cyan-400 border-cyan-400/50 bg-cyan-400/10" 
              : "text-white/50 border-white/10 bg-black/40 hover:text-white/80"
          )}
          data-testid="button-camera-mode"
        >
          {state.cameraMode === 'perspective' ? '3D' : 'ISO'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Quality Settings
        </Label>
        <Badge variant="outline" className="text-[9px] font-mono">
          {state.fps.toFixed(0)} FPS
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(['low', 'medium', 'high'] as QualityLevel[]).map((level) => {
          const info = QUALITY_INFO[level];
          const isActive = state.quality === level;
          return (
            <button
              key={level}
              onClick={() => setQuality(level)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                isActive ? info.color : "border-white/10 bg-black/20 hover:border-white/20"
              )}
              data-testid={`button-quality-${level}`}
            >
              {info.icon}
              <span className="text-[10px] font-mono font-bold uppercase">{info.label}</span>
            </button>
          );
        })}
      </div>

      <div className="text-[10px] text-muted-foreground text-center">
        {QUALITY_INFO[state.quality].description}
      </div>

      <div className="border-t border-white/10 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-2">
            <Camera className="w-3 h-3" />
            Camera Mode
          </Label>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setCameraMode('perspective')}
              className={cn(
                "px-3 py-1 text-[10px] font-mono transition-all",
                state.cameraMode === 'perspective' 
                  ? "bg-primary text-white" 
                  : "bg-black/40 text-white/50 hover:text-white"
              )}
              data-testid="button-perspective"
            >
              3D
            </button>
            <button
              onClick={() => setCameraMode('orthographic')}
              className={cn(
                "px-3 py-1 text-[10px] font-mono transition-all",
                state.cameraMode === 'orthographic' 
                  ? "bg-cyan-500 text-black" 
                  : "bg-black/40 text-white/50 hover:text-white"
              )}
              data-testid="button-orthographic"
            >
              ISO
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Auto-Adjust Quality
          </Label>
          <Switch
            checked={state.autoAdjust}
            onCheckedChange={setAutoAdjust}
            data-testid="switch-auto-adjust"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-3">
        <Label className="text-[10px] text-muted-foreground mb-2 block">Current Settings</Label>
        <div className="grid grid-cols-2 gap-1 text-[9px] font-mono">
          <div className="flex justify-between px-2 py-1 bg-black/20 rounded">
            <span className="text-muted-foreground">Shadows</span>
            <span className={state.preset.shadows ? "text-green-400" : "text-red-400"}>
              {state.preset.shadows ? "ON" : "OFF"}
            </span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-black/20 rounded">
            <span className="text-muted-foreground">Flat Shade</span>
            <span className={state.preset.flatShading ? "text-green-400" : "text-red-400"}>
              {state.preset.flatShading ? "ON" : "OFF"}
            </span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-black/20 rounded">
            <span className="text-muted-foreground">Draw Calls</span>
            <span className="text-cyan-400">{state.drawCalls}</span>
          </div>
          <div className="flex justify-between px-2 py-1 bg-black/20 rounded">
            <span className="text-muted-foreground">Triangles</span>
            <span className="text-cyan-400">{(state.triangles / 1000).toFixed(1)}K</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QualityQuickToggle() {
  const { state, setQuality, toggleCameraMode } = usePerformance();
  
  const cycleQuality = () => {
    const levels: QualityLevel[] = ['low', 'medium', 'high'];
    const currentIndex = levels.indexOf(state.quality);
    const nextIndex = (currentIndex + 1) % levels.length;
    setQuality(levels[nextIndex]);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleQuality}
        className="h-7 px-2 text-[10px] font-mono"
        data-testid="button-cycle-quality"
      >
        {state.quality === 'low' && <Box className="w-3 h-3 mr-1 text-green-400" />}
        {state.quality === 'medium' && <Gauge className="w-3 h-3 mr-1 text-yellow-400" />}
        {state.quality === 'high' && <Sparkles className="w-3 h-3 mr-1 text-purple-400" />}
        {state.quality.toUpperCase()}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleCameraMode}
        className="h-7 px-2 text-[10px] font-mono"
        data-testid="button-toggle-camera"
      >
        <Camera className="w-3 h-3 mr-1" />
        {state.cameraMode === 'perspective' ? '3D' : 'ISO'}
      </Button>
    </div>
  );
}
