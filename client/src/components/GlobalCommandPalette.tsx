import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Home, 
  Palette, 
  FolderOpen, 
  Gamepad2, 
  HelpCircle,
  Box,
  GitBranch,
  Database,
  Maximize,
  GraduationCap,
  Zap,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: "navigation" | "tools" | "help";
}

interface GlobalCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFullscreenToggle?: () => void;
  onTutorialOpen?: () => void;
}

export function GlobalCommandPalette({ 
  open, 
  onOpenChange,
  onFullscreenToggle,
  onTutorialOpen,
}: GlobalCommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  
  const commands: CommandItem[] = [
    { id: "home", label: "Go to Home", icon: <Home className="w-4 h-4" />, category: "navigation", action: () => { setLocation("/"); onOpenChange(false); } },
    { id: "design", label: "Open Blu-Prince Designer", icon: <Palette className="w-4 h-4" />, category: "navigation", action: () => { setLocation("/blu-prince"); onOpenChange(false); } },
    { id: "library", label: "Browse Cartridges", icon: <FolderOpen className="w-4 h-4" />, category: "navigation", action: () => { setLocation("/library"); onOpenChange(false); } },
    { id: "controller", label: "Controller Settings", icon: <Gamepad2 className="w-4 h-4" />, category: "navigation", action: () => { setLocation("/controller"); onOpenChange(false); } },
    { id: "editor", label: "3D Editor", icon: <Box className="w-4 h-4" />, category: "tools", action: () => { setLocation("/editor"); onOpenChange(false); } },
    { id: "statechart", label: "State Machine Editor", icon: <GitBranch className="w-4 h-4" />, category: "tools", action: () => { setLocation("/statechart"); onOpenChange(false); } },
    { id: "data", label: "Data Tables", icon: <Database className="w-4 h-4" />, category: "tools", action: () => { setLocation("/data-tables"); onOpenChange(false); } },
    { id: "fullscreen", label: "Toggle Fullscreen", shortcut: "F", icon: <Maximize className="w-4 h-4" />, category: "tools", action: () => { onFullscreenToggle?.(); onOpenChange(false); } },
    { id: "tutorial", label: "Start Tutorial", shortcut: "T", icon: <GraduationCap className="w-4 h-4" />, category: "help", action: () => { onTutorialOpen?.(); onOpenChange(false); } },
    { id: "help", label: "Open User Manual", shortcut: "?", icon: <HelpCircle className="w-4 h-4" />, category: "help", action: () => { setLocation("/library?load=help"); onOpenChange(false); } },
  ];
  
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );
  
  const categories = ["navigation", "tools", "help"] as const;
  const categoryLabels = {
    navigation: "Navigation",
    tools: "Tools & Views",
    help: "Help & Learning"
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
      <DialogContent className="sm:max-w-lg p-0 bg-zinc-900/95 border-zinc-700 overflow-hidden backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 py-3 border-b border-zinc-700">
          <Search className="w-5 h-5 text-primary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-zinc-500 text-lg h-10"
            autoFocus
            data-testid="input-command-search"
          />
          <kbd className="px-2 py-1 text-xs font-mono bg-zinc-800 text-zinc-400 rounded border border-zinc-700">
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
                const categoryCommands = filteredCommands.filter(cmd => cmd.category === category);
                if (categoryCommands.length === 0) return null;
                
                return (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-2 py-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {categoryLabels[category]}
                    </div>
                    <div className="space-y-1">
                      {categoryCommands.map(cmd => (
                        <button
                          key={cmd.id}
                          onClick={cmd.action}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary/10 text-left transition-colors group min-h-11 touch-manipulation"
                          data-testid={`command-${cmd.id}`}
                        >
                          <span className="text-primary group-hover:scale-110 transition-transform">
                            {cmd.icon}
                          </span>
                          <div className="flex-1">
                            <div className="text-white font-medium">{cmd.label}</div>
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
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        
        <div className="px-3 py-2 border-t border-zinc-700 flex items-center justify-between text-xs text-zinc-500">
          <span>Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded">↵</kbd> to select</span>
          <span>Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded">⌘K</kbd> to toggle</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GlobalCommandPalette;
