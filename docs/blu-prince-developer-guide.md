# Blu-Prince Developer Guide

A practical guide for developers extending the Blu-Prince FSM design tool and TingOS platform.

## Project Structure Overview

```
client/src/
├── components/          # Reusable UI components
│   ├── SceneTree.tsx   # Outliner panel with mesh/light/camera hierarchy
│   ├── DockablePanel.tsx # Collapsible panel system
│   └── ui/             # shadcn/ui primitives
├── lib/
│   ├── toss-v1.ts      # TOSS schema definitions (THE source of truth)
│   ├── command-router.ts # Multi-cart PATH resolution
│   ├── cartridge.ts    # Cartridge utilities
│   └── utils.ts        # General utilities
├── pages/
│   ├── editor.tsx      # Main Blu-Prince editor (3000+ lines)
│   └── runtime.tsx     # Cartridge runtime simulator
└── hooks/              # Custom React hooks

server/
├── routes.ts           # API endpoints
├── storage.ts          # Database operations (IStorage interface)
└── index.ts            # Express server entry

shared/
└── schema.ts           # Drizzle ORM schema + Zod validation
```

## Key Data Flow

```
User Action → Component → State Update → 3D Canvas Re-render
                           ↓
                    Storage (if persisting)
                           ↓
                    API → Database
```

## Common Development Scenarios

### 1. Adding a New Mesh Property

**Scenario:** Add a "glow intensity" property to meshes.

**Step 1: Update TOSS Schema** (`client/src/lib/toss-v1.ts`)
```typescript
export interface MaterialProps {
  color: string;
  // ... existing props
  glowIntensity?: number;  // NEW: 0-1 range
}
```

**Step 2: Update Editor UI** (`client/src/pages/editor.tsx`)
Find the property panel section and add a slider:
```typescript
<Slider
  value={[selectedItem.material?.glowIntensity ?? 0]}
  onValueChange={([v]) => updateMeshProperty('glowIntensity', v)}
  max={1}
  step={0.1}
/>
```

**Step 3: Update 3D Rendering** (in PhysicsThing component)
```typescript
<meshStandardMaterial 
  emissive={item.material?.color}
  emissiveIntensity={item.material?.glowIntensity ?? 0}
/>
```

### 2. Adding FSM to a Mesh

**Scenario:** Allow meshes to have their own state machines.

**Where to look:**
- `SceneTree.tsx` - FSM badges on mesh items (FsmBadge component)
- `editor.tsx` - `onEditMeshFsm` callback for opening FSM editor
- `toss-v1.ts` - `TossMesh.statechartId` links mesh to a statechart

**Pattern:**
```typescript
// In SceneTree, each mesh shows FSM status
<FsmBadge 
  hasFsm={meshFsmInfos?.get(item.id)?.hasStatechart ?? false}
  currentState={meshFsmInfos?.get(item.id)?.currentState}
  onClick={() => onEditMeshFsm?.(item.id)}
  meshId={item.id}
/>
```

### 3. Adding Scene Tree Filters

**Scenario:** Hide meshes that aren't visible in the viewport.

**Implementation pattern from our session:**

1. Add state in editor.tsx:
```typescript
const [hideOutsideView, setHideOutsideView] = useState(false);
const [visibleInViewportIds, setVisibleInViewportIds] = useState<Set<string>>(new Set());
```

2. Add props to SceneTree:
```typescript
interface SceneTreeProps {
  // ... existing
  hideOutsideView?: boolean;
  visibleInViewportIds?: Set<string>;
  onHideOutsideViewChange?: (hide: boolean) => void;
}
```

3. Filter in component:
```typescript
const visibleItems = items.filter(item => {
  if (hideInvisibleItems && hiddenItemIds.has(item.id)) return false;
  if (hideOutsideView && visibleInViewportIds?.size > 0 && !visibleInViewportIds.has(item.id)) return false;
  return true;
});
```

### 4. Adding Generic Object Interaction

**Scenario:** Fire a callback when any scene object is clicked.

