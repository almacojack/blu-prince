import { Link } from "wouter";
import { ArrowLeft, Search, Heart, Share2, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import abstractArtImage from "@assets/generated_images/abstract_digital_art.png";

const ARTWORKS = [
  {
    id: 1,
    title: "Neon Genesis 01",
    artist: "@digital_dreamer",
    price: "2.5 ETH",
    image: abstractArtImage,
    verified: true
  },
  {
    id: 2,
    title: "Void Structure",
    artist: "@architect_null",
    price: "1.8 ETH",
    image: null,
    verified: true
  },
  {
    id: 3,
    title: "Chromesthetic III",
    artist: "@color_theory",
    price: "0.5 ETH",
    image: null,
    verified: false
  },
  {
    id: 4,
    title: "Digital Decay",
    artist: "@entropy_loop",
    price: "4.2 ETH",
    image: null,
    verified: true
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
            <Search className="w-5 h-5 text-muted-foreground hover:text-white cursor-pointer" />
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
            Featured Collection
          </Badge>
          <h1 className="text-5xl md:text-7xl font-serif mb-6">Digital Provenance</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            Verified artistic expression secured by TOSS cartridges. 
            Experience ownership in the post-digital age.
          </p>
        </header>

        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          {ARTWORKS.map((art, index) => (
            <div key={art.id} className={`group cursor-pointer ${index % 2 === 1 ? 'md:mt-24' : ''}`}>
              <div className="relative aspect-[4/5] bg-[#1a1a1a] overflow-hidden mb-6">
                 {art.image ? (
                   <img 
                     src={art.image} 
                     alt={art.title}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#222]">
                     <span className="font-serif italic text-white/10 text-4xl">Art.</span>
                   </div>
                 )}
                 
                 <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                   <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white text-black hover:bg-white/90">
                     <Heart className="w-4 h-4" />
                   </Button>
                   <Button size="icon" variant="secondary" className="rounded-full h-10 w-10 bg-white text-black hover:bg-white/90">
                     <Share2 className="w-4 h-4" />
                   </Button>
                 </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-serif mb-1 group-hover:underline decoration-1 underline-offset-4">{art.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{art.artist}</span>
                    {art.verified && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-lg font-light">{art.price}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Current Bid</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
