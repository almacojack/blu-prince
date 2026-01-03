import { useState, useEffect, useCallback, useRef } from "react";

export interface GamepadState {
  id: string;
  index: number;
  connected: boolean;
  buttons: boolean[];
  axes: number[];
  mapping: string;
  timestamp: number;
}

export interface GamepadInput {
  dpadUp: boolean;
  dpadDown: boolean;
  dpadLeft: boolean;
  dpadRight: boolean;
  a: boolean;
  b: boolean;
  x: boolean;
  y: boolean;
  leftBumper: boolean;
  rightBumper: boolean;
  leftTrigger: number;
  rightTrigger: number;
  select: boolean;
  start: boolean;
  leftStickPress: boolean;
  rightStickPress: boolean;
  home: boolean;
  leftStickX: number;
  leftStickY: number;
  rightStickX: number;
  rightStickY: number;
}

const DEFAULT_INPUT: GamepadInput = {
  dpadUp: false,
  dpadDown: false,
  dpadLeft: false,
  dpadRight: false,
  a: false,
  b: false,
  x: false,
  y: false,
  leftBumper: false,
  rightBumper: false,
  leftTrigger: 0,
  rightTrigger: 0,
  select: false,
  start: false,
  leftStickPress: false,
  rightStickPress: false,
  home: false,
  leftStickX: 0,
  leftStickY: 0,
  rightStickX: 0,
  rightStickY: 0,
};

function parseGamepadInput(gamepad: Gamepad): GamepadInput {
  const buttons = gamepad.buttons;
  const axes = gamepad.axes;
  
  return {
    a: buttons[0]?.pressed ?? false,
    b: buttons[1]?.pressed ?? false,
    x: buttons[2]?.pressed ?? false,
    y: buttons[3]?.pressed ?? false,
    leftBumper: buttons[4]?.pressed ?? false,
    rightBumper: buttons[5]?.pressed ?? false,
    leftTrigger: buttons[6]?.value ?? 0,
    rightTrigger: buttons[7]?.value ?? 0,
    select: buttons[8]?.pressed ?? false,
    start: buttons[9]?.pressed ?? false,
    leftStickPress: buttons[10]?.pressed ?? false,
    rightStickPress: buttons[11]?.pressed ?? false,
    dpadUp: buttons[12]?.pressed ?? false,
    dpadDown: buttons[13]?.pressed ?? false,
    dpadLeft: buttons[14]?.pressed ?? false,
    dpadRight: buttons[15]?.pressed ?? false,
    home: buttons[16]?.pressed ?? false,
    leftStickX: axes[0] ?? 0,
    leftStickY: axes[1] ?? 0,
    rightStickX: axes[2] ?? 0,
    rightStickY: axes[3] ?? 0,
  };
}

export interface UseGamepadOptions {
  deadzone?: number;
  pollRate?: number;
  onInput?: (input: GamepadInput, gamepadIndex: number) => void;
}

export function useGamepad(options: UseGamepadOptions = {}) {
  const { deadzone = 0.1, pollRate = 16, onInput } = options;
  
  const [gamepads, setGamepads] = useState<(GamepadState | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [input, setInput] = useState<GamepadInput>(DEFAULT_INPUT);
  const [isSupported] = useState(() => typeof navigator !== "undefined" && "getGamepads" in navigator);
  
  const animFrameRef = useRef<number>(0);
  const lastInputRef = useRef<string>("");
  const onInputRef = useRef(onInput);
  onInputRef.current = onInput;

  const applyDeadzone = useCallback((value: number): number => {
    return Math.abs(value) < deadzone ? 0 : value;
  }, [deadzone]);

  const pollGamepads = useCallback(() => {
    if (!isSupported) return;
    
    const rawGamepads = navigator.getGamepads();
    const connectedPads: (GamepadState | null)[] = [];
    
    for (let i = 0; i < rawGamepads.length; i++) {
      const gp = rawGamepads[i];
      if (gp) {
        connectedPads.push({
          id: gp.id,
          index: gp.index,
          connected: gp.connected,
          buttons: gp.buttons.map(b => b.pressed),
          axes: gp.axes.map(a => applyDeadzone(a)),
          mapping: gp.mapping,
          timestamp: gp.timestamp,
        });
      } else {
        connectedPads.push(null);
      }
    }
    
    setGamepads(connectedPads);
    
    const targetIndex = activeIndex ?? connectedPads.findIndex(gp => gp !== null);
    if (targetIndex >= 0 && rawGamepads[targetIndex]) {
      const rawInput = parseGamepadInput(rawGamepads[targetIndex]!);
      
      rawInput.leftStickX = applyDeadzone(rawInput.leftStickX);
      rawInput.leftStickY = applyDeadzone(rawInput.leftStickY);
      rawInput.rightStickX = applyDeadzone(rawInput.rightStickX);
      rawInput.rightStickY = applyDeadzone(rawInput.rightStickY);
      
      const inputStr = JSON.stringify(rawInput);
      if (inputStr !== lastInputRef.current) {
        lastInputRef.current = inputStr;
        setInput(rawInput);
        onInputRef.current?.(rawInput, targetIndex);
      }
    }
    
    animFrameRef.current = requestAnimationFrame(pollGamepads);
  }, [isSupported, activeIndex, applyDeadzone]);

  useEffect(() => {
    if (!isSupported) return;

    const handleConnect = (e: GamepadEvent) => {
      console.log("Gamepad connected:", e.gamepad.id);
      if (activeIndex === null) {
        setActiveIndex(e.gamepad.index);
      }
    };

    const handleDisconnect = (e: GamepadEvent) => {
      console.log("Gamepad disconnected:", e.gamepad.id);
      if (activeIndex === e.gamepad.index) {
        setActiveIndex(null);
        setInput(DEFAULT_INPUT);
      }
    };

    window.addEventListener("gamepadconnected", handleConnect);
    window.addEventListener("gamepaddisconnected", handleDisconnect);
    
    animFrameRef.current = requestAnimationFrame(pollGamepads);

    return () => {
      window.removeEventListener("gamepadconnected", handleConnect);
      window.removeEventListener("gamepaddisconnected", handleDisconnect);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSupported, activeIndex, pollGamepads]);

  const connectedGamepads = gamepads.filter((gp): gp is GamepadState => gp !== null);
  const hasGamepad = connectedGamepads.length > 0;
  const activeGamepad = activeIndex !== null ? gamepads[activeIndex] : null;

  return {
    isSupported,
    gamepads: connectedGamepads,
    hasGamepad,
    activeGamepad,
    activeIndex,
    setActiveIndex,
    input,
  };
}
