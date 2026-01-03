import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";

interface ControllerEvent {
  type: "input" | "connect" | "disconnect";
  userId?: string;
  gamepadIndex: number;
  timestamp: number;
  data?: {
    buttons?: Record<string, boolean>;
    axes?: Record<string, number>;
    triggers?: Record<string, number>;
  };
}

interface CollabUser {
  id: string;
  name?: string;
  color: string;
  cursor?: { x: number; y: number };
  lastSeen: number;
}

interface CollabRoom {
  id: string;
  users: Map<string, CollabUser>;
  state: any;
  version: number;
}

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  userName?: string;
  subscriptions: Set<string>;
  collabRooms: Set<string>;
  color?: string;
}

const COLLAB_COLORS = [
  "#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb923c", "#f87171", "#60a5fa"
];

const clients = new Map<WebSocket, ConnectedClient>();
const channels = new Map<string, Set<WebSocket>>();
const collabRooms = new Map<string, CollabRoom>();

function getRandomColor(): string {
  return COLLAB_COLORS[Math.floor(Math.random() * COLLAB_COLORS.length)];
}

export function setupWebSocket(httpServer: HttpServer) {
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws/controller" 
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[WS] Client connected");
    
    const client: ConnectedClient = {
      ws,
      subscriptions: new Set(),
      collabRooms: new Set(),
      color: getRandomColor(),
    };
    clients.set(ws, client);

    ws.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(ws, data);
      } catch (error) {
        console.error("[WS] Invalid message:", error);
      }
    });

    ws.on("close", () => {
      console.log("[WS] Client disconnected");
      const client = clients.get(ws);
      if (client) {
        client.subscriptions.forEach((channel) => {
          const channelClients = channels.get(channel);
          if (channelClients) {
            channelClients.delete(ws);
            if (channelClients.size === 0) {
              channels.delete(channel);
            }
          }
        });
        
        client.collabRooms.forEach((roomId) => {
          handleLeaveRoom(ws, roomId);
        });
      }
      clients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("[WS] Error:", error);
    });

    ws.send(JSON.stringify({ 
      type: "connected", 
      message: "Connected to TingOS Controller Channel" 
    }));
  });

  console.log("[WS] WebSocket server initialized on /ws/controller");
  return wss;
}

function handleMessage(ws: WebSocket, data: any) {
  const client = clients.get(ws);
  if (!client) return;

  switch (data.type) {
    case "auth":
      client.userId = data.userId;
      client.userName = data.userName;
      ws.send(JSON.stringify({ type: "auth_ack", userId: data.userId }));
      break;

    case "subscribe":
      const channel = data.channel || "default";
      client.subscriptions.add(channel);
      if (!channels.has(channel)) {
        channels.set(channel, new Set());
      }
      channels.get(channel)!.add(ws);
      ws.send(JSON.stringify({ type: "subscribed", channel }));
      break;

    case "unsubscribe":
      const unsubChannel = data.channel || "default";
      client.subscriptions.delete(unsubChannel);
      channels.get(unsubChannel)?.delete(ws);
      break;

    case "controller_input":
      const event: ControllerEvent = {
        type: "input",
        userId: client.userId,
        gamepadIndex: data.gamepadIndex || 0,
        timestamp: Date.now(),
        data: data.input,
      };
      broadcastToChannel(data.channel || "default", event, ws);
      break;

    case "controller_connect":
      broadcastToChannel(data.channel || "default", {
        type: "connect",
        userId: client.userId,
        gamepadIndex: data.gamepadIndex || 0,
        timestamp: Date.now(),
      }, ws);
      break;

    case "controller_disconnect":
      broadcastToChannel(data.channel || "default", {
        type: "disconnect",
        userId: client.userId,
        gamepadIndex: data.gamepadIndex || 0,
        timestamp: Date.now(),
      }, ws);
      break;

    case "collab_join":
      handleJoinRoom(ws, data.roomId, data.initialState);
      break;

    case "collab_leave":
      handleLeaveRoom(ws, data.roomId);
      break;

    case "collab_state_update":
      handleStateUpdate(ws, data.roomId, data.patch, data.version);
      break;

    case "collab_cursor_move":
      handleCursorMove(ws, data.roomId, data.cursor);
      break;

    case "collab_full_sync":
      handleFullSync(ws, data.roomId, data.state);
      break;

    default:
      console.log("[WS] Unknown message type:", data.type);
  }
}

