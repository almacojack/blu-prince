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

export interface TossAssetRegistry {
  // Legacy keyed assets (external refs)
  refs?: Record<string, TossAssetRef>;
  // Inline 3D models
  models?: Toss3DAsset[];
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

