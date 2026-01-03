import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Globe, 
  Lock, 
  Eye, 
  FolderOpen, 
  Box,
  Shield,
  Download,
  Trash2,
  Edit3,
  ChevronRight,
  Sparkles,
  Crown,
  Clock,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SpacetimePicker, type SpacetimeValue } from "@/components/SpacetimePicker";
import type { World, Cartridge } from "@shared/schema";

const visibilityIcons = {
  private: Lock,
  unlisted: Eye,
  public: Globe,
};

const visibilityColors = {
  private: "text-red-400",
  unlisted: "text-yellow-400",
  public: "text-green-400",
};

function WorldCard({ world, onDelete }: { world: World; onDelete: () => void }) {
  const VisIcon = visibilityIcons[world.visibility as keyof typeof visibilityIcons] || Lock;
  const visColor = visibilityColors[world.visibility as keyof typeof visibilityColors] || "text-zinc-400";
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
      
      <Card className="relative h-full bg-zinc-900/80 border-zinc-700 hover:border-blue-500/50 transition-colors overflow-hidden">
        <div 
          className="h-32 relative"
          style={{
            background: world.cover_image_url 
              ? `url(${world.cover_image_url}) center/cover`
              : `linear-gradient(135deg, 
                  hsl(${(world.title.charCodeAt(0) * 7) % 360}, 70%, 30%) 0%, 
                  hsl(${(world.title.charCodeAt(0) * 7 + 60) % 360}, 70%, 20%) 100%)`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant="outline" className={`${visColor} border-current bg-black/50`}>
              <VisIcon className="w-3 h-3 mr-1" />
              {world.visibility}
            </Badge>
          </div>
          {world.tenant !== "tingos" && (
            <Badge className="absolute top-3 left-3 bg-purple-500/80">
              {world.tenant}
            </Badge>
          )}
        </div>
        
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            {world.title}
          </CardTitle>
          {world.description && (
            <p className="text-sm text-zinc-400 line-clamp-2">{world.description}</p>
          )}
        </CardHeader>
        
        <CardContent className="pt-0 space-y-2">
          {(world.spacetime_datetime || world.spacetime_location) && (
            <div className="flex items-center gap-2 text-[10px] text-amber-400 bg-amber-500/10 rounded px-2 py-1">
              {world.spacetime_datetime && (
                <>
                  <Clock className="w-3 h-3" />
                  <span>{new Date(world.spacetime_datetime).toLocaleDateString()}</span>
                </>
              )}
              {world.spacetime_location && (
                <>
                  <MapPin className="w-3 h-3" />
                  <span>
                    {(() => {
                      try {
                        const loc = JSON.parse(world.spacetime_location);
                        return `${loc.lat?.toFixed(1)}, ${loc.lng?.toFixed(1)}`;
                      } catch { return "Set"; }
                    })()}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-mono">
              /{world.slug}
            </span>
            <div className="flex gap-1">
              <Link href={`/worlds/${world.slug}`}>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreateWorldDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [spacetimeOpen, setSpacetimeOpen] = useState(false);
  const [spacetime, setSpacetime] = useState<SpacetimeValue | null>(null);
  const { toast } = useToast();
  
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/worlds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          slug: slug || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
          description,
          visibility,
          spacetime_datetime: spacetime?.datetime?.toISOString() || null,
          spacetime_timezone: spacetime?.timezone || null,
          spacetime_location: spacetime?.location ? JSON.stringify(spacetime.location) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create world");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "World created!", description: `"${title}" is ready for your cartridges.` });
      setOpen(false);
      setTitle("");
      setSlug("");
      setDescription("");
      setSpacetime(null);
      onCreated();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create world", variant: "destructive" });
    },
  });
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="h-full min-h-[280px] w-full rounded-xl border-2 border-dashed border-zinc-700 hover:border-blue-500/50 bg-zinc-900/50 flex flex-col items-center justify-center gap-4 transition-colors group"
          data-testid="button-create-world"
        >
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
            <Plus className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Create New World</p>
            <p className="text-sm text-zinc-500">Start a new imaginary universe</p>
          </div>
        </motion.button>
      </DialogTrigger>
      
      <DialogContent className="bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Create a New World
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">World Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Amazing Universe"
              className="bg-zinc-800 border-zinc-700"
              data-testid="input-world-title"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">URL Slug</Label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">/worlds/</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "my-universe"}
                className="bg-zinc-800 border-zinc-700"
                data-testid="input-world-slug"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your world..."
              className="bg-zinc-800 border-zinc-700"
              data-testid="input-world-description"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-400" />
                    Private - Only you can see
                  </div>
                </SelectItem>
                <SelectItem value="unlisted">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-yellow-400" />
                    Unlisted - Anyone with link
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-400" />
                    Public - Visible to everyone
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Spacetime Anchor Section */}
          <div className="space-y-2 pt-2 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Spacetime Anchor
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-amber-400 hover:text-amber-300"
                onClick={() => setSpacetimeOpen(true)}
                data-testid="button-open-spacetime"
              >
                {spacetime ? "Change" : "Set When & Where"}
              </Button>
            </div>
            
            <p className="text-xs text-zinc-500">
              Set when and where this world exists in time and space.
            </p>
            
            {spacetime && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded p-2">
                <Clock className="w-3 h-3" />
                <span>{spacetime.datetime?.toLocaleString()}</span>
                {spacetime.location && (
                  <>
                    <MapPin className="w-3 h-3 ml-2" />
                    <span>{spacetime.location.lat.toFixed(2)}, {spacetime.location.lng.toFixed(2)}</span>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1 ml-auto text-red-400 hover:text-red-300"
                  onClick={() => setSpacetime(null)}
                  data-testid="button-clear-spacetime"
                >
                  Clear
                </Button>
              </div>
            )}
            
            <SpacetimePicker
              open={spacetimeOpen}
              onOpenChange={setSpacetimeOpen}
              value={spacetime || undefined}
              onSelect={setSpacetime}
              theme="steampunk"
              allowPast={true}
            />
          </div>
          
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={!title || createMutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-500"
            data-testid="button-submit-world"
          >
            {createMutation.isPending ? "Creating..." : "Create World"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function VaultStats({ vaultCount, worldCount }: { vaultCount: number; worldCount: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-zinc-900/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{worldCount}</p>
              <p className="text-xs text-zinc-500">Worlds</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-zinc-900/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{vaultCount}</p>
              <p className="text-xs text-zinc-500">Vaulted</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-zinc-900/80 border-zinc-700">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Crown className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Free</p>
              <p className="text-xs text-zinc-500">Current Tier</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-zinc-900/80 border-zinc-700">
        <CardContent className="pt-6">
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
              <Download className="w-4 h-4 mr-2" />
              Upgrade to Export
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VaultDashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: worlds = [], isLoading: worldsLoading, refetch: refetchWorlds } = useQuery<World[]>({
    queryKey: ["worlds"],
    queryFn: async () => {
      const res = await fetch("/api/worlds");
      if (!res.ok) throw new Error("Failed to fetch worlds");
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const { data: vaultEntries = [] } = useQuery({
    queryKey: ["vault"],
    queryFn: async () => {
      const res = await fetch("/api/vault");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated,
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (worldId: string) => {
      const res = await fetch(`/api/worlds/${worldId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "World deleted" });
      refetchWorlds();
    },
  });
  
  if (authLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-md mx-auto bg-zinc-900/80 border-zinc-700 text-center">
          <CardContent className="pt-12 pb-8">
            <Shield className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Your Personal Vault</h2>
            <p className="text-zinc-400 mb-6">
              Sign in to access your secure vault where you can create worlds, 
              organize cartridges, and backup your creations.
            </p>
            <a href="/api/login">
              <Button className="bg-blue-600 hover:bg-blue-500" data-testid="button-vault-login">
                Sign In to Continue
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Shield className="w-8 h-8 text-blue-400" />
          My Vault
        </h1>
        <p className="text-zinc-400 mt-2">
          Your personal universe collection. Create worlds, organize cartridges, and keep everything safe.
        </p>
      </div>
      
      <VaultStats vaultCount={vaultEntries.length} worldCount={worlds.length} />
      
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          My Worlds
        </h2>
      </div>
      
      {worldsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-[280px] rounded-xl bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CreateWorldDialog onCreated={refetchWorlds} />
          
          <AnimatePresence mode="popLayout">
            {worlds.map(world => (
              <WorldCard 
                key={world.id} 
                world={world} 
                onDelete={() => deleteMutation.mutate(world.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {worlds.length === 0 && !worldsLoading && (
        <div className="text-center py-12 mt-6">
          <FolderOpen className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl text-zinc-400 mb-2">No worlds yet</h3>
          <p className="text-zinc-500">Create your first world to start organizing your cartridges</p>
        </div>
      )}
    </div>
  );
}
