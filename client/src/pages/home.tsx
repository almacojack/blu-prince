import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Cpu, Layers, ShoppingBag, Palette, TrendingUp, Terminal, Code, Zap } from "lucide-react";
import heroImage from "@assets/generated_images/retro_futuristic_data_cartridge.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const colorMap: Record<string, { bg: string, text: string, border: string, glow: string }> = {
  primary: { bg: "bg-primary", text: "text-primary", border: "border-primary", glow: "shadow-primary/50" },
  secondary: { bg: "bg-secondary", text: "text-secondary", border: "border-secondary", glow: "shadow-secondary/50" },
  accent: { bg: "bg-accent", text: "text-accent", border: "border-accent", glow: "shadow-accent/50" },
  "chart-3": { bg: "bg-chart-3", text: "text-chart-3", border: "border-chart-3", glow: "shadow-chart-3/50" },
};

const EcosystemCard = ({ title, description, icon: Icon, colorKey, domain, status, link }: any) => {
  const colors = colorMap[colorKey] || colorMap.primary;
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="group relative h-full"
    >
      <div className={`absolute -inset-0.5 rounded-lg opacity-25 blur transition duration-500 group-hover:opacity-75 ${colors.bg}`} />
      <Card className="relative h-full flex flex-col glass-panel border-white/10 bg-black/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className={`p-2 rounded-md ${colors.bg}/10 ${colors.text}`}>
              <Icon size={24} />
            </div>
            <Badge variant="outline" className="font-mono text-xs border-white/20">
              {status}
            </Badge>
          </div>
          <CardTitle className="mt-4 font-mono text-xl tracking-tight">{title}</CardTitle>
          <CardDescription className="text-sm font-sans">{domain}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </CardContent>
        <CardFooter>
          <Link href={link || "#"}>
            <Button variant="ghost" className="w-full group-hover:bg-white/5 font-mono text-xs justify-between cursor-pointer">
              <span>ACCESS TERMINAL</span>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default function Home() {
  const [hoveredCart, setHoveredCart] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-secondary/10 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded border border-primary/50 flex items-center justify-center">
            <Cpu className="text-primary" />
          </div>
          <div>
            <h1 className="font-pixel text-lg tracking-tight text-white">TingOs</h1>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Platform v1.0.0</p>
          </div>
        </div>
        <div className="hidden md:flex gap-8 font-mono text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">DOCS</a>
          <a href="#" className="hover:text-primary transition-colors">RUNTIME</a>
          <a href="#" className="hover:text-primary transition-colors">MARKET</a>
        </div>
        <Button variant="outline" className="font-mono text-xs border-primary/50 text-primary hover:bg-primary/10">
          CONNECT WALLET
        </Button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">SYSTEM ONLINE</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Universal</span>
              <br />
              <span className="font-pixel text-4xl md:text-5xl text-primary mt-4 block text-glow">STATE MACHINE</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8 font-light">
              The operating system for business logic. Deploy interoperable 
              <span className="text-secondary font-mono mx-1">TOSS cartridges</span> 
              across any device, from microcontrollers to the web.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/blu-prince">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-mono h-12 cursor-pointer">
                  <Terminal className="mr-2 h-4 w-4" />
                  LAUNCH DESIGNER
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/5 font-mono h-12">
                READ WHITE PAPER
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center items-center"
          >
            <div className="relative w-full max-w-[500px] aspect-square">
              {/* Spinning ring effect */}
              <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
              <div className="absolute inset-10 border border-secondary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
              
              <img 
                src={heroImage} 
                alt="TOSS Cartridge" 
                className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_50px_rgba(124,58,237,0.3)] hover:scale-105 transition-transform duration-500"
              />
              
              {/* Floating Interface Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-20 p-4 rounded-lg bg-black/80 backdrop-blur border border-primary/30 max-w-[200px]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-[10px] font-mono text-primary">CART_DETECTED</span>
                </div>
                <div className="space-y-1">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[70%]" />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>LOADING</span>
                    <span>70%</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="relative z-10 bg-black/40 border-t border-white/5 backdrop-blur-sm py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-4 font-pixel text-white/90">Ecosystem</h2>
              <p className="text-muted-foreground max-w-lg">
                A suite of tools and marketplaces built on the TingOs protocol.
                Design, trade, and deploy cartridges seamlessly.
              </p>
            </div>
            <Button variant="link" className="text-primary font-mono group">
              VIEW ALL NODES <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <EcosystemCard 
              title="Blu-Prince"
              domain="blu-prince.com"
              description="No-code FSM design environment. Build robust TOSS cartridges with buttery smooth visual tools."
              icon={Layers}
              colorKey="primary" 
              status="BETA"
              link="/blu-prince"
            />
            <EcosystemCard 
              title="Unwanted"
              domain="unwanted.ad"
              description="Auction protocol for misfit toys and unique items. One cartridge per listing."
              icon={ShoppingBag}
              colorKey="secondary"
              status="LIVE"
              link="/unwanted"
            />
            <EcosystemCard 
              title="Artsy"
              domain="artsy.sale"
              description="Curated marketplace for digital and physical art, powered by verifiable TOSS provenance."
              icon={Palette}
              colorKey="accent" 
              status="COMING SOON"
              link="/artsy"
            />
            <EcosystemCard 
              title="Coins.rip"
              domain="coins.rip"
              description="Crypto swing trade visualizer. Track your favorite coins with custom tabular displays."
              icon={TrendingUp}
              colorKey="chart-3"
              status="DEV"
              link="/coins"
            />
          </div>
        </div>
      </section>

      {/* Features/Tech Section */}
      <section className="relative z-10 py-24 container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Deterministic Execution</h3>
            <p className="text-sm text-muted-foreground">
              Guaranteed behavior across all runtime environments, from 320x240 embedded screens to web browsers.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Code className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Portable Payload</h3>
            <p className="text-sm text-muted-foreground">
              TOSS files are self-contained archives defining state, logic, and assets in a compact format.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Cpu className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">Universal Runtime</h3>
            <p className="text-sm text-muted-foreground">
              Run anywhere: Micropython, LILYGO T-Decks, CLI TUI, or secure REST/WS API access.
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-12 bg-black/60">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs font-mono text-muted-foreground">
            © 2026 TINGOS PLATFORM. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-muted-foreground hover:text-white transition-colors"><span className="sr-only">GitHub</span>GitHub</a>
            <a href="#" className="text-muted-foreground hover:text-white transition-colors"><span className="sr-only">Twitter</span>Twitter</a>
            <a href="#" className="text-muted-foreground hover:text-white transition-colors"><span className="sr-only">Discord</span>Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
