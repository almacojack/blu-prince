import type { TossCartridge } from "./toss-v1.1";
import type { EnvironmentPreset } from "./environment-presets";
import { createDefaultEnvironmentPreset } from "./environment-presets";

export type EditorMode = "design" | "sculpt" | "paint" | "animate" | "test" | "present";

export interface KeyboardShortcut {
  id: string;
  action: string;
  keys: string[];
  modifiers: ("ctrl" | "alt" | "shift" | "meta")[];
  description: string;
  category: string;
}

export interface MacroBinding {
  id: string;
  deviceId: string;
  deviceName: string;
  channel: number;
  buttonIndex: number;
  action: string;
  sequence?: string[];
  label: string;
}

export interface ControllerMapping {
  deviceType: "gamepad" | "midi" | "macro_pad" | "dial" | "custom";
  deviceName: string;
  bindings: MacroBinding[];
  analogCurves?: Record<string, { deadzone: number; sensitivity: number; invert: boolean }>;
}

export interface InputProfile {
  id: string;
  name: string;
  description: string;
  mode: EditorMode;
  isDefault: boolean;
  keyboardShortcuts: KeyboardShortcut[];
  controllerMappings: ControllerMapping[];
  environmentPresetId?: string;
}

export interface PreferencesPayload {
  version: string;
  activeProfileId: string;
  profiles: InputProfile[];
  environmentPresets: EnvironmentPreset[];
  globalSettings: {
    theme: "cyberpunk" | "victorian";
    language: string;
    autoSave: boolean;
    autoSaveInterval: number;
    showGrid: boolean;
    showAxes: boolean;
    snapToGrid: boolean;
    gridSize: number;
    undoHistorySize: number;
  };
  recentFiles: string[];
  favoriteAssets: string[];
}

export interface PreferencesCartridge extends Omit<TossCartridge, "kind"> {
  kind: "preferences";
  preferences: PreferencesPayload;
}

export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { id: "undo", action: "undo", keys: ["z"], modifiers: ["ctrl"], description: "Undo last action", category: "Edit" },
  { id: "redo", action: "redo", keys: ["y"], modifiers: ["ctrl"], description: "Redo last action", category: "Edit" },
  { id: "save", action: "save", keys: ["s"], modifiers: ["ctrl"], description: "Save cartridge", category: "File" },
  { id: "copy", action: "copy", keys: ["c"], modifiers: ["ctrl"], description: "Copy selected", category: "Edit" },
  { id: "paste", action: "paste", keys: ["v"], modifiers: ["ctrl"], description: "Paste", category: "Edit" },
  { id: "delete", action: "delete", keys: ["Delete"], modifiers: [], description: "Delete selected", category: "Edit" },
  { id: "duplicate", action: "duplicate", keys: ["d"], modifiers: ["ctrl"], description: "Duplicate selected", category: "Edit" },
  { id: "select_all", action: "select_all", keys: ["a"], modifiers: ["ctrl"], description: "Select all", category: "Selection" },
  { id: "deselect", action: "deselect", keys: ["Escape"], modifiers: [], description: "Deselect all", category: "Selection" },
  { id: "focus", action: "focus_selected", keys: ["f"], modifiers: [], description: "Focus on selected", category: "View" },
  { id: "toggle_grid", action: "toggle_grid", keys: ["g"], modifiers: [], description: "Toggle grid", category: "View" },
  { id: "toggle_wireframe", action: "toggle_wireframe", keys: ["z"], modifiers: [], description: "Toggle wireframe", category: "View" },
  { id: "tool_select", action: "tool_select", keys: ["q"], modifiers: [], description: "Select tool", category: "Tools" },
  { id: "tool_move", action: "tool_move", keys: ["w"], modifiers: [], description: "Move tool", category: "Tools" },
  { id: "tool_rotate", action: "tool_rotate", keys: ["e"], modifiers: [], description: "Rotate tool", category: "Tools" },
  { id: "tool_scale", action: "tool_scale", keys: ["r"], modifiers: [], description: "Scale tool", category: "Tools" },
  { id: "play_stop", action: "play_stop", keys: [" "], modifiers: [], description: "Play/Stop simulation", category: "Playback" },
  { id: "step_forward", action: "step_forward", keys: ["."], modifiers: [], description: "Step forward", category: "Playback" },
];

