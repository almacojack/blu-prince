import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Move, RotateCw, Maximize2, RotateCcw, Copy, Trash2, 
  Image, Layers, Box, ChevronDown, ChevronRight, Lock, Unlock,
  Crosshair, Grid3X3, Magnet
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { TossItem, Transform, Bounds, MaterialProps, PhysicsProps } from "@/lib/toss-v1.1";

interface Vector3Value {
  x: number;
  y: number;
  z: number;
}

interface PropertyPanelProps {
  selectedItem: TossItem | null;
  onUpdateItem: (id: string, updates: Partial<TossItem>) => void;
  onDeleteItem?: (id: string) => void;
  onDuplicateItem?: (id: string) => void;
  onApplyAsSticker?: (itemId: string) => void;
  stickerModeActive?: boolean;
}

function Vector3Input({ 
  label, 
  value, 
  onChange, 
  step = 0.1,
  icon: Icon,
  locked = false,
  onToggleLock
}: { 
  label: string;
  value: Vector3Value;
  onChange: (v: Vector3Value) => void;
  step?: number;
  icon?: React.ComponentType<{ className?: string }>;
  locked?: boolean;
  onToggleLock?: () => void;
}) {
  const [linkAxes, setLinkAxes] = useState(false);

  const handleChange = (axis: 'x' | 'y' | 'z', val: number) => {
    if (linkAxes) {
      const ratio = val / (value[axis] || 1);
      onChange({
        x: axis === 'x' ? val : value.x * ratio,
        y: axis === 'y' ? val : value.y * ratio,
        z: axis === 'z' ? val : value.z * ratio,
      });
    } else {
      onChange({ ...value, [axis]: val });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-purple-400" />}
          <Label className="text-xs font-medium text-gray-300">{label}</Label>
        </div>
        <div className="flex items-center gap-1">
          {label === "Scale" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLinkAxes(!linkAxes)}
              className={`h-5 w-5 p-0 ${linkAxes ? 'text-cyan-400' : 'text-gray-500'}`}
              title={linkAxes ? "Unlink axes" : "Link axes for uniform scaling"}
              data-testid="button-link-axes"
            >
              {linkAxes ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as const).map((axis) => (
          <div key={axis} className="space-y-1">
            <Label className={`text-[10px] uppercase font-mono ${
              axis === 'x' ? 'text-red-400' : axis === 'y' ? 'text-green-400' : 'text-blue-400'
            }`}>
              {axis}
            </Label>
            <Input
              type="number"
              step={step}
              value={value[axis]}
              onChange={(e) => handleChange(axis, parseFloat(e.target.value) || 0)}
              className="h-7 text-xs bg-black/50 border-gray-700 font-mono"
              data-testid={`input-${label.toLowerCase()}-${axis}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TransformSection({ 
  transform, 
  onChange 
}: { 
  transform: Transform;
  onChange: (t: Transform) => void;
}) {
  const [expandedSections, setExpandedSections] = useState({
    position: true,
    rotation: true,
    scale: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const resetTransform = () => {
    onChange({
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Move className="w-4 h-4 text-purple-400" />
          Transform
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={resetTransform}
          className="h-6 px-2 text-[10px] text-gray-400 hover:text-white"
          data-testid="button-reset-transform"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      <Vector3Input
        label="Position"
        value={transform.position}
        onChange={(position) => onChange({ ...transform, position })}
        step={0.1}
        icon={Move}
      />

      <Vector3Input
        label="Rotation"
        value={transform.rotation}
        onChange={(rotation) => onChange({ ...transform, rotation })}
        step={5}
        icon={RotateCw}
      />

      <Vector3Input
        label="Scale"
        value={transform.scale}
        onChange={(scale) => onChange({ ...transform, scale })}
        step={0.1}
        icon={Maximize2}
      />
    </div>
  );
}

function MaterialSection({
  material,
  onChange,
}: {
  material?: MaterialProps;
  onChange: (m: MaterialProps) => void;
}) {
  const mat = material || { color: "#7c3aed", metalness: 0, roughness: 0.5 };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Layers className="w-4 h-4 text-purple-400" />
        Material
      </h3>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-300 w-16">Color</Label>
          <input
            type="color"
            value={mat.color || "#7c3aed"}
            onChange={(e) => onChange({ ...mat, color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            data-testid="input-material-color"
          />
          <Input
            value={mat.color || "#7c3aed"}
            onChange={(e) => onChange({ ...mat, color: e.target.value })}
            className="flex-1 h-7 text-xs bg-black/50 border-gray-700 font-mono uppercase"
            data-testid="input-material-color-hex"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-300">Metalness</Label>
            <span className="text-[10px] font-mono text-gray-500">{(mat.metalness || 0).toFixed(2)}</span>
          </div>
          <Slider
            value={[mat.metalness || 0]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => onChange({ ...mat, metalness: v })}
            className="py-1"
            data-testid="slider-metalness"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-gray-300">Roughness</Label>
            <span className="text-[10px] font-mono text-gray-500">{(mat.roughness || 0.5).toFixed(2)}</span>
          </div>
          <Slider
            value={[mat.roughness || 0.5]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => onChange({ ...mat, roughness: v })}
            className="py-1"
            data-testid="slider-roughness"
          />
        </div>
      </div>
    </div>
  );
}

function PhysicsSection({
  physics,
  onChange,
}: {
  physics?: PhysicsProps;
  onChange: (p: PhysicsProps) => void;
}) {
  const phys = physics || { mass: 1, restitution: 0.3, friction: 0.5, anchored: false, gravityScale: 1 };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Box className="w-4 h-4 text-purple-400" />
        Physics
      </h3>

      <div className="flex items-center justify-between">
        <Label className="text-xs text-gray-300">Anchored (Static)</Label>
        <Switch
          checked={phys.anchored || false}
          onCheckedChange={(anchored) => onChange({ ...phys, anchored })}
          data-testid="switch-anchored"
        />
      </div>

      {!phys.anchored && (
        <>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-300">Mass (kg)</Label>
              <span className="text-[10px] font-mono text-gray-500">{phys.mass}</span>
            </div>
            <Slider
              value={[phys.mass || 1]}
              min={0.1}
              max={100}
              step={0.1}
              onValueChange={([v]) => onChange({ ...phys, mass: v })}
              className="py-1"
              data-testid="slider-mass"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-300">Bounciness</Label>
              <span className="text-[10px] font-mono text-gray-500">{(phys.restitution || 0).toFixed(2)}</span>
            </div>
            <Slider
              value={[phys.restitution || 0]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onChange({ ...phys, restitution: v })}
              className="py-1"
              data-testid="slider-restitution"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-300">Friction</Label>
              <span className="text-[10px] font-mono text-gray-500">{(phys.friction || 0).toFixed(2)}</span>
            </div>
            <Slider
              value={[phys.friction || 0]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={([v]) => onChange({ ...phys, friction: v })}
              className="py-1"
              data-testid="slider-friction"
            />
          </div>
        </>
      )}
    </div>
  );
}

export function PropertyPanel({
  selectedItem,
  onUpdateItem,
  onDeleteItem,
  onDuplicateItem,
  onApplyAsSticker,
  stickerModeActive = false,
}: PropertyPanelProps) {
  if (!selectedItem) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <Crosshair className="w-12 h-12 text-gray-600 mb-3" />
        <p className="text-sm text-gray-400">Select an item in the scene tree</p>
        <p className="text-xs text-gray-500 mt-1">Properties will appear here</p>
      </div>
    );
  }

  const handleTransformChange = (transform: Transform) => {
    onUpdateItem(selectedItem.id, { transform });
  };

  const handleMaterialChange = (material: MaterialProps) => {
    onUpdateItem(selectedItem.id, { material });
  };

  const handlePhysicsChange = (physics: PhysicsProps) => {
    onUpdateItem(selectedItem.id, { physics });
  };

  const isImageAsset = selectedItem.component === 'image' || 
                       selectedItem.component === 'svg' ||
                       selectedItem.props?.assetType === 'image';

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white truncate max-w-[150px]">
              {selectedItem.label || selectedItem.id}
            </h2>
            <Badge variant="outline" className="text-[9px] mt-1 bg-purple-900/20 text-purple-400 border-purple-500/30">
              {selectedItem.component}
            </Badge>
          </div>
          <div className="flex gap-1">
            {onDuplicateItem && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicateItem(selectedItem.id)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                title="Duplicate"
                data-testid="button-duplicate-item"
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
            {onDeleteItem && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteItem(selectedItem.id)}
                className="h-7 w-7 p-0 text-gray-400 hover:text-red-400"
                title="Delete"
                data-testid="button-delete-item"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <Separator className="bg-purple-900/30" />

        {isImageAsset && onApplyAsSticker && (
          <div className="p-3 rounded-lg border border-dashed border-cyan-500/30 bg-cyan-900/10">
            <div className="flex items-center gap-2 mb-2">
              <Image className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">2D Asset</span>
            </div>
            <p className="text-[10px] text-gray-400 mb-2">
              Apply this image to a face of another object like a sticker
            </p>
            <Button
              variant={stickerModeActive ? "default" : "outline"}
              size="sm"
              onClick={() => onApplyAsSticker(selectedItem.id)}
              className={`w-full text-xs ${stickerModeActive ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-500/30 text-cyan-400'}`}
              data-testid="button-apply-as-sticker"
            >
              <Magnet className="w-3 h-3 mr-1.5" />
              {stickerModeActive ? 'Click a face to apply...' : 'Apply as Sticker'}
            </Button>
          </div>
        )}

        <TransformSection
          transform={selectedItem.transform}
          onChange={handleTransformChange}
        />

        <Separator className="bg-purple-900/30" />

        <MaterialSection
          material={selectedItem.material}
          onChange={handleMaterialChange}
        />

        <Separator className="bg-purple-900/30" />

        <PhysicsSection
          physics={selectedItem.physics}
          onChange={handlePhysicsChange}
        />

        <Separator className="bg-purple-900/30" />

        <div className="pt-2 space-y-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-purple-400" />
            Snap & Align
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-gray-700 text-gray-300"
              data-testid="button-snap-to-grid"
            >
              Snap to Grid
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-gray-700 text-gray-300"
              data-testid="button-center-origin"
            >
              Center at Origin
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-gray-700 text-gray-300"
              data-testid="button-drop-to-ground"
            >
              Drop to Ground
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-gray-700 text-gray-300"
              data-testid="button-align-to-view"
            >
              Align to View
            </Button>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
