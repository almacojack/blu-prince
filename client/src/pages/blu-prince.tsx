import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Settings, Plus, Zap, Layers,
  ChevronDown, ZoomIn, ZoomOut, MousePointer2,
  ArrowRight, FileJson, Download, Cloud, CloudOff, Users, Share2,
  Upload, Box, Trash2, Eye, Pencil, Music2, VolumeX, Volume2, SkipForward,
  CircuitBoard, Maximize2
} from "lucide-react";
import { AtariResetKnob } from "@/components/AtariResetKnob";
import { AtariDockPanel, AtariDockedPanel, AtariMiniPanel, Atari5200CartridgeSlot, AtariSilverRail } from "@/components/AtariDockPanel";
import { WinAmpPanel } from "@/components/WinAmpPanel";
import { ScrollableButtonPanel } from "@/components/ScrollableButtonPanel";
import { ViewportAngle } from "@/components/ViewportAnglesPanel";
import { FritzingPanel, ElectronicPart } from "@/components/FritzingPanel";
import { FlightControlsDashboard } from "@/components/FlightControlsDashboard";
import { DockablePanel } from "@/components/DockablePanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TossFile, createNewTossFile, TossState } from "@/lib/toss";
import { saveCartridge } from "@/lib/api";
import { useCollaboration, CollabUser } from "@/hooks/use-collaboration";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@shared/models/auth";
import { importAsset, getAcceptString, ImportProgress } from "@/lib/asset-importer";
import { createThumbnailFromData } from "@/lib/asset-loader";
import type { Toss3DAsset } from "@/lib/toss";
import { Progress } from "@/components/ui/progress";
import { Asset3DPreview } from "@/components/Asset3DPreview";
import { QRIconButton } from "@/components/QRCodePopup";
import { WolfensteinHealth } from "@/components/WolfensteinHealth";
import { SoundboardPanel } from "@/components/SoundboardPanel";
import { playRetroSound } from "@/lib/retro-sounds";
import type { SoundboardConfig } from "@/lib/toss";
import bluPrinceLogo from "@assets/generated_images/jeweled_blue_deity_walnut_bg.png";

const STORAGE_KEY = "blu-prince-cartridge";

const CHIPTUNE_TRACKS = [
  { name: "Pixel Quest", notes: [262, 294, 330, 349, 392, 349, 330, 294, 262, 294, 330, 392, 440, 392, 330, 294] },
  { name: "Neon Dreams", notes: [392, 440, 494, 523, 494, 440, 392, 349, 330, 349, 392, 440, 392, 349, 330, 294] },
  { name: "Circuit Board", notes: [523, 494, 440, 392, 440, 494, 523, 587, 523, 494, 440, 392, 349, 392, 440, 494] },
  { name: "Retro Wave", notes: [330, 392, 494, 392, 330, 262, 294, 330, 392, 494, 587, 494, 392, 330, 294, 262] },
];

function useChiptune() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const noteIndexRef = useRef(0);
  const gainNodeRef = useRef<GainNode | null>(null);
  const currentTrackRef = useRef(currentTrack);
  const isMutedRef = useRef(isMuted);
  
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : 0.15;
    }
  }, [isMuted]);
  
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = isMutedRef.current ? 0 : 0.15;
    }
    return audioContextRef.current;
  }, []);
  
  const playNote = useCallback((frequency: number, duration: number = 0.15) => {
    const ctx = audioContextRef.current;
    const gain = gainNodeRef.current;
    if (!ctx || !gain) return;
    
    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.value = frequency;
    
    noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.connect(noteGain);
    noteGain.connect(gain);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, []);
  
  const stopPlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);
  
  const startPlayback = useCallback(() => {
    initAudio();
    if (intervalRef.current) return;
    setIsPlaying(true);
    noteIndexRef.current = 0;
    
    intervalRef.current = window.setInterval(() => {
      const track = CHIPTUNE_TRACKS[currentTrackRef.current];
      playNote(track.notes[noteIndexRef.current]);
      noteIndexRef.current = (noteIndexRef.current + 1) % track.notes.length;
    }, 200);
  }, [initAudio, playNote]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, stopPlayback, startPlayback]);
  
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);
  
  const nextTrack = useCallback(() => {
    setCurrentTrack(prev => {
      const next = (prev + 1) % CHIPTUNE_TRACKS.length;
      currentTrackRef.current = next;
      noteIndexRef.current = 0;
      return next;
    });
  }, []);

  const prevTrack = useCallback(() => {
    setCurrentTrack(prev => {
      const next = (prev - 1 + CHIPTUNE_TRACKS.length) % CHIPTUNE_TRACKS.length;
      currentTrackRef.current = next;
      noteIndexRef.current = 0;
      return next;
    });
  }, []);

  const selectTrack = useCallback((index: number) => {
    if (index >= 0 && index < CHIPTUNE_TRACKS.length) {
      setCurrentTrack(index);
      currentTrackRef.current = index;
      noteIndexRef.current = 0;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);
  
  return { 
    isPlaying, 
    isMuted, 
    currentTrack, 
    trackName: CHIPTUNE_TRACKS[currentTrack].name,
    trackList: CHIPTUNE_TRACKS.map(t => t.name),
    togglePlayback,
    toggleMute, 
    nextTrack,
    prevTrack,
    selectTrack 
  };
}

function CollaboratorAvatars({ users, myColor }: { users: CollabUser[]; myColor: string }) {
  if (users.length === 0) return null;
  
  return (
    <div className="flex items-center gap-1">
      <Users className="w-3 h-3 text-gray-400 mr-1" />
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((user) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: user.color }}
            title={user.name || user.id.slice(0, 8)}
          >
            {(user.name || user.id).slice(0, 2).toUpperCase()}
          </motion.div>
        ))}
        {users.length > 5 && (
          <div className="w-6 h-6 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-[8px] font-bold text-white">
            +{users.length - 5}
          </div>
        )}
      </div>
      <div 
        className="w-6 h-6 rounded-full border-2 border-gray-900 flex items-center justify-center text-[8px] font-bold text-white ml-1"
        style={{ backgroundColor: myColor }}
        title="You"
      >
        ME
      </div>
    </div>
  );
}

