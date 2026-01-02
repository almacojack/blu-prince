import { Link } from "wouter";
import { ArrowLeft, Filter, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import misfitToyImage from "@assets/generated_images/cyberpunk_robot_toy.png";

// Minimal Cartridge Data (The View Model)
interface CartridgeListing {
  id: string;
  cartridge_name: string;
  current_state: string; // e.g., "BIDDING_OPEN", "SOLD", "PENDING"
  price_ctx: number; // Value from context
  image_url: string | null;
  tags: string[];
}

const MOCK_CARTRIDGES: CartridgeListing[] = [
  {
    id: "1",
    cartridge_name: "Glitch Robot 9000",
    current_state: "2h 45m LEFT",
    price_ctx: 45.00,
    image_url: misfitToyImage,
    tags: ["Toy", "Vintage", "Broken"]
  },
  {
    id: "2",
    cartridge_name: "Unfinished Novel",
    current_state: "5h 20m LEFT",
    price_ctx: 15.00,
    image_url: null,
    tags: ["Document", "Mystery"]
  },
  {
    id: "3",
    cartridge_name: "Cursed Lava Lamp",
    current_state: "12m LEFT",
    price_ctx: 88.00,
    image_url: null,
    tags: ["Decor", "Haunted"]
  },
  {
    id: "4",
    cartridge_name: "Leftover Cable Box",
    current_state: "1d 4h LEFT",
    price_ctx: 5.00,
    image_url: null,
    tags: ["Tech", "Junk"]
  }
];

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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_CARTRIDGES.map((item) => (
                <Card key={item.id} className="bg-white/[0.02] border-white/10 overflow-hidden hover:border-secondary/50 transition-colors group cursor-pointer">
                  <div className="aspect-[4/3] bg-black relative overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.cartridge_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <ShoppingBag className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white border-white/10 font-mono">
                      {item.current_state}
                    </Badge>
                  </div>
                  
                  <CardHeader className="p-4 pb-2">
                    <h3 className="font-bold text-white truncate font-mono text-sm">{item.cartridge_name}</h3>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {item.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2">
                    <div className="flex justify-between items-end mt-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase">CTX.PRICE</span>
                        <span className="text-lg font-mono text-secondary">${item.price_ctx}</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 group-hover:bg-secondary group-hover:text-black transition-colors">
                      LOAD CARTRIDGE
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

