import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type QualityLevel = 'low' | 'medium' | 'high';
export type CameraMode = 'perspective' | 'orthographic';

export interface QualityPreset {
  shadows: boolean;
  shadowMapSize: number;
  antialias: boolean;
  pixelRatio: number;
  maxLights: number;
  postProcessing: boolean;
  environmentMap: boolean;
  flatShading: boolean;
  wireframe: boolean;
  maxDrawCalls: number;
  lodBias: number;
  textureQuality: 'low' | 'medium' | 'high';
  particleCount: number;
  physicsIterations: number;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualityPreset> = {
  low: {
    shadows: false,
    shadowMapSize: 512,
    antialias: false,
    pixelRatio: 0.75,
    maxLights: 2,
    postProcessing: false,
    environmentMap: false,
    flatShading: true,
    wireframe: false,
    maxDrawCalls: 100,
    lodBias: 2,
    textureQuality: 'low',
    particleCount: 50,
    physicsIterations: 4,
  },
  medium: {
    shadows: true,
    shadowMapSize: 1024,
    antialias: true,
    pixelRatio: 1,
    maxLights: 4,
    postProcessing: false,
    environmentMap: true,
    flatShading: false,
    wireframe: false,
    maxDrawCalls: 500,
    lodBias: 1,
    textureQuality: 'medium',
    particleCount: 200,
    physicsIterations: 8,
  },
  high: {
    shadows: true,
    shadowMapSize: 2048,
    antialias: true,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    maxLights: 8,
    postProcessing: true,
    environmentMap: true,
    flatShading: false,
    wireframe: false,
    maxDrawCalls: 2000,
    lodBias: 0,
    textureQuality: 'high',
    particleCount: 1000,
    physicsIterations: 16,
  },
};

export interface PerformanceState {
  quality: QualityLevel;
  cameraMode: CameraMode;
  preset: QualityPreset;
  fps: number;
  drawCalls: number;
  triangles: number;
  autoAdjust: boolean;
}

interface PerformanceContextType {
  state: PerformanceState;
  setQuality: (level: QualityLevel) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  setAutoAdjust: (enabled: boolean) => void;
  updateStats: (fps: number, drawCalls: number, triangles: number) => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

const STORAGE_KEY = 'tingos_performance_settings';

function loadSettings(): { quality: QualityLevel; cameraMode: CameraMode; autoAdjust: boolean } {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
  }
  return { quality: 'medium', cameraMode: 'perspective', autoAdjust: true };
}

function saveSettings(quality: QualityLevel, cameraMode: CameraMode, autoAdjust: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ quality, cameraMode, autoAdjust }));
  } catch {
  }
}

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const initial = loadSettings();
  
  const [state, setState] = useState<PerformanceState>({
    quality: initial.quality,
    cameraMode: initial.cameraMode,
    preset: QUALITY_PRESETS[initial.quality],
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    autoAdjust: initial.autoAdjust,
  });

  const setQuality = useCallback((level: QualityLevel) => {
    setState(prev => {
      saveSettings(level, prev.cameraMode, prev.autoAdjust);
      return {
        ...prev,
        quality: level,
        preset: QUALITY_PRESETS[level],
      };
    });
  }, []);

  const setCameraMode = useCallback((mode: CameraMode) => {
    setState(prev => {
      saveSettings(prev.quality, mode, prev.autoAdjust);
      return { ...prev, cameraMode: mode };
    });
  }, []);

  const toggleCameraMode = useCallback(() => {
    setState(prev => {
      const newMode = prev.cameraMode === 'perspective' ? 'orthographic' : 'perspective';
      saveSettings(prev.quality, newMode, prev.autoAdjust);
      return { ...prev, cameraMode: newMode };
    });
  }, []);

  const setAutoAdjust = useCallback((enabled: boolean) => {
    setState(prev => {
      saveSettings(prev.quality, prev.cameraMode, enabled);
      return { ...prev, autoAdjust: enabled };
    });
  }, []);

  const updateStats = useCallback((fps: number, drawCalls: number, triangles: number) => {
    setState(prev => ({ ...prev, fps, drawCalls, triangles }));
  }, []);

  useEffect(() => {
    if (!state.autoAdjust) return;
    
    const checkPerformance = () => {
      if (state.fps < 20 && state.quality !== 'low') {
        setQuality('low');
      } else if (state.fps < 40 && state.quality === 'high') {
        setQuality('medium');
      }
    };
    
    const interval = setInterval(checkPerformance, 5000);
    return () => clearInterval(interval);
  }, [state.fps, state.quality, state.autoAdjust, setQuality]);

  return (
    <PerformanceContext.Provider value={{ 
      state, 
      setQuality, 
      setCameraMode, 
      toggleCameraMode,
      setAutoAdjust,
      updateStats 
    }}>
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformance() {
  const ctx = useContext(PerformanceContext);
  if (!ctx) {
    return {
      state: {
        quality: 'medium' as QualityLevel,
        cameraMode: 'perspective' as CameraMode,
        preset: QUALITY_PRESETS.medium,
        fps: 60,
        drawCalls: 0,
        triangles: 0,
        autoAdjust: true,
      },
      setQuality: () => {},
      setCameraMode: () => {},
      toggleCameraMode: () => {},
      setAutoAdjust: () => {},
      updateStats: () => {},
    };
  }
  return ctx;
}

export function getLODLevel(distance: number, lodBias: number): 0 | 1 | 2 {
  const biasedDistance = distance * (1 + lodBias * 0.5);
  if (biasedDistance < 10) return 0;
  if (biasedDistance < 30) return 1;
  return 2;
}

export function shouldRenderShadow(preset: QualityPreset): boolean {
  return preset.shadows;
}

export function getMaxParticles(preset: QualityPreset): number {
  return preset.particleCount;
}
