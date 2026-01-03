import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  CircleDot,
  Square,
  SquareStack,
  StopCircle,
  Zap,
  Box,
  Package,
  FileCode,
  Layers3,
  Pencil,
  Check,
  X,
  Lightbulb,
  Sun,
  Camera,
  Video,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TossFile, TossState, Toss3DAsset } from "@/lib/toss";

interface SceneTreeProps {
  file: TossFile;
  selectedStateId: string | null;
  selectedAssetId: string | null;
  onSelectState: (id: string) => void;
  onSelectAsset: (id: string) => void;
  onRenameState: (oldId: string, newId: string) => void;
  onRenameAsset: (id: string, newName: string) => void;
  onAddState: (type: "initial" | "state" | "compound" | "final") => void;
  onDeleteState?: (id: string) => void;
  onDeleteAsset?: (id: string) => void;
  onReorderStates?: (stateIds: string[]) => void;
  onReorderAssets?: (assetIds: string[]) => void;
}

type DragItemType = "state" | "asset" | "event";

interface DragState {
  type: DragItemType;
  id: string;
  sourceIndex: number;
}

type StateType = "initial" | "state" | "compound" | "final";

function getStateIcon(state: TossState, isInitial: boolean) {
  if (isInitial) {
    return <CircleDot className="w-4 h-4 text-green-400" />;
  }
  if (state.type === "compound") {
    return <SquareStack className="w-4 h-4 text-purple-400" />;
  }
  if (state.type === "final") {
    return <StopCircle className="w-4 h-4 text-red-400" />;
  }
  return <Square className="w-4 h-4 text-cyan-400" />;
}

function getAssetIcon(format: string) {
  switch (format.toLowerCase()) {
    case "gltf":
    case "glb":
      return <Package className="w-4 h-4 text-orange-400" />;
    case "obj":
      return <Layers3 className="w-4 h-4 text-blue-400" />;
    case "stl":
      return <Box className="w-4 h-4 text-pink-400" />;
    case "json":
      return <FileCode className="w-4 h-4 text-yellow-400" />;
    default:
      return <Box className="w-4 h-4 text-gray-400" />;
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
            ? "bg-cyan-500/20 text-cyan-100"
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

export function SceneTree({
  file,
  selectedStateId,
  selectedAssetId,
  onSelectState,
  onSelectAsset,
  onRenameState,
  onRenameAsset,
  onAddState,
  onDeleteState,
  onDeleteAsset,
  onReorderStates,
  onReorderAssets,
}: SceneTreeProps) {
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const states = Object.entries(file.logic.states);
  const assets: Toss3DAsset[] = file.assets?.models || [];
  const initialStateId = file.logic.initial;

  const handleStateRename = useCallback(
    (oldId: string, newName: string) => {
      onRenameState(oldId, newName);
      setEditingStateId(null);
    },
    [onRenameState]
  );

  const handleAssetRename = useCallback(
    (id: string, newName: string) => {
      onRenameAsset(id, newName);
      setEditingAssetId(null);
    },
    [onRenameAsset]
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

  const handleStateDrop = useCallback((targetIndex: number) => {
    if (!dragState || dragState.type !== "state") return;

    const stateIds = states.map(([id]) => id);
    const sourceIndex = dragState.sourceIndex;

    if (sourceIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newOrder = [...stateIds];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    onReorderStates?.(newOrder);
    handleDragEnd();
  }, [dragState, states, onReorderStates, handleDragEnd]);

  const handleAssetDrop = useCallback((targetIndex: number) => {
    if (!dragState || dragState.type !== "asset") return;

    const assetIds = assets.map((a) => a.id);
    const sourceIndex = dragState.sourceIndex;

    if (sourceIndex === targetIndex) {
      handleDragEnd();
      return;
    }

    const newOrder = [...assetIds];
    const [removed] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    onReorderAssets?.(newOrder);
    handleDragEnd();
  }, [dragState, assets, onReorderAssets, handleDragEnd]);

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <TreeNode
          icon={<SquareStack className="w-4 h-4 text-purple-400" />}
          label="States"
          expandable
          defaultExpanded
          badge={
            <span className="text-[10px] text-zinc-500 font-mono">
              {states.length}
            </span>
          }
        >
          {states.map(([id, state], index) => (
            <DraggableTreeNode
              key={id}
              icon={getStateIcon(state, id === initialStateId)}
              label={id}
              itemId={id}
              itemType="state"
              index={index}
              selected={selectedStateId === id}
              depth={1}
              isEditing={editingStateId === id}
              onSelect={() => onSelectState(id)}
              onStartEdit={() => setEditingStateId(id)}
              onRename={(newName) => handleStateRename(id, newName)}
              onCancelEdit={() => setEditingStateId(null)}
              onDelete={onDeleteState ? () => onDeleteState(id) : undefined}
              dragState={dragState}
              dropTargetIndex={dropTargetIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleStateDrop}
              badge={
                id === initialStateId ? (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 font-mono">
                    INITIAL
                  </span>
                ) : state.type === "final" ? (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">
                    FINAL
                  </span>
                ) : null
              }
            />
          ))}
        </TreeNode>

        <TreeNode
          icon={<Zap className="w-4 h-4 text-yellow-400" />}
          label="Events"
          expandable
          defaultExpanded
          badge={
            <span className="text-[10px] text-zinc-500 font-mono">
              {Object.values(file.logic.states).reduce(
                (acc, state) => acc + (state.transitions?.length || 0),
                0
              )}
            </span>
          }
        >
          {Object.entries(file.logic.states).map(([stateId, state]) =>
            (state.transitions || []).map((t, idx) => (
              <TreeNode
                key={`${stateId}-${idx}`}
                icon={<Zap className="w-3.5 h-3.5 text-yellow-500/70" />}
                label={t.event || "auto"}
                depth={1}
                badge={
                  <span className="text-[9px] text-zinc-500 font-mono">
                    → {t.target}
                  </span>
                }
              />
            ))
          )}
        </TreeNode>

        <TreeNode
          icon={<Package className="w-4 h-4 text-orange-400" />}
          label="3D Assets"
          expandable
          defaultExpanded
          badge={
            <span className="text-[10px] text-zinc-500 font-mono">
              {assets.length}
            </span>
          }
        >
          {assets.length === 0 ? (
            <div className="px-4 py-3 text-center text-zinc-500 text-[10px]">
              No 3D assets imported
            </div>
          ) : (
            assets.map((asset, index) => (
              <DraggableTreeNode
                key={asset.id}
                icon={getAssetIcon(asset.metadata.format)}
                label={asset.metadata.name}
                itemId={asset.id}
                itemType="asset"
                index={index}
                selected={selectedAssetId === asset.id}
                depth={1}
                isEditing={editingAssetId === asset.id}
                onSelect={() => onSelectAsset(asset.id)}
                onStartEdit={() => setEditingAssetId(asset.id)}
                onRename={(newName) => handleAssetRename(asset.id, newName)}
                onCancelEdit={() => setEditingAssetId(null)}
                onDelete={onDeleteAsset ? () => onDeleteAsset(asset.id) : undefined}
                dragState={dragState}
                dropTargetIndex={dropTargetIndex}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={handleAssetDrop}
                badge={
                  <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono uppercase">
                    {asset.metadata.format}
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
      </div>
    </ScrollArea>
  );
}
