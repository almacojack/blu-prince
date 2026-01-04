import { useState, useEffect } from 'react';

/**
 * Hook to detect user's preference for reduced motion
 * and provide performance optimization flags
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLowPowerDevice, setIsLowPowerDevice] = useState(false);
  
  useEffect(() => {
    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Detect low power devices by checking hardware concurrency and memory
    const cores = navigator.hardwareConcurrency || 4;
    // @ts-expect-error - deviceMemory is not in all browsers
    const memory = navigator.deviceMemory || 8;
    
    // Consider low power if < 4 cores or < 4GB RAM
    setIsLowPowerDevice(cores < 4 || memory < 4);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);
  
  return {
    prefersReducedMotion,
    isLowPowerDevice,
    shouldReduceAnimations: prefersReducedMotion || isLowPowerDevice,
  };
}

/**
 * Get animation config based on reduced motion preference
 */
export function getMotionConfig(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      transition: { duration: 0 },
      initial: false,
      animate: false,
    };
  }
  
  return {
    transition: { duration: 0.2, ease: 'easeOut' },
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  };
}

/**
 * Framer Motion variants for reduced motion
 */
export const reducedMotionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
};

export const normalMotionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
