import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

interface AtariResetKnobProps {
  onReset: () => void;
  disabled?: boolean;
  label?: string;
}

export function AtariResetKnob({ onReset, disabled = false, label = "RESET" }: AtariResetKnobProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    
    setIsPressed(true);
    
    setTimeout(() => {
      onReset();
      setTimeout(() => setIsPressed(false), 150);
    }, 100);
  }, [onReset, disabled]);

  return (
    <motion.button
      className="relative flex flex-col items-center gap-1 px-3 py-1 group"
      onClick={handleClick}
      disabled={disabled}
      whileHover={{ scale: 1.02 }}
      data-testid="button-reset-fsm"
      title="Reset FSM to initial state"
    >
      <div className="relative">
        <div 
          className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(255,100,50,0.3) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />
        
        <div className="relative w-12 h-14 flex flex-col items-center justify-end">
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-4 rounded-t-sm"
            style={{
              background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.5)',
            }}
          />
          
          <motion.div
            className="relative w-8 h-10 rounded-sm cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #3a3a3a 0%, #222 30%, #1a1a1a 100%)',
              boxShadow: isPressed 
                ? 'inset 0 2px 6px rgba(0,0,0,0.8), 0 1px 2px rgba(255,255,255,0.05)'
                : '0 4px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)',
            }}
            animate={{ 
              y: isPressed ? 6 : 0,
              scaleY: isPressed ? 0.85 : 1,
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 20,
              mass: 0.5,
            }}
          >
            <div 
              className="absolute inset-x-1 top-1 bottom-1 rounded-sm"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
              }}
            />
            
            <div 
              className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, #444 0%, #222 100%)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
              }}
            >
              <RotateCcw className="w-2.5 h-2.5 text-orange-400/70" />
            </div>
            
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-0.5 h-2 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      <span 
        className="font-pixel text-[6px] tracking-[0.2em] text-orange-400/80 uppercase"
        style={{ textShadow: '0 0 4px rgba(255,100,50,0.5)' }}
      >
        {label}
      </span>
    </motion.button>
  );
}

export function AtariWoodgrainBar({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="absolute inset-0 rounded-lg overflow-hidden"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              transparent 18px,
              rgba(0,0,0,0.4) 18px,
              rgba(0,0,0,0.4) 22px
            ),
            linear-gradient(
              180deg,
              #5c3d2e 0%,
              #8b5a3c 15%,
              #6b4423 30%,
              #8b5a3c 45%,
              #5c3d2e 60%,
              #7a4a2f 75%,
              #5c3d2e 100%
            )
          `,
          backgroundSize: '40px 100%, 100% 100%',
        }}
      />
      
      <div 
        className="absolute inset-0 rounded-lg"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 2px,
              rgba(139,90,60,0.15) 2px,
              rgba(139,90,60,0.15) 4px
            )
          `,
          mixBlendMode: 'overlay',
        }}
      />
      
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
        }}
      />
      
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-lg"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
        }}
      />
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
