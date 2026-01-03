import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// PORTABLE DATA MODELS - These can be serialized for TUI/MicroPython renderers
// =============================================================================

export interface SonarContact {
  id: string;
  bearing: number;      // 0-360 degrees
  range: number;        // 0-1 normalized distance
  strength: number;     // 0-1 signal strength
  type: 'unknown' | 'submarine' | 'surface' | 'biological' | 'terrain';
  velocity?: number;    // knots
  heading?: number;     // degrees
}

export interface SonarScannerState {
  sweepAngle: number;   // current sweep position 0-360
  contacts: SonarContact[];
  gain: number;         // 0-1 sensitivity
  range: number;        // display range in yards
  pingActive: boolean;
  mode: 'active' | 'passive';
}

export interface FishFinderEcho {
  id: string;
  depth: number;        // 0-1 normalized depth
  x: number;            // 0-1 horizontal position
  size: number;         // relative size
  type: 'fish' | 'school' | 'structure' | 'vegetation';
}

export interface FishFinderState {
  currentDepth: number;     // feet
  maxDepth: number;         // range setting
  bottomContour: number[];  // array of depth values 0-1
  echoes: FishFinderEcho[];
  waterTemp: number;        // fahrenheit
  frequency: 50 | 83 | 200; // kHz
  sensitivity: number;      // 0-1
}

// =============================================================================
// SONAR SCANNER WIDGET - Submarine-style rotating sweep radar
// =============================================================================

interface SonarScannerProps {
  size?: number;
  contacts?: SonarContact[];
  sweepSpeed?: number;
  mode?: 'active' | 'passive';
  gain?: number;
  rangeYards?: number;
  variant?: 'military' | 'classic' | 'modern';
  onPing?: () => void;
}

function generateRandomContacts(count: number): SonarContact[] {
  const types: SonarContact['type'][] = ['unknown', 'submarine', 'surface', 'biological'];
  return Array.from({ length: count }, (_, i) => ({
    id: `contact-${i}`,
    bearing: Math.random() * 360,
    range: 0.2 + Math.random() * 0.7,
    strength: 0.3 + Math.random() * 0.7,
    type: types[Math.floor(Math.random() * types.length)],
    velocity: Math.random() * 15,
    heading: Math.random() * 360,
  }));
}

