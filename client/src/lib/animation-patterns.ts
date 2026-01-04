/**
 * Animation Patterns - The 12 Principles of Animation
 * 
 * Based on Disney's "The Illusion of Life" by Frank Thomas and Ollie Johnston.
 * These patterns provide one-click animation presets that embody decades of
 * animation wisdom. Users can apply them instantly and tweak parameters.
 * 
 * ## Design Philosophy
 * - "Don't make the user think - let them play!"
 * - Each pattern is a self-contained animation recipe
 * - Smart defaults with optional fine-tuning
 * - Keyframes are auto-generated from parameters
 * 
 * ## Pattern Structure
 * Each pattern defines:
 * - Keyframes: Position, rotation, scale over time
 * - Easing: Built-in curve (ease-in-out, bounce, elastic, etc.)
 * - Parameters: User-adjustable values with sensible defaults
 * - Duration: Default timing (adjustable)
 */

import { z } from 'zod';

// ============================================
// TYPE DEFINITIONS
// ============================================

/** Easing function types - how motion accelerates/decelerates */
export type EasingType = 
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'back'
  | 'anticipate';

/** A single keyframe in an animation */
export interface Keyframe {
  /** Time in seconds from start */
  time: number;
  
  /** Position offset from original [x, y, z] */
  position?: [number, number, number];
  
  /** Rotation in degrees [x, y, z] */
  rotation?: [number, number, number];
  
  /** Scale multiplier [x, y, z] */
  scale?: [number, number, number];
  
  /** Opacity 0-1 */
  opacity?: number;
  
  /** Easing to next keyframe */
  easing?: EasingType;
}

/** An animation pattern that can be applied to any mesh */
export interface AnimationPattern {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Which of the 12 principles this embodies */
  principle: AnimationPrinciple;
  
  /** Short description */
  description: string;
  
  /** Icon name (lucide icon) */
  icon: string;
  
  /** Category color for UI */
  color: string;
  
  /** Total duration in seconds */
  duration: number;
  
  /** Whether animation loops */
  loop: boolean;
  
  /** Keyframes defining the motion */
  keyframes: Keyframe[];
  
  /** Adjustable parameters with defaults */
  parameters: AnimationParameter[];
}

/** User-adjustable parameter for an animation */
export interface AnimationParameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'select';
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  description?: string;
}

/** The 12 Principles of Animation */
export type AnimationPrinciple =
  | 'squash_stretch'
  | 'anticipation'
  | 'staging'
  | 'straight_ahead'
  | 'follow_through'
  | 'slow_in_out'
  | 'arcs'
  | 'secondary_action'
  | 'timing'
  | 'exaggeration'
  | 'solid_drawing'
  | 'appeal';

// ============================================
// THE 12 ANIMATION PATTERNS
// ============================================

