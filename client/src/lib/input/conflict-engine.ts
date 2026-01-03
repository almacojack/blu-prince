/**
 * Input Conflict Engine
 * Detects and reports conflicts between input bindings
 */

import { 
  InputBinding, 
  KeyBinding, 
  MouseBinding, 
  GamepadBinding,
  BindingConflict,
  UserBinding,
  InputBindingProfile 
} from './types';

// Normalize a binding to a comparable string key
export function normalizeBinding(binding: InputBinding): string {
  if (binding.device === 'keyboard') {
    const kb = binding as KeyBinding;
    const mods = [];
    if (kb.modifiers?.ctrl) mods.push('ctrl');
    if (kb.modifiers?.alt) mods.push('alt');
    if (kb.modifiers?.shift) mods.push('shift');
    if (kb.modifiers?.meta) mods.push('meta');
    return `kb:${mods.join('+')}${mods.length ? '+' : ''}${kb.key.toLowerCase()}`;
  }
  
  if (binding.device === 'mouse') {
    const mb = binding as MouseBinding;
    const mods = [];
    if (mb.modifiers?.ctrl) mods.push('ctrl');
    if (mb.modifiers?.alt) mods.push('alt');
    if (mb.modifiers?.shift) mods.push('shift');
    if (mb.modifiers?.meta) mods.push('meta');
    return `mouse:${mods.join('+')}${mods.length ? '+' : ''}${mb.button}`;
  }
  
  if (binding.device === 'gamepad') {
    const gb = binding as GamepadBinding;
    if (gb.type === 'button') {
      return `gp:button:${gb.index}`;
    } else {
      return `gp:axis:${gb.index}:${gb.axisDirection || 'any'}`;
    }
  }
  
  return 'unknown';
}

// Compare two bindings for equality
export function bindingsEqual(a: InputBinding, b: InputBinding): boolean {
  return normalizeBinding(a) === normalizeBinding(b);
}

// Get human-readable name for a binding
export function getBindingDisplayName(binding: InputBinding): string {
  if (binding.device === 'keyboard') {
    const kb = binding as KeyBinding;
    const parts = [];
    if (kb.modifiers?.ctrl) parts.push('Ctrl');
    if (kb.modifiers?.alt) parts.push('Alt');
    if (kb.modifiers?.shift) parts.push('Shift');
    if (kb.modifiers?.meta) parts.push('Meta');
    
    // Prettify key names
    let key = kb.key;
    if (key === ' ') key = 'Space';
    if (key.startsWith('Arrow')) key = key.replace('Arrow', '');
    parts.push(key.charAt(0).toUpperCase() + key.slice(1));
    
    return parts.join(' + ');
  }
  
  if (binding.device === 'mouse') {
    const mb = binding as MouseBinding;
    const parts = [];
    if (mb.modifiers?.ctrl) parts.push('Ctrl');
    if (mb.modifiers?.alt) parts.push('Alt');
    if (mb.modifiers?.shift) parts.push('Shift');
    
    const buttonNames: Record<string, string> = {
      left: 'Left Click',
      right: 'Right Click',
      middle: 'Middle Click',
      back: 'Back',
      forward: 'Forward'
    };
    parts.push(buttonNames[mb.button] || mb.button);
    
    return parts.join(' + ');
  }
  
  if (binding.device === 'gamepad') {
    const gb = binding as GamepadBinding;
    const buttonNames: Record<number, string> = {
      0: 'A', 1: 'B', 2: 'X', 3: 'Y',
      4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT',
      8: 'Select', 9: 'Start', 10: 'L3', 11: 'R3',
      12: 'D-Up', 13: 'D-Down', 14: 'D-Left', 15: 'D-Right',
      16: 'Home'
    };
    const axisNames: Record<number, string> = {
      0: 'Left Stick X', 1: 'Left Stick Y',
      2: 'Right Stick X', 3: 'Right Stick Y'
    };
    
    if (gb.type === 'button') {
      return `🎮 ${buttonNames[gb.index] || `Button ${gb.index}`}`;
    } else {
      const dir = gb.axisDirection === 'positive' ? '+' : gb.axisDirection === 'negative' ? '-' : '±';
      return `🎮 ${axisNames[gb.index] || `Axis ${gb.index}`} ${dir}`;
    }
  }
  
  return 'Unknown';
}

