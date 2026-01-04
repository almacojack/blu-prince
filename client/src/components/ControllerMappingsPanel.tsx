import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gamepad2, 
  Plus, 
  Trash2, 
  Settings, 
  Check, 
  X as XIcon,
  ChevronDown,
  Save,
  RotateCcw,
  Zap,
  Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  ControllerPreset, 
  ControllerMappingEntry,
  CONTROLLER_BUTTONS,
  createDefaultControllerPreset 
} from "@/lib/toss";
import { useGamepad, GamepadInput } from "@/hooks/use-gamepad";
import { useToast } from "@/hooks/use-toast";

interface ControllerMappingsPanelProps {
  presets: ControllerPreset[];
  activePresetId?: string;
  onPresetsChange: (presets: ControllerPreset[]) => void;
  onActivePresetChange: (presetId: string) => void;
}

const AVAILABLE_ACTIONS = [
  { value: "select", label: "Select Object" },
  { value: "deselect", label: "Deselect" },
  { value: "delete", label: "Delete Object" },
  { value: "add_object", label: "Add Object" },
  { value: "previous_object", label: "Previous Object" },
  { value: "next_object", label: "Next Object" },
  { value: "camera_orbit_horizontal", label: "Camera Orbit (Horizontal)" },
  { value: "camera_orbit_vertical", label: "Camera Orbit (Vertical)" },
  { value: "camera_pan_x", label: "Camera Pan X" },
  { value: "camera_pan_y", label: "Camera Pan Y" },
  { value: "camera_zoom_in", label: "Zoom In" },
  { value: "camera_zoom_out", label: "Zoom Out" },
  { value: "move_up", label: "Move Object Up" },
  { value: "move_down", label: "Move Object Down" },
  { value: "move_left", label: "Move Object Left" },
  { value: "move_right", label: "Move Object Right" },
  { value: "rotate_cw", label: "Rotate Clockwise" },
  { value: "rotate_ccw", label: "Rotate Counter-CW" },
  { value: "scale_up", label: "Scale Up" },
  { value: "scale_down", label: "Scale Down" },
  { value: "toggle_menu", label: "Toggle Menu" },
  { value: "toggle_layers", label: "Toggle Layers" },
  { value: "toggle_gravity", label: "Toggle Gravity" },
  { value: "undo", label: "Undo" },
  { value: "redo", label: "Redo" },
  { value: "fire", label: "Fire / Action" },
  { value: "jump", label: "Jump" },
  { value: "custom", label: "Custom FSM Event" },
];

const INPUT_CATEGORIES = {
  buttons: ["A", "B", "X", "Y", "LEFT_BUMPER", "RIGHT_BUMPER", "START", "SELECT", "HOME", "SHARE", "LEFT_STICK_CLICK", "RIGHT_STICK_CLICK"],
  dpad: ["DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT"],
  sticks: ["LEFT_STICK_X", "LEFT_STICK_Y", "RIGHT_STICK_X", "RIGHT_STICK_Y"],
  triggers: ["LEFT_TRIGGER", "RIGHT_TRIGGER"],
};

function getInputCategory(input: string): string {
  if (INPUT_CATEGORIES.buttons.includes(input)) return "Buttons";
  if (INPUT_CATEGORIES.dpad.includes(input)) return "D-Pad";
  if (INPUT_CATEGORIES.sticks.includes(input)) return "Sticks";
  if (INPUT_CATEGORIES.triggers.includes(input)) return "Triggers";
  return "Other";
}