export function SonarScanner({
  size = 280,
  contacts: externalContacts,
  sweepSpeed = 4,
  mode = 'active',
  gain = 0.7,
  rangeYards = 5000,
  variant = 'military',
  onPing,
}: SonarScannerProps) {
  const [sweepAngle, setSweepAngle] = useState(0);
  const [contacts, setContacts] = useState<SonarContact[]>(externalContacts || generateRandomContacts(5));
  const [pingFlash, setPingFlash] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const lastPingAngle = useRef(0);

  const colors = useMemo(() => {
    switch (variant) {
      case 'military':
        return { primary: '#00ff41', secondary: '#003300', glow: '#00ff4180', bg: '#001a00' };
      case 'modern':
        return { primary: '#00d4ff', secondary: '#002233', glow: '#00d4ff80', bg: '#000d1a' };
      default:
        return { primary: '#39ff14', secondary: '#0a2f0a', glow: '#39ff1480', bg: '#051005' };
    }
  }, [variant]);

  useEffect(() => {
    if (externalContacts) setContacts(externalContacts);
  }, [externalContacts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle(prev => {
        const next = (prev + sweepSpeed) % 360;
        if (mode === 'active' && Math.floor(next / 90) !== Math.floor(lastPingAngle.current / 90)) {
          playPing();
          lastPingAngle.current = next;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [sweepSpeed, mode]);

  const playPing = () => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.15 * gain, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setPingFlash(true);
    setTimeout(() => setPingFlash(false), 100);
    onPing?.();
  };

  const center = size / 2;
  const radius = (size / 2) - 20;

  return (
    <div 
      className="relative"
      style={{ width: size, height: size }}
      data-testid="widget-sonar-scanner"
    >
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <radialGradient id={`sonar-bg-${variant}`}>
            <stop offset="0%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.bg} />
          </radialGradient>
          <filter id={`sonar-glow-${variant}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={center} cy={center} r={radius + 10} fill={colors.bg} stroke={colors.primary} strokeWidth="2" />
        <circle cx={center} cy={center} r={radius} fill={`url(#sonar-bg-${variant})`} />

        {[0.25, 0.5, 0.75, 1].map((r, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * r}
            fill="none"
            stroke={colors.primary}
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos((angle - 90) * Math.PI / 180)}
            y2={center + radius * Math.sin((angle - 90) * Math.PI / 180)}
            stroke={colors.primary}
            strokeWidth="0.5"
            opacity={0.3}
          />
        ))}

        <g filter={`url(#sonar-glow-${variant})`}>
          <line
            x1={center}
            y1={center}
            x2={center + radius * Math.cos((sweepAngle - 90) * Math.PI / 180)}
            y2={center + radius * Math.sin((sweepAngle - 90) * Math.PI / 180)}
            stroke={colors.primary}
            strokeWidth="2"
          />
        </g>

        <defs>
          <linearGradient id={`sweep-fade-${variant}`} gradientTransform={`rotate(${sweepAngle - 90})`}>
            <stop offset="0%" stopColor={colors.glow} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d={`M ${center} ${center} L ${center + radius * Math.cos((sweepAngle - 90) * Math.PI / 180)} ${center + radius * Math.sin((sweepAngle - 90) * Math.PI / 180)} A ${radius} ${radius} 0 0 0 ${center + radius * Math.cos((sweepAngle - 120) * Math.PI / 180)} ${center + radius * Math.sin((sweepAngle - 120) * Math.PI / 180)} Z`}
          fill={colors.glow}
          opacity={0.4}
        />

        {contacts.map((contact) => {
          const angleDiff = ((sweepAngle - contact.bearing + 360) % 360);
          const fadeOpacity = angleDiff < 180 ? Math.max(0, 1 - angleDiff / 180) : 0;
          if (fadeOpacity < 0.1) return null;
          
          const cx = center + (radius * contact.range) * Math.cos((contact.bearing - 90) * Math.PI / 180);
          const cy = center + (radius * contact.range) * Math.sin((contact.bearing - 90) * Math.PI / 180);
          
          return (
            <g key={contact.id} opacity={fadeOpacity * contact.strength * gain}>
              <circle cx={cx} cy={cy} r={6} fill={colors.primary} filter={`url(#sonar-glow-${variant})`} />
              <circle cx={cx} cy={cy} r={3} fill="#fff" />
            </g>
          );
        })}

        <circle cx={center} cy={center} r={4} fill={colors.primary} />
      </svg>

      {pingFlash && (
        <motion.div
          initial={{ opacity: 0.8, scale: 0.5 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 rounded-full"
          style={{ border: `2px solid ${colors.primary}` }}
        />
      )}

      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[9px] font-mono" style={{ color: colors.primary }}>
        <span>{mode.toUpperCase()}</span>
        <span>RNG: {rangeYards}YD</span>
        <span>GAIN: {Math.round(gain * 100)}%</span>
      </div>
    </div>
  );
}

// =============================================================================
// FISH FINDER WIDGET - Depth sonar with fish echoes
// =============================================================================

interface FishFinderProps {
  width?: number;
  height?: number;
  maxDepth?: number;
  echoes?: FishFinderEcho[];
  waterTemp?: number;
  frequency?: 50 | 83 | 200;
  sensitivity?: number;
  variant?: 'classic' | 'color' | 'chirp';
  showTemp?: boolean;
}

function generateBottomContour(points: number): number[] {
  const contour: number[] = [];
  let depth = 0.6 + Math.random() * 0.2;
  for (let i = 0; i < points; i++) {
    depth += (Math.random() - 0.5) * 0.05;
    depth = Math.max(0.4, Math.min(0.95, depth));
    contour.push(depth);
  }
  return contour;
}

function generateFishEchoes(count: number): FishFinderEcho[] {
  const types: FishFinderEcho['type'][] = ['fish', 'fish', 'school', 'structure', 'vegetation'];
  return Array.from({ length: count }, (_, i) => ({
    id: `echo-${i}`,
    depth: 0.15 + Math.random() * 0.6,
    x: Math.random(),
    size: 0.3 + Math.random() * 0.7,
    type: types[Math.floor(Math.random() * types.length)],
  }));
}

export function FishFinder({
  width = 320,
  height = 200,
  maxDepth = 100,
  echoes: externalEchoes,
  waterTemp = 68,
  frequency = 200,
  sensitivity = 0.7,
  variant = 'color',
  showTemp = true,
}: FishFinderProps) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const [bottomContour] = useState(() => generateBottomContour(100));
  const [echoes, setEchoes] = useState<FishFinderEcho[]>(externalEchoes || generateFishEchoes(8));

  const colors = useMemo(() => {
    switch (variant) {
      case 'classic':
        return { bg: '#1a1a1a', water: '#0a2a4a', bottom: '#8b4513', fish: '#ffff00', text: '#ff6600' };
      case 'chirp':
        return { bg: '#000814', water: '#001d3d', bottom: '#ffc300', fish: '#ff006e', text: '#00ff88' };
      default:
        return { bg: '#000d1a', water: '#003566', bottom: '#bc6c25', fish: '#ff595e', text: '#00d4ff' };
    }
  }, [variant]);

  useEffect(() => {
    if (externalEchoes) setEchoes(externalEchoes);
  }, [externalEchoes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollOffset(prev => (prev + 1) % 100);
      if (Math.random() < 0.05) {
        setEchoes(prev => {
          const newEchoes = prev.map(e => ({
            ...e,
            x: e.x - 0.02,
          })).filter(e => e.x > -0.1);
          if (Math.random() < 0.3) {
            newEchoes.push({
              id: `echo-${Date.now()}`,
              depth: 0.15 + Math.random() * 0.55,
              x: 1.1,
              size: 0.3 + Math.random() * 0.7,
              type: Math.random() < 0.7 ? 'fish' : 'school',
            });
          }
          return newEchoes;
        });
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const depthMarks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div 
      className="relative rounded-lg overflow-hidden"
      style={{ width, height, background: colors.bg }}
      data-testid="widget-fish-finder"
    >
      <svg width={width} height={height} className="absolute inset-0">
        <defs>
          <linearGradient id={`water-gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.water} stopOpacity={0.3} />
            <stop offset="100%" stopColor={colors.water} stopOpacity={0.9} />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill={`url(#water-gradient-${variant})`} />

        <path
          d={`M 0 ${height} ` + 
            bottomContour.map((d, i) => {
              const x = (i / bottomContour.length) * width;
              const adjustedI = (i + scrollOffset) % bottomContour.length;
              const y = bottomContour[adjustedI] * height;
              return `L ${x} ${y}`;
            }).join(' ') + 
            ` L ${width} ${height} Z`}
          fill={colors.bottom}
          opacity={0.8}
        />

        {echoes.map((echo) => {
          const x = echo.x * width;
          const y = echo.depth * height;
          const iconSize = 6 + echo.size * 8;
          
          if (echo.type === 'school') {
            return (
              <g key={echo.id}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <ellipse
                    key={i}
                    cx={x + (i - 2) * 8}
                    cy={y + Math.sin(i) * 5}
                    rx={4}
                    ry={2}
                    fill={colors.fish}
                    opacity={0.7 * sensitivity}
                  />
                ))}
              </g>
            );
          }
          
          if (echo.type === 'vegetation') {
            return (
              <g key={echo.id}>
                {[0, 1, 2].map((i) => (
                  <line
                    key={i}
                    x1={x + (i - 1) * 4}
                    y1={y + 10}
                    x2={x + (i - 1) * 4 + Math.sin(scrollOffset * 0.1 + i) * 3}
                    y2={y - 10}
                    stroke="#22c55e"
                    strokeWidth="2"
                    opacity={0.6}
                  />
                ))}
              </g>
            );
          }
          
          return (
            <g key={echo.id}>
              <ellipse
                cx={x}
                cy={y}
                rx={iconSize}
                ry={iconSize / 2}
                fill={colors.fish}
                opacity={0.5 + echo.size * 0.3 * sensitivity}
              />
              <path
                d={`M ${x - iconSize/2} ${y} Q ${x} ${y - iconSize/3} ${x + iconSize/2} ${y} Q ${x} ${y + iconSize/3} ${x - iconSize/2} ${y}`}
                fill="none"
                stroke={colors.fish}
                strokeWidth="1.5"
                opacity={sensitivity}
              />
            </g>
          );
        })}

        {depthMarks.map((mark, i) => (
          <g key={i}>
            <line
              x1={0}
              y1={mark * height * 0.85}
              x2={width}
              y2={mark * height * 0.85}
              stroke={colors.text}
              strokeWidth="0.5"
              opacity={0.2}
              strokeDasharray="4 4"
            />
            <text
              x={5}
              y={mark * height * 0.85 + 4}
              fill={colors.text}
              fontSize="9"
              fontFamily="monospace"
              opacity={0.7}
            >
              {Math.round(mark * maxDepth)}ft
            </text>
          </g>
        ))}
      </svg>

      <div 
        className="absolute top-1 left-1 right-1 flex justify-between text-[9px] font-mono px-1"
        style={{ color: colors.text }}
      >
        <span>DEPTH: {maxDepth}FT</span>
        <span>{frequency}kHz</span>
        {showTemp && <span>TEMP: {waterTemp}°F</span>}
      </div>

      <div 
        className="absolute bottom-1 right-1 text-[8px] font-mono px-1"
        style={{ color: colors.text }}
      >
        SENS: {Math.round(sensitivity * 100)}%
      </div>

      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-green-500 to-red-500 opacity-50" />
    </div>
  );
}

// =============================================================================
// TOSS SERIALIZATION - Export state for TUI/MicroPython renderers
// =============================================================================

export function exportSonarState(state: SonarScannerState): string {
  return JSON.stringify({
    type: 'sonar_scanner',
    sweep: Math.round(state.sweepAngle),
    contacts: state.contacts.map(c => ({
      b: Math.round(c.bearing),
      r: Math.round(c.range * 100),
      s: Math.round(c.strength * 100),
      t: c.type[0],
    })),
    g: Math.round(state.gain * 100),
    m: state.mode[0],
  });
}

export function exportFishFinderState(state: FishFinderState): string {
  return JSON.stringify({
    type: 'fish_finder',
    depth: state.currentDepth,
    max: state.maxDepth,
    bottom: state.bottomContour.map(d => Math.round(d * 100)),
    echoes: state.echoes.map(e => ({
      d: Math.round(e.depth * 100),
      x: Math.round(e.x * 100),
      s: Math.round(e.size * 100),
      t: e.type[0],
    })),
    temp: state.waterTemp,
    freq: state.frequency,
  });
}

// ASCII art renderer for TUI (example output)
export function renderSonarAscii(state: SonarScannerState, size = 21): string[] {
  const lines: string[] = [];
  const center = Math.floor(size / 2);
  const radius = center - 1;
  
  for (let y = 0; y < size; y++) {
    let line = '';
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > radius + 0.5) {
        line += ' ';
      } else if (Math.abs(dist - radius) < 0.5) {
        line += '○';
      } else if (x === center && y === center) {
        line += '+';
      } else {
        const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
        const sweepDiff = (state.sweepAngle - angle + 360) % 360;
        
        const contact = state.contacts.find(c => {
          const cDist = c.range * radius;
          const cAngle = c.bearing;
          const cDx = cDist * Math.cos((cAngle - 90) * Math.PI / 180);
          const cDy = cDist * Math.sin((cAngle - 90) * Math.PI / 180);
          return Math.abs(cDx - dx) < 1.5 && Math.abs(cDy - dy) < 1.5;
        });
        
        if (contact && sweepDiff < 90) {
          line += '▓';
        } else if (sweepDiff < 15) {
          line += '░';
        } else {
          line += '·';
        }
      }
    }
    lines.push(line);
  }
  return lines;
}
