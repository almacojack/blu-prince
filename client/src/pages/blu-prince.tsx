import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Play, Settings, Plus, Box, Zap, Type, 
  ChevronRight, ChevronDown, Download, Share2, 
  Undo, Redo, ZoomIn, ZoomOut, MousePointer2,
  ArrowRight, FileJson
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TossCartridge, createEmptyCartridge, TossState } from "@/lib/toss";

export default function BluPrince() {
  // We now use the standardized TOSS schema for state
  const [cartridge, setCartridge] = useState<TossCartridge>(createEmptyCartridge());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Helper to get nodes from the standardized schema or fallback to editor defaults
  const nodes = cartridge.editor?.nodes || [];

  const handleAddNode = (type: TossState['type']) => {
    const newId = `state_${Date.now()}`;
    const newNode = {
      id: newId,
      x: 300 + (nodes.length * 20), 
      y: 200 + (nodes.length * 20),
      color: type === 'initial' ? 'bg-green-500' : type === 'final' ? 'bg-muted-foreground' : 'bg-primary'
    };

    setCartridge(prev => ({
      ...prev,
      fsm: {
        ...prev.fsm,
        states: {
          ...prev.fsm.states,
          [newId]: {
            id: newId,
            label: type.toUpperCase(),
            type: type,
            transitions: []
          }
        }
      },
      editor: {
        ...prev.editor!,
        nodes: [...prev.editor!.nodes, newNode]
      }
    }));
  };

  const getTransitions = () => {
    const edges: Array<{from: string, to: string}> = [];
    Object.values(cartridge.fsm.states).forEach(state => {
      state.transitions.forEach(trans => {
        edges.push({ from: state.id, to: trans.target });
      });
    });
    // Add dummy edge for demo if none exist
    if (edges.length === 0 && nodes.length > 1) {
       return [{ from: nodes[0].id, to: nodes[1]?.id }];
    }
    return edges;
  };

  const activeNode = selectedNodeId ? cartridge.fsm.states[selectedNodeId] : null;

  return (
    <div className="flex flex-col h-screen bg-[#09090b] text-foreground overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-sm z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="font-pixel text-sm tracking-tight hidden md:inline">BLU-PRINCE</span>
            </div>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="text-white font-medium">{cartridge.manifest.title}</span>
            <Badge variant="outline" className="text-[10px] h-5 px-1 border-yellow-500/50 text-yellow-500">v{cartridge.manifest.version}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={showJson} onOpenChange={setShowJson}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="gap-2">
                <FileJson className="w-4 h-4" /> <span className="hidden sm:inline">View TOSS JSON</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] bg-[#111] border-white/20">
              <DialogHeader>
                <DialogTitle>TOSS Payload Preview</DialogTitle>
                <DialogDescription>
                  This is the standardized JSON that will be sent to the TingOs Runtime.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[500px] w-full rounded border border-white/10 bg-black/50 p-4">
                <pre className="text-xs font-mono text-green-400">
                  {JSON.stringify(cartridge, null, 2)}
                </pre>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <Button size="sm" variant="ghost" className="gap-2">
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Play className="w-4 h-4 fill-current" /> Test Run
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Asset Library */}
        <div className="w-64 border-r border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-mono uppercase text-muted-foreground mb-4">Library</h3>
            <div className="space-y-1">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-normal">
                <Box className="w-4 h-4 mr-2 text-primary" /> States
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-normal">
                <Zap className="w-4 h-4 mr-2 text-yellow-400" /> Events
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm font-normal">
                <Type className="w-4 h-4 mr-2 text-blue-400" /> Variables
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 group cursor-pointer hover:text-white">
                  <span className="flex items-center"><ChevronDown className="w-3 h-3 mr-1" /> CORE NODES</span>
                  <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["initial", "state", "compound", "final"].map((item) => (
                    <div 
                      key={item} 
                      onClick={() => handleAddNode(item as any)}
                      className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer flex flex-col items-center gap-1 transition-colors active:scale-95"
                    >
                      <div className={`w-6 h-6 rounded ${item === 'initial' ? 'bg-green-500/20' : 'bg-primary/20'}`} />
                      <span className="text-[10px] text-muted-foreground capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 relative bg-[#0c0c10] overflow-hidden">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ 
                 backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                 backgroundSize: '20px 20px'
               }} 
          />
          
          {/* Canvas Controls */}
          <div className="absolute bottom-4 left-4 flex gap-2">
             <div className="flex bg-black/50 backdrop-blur rounded-lg border border-white/10 p-1">
               <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomOut className="w-4 h-4" /></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8"><span className="text-xs">100%</span></Button>
               <Button variant="ghost" size="icon" className="h-8 w-8"><ZoomIn className="w-4 h-4" /></Button>
             </div>
          </div>

          {/* Node Graph Visualization */}
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
              const stateData = cartridge.fsm.states[node.id];
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
                >
                  <div className={`h-1 ${node.color || 'bg-primary'}`} />
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold font-mono text-white truncate max-w-[100px]">
                        {stateData?.label || 'UNKNOWN'}
                      </span>
                      <Settings className="w-3 h-3 text-muted-foreground hover:text-white" />
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      TYPE: {stateData?.type.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Ports */}
                  <div className="absolute left-0 top-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20 border border-black hover:bg-primary transition-colors" />
                  <div className="absolute right-0 top-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-white/20 border border-black hover:bg-primary transition-colors" />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-mono uppercase text-muted-foreground">Properties</h3>
          </div>
          
          <div className="flex-1 p-4">
            {activeNode ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Node Label</label>
                  <input 
                    type="text" 
                    value={activeNode.label} 
                    onChange={(e) => {
                      setCartridge(prev => ({
                        ...prev,
                        fsm: {
                          ...prev.fsm,
                          states: {
                            ...prev.fsm.states,
                            [activeNode.id]: { ...activeNode, label: e.target.value }
                          }
                        }
                      }));
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none text-white"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">State Type</label>
                  <select 
                    value={activeNode.type}
                    onChange={(e) => {
                      setCartridge(prev => ({
                        ...prev,
                        fsm: {
                          ...prev.fsm,
                          states: {
                            ...prev.fsm.states,
                            [activeNode.id]: { ...activeNode, type: e.target.value as any }
                          }
                        }
                      }));
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none"
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
                <p className="text-sm">Select a node to edit its properties and logic.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
