import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  ZoomIn,
  ZoomOut,
  Clock,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { FamousEvent } from "@shared/schema";

export type TimelineTheme = "steampunk" | "cyberpunk" | "artsy" | "minimal" | "l8r";

interface TimelineProps {
  events: FamousEvent[];
  theme?: TimelineTheme;
  orientation?: "vertical" | "horizontal";
  showImages?: boolean;
  onEventClick?: (event: FamousEvent) => void;
  selectedEventId?: string;
}

const themeStyles = {
  steampunk: {
    bg: "bg-gradient-to-br from-amber-950 via-amber-900 to-yellow-900",
    line: "bg-amber-600",
    node: "bg-amber-500 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    nodeHover: "hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.7)]",
    card: "bg-amber-950/80 border-amber-600/50",
    cardHover: "hover:border-amber-500",
    text: "text-amber-100",
    accent: "text-amber-400",
    badge: "bg-amber-800/50 border-amber-600 text-amber-300",
  },
  cyberpunk: {
    bg: "bg-gradient-to-br from-purple-950 via-slate-900 to-cyan-950",
    line: "bg-cyan-500",
    node: "bg-cyan-500 border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]",
    nodeHover: "hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.7)]",
    card: "bg-slate-900/80 border-cyan-500/50",
    cardHover: "hover:border-cyan-400",
    text: "text-cyan-100",
    accent: "text-cyan-400",
    badge: "bg-cyan-900/50 border-cyan-500 text-cyan-300",
  },
  artsy: {
    bg: "bg-gradient-to-br from-stone-100 via-rose-50 to-amber-50",
    line: "bg-stone-400",
    node: "bg-rose-500 border-rose-300 shadow-md",
    nodeHover: "hover:bg-rose-400 hover:shadow-lg",
    card: "bg-white/90 border-stone-300 shadow-sm",
    cardHover: "hover:border-rose-400 hover:shadow-md",
    text: "text-stone-800",
    accent: "text-rose-600",
    badge: "bg-rose-100 border-rose-300 text-rose-700",
  },
  minimal: {
    bg: "bg-zinc-900",
    line: "bg-zinc-600",
    node: "bg-white border-zinc-400",
    nodeHover: "hover:bg-zinc-200",
    card: "bg-zinc-800 border-zinc-700",
    cardHover: "hover:border-zinc-500",
    text: "text-zinc-100",
    accent: "text-white",
    badge: "bg-zinc-700 border-zinc-600 text-zinc-300",
  },
  l8r: {
    bg: "bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-950",
    line: "bg-fuchsia-500",
    node: "bg-fuchsia-500 border-fuchsia-300 shadow-[0_0_10px_rgba(217,70,239,0.5)]",
    nodeHover: "hover:bg-fuchsia-400 hover:shadow-[0_0_15px_rgba(217,70,239,0.7)]",
    card: "bg-indigo-950/80 border-fuchsia-500/50",
    cardHover: "hover:border-fuchsia-400",
    text: "text-fuchsia-100",
    accent: "text-fuchsia-400",
    badge: "bg-fuchsia-900/50 border-fuchsia-500 text-fuchsia-300",
  },
};

const categoryColors: Record<string, string> = {
  historical: "bg-amber-500",
  art: "bg-rose-500",
  music: "bg-purple-500",
  tech: "bg-cyan-500",
  science: "bg-green-500",
  sports: "bg-orange-500",
  politics: "bg-red-500",
  culture: "bg-pink-500",
  custom: "bg-gray-500",
};

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

function formatYear(date: Date | string): string {
  return new Date(date).getFullYear().toString();
}

