import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Box,
  Package,
  Layers3,
  FileCode,
  Pencil,
  Check,
  X,
  Lightbulb,
  Sun,
  Camera,
  Video,
  GripVertical,
  Trash2,
  Circle,
  Hexagon,
  Cylinder,
  Triangle,
  Eye,
  EyeOff,
  FolderOpen,
  FolderClosed,
  Group,
  Ungroup,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TossItem, Bounds } from "@/lib/toss-v1";

// v1.1: Scene-level FSM info for display
export interface SceneFsmInfo {
  currentState: string;
  hasStates: boolean;
}

// v1.1: Mesh FSM indicator
export interface MeshFsmInfo {
  meshId: string;
  hasStatechart: boolean;
  currentState?: string;
}

interface SceneTreeProps {
  items: TossItem[];                           // v1.1: These are meshes
  selectedItemId: string | null;
  selectedItemIds?: Set<string>;               // Multi-select for grouping
  onSelectItem: (id: string) => void;
  onMultiSelectItem?: (id: string) => void;    // Ctrl+click for multi-select
  onRenameItem?: (id: string, newLabel: string) => void;
  onDeleteItem?: (id: string) => void;
  onReorderItems?: (itemIds: string[]) => void;
  onGroupItems?: (itemIds: string[]) => void;  // Group selected items
  onUngroupItem?: (groupId: string) => void;   // Ungroup a group
  hiddenItemIds?: Set<string>;
  // v1.1: FSM-related props
  sceneFsmInfo?: SceneFsmInfo;
  meshFsmInfos?: Map<string, MeshFsmInfo>;
  onEditSceneFsm?: () => void;
  onEditMeshFsm?: (meshId: string) => void;
  // Viewport culling
  visibleInViewportIds?: Set<string>;
  onHideOutsideViewChange?: (hide: boolean) => void;
  hideOutsideView?: boolean;
  // Generic object interaction
  onObjectClick?: (objectId: string, objectType: 'mesh' | 'light' | 'camera') => void;
}

// Build hierarchical tree from flat list using parent_id
interface TreeNode {
  item: TossItem;
  children: TreeNode[];
  depth: number;
}

function buildTree(items: TossItem[]): TreeNode[] {
  const itemMap = new Map<string, TossItem>();
  const childrenMap = new Map<string, TossItem[]>();
  
  // Index all items and their parent relationships
  for (const item of items) {
    itemMap.set(item.id, item);
    const parentId = item.parent_id || '__root__';
    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }
    childrenMap.get(parentId)!.push(item);
  }
  
  // Recursively build tree
  function buildNode(item: TossItem, depth: number): TreeNode {
    const children = (childrenMap.get(item.id) || []).map(child => buildNode(child, depth + 1));
    return { item, children, depth };
  }
  
  // Get root items (no parent_id)
  const rootItems = childrenMap.get('__root__') || [];
  return rootItems.map(item => buildNode(item, 0));
}

type DragItemType = "item" | "light" | "camera";

interface DragState {
  type: DragItemType;
  id: string;
  sourceIndex: number;
}

function getBoundsIcon(bounds?: Bounds) {
  if (!bounds) return <Box className="w-4 h-4 text-cyan-400" />;
  
  switch (bounds.type) {
    case "sphere":
      return <Circle className="w-4 h-4 text-pink-400" />;
    case "cylinder":
      return <Cylinder className="w-4 h-4 text-blue-400" />;
    case "cone":
      return <Triangle className="w-4 h-4 text-orange-400" />;
    case "torus":
      return <Circle className="w-4 h-4 text-purple-400" />;
    case "tetrahedron":
    case "octahedron":
    case "icosahedron":
    case "dodecahedron":
      return <Hexagon className="w-4 h-4 text-green-400" />;
    default:
      return <Box className="w-4 h-4 text-cyan-400" />;
  }
}

function getComponentIcon(component: string, bounds?: Bounds, isExpanded?: boolean) {
  switch (component) {
    case "group":
      return isExpanded 
        ? <FolderOpen className="w-4 h-4 text-amber-400" />
        : <FolderClosed className="w-4 h-4 text-amber-400" />;
    case "mesh_glyph":
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    case "imported_model":
      return <Package className="w-4 h-4 text-orange-400" />;
    case "light":
      return <Lightbulb className="w-4 h-4 text-amber-400" />;
    case "camera":
      return <Camera className="w-4 h-4 text-blue-400" />;
    default:
      return getBoundsIcon(bounds);
  }
}

