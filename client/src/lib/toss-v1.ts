/**
 * TOSS v1.0 Schema - ThingOS Scene Specification
 * This is the FINALIZED contract from ThingOS backend
 */

// 3D Transform for positioning, rotation, scale
export interface Transform {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number }; // Euler angles in radians
  scale: { x: number; y: number; z: number };
}

// 3D Bounds for collision/layout
export interface Bounds {
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "tetrahedron" | "octahedron" | "icosahedron" | "dodecahedron";
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
}

// Material/visual properties
export interface MaterialProps {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  opacity?: number;
  transparent?: boolean;
}

// Animation defaults
export interface AnimationDefaults {
  on_spawn: "drop" | "fade_in" | "scale_up" | "none";
  on_impact: "squash" | "bounce" | "shatter" | "none";
  squash_intensity?: number;
  squash_recovery_speed?: number;
}

// Physics properties for objects
export interface PhysicsProps {
  mass: number;
  restitution: number;  // bounciness
  friction: number;
  anchored: boolean;    // if true, doesn't fall
  gravityScale: number; // 0 = floats, 1 = normal, >1 = heavy
  linearDamping?: number;
  angularDamping?: number;
  dropping?: boolean;   // temporary flag for drop animation on creation
}

// ============================================
// FORCE SYSTEM - Environmental forces with hitboxes
// ============================================

// Types of environmental forces
export type ForceType = "fire" | "ice" | "water" | "wind" | "magnet" | "gravity" | "electric";

// Force emitter - a source that applies forces to objects in its hitbox
export interface ForceEmitter {
  id: string;
  type: ForceType;
  enabled: boolean;
  
  // Position and hitbox
  transform: Transform;
  hitbox: Bounds;
  
  // Force properties
  magnitude: number;        // Strength of force (0-100)
  direction?: { x: number; y: number; z: number }; // For directional forces (wind, gravity)
  falloff?: "none" | "linear" | "quadratic"; // How force decreases with distance
  radius?: number;          // Max effect radius
  
  // Target filtering - which objects are affected
  targetFilter?: {
    itemIds?: string[];           // Specific item IDs to affect (empty = all)
    excludeItemIds?: string[];    // Items to exclude
    sensitivityRequired?: keyof SensitivityDeclarations; // Only affect items with this sensitivity
    tags?: string[];              // Only affect items with these tags
  };
  
  // Visual representation
  visualStyle?: "particles" | "glow" | "distortion" | "none";
  color?: string;
  showHitbox?: boolean;     // Visualize the hitbox in editor
  
  // Pulse/oscillation
  pulsing?: boolean;
  pulseFrequency?: number;  // Hz
}

// Sensitivity declarations - how objects react to forces
export interface SensitivityDeclarations {
  temperature?: {           // React to fire/ice
    sensitive: boolean;
    magnitude: number;      // 0-1, how strongly affected
    meltPoint?: number;     // Temperature at which state changes
    freezePoint?: number;
    onMelt?: string;        // Side effect action name
    onFreeze?: string;
  };
  magnetic?: {              // React to magnets
    sensitive: boolean;
    magnitude: number;
    polarity?: "positive" | "negative" | "neutral";
    onAttract?: string;
    onRepel?: string;
  };
  buoyancy?: {              // React to water
    sensitive: boolean;
    magnitude: number;      // <1 sinks, =1 neutral, >1 floats
    onSubmerge?: string;
    onSurface?: string;
  };
  aerodynamic?: {           // React to wind
    sensitive: boolean;
    dragCoefficient: number;
    liftCoefficient?: number;
    onGust?: string;
  };
  electric?: {              // React to electric forces
    sensitive: boolean;
    conductivity: number;   // 0-1
    charge?: number;        // coulombs
    onShock?: string;
  };
}

// Side effect definition - callbacks triggered by force interactions
export interface SideEffect {
  id: string;
  name: string;
  type: "state_change" | "spawn" | "destroy" | "sound" | "particle" | "animation" | "custom";
  
  // What triggers this effect
  trigger: {
    forceType: ForceType;
    forceEmitterId?: string;  // Specific emitter, or undefined for any
    condition: "enter" | "exit" | "threshold" | "continuous";
    threshold?: number;     // For threshold triggers
  };
  
  // Source/target relationship
  source: {
    type: "force_emitter" | "item" | "global";
    id?: string;            // Force emitter or item ID
  };
  target: {
    type: "self" | "other" | "specific";
    itemId?: string;        // For "specific" target type
    itemIds?: string[];     // Multiple targets
  };
  
