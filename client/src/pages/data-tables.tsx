import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCartridge } from "@/contexts/cartridge-context";
import {
  ArrowLeft, Database, Table2, Play, Plus, Trash2, Upload, Download,
  FileJson, Clock, AlertCircle, CheckCircle, Search, Code, Columns3,
  HardDrive, Wifi, WifiOff
} from "lucide-react";
import {
  initSQLite,
  isSQLiteReady,
  mountDatabase,
  unmountDatabase,
  executeQuery,
  getTables,
  getTableInfo,
  importDatabaseFile,
  exportDatabase,
  getMountedDatabases,
  type TableInfo,
  type QueryResult,
  type SQLiteError
} from "@/lib/sqlite-service";
import type { TossDatabaseAsset, TossDatabaseMetadata } from "@/lib/toss";

interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: Date;
  success: boolean;
  rowCount?: number;
  executionTime?: number;
}

export default function DataTablesPage() {
  const { databases, addDatabase, removeDatabase, syncDatabaseToCartridge } = useCartridge();
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sqliteReady, setSqliteReady] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize SQLite on mount
  useEffect(() => {
    const init = async () => {
      const ready = await initSQLite();
      setSqliteReady(ready);
      if (!ready) {
        toast({
          title: "SQLite Error",
          description: "Failed to initialize SQLite engine",
          variant: "destructive"
        });
      }
    };
    init();
  }, [toast]);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load tables when database is selected
  useEffect(() => {
    if (!selectedDbId) {
      setTables([]);
      setSelectedTable(null);
      setTableInfo(null);
      return;
    }

    const result = getTables(selectedDbId);
    if ('message' in result) {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    } else {
      setTables(result);
    }
  }, [selectedDbId, toast]);

  // Load table info when table is selected
  useEffect(() => {
    if (!selectedDbId || !selectedTable) {
      setTableInfo(null);
      return;
    }

    const result = getTableInfo(selectedDbId, selectedTable);
    if ('message' in result) {
      setTableInfo(null);
    } else {
      setTableInfo(result);
    }
  }, [selectedDbId, selectedTable]);

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    const result = await importDatabaseFile(file);
    
    if ('message' in result) {
      toast({
        title: "Import Failed",
        description: result.message,
        variant: "destructive"
      });
    } else {
      const newDb: TossDatabaseAsset = {
        id: result.id,
        type: 'sqlite',
        metadata: result.metadata,
        data: result.data
      };
      
      // Add to context (mounts and persists)
      const success = await addDatabase(newDb);
      
      if (success) {
        setSelectedDbId(result.id);
        
        toast({
          title: "Database Imported",
          description: `${result.metadata.name} with ${result.metadata.tableCount} tables`
        });
      } else {
        toast({
          title: "Mount Failed",
          description: "Could not mount the database",
          variant: "destructive"
        });
      }
    }
    
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDatabase = (id: string) => {
    removeDatabase(id);
    if (selectedDbId === id) {
      setSelectedDbId(null);
    }
    toast({ title: "Database Removed" });
  };

  const handleRunQuery = useCallback(() => {
    if (!selectedDbId || !sqlQuery.trim()) return;

    const startTime = Date.now();
    const result = executeQuery(selectedDbId, sqlQuery);
    
    const historyItem: QueryHistoryItem = {
      id: `query_${Date.now()}`,
      sql: sqlQuery,
      timestamp: new Date(),
      success: !('message' in result),
      rowCount: !('message' in result) ? result.rowCount : undefined,
      executionTime: !('message' in result) ? result.executionTime : undefined
    };
    
    setQueryHistory(prev => [historyItem, ...prev.slice(0, 49)]);
    
    if ('message' in result) {
      setQueryError(result.message);
      setQueryResult(null);
    } else {
      setQueryError(null);
      setQueryResult(result);
      
      const isDDL = /^\s*(CREATE|DROP|ALTER)\s/i.test(sqlQuery.trim());
      if (result.mutated || isDDL) {
        syncDatabaseToCartridge(selectedDbId);
        const tablesResult = getTables(selectedDbId);
        if (!('message' in tablesResult)) {
          setTables(tablesResult);
        }
      }
    }
  }, [selectedDbId, sqlQuery, syncDatabaseToCartridge]);

  const handleExportDatabase = () => {
    if (!selectedDbId) return;
    
    const result = exportDatabase(selectedDbId);
    if (typeof result === 'object' && 'message' in result) {
      toast({ title: "Export Failed", description: result.message, variant: "destructive" });
      return;
    }
    
    const db = databases.find(d => d.id === selectedDbId);
    const filename = `${db?.metadata.name || 'database'}.sqlite`;
    
    // Decode base64 and create blob
    const binaryString = atob(result as string);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const blob = new Blob([bytes], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Database Exported", description: filename });
  };

  const selectedDb = databases.find(d => d.id === selectedDbId);

  return (
    <div className="w-full h-screen bg-[#0a0a0f] flex flex-col">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 bg-black/40 backdrop-blur border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/editor">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span className="font-pixel text-sm text-white">DATA TABLES</span>
            <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400">
              SQLite
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">
              <Wifi className="w-3 h-3 mr-1" /> Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] border-orange-500/50 text-orange-400">
              <WifiOff className="w-3 h-3 mr-1" /> Offline
            </Badge>
          )}
          <Badge variant={sqliteReady ? "default" : "destructive"} className="text-[10px]">
            <HardDrive className="w-3 h-3 mr-1" />
            {sqliteReady ? "Engine Ready" : "Initializing..."}
          </Badge>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Database List */}
        <div className="w-64 border-r border-white/10 flex flex-col bg-black/20">
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-muted-foreground">Databases</span>
              <Badge variant="outline" className="text-[10px]">{databases.length}</Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sqlite,.sqlite3,.db"
              onChange={handleImportDatabase}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={!sqliteReady || isLoading}
              data-testid="button-import-database"
            >
              <Upload className="w-3 h-3 mr-2" /> Import SQLite
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {databases.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  <Database className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No databases imported yet
                </div>
              ) : (
                databases.map((db) => (
                  <div
                    key={db.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedDbId === db.id 
                        ? 'bg-emerald-500/20 border border-emerald-500/50' 
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => setSelectedDbId(db.id)}
                    data-testid={`database-item-${db.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-mono text-white truncate max-w-[120px]">
                          {db.metadata.name}
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-5 h-5 text-muted-foreground hover:text-red-400"
                        onClick={(e) => { e.stopPropagation(); handleRemoveDatabase(db.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[9px]">
                        {db.metadata.tableCount} tables
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {(db.metadata.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {!selectedDbId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Database className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Select or import a database to get started</p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="schema" className="flex-1 flex flex-col">
              <div className="border-b border-white/10 px-4">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="schema" className="data-[state=active]:bg-white/10">
                    <Columns3 className="w-3 h-3 mr-2" /> Schema
                  </TabsTrigger>
                  <TabsTrigger value="query" className="data-[state=active]:bg-white/10">
                    <Code className="w-3 h-3 mr-2" /> Query
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-white/10">
                    <Clock className="w-3 h-3 mr-2" /> History
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Schema Tab */}
              <TabsContent value="schema" className="flex-1 flex m-0 p-0">
                {/* Table List */}
                <div className="w-48 border-r border-white/10 p-2">
                  <div className="text-xs font-mono uppercase text-muted-foreground mb-2 px-1">
                    Tables ({tables.length})
                  </div>
                  <ScrollArea className="h-[calc(100vh-180px)]">
                    <div className="space-y-1">
                      {tables.map((table) => (
                        <div
                          key={table}
                          className={`p-2 rounded cursor-pointer text-xs font-mono flex items-center gap-2 ${
                            selectedTable === table 
                              ? 'bg-primary/20 text-primary' 
                              : 'hover:bg-white/5 text-white'
                          }`}
                          onClick={() => setSelectedTable(table)}
                        >
                          <Table2 className="w-3 h-3" />
                          {table}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Table Details */}
                <div className="flex-1 p-4">
                  {tableInfo ? (
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Table2 className="w-5 h-5 text-primary" />
                        <span className="text-lg font-mono text-white">{tableInfo.name}</span>
                        <Badge variant="outline">{tableInfo.rowCount} rows</Badge>
                      </div>
                      
                      <div className="bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                        <div className="grid grid-cols-4 gap-4 p-3 bg-white/5 text-xs font-mono uppercase text-muted-foreground">
                          <div>Column</div>
                          <div>Type</div>
                          <div>Not Null</div>
                          <div>Primary Key</div>
                        </div>
                        <ScrollArea className="max-h-[400px]">
                          {tableInfo.columns.map((col, idx) => (
                            <div
                              key={col.name}
                              className={`grid grid-cols-4 gap-4 p-3 text-xs font-mono ${
                                idx % 2 === 0 ? 'bg-black/20' : ''
                              }`}
                            >
                              <div className="text-white">{col.name}</div>
                              <div className="text-cyan-400">{col.type || 'TEXT'}</div>
                              <div>{col.notnull ? <CheckCircle className="w-3 h-3 text-green-400" /> : '-'}</div>
                              <div>{col.pk ? <Badge variant="secondary" className="text-[9px]">PK</Badge> : '-'}</div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                      
                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSqlQuery(`SELECT * FROM "${tableInfo.name}" LIMIT 100`);
                          }}
                        >
                          <Search className="w-3 h-3 mr-2" /> Preview Data
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Select a table to view its schema
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Query Tab */}
              <TabsContent value="query" className="flex-1 flex flex-col m-0 p-0">
                {/* SQL Editor */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-mono uppercase text-muted-foreground">SQL Query</span>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="flex-1 min-h-[100px] bg-black/60 border border-white/10 rounded-lg p-3 text-sm font-mono text-white resize-none focus:outline-none focus:border-primary/50"
                      placeholder="SELECT * FROM table_name LIMIT 10;"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleRunQuery();
                        }
                      }}
                      data-testid="input-sql-query"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleRunQuery}
                        disabled={!sqlQuery.trim()}
                        className="bg-emerald-600 hover:bg-emerald-500"
                        data-testid="button-run-query"
                      >
                        <Play className="w-4 h-4 mr-2" /> Run
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportDatabase}
                      >
                        <Download className="w-3 h-3 mr-2" /> Export
                      </Button>
                    </div>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Press Cmd/Ctrl + Enter to run
                  </div>
                </div>

                {/* Results */}
                <div className="flex-1 p-4 overflow-auto">
                  {queryError && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {queryError}
                      </div>
                    </div>
                  )}

                  {queryResult && (
                    <div>
                      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                        <span>{queryResult.rowCount} rows returned</span>
                        <span>{queryResult.executionTime.toFixed(2)}ms</span>
                      </div>

                      {queryResult.columns.length > 0 ? (
                        <div className="bg-black/40 rounded-lg border border-white/10 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs font-mono">
                              <thead>
                                <tr className="bg-white/5">
                                  {queryResult.columns.map((col) => (
                                    <th key={col} className="text-left p-2 text-muted-foreground font-normal border-b border-white/10">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {queryResult.values.map((row, rowIdx) => (
                                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-black/20' : ''}>
                                    {row.map((cell, cellIdx) => (
                                      <td key={cellIdx} className="p-2 text-white border-b border-white/5">
                                        {cell === null ? (
                                          <span className="text-muted-foreground italic">NULL</span>
                                        ) : (
                                          String(cell)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          Query executed successfully (no results)
                        </div>
                      )}
                    </div>
                  )}

                  {!queryResult && !queryError && (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      Enter a SQL query and click Run
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="flex-1 m-0 p-4">
                <ScrollArea className="h-[calc(100vh-180px)]">
                  {queryHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No query history yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {queryHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-black/40 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5"
                          onClick={() => setSqlQuery(item.sql)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {item.success ? (
                                <CheckCircle className="w-3 h-3 text-green-400" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-red-400" />
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {item.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            {item.success && (
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{item.rowCount} rows</span>
                                <span>{item.executionTime?.toFixed(2)}ms</span>
                              </div>
                            )}
                          </div>
                          <code className="text-xs font-mono text-white line-clamp-2">
                            {item.sql}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
