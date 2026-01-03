import { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollableButtonPanelProps {
  children: ReactNode;
  height?: number;
  className?: string;
}

export function ScrollableButtonPanel({ 
  children, 
  height = 36,
  className = "" 
}: ScrollableButtonPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      const resizeObserver = new ResizeObserver(checkScroll);
      resizeObserver.observe(el);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        resizeObserver.disconnect();
      };
    }
  }, [checkScroll, children]);

  const scrollBy = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -120 : 120;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <div 
      className={`relative flex items-center ${className}`} 
      style={{ height }}
      data-testid="scrollable-button-panel"
    >
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.15 }}
            onClick={() => scrollBy("left")}
            className="absolute left-0 z-20 flex items-center justify-center bg-gradient-to-r from-black/90 via-black/70 to-transparent pl-1 pr-4"
            style={{ height }}
            data-testid="scroll-left-button"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors active:scale-95">
              <ChevronLeft className="w-5 h-5 text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <div
        ref={scrollRef}
        className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
        style={{ 
          height,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          paddingLeft: canScrollLeft ? 44 : 0,
          paddingRight: canScrollRight ? 44 : 0,
        }}
      >
        <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        {children}
      </div>

      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            onClick={() => scrollBy("right")}
            className="absolute right-0 z-20 flex items-center justify-center bg-gradient-to-l from-black/90 via-black/70 to-transparent pr-1 pl-4"
            style={{ height }}
            data-testid="scroll-right-button"
          >
            <div className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-colors active:scale-95">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