  // What happens
  action: {
    targetState?: string;   // For state_change
    spawnItem?: string;     // For spawn (item template id)
    spawnAtTarget?: boolean; // Spawn at target location
    soundAsset?: string;    // For sound
    particleConfig?: Record<string, any>;
    animationName?: string;
    customHandler?: string; // Function name for custom
  };
  
  // Timing
  delay?: number;           // ms
  cooldown?: number;        // ms between triggers
  maxTriggers?: number;     // Limit total triggers (-1 = unlimited)
}

// Controller binding for an item
export interface ControllerBinding {
  focus_order?: number;
  focus_group?: string;
  bindings: Record<string, string>;  // e.g., { "A": "on_press", "LEFT_STICK_X": "slider_value" }
  haptic?: {
    on_press?: { pattern: string; intensity: number };
    on_hold?: { pattern: string; duration_ms: number };
  };
  // Device metadata
  device_profile?: string;  // e.g., "xbox", "playstation", "generic"
  input_latency_ms?: number;
}

// User assertion for TEST mode
export interface UserAssertion {
  id: string;
  description: string;
  type: "state_reached" | "value_equals" | "collision_occurred" | "time_elapsed" | "custom";
  target_item_id?: string;
  expected_state?: string;
  expected_value?: any;
  timeout_ms?: number;
  passed?: boolean;
}

// Per-item FSM (state machine)
export interface ItemFSM {
  initial: string;
  states: Record<string, Record<string, string>>;  // { "idle": { "on_press": "active" } }
}

// A single Thing/Item in the scene
export interface TossItem {
  id: string;
  label?: string;          // Human-readable display name
  component: string;       // e.g., "plain_button", "mesh_glyph"
  props: Record<string, any>;
  
  // Transform (position, rotation, scale)
  transform: Transform;
  
  // Collision bounds (separate from transform for flexibility)
  bounds: Bounds;
  
  // Visual properties
  material?: MaterialProps;
  animation?: AnimationDefaults;
  
  // Physics simulation
  physics?: PhysicsProps;
  
  // Controller input
  controller?: ControllerBinding;
  
  // Per-item state machine
  fsm?: ItemFSM;
  
  // Force sensitivity - how this object reacts to environmental forces
  sensitivity?: SensitivityDeclarations;
  
  // Side effects - callbacks triggered by force interactions
  sideEffects?: SideEffect[];
  
  // Hierarchy
  parent_id?: string;      // for hierarchical grouping
  children_ids?: string[]; // child items
}

// 3D Asset formats supported
export type Asset3DFormat = "gltf" | "glb" | "obj" | "stl" | "threejs-json";

// 3D Asset metadata
export interface Asset3DMetadata {
  name: string;
  format: Asset3DFormat;
  fileSize: number;           // bytes
  vertexCount?: number;
  faceCount?: number;
  hasAnimations?: boolean;
  hasTextures?: boolean;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  printable?: {               // 3D printing metadata
    watertight: boolean;
    volume_mm3?: number;
    surfaceArea_mm2?: number;
    units: "mm" | "cm" | "m" | "inches";
  };
  importedAt: string;         // ISO date
  originalFilename: string;
}

// 3D Asset stored in TOSS
export interface TossAsset3D {
  id: string;
  type: "model";
  metadata: Asset3DMetadata;
  data: string;               // base64-encoded binary for GLB/STL, or JSON string for GLTF/OBJ/ThreeJS
  thumbnail?: string;         // base64-encoded PNG preview
}

// Database asset for embedded SQLite
export interface TossDatabaseMetadata {
  name: string;
  fileSize: number;
  tableCount: number;
  tables: string[];
  importedAt: string;
  originalFilename?: string;
}

export interface TossDatabaseAsset {
  id: string;
  type: 'sqlite';
  metadata: TossDatabaseMetadata;
  data: string; // base64 encoded SQLite file
}

// General asset union (expandable for audio, images, etc.)
export type TossAsset = TossAsset3D | TossDatabaseAsset;

// Asset registry in cartridge
export interface TossAssetRegistry {
  models: TossAsset3D[];
  databases?: TossDatabaseAsset[];
}

// Commerce fields (for artsy.sale, unwanted.ad)
export interface CommerceFields {
  sku: string;
  price: number;
  currency: string;
  inventory_count?: number;
  is_digital?: boolean;
  weight_grams?: number;
}

