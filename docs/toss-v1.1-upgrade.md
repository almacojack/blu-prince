# TOSS v1.1 Upgrade Specification

## Overview

TOSS v1.1 adds support for:
1. **Multiple statecharts per cartridge** - Coordinated FSMs with roles
2. **Event bus** - Cross-chart communication
3. **Extended physics forces** - Magnets, springs, hinges, dampers
4. **Hardware profiles** - Manufacturing data for physical products
5. **Accessory metadata** - For mountable carts

## Backward Compatibility

- v1.0 carts continue to work unchanged
- Single `fsm` field still supported (treated as legacy)
- New features are additive, not breaking

---

## Schema Changes

### 1. Version Bump

```typescript
// OLD
toss_version: "1.0"

// NEW
toss_version: "1.0" | "1.1"
```

### 2. Multiple Statecharts

```typescript
// NEW: Statechart role types
export type StatechartRole = "ui" | "physics" | "network" | "logic" | "custom";

// NEW: Individual statechart definition
export interface StatechartDefinition {
  id: string;
  role: StatechartRole;
  description?: string;
  
  // The FSM definition (same structure as existing ItemFSM)
  fsm: {
    initial: string;
    states: Record<string, Record<string, string>>;
    context?: Record<string, any>;  // NEW: Scoped context per chart
  };
  
  // Event subscriptions from the bus
  subscribes?: string[];  // Events this chart listens to
  publishes?: string[];   // Events this chart can emit
}

// NEW: Statecharts registry
export interface StatechartRegistry {
  [chartId: string]: StatechartDefinition;
}
```

### 3. Event Bus

```typescript
// NEW: Event bus configuration
export interface EventBusConfig {
  channels: string[];  // Named channels for organization
  
  // Optional: Define allowed event types
  eventTypes?: {
    [eventName: string]: {
      payload?: Record<string, any>;  // Expected payload schema
      source?: string;  // Which chart(s) can emit
    };
  };
}
```

### 4. Extended Physics Forces

```typescript
// UPDATED: Add new force types
export type ForceType = 
  | "fire" | "ice" | "water" | "wind" | "magnet" | "gravity" | "electric"
  // NEW v1.1 forces:
  | "magnet_attract" | "magnet_repel" 
  | "spring_joint" | "hinge_joint" | "damper";

// NEW: Joint definitions for physics
export interface JointDefinition {
  id: string;
  type: "spring" | "hinge" | "fixed" | "slider" | "ball";
  
  // Connected bodies
  bodyA: string;  // Item ID
  bodyB: string;  // Item ID or "world" for fixed point
  
  // Anchor points (local to each body)
  anchorA?: { x: number; y: number; z: number };
  anchorB?: { x: number; y: number; z: number };
  
  // Joint-specific properties
  properties: {
    // Spring
    stiffness?: number;      // N/m
    damping?: number;        // 0-1
    restLength?: number;     // meters
    
    // Hinge
    axis?: { x: number; y: number; z: number };
    limits?: { min: number; max: number };  // radians
    motor?: { speed: number; torque: number };
    
    // Slider
    slideAxis?: { x: number; y: number; z: number };
    slideLimits?: { min: number; max: number };  // meters
  };
  
  // Visual
  visible?: boolean;
  color?: string;
}
```

### 5. Hardware Profile

```typescript
// NEW: Hardware cartridge profile
export interface HardwareProfile {
  productId: string;
  
  manufacturingData?: {
    stlFiles: string[];           // Asset IDs referencing TossAsset3D
    bomItems: {
      partNumber: string;
      description: string;
      quantity: number;
      supplier?: string;
      unitCost?: number;
    }[];
    assemblyNotes?: string;
    tools?: string[];             // Required tools
    estimatedTime?: number;       // Minutes
  };
  
  firmwareTarget?: {
    mcu: "esp32" | "esp32-s3" | "rp2040" | "stm32" | "nrf52";
    radioStack?: "lora" | "ble" | "wifi" | "zigbee" | "thread";
    calibration?: Record<string, number>;
    flashSize?: number;           // KB
    ramSize?: number;             // KB
  };
  
  packaging?: {
    boxDimensions: [number, number, number];  // mm
    weight: number;               // grams
    shippingClass: "letter" | "standard" | "oversized" | "fragile";
    includesManual?: boolean;
    includesAccessories?: string[];
  };
}
```

### 6. Accessory Metadata

```typescript
// NEW: Accessory cart metadata
export interface AccessoryMetadata {
  isAccessory: boolean;
  
  // What this accessory provides
  provides: {
    commands?: string[];          // Command tngli_ids added
    panels?: string[];            // UI panels added
    assets?: string[];            // Asset types added
    forces?: ForceType[];         // Physics forces added
  };
  
  // Compatibility
  compatibleWith?: {
    cartridgeIds?: string[];      // Specific cart IDs
    categories?: string[];        // Cart categories
    all?: boolean;                // Works with any cart
  };
  
  // PATH priority (lower = runs first)
  priority?: number;              // Default: 50 (range 0-100)
  
  // Licensing
  pricing?: {
    type: "free" | "one-time" | "subscription";
    amount?: number;
    currency?: string;
    trialDays?: number;
  };
}
```

### 7. Updated TossCartridge Interface

