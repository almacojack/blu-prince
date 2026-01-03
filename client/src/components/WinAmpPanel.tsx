import { ReactNode, useState, useRef, useEffect, useCallback } from "react";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { GripVertical, X, Music2, SkipForward, SkipBack, Play, Pause, Volume2, VolumeX, List, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const SNAP_THRESHOLD = 20;

function snapToEdges(
  x: number,
  y: number,
  width: number,
  height: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  let snappedX = x;
  let snappedY = y;

  if (Math.abs(x) < SNAP_THRESHOLD) snappedX = 0;
  if (Math.abs(y) < SNAP_THRESHOLD) snappedY = 0;
  if (Math.abs(x + width - containerWidth) < SNAP_THRESHOLD) snappedX = containerWidth - width;
  if (Math.abs(y + height - containerHeight) < SNAP_THRESHOLD) snappedY = containerHeight - height;

  return { x: snappedX, y: snappedY };
}

interface AudioVisualizerProps {
  isPlaying: boolean;
  width?: number;
  height?: number;
}

function AudioVisualizer({ isPlaying, width = 200, height = 40 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const barsRef = useRef<number[]>([]);
  
  const colors = [
    '#00ff00', '#22ff00', '#44ff00', '#66ff00', '#88ff00',
    '#aaff00', '#ccff00', '#eeff00', '#ffee00', '#ffcc00',
    '#ffaa00', '#ff8800', '#ff6600', '#ff4400', '#ff2200', '#ff0000'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barCount = 32;
    if (barsRef.current.length === 0) {
      barsRef.current = Array.from({ length: barCount }, () => Math.random() * 0.3);
    }

    const animate = () => {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      const barWidth = (width - barCount - 1) / barCount;
      
      barsRef.current = barsRef.current.map((bar, i) => {
        if (isPlaying) {
          const target = Math.random() * 0.7 + 0.3;
          return bar + (target - bar) * 0.15;
        } else {
          return bar * 0.95;
        }
      });

      barsRef.current.forEach((barHeight, i) => {
        const x = i * (barWidth + 1);
        const h = barHeight * height;
        const segmentHeight = height / colors.length;
        
        for (let j = 0; j < colors.length; j++) {
          const segY = height - (j + 1) * segmentHeight;
          if (segY > height - h) {
            ctx.fillStyle = colors[j];
            ctx.fillRect(x, segY, barWidth, segmentHeight - 1);
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded border border-gray-700"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

interface WinAmpPanelProps {
  trackName: string;
  isPlaying: boolean;
  isMuted: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev?: () => void;
  onMuteToggle: () => void;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  tracks?: string[];
  currentTrackIndex?: number;
  onSelectTrack?: (index: number) => void;
  "data-testid"?: string;
}

export function WinAmpPanel({
  trackName,
  isPlaying,
  isMuted,
  onPlayPause,
  onNext,
  onPrev,
  onMuteToggle,
  onClose,
  initialPosition = { x: 16, y: 16 },
  tracks = [],
  currentTrackIndex = 0,
  onSelectTrack,
  "data-testid": testId,
}: WinAmpPanelProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragControls = useDragControls();
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback(() => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    const snapped = snapToEdges(
      x.get(),
      y.get(),
      rect.width,
      rect.height,
      containerWidth,
      containerHeight
    );
    
    x.set(snapped.x);
    y.set(snapped.y);
  }, [x, y]);

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />
      <motion.div
        ref={panelRef}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        style={{ x, y }}
        className="fixed z-50 pointer-events-auto"
        data-testid={testId}
      >
        <div 
          className="relative overflow-hidden rounded-lg shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
            border: '2px solid #3a3a3a',
            minWidth: isMinimized ? 180 : 240,
          }}
        >
          <div 
            className="absolute inset-0"
            style={{
              background: `
                repeating-linear-gradient(
                  0deg,
                  transparent 0px,
                  transparent 2px,
                  rgba(0,0,0,0.1) 2px,
                  rgba(0,0,0,0.1) 4px
                )
              `,
            }}
          />

          <div 
            className="relative z-10 flex items-center justify-between px-2 py-1 cursor-move border-b border-gray-700"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-1">
              <GripVertical className="w-3 h-3 text-gray-500" />
              <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">
                WinAMP
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-gray-400 hover:text-white hover:bg-gray-700"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="w-2.5 h-2.5" />
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                  onClick={onClose}
                >
                  <X className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          </div>

          {!isMinimized && (
            <div className="relative z-10 p-2 space-y-2">
              <div className="bg-black/60 rounded p-1.5 border border-gray-700">
                <div className="text-[10px] text-green-400 font-mono truncate mb-1 px-1">
                  {trackName}
                </div>
                <AudioVisualizer isPlaying={isPlaying && !isMuted} width={216} height={32} />
              </div>

              <div className="flex items-center justify-center gap-1">
                {onPrev && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                    onClick={onPrev}
                    data-testid="button-prev-track"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded ${isPlaying ? 'text-green-400 bg-green-400/10' : 'text-gray-300'} hover:text-white hover:bg-gray-700`}
                  onClick={onPlayPause}
                  data-testid="button-play-pause"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  onClick={onNext}
                  data-testid="button-next-track"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </Button>
                <div className="w-px h-5 bg-gray-600 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 rounded ${!isMuted ? 'text-cyan-400' : 'text-gray-400'} hover:text-white hover:bg-gray-700`}
                  onClick={onMuteToggle}
                  data-testid="button-mute"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 rounded ${showPlaylist ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-400'} hover:text-white hover:bg-gray-700`}
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  data-testid="button-playlist"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}

          {isMinimized && (
            <div className="relative z-10 p-2 flex items-center gap-2">
              <Music2 className="w-3 h-3 text-cyan-400" />
              <span className="text-[9px] text-green-400 font-mono truncate flex-1">{trackName}</span>
              <Button
                variant="ghost"
                size="icon"
                className={`h-5 w-5 rounded ${isPlaying ? 'text-green-400' : 'text-gray-400'} hover:text-white hover:bg-gray-700`}
                onClick={onPlayPause}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </Button>
            </div>
          )}
        </div>

        {showPlaylist && !isMinimized && tracks.length > 0 && (
          <div 
            className="mt-1 rounded-lg overflow-hidden shadow-xl"
            style={{
              background: 'linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)',
              border: '2px solid #3a3a3a',
            }}
          >
            <div className="p-1 border-b border-gray-700">
              <span className="text-[9px] text-yellow-400 uppercase tracking-wider font-bold px-1">
                Playlist
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {tracks.map((track, i) => (
                <button
                  key={i}
                  onClick={() => onSelectTrack?.(i)}
                  className={`w-full text-left px-2 py-1 text-[10px] font-mono truncate transition-colors ${
                    i === currentTrackIndex 
                      ? 'bg-cyan-900/40 text-cyan-300' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                  data-testid={`playlist-track-${i}`}
                >
                  {i + 1}. {track}
                </button>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}

export default WinAmpPanel;
