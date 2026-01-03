import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FlightInput {
  forward: number;
  strafe: number;
  vertical: number;
  yaw: number;
  pitch: number;
}

interface FlightControlsContextType {
  isVisible: boolean;
  setVisible: (visible: boolean) => void;
  toggleVisible: () => void;
}

const FlightControlsContext = createContext<FlightControlsContextType | null>(null);

export function FlightControlsProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  
  const setVisible = useCallback((visible: boolean) => {
    setIsVisible(visible);
  }, []);
  
  const toggleVisible = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);
  
  const value: FlightControlsContextType = {
    isVisible,
    setVisible,
    toggleVisible,
  };
  
  return (
    <FlightControlsContext.Provider value={value}>
      {children}
    </FlightControlsContext.Provider>
  );
}

export function useFlightControls() {
  const context = useContext(FlightControlsContext);
  if (!context) {
    throw new Error('useFlightControls must be used within FlightControlsProvider');
  }
  return context;
}

export function useGlobalFlightInput(handler: (input: FlightInput) => void) {
  React.useEffect(() => {
    const onFlightInput = (e: Event) => {
      const customEvent = e as CustomEvent<FlightInput>;
      handler(customEvent.detail);
    };
    
    window.addEventListener('global-flight-input', onFlightInput);
    return () => window.removeEventListener('global-flight-input', onFlightInput);
  }, [handler]);
}
