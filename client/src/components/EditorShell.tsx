import React, { createContext, useContext, useState, ReactNode } from "react";
import { VSCodeSidebar, type SidebarPanel } from "./VSCodeSidebar";
import { 
  Box, Wrench, Layers, FolderOpen, BookOpen, Camera, Wind, Droplets, Gamepad2,
  GitBranch, Circle, Zap, Shield, Settings
} from "lucide-react";

export type EditorMode = "3d" | "fsm";

interface EditorLayoutState {
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  selectedMeshId: string | null;
  setSelectedMeshId: (id: string | null) => void;
  selectedStateId: string | null;
  setSelectedStateId: (id: string | null) => void;
}

const EditorLayoutContext = createContext<EditorLayoutState | null>(null);

export function useEditorLayout() {
  const ctx = useContext(EditorLayoutContext);
  if (!ctx) throw new Error("useEditorLayout must be used within EditorShell");
  return ctx;
}

interface PanelConfig {
  id: string;
  title: string;
  icon: ReactNode;
  modes: EditorMode[];
}

const LEFT_PANEL_CONFIGS: PanelConfig[] = [
  { id: "solids", title: "Solids", icon: <Box className="w-5 h-5" />, modes: ["3d"] },
  { id: "tools", title: "Tools", icon: <Wrench className="w-5 h-5" />, modes: ["3d"] },
  { id: "outliner", title: "Outliner", icon: <Layers className="w-5 h-5" />, modes: ["3d", "fsm"] },
  { id: "states", title: "States", icon: <Circle className="w-5 h-5" />, modes: ["fsm"] },
  { id: "transitions", title: "Transitions", icon: <Zap className="w-5 h-5" />, modes: ["fsm"] },
  { id: "files", title: "Files", icon: <FolderOpen className="w-5 h-5" />, modes: ["3d", "fsm"] },
  { id: "catalog", title: "Catalog", icon: <BookOpen className="w-5 h-5" />, modes: ["3d", "fsm"] },
];

const RIGHT_PANEL_CONFIGS: PanelConfig[] = [
  { id: "camera", title: "Camera", icon: <Camera className="w-5 h-5" />, modes: ["3d", "fsm"] },
  { id: "forces", title: "Forces", icon: <Wind className="w-5 h-5" />, modes: ["3d"] },
  { id: "water", title: "Water", icon: <Droplets className="w-5 h-5" />, modes: ["3d"] },
  { id: "guards", title: "Guards", icon: <Shield className="w-5 h-5" />, modes: ["fsm"] },
  { id: "gamepad", title: "Gamepad", icon: <Gamepad2 className="w-5 h-5" />, modes: ["3d", "fsm"] },
  { id: "settings", title: "Settings", icon: <Settings className="w-5 h-5" />, modes: ["3d", "fsm"] },
];

function buildPanels(
  configs: PanelConfig[], 
  mode: EditorMode, 
  contentFn?: (id: string) => ReactNode
): SidebarPanel[] {
  return configs
    .filter(c => c.modes.includes(mode))
    .map(c => ({
      id: c.id,
      title: c.title,
      icon: c.icon,
      content: contentFn?.(c.id) ?? <div className="p-4 text-white/50">{c.title} panel</div>,
    }));
}

interface EditorShellProps {
  children: ReactNode;
  leftPanelContent?: (panelId: string) => ReactNode;
  rightPanelContent?: (panelId: string) => ReactNode;
  header?: ReactNode;
  initialMode?: EditorMode;
}

export function EditorShell({ 
  children, 
  leftPanelContent, 
  rightPanelContent,
  header,
  initialMode = "3d"
}: EditorShellProps) {
  const [mode, setMode] = useState<EditorMode>(initialMode);
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);

  const leftPanels = buildPanels(LEFT_PANEL_CONFIGS, mode, leftPanelContent);
  const rightPanels = buildPanels(RIGHT_PANEL_CONFIGS, mode, rightPanelContent);

  const contextValue: EditorLayoutState = {
    mode,
    setMode,
    selectedMeshId,
    setSelectedMeshId,
    selectedStateId,
    setSelectedStateId,
  };

  return (
    <EditorLayoutContext.Provider value={contextValue}>
      <div className="h-screen w-screen flex flex-col bg-[#1e1e1e] overflow-hidden" data-testid="editor-shell">
        {header && (
          <div className="flex-shrink-0" data-testid="editor-header">
            {header}
          </div>
        )}
        
        <div className="flex-1 flex overflow-hidden">
          <VSCodeSidebar
            side="left"
            panels={leftPanels}
            defaultActivePanel="outliner"
          />

          <div className="flex-1 relative overflow-hidden" data-testid="editor-canvas-area">
            {children}
          </div>

          <VSCodeSidebar
            side="right"
            panels={rightPanels}
            defaultActivePanel="camera"
          />
        </div>
      </div>
    </EditorLayoutContext.Provider>
  );
}

export function ModeSwitcher() {
  const { mode, setMode } = useEditorLayout();
  
  return (
    <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1" data-testid="mode-switcher">
      <button
        onClick={() => setMode("3d")}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
          mode === "3d" 
            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" 
            : "text-white/60 hover:text-white/80"
        }`}
        data-testid="button-mode-3d"
      >
        <Box className="w-4 h-4" />
        3D Scene
      </button>
      <button
        onClick={() => setMode("fsm")}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
          mode === "fsm" 
            ? "bg-purple-500/20 text-purple-400 border border-purple-500/50" 
            : "text-white/60 hover:text-white/80"
        }`}
        data-testid="button-mode-fsm"
      >
        <GitBranch className="w-4 h-4" />
        State Machine
      </button>
    </div>
  );
}

export { EditorLayoutContext };
export type { PanelConfig, EditorLayoutState };
