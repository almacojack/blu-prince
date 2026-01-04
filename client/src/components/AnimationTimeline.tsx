import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Circle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Diamond,
  Layers,
  Volume2,
  Type,
  Box,
  Sparkles,
  Settings,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Repeat,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ANIMATION_PATTERNS, PRINCIPLE_NAMES, AnimationPattern } from "@/lib/animation-patterns";

export type KeyframeType = "transform" | "audio" | "text" | "effect" | "event";

export interface Keyframe {
  id: string;
  time: number;
  type: KeyframeType;
  label?: string;
  value: unknown;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "spring";
}

export interface Track {
  id: string;
  name: string;
  type: KeyframeType;
  color: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  keyframes: Keyframe[];
}

export interface AnimationTimelineProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isRecording: boolean;
  onTimeChange: (time: number) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onAddKeyframe: (trackId: string, time: number, type: KeyframeType) => void;
  onRemoveKeyframe: (trackId: string, keyframeId: string) => void;
  onMoveKeyframe: (trackId: string, keyframeId: string, newTime: number) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
  onAddTrack: (type: KeyframeType) => void;
  onRemoveTrack: (trackId: string) => void;
  onExportToToss: () => void;
}

const TRACK_COLORS: Record<KeyframeType, { bg: string; border: string; glow: string }> = {
  transform: { bg: "bg-cyan-500", border: "border-cyan-400", glow: "shadow-[0_0_8px_rgba(6,182,212,0.6)]" },
  audio: { bg: "bg-fuchsia-500", border: "border-fuchsia-400", glow: "shadow-[0_0_8px_rgba(217,70,239,0.6)]" },
  text: { bg: "bg-amber-500", border: "border-amber-400", glow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]" },
  effect: { bg: "bg-emerald-500", border: "border-emerald-400", glow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]" },
  event: { bg: "bg-purple-500", border: "border-purple-400", glow: "shadow-[0_0_8px_rgba(168,85,247,0.6)]" },
};

const TRACK_ICONS: Record<KeyframeType, React.ReactNode> = {
  transform: <Box className="w-3 h-3" />,
  audio: <Volume2 className="w-3 h-3" />,
  text: <Type className="w-3 h-3" />,
  effect: <Sparkles className="w-3 h-3" />,
  event: <Diamond className="w-3 h-3" />,
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
}

