import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Gamepad2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  RotateCcw,
  Zap,
  Circle
} from "lucide-react";
import { GamepadBinding, WizardStep, STANDARD_GAMEPAD } from "@/lib/input/types";
import { getBindingDisplayName } from "@/lib/input/conflict-engine";

interface ControllerSetupWizardProps {
  onComplete: (bindings: Map<string, GamepadBinding>) => void;
  onCancel: () => void;
}

type WizardStatus = 'detecting' | 'training' | 'complete' | 'error';

const WIZARD_STEPS: WizardStep[] = [
  { id: 'a', instruction: 'Press the A button (or bottom face button)', targetBinding: { type: 'button', index: 0 }, actionId: 'confirm', timeout: 10000 },
  { id: 'b', instruction: 'Press the B button (or right face button)', targetBinding: { type: 'button', index: 1 }, actionId: 'cancel', timeout: 10000 },
  { id: 'x', instruction: 'Press the X button (or left face button)', targetBinding: { type: 'button', index: 2 }, actionId: 'delete', timeout: 10000 },
  { id: 'y', instruction: 'Press the Y button (or top face button)', targetBinding: { type: 'button', index: 3 }, actionId: 'duplicate', timeout: 10000 },
  { id: 'lb', instruction: 'Press the Left Bumper (LB)', targetBinding: { type: 'button', index: 4 }, actionId: 'zoom_out', timeout: 10000 },
  { id: 'rb', instruction: 'Press the Right Bumper (RB)', targetBinding: { type: 'button', index: 5 }, actionId: 'zoom_in', timeout: 10000 },
  { id: 'start', instruction: 'Press the Start button', targetBinding: { type: 'button', index: 9 }, actionId: 'pause', timeout: 10000 },
  { id: 'select', instruction: 'Press the Select/Back button', targetBinding: { type: 'button', index: 8 }, actionId: 'context_menu', timeout: 10000 },
  { id: 'dpad_up', instruction: 'Press D-Pad Up', targetBinding: { type: 'button', index: 12 }, actionId: 'navigate_up', timeout: 10000 },
  { id: 'dpad_down', instruction: 'Press D-Pad Down', targetBinding: { type: 'button', index: 13 }, actionId: 'navigate_down', timeout: 10000 },
  { id: 'dpad_left', instruction: 'Press D-Pad Left', targetBinding: { type: 'button', index: 14 }, actionId: 'navigate_left', timeout: 10000 },
  { id: 'dpad_right', instruction: 'Press D-Pad Right', targetBinding: { type: 'button', index: 15 }, actionId: 'navigate_right', timeout: 10000 },
  { id: 'left_stick', instruction: 'Move the Left Stick in any direction', targetBinding: { type: 'axis', index: 0 }, actionId: 'navigate', timeout: 10000 },
  { id: 'right_stick', instruction: 'Move the Right Stick in any direction', targetBinding: { type: 'axis', index: 2 }, actionId: 'pan', timeout: 10000 },
];