**Pattern:**
```typescript
// Props
onObjectClick?: (objectId: string, objectType: 'mesh' | 'light' | 'camera') => void;

// Usage in mesh items
onSelect={() => {
  onSelectItem(item.id);
  onObjectClick?.(item.id, 'mesh');
}}

// Usage in light/camera TreeNodes
<TreeNode onClick={() => onObjectClick?.('ambient-light', 'light')} />
```

### 5. Working with Cartridge Commands

**Scenario:** Add a new command to a cartridge.

**In toss-v1.ts, commands are defined:**
```typescript
export interface CommandDefinition {
  name: string;
  description: string;
  args?: CommandArg[];
  permissions?: CommandPermission[];
  handler?: string;  // References a registered handler
}
```

**In command-router.ts, commands are resolved:**
```typescript
// Mount a cartridge with commands
router.mount(cartridge, 'my-cart', { asBoot: true });

// Execute a command
const result = await router.execute('my-command --flag', context);
```

## Safety Patterns

### Handling Undefined Arrays

**Problem:** `cartridge.items` can be undefined, causing runtime crashes.

**Bad:**
```typescript
cartridge.items.map(...)  // Crashes if undefined
```

**Good:**
```typescript
(cartridge.items || []).map(...)  // Safe
```

**Best (using utility):**
```typescript
import { safeArray } from '@/lib/utils';
safeArray(cartridge.items).map(...)
```

### State Updates with Safety

**Pattern for updating nested state:**
```typescript
setCartridge(prev => ({
  ...prev,
  items: safeArray(prev.items).map(item => 
    item.id === targetId ? { ...item, ...updates } : item
  )
}));
```

## Component Patterns

### DockablePanel Usage
```typescript
<DockablePanel
  id="unique-id"
  title="Panel Title"
  icon={<Icon className="w-4 h-4" />}
  defaultDocked={true}
  defaultCollapsed={false}
>
  {/* Panel content */}
</DockablePanel>
```

### TreeNode with Badges
```typescript
<TreeNode
  icon={<Box className="w-4 h-4" />}
  label="Item Name"
  depth={1}
  selected={isSelected}
  onClick={handleClick}
  badge={<Badge>INFO</Badge>}
/>
```

## Testing Requirements

All interactive elements need `data-testid`:
```typescript
// Interactive elements: {action}-{target}
<Button data-testid="button-submit" />
<Input data-testid="input-email" />

// Display elements: {type}-{content}
<span data-testid="text-username">{username}</span>

// Dynamic elements: {type}-{description}-{id}
<Card data-testid={`card-product-${productId}`} />
```

## Boot Cartridge Rules

Only one cartridge can be the boot cartridge at a time:

1. When mounting with `asBoot: true`, check for existing boot cart
2. Show confirmation if changing boot cart: "Would you like to change the boot cartridge to {new cart}?"
3. Previous boot cart is demoted to regular mounted state

```typescript
// In CommandRouter
mount(cartridge, id, { asBoot: true })
// If another cart is already boot, triggers confirmation flow
```

## Known Issues & Workarounds

### 1. Vite HMR WebSocket Errors
These are Replit environment issues, not code bugs. They don't affect functionality.

### 2. LSP "possibly undefined" Warnings
Use the `safeArray()` utility or `|| []` guards for array access.

### 3. 3D Context Lost
WebGL context can be lost on low-memory devices. The Canvas component should handle this gracefully.

## Performance Tips

1. **Memoize expensive computations** with useMemo
2. **Use useCallback** for handlers passed as props
3. **Batch state updates** when possible
4. **Lazy load 3D assets** with Suspense

## Terminology

| UI Term | Code Term | Description |
|---------|-----------|-------------|
| Meshes | items/meshes | 3D objects in scene |
| Outliner | SceneTree | Hierarchy panel |
| Cartridge | TossCartridge | TOSS file container |
| FSM | statechart | Finite State Machine |

## Getting Help

- Check `replit.md` for project-specific notes
- Search codebase for similar patterns
- Look at existing components for conventions
