import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Search, Zap, Check, X, AlertTriangle, Package, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TossFile } from "@/lib/toss";
import { 
  buildEventCatalog, 
  searchEvents, 
  ResolvedEvent, 
  EventResult, 
  createEventResult,
  EventCatalog 
} from "@/lib/event-catalog";

interface CartridgeInfo {
  id: string;
  label: string;
  toss: TossFile;
}

interface EventConsoleProps {
  cartridges: CartridgeInfo[];
  currentState: string;
  onTriggerEvent: (eventId: string, path: string) => { success: boolean; message: string; previousState?: string; newState?: string };
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function EventConsole({ 
  cartridges, 
  currentState, 
  onTriggerEvent,
  collapsed = true,
  onToggleCollapse,
}: EventConsoleProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCarts, setExpandedCarts] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<EventResult[]>([]);

  const catalog = useMemo(() => buildEventCatalog(cartridges), [cartridges]);
  const filteredEvents = useMemo(() => searchEvents(catalog, searchQuery), [catalog, searchQuery]);

  const eventsByCartridge = useMemo(() => {
    const map = new Map<string, ResolvedEvent[]>();
    for (const event of filteredEvents) {
      const list = map.get(event.cartridgeId) || [];
      list.push(event);
      map.set(event.cartridgeId, list);
    }
    return map;
  }, [filteredEvents]);

  const toggleCart = (cartId: string) => {
    const newSet = new Set(expandedCarts);
    if (newSet.has(cartId)) {
      newSet.delete(cartId);
    } else {
      newSet.add(cartId);
    }
    setExpandedCarts(newSet);
  };

  const handleTrigger = useCallback((event: ResolvedEvent) => {
    const result = onTriggerEvent(event.eventId, event.path);
    
    const eventResult = createEventResult(
      event,
      result.success ? 'success' : (result.message.includes('not applicable') ? 'not_applicable' : 'error'),
      result.message,
      result.previousState,
      result.newState
    );
    
    setResults(prev => [eventResult, ...prev].slice(0, 20));
  }, [onTriggerEvent]);

  const clearResults = () => setResults([]);

  const isEventApplicable = (event: ResolvedEvent) => {
    return event.fromStates.includes(currentState);
  };

  if (collapsed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleCollapse}
        className="h-8 px-3 gap-2 bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
        data-testid="button-expand-event-console"
      >
        <Zap className="w-4 h-4" />
        Events
        <Badge variant="outline" className="ml-1 text-[10px] h-5 px-1.5 bg-cyan-900/30 text-cyan-400 border-cyan-500/30">
          {catalog.events.length}
        </Badge>
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-lg border border-purple-500/30 bg-black/60 backdrop-blur overflow-hidden"
      data-testid="panel-event-console"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple-900/30 bg-purple-900/20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Event Console</span>
          <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-cyan-900/30 text-cyan-400 border-cyan-500/30">
            {catalog.events.length} events
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          data-testid="button-collapse-event-console"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex">
        <div className="w-72 border-r border-purple-900/30">
          <div className="p-2 border-b border-purple-900/20">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 text-xs bg-black/50 border-gray-700"
                data-testid="input-event-search"
              />
            </div>
          </div>
          
          <ScrollArea className="h-48">
            <div className="p-1">
              {cartridges.map(cart => {
                const events = eventsByCartridge.get(cart.id) || [];
                if (events.length === 0) return null;
                
                const isExpanded = expandedCarts.has(cart.id);
                
                return (
                  <div key={cart.id} className="mb-1">
                    <button
                      onClick={() => toggleCart(cart.id)}
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 text-left"
                      data-testid={`button-toggle-cart-${cart.id}`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-gray-500" />
                      )}
                      <Package className="w-3 h-3 text-purple-400" />
                      <span className="text-xs font-medium text-gray-300 truncate flex-1">
                        {cart.label}
                      </span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1 bg-transparent text-gray-500 border-gray-700">
                        {events.length}
                      </Badge>
                    </button>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          {events.map(event => {
                            const applicable = isEventApplicable(event);
                            return (
                              <button
                                key={event.path}
                                onClick={() => handleTrigger(event)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 pl-6 rounded text-left group ${
                                  applicable 
                                    ? 'hover:bg-cyan-500/10' 
                                    : 'hover:bg-orange-500/10 opacity-60'
                                }`}
                                title={`Path: ${event.path}\nFrom: ${event.fromStates.join(', ')}\nTo: ${event.toState}`}
                                data-testid={`button-trigger-${event.eventId}`}
                              >
                                <Zap className={`w-3 h-3 flex-shrink-0 ${applicable ? 'text-cyan-400' : 'text-orange-400'}`} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-mono text-white truncate">
                                    {event.eventId}
                                  </div>
                                  <div className="text-[9px] font-mono text-gray-500 truncate">
                                    {event.path}
                                  </div>
                                </div>
                                <Send className="w-3 h-3 flex-shrink-0 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              
              {filteredEvents.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-500">
                  {searchQuery ? 'No events match your search' : 'No events available'}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-purple-900/20 bg-black/20">
            <span className="text-xs text-gray-400">
              Results {results.length > 0 && `(${results.length})`}
            </span>
            {results.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearResults}
                className="h-5 px-1.5 text-[10px] text-gray-500 hover:text-white"
                data-testid="button-clear-results"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
          
          <ScrollArea className="h-48">
            <div className="p-2 space-y-1.5">
              <AnimatePresence mode="popLayout">
                {results.map(result => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-2 rounded border text-xs ${
                      result.status === 'success' 
                        ? 'bg-green-900/20 border-green-500/30' 
                        : result.status === 'not_applicable'
                        ? 'bg-orange-900/20 border-orange-500/30'
                        : 'bg-red-900/20 border-red-500/30'
                    }`}
                    data-testid={`result-${result.id}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {result.status === 'success' ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : result.status === 'not_applicable' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className="font-mono text-white">{result.event.eventId}</span>
                      <span className="text-gray-500 text-[10px] ml-auto">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={`text-[11px] ${
                      result.status === 'success' ? 'text-green-300' :
                      result.status === 'not_applicable' ? 'text-orange-300' : 'text-red-300'
                    }`}>
                      {result.message}
                    </div>
                    {result.status === 'success' && result.previousState && result.newState && (
                      <div className="text-[10px] text-gray-400 mt-1">
                        {result.previousState} → {result.newState}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {results.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-500">
                  Trigger an event to see results
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
}
