import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { TossCartridge, TossDatabaseAsset } from '@/lib/toss';
import { createNewCartridge } from '@/lib/toss';
import { initSQLite, mountDatabase, unmountDatabase, getMountedDatabases, exportDatabase, getTables } from '@/lib/sqlite-service';

interface CartridgeContextType {
  cartridge: TossCartridge;
  setCartridge: React.Dispatch<React.SetStateAction<TossCartridge>>;
  databases: TossDatabaseAsset[];
  addDatabase: (db: TossDatabaseAsset) => Promise<boolean>;
  removeDatabase: (id: string) => void;
  updateDatabaseMetadata: (id: string, metadata: Partial<TossDatabaseAsset['metadata']>) => void;
  syncDatabaseToCartridge: (id: string) => void;
  mountedDatabases: string[];
}

const CartridgeContext = createContext<CartridgeContextType | null>(null);

const STORAGE_KEY = 'toss_cartridge_draft';

export function CartridgeProvider({ children }: { children: React.ReactNode }) {
  const [cartridge, setCartridge] = useState<TossCartridge>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.assets) parsed.assets = { models: [], databases: [] };
        if (!parsed.assets.databases) parsed.assets.databases = [];
        return parsed;
      }
    } catch (e) {
      console.error('Failed to load cartridge from storage:', e);
    }
    return createNewCartridge();
  });
  
  const [mountedDatabases, setMountedDatabases] = useState<string[]>([]);
  const [sqliteReady, setSqliteReady] = useState(false);
  const prevDbIdsRef = useRef<string[]>([]);

  const databases = cartridge.assets?.databases || [];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartridge));
    } catch (e) {
      console.error('Failed to save cartridge to storage:', e);
    }
  }, [cartridge]);

  useEffect(() => {
    initSQLite().then(() => setSqliteReady(true));
  }, []);

  useEffect(() => {
    if (!sqliteReady) return;

    const syncDatabases = async () => {
      const currentDbIds = databases.map(db => db.id);
      const prevDbIds = prevDbIdsRef.current;

      const toUnmount = prevDbIds.filter(id => !currentDbIds.includes(id));
      const toMount = databases.filter(db => !prevDbIds.includes(db.id));

      for (const id of toUnmount) {
        unmountDatabase(id);
      }
      for (const db of toMount) {
        await mountDatabase(db.id, db.data);
      }

      prevDbIdsRef.current = currentDbIds;
      setMountedDatabases(getMountedDatabases());
    };

    syncDatabases();
  }, [databases, sqliteReady]);

  const addDatabase = useCallback(async (db: TossDatabaseAsset): Promise<boolean> => {
    const mounted = await mountDatabase(db.id, db.data);
    if (!mounted) return false;
    
    setCartridge(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        models: prev.assets?.models || [],
        databases: [...(prev.assets?.databases || []), db],
      }
    }));
    
    setMountedDatabases(getMountedDatabases());
    return true;
  }, []);

  const removeDatabase = useCallback((id: string) => {
    unmountDatabase(id);
    
    setCartridge(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        models: prev.assets?.models || [],
        databases: (prev.assets?.databases || []).filter(db => db.id !== id),
      }
    }));
    
    setMountedDatabases(getMountedDatabases());
  }, []);

  const updateDatabaseMetadata = useCallback((id: string, metadata: Partial<TossDatabaseAsset['metadata']>) => {
    setCartridge(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        models: prev.assets?.models || [],
        databases: (prev.assets?.databases || []).map(db => 
          db.id === id ? { ...db, metadata: { ...db.metadata, ...metadata } } : db
        ),
      }
    }));
  }, []);

  const syncDatabaseToCartridge = useCallback((id: string) => {
    const exported = exportDatabase(id);
    if (typeof exported !== 'string') return;
    
    const tablesResult = getTables(id);
    const tablesList = Array.isArray(tablesResult) ? tablesResult : [];
    
    setCartridge(prev => ({
      ...prev,
      assets: {
        ...prev.assets,
        models: prev.assets?.models || [],
        databases: (prev.assets?.databases || []).map(db => 
          db.id === id ? { 
            ...db, 
            data: exported,
            metadata: {
              ...db.metadata,
              tableCount: tablesList.length,
              tables: tablesList,
              fileSize: Math.ceil(exported.length * 0.75),
            }
          } : db
        ),
      }
    }));
  }, []);

  return (
    <CartridgeContext.Provider value={{
      cartridge,
      setCartridge,
      databases,
      addDatabase,
      removeDatabase,
      updateDatabaseMetadata,
      syncDatabaseToCartridge,
      mountedDatabases,
    }}>
      {children}
    </CartridgeContext.Provider>
  );
}

export function useCartridge() {
  const context = useContext(CartridgeContext);
  if (!context) {
    throw new Error('useCartridge must be used within a CartridgeProvider');
  }
  return context;
}
