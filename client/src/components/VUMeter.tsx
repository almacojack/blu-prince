import { useRef, useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

interface VUMeterProps {
  level: number;
  isActive?: boolean;
  variant?: "classic" | "steampunk" | "neon";
  size?: "sm" | "md" | "lg";
  label?: string;
  showPeakLED?: boolean;
  className?: string;
}

export function VUMeter({
  level,
  isActive = true,
  variant = "classic",
  size = "md",
  label = "VU",
  showPeakLED = true,
  className,
}: VUMeterProps) {
  const [peakLevel, setPeakLevel] = useState(0);
  const peakDecayRef = useRef<NodeJS.Timeout | null>(null);
  
  const needleRotation = useMotionValue(-45);
  const springRotation = useSpring(needleRotation, {
    stiffness: 300,
    damping: 20,
    mass: 0.5,
  });

  useEffect(() => {
    const clampedLevel = Math.max(0, Math.min(1, level));
    const targetRotation = -45 + (clampedLevel * 90);
    needleRotation.set(targetRotation);
    
    if (clampedLevel > peakLevel) {
      setPeakLevel(clampedLevel);
      if (peakDecayRef.current) clearTimeout(peakDecayRef.current);
      peakDecayRef.current = setTimeout(() => {
        setPeakLevel(0);
      }, 1500);
    }
    
    return () => {
      if (peakDecayRef.current) clearTimeout(peakDecayRef.current);
    };
  }, [level, needleRotation, peakLevel]);

  const sizeClasses = {
    sm: "w-24 h-16",
    md: "w-36 h-24",
    lg: "w-48 h-32",
  };

  const variantStyles = {
    classic: {
      faceGradient: "linear-gradient(180deg, #f5f0e6 0%, #e8e0d0 50%, #d4c8b8 100%)",
      bezelGradient: "linear-gradient(135deg, #2a2520 0%, #1a1512 50%, #0f0d0a 100%)",
      needleColor: "#1a1a1a",
      markingsColor: "#2a2520",
      textColor: "#3a3530",
      redZoneColor: "#cc3333",
      glowColor: "none",
    },
    steampunk: {
      faceGradient: "linear-gradient(180deg, #d4a574 0%, #b8956c 50%, #8b7355 100%)",
      bezelGradient: "linear-gradient(135deg, #8b5a2b 0%, #654321 50%, #4a3219 100%)",
      needleColor: "#1a0f05",
      markingsColor: "#4a3219",
      textColor: "#3d2817",
      redZoneColor: "#8b0000",
      glowColor: "0 0 10px rgba(217,119,6,0.3)",
    },
    neon: {
      faceGradient: "linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 50%, #0a0a12 100%)",
      bezelGradient: "linear-gradient(135deg, #2a2a4a 0%, #1a1a2e 50%, #0f0f1a 100%)",
      needleColor: "#00ffff",
      markingsColor: "#00aaaa",
      textColor: "#00cccc",
      redZoneColor: "#ff0066",
      glowColor: "0 0 20px rgba(0,255,255,0.3)",
    },
  };

  const styles = variantStyles[variant];
  const isPeaking = peakLevel > 0.85;

  const dbLabels = ["-20", "-10", "-7", "-5", "-3", "0", "+3"];
  const dbPositions = [0, 0.25, 0.4, 0.55, 0.7, 0.85, 1];

  return (
    <div 
      className={cn("relative", sizeClasses[size], className)}
      data-testid="vu-meter"
    >
      {/* Outer bezel */}
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: styles.bezelGradient,
          boxShadow: `
            inset 2px 2px 4px rgba(255,255,255,0.1),
            inset -2px -2px 4px rgba(0,0,0,0.4),
            0 4px 8px rgba(0,0,0,0.5),
            ${styles.glowColor}
          `,
        }}
      />
      
      {/* Weathering texture */}
      {variant === "steampunk" && (
        <div 
          className="absolute inset-0 rounded-lg opacity-20 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
      
      {/* Corner screws for steampunk */}
      {variant === "steampunk" && (
        <>
          {["top-0.5 left-0.5", "top-0.5 right-0.5", "bottom-0.5 left-0.5", "bottom-0.5 right-0.5"].map((pos, i) => (
            <div 
              key={i}
              className={`absolute w-2 h-2 rounded-full ${pos}`}
              style={{
                background: "linear-gradient(135deg, #b8860b 0%, #8b6914 50%, #654321 100%)",
                boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.3), inset -1px -1px 1px rgba(0,0,0,0.5)",
              }}
            />
          ))}
        </>
      )}
      
      {/* Meter face */}
      <div 
        className="absolute inset-1.5 rounded-md overflow-hidden"
        style={{
          background: styles.faceGradient,
          boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.3)",
        }}
      >
        {/* Scale arc background */}
        <svg 
          viewBox="0 0 100 60" 
          className="absolute inset-0 w-full h-full"
          style={{ overflow: "visible" }}
        >
          {/* Red zone arc */}
          <path
            d="M 85 55 A 40 40 0 0 0 70 20"
            fill="none"
            stroke={styles.redZoneColor}
            strokeWidth="8"
            opacity="0.3"
          />
          
          {/* Scale markings */}
          {dbPositions.map((pos, i) => {
            const angle = -45 + (pos * 90);
            const radians = (angle * Math.PI) / 180;
            const innerRadius = 32;
            const outerRadius = 38;
            const x1 = 50 + Math.cos(radians) * innerRadius;
            const y1 = 55 + Math.sin(radians) * innerRadius;
            const x2 = 50 + Math.cos(radians) * outerRadius;
            const y2 = 55 + Math.sin(radians) * outerRadius;
            const labelRadius = 26;
            const labelX = 50 + Math.cos(radians) * labelRadius;
            const labelY = 55 + Math.sin(radians) * labelRadius;
            
            return (
              <g key={i}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={pos >= 0.85 ? styles.redZoneColor : styles.markingsColor}
                  strokeWidth={pos >= 0.7 ? 1.5 : 1}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={pos >= 0.85 ? styles.redZoneColor : styles.textColor}
                  fontSize="6"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {dbLabels[i]}
                </text>
              </g>
            );
          })}
          
          {/* Minor tick marks */}
          {Array.from({ length: 21 }).map((_, i) => {
            const pos = i / 20;
            const angle = -45 + (pos * 90);
            const radians = (angle * Math.PI) / 180;
            const innerRadius = 35;
            const outerRadius = 38;
            const x1 = 50 + Math.cos(radians) * innerRadius;
            const y1 = 55 + Math.sin(radians) * innerRadius;
            const x2 = 50 + Math.cos(radians) * outerRadius;
            const y2 = 55 + Math.sin(radians) * outerRadius;
            
            return (
              <line
                key={`tick-${i}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={pos >= 0.85 ? styles.redZoneColor : styles.markingsColor}
                strokeWidth={0.5}
                opacity={0.6}
              />
            );
          })}
          
          {/* VU label */}
          <text
            x="50"
            y="38"
            textAnchor="middle"
            fill={styles.textColor}
            fontSize="8"
            fontFamily="serif"
            fontWeight="bold"
            fontStyle="italic"
          >
            {label}
          </text>
          
          {/* Needle pivot */}
          <circle
            cx="50"
            cy="55"
            r="4"
            fill={variant === "neon" ? "#1a1a2e" : "#2a2520"}
            stroke={variant === "neon" ? "#00aaaa" : "#1a1512"}
            strokeWidth="1"
          />
        </svg>
        
        {/* Animated needle */}
        <motion.div
          className="absolute bottom-1 left-1/2"
          style={{
            width: "2px",
            height: size === "lg" ? "70%" : size === "md" ? "65%" : "60%",
            background: variant === "neon" 
              ? `linear-gradient(180deg, ${styles.needleColor} 0%, transparent 100%)`
              : styles.needleColor,
            transformOrigin: "bottom center",
            marginLeft: "-1px",
            rotate: springRotation,
            boxShadow: variant === "neon" ? `0 0 8px ${styles.needleColor}` : "none",
          }}
        >
          {/* Needle tip */}
          <div 
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: `8px solid ${styles.needleColor}`,
            }}
          />
        </motion.div>
      </div>
      
      {/* Peak LED indicator */}
      {showPeakLED && (
        <div 
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full border",
            isPeaking ? "animate-pulse" : ""
          )}
          style={{
            background: isPeaking 
              ? variant === "neon" ? "#ff0066" : "#ff3333"
              : variant === "neon" ? "#330011" : "#331111",
            borderColor: isPeaking 
              ? variant === "neon" ? "#ff0066" : "#ff3333"
              : "#333",
            boxShadow: isPeaking 
              ? `0 0 10px ${variant === "neon" ? "#ff0066" : "#ff3333"}`
              : "none",
          }}
        />
      )}
      
      {/* Glass reflection */}
      <div 
        className="absolute inset-1.5 rounded-md pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)",
        }}
      />
    </div>
  );
}

interface StereoVUMeterProps {
  leftLevel: number;
  rightLevel: number;
  isActive?: boolean;
  variant?: "classic" | "steampunk" | "neon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StereoVUMeter({
  leftLevel,
  rightLevel,
  isActive = true,
  variant = "steampunk",
  size = "md",
  className,
}: StereoVUMeterProps) {
  return (
    <div className={cn("flex gap-2", className)} data-testid="stereo-vu-meter">
      <VUMeter 
        level={leftLevel} 
        isActive={isActive} 
        variant={variant} 
        size={size}
        label="L"
      />
      <VUMeter 
        level={rightLevel} 
        isActive={isActive} 
        variant={variant} 
        size={size}
        label="R"
      />
    </div>
  );
}

interface AnimatedVUMeterProps {
  isPlaying: boolean;
  variant?: "classic" | "steampunk" | "neon";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AnimatedVUMeter({
  isPlaying,
  variant = "steampunk",
  size = "md",
  className,
}: AnimatedVUMeterProps) {
  const [leftLevel, setLeftLevel] = useState(0);
  const [rightLevel, setRightLevel] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setLeftLevel(0);
      setRightLevel(0);
      return;
    }

    let phase = 0;
    const animate = () => {
      phase += 0.05;
      const baseLevel = 0.4 + Math.sin(phase * 2) * 0.15;
      const variation = Math.random() * 0.3;
      
      setLeftLevel(Math.min(1, baseLevel + variation + Math.sin(phase * 3) * 0.1));
      setRightLevel(Math.min(1, baseLevel + variation + Math.cos(phase * 2.5) * 0.1));
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <StereoVUMeter
      leftLevel={leftLevel}
      rightLevel={rightLevel}
      isActive={isPlaying}
      variant={variant}
      size={size}
      className={className}
    />
  );
}

export default VUMeter;
