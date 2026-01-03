import { useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Move3D,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Focus,
  Eye,
  Maximize,
  Grid3X3,
  Crosshair,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CameraSettings {
  distance: number;
  fov: number;
  nearClip: number;
  farClip: number;
  autoFocus: boolean;
  showGrid: boolean;
  showGizmo: boolean;
  orthographic: boolean;
  damping: boolean;
}

interface CameraControlPanelProps {
  settings: CameraSettings;
  onSettingsChange: (settings: Partial<CameraSettings>) => void;
  onResetView: () => void;
  onFocusSelected: () => void;
  hasSelection: boolean;
  className?: string;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  distance: 5,
  fov: 50,
  nearClip: 0.1,
  farClip: 1000,
  autoFocus: true,
  showGrid: true,
  showGizmo: true,
  orthographic: false,
  damping: true,
};

export function CameraControlPanel({
  settings,
  onSettingsChange,
  onResetView,
  onFocusSelected,
  hasSelection,
  className,
}: CameraControlPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-zinc-300">Camera</span>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-[8px] px-1.5",
            settings.orthographic 
              ? "border-amber-500/50 text-amber-400" 
              : "border-cyan-500/50 text-cyan-400"
          )}
        >
          {settings.orthographic ? "ORTHO" : "PERSP"}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Move3D className="w-3 h-3" />
            Distance (Back-off)
          </Label>
          <span className="text-[10px] font-mono text-cyan-400">{settings.distance.toFixed(1)}u</span>
        </div>
        <div className="flex items-center gap-2">
          <ZoomIn className="w-3 h-3 text-zinc-500" />
          <Slider
            value={[settings.distance]}
            min={1}
            max={20}
            step={0.5}
            onValueChange={([v]) => onSettingsChange({ distance: v })}
            className="flex-1"
            data-testid="slider-camera-distance"
          />
          <ZoomOut className="w-3 h-3 text-zinc-500" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Field of View
          </Label>
          <span className="text-[10px] font-mono text-cyan-400">{settings.fov}°</span>
        </div>
        <Slider
          value={[settings.fov]}
          min={20}
          max={120}
          step={5}
          onValueChange={([v]) => onSettingsChange({ fov: v })}
          disabled={settings.orthographic}
          className={settings.orthographic ? "opacity-50" : ""}
          data-testid="slider-camera-fov"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-7 text-[10px] border-zinc-700 hover:border-cyan-500/50 hover:text-cyan-400"
          onClick={onResetView}
          data-testid="button-reset-view"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "flex-1 h-7 text-[10px]",
            hasSelection 
              ? "border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10" 
              : "border-zinc-700 text-zinc-500 cursor-not-allowed"
          )}
          onClick={onFocusSelected}
          disabled={!hasSelection}
          data-testid="button-focus-selected"
        >
          <Focus className="w-3 h-3 mr-1" />
          Focus
        </Button>
      </div>

      <div className="space-y-2 pt-2 border-t border-white/5">
        <div className="flex items-center justify-between py-1">
          <Label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Crosshair className="w-3 h-3" />
            Auto-Focus on Select
          </Label>
          <Switch
            checked={settings.autoFocus}
            onCheckedChange={(v) => onSettingsChange({ autoFocus: v })}
            className="scale-75"
            data-testid="switch-auto-focus"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <Label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Maximize className="w-3 h-3" />
            Orthographic
          </Label>
          <Switch
            checked={settings.orthographic}
            onCheckedChange={(v) => onSettingsChange({ orthographic: v })}
            className="scale-75"
            data-testid="switch-orthographic"
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <Label className="text-[10px] text-zinc-400 flex items-center gap-1">
            <Grid3X3 className="w-3 h-3" />
            Show Grid
          </Label>
          <Switch
            checked={settings.showGrid}
            onCheckedChange={(v) => onSettingsChange({ showGrid: v })}
            className="scale-75"
            data-testid="switch-show-grid"
          />
        </div>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-[9px] text-zinc-500 hover:text-zinc-400 py-1"
        data-testid="button-toggle-advanced"
      >
        {showAdvanced ? "▼ Hide Advanced" : "▶ Show Advanced"}
      </button>

      {showAdvanced && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="space-y-2 pt-2 border-t border-white/5"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-zinc-500">Near Clip</Label>
              <span className="text-[9px] font-mono text-zinc-500">{settings.nearClip}</span>
            </div>
            <Slider
              value={[settings.nearClip]}
              min={0.01}
              max={1}
              step={0.01}
              onValueChange={([v]) => onSettingsChange({ nearClip: v })}
              data-testid="slider-near-clip"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] text-zinc-500">Far Clip</Label>
              <span className="text-[9px] font-mono text-zinc-500">{settings.farClip}</span>
            </div>
            <Slider
              value={[settings.farClip]}
              min={100}
              max={5000}
              step={100}
              onValueChange={([v]) => onSettingsChange({ farClip: v })}
              data-testid="slider-far-clip"
            />
          </div>

          <div className="flex items-center justify-between py-1">
            <Label className="text-[10px] text-zinc-500">Smooth Damping</Label>
            <Switch
              checked={settings.damping}
              onCheckedChange={(v) => onSettingsChange({ damping: v })}
              className="scale-75"
              data-testid="switch-damping"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