function TimeRuler({ duration, zoom, scrollOffset }: { duration: number; zoom: number; scrollOffset: number }) {
  const marks = useMemo(() => {
    const result: { time: number; label: string; major: boolean }[] = [];
    const interval = zoom > 2 ? 0.5 : zoom > 1 ? 1 : 2;
    for (let t = 0; t <= duration; t += interval) {
      result.push({
        time: t,
        label: formatTime(t).slice(0, 5),
        major: t % (interval * 2) === 0,
      });
    }
    return result;
  }, [duration, zoom]);

  return (
    <div className="relative h-6 bg-gradient-to-b from-zinc-800 to-zinc-900 border-b border-zinc-700 overflow-hidden">
      <div
        className="absolute inset-0 flex"
        style={{ transform: `translateX(-${scrollOffset}px)` }}
      >
        {marks.map((mark) => (
          <div
            key={mark.time}
            className="absolute flex flex-col items-center"
            style={{ left: `${mark.time * 60 * zoom}px` }}
          >
            <div className={cn("w-px", mark.major ? "h-3 bg-cyan-400/60" : "h-2 bg-zinc-600")} />
            {mark.major && (
              <span className="text-[9px] text-zinc-400 mt-0.5 font-mono">{mark.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KeyframeDiamond({
  keyframe,
  trackColor,
  isSelected,
  onSelect,
  onDrag,
}: {
  keyframe: Keyframe;
  trackColor: { bg: string; border: string; glow: string };
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (deltaX: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    onSelect();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current;
      if (Math.abs(deltaX) > 2) {
        onDrag(deltaX);
        dragStartX.current = e.clientX;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onDrag]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-3 h-3 rotate-45 cursor-pointer border-2 transition-all",
              trackColor.bg,
              trackColor.border,
              isSelected && trackColor.glow,
              isDragging && "scale-125"
            )}
            style={{ left: "-6px" }}
            onMouseDown={handleMouseDown}
            whileHover={{ scale: 1.2 }}
            data-testid={`keyframe-${keyframe.id}`}
          />
        </TooltipTrigger>
        <TooltipContent className="bg-zinc-900 border-zinc-700 text-xs">
          <p className="font-mono">{formatTime(keyframe.time)}</p>
          {keyframe.label && <p className="text-zinc-400">{keyframe.label}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TrackRow({
  track,
  zoom,
  scrollOffset,
  selectedKeyframeId,
  onSelectKeyframe,
  onMoveKeyframe,
  onTrackUpdate,
  onRemoveTrack,
}: {
  track: Track;
  zoom: number;
  scrollOffset: number;
  selectedKeyframeId: string | null;
  onSelectKeyframe: (keyframeId: string) => void;
  onMoveKeyframe: (keyframeId: string, newTime: number) => void;
  onTrackUpdate: (updates: Partial<Track>) => void;
  onRemoveTrack: () => void;
}) {
  const colors = TRACK_COLORS[track.type];

  return (
    <div className={cn("flex border-b border-zinc-800", track.muted && "opacity-50")}>
      <div className="w-40 shrink-0 flex items-center gap-1 px-2 py-1 bg-zinc-900/80 border-r border-zinc-800">
        <div className={cn("w-4 h-4 rounded flex items-center justify-center", colors.bg)}>
          {TRACK_ICONS[track.type]}
        </div>
        <span className="text-[10px] text-zinc-300 truncate flex-1">{track.name}</span>
        <div className="flex items-center gap-0.5">
          <button
            className="p-0.5 hover:bg-zinc-700 rounded"
            onClick={() => onTrackUpdate({ muted: !track.muted })}
            data-testid={`track-mute-${track.id}`}
          >
            {track.muted ? <EyeOff className="w-3 h-3 text-zinc-500" /> : <Eye className="w-3 h-3 text-zinc-400" />}
          </button>
          <button
            className="p-0.5 hover:bg-zinc-700 rounded"
            onClick={() => onTrackUpdate({ locked: !track.locked })}
            data-testid={`track-lock-${track.id}`}
          >
            {track.locked ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-zinc-400" />}
          </button>
          <button
            className="p-0.5 hover:bg-red-900/50 rounded"
            onClick={onRemoveTrack}
            data-testid={`track-remove-${track.id}`}
          >
            <Trash2 className="w-3 h-3 text-zinc-500 hover:text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative h-8 bg-zinc-900/40 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ transform: `translateX(-${scrollOffset}px)` }}
        >
          {track.keyframes.map((kf) => (
            <div
              key={kf.id}
              className="absolute h-full"
              style={{ left: `${kf.time * 60 * zoom}px` }}
            >
              <KeyframeDiamond
                keyframe={kf}
                trackColor={colors}
                isSelected={selectedKeyframeId === kf.id}
                onSelect={() => onSelectKeyframe(kf.id)}
                onDrag={(deltaX) => {
                  if (track.locked) return;
                  const timeDelta = deltaX / (60 * zoom);
                  const newTime = Math.max(0, kf.time + timeDelta);
                  onMoveKeyframe(kf.id, newTime);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransportControls({
  isPlaying,
  isRecording,
  currentTime,
  duration,
  onPlayPause,
  onStop,
  onRecord,
  onSkipBack,
  onSkipForward,
  onTimeChange,
  loop,
  onToggleLoop,
}: {
  isPlaying: boolean;
  isRecording: boolean;
  currentTime: number;
  duration: number;
  onPlayPause: () => void;
  onStop: () => void;
  onRecord: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onTimeChange: (time: number) => void;
  loop: boolean;
  onToggleLoop: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-400 hover:text-white"
        onClick={onSkipBack}
        data-testid="transport-skip-back"
      >
        <SkipBack className="w-4 h-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-400 hover:text-white"
        onClick={onStop}
        data-testid="transport-stop"
      >
        <Square className="w-4 h-4" />
      </Button>

      <Button
        variant={isPlaying ? "default" : "ghost"}
        size="icon"
        className={cn("h-8 w-8", isPlaying ? "bg-cyan-600 hover:bg-cyan-500" : "text-zinc-400 hover:text-white")}
        onClick={onPlayPause}
        data-testid="transport-play-pause"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      <Button
        variant={isRecording ? "default" : "ghost"}
        size="icon"
        className={cn("h-8 w-8", isRecording ? "bg-red-600 hover:bg-red-500 animate-pulse" : "text-zinc-400 hover:text-red-400")}
        onClick={onRecord}
        data-testid="transport-record"
      >
        <Circle className={cn("w-4 h-4", isRecording && "fill-current")} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-zinc-400 hover:text-white"
        onClick={onSkipForward}
        data-testid="transport-skip-forward"
      >
        <SkipForward className="w-4 h-4" />
      </Button>

      <Button
        variant={loop ? "default" : "ghost"}
        size="icon"
        className={cn("h-7 w-7", loop ? "bg-purple-600 hover:bg-purple-500" : "text-zinc-400 hover:text-white")}
        onClick={onToggleLoop}
        data-testid="transport-loop"
      >
        <Repeat className="w-3.5 h-3.5" />
      </Button>

      <div className="w-px h-6 bg-zinc-700 mx-1" />

      <div className="font-mono text-sm text-cyan-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-700 min-w-[90px] text-center">
        {formatTime(currentTime)}
      </div>

      <span className="text-[10px] text-zinc-500">/</span>

      <div className="font-mono text-xs text-zinc-500">
        {formatTime(duration)}
      </div>
    </div>
  );
}

function WinampVisualizer({ isPlaying, intensity }: { isPlaying: boolean; intensity: number }) {
  const bars = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    id: i,
    baseHeight: Math.random() * 0.5 + 0.2,
    speed: Math.random() * 0.5 + 0.5,
  })), []);

  return (
    <div className="flex items-end gap-[1px] h-8 px-2">
      {bars.map((bar) => (
        <motion.div
          key={bar.id}
          className="w-[3px] rounded-t"
          style={{
            background: `linear-gradient(to top, #06b6d4, #a855f7, #f43f5e)`,
          }}
          animate={{
            height: isPlaying
              ? [
                  `${bar.baseHeight * 32 * intensity}px`,
                  `${(bar.baseHeight + 0.3) * 32 * intensity}px`,
                  `${bar.baseHeight * 32 * intensity}px`,
                ]
              : "4px",
          }}
          transition={{
            duration: bar.speed,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function AnimationTimeline({
  tracks,
  currentTime,
  duration,
  isPlaying,
  isRecording,
  onTimeChange,
  onPlayPause,
  onStop,
  onRecord,
  onAddKeyframe,
  onRemoveKeyframe,
  onMoveKeyframe,
  onTrackUpdate,
  onAddTrack,
  onRemoveTrack,
  onExportToToss,
}: AnimationTimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [loop, setLoop] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset - 160;
      const time = Math.max(0, x / (60 * zoom));
      onTimeChange(time);
    },
    [scrollOffset, zoom, onTimeChange]
  );

  const handleSkipBack = () => onTimeChange(0);
  const handleSkipForward = () => onTimeChange(duration);

  const playheadPosition = currentTime * 60 * zoom - scrollOffset + 160;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-900/95 border-t border-cyan-500/30 backdrop-blur-sm"
      style={{ height: "180px" }}
      data-testid="animation-timeline"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-fuchsia-500/5 pointer-events-none" />

      <div className="flex items-center justify-between h-10 px-2 border-b border-zinc-800">
        <TransportControls
          isPlaying={isPlaying}
          isRecording={isRecording}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={onPlayPause}
          onStop={onStop}
          onRecord={onRecord}
          onSkipBack={handleSkipBack}
          onSkipForward={handleSkipForward}
          onTimeChange={onTimeChange}
          loop={loop}
          onToggleLoop={() => setLoop(!loop)}
        />

        <WinampVisualizer isPlaying={isPlaying} intensity={0.8} />

        <div className="flex items-center gap-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-white"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            data-testid="timeline-zoom-out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[10px] text-zinc-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-zinc-400 hover:text-white"
            onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
            data-testid="timeline-zoom-in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <div className="flex gap-1">
            {(["transform", "audio", "text", "effect", "event"] as KeyframeType[]).map((type) => (
              <TooltipProvider key={type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn("h-6 w-6", TRACK_COLORS[type].bg.replace("bg-", "text-").replace("-500", "-400"))}
                      onClick={() => onAddTrack(type)}
                      data-testid={`add-track-${type}`}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-900 border-zinc-700 text-xs capitalize">
                    Add {type} track
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <PatternLibraryDropdown onApplyPattern={(pattern: AnimationPattern) => {
            const validEasings: Keyframe['easing'][] = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'spring'];
            const easingMap: Record<string, Keyframe['easing']> = {
              'linear': 'linear',
              'ease-in': 'ease-in',
              'ease-out': 'ease-out',
              'ease-in-out': 'ease-in-out',
              'bounce': 'ease-out',
              'elastic': 'ease-in-out',
              'back': 'ease-out',
              'anticipate': 'ease-in',
            };
            
            const timestamp = Date.now();
            const newKeyframes: Keyframe[] = pattern.keyframes.map((kf, i) => {
              const mappedEasing = easingMap[kf.easing || 'linear'] || 'linear';
              return {
                id: `${pattern.id}-${timestamp}-kf-${i}`,
                time: kf.time,
                type: 'transform' as KeyframeType,
                label: `${pattern.name} #${i + 1}`,
                value: {
                  position: kf.position || [0, 0, 0],
                  rotation: kf.rotation || [0, 0, 0],
                  scale: kf.scale || [1, 1, 1],
                },
                easing: validEasings.includes(mappedEasing) ? mappedEasing : 'linear',
              };
            });
            
            const transformTrack = tracks.find(t => t.type === 'transform');
            if (transformTrack) {
              onTrackUpdate(transformTrack.id, { 
                keyframes: newKeyframes,
                name: pattern.name 
              });
            } else if (tracks.length > 0) {
              onTrackUpdate(tracks[0].id, { 
                keyframes: newKeyframes,
                name: pattern.name 
              });
            } else {
              onAddTrack('transform');
            }
          }} />

          <div className="w-px h-4 bg-zinc-700 mx-1" />

          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
            onClick={onExportToToss}
            data-testid="export-to-toss"
          >
            Export TOSS
          </Button>
        </div>
      </div>

      <div
        ref={timelineRef}
        className="relative flex-1 overflow-hidden cursor-crosshair"
        onClick={handleTimelineClick}
        style={{ height: "130px" }}
      >
        <div className="flex">
          <div className="w-40 shrink-0 bg-zinc-900/80" />
          <div className="flex-1">
            <TimeRuler duration={duration} zoom={zoom} scrollOffset={scrollOffset} />
          </div>
        </div>

        <div className="overflow-auto" style={{ height: "104px" }}>
          {tracks.length === 0 ? (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              <Layers className="w-5 h-5 mr-2 opacity-50" />
              No tracks. Click + to add one.
            </div>
          ) : (
            tracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                zoom={zoom}
                scrollOffset={scrollOffset}
                selectedKeyframeId={selectedKeyframeId}
                onSelectKeyframe={setSelectedKeyframeId}
                onMoveKeyframe={(keyframeId, newTime) => onMoveKeyframe(track.id, keyframeId, newTime)}
                onTrackUpdate={(updates) => onTrackUpdate(track.id, updates)}
                onRemoveTrack={() => onRemoveTrack(track.id)}
              />
            ))
          )}
        </div>

        <AnimatePresence>
          {playheadPosition > 0 && (
            <motion.div
              className="absolute top-0 bottom-0 w-px bg-red-500 pointer-events-none z-20"
              style={{ left: playheadPosition }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-red-500 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PatternLibraryDropdown({ onApplyPattern }: { onApplyPattern: (pattern: AnimationPattern) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={open ? "default" : "ghost"}
              size="sm"
              className={cn("h-6 text-[10px] gap-1", open ? "bg-purple-600" : "text-purple-400")}
              onClick={() => setOpen(!open)}
              data-testid="pattern-library-toggle"
            >
              <Wand2 className="w-3 h-3" />
              Patterns
              <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-900 border-zinc-700 text-xs">
            12 Principles of Animation Presets
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {open && (
        <div className="absolute top-8 right-0 z-50 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-2">
          <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 px-2">
            ✨ One-Click Animation Presets
          </div>
          <ScrollArea className="h-48">
            <div className="grid grid-cols-2 gap-1 pr-2">
              {ANIMATION_PATTERNS.map(pattern => (
                <button
                  key={pattern.id}
                  className="p-2 rounded text-left transition-all hover:bg-zinc-800 border border-transparent hover:border-zinc-600"
                  style={{ borderLeftColor: pattern.color, borderLeftWidth: 3 }}
                  onClick={() => { onApplyPattern(pattern); setOpen(false); }}
                  data-testid={`apply-pattern-${pattern.id}`}
                >
                  <div className="text-xs font-medium text-white truncate">{pattern.name}</div>
                  <div className="text-[9px] text-zinc-500 truncate">
                    {PRINCIPLE_NAMES[pattern.principle]}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export function createDefaultTracks(): Track[] {
  return [
    {
      id: "transform-main",
      name: "Transform",
      type: "transform",
      color: "#06b6d4",
      muted: false,
      locked: false,
      visible: true,
      keyframes: [
        { id: "kf1", time: 0, type: "transform", value: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
        { id: "kf2", time: 2, type: "transform", value: { position: [2, 1, 0], rotation: [0, 45, 0], scale: [1, 1, 1] } },
      ],
    },
    {
      id: "audio-sfx",
      name: "Sound FX",
      type: "audio",
      color: "#d946ef",
      muted: false,
      locked: false,
      visible: true,
      keyframes: [
        { id: "kf3", time: 1, type: "audio", label: "beep.wav", value: { src: "beep.wav", volume: 0.8 } },
      ],
    },
  ];
}
