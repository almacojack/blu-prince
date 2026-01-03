import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Users, Briefcase, Terminal, Layers, Hexagon, Code, Cpu, Flame, Snowflake, Droplets, Wind, Zap, Box, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimulatorDisplay } from "@/components/SimulatorDisplay";

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
              <span>EXPLORE</span>
              <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-secondary/10 blur-[120px] rounded-full translate-y-1/2 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-12 pb-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-muted-foreground">MODELING AGENCY • v1.0.0</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Simulate.</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/80 to-white/40">Model.</span>
              <br />
              <span className="font-pixel text-3xl md:text-4xl text-primary mt-2 block text-glow">DEPLOY</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6 font-light">
              Your <span className="text-secondary font-semibold">modeling agency</span> for powerful simulation tools.
              Create physics-driven experiences with fire, ice, water, and wind forces.
              Deploy <span className="text-primary font-mono">TOSS cartridges</span> anywhere.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-red-400" />
                  <Snowflake className="w-4 h-4 text-blue-400" />
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <Wind className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-xs text-muted-foreground">Environmental Forces</span>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Box className="w-4 h-4 text-[#daa520]" />
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <span className="text-xs text-muted-foreground">Hitbox Collisions</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/editor">
                <Button size="lg" className="min-h-11 bg-secondary hover:bg-secondary/90 text-black font-mono cursor-pointer border-2 border-transparent hover:border-white/20 transition-all touch-manipulation" data-testid="button-open-editor">
                  <Hexagon className="mr-2 h-4 w-4" />
                  BLU-PRINCE EDITOR
                </Button>
              </Link>
              <Link href="/runtime">
                <Button size="lg" className="min-h-11 bg-primary/10 hover:bg-primary/20 text-primary font-mono cursor-pointer border border-primary/50 touch-manipulation" data-testid="button-launch-simulator">
                  <Terminal className="mr-2 h-4 w-4" />
                  SIMULATOR
                </Button>
              </Link>
              <Link href="/playground">
                <Button size="lg" className="min-h-11 bg-[#7fff00] hover:bg-[#9fff33] text-black font-mono cursor-pointer border-2 border-[#7fff00] hover:border-white/40 transition-all touch-manipulation shadow-[0_0_20px_#7fff00aa] hover:shadow-[0_0_30px_#7fff00cc]" data-testid="button-playground">
                  <Play className="mr-2 h-4 w-4" />
                  PLAYGROUND
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <SimulatorDisplay showControls={true} autoAnimate={true} />
          </motion.div>
        </div>
      </section>

      {/* Core Pillars */}
      <section className="relative z-10 py-12 container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Powerful Simulation Modeling</h2>
          <p className="text-muted-foreground">Forces, physics, and declarative side effects</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 hover:border-red-500/40 transition-colors">
            <Flame className="w-8 h-8 text-red-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Fire Forces</h3>
            <p className="text-sm text-muted-foreground">
              Temperature-sensitive objects melt, burn, or trigger side effects on contact.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
            <Snowflake className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Ice Forces</h3>
            <p className="text-sm text-muted-foreground">
              Freeze points trigger state changes. Objects can shatter or become brittle.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
            <Droplets className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Water Forces</h3>
            <p className="text-sm text-muted-foreground">
              Buoyancy simulation - objects sink, float, or achieve neutral density.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 transition-colors">
            <Wind className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Wind Forces</h3>
            <p className="text-sm text-muted-foreground">
              Aerodynamic drag and lift coefficients. Push, pull, and flutter effects.
            </p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Box className="w-8 h-8 text-[#daa520] mb-4" />
            <h3 className="text-lg font-bold mb-2">Hitbox Collisions</h3>
            <p className="text-sm text-muted-foreground">
              Force emitters have hitboxes. Objects detect overlap and fire events to targets.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Zap className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Side Effects</h3>
            <p className="text-sm text-muted-foreground">
              Declarative callbacks: onMelt, onFreeze, onSubmerge. Source + target + force = action.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <Gamepad2 className="w-8 h-8 text-violet-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Controller First</h3>
            <p className="text-sm text-muted-foreground">
              Zero-config gamepad detection. Haptic feedback, visual bindings, cross-platform.
            </p>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section className="relative z-10 bg-black/40 border-t border-white/5 backdrop-blur-sm py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl font-bold mb-4 font-pixel text-white/90">Ecosystem</h2>
              <p className="text-muted-foreground max-w-lg">
                Tools built on the TingOs Engine. From architecture to marketplaces.
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
              description="The Architect's IDE. XCode-grade visual tools for designing TOSS cartridges."
              icon={Hexagon}
              colorKey="primary" 
              status="BETA"
              link="/blu-prince"
            />
            <EcosystemCard 
              title="Unwanted"
              domain="unwanted.ad"
              description="A marketplace powered by TingOs cartridges. Auction your misfit toys."
              icon={Layers}
              colorKey="secondary"
              status="LIVE"
              link="/unwanted"
            />
            <EcosystemCard 
              title="Artsy"
              domain="artsy.sale"
              description="Premium digital provenance. High-fidelity rendering of art assets."
              icon={Cpu}
              colorKey="accent" 
              status="COMING SOON"
              link="/artsy"
            />
            <EcosystemCard 
              title="Coins.rip"
              domain="coins.rip"
              description="Real-time data visualization. A pure view layer over TingOs streams."
              icon={Code}
              colorKey="chart-3"
              status="DEV"
              link="/coins"
            />
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-12 bg-black/60">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs font-mono text-muted-foreground">
            © 2026 TINGOS PLATFORM. POWERED BY SVELTE FLOW & THREEJS.
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