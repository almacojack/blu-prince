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
}

// Test harness for cartridge validation
export interface TestHarness {
  assertions: UserAssertion[];
  last_run_at?: string;
  all_passed: boolean;
}

// The full TOSS v1.0 cartridge
export interface TossCartridge {
  toss_version: "1.0";
  meta: TossMeta;
  items: TossItem[];
  commerce?: CommerceFields;
  
  // 3D assets and other binary content
  assets?: TossAssetRegistry;
  
  // Test harness for validation
  tests?: TestHarness;
  
  // Controller mapping presets (games/apps can have multiple)
  controllerPresets?: ControllerPreset[];
  
  // Preview metadata for 3D library display
  preview?: CartridgePreview;
  
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
export type EditorMode = "DESIGN" | "TEST" | "DEPLOY" | "RUN";

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
