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
  Cog,
  Droplets,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TossItem, Bounds } from "@/lib/toss-v1";

export interface SceneDecoration {
  id: string;
  label: string;
  type: 'gear' | 'water' | 'effect' | 'environment';
  visible?: boolean;
}

interface SceneTreeProps {
  items: TossItem[];
  selectedItemId: string | null;
  onSelectItem: (id: string) => void;
  onRenameItem?: (id: string, newLabel: string) => void;
  onDeleteItem?: (id: string) => void;
  onReorderItems?: (itemIds: string[]) => void;
  decorations?: SceneDecoration[];
  onToggleDecorationVisibility?: (id: string) => void;
  hiddenItemIds?: Set<string>;
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

function getComponentIcon(component: string, bounds?: Bounds) {
  switch (component) {
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

function getDecorationIcon(type: SceneDecoration['type']) {
  switch (type) {
    case 'gear':
      return <Cog className="w-4 h-4 text-amber-400" />;
    case 'water':
      return <Droplets className="w-4 h-4 text-blue-400" />;
    case 'effect':
      return <Sparkles className="w-4 h-4 text-purple-400" />;
    case 'environment':
      return <Sun className="w-4 h-4 text-orange-400" />;
    default:
      return <Box className="w-4 h-4 text-zinc-400" />;
  }
}

export function SceneTree({
  items = [],
  selectedItemId,
  onSelectItem,
  onRenameItem,
  onDeleteItem,
  onReorderItems,
  decorations = [],
  onToggleDecorationVisibility,
  hiddenItemIds = new Set(),
}: SceneTreeProps) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [hideInvisibleItems, setHideInvisibleItems] = useState(false);
  
  const visibleItems = hideInvisibleItems 
    ? items.filter(item => !hiddenItemIds.has(item.id))
    : items;

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
        {/* Filter checkbox */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-zinc-800/50 border border-zinc-700/50 mb-2">
          <Checkbox 
            id="hide-invisible"
            checked={hideInvisibleItems}
            onCheckedChange={(checked) => setHideInvisibleItems(checked === true)}
            className="h-3.5 w-3.5"
            data-testid="checkbox-hide-invisible"
          />
          <Label 
            htmlFor="hide-invisible" 
            className="text-[10px] text-zinc-400 cursor-pointer select-none"
          >
            Hide invisible items
          </Label>
          {hideInvisibleItems && hiddenItemIds.size > 0 && (
            <span className="text-[9px] text-amber-400 ml-auto">
              {hiddenItemIds.size} hidden
            </span>
          )}
        </div>

        <TreeNode
          icon={<Layers3 className="w-4 h-4 text-cyan-400" />}
          label="Scene Objects"
          expandable
          defaultExpanded
          badge={
            <span className="text-[10px] text-zinc-500 font-mono">
              {visibleItems.length}{hideInvisibleItems && items.length !== visibleItems.length ? `/${items.length}` : ''}
            </span>
          }
        >
          {visibleItems.length === 0 ? (
            <div className="px-4 py-3 text-center text-zinc-500 text-[10px]">
              {hideInvisibleItems && items.length > 0 ? 'All items hidden' : 'No objects in scene'}
            </div>
          ) : (
            visibleItems.map((item, index) => (
              <DraggableTreeNode
                key={item.id}
                icon={getComponentIcon(item.component, item.bounds)}
                label={item.label || item.id}
                itemId={item.id}
                itemType="item"
                index={index}
                selected={selectedItemId === item.id}
                depth={1}
                isEditing={editingItemId === item.id}
                onSelect={() => onSelectItem(item.id)}
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
                  <span 
                    className="text-[8px] px-1 py-0.5 rounded font-mono uppercase"
                    style={{
                      backgroundColor: `${item.material?.color || '#666'}20`,
                      color: item.material?.color || '#888',
                    }}
                  >
                    {item.bounds?.type || 'mesh'}
                  </span>
                }
              />
            ))
          )}
        </TreeNode>

        <TreeNode
          icon={<Lightbulb className="w-4 h-4 text-yellow-300" />}
          label="Lights"
          expandable
          defaultExpanded
          badge={
            <span className="text-[10px] text-zinc-500 font-mono">3</span>
          }
        >
          <TreeNode
            icon={<Sun className="w-3.5 h-3.5 text-amber-400" />}
            label="Ambient Light"
            depth={1}
            badge={
              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">
                0.1
              </span>
            }
          />
          <TreeNode
            icon={<Lightbulb className="w-3.5 h-3.5 text-purple-400" />}
            label="Point Light 1"
            depth={1}
            badge={
              <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono">
                KEY
              </span>
            }
          />
          <TreeNode
            icon={<Lightbulb className="w-3.5 h-3.5 text-pink-400" />}
            label="Point Light 2"
            depth={1}
            badge={
              <span className="text-[8px] px-1 py-0.5 rounded bg-pink-500/20 text-pink-400 font-mono">
                FILL
              </span>
            }
          />
        </TreeNode>

        <TreeNode
          icon={<Camera className="w-4 h-4 text-blue-400" />}
          label="Cameras"
          expandable
          defaultExpanded
          badge={
            <span className="text-[10px] text-zinc-500 font-mono">2</span>
          }
        >
          <TreeNode
            icon={<Video className="w-3.5 h-3.5 text-cyan-400" />}
            label="Main Camera"
            depth={1}
            badge={
              <span className="text-[8px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                ACTIVE
              </span>
            }
          />
          <TreeNode
            icon={<Camera className="w-3.5 h-3.5 text-gray-400" />}
            label="Ortho Camera"
            depth={1}
            badge={
              <span className="text-[8px] px-1 py-0.5 rounded bg-gray-500/20 text-gray-400 font-mono">
                ORTHO
              </span>
            }
          />
        </TreeNode>

        {decorations.length > 0 && (
          <TreeNode
            icon={<Cog className="w-4 h-4 text-amber-400" />}
            label="Decorations"
            expandable
            defaultExpanded
            badge={
              <span className="text-[10px] text-zinc-500 font-mono">{decorations.length}</span>
            }
          >
            {decorations.map((decoration) => (
              <TreeNode
                key={decoration.id}
                icon={getDecorationIcon(decoration.type)}
                label={decoration.label}
                depth={1}
                onClick={() => onToggleDecorationVisibility?.(decoration.id)}
                badge={
                  <span 
                    className={cn(
                      "text-[8px] px-1 py-0.5 rounded font-mono uppercase",
                      decoration.visible !== false 
                        ? "bg-green-500/20 text-green-400"
                        : "bg-zinc-500/20 text-zinc-400"
                    )}
                  >
                    {decoration.visible !== false ? 'ON' : 'OFF'}
                  </span>
                }
              />
            ))}
          </TreeNode>
        )}
      </div>
    </ScrollArea>
  );
}