function RemoteCursor({ user }: { user: CollabUser }) {
  if (!user.cursor) return null;
  
  return (
    <motion.div
      className="absolute pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        x: user.cursor.x,
        y: user.cursor.y,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path 
          d="M5 3L19 12L12 13L9 20L5 3Z" 
          fill={user.color} 
          stroke="white" 
          strokeWidth="1"
        />
      </svg>
      <div 
        className="absolute left-5 top-4 px-2 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap"
        style={{ backgroundColor: user.color }}
      >
        {user.name || user.id.slice(0, 8)}
      </div>
    </motion.div>
  );
}

function CartridgeBezel({ 
  title, 
  version,
  tngliId,
  isOnline, 
  isSaving,
  hasLocalChanges,
  collaborators,
  myColor,
  isCollabConnected,
  roomId,
  user,
  onSave,
  onExport,
  onInspect,
  onShareClick,
  onTitleChange,
}: { 
  title: string; 
  version: string;
  tngliId: string;
  isOnline: boolean;
  isSaving: boolean;
  hasLocalChanges: boolean;
  collaborators: CollabUser[];
  myColor: string;
  isCollabConnected: boolean;
  roomId: string | null;
  user: User | null | undefined;
  onSave: () => void;
  onExport: () => void;
  onInspect: () => void;
  onShareClick: () => void;
  onTitleChange: (newTitle: string) => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleTitleSubmit = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditedTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditingTitle(false);
    }
  };
  return (
    <div className="relative">
      <div 
        className="absolute inset-0 rounded-b-3xl overflow-hidden"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 8px,
              rgba(0,0,0,0.25) 8px,
              rgba(0,0,0,0.25) 10px
            ),
            linear-gradient(
              90deg,
              #3e2723 0%,
              #5d4037 15%,
              #4e342e 30%,
              #5d4037 45%,
              #3e2723 60%,
              #6d4c41 75%,
              #3e2723 100%
            )
          `,
          backgroundSize: '100% 18px, 100% 100%',
        }}
      />
      
      <div className="relative border-b-4 border-amber-950 rounded-b-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-black/50" />
        </div>
        
        <div 
          className="absolute inset-0"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 3px,
                rgba(93,64,55,0.15) 3px,
                rgba(93,64,55,0.15) 6px
              )
            `,
            mixBlendMode: 'overlay',
          }}
        />
        
        <div className="absolute left-4 top-0 bottom-0 w-8 flex flex-col justify-center gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-1 bg-black/30 rounded-full" />
          ))}
        </div>
        <div className="absolute right-4 top-0 bottom-0 w-8 flex flex-col justify-center gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-1 bg-black/30 rounded-full" />
          ))}
        </div>
        
        <div className="relative px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <motion.div 
                  className="relative cursor-pointer"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  data-testid="header-avatar"
                >
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt={user.firstName || "User"}
                      className="w-14 h-14 rounded-full object-cover border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    />
                  ) : (
                    <img 
                      src={bluPrinceLogo} 
                      alt="Blu-Prince"
                      className="w-14 h-14 object-contain drop-shadow-lg"
                    />
                  )}
                </motion.div>
              </Link>
              
              <div className="h-8 w-px bg-white/10" />
              
              <div className="relative">
                <div className="absolute -inset-2 bg-black/50 rounded-lg blur-sm" />
                <div className="relative bg-gradient-to-b from-gray-900 to-black rounded border border-white/10 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
                    <div>
                      <div className="text-xs font-mono text-white font-bold tracking-wide flex items-center gap-2">
                        {isEditingTitle ? (
                          <input
                            ref={titleInputRef}
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleSubmit}
                            onKeyDown={handleTitleKeyDown}
                            className="bg-transparent border-b border-cyan-400 outline-none text-cyan-300 font-mono text-xs w-32"
                            data-testid="input-cartridge-title"
                          />
                        ) : (
                          <span 
                            onClick={() => setIsEditingTitle(true)}
                            className="cursor-pointer hover:text-cyan-300 transition-colors"
                            title="Click to edit title"
                            data-testid="text-cartridge-title"
                          >
                            {title}
                          </span>
                        )}
                        <QRIconButton tngliId={tngliId} title={title} size="sm" />
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge 
                          variant="outline" 
                          className="text-[8px] h-4 px-1.5 border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
                        >
                          v{version}
                        </Badge>
                        {hasLocalChanges && (
                          <Badge 
                            variant="outline" 
                            className="text-[8px] h-4 px-1.5 border-cyan-500/50 text-cyan-400 bg-cyan-500/10"
                          >
                            LOCAL
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ScrollableButtonPanel height={36} className="max-w-[400px] xl:max-w-none">
              <div className="flex items-center h-9">
                <AnimatePresence>
                  <CollaboratorAvatars users={collaborators} myColor={myColor} />
                </AnimatePresence>
              </div>
              
              {isCollabConnected && roomId && (
                <Badge 
                  variant="outline" 
                  className="text-[8px] h-9 px-2 border-green-500/50 text-green-400 bg-green-500/10 gap-1 shrink-0"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </Badge>
              )}
              
              <div className="h-9 flex items-center shrink-0">
                <WolfensteinHealth health={isOnline ? 100 : 40} />
              </div>
              
              <div className="h-9 w-px bg-white/10 shrink-0" />
              
              <div className="flex items-center gap-1 h-9 px-2 rounded bg-black/20 shrink-0">
                {isOnline ? (
                  <Cloud className="w-3 h-3 text-green-400" />
                ) : (
                  <CloudOff className="w-3 h-3 text-yellow-400" />
                )}
                <span className={`text-[10px] font-mono ${isOnline ? "text-green-400" : "text-yellow-400"}`}>
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              
              <Button 
                variant="ghost" 
                className="h-9 gap-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 shrink-0" 
                onClick={onShareClick}
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Share</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-9 gap-2 text-gray-400 hover:text-white hover:bg-white/5 shrink-0" 
                onClick={onInspect}
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Source</span>
              </Button>
              
              <Button 
                variant="ghost" 
                className="h-9 gap-2 text-gray-400 hover:text-white hover:bg-white/5 shrink-0" 
                onClick={onSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" /> 
                <span className="hidden sm:inline text-xs">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
              
              <Button 
                className="h-9 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/40 hover:to-cyan-600/40 text-white border border-purple-500/30 gap-2 shrink-0"
                onClick={onExport}
              >
                <Download className="w-4 h-4" />
                <span className="text-xs">Export</span>
              </Button>
            </ScrollableButtonPanel>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-t-full" />
      </div>
    </div>
  );
}

export default function BluPrince() {
  const { user, isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const [file, setFile] = useState<TossFile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Failed to load cartridge from localStorage:", e);
    }
    return createNewTossFile();
  });
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [collabRoomId, setCollabRoomId] = useState<string>(() => file.manifest.tngli_id);
  const [shareLink, setShareLink] = useState("");
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [showAssetPreview, setShowAssetPreview] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [floatingPanels, setFloatingPanels] = useState<{ controls: boolean }>({ controls: false });
  const [showWinAmp, setShowWinAmp] = useState(true);
  const [showFritzing, setShowFritzing] = useState(false);
  const [showStateSettings, setShowStateSettings] = useState(false);
  const [editingStateName, setEditingStateName] = useState<string | null>(null);
  const [showTransitionDialog, setShowTransitionDialog] = useState(false);
  const [newTransitionEvent, setNewTransitionEvent] = useState("");
  const [newTransitionTarget, setNewTransitionTarget] = useState("");
  const [viewportAngle, setViewportAngle] = useState<ViewportAngle>("perspective");
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const chiptune = useChiptune();

  const collaboration = useCollaboration<TossFile>({
    roomId: collabRoomId,
    userId: user?.id,
    userName: user?.firstName || user?.id?.slice(0, 8),
    initialState: file,
    autoConnect: isAuthenticated && isOnline,
    onStateChange: (newState, fromUserId) => {
      if (fromUserId !== user?.id) {
        setFile(newState);
        toast({
          title: "Remote Update",
          description: `Changes received from collaborator`,
        });
      }
    },
    onUserJoin: (collabUser) => {
      toast({
        title: "Collaborator Joined",
        description: `${collabUser.name || collabUser.id.slice(0, 8)} joined the session`,
      });
    },
    onUserLeave: (userId) => {
      toast({
        title: "Collaborator Left",
        description: `A collaborator left the session`,
      });
    },
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
      setHasLocalChanges(true);
    } catch (e) {
      console.warn("Failed to save cartridge to localStorage:", e);
    }
  }, [file]);

  useEffect(() => {
    setShareLink(`${window.location.origin}/blu-prince?room=${collabRoomId}`);
  }, [collabRoomId]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current || !collaboration.isJoined) return;
    const rect = canvasRef.current.getBoundingClientRect();
    collaboration.sendCursor({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [collaboration]);

  const nodes = file._editor?.nodes || [];

  // Sync nodes with states - ensure every state has a corresponding node
  useEffect(() => {
    const stateIds = Object.keys(file.logic.states);
    const nodeIds = new Set(nodes.map(n => n.id));
    const missingNodes = stateIds.filter(id => !nodeIds.has(id));
    
    if (missingNodes.length > 0) {
      const newNodes = [...nodes];
      missingNodes.forEach((stateId, index) => {
        newNodes.push({
          id: stateId,
          x: 100 + (index % 4) * 200,
          y: 100 + Math.floor(index / 4) * 150,
          color: file.logic.states[stateId]?.type === 'initial' ? 'bg-green-500' : 
                 file.logic.states[stateId]?.type === 'final' ? 'bg-red-500' : 'bg-blue-500'
        });
      });
      
      setFile(prev => ({
        ...prev,
        _editor: {
          ...prev._editor!,
          nodes: newNodes
        }
      }));
    }
  }, [file.logic.states]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!isOnline) {
        toast({
          title: "Saved Locally",
          description: "You're offline. Changes saved to local storage and will sync when online.",
        });
        return;
      }
      await saveCartridge(file);
      setHasLocalChanges(false);
      toast({
        title: "Cartridge Saved",
        description: `${file.manifest.meta.title} (${file.manifest.tngli_id}) saved successfully.`,
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save Failed - Stored Locally",
        description: "Remote save failed. Your changes are safe in local storage.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.manifest.tngli_id}.toss.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNodeDragEnd = useCallback((nodeId: string, info: { offset: { x: number; y: number } }) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const newX = Math.max(0, node.x + info.offset.x / zoom);
    const newY = Math.max(0, node.y + info.offset.y / zoom);
    
    const updatedNodes = nodes.map(n => 
      n.id === nodeId ? { ...n, x: newX, y: newY } : n
    );
    
    const updatedFile: TossFile = {
      ...file,
      _editor: {
        ...file._editor!,
        nodes: updatedNodes
      }
    };
    
    setFile(updatedFile);
    
    if (collaboration.isJoined) {
      collaboration.sendFullState(updatedFile);
    }
  }, [nodes, file, collaboration, zoom]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);
  
  const handleFSMReset = useCallback(() => {
    const initialState: TossState = {
      id: "idle",
      type: "initial",
      transitions: [],
    };
    
    const resetFile: TossFile = {
      ...file,
      logic: {
        ...file.logic,
        initial: "idle",
        states: {
          idle: initialState
        }
      },
      _editor: {
        nodes: [{
          id: "idle",
          x: 400,
          y: 300
        }],
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    };
    
    setFile(resetFile);
    setSelectedNodeId(null);
    setZoom(1);
    setEditingStateName(null);
    toast({ 
      title: "FSM Reset", 
      description: "Canvas cleared. Cartridge info preserved." 
    });
    if (collaboration.isJoined) {
      collaboration.sendFullState(resetFile);
    }
  }, [file, collaboration, toast]);

  const handleAddTransition = () => {
    if (!selectedNodeId || !newTransitionEvent.trim() || !newTransitionTarget) {
      toast({ title: "Missing info", description: "Please provide event name and target state", variant: "destructive" });
      return;
    }
    
    const currentState = file.logic.states[selectedNodeId];
    if (!currentState) return;
    
    const newTransition = {
      event: newTransitionEvent.toUpperCase().replace(/\s+/g, '_'),
      target: newTransitionTarget
    };
    
    const updatedState = {
      ...currentState,
      transitions: [...(currentState.transitions ?? []), newTransition]
    };
    
    const updatedFile: TossFile = {
      ...file,
      logic: {
        ...file.logic,
        states: {
          ...file.logic.states,
          [selectedNodeId]: updatedState
        }
      }
    };
    
    setFile(updatedFile);
    setShowTransitionDialog(false);
    setNewTransitionEvent("");
    setNewTransitionTarget("");
    
    toast({ title: "Transition Added", description: `${newTransition.event} → ${newTransition.target}` });
    
    if (collaboration.isJoined) {
      collaboration.sendFullState(updatedFile);
    }
  };

  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.min(Math.max(z + delta, 0.5), 2));
    }
  }, []);

  const handleRenameState = (oldId: string, newName: string) => {
    if (!newName.trim() || newName === oldId) {
      setEditingStateName(null);
      return;
    }
    
    const newId = newName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!newId) {
      toast({ title: "Invalid name", description: "State name must contain valid characters", variant: "destructive" });
      setEditingStateName(null);
      return;
    }
    
    const stateData = file.logic.states[oldId];
    if (!stateData) return;
    
    if (newId !== oldId && file.logic.states[newId]) {
      toast({ title: "Name exists", description: `A state named "${newId}" already exists`, variant: "destructive" });
      setEditingStateName(null);
      return;
    }
    
    const newStates = { ...file.logic.states };
    delete newStates[oldId];
    newStates[newId] = { ...stateData, id: newId };
    
    Object.values(newStates).forEach(state => {
      state.transitions = (state.transitions ?? []).map(t => 
        t.target === oldId ? { ...t, target: newId } : t
      );
    });
    
    const updatedNodes = nodes.map(n => 
      n.id === oldId ? { ...n, id: newId } : n
    );
    
    const updatedFile: TossFile = {
      ...file,
      logic: {
        ...file.logic,
        initial: file.logic.initial === oldId ? newId : file.logic.initial,
        states: newStates
      },
      _editor: {
        ...file._editor!,
        nodes: updatedNodes
      }
    };
    
    setFile(updatedFile);
    setEditingStateName(null);
    
    if (selectedNodeId === oldId) {
      setSelectedNodeId(newId);
    }
    
    if (collaboration.isJoined) {
      collaboration.sendFullState(updatedFile);
    }
  };

  const handleRenameAsset = (assetId: string, newName: string) => {
    if (!newName.trim()) return;
    
    const assets = file.assets?.models || [];
    const updatedAssets = assets.map(asset => 
      asset.id === assetId 
        ? { ...asset, metadata: { ...asset.metadata, name: newName.trim() } }
        : asset
    );
    
    const updatedFile: TossFile = {
      ...file,
      assets: {
        ...file.assets,
        models: updatedAssets
      }
    };
    
    setFile(updatedFile);
    
    if (collaboration.isJoined) {
      collaboration.sendFullState(updatedFile);
    }
  };

  const handleAddNode = (type: TossState['type']) => {
    const existingIds = Object.keys(file.logic.states);
    let counter = 0;
    let newId = `s_${counter}`;
    while (existingIds.includes(newId)) {
      counter++;
      newId = `s_${counter}`;
    }
    const newNode = {
      id: newId,
      x: 300 + (nodes.length * 20), 
      y: 200 + (nodes.length * 20),
      color: type === 'initial' ? 'bg-green-500' : type === 'final' ? 'bg-muted-foreground' : 'bg-primary'
    };

    const updatedFile: TossFile = {
      ...file,
      logic: {
        ...file.logic,
        states: {
          ...file.logic.states,
          [newId]: {
            id: newId,
            type: type,
            transitions: []
          }
        }
      },
      _editor: {
        ...file._editor!,
        nodes: [...file._editor!.nodes, newNode]
      }
    };
    
    setFile(updatedFile);
    
    if (collaboration.isJoined) {
      collaboration.sendFullState(updatedFile);
    }
  };
  
  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Link Copied",
      description: "Share this link with collaborators",
    });
  };

  const handleImport3DAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileToImport = files[0];
    
    try {
      const result = await importAsset(fileToImport, setImportProgress);
      
      if (result.success && result.asset) {
        const updatedFile: TossFile = {
          ...file,
          assets: {
            models: [...(file.assets?.models || []), result.asset],
          },
        };
        
        setFile(updatedFile);
        
        if (collaboration.isJoined) {
          collaboration.sendFullState(updatedFile);
        }
        
        toast({
          title: "3D Asset Imported",
          description: `${result.asset.metadata.name} (${result.asset.metadata.format.toUpperCase()}) imported successfully`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: String(error),
        variant: "destructive",
      });
    } finally {
      setImportProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    const updatedFile: TossFile = {
      ...file,
      assets: {
        models: (file.assets?.models || []).filter(a => a.id !== assetId),
      },
    };
    
    setFile(updatedFile);
    
    if (collaboration.isJoined) {
      collaboration.sendFullState(updatedFile);
    }
    
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
    }
    
    toast({
      title: "Asset Deleted",
      description: "3D asset removed from cartridge",
    });
  };

  const getAssets = () => file.assets?.models || [];

  const getTransitions = () => {
    const edges: Array<{from: string, to: string}> = [];
    Object.values(file.logic.states).forEach(state => {
      (state.transitions ?? []).forEach(trans => {
        if (trans.target && file.logic.states[trans.target]) {
          edges.push({ from: state.id, to: trans.target });
        }
      });
    });
    return edges;
  };

  const activeNode = selectedNodeId ? file.logic.states[selectedNodeId] : null;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-foreground overflow-hidden font-sans">
      <CartridgeBezel 
        title={file.manifest.meta.title}
        version={file.manifest.meta.version}
        tngliId={file.manifest.tngli_id}
        isOnline={isOnline}
        isSaving={isSaving}
        hasLocalChanges={hasLocalChanges}
        collaborators={collaboration.otherUsers}
        myColor={collaboration.myColor}
        isCollabConnected={collaboration.isJoined}
        roomId={collaboration.roomId}
        user={user}
        onSave={handleSave}
        onExport={handleExport}
        onInspect={() => setShowJson(true)}
        onShareClick={() => setShowShareDialog(true)}
        onTitleChange={(newTitle) => {
          const updatedFile: TossFile = {
            ...file,
            manifest: {
              ...file.manifest,
              meta: {
                ...file.manifest.meta,
                title: newTitle
              }
            }
          };
          setFile(updatedFile);
          if (collaboration.isJoined) {
            collaboration.sendFullState(updatedFile);
          }
          toast({ title: "Title Updated", description: `Cartridge renamed to "${newTitle}"` });
        }}
      />

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md bg-[#111] border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-400" />
              Share & Collaborate
            </DialogTitle>
            <DialogDescription>
              Invite others to edit this statechart in real-time. Anyone with the link can join.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {!isAuthenticated ? (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-400 mb-3">Sign in to enable real-time collaboration</p>
                <a href="/api/login">
                  <Button size="sm" className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30">
                    Sign In
                  </Button>
                </a>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Room ID</label>
                  <Input
                    value={collabRoomId}
                    onChange={(e) => setCollabRoomId(e.target.value)}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                    data-testid="input-room-id"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Share Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="bg-black/50 border-white/10 text-cyan-400 font-mono text-xs"
                      data-testid="input-share-link"
                    />
                    <Button 
                      onClick={copyShareLink}
                      className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30"
                      data-testid="button-copy-link"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Status</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] ${collaboration.isJoined ? "border-green-500/50 text-green-400" : "border-gray-500/50 text-gray-400"}`}
                    >
                      {collaboration.isJoined ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Collaborators</span>
                    <span className="text-xs text-white font-mono">{collaboration.users.length}</span>
                  </div>
                </div>
                
                {collaboration.otherUsers.length > 0 && (
                  <div>
                    <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Active Users</label>
                    <div className="space-y-2">
                      {collaboration.otherUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-2 p-2 rounded bg-white/5">
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: u.color }}
                          >
                            {(u.name || u.id).slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs text-white">{u.name || u.id.slice(0, 12)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showJson} onOpenChange={setShowJson}>
        <DialogContent className="max-w-3xl max-h-[80vh] bg-[#111] border-white/20">
          <DialogHeader>
            <DialogTitle>TOSS File Source</DialogTitle>
            <DialogDescription>
              This JSON payload is the portable cartridge. It contains the Manifest, Logic, Memory Schema, and Asset Registry.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[500px] w-full rounded border border-white/10 bg-black/50 p-4">
            <pre className="text-xs font-mono text-green-400">
              {JSON.stringify(file, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Asset3DPreview
        asset={getAssets().find(a => a.id === selectedAssetId) || null}
        open={showAssetPreview}
        onOpenChange={setShowAssetPreview}
      />

      <Dialog open={showStateSettings} onOpenChange={setShowStateSettings}>
        <DialogContent className="max-w-md bg-[#111] border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              State Settings
            </DialogTitle>
            <DialogDescription>
              Configure properties for the selected state.
            </DialogDescription>
          </DialogHeader>
          
          {activeNode && (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">State Name</label>
                <div className="flex gap-2">
                  <Input
                    defaultValue={activeNode.id}
                    className="bg-black/50 border-white/10 text-white font-mono text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameState(activeNode.id, e.currentTarget.value);
                        setShowStateSettings(false);
                      }
                    }}
                    data-testid="input-state-name-settings"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-cyan-500/30 text-cyan-400"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input) {
                        handleRenameState(activeNode.id, input.value);
                        setShowStateSettings(false);
                      }
                    }}
                    data-testid="button-rename-state"
                  >
                    Rename
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">State Type</label>
                <select 
                  value={activeNode.type}
                  onChange={(e) => {
                    setFile(prev => ({
                      ...prev,
                      logic: {
                        ...prev.logic,
                        states: {
                          ...prev.logic.states,
                          [activeNode.id]: { ...activeNode, type: e.target.value as any }
                        }
                      }
                    }));
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-xs font-mono text-white"
                  data-testid="select-state-type-settings"
                >
                  <option value="initial">Initial</option>
                  <option value="state">State</option>
                  <option value="compound">Compound</option>
                  <option value="final">Final</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">
                  Transitions ({(activeNode.transitions ?? []).length})
                </label>
                {(activeNode.transitions ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(activeNode.transitions ?? []).map((t, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-white/5 text-xs">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        <span className="text-muted-foreground">{t.event || 'auto'}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-cyan-400 font-mono">{t.target}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground p-2 bg-white/5 rounded">
                    No transitions defined
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Outliner with hierarchical view */}
        <DockablePanel
          id="outliner-panel"
          title="Outliner"
          icon={<Layers className="w-4 h-4" />}
          defaultDocked={true}
          defaultWidth={280}
          minWidth={200}
          maxWidth={450}
          dockSide="left"
        >
          <div className="flex flex-col h-full">
            {/* Add State buttons */}
            <div className="p-2 border-b border-white/5">
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2 flex items-center gap-1.5">
                <Plus className="w-3 h-3" /> Add State
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(["initial", "state", "compound", "final"] as const).map((item) => (
                  <button 
                    key={item} 
                    onClick={() => handleAddNode(item)}
                    className="p-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex flex-col items-center gap-0.5 transition-colors active:scale-95"
                    data-testid={`add-state-${item}`}
                    title={`Add ${item} state`}
                  >
                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                      item === 'initial' ? 'bg-green-500/30' : 
                      item === 'final' ? 'bg-red-500/30' : 
                      item === 'compound' ? 'bg-purple-500/30' : 
                      'bg-cyan-500/30'
                    }`}>
                      {item === 'initial' && <div className="w-2 h-2 rounded-full bg-green-400" />}
                      {item === 'state' && <div className="w-2 h-2 rounded-sm bg-cyan-400" />}
                      {item === 'compound' && <Layers className="w-2.5 h-2.5 text-purple-400" />}
                      {item === 'final' && <div className="w-2 h-2 rounded-full border-2 border-red-400" />}
                    </div>
                    <span className="text-[8px] text-muted-foreground capitalize">{item}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Import 3D Model button */}
            <div className="p-2 border-b border-white/5">
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptString()}
                onChange={handleImport3DAsset}
                className="hidden"
                data-testid="input-3d-file"
              />
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-xs justify-start border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/10 hover:text-cyan-400"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!importProgress}
                data-testid="button-import-3d"
              >
                <Upload className="w-3 h-3 mr-2" /> 
                {importProgress ? importProgress.message : "Import 3D Model"}
              </Button>
              
              {importProgress && (
                <div className="mt-2">
                  <Progress value={importProgress.percent} className="h-1" />
                  <span className="text-[10px] text-muted-foreground mt-1 block">{importProgress.stage}</span>
                </div>
              )}
            </div>
            
            {/* FSM States List */}
            <div className="flex-1 min-h-0 overflow-auto">
              <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                  <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">States</div>
                  {Object.entries(file.logic.states).map(([stateId, state]) => (
                    <div
                      key={stateId}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                        selectedNodeId === stateId 
                          ? 'bg-primary/20 border border-primary/50' 
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => setSelectedNodeId(stateId)}
                      data-testid={`state-item-${stateId}`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        stateId === file.logic.initial ? 'bg-green-400' : 'bg-zinc-500'
                      }`} />
                      <span className="text-xs font-mono truncate flex-1">{stateId}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 border-white/20">
                        {(state as any).type || 'state'}
                      </Badge>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-5 h-5 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          const remainingCount = Object.keys(file.logic.states).length - 1;
                          if (remainingCount < 1) {
                            toast({ title: "Cannot delete", description: "State machine must have at least one state", variant: "destructive" });
                            return;
                          }
                          
                          const newStates = { ...file.logic.states };
                          delete newStates[stateId];
                          
                          // Clean up transitions pointing to deleted state
                          Object.values(newStates).forEach(s => {
                            (s as any).transitions = ((s as any).transitions ?? []).filter((t: any) => t.target !== stateId);
                          });
                          
                          // Reassign initial state if deleted
                          const remainingIds = Object.keys(newStates);
                          let newInitial = file.logic.initial;
                          if (file.logic.initial === stateId) {
                            const initialState = remainingIds.find(sid => (newStates[sid] as any)?.type === 'initial');
                            newInitial = initialState || remainingIds[0];
                          }
                          
                          // Update editor nodes
                          const updatedFile: TossFile = {
                            ...file,
                            logic: { 
                              ...file.logic, 
                              initial: newInitial,
                              states: newStates 
                            },
                            _editor: {
                              ...file._editor!,
                              nodes: (file._editor?.nodes || []).filter(n => n.id !== stateId)
                            }
                          };
                          setFile(updatedFile);
                          if (selectedNodeId === stateId) setSelectedNodeId(null);
                          
                          toast({ title: "State deleted", description: `Removed "${stateId}" from the state machine` });
                        }}
                        data-testid={`button-delete-state-${stateId}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* 3D Assets */}
                  {(file.assets?.models?.length ?? 0) > 0 && (
                    <>
                      <Separator className="my-2 bg-white/10" />
                      <div className="text-[10px] uppercase text-muted-foreground font-bold mb-2">3D Assets</div>
                      {file.assets?.models?.map((asset) => (
                        <div
                          key={asset.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            selectedAssetId === asset.id 
                              ? 'bg-orange-500/20 border border-orange-500/50' 
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                          onClick={() => setSelectedAssetId(asset.id)}
                          data-testid={`asset-item-${asset.id}`}
                        >
                          <Box className="w-3 h-3 text-orange-400" />
                          <span className="text-xs font-mono truncate flex-1">{asset.metadata?.name || asset.id}</span>
                          <Badge variant="outline" className="text-[8px] px-1 py-0 border-orange-500/30 text-orange-400">
                            {asset.metadata?.format?.toUpperCase() || '3D'}
                          </Badge>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DockablePanel>

        <div 
          ref={canvasRef}
          className="flex-1 relative bg-[#0c0c10] overflow-hidden pb-24"
          onMouseMove={handleCanvasMouseMove}
          onWheel={handleCanvasWheel}
        >
          <AnimatePresence>
            {collaboration.otherUsers.map((user) => (
              <RemoteCursor key={user.id} user={user} />
            ))}
          </AnimatePresence>
          
          {/* Bottom Dock Bar - Flow Layout (docked panels) */}
          <div className="absolute bottom-3 left-3 flex items-end gap-2 z-40">
            {!floatingPanels.controls && (
              <AtariDockedPanel
                title="Controls"
                onPopOut={() => setFloatingPanels(p => ({ ...p, controls: true }))}
                data-testid="panel-controls"
              >
                <div className="flex items-center gap-2">
                  <AtariResetKnob onReset={handleFSMReset} />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-amber-100 hover:text-white hover:bg-black/20" onClick={handleZoomOut} data-testid="button-zoom-out">
                        <ZoomOut className="w-2.5 h-2.5" />
                      </Button>
                      <span className="text-[7px] font-pixel text-amber-200 w-7 text-center">{Math.round(zoom * 100)}%</span>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-amber-100 hover:text-white hover:bg-black/20" onClick={handleZoomIn} data-testid="button-zoom-in">
                        <ZoomIn className="w-2.5 h-2.5" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="h-4 px-1 text-[6px] text-amber-100/60 hover:text-amber-100 hover:bg-black/20" onClick={handleZoomReset} data-testid="button-zoom-reset">
                      RESET
                    </Button>
                  </div>
                </div>
              </AtariDockedPanel>
            )}
            
            {/* Fritzing Panel Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFritzing(!showFritzing)}
              className={`h-8 px-3 rounded-lg border ${
                showFritzing 
                  ? "bg-teal-600 text-white border-teal-400" 
                  : "bg-gray-800/80 text-teal-400 border-teal-600/50 hover:bg-teal-600/20"
              }`}
              data-testid="button-toggle-fritzing"
            >
              <CircuitBoard className="w-4 h-4 mr-1.5" />
              <span className="text-xs font-bold">FRITZING</span>
            </Button>

          </div>
          
          {/* Prominent ZOOM TO FIT Button - Bottom Right */}
          <div className="absolute bottom-4 right-4 z-40">
            <Button 
              onClick={handleZoomReset}
              size="lg"
              className="font-bold text-lg px-6 py-3 shadow-lg bg-cyan-500 hover:bg-cyan-400 text-black"
              style={{ 
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)'
              }}
              data-testid="button-zoom-to-fit"
            >
              <Maximize2 className="w-5 h-5 mr-2" />
              ZOOM TO FIT
            </Button>
          </div>

          {/* Floating Controls Panel (when popped out) */}
          {floatingPanels.controls && (
            <AtariDockPanel
              title="Controls"
              initialPosition={{ x: 16, y: typeof window !== 'undefined' ? window.innerHeight - 220 : 400 }}
              initialSize={{ width: 180, height: 120 }}
              minWidth={160}
              minHeight={100}
              maxWidth={280}
              maxHeight={180}
              onClose={() => setFloatingPanels(p => ({ ...p, controls: false }))}
              data-testid="panel-controls-floating"
            >
              <div className="flex items-center gap-3">
                <AtariResetKnob onReset={handleFSMReset} />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-100 hover:text-white hover:bg-black/20" onClick={handleZoomOut} data-testid="button-zoom-out-float">
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                    <span className="text-[8px] font-pixel text-amber-200 w-8 text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-100 hover:text-white hover:bg-black/20" onClick={handleZoomIn} data-testid="button-zoom-in-float">
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="h-5 px-2 text-[7px] text-amber-100/60 hover:text-amber-100 hover:bg-black/20" onClick={handleZoomReset} data-testid="button-zoom-reset-float">
                    RESET ZOOM
                  </Button>
                </div>
              </div>
            </AtariDockPanel>
          )}

          {/* WinAMP-Style Audio Player */}
          {showWinAmp && (
            <WinAmpPanel
              trackName={chiptune.trackName}
              isPlaying={chiptune.isPlaying}
              isMuted={chiptune.isMuted}
              onPlayPause={chiptune.togglePlayback}
              onNext={chiptune.nextTrack}
              onPrev={chiptune.prevTrack}
              onMuteToggle={chiptune.toggleMute}
              onClose={() => setShowWinAmp(false)}
              initialPosition={{ x: typeof window !== 'undefined' ? Math.floor(window.innerWidth / 2) - 130 : 400, y: typeof window !== 'undefined' ? Math.floor(window.innerHeight / 2) - 100 : 200 }}
              tracks={chiptune.trackList}
              currentTrackIndex={chiptune.currentTrack}
              onSelectTrack={chiptune.selectTrack}
              panelTitle="tng.li/AMP"
              data-testid="panel-winamp"
            />
          )}

          {/* Fritzing-Style Electronics Parts Panel */}
          {showFritzing && (
            <FritzingPanel
              onSelectPart={(part: ElectronicPart) => {
                toast({
                  title: "Part Selected",
                  description: `${part.name} - Drag to scene to place`,
                });
              }}
              onClose={() => setShowFritzing(false)}
              initialPosition={{ x: 16, y: 200 }}
              data-testid="panel-fritzing"
            />
          )}

          <div 
            className="relative origin-top-left"
            style={{ 
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: '2000px',
              height: '2000px'
            }}
          >
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                   backgroundSize: '20px 20px'
                 }} 
            />
            <div className="absolute inset-0 pointer-events-none">
              <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                  </marker>
                  <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#22c55e" />
                  </marker>
                </defs>
                {getTransitions().map((edge, i) => {
                  const fromNode = nodes.find(n => n.id === edge.from);
                  const toNode = nodes.find(n => n.id === edge.to);
                  if (!fromNode || !toNode) return null;

                  const nodeWidth = 160;
                  const nodeHeight = 72;
                  
                  const goingRight = toNode.x > fromNode.x;
                  
                  let x1: number, y1: number, x2: number, y2: number;
                  
                  if (goingRight) {
                    x1 = fromNode.x + nodeWidth;
                    y1 = fromNode.y + nodeHeight / 2;
                    x2 = toNode.x;
                    y2 = toNode.y + nodeHeight / 2;
                  } else {
                    x1 = fromNode.x;
                    y1 = fromNode.y + nodeHeight / 2;
                    x2 = toNode.x + nodeWidth;
                    y2 = toNode.y + nodeHeight / 2;
                  }
                  
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  
                  if (distance < 10) return null;
                  
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;
                  const perpX = -dy / distance;
                  const perpY = dx / distance;
                  const curveOffset = Math.min(30, distance * 0.15);
                  const controlX = midX + perpX * curveOffset;
                  const controlY = midY + perpY * curveOffset;
                  
                  const isFromSelected = edge.from === selectedNodeId;
                  const isToSelected = edge.to === selectedNodeId;
                  const isHighlighted = isFromSelected || isToSelected;
                  
                  const pathD = `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`;
                  
                  const transition = (file.logic.states[edge.from]?.transitions ?? []).find(t => t.target === edge.to);
                  const eventLabel = transition?.event || 'auto';

                  return (
                    <g key={`${edge.from}-${edge.to}-${i}`}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isHighlighted ? "#22c55e" : "#8b5cf6"}
                        strokeWidth={isHighlighted ? 3 : 2}
                        strokeOpacity={isHighlighted ? 1 : 0.7}
                        markerEnd={isHighlighted ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                        style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }}
                      />
                      <text
                        x={controlX}
                        y={controlY - 8}
                        fill={isHighlighted ? "#4ade80" : "#a78bfa"}
                        fontSize="10"
                        fontFamily="monospace"
                        textAnchor="middle"
                        style={{ 
                          pointerEvents: 'none',
                          textShadow: '0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.6)'
                        }}
                      >
                        {eventLabel}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="absolute inset-0">
              {nodes.map((node) => {
                const stateData = file.logic.states[node.id];
                const isEditing = editingStateName === node.id;
                return (
                  <motion.div
                    key={node.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0}
                    onDragEnd={(_, info) => handleNodeDragEnd(node.id, info)}
                    initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                    animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileDrag={{ scale: 1.05, zIndex: 100 }}
                    transition={{ scale: { type: "spring", stiffness: 300, damping: 20 }, opacity: { duration: 0.2 } }}
                    style={{ left: node.x, top: node.y }}
                    className={`absolute w-40 h-[72px] p-0 rounded-lg border border-white/10 bg-[#1a1b23] shadow-xl cursor-pointer overflow-hidden ${selectedNodeId === node.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedNodeId(node.id)}
                    data-testid={`state-node-${node.id}`}
                  >
                    <div className={`h-1 ${node.color || 'bg-primary'}`} />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={stateData?.id || ''}
                            className="text-xs font-bold font-mono text-white bg-black/50 border border-white/20 rounded px-1 w-[90px]"
                            onClick={(e) => e.stopPropagation()}
                            onBlur={(e) => handleRenameState(node.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameState(node.id, e.currentTarget.value);
                              } else if (e.key === 'Escape') {
                                setEditingStateName(null);
                              }
                            }}
                            data-testid={`input-rename-state-${node.id}`}
                          />
                        ) : (
                          <span 
                            className="text-xs font-bold font-mono text-white truncate max-w-[90px] cursor-text"
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingStateName(node.id);
                            }}
                            title="Double-click to rename"
                          >
                            {stateData?.id.toUpperCase()}
                          </span>
                        )}
                        <button
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNodeId(node.id);
                            setShowStateSettings(true);
                          }}
                          data-testid={`button-settings-${node.id}`}
                        >
                          <Settings className="w-3 h-3 text-muted-foreground hover:text-white" />
                        </button>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        TYPE: {stateData?.type.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="absolute left-0 top-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20 border border-black hover:bg-primary transition-colors" />
                    <div className="absolute right-0 top-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-white/20 border border-black hover:bg-primary transition-colors" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="w-72 border-l border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-mono uppercase text-muted-foreground">Properties</h3>
          </div>
          
          <div className="flex-1 p-4">
            {activeNode ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block flex items-center justify-between">
                    State ID
                    <button
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      onClick={() => setEditingStateName(activeNode.id)}
                      data-testid="button-edit-state-id"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </label>
                  {editingStateName === activeNode.id ? (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        defaultValue={activeNode.id}
                        className="text-xs font-mono bg-black/40 border-white/10 text-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameState(activeNode.id, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setEditingStateName(null);
                          }
                        }}
                        data-testid="input-edit-state-id"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-cyan-500/30 text-cyan-400"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input) {
                            handleRenameState(activeNode.id, input.value);
                          }
                        }}
                        data-testid="button-save-state-id"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-white p-2 bg-black/40 rounded border border-white/10 select-all">
                      {activeNode.id}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Type</label>
                  <select 
                    value={activeNode.type}
                    onChange={(e) => {
                      setFile(prev => ({
                        ...prev,
                        logic: {
                          ...prev.logic,
                          states: {
                            ...prev.logic.states,
                            [activeNode.id]: { ...activeNode, type: e.target.value as any }
                          }
                        }
                      }));
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
                    data-testid="select-state-type"
                  >
                    <option value="state">Standard State</option>
                    <option value="initial">Initial State</option>
                    <option value="final">Terminal State</option>
                    <option value="compound">Compound State</option>
                  </select>
                </div>

                <Separator className="bg-white/5" />

                <div>
                   <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Transitions</label>
                   {(activeNode.transitions ?? []).length === 0 && (
                     <div className="text-xs text-muted-foreground italic mb-2">No transitions defined.</div>
                   )}
                   <div className="space-y-2">
                     {(activeNode.transitions ?? []).map((t, idx) => (
                       <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 text-xs">
                         <span className="font-mono text-primary">{t.event}</span>
                         <ArrowRight className="w-3 h-3 text-muted-foreground" />
                         <span className="font-mono">{t.target}</span>
                       </div>
                     ))}
                   </div>
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="w-full mt-2 border-dashed border-white/20 hover:border-white/40 text-xs"
                     onClick={() => setShowTransitionDialog(true)}
                     data-testid="button-add-transition"
                   >
                     <Plus className="w-3 h-3 mr-1" /> Add Transition
                   </Button>
                </div>
                
                <Dialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
                  <DialogContent className="max-w-sm bg-[#111] border-white/20">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        Add Transition
                      </DialogTitle>
                      <DialogDescription>
                        Define an event that triggers a state change
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Event Name</label>
                        <Input 
                          value={newTransitionEvent}
                          onChange={(e) => setNewTransitionEvent(e.target.value)}
                          placeholder="e.g., CLICK, TIMEOUT, SUCCESS"
                          className="bg-black/50 border-white/10"
                          data-testid="input-transition-event"
                        />
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Target State</label>
                        <select
                          value={newTransitionTarget}
                          onChange={(e) => setNewTransitionTarget(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-sm text-white"
                          data-testid="select-transition-target"
                        >
                          <option value="">Select target state...</option>
                          {Object.keys(file.logic.states).filter(id => id !== selectedNodeId).map(stateId => (
                            <option key={stateId} value={stateId}>{stateId}</option>
                          ))}
                        </select>
                      </div>
                      
                      <Button 
                        onClick={handleAddTransition}
                        className="w-full bg-primary hover:bg-primary/80"
                        data-testid="button-confirm-transition"
                      >
                        Add Transition
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                <MousePointer2 className="w-8 h-8 mb-4 opacity-50" />
                <p className="text-sm">Select a node to edit its properties.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Flight Controls Dashboard */}
      <FlightControlsDashboard
        onFlightInput={(input) => {
          // Flight input handler - can be connected to 3D camera later
          console.log('Flight input:', input);
        }}
        position={{ x: 0, y: 0, z: 0 }}
        velocity={0}
        heading={0}
      />
    </div>
  );
}
