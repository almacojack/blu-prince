import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { 
  TutorialId, 
  TutorialState, 
  TutorialProgress, 
  Tutorial,
  TutorialStep,
  TUTORIALS, 
  DEFAULT_TUTORIAL_STATE 
} from "@/lib/tutorial-types";

interface TutorialContextValue {
  state: TutorialState;
  currentTutorial: Tutorial | null;
  currentStep: TutorialStep | null;
  startTutorial: (id: TutorialId) => void;
  stopTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  goToStep: (index: number) => void;
  getTutorialProgress: (id: TutorialId) => TutorialProgress | null;
  isStepCompleted: (tutorialId: TutorialId, stepIndex: number) => boolean;
  markWelcomeSeen: () => void;
  resetProgress: () => void;
}

const TutorialContext = createContext<TutorialContextValue | null>(null);

const STORAGE_KEY = "tingos_tutorial_progress";

function loadState(): TutorialState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_TUTORIAL_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn("Failed to load tutorial progress:", e);
  }
  return DEFAULT_TUTORIAL_STATE;
}

function saveState(state: TutorialState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      progress: state.progress,
      hasSeenWelcome: state.hasSeenWelcome,
    }));
  } catch (e) {
    console.warn("Failed to save tutorial progress:", e);
  }
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TutorialState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state.progress, state.hasSeenWelcome]);

  const currentTutorial = state.activeTutorial 
    ? TUTORIALS.find(t => t.id === state.activeTutorial) || null 
    : null;

  const currentStep = currentTutorial 
    ? currentTutorial.steps[state.currentStepIndex] || null 
    : null;

  const startTutorial = useCallback((id: TutorialId) => {
    const tutorial = TUTORIALS.find(t => t.id === id);
    if (!tutorial) return;

    const existingProgress = state.progress[id];
    const startIndex = existingProgress && !existingProgress.completed 
      ? existingProgress.currentStepIndex 
      : 0;

    setState(prev => ({
      ...prev,
      activeTutorial: id,
      currentStepIndex: startIndex,
      isPlaying: true,
      progress: {
        ...prev.progress,
        [id]: {
          tutorialId: id,
          currentStepIndex: startIndex,
          completed: false,
          startedAt: existingProgress?.startedAt || new Date().toISOString(),
        },
      },
    }));
  }, [state.progress]);

  const stopTutorial = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeTutorial: null,
      currentStepIndex: 0,
      isPlaying: false,
    }));
  }, []);

  const nextStep = useCallback(() => {
    if (!currentTutorial) return;

    const nextIndex = state.currentStepIndex + 1;
    
    if (nextIndex >= currentTutorial.steps.length) {
      setState(prev => ({
        ...prev,
        activeTutorial: null,
        currentStepIndex: 0,
        isPlaying: false,
        progress: {
          ...prev.progress,
          [currentTutorial.id]: {
            ...prev.progress[currentTutorial.id],
            completed: true,
            completedAt: new Date().toISOString(),
          },
        },
      }));
    } else {
      setState(prev => ({
        ...prev,
        currentStepIndex: nextIndex,
        progress: {
          ...prev.progress,
          [currentTutorial.id]: {
            ...prev.progress[currentTutorial.id],
            currentStepIndex: nextIndex,
          },
        },
      }));
    }
  }, [currentTutorial, state.currentStepIndex]);

  const prevStep = useCallback(() => {
    if (state.currentStepIndex > 0) {
      setState(prev => ({
        ...prev,
        currentStepIndex: prev.currentStepIndex - 1,
      }));
    }
  }, [state.currentStepIndex]);

  const skipTutorial = useCallback(() => {
    if (!currentTutorial) return;

    setState(prev => ({
      ...prev,
      activeTutorial: null,
      currentStepIndex: 0,
      isPlaying: false,
      progress: {
        ...prev.progress,
        [currentTutorial.id]: {
          ...prev.progress[currentTutorial.id],
          completed: true,
          completedAt: new Date().toISOString(),
        },
      },
    }));
  }, [currentTutorial]);

  const goToStep = useCallback((index: number) => {
    if (!currentTutorial || index < 0 || index >= currentTutorial.steps.length) return;

    setState(prev => ({
      ...prev,
      currentStepIndex: index,
    }));
  }, [currentTutorial]);

  const getTutorialProgress = useCallback((id: TutorialId): TutorialProgress | null => {
    return state.progress[id] || null;
  }, [state.progress]);

  const isStepCompleted = useCallback((tutorialId: TutorialId, stepIndex: number): boolean => {
    const progress = state.progress[tutorialId];
    if (!progress) return false;
    if (progress.completed) return true;
    return stepIndex < progress.currentStepIndex;
  }, [state.progress]);

  const markWelcomeSeen = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasSeenWelcome: true,
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setState(DEFAULT_TUTORIAL_STATE);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <TutorialContext.Provider value={{
      state,
      currentTutorial,
      currentStep,
      startTutorial,
      stopTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      goToStep,
      getTutorialProgress,
      isStepCompleted,
      markWelcomeSeen,
      resetProgress,
    }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
