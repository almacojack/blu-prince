import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useDragControls, useMotionValue, animate } from "framer-motion";
import { GripVertical, X, Music2, SkipForward, SkipBack, Play, Pause, Volume2, VolumeX, List, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateSnap, bounceTransition } from "@/lib/magnetic-snap";
import { SnapFlash } from "@/components/SnapFlash";

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

function VUMeterMini({ isPlaying }: { isPlaying: boolean }) {
  const [level, setLevel] = useState(0);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) {
      setLevel(0);
      return;
    }

    const animate = () => {
      phaseRef.current += 0.08;
      const base = 0.45 + Math.sin(phaseRef.current * 2) * 0.15;
      const noise = Math.random() * 0.25;
      setLevel(Math.min(1, base + noise));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const needleAngle = -45 + (level * 90);

  return (
    <div 
      className="relative w-16 h-8 rounded overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #d4a574 0%, #8b7355 100%)",
        boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)",
      }}
    >
      <svg viewBox="0 0 64 32" className="absolute inset-0 w-full h-full">
        <path
          d="M 56 28 A 24 24 0 0 0 42 8"
          fill="none"
          stroke="#8b0000"
          strokeWidth="4"
          opacity="0.3"
        />
        {[0, 0.25, 0.5, 0.75, 1].map((pos, i) => {
          const angle = -45 + (pos * 90);
          const rad = (angle * Math.PI) / 180;
          const x1 = 32 + Math.cos(rad) * 18;
          const y1 = 28 + Math.sin(rad) * 18;
          const x2 = 32 + Math.cos(rad) * 22;
          const y2 = 28 + Math.sin(rad) * 22;
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={pos >= 0.85 ? "#8b0000" : "#4a3219"}
              strokeWidth={1}
            />
          );
        })}
        <text x="32" y="18" textAnchor="middle" fill="#4a3219" fontSize="5" fontFamily="serif" fontStyle="italic">VU</text>
        <circle cx="32" cy="28" r="2" fill="#2a1a0a" />
      </svg>
      <motion.div
        className="absolute bottom-1 left-1/2"
        style={{
          width: "1px",
          height: "55%",
          background: "#1a0f05",
          transformOrigin: "bottom center",
          marginLeft: "-0.5px",
        }}
        animate={{ rotate: needleAngle }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      />
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
        }}
      />
    </div>
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
  panelTitle?: string;
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
  panelTitle = "tng.li/AMP",
  "data-testid": testId,
}: WinAmpPanelProps) {
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [snapLines, setSnapLines] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const dragControls = useDragControls();
  const motionX = useMotionValue(initialPosition.x);
  const motionY = useMotionValue(initialPosition.y);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback(() => {
    if (!panelRef.current) return;
    
    const rect = panelRef.current.getBoundingClientRect();
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    const snap = calculateSnap(
      motionX.get(),
      motionY.get(),
      rect.width,
      rect.height,
      containerWidth,
      containerHeight
    );
    
    if (snap.snappedX || snap.snappedY) {
      setSnapLines({ x: snap.snapLineX, y: snap.snapLineY });
      setTimeout(() => setSnapLines({ x: null, y: null }), 50);
    }
    
    animate(motionX, snap.x, bounceTransition);
    animate(motionY, snap.y, bounceTransition);
  }, [motionX, motionY]);

  return (
    <>
      <SnapFlash 
        snapLineX={snapLines.x} 
        snapLineY={snapLines.y} 
        containerWidth={typeof window !== 'undefined' ? window.innerWidth : 1920}
        containerHeight={typeof window !== 'undefined' ? window.innerHeight : 1080}
      />
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />
      <motion.div
        ref={panelRef}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        style={{ x: motionX, y: motionY }}
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
                {panelTitle}
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
                <div className="flex gap-2 items-end">
                  <AudioVisualizer isPlaying={isPlaying && !isMuted} width={140} height={32} />
                  <VUMeterMini isPlaying={isPlaying && !isMuted} />
                </div>
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
