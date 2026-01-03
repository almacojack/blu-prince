/**
 * SQLite Service for TOSS Cartridges
 * Uses sql.js (WASM port of SQLite) for browser-based execution
 * Supports offline mode via IndexedDB caching
 */

import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

// Global SQL.js instance
let SQL: SqlJsStatic | null = null;

// In-memory database instances keyed by asset ID
const databases = new Map<string, Database>();

// IndexedDB for offline persistence
const DB_STORE_NAME = 'toss_sqlite_cache';
const DB_NAME = 'toss_sqlite_db';

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  notnull: boolean;
  pk: boolean;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTime: number;
  mutated: boolean;
}

export interface SQLiteError {
  message: string;
  code?: string;
}

/**
 * Initialize sql.js WASM module
 */
export async function initSQLite(): Promise<boolean> {
  if (SQL) return true;
  
  try {
    SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`
    });
    return true;
  } catch (error) {
    console.error('Failed to initialize sql.js:', error);
    return false;
  }
}

/**
 * Check if SQL.js is initialized
 */
export function isSQLiteReady(): boolean {
  return SQL !== null;
}

/**
 * Open IndexedDB for caching
 */
async function openCacheDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Cache database to IndexedDB for offline access
 */
export async function cacheDatabase(id: string, data: Uint8Array): Promise<void> {
  try {
    const db = await openCacheDB();
    const tx = db.transaction(DB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DB_STORE_NAME);
    store.put({ id, data: Array.from(data), cachedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to cache database:', error);
  }
}

/**
 * Load cached database from IndexedDB
 */
export async function loadCachedDatabase(id: string): Promise<Uint8Array | null> {
  try {
    const db = await openCacheDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE_NAME, 'readonly');
      const store = tx.objectStore(DB_STORE_NAME);
      const request = store.get(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? new Uint8Array(result.data) : null);
      };
    });
  } catch (error) {
    console.error('Failed to load cached database:', error);
    return null;
  }
}

/**
 * Mount a SQLite database from base64 data
 */
export async function mountDatabase(id: string, base64Data: string): Promise<boolean> {
  if (!SQL) {
    const initialized = await initSQLite();
    if (!initialized) return false;
  }
  
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create database from binary
    const db = new SQL!.Database(bytes);
    databases.set(id, db);
    
    // Cache for offline access
    await cacheDatabase(id, bytes);
    
    return true;
  } catch (error) {
    console.error('Failed to mount database:', error);
    return false;
  }
}

/**
 * Create a new empty database
 */
export async function createDatabase(id: string): Promise<boolean> {
  if (!SQL) {
    const initialized = await initSQLite();
    if (!initialized) return false;
  }
  
  try {
    const db = new SQL!.Database();
    databases.set(id, db);
    return true;
  } catch (error) {
    console.error('Failed to create database:', error);
    return false;
  }
}

/**
 * Unmount and close a database
 */
export function unmountDatabase(id: string): void {
  const db = databases.get(id);
  if (db) {
    db.close();
    databases.delete(id);
  }
}

/**
 * Get mounted database instance
 */
export function getDatabase(id: string): Database | undefined {
  return databases.get(id);
}

/**
 * Execute a SQL query
 */
export function executeQuery(id: string, sql: string, params?: any[]): QueryResult | SQLiteError {
  const db = databases.get(id);
  if (!db) {
    return { message: `Database ${id} not mounted`, code: 'NOT_MOUNTED' };
  }
  
  const startTime = performance.now();
  
  try {
    const rowsBefore = db.getRowsModified();
    const results = db.exec(sql, params);
    const rowsAfter = db.getRowsModified();
    const endTime = performance.now();
    
    const mutated = rowsAfter > rowsBefore;
    
    if (results.length === 0) {
      return {
        columns: [],
        values: [],
        rowCount: 0,
        executionTime: endTime - startTime,
        mutated
      };
    }
    
    const result = results[0];
    return {
      columns: result.columns,
      values: result.values,
      rowCount: result.values.length,
      executionTime: endTime - startTime,
      mutated
    };
  } catch (error: any) {
    return { message: error.message || String(error), code: 'QUERY_ERROR' };
  }
}

/**
 * Run a statement (INSERT, UPDATE, DELETE, CREATE, etc.)
 */
export function runStatement(id: string, sql: string, params?: any[]): { changes: number; lastInsertRowId: number } | SQLiteError {
  const db = databases.get(id);
  if (!db) {
    return { message: `Database ${id} not mounted`, code: 'NOT_MOUNTED' };
  }
  
  try {
    db.run(sql, params);
    return {
      changes: db.getRowsModified(),
      lastInsertRowId: 0 // sql.js doesn't expose this directly in some versions
    };
  } catch (error: any) {
    return { message: error.message || String(error), code: 'STATEMENT_ERROR' };
  }
}

/**
 * Get list of tables in database
 */
export function getTables(id: string): string[] | SQLiteError {
  const result = executeQuery(id, 
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
  );
  
  if ('message' in result) return result;
  
  return result.values.map(row => row[0] as string);
}

/**
 * Get detailed table info including columns
 */
export function getTableInfo(id: string, tableName: string): TableInfo | SQLiteError {
  const db = databases.get(id);
  if (!db) {
    return { message: `Database ${id} not mounted`, code: 'NOT_MOUNTED' };
  }
  
  try {
    // Get column info
    const pragmaResult = executeQuery(id, `PRAGMA table_info("${tableName}")`);
    if ('message' in pragmaResult) return pragmaResult;
    
    const columns: ColumnInfo[] = pragmaResult.values.map(row => ({
      name: row[1] as string,
      type: row[2] as string,
      notnull: row[3] === 1,
      pk: row[5] === 1
    }));
    
    // Get row count
    const countResult = executeQuery(id, `SELECT COUNT(*) FROM "${tableName}"`);
    const rowCount = 'message' in countResult ? 0 : (countResult.values[0]?.[0] as number) || 0;
    
    return {
      name: tableName,
      columns,
      rowCount
    };
  } catch (error: any) {
    return { message: error.message || String(error), code: 'TABLE_INFO_ERROR' };
  }
}

/**
 * Export database to base64
 */
export function exportDatabase(id: string): string | SQLiteError {
  const db = databases.get(id);
  if (!db) {
    return { message: `Database ${id} not mounted`, code: 'NOT_MOUNTED' };
  }
  
  try {
    const data = db.export();
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error: any) {
    return { message: error.message || String(error), code: 'EXPORT_ERROR' };
  }
}

/**
 * Import a SQLite file and return metadata
 */
export async function importDatabaseFile(file: File): Promise<{
  id: string;
  data: string;
  metadata: {
    name: string;
    fileSize: number;
    tableCount: number;
    tables: string[];
    importedAt: string;
    originalFilename: string;
  };
} | SQLiteError> {
  if (!SQL) {
    const initialized = await initSQLite();
    if (!initialized) {
      return { message: 'Failed to initialize SQLite engine', code: 'INIT_ERROR' };
    }
  }
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Create temporary database to inspect
    const tempDb = new SQL!.Database(bytes);
    const tempId = `temp_${Date.now()}`;
    databases.set(tempId, tempDb);
    
    // Get table list
    const tables = getTables(tempId);
    if ('message' in tables) {
      unmountDatabase(tempId);
      return tables;
    }
    
    // Clean up temp mount
    unmountDatabase(tempId);
    
    // Convert to base64
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Data = btoa(binary);
    
    const id = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      data: base64Data,
      metadata: {
        name: file.name.replace(/\.sqlite?$|\.db$/i, ''),
        fileSize: file.size,
        tableCount: tables.length,
        tables,
        importedAt: new Date().toISOString(),
        originalFilename: file.name
      }
    };
  } catch (error: any) {
    return { message: error.message || String(error), code: 'IMPORT_ERROR' };
  }
}

/**
 * Get all mounted database IDs
 */
export function getMountedDatabases(): string[] {
  return Array.from(databases.keys());
}
