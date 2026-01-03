import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  Snowflake, 
  Droplets, 
  Wind,
  Magnet,
  Zap,
  Plus, 
  Trash2, 
  Settings,
  Power,
  Eye,
  EyeOff,
  ChevronDown,
  Box
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
  ForceEmitter, 
  ForceType,
  DEFAULT_TRANSFORM,
} from "@/lib/toss-v1";
import { useToast } from "@/hooks/use-toast";

interface ForceEmittersPanelProps {
  emitters: ForceEmitter[];
  onEmittersChange: (emitters: ForceEmitter[]) => void;
  selectedEmitterId?: string;
  onSelectEmitter?: (id: string | null) => void;
  showAllHitboxes?: boolean;
  onShowAllHitboxesChange?: (show: boolean) => void;
}

const FORCE_TYPE_CONFIG: Record<ForceType, { icon: typeof Flame; color: string; label: string; bgClass: string }> = {
  fire: { icon: Flame, color: "#ef4444", label: "Fire", bgClass: "bg-red-500/20" },
  ice: { icon: Snowflake, color: "#3b82f6", label: "Ice", bgClass: "bg-blue-500/20" },
  water: { icon: Droplets, color: "#06b6d4", label: "Water", bgClass: "bg-cyan-500/20" },
  wind: { icon: Wind, color: "#22c55e", label: "Wind", bgClass: "bg-green-500/20" },
  magnet: { icon: Magnet, color: "#a855f7", label: "Magnet", bgClass: "bg-purple-500/20" },
  gravity: { icon: Box, color: "#f97316", label: "Gravity", bgClass: "bg-orange-500/20" },
  electric: { icon: Zap, color: "#eab308", label: "Electric", bgClass: "bg-yellow-500/20" },
};