```typescript
export interface TossCartridge {
  toss_version: "1.0" | "1.1";
  meta: TossMeta;
  items: TossItem[];
  commerce?: CommerceFields;
  assets?: TossAssetRegistry;
  forceEmitters?: ForceEmitter[];
  globalSideEffects?: SideEffect[];
  tests?: TestHarness;
  controllerPresets?: ControllerPreset[];
  timeControls?: TimeControls;
  preview?: CartridgePreview;
  exports?: CartridgeExports;
  boot?: BootConfig;
  
  // ============================================
  // NEW IN v1.1
  // ============================================
  
  // Multiple statecharts (replaces per-item FSM for complex carts)
  statecharts?: StatechartRegistry;
  
  // Event bus for cross-chart communication
  eventBus?: EventBusConfig;
  
  // Physics joints
  joints?: JointDefinition[];
  
  // Hardware profile (for physical products)
  hardware?: HardwareProfile;
  
  // Accessory metadata (for mountable carts)
  accessory?: AccessoryMetadata;
  
  // Legacy single FSM (still supported for backward compat)
  fsm?: {
    initial: string;
    states: Record<string, Record<string, string>>;
  };
  
  _editor?: {
    mode: EditorMode;
    camera: { x: number; y: number; z: number; target: { x: number; y: number; z: number } };
    selected_ids: string[];
    gravity_enabled: boolean;
    activeControllerPresetId?: string;
  };
}
```

---

## Migration Steps

### Step 1: Update Type Definitions

File: `client/src/lib/toss-v1.ts`

1. Add new type definitions (StatechartRole, StatechartDefinition, etc.)
2. Update ForceType with new values
3. Add JointDefinition interface
4. Add HardwareProfile interface
5. Add AccessoryMetadata interface
6. Update TossCartridge interface with new fields
7. Update toss_version type to allow "1.1"

### Step 2: Update Factory Functions

File: `client/src/lib/toss-v1.ts`

1. Update `createNewCartridge()` to optionally create v1.1 carts
2. Add `createStatechart()` helper function
3. Add `createJoint()` helper function
4. Add `migrateToV1_1()` function for upgrading old carts

### Step 3: Update TingOS Engine

File: `client/src/lib/tingos-engine.ts`

1. Add statechart registry support
2. Add event bus implementation
3. Add multi-chart coordination
4. Support lazy loading of charts

### Step 4: Update Editor

Files in `client/src/components/`

1. Add Statechart panel for managing multiple charts
2. Add Event Bus viewer
3. Add Joint editor
4. Add Hardware Profile panel
5. Add Accessory configuration

### Step 5: Update Runtime

File: `client/src/pages/runtime.tsx`

1. Load and run multiple statecharts
2. Coordinate state transitions across charts
3. Handle event bus messages

---

## Helper Functions to Add

```typescript
// Create a new v1.1 cartridge
export function createNewCartridgeV1_1(): TossCartridge {
  const base = createNewCartridge();
  return {
    ...base,
    toss_version: "1.1",
    statecharts: {},
    eventBus: { channels: ["default"] },
    joints: [],
  };
}

// Create a new statechart
export function createStatechart(
  id: string,
  role: StatechartRole,
  initialState: string = "idle"
): StatechartDefinition {
  return {
    id,
    role,
    fsm: {
      initial: initialState,
      states: {
        [initialState]: {},
      },
      context: {},
    },
    subscribes: [],
    publishes: [],
  };
}

// Create a spring joint
export function createSpringJoint(
  bodyA: string,
  bodyB: string,
  stiffness: number = 100,
  damping: number = 0.3
): JointDefinition {
  return {
    id: `joint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: "spring",
    bodyA,
    bodyB,
    properties: {
      stiffness,
      damping,
      restLength: 1,
    },
    visible: true,
    color: "#00ff00",
  };
}

// Create a hinge joint
export function createHingeJoint(
  bodyA: string,
  bodyB: string,
  axis: { x: number; y: number; z: number } = { x: 0, y: 1, z: 0 },
  limits?: { min: number; max: number }
): JointDefinition {
  return {
    id: `joint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: "hinge",
    bodyA,
    bodyB,
    properties: {
      axis,
      limits,
    },
    visible: true,
    color: "#ffaa00",
  };
}

// Migrate v1.0 cart to v1.1
export function migrateToV1_1(cart: TossCartridge): TossCartridge {
  if (cart.toss_version === "1.1") {
    return cart; // Already v1.1
  }
  
  return {
    ...cart,
    toss_version: "1.1",
    statecharts: {},
    eventBus: { channels: ["default"] },
    joints: [],
  };
}

// Check if cart is v1.1
export function isV1_1(cart: TossCartridge): boolean {
  return cart.toss_version === "1.1";
}
```

---

## Testing Checklist

- [ ] v1.0 carts load and run without errors
- [ ] v1.1 carts with multiple statecharts work
- [ ] Event bus delivers messages between charts
- [ ] Spring joints apply correct forces
- [ ] Hinge joints rotate within limits
- [ ] Hardware profiles save and load
- [ ] Accessory carts mount correctly
- [ ] Migration function upgrades v1.0 → v1.1

---

*Document Version: 1.0*
*Created: January 2026*
