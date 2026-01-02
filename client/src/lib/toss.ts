/**
 * TOSS (ThingOs State Schema)
 * The standardized protocol for all cartridges in the TingOs ecosystem.
 * This schema acts as the contract between the Blu-Prince designer, 
 * the TingOs runtime, and the Marketplace apps.
 */

// 1. Manifest: The metadata "Jacket" for the cartridge
export interface TossManifest {
  id: string;              // UUID
  tngli_id: string;        // Short ID for QR codes (e.g. "tng.li/xyz")
  title: string;
  description: string;
  version: string;         // SemVer (e.g. "1.0.0")
  author: string;
  license: string;         // e.g. "MIT", "CC-BY"
  domain: 'game' | 'business' | 'art' | 'iot';
  tags: string[];
  created_at: string;      // ISO Date
  updated_at: string;      // ISO Date
}

// 2. State Machine: The "Brain" (Harel Statecharts inspired)
export interface TossState {
  id: string;
  label: string;
  type: 'initial' | 'state' | 'compound' | 'final' | 'history';
  on_entry?: TossAction[];
  on_exit?: TossAction[];
  transitions: TossTransition[];
  children?: TossState[];  // For nested state machines
  meta?: Record<string, any>; // Flexible metadata for UI coordinates (x,y)
}

export interface TossTransition {
  event: string;           // The trigger (e.g., "BUTTON_A", "PAYMENT_RECEIVED")
  target: string;          // Target State ID
  guard?: string;          // Condition expression (e.g. "ctx.coins > 10")
  action?: TossAction[];   // Side effects
}

export interface TossAction {
  type: string;            // e.g. "UPDATE_CONTEXT", "PLAY_SOUND", "HTTP_POST"
  payload: Record<string, any>;
}

// 3. Assets: The "Media" (External references only, no binaries)
export interface TossAsset {
  key: string;             // Reference key (e.g. "hero_sprite")
  type: 'image' | 'sound' | 'video' | 'model_3d' | 'font';
  url: string;             // MUST be external URL or IPFS hash
  fallback_color?: string; // For low-res displays
}

// 4. Context: The "Memory"
export interface TossContextSchema {
  variables: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'json';
    default: any;
  }>;
}

// THE CARTRIDGE: The complete standardized payload
export interface TossCartridge {
  manifest: TossManifest;
  fsm: {
    initial: string;
    states: Record<string, TossState>;
  };
  context_schema: TossContextSchema;
  assets: Record<string, TossAsset>;
  
  // Blu-Prince specific data (not needed for runtime, but needed for editing)
  editor?: {
    nodes: Array<{ id: string; x: number; y: number; color?: string }>;
    zoom: number;
    pan: { x: number; y: number };
  };
}

/**
 * MOCK DATA GENERATOR
 * Helps visualize valid TOSS files
 */
export const createEmptyCartridge = (): TossCartridge => ({
  manifest: {
    id: crypto.randomUUID(),
    tngli_id: "",
    title: "Untitled Cartridge",
    description: "New TOSS project",
    version: "0.0.1",
    author: "Anonymous",
    license: "UNLICENSED",
    domain: "game",
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  fsm: {
    initial: "init",
    states: {
      "init": {
        id: "init",
        label: "Initialize",
        type: "initial",
        transitions: []
      }
    }
  },
  context_schema: { variables: {} },
  assets: {},
  editor: {
    nodes: [{ id: "init", x: 100, y: 100, color: "bg-green-500" }],
    zoom: 1,
    pan: { x: 0, y: 0 }
  }
});
