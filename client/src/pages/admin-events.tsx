import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  MapPin, 
  Star,
  Save,
  X,
  Image,
  Link as LinkIcon,
  Clock,
  Filter,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Timeline, type TimelineTheme } from "@/components/Timeline";
import { SpacetimePicker, type SpacetimeValue } from "@/components/SpacetimePicker";
import type { FamousEvent } from "@shared/schema";

const categories = [
  "historical", "art", "music", "tech", "science", "sports", "politics", "culture", "custom"
];

const tenants = ["tingos", "l8r", "artsy", "coins", "unwanted"];

const themeOptions: { value: TimelineTheme; label: string }[] = [
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "steampunk", label: "Steampunk" },
  { value: "artsy", label: "Artsy" },
  { value: "l8r", label: "L8r.co" },
  { value: "minimal", label: "Minimal" },
];

function EventForm({
  event,
  onSave,
  onCancel,
  isLoading,
}: {
  event?: FamousEvent;
  onSave: (data: Partial<FamousEvent>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [category, setCategory] = useState(event?.category || "historical");
  const [tenant, setTenant] = useState(event?.tenant || "tingos");
  const [imageUrl, setImageUrl] = useState(event?.image_url || "");
  const [sourceUrl, setSourceUrl] = useState(event?.source_url || "");
  const [isFeatured, setIsFeatured] = useState(event?.is_featured || false);
  const [spacetimeOpen, setSpacetimeOpen] = useState(false);
  const [spacetime, setSpacetime] = useState<SpacetimeValue | null>(
    event?.datetime ? {
      datetime: new Date(event.datetime),
      timezone: event.timezone || "UTC",
      location: event.location as SpacetimeValue["location"],
    } : null
  );

  const handleSubmit = () => {
    if (!title || !spacetime?.datetime) return;
    
    onSave({
      title,
      description: description || null,
      datetime: spacetime.datetime,
      timezone: spacetime.timezone,
      location: spacetime.location || null,
      category,
      tenant,
      image_url: imageUrl || null,
      source_url: sourceUrl || null,
      is_featured: isFeatured,
    });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="title" className="text-xs">Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Moon Landing"
          className="bg-zinc-800 border-zinc-700 h-8 text-sm"
          data-testid="input-event-title"
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description" className="text-xs">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A brief description..."
          className="bg-zinc-800 border-zinc-700 min-h-[60px] text-sm"
          data-testid="input-event-description"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Site</Label>
          <Select value={tenant} onValueChange={setTenant}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {tenants.map(t => (
                <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="p-2 rounded bg-amber-950/30 border border-amber-700/30">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3 h-3 text-amber-400" />
            When & Where *
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-2 text-amber-400"
            onClick={() => setSpacetimeOpen(true)}
          >
            {spacetime ? "Change" : "Set"}
          </Button>
        </div>
        
        {spacetime && (
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Calendar className="w-3 h-3" />
            <span>{spacetime.datetime.toLocaleString()}</span>
            {spacetime.location && (
              <>
                <MapPin className="w-3 h-3 ml-2" />
                <span>{spacetime.location.name || `${spacetime.location.lat?.toFixed(2)}, ${spacetime.location.lng?.toFixed(2)}`}</span>
              </>
            )}
          </div>
        )}
        
        <SpacetimePicker
          open={spacetimeOpen}
          onOpenChange={setSpacetimeOpen}
          value={spacetime || undefined}
          onSelect={setSpacetime}
          theme="steampunk"
          allowPast={true}
          allowFuture={true}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="flex items-center gap-1.5 text-xs">
            <Image className="w-3 h-3" />
            Image
          </Label>
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="bg-zinc-800 border-zinc-700 h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1.5 text-xs">
            <LinkIcon className="w-3 h-3" />
            Source
          </Label>
          <Input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="bg-zinc-800 border-zinc-700 h-8 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-1.5 rounded bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-center gap-1.5">
          <Star className="w-3 h-3 text-yellow-400" />
          <Label htmlFor="featured" className="cursor-pointer text-xs">Featured</Label>
        </div>
        <Switch
          id="featured"
          checked={isFeatured}
          onCheckedChange={setIsFeatured}
          className="scale-75"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-8 text-xs"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-500"
          disabled={!title || !spacetime || isLoading}
          data-testid="button-save-event"
        >
          <Save className="w-3 h-3 mr-1" />
          {isLoading ? "..." : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminEventsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingEvent, setEditingEvent] = useState<FamousEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTenant, setFilterTenant] = useState<string>("all");
  const [previewTheme, setPreviewTheme] = useState<TimelineTheme>("cyberpunk");
  const [orientation, setOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();

  const { data: events = [], isLoading: eventsLoading } = useQuery<FamousEvent[]>({
    queryKey: ["events", filterCategory, filterTenant],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCategory !== "all") params.set("category", filterCategory);
      if (filterTenant !== "all") params.set("tenant", filterTenant);
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FamousEvent>) => {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create event");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Event Created", description: "The event has been added to the timeline." });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsCreating(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FamousEvent> }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update event");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Event Updated", description: "Changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setEditingEvent(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update event", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete event");
    },
    onSuccess: () => {
      toast({ title: "Event Deleted" });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-6 py-12 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-md mx-auto bg-zinc-900/80 border-zinc-700 text-center">
          <CardContent className="pt-12 pb-8">
            <Calendar className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
            <p className="text-zinc-400 mb-6">
              Sign in to manage timeline events.
            </p>
            <a href="/api/login">
              <Button className="bg-cyan-600 hover:bg-cyan-500">Sign In</Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Timeline Events
          </h1>
          <p className="text-zinc-400 text-xs">Manage famous events</p>
        </div>
        
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-cyan-600 hover:bg-cyan-500 h-8 text-xs"
          data-testid="button-create-event"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-zinc-900/80 border-zinc-700">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-1.5 text-sm">
                <Filter className="w-4 h-4" />
                Events ({events.length})
              </CardTitle>
              <div className="flex gap-1">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[90px] h-6 text-[10px] bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterTenant} onValueChange={setFilterTenant}>
                  <SelectTrigger className="w-[70px] h-6 text-[10px] bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Site" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All</SelectItem>
                    {tenants.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <ScrollArea className="h-[400px]">
              {eventsLoading ? (
                <div className="flex items-center justify-center h-24">
                  <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No events found</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence>
                    {events.map((event) => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`p-2 rounded border transition-colors cursor-pointer
                          ${selectedEventId === event.id 
                            ? 'bg-cyan-500/20 border-cyan-500/50' 
                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600'
                          }
                        `}
                        onClick={() => setSelectedEventId(event.id)}
                        data-testid={`event-row-${event.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-medium text-white truncate">{event.title}</h3>
                              {event.is_featured && (
                                <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-400">
                              <Badge variant="outline" className="text-[9px] h-3.5 px-1">
                                {event.category}
                              </Badge>
                              <span>{new Date(event.datetime).toLocaleDateString()}</span>
                              <span className="text-zinc-600">{event.tenant}</span>
                            </div>
                          </div>
                          <div className="flex gap-0.5 ml-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event);
                              }}
                              data-testid={`edit-event-${event.id}`}
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(event.id);
                              }}
                              data-testid={`delete-event-${event.id}`}
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-700">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-1.5 text-sm">
                <Layout className="w-4 h-4" />
                Preview
              </CardTitle>
              <div className="flex gap-1">
                <Select value={previewTheme} onValueChange={(v) => setPreviewTheme(v as TimelineTheme)}>
                  <SelectTrigger className="w-[80px] h-6 text-[10px] bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setOrientation(o => o === "vertical" ? "horizontal" : "vertical")}
                >
                  {orientation === "vertical" ? "→" : "↓"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Timeline
              events={events}
              theme={previewTheme}
              orientation={orientation}
              selectedEventId={selectedEventId}
              onEventClick={(event) => setSelectedEventId(event.id)}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-sm p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-white flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4 text-cyan-400" />
              Add Event
            </DialogTitle>
          </DialogHeader>
          <EventForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setIsCreating(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-sm p-4">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-white flex items-center gap-1.5 text-sm">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              Edit Event
            </DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <EventForm
              event={editingEvent}
              onSave={(data) => updateMutation.mutate({ id: editingEvent.id, data })}
              onCancel={() => setEditingEvent(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
