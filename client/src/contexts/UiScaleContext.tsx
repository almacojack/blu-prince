import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UiScaleContextType {
  scale: number;
  setScale: (scale: number) => void;
  resetScale: () => void;
}

const UiScaleContext = createContext<UiScaleContextType | null>(null);

const STORAGE_KEY = 'tingos-ui-scale';
const DEFAULT_SCALE = 1;
const MIN_SCALE = 0.75;
const MAX_SCALE = 1.5;

export function UiScaleProvider({ children }: { children: React.ReactNode }) {
  const [scale, setScaleState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
        return parsed;
      }
    }
    return DEFAULT_SCALE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, scale.toString());
    document.documentElement.style.setProperty('--ui-scale', scale.toString());
    document.documentElement.style.fontSize = `${16 * scale}px`;
  }, [scale]);

  const setScale = useCallback((newScale: number) => {
    const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScaleState(clamped);
  }, []);

  const resetScale = useCallback(() => {
    setScaleState(DEFAULT_SCALE);
  }, []);

  return (
    <UiScaleContext.Provider value={{ scale, setScale, resetScale }}>
      {children}
    </UiScaleContext.Provider>
  );
}

export function useUiScale() {
  const context = useContext(UiScaleContext);
  if (!context) {
    throw new Error('useUiScale must be used within a UiScaleProvider');
  }
  return context;
}

export { MIN_SCALE, MAX_SCALE, DEFAULT_SCALE };
