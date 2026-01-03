import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeVariant = 'cyberpunk' | 'victorian';

interface ThemeColors {
  primary: string;
  primaryGlow: string;
  secondary: string;
  accent: string;
  warning: string;
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  text: string;
  textMuted: string;
  success: string;
  danger: string;
  cheeseheadYellow: string;
}

export const CHEESEHEAD_YELLOW = '#daa520';

interface ThemeTypography {
  fontFamily: string;
  headingFont: string;
  monoFont: string;
}

interface ThemeEffects {
  glow: boolean;
  scanlines: boolean;
  grain: boolean;
}

export interface Theme {
  name: string;
  variant: ThemeVariant;
  colors: ThemeColors;
  typography: ThemeTypography;
  effects: ThemeEffects;
}

const CYBERPUNK_THEME: Theme = {
  name: 'Cyberpunk Neon',
  variant: 'cyberpunk',
  colors: {
    primary: '#a855f7',
    primaryGlow: '#c084fc',
    secondary: '#06b6d4',
    accent: '#f472b6',
    warning: '#fbbf24',
    background: '#0a0a0f',
    surface: 'rgba(255, 255, 255, 0.05)',
    surfaceHover: 'rgba(255, 255, 255, 0.1)',
    border: 'rgba(255, 255, 255, 0.1)',
    text: '#ffffff',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    success: '#22c55e',
    danger: '#ef4444',
    cheeseheadYellow: CHEESEHEAD_YELLOW,
  },
  typography: {
    fontFamily: '"Inter", system-ui, sans-serif',
    headingFont: '"Inter", system-ui, sans-serif',
    monoFont: '"JetBrains Mono", "Fira Code", monospace',
  },
  effects: {
    glow: true,
    scanlines: true,
    grain: false,
  },
};

const VICTORIAN_THEME: Theme = {
  name: 'Victorian Brass',
  variant: 'victorian',
  colors: {
    primary: '#b8860b',
    primaryGlow: '#daa520',
    secondary: '#8b4513',
    accent: '#cd853f',
    warning: '#8b0000',
    background: '#1a1510',
    surface: 'rgba(184, 134, 11, 0.08)',
    surfaceHover: 'rgba(184, 134, 11, 0.15)',
    border: 'rgba(184, 134, 11, 0.25)',
    text: '#f5f0e6',
    textMuted: 'rgba(245, 240, 230, 0.6)',
    success: '#2e8b57',
    danger: '#8b0000',
    cheeseheadYellow: CHEESEHEAD_YELLOW,
  },
  typography: {
    fontFamily: '"Crimson Pro", "Georgia", serif',
    headingFont: '"Playfair Display", "Georgia", serif',
    monoFont: '"IM Fell DW Pica", "Courier New", monospace',
  },
  effects: {
    glow: false,
    scanlines: false,
    grain: true,
  },
};

export const THEMES: Record<ThemeVariant, Theme> = {
  cyberpunk: CYBERPUNK_THEME,
  victorian: VICTORIAN_THEME,
};

interface ThemeContextValue {
  theme: Theme;
  themeVariant: ThemeVariant;
  setThemeVariant: (variant: ThemeVariant) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeVariant;
}

export function ThemeProvider({ children, defaultTheme = 'cyberpunk' }: ThemeProviderProps) {
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tingos-theme');
      if (saved && (saved === 'cyberpunk' || saved === 'victorian')) {
        return saved;
      }
    }
    return defaultTheme;
  });

  const theme = THEMES[themeVariant];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('tingos-theme', themeVariant);
    
    const root = document.documentElement;
    root.setAttribute('data-theme', themeVariant);
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssKey = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssKey, value);
    });
    
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.style.setProperty('--font-heading', theme.typography.headingFont);
    root.style.setProperty('--font-mono', theme.typography.monoFont);
    
    root.classList.toggle('theme-glow', theme.effects.glow);
    root.classList.toggle('theme-scanlines', theme.effects.scanlines);
    root.classList.toggle('theme-grain', theme.effects.grain);
  }, [theme, themeVariant]);

  const toggleTheme = () => {
    setThemeVariant(prev => prev === 'cyberpunk' ? 'victorian' : 'cyberpunk');
  };

  return (
    <ThemeContext.Provider value={{ theme, themeVariant, setThemeVariant, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export function useIsVictorian() {
  const { themeVariant } = useTheme();
  return themeVariant === 'victorian';
}
