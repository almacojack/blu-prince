import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, BookOpen, Tag, Calendar, User, 
  ChevronRight, Star, Archive, Bookmark,
  Grid, List, Filter, SortAsc
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export interface CatalogEntry {
  id: string;
  title: string;
  author: string;
  category: string;
  tags: string[];
  dateCreated: string;
  dateModified: string;
  description: string;
  deweyCode?: string;
  callNumber?: string;
  starred?: boolean;
  archived?: boolean;
}

interface ThingCatalogProps {
  entries?: CatalogEntry[];
  onSelectEntry?: (entry: CatalogEntry) => void;
  onStarEntry?: (id: string, starred: boolean) => void;
  onArchiveEntry?: (id: string, archived: boolean) => void;
  className?: string;
}

const SAMPLE_ENTRIES: CatalogEntry[] = [
  {
    id: '1',
    title: 'Button Component',
    author: 'System',
    category: 'UI Elements',
    tags: ['interactive', 'form', 'primary'],
    dateCreated: '2025-12-15',
    dateModified: '2025-12-20',
    description: 'Standard interactive button with multiple variants and states',
    deweyCode: '005.1',
    callNumber: 'UI-BTN-001',
    starred: true,
  },
  {
    id: '2', 
    title: 'State Machine Node',
    author: 'FSM Core',
    category: 'Logic',
    tags: ['fsm', 'state', 'transition'],
    dateCreated: '2025-11-10',
    dateModified: '2025-12-18',
    description: 'Represents a single state in the finite state machine graph',
    deweyCode: '511.3',
    callNumber: 'FSM-NOD-042',
  },
  {
    id: '3',
    title: 'Water Container',
    author: 'Physics Lab',
    category: 'Physics',
    tags: ['simulation', '3d', 'fluid'],
    dateCreated: '2025-12-01',
    dateModified: '2025-12-22',
    description: 'Container for water simulation with reactive wave physics',
    deweyCode: '532.5',
    callNumber: 'PHY-WTR-007',
    starred: true,
  },
  {
    id: '4',
    title: 'Environmental Force',
    author: 'Physics Lab',
    category: 'Physics',
    tags: ['force', 'simulation', 'environment'],
    dateCreated: '2025-12-10',
    dateModified: '2025-12-21',
    description: 'Configurable environmental force including fire, ice, wind, water, vacuum, and nuclear effects',
    deweyCode: '531.1',
    callNumber: 'PHY-ENV-015',
  },
];