function formatInputName(input: string): string {
  return input.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function ControllerMappingsPanel({
  presets,
  activePresetId,
  onPresetsChange,
  onActivePresetChange,
}: ControllerMappingsPanelProps) {
  const { toast } = useToast();
  const { hasGamepad, activeGamepad, input } = useGamepad();
  
  const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [showBindingDialog, setShowBindingDialog] = useState(false);
  const [editingMapping, setEditingMapping] = useState<{index: number; mapping: ControllerMappingEntry} | null>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Buttons", "Sticks"]));

  const activePreset = presets.find(p => p.id === activePresetId) || presets[0];

  const detectActiveInput = useCallback((input: GamepadInput): string | null => {
    if (input.a) return "A";
    if (input.b) return "B";
    if (input.x) return "X";
    if (input.y) return "Y";
    if (input.leftBumper) return "LEFT_BUMPER";
    if (input.rightBumper) return "RIGHT_BUMPER";
    if (input.start) return "START";
    if (input.select) return "SELECT";
    if (input.home) return "HOME";
    if (input.leftStickPress) return "LEFT_STICK_CLICK";
    if (input.rightStickPress) return "RIGHT_STICK_CLICK";
    if (input.dpadUp) return "DPAD_UP";
    if (input.dpadDown) return "DPAD_DOWN";
    if (input.dpadLeft) return "DPAD_LEFT";
    if (input.dpadRight) return "DPAD_RIGHT";
    if (Math.abs(input.leftStickX) > 0.5) return "LEFT_STICK_X";
    if (Math.abs(input.leftStickY) > 0.5) return "LEFT_STICK_Y";
    if (Math.abs(input.rightStickX) > 0.5) return "RIGHT_STICK_X";
    if (Math.abs(input.rightStickY) > 0.5) return "RIGHT_STICK_Y";
    if (input.leftTrigger > 0.5) return "LEFT_TRIGGER";
    if (input.rightTrigger > 0.5) return "RIGHT_TRIGGER";
    return null;
  }, []);

  const updatePreset = useCallback((updatedPreset: ControllerPreset) => {
    const newPresets = presets.map(p => 
      p.id === updatedPreset.id ? updatedPreset : p
    );
    onPresetsChange(newPresets);
  }, [presets, onPresetsChange]);

  const addPreset = useCallback(() => {
    if (!newPresetName.trim()) return;
    const newPreset = createDefaultControllerPreset();
    newPreset.name = newPresetName.trim();
    newPreset.isDefault = presets.length === 0;
    onPresetsChange([...presets, newPreset]);
    onActivePresetChange(newPreset.id);
    setNewPresetName("");
    setShowNewPresetDialog(false);
    toast({ title: "Preset Created", description: `Created "${newPreset.name}"` });
  }, [newPresetName, presets, onPresetsChange, onActivePresetChange, toast]);

  const deletePreset = useCallback((presetId: string) => {
    if (presets.length <= 1) {
      toast({ title: "Cannot Delete", description: "You must have at least one preset" });
      return;
    }
    const newPresets = presets.filter(p => p.id !== presetId);
    onPresetsChange(newPresets);
    if (activePresetId === presetId) {
      onActivePresetChange(newPresets[0].id);
    }
    toast({ title: "Preset Deleted" });
  }, [presets, activePresetId, onPresetsChange, onActivePresetChange, toast]);

  const addMapping = useCallback((inputName: string) => {
    if (!activePreset) return;
    const exists = activePreset.mappings.find(m => m.input === inputName);
    if (exists) {
      toast({ title: "Mapping Exists", description: `${inputName} is already mapped` });
      return;
    }
    const newMapping: ControllerMappingEntry = {
      input: inputName,
      action: "select",
      sensitivity: 1,
      deadzone: INPUT_CATEGORIES.sticks.includes(inputName) ? 0.1 : undefined,
    };
    updatePreset({
      ...activePreset,
      mappings: [...activePreset.mappings, newMapping],
    });
  }, [activePreset, updatePreset, toast]);

  const updateMapping = useCallback((index: number, updates: Partial<ControllerMappingEntry>) => {
    if (!activePreset) return;
    const newMappings = [...activePreset.mappings];
    newMappings[index] = { ...newMappings[index], ...updates };
    updatePreset({ ...activePreset, mappings: newMappings });
  }, [activePreset, updatePreset]);

  const removeMapping = useCallback((index: number) => {
    if (!activePreset) return;
    const newMappings = activePreset.mappings.filter((_, i) => i !== index);
    updatePreset({ ...activePreset, mappings: newMappings });
  }, [activePreset, updatePreset]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const mappingsByCategory = activePreset?.mappings.reduce((acc, mapping, index) => {
    const category = getInputCategory(mapping.input);
    if (!acc[category]) acc[category] = [];
    acc[category].push({ mapping, index });
    return acc;
  }, {} as Record<string, {mapping: ControllerMappingEntry; index: number}[]>) || {};

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white" data-testid="controller-mappings-panel">
      <div className="p-4 border-b border-zinc-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold">Controller Mappings</h3>
          </div>
          <div className={`flex items-center gap-2 text-xs ${hasGamepad ? 'text-green-400' : 'text-zinc-500'}`}>
            <div className={`w-2 h-2 rounded-full ${hasGamepad ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
            {hasGamepad ? (activeGamepad?.id?.split("(")[0] || "Connected") : "No Controller"}
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={activePresetId} onValueChange={onActivePresetChange}>
            <SelectTrigger className="flex-1 bg-zinc-800 border-zinc-700" data-testid="select-preset">
              <SelectValue placeholder="Select preset..." />
            </SelectTrigger>
            <SelectContent>
              {presets.map(preset => (
                <SelectItem key={preset.id} value={preset.id}>
                  <span className="flex items-center gap-2">
                    {preset.name}
                    {preset.isDefault && <Check className="w-3 h-3 text-green-400" />}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-700"
            onClick={() => setShowNewPresetDialog(true)}
            data-testid="button-add-preset"
          >
            <Plus className="w-4 h-4" />
          </Button>
          {activePreset && presets.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="border-zinc-700 text-red-400 hover:text-red-300"
              onClick={() => deletePreset(activePreset.id)}
              data-testid="button-delete-preset"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {activePreset && (
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>{activePreset.mappings.length} mappings</span>
            {activePreset.deviceProfile && (
              <span className="px-2 py-0.5 bg-zinc-800 rounded">{activePreset.deviceProfile}</span>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {activePreset && (
          <div className="space-y-3">
            {Object.entries(mappingsByCategory).map(([category, items]) => (
              <Collapsible
                key={category}
                open={expandedCategories.has(category)}
                onOpenChange={() => toggleCategory(category)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">
                  <span className="text-sm font-medium">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{items.length}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedCategories.has(category) ? 'rotate-180' : ''}`} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    {items.map(({ mapping, index }) => (
                      <MappingRow
                        key={`${mapping.input}-${index}`}
                        mapping={mapping}
                        index={index}
                        isActive={hasGamepad && detectActiveInput(input) === mapping.input}
                        onUpdate={(updates) => updateMapping(index, updates)}
                        onRemove={() => removeMapping(index)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}

            <div className="pt-4 border-t border-zinc-700">
              <Label className="text-xs text-zinc-400 mb-2 block">Add New Mapping</Label>
              <Select onValueChange={addMapping}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-add-mapping">
                  <SelectValue placeholder="Select input to map..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTROLLER_BUTTONS.map(btn => {
                    const mapped = activePreset.mappings.find(m => m.input === btn);
                    return (
                      <SelectItem key={btn} value={btn} disabled={!!mapped}>
                        <span className={mapped ? 'text-zinc-500' : ''}>
                          {formatInputName(btn)} {mapped ? '(mapped)' : ''}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {hasGamepad && (
              <div className="pt-4 border-t border-zinc-700">
                <Label className="text-xs text-zinc-400 mb-2 block">Live Input Preview</Label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className={`p-2 rounded text-center ${input.a ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800'}`}>A</div>
                  <div className={`p-2 rounded text-center ${input.b ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800'}`}>B</div>
                  <div className={`p-2 rounded text-center ${input.x ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800'}`}>X</div>
                  <div className={`p-2 rounded text-center ${input.y ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800'}`}>Y</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-zinc-800 rounded">
                    <div className="text-zinc-400 mb-1">L-Stick</div>
                    <div>X: {input.leftStickX.toFixed(2)}</div>
                    <div>Y: {input.leftStickY.toFixed(2)}</div>
                  </div>
                  <div className="p-2 bg-zinc-800 rounded">
                    <div className="text-zinc-400 mb-1">R-Stick</div>
                    <div>X: {input.rightStickX.toFixed(2)}</div>
                    <div>Y: {input.rightStickY.toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-zinc-800 rounded">
                    <div className="text-zinc-400 mb-1">L-Trigger</div>
                    <div className="h-2 bg-zinc-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 transition-all" 
                        style={{ width: `${input.leftTrigger * 100}%` }} 
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-zinc-800 rounded">
                    <div className="text-zinc-400 mb-1">R-Trigger</div>
                    <div className="h-2 bg-zinc-700 rounded overflow-hidden">
                      <div 
                        className="h-full bg-violet-500 transition-all" 
                        style={{ width: `${input.rightTrigger * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      <Dialog open={showNewPresetDialog} onOpenChange={setShowNewPresetDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Create Controller Preset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preset Name</Label>
              <Input
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., Racing Mode, Accessibility..."
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-preset-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPresetDialog(false)}>Cancel</Button>
            <Button onClick={addPreset} disabled={!newPresetName.trim()} data-testid="button-create-preset">
              Create Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MappingRowProps {
  mapping: ControllerMappingEntry;
  index: number;
  isActive: boolean;
  onUpdate: (updates: Partial<ControllerMappingEntry>) => void;
  onRemove: () => void;
}

function MappingRow({ mapping, index, isActive, onUpdate, onRemove }: MappingRowProps) {
  const [showSettings, setShowSettings] = useState(false);
  const isAnalog = INPUT_CATEGORIES.sticks.includes(mapping.input) || INPUT_CATEGORIES.triggers.includes(mapping.input);

  return (
    <motion.div
      className={`p-3 rounded-lg border transition-colors ${
        isActive 
          ? 'bg-violet-500/20 border-violet-500/50' 
          : 'bg-zinc-800/50 border-zinc-700/50'
      }`}
      animate={{ scale: isActive ? 1.02 : 1 }}
      transition={{ duration: 0.1 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-violet-400 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="text-sm font-medium">{formatInputName(mapping.input)}</span>
        </div>
        
        <div className="flex items-center gap-2 flex-1 max-w-[200px]">
          <Select
            value={mapping.action}
            onValueChange={(value) => onUpdate({ action: value })}
          >
            <SelectTrigger className="bg-zinc-700 border-zinc-600 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_ACTIONS.map(action => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          {isAnalog && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-400 hover:text-red-300"
            onClick={onRemove}
            data-testid={`button-remove-mapping-${index}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && isAnalog && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-zinc-700 space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Sensitivity</span>
                  <span>{(mapping.sensitivity || 1).toFixed(1)}x</span>
                </div>
                <Slider
                  value={[mapping.sensitivity || 1]}
                  min={0.1}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => onUpdate({ sensitivity: value })}
                />
              </div>

              {INPUT_CATEGORIES.sticks.includes(mapping.input) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Deadzone</span>
                    <span>{((mapping.deadzone || 0.1) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[(mapping.deadzone || 0.1) * 100]}
                    min={0}
                    max={50}
                    step={5}
                    onValueChange={([value]) => onUpdate({ deadzone: value / 100 })}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Invert Axis</span>
                <Switch
                  checked={mapping.inverted || false}
                  onCheckedChange={(checked) => onUpdate({ inverted: checked })}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