// ============================================
// TIME CONTROLS - Timers and scheduling
// ============================================

// Timer types available in cartridges
export type TimerType = "countdown" | "stopwatch" | "scheduled" | "interval";

// A timer definition
export interface TossTimer {
  id: string;
  type: TimerType;
  
  // For countdown: target datetime or duration
  target_datetime?: string;     // ISO 8601 datetime (for scheduled)
  duration_ms?: number;         // Duration in milliseconds (for countdown/interval)
  
  // For relative timing
  starts_on?: string;           // FSM event that starts this timer
  stops_on?: string | string[]; // FSM event(s) that stop this timer
  
  // Behavior
  auto_start?: boolean;         // Start immediately when cartridge loads
  repeating?: boolean;          // For interval timers
  on_complete?: string;         // FSM event to emit when timer completes
  
  // Display
  visible?: boolean;            // Show countdown in UI
  format?: "hh:mm:ss" | "mm:ss" | "ss.ms" | "natural"; // Display format
  style?: "digital" | "analog" | "nixie" | "flip" | "steampunk";
}

// Clock display configuration
export interface TossClockConfig {
  visible: boolean;
  format: "12h" | "24h" | "relative";
  timezone_aware?: boolean;
  show_date?: boolean;
  show_seconds?: boolean;
  style?: "digital" | "analog" | "steampunk" | "nixie";
}

// Spacetime anchor - a point in space and time
export interface SpacetimeAnchor {
  datetime?: string;            // ISO 8601 datetime
  timezone?: string;            // IANA timezone identifier
  location?: {
    lat: number;
    lng: number;
    name?: string;
    geojson?: any;              // Full GeoJSON feature
  };
}

// Time controls section of cartridge
export interface TimeControls {
  timers?: TossTimer[];
  clock?: TossClockConfig;
  spacetime?: SpacetimeAnchor;  // The "when/where" of this cartridge
  
  // Time-based triggers
  triggers?: {
    on_datetime?: { datetime: string; emit: string }[];  // Fire events at specific times
    on_duration?: { after_ms: number; emit: string }[];  // Fire events after duration
  };
}

// Controller button/axis mapping to scene actions
export interface ControllerMappingEntry {
  input: string;           // e.g., "A", "LEFT_STICK_X", "RIGHT_TRIGGER"
  action: string;          // e.g., "select", "move_x", "zoom", "fire"
  sensitivity?: number;    // For analog inputs (0-2, default 1)
  deadzone?: number;       // For sticks (0-0.5, default 0.1)
  inverted?: boolean;      // Flip axis direction
}

// A named controller mapping preset
export interface ControllerPreset {
  id: string;
  name: string;                     // e.g., "Default", "Racing Mode", "Accessibility"
  description?: string;
  mappings: ControllerMappingEntry[];
  isDefault?: boolean;              // Mark as the default preset for this cartridge
  deviceProfile?: "xbox" | "playstation" | "switch" | "generic";
  createdAt?: string;
}

// Cartridge preview metadata for 3D library display
export interface CartridgePreview {
  thumbnailBase64?: string;         // PNG thumbnail of cartridge contents
  primaryColor?: string;            // Dominant color from contents
  itemCount: number;                // Number of items in cartridge
  assetCount: number;               // Number of 3D assets
  lastModified?: string;            // ISO date
  tags?: string[];                  // User-defined tags for organization
}

// Meta information
export interface TossMeta {
  title: string;
  author_platform_id?: string;
  description?: string;
  version?: string;
  created_at?: string;
  updated_at?: string;
  motivation?: string;  // WHY does this cartridge exist?
  seo?: {
    keywords?: string[];
    category?: string;
    tags?: string[];
    language?: string;
    ageRating?: 'everyone' | 'teen' | 'mature';
    previewImage?: string;
  };
}

// Test harness for cartridge validation
export interface TestHarness {
  assertions: UserAssertion[];
  last_run_at?: string;
  all_passed: boolean;
}

// ============================================
// COMMAND SYSTEM - CLI-like executable commands
// ============================================

// Argument type definitions for command parameters
export type CommandArgType = "string" | "number" | "boolean" | "item_id" | "state_id" | "json";

// A single command argument
export interface CommandArg {
  name: string;
  type: CommandArgType;
  required?: boolean;
  default?: any;
  description?: string;
}

