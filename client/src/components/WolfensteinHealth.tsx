import { motion } from "framer-motion";

interface WolfensteinHealthProps {
  health: number;
  className?: string;
}

const HEALTH_FACES = [
  { threshold: 100, face: "😎", label: "Perfect" },
  { threshold: 80, face: "😊", label: "Great" },
  { threshold: 60, face: "😐", label: "OK" },
  { threshold: 40, face: "😟", label: "Hurt" },
  { threshold: 20, face: "😫", label: "Critical" },
  { threshold: 0, face: "💀", label: "Dead" },
];

function getHealthState(health: number) {
  for (const state of HEALTH_FACES) {
    if (health >= state.threshold) return state;
  }
  return HEALTH_FACES[HEALTH_FACES.length - 1];
}

function getHealthColor(health: number): string {
  if (health >= 80) return "text-green-400";
  if (health >= 60) return "text-lime-400";
  if (health >= 40) return "text-yellow-400";
  if (health >= 20) return "text-orange-400";
  return "text-red-400";
}

function getHealthGlow(health: number): string {
  if (health >= 80) return "shadow-[0_0_10px_rgba(74,222,128,0.5)]";
  if (health >= 60) return "shadow-[0_0_10px_rgba(163,230,53,0.5)]";
  if (health >= 40) return "shadow-[0_0_10px_rgba(250,204,21,0.5)]";
  if (health >= 20) return "shadow-[0_0_10px_rgba(251,146,60,0.5)]";
  return "shadow-[0_0_10px_rgba(248,113,113,0.5)]";
}

export function WolfensteinHealth({ health, className = "" }: WolfensteinHealthProps) {
  const state = getHealthState(health);
  const colorClass = getHealthColor(health);
  const glowClass = getHealthGlow(health);
  
  const healthBars = Math.ceil(health / 10);
  
  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      data-testid="wolfenstein-health"
    >
      <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 rounded-lg border border-white/10 p-2 min-w-[120px]">
        <div 
          className="absolute inset-0 rounded-lg opacity-20"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(0,0,0,0.3) 2px,
                rgba(0,0,0,0.3) 4px
              )
            `,
          }}
        />
        
        <div className="relative flex items-center gap-2">
          <motion.div 
            className={`text-2xl ${glowClass} rounded-lg p-1 bg-black/30`}
            animate={health < 40 ? { 
              scale: [1, 1.1, 1],
              rotate: health < 20 ? [-2, 2, -2] : 0
            } : {}}
            transition={{ 
              repeat: health < 40 ? Infinity : 0,
              duration: health < 20 ? 0.3 : 0.8
            }}
            style={{ imageRendering: "pixelated" }}
          >
            {state.face}
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-lg font-bold font-mono ${colorClass}`} style={{ textShadow: '2px 2px 0 #000' }}>
                {Math.round(health)}%
              </span>
            </div>
            
            <div className="flex gap-0.5">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${
                    i < healthBars 
                      ? i < 3 ? 'bg-red-500' : i < 6 ? 'bg-yellow-500' : 'bg-green-500'
                      : 'bg-zinc-700'
                  }`}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: i < healthBars ? 1 : 0.3 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ 
                    boxShadow: i < healthBars ? 
                      i < 3 ? '0 0 4px rgba(239,68,68,0.5)' : 
                      i < 6 ? '0 0 4px rgba(234,179,8,0.5)' : 
                      '0 0 4px rgba(34,197,94,0.5)' : 'none'
                  }}
                />
              ))}
            </div>
            
            <div className="text-[8px] font-mono text-zinc-500 uppercase mt-0.5 tracking-wider">
              {state.label}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function SystemHealthDashboard({ 
  cartridgeHealth = 100,
  connectionHealth = 100,
  assetsHealth = 100 
}: { 
  cartridgeHealth?: number;
  connectionHealth?: number;
  assetsHealth?: number;
}) {
  const overallHealth = Math.round((cartridgeHealth + connectionHealth + assetsHealth) / 3);
  
  return (
    <div className="flex items-center gap-3" data-testid="system-health-dashboard">
      <WolfensteinHealth health={overallHealth} />
      
      <div className="flex flex-col gap-1 text-[9px] font-mono">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${cartridgeHealth > 50 ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-zinc-400">CART</span>
          <span className={cartridgeHealth > 50 ? 'text-green-400' : 'text-red-400'}>{cartridgeHealth}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connectionHealth > 50 ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-zinc-400">CONN</span>
          <span className={connectionHealth > 50 ? 'text-green-400' : 'text-red-400'}>{connectionHealth}%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${assetsHealth > 50 ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-zinc-400">ASSETS</span>
          <span className={assetsHealth > 50 ? 'text-green-400' : 'text-red-400'}>{assetsHealth}%</span>
        </div>
      </div>
    </div>
  );
}