export const ANIMATION_PATTERNS: AnimationPattern[] = [
  // 1. SQUASH & STRETCH
  {
    id: 'squash_stretch_bounce',
    name: 'Bouncy Ball',
    principle: 'squash_stretch',
    description: 'Classic bouncing ball with squash on impact and stretch in air',
    icon: 'circle',
    color: '#ef4444',
    duration: 1.0,
    loop: true,
    keyframes: [
      { time: 0.0, position: [0, 2, 0], scale: [1, 1.2, 1], easing: 'ease-in' },
      { time: 0.3, position: [0, 0, 0], scale: [1.3, 0.7, 1.3], easing: 'bounce' },
      { time: 0.5, position: [0, 1.2, 0], scale: [0.9, 1.1, 0.9], easing: 'ease-out' },
      { time: 0.7, position: [0, 0, 0], scale: [1.2, 0.8, 1.2], easing: 'bounce' },
      { time: 0.85, position: [0, 0.5, 0], scale: [1, 1, 1], easing: 'ease-out' },
      { time: 1.0, position: [0, 2, 0], scale: [1, 1.2, 1], easing: 'ease-in' },
    ],
    parameters: [
      { id: 'intensity', name: 'Squash Intensity', type: 'number', default: 1.0, min: 0.1, max: 2.0, step: 0.1 },
      { id: 'height', name: 'Bounce Height', type: 'number', default: 2.0, min: 0.5, max: 5.0, step: 0.5 },
    ],
  },

  // 2. ANTICIPATION
  {
    id: 'anticipation_jump',
    name: 'Jump Prep',
    principle: 'anticipation',
    description: 'Wind-up before a big action - crouch before jump',
    icon: 'arrow-up',
    color: '#f59e0b',
    duration: 1.2,
    loop: true,
    keyframes: [
      { time: 0.0, position: [0, 0, 0], scale: [1, 1, 1], easing: 'ease-out' },
      { time: 0.3, position: [0, -0.3, 0], scale: [1.1, 0.8, 1.1], easing: 'ease-in' }, // Crouch (anticipation)
      { time: 0.5, position: [0, 2, 0], scale: [0.9, 1.2, 0.9], easing: 'ease-out' }, // Jump!
      { time: 0.8, position: [0, 2.5, 0], scale: [1, 1, 1], easing: 'ease-in' }, // Peak
      { time: 1.0, position: [0, 0, 0], scale: [1.1, 0.9, 1.1], easing: 'bounce' }, // Land
      { time: 1.2, position: [0, 0, 0], scale: [1, 1, 1], easing: 'ease-out' }, // Settle
    ],
    parameters: [
      { id: 'windupTime', name: 'Wind-up Duration', type: 'number', default: 0.3, min: 0.1, max: 0.8, step: 0.05 },
      { id: 'jumpHeight', name: 'Jump Height', type: 'number', default: 2.5, min: 1, max: 5, step: 0.5 },
    ],
  },

  // 3. STAGING
  {
    id: 'staging_spotlight',
    name: 'Spotlight Reveal',
    principle: 'staging',
    description: 'Draw attention with scale and rotation emphasis',
    icon: 'eye',
    color: '#8b5cf6',
    duration: 2.0,
    loop: false,
    keyframes: [
      { time: 0.0, scale: [0.5, 0.5, 0.5], opacity: 0.3, easing: 'ease-out' },
      { time: 0.5, scale: [1.2, 1.2, 1.2], opacity: 1, rotation: [0, 15, 0], easing: 'back' },
      { time: 1.0, scale: [1, 1, 1], rotation: [0, 0, 0], easing: 'ease-in-out' },
      { time: 2.0, scale: [1, 1, 1], opacity: 1 },
    ],
    parameters: [
      { id: 'emphasis', name: 'Emphasis Scale', type: 'number', default: 1.2, min: 1.0, max: 2.0, step: 0.1 },
    ],
  },

  // 4. STRAIGHT AHEAD / POSE TO POSE
  {
    id: 'straight_ahead_wiggle',
    name: 'Organic Wiggle',
    principle: 'straight_ahead',
    description: 'Spontaneous, organic movement - like a worm or jelly',
    icon: 'move',
    color: '#22c55e',
    duration: 1.5,
    loop: true,
    keyframes: [
      { time: 0.0, rotation: [0, 0, 0], scale: [1, 1, 1], easing: 'ease-in-out' },
      { time: 0.25, rotation: [5, 10, -3], scale: [1.05, 0.95, 1], easing: 'ease-in-out' },
      { time: 0.5, rotation: [-3, -5, 5], scale: [0.95, 1.05, 1], easing: 'ease-in-out' },
      { time: 0.75, rotation: [3, -8, -2], scale: [1.02, 0.98, 1], easing: 'ease-in-out' },
      { time: 1.0, rotation: [-5, 5, 3], scale: [0.98, 1.02, 1], easing: 'ease-in-out' },
      { time: 1.25, rotation: [2, -3, -5], scale: [1.03, 0.97, 1], easing: 'ease-in-out' },
      { time: 1.5, rotation: [0, 0, 0], scale: [1, 1, 1], easing: 'ease-in-out' },
    ],
    parameters: [
      { id: 'intensity', name: 'Wiggle Amount', type: 'number', default: 1.0, min: 0.2, max: 3.0, step: 0.1 },
    ],
  },

  // 5. FOLLOW THROUGH & OVERLAPPING ACTION
  {
    id: 'follow_through_swing',
    name: 'Pendulum Swing',
    principle: 'follow_through',
    description: 'Motion continues after main action stops - like hair or tail',
    icon: 'activity',
    color: '#06b6d4',
    duration: 2.0,
    loop: true,
    keyframes: [
      { time: 0.0, rotation: [0, 0, 30], easing: 'ease-in' },
      { time: 0.5, rotation: [0, 0, -25], easing: 'ease-out' },
      { time: 1.0, rotation: [0, 0, 20], easing: 'ease-out' },
      { time: 1.4, rotation: [0, 0, -15], easing: 'ease-out' },
      { time: 1.7, rotation: [0, 0, 8], easing: 'ease-out' },
      { time: 2.0, rotation: [0, 0, 0], easing: 'ease-out' },
    ],
    parameters: [
      { id: 'swingAngle', name: 'Swing Angle', type: 'number', default: 30, min: 10, max: 90, step: 5 },
      { id: 'damping', name: 'Damping', type: 'number', default: 0.8, min: 0.3, max: 1.0, step: 0.1 },
    ],
  },

  // 6. SLOW IN & SLOW OUT
  {
    id: 'slow_in_out_slide',
    name: 'Smooth Slide',
    principle: 'slow_in_out',
    description: 'Gradual acceleration and deceleration - natural motion',
    icon: 'trending-up',
    color: '#ec4899',
    duration: 1.5,
    loop: true,
    keyframes: [
      { time: 0.0, position: [-2, 0, 0], easing: 'ease-in-out' },
      { time: 0.75, position: [2, 0, 0], easing: 'ease-in-out' },
      { time: 1.5, position: [-2, 0, 0], easing: 'ease-in-out' },
    ],
    parameters: [
      { id: 'distance', name: 'Travel Distance', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 },
    ],
  },

  // 7. ARCS
  {
    id: 'arcs_orbit',
    name: 'Orbital Arc',
    principle: 'arcs',
    description: 'Natural curved motion path - nothing moves in straight lines',
    icon: 'rotate-cw',
    color: '#14b8a6',
    duration: 3.0,
    loop: true,
    keyframes: [
      { time: 0.0, position: [2, 0, 0], rotation: [0, 0, 0], easing: 'linear' },
      { time: 0.75, position: [0, 0, 2], rotation: [0, 90, 0], easing: 'linear' },
      { time: 1.5, position: [-2, 0, 0], rotation: [0, 180, 0], easing: 'linear' },
      { time: 2.25, position: [0, 0, -2], rotation: [0, 270, 0], easing: 'linear' },
      { time: 3.0, position: [2, 0, 0], rotation: [0, 360, 0], easing: 'linear' },
    ],
    parameters: [
      { id: 'radius', name: 'Orbit Radius', type: 'number', default: 2, min: 0.5, max: 5, step: 0.5 },
      { id: 'speed', name: 'Speed', type: 'number', default: 1, min: 0.2, max: 3, step: 0.1 },
    ],
  },

  // 8. SECONDARY ACTION
  {
    id: 'secondary_action_walk',
    name: 'Walk Bounce',
    principle: 'secondary_action',
    description: 'Supporting action that reinforces the main action',
    icon: 'footprints',
    color: '#f97316',
    duration: 1.0,
    loop: true,
    keyframes: [
      { time: 0.0, position: [0, 0, 0], rotation: [0, 0, 5], easing: 'ease-in-out' },
      { time: 0.25, position: [0, 0.15, 0], rotation: [0, 0, -5], easing: 'ease-in-out' },
      { time: 0.5, position: [0, 0, 0], rotation: [0, 0, 5], easing: 'ease-in-out' },
      { time: 0.75, position: [0, 0.15, 0], rotation: [0, 0, -5], easing: 'ease-in-out' },
      { time: 1.0, position: [0, 0, 0], rotation: [0, 0, 5], easing: 'ease-in-out' },
    ],
    parameters: [
      { id: 'bobHeight', name: 'Bob Height', type: 'number', default: 0.15, min: 0.05, max: 0.5, step: 0.05 },
      { id: 'swayAngle', name: 'Sway Angle', type: 'number', default: 5, min: 1, max: 15, step: 1 },
    ],
  },

  // 9. TIMING
  {
    id: 'timing_snap',
    name: 'Quick Snap',
    principle: 'timing',
    description: 'Fast action with sharp timing for emphasis',
    icon: 'zap',
    color: '#eab308',
    duration: 0.5,
    loop: false,
    keyframes: [
      { time: 0.0, rotation: [0, 0, 0], scale: [1, 1, 1], easing: 'anticipate' },
      { time: 0.1, rotation: [0, 0, -10], scale: [1.1, 0.9, 1], easing: 'ease-in' }, // Wind up
      { time: 0.15, rotation: [0, 0, 180], scale: [0.9, 1.1, 1], easing: 'ease-out' }, // SNAP!
      { time: 0.35, rotation: [0, 0, 175], scale: [1.05, 0.95, 1], easing: 'elastic' }, // Overshoot
      { time: 0.5, rotation: [0, 0, 180], scale: [1, 1, 1], easing: 'ease-out' }, // Settle
    ],
    parameters: [
      { id: 'snapSpeed', name: 'Snap Speed', type: 'number', default: 1, min: 0.5, max: 2, step: 0.1 },
    ],
  },

  // 10. EXAGGERATION
  {
    id: 'exaggeration_stretch',
    name: 'Super Stretch',
    principle: 'exaggeration',
    description: 'Push proportions beyond reality for dramatic effect',
    icon: 'maximize',
    color: '#a855f7',
    duration: 1.0,
    loop: true,
    keyframes: [
      { time: 0.0, scale: [1, 1, 1], easing: 'ease-in' },
      { time: 0.3, scale: [0.6, 1.8, 0.6], easing: 'elastic' }, // Extreme stretch
      { time: 0.5, scale: [1.4, 0.5, 1.4], easing: 'bounce' }, // Extreme squash
      { time: 0.7, scale: [0.8, 1.3, 0.8], easing: 'ease-out' },
      { time: 1.0, scale: [1, 1, 1], easing: 'ease-in-out' },
    ],
    parameters: [
      { id: 'exaggeration', name: 'Exaggeration Level', type: 'number', default: 1.5, min: 1.0, max: 3.0, step: 0.1 },
    ],
  },

  // 11. SOLID DRAWING
  {
    id: 'solid_drawing_turntable',
    name: '3D Turntable',
    principle: 'solid_drawing',
    description: 'Rotate to show 3D form and volume',
    icon: 'box',
    color: '#64748b',
    duration: 4.0,
    loop: true,
    keyframes: [
      { time: 0.0, rotation: [0, 0, 0], easing: 'linear' },
      { time: 1.0, rotation: [0, 90, 0], easing: 'linear' },
      { time: 2.0, rotation: [0, 180, 0], easing: 'linear' },
      { time: 3.0, rotation: [0, 270, 0], easing: 'linear' },
      { time: 4.0, rotation: [0, 360, 0], easing: 'linear' },
    ],
    parameters: [
      { id: 'tilt', name: 'Tilt Angle', type: 'number', default: 0, min: -30, max: 30, step: 5 },
    ],
  },

  // 12. APPEAL
  {
    id: 'appeal_sparkle',
    name: 'Sparkle Pop',
    principle: 'appeal',
    description: 'Eye-catching entrance with personality',
    icon: 'sparkles',
    color: '#fbbf24',
    duration: 1.5,
    loop: false,
    keyframes: [
      { time: 0.0, scale: [0, 0, 0], opacity: 0, rotation: [0, -90, 0], easing: 'back' },
      { time: 0.4, scale: [1.3, 1.3, 1.3], opacity: 1, rotation: [0, 10, 0], easing: 'elastic' },
      { time: 0.7, scale: [0.9, 0.9, 0.9], rotation: [0, -5, 0], easing: 'ease-out' },
      { time: 1.0, scale: [1.05, 1.05, 1.05], rotation: [0, 3, 0], easing: 'ease-out' },
      { time: 1.5, scale: [1, 1, 1], rotation: [0, 0, 0], opacity: 1 },
    ],
    parameters: [
      { id: 'popScale', name: 'Pop Scale', type: 'number', default: 1.3, min: 1.0, max: 2.0, step: 0.1 },
      { id: 'spinAmount', name: 'Spin Amount', type: 'number', default: 90, min: 0, max: 360, step: 15 },
    ],
  },
];

