import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Zap, Radio, Gauge, Monitor, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeigerCounter } from "@/components/GeigerCounter";
import { NixieDisplay, MagicEyeTube, TubeArray, VacuumTube } from "@/components/VacuumTubeDisplay";
import { VUMeter, StereoVUMeter } from "@/components/VUMeter";

interface WidgetShowcaseProps {
  title: string;
  description: string;
  category: string;
  tossExample: string;
  children: React.ReactNode;
}

function WidgetShowcase({ title, description, category, tossExample, children }: WidgetShowcaseProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tossExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #16162a 100%)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <div className="p-4 border-b border-purple-900/30">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <span 
            className="px-2 py-0.5 rounded text-xs font-mono"
            style={{
              background: "rgba(139, 92, 246, 0.2)",
              color: "#a78bfa",
            }}
          >
            {category}
          </span>
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </div>

      <div className="p-6 flex items-center justify-center min-h-[200px] bg-black/20">
        {children}
      </div>

      <div className="border-t border-purple-900/30">
        <div className="flex items-center justify-between px-4 py-2 bg-black/30">
          <span className="text-xs font-mono text-purple-400">TOSS Definition</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-purple-400 hover:text-purple-300"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre 
          className="p-4 text-xs font-mono overflow-x-auto"
          style={{
            background: "#0a0a14",
            color: "#e2e8f0",
          }}
        >
          <code>{tossExample}</code>
        </pre>
      </div>
    </motion.div>
  );
}

