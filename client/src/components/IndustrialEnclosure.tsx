import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IndustrialEnclosureProps {
  children: ReactNode;
  variant?: "steel" | "brass" | "rusted" | "pipboy";
  className?: string;
  title?: string;
  statusIndicator?: "active" | "inactive" | "warning" | "error";
  statusText?: string;
  screws?: boolean;
  rivets?: boolean;
  weathered?: boolean;
}

function Screw({ position, variant = "steel" }: { position: string; variant?: string }) {
  const screwColors = {
    steel: "from-zinc-400 to-zinc-600",
    brass: "from-amber-400 to-amber-700", 
    rusted: "from-orange-400 to-orange-800",
    pipboy: "from-amber-500 to-amber-800",
  };
  
  return (
    <div 
      className={cn(
        "absolute w-3 h-3 rounded-full",
        "bg-gradient-to-br shadow-inner",
        screwColors[variant as keyof typeof screwColors] || screwColors.steel,
        position
      )}
      style={{
        boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.5), inset -1px -1px 1px rgba(255,255,255,0.2)",
      }}
    >
      <div 
        className="absolute inset-[3px] bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full"
        style={{
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.8)",
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[6px] h-[1px] bg-zinc-700"
        style={{ transform: "translate(-50%, -50%) rotate(45deg)" }}
      />
    </div>
  );
}

function Rivet({ position, variant = "steel" }: { position: string; variant?: string }) {
  const rivetColors = {
    steel: "from-zinc-300 to-zinc-500",
    brass: "from-amber-300 to-amber-600",
    rusted: "from-orange-300 to-orange-600",
    pipboy: "from-amber-400 to-amber-700",
  };
  
  return (
    <div 
      className={cn(
        "absolute w-2 h-2 rounded-full",
        "bg-gradient-to-br",
        rivetColors[variant as keyof typeof rivetColors] || rivetColors.steel,
        position
      )}
      style={{
        boxShadow: "1px 1px 2px rgba(0,0,0,0.4), inset -1px -1px 1px rgba(0,0,0,0.3), inset 1px 1px 1px rgba(255,255,255,0.3)",
      }}
    />
  );
}

export function IndustrialEnclosure({
  children,
  variant = "pipboy",
  className,
  title,
  statusIndicator,
  statusText,
  screws = true,
  rivets = false,
  weathered = true,
}: IndustrialEnclosureProps) {
  const variantStyles = {
    steel: {
      outer: "from-zinc-700 via-zinc-600 to-zinc-800",
      inner: "from-zinc-800 via-zinc-900 to-zinc-950",
      border: "border-zinc-500/50",
      accent: "border-zinc-400/30",
      glow: "",
    },
    brass: {
      outer: "from-amber-700 via-amber-600 to-amber-800",
      inner: "from-amber-900/80 via-zinc-900 to-zinc-950",
      border: "border-amber-500/50",
      accent: "border-amber-400/30",
      glow: "",
    },
    rusted: {
      outer: "from-orange-800 via-orange-700 to-orange-900",
      inner: "from-orange-950/80 via-zinc-900 to-zinc-950",
      border: "border-orange-600/50",
      accent: "border-orange-500/30",
      glow: "",
    },
    pipboy: {
      outer: "from-amber-800 via-amber-700 to-amber-900",
      inner: "from-[#1a1a0f] via-[#0f0f08] to-[#0a0a05]",
      border: "border-amber-600/60",
      accent: "border-amber-500/40",
      glow: "shadow-[0_0_15px_rgba(217,119,6,0.2),inset_0_0_30px_rgba(0,0,0,0.8)]",
    },
  };
  
  const styles = variantStyles[variant];
  
  const statusColors = {
    active: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]",
    inactive: "bg-zinc-500",
    warning: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse",
  };

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden",
        className
      )}
      data-testid="industrial-enclosure"
    >
      {/* Outer metal frame with beveled edges */}
      <div 
        className={cn(
          "absolute inset-0 rounded-lg",
          "bg-gradient-to-br",
          styles.outer,
        )}
        style={{
          boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.1), inset -2px -2px 4px rgba(0,0,0,0.4)",
        }}
      />
      
      {/* Weathered/rust texture overlay */}
      {weathered && (
        <div 
          className="absolute inset-0 rounded-lg opacity-30 mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      )}
      
      {/* Inner recessed panel */}
      <div 
        className={cn(
          "relative m-1.5 rounded-md",
          "bg-gradient-to-br",
          styles.inner,
          "border",
          styles.accent,
          styles.glow,
        )}
        style={{
          boxShadow: "inset 3px 3px 6px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(255,255,255,0.05)",
        }}
      >
        {/* Title bar */}
        {(title || statusIndicator) && (
          <div 
            className="flex items-center justify-between px-3 py-1.5 border-b border-amber-900/50"
            style={{
              background: "linear-gradient(180deg, rgba(139,69,19,0.3) 0%, rgba(0,0,0,0.4) 100%)",
            }}
          >
            {title && (
              <span 
                className="text-[10px] font-mono font-bold uppercase tracking-wider"
                style={{
                  color: variant === "pipboy" ? "#d4a574" : "#888",
                  textShadow: variant === "pipboy" ? "0 0 8px rgba(217,119,6,0.5)" : "none",
                }}
              >
                {title}
              </span>
            )}
            {statusIndicator && (
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", statusColors[statusIndicator])} />
                {statusText && (
                  <span 
                    className="text-[9px] font-mono uppercase"
                    style={{
                      color: statusIndicator === "active" ? "#4ade80" : 
                             statusIndicator === "warning" ? "#fbbf24" :
                             statusIndicator === "error" ? "#ef4444" : "#888",
                    }}
                  >
                    {statusText}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Content area */}
        <div className="relative p-2">
          {children}
        </div>
      </div>
      
      {/* Corner screws */}
      {screws && (
        <>
          <Screw position="top-1 left-1" variant={variant} />
          <Screw position="top-1 right-1" variant={variant} />
          <Screw position="bottom-1 left-1" variant={variant} />
          <Screw position="bottom-1 right-1" variant={variant} />
        </>
      )}
      
      {/* Edge rivets (optional) */}
      {rivets && (
        <>
          <Rivet position="top-1 left-1/2 -translate-x-1/2" variant={variant} />
          <Rivet position="bottom-1 left-1/2 -translate-x-1/2" variant={variant} />
          <Rivet position="left-1 top-1/2 -translate-y-1/2" variant={variant} />
          <Rivet position="right-1 top-1/2 -translate-y-1/2" variant={variant} />
        </>
      )}
      
      {/* Outer border highlight */}
      <div 
        className={cn(
          "absolute inset-0 rounded-lg pointer-events-none",
          "border-2",
          styles.border,
        )}
      />
    </div>
  );
}

export default IndustrialEnclosure;