export function Timeline({
  events,
  theme = "cyberpunk",
  orientation = "vertical",
  showImages = true,
  onEventClick,
  selectedEventId,
}: TimelineProps) {
  const [zoom, setZoom] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  const styles = themeStyles[theme];
  
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => 
      new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  }, [events]);

  const yearsRange = useMemo(() => {
    if (sortedEvents.length === 0) return [];
    const years = sortedEvents.map(e => new Date(e.datetime).getFullYear());
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
  }, [sortedEvents]);

  if (events.length === 0) {
    return (
      <div className={`${styles.bg} rounded-lg p-8 text-center`}>
        <Calendar className={`w-12 h-12 mx-auto mb-4 ${styles.accent} opacity-50`} />
        <p className={`${styles.text} opacity-70`}>No events to display</p>
      </div>
    );
  }

  if (orientation === "horizontal") {
    return (
      <div className={`${styles.bg} rounded-lg p-4 overflow-hidden`}>
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${styles.text}`}
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className={`text-xs ${styles.accent}`}>{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${styles.text}`}
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="w-full">
          <div className="relative pb-16" style={{ minWidth: `${sortedEvents.length * 200 * zoom}px` }}>
            <div className={`absolute top-1/2 left-0 right-0 h-1 ${styles.line}`} />
            
            <div className="flex items-center">
              {sortedEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  className="relative flex flex-col items-center"
                  style={{ width: `${200 * zoom}px` }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 cursor-pointer transition-all
                    ${styles.node} ${styles.nodeHover}
                    ${selectedEventId === event.id ? 'ring-2 ring-offset-2 ring-white scale-125' : ''}
                  `}
                    onClick={() => onEventClick?.(event)}
                    onMouseEnter={() => setHoveredId(event.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                  
                  <AnimatePresence>
                    {(hoveredId === event.id || selectedEventId === event.id) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`absolute top-8 w-48 p-3 rounded-lg z-10 ${styles.card} border`}
                      >
                        <p className={`text-xs font-bold ${styles.text} truncate`}>{event.title}</p>
                        <p className={`text-[10px] ${styles.accent} mt-1`}>{formatDate(event.datetime)}</p>
                        {event.is_featured && (
                          <Star className="w-3 h-3 text-yellow-400 absolute top-2 right-2" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <div className={`mt-6 text-center text-[10px] ${styles.accent}`}>
                    {formatYear(event.datetime)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className={`${styles.bg} rounded-lg p-4`}>
      <ScrollArea className="h-[500px]">
        <div className="relative pl-8">
          <div className={`absolute left-3 top-0 bottom-0 w-0.5 ${styles.line}`} />
          
          {sortedEvents.map((event, idx) => (
            <motion.div
              key={event.id}
              className="relative mb-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div 
                className={`absolute left-[-21px] w-4 h-4 rounded-full border-2 cursor-pointer transition-all
                  ${styles.node} ${styles.nodeHover}
                  ${selectedEventId === event.id ? 'ring-2 ring-offset-2 ring-white scale-125' : ''}
                `}
                onClick={() => onEventClick?.(event)}
              />
              
              <motion.div
                className={`ml-4 p-4 rounded-lg border transition-all cursor-pointer
                  ${styles.card} ${styles.cardHover}
                  ${selectedEventId === event.id ? 'ring-2 ring-white/30' : ''}
                `}
                onClick={() => onEventClick?.(event)}
                whileHover={{ scale: 1.01 }}
                data-testid={`timeline-event-${event.id}`}
              >
                <div className="flex items-start gap-3">
                  {showImages && event.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={event.image_url} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] h-4 ${styles.badge}`}
                      >
                        <div className={`w-2 h-2 rounded-full mr-1 ${categoryColors[event.category] || categoryColors.custom}`} />
                        {event.category}
                      </Badge>
                      {event.is_featured && (
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      )}
                    </div>
                    
                    <h3 className={`font-semibold ${styles.text} truncate`}>
                      {event.title}
                    </h3>
                    
                    {event.description && (
                      <p className={`text-sm ${styles.text} opacity-70 line-clamp-2 mt-1`}>
                        {event.description}
                      </p>
                    )}
                    
                    <div className={`flex items-center gap-3 mt-2 text-xs ${styles.accent}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.datetime)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {typeof event.location === 'object' && event.location !== null && 'name' in (event.location as Record<string, unknown>) 
                            ? String((event.location as Record<string, unknown>).name)
                            : 'Location'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export type { TimelineProps };
