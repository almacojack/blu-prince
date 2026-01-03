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

interface ConnectedClient {
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>;
}

const clients = new Map<WebSocket, ConnectedClient>();
const channels = new Map<string, Set<WebSocket>>();

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

    default:
      console.log("[WS] Unknown message type:", data.type);
  }
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
  return {
    totalClients: clients.size,
    channels: stats,
  };
}