function createDefaultEmitter(type: ForceType): ForceEmitter {
  return {
    id: `force_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    enabled: true,
    transform: { ...DEFAULT_TRANSFORM },
    hitbox: { type: "sphere", radius: 2 },
    magnitude: 50,
    falloff: "linear",
    radius: 5,
    visualStyle: "particles",
    color: FORCE_TYPE_CONFIG[type].color,
    showHitbox: true,
    pulsing: false,
    pulseFrequency: 1,
  };
}

export function ForceEmittersPanel({
  emitters,
  onEmittersChange,
  selectedEmitterId,
  onSelectEmitter,
  showAllHitboxes = true,
  onShowAllHitboxesChange,
}: ForceEmittersPanelProps) {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [expandedEmitters, setExpandedEmitters] = useState<Set<string>>(new Set());
  
  const handleToggleAllHitboxes = () => {
    const newValue = !showAllHitboxes;
    onShowAllHitboxesChange?.(newValue);
    emitters.forEach(e => updateEmitter(e.id, { showHitbox: newValue }));
  };

  const addEmitter = useCallback((type: ForceType) => {
    const newEmitter = createDefaultEmitter(type);
    onEmittersChange([...emitters, newEmitter]);
    setExpandedEmitters(prev => new Set([...Array.from(prev), newEmitter.id]));
    setShowAddDialog(false);
    toast({ 
      title: "Force Emitter Added", 
      description: `${FORCE_TYPE_CONFIG[type].label} force field created` 
    });
  }, [emitters, onEmittersChange, toast]);

  const updateEmitter = useCallback((id: string, updates: Partial<ForceEmitter>) => {
    onEmittersChange(emitters.map(e => 
      e.id === id ? { ...e, ...updates } : e
    ));
  }, [emitters, onEmittersChange]);

  const deleteEmitter = useCallback((id: string) => {
    onEmittersChange(emitters.filter(e => e.id !== id));
    if (selectedEmitterId === id) {
      onSelectEmitter?.(null);
    }
    toast({ title: "Force Emitter Deleted" });
  }, [emitters, onEmittersChange, selectedEmitterId, onSelectEmitter, toast]);

  const toggleExpanded = (id: string) => {
    setExpandedEmitters(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full" data-testid="force-emitters-panel">
      <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold">Environmental Forces</h3>
          <span className="text-xs text-zinc-500">({emitters.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 touch-manipulation"
            onClick={handleToggleAllHitboxes}
            title={showAllHitboxes ? "Hide All Hitboxes" : "Show All Hitboxes"}
            data-testid="button-toggle-hitboxes"
          >
            {showAllHitboxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9 bg-primary/20 text-primary touch-manipulation"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-emitter"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {emitters.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No force emitters</p>
              <p className="text-xs mt-1">Add fire, ice, water, or wind forces</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {emitters.map((emitter) => {
                const config = FORCE_TYPE_CONFIG[emitter.type];
                const Icon = config.icon;
                const isExpanded = expandedEmitters.has(emitter.id);
                const isSelected = selectedEmitterId === emitter.id;
                
                return (
                  <motion.div
                    key={emitter.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(emitter.id)}>
                      <div 
                        className={`rounded-lg border transition-colors ${
                          isSelected 
                            ? "border-primary bg-primary/10" 
                            : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
                        }`}
                      >
                        <CollapsibleTrigger asChild>
                          <button 
                            className="w-full p-3 flex items-center gap-3 touch-manipulation"
                            onClick={() => onSelectEmitter?.(emitter.id)}
                            data-testid={`emitter-row-${emitter.id}`}
                          >
                            <div 
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgClass}`}
                              style={{ borderColor: config.color, borderWidth: 1 }}
                            >
                              <Icon className="w-4 h-4" style={{ color: config.color }} />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{config.label}</span>
                                {!emitter.enabled && (
                                  <span className="text-[10px] text-zinc-500 uppercase">Disabled</span>
                                )}
                              </div>
                              <span className="text-xs text-zinc-500">
                                Magnitude: {emitter.magnitude}% • Radius: {emitter.radius}m
                              </span>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-4 border-t border-zinc-700/50 pt-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-zinc-400">Enabled</Label>
                              <Switch
                                checked={emitter.enabled}
                                onCheckedChange={(enabled) => updateEmitter(emitter.id, { enabled })}
                                data-testid={`switch-enabled-${emitter.id}`}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-400">Magnitude</span>
                                <span>{emitter.magnitude}%</span>
                              </div>
                              <Slider
                                value={[emitter.magnitude]}
                                min={0}
                                max={100}
                                step={5}
                                onValueChange={([magnitude]) => updateEmitter(emitter.id, { magnitude })}
                                className="touch-manipulation"
                                data-testid={`slider-magnitude-${emitter.id}`}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-zinc-400">Effect Radius</span>
                                <span>{emitter.radius}m</span>
                              </div>
                              <Slider
                                value={[emitter.radius || 5]}
                                min={0.5}
                                max={20}
                                step={0.5}
                                onValueChange={([radius]) => updateEmitter(emitter.id, { radius })}
                                className="touch-manipulation"
                                data-testid={`slider-radius-${emitter.id}`}
                              />
                            </div>
                            
                            <div className="p-2 bg-zinc-800/50 rounded-lg space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-zinc-400 flex items-center gap-1">
                                  <Box className="w-3 h-3" />
                                  Hitbox
                                </Label>
                                <Switch
                                  checked={emitter.showHitbox !== false}
                                  onCheckedChange={(showHitbox) => updateEmitter(emitter.id, { showHitbox })}
                                  data-testid={`switch-show-hitbox-${emitter.id}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-zinc-400">Shape</Label>
                                <Select
                                  value={emitter.hitbox.type}
                                  onValueChange={(type) => updateEmitter(emitter.id, { 
                                    hitbox: { ...emitter.hitbox, type: type as any } 
                                  })}
                                >
                                  <SelectTrigger className="h-9" data-testid={`select-hitbox-type-${emitter.id}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sphere">Sphere</SelectItem>
                                    <SelectItem value="box">Box</SelectItem>
                                    <SelectItem value="cylinder">Cylinder</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              {emitter.hitbox.type === "sphere" && (
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs">
                                    <span className="text-zinc-400">Hitbox Radius</span>
                                    <span>{emitter.hitbox.radius || 2}m</span>
                                  </div>
                                  <Slider
                                    value={[emitter.hitbox.radius || 2]}
                                    min={0.5}
                                    max={10}
                                    step={0.5}
                                    onValueChange={([radius]) => updateEmitter(emitter.id, { 
                                      hitbox: { ...emitter.hitbox, radius } 
                                    })}
                                    className="touch-manipulation"
                                  />
                                </div>
                              )}
                              {emitter.hitbox.type === "box" && (
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <Label className="text-[10px] text-zinc-500">W</Label>
                                    <Input
                                      type="number"
                                      value={emitter.hitbox.width || 2}
                                      onChange={(e) => updateEmitter(emitter.id, {
                                        hitbox: { ...emitter.hitbox, width: parseFloat(e.target.value) || 2 }
                                      })}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] text-zinc-500">H</Label>
                                    <Input
                                      type="number"
                                      value={emitter.hitbox.height || 2}
                                      onChange={(e) => updateEmitter(emitter.id, {
                                        hitbox: { ...emitter.hitbox, height: parseFloat(e.target.value) || 2 }
                                      })}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] text-zinc-500">D</Label>
                                    <Input
                                      type="number"
                                      value={emitter.hitbox.depth || 2}
                                      onChange={(e) => updateEmitter(emitter.id, {
                                        hitbox: { ...emitter.hitbox, depth: parseFloat(e.target.value) || 2 }
                                      })}
                                      className="h-8 text-xs"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs text-zinc-400">Falloff</Label>
                              <Select
                                value={emitter.falloff || "linear"}
                                onValueChange={(falloff) => updateEmitter(emitter.id, { falloff: falloff as ForceEmitter["falloff"] })}
                              >
                                <SelectTrigger className="h-9" data-testid={`select-falloff-${emitter.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None (Constant)</SelectItem>
                                  <SelectItem value="linear">Linear</SelectItem>
                                  <SelectItem value="quadratic">Quadratic</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs text-zinc-400">Visual Style</Label>
                              <Select
                                value={emitter.visualStyle || "particles"}
                                onValueChange={(visualStyle) => updateEmitter(emitter.id, { visualStyle: visualStyle as ForceEmitter["visualStyle"] })}
                              >
                                <SelectTrigger className="h-9" data-testid={`select-visual-${emitter.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="particles">Particles</SelectItem>
                                  <SelectItem value="glow">Glow</SelectItem>
                                  <SelectItem value="distortion">Distortion</SelectItem>
                                  <SelectItem value="none">None</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label className="text-xs text-zinc-400">Pulsing Effect</Label>
                              <Switch
                                checked={emitter.pulsing || false}
                                onCheckedChange={(pulsing) => updateEmitter(emitter.id, { pulsing })}
                                data-testid={`switch-pulsing-${emitter.id}`}
                              />
                            </div>
                            
                            {emitter.pulsing && (
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-zinc-400">Pulse Frequency</span>
                                  <span>{emitter.pulseFrequency || 1} Hz</span>
                                </div>
                                <Slider
                                  value={[emitter.pulseFrequency || 1]}
                                  min={0.1}
                                  max={5}
                                  step={0.1}
                                  onValueChange={([pulseFrequency]) => updateEmitter(emitter.id, { pulseFrequency })}
                                  className="touch-manipulation"
                                />
                              </div>
                            )}
                            
                            <div className="pt-2 border-t border-zinc-700/50">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 h-9 touch-manipulation"
                                onClick={() => deleteEmitter(emitter.id)}
                                data-testid={`button-delete-${emitter.id}`}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Emitter
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Add Force Emitter</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {(Object.entries(FORCE_TYPE_CONFIG) as [ForceType, typeof FORCE_TYPE_CONFIG[ForceType]][]).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  variant="outline"
                  className={`h-20 flex flex-col items-center justify-center gap-2 ${config.bgClass} border-zinc-700 hover:border-zinc-500 touch-manipulation`}
                  onClick={() => addEmitter(type)}
                  data-testid={`button-add-${type}`}
                >
                  <Icon className="w-6 h-6" style={{ color: config.color }} />
                  <span className="text-xs">{config.label}</span>
                </Button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAddDialog(false)} className="touch-manipulation">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ForceEmittersPanel;
