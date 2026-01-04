import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Gamepad2, Users, Briefcase, Terminal, Layers, Hexagon, Code, Cpu, Flame, Snowflake, Droplets, Wind, Zap, Box, Play, Magnet, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimulatorDisplay } from "@/components/SimulatorDisplay";
import { HeroCarousel } from "@/components/HeroCarousel";

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
      <section className="relative z-10 container mx-auto px-6 pt-8 pb-12">
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-8 items-center">
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

          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <HeroCarousel />
          </motion.div>
        </div>

        {/* Navigation Dock - Polished horizontal bar below carousel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8"
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Glow effect behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 via-primary/20 to-purple-500/20 blur-2xl opacity-60" />
            
            {/* The dock itself */}
            <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Link href="/editor">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 border border-secondary/30 hover:border-secondary hover:bg-secondary/30 transition-all cursor-pointer overflow-hidden"
                    data-testid="button-open-editor"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Hexagon className="w-6 h-6 sm:w-7 sm:h-7 text-secondary mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-secondary/90 group-hover:text-secondary relative z-10 text-center leading-tight">
                      BLU-PRINCE
                      <span className="hidden sm:inline"> EDITOR</span>
                    </span>
                  </motion.div>
                </Link>

                <Link href="/runtime">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 hover:border-primary hover:bg-primary/30 transition-all cursor-pointer overflow-hidden"
                    data-testid="button-launch-simulator"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Terminal className="w-6 h-6 sm:w-7 sm:h-7 text-primary mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-primary/90 group-hover:text-primary relative z-10">
                      SIMULATOR
                    </span>
                  </motion.div>
                </Link>

                <Link href="/playground">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-[#7fff00]/20 to-[#7fff00]/5 border border-[#7fff00]/30 hover:border-[#7fff00] hover:bg-[#7fff00]/30 transition-all cursor-pointer overflow-hidden"
                    data-testid="button-playground"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#7fff00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 text-[#7fff00] mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-[#7fff00]/90 group-hover:text-[#7fff00] relative z-10">
                      PLAYGROUND
                    </span>
                  </motion.div>
                </Link>

                <Link href="/widgets">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative flex flex-col items-center justify-center p-4 sm:p-5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-400/30 hover:border-purple-400 hover:bg-purple-500/30 transition-all cursor-pointer overflow-hidden"
                    data-testid="button-components-showcase"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400 mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-mono font-bold text-purple-400/90 group-hover:text-purple-400 relative z-10 text-center leading-tight">
                      <span className="sm:hidden">WIDGETS</span>
                      <span className="hidden sm:inline">COMPONENTS</span>
                    </span>
                  </motion.div>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Core Pillars - Comic Book Style Forces */}
      <section className="relative z-10 py-16 container mx-auto px-6 overflow-hidden">
        {/* Chaotic background energy */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/20 blur-[80px] animate-pulse" />
          <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-blue-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-green-500/15 blur-[90px] animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-purple-500/20 blur-[70px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Chaotic Physics Playground
          </h2>
          <p className="text-muted-foreground text-lg">Forces, springs, magnets — everything bounces, stretches, and explodes</p>
        </div>

        {/* Primary Forces - 6 columns with chaotic styling */}
        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {/* Fire */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="group p-4 rounded-2xl bg-gradient-to-br from-red-600/30 via-orange-500/20 to-yellow-500/10 border-2 border-red-500/40 hover:border-red-400 transition-all shadow-lg hover:shadow-red-500/30"
          >
            <div className="relative">
              <Flame className="w-10 h-10 text-red-400 mb-3 group-hover:animate-bounce" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-ping opacity-75" />
            </div>
            <h3 className="text-base font-bold mb-1 text-red-300">FIRE</h3>
            <p className="text-xs text-red-200/60">Melt. Burn. Ignite.</p>
          </motion.div>

          {/* Ice */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="group p-4 rounded-2xl bg-gradient-to-br from-blue-600/30 via-cyan-500/20 to-white/10 border-2 border-blue-500/40 hover:border-blue-400 transition-all shadow-lg hover:shadow-blue-500/30"
          >
            <div className="relative">
              <Snowflake className="w-10 h-10 text-blue-400 mb-3 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-base font-bold mb-1 text-blue-300">ICE</h3>
            <p className="text-xs text-blue-200/60">Freeze. Shatter. Crack.</p>
          </motion.div>

          {/* Water */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -1 }}
            className="group p-4 rounded-2xl bg-gradient-to-br from-cyan-600/30 via-teal-500/20 to-emerald-500/10 border-2 border-cyan-500/40 hover:border-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/30"
          >
            <Droplets className="w-10 h-10 text-cyan-400 mb-3 group-hover:translate-y-1 transition-transform" />
            <h3 className="text-base font-bold mb-1 text-cyan-300">WATER</h3>
            <p className="text-xs text-cyan-200/60">Sink. Float. Splash.</p>
          </motion.div>

          {/* Wind */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 1.5 }}
            className="group p-4 rounded-2xl bg-gradient-to-br from-green-600/30 via-emerald-500/20 to-teal-500/10 border-2 border-green-500/40 hover:border-green-400 transition-all shadow-lg hover:shadow-green-500/30"
          >
            <Wind className="w-10 h-10 text-green-400 mb-3 group-hover:translate-x-2 transition-transform" />
            <h3 className="text-base font-bold mb-1 text-green-300">WIND</h3>
            <p className="text-xs text-green-200/60">Push. Pull. Flutter.</p>
          </motion.div>

          {/* Magnet */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2.5 }}
            className="group p-4 rounded-2xl bg-gradient-to-br from-purple-600/30 via-fuchsia-500/20 to-pink-500/10 border-2 border-purple-500/40 hover:border-purple-400 transition-all shadow-lg hover:shadow-purple-500/30"
          >
            <div className="relative">
              <Magnet className="w-10 h-10 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
              <div className="absolute top-0 left-6 w-2 h-2 bg-fuchsia-400 rounded-full animate-pulse" />
              <div className="absolute top-2 left-8 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>
            <h3 className="text-base font-bold mb-1 text-purple-300">MAGNET</h3>
            <p className="text-xs text-purple-200/60">Attract. Repel. Orbit.</p>
          </motion.div>

          {/* Spring */}
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2.5 }}
            className="group p-4 rounded-2xl bg-gradient-to-br from-yellow-600/30 via-amber-500/20 to-orange-500/10 border-2 border-yellow-500/40 hover:border-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/30"
          >
            <Link2 className="w-10 h-10 text-yellow-400 mb-3 group-hover:animate-bounce" />
            <h3 className="text-base font-bold mb-1 text-yellow-300">SPRING</h3>
            <p className="text-xs text-yellow-200/60">Stretch. Bounce. Snap.</p>
          </motion.div>
        </div>

        {/* Secondary Features - 3 columns */}
        <div className="grid md:grid-cols-3 gap-5">
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 hover:border-amber-400/50 transition-all"
          >
            <Box className="w-8 h-8 text-amber-400 mb-3" />
            <h3 className="text-lg font-bold mb-2">Hitbox Collisions</h3>
            <p className="text-sm text-muted-foreground">
              Force emitters with hitboxes. Overlap detection fires events to targets.
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/30 hover:border-yellow-400/50 transition-all"
          >
            <Zap className="w-8 h-8 text-yellow-400 mb-3" />
            <h3 className="text-lg font-bold mb-2">Declarative Side Effects</h3>
            <p className="text-sm text-muted-foreground">
              onMelt, onFreeze, onSubmerge — source + target + force = action.
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -3 }}
            className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/30 hover:border-violet-400/50 transition-all"
          >
            <Gamepad2 className="w-8 h-8 text-violet-400 mb-3" />
            <h3 className="text-lg font-bold mb-2">Controller First</h3>
            <p className="text-sm text-muted-foreground">
              Zero-config gamepad detection. Haptic feedback, cross-platform bindings.
            </p>
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

      {/* Quick Links Navigation */}
      <section className="relative z-10 py-8 bg-black/30 border-t border-white/5">
        <div className="container mx-auto px-6">
          <h3 className="text-sm font-mono text-muted-foreground mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            QUICK NAVIGATION
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { path: "/", label: "Home", icon: "🏠" },
              { path: "/blu-prince", label: "Blu-Prince", icon: "👑" },
              { path: "/statechart", label: "3D Statechart", icon: "🎮" },
              { path: "/editor", label: "Editor", icon: "✏️" },
              { path: "/controller", label: "Controller", icon: "🕹️" },
              { path: "/library", label: "Library", icon: "📚" },
              { path: "/runtime", label: "Simulator", icon: "⚡" },
              { path: "/playground", label: "Playground", icon: "🎨" },
              { path: "/data-tables", label: "Data Tables", icon: "📊" },
              { path: "/vault", label: "Vault", icon: "🔐" },
              { path: "/utilities", label: "Utilities", icon: "🔧" },
              { path: "/unwanted", label: "unwanted.ad", icon: "🧸" },
              { path: "/artsy", label: "artsy.sale", icon: "🎭" },
              { path: "/coins", label: "coins.rip", icon: "💰" },
            ].map(({ path, label, icon }) => (
              <Link key={path} href={path}>
                <div 
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group"
                  data-testid={`link-nav-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <span className="text-sm mr-2">{icon}</span>
                  <span className="text-xs font-mono text-muted-foreground group-hover:text-white transition-colors">{label}</span>
                </div>
              </Link>
            ))}
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