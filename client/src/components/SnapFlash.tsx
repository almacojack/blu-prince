import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SnapFlashProps {
  snapLineX: number | null;
  snapLineY: number | null;
  containerWidth: number;
  containerHeight: number;
}

export function SnapFlash({ snapLineX, snapLineY, containerWidth, containerHeight }: SnapFlashProps) {
  const [flashes, setFlashes] = useState<{ id: number; x: number | null; y: number | null }[]>([]);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (snapLineX !== null || snapLineY !== null) {
      const id = counter;
      setCounter(c => c + 1);
      setFlashes(prev => [...prev, { id, x: snapLineX, y: snapLineY }]);
      
      setTimeout(() => {
        setFlashes(prev => prev.filter(f => f.id !== id));
      }, 400);
    }
  }, [snapLineX, snapLineY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {flashes.map(flash => {
          const xPos = flash.x !== null 
            ? (flash.x >= containerWidth - 4 ? containerWidth - 4 : flash.x) 
            : null;
          const yPos = flash.y !== null 
            ? (flash.y >= containerHeight - 4 ? containerHeight - 4 : flash.y) 
            : null;
          
          return (
            <div key={flash.id}>
              {xPos !== null && (
                <motion.div
                  initial={{ opacity: 1, scaleY: 0.8 }}
                  animate={{ opacity: 0, scaleY: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute top-0 bottom-0"
                  style={{
                    left: xPos,
                    width: 4,
                    background: `linear-gradient(180deg, 
                      transparent 0%, 
                      #00ffff 10%, 
                      #ff00ff 30%, 
                      #00ff00 50%, 
                      #ff00ff 70%, 
                      #00ffff 90%, 
                      transparent 100%
                    )`,
                    boxShadow: `
                      0 0 10px #00ffff,
                      0 0 20px #ff00ff,
                      0 0 30px #00ff00,
                      0 0 40px #00ffff
                    `,
                    filter: 'blur(0.5px)',
                  }}
                />
              )}
              {yPos !== null && (
                <motion.div
                  initial={{ opacity: 1, scaleX: 0.8 }}
                  animate={{ opacity: 0, scaleX: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute left-0 right-0"
                  style={{
                    top: yPos,
                    height: 4,
                    background: `linear-gradient(90deg, 
                      transparent 0%, 
                      #00ffff 10%, 
                      #ff00ff 30%, 
                      #00ff00 50%, 
                      #ff00ff 70%, 
                      #00ffff 90%, 
                      transparent 100%
                    )`,
                    boxShadow: `
                      0 0 10px #00ffff,
                      0 0 20px #ff00ff,
                      0 0 30px #00ff00,
                      0 0 40px #00ffff
                    `,
                    filter: 'blur(0.5px)',
                  }}
                />
              )}
            </div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default SnapFlash;
