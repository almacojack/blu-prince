import { Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Filter, Search, ShoppingBag, Clock, Flame, Skull, AlertTriangle, Sparkles, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import misfitToyImage from "@assets/generated_images/cyberpunk_robot_toy.png";

interface CartridgeListing {
  id: string;
  cartridge_name: string;
  description: string;
  endTime: number;
  price_ctx: number;
  bids: number;
  image_url: string | null;
  tags: string[];
  urgency: "hot" | "warm" | "cold";
}

const now = Date.now();
const MOCK_CARTRIDGES: CartridgeListing[] = [
  {
    id: "1",
    cartridge_name: "Glitch Robot 9000",
    description: "Eye flickers every 3.7 seconds. Left arm detached. Still dreams of electric sheep.",
    endTime: now + 9900000,
    price_ctx: 45.00,
    bids: 12,
    image_url: misfitToyImage,
    tags: ["Toy", "Vintage", "Broken"],
    urgency: "hot"
  },
  {
    id: "2",
    cartridge_name: "Unfinished Novel",
    description: "387 pages of a murder mystery. Author vanished before chapter 12. Ending unknown.",
    endTime: now + 19200000,
    price_ctx: 15.00,
    bids: 3,
    image_url: null,
    tags: ["Document", "Mystery", "Incomplete"],
    urgency: "cold"
  },
  {
    id: "3",
    cartridge_name: "Cursed Lava Lamp",
    description: "Former owner claims it predicts stock crashes. Glows red before recessions.",
    endTime: now + 720000,
    price_ctx: 88.00,
    bids: 27,
    image_url: null,
    tags: ["Decor", "Haunted", "Prophetic"],
    urgency: "hot"
  },
  {
    id: "4",
    cartridge_name: "Leftover Cable Box",
    description: "Still receives channels that no longer exist. Sometimes shows news from tomorrow.",
    endTime: now + 100800000,
    price_ctx: 5.00,
    bids: 1,
    image_url: null,
    tags: ["Tech", "Anomalous"],
    urgency: "cold"
  },
  {
    id: "5",
    cartridge_name: "Taxidermied Furby",
    description: "Eyes still move when no one's watching. Batteries removed in 2003. Voice box sealed.",
    endTime: now + 3600000,
    price_ctx: 156.00,
    bids: 41,
    image_url: null,
    tags: ["Toy", "Haunted", "90s"],
    urgency: "hot"
  },
  {
    id: "6",
    cartridge_name: "Dial-Up Modem (Screaming)",
    description: "Makes the sound even when unplugged. Previous owner wore earplugs to sleep.",
    endTime: now + 54000000,
    price_ctx: 23.00,
    bids: 8,
    image_url: null,
    tags: ["Tech", "Loud", "Vintage"],
    urgency: "warm"
  },
  {
    id: "7",
    cartridge_name: "Grandfather Clock (Runs Backwards)",
    description: "Perfect condition. Perfect mechanism. Just counts down. To what, we don't know.",
    endTime: now + 172800000,
    price_ctx: 444.00,
    bids: 15,
    image_url: null,
    tags: ["Decor", "Anomalous", "Antique"],
    urgency: "warm"
  },
  {
    id: "8",
    cartridge_name: "VHS of Static",
    description: "6 hours of static. Sometimes faces appear. Viewers report deja vu for weeks.",
    endTime: now + 7200000,
    price_ctx: 31.00,
    bids: 19,
    image_url: null,
    tags: ["Media", "Cursed", "VHS"],
    urgency: "hot"
  }
];

function CountdownTimer({ endTime, urgency }: { endTime: number; urgency: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  
  useEffect(() => {
    const update = () => {
      const diff = endTime - Date.now();
      if (diff <= 0) {
        setTimeLeft("ENDED");
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      
      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${mins}m`);
      else setTimeLeft(`${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  
  const isUrgent = urgency === "hot";
  return (
    <div className={`flex items-center gap-1.5 font-mono text-xs ${isUrgent ? 'text-red-400 animate-pulse' : 'text-muted-foreground'}`}>
      <Clock className="w-3 h-3" />
      {timeLeft}
      {isUrgent && <Flame className="w-3 h-3 text-orange-500" />}
    </div>
  );
}

export default function Unwanted() {
  return (
    <div className="min-h-screen bg-[#050505] text-foreground font-sans">
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-mono">BACK TO HUB</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ShoppingBag className="text-secondary" />
              <span className="font-pixel text-lg text-white tracking-tighter">unwanted.ad</span>
            </div>
          </div>
          
          {/* This input just filters the list locally. No complex logic. */}
          <div className="hidden md:flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Filter cartridges..." 
                className="pl-9 bg-white/5 border-white/10 focus-visible:ring-secondary font-mono text-xs"
              />
            </div>
          </div>

          <div className="text-xs font-mono text-muted-foreground">
            VIEWING MODE: CLIENT_ONLY
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar - Just visual filters, no logic implied */}
          <div className="w-full md:w-64 space-y-8">
            <div>
              <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> CARTRIDGE TYPES
              </h3>
              <div className="space-y-2">
                {["Toys", "Electronics", "Oddities", "Broken", "Haunted"].map((category) => (
                  <div key={category} className="flex items-center gap-2 group cursor-pointer">
                    <div className="w-4 h-4 border border-white/20 rounded group-hover:border-secondary transition-colors" />
                    <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">{category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Grid of Cartridges */}
          <div className="flex-1">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {MOCK_CARTRIDGES.map((item) => (
                <Card key={item.id} className="bg-white/[0.02] border-white/10 overflow-hidden hover:border-secondary/50 transition-colors group cursor-pointer" data-testid={`card-auction-${item.id}`}>
                  <div className="aspect-[4/3] bg-black relative overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.cartridge_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02]">
                        {item.tags.includes("Haunted") ? (
                          <Skull className="w-12 h-12 text-white/10" />
                        ) : item.tags.includes("Anomalous") ? (
                          <AlertTriangle className="w-12 h-12 text-white/10" />
                        ) : (
                          <Package className="w-12 h-12 text-white/10" />
                        )}
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <CountdownTimer endTime={item.endTime} urgency={item.urgency} />
                    </div>
                    {item.urgency === "hot" && (
                      <Badge className="absolute top-3 left-3 bg-red-500/90 text-white border-none text-[10px]">
                        HOT
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="p-4 pb-2">
                    <h3 className="font-bold text-white truncate font-mono text-sm">{item.cartridge_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {item.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">CURRENT BID</span>
                        <span className="text-lg font-mono text-secondary">${item.price_ctx.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block uppercase">BIDS</span>
                        <span className="text-sm font-mono text-white">{item.bids}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 group-hover:bg-secondary group-hover:text-black transition-colors" data-testid={`button-bid-${item.id}`}>
                      PLACE BID
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