interface DraggableTreeNodeProps {
  icon: React.ReactNode;
  label: string;
  itemId: string;
  itemType: DragItemType;
  index: number;
  selected?: boolean;
  depth?: number;
  isEditing?: boolean;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onRename?: (newName: string) => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  draggable?: boolean;
  dragState: DragState | null;
  dropTargetIndex: number | null;
  onDragStart: (type: DragItemType, id: string, index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  onDrop: (targetIndex: number) => void;
}

function DraggableTreeNode({
  icon,
  label,
  itemId,
  itemType,
  index,
  selected,
  depth = 0,
  isEditing,
  onSelect,
  onStartEdit,
  onRename,
  onCancelEdit,
  onDelete,
  children,
  expandable,
  defaultExpanded = true,
  badge,
  draggable = true,
  dragState,
  dropTargetIndex,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
}: DraggableTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editValue, setEditValue] = useState(label);
  const nodeRef = useRef<HTMLDivElement>(null);

  const isDragging = dragState?.type === itemType && dragState?.id === itemId;
  const isDropTarget = dragState?.type === itemType && dropTargetIndex === index && dragState?.id !== itemId;
  const showDropIndicatorAbove = isDropTarget && dragState && dragState.sourceIndex > index;
  const showDropIndicatorBelow = isDropTarget && dragState && dragState.sourceIndex < index;