// Reserved system bindings that cannot be overridden
const RESERVED_BINDINGS: InputBinding[] = [
  { device: 'keyboard', key: 'F5', modifiers: {} },  // Refresh
  { device: 'keyboard', key: 'F12', modifiers: {} }, // DevTools
  { device: 'keyboard', key: 'Tab', modifiers: { alt: true } }, // Window switch
];

// Check if a binding is reserved
export function isReservedBinding(binding: InputBinding): boolean {
  return RESERVED_BINDINGS.some(reserved => bindingsEqual(reserved, binding));
}

// Detect conflicts in a binding profile
export function detectConflicts(profile: InputBindingProfile): BindingConflict[] {
  const conflicts: BindingConflict[] = [];
  const bindingMap = new Map<string, { actionId: string; binding: InputBinding }[]>();
  
  // Build map of all bindings
  for (const userBinding of profile.bindings) {
    if (!userBinding.enabled) continue;
    
    for (const binding of userBinding.bindings) {
      const key = normalizeBinding(binding);
      const existing = bindingMap.get(key) || [];
      existing.push({ actionId: userBinding.actionId, binding });
      bindingMap.set(key, existing);
    }
  }
  
  // Check for duplicates
  for (const [key, bindings] of Array.from(bindingMap.entries())) {
    if (bindings.length > 1) {
      for (let i = 0; i < bindings.length - 1; i++) {
        for (let j = i + 1; j < bindings.length; j++) {
          conflicts.push({
            actionId1: bindings[i].actionId,
            actionId2: bindings[j].actionId,
            binding: bindings[i].binding,
            severity: 'error',
            message: `"${bindings[i].actionId}" and "${bindings[j].actionId}" both use ${getBindingDisplayName(bindings[i].binding)}`
          });
        }
      }
    }
  }
  
  // Check for reserved bindings
  for (const userBinding of profile.bindings) {
    for (const binding of userBinding.bindings) {
      if (isReservedBinding(binding)) {
        conflicts.push({
          actionId1: userBinding.actionId,
          actionId2: 'system',
          binding,
          severity: 'warning',
          message: `${getBindingDisplayName(binding)} is a system shortcut and may not work`
        });
      }
    }
  }
  
  // Check right-click conflicts
  if (profile.settings.rightClickToPan && profile.settings.contextMenuEnabled) {
    const rightClickBinding: MouseBinding = { device: 'mouse', button: 'right' };
    const hasRightClickAction = profile.bindings.some(ub => 
      ub.bindings.some(b => bindingsEqual(b, rightClickBinding))
    );
    
    if (hasRightClickAction) {
      conflicts.push({
        actionId1: 'rightClickToPan',
        actionId2: 'contextMenu',
        binding: rightClickBinding,
        severity: 'warning',
        message: 'Right-click is used for both panning and context menus. Consider using a delay or modifier.'
      });
    }
  }
  
  return conflicts;
}

// Validate a new binding against existing bindings
export function validateNewBinding(
  newBinding: InputBinding,
  actionId: string,
  profile: InputBindingProfile
): BindingConflict | null {
  const key = normalizeBinding(newBinding);
  
  // Check reserved
  if (isReservedBinding(newBinding)) {
    return {
      actionId1: actionId,
      actionId2: 'system',
      binding: newBinding,
      severity: 'warning',
      message: `${getBindingDisplayName(newBinding)} is reserved by the system`
    };
  }
  
  // Check existing bindings
  for (const userBinding of profile.bindings) {
    if (userBinding.actionId === actionId) continue; // Same action is OK
    if (!userBinding.enabled) continue;
    
    for (const binding of userBinding.bindings) {
      if (normalizeBinding(binding) === key) {
        return {
          actionId1: actionId,
          actionId2: userBinding.actionId,
          binding: newBinding,
          severity: 'error',
          message: `${getBindingDisplayName(newBinding)} is already used by "${userBinding.actionId}"`
        };
      }
    }
  }
  
  return null;
}
