import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, User, LogOut, Wifi, WifiOff, Send, Radio, Activity, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VirtualHandheld } from "@/components/VirtualHandheld";
import { useAuth } from "@/hooks/use-auth";
import { useControllerChannel } from "@/hooks/use-controller-channel";
import type { GamepadInput } from "@/hooks/use-gamepad";

function NeonScanlines() {
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 255, 0.1) 2px,
            rgba(0, 255, 255, 0.1) 4px
          )`,
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 1px,
            rgba(255, 0, 255, 0.08) 1px,
            rgba(255, 0, 255, 0.08) 2px
          )`,
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-40 bg-gradient-to-b from-cyan-500/[0.02] via-transparent to-purple-500/[0.02]" />
    </>
  );
}

function ChannelHUD({ 
  channel, 
  isConnected, 
  eventCount, 
  remotePlayerCount,
  packetsPerSecond,
}: { 
  channel: string; 
  isConnected: boolean; 
  eventCount: number;
  remotePlayerCount: number;
  packetsPerSecond: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-16 left-1/2 -translate-x-1/2 z-30"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-cyan-500/20 blur-xl" />
        <div className="relative bg-black/80 border border-cyan-500/30 rounded-lg px-6 py-2 backdrop-blur-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Radio className={`w-3 h-3 ${isConnected ? "text-cyan-400 animate-pulse" : "text-gray-600"}`} />
              <span className="font-mono text-xs text-cyan-400 font-bold tracking-wider">
                #{channel.toUpperCase()}
              </span>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <div className="flex items-center gap-1">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-400" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-400" />
              )}
              <span className={`font-mono text-[10px] ${isConnected ? "text-green-400" : "text-red-400"}`}>
                {isConnected ? "LIVE" : "OFFLINE"}
              </span>
            </div>
            
            <div className="h-4 w-px bg-white/10" />
            
            <div className="flex items-center gap-1" title="Remote players">
              <Users className="w-3 h-3 text-purple-400" />
              <span className="font-mono text-[10px] text-purple-400">{remotePlayerCount}</span>
            </div>
            
            <div className="flex items-center gap-1" title="Events logged">
              <Activity className="w-3 h-3 text-yellow-400" />
              <span className="font-mono text-[10px] text-yellow-400">{eventCount}</span>
            </div>
            
            <div className="flex items-center gap-1" title="Packets/sec">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span className="font-mono text-[10px] text-cyan-400">{packetsPerSecond}/s</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ControllerDemo() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [channel, setChannel] = useState("demo-lobby");
  const [channelInput, setChannelInput] = useState("demo-lobby");
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [packetsPerSecond, setPacketsPerSecond] = useState(0);
  const packetCountRef = useRef(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPacketsPerSecond(packetCountRef.current);
      packetCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const { 
    isConnected, 
    remoteInputs,
    sendInput,
  } = useControllerChannel({
    channel,
    userId: user?.id,
    autoConnect: true,
    onEvent: (event) => {
      packetCountRef.current++;
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      const userId = event.userId || "local";
      const isLocal = event.userId === user?.id || !event.userId;
      const prefix = isLocal ? "LOCAL" : userId.slice(0, 6);
      const log = `[${timestamp}] ${event.type.toUpperCase()} → ${prefix}`;
      setEventLog(prev => [log, ...prev.slice(0, 99)]);
    },
  });

  const handleInput = useCallback((input: GamepadInput) => {
    sendInput(input, 0);
  }, [sendInput]);

  const joinChannel = () => {
    if (channelInput.trim()) {
      setChannel(channelInput.trim());
      setEventLog([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 overflow-hidden">
      <NeonScanlines />
      
      <nav className="border-b border-cyan-500/20 bg-black/70 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-cyan-400 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded border border-cyan-500/50 flex items-center justify-center"
                animate={{ 
                  boxShadow: ["0 0 0px rgba(0,255,255,0)", "0 0 15px rgba(0,255,255,0.3)", "0 0 0px rgba(0,255,255,0)"],
                }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Gamepad2 className="w-4 h-4 text-cyan-400" />
              </motion.div>
              <div>
                <h1 className="font-pixel text-sm text-white">CONTROLLER</h1>
                <p className="text-[8px] font-mono text-cyan-400/60">GAMEPAD DEMO v1.0</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <Button variant="outline" size="sm" className="text-xs" disabled>...</Button>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full border border-cyan-500/50" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-cyan-400" />
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <a href="/api/login">
                <Button variant="outline" size="sm" className="text-xs border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                  Sign In
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <ChannelHUD 
        channel={channel}
        isConnected={isConnected}
        eventCount={eventLog.length}
        remotePlayerCount={remoteInputs.size}
        packetsPerSecond={packetsPerSecond}
      />

      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VirtualHandheld 
                onInput={handleInput}
                showSelector={true}
                className="max-w-md mx-auto"
              />
            </motion.div>

            <div className="mt-8 text-center max-w-md">
              <h2 className="text-lg font-bold text-white mb-2">Connect Your Controller</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Plug in a USB gamepad or connect via Bluetooth. Click/tap buttons above or drag analog sticks to send events.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Xbox Controller</Badge>
                <Badge variant="secondary" className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">DualShock</Badge>
                <Badge variant="secondary" className="text-[10px] bg-pink-500/10 text-pink-400 border border-pink-500/20">8BitDo</Badge>
                <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20">Generic HID</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <motion.div 
              className="relative bg-black/60 border border-cyan-500/30 rounded-lg p-4 overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-mono text-sm text-white">Event Channel</h3>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <Input
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    placeholder="Channel name"
                    className="h-8 text-xs bg-black/50 border-cyan-500/20 focus:border-cyan-500/50 text-white placeholder:text-gray-500"
                    onKeyDown={(e) => e.key === "Enter" && joinChannel()}
                    data-testid="input-channel"
                  />
                  <Button 
                    size="sm" 
                    onClick={joinChannel} 
                    className="h-8 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30" 
                    data-testid="button-join-channel"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>

                <div className="text-[10px] text-muted-foreground font-mono mb-2">
                  Current: <span className="text-cyan-400 font-bold">#{channel}</span>
                </div>

                {isAuthenticated && (
                  <div className="text-[10px] text-muted-foreground font-mono">
                    User ID: <span className="text-purple-400">{user?.id?.slice(0, 12)}...</span>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              className="relative bg-black/60 border border-purple-500/30 rounded-lg p-4 overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-sm text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    Live Events
                  </h3>
                  <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">
                    {eventLog.length} logged
                  </Badge>
                </div>
                
                <div className="h-64 overflow-y-auto bg-black/40 rounded border border-white/5 p-2 font-mono text-[10px] space-y-1">
                  {eventLog.length === 0 ? (
                    <div className="text-muted-foreground italic flex items-center justify-center h-full">
                      <span className="animate-pulse">Waiting for input...</span>
                    </div>
                  ) : (
                    eventLog.map((log, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`${log.includes("LOCAL") ? "text-cyan-400" : "text-gray-500"}`}
                      >
                        {log}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>

            {remoteInputs.size > 0 && (
              <motion.div 
                className="relative bg-black/60 border border-green-500/30 rounded-lg p-4 overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-cyan-500/5" />
                <div className="relative">
                  <h3 className="font-mono text-sm text-white mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    Remote Players
                  </h3>
                  <div className="space-y-2">
                    {Array.from(remoteInputs.entries()).map(([userId, event]) => (
                      <div key={userId} className="flex items-center gap-2 text-[10px] font-mono bg-black/30 rounded p-2">
                        <motion.div 
                          className="w-2 h-2 rounded-full bg-green-500"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                        <span className="text-green-400">{userId.slice(0, 8)}...</span>
                        <span className="text-cyan-400 ml-auto flex gap-1">
                          {event.data?.buttons?.a && <span className="bg-green-500/20 px-1 rounded">A</span>}
                          {event.data?.buttons?.b && <span className="bg-red-500/20 px-1 rounded">B</span>}
                          {event.data?.buttons?.x && <span className="bg-blue-500/20 px-1 rounded">X</span>}
                          {event.data?.buttons?.y && <span className="bg-yellow-500/20 px-1 rounded">Y</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
