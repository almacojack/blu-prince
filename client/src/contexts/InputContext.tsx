import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  InputBindingProfile, 
  InputBinding, 
  BindingConflict,
  GamepadBinding 
} from '@/lib/input/types';
import { createDefaultProfile, DEFAULT_ACTIONS } from '@/lib/input/default-bindings';
import { detectConflicts, validateNewBinding, getBindingDisplayName } from '@/lib/input/conflict-engine';

interface InputContextValue {
  profile: InputBindingProfile;
  conflicts: BindingConflict[];
  
  // Profile management
  updateBinding: (actionId: string, bindings: InputBinding[]) => void;
  resetToDefaults: () => void;
  
  // Settings
  setRightClickToPan: (enabled: boolean) => void;
  setContextMenuEnabled: (enabled: boolean) => void;
  setContextMenuDelay: (delay: number) => void;
  setGamepadDeadzone: (deadzone: number) => void;
  
  // Controller wizard
  applyControllerBindings: (bindings: Map<string, GamepadBinding>) => void;
  
  // Validation
  validateBinding: (actionId: string, binding: InputBinding) => BindingConflict | null;
  getBindingDisplay: (binding: InputBinding) => string;
  
  // Actions
  actions: typeof DEFAULT_ACTIONS;
}

const InputContext = createContext<InputContextValue | null>(null);

const STORAGE_KEY = 'tingos-input-profile';

export function InputProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<InputBindingProfile>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return createDefaultProfile();
      }
    }
    return createDefaultProfile();
  });
  
  const [conflicts, setConflicts] = useState<BindingConflict[]>([]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // Detect conflicts when profile changes
  useEffect(() => {
    const detected = detectConflicts(profile);
    setConflicts(detected);
  }, [profile]);

  const updateBinding = useCallback((actionId: string, bindings: InputBinding[]) => {
    setProfile(prev => ({
      ...prev,
      bindings: prev.bindings.map(b => 
        b.actionId === actionId ? { ...b, bindings } : b
      ),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setProfile(createDefaultProfile());
  }, []);

  const setRightClickToPan = useCallback((enabled: boolean) => {
    setProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, rightClickToPan: enabled },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const setContextMenuEnabled = useCallback((enabled: boolean) => {
    setProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, contextMenuEnabled: enabled },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const setContextMenuDelay = useCallback((delay: number) => {
    setProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, contextMenuDelay: delay },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const setGamepadDeadzone = useCallback((deadzone: number) => {
    setProfile(prev => ({
      ...prev,
      settings: { ...prev.settings, gamepadDeadzone: deadzone },
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const applyControllerBindings = useCallback((bindings: Map<string, GamepadBinding>) => {
    setProfile(prev => {
      const newBindings = [...prev.bindings];
      
      for (const [actionId, binding] of Array.from(bindings.entries())) {
        const idx = newBindings.findIndex(b => b.actionId === actionId);
        if (idx >= 0) {
          // Add gamepad binding if not already present
          const existingGamepad = newBindings[idx].bindings.filter(b => b.device !== 'gamepad');
          newBindings[idx] = {
            ...newBindings[idx],
            bindings: [...existingGamepad, binding]
          };
        }
      }
      
      return {
        ...prev,
        bindings: newBindings,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const validateBinding = useCallback((actionId: string, binding: InputBinding) => {
    return validateNewBinding(binding, actionId, profile);
  }, [profile]);

  const getBindingDisplay = useCallback((binding: InputBinding) => {
    return getBindingDisplayName(binding);
  }, []);

  return (
    <InputContext.Provider value={{
      profile,
      conflicts,
      updateBinding,
      resetToDefaults,
      setRightClickToPan,
      setContextMenuEnabled,
      setContextMenuDelay,
      setGamepadDeadzone,
      applyControllerBindings,
      validateBinding,
      getBindingDisplay,
      actions: DEFAULT_ACTIONS
    }}>
      {children}
    </InputContext.Provider>
  );
}

export function useInput() {
  const context = useContext(InputContext);
  if (!context) {
    throw new Error('useInput must be used within InputProvider');
  }
  return context;
}
