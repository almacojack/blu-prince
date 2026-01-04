import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Box, 
  Camera, 
  Sun, 
  Moon, 
  Layers, 
  Zap,
  Plus,
  Copy,
  Trash2,
  Check,
  Save,
} from "lucide-react";
import type { EnvironmentPreset } from "@/lib/environment-presets";
import { BUILT_IN_PRESETS, clonePreset } from "@/lib/environment-presets";

const ICON_MAP: Record<string, React.ReactNode> = {
  box: <Box className="w-4 h-4" />,
  camera: <Camera className="w-4 h-4" />,
  sun: <Sun className="w-4 h-4" />,
  moon: <Moon className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />,
  zap: <Zap className="w-4 h-4" />,
};

interface EnvironmentPresetPanelProps {
  customPresets: EnvironmentPreset[];
  activePresetId: string | null;
  onApplyPreset: (preset: EnvironmentPreset) => void;
  onSaveCurrentAsPreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onDuplicatePreset: (preset: EnvironmentPreset) => void;
}

export function EnvironmentPresetPanel({
  customPresets,
  activePresetId,
  onApplyPreset,
  onSaveCurrentAsPreset,
  onDeletePreset,
  onDuplicatePreset,
}: EnvironmentPresetPanelProps) {
  const [newPresetName, setNewPresetName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  const handleSave = () => {
    if (newPresetName.trim()) {
      onSaveCurrentAsPreset(newPresetName.trim());
      setNewPresetName("");
      setShowSaveInput(false);
    }
  };

  return (
    <div className="p-3 space-y-4" data-testid="environment-preset-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Environments</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSaveInput(!showSaveInput)}
          className="h-7 text-xs"
          data-testid="button-save-environment"
        >
          <Save className="w-3 h-3 mr-1" />
          Save
        </Button>
      </div>

      {showSaveInput && (
        <div className="flex gap-2">
          <Input
            placeholder="Environment name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            data-testid="input-preset-name"
          />
          <Button
            size="sm"
            className="h-8"
            onClick={handleSave}
            disabled={!newPresetName.trim()}
            data-testid="button-confirm-save"
          >
            <Check className="w-3 h-3" />
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-[10px] uppercase text-muted-foreground">Built-in</Label>
        <ScrollArea className="h-[180px]">
          <div className="space-y-1">
            {BUILT_IN_PRESETS.map(preset => (
              <div
                key={preset.id}
                className={`group p-2 rounded border cursor-pointer transition-colors ${
                  activePresetId === preset.id
                    ? "border-cyan-500/50 bg-cyan-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
                onClick={() => onApplyPreset(preset)}
                data-testid={`preset-${preset.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400">
                      {ICON_MAP[preset.icon] || <Box className="w-4 h-4" />}
                    </span>
                    <div>
                      <div className="text-xs text-white">{preset.name}</div>
                      <div className="text-[9px] text-muted-foreground">{preset.description}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePreset(clonePreset(preset));
                    }}
                    data-testid={`duplicate-${preset.id}`}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {customPresets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[10px] uppercase text-muted-foreground">Custom</Label>
          <ScrollArea className="h-[120px]">
            <div className="space-y-1">
              {customPresets.map(preset => (
                <div
                  key={preset.id}
                  className={`group p-2 rounded border cursor-pointer transition-colors ${
                    activePresetId === preset.id
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                  onClick={() => onApplyPreset(preset)}
                  data-testid={`custom-preset-${preset.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs text-white">{preset.name}</div>
                        <div className="text-[9px] text-muted-foreground">{preset.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicatePreset(clonePreset(preset));
                        }}
                        data-testid={`duplicate-custom-${preset.id}`}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePreset(preset.id);
                        }}
                        data-testid={`delete-custom-${preset.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {activePresetId && (
        <div className="pt-2 border-t border-white/10">
          <div className="text-[10px] text-muted-foreground text-center">
            Active: <span className="text-cyan-400">{allPresets.find(p => p.id === activePresetId)?.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}