  const handleSubmit = () => {
    if (editValue.trim() && editValue !== label) {
      onRename?.(editValue.trim());
    } else {
      onCancelEdit?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key === "Escape") {
      setEditValue(label);
      onCancelEdit?.();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    onDragStart(itemType, itemId, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!dragState || dragState.type !== itemType) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    onDragOver(index);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragState || dragState.type !== itemType) return;
    onDrop(index);
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  return (
    <div>
      {showDropIndicatorAbove && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          className="h-0.5 mx-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          style={{ marginLeft: `${depth * 12 + 8}px` }}
        />
      )}

      <div
        ref={nodeRef}
        draggable={draggable && !isEditing}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-all",
          selected
            ? "bg-cyan-500/20 text-cyan-100 ring-1 ring-cyan-500/50"
            : "hover:bg-white/5 text-zinc-300",
          isDragging && "opacity-50 bg-cyan-500/10 border border-dashed border-cyan-500/50",
          isDropTarget && "ring-1 ring-cyan-500/50"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (!isEditing) {
            onSelect?.();
          }
        }}
        onDoubleClick={() => {
          if (!isEditing && onStartEdit) {
            onStartEdit();
          }
        }}
        data-testid={`tree-node-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {draggable && (
          <GripVertical className="w-3 h-3 text-zinc-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity" />
        )}

        {expandable ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {icon}

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSubmit}
              autoFocus
              className="h-5 text-xs bg-black/50 border-cyan-500/50 px-1.5"
              onClick={(e) => e.stopPropagation()}
              data-testid="input-rename"
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 hover:bg-green-500/20 hover:text-green-400"
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              data-testid="button-confirm-rename"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 hover:bg-red-500/20 hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                setEditValue(label);
                onCancelEdit?.();
              }}
              data-testid="button-cancel-rename"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1 text-xs font-mono truncate">{label}</span>
            {badge}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onStartEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 hover:bg-cyan-500/20 hover:text-cyan-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartEdit();
                  }}
                  data-testid="button-edit"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 hover:bg-red-500/20 hover:text-red-400"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  data-testid="button-delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {showDropIndicatorBelow && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          className="h-0.5 mx-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          style={{ marginLeft: `${depth * 12 + 8}px` }}
        />
      )}

      <AnimatePresence>
        {expandable && expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TreeNodeProps {
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
  depth?: number;
  children?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  onClick?: () => void;
}

function TreeNode({
  icon,
  label,
  selected,
  depth = 0,
  children,
  expandable,
  defaultExpanded = true,
  badge,
  onClick,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer transition-colors",
          selected
            ? "bg-cyan-500/20 text-cyan-100"
            : "hover:bg-white/5 text-zinc-300"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={onClick}
        data-testid={`tree-node-${label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        {expandable ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {icon}
        <span className="flex-1 text-xs font-mono truncate">{label}</span>
        {badge}
      </div>

      <AnimatePresence>
        {expandable && expanded && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// v1.1: FSM indicator component
function FsmBadge({ hasFsm, currentState, onClick, meshId }: { hasFsm: boolean; currentState?: string; onClick?: () => void; meshId?: string }) {
  const testIdSuffix = meshId ? `-${meshId}` : '-scene';
  if (!hasFsm) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        className="text-[8px] px-1 py-0.5 rounded bg-zinc-700/50 text-zinc-500 font-mono hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors"
        title="Add FSM"
        data-testid={`button-add-fsm${testIdSuffix}`}
      >
        +FSM
      </button>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className="text-[8px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-mono hover:bg-green-500/30 transition-colors"
      title="Edit FSM"
      data-testid={`button-edit-fsm${testIdSuffix}`}
    >
      {currentState || 'FSM'}
    </button>
  );
}

export function SceneTree({
  items = [],
  selectedItemId,
  selectedItemIds = new Set(),
  onSelectItem,
  onMultiSelectItem,
  onRenameItem,
  onDeleteItem,
  onReorderItems,
  onGroupItems,
  onUngroupItem,
  hiddenItemIds = new Set(),
  sceneFsmInfo,
  meshFsmInfos,
  onEditSceneFsm,
  onEditMeshFsm,
  visibleInViewportIds,
  onHideOutsideViewChange,
  hideOutsideView = false,
  onObjectClick,
}: SceneTreeProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [hideInvisibleItems, setHideInvisibleItems] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Filter items based on visibility settings
  const visibleItems = items.filter(item => {
    // Filter out manually hidden items if setting is enabled
    if (hideInvisibleItems && hiddenItemIds.has(item.id)) return false;
    // Filter out items outside viewport if setting is enabled
    // Only apply filter when both hideOutsideView is true AND visibleInViewportIds is provided
    if (hideOutsideView && visibleInViewportIds && visibleInViewportIds.size > 0 && !visibleInViewportIds.has(item.id)) return false;
    return true;
  });
  
  // Build hierarchical tree from parent_id relationships
  const treeNodes = buildTree(visibleItems);
  
  // Toggle group expansion
  const toggleGroupExpansion = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);
  
  // Handle grouping selected items
  const handleGroupSelected = useCallback(() => {
    if (selectedItemIds.size >= 2 && onGroupItems) {
      onGroupItems(Array.from(selectedItemIds));
    }
  }, [selectedItemIds, onGroupItems]);
  
  // Check if selected item is a group for ungroup button
  const selectedIsGroup = selectedItemId 
    ? items.find(i => i.id === selectedItemId)?.component === 'group'
    : false;

  const handleItemRename = useCallback(
    (id: string, newName: string) => {
      onRenameItem?.(id, newName);
      setEditingItemId(null);
    },
    [onRenameItem]
  );

  const handleDragStart = useCallback((type: DragItemType, id: string, index: number) => {
    setDragState({ type, id, sourceIndex: index });
  }, []);

  const handleDragOver = useCallback((index: number) => {
    setDropTargetIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState(null);
    setDropTargetIndex(null);
  }, []);

  const handleItemDrop = useCallback((targetIndex: number) => {
    if (!dragState || dragState.type !== "item") return;

    const itemIds = items.map((item) => item.id);
    const sourceIndex = dragState.sourceIndex;

    if (sourceIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newOrder = [...itemIds];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    onReorderItems?.(newOrder);
    handleDragEnd();
  }, [dragState, items, onReorderItems, handleDragEnd]);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {/* Filter controls */}
        <div className="space-y-1 mb-2">
          {/* Hide outside view toggle - prominent at top */}
          <button
            onClick={() => onHideOutsideViewChange?.(!hideOutsideView)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded border transition-colors",
              hideOutsideView 
                ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400" 
                : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50"
            )}
            data-testid="button-hide-outside-view"
          >
            {hideOutsideView ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            <span className="text-[10px] font-medium select-none">
              {hideOutsideView ? 'Showing only visible' : 'Hide outside view'}
            </span>
            {hideOutsideView && visibleInViewportIds && (
              <span className="text-[9px] ml-auto opacity-70">
                {visibleInViewportIds.size}/{items.length}
              </span>
            )}
          </button>

          {/* Hide invisible items checkbox */}
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-800/30 border border-zinc-700/30">
            <Checkbox 
              id="hide-invisible"
              checked={hideInvisibleItems}
              onCheckedChange={(checked) => setHideInvisibleItems(checked === true)}
              className="h-3 w-3"
              data-testid="checkbox-hide-invisible"
            />
            <Label 
              htmlFor="hide-invisible" 
              className="text-[9px] text-zinc-500 cursor-pointer select-none"
            >
              Hide manually hidden
            </Label>
            {hideInvisibleItems && hiddenItemIds.size > 0 && (
              <span className="text-[8px] text-amber-400 ml-auto">
                {hiddenItemIds.size}
              </span>
            )}
          </div>
          
          {/* Group/Ungroup buttons */}
          {(onGroupItems || onUngroupItem) && (
            <div className="flex gap-1">
              {onGroupItems && (
                <Button
                  size="sm"
                  variant="outline"
                  className={cn(
                    "flex-1 h-7 text-[9px] gap-1",
                    selectedItemIds.size >= 2
                      ? "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                      : "border-zinc-700 text-zinc-500 opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleGroupSelected}
                  disabled={selectedItemIds.size < 2}
                  data-testid="button-group-items"
                >
                  <Group className="w-3 h-3" />
                  Group
                </Button>
              )}
              {onUngroupItem && selectedIsGroup && selectedItemId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-7 text-[9px] gap-1 border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => onUngroupItem(selectedItemId)}
                  data-testid="button-ungroup-items"
                >
                  <Ungroup className="w-3 h-3" />
                  Ungroup
                </Button>
              )}
            </div>
          )}
        </div>

        {/* v1.1: Scene FSM at the root level */}
        <TreeNode
          icon={<FileCode className="w-4 h-4 text-purple-400" />}
          label="Scene"
          expandable
          defaultExpanded
          onClick={onEditSceneFsm}
          badge={
            sceneFsmInfo ? (
              <FsmBadge 
                hasFsm={sceneFsmInfo.hasStates} 
                currentState={sceneFsmInfo.currentState} 
                onClick={onEditSceneFsm}
              />
            ) : undefined
          }
        >
          {/* Meshes (formerly "Scene Objects") */}
          <TreeNode
            icon={<Layers3 className="w-4 h-4 text-cyan-400" />}
            label="Meshes"
            expandable
            defaultExpanded
            depth={1}
            badge={
              <span className="text-[10px] text-zinc-500 font-mono">
                {visibleItems.length}{hideInvisibleItems && items.length !== visibleItems.length ? `/${items.length}` : ''}
              </span>
            }
          >
          {treeNodes.length === 0 ? (
            <div className="px-4 py-3 text-center text-zinc-500 text-[10px]">
              {hideInvisibleItems && items.length > 0 ? 'All items hidden' : 'No objects in scene'}
            </div>
          ) : (
            treeNodes.map((node, index) => {
              const renderNode = (node: TreeNode, nodeIndex: number, baseDepth: number): React.ReactNode => {
                const { item, children, depth } = node;
                const isGroup = item.component === 'group';
                const isExpanded = expandedGroups.has(item.id);
                const isMultiSelected = selectedItemIds.has(item.id);
                
                return (
                  <div key={item.id}>
                    <DraggableTreeNode
                      icon={getComponentIcon(item.component, item.bounds, isExpanded)}
                      label={item.label || item.id}
                      itemId={item.id}
                      itemType="item"
                      index={nodeIndex}
                      selected={selectedItemId === item.id || isMultiSelected}
                      depth={baseDepth + depth}
                      isEditing={editingItemId === item.id}
                      expandable={isGroup && children.length > 0}
                      defaultExpanded={isExpanded}
                      onSelect={() => {
                        onSelectItem(item.id);
                        onObjectClick?.(item.id, 'mesh');
                        if (isGroup) toggleGroupExpansion(item.id);
                      }}
                      onStartEdit={onRenameItem ? () => setEditingItemId(item.id) : undefined}
                      onRename={(newName) => handleItemRename(item.id, newName)}
                      onCancelEdit={() => setEditingItemId(null)}
                      onDelete={onDeleteItem ? () => onDeleteItem(item.id) : undefined}
                      dragState={dragState}
                      dropTargetIndex={dropTargetIndex}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={handleItemDrop}
                      badge={
                        <div className="flex items-center gap-1">
                          {isGroup ? (
                            <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                              {children.length}
                            </span>
                          ) : (
                            <span 
                              className="text-[8px] px-1 py-0.5 rounded font-mono uppercase"
                              style={{
                                backgroundColor: `${item.material?.color || '#666'}20`,
                                color: item.material?.color || '#888',
                              }}
                            >
                              {item.bounds?.type || 'mesh'}
                            </span>
                          )}
                          <FsmBadge 
                            hasFsm={meshFsmInfos?.get(item.id)?.hasStatechart ?? false}
                            currentState={meshFsmInfos?.get(item.id)?.currentState}
                            onClick={() => onEditMeshFsm?.(item.id)}
                            meshId={item.id}
                          />
                        </div>
                      }
                    >
                      {isGroup && isExpanded && children.length > 0 && (
                        <div className="ml-2 border-l border-white/10 pl-1">
                          {children.map((child, childIndex) => renderNode(child, childIndex, baseDepth))}
                        </div>
                      )}
                    </DraggableTreeNode>
                  </div>
                );
              };
              return renderNode(node, index, 2);
            })
          )}
          </TreeNode>

          {/* Lights nested under Scene */}
          <TreeNode
            icon={<Lightbulb className="w-4 h-4 text-yellow-300" />}
            label="Lights"
            expandable
            defaultExpanded
            depth={1}
            badge={
              <span className="text-[10px] text-zinc-500 font-mono">3</span>
            }
          >
            <TreeNode
              icon={<Sun className="w-3.5 h-3.5 text-amber-400" />}
              label="Ambient Light"
              depth={2}
              onClick={() => onObjectClick?.('ambient-light', 'light')}
              badge={
                <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                  0.1
                </span>
              }
            />
            <TreeNode
              icon={<Lightbulb className="w-3.5 h-3.5 text-purple-400" />}
              label="Point Light 1"
              depth={2}
              onClick={() => onObjectClick?.('point-light-1', 'light')}
              badge={
                <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                  KEY
                </span>
              }
            />
            <TreeNode
              icon={<Lightbulb className="w-3.5 h-3.5 text-pink-400" />}
              label="Point Light 2"
              depth={2}
              onClick={() => onObjectClick?.('point-light-2', 'light')}
              badge={
                <span className="text-[8px] px-1 py-0.5 rounded bg-pink-500/20 text-pink-400 font-mono">
                  FILL
                </span>
              }
            />
          </TreeNode>

          {/* Cameras nested under Scene */}
          <TreeNode
            icon={<Camera className="w-4 h-4 text-blue-400" />}
            label="Cameras"
            expandable
            defaultExpanded
            depth={1}
            badge={
              <span className="text-[10px] text-zinc-500 font-mono">2</span>
            }
          >
            <TreeNode
              icon={<Video className="w-3.5 h-3.5 text-cyan-400" />}
              label="Main Camera"
              depth={2}
              onClick={() => onObjectClick?.('main-camera', 'camera')}
              badge={
                <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                  ACTIVE
                </span>
              }
            />
            <TreeNode
              icon={<Camera className="w-3.5 h-3.5 text-gray-400" />}
              label="Ortho Camera"
              depth={2}
              onClick={() => onObjectClick?.('ortho-camera', 'camera')}
              badge={
                <span className="text-[8px] px-1 py-0.5 rounded bg-gray-500/20 text-gray-400 font-mono">
                  ORTHO
                </span>
              }
            />
          </TreeNode>
        </TreeNode>
      </div>
    </ScrollArea>
  );
}
