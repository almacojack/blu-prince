import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface PerformanceSettings {
  enable3DBackgrounds: boolean;
  enableAnimations: boolean;
  enableParticles: boolean;
  enableShadows: boolean;
  reduceMotion: boolean;
  performanceMode: 'high' | 'balanced' | 'low';
}

interface DeviceCapabilities {
  cores: number;
  memory: number;
  isMobile: boolean;
  isLowPower: boolean;
  screenSize: 'small' | 'medium' | 'large';
  pixelRatio: number;
  gpuTier: 'low' | 'medium' | 'high';
}

interface PerformanceContextValue {
  settings: PerformanceSettings;
  device: DeviceCapabilities;
  updateSettings: (updates: Partial<PerformanceSettings>) => void;
  setPerformanceMode: (mode: 'high' | 'balanced' | 'low') => void;
  resetToAutoDetected: () => void;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

const STORAGE_KEY = 'tingos-performance-settings';

function detectDeviceCapabilities(): DeviceCapabilities {
  const cores = navigator.hardwareConcurrency || 4;
  // @ts-expect-error - deviceMemory not in all browsers
  const memory = navigator.deviceMemory || 8;
  
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  const width = window.innerWidth;
  const screenSize: 'small' | 'medium' | 'large' = 
    width < 768 ? 'small' : 
    width < 1200 ? 'medium' : 'large';
  
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Estimate GPU tier based on pixel ratio and cores
  // Low-end: RPi, older phones, budget laptops
  // Medium: Most laptops, mid-range phones
  // High: Gaming PCs, high-end devices
  const isLowPower = cores < 4 || memory < 4 || (isMobile && cores < 6);
  const gpuTier: 'low' | 'medium' | 'high' = 
    isLowPower ? 'low' :
    (cores >= 8 && memory >= 16 && pixelRatio >= 2) ? 'high' : 'medium';
  
  return {
    cores,
    memory,
    isMobile,
    isLowPower,
    screenSize,
    pixelRatio,
    gpuTier,
  };
}

function getDefaultSettings(device: DeviceCapabilities): PerformanceSettings {
  // Check OS-level reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  if (device.gpuTier === 'low' || prefersReducedMotion) {
    return {
      enable3DBackgrounds: false,
      enableAnimations: !prefersReducedMotion,
      enableParticles: false,
      enableShadows: false,
      reduceMotion: prefersReducedMotion,
      performanceMode: 'low',
    };
  }
  
  if (device.gpuTier === 'medium') {
    return {
      enable3DBackgrounds: true,
      enableAnimations: true,
      enableParticles: true,
      enableShadows: false,
      reduceMotion: false,
      performanceMode: 'balanced',
    };
  }
  
  // High performance
  return {
    enable3DBackgrounds: true,
    enableAnimations: true,
    enableParticles: true,
    enableShadows: true,
    reduceMotion: false,
    performanceMode: 'high',
  };
}

function getSettingsForMode(mode: 'high' | 'balanced' | 'low'): Partial<PerformanceSettings> {
  switch (mode) {
    case 'low':
      return {
        enable3DBackgrounds: false,
        enableAnimations: false,
        enableParticles: false,
        enableShadows: false,
        performanceMode: 'low',
      };
    case 'balanced':
      return {
        enable3DBackgrounds: true,
        enableAnimations: true,
        enableParticles: true,
        enableShadows: false,
        performanceMode: 'balanced',
      };
    case 'high':
      return {
        enable3DBackgrounds: true,
        enableAnimations: true,
        enableParticles: true,
        enableShadows: true,
        performanceMode: 'high',
      };
  }
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [device, setDevice] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const [settings, setSettings] = useState<PerformanceSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return getDefaultSettings(detectDeviceCapabilities());
      }
    }
    return getDefaultSettings(detectDeviceCapabilities());
  });

  // Re-detect on resize (for screen size changes)
  useEffect(() => {
    const handleResize = () => {
      setDevice(detectDeviceCapabilities());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Listen for reduced motion changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSettings(prev => ({ ...prev, reduceMotion: e.matches }));
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updateSettings = useCallback((updates: Partial<PerformanceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const setPerformanceMode = useCallback((mode: 'high' | 'balanced' | 'low') => {
    setSettings(prev => ({ ...prev, ...getSettingsForMode(mode) }));
  }, []);

  const resetToAutoDetected = useCallback(() => {
    setSettings(getDefaultSettings(device));
  }, [device]);

  return (
    <PerformanceContext.Provider value={{
      settings,
      device,
      updateSettings,
      setPerformanceMode,
      resetToAutoDetected,
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within PerformanceProvider');
  }
  return context;
}

// HOC to conditionally render 3D backgrounds
export function withPerformanceCheck<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    const { settings } = usePerformance();
    
    if (!settings.enable3DBackgrounds) {
      return fallback ? <>{fallback}</> : null;
    }
    
    return <Component {...props} />;
  };
}
