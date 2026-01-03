import { useState, useCallback } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Gamepad2, User, LogOut, Wifi, WifiOff, Send, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { VirtualHandheld } from "@/components/VirtualHandheld";
import { useAuth } from "@/hooks/use-auth";
import { useControllerChannel } from "@/hooks/use-controller-channel";
import type { GamepadInput } from "@/hooks/use-gamepad";

export default function ControllerDemo() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [channel, setChannel] = useState("demo-lobby");
  const [channelInput, setChannelInput] = useState("demo-lobby");
  const [eventLog, setEventLog] = useState<string[]>([]);
  
  const { 
    isConnected, 
    remoteInputs,
    sendInput,
  } = useControllerChannel({
    channel,
    userId: user?.id,
    autoConnect: true,
    onEvent: (event) => {
      const timestamp = new Date(event.timestamp).toLocaleTimeString();
      const log = `[${timestamp}] ${event.type.toUpperCase()} from ${event.userId?.slice(0, 8) || "anon"}`;
      setEventLog(prev => [log, ...prev.slice(0, 49)]);
    },
  });

  const handleInput = useCallback((input: GamepadInput) => {
    sendInput(input, 0);
  }, [sendInput]);

  const joinChannel = () => {
    if (channelInput.trim()) {
      setChannel(channelInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded border border-primary/50 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="font-pixel text-sm text-white">CONTROLLER</h1>
                <p className="text-[8px] font-mono text-muted-foreground">GAMEPAD DEMO</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="border-green-500/50 text-green-400 text-[10px] font-mono gap-1">
                  <Wifi className="w-3 h-3" />
                  LIVE
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/50 text-red-400 text-[10px] font-mono gap-1">
                  <WifiOff className="w-3 h-3" />
                  OFFLINE
                </Badge>
              )}
            </div>

            {isLoading ? (
              <Button variant="outline" size="sm" className="text-xs" disabled>...</Button>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                {user?.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-7 h-7 rounded-full border border-primary/50" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                )}
                <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground hover:text-red-400">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <a href="/api/login">
                <Button variant="outline" size="sm" className="text-xs border-primary/50 text-primary">
                  Sign In
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
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
                Plug in a USB gamepad or connect via Bluetooth. The virtual controller above will mirror your inputs in real-time.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Xbox Controller</Badge>
                <Badge variant="secondary" className="text-[10px]">DualShock</Badge>
                <Badge variant="secondary" className="text-[10px]">8BitDo</Badge>
                <Badge variant="secondary" className="text-[10px]">Generic HID</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-black/50 border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-4 h-4 text-primary" />
                <h3 className="font-mono text-sm text-white">Event Channel</h3>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Input
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  placeholder="Channel name"
                  className="h-8 text-xs bg-black/50 border-white/10"
                  onKeyDown={(e) => e.key === "Enter" && joinChannel()}
                  data-testid="input-channel"
                />
                <Button size="sm" onClick={joinChannel} className="h-8 px-3" data-testid="button-join-channel">
                  <Send className="w-3 h-3" />
                </Button>
              </div>

              <div className="text-[10px] text-muted-foreground font-mono mb-2">
                Current: <span className="text-primary">{channel}</span>
              </div>

              {isAuthenticated && (
                <div className="text-[10px] text-muted-foreground font-mono">
                  User ID: <span className="text-cyan-400">{user?.id?.slice(0, 12)}...</span>
                </div>
              )}
            </div>

            <div className="bg-black/50 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm text-white">Live Events</h3>
                <Badge variant="outline" className="text-[10px] border-white/20">
                  {eventLog.length} events
                </Badge>
              </div>
              
              <div className="h-64 overflow-y-auto bg-black/30 rounded p-2 font-mono text-[10px] space-y-1">
                {eventLog.length === 0 ? (
                  <div className="text-muted-foreground italic">
                    No events yet. Move your controller to see events...
                  </div>
                ) : (
                  eventLog.map((log, i) => (
                    <div key={i} className="text-gray-400">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {remoteInputs.size > 0 && (
              <div className="bg-black/50 border border-white/10 rounded-lg p-4">
                <h3 className="font-mono text-sm text-white mb-4">Remote Players</h3>
                <div className="space-y-2">
                  {Array.from(remoteInputs.entries()).map(([userId, event]) => (
                    <div key={userId} className="flex items-center gap-2 text-[10px] font-mono">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground">{userId.slice(0, 8)}...</span>
                      <span className="text-primary ml-auto">
                        {event.data?.buttons?.a && "A "}
                        {event.data?.buttons?.b && "B "}
                        {event.data?.buttons?.x && "X "}
                        {event.data?.buttons?.y && "Y "}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-white/10 rounded-lg p-4">
              <h3 className="font-mono text-sm text-white mb-2">What's Next?</h3>
              <ul className="text-[11px] text-muted-foreground space-y-1">
                <li>→ MicroPython support for Pico W</li>
                <li>→ Haptic feedback integration</li>
                <li>→ Controller mapping profiles</li>
                <li>→ Record & playback input sequences</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
