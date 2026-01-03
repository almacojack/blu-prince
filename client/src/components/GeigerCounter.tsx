import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface GeigerCounterProps {
  radiationLevel?: number;
  autoAnimate?: boolean;
  variant?: "classic" | "military" | "steampunk";
  size?: "small" | "medium" | "large";
  showCPM?: boolean;
  onRadiationChange?: (level: number) => void;
}

export function GeigerCounter({
  radiationLevel = 0.1,
  autoAnimate = true,
  variant = "classic",
  size = "medium",
  showCPM = true,
  onRadiationChange,
}: GeigerCounterProps) {
  const [level, setLevel] = useState(radiationLevel);
  const [clicks, setClicks] = useState<number[]>([]);
  const [cpm, setCpm] = useState(0);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const sizeConfig = {
    small: { width: 180, height: 100, meterHeight: 50 },
    medium: { width: 280, height: 160, meterHeight: 80 },
    large: { width: 380, height: 220, meterHeight: 110 },
  };

  const variantStyles = {
    classic: {
      body: "linear-gradient(180deg, #3a3a3a 0%, #1a1a1a 50%, #2a2a2a 100%)",
      meter: "linear-gradient(180deg, #f5f0e0 0%, #e8e0c8 100%)",
      accent: "#c4a000",
      text: "#1a1a1a",
      glow: "rgba(255, 200, 50, 0.3)",
    },
    military: {
      body: "linear-gradient(180deg, #4a5548 0%, #2a3228 50%, #3a4238 100%)",
      meter: "linear-gradient(180deg, #d4d8c8 0%, #b8c0a8 100%)",
      accent: "#5a7848",
      text: "#2a3228",
      glow: "rgba(100, 255, 100, 0.2)",
    },
    steampunk: {
      body: "linear-gradient(180deg, #8b5a2b 0%, #4a3219 50%, #5a3a1a 100%)",
      meter: "linear-gradient(180deg, #d4a574 0%, #b8956a 100%)",
      accent: "#cd7f32",
      text: "#2a1a0a",
      glow: "rgba(255, 150, 50, 0.4)",
    },
  };

  const styles = variantStyles[variant];
  const config = sizeConfig[size];

  const playClick = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800 + Math.random() * 400;
    osc.type = "square";
    gain.gain.value = 0.03;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  };

  useEffect(() => {
    if (!autoAnimate) {
      setLevel(radiationLevel);
      return;
    }

    const animate = () => {
      phaseRef.current += 0.02;
      const baseLevel = radiationLevel;
      const wave = Math.sin(phaseRef.current) * 0.1;
      const spike = Math.random() < 0.05 ? Math.random() * 0.3 : 0;
      const newLevel = Math.max(0, Math.min(1, baseLevel + wave + spike));
      setLevel(newLevel);
      onRadiationChange?.(newLevel);

      const clickProbability = newLevel * 0.3;
      if (Math.random() < clickProbability) {
        setClicks(prev => [...prev.slice(-20), Date.now()]);
        playClick();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [autoAnimate, radiationLevel, onRadiationChange]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const recentClicks = clicks.filter(t => now - t < 60000);
      setCpm(recentClicks.length);
      if (recentClicks.length !== clicks.length) {
        setClicks(recentClicks);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [clicks]);

  const needleAngle = -60 + level * 120;
  const dangerLevel = level > 0.7 ? "DANGER" : level > 0.4 ? "CAUTION" : "SAFE";
  const dangerColor = level > 0.7 ? "#ff0000" : level > 0.4 ? "#ffaa00" : "#00ff00";

  return (
    <div
      className="relative rounded-lg overflow-hidden"
      style={{
        width: config.width,
        background: styles.body,
        boxShadow: `
          inset 2px 2px 4px rgba(255,255,255,0.1),
          inset -2px -2px 4px rgba(0,0,0,0.3),
          0 8px 24px rgba(0,0,0,0.5),
          0 0 ${level * 30}px ${styles.glow}
        `,
        border: `2px solid ${styles.accent}`,
      }}
      data-testid="widget-geiger-counter"
    >
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <div
            className="text-[10px] font-bold tracking-widest uppercase"
            style={{ color: styles.accent }}
          >
            GEIGER-MÜLLER
          </div>
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{
              background: dangerColor,
              boxShadow: `0 0 8px ${dangerColor}, 0 0 16px ${dangerColor}`,
            }}
          />
        </div>

        <div
          className="relative rounded overflow-hidden mx-auto"
          style={{
            width: config.width - 24,
            height: config.meterHeight,
            background: styles.meter,
            boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <svg
            viewBox="0 0 200 80"
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <linearGradient id="dangerZone" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00aa00" />
                <stop offset="40%" stopColor="#aaaa00" />
                <stop offset="70%" stopColor="#ff8800" />
                <stop offset="100%" stopColor="#ff0000" />
              </linearGradient>
            </defs>

            <path
              d="M 20 70 A 80 80 0 0 1 180 70"
              fill="none"
              stroke="url(#dangerZone)"
              strokeWidth="8"
              opacity="0.3"
            />

            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((pos, i) => {
              const angle = -150 + pos * 120;
              const rad = (angle * Math.PI) / 180;
              const x1 = 100 + Math.cos(rad) * 55;
              const y1 = 70 + Math.sin(rad) * 55;
              const x2 = 100 + Math.cos(rad) * 65;
              const y2 = 70 + Math.sin(rad) * 65;
              const labelX = 100 + Math.cos(rad) * 45;
              const labelY = 70 + Math.sin(rad) * 45;
              const labels = ["0", "0.2", "0.4", "0.6", "0.8", "1.0"];
              return (
                <g key={i}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={styles.text}
                    strokeWidth={1.5}
                  />
                  <text
                    x={labelX} y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={styles.text}
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    {labels[i]}
                  </text>
                </g>
              );
            })}

            <text
              x="100" y="55"
              textAnchor="middle"
              fill={styles.text}
              fontSize="8"
              fontFamily="serif"
              fontWeight="bold"
            >
              mR/hr
            </text>

            <text
              x="100" y="30"
              textAnchor="middle"
              fill={styles.text}
              fontSize="6"
              fontFamily="serif"
              opacity="0.6"
            >
              RADIATION INTENSITY
            </text>

            <circle cx="100" cy="70" r="4" fill={styles.text} />
            
            <motion.line
              x1="100"
              y1="70"
              x2="100"
              y2="20"
              stroke={styles.text}
              strokeWidth="2"
              strokeLinecap="round"
              style={{ transformOrigin: "100px 70px" }}
              animate={{ rotate: needleAngle }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
            />
            <motion.circle
              cx="100"
              cy="22"
              r="3"
              fill="#ff4444"
              style={{ transformOrigin: "100px 70px" }}
              animate={{ rotate: needleAngle }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
            />
          </svg>

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)",
              borderRadius: "inherit",
            }}
          />
        </div>

        {showCPM && (
          <div className="mt-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={{
                  background: dangerColor,
                  color: level > 0.4 ? "#000" : "#fff",
                }}
              >
                {dangerLevel}
              </div>
            </div>
            <div
              className="text-right font-mono text-sm"
              style={{ color: styles.accent }}
            >
              <span className="text-[8px] opacity-60">CPM: </span>
              <span className="font-bold">{cpm}</span>
            </div>
          </div>
        )}

        <div className="mt-2 flex gap-0.5 h-2 overflow-hidden rounded">
          {Array.from({ length: 20 }).map((_, i) => {
            const isActive = clicks.slice(-20)[i];
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-75"
                style={{
                  background: isActive
                    ? `linear-gradient(180deg, ${dangerColor}, ${dangerColor}88)`
                    : "rgba(0,0,0,0.3)",
                  boxShadow: isActive ? `0 0 4px ${dangerColor}` : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      {variant === "steampunk" && (
        <>
          {[
            { top: 6, left: 6 },
            { top: 6, right: 6 },
            { bottom: 6, left: 6 },
            { bottom: 6, right: 6 },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                ...pos,
                background: "radial-gradient(circle at 30% 30%, #cd9b4a, #8b6914)",
                boxShadow: "inset 1px 1px 2px rgba(255,255,255,0.3), 1px 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="absolute inset-1 rounded-full"
                style={{
                  background: "linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.3) 100%)",
                }}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default GeigerCounter;
