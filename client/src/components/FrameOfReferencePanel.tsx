import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Box, 
  Circle, 
  AlignCenter, 
  AlignLeft, 
  AlignRight,
  Layers,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Move,
  ArrowUpDown,
} from "lucide-react";
import type { 
  FrameOfReference, 
  FrameShape, 
  FrameVisibility,
  AlignmentAxis,
  AlignmentEdge 
} from "@/lib/frame-of-reference";

interface FrameOfReferencePanelProps {
  frames: FrameOfReference[];
  activeFrameId: string | null;
  onCreateFrame: () => void;
  onDeleteFrame: (id: string) => void;
  onSelectFrame: (id: string | null) => void;
  onUpdateFrame: (id: string, updates: Partial<FrameOfReference>) => void;
  onAlignToFrame: (frameId: string, axis: AlignmentAxis, edge: AlignmentEdge) => void;
  onDistributeInFrame: (frameId: string, axis: AlignmentAxis) => void;
  onCenterToFrame: (frameId: string) => void;
  onStackInFrame: (frameId: string, axis: AlignmentAxis) => void;
}

export function FrameOfReferencePanel({
  frames,
  activeFrameId,
  onCreateFrame,
  onDeleteFrame,
  onSelectFrame,
  onUpdateFrame,
  onAlignToFrame,
  onDistributeInFrame,
  onCenterToFrame,
  onStackInFrame,
}: FrameOfReferencePanelProps) {
  const activeFrame = frames.find(f => f.id === activeFrameId);
  const [selectedAxis, setSelectedAxis] = useState<AlignmentAxis>("y");

  return (
    <div className="p-3 space-y-4" data-testid="frame-of-reference-panel">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Reference Frames</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onCreateFrame}
          className="h-7 text-xs"
          data-testid="button-create-frame"
        >
          <Plus className="w-3 h-3 mr-1" />
          New
        </Button>
      </div>

      {frames.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <Box className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No reference frames</p>
          <p className="text-[10px] opacity-60">Create a frame to align objects</p>
        </div>
      ) : (
        <div className="space-y-2">
          {frames.map(frame => (
            <div
              key={frame.id}
              className={`p-2 rounded border cursor-pointer transition-colors ${
                activeFrameId === frame.id
                  ? "border-cyan-500/50 bg-cyan-500/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
              onClick={() => onSelectFrame(frame.id)}
              data-testid={`frame-item-${frame.id}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {frame.shape === "sphere" ? (
                    <Circle className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Box className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="text-xs text-white">{frame.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextVis: FrameVisibility = 
                        frame.visibility === "solid" ? "dotted" :
                        frame.visibility === "dotted" ? "hidden" : "solid";
                      onUpdateFrame(frame.id, { visibility: nextVis });
                    }}
                    data-testid={`toggle-visibility-${frame.id}`}
                  >
                    {frame.visibility === "hidden" ? (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFrame(frame.id);
                    }}
                    data-testid={`delete-frame-${frame.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeFrame && (
        <div className="space-y-4 pt-3 border-t border-white/10">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-muted-foreground">Shape</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={activeFrame.shape === "cube" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdateFrame(activeFrame.id, { shape: "cube" })}
                data-testid="shape-cube"
              >
                <Box className="w-4 h-4 mr-1" />
                Cube
              </Button>
              <Button
                size="sm"
                variant={activeFrame.shape === "sphere" ? "default" : "outline"}
                className="flex-1 h-8"
                onClick={() => onUpdateFrame(activeFrame.id, { shape: "sphere" })}
                data-testid="shape-sphere"
              >
                <Circle className="w-4 h-4 mr-1" />
                Sphere
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-muted-foreground">Size</Label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[9px] text-muted-foreground">Width</Label>
                <Input
                  type="number"
                  value={activeFrame.dimensions.width}
                  onChange={(e) => onUpdateFrame(activeFrame.id, {
                    dimensions: { ...activeFrame.dimensions, width: parseFloat(e.target.value) || 1 }
                  })}
                  className="h-7 text-xs"
                  data-testid="input-frame-width"
                />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Height</Label>
                <Input
                  type="number"
                  value={activeFrame.dimensions.height}
                  onChange={(e) => onUpdateFrame(activeFrame.id, {
                    dimensions: { ...activeFrame.dimensions, height: parseFloat(e.target.value) || 1 }
                  })}
                  className="h-7 text-xs"
                  data-testid="input-frame-height"
                />
              </div>
              <div>
                <Label className="text-[9px] text-muted-foreground">Depth</Label>
                <Input
                  type="number"
                  value={activeFrame.dimensions.depth}
                  onChange={(e) => onUpdateFrame(activeFrame.id, {
                    dimensions: { ...activeFrame.dimensions, depth: parseFloat(e.target.value) || 1 }
                  })}
                  className="h-7 text-xs"
                  data-testid="input-frame-depth"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase text-muted-foreground">Visibility</Label>
            <RadioGroup
              value={activeFrame.visibility}
              onValueChange={(v) => onUpdateFrame(activeFrame.id, { visibility: v as FrameVisibility })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="solid" id="solid" />
                <Label htmlFor="solid" className="text-xs">Solid</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="dotted" id="dotted" />
                <Label htmlFor="dotted" className="text-xs">Dotted</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="hidden" id="hidden" />
                <Label htmlFor="hidden" className="text-xs">Hidden</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/10">
            <Label className="text-[10px] uppercase text-muted-foreground">Align Objects to Frame</Label>
            
            <div className="flex gap-1 mb-2">
              {(["x", "y", "z"] as AlignmentAxis[]).map(axis => (
                <Button
                  key={axis}
                  size="sm"
                  variant={selectedAxis === axis ? "default" : "outline"}
                  className="flex-1 h-7 text-xs uppercase"
                  onClick={() => setSelectedAxis(axis)}
                  data-testid={`axis-${axis}`}
                >
                  {axis}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[10px]"
                onClick={() => onAlignToFrame(activeFrame.id, selectedAxis, "min")}
                data-testid="align-min"
              >
                <AlignLeft className="w-3 h-3 mr-1" />
                Min
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[10px]"
                onClick={() => onAlignToFrame(activeFrame.id, selectedAxis, "center")}
                data-testid="align-center"
              >
                <AlignCenter className="w-3 h-3 mr-1" />
                Center
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[10px]"
                onClick={() => onAlignToFrame(activeFrame.id, selectedAxis, "max")}
                data-testid="align-max"
              >
                <AlignRight className="w-3 h-3 mr-1" />
                Max
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-1 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[10px]"
                onClick={() => onDistributeInFrame(activeFrame.id, selectedAxis)}
                data-testid="distribute"
              >
                <Move className="w-3 h-3 mr-1" />
                Distribute
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-[10px]"
                onClick={() => onStackInFrame(activeFrame.id, selectedAxis)}
                data-testid="stack"
              >
                <Layers className="w-3 h-3 mr-1" />
                Stack
              </Button>
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="w-full h-8 mt-2"
              onClick={() => onCenterToFrame(activeFrame.id)}
              data-testid="center-all"
            >
              <AlignCenter className="w-3 h-3 mr-1" />
              Center All to Frame
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