export default function WidgetsPage() {
  const [radiationLevel, setRadiationLevel] = useState(0.15);
  const [nixieValue, setNixieValue] = useState("1984");
  const [magicEyeLevel, setMagicEyeLevel] = useState(0.5);
  const [vuLevel, setVuLevel] = useState(0.5);

  useEffect(() => {
    const interval = setInterval(() => {
      setNixieValue(prev => {
        const num = parseInt(prev) + 1;
        return num.toString().padStart(4, "0");
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMagicEyeLevel(0.3 + Math.random() * 0.5);
      setVuLevel(0.3 + Math.random() * 0.5);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const geigerToss = `{
  "widget": "GeigerCounter",
  "props": {
    "radiationLevel": 0.15,
    "variant": "steampunk",
    "size": "medium",
    "showCPM": true,
    "autoAnimate": true
  },
  "bindings": {
    "onRadiationChange": "context.radiation = $event"
  }
}`;

  const nixieToss = `{
  "widget": "NixieDisplay",
  "props": {
    "value": "{{context.counter}}",
    "digits": 4,
    "size": "medium",
    "label": "COUNTER"
  }
}`;

  const magicEyeToss = `{
  "widget": "MagicEyeTube",
  "props": {
    "level": "{{context.signalStrength}}",
    "size": "medium",
    "variant": "classic"
  }
}`;

  const tubeArrayToss = `{
  "widget": "TubeArray",
  "props": {
    "count": 4,
    "type": "mixed",
    "size": "medium",
    "isOn": true
  }
}`;

  const vuMeterToss = `{
  "widget": "VUMeter",
  "props": {
    "level": "{{context.audioLevel}}",
    "variant": "steampunk",
    "size": "medium",
    "label": "OUTPUT",
    "showPeakLed": true
  }
}`;

  const stereoVuToss = `{
  "widget": "StereoVUMeter",
  "props": {
    "leftLevel": "{{context.leftChannel}}",
    "rightLevel": "{{context.rightChannel}}",
    "variant": "classic",
    "size": "small"
  }
}`;

  return (
    <div 
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg, #0a0a14 0%, #1a1a2e 50%, #0a0a14 100%)",
      }}
    >
      <header className="sticky top-0 z-50 border-b border-purple-900/30 backdrop-blur-lg bg-black/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Widget Showcase</h1>
              <p className="text-xs text-gray-500">TingOS Component Library</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NixieDisplay value={nixieValue} digits={4} size="small" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Retro-Futuristic Widgets</h2>
          <p className="text-gray-400">
            Cold War era aesthetics meet modern web technology. Each widget can be defined in TOSS format
            for use in cartridges - no GUI required.
          </p>
        </div>

        <Tabs defaultValue="radiation" className="space-y-6">
          <TabsList className="bg-black/30 border border-purple-900/30">
            <TabsTrigger value="radiation" className="data-[state=active]:bg-purple-900/30">
              <Radio className="w-4 h-4 mr-2" />
              Radiation
            </TabsTrigger>
            <TabsTrigger value="tubes" className="data-[state=active]:bg-purple-900/30">
              <Zap className="w-4 h-4 mr-2" />
              Vacuum Tubes
            </TabsTrigger>
            <TabsTrigger value="audio" className="data-[state=active]:bg-purple-900/30">
              <Music className="w-4 h-4 mr-2" />
              Audio
            </TabsTrigger>
            <TabsTrigger value="gauges" className="data-[state=active]:bg-purple-900/30">
              <Gauge className="w-4 h-4 mr-2" />
              Gauges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="radiation" className="space-y-6">
            <WidgetShowcase
              title="Geiger Counter"
              description="Authentic radiation detector with clicking audio, analog meter, and CPM readout. Perfect for Cold War era game aesthetics."
              category="radiation"
              tossExample={geigerToss}
            >
              <div className="flex gap-6 flex-wrap justify-center">
                <div className="text-center">
                  <GeigerCounter variant="classic" radiationLevel={radiationLevel} />
                  <span className="text-xs text-gray-500 mt-2 block">Classic</span>
                </div>
                <div className="text-center">
                  <GeigerCounter variant="military" radiationLevel={radiationLevel} />
                  <span className="text-xs text-gray-500 mt-2 block">Military</span>
                </div>
                <div className="text-center">
                  <GeigerCounter variant="steampunk" radiationLevel={radiationLevel} />
                  <span className="text-xs text-gray-500 mt-2 block">Steampunk</span>
                </div>
              </div>
            </WidgetShowcase>

            <div className="p-4 rounded-lg bg-black/30 border border-purple-900/20">
              <label className="text-sm text-gray-400 mb-2 block">Radiation Level</label>
              <input
                type="range"
                min="0"
                max="100"
                value={radiationLevel * 100}
                onChange={(e) => setRadiationLevel(parseInt(e.target.value) / 100)}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Safe</span>
                <span>Caution</span>
                <span>Danger</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tubes" className="space-y-6">
            <WidgetShowcase
              title="Nixie Display"
              description="Warm orange glow of nixie tube digits. Stack multiple for counters, clocks, or numeric displays."
              category="display"
              tossExample={nixieToss}
            >
              <div className="flex gap-8 flex-wrap justify-center items-end">
                <NixieDisplay value={nixieValue} digits={4} size="small" label="SMALL" />
                <NixieDisplay value={nixieValue} digits={4} size="medium" label="MEDIUM" />
                <NixieDisplay value={nixieValue} digits={4} size="large" label="LARGE" />
              </div>
            </WidgetShowcase>

            <WidgetShowcase
              title="Magic Eye Tube"
              description="Classic tuning indicator with eerie green phosphor glow. Three variants for different visual effects."
              category="indicator"
              tossExample={magicEyeToss}
            >
              <div className="flex gap-8 flex-wrap justify-center items-center">
                <div className="text-center">
                  <MagicEyeTube level={magicEyeLevel} size="large" variant="classic" />
                  <span className="text-xs text-gray-500 mt-2 block">Classic</span>
                </div>
                <div className="text-center">
                  <MagicEyeTube level={magicEyeLevel} size="large" variant="dual" />
                  <span className="text-xs text-gray-500 mt-2 block">Dual Bar</span>
                </div>
                <div className="text-center">
                  <MagicEyeTube level={magicEyeLevel} size="large" variant="target" />
                  <span className="text-xs text-gray-500 mt-2 block">Target</span>
                </div>
              </div>
            </WidgetShowcase>

            <WidgetShowcase
              title="Vacuum Tube Array"
              description="Glowing vacuum tubes with animated filaments. Mix triodes, pentodes, and rectifiers for authentic amp aesthetics."
              category="decorative"
              tossExample={tubeArrayToss}
            >
              <div className="flex flex-col gap-6 items-center">
                <TubeArray count={5} type="mixed" size="medium" />
                <div className="flex gap-4">
                  <div className="text-center">
                    <VacuumTube type="triode" size="large" />
                    <span className="text-xs text-gray-500 mt-2 block">Triode</span>
                  </div>
                  <div className="text-center">
                    <VacuumTube type="pentode" size="large" />
                    <span className="text-xs text-gray-500 mt-2 block">Pentode</span>
                  </div>
                  <div className="text-center">
                    <VacuumTube type="rectifier" size="large" />
                    <span className="text-xs text-gray-500 mt-2 block">Rectifier</span>
                  </div>
                </div>
              </div>
            </WidgetShowcase>
          </TabsContent>

          <TabsContent value="audio" className="space-y-6">
            <WidgetShowcase
              title="VU Meter"
              description="Analog volume unit meter with bouncing needle, dB scale, and peak LED. Multiple visual styles available."
              category="audio"
              tossExample={vuMeterToss}
            >
              <div className="flex gap-6 flex-wrap justify-center">
                <div className="text-center">
                  <VUMeter level={vuLevel} variant="classic" size="md" label="CLASSIC" />
                </div>
                <div className="text-center">
                  <VUMeter level={vuLevel} variant="steampunk" size="md" label="STEAMPUNK" />
                </div>
                <div className="text-center">
                  <VUMeter level={vuLevel} variant="neon" size="md" label="NEON" />
                </div>
              </div>
            </WidgetShowcase>

            <WidgetShowcase
              title="Stereo VU Meters"
              description="Paired left/right channel meters for stereo audio visualization. Perfect for music players and audio apps."
              category="audio"
              tossExample={stereoVuToss}
            >
              <StereoVUMeter 
                leftLevel={vuLevel + (Math.random() - 0.5) * 0.2} 
                rightLevel={vuLevel + (Math.random() - 0.5) * 0.2} 
                variant="classic" 
                size="md" 
              />
            </WidgetShowcase>
          </TabsContent>

          <TabsContent value="gauges" className="space-y-6">
            <div className="p-8 rounded-xl bg-black/30 border border-purple-900/20 text-center">
              <Gauge className="w-16 h-16 mx-auto mb-4 text-purple-400/50" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">More Gauges Coming Soon</h3>
              <p className="text-sm text-gray-500">
                Pressure gauges, speedometers, altimeters, and more industrial instrumentation.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <section className="mt-12 p-6 rounded-xl bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-purple-500/20">
          <h3 className="text-lg font-bold text-white mb-4">Using Widgets in TOSS Cartridges</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Widget Definition</h4>
              <p className="text-sm text-gray-400 mb-3">
                Each widget is defined as a JSON object within your TOSS cartridge's UI section. 
                Props can be static values or bound to context variables using mustache syntax.
              </p>
              <pre className="p-3 rounded bg-black/50 text-xs font-mono text-gray-300 overflow-x-auto">
{`"ui": {
  "components": [
    {
      "widget": "GeigerCounter",
      "props": {
        "radiationLevel": "{{context.radiation}}"
      }
    }
  ]
}`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-purple-400 mb-2">Event Bindings</h4>
              <p className="text-sm text-gray-400 mb-3">
                Widgets emit events that can trigger FSM transitions or update context. 
                Use the bindings object to wire up interactions.
              </p>
              <pre className="p-3 rounded bg-black/50 text-xs font-mono text-gray-300 overflow-x-auto">
{`"bindings": {
  "onRadiationChange": {
    "action": "UPDATE_CONTEXT",
    "payload": {
      "radiation": "$event"
    }
  }
}`}
              </pre>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-purple-900/30 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
          TingOS Widget Library - Part of the TOSS Cartridge Ecosystem
        </div>
      </footer>
    </div>
  );
}
