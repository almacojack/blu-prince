import type { FrameOfReference } from "./frame-of-reference";
import { createDefaultFrame } from "./frame-of-reference";

export interface EnvironmentLighting {
  ambientIntensity: number;
  ambientColor: string;
  directionalIntensity: number;
  directionalColor: string;
  directionalPosition: { x: number; y: number; z: number };
  castShadows: boolean;
}

export interface EnvironmentBackground {
  type: "color" | "gradient" | "hdri";
  color: string;
  gradientTop?: string;
  gradientBottom?: string;
  hdriUrl?: string;
  fogEnabled: boolean;
  fogColor: string;
  fogNear: number;
  fogFar: number;
}

export interface EnvironmentCamera {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  frame: FrameOfReference;
  lighting: EnvironmentLighting;
  background: EnvironmentBackground;
  camera: EnvironmentCamera;
  gridVisible: boolean;
  axesVisible: boolean;
}

export function createDefaultEnvironmentPreset(id?: string, name?: string): EnvironmentPreset {
  return {
    id: id || `env_${Date.now()}`,
    name: name || "Default Environment",
    description: "Standard design workspace",
    icon: "box",
    frame: createDefaultFrame(),
    lighting: {
      ambientIntensity: 0.4,
      ambientColor: "#ffffff",
      directionalIntensity: 1.0,
      directionalColor: "#ffffff",
      directionalPosition: { x: 10, y: 15, z: 10 },
      castShadows: true,
    },
    background: {
      type: "color",
      color: "#0c1f3f",
      fogEnabled: true,
      fogColor: "#0c1f3f",
      fogNear: 20,
      fogFar: 50,
    },
    camera: {
      position: { x: 8, y: 8, z: 8 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50,
      near: 0.1,
      far: 1000,
    },
    gridVisible: true,
    axesVisible: true,
  };
}

export const BUILT_IN_PRESETS: EnvironmentPreset[] = [
  {
    id: "studio",
    name: "Studio",
    description: "Clean studio lighting for product shots",
    icon: "camera",
    frame: {
      ...createDefaultFrame("studio_frame"),
      label: "Studio Bounds",
      dimensions: { width: 8, height: 6, depth: 8 },
    },
    lighting: {
      ambientIntensity: 0.6,
      ambientColor: "#f0f0f0",
      directionalIntensity: 1.2,
      directionalColor: "#ffffff",
      directionalPosition: { x: 5, y: 10, z: 5 },
      castShadows: true,
    },
    background: {
      type: "gradient",
      color: "#e8e8e8",
      gradientTop: "#ffffff",
      gradientBottom: "#c0c0c0",
      fogEnabled: false,
      fogColor: "#ffffff",
      fogNear: 20,
      fogFar: 50,
    },
    camera: {
      position: { x: 5, y: 4, z: 5 },
      target: { x: 0, y: 1, z: 0 },
      fov: 45,
      near: 0.1,
      far: 500,
    },
    gridVisible: false,
    axesVisible: false,
  },
  {
    id: "outdoor",
    name: "Outdoor",
    description: "Natural daylight environment",
    icon: "sun",
    frame: {
      ...createDefaultFrame("outdoor_frame"),
      label: "Scene Bounds",
      shape: "sphere",
      dimensions: { width: 20, height: 20, depth: 20, radius: 15 },
    },
    lighting: {
      ambientIntensity: 0.3,
      ambientColor: "#87ceeb",
      directionalIntensity: 1.5,
      directionalColor: "#fff5e6",
      directionalPosition: { x: 20, y: 30, z: 10 },
      castShadows: true,
    },
    background: {
      type: "gradient",
      color: "#87ceeb",
      gradientTop: "#4a90d9",
      gradientBottom: "#87ceeb",
      fogEnabled: true,
      fogColor: "#c0d8f0",
      fogNear: 30,
      fogFar: 100,
    },
    camera: {
      position: { x: 12, y: 6, z: 12 },
      target: { x: 0, y: 0, z: 0 },
      fov: 60,
      near: 0.1,
      far: 1000,
    },
    gridVisible: true,
    axesVisible: false,
  },
  {
    id: "night",
    name: "Night Scene",
    description: "Low-light dramatic environment",
    icon: "moon",
    frame: {
      ...createDefaultFrame("night_frame"),
      label: "Night Bounds",
      color: "#6366f1",
    },
    lighting: {
      ambientIntensity: 0.15,
      ambientColor: "#1a1a3e",
      directionalIntensity: 0.4,
      directionalColor: "#c0c0ff",
      directionalPosition: { x: -10, y: 20, z: 5 },
      castShadows: true,
    },
    background: {
      type: "color",
      color: "#0a0a1a",
      fogEnabled: true,
      fogColor: "#0a0a1a",
      fogNear: 10,
      fogFar: 40,
    },
    camera: {
      position: { x: 8, y: 5, z: 8 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50,
      near: 0.1,
      far: 500,
    },
    gridVisible: true,
    axesVisible: true,
  },
  {
    id: "miniature",
    name: "Miniature",
    description: "Tilt-shift tabletop view",
    icon: "layers",
    frame: {
      ...createDefaultFrame("mini_frame"),
      label: "Tabletop",
      dimensions: { width: 6, height: 4, depth: 6 },
    },
    lighting: {
      ambientIntensity: 0.5,
      ambientColor: "#fff8e7",
      directionalIntensity: 1.0,
      directionalColor: "#ffffff",
      directionalPosition: { x: 3, y: 8, z: 3 },
      castShadows: true,
    },
    background: {
      type: "color",
      color: "#2d1f0f",
      fogEnabled: false,
      fogColor: "#2d1f0f",
      fogNear: 5,
      fogFar: 20,
    },
    camera: {
      position: { x: 4, y: 6, z: 4 },
      target: { x: 0, y: 0, z: 0 },
      fov: 35,
      near: 0.1,
      far: 200,
    },
    gridVisible: false,
    axesVisible: false,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon-lit futuristic environment",
    icon: "zap",
    frame: {
      ...createDefaultFrame("cyber_frame"),
      label: "Neon Zone",
      color: "#ff00ff",
    },
    lighting: {
      ambientIntensity: 0.2,
      ambientColor: "#ff00ff",
      directionalIntensity: 0.8,
      directionalColor: "#00ffff",
      directionalPosition: { x: -5, y: 10, z: 8 },
      castShadows: true,
    },
    background: {
      type: "color",
      color: "#0a0014",
      fogEnabled: true,
      fogColor: "#1a0028",
      fogNear: 15,
      fogFar: 45,
    },
    camera: {
      position: { x: 7, y: 5, z: 7 },
      target: { x: 0, y: 1, z: 0 },
      fov: 55,
      near: 0.1,
      far: 500,
    },
    gridVisible: true,
    axesVisible: true,
  },
];

export function clonePreset(preset: EnvironmentPreset, newName?: string): EnvironmentPreset {
  return {
    ...preset,
    id: `env_${Date.now()}`,
    name: newName || `${preset.name} Copy`,
    frame: {
      ...preset.frame,
      id: `frame_${Date.now()}`,
    },
  };
}

export function applyPresetToScene(
  preset: EnvironmentPreset,
  callbacks: {
    setLighting?: (lighting: EnvironmentLighting) => void;
    setBackground?: (background: EnvironmentBackground) => void;
    setCamera?: (camera: EnvironmentCamera) => void;
    setFrame?: (frame: FrameOfReference) => void;
    setGridVisible?: (visible: boolean) => void;
    setAxesVisible?: (visible: boolean) => void;
  }
): void {
  if (callbacks.setLighting) callbacks.setLighting(preset.lighting);
  if (callbacks.setBackground) callbacks.setBackground(preset.background);
  if (callbacks.setCamera) callbacks.setCamera(preset.camera);
  if (callbacks.setFrame) callbacks.setFrame(preset.frame);
  if (callbacks.setGridVisible) callbacks.setGridVisible(preset.gridVisible);
  if (callbacks.setAxesVisible) callbacks.setAxesVisible(preset.axesVisible);
}
