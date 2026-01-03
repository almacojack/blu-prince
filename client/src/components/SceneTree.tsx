import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  Circle,
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
  Plus,
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

interface TreeNodeProps {
  icon: React.ReactNode;
  label: string;
  selected?: boolean;
  depth?: number;
  isEditing?: boolean;
  onSelect?: () => void;
  onStartEdit?: () => void;
  onRename?: (newName: string) => void;
  onCancelEdit?: () => void;
  children?: React.ReactNode;
  expandable?: boolean;
  defaultExpanded?: boolean;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

function TreeNode({
  icon,
  label,
  selected,
  depth = 0,
  isEditing,
  onSelect,
  onStartEdit,
  onRename,
  onCancelEdit,
  children,
  expandable,
  defaultExpanded = true,
  badge,
  actions,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editValue, setEditValue] = useState(label);

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
              {actions}
            </div>
          </>
        )}
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
}: SceneTreeProps) {
  const [editingStateId, setEditingStateId] = useState<string | null>(null);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);

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
          {states.map(([id, state]) => (
            <TreeNode
              key={id}
              icon={getStateIcon(state, id === initialStateId)}
              label={id}
              selected={selectedStateId === id}
              depth={1}
              isEditing={editingStateId === id}
              onSelect={() => onSelectState(id)}
              onStartEdit={() => setEditingStateId(id)}
              onRename={(newName) => handleStateRename(id, newName)}
              onCancelEdit={() => setEditingStateId(null)}
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
            assets.map((asset) => (
              <TreeNode
                key={asset.id}
                icon={getAssetIcon(asset.metadata.format)}
                label={asset.metadata.name}
                selected={selectedAssetId === asset.id}
                depth={1}
                isEditing={editingAssetId === asset.id}
                onSelect={() => onSelectAsset(asset.id)}
                onStartEdit={() => setEditingAssetId(asset.id)}
                onRename={(newName) => handleAssetRename(asset.id, newName)}
                onCancelEdit={() => setEditingAssetId(null)}
                badge={
                  <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono uppercase">
                    {asset.metadata.format}
                  </span>
                }
              />
            ))
          )}
        </TreeNode>
      </div>
    </ScrollArea>
  );
}
