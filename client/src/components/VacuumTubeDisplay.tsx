import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface NixieTubeProps {
  digit: string;
  size?: "small" | "medium" | "large";
  glowIntensity?: number;
}

export function NixieTube({ digit, size = "medium", glowIntensity = 1 }: NixieTubeProps) {
  const sizeConfig = {
    small: { width: 32, height: 48, fontSize: 28 },
    medium: { width: 48, height: 72, fontSize: 42 },
    large: { width: 64, height: 96, fontSize: 56 },
  };
  
  const config = sizeConfig[size];
  const glowColor = `rgba(255, 140, 50, ${0.6 * glowIntensity})`;
  const warmGlow = `rgba(255, 100, 30, ${0.3 * glowIntensity})`;

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        width: config.width,
        height: config.height,
        background: "radial-gradient(ellipse at center, #1a0a00 0%, #0a0400 60%, #050200 100%)",
        boxShadow: `
          inset 0 0 20px rgba(0,0,0,0.8),
          inset 0 0 40px rgba(255,100,30,${0.1 * glowIntensity}),
          0 0 ${15 * glowIntensity}px ${warmGlow}
        `,
        border: "2px solid #2a1a0a",
      }}
      data-testid="widget-nixie-tube"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, rgba(255,140,50,${0.05 * glowIntensity}) 0%, transparent 70%)`,
        }}
      />
      
      <div className="absolute inset-0 flex items-center justify-center">
        {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <span
            key={d}
            className="absolute font-mono"
            style={{
              fontSize: config.fontSize,
              color: d === digit ? `rgb(255, ${140 + Math.random() * 20}, 50)` : "rgba(80, 40, 20, 0.15)",
              textShadow: d === digit 
                ? `0 0 10px ${glowColor}, 0 0 20px ${glowColor}, 0 0 30px ${warmGlow}`
                : "none",
              transition: "all 0.15s ease-out",
              fontFamily: "'Courier New', monospace",
              fontWeight: "bold",
            }}
          >
            {d}
          </span>
        ))}
      </div>

      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)",
        }}
      />
      
      <div
        className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
        style={{
          background: "rgba(255,200,150,0.3)",
          boxShadow: "0 0 3px rgba(255,200,150,0.5)",
        }}
      />
    </div>
  );
}

interface NixieDisplayProps {
  value: string;
  digits?: number;
  size?: "small" | "medium" | "large";
  label?: string;
}

export function NixieDisplay({ value, digits = 4, size = "medium", label }: NixieDisplayProps) {
  const paddedValue = value.padStart(digits, "0").slice(-digits);
  
  return (
    <div className="flex flex-col items-center gap-2" data-testid="widget-nixie-display">
      <div 
        className="flex gap-1 p-3 rounded-lg"
        style={{
          background: "linear-gradient(180deg, #1a1008 0%, #0a0804 100%)",
          boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)",
          border: "1px solid #3a2a1a",
        }}
      >
        {paddedValue.split("").map((digit, i) => (
          <NixieTube key={i} digit={digit} size={size} />
        ))}
      </div>
      {label && (
        <span 
          className="text-xs font-mono tracking-widest uppercase"
          style={{ color: "#8b6914" }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

interface MagicEyeTubeProps {
  level?: number;
  size?: "small" | "medium" | "large";
  variant?: "classic" | "dual" | "target";
}

export function MagicEyeTube({ level = 0.5, size = "medium", variant = "classic" }: MagicEyeTubeProps) {
  const [animatedLevel, setAnimatedLevel] = useState(level);
  
  useEffect(() => {
    setAnimatedLevel(level);
  }, [level]);

  const sizeConfig = {
    small: 40,
    medium: 60,
    large: 80,
  };
  
  const tubeSize = sizeConfig[size];
  const shadowAngle = (1 - animatedLevel) * 60;
  const glowIntensity = 0.6 + animatedLevel * 0.4;

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: tubeSize,
        height: tubeSize,
        background: "radial-gradient(circle at center, #001a00 0%, #000a00 60%, #000500 100%)",
        boxShadow: `
          inset 0 0 ${tubeSize / 3}px rgba(0,0,0,0.8),
          0 0 ${20 * glowIntensity}px rgba(0,255,50,${0.2 * glowIntensity})
        `,
        border: "3px solid #1a1a1a",
      }}
      data-testid="widget-magic-eye"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`rgba(0,255,100,${0.9 * glowIntensity})`} />
            <stop offset="40%" stopColor={`rgba(0,200,80,${0.7 * glowIntensity})`} />
            <stop offset="70%" stopColor={`rgba(0,150,50,${0.4 * glowIntensity})`} />
            <stop offset="100%" stopColor="rgba(0,50,20,0.1)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <circle cx="50" cy="50" r="45" fill="url(#eyeGlow)" filter="url(#glow)" />

        {variant === "classic" && (
          <>
            <motion.path
              d={`M 50 50 L ${50 - 40 * Math.cos((shadowAngle * Math.PI) / 180)} ${50 - 40 * Math.sin((shadowAngle * Math.PI) / 180)} A 40 40 0 0 1 ${50 + 40 * Math.cos((shadowAngle * Math.PI) / 180)} ${50 - 40 * Math.sin((shadowAngle * Math.PI) / 180)} Z`}
              fill="rgba(0,20,0,0.8)"
              animate={{ 
                d: `M 50 50 L ${50 - 40 * Math.cos((shadowAngle * Math.PI) / 180)} ${50 - 40 * Math.sin((shadowAngle * Math.PI) / 180)} A 40 40 0 0 1 ${50 + 40 * Math.cos((shadowAngle * Math.PI) / 180)} ${50 - 40 * Math.sin((shadowAngle * Math.PI) / 180)} Z`
              }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            />
          </>
        )}

        {variant === "dual" && (
          <>
            <motion.rect
              x="5"
              y="45"
              height="10"
              rx="2"
              fill="rgba(0,20,0,0.85)"
              animate={{ width: 45 - animatedLevel * 40 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            />
            <motion.rect
              y="45"
              height="10"
              rx="2"
              fill="rgba(0,20,0,0.85)"
              animate={{ 
                x: 50 + animatedLevel * 40,
                width: 45 - animatedLevel * 40 
              }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            />
          </>
        )}

        {variant === "target" && (
          <>
            <circle cx="50" cy="50" r="8" fill="rgba(0,20,0,0.9)" />
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <motion.line
                key={i}
                x1="50"
                y1="50"
                stroke="rgba(0,20,0,0.85)"
                strokeWidth="4"
                animate={{
                  x2: 50 + Math.cos((angle * Math.PI) / 180) * (15 + (1 - animatedLevel) * 25),
                  y2: 50 + Math.sin((angle * Math.PI) / 180) * (15 + (1 - animatedLevel) * 25),
                }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
              />
            ))}
          </>
        )}

        <circle cx="50" cy="50" r="3" fill="rgba(200,255,200,0.9)" />
      </svg>

      <div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

interface VacuumTubeProps {
  isOn?: boolean;
  intensity?: number;
  size?: "small" | "medium" | "large";
  type?: "triode" | "pentode" | "rectifier";
}

export function VacuumTube({ isOn = true, intensity = 0.8, size = "medium", type = "triode" }: VacuumTubeProps) {
  const [flicker, setFlicker] = useState(1);
  
  useEffect(() => {
    if (!isOn) return;
    const interval = setInterval(() => {
      setFlicker(0.95 + Math.random() * 0.1);
    }, 100);
    return () => clearInterval(interval);
  }, [isOn]);

  const sizeConfig = {
    small: { width: 24, height: 48 },
    medium: { width: 36, height: 72 },
    large: { width: 48, height: 96 },
  };
  
  const config = sizeConfig[size];
  const glowIntensity = isOn ? intensity * flicker : 0;
  const filamentColor = `rgba(255, ${100 + glowIntensity * 80}, ${30 + glowIntensity * 30}, ${glowIntensity})`;

  return (
    <div
      className="relative"
      style={{
        width: config.width,
        height: config.height,
      }}
      data-testid="widget-vacuum-tube"
    >
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-full"
        style={{
          width: config.width * 0.9,
          height: config.height * 0.8,
          background: "linear-gradient(180deg, rgba(40,35,30,0.3) 0%, rgba(30,25,20,0.5) 100%)",
          boxShadow: `
            inset 0 0 10px rgba(0,0,0,0.5),
            0 0 ${20 * glowIntensity}px rgba(255,150,50,${0.3 * glowIntensity})
          `,
          border: "1px solid rgba(100,90,80,0.3)",
        }}
      >
        <svg
          viewBox="0 0 36 60"
          className="absolute inset-0 w-full h-full"
          style={{ filter: `drop-shadow(0 0 ${5 * glowIntensity}px ${filamentColor})` }}
        >
          {type === "triode" && (
            <>
              <ellipse cx="18" cy="45" rx="6" ry="3" fill="rgba(60,55,50,0.8)" />
              <rect x="16" y="20" width="4" height="25" fill="rgba(80,75,70,0.6)" />
              <motion.path
                d="M 14 35 Q 18 32 22 35 Q 18 38 14 35"
                fill="none"
                stroke={filamentColor}
                strokeWidth="1.5"
                animate={{ opacity: [0.8, 1, 0.9, 1] }}
                transition={{ duration: 0.2, repeat: Infinity }}
              />
              <motion.ellipse
                cx="18"
                cy="30"
                rx="4"
                ry="2"
                fill={filamentColor}
                animate={{ opacity: [0.6, 0.9, 0.7, 0.85] }}
                transition={{ duration: 0.15, repeat: Infinity }}
              />
            </>
          )}
          
          {type === "pentode" && (
            <>
              <ellipse cx="18" cy="48" rx="8" ry="4" fill="rgba(60,55,50,0.8)" />
              <rect x="15" y="15" width="6" height="33" fill="rgba(80,75,70,0.5)" />
              {[25, 32, 39].map((y, i) => (
                <motion.ellipse
                  key={i}
                  cx="18"
                  cy={y}
                  rx="5"
                  ry="2"
                  fill="none"
                  stroke={filamentColor}
                  strokeWidth="0.8"
                  animate={{ opacity: [0.5 + i * 0.1, 0.8 + i * 0.05, 0.6 + i * 0.1] }}
                  transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                />
              ))}
            </>
          )}

          {type === "rectifier" && (
            <>
              <ellipse cx="18" cy="50" rx="10" ry="5" fill="rgba(60,55,50,0.8)" />
              {[0, 1].map((side) => (
                <motion.path
                  key={side}
                  d={`M ${10 + side * 16} 45 L ${10 + side * 16} 20 Q ${14 + side * 8} 15 ${18} 20 L ${18} 25`}
                  fill="none"
                  stroke={filamentColor}
                  strokeWidth="1.2"
                  animate={{ opacity: [0.7, 1, 0.8, 0.95] }}
                  transition={{ duration: 0.18, repeat: Infinity, delay: side * 0.1 }}
                />
              ))}
            </>
          )}
        </svg>

        <div
          className="absolute inset-0 pointer-events-none rounded-t-full"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%)",
          }}
        />
      </div>

      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: config.width,
          height: config.height * 0.25,
          background: "linear-gradient(180deg, #2a2520 0%, #1a1510 50%, #0a0805 100%)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {[0.2, 0.4, 0.6, 0.8].map((pos, i) => (
          <div
            key={i}
            className="absolute bottom-1 w-1 h-2 rounded-full"
            style={{
              left: `${pos * 100}%`,
              transform: "translateX(-50%)",
              background: "linear-gradient(180deg, #c0a060 0%, #806030 100%)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface TubeArrayProps {
  count?: number;
  type?: "triode" | "pentode" | "rectifier" | "mixed";
  size?: "small" | "medium" | "large";
  isOn?: boolean;
}

export function TubeArray({ count = 4, type = "mixed", size = "medium", isOn = true }: TubeArrayProps) {
  const types: ("triode" | "pentode" | "rectifier")[] = 
    type === "mixed" 
      ? Array.from({ length: count }, (_, i) => ["triode", "pentode", "rectifier"][i % 3] as any)
      : Array(count).fill(type);

  return (
    <div 
      className="flex gap-2 p-4 rounded-lg"
      style={{
        background: "linear-gradient(180deg, #1a1510 0%, #0a0805 100%)",
        boxShadow: "inset 2px 2px 8px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4)",
        border: "2px solid #3a2a1a",
      }}
      data-testid="widget-tube-array"
    >
      {types.map((t, i) => (
        <VacuumTube 
          key={i} 
          type={t} 
          size={size} 
          isOn={isOn} 
          intensity={0.7 + Math.random() * 0.3}
        />
      ))}
    </div>
  );
}

export default { NixieTube, NixieDisplay, MagicEyeTube, VacuumTube, TubeArray };