function handleJoinRoom(ws: WebSocket, roomId: string, initialState?: any) {
  const client = clients.get(ws);
  if (!client || !client.userId) {
    ws.send(JSON.stringify({ type: "collab_error", error: "Must authenticate first" }));
    return;
  }

  let room = collabRooms.get(roomId);
  
  if (!room) {
    room = {
      id: roomId,
      users: new Map(),
      state: initialState || null,
      version: 0,
    };
    collabRooms.set(roomId, room);
    console.log(`[WS] Created new collab room: ${roomId}`);
  }

  const user: CollabUser = {
    id: client.userId,
    name: client.userName,
    color: client.color || getRandomColor(),
    lastSeen: Date.now(),
  };
  
  room.users.set(client.userId, user);
  client.collabRooms.add(roomId);

  ws.send(JSON.stringify({
    type: "collab_joined",
    roomId,
    state: room.state,
    version: room.version,
    users: Array.from(room.users.values()),
    yourColor: user.color,
  }));

  broadcastToRoom(roomId, {
    type: "collab_user_joined",
    roomId,
    user,
  }, ws);

  console.log(`[WS] User ${client.userId} joined room ${roomId} (${room.users.size} users)`);
}

function handleLeaveRoom(ws: WebSocket, roomId: string) {
  const client = clients.get(ws);
  if (!client || !client.userId) return;

  const room = collabRooms.get(roomId);
  if (!room) return;

  room.users.delete(client.userId);
  client.collabRooms.delete(roomId);

  broadcastToRoom(roomId, {
    type: "collab_user_left",
    roomId,
    userId: client.userId,
  }, ws);

  if (room.users.size === 0) {
    collabRooms.delete(roomId);
    console.log(`[WS] Room ${roomId} deleted (empty)`);
  }

  console.log(`[WS] User ${client.userId} left room ${roomId}`);
}

function handleStateUpdate(ws: WebSocket, roomId: string, patch: any, clientVersion: number) {
  const client = clients.get(ws);
  if (!client || !client.userId) return;

  const room = collabRooms.get(roomId);
  if (!room) return;

  if (clientVersion !== room.version) {
    ws.send(JSON.stringify({
      type: "collab_sync_required",
      roomId,
      serverVersion: room.version,
      state: room.state,
    }));
    return;
  }

  room.state = applyPatch(room.state, patch);
  room.version++;

  const user = room.users.get(client.userId);
  if (user) {
    user.lastSeen = Date.now();
  }

  broadcastToRoom(roomId, {
    type: "collab_state_updated",
    roomId,
    patch,
    version: room.version,
    userId: client.userId,
  }, ws);
}

function handleFullSync(ws: WebSocket, roomId: string, state: any) {
  const client = clients.get(ws);
  if (!client || !client.userId) return;

  const room = collabRooms.get(roomId);
  if (!room) return;

  room.state = state;
  room.version++;

  broadcastToRoom(roomId, {
    type: "collab_full_sync",
    roomId,
    state: room.state,
    version: room.version,
    userId: client.userId,
  }, ws);
}

function handleCursorMove(ws: WebSocket, roomId: string, cursor: { x: number; y: number }) {
  const client = clients.get(ws);
  if (!client || !client.userId) return;

  const room = collabRooms.get(roomId);
  if (!room) return;

  const user = room.users.get(client.userId);
  if (user) {
    user.cursor = cursor;
    user.lastSeen = Date.now();
  }

  broadcastToRoom(roomId, {
    type: "collab_cursor_moved",
    roomId,
    userId: client.userId,
    cursor,
  }, ws);
}

function applyPatch(state: any, patch: any): any {
  if (!state) return patch;
  return { ...state, ...patch };
}

function broadcastToRoom(roomId: string, message: any, exclude?: WebSocket) {
  const room = collabRooms.get(roomId);
  if (!room) return;

  const payload = JSON.stringify(message);
  
  clients.forEach((client, ws) => {
    if (client.collabRooms.has(roomId) && ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

function broadcastToChannel(channel: string, event: ControllerEvent, exclude?: WebSocket) {
  const channelClients = channels.get(channel);
  if (!channelClients) return;

  const message = JSON.stringify(event);
  channelClients.forEach((clientWs) => {
    if (clientWs !== exclude && clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(message);
    }
  });
}

export function getChannelStats() {
  const stats: Record<string, number> = {};
  channels.forEach((clients, channel) => {
    stats[channel] = clients.size;
  });
  
  const roomStats: Record<string, number> = {};
  collabRooms.forEach((room, roomId) => {
    roomStats[roomId] = room.users.size;
  });
  
  return {
    totalClients: clients.size,
    channels: stats,
    collabRooms: roomStats,
  };
}