// ============================================
// HELPERS
// ============================================

/** Get all patterns for a specific principle */
export function getPatternsByPrinciple(principle: AnimationPrinciple): AnimationPattern[] {
  return ANIMATION_PATTERNS.filter(p => p.principle === principle);
}

/** Get a pattern by ID */
export function getPatternById(id: string): AnimationPattern | undefined {
  return ANIMATION_PATTERNS.find(p => p.id === id);
}

/** Group patterns by principle for UI display */
export function getPatternsByCategory(): Record<AnimationPrinciple, AnimationPattern[]> {
  const result = {} as Record<AnimationPrinciple, AnimationPattern[]>;
  for (const pattern of ANIMATION_PATTERNS) {
    if (!result[pattern.principle]) {
      result[pattern.principle] = [];
    }
    result[pattern.principle].push(pattern);
  }
  return result;
}

/** Human-readable principle names */
export const PRINCIPLE_NAMES: Record<AnimationPrinciple, string> = {
  squash_stretch: '1. Squash & Stretch',
  anticipation: '2. Anticipation',
  staging: '3. Staging',
  straight_ahead: '4. Straight Ahead',
  follow_through: '5. Follow Through',
  slow_in_out: '6. Slow In/Out',
  arcs: '7. Arcs',
  secondary_action: '8. Secondary Action',
  timing: '9. Timing',
  exaggeration: '10. Exaggeration',
  solid_drawing: '11. Solid Drawing',
  appeal: '12. Appeal',
};

