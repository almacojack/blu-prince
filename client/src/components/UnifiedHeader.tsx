import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Box,
  GitBranch,
  Database,
  Gamepad2,
  Settings,
  FolderOpen,
  Save,
  Share2,
  Users,
  Zap,
  RotateCcw,
  Search,
  Command,
  HelpCircle,
  Home,
  Layers,
  Wrench,
  Palette,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TossCartridge } from "@/lib/toss-v1";

interface CartridgeBadgeProps {
  cartridge?: TossCartridge | null;
  size?: "sm" | "md" | "lg";
}

export function CartridgeBadge({ cartridge, size = "md" }: CartridgeBadgeProps) {
  const sizes = {
    sm: { cart: "w-10 h-6", label: "w-6 h-4", text: "text-[6px]" },
    md: { cart: "w-14 h-8", label: "w-9 h-5", text: "text-[8px]" },
    lg: { cart: "w-20 h-12", label: "w-14 h-8", text: "text-[10px]" }
  };
  
  const s = sizes[size];
  const title = cartridge?.meta?.title || "UNTITLED";
  const color = "#7c3aed"; // Default theme color
  
  return (
    <div className={`${s.cart} relative group cursor-pointer`}>
      <div 
        className="absolute inset-0 rounded-sm shadow-lg transform group-hover:scale-105 transition-transform"
        style={{ 
          background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
          boxShadow: `0 4px 12px ${color}44`
        }}
      >
        <div className="absolute inset-0.5 rounded-sm bg-gradient-to-b from-white/10 to-transparent" />
        
        <div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${s.label} bg-zinc-900 rounded-[2px] border border-zinc-700 flex items-center justify-center overflow-hidden`}
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.05)_50%,transparent_70%)]" />
          <span className={`${s.text} font-pixel text-white uppercase tracking-wider truncate px-0.5`}>
            {title.substring(0, 8)}
          </span>
        </div>
        
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-zinc-800 rounded-full" />
        
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/4 h-1 bg-zinc-700 rounded-t-sm" />
      </div>
    </div>
  );
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: "navigation" | "view" | "edit" | "settings" | "help";
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands: CommandItem[];
}

function CommandPalette({ open, onOpenChange, commands }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );
  
  const categories = ["navigation", "view", "edit", "settings", "help"] as const;
  const categoryLabels = {
    navigation: "Navigation",
    view: "View",
    edit: "Edit",
    settings: "Settings",
    help: "Help"
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);
  
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 bg-zinc-900/95 border-zinc-700 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-700">
          <Search className="w-4 h-4 text-zinc-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search commands, settings, panels..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-zinc-500"
            autoFocus
            data-testid="input-command-search"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>
        
        <ScrollArea className="max-h-80">
          <div className="p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">
                No commands found
              </div>
            ) : (
              categories.map(category => {
                const categoryCommands = filteredCommands.filter(c => c.category === category);
                if (categoryCommands.length === 0) return null;
                
                return (
                  <div key={category} className="mb-2">
                    <div className="px-2 py-1 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                      {categoryLabels[category]}
                    </div>
                    {categoryCommands.map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={() => {
                          cmd.action();
                          onOpenChange(false);
                        }}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-zinc-800 transition-colors group"
                        data-testid={`command-${cmd.id}`}
                      >
                        <span className="text-zinc-400 group-hover:text-white transition-colors">
                          {cmd.icon}
                        </span>
                        <div className="flex-1 text-left">
                          <div className="text-sm text-white">{cmd.label}</div>
                          {cmd.description && (
                            <div className="text-xs text-zinc-500">{cmd.description}</div>
                          )}
                        </div>
                        {cmd.shortcut && (
                          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

type ViewMode = "3d-editor" | "fsm-editor" | "statechart" | "data-tables" | "library" | "runtime";

interface UnifiedHeaderProps {
  cartridge?: TossCartridge | null;
  currentView?: ViewMode;
  showViewSwitcher?: boolean;
  
  onGravityToggle?: () => void;
  gravityEnabled?: boolean;
  onReset?: () => void;
  onSave?: () => void;
  
  showFSMEditor?: boolean;
  onShowFSMEditorChange?: (show: boolean) => void;
  showController?: boolean;
  onShowControllerChange?: (show: boolean) => void;
  showControllerMappings?: boolean;
  onShowControllerMappingsChange?: (show: boolean) => void;
  showLayers?: boolean;
  onShowLayersChange?: (show: boolean) => void;
  
  collaborationEnabled?: boolean;
  collaboratorCount?: number;
  onShareClick?: () => void;
  
  children?: React.ReactNode;
  extraCommands?: CommandItem[];
}

export function UnifiedHeader({
  cartridge,
  currentView = "3d-editor",
  showViewSwitcher = true,
  onGravityToggle,
  gravityEnabled = true,
  onReset,
  onSave,
  showFSMEditor,
  onShowFSMEditorChange,
  showController,
  onShowControllerChange,
  showControllerMappings,
  onShowControllerMappingsChange,
  showLayers,
  onShowLayersChange,
  collaborationEnabled,
  collaboratorCount = 0,
  onShareClick,
  children,
  extraCommands = []
}: UnifiedHeaderProps) {
  const [location, setLocation] = useLocation();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  
  const baseCommands: CommandItem[] = [
    {
      id: "go-home",
      label: "Go to Home",
      icon: <Home className="w-4 h-4" />,
      category: "navigation",
      action: () => setLocation("/")
    },
    {
      id: "go-editor",
      label: "Open 3D Editor",
      description: "Edit cartridge objects in 3D space",
      icon: <Box className="w-4 h-4" />,
      category: "navigation",
      action: () => setLocation("/editor")
    },
    {
      id: "go-statechart",
      label: "Open Statechart Editor",
      description: "Visual FSM design tool",
      icon: <GitBranch className="w-4 h-4" />,
      category: "navigation",
      action: () => setLocation("/statechart")
    },
    {
      id: "go-library",
      label: "Open Cartridge Library",
      description: "Browse and manage cartridges",
      icon: <FolderOpen className="w-4 h-4" />,
      category: "navigation",
      action: () => setLocation("/library")
    },
    {
      id: "go-data-tables",
      label: "Open Data Tables",
      description: "Edit embedded SQLite databases",
      icon: <Database className="w-4 h-4" />,
      category: "navigation",
      action: () => setLocation("/data-tables")
    },
    {
      id: "toggle-layers",
      label: "Toggle Layers Panel",
      icon: <Layers className="w-4 h-4" />,
      shortcut: "L",
      category: "view",
      action: () => onShowLayersChange?.(!showLayers)
    },
    {
      id: "toggle-fsm",
      label: "Toggle FSM Panel",
      icon: <GitBranch className="w-4 h-4" />,
      category: "view",
      action: () => onShowFSMEditorChange?.(!showFSMEditor)
    },
    {
      id: "toggle-controller",
      label: "Toggle Controller Bindings",
      icon: <Gamepad2 className="w-4 h-4" />,
      category: "view",
      action: () => onShowControllerChange?.(!showController)
    },
    {
      id: "toggle-mappings",
      label: "Toggle Controller Mappings",
      icon: <Settings className="w-4 h-4" />,
      category: "view",
      action: () => onShowControllerMappingsChange?.(!showControllerMappings)
    },
    {
      id: "toggle-gravity",
      label: gravityEnabled ? "Disable Gravity" : "Enable Gravity",
      icon: <Zap className="w-4 h-4" />,
      shortcut: "G",
      category: "edit",
      action: () => onGravityToggle?.()
    },
    {
      id: "reset-scene",
      label: "Reset Scene",
      description: "Clear all objects and start fresh",
      icon: <RotateCcw className="w-4 h-4" />,
      category: "edit",
      action: () => onReset?.()
    },
    {
      id: "open-help",
      label: "Open User Manual",
      description: "Learn about TingOs and key mappings",
      icon: <HelpCircle className="w-4 h-4" />,
      shortcut: "?",
      category: "help",
      action: () => setLocation("/library?load=help")
    },
    ...extraCommands
  ];
  
  const viewButtons: { id: ViewMode; label: string; icon: React.ReactNode; path: string; color: string }[] = [
    { id: "3d-editor", label: "3D", icon: <Box className="w-4 h-4" />, path: "/editor", color: "text-primary" },
    { id: "statechart", label: "FSM", icon: <GitBranch className="w-4 h-4" />, path: "/statechart", color: "text-purple-400" },
    { id: "data-tables", label: "Data", icon: <Database className="w-4 h-4" />, path: "/data-tables", color: "text-emerald-400" },
  ];
  
  return (
    <>
      <header className="absolute top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-black/40 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white" data-testid="button-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Link href="/editor">
            <div className="flex items-center gap-3 cursor-pointer group">
              <CartridgeBadge cartridge={cartridge} size="md" />
              <div className="flex flex-col">
                <span className="font-pixel text-sm text-white group-hover:text-primary transition-colors">
                  {cartridge?.meta?.title || "UNTITLED"}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                  {cartridge?.meta?.author_platform_id || "Unknown Author"}
                </span>
              </div>
            </div>
          </Link>
          
          <Badge variant="outline" className="text-[10px] border-primary/50 text-primary">
            v{cartridge?.meta?.version || "1.0"}
          </Badge>
        </div>

        {showViewSwitcher && (
          <div className="flex items-center gap-1 bg-zinc-900/50 rounded-lg p-1 border border-zinc-700">
            {viewButtons.map(view => (
              <Link key={view.id} href={view.path}>
                <Button
                  size="sm"
                  variant={currentView === view.id ? "default" : "ghost"}
                  className={`h-7 px-3 ${currentView === view.id ? "bg-zinc-700" : view.color}`}
                  data-testid={`button-view-${view.id}`}
                >
                  {view.icon}
                  <span className="ml-1.5 text-xs">{view.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {onGravityToggle && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={onGravityToggle}
              className={gravityEnabled ? "text-green-400" : "text-orange-400"}
              data-testid="button-gravity"
            >
              <Zap className="w-4 h-4 mr-1" />
              {gravityEnabled ? "ON" : "OFF"}
            </Button>
          )}
          
          {onReset && (
            <Button size="sm" variant="ghost" onClick={onReset} data-testid="button-reset">
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          
          {children}
          
          <Separator orientation="vertical" className="h-6" />
          
          {onShareClick && (
            <Button
              size="sm"
              variant={collaborationEnabled ? "default" : "ghost"}
              onClick={onShareClick}
              className={collaborationEnabled ? "bg-cyan-600 text-white" : "text-cyan-400"}
              data-testid="button-share"
            >
              {collaborationEnabled ? <Users className="w-4 h-4 mr-1" /> : <Share2 className="w-4 h-4 mr-1" />}
              {collaborationEnabled ? collaboratorCount : "Share"}
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCommandPaletteOpen(true)}
            className="text-zinc-400 hover:text-white"
            title="Command Palette (Ctrl+K)"
            data-testid="button-command-palette"
          >
            <Command className="w-4 h-4" />
          </Button>
          
          {onSave && (
            <Button size="sm" className="bg-primary/20 text-primary border border-primary/50" onClick={onSave} data-testid="button-save">
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
          )}
        </div>
      </header>
      
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        commands={baseCommands}
      />
    </>
  );
}

export default UnifiedHeader;