export function createDefaultProfile(mode: EditorMode, name?: string): InputProfile {
  return {
    id: `profile_${mode}_${Date.now()}`,
    name: name || `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`,
    description: `Default profile for ${mode} mode`,
    mode,
    isDefault: true,
    keyboardShortcuts: [...DEFAULT_KEYBOARD_SHORTCUTS],
    controllerMappings: [],
  };
}

export function createDefaultPreferencesPayload(): PreferencesPayload {
  return {
    version: "1.0",
    activeProfileId: "",
    profiles: [
      createDefaultProfile("design", "Design Mode"),
      createDefaultProfile("sculpt", "Sculpt Mode"),
      createDefaultProfile("paint", "Paint Mode"),
      createDefaultProfile("animate", "Animate Mode"),
      createDefaultProfile("test", "Test Mode"),
      createDefaultProfile("present", "Present Mode"),
    ],
    environmentPresets: [createDefaultEnvironmentPreset()],
    globalSettings: {
      theme: "cyberpunk",
      language: "en",
      autoSave: true,
      autoSaveInterval: 60,
      showGrid: true,
      showAxes: true,
      snapToGrid: false,
      gridSize: 1,
      undoHistorySize: 50,
    },
    recentFiles: [],
    favoriteAssets: [],
  };
}

export function createPreferencesCartridge(
  userId: string,
  name: string = "Preferences 1"
): PreferencesCartridge {
  const payload = createDefaultPreferencesPayload();
  payload.activeProfileId = payload.profiles[0]?.id || "";

  return {
    kind: "preferences",
    toss_version: "1.1",
    meta: {
      title: name,
      author_platform_id: userId,
      version: "1.0.0",
      description: `User preferences for ${userId}`,
    },
    statecharts: {},
    meshes: [],
    preferences: payload,
  };
}

export function getProfileForMode(
  prefs: PreferencesPayload,
  mode: EditorMode
): InputProfile | undefined {
  return prefs.profiles.find(p => p.mode === mode);
}

export function updateProfileShortcut(
  profile: InputProfile,
  shortcutId: string,
  updates: Partial<KeyboardShortcut>
): InputProfile {
  return {
    ...profile,
    keyboardShortcuts: profile.keyboardShortcuts.map(s =>
      s.id === shortcutId ? { ...s, ...updates } : s
    ),
  };
}

export function addControllerMapping(
  profile: InputProfile,
  mapping: ControllerMapping
): InputProfile {
  return {
    ...profile,
    controllerMappings: [...profile.controllerMappings, mapping],
  };
}

export function findShortcutConflicts(
  profiles: InputProfile[],
  newShortcut: KeyboardShortcut
): { profile: InputProfile; shortcut: KeyboardShortcut }[] {
  const conflicts: { profile: InputProfile; shortcut: KeyboardShortcut }[] = [];
  
  for (const profile of profiles) {
    for (const existing of profile.keyboardShortcuts) {
      if (existing.id === newShortcut.id) continue;
      
      const keysMatch = existing.keys.join("+") === newShortcut.keys.join("+");
      const modsMatch = existing.modifiers.sort().join("+") === newShortcut.modifiers.sort().join("+");
      
      if (keysMatch && modsMatch) {
        conflicts.push({ profile, shortcut: existing });
      }
    }
  }
  
  return conflicts;
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers.includes("ctrl")) parts.push("Ctrl");
  if (shortcut.modifiers.includes("alt")) parts.push("Alt");
  if (shortcut.modifiers.includes("shift")) parts.push("Shift");
  if (shortcut.modifiers.includes("meta")) parts.push("⌘");
  
  parts.push(...shortcut.keys.map(k => k.length === 1 ? k.toUpperCase() : k));
  
  return parts.join(" + ");
}
