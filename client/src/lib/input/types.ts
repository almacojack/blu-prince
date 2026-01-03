/**
 * Input Binding System - Type Definitions
 * Supports keyboard, mouse, and gamepad with conflict detection
 */

// Input device types
export type InputDevice = 'keyboard' | 'mouse' | 'gamepad';

// Keyboard modifier keys
export interface KeyboardModifiers {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

// A single key binding
export interface KeyBinding {
  device: 'keyboard';
  key: string;           // e.g., 'a', 'ArrowUp', 'Space', 'Enter'
  modifiers?: KeyboardModifiers;
}

// Mouse button binding
export interface MouseBinding {
  device: 'mouse';
  button: 'left' | 'right' | 'middle' | 'back' | 'forward';
  modifiers?: KeyboardModifiers;
}

// Gamepad button/axis binding
export interface GamepadBinding {
  device: 'gamepad';
  type: 'button' | 'axis';
  index: number;         // Button or axis index
  axisDirection?: 'positive' | 'negative'; // For axis bindings
  deadzone?: number;     // 0-1, default 0.15
}

// Union of all binding types
export type InputBinding = KeyBinding | MouseBinding | GamepadBinding;

// An action that can be triggered
export interface InputAction {
  id: string;
  name: string;
  description: string;
  category: 'navigation' | 'editing' | 'camera' | 'tools' | 'system' | 'custom';
  defaultBindings: InputBinding[];
  allowRebind: boolean;
  allowMultiple: boolean; // Can have multiple bindings for same action
}

// User's custom binding for an action
export interface UserBinding {
  actionId: string;
  bindings: InputBinding[];
  enabled: boolean;
}

// Complete binding profile
export interface InputBindingProfile {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'cartridge' | 'widget';
  scopeId?: string;      // Cartridge or widget ID if scoped
  
  bindings: UserBinding[];
  
  // Settings
  settings: {
    rightClickToPan: boolean;
    contextMenuEnabled: boolean;
    contextMenuDelay: number;  // ms before context menu shows (allows pan gesture)
    gamepadDeadzone: number;
    invertYAxis: boolean;
    mouseSensitivity: number;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  isDefault: boolean;
}

// Conflict between bindings
export interface BindingConflict {
  actionId1: string;
  actionId2: string;
  binding: InputBinding;
  severity: 'error' | 'warning';
  message: string;
}

// Standard gamepad layout (Xbox-style)
export interface StandardGamepadLayout {
  buttons: {
    A: 0;
    B: 1;
    X: 2;
    Y: 3;
    LB: 4;
    RB: 5;
    LT: 6;
    RT: 7;
    SELECT: 8;
    START: 9;
    L3: 10;
    R3: 11;
    DPAD_UP: 12;
    DPAD_DOWN: 13;
    DPAD_LEFT: 14;
    DPAD_RIGHT: 15;
    HOME: 16;
  };
  axes: {
    LEFT_X: 0;
    LEFT_Y: 1;
    RIGHT_X: 2;
    RIGHT_Y: 3;
  };
}

export const STANDARD_GAMEPAD: StandardGamepadLayout = {
  buttons: {
    A: 0, B: 1, X: 2, Y: 3,
    LB: 4, RB: 5, LT: 6, RT: 7,
    SELECT: 8, START: 9, L3: 10, R3: 11,
    DPAD_UP: 12, DPAD_DOWN: 13, DPAD_LEFT: 14, DPAD_RIGHT: 15,
    HOME: 16
  },
  axes: {
    LEFT_X: 0, LEFT_Y: 1, RIGHT_X: 2, RIGHT_Y: 3
  }
};

// Wizard step for controller setup
export interface WizardStep {
  id: string;
  instruction: string;
  targetBinding: Partial<GamepadBinding>;
  actionId: string;
  icon?: string;
  timeout: number;  // ms
}

// Controller setup wizard state
export interface ControllerWizardState {
  status: 'idle' | 'detecting' | 'training' | 'complete' | 'error';
  currentStep: number;
  steps: WizardStep[];
  detectedGamepad?: Gamepad;
  capturedBindings: Map<string, GamepadBinding>;
  conflicts: BindingConflict[];
}
