import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Palette, 
  FolderOpen, 
  Gamepad2, 
  HelpCircle,
  Command,
  Maximize,
  Minimize,
  Zap,
  Box,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavNode {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  glowColor: string;
}

const NAV_NODES: NavNode[] = [
  { 
    id: "home", 
    label: "HOME", 
    icon: <Home className="w-5 h-5" />, 
    path: "/", 
    color: "#7c3aed",
    glowColor: "drop-shadow-[0_0_12px_rgba(124,58,237,0.8)]"
  },
  { 
    id: "design", 
    label: "DESIGN", 
    icon: <Palette className="w-5 h-5" />, 
    path: "/blu-prince", 
    color: "#ec4899",
    glowColor: "drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]"
  },
  { 
    id: "library", 
    label: "CARTRIDGES", 
    icon: <FolderOpen className="w-5 h-5" />, 
    path: "/library", 
    color: "#3b82f6",
    glowColor: "drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]"
  },
  { 
    id: "controller", 
    label: "CONTROLS", 
    icon: <Gamepad2 className="w-5 h-5" />, 
    path: "/controller", 
    color: "#22c55e",
    glowColor: "drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]"
  },
];

interface NeonPathNavProps {
  onCommandPaletteOpen?: () => void;
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

export function NeonPathNav({ 
  onCommandPaletteOpen, 
  onFullscreenToggle,
  isFullscreen = false 
}: NeonPathNavProps) {
  const [location] = useLocation();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const activeIndex = NAV_NODES.findIndex(n => {
    if (n.path === "/") return location === "/";
    return location.startsWith(n.path);
  });

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-50 h-16"
      data-testid="neon-path-nav"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-transparent backdrop-blur-sm" />
      
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
            <stop offset="25%" stopColor="#ec4899" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
            <stop offset="75%" stopColor="#22c55e" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.3" />
          </linearGradient>
          <filter id="neon-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <path
          d="M 0,32 Q 50,28 100,32 T 200,32 T 300,32 T 400,32 T 500,32 T 600,32 T 700,32 T 800,32 T 900,32 T 1000,32 T 1100,32 T 1200,32 T 1300,32 T 1400,32 T 1500,32 T 1600,32 T 1700,32 T 1800,32 T 1900,32 T 2000,32"
          fill="none"
          stroke="url(#neon-gradient)"
          strokeWidth="2"
          filter="url(#neon-glow)"
          className="animate-pulse"
        />
        
        <line
          x1="0"
          y1="63"
          x2="100%"
          y2="63"
          stroke="#7c3aed"
          strokeWidth="1"
          strokeOpacity="0.5"
        />
      </svg>

      <div className="relative h-full flex items-center justify-between px-4 max-w-7xl mx-auto">
        <Link href="/">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
            </div>
            <span className="font-pixel text-xl text-white tracking-wider hidden sm:block drop-shadow-[0_0_10px_rgba(124,58,237,0.8)]">
              TINGOS
            </span>
          </motion.div>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {NAV_NODES.map((node, index) => {
            const isActive = activeIndex === index;
            const isHovered = hoveredNode === node.id;
            
            return (
              <Link key={node.id} href={node.path}>
                <motion.button
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 min-h-11 touch-manipulation",
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  )}
                  style={{
                    color: isActive || isHovered ? node.color : undefined,
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid={`nav-${node.id}`}
                >
                  <span className={cn(
                    "transition-all duration-300",
                    (isActive || isHovered) && node.glowColor
                  )}>
                    {node.icon}
                  </span>
                  <span className="hidden lg:block text-xs font-bold tracking-wider">
                    {node.label}
                  </span>
                  
                  {isActive && (
                    <motion.div
                      layoutId="active-indicator"
                      className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: node.color }}
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-lg"
                      style={{ 
                        boxShadow: `0 0 20px ${node.color}40, inset 0 0 20px ${node.color}10` 
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  )}
                </motion.button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={onCommandPaletteOpen}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-purple-500/50 transition-all min-h-11 touch-manipulation"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-command-palette"
            title="Command Palette (Ctrl+K)"
          >
            <Command className="w-4 h-4" />
            <span className="hidden sm:block text-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">⌘K</kbd>
            </span>
          </motion.button>

          <motion.button
            onClick={onFullscreenToggle}
            className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-cyan-500/50 transition-all touch-manipulation"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(34,211,238,0.3)" }}
            whileTap={{ scale: 0.95 }}
            data-testid="button-fullscreen"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F)"}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

export default NeonPathNav;
