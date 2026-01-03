import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Save, Settings, Plus, Zap, 
  ChevronDown, ZoomIn, ZoomOut, MousePointer2,
  ArrowRight, FileJson, Download, WifiOff, Cloud, CloudOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { TossFile, createNewTossFile, TossState } from "@/lib/toss";
import { saveCartridge } from "@/lib/api";

const STORAGE_KEY = "blu-prince-cartridge";

function CartridgeBezel({ 
  title, 
  version, 
  isOnline, 
  isSaving,
  hasLocalChanges,
  onSave,
  onExport,
  onInspect,
}: { 
  title: string; 
  version: string; 
  isOnline: boolean;
  isSaving: boolean;
  hasLocalChanges: boolean;
  onSave: () => void;
  onExport: () => void;
  onInspect: () => void;
}) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-3xl" />
      
      <div className="relative bg-gradient-to-b from-[#2a2a35] via-[#1f1f28] to-[#18181f] border-b-4 border-gray-900 rounded-b-2xl overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-black/50" />
        </div>
        
        <div className="absolute left-4 top-0 bottom-0 w-8 flex flex-col justify-center gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-1 bg-gray-800 rounded-full" />
          ))}
        </div>
        <div className="absolute right-4 top-0 bottom-0 w-8 flex flex-col justify-center gap-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-1 bg-gray-800 rounded-full" />
          ))}
        </div>
        
        <div className="relative px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <motion.div 
                  className="relative cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 rounded-lg blur-sm" />
                  <div className="relative bg-gradient-to-br from-[#4a1c6b] via-[#2d1b4e] to-[#1a0f2e] rounded-lg p-3 border border-purple-500/30">
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5 rounded-lg" />
                    <div className="relative text-center">
                      <div className="font-pixel text-[10px] text-purple-300 tracking-widest">BLU</div>
                      <div className="font-pixel text-xs text-white tracking-tight">PRINCE</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
              
              <div className="h-8 w-px bg-white/10" />
              
              <div className="relative">
                <div className="absolute -inset-2 bg-black/50 rounded-lg blur-sm" />
                <div className="relative bg-gradient-to-b from-gray-900 to-black rounded border border-white/10 px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_6px_#22c55e]" />
                    <div>
                      <div className="text-xs font-mono text-white font-bold tracking-wide">
                        {title}
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

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-2">
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
                size="sm" 
                variant="ghost" 
                className="gap-2 text-gray-400 hover:text-white hover:bg-white/5" 
                onClick={onInspect}
              >
                <FileJson className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Source</span>
              </Button>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="gap-2 text-gray-400 hover:text-white hover:bg-white/5" 
                onClick={onSave}
                disabled={isSaving}
              >
                <Save className="w-4 h-4" /> 
                <span className="hidden sm:inline text-xs">{isSaving ? "Saving..." : "Save"}</span>
              </Button>
              
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600/30 to-cyan-600/30 hover:from-purple-600/40 hover:to-cyan-600/40 text-white border border-purple-500/30 gap-2"
                onClick={onExport}
              >
                <Download className="w-4 h-4" />
                <span className="text-xs">Export</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-gray-700 to-transparent rounded-t-full" />
      </div>
    </div>
  );
}

