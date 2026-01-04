import type { TossFile } from "./toss";

export interface ResolvedEvent {
  cartridgeId: string;
  cartridgeLabel: string;
  statechartId: string;
  eventId: string;
  path: string;
  fromStates: string[];
  toState: string;
  description?: string;
}

export interface EventCatalog {
  events: ResolvedEvent[];
  byPath: Map<string, ResolvedEvent>;
  byCartridge: Map<string, ResolvedEvent[]>;
}

export function buildEventCatalog(cartridges: { id: string; label: string; toss: TossFile }[]): EventCatalog {
  const events: ResolvedEvent[] = [];
  const byPath = new Map<string, ResolvedEvent>();
  const byCartridge = new Map<string, ResolvedEvent[]>();

  for (const cart of cartridges) {
    const cartEvents: ResolvedEvent[] = [];
    const statechartId = "main";

    const states = cart.toss.logic?.states;
    if (states) {
      for (const [stateId, state] of Object.entries(states)) {
        if (state.transitions) {
          for (const transition of state.transitions) {
            const eventId = transition.event;
            const path = `${cart.id}.${statechartId}.${eventId}`;
            
            const existing = byPath.get(path);
            if (existing) {
              if (!existing.fromStates.includes(stateId)) {
                existing.fromStates.push(stateId);
              }
              continue;
            }

            const resolved: ResolvedEvent = {
              cartridgeId: cart.id,
              cartridgeLabel: cart.label,
              statechartId,
              eventId,
              path,
              fromStates: [stateId],
              toState: transition.target,
            };

            events.push(resolved);
            byPath.set(path, resolved);
            cartEvents.push(resolved);
          }
        }
      }
    }

    byCartridge.set(cart.id, cartEvents);
  }

  return { events, byPath, byCartridge };
}

export function searchEvents(catalog: EventCatalog, query: string): ResolvedEvent[] {
  if (!query.trim()) return catalog.events;
  
  const q = query.toLowerCase();
  return catalog.events.filter(e => 
    e.eventId.toLowerCase().includes(q) ||
    e.path.toLowerCase().includes(q) ||
    e.cartridgeLabel.toLowerCase().includes(q) ||
    e.fromStates.some(s => s.toLowerCase().includes(q)) ||
    e.toState.toLowerCase().includes(q)
  );
}

export interface EventResult {
  id: string;
  timestamp: number;
  event: ResolvedEvent;
  status: 'success' | 'not_applicable' | 'error';
  message: string;
  previousState?: string;
  newState?: string;
}

export function createEventResult(
  event: ResolvedEvent,
  status: EventResult['status'],
  message: string,
  previousState?: string,
  newState?: string
): EventResult {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    event,
    status,
    message,
    previousState,
    newState,
  };
}
