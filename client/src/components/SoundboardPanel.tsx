import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Trash2, 
  Music, 
  Search,
  Link,
  Unlink
} from "lucide-react";
import { 
  RETRO_SOUND_LIBRARY, 
  playRetroSound, 
  getSoundCategories,
  type RetroSound 
} from "@/lib/retro-sounds";
import type { TossFile, SoundboardConfig, TransitionSoundBinding, SoundReference } from "@/lib/toss";

interface SoundboardPanelProps {
  file: TossFile;
  selectedTransitionId?: string | null;
  onUpdateSoundboard: (config: SoundboardConfig) => void;
}

export function SoundboardPanel({ 
  file, 
  selectedTransitionId,
  onUpdateSoundboard 
}: SoundboardPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [previewVolume, setPreviewVolume] = useState(0.7);

  const soundboard: SoundboardConfig = file.soundboard || {
    enabled: true,
    masterVolume: 0.7,
    muted: false,
    bindings: []
  };

  const categories = useMemo(() => getSoundCategories(), []);

  const filteredSounds = useMemo(() => {
    let sounds = RETRO_SOUND_LIBRARY;
    
    if (selectedCategory) {
      sounds = sounds.filter(s => s.category === selectedCategory);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sounds = sounds.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }
    
    return sounds;
  }, [selectedCategory, searchQuery]);

  const handlePreviewSound = useCallback((soundId: string) => {
    playRetroSound(soundId, previewVolume);
  }, [previewVolume]);

  const handleToggleMute = useCallback(() => {
    onUpdateSoundboard({
      ...soundboard,
      muted: !soundboard.muted
    });
  }, [soundboard, onUpdateSoundboard]);

  const handleVolumeChange = useCallback((value: number[]) => {
    onUpdateSoundboard({
      ...soundboard,
      masterVolume: value[0]
    });
  }, [soundboard, onUpdateSoundboard]);

  const handleToggleEnabled = useCallback(() => {
    onUpdateSoundboard({
      ...soundboard,
      enabled: !soundboard.enabled
    });
  }, [soundboard, onUpdateSoundboard]);

  const handleAssignSound = useCallback((soundId: string) => {
    if (!selectedTransitionId) return;

    const newBinding: TransitionSoundBinding = {
      transitionId: selectedTransitionId,
      sound: {
        type: "builtin",
        id: soundId,
        volume: 1.0,
        pitch: 1.0
      },
      enabled: true
    };

    const existingIndex = soundboard.bindings.findIndex(
      b => b.transitionId === selectedTransitionId
    );

    let newBindings: TransitionSoundBinding[];
    if (existingIndex >= 0) {
      newBindings = [...soundboard.bindings];
      newBindings[existingIndex] = newBinding;
    } else {
      newBindings = [...soundboard.bindings, newBinding];
    }

    onUpdateSoundboard({
      ...soundboard,
      bindings: newBindings
    });

    playRetroSound(soundId, soundboard.masterVolume);
  }, [selectedTransitionId, soundboard, onUpdateSoundboard]);

  const handleRemoveBinding = useCallback((transitionId: string) => {
    onUpdateSoundboard({
      ...soundboard,
      bindings: soundboard.bindings.filter(b => b.transitionId !== transitionId)
    });
  }, [soundboard, onUpdateSoundboard]);

  const getBindingForTransition = (transitionId: string): TransitionSoundBinding | undefined => {
    return soundboard.bindings.find(b => b.transitionId === transitionId);
  };

  const getSoundInfo = (soundId: string): RetroSound | undefined => {
    return RETRO_SOUND_LIBRARY.find(s => s.id === soundId);
  };

  const currentBinding = selectedTransitionId ? getBindingForTransition(selectedTransitionId) : null;
  const currentSound = currentBinding?.sound.type === "builtin" 
    ? getSoundInfo(currentBinding.sound.id) 
    : null;

  return (
    <div className="h-full flex flex-col bg-black/40 text-white" data-testid="soundboard-panel">
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold">Soundboard</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={soundboard.enabled}
              onCheckedChange={handleToggleEnabled}
              data-testid="switch-soundboard-enabled"
            />
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={handleToggleMute}
            data-testid="button-mute-toggle"
          >
            {soundboard.muted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-green-400" />
            )}
          </Button>
          <Slider
            value={[soundboard.masterVolume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.05}
            className="flex-1"
            data-testid="slider-master-volume"
          />
          <span className="text-[10px] text-muted-foreground w-8">
            {Math.round(soundboard.masterVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Current Transition Binding */}
      {selectedTransitionId && (
        <div className="p-3 border-b border-white/10 bg-purple-500/10">
          <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">
            Selected Transition
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs font-mono border-purple-500/50 text-purple-300">
              {selectedTransitionId}
            </Badge>
          </div>
          
          {currentBinding && currentSound ? (
            <div className="flex items-center gap-2 p-2 rounded bg-white/5">
              <span className="text-lg">{currentSound.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{currentSound.name}</div>
                <div className="text-[10px] text-muted-foreground">{currentSound.category}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => playRetroSound(currentSound.id, soundboard.masterVolume)}
                data-testid="button-play-current"
              >
                <Play className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-red-400 hover:text-red-300"
                onClick={() => handleRemoveBinding(selectedTransitionId)}
                data-testid="button-remove-binding"
              >
                <Unlink className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              No sound assigned. Click a sound below to assign it.
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 text-xs pl-7 bg-white/5 border-white/10"
            data-testid="input-search-sounds"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-1 overflow-x-auto pb-1">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              className="h-6 text-[10px] px-2"
              onClick={() => setSelectedCategory(null)}
              data-testid="button-category-all"
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "outline"}
                className="h-6 text-[10px] px-2 capitalize"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`button-category-${cat}`}
              >
                {cat}
              </Button>
            ))}
        </div>
      </div>

      {/* Sound Library */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredSounds.map(sound => {
            const isAssigned = selectedTransitionId && 
              currentBinding?.sound.id === sound.id;
            
            return (
              <div
                key={sound.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  isAssigned 
                    ? 'bg-purple-500/30 border border-purple-500/50' 
                    : 'hover:bg-white/5 border border-transparent'
                }`}
                onClick={() => selectedTransitionId && handleAssignSound(sound.id)}
                data-testid={`sound-item-${sound.id}`}
              >
                <span className="text-lg w-6 text-center">{sound.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{sound.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {sound.description}
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-[8px] px-1 py-0 border-white/20 capitalize shrink-0"
                >
                  {sound.category}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewSound(sound.id);
                  }}
                  data-testid={`button-preview-${sound.id}`}
                >
                  <Play className="w-3 h-3" />
                </Button>
                {selectedTransitionId && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-6 w-6 shrink-0 ${isAssigned ? 'text-purple-400' : 'text-muted-foreground'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssignSound(sound.id);
                    }}
                    data-testid={`button-assign-${sound.id}`}
                  >
                    <Link className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Active Bindings Summary */}
      {soundboard.bindings.length > 0 && (
        <>
          <Separator className="bg-white/10" />
          <div className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">
              Active Bindings ({soundboard.bindings.length})
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {soundboard.bindings.map(binding => {
                  const sound = binding.sound.type === "builtin" 
                    ? getSoundInfo(binding.sound.id) 
                    : null;
                  
                  return (
                    <div 
                      key={binding.transitionId}
                      className="flex items-center gap-2 p-1.5 rounded bg-white/5 text-xs"
                    >
                      <span className="text-sm">{sound?.icon || "🔊"}</span>
                      <span className="font-mono text-[10px] text-purple-300 truncate flex-1">
                        {binding.transitionId}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {sound?.name || binding.sound.id}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 text-red-400 hover:text-red-300"
                        onClick={() => handleRemoveBinding(binding.transitionId)}
                        data-testid={`button-remove-${binding.transitionId}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
}