export default function BluPrince() {
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
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const { toast } = useToast();

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

  const nodes = file._editor?.nodes || [];

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

  const handleAddNode = (type: TossState['type']) => {
    const newId = `state_${Date.now()}`;
    const newNode = {
      id: newId,
      x: 300 + (nodes.length * 20), 
      y: 200 + (nodes.length * 20),
      color: type === 'initial' ? 'bg-green-500' : type === 'final' ? 'bg-muted-foreground' : 'bg-primary'
    };

    setFile(prev => ({
      ...prev,
      logic: {
        ...prev.logic,
        states: {
          ...prev.logic.states,
          [newId]: {
            id: newId,
            type: type,
            transitions: []
          }
        }
      },
      _editor: {
        ...prev._editor!,
        nodes: [...prev._editor!.nodes, newNode]
      }
    }));
  };

  const getTransitions = () => {
    const edges: Array<{from: string, to: string}> = [];
    Object.values(file.logic.states).forEach(state => {
      state.transitions.forEach(trans => {
        edges.push({ from: state.id, to: trans.target });
      });
    });
    if (edges.length === 0 && nodes.length > 1) {
       return [{ from: nodes[0].id, to: nodes[1]?.id }];
    }
    return edges;
  };

  const activeNode = selectedNodeId ? file.logic.states[selectedNodeId] : null;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-foreground overflow-hidden font-sans">
      <CartridgeBezel 
        title={file.manifest.meta.title}
        version={file.manifest.meta.version}
        isOnline={isOnline}
        isSaving={isSaving}
        hasLocalChanges={hasLocalChanges}
        onSave={handleSave}
        onExport={handleExport}
        onInspect={() => setShowJson(true)}
      />

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

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-mono uppercase text-muted-foreground mb-4">Logic Primitives</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center"><ChevronDown className="w-3 h-3 mr-1" /> STATES</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["initial", "state", "compound", "final"].map((item) => (
                    <div 
                      key={item} 
                      onClick={() => handleAddNode(item as any)}
                      className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex flex-col items-center gap-1 transition-colors active:scale-95"
                      data-testid={`add-state-${item}`}
                    >
                      <div className={`w-6 h-6 rounded ${item === 'initial' ? 'bg-green-500/20' : 'bg-primary/20'}`} />
                      <span className="text-[10px] text-muted-foreground capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                 <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span className="flex items-center"><Zap className="w-3 h-3 mr-1" /> EVENTS</span>
                </div>
                <Button variant="outline" size="sm" className="w-full text-xs justify-start border-dashed border-white/20">
                  <Plus className="w-3 h-3 mr-2" /> Define Trigger
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-[#0c0c10] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                 backgroundSize: '20px 20px'
               }} 
          />
          
          <div className="absolute bottom-4 left-4 flex gap-2">
             <div className="flex bg-black/50 backdrop-blur rounded-lg border border-white/10 p-1">
               <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomOut className="w-4 h-4" /></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8"><span className="text-xs">100%</span></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomIn className="w-4 h-4" /></Button>
             </div>
          </div>

          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full">
               <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
                </marker>
              </defs>
              {getTransitions().map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                return (
                  <motion.line 
                    key={i}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                    x1={fromNode.x + 80}
                    y1={fromNode.y + 24} 
                    x2={toNode.x}
                    y2={toNode.y + 24}
                    stroke="#444" 
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
            </svg>
          </div>

          <div className="relative w-full h-full p-10">
            {nodes.map((node) => {
              const stateData = file.logic.states[node.id];
              return (
                <motion.div
                  key={node.id}
                  drag
                  dragMomentum={false}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ left: node.x, top: node.y }}
                  className={`absolute w-40 p-0 rounded-lg border border-white/10 bg-[#1a1b23] shadow-xl cursor-pointer overflow-hidden ${selectedNodeId === node.id ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setSelectedNodeId(node.id)}
                  data-testid={`state-node-${node.id}`}
                >
                  <div className={`h-1 ${node.color || 'bg-primary'}`} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-white truncate max-w-[100px]">
                        {stateData?.id.toUpperCase()}
                      </span>
                      <Settings className="w-3 h-3 text-muted-foreground hover:text-white" />
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

        <div className="w-72 border-l border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-mono uppercase text-muted-foreground">Properties</h3>
          </div>
          
          <div className="flex-1 p-4">
            {activeNode ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">State ID</label>
                  <div className="text-xs font-mono text-white p-2 bg-black/40 rounded border border-white/10 select-all">
                    {activeNode.id}
                  </div>
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
                   {activeNode.transitions.length === 0 && (
                     <div className="text-xs text-muted-foreground italic mb-2">No transitions defined.</div>
                   )}
                   <div className="space-y-2">
                     {activeNode.transitions.map((t, idx) => (
                       <div key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 text-xs">
                         <span className="font-mono text-primary">{t.event}</span>
                         <ArrowRight className="w-3 h-3 text-muted-foreground" />
                         <span className="font-mono">{t.target}</span>
                       </div>
                     ))}
                   </div>
                   <Button variant="outline" size="sm" className="w-full mt-2 border-dashed border-white/20 hover:border-white/40 text-xs">
                     <Plus className="w-3 h-3 mr-1" /> Add Transition
                   </Button>
                </div>
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
    </div>
  );
}
