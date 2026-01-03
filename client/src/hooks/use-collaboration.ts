import { useState, useEffect, useCallback, useRef, useMemo } from "react";

export interface CollabUser {
  id: string;
  name?: string;
  color: string;
  cursor?: { x: number; y: number };
}

interface CollabState<T> {
  isConnected: boolean;
  isJoined: boolean;
  roomId: string | null;
  users: CollabUser[];
  myColor: string;
  version: number;
  state: T | null;
  error: string | null;
}

interface UseCollaborationOptions<T> {
  roomId: string;
  userId?: string;
  userName?: string;
  initialState?: T;
  onStateChange?: (state: T, userId: string) => void;
  onUserJoin?: (user: CollabUser) => void;
  onUserLeave?: (userId: string) => void;
  onCursorMove?: (userId: string, cursor: { x: number; y: number }) => void;
  autoConnect?: boolean;
}

export function useCollaboration<T = any>(options: UseCollaborationOptions<T>) {
  const {
    roomId,
    userId,
    userName,
    initialState,
    onStateChange,
    onUserJoin,
    onUserLeave,
    onCursorMove,
    autoConnect = true,
  } = options;

  const [state, setState] = useState<CollabState<T>>({
    isConnected: false,
    isJoined: false,
    roomId: null,
    users: [],
    myColor: "#22d3ee",
    version: 0,
    state: null,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorThrottleRef = useRef<number>(0);
  const initialStateRef = useRef<T | undefined>(initialState);
  const roomIdRef = useRef(roomId);
  const userIdRef = useRef(userId);
  const userNameRef = useRef(userName);
  const autoConnectRef = useRef(autoConnect);
  const prevRoomIdRef = useRef(roomId);
  const isJoinedRef = useRef(false);
  
  useEffect(() => {
    const oldRoomId = roomIdRef.current;
    roomIdRef.current = roomId;
    
    if (oldRoomId !== roomId && wsRef.current?.readyState === WebSocket.OPEN) {
      isJoinedRef.current = false;
      setState(prev => ({
        ...prev,
        isJoined: false,
        users: [],
        version: 0,
        state: null,
      }));
      
      wsRef.current.send(JSON.stringify({ type: "collab_leave", roomId: oldRoomId }));
      wsRef.current.send(JSON.stringify({
        type: "collab_join",
        roomId,
        initialState: initialStateRef.current,
      }));
    }
  }, [roomId]);
  
  useEffect(() => {
    userIdRef.current = userId;
    userNameRef.current = userName;
  }, [userId, userName]);
  
  useEffect(() => {
    initialStateRef.current = initialState;
  }, [initialState]);
  
  useEffect(() => {
    autoConnectRef.current = autoConnect;
  }, [autoConnect]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/controller`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[Collab] Connected");
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      
      if (userIdRef.current) {
        ws.send(JSON.stringify({ type: "auth", userId: userIdRef.current, userName: userNameRef.current }));
      }
      
      ws.send(JSON.stringify({
        type: "collab_join",
        roomId: roomIdRef.current,
        initialState: initialStateRef.current,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error("[Collab] Parse error:", e);
      }
    };

    ws.onclose = () => {
      console.log("[Collab] Disconnected");
      isJoinedRef.current = false;
      setState(prev => ({
        ...prev,
        isConnected: false,
        isJoined: false,
      }));
      
      if (autoConnectRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      }
    };

    ws.onerror = (error) => {
      console.error("[Collab] Error:", error);
      setState(prev => ({ ...prev, error: "Connection error" }));
    };
  }, [autoConnect]);

  const handleMessage = useCallback((data: any) => {
    switch (data.type) {
      case "collab_joined":
        isJoinedRef.current = true;
        setState(prev => ({
          ...prev,
          isJoined: true,
          roomId: data.roomId,
          state: data.state,
          version: data.version,
          users: data.users || [],
          myColor: data.yourColor || prev.myColor,
        }));
        break;

      case "collab_user_joined":
        setState(prev => ({
          ...prev,
          users: [...prev.users.filter(u => u.id !== data.user.id), data.user],
        }));
        onUserJoin?.(data.user);
        break;

      case "collab_user_left":
        setState(prev => ({
          ...prev,
          users: prev.users.filter(u => u.id !== data.userId),
        }));
        onUserLeave?.(data.userId);
        break;

      case "collab_state_updated":
        setState(prev => {
          const newState = applyPatch(prev.state, data.patch);
          onStateChange?.(newState, data.userId);
          return {
            ...prev,
            state: newState,
            version: data.version,
          };
        });
        break;

      case "collab_full_sync":
        setState(prev => ({
          ...prev,
          state: data.state,
          version: data.version,
        }));
        if (data.userId) {
          onStateChange?.(data.state, data.userId);
        }
        break;

      case "collab_sync_required":
        setState(prev => ({
          ...prev,
          state: data.state,
          version: data.serverVersion,
        }));
        break;

      case "collab_cursor_moved":
        setState(prev => ({
          ...prev,
          users: prev.users.map(u =>
            u.id === data.userId ? { ...u, cursor: data.cursor } : u
          ),
        }));
        onCursorMove?.(data.userId, data.cursor);
        break;

      case "collab_error":
        setState(prev => ({ ...prev, error: data.error }));
        break;
    }
  }, [onStateChange, onUserJoin, onUserLeave, onCursorMove]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    isJoinedRef.current = false;
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "collab_leave", roomId: roomIdRef.current }));
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendPatch = useCallback((patch: Partial<T>) => {
    if (!isJoinedRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    setState(prev => {
      wsRef.current?.send(JSON.stringify({
        type: "collab_state_update",
        roomId: roomIdRef.current,
        patch,
        version: prev.version,
      }));
      return {
        ...prev,
        state: applyPatch(prev.state, patch) as T,
        version: prev.version + 1,
      };
    });
  }, []);

  const sendFullState = useCallback((newState: T) => {
    if (!isJoinedRef.current || wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: "collab_full_sync",
      roomId: roomIdRef.current,
      state: newState,
    }));
    
    setState(prev => ({
      ...prev,
      state: newState,
      version: prev.version + 1,
    }));
  }, []);

  const sendCursor = useCallback((cursor: { x: number; y: number }) => {
    if (!isJoinedRef.current) return;
    
    const now = Date.now();
    if (now - cursorThrottleRef.current < 50) return;
    cursorThrottleRef.current = now;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "collab_cursor_move",
        roomId: roomIdRef.current,
        cursor,
      }));
    }
  }, []);

  useEffect(() => {
    if (autoConnect && userId) {
      connect();
    }
    return () => {
      disconnect();
    };
  }, [autoConnect, userId]);

  return {
    ...state,
    connect,
    disconnect,
    sendPatch,
    sendFullState,
    sendCursor,
    otherUsers: state.users.filter(u => u.id !== userId),
  };
}

function applyPatch<T>(state: T | null, patch: Partial<T>): T {
  if (!state) return patch as T;
  return { ...state, ...patch };
}
