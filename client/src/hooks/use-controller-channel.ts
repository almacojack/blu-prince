import { useState, useEffect, useCallback, useRef } from "react";
import type { GamepadInput } from "./use-gamepad";

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

interface UseControllerChannelOptions {
  channel?: string;
  userId?: string;
  autoConnect?: boolean;
  onEvent?: (event: ControllerEvent) => void;
}

export function useControllerChannel(options: UseControllerChannelOptions = {}) {
  const { channel = "default", userId, autoConnect = true, onEvent } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [remoteInputs, setRemoteInputs] = useState<Map<string, ControllerEvent>>(new Map());
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>(0);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/controller`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected to controller channel");
      setIsConnected(true);
      
      if (userId) {
        ws.send(JSON.stringify({ type: "auth", userId }));
      }
      
      ws.send(JSON.stringify({ type: "subscribe", channel }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "connected":
            console.log("[WS]", data.message);
            break;
          case "auth_ack":
            setIsAuthenticated(true);
            break;
          case "subscribed":
            console.log("[WS] Subscribed to channel:", data.channel);
            break;
          case "input":
          case "connect":
          case "disconnect":
            const controllerEvent = data as ControllerEvent;
            onEventRef.current?.(controllerEvent);
            
            if (controllerEvent.type === "input" && controllerEvent.userId) {
              setRemoteInputs(prev => {
                const next = new Map(prev);
                next.set(controllerEvent.userId!, controllerEvent);
                return next;
              });
            }
            break;
        }
      } catch (error) {
        console.error("[WS] Parse error:", error);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
      setIsConnected(false);
      setIsAuthenticated(false);
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (autoConnect) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("[WS] Error:", error);
    };
  }, [channel, userId, autoConnect]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimeoutRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendInput = useCallback((input: GamepadInput, gamepadIndex: number = 0) => {
    const inputData = {
      buttons: {
        a: input.a,
        b: input.b,
        x: input.x,
        y: input.y,
        leftBumper: input.leftBumper,
        rightBumper: input.rightBumper,
        select: input.select,
        start: input.start,
        leftStickPress: input.leftStickPress,
        rightStickPress: input.rightStickPress,
        dpadUp: input.dpadUp,
        dpadDown: input.dpadDown,
        dpadLeft: input.dpadLeft,
        dpadRight: input.dpadRight,
        home: input.home,
      },
      axes: {
        leftStickX: input.leftStickX,
        leftStickY: input.leftStickY,
        rightStickX: input.rightStickX,
        rightStickY: input.rightStickY,
      },
      triggers: {
        left: input.leftTrigger,
        right: input.rightTrigger,
      },
    };
    
    const localEvent: ControllerEvent = {
      type: "input",
      userId: userId,
      gamepadIndex,
      timestamp: Date.now(),
      data: inputData,
    };
    onEventRef.current?.(localEvent);
    
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: "controller_input",
      channel,
      gamepadIndex,
      input: inputData,
    }));
  }, [channel, userId]);

  const sendConnect = useCallback((gamepadIndex: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "controller_connect",
      channel,
      gamepadIndex,
    }));
  }, [channel]);

  const sendDisconnect = useCallback((gamepadIndex: number) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: "controller_disconnect",
      channel,
      gamepadIndex,
    }));
  }, [channel]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => disconnect();
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    isAuthenticated,
    remoteInputs,
    connect,
    disconnect,
    sendInput,
    sendConnect,
    sendDisconnect,
  };
}
