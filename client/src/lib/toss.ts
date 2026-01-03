/**
 * TOSS (ThingOs State Schema) - FILE FORMAT SPECIFICATION
 * 
 * CRITICAL ARCHITECTURE NOTE:
 * TOSS files are self-contained, portable, execution-ready payloads.
 * They are NOT database records. They are "Cartridges".
 * 
 * The Database (if any) only stores the BLOB of this JSON.
 * The Database does NOT know about States, Transitions, or Context variables.
 * Only the TingOs Runtime (and this Schema) understands the internals.
 */

// 1. The Canonical "Outer Shell" (The minimal contract to be a TOSS file)
export interface TossManifest {
  // The minimal standard metadata every system can read
  id: string;              // Unique Cartridge ID
  tngli_id: string;        // The "Label" (e.g. tng.li/pokemon-red)
  spec_version: string;    // TOSS Spec Version (e.g. "1.0")
  
  meta: {
    title: string;
    description: string;
    author: string;
    version: string;       // Cartridge Version
    icon_asset_key?: string; // Reference to an asset key
  };
}

// 2. The "Brain" (Encapsulated Logic - Opaque to the DB)
export interface TossFSM {
  initial: string;
  states: Record<string, TossState>;
}

export interface TossState {
  id: string;
  type: 'initial' | 'state' | 'compound' | 'final';
  
  // Logic hooks (Strings to be interpreted by Runtime)
  on_entry?: string[]; 
  on_exit?: string[];
  
  transitions: Array<{
    event: string;
    target: string;
    guard?: string;
    action?: string[];
  }>;
}

// 3. The "Memory" (Initial State Schema)
export interface TossContext {
  // Schema definition for the machine's memory
  schema: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object';
    default_value: any;
  }>;
}

// 4. The "Resources" (External Links - No binaries in the payload)
export interface TossAssetRef {
  type: 'image' | 'audio' | 'video' | 'model';
  uri: string; // Must be a portable URL (ipfs://, https://, asset://)
}

// Sprite/Image asset for UI elements, game graphics, icons
export interface TossImageMetadata {
  name: string;
  format: 'png' | 'jpg' | 'webp' | 'gif' | 'svg' | 'ico' | 'xpm' | 'bmp';
  originalFormat: string;
  width: number;
  height: number;
  fileSize: number;
  compressedSize?: number;
  hasAlpha: boolean;
  colorDepth: 8 | 16 | 24 | 32;
  palette?: string[]; // For indexed color images (XPM, GIF)
  frameCount?: number; // For animated GIF
  importedAt: string;
  originalFilename: string;
}

export interface TossImageAsset {
  id: string;
  type: 'image';
  metadata: TossImageMetadata;
  data: string; // base64 encoded image data
  thumbnail?: string; // small base64 preview for UI
  variants?: {
    // Multiple resolutions for responsive/retro displays
    size: string; // e.g., "1x", "2x", "thumb", "icon"
    data: string;
    width: number;
    height: number;
  }[];
}

// Sprite sheet for animation and game graphics
export interface TossSpriteSheetMetadata {
  name: string;
  format: 'png' | 'webp';
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  columns: number;
  rows: number;
  animations?: {
    name: string;
    frames: number[]; // frame indices
    fps: number;
    loop: boolean;
  }[];
  importedAt: string;
  originalFilename: string;
}

export interface TossSpriteSheetAsset {
  id: string;
  type: 'spritesheet';
  metadata: TossSpriteSheetMetadata;
  data: string; // base64 encoded sprite sheet
}

// 3D Asset stored inline (for GLB, STL, etc.)
export interface Toss3DAssetMetadata {
  name: string;
  format: 'gltf' | 'glb' | 'obj' | 'stl' | 'threejs-json';
  fileSize: number;
  vertexCount?: number;
  faceCount?: number;
  hasAnimations?: boolean;
  hasTextures?: boolean;
  boundingBox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
  printable?: {
    watertight: boolean;
    volume_mm3?: number;
    surfaceArea_mm2?: number;
    units: 'mm' | 'cm' | 'm' | 'inches';
  };
  importedAt: string;
  originalFilename: string;
}

