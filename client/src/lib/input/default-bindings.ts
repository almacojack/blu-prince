/**
 * Default Input Bindings
 * Standard actions and their default key/button mappings
 */

import { InputAction, InputBindingProfile, STANDARD_GAMEPAD } from './types';

// Standard actions available in TingOS
export const DEFAULT_ACTIONS: InputAction[] = [
  // Navigation
  {
    id: 'navigate_up',
    name: 'Navigate Up',
    description: 'Move selection up',
    category: 'navigation',
    defaultBindings: [
      { device: 'keyboard', key: 'ArrowUp' },
      { device: 'keyboard', key: 'w' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.DPAD_UP },
      { device: 'gamepad', type: 'axis', index: STANDARD_GAMEPAD.axes.LEFT_Y, axisDirection: 'negative' }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'navigate_down',
    name: 'Navigate Down',
    description: 'Move selection down',
    category: 'navigation',
    defaultBindings: [
      { device: 'keyboard', key: 'ArrowDown' },
      { device: 'keyboard', key: 's' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.DPAD_DOWN },
      { device: 'gamepad', type: 'axis', index: STANDARD_GAMEPAD.axes.LEFT_Y, axisDirection: 'positive' }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'navigate_left',
    name: 'Navigate Left',
    description: 'Move selection left',
    category: 'navigation',
    defaultBindings: [
      { device: 'keyboard', key: 'ArrowLeft' },
      { device: 'keyboard', key: 'a' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.DPAD_LEFT },
      { device: 'gamepad', type: 'axis', index: STANDARD_GAMEPAD.axes.LEFT_X, axisDirection: 'negative' }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'navigate_right',
    name: 'Navigate Right',
    description: 'Move selection right',
    category: 'navigation',
    defaultBindings: [
      { device: 'keyboard', key: 'ArrowRight' },
      { device: 'keyboard', key: 'd' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.DPAD_RIGHT },
      { device: 'gamepad', type: 'axis', index: STANDARD_GAMEPAD.axes.LEFT_X, axisDirection: 'positive' }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  
  // Actions
  {
    id: 'confirm',
    name: 'Confirm / Select',
    description: 'Confirm selection or activate item',
    category: 'navigation',
    defaultBindings: [
      { device: 'keyboard', key: 'Enter' },
      { device: 'keyboard', key: ' ' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.A }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'cancel',
    name: 'Cancel / Back',
    description: 'Cancel action or go back',
    category: 'navigation',
    defaultBindings: [
      { device: 'keyboard', key: 'Escape' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.B }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  
  // Camera controls
  {
    id: 'pan',
    name: 'Pan Camera',
    description: 'Pan the camera view',
    category: 'camera',
    defaultBindings: [
      { device: 'mouse', button: 'middle' },
      { device: 'gamepad', type: 'axis', index: STANDARD_GAMEPAD.axes.RIGHT_X },
      { device: 'gamepad', type: 'axis', index: STANDARD_GAMEPAD.axes.RIGHT_Y }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'zoom_in',
    name: 'Zoom In',
    description: 'Zoom the camera in',
    category: 'camera',
    defaultBindings: [
      { device: 'keyboard', key: '=' },
      { device: 'keyboard', key: '+' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.RB }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'zoom_out',
    name: 'Zoom Out',
    description: 'Zoom the camera out',
    category: 'camera',
    defaultBindings: [
      { device: 'keyboard', key: '-' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.LB }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  
  // Editing
  {
    id: 'delete',
    name: 'Delete',
    description: 'Delete selected item',
    category: 'editing',
    defaultBindings: [
      { device: 'keyboard', key: 'Delete' },
      { device: 'keyboard', key: 'Backspace' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.X }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'duplicate',
    name: 'Duplicate',
    description: 'Duplicate selected item',
    category: 'editing',
    defaultBindings: [
      { device: 'keyboard', key: 'd', modifiers: { ctrl: true } },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.Y }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'undo',
    name: 'Undo',
    description: 'Undo last action',
    category: 'editing',
    defaultBindings: [
      { device: 'keyboard', key: 'z', modifiers: { ctrl: true } }
    ],
    allowRebind: true,
    allowMultiple: false
  },
  {
    id: 'redo',
    name: 'Redo',
    description: 'Redo last undone action',
    category: 'editing',
    defaultBindings: [
      { device: 'keyboard', key: 'y', modifiers: { ctrl: true } },
      { device: 'keyboard', key: 'z', modifiers: { ctrl: true, shift: true } }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  
  // Tools
  {
    id: 'toggle_gravity',
    name: 'Toggle Gravity',
    description: 'Enable/disable physics gravity',
    category: 'tools',
    defaultBindings: [
      { device: 'keyboard', key: 'g' }
    ],
    allowRebind: true,
    allowMultiple: false
  },
  {
    id: 'toggle_layers',
    name: 'Toggle Layers Panel',
    description: 'Show/hide layers panel',
    category: 'tools',
    defaultBindings: [
      { device: 'keyboard', key: 'l' }
    ],
    allowRebind: true,
    allowMultiple: false
  },
  
  // System
  {
    id: 'command_palette',
    name: 'Command Palette',
    description: 'Open command palette',
    category: 'system',
    defaultBindings: [
      { device: 'keyboard', key: 'k', modifiers: { ctrl: true } },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.START }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'fullscreen',
    name: 'Toggle Fullscreen',
    description: 'Enter/exit fullscreen mode',
    category: 'system',
    defaultBindings: [
      { device: 'keyboard', key: 'F11' },
      { device: 'keyboard', key: 'f', modifiers: { ctrl: true, shift: true } }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'help',
    name: 'Help',
    description: 'Show help/tutorial',
    category: 'system',
    defaultBindings: [
      { device: 'keyboard', key: 'F1' },
      { device: 'keyboard', key: '?' }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  
  // Menu
  {
    id: 'context_menu',
    name: 'Context Menu',
    description: 'Open context menu',
    category: 'system',
    defaultBindings: [
      { device: 'mouse', button: 'right' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.SELECT }
    ],
    allowRebind: true,
    allowMultiple: true
  },
  {
    id: 'pause',
    name: 'Pause',
    description: 'Pause game/simulation',
    category: 'system',
    defaultBindings: [
      { device: 'keyboard', key: 'p' },
      { device: 'gamepad', type: 'button', index: STANDARD_GAMEPAD.buttons.START }
    ],
    allowRebind: true,
    allowMultiple: true
  }
];

// Create default profile from actions
export function createDefaultProfile(): InputBindingProfile {
  return {
    id: 'default',
    name: 'Default',
    description: 'Standard TingOS input configuration',
    scope: 'global',
    bindings: DEFAULT_ACTIONS.map(action => ({
      actionId: action.id,
      bindings: [...action.defaultBindings],
      enabled: true
    })),
    settings: {
      rightClickToPan: false,
      contextMenuEnabled: true,
      contextMenuDelay: 200,
      gamepadDeadzone: 0.15,
      invertYAxis: false,
      mouseSensitivity: 1.0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: true
  };
}
