import { Link } from "wouter";
import { ArrowLeft, Filter, Search, ShoppingBag, Tag, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import misfitToyImage from "@assets/generated_images/cyberpunk_robot_toy.png";

const MOCK_ITEMS = [
  {
    id: 1,
    title: "Glitch Robot 9000",
    price: "45.00",
    bids: 12,
    timeLeft: "2h 45m",
    image: misfitToyImage,
    tags: ["Toy", "Vintage", "Broken"]
  },
  {
    id: 2,
    title: "Unfinished Novel Manuscript",
    price: "15.00",
    bids: 3,
    timeLeft: "5h 20m",
    image: null,
    tags: ["Document", "Mystery"]
  },
  {
    id: 3,
    title: "Cursed Lava Lamp",
    price: "88.00",
    bids: 24,
    timeLeft: "12m",
    image: null,
    tags: ["Decor", "Haunted"]
  },
  {
    id: 4,
    title: "Leftover Cable Box",
    price: "5.00",
    bids: 0,
    timeLeft: "1d 4h",
    image: null,
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

          <div className="hidden md:flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search for misfits..." 
                className="pl-9 bg-white/5 border-white/10 focus-visible:ring-secondary"
              />
            </div>
          </div>

          <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-mono text-xs">
            POST ITEM
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 space-y-8">
            <div>
              <h3 className="text-sm font-mono font-bold text-white mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> FILTERS
              </h3>
              <div className="space-y-2">
                {["Toys", "Electronics", "Oddities", "Broken", "Haunted"].map((category) => (
                  <div key={category} className="flex items-center gap-2">
                    <div className="w-4 h-4 border border-white/20 rounded cursor-pointer hover:border-secondary" />
                    <span className="text-sm text-muted-foreground hover:text-white cursor-pointer">{category}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <h4 className="text-xs font-bold text-secondary mb-2">PRO TIP</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All transactions are verified via TOSS cartridges. Ensure your wallet is connected before bidding.
              </p>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Live Auctions</h2>
              <div className="text-xs text-muted-foreground font-mono">
                SHOWING {MOCK_ITEMS.length} RESULTS
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_ITEMS.map((item) => (
                <Card key={item.id} className="bg-white/[0.02] border-white/10 overflow-hidden hover:border-secondary/50 transition-colors group cursor-pointer">
                  <div className="aspect-[4/3] bg-black relative overflow-hidden">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <ShoppingBag className="w-12 h-12 text-white/10" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-black/80 backdrop-blur text-white border-white/10 font-mono">
                      {item.timeLeft}
                    </Badge>
                  </div>
                  
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white truncate pr-4">{item.title}</h3>
                    </div>
                    <div className="flex gap-2 flex-wrap">
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
                        <span className="text-[10px] text-muted-foreground block uppercase">Current Bid</span>
                        <span className="text-lg font-mono text-secondary">${item.price}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block uppercase">{item.bids} Bids</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10">
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