export interface Toss3DAsset {
  id: string;
  type: 'model';
  metadata: Toss3DAssetMetadata;
  data: string; // base64 or JSON string
  thumbnail?: string;
}

// Embedded SQLite database asset
export interface TossDatabaseMetadata {
  name: string;
  fileSize: number;
  tableCount?: number;
  tables?: string[];
  importedAt: string;
  originalFilename: string;
}

export interface TossDatabaseAsset {
  id: string;
  type: 'sqlite';
  metadata: TossDatabaseMetadata;
  data: string; // base64 encoded SQLite file
}

// Font asset for text extrusion and UI rendering
export interface TossFontMetadata {
  name: string;
  family: string;
  style: 'normal' | 'italic' | 'oblique';
  weight: number; // 100-900
  format: 'ttf' | 'otf' | 'woff' | 'woff2';
  originalFormat: 'ttf' | 'otf';
  fileSize: number;
  compressedSize: number;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  glyphCount: number;
  subsetGlyphs?: string; // character ranges included (e.g., "A-Za-z0-9")
  importedAt: string;
  originalFilename: string;
}

export interface TossFontAsset {
  id: string;
  type: 'font';
  metadata: TossFontMetadata;
  data: string; // base64 encoded WOFF2 (compressed)
  originalData?: string; // base64 encoded original TTF/OTF (for editing)
  glyphPaths?: Record<string, string>; // SVG path data per glyph for 3D extrusion
}

// Sculpt history for procedural model rebuilding
export interface TossSculptOperation {
  id: string;
  type: 'csg_union' | 'csg_subtract' | 'csg_intersect' | 'extrude' | 'revolve' | 'scale' | 'smooth' | 'shell' | 'text_extrude' | 'repair_watertight';
  params: Record<string, any>;
  timestamp: string;
}

export interface TossSculptedModel {
  id: string;
  type: 'sculpted';
  baseModelId?: string; // reference to source model if derived
  history: TossSculptOperation[];
  metadata: Toss3DAssetMetadata;
  data: string; // compiled mesh as base64
}

export interface TossAssetRegistry {
  // Legacy keyed assets (external refs)
  refs?: Record<string, TossAssetRef>;
  // Inline 3D models
  models?: Toss3DAsset[];
  // Embedded SQLite databases
  databases?: TossDatabaseAsset[];
  // Embedded fonts for text rendering and extrusion
  fonts?: TossFontAsset[];
  // Sculpted/procedural models with edit history
  sculptedModels?: TossSculptedModel[];
  // Images and sprites (PNG, JPG, WebP, GIF, SVG, ICO, XPM)
  images?: TossImageAsset[];
  // Sprite sheets for animation
  spriteSheets?: TossSpriteSheetAsset[];
}

// THE FILE (The Portable Payload)
export interface TossFile {
  manifest: TossManifest;
  logic: TossFSM;
  memory: TossContext;
  assets: TossAssetRegistry;
  
  // Editor-only metadata (Stripped before 'Burning' the cartridge if desired, 
  // but often kept for "Open Source" cartridges that can be remixed)
  _editor?: {
    nodes: Array<{ id: string; x: number; y: number; color?: string }>;
    viewport: { x: number; y: number; zoom: number };
  };
}

/**
 * FACTORY: Creates a valid, empty TOSS File
 */
export const createNewTossFile = (): TossFile => ({
  manifest: {
    id: crypto.randomUUID(),
    tngli_id: "",
    spec_version: "1.0",
    meta: {
      title: "Untitled Cartridge",
      description: "A new state machine adventure",
      author: "Anonymous",
      version: "0.0.1"
    }
  },
  logic: {
    initial: "init",
    states: {
      "init": {
        id: "init",
        type: "initial",
        transitions: []
      }
    }
  },
  memory: {
    schema: {}
  },
  assets: { models: [] },
  _editor: {
    nodes: [{ id: "init", x: 100, y: 100, color: "bg-green-500" }],
    viewport: { x: 0, y: 0, zoom: 1 }
  }
});

