import { Link } from "wouter";
import { ArrowLeft, Search, Heart, Share2, Info, CheckCircle2, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import abstractArtImage from "@assets/generated_images/abstract_digital_art.png";

// Artsy View Model - Pure Metadata
// Logic lives in the TOSS Engine, we just display the state.
interface ArtCartridge {
  id: string;
  toss_manifest: {
    title: string;
    artist: string;
    description: string;
  };
  state_ctx: {
    current_bid: string;
    status: "AUCTION" | "SOLD" | "EXHIBITION";
    verified_owner: string;
  };
  assets: {
    primary_view: string | null;
  };
}

const MOCK_GALLERY: ArtCartridge[] = [
  {
    id: "1",
    toss_manifest: {
      title: "Neon Genesis 01",
      artist: "@digital_dreamer",
      description: "A study in light and recursive geometry."
    },
    state_ctx: {
      current_bid: "2.5 ETH",
      status: "AUCTION",
      verified_owner: "0x71C...9A21"
    },
    assets: {
      primary_view: abstractArtImage
    }
  },
  {
    id: "2",
    toss_manifest: {
      title: "Void Structure",
      artist: "@architect_null",
      description: "Nullspace visualization algorithm."
    },
    state_ctx: {
      current_bid: "1.8 ETH",
      status: "SOLD",
      verified_owner: "0x33B...11C2"
    },
    assets: {
      primary_view: null
    }
  },
  {
    id: "3",
    toss_manifest: {
      title: "Chromesthetic III",
      artist: "@color_theory",
      description: "Sound to color mapping generator."
    },
    state_ctx: {
      current_bid: "0.5 ETH",
      status: "EXHIBITION",
      verified_owner: "0xTNG...ART1"
    },
    assets: {
      primary_view: null
    }
  }
];

export default function Artsy() {
  return (
    <div className="min-h-screen bg-[#111] text-white font-sans selection:bg-pink-500/30">
      {/* Elegant minimal nav */}
      <nav className="sticky top-0 z-50 bg-[#111]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
               <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                 <ArrowLeft className="w-4 h-4" />
               </div>
            </Link>
            <span className="font-serif text-2xl tracking-tight italic">artsy.sale</span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm tracking-wide text-muted-foreground">
            <a href="#" className="hover:text-white transition-colors">CURATED</a>
            <a href="#" className="hover:text-white transition-colors">ARTISTS</a>
            <a href="#" className="hover:text-white transition-colors">EXHIBITIONS</a>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-white/20 text-xs font-mono text-muted-foreground">
              CLIENT_MODE: READ_ONLY
            </Badge>
            <Button variant="outline" className="rounded-full border-white/20 hover:bg-white hover:text-black transition-all">
              Connect Wallet
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        {/* Featured Header */}
        <header className="mb-24 text-center">
          <Badge variant="outline" className="mb-6 rounded-full px-4 py-1 border-white/20 text-xs tracking-widest uppercase">
            TingOs Registry Collection
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Digital Provenance</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Verified artistic expression secured by TOSS cartridges. 
            Data stored as immutable JSONB payloads.
          </p>
        </header>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          {MOCK_GALLERY.map((art, index) => (
            <div key={art.id} className={`group cursor-pointer ${index % 2 === 1 ? 'md:mt-24' : ''}`}>
              <div className="relative aspect-[4/5] bg-[#1a1a1a] overflow-hidden mb-6">
                 {art.assets.primary_view ? (
                   <img 
                     src={art.assets.primary_view} 
                     alt={art.toss_manifest.title}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#222]">
                     <span className="font-serif italic text-white/10 text-4xl">Art.</span>
                   </div>
                 )}
                 
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white text-black hover:bg-white/90" title="View Payload">
                         <FileJson className="w-4 h-4" />
                       </Button>
                     </DialogTrigger>
                     <DialogContent className="bg-[#111] border-white/10 text-white font-mono">
                       <DialogHeader>
                         <DialogTitle>TOSS Payload Inspection</DialogTitle>
                       </DialogHeader>
                       <div className="p-4 bg-black/50 rounded border border-white/10 text-xs text-green-400 overflow-auto max-h-[400px]">
                         <pre>{JSON.stringify(art, null, 2)}</pre>
                       </div>
                     </DialogContent>
                   </Dialog>
                   <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white text-black hover:bg-white/90">
                     <Heart className="w-4 h-4" />
                   </Button>
                 </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif mb-1 group-hover:underline decoration-1 underline-offset-4">{art.toss_manifest.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{art.toss_manifest.artist}</span>
                    <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-light">{art.state_ctx.current_bid}</span>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border-none">
                    {art.state_ctx.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

