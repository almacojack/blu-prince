import { TossCartridge, TossItem, createNewCartridge, createThing } from "./toss-v1";

export function createHelpCartridge(): TossCartridge {
  const helpCartridge = createNewCartridge();
  
  helpCartridge.meta = {
    title: "USER MANUAL",
    author_platform_id: "tingos-system",
    description: "Welcome to TingOs! This interactive manual teaches you everything you need to know.",
    version: "1.0.0",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const welcomeBox = createThing("box", { x: 0, y: 2, z: 0 }, { 
    label: "WELCOME",
    color: "#7c3aed",
    helpText: `TingOs is a universal gaming engine platform. 
    
Cartridges are self-contained apps that run in the TingOs runtime.

Use the header to switch between 3D Editor, FSM Editor, and Data Tables.

The command palette (Ctrl+K) provides quick access to all features.`
  });
  welcomeBox.material = { ...welcomeBox.material!, color: "#7c3aed" };
  welcomeBox.fsm = {
    initial: "intro",
    states: {
      intro: { next: "navigation" },
      navigation: { next: "editing" },
      editing: { reset: "intro" }
    }
  };
  
  const controllerBox = createThing("box", { x: -3, y: 2, z: 0 }, { 
    label: "CONTROLS",
    color: "#f59e0b",
    helpText: `KEYBOARD SHORTCUTS:
- Ctrl+K: Command palette
- G: Toggle gravity
- L: Toggle layers panel
- Delete: Remove selected object
- Escape: Deselect
- Arrow keys: Navigate cartridge library

GAMEPAD CONTROLS:
- Left Stick / D-Pad: Navigate
- A Button: Select / Confirm
- B Button: Back / Deselect
- X Button: Delete
- Y Button: Create new`
  });
  controllerBox.material = { ...controllerBox.material!, color: "#f59e0b" };
  controllerBox.fsm = {
    initial: "keyboard",
    states: {
      keyboard: { next: "gamepad" },
      gamepad: { next: "mouse" },
      mouse: { next: "keyboard" }
    }
  };
  
  const toolsBox = createThing("sphere", { x: 3, y: 2, z: 0 }, { 
    label: "TOOLS",
    color: "#10b981",
    helpText: `PHYSICS TOOLS:

FLICK: Gesture-based throwing. Click and drag quickly to launch objects.

POOL CUE: Precision striking. Aim and pull back, release to strike.

SLINGSHOT: Elastic launching. Pull back from object, release to fling.

MAGNET: Attract or repel. Toggle polarity to pull or push objects.`
  });
  toolsBox.material = { ...toolsBox.material!, color: "#10b981" };
  toolsBox.fsm = {
    initial: "flick",
    states: {
      flick: { next: "pool" },
      pool: { next: "slingshot" },
      slingshot: { next: "magnet" },
      magnet: { next: "flick" }
    }
  };
  
  const libraryBox = createThing("cylinder", { x: 0, y: 2, z: -3 }, { 
    label: "LIBRARY",
    color: "#3b82f6",
    helpText: `CARTRIDGE LIBRARY:

Browse your collection in 3D or list view.

Cartridges are physics objects you can flick and arrange!

Group cartridges by dragging. Use tags for categorization.

Press RESET to return all cartridges to home positions.

Import .toss files from your computer. Export to share with others.`
  });
  libraryBox.material = { ...libraryBox.material!, color: "#3b82f6" };
  libraryBox.fsm = {
    initial: "browse",
    states: {
      browse: { next: "organize" },
      organize: { next: "import" },
      import: { next: "browse" }
    }
  };
  
  helpCartridge.items = [welcomeBox, controllerBox, toolsBox, libraryBox];
  
  helpCartridge.preview = {
    primaryColor: "#7c3aed",
    itemCount: 4,
    assetCount: 0,
    tags: ["help", "manual", "tutorial", "system"],
    lastModified: new Date().toISOString()
  };
  
  return helpCartridge;
}

export const HELP_CARTRIDGE_ID = "help-manual-v1";