function LibraryCard({ 
  entry, 
  isVictorian,
  onSelect,
  onStar,
  onArchive 
}: { 
  entry: CatalogEntry;
  isVictorian: boolean;
  onSelect?: () => void;
  onStar?: () => void;
  onArchive?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className={cn(
        "relative cursor-pointer group transition-all duration-200",
        isVictorian 
          ? "bg-gradient-to-br from-amber-950/80 to-amber-900/60 border-2 border-amber-700/50 rounded-sm shadow-lg"
          : "bg-gradient-to-br from-slate-900/90 to-slate-800/70 border border-cyan-500/30 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.1)]"
      )}
      onClick={onSelect}
      data-testid={`catalog-card-${entry.id}`}
    >
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        isVictorian
          ? "bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600"
          : "bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500"
      )} />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-[10px] uppercase tracking-widest mb-1",
              isVictorian ? "text-amber-500/70" : "text-cyan-400/70"
            )}>
              {entry.callNumber || entry.deweyCode}
            </div>
            <h3 className={cn(
              "font-semibold text-base truncate",
              isVictorian 
                ? "font-serif text-amber-100" 
                : "text-white"
            )}>
              {entry.title}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onStar?.(); }}
              className={cn(
                "h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                entry.starred && "opacity-100"
              )}
              data-testid={`star-${entry.id}`}
              aria-label={entry.starred ? "Remove from starred" : "Add to starred"}
            >
              <Star className={cn(
                "w-4 h-4",
                entry.starred 
                  ? isVictorian ? "fill-amber-400 text-amber-400" : "fill-yellow-400 text-yellow-400"
                  : isVictorian ? "text-amber-500/50" : "text-white/30"
              )} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onArchive?.(); }}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`archive-${entry.id}`}
              aria-label={entry.archived ? "Unarchive" : "Archive"}
            >
              <Archive className={cn(
                "w-4 h-4",
                entry.archived
                  ? isVictorian ? "fill-amber-500 text-amber-500" : "fill-zinc-400 text-zinc-400"
                  : isVictorian ? "text-amber-500/50" : "text-white/30"
              )} />
            </Button>
          </div>
        </div>

        <p className={cn(
          "text-xs line-clamp-2 min-h-[2.5rem]",
          isVictorian 
            ? "text-amber-200/70 italic" 
            : "text-zinc-400"
        )}>
          {entry.description}
        </p>

        <div className={cn(
          "pt-2 border-t flex items-center justify-between gap-2",
          isVictorian ? "border-amber-700/30" : "border-white/10"
        )}>
          <div className="flex items-center gap-2 text-[10px]">
            <span className={cn(
              "flex items-center gap-1",
              isVictorian ? "text-amber-500/60" : "text-zinc-500"
            )}>
              <User className="w-3 h-3" />
              {entry.author}
            </span>
            <span className={cn(
              isVictorian ? "text-amber-700/50" : "text-zinc-700"
            )}>•</span>
            <span className={cn(
              "flex items-center gap-1",
              isVictorian ? "text-amber-500/60" : "text-zinc-500"
            )}>
              <Calendar className="w-3 h-3" />
              {entry.dateModified}
            </span>
          </div>
          
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] h-5",
              isVictorian 
                ? "border-amber-600/50 text-amber-400 bg-amber-950/50" 
                : "border-cyan-500/30 text-cyan-400 bg-cyan-950/30"
            )}
          >
            {entry.category}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 3).map(tag => (
            <span 
              key={tag}
              className={cn(
                "text-[9px] px-1.5 py-0.5 rounded",
                isVictorian
                  ? "bg-amber-800/30 text-amber-300/70 border border-amber-700/20"
                  : "bg-fuchsia-950/40 text-fuchsia-300/70 border border-fuchsia-500/20"
              )}
            >
              #{tag}
            </span>
          ))}
          {entry.tags.length > 3 && (
            <span className={cn(
              "text-[9px] px-1.5 py-0.5",
              isVictorian ? "text-amber-500/50" : "text-zinc-500"
            )}>
              +{entry.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className={cn(
        "absolute bottom-0 left-0 right-0 h-8 opacity-0 group-hover:opacity-100 transition-opacity",
        "flex items-center justify-center gap-1 text-[10px]",
        isVictorian
          ? "bg-gradient-to-t from-amber-900/90 to-transparent text-amber-300"
          : "bg-gradient-to-t from-slate-900/90 to-transparent text-cyan-400"
      )}>
        <span>Open Card</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </motion.div>
  );
}

export function ThingCatalog({ 
  entries: initialEntries = SAMPLE_ENTRIES,
  onSelectEntry,
  onStarEntry,
  onArchiveEntry,
  className 
}: ThingCatalogProps) {
  const { themeVariant } = useTheme();
  const isVictorian = themeVariant === 'victorian';
  
  const [localEntries, setLocalEntries] = useState<CatalogEntry[]>(initialEntries);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleStar = (id: string) => {
    setLocalEntries(prev => prev.map(e => 
      e.id === id ? { ...e, starred: !e.starred } : e
    ));
    const entry = localEntries.find(e => e.id === id);
    if (entry) onStarEntry?.(id, !entry.starred);
  };

  const handleArchive = (id: string) => {
    setLocalEntries(prev => prev.map(e => 
      e.id === id ? { ...e, archived: !e.archived } : e
    ));
    const entry = localEntries.find(e => e.id === id);
    if (entry) onArchiveEntry?.(id, !entry.archived);
  };

  const categories = Array.from(new Set(localEntries.map(e => e.category)));
  
  const filteredEntries = localEntries.filter(entry => {
    if (entry.archived) return false;
    if (showStarredOnly && !entry.starred) return false;
    if (selectedCategory && entry.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.tags.some(t => t.toLowerCase().includes(q)) ||
        entry.author.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className={cn("flex flex-col h-full min-h-0 overflow-hidden", className)}>
      <div className={cn(
        "p-4 border-b shrink-0",
        isVictorian ? "border-amber-700/30 bg-amber-950/30" : "border-white/10 bg-black/30"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className={cn(
            "w-6 h-6",
            isVictorian ? "text-amber-500" : "text-cyan-400"
          )} />
          <h2 className={cn(
            "text-xl font-bold",
            isVictorian ? "font-serif text-amber-100" : "text-white"
          )}>
            Thing Catalog
          </h2>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            isVictorian 
              ? "bg-amber-800/50 text-amber-300" 
              : "bg-cyan-950/50 text-cyan-400 border border-cyan-500/30"
          )}>
            {filteredEntries.length} entries
          </span>
        </div>

        <div className="relative">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
            isVictorian ? "text-amber-500/50" : "text-zinc-500"
          )} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search the catalog..."
            className={cn(
              "pl-10 h-10",
              isVictorian 
                ? "bg-amber-950/50 border-amber-700/50 placeholder:text-amber-500/40 focus:border-amber-500" 
                : "bg-slate-900/50 border-white/10 placeholder:text-zinc-500 focus:border-cyan-500"
            )}
            data-testid="input-catalog-search"
          />
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant={showStarredOnly ? "default" : "ghost"}
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={cn(
              "h-7 text-xs gap-1",
              showStarredOnly && (isVictorian ? "bg-amber-700 hover:bg-amber-600" : "bg-yellow-600 hover:bg-yellow-500")
            )}
            data-testid="btn-starred-filter"
          >
            <Star className="w-3 h-3" />
            Starred
          </Button>
          
          <div className="flex-1" />
          
          <div className={cn(
            "flex items-center gap-1 p-0.5 rounded-lg",
            isVictorian ? "bg-amber-950/50" : "bg-slate-900/50"
          )}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('grid')}
              className={cn(
                "h-7 w-7 p-0",
                viewMode === 'grid' && (isVictorian ? "bg-amber-800/50" : "bg-white/10")
              )}
              data-testid="btn-view-grid"
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setViewMode('list')}
              className={cn(
                "h-7 w-7 p-0",
                viewMode === 'list' && (isVictorian ? "bg-amber-800/50" : "bg-white/10")
              )}
              data-testid="btn-view-list"
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "ghost"}
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "h-6 text-[10px] px-2",
                selectedCategory === null && (isVictorian ? "bg-amber-700" : "bg-purple-600")
              )}
            >
              All
            </Button>
            {categories.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={selectedCategory === cat ? "default" : "ghost"}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "h-6 text-[10px] px-2",
                  selectedCategory === cat && (isVictorian ? "bg-amber-700" : "bg-purple-600")
                )}
                data-testid={`category-${cat}`}
              >
                {cat}
              </Button>
            ))}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className={cn(
          "p-4 pb-8",
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            : "space-y-2"
        )}>
          <AnimatePresence mode="popLayout">
            {filteredEntries.map(entry => (
              <LibraryCard
                key={entry.id}
                entry={entry}
                isVictorian={isVictorian}
                onSelect={() => onSelectEntry?.(entry)}
                onStar={() => handleStar(entry.id)}
                onArchive={() => handleArchive(entry.id)}
              />
            ))}
          </AnimatePresence>
          
          {filteredEntries.length === 0 && (
            <div className={cn(
              "col-span-full py-12 text-center",
              isVictorian ? "text-amber-500/50" : "text-zinc-500"
            )}>
              <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No entries found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
