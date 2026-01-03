import { createContext, useContext, useState, useCallback, ReactNode, useRef, useEffect } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuShortcut,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { useInput } from "@/contexts/InputContext";

export interface ContextMenuItemSchema {
  id: string;
  type: 'item' | 'separator' | 'submenu' | 'checkbox' | 'radio-group' | 'label';
  label?: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  value?: string;
  items?: ContextMenuItemSchema[];
  onSelect?: () => void;
  onCheckedChange?: (checked: boolean) => void;
}

export interface ContextMenuSchema {
  id: string;
  items: ContextMenuItemSchema[];
}

interface ContextMenuManagerValue {
  registerMenu: (id: string, schema: ContextMenuSchema) => void;
  unregisterMenu: (id: string) => void;
  getMenu: (id: string) => ContextMenuSchema | undefined;
  rightClickToPan: boolean;
  contextMenuEnabled: boolean;
  contextMenuDelay: number;
}

const ContextMenuManagerContext = createContext<ContextMenuManagerValue | null>(null);

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menus, setMenus] = useState<Map<string, ContextMenuSchema>>(new Map());
  const { profile } = useInput();

  const registerMenu = useCallback((id: string, schema: ContextMenuSchema) => {
    setMenus(prev => {
      const next = new Map(prev);
      next.set(id, schema);
      return next;
    });
  }, []);

  const unregisterMenu = useCallback((id: string) => {
    setMenus(prev => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const getMenu = useCallback((id: string) => {
    return menus.get(id);
  }, [menus]);

  return (
    <ContextMenuManagerContext.Provider value={{
      registerMenu,
      unregisterMenu,
      getMenu,
      rightClickToPan: profile.settings.rightClickToPan,
      contextMenuEnabled: profile.settings.contextMenuEnabled,
      contextMenuDelay: profile.settings.contextMenuDelay
    }}>
      {children}
    </ContextMenuManagerContext.Provider>
  );
}

export function useContextMenuManager() {
  const context = useContext(ContextMenuManagerContext);
  if (!context) {
    throw new Error('useContextMenuManager must be used within ContextMenuProvider');
  }
  return context;
}

function renderMenuItem(item: ContextMenuItemSchema): ReactNode {
  switch (item.type) {
    case 'separator':
      return <ContextMenuSeparator key={item.id} />;
    
    case 'label':
      return <ContextMenuLabel key={item.id}>{item.label}</ContextMenuLabel>;
    
    case 'checkbox':
      return (
        <ContextMenuCheckboxItem
          key={item.id}
          checked={item.checked}
          onCheckedChange={item.onCheckedChange}
          disabled={item.disabled}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
        </ContextMenuCheckboxItem>
      );
    
    case 'radio-group':
      return (
        <ContextMenuRadioGroup key={item.id} value={item.value}>
          {item.items?.map(radioItem => (
            <ContextMenuRadioItem
              key={radioItem.id}
              value={radioItem.value || ''}
              disabled={radioItem.disabled}
              onSelect={radioItem.onSelect}
            >
              {radioItem.icon && <span className="mr-2">{radioItem.icon}</span>}
              {radioItem.label}
            </ContextMenuRadioItem>
          ))}
        </ContextMenuRadioGroup>
      );
    
    case 'submenu':
      return (
        <ContextMenuSub key={item.id}>
          <ContextMenuSubTrigger disabled={item.disabled}>
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {item.items?.map(renderMenuItem)}
          </ContextMenuSubContent>
        </ContextMenuSub>
      );
    
    case 'item':
    default:
      return (
        <ContextMenuItem
          key={item.id}
          disabled={item.disabled}
          onSelect={item.onSelect}
        >
          {item.icon && <span className="mr-2">{item.icon}</span>}
          {item.label}
          {item.shortcut && <ContextMenuShortcut>{item.shortcut}</ContextMenuShortcut>}
        </ContextMenuItem>
      );
  }
}

interface ManagedContextMenuProps {
  schema: ContextMenuSchema;
  children: ReactNode;
  onPan?: (e: React.MouseEvent) => void;
}

export function ManagedContextMenu({ schema, children, onPan }: ManagedContextMenuProps) {
  const { rightClickToPan, contextMenuEnabled, contextMenuDelay } = useContextMenuManager();
  const [showMenu, setShowMenu] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPanningRef = useRef(false);
  
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!contextMenuEnabled) {
      e.preventDefault();
      return;
    }
    
    if (rightClickToPan && !showMenu) {
      e.preventDefault();
      return;
    }
  }, [contextMenuEnabled, rightClickToPan, showMenu]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 2) return; // Only right click
    
    if (rightClickToPan && contextMenuEnabled) {
      isPanningRef.current = false;
      holdTimerRef.current = setTimeout(() => {
        setShowMenu(true);
      }, contextMenuDelay);
    }
    
    if (rightClickToPan && !contextMenuEnabled && onPan) {
      isPanningRef.current = true;
      onPan(e);
    }
  }, [rightClickToPan, contextMenuEnabled, contextMenuDelay, onPan]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 2) return;
    
    if (rightClickToPan && holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      isPanningRef.current = true;
      if (onPan) onPan(e);
    }
  }, [rightClickToPan, onPan]);
  
  const handleMouseUp = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isPanningRef.current = false;
  }, []);
  
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);
  
  if (!contextMenuEnabled && !rightClickToPan) {
    return <>{children}</>;
  }
  
  if (!contextMenuEnabled) {
    return (
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
      >
        {children}
      </div>
    );
  }

  return (
    <ContextMenu onOpenChange={setShowMenu}>
      <ContextMenuTrigger asChild>
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {schema.items.map(renderMenuItem)}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export const DEFAULT_EDITOR_MENU: ContextMenuSchema = {
  id: 'editor',
  items: [
    { id: 'cut', type: 'item', label: 'Cut', shortcut: 'Ctrl+X' },
    { id: 'copy', type: 'item', label: 'Copy', shortcut: 'Ctrl+C' },
    { id: 'paste', type: 'item', label: 'Paste', shortcut: 'Ctrl+V' },
    { id: 'sep1', type: 'separator' },
    { id: 'delete', type: 'item', label: 'Delete', shortcut: 'Del' },
    { id: 'duplicate', type: 'item', label: 'Duplicate', shortcut: 'Ctrl+D' },
    { id: 'sep2', type: 'separator' },
    {
      id: 'arrange',
      type: 'submenu',
      label: 'Arrange',
      items: [
        { id: 'bring-front', type: 'item', label: 'Bring to Front' },
        { id: 'bring-forward', type: 'item', label: 'Bring Forward' },
        { id: 'send-backward', type: 'item', label: 'Send Backward' },
        { id: 'send-back', type: 'item', label: 'Send to Back' },
      ]
    },
    {
      id: 'transform',
      type: 'submenu',
      label: 'Transform',
      items: [
        { id: 'rotate-cw', type: 'item', label: 'Rotate 90° CW' },
        { id: 'rotate-ccw', type: 'item', label: 'Rotate 90° CCW' },
        { id: 'flip-h', type: 'item', label: 'Flip Horizontal' },
        { id: 'flip-v', type: 'item', label: 'Flip Vertical' },
      ]
    },
    { id: 'sep3', type: 'separator' },
    { id: 'properties', type: 'item', label: 'Properties...' },
  ]
};

export const DEFAULT_CANVAS_MENU: ContextMenuSchema = {
  id: 'canvas',
  items: [
    { id: 'paste', type: 'item', label: 'Paste', shortcut: 'Ctrl+V' },
    { id: 'sep1', type: 'separator' },
    { id: 'select-all', type: 'item', label: 'Select All', shortcut: 'Ctrl+A' },
    { id: 'sep2', type: 'separator' },
    {
      id: 'add',
      type: 'submenu',
      label: 'Add',
      items: [
        { id: 'add-state', type: 'item', label: 'New State' },
        { id: 'add-transition', type: 'item', label: 'New Transition' },
        { id: 'add-note', type: 'item', label: 'Add Note' },
      ]
    },
    {
      id: 'view',
      type: 'submenu',
      label: 'View',
      items: [
        { id: 'zoom-in', type: 'item', label: 'Zoom In', shortcut: '=' },
        { id: 'zoom-out', type: 'item', label: 'Zoom Out', shortcut: '-' },
        { id: 'zoom-fit', type: 'item', label: 'Fit to View' },
        { id: 'zoom-100', type: 'item', label: 'Zoom to 100%' },
      ]
    },
    { id: 'sep3', type: 'separator' },
    { id: 'grid', type: 'checkbox', label: 'Show Grid', checked: true },
    { id: 'snap', type: 'checkbox', label: 'Snap to Grid', checked: true },
  ]
};
