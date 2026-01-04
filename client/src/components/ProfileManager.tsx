import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Keyboard, 
  Gamepad2, 
  Settings, 
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Palette,
  Box,
  Wand2,
  Play,
  Monitor,
} from "lucide-react";
import type { 
  InputProfile, 
  KeyboardShortcut, 
  EditorMode,
  PreferencesPayload,
} from "@/lib/preferences-cartridge";
import { formatShortcut, findShortcutConflicts } from "@/lib/preferences-cartridge";

const MODE_ICONS: Record<EditorMode, React.ReactNode> = {
  design: <Box className="w-4 h-4" />,
  sculpt: <Wand2 className="w-4 h-4" />,
  paint: <Palette className="w-4 h-4" />,
  animate: <Play className="w-4 h-4" />,
  test: <Settings className="w-4 h-4" />,
  present: <Monitor className="w-4 h-4" />,
};

interface ProfileManagerProps {
  preferences: PreferencesPayload;
  activeMode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onUpdateProfile: (profileId: string, updates: Partial<InputProfile>) => void;
  onUpdateShortcut: (profileId: string, shortcutId: string, updates: Partial<KeyboardShortcut>) => void;
  onCreateProfile: (mode: EditorMode, name: string) => void;
  onDeleteProfile: (profileId: string) => void;
  onDuplicateProfile: (profileId: string) => void;
}

export function ProfileManager({
  preferences,
  activeMode,
  onModeChange,
  onUpdateProfile,
  onUpdateShortcut,
  onCreateProfile,
  onDeleteProfile,
  onDuplicateProfile,
}: ProfileManagerProps) {
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<{ keys: string[]; modifiers: string[] }>({ keys: [], modifiers: [] });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const activeProfile = preferences.profiles.find(p => p.mode === activeMode);
  
  const categories = activeProfile
    ? Array.from(new Set(activeProfile.keyboardShortcuts.map(s => s.category)))
    : [];

  const filteredShortcuts = activeProfile?.keyboardShortcuts.filter(
    s => !selectedCategory || s.category === selectedCategory
  ) || [];

  const handleKeyCapture = (e: React.KeyboardEvent) => {
    if (!recordingKeys) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push("ctrl");
    if (e.altKey) modifiers.push("alt");
    if (e.shiftKey) modifiers.push("shift");
    if (e.metaKey) modifiers.push("meta");
    
    const key = e.key;
    if (!["Control", "Alt", "Shift", "Meta"].includes(key)) {
      setPendingKeys({ keys: [key], modifiers });
    }
  };

  const confirmShortcut = () => {
    if (editingShortcut && activeProfile && pendingKeys.keys.length > 0) {
      const conflicts = findShortcutConflicts(preferences.profiles, {
        id: editingShortcut,
        action: "",
        keys: pendingKeys.keys,
        modifiers: pendingKeys.modifiers as ("ctrl" | "alt" | "shift" | "meta")[],
        description: "",
        category: "",
      });
      
      if (conflicts.length === 0) {
        onUpdateShortcut(activeProfile.id, editingShortcut, {
          keys: pendingKeys.keys,
          modifiers: pendingKeys.modifiers as ("ctrl" | "alt" | "shift" | "meta")[],
        });
      }
    }
    
    setEditingShortcut(null);
    setRecordingKeys(false);
    setPendingKeys({ keys: [], modifiers: [] });
  };

  const cancelEdit = () => {
    setEditingShortcut(null);
    setRecordingKeys(false);
    setPendingKeys({ keys: [], modifiers: [] });
  };

  return (
    <div className="p-4 space-y-4" data-testid="profile-manager">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Input Profiles</h2>
        <Badge variant="outline" className="text-cyan-400">
          {activeProfile?.name || "No Profile"}
        </Badge>
      </div>

      <div className="flex gap-1 flex-wrap">
        {(Object.keys(MODE_ICONS) as EditorMode[]).map(mode => (
          <Button
            key={mode}
            size="sm"
            variant={activeMode === mode ? "default" : "outline"}
            className={`h-8 text-xs ${activeMode === mode ? "bg-cyan-600" : ""}`}
            onClick={() => onModeChange(mode)}
            data-testid={`mode-${mode}`}
          >
            {MODE_ICONS[mode]}
            <span className="ml-1 capitalize">{mode}</span>
          </Button>
        ))}
      </div>

      <Tabs defaultValue="keyboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keyboard" className="text-xs">
            <Keyboard className="w-3 h-3 mr-1" />
            Keyboard
          </TabsTrigger>
          <TabsTrigger value="controllers" className="text-xs">
            <Gamepad2 className="w-3 h-3 mr-1" />
            Controllers
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keyboard" className="space-y-3">
          <div className="flex gap-1 flex-wrap">
            <Button
              size="sm"
              variant={!selectedCategory ? "default" : "outline"}
              className="h-6 text-[10px]"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                className="h-6 text-[10px]"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {filteredShortcuts.map(shortcut => (
                <div
                  key={shortcut.id}
                  className={`p-2 rounded border transition-colors ${
                    editingShortcut === shortcut.id
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                  data-testid={`shortcut-${shortcut.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-xs text-white">{shortcut.description}</div>
                      <div className="text-[9px] text-muted-foreground">{shortcut.category}</div>
                    </div>
                    
                    {editingShortcut === shortcut.id ? (
                      <div className="flex items-center gap-2">
                        <div
                          className="px-3 py-1 rounded border border-cyan-500 bg-black/50 text-xs text-cyan-400 min-w-[80px] text-center"
                          tabIndex={0}
                          onKeyDown={handleKeyCapture}
                          onFocus={() => setRecordingKeys(true)}
                          onBlur={() => setRecordingKeys(false)}
                          data-testid={`key-capture-${shortcut.id}`}
                        >
                          {pendingKeys.keys.length > 0
                            ? formatShortcut({ ...shortcut, keys: pendingKeys.keys, modifiers: pendingKeys.modifiers as any })
                            : "Press keys..."}
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={confirmShortcut}>
                          <Check className="w-3 h-3 text-green-400" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEdit}>
                          <X className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-0.5 rounded bg-black/30 text-[10px] text-cyan-400">
                          {formatShortcut(shortcut)}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => setEditingShortcut(shortcut.id)}
                          data-testid={`edit-shortcut-${shortcut.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="controllers" className="space-y-3">
          <div className="text-center py-8 text-muted-foreground">
            <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No controllers detected</p>
            <p className="text-xs opacity-60">Connect a gamepad, MIDI device, or macro pad</p>
            <Button variant="outline" size="sm" className="mt-4" data-testid="scan-controllers">
              Scan for Devices
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-3">
          {activeProfile && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Profile Name</Label>
                <Input
                  value={activeProfile.name}
                  onChange={(e) => onUpdateProfile(activeProfile.id, { name: e.target.value })}
                  className="h-8 text-xs"
                  data-testid="input-profile-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Input
                  value={activeProfile.description}
                  onChange={(e) => onUpdateProfile(activeProfile.id, { description: e.target.value })}
                  className="h-8 text-xs"
                  data-testid="input-profile-description"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onDuplicateProfile(activeProfile.id)}
                  data-testid="duplicate-profile"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-400 border-red-400/30 hover:bg-red-400/10"
                  onClick={() => onDeleteProfile(activeProfile.id)}
                  disabled={activeProfile.isDefault}
                  data-testid="delete-profile"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
