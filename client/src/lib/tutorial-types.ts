export type TutorialId = 
  | "getting_started"
  | "creating_states"
  | "adding_forces"
  | "using_controllers"
  | "3d_assets";

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  spotlightPadding?: number;
  position?: "top" | "bottom" | "left" | "right" | "center";
  action?: {
    type: "click" | "input" | "drag" | "wait";
    validation?: () => boolean;
  };
  nextOnAction?: boolean;
  canSkip?: boolean;
}

export interface Tutorial {
  id: TutorialId;
  title: string;
  description: string;
  icon: string;
  estimatedMinutes: number;
  steps: TutorialStep[];
  prerequisite?: TutorialId;
}

export interface TutorialProgress {
  tutorialId: TutorialId;
  currentStepIndex: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface TutorialState {
  activeTutorial: TutorialId | null;
  currentStepIndex: number;
  isPlaying: boolean;
  progress: Record<TutorialId, TutorialProgress>;
  hasSeenWelcome: boolean;
}

export const TUTORIALS: Tutorial[] = [
  {
    id: "getting_started",
    title: "Getting Started",
    description: "Learn the basics of the TingOs editor and navigation",
    icon: "Rocket",
    estimatedMinutes: 3,
    steps: [
      {
        id: "welcome",
        title: "Welcome to TingOs!",
        description: "TingOs is a powerful modeling and simulation platform. This tutorial will guide you through the basics of creating your first cartridge.",
        position: "center",
        canSkip: true,
      },
      {
        id: "header_nav",
        title: "Navigation Header",
        description: "The header provides quick access to all major sections: Home, Design (Blu-Prince editor), Library (your cartridges), and Help.",
        targetSelector: "[data-testid='unified-header']",
        position: "bottom",
      },
      {
        id: "command_palette",
        title: "Command Palette",
        description: "Press Ctrl+K (or Cmd+K on Mac) anytime to open the command palette for quick actions and navigation.",
        targetSelector: "[data-testid='button-command-palette']",
        position: "bottom",
      },
      {
        id: "blu_prince",
        title: "Blu-Prince Editor",
        description: "Click 'Design' to open Blu-Prince, our visual state machine editor where you create interactive cartridges.",
        targetSelector: "[data-testid='nav-design']",
        position: "bottom",
        action: { type: "click" },
        nextOnAction: true,
      },
      {
        id: "complete",
        title: "You're Ready!",
        description: "Great job! You now know the basics of navigating TingOs. Try the 'Creating States' tutorial next to learn about building state machines.",
        position: "center",
      },
    ],
  },
  {
    id: "creating_states",
    title: "Creating States",
    description: "Build your first finite state machine with states and transitions",
    icon: "GitBranch",
    estimatedMinutes: 5,
    steps: [
      {
        id: "intro",
        title: "State Machines 101",
        description: "A state machine is a model that describes different states an object can be in, and what triggers changes between those states.",
        position: "center",
      },
      {
        id: "canvas",
        title: "The Canvas",
        description: "This is your design canvas. Right-click anywhere to add new states, or use the toolbar buttons.",
        targetSelector: "[data-testid='fsm-canvas']",
        position: "center",
        spotlightPadding: 20,
      },
      {
        id: "add_state",
        title: "Add a State",
        description: "Click the '+' button or right-click the canvas and select 'Add State' to create your first state node.",
        targetSelector: "[data-testid='button-add-state']",
        position: "right",
        action: { type: "click" },
      },
      {
        id: "state_properties",
        title: "State Properties",
        description: "Click on a state to select it and view its properties in the panel. You can rename it, set entry/exit actions, and more.",
        targetSelector: "[data-testid='panel-properties']",
        position: "left",
      },
      {
        id: "add_transition",
        title: "Create Transitions",
        description: "Drag from one state's connection point to another to create a transition. This defines how your machine moves between states.",
        targetSelector: "[data-testid='fsm-canvas']",
        position: "center",
      },
      {
        id: "complete",
        title: "State Machine Created!",
        description: "Excellent! You've learned how to create states and transitions. Try the 'Adding Forces' tutorial to learn about environmental effects.",
        position: "center",
      },
    ],
  },
  {
    id: "adding_forces",
    title: "Environmental Forces",
    description: "Add fire, ice, water, and wind forces to your simulation",
    icon: "Flame",
    estimatedMinutes: 4,
    steps: [
      {
        id: "intro",
        title: "Environmental Forces",
        description: "Forces are invisible fields that affect objects in your simulation. Fire melts ice, water creates buoyancy, wind pushes objects around.",
        position: "center",
      },
      {
        id: "forces_panel",
        title: "Forces Panel",
        description: "Open the Forces panel to manage environmental forces. Each force has a type, position, strength, and area of effect.",
        targetSelector: "[data-testid='panel-forces']",
        position: "left",
      },
      {
        id: "add_force",
        title: "Add a Force",
        description: "Click the '+' button to add a new force emitter. Choose from fire, ice, water, wind, gravity, magnet, or electric.",
        targetSelector: "[data-testid='button-add-force']",
        position: "right",
        action: { type: "click" },
      },
      {
        id: "force_properties",
        title: "Force Properties",
        description: "Adjust the magnitude (strength), radius (area), falloff (how force decreases with distance), and visual style of your force.",
        targetSelector: "[data-testid='force-properties']",
        position: "left",
      },
      {
        id: "hitbox",
        title: "Force Hitbox",
        description: "Each force has a hitbox that defines its area of effect. You can choose sphere, box, or cylinder shapes and adjust their size.",
        targetSelector: "[data-testid='switch-show-hitbox']",
        position: "left",
      },
      {
        id: "complete",
        title: "Forces Mastered!",
        description: "You can now add dynamic environmental forces to your simulations. Try the 'Using Controllers' tutorial to learn about game input.",
        position: "center",
      },
    ],
  },
  {
    id: "using_controllers",
    title: "Game Controllers",
    description: "Connect and configure game controllers for your cartridge",
    icon: "Gamepad2",
    estimatedMinutes: 4,
    steps: [
      {
        id: "intro",
        title: "Controller Support",
        description: "TingOs has first-class support for game controllers. Connect any gamepad and it will be automatically detected.",
        position: "center",
      },
      {
        id: "controller_panel",
        title: "Controller Panel",
        description: "The Controller panel shows all connected controllers and their current state. You can see button presses in real-time.",
        targetSelector: "[data-testid='panel-controller']",
        position: "left",
      },
      {
        id: "bindings",
        title: "Button Bindings",
        description: "Map controller buttons to actions in your cartridge. Bind A to jump, triggers to fire, sticks to movement - it's all up to you.",
        targetSelector: "[data-testid='controller-bindings']",
        position: "left",
      },
      {
        id: "haptics",
        title: "Haptic Feedback",
        description: "Add rumble effects to your controllers! Configure vibration patterns that respond to in-game events.",
        targetSelector: "[data-testid='haptic-settings']",
        position: "left",
      },
      {
        id: "complete",
        title: "Controller Ready!",
        description: "Your cartridge now has full controller support. Players can use gamepads to interact with your creation.",
        position: "center",
      },
    ],
  },
  {
    id: "3d_assets",
    title: "3D Assets",
    description: "Import and manage 3D models in your cartridge",
    icon: "Box",
    estimatedMinutes: 5,
    steps: [
      {
        id: "intro",
        title: "3D Asset Pipeline",
        description: "TingOs supports importing 3D models in various formats: glTF, GLB, OBJ, STL, and Three.js JSON.",
        position: "center",
      },
      {
        id: "import",
        title: "Import a Model",
        description: "Drag and drop a 3D file onto the canvas, or use the Import button in the Assets panel.",
        targetSelector: "[data-testid='button-import-asset']",
        position: "right",
      },
      {
        id: "preview",
        title: "3D Preview",
        description: "After importing, you'll see a preview of your model. Use mouse to rotate, scroll to zoom, and drag to pan.",
        targetSelector: "[data-testid='asset-preview']",
        position: "left",
      },
      {
        id: "properties",
        title: "Model Properties",
        description: "View and edit model properties including scale, position, and material settings.",
        targetSelector: "[data-testid='asset-properties']",
        position: "left",
      },
      {
        id: "complete",
        title: "3D Assets Ready!",
        description: "You can now import and manage 3D models in your cartridges. Try importing the 3DBenchy model for testing!",
        position: "center",
      },
    ],
  },
];

export const DEFAULT_TUTORIAL_STATE: TutorialState = {
  activeTutorial: null,
  currentStepIndex: 0,
  isPlaying: false,
  progress: {} as Record<TutorialId, TutorialProgress>,
  hasSeenWelcome: false,
};
