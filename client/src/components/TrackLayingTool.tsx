import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, 
  Eraser, 
  Check, 
  X, 
  RotateCcw,
  Circle,
  Square
} from 'lucide-react';
import { 
  TrackBuilder, 
  TrackSegment,
  serializeTrackSegment,
  deserializeTrackSegment 
} from '@/lib/spline-track';
import { usePerformance } from '@/lib/performance-context';

const SURFACE_OPTIONS: { value: TrackSegment['surfaceType']; label: string; color: string }[] = [
  { value: 'asphalt', label: 'Asphalt', color: '#333333' },
  { value: 'grass', label: 'Grass', color: '#4a7c23' },
  { value: 'dirt', label: 'Dirt', color: '#8b6914' },
  { value: 'sand', label: 'Sand', color: '#e8d4a8' },
  { value: 'cobblestone', label: 'Stone', color: '#666666' },
  { value: 'water', label: 'Water', color: '#2196f3' },
];

interface TrackLayingToolProps {
  enabled: boolean;
  onComplete: (segment: TrackSegment) => void;
  onCancel: () => void;
  existingSegment?: TrackSegment;
}

export function TrackLayingTool({ enabled, onComplete, onCancel, existingSegment }: TrackLayingToolProps) {
  const { state } = usePerformance();
  const { camera, gl, scene } = useThree();
  const [isDrawing, setIsDrawing] = useState(false);
  const [surfaceType, setSurfaceType] = useState<TrackSegment['surfaceType']>('asphalt');
  const [trackWidth, setTrackWidth] = useState(4);
  const [isClosed, setIsClosed] = useState(false);
  
  const builderRef = useRef<TrackBuilder | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    if (enabled) {
      const quality = state.quality;
      builderRef.current = new TrackBuilder(
        `track_${Date.now()}`,
        surfaceType,
        quality
      );
      
      if (existingSegment) {
        existingSegment.controlPoints.forEach(cp => {
          builderRef.current?.addPoint(
            cp.position.x,
            cp.position.y,
            cp.position.z,
            cp.width,
            cp.banking
          );
        });
        builderRef.current?.setClosed(existingSegment.closed);
      }
    }
    
    return () => {
      if (builderRef.current) {
        builderRef.current.dispose();
        builderRef.current = null;
      }
      if (meshRef.current) {
        scene.remove(meshRef.current);
        meshRef.current = null;
      }
    };
  }, [enabled, existingSegment, scene, state.quality, surfaceType]);

  useEffect(() => {
    if (builderRef.current) {
      builderRef.current.setSurfaceType(surfaceType);
    }
  }, [surfaceType]);

  useEffect(() => {
    if (builderRef.current) {
      builderRef.current.setQuality(state.quality);
    }
  }, [state.quality]);

  const getGroundPoint = useCallback((event: PointerEvent): THREE.Vector3 | null => {
    const rect = gl.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    
    raycasterRef.current.setFromCamera(mouse, camera);
    const target = new THREE.Vector3();
    const hit = raycasterRef.current.ray.intersectPlane(planeRef.current, target);
    
    return hit ? target : null;
  }, [camera, gl]);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (!enabled || !builderRef.current) return;
    
    const point = getGroundPoint(event);
    if (point) {
      builderRef.current.addPoint(point.x, point.y, point.z, trackWidth);
      setIsDrawing(true);
      
      const mesh = builderRef.current.getMesh();
      if (mesh && !meshRef.current) {
        meshRef.current = mesh;
        scene.add(mesh);
      }
    }
  }, [enabled, getGroundPoint, trackWidth, scene]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (!enabled || !isDrawing || !builderRef.current) return;
    
    const point = getGroundPoint(event);
    if (point) {
      const segment = builderRef.current.getSegment();
      const lastPoint = segment.controlPoints[segment.controlPoints.length - 1];
      
      if (lastPoint && point.distanceTo(lastPoint.position) > 2) {
        builderRef.current.addPoint(point.x, point.y, point.z, trackWidth);
      }
    }
  }, [enabled, isDrawing, getGroundPoint, trackWidth]);

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    
    const canvas = gl.domElement;
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
    };
  }, [enabled, gl, handlePointerDown, handlePointerMove, handlePointerUp]);

  const handleUndo = () => {
    if (builderRef.current) {
      builderRef.current.removeLastPoint();
    }
  };

  const handleToggleClosed = () => {
    if (builderRef.current) {
      const newClosed = !isClosed;
      setIsClosed(newClosed);
      builderRef.current.setClosed(newClosed);
    }
  };

  const handleConfirm = () => {
    if (builderRef.current) {
      const segment = builderRef.current.getSegment();
      if (segment.controlPoints.length >= 2) {
        onComplete(segment);
      }
    }
  };

  if (!enabled) return null;

  return null;
}

interface TrackToolPanelProps {
  enabled: boolean;
  onToggle: () => void;
  surfaceType: TrackSegment['surfaceType'];
  onSurfaceChange: (type: TrackSegment['surfaceType']) => void;
  trackWidth: number;
  onWidthChange: (width: number) => void;
  isClosed: boolean;
  onToggleClosed: () => void;
  onUndo: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  pointCount: number;
}

export function TrackToolPanel({
  enabled,
  onToggle,
  surfaceType,
  onSurfaceChange,
  trackWidth,
  onWidthChange,
  isClosed,
  onToggleClosed,
  onUndo,
  onConfirm,
  onCancel,
  pointCount,
}: TrackToolPanelProps) {
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-bold flex items-center gap-2">
          <Pencil className="w-4 h-4" />
          Track Tool
        </Label>
        <Button
          size="sm"
          variant={enabled ? "default" : "outline"}
          onClick={onToggle}
          className={enabled ? "bg-green-500 hover:bg-green-600" : ""}
          data-testid="button-toggle-track-tool"
        >
          {enabled ? "Drawing..." : "Draw Track"}
        </Button>
      </div>

      {enabled && (
        <>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Surface Type</Label>
            <div className="grid grid-cols-3 gap-1">
              {SURFACE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onSurfaceChange(opt.value)}
                  className={`p-2 rounded text-[9px] font-mono uppercase border transition-all ${
                    surfaceType === opt.value 
                      ? 'border-white bg-white/10' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  data-testid={`button-surface-${opt.value}`}
                >
                  <div 
                    className="w-full h-3 rounded mb-1" 
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-muted-foreground">Width</Label>
              <Badge variant="outline" className="text-[9px] font-mono">{trackWidth}m</Badge>
            </div>
            <Slider
              value={[trackWidth]}
              onValueChange={([v]) => onWidthChange(v)}
              min={1}
              max={20}
              step={0.5}
              data-testid="slider-track-width"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Close Loop</Label>
            <Button
              size="sm"
              variant={isClosed ? "default" : "outline"}
              onClick={onToggleClosed}
              className="h-6 px-2"
              data-testid="button-toggle-closed"
            >
              {isClosed ? <Circle className="w-3 h-3" /> : <Square className="w-3 h-3" />}
            </Button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="text-[10px] text-muted-foreground">
              {pointCount} points
            </div>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={onUndo}
                className="h-7 px-2"
                disabled={pointCount === 0}
                data-testid="button-undo-point"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
                className="h-7 px-2 text-red-400 hover:text-red-300"
                data-testid="button-cancel-track"
              >
                <X className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={onConfirm}
                className="h-7 px-2 bg-green-500 hover:bg-green-600"
                disabled={pointCount < 2}
                data-testid="button-confirm-track"
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