// Permission levels for commands
export type CommandPermission = "public" | "authenticated" | "owner" | "admin";

// A command exposed by a cartridge (like a CLI executable)
export interface CommandDefinition {
  id: string;                          // Internal ID (unique within cartridge)
  tngli_id: string;                    // The "command name" in virtual PATH (e.g., "spawn", "reset", "buy")
  description: string;                 // Human-readable description
  args?: CommandArg[];                 // Command arguments
  permission?: CommandPermission;      // Who can run this command
  
  // What happens when command runs
  entrypoint: {
    type: "fsm_event" | "action" | "script";
    target?: string;                   // FSM event name or action ID
    handler?: string;                  // For scripts: function name or inline code
  };
  
  // Output configuration
  output?: {
    type: "void" | "json" | "text" | "item";
    schema?: Record<string, any>;      // JSON schema for structured output
  };
  
  // Aliases (alternative names for the command)
  aliases?: string[];
}

// Exports section - what the cartridge makes available to other carts
export interface CartridgeExports {
  commands?: CommandDefinition[];       // CLI-like commands
  items?: string[];                     // Item IDs available for external reference
  actions?: string[];                   // Action names that can be called
  events?: string[];                    // Events that can be subscribed to
}

// Boot configuration for bootable cartridges
export interface BootConfig {
  bootable: boolean;                    // Can this cart be used as boot cart?
  isDefaultBoot?: boolean;              // Is this the default boot cart for this user/project?
  bootPriority?: number;                // Priority when multiple boot carts available
  
  // What happens on boot
  onBoot?: {
    loadCartridges?: string[];          // Other cartridge tngli_ids to auto-load
    runCommand?: string;                // Command to run after boot
    setContext?: Record<string, any>;   // Initial context values
  };
  
  // Shell configuration
  shell?: {
    prompt?: string;                    // CLI prompt (e.g., "tingos> ")
    welcomeMessage?: string;            // Message shown on boot
    aliases?: Record<string, string>;   // Global command aliases
  };
}

// The full TOSS v1.0 cartridge
export interface TossCartridge {
  toss_version: "1.0";
  meta: TossMeta;
  items: TossItem[];
  commerce?: CommerceFields;
  
  // 3D assets and other binary content
  assets?: TossAssetRegistry;
  
  // Environmental force emitters (fire, ice, water, wind, etc.)
  forceEmitters?: ForceEmitter[];
  
  // Global side effects (cartridge-level callbacks)
  globalSideEffects?: SideEffect[];
  
  // Test harness for validation
  tests?: TestHarness;
  
  // Controller mapping presets (games/apps can have multiple)
  controllerPresets?: ControllerPreset[];
  
  // Time controls (timers, clocks, scheduling)
  timeControls?: TimeControls;
  
  // Preview metadata for 3D library display
  preview?: CartridgePreview;
  
  // ============================================
  // COMMAND SYSTEM (NEW)
  // ============================================
  
  // Exports - commands and resources this cartridge exposes
  exports?: CartridgeExports;
  
  // Boot configuration - for bootable cartridges
  boot?: BootConfig;
  
  // Editor-only metadata (stripped on export)
  _editor?: {
    mode: EditorMode;
    camera: { x: number; y: number; z: number; target: { x: number; y: number; z: number } };
    selected_ids: string[];
    gravity_enabled: boolean;
    activeControllerPresetId?: string;  // Currently active preset
  };
}

// Editor modes
export type EditorMode = "DESIGN" | "TEST" | "DEPLOY" | "PLAY";

// Default transform
export const DEFAULT_TRANSFORM: Transform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

// Default physics for new objects
export const DEFAULT_PHYSICS: PhysicsProps = {
  mass: 1,
  restitution: 0.3,   // slight bounce
  friction: 0.5,
  anchored: false,
  gravityScale: 1,
  linearDamping: 0.1,
  angularDamping: 0.1,
};

// Default material
export const DEFAULT_MATERIAL: MaterialProps = {
  color: "#7c3aed",
  roughness: 0.5,
  metalness: 0.1,
  opacity: 1,
  transparent: false,
};

// Default animation
export const DEFAULT_ANIMATION: AnimationDefaults = {
  on_spawn: "drop",
  on_impact: "squash",
  squash_intensity: 0.4,
  squash_recovery_speed: 8,
};