/** Principle descriptions for learning */
export const PRINCIPLE_DESCRIPTIONS: Record<AnimationPrinciple, string> = {
  squash_stretch: 'Objects squash when hitting and stretch when moving fast, giving weight and flexibility.',
  anticipation: 'A preparatory action before the main movement - winding up before throwing.',
  staging: 'Present an idea so it\'s completely clear - direct the audience\'s attention.',
  straight_ahead: 'Animating frame by frame for organic, spontaneous motion.',
  follow_through: 'Different parts of the body move at different rates - hair continues after head stops.',
  slow_in_out: 'More frames at the start and end of an action, fewer in the middle.',
  arcs: 'Almost all natural motion follows curved paths, not straight lines.',
  secondary_action: 'Additional actions that support the main action without distracting from it.',
  timing: 'The number of frames affects how fast or slow, light or heavy something feels.',
  exaggeration: 'Push movements further than reality for more dynamic, appealing animation.',
  solid_drawing: 'Understanding 3D form, weight, balance, and anatomy.',
  appeal: 'The charisma that makes a character interesting - not just beauty, but personality.',
};

// ============================================
// KEYFRAME INTERPOLATION
// ============================================

/** Interpolate between two values with easing */
export function interpolate(from: number, to: number, t: number, easing: EasingType = 'linear'): number {
  const easedT = applyEasing(t, easing);
  return from + (to - from) * easedT;
}