export function ControllerSetupWizard({ onComplete, onCancel }: ControllerSetupWizardProps) {
  const [status, setStatus] = useState<WizardStatus>('detecting');
  const [currentStep, setCurrentStep] = useState(0);
  const [detectedGamepad, setDetectedGamepad] = useState<Gamepad | null>(null);
  const [capturedBindings, setCapturedBindings] = useState<Map<string, GamepadBinding>>(new Map());
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [buttonPressed, setButtonPressed] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const lastButtonState = useRef<boolean[]>([]);

  // Detect gamepad connection
  useEffect(() => {
    const checkGamepads = () => {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          setDetectedGamepad(gp);
          setStatus('training');
          return;
        }
      }
    };

    const handleConnect = (e: GamepadEvent) => {
      setDetectedGamepad(e.gamepad);
      setStatus('training');
    };

    window.addEventListener('gamepadconnected', handleConnect);
    const interval = setInterval(checkGamepads, 500);

    return () => {
      window.removeEventListener('gamepadconnected', handleConnect);
      clearInterval(interval);
    };
  }, []);

  // Poll for button presses during training
  useEffect(() => {
    if (status !== 'training' || !detectedGamepad) return;

    const step = WIZARD_STEPS[currentStep];
    let startTime = Date.now();

    const poll = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[detectedGamepad.index];
      
      if (!gp) {
        animationRef.current = requestAnimationFrame(poll);
        return;
      }

      // Update time remaining
      const elapsed = Date.now() - startTime;
      setTimeRemaining(Math.max(0, Math.ceil((step.timeout - elapsed) / 1000)));

      if (elapsed > step.timeout) {
        // Timeout - skip this step
        handleSkip();
        return;
      }

      // Check for button press
      if (step.targetBinding.type === 'button') {
        for (let i = 0; i < gp.buttons.length; i++) {
          const wasPressed = lastButtonState.current[i] || false;
          const isPressed = gp.buttons[i].pressed;
          
          if (isPressed && !wasPressed) {
            // New button press detected
            const binding: GamepadBinding = {
              device: 'gamepad',
              type: 'button',
              index: i
            };
            handleCapture(binding);
            lastButtonState.current[i] = true;
            return;
          }
          lastButtonState.current[i] = isPressed;
        }
      } else if (step.targetBinding.type === 'axis') {
        for (let i = 0; i < gp.axes.length; i++) {
          if (Math.abs(gp.axes[i]) > 0.5) {
            const binding: GamepadBinding = {
              device: 'gamepad',
              type: 'axis',
              index: i,
              axisDirection: gp.axes[i] > 0 ? 'positive' : 'negative'
            };
            handleCapture(binding);
            return;
          }
        }
      }

      animationRef.current = requestAnimationFrame(poll);
    };

    animationRef.current = requestAnimationFrame(poll);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status, currentStep, detectedGamepad]);

  const handleCapture = useCallback((binding: GamepadBinding) => {
    const step = WIZARD_STEPS[currentStep];
    
    setButtonPressed(true);
    setCapturedBindings(prev => {
      const next = new Map(prev);
      next.set(step.actionId, binding);
      return next;
    });

    setTimeout(() => {
      setButtonPressed(false);
      if (currentStep < WIZARD_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        setTimeRemaining(10);
        lastButtonState.current = [];
      } else {
        setStatus('complete');
      }
    }, 500);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setTimeRemaining(10);
      lastButtonState.current = [];
    } else {
      setStatus('complete');
    }
  }, [currentStep]);

  const handleReset = () => {
    setCurrentStep(0);
    setCapturedBindings(new Map());
    setTimeRemaining(10);
    setStatus('training');
    lastButtonState.current = [];
  };

  const progress = ((currentStep + (buttonPressed ? 1 : 0)) / WIZARD_STEPS.length) * 100;

  return (
    <Card className="w-full max-w-lg mx-auto bg-gray-900/95 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-900/50">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <CardTitle className="text-white">Controller Setup</CardTitle>
            <CardDescription>
              {status === 'detecting' && 'Waiting for controller...'}
              {status === 'training' && `Step ${currentStep + 1} of ${WIZARD_STEPS.length}`}
              {status === 'complete' && 'Setup complete!'}
            </CardDescription>
          </div>
        </div>
        {status === 'training' && (
          <Progress value={progress} className="mt-4" />
        )}
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {status === 'detecting' && (
            <motion.div
              key="detecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Gamepad2 className="w-16 h-16 mx-auto text-purple-400/50" />
              </motion.div>
              <p className="mt-4 text-gray-400">
                Press any button on your controller to begin
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Make sure your controller is connected and recognized by your browser
              </p>
            </motion.div>
          )}

          {status === 'training' && (
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-4"
            >
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  {WIZARD_STEPS[currentStep].id.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  {timeRemaining}s
                </div>
              </div>

              <div className={`p-6 rounded-xl text-center transition-colors ${
                buttonPressed ? 'bg-green-900/30 border-green-500' : 'bg-gray-800/50 border-gray-700'
              } border`}>
                <motion.div
                  animate={buttonPressed ? { scale: [1, 1.2, 1] } : {}}
                >
                  {buttonPressed ? (
                    <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
                  ) : (
                    <Circle className="w-12 h-12 mx-auto text-purple-400" />
                  )}
                </motion.div>
                <p className="mt-4 text-lg text-white">
                  {WIZARD_STEPS[currentStep].instruction}
                </p>
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="text-gray-400"
                >
                  Skip this button
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {status === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-4"
            >
              <div className="text-center mb-6">
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-400" />
                <h3 className="mt-4 text-xl font-bold text-white">
                  Controller Configured!
                </h3>
                <p className="mt-2 text-gray-400">
                  {capturedBindings.size} buttons mapped successfully
                </p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Array.from(capturedBindings.entries()).map(([actionId, binding]) => (
                  <div 
                    key={actionId}
                    className="flex items-center justify-between p-2 rounded bg-gray-800/50"
                  >
                    <span className="text-sm text-gray-300">{actionId}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getBindingDisplayName(binding)}
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {detectedGamepad && (
          <div className="mt-4 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-300">{detectedGamepad.id}</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        {status === 'complete' && (
          <>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <Button onClick={() => onComplete(capturedBindings)} className="flex-1">
              Save Configuration
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
