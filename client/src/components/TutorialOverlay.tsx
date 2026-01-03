import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/contexts/TutorialContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  SkipForward,
  Rocket,
  GitBranch,
  Flame,
  Gamepad2,
  Box,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, typeof Rocket> = {
  Rocket,
  GitBranch,
  Flame,
  Gamepad2,
  Box,
};

interface SpotlightRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function TutorialOverlay() {
  const { 
    state, 
    currentTutorial, 
    currentStep, 
    nextStep, 
    prevStep, 
    stopTutorial, 
    skipTutorial,
  } = useTutorial();

  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const calculatePositions = useCallback(() => {
    if (!currentStep) return;

    if (currentStep.position === "center" || !currentStep.targetSelector) {
      setSpotlightRect(null);
      setCardPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      return;
    }

    const targetEl = document.querySelector(currentStep.targetSelector);
    if (!targetEl) {
      setSpotlightRect(null);
      setCardPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const padding = currentStep.spotlightPadding || 8;

    setSpotlightRect({
      x: rect.x - padding,
      y: rect.y - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const cardWidth = 360;
    const cardHeight = 220;
    const margin = 16;

    let x = 0;
    let y = 0;

    switch (currentStep.position) {
      case "top":
        x = rect.x + rect.width / 2;
        y = rect.y - margin - cardHeight / 2;
        break;
      case "bottom":
        x = rect.x + rect.width / 2;
        y = rect.y + rect.height + margin + cardHeight / 2;
        break;
      case "left":
        x = rect.x - margin - cardWidth / 2;
        y = rect.y + rect.height / 2;
        break;
      case "right":
        x = rect.x + rect.width + margin + cardWidth / 2;
        y = rect.y + rect.height / 2;
        break;
      default:
        x = window.innerWidth / 2;
        y = window.innerHeight / 2;
    }

    x = Math.max(cardWidth / 2 + margin, Math.min(window.innerWidth - cardWidth / 2 - margin, x));
    y = Math.max(cardHeight / 2 + margin, Math.min(window.innerHeight - cardHeight / 2 - margin, y));

    setCardPosition({ x, y });
  }, [currentStep]);

  useEffect(() => {
    calculatePositions();

    const handleResize = () => calculatePositions();
    const handleScroll = () => calculatePositions();
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);
    
    const observer = new MutationObserver(() => {
      setTimeout(calculatePositions, 100);
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      observer.disconnect();
    };
  }, [calculatePositions, state.currentStepIndex]);

  useEffect(() => {
    if (!state.isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused = activeElement instanceof HTMLInputElement || 
                             activeElement instanceof HTMLTextAreaElement ||
                             activeElement?.hasAttribute("contenteditable");
      
      if (isInputFocused && e.key !== "Escape") return;

      if (e.key === "Escape") {
        e.preventDefault();
        stopTutorial();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isPlaying, nextStep, prevStep, stopTutorial]);

  if (!state.isPlaying || !currentTutorial || !currentStep) {
    return null;
  }

  const Icon = ICON_MAP[currentTutorial.icon] || Rocket;
  const progress = ((state.currentStepIndex + 1) / currentTutorial.steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        key="tutorial-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        data-testid="tutorial-overlay"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {spotlightRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={spotlightRect.x}
                  y={spotlightRect.y}
                  width={spotlightRect.width}
                  height={spotlightRect.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            onClick={stopTutorial}
          />
          {spotlightRect && (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              x={spotlightRect.x}
              y={spotlightRect.y}
              width={spotlightRect.width}
              height={spotlightRect.height}
              rx="8"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              className="animate-pulse"
            />
          )}
        </svg>

        <motion.div
          key={`step-${state.currentStepIndex}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="absolute pointer-events-auto"
          style={{
            left: cardPosition.x,
            top: cardPosition.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <Card className="w-[360px] bg-zinc-900 border-zinc-700 shadow-2xl" data-testid="tutorial-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500">{currentTutorial.title}</p>
                    <CardTitle className="text-base">{currentStep.title}</CardTitle>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={stopTutorial}
                  data-testid="button-close-tutorial"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              <p className="text-sm text-zinc-300 leading-relaxed">
                {currentStep.description}
              </p>

              <div className="mt-4 flex items-center gap-1">
                {currentTutorial.steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-colors",
                      index < state.currentStepIndex
                        ? "bg-primary"
                        : index === state.currentStepIndex
                        ? "bg-primary/50"
                        : "bg-zinc-700"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-500 mt-1 text-center">
                Step {state.currentStepIndex + 1} of {currentTutorial.steps.length}
              </p>
            </CardContent>

            <CardFooter className="pt-0 gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={prevStep}
                disabled={state.currentStepIndex === 0}
                className="h-9 touch-manipulation"
                data-testid="button-prev-step"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>

              <div className="flex-1" />

              {currentStep.canSkip && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={skipTutorial}
                  className="h-9 text-zinc-400 touch-manipulation"
                  data-testid="button-skip-tutorial"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip
                </Button>
              )}

              <Button
                size="sm"
                onClick={nextStep}
                className="h-9 touch-manipulation"
                data-testid="button-next-step"
              >
                {state.currentStepIndex === currentTutorial.steps.length - 1 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
