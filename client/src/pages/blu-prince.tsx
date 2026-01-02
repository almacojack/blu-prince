import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Save, Play, Settings, Plus, Box, Zap, Type, 
  ChevronRight, ChevronDown, Download, Share2, 
  Undo, Redo, ZoomIn, ZoomOut, MousePointer2,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Mock Data for the Graph
const initialNodes = [
  { id: 1, type: "start", label: "START", x: 100, y: 100, color: "bg-green-500" },
  { id: 2, type: "state", label: "IDLE_STATE", x: 300, y: 150, color: "bg-primary" },
  { id: 3, type: "state", label: "PROCESSING", x: 550, y: 100, color: "bg-secondary" },
  { id: 4, type: "end", label: "COMPLETE", x: 800, y: 200, color: "bg-muted-foreground" },
];

const initialEdges = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4 },
  { from: 3, to: 2, curve: "bottom" },
];

export default function BluPrince() {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

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
            <span className="text-white font-medium">Untitled_Cart_01</span>
            <Badge variant="outline" className="text-[10px] h-5 px-1 border-yellow-500/50 text-yellow-500">UNSAVED</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
            <Redo className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button size="sm" variant="ghost" className="gap-2">
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Save</span>
          </Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
            <Play className="w-4 h-4 fill-current" /> Run Simulation
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
                  {["Start", "State", "Condition", "End", "Action", "Timer"].map((item) => (
                    <div key={item} className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/5 cursor-move flex flex-col items-center gap-1 transition-colors">
                      <div className="w-6 h-6 rounded bg-primary/20" />
                      <span className="text-[10px] text-muted-foreground">{item}</span>
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
              {initialEdges.map((edge, i) => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;

                // Simple straight line logic for demo
                // Ideally this would use a curve calculation
                return (
                  <motion.line 
                    key={i}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                    x1={fromNode.x + 80} // Approx center width
                    y1={fromNode.y + 24} // Approx center height
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
            {nodes.map((node) => (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{ left: node.x, top: node.y }}
                className={`absolute w-40 p-0 rounded-lg border border-white/10 bg-[#1a1b23] shadow-xl cursor-pointer overflow-hidden ${selectedNode === node.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedNode(node.id)}
              >
                <div className={`h-1 ${node.color}`} />
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold font-mono text-white">{node.label}</span>
                    <Settings className="w-3 h-3 text-muted-foreground hover:text-white" />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    TYPE: {node.type.toUpperCase()}
                  </div>
                </div>
                
                {/* Ports */}
                <div className="absolute left-0 top-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/20 border border-black hover:bg-primary transition-colors" />
                <div className="absolute right-0 top-1/2 translate-x-1/2 w-2 h-2 rounded-full bg-white/20 border border-black hover:bg-primary transition-colors" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 border-l border-white/10 bg-black/20 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-xs font-mono uppercase text-muted-foreground">Properties</h3>
          </div>
          
          <div className="flex-1 p-4">
            {selectedNode ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Node Label</label>
                  <input 
                    type="text" 
                    value={nodes.find(n => n.id === selectedNode)?.label} 
                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none text-white"
                  />
                </div>
                
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">State Type</label>
                  <select className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-primary focus:outline-none appearance-none">
                    <option>Standard State</option>
                    <option>Initial State</option>
                    <option>Terminal State</option>
                  </select>
                </div>

                <Separator className="bg-white/5" />

                <div>
                   <label className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Transitions</label>
                   <div className="space-y-2">
                     <div className="flex items-center justify-between p-2 rounded bg-white/5 text-xs">
                       <span className="font-mono text-primary">ON_CLICK</span>
                       <ArrowRight className="w-3 h-3 text-muted-foreground" />
                       <span className="font-mono">PROCESSING</span>
                     </div>
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