// Default controller preset for scene navigation
export const DEFAULT_SCENE_CONTROLS: ControllerMappingEntry[] = [
  { input: "LEFT_STICK_X", action: "camera_orbit_horizontal", sensitivity: 1, deadzone: 0.1 },
  { input: "LEFT_STICK_Y", action: "camera_orbit_vertical", sensitivity: 1, deadzone: 0.1 },
  { input: "RIGHT_STICK_X", action: "camera_pan_x", sensitivity: 0.5, deadzone: 0.1 },
  { input: "RIGHT_STICK_Y", action: "camera_pan_y", sensitivity: 0.5, deadzone: 0.1 },
  { input: "LEFT_TRIGGER", action: "camera_zoom_out", sensitivity: 1 },
  { input: "RIGHT_TRIGGER", action: "camera_zoom_in", sensitivity: 1 },
  { input: "A", action: "select" },
  { input: "B", action: "deselect" },
  { input: "X", action: "delete" },
  { input: "Y", action: "add_object" },
  { input: "LEFT_BUMPER", action: "previous_object" },
  { input: "RIGHT_BUMPER", action: "next_object" },
  { input: "DPAD_UP", action: "move_up" },
  { input: "DPAD_DOWN", action: "move_down" },
  { input: "DPAD_LEFT", action: "move_left" },
  { input: "DPAD_RIGHT", action: "move_right" },
  { input: "START", action: "toggle_menu" },
  { input: "SELECT", action: "toggle_layers" },
];

// Create a default controller preset
export function createDefaultControllerPreset(): ControllerPreset {
  return {
    id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: "Default Scene Controls",
    description: "Standard controller mapping for scene navigation and editing",
    mappings: [...DEFAULT_SCENE_CONTROLS],
    isDefault: true,
    deviceProfile: "generic",
    createdAt: new Date().toISOString(),
  };
}

// Create a new empty cartridge
export function createNewCartridge(): TossCartridge {
  const defaultPreset = createDefaultControllerPreset();
  return {
    toss_version: "1.0",
    meta: {
      title: "Untitled Cartridge",
      version: "0.1.0",
    },
    items: [],
    assets: {
      models: [],
      databases: [],
    },
    tests: {
      assertions: [],
      all_passed: false,
    },
    controllerPresets: [defaultPreset],
    preview: {
      itemCount: 0,
      assetCount: 0,
      primaryColor: "#7c3aed",
    },
    _editor: {
      mode: "DESIGN",
      camera: { x: 5, y: 5, z: 10, target: { x: 0, y: 0, z: 0 } },
      selected_ids: [],
      gravity_enabled: true,
      activeControllerPresetId: defaultPreset.id,
    },
  };
}

// Create a new Thing with physics defaults
export function createThing(
  component: string,
  position: { x: number; y: number; z: number },
  props: Record<string, any> = {}
): TossItem {
  return {
    id: `thing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    component,
    props,
    transform: {
      position: { ...position },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
    bounds: {
      type: "box",
      width: 1,
      height: 1,
      depth: 1,
    },
    material: { ...DEFAULT_MATERIAL, color: props.color || "#7c3aed" },
    animation: { ...DEFAULT_ANIMATION },
    physics: { ...DEFAULT_PHYSICS },
    fsm: {
      initial: "idle",
      states: {
        idle: {},
      },
    },
  };
}

// Standard button names for controllers
export const CONTROLLER_BUTTONS = [
  "A", "B", "X", "Y",
  "LEFT_BUMPER", "RIGHT_BUMPER",
  "LEFT_TRIGGER", "RIGHT_TRIGGER",
  "LEFT_STICK_X", "LEFT_STICK_Y", "RIGHT_STICK_X", "RIGHT_STICK_Y",
  "DPAD_UP", "DPAD_DOWN", "DPAD_LEFT", "DPAD_RIGHT",
  "START", "SELECT", "HOME", "SHARE",
  "LEFT_STICK_CLICK", "RIGHT_STICK_CLICK",
] as const;

// Component categories from spec
export const COMPONENT_CATEGORIES = [
  "layout",    // flow_stack, dock_pane, split_view, carousel_rail
  "media",     // image_frame, video_tile, audio_pad
  "text",      // rich_text, marquee_ticker, badge_pill
  "input",     // slider_rail, dial_knob, stepper_input, toggle_chip, date_picker, numeric_field
  "action",    // plain_button, icon_button, action_group
  "commerce",  // product_card, price_tag, inventory_meter
  "creative",  // particle_burst, mesh_glyph
] as const;