/** Apply easing function to normalized time (0-1) */
export function applyEasing(t: number, easing: EasingType): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return 1 - (1 - t) * (1 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case 'bounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        t -= 1.5 / 2.75;
        return 7.5625 * t * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        t -= 2.25 / 2.75;
        return 7.5625 * t * t + 0.9375;
      } else {
        t -= 2.625 / 2.75;
        return 7.5625 * t * t + 0.984375;
      }
    case 'elastic':
      if (t === 0 || t === 1) return t;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3));
    case 'back':
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    case 'anticipate':
      const c = 1.70158;
      return t * t * ((c + 1) * t - c);
    default:
      return t;
  }
}

/** Get interpolated transform at a specific time */
export function getTransformAtTime(pattern: AnimationPattern, time: number): {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  opacity: number;
} {
  const normalizedTime = pattern.loop ? time % pattern.duration : Math.min(time, pattern.duration);
  
  // Find surrounding keyframes
  let prevFrame = pattern.keyframes[0];
  let nextFrame = pattern.keyframes[pattern.keyframes.length - 1];
  
  for (let i = 0; i < pattern.keyframes.length - 1; i++) {
    if (normalizedTime >= pattern.keyframes[i].time && normalizedTime <= pattern.keyframes[i + 1].time) {
      prevFrame = pattern.keyframes[i];
      nextFrame = pattern.keyframes[i + 1];
      break;
    }
  }
  
  // Calculate interpolation factor
  const frameDuration = nextFrame.time - prevFrame.time;
  const t = frameDuration > 0 ? (normalizedTime - prevFrame.time) / frameDuration : 0;
  const easing = prevFrame.easing || 'linear';
  
  // Interpolate each property
  const position: [number, number, number] = [
    interpolate(prevFrame.position?.[0] ?? 0, nextFrame.position?.[0] ?? 0, t, easing),
    interpolate(prevFrame.position?.[1] ?? 0, nextFrame.position?.[1] ?? 0, t, easing),
    interpolate(prevFrame.position?.[2] ?? 0, nextFrame.position?.[2] ?? 0, t, easing),
  ];
  
  const rotation: [number, number, number] = [
    interpolate(prevFrame.rotation?.[0] ?? 0, nextFrame.rotation?.[0] ?? 0, t, easing),
    interpolate(prevFrame.rotation?.[1] ?? 0, nextFrame.rotation?.[1] ?? 0, t, easing),
    interpolate(prevFrame.rotation?.[2] ?? 0, nextFrame.rotation?.[2] ?? 0, t, easing),
  ];
  
  const scale: [number, number, number] = [
    interpolate(prevFrame.scale?.[0] ?? 1, nextFrame.scale?.[0] ?? 1, t, easing),
    interpolate(prevFrame.scale?.[1] ?? 1, nextFrame.scale?.[1] ?? 1, t, easing),
    interpolate(prevFrame.scale?.[2] ?? 1, nextFrame.scale?.[2] ?? 1, t, easing),
  ];
  
  const opacity = interpolate(prevFrame.opacity ?? 1, nextFrame.opacity ?? 1, t, easing);
  
  return { position, rotation, scale, opacity };
}
