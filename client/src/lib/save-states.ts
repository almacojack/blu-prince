import type { TossCartridge } from "./toss-v1.1";

export interface RuntimeStatechartInstance {
  id: string;
  current_state: string;
  context: Record<string, unknown>;
}

export interface SaveStateMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  playtime: number;
  slotIndex: number;
}

export interface SaveState {
  metadata: SaveStateMetadata;
  cartridgeId: string;
  cartridgeVersion: string;
  memory: Record<string, unknown>;
  statechartStates: Record<string, {
    currentState: string;
    context: Record<string, unknown>;
  }>;
  sceneSnapshot?: {
    cameraPosition: { x: number; y: number; z: number };
    cameraTarget: { x: number; y: number; z: number };
    meshTransforms: Record<string, {
      position: { x: number; y: number; z: number };
      rotation: { x: number; y: number; z: number };
      scale: { x: number; y: number; z: number };
    }>;
  };
}

export interface SaveStateSlot {
  index: number;
  label: string;
  saveState: SaveState | null;
  isAutoSave: boolean;
  isQuickSave: boolean;
}

export const MAX_SAVE_SLOTS = 10;
export const AUTO_SAVE_SLOT_INDEX = 0;
export const QUICK_SAVE_SLOT_INDEX = 1;

export function createSaveStateSlots(): SaveStateSlot[] {
  const slots: SaveStateSlot[] = [];
  
  slots.push({
    index: AUTO_SAVE_SLOT_INDEX,
    label: "Auto Save",
    saveState: null,
    isAutoSave: true,
    isQuickSave: false,
  });
  
  slots.push({
    index: QUICK_SAVE_SLOT_INDEX,
    label: "Quick Save",
    saveState: null,
    isAutoSave: false,
    isQuickSave: true,
  });
  
  for (let i = 2; i < MAX_SAVE_SLOTS; i++) {
    slots.push({
      index: i,
      label: `Slot ${i - 1}`,
      saveState: null,
      isAutoSave: false,
      isQuickSave: false,
    });
  }
  
  return slots;
}

export function captureGameState(
  cartridge: TossCartridge,
  statechartInstances: Record<string, RuntimeStatechartInstance>,
  cameraState?: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }
): Omit<SaveState, "metadata"> {
  const statechartStates: SaveState["statechartStates"] = {};
  
  for (const [id, instance] of Object.entries(statechartInstances)) {
    statechartStates[id] = {
      currentState: instance.current_state,
      context: { ...instance.context },
    };
  }
  
  const meshTransforms: NonNullable<SaveState["sceneSnapshot"]>["meshTransforms"] = {};
  for (const mesh of cartridge.meshes || []) {
    meshTransforms[mesh.id] = {
      position: { ...mesh.transform.position },
      rotation: { ...mesh.transform.rotation },
      scale: { ...mesh.transform.scale },
    };
  }
  
  const memory: Record<string, unknown> = {};
  for (const [id, instance] of Object.entries(statechartInstances)) {
    memory[id] = instance.context;
  }
  
  return {
    cartridgeId: cartridge.meta.title,
    cartridgeVersion: cartridge.meta.version || "1.0.0",
    memory,
    statechartStates,
    sceneSnapshot: cameraState ? {
      cameraPosition: cameraState.position,
      cameraTarget: cameraState.target,
      meshTransforms,
    } : undefined,
  };
}

export function createSaveState(
  cartridge: TossCartridge,
  statechartInstances: Record<string, RuntimeStatechartInstance>,
  slotIndex: number,
  name?: string,
  cameraState?: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }
): SaveState {
  const gameState = captureGameState(cartridge, statechartInstances, cameraState);
  
  return {
    metadata: {
      id: `save_${Date.now()}`,
      name: name || `Save ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      playtime: 0,
      slotIndex,
    },
    ...gameState,
  };
}

export function restoreGameState(
  saveState: SaveState,
  cartridge: TossCartridge,
  statechartInstances: Record<string, RuntimeStatechartInstance>
): {
  updatedCartridge: TossCartridge;
  updatedInstances: Record<string, RuntimeStatechartInstance>;
} {
  const updatedInstances = { ...statechartInstances };
  
  for (const [id, state] of Object.entries(saveState.statechartStates)) {
    if (updatedInstances[id]) {
      updatedInstances[id] = {
        ...updatedInstances[id],
        current_state: state.currentState,
        context: { ...state.context },
      };
    }
  }
  
  for (const [id, memoryData] of Object.entries(saveState.memory)) {
    if (updatedInstances[id] && typeof memoryData === 'object' && memoryData !== null) {
      updatedInstances[id] = {
        ...updatedInstances[id],
        context: { ...memoryData as Record<string, unknown> },
      };
    }
  }
  
  const updatedMeshes = (cartridge.meshes || []).map(mesh => {
    const savedTransform = saveState.sceneSnapshot?.meshTransforms[mesh.id];
    if (savedTransform) {
      return {
        ...mesh,
        transform: savedTransform,
      };
    }
    return mesh;
  });
  
  return {
    updatedCartridge: {
      ...cartridge,
      meshes: updatedMeshes,
    },
    updatedInstances,
  };
}

export function serializeSaveSlots(slots: SaveStateSlot[]): string {
  return JSON.stringify(slots);
}

export function deserializeSaveSlots(json: string): SaveStateSlot[] {
  try {
    return JSON.parse(json);
  } catch {
    return createSaveStateSlots();
  }
}

export function getSaveSlotStorageKey(cartridgeId: string): string {
  return `tingos_saves_${cartridgeId}`;
}

export function saveSlotsToStorage(cartridgeId: string, slots: SaveStateSlot[]): void {
  const key = getSaveSlotStorageKey(cartridgeId);
  localStorage.setItem(key, serializeSaveSlots(slots));
}

export function loadSlotsFromStorage(cartridgeId: string): SaveStateSlot[] {
  const key = getSaveSlotStorageKey(cartridgeId);
  const stored = localStorage.getItem(key);
  if (stored) {
    return deserializeSaveSlots(stored);
  }
  return createSaveStateSlots();
}

export function quickSave(
  cartridge: TossCartridge,
  statechartInstances: Record<string, RuntimeStatechartInstance>,
  slots: SaveStateSlot[],
  cameraState?: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }
): SaveStateSlot[] {
  const saveState = createSaveState(
    cartridge,
    statechartInstances,
    QUICK_SAVE_SLOT_INDEX,
    "Quick Save",
    cameraState
  );
  
  return slots.map(slot => 
    slot.index === QUICK_SAVE_SLOT_INDEX
      ? { ...slot, saveState }
      : slot
  );
}

export function autoSave(
  cartridge: TossCartridge,
  statechartInstances: Record<string, RuntimeStatechartInstance>,
  slots: SaveStateSlot[],
  cameraState?: { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } }
): SaveStateSlot[] {
  const saveState = createSaveState(
    cartridge,
    statechartInstances,
    AUTO_SAVE_SLOT_INDEX,
    "Auto Save",
    cameraState
  );
  
  return slots.map(slot => 
    slot.index === AUTO_SAVE_SLOT_INDEX
      ? { ...slot, saveState }
      : slot
  );
}
