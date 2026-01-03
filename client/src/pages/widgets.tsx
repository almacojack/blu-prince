import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Zap, Radio, Gauge, Monitor, Music, QrCode, Download, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeigerCounter } from "@/components/GeigerCounter";
import { NixieDisplay, MagicEyeTube, TubeArray, VacuumTube } from "@/components/VacuumTubeDisplay";
import { VUMeter, StereoVUMeter } from "@/components/VUMeter";
import { SonarScanner, FishFinder } from "@/components/SonarWidgets";
import { DronePilotDemo } from "@/components/DronePilotDemo";
import { QRColorCustomizer } from "@/components/QRColorCustomizer";
import { useTranslation } from "react-i18next";
import { Anchor } from "lucide-react";
import QRCodeLib from "qrcode";
import i18n from "@/i18n/config";

function LanguagePicker() {
  const { t } = useTranslation();
  const currentLang = i18n.language;
  
  const toggleLanguage = () => {
    const newLang = currentLang === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };
  
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={toggleLanguage}
      className="h-8 px-2 text-xs font-mono text-purple-400 hover:text-purple-300 border border-purple-900/30"
      data-testid="button-language-toggle"
    >
      <span className={currentLang === 'en' ? 'text-white' : 'text-gray-500'}>EN</span>
      <span className="mx-1 text-gray-600">/</span>
      <span className={currentLang === 'ru' ? 'text-white' : 'text-gray-500'}>РУ</span>
    </Button>
  );
}
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";

const QR_PRESETS = [
  { name: "Classic", dark: "#000000", light: "#ffffff" },
  { name: "Cyberpunk", dark: "#a855f7", light: "#0a0a14" },
  { name: "Terminal", dark: "#22c55e", light: "#0d1117" },
  { name: "Blueprint", dark: "#1e40af", light: "#dbeafe" },
  { name: "Sunset", dark: "#ea580c", light: "#fef3c7" },
  { name: "Vapor", dark: "#ec4899", light: "#fdf4ff" },
  { name: "Gold Leaf", dark: "#854d0e", light: "#fef9c3" },
  { name: "Steampunk", dark: "#78350f", light: "#d4a574" },
];

function WidgetQRCode({ tngliId, title }: { tngliId: string; title: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#ffffff");
  const url = `https://tng.li?id=${tngliId}`;

  useEffect(() => {
    QRCodeLib.toDataURL(url, {
      width: 200,
      margin: 2,
      color: { dark: darkColor, light: lightColor },
      errorCorrectionLevel: "H",
    }).then(setQrDataUrl).catch(console.error);
  }, [url, darkColor, lightColor]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `${tngliId}-qr.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const applyPreset = (preset: typeof QR_PRESETS[0]) => {
    setDarkColor(preset.dark);
    setLightColor(preset.light);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-black/40 border border-purple-500/20">
      <div className="flex items-center justify-between w-full">
        <div className="text-xs text-purple-400 font-mono flex items-center gap-1">
          <QrCode className="w-3 h-3" />
          {tngliId}
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" data-testid="button-qr-colors">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-gray-900 border-purple-500/30" align="end">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-white">QR Colors</div>
              
              <div className="grid grid-cols-4 gap-1.5">
                {QR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className="group relative h-8 rounded border border-gray-700 hover:border-purple-500 transition-colors overflow-hidden"
                    title={preset.name}
                    data-testid={`button-preset-${preset.name.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="absolute inset-0 flex">
                      <div className="w-1/2 h-full" style={{ backgroundColor: preset.light }} />
                      <div className="w-1/2 h-full" style={{ backgroundColor: preset.dark }} />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 bg-black/60 text-white transition-opacity">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Foreground</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      data-testid="input-qr-dark-color"
                    />
                    <input
                      type="text"
                      value={darkColor}
                      onChange={(e) => setDarkColor(e.target.value)}
                      className="flex-1 text-xs font-mono bg-black/50 border border-gray-700 rounded px-2 py-1 text-white uppercase"
                      data-testid="input-qr-dark-hex"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-gray-400 block mb-1">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                      data-testid="input-qr-light-color"
                    />
                    <input
                      type="text"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="flex-1 text-xs font-mono bg-black/50 border border-gray-700 rounded px-2 py-1 text-white uppercase"
                      data-testid="input-qr-light-hex"
                    />
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {qrDataUrl && (
        <img src={qrDataUrl} alt={`QR for ${title}`} className="rounded-lg" style={{ width: 200, height: 200 }} />
      )}
      <div className="text-[10px] text-gray-500 font-mono text-center break-all max-w-[200px]">
        {url}
      </div>
      <Button variant="ghost" size="sm" className="text-xs text-purple-400" onClick={handleDownload} data-testid="button-download-qr">
        <Download className="w-3 h-3 mr-1" /> Download QR
      </Button>
    </div>
  );
}

interface WidgetShowcaseProps {
  title: string;
  description: string;
  category: string;
  tossExample: string;
  tngliId?: string;
  children: React.ReactNode;
}

function WidgetShowcase({ title, description, category, tossExample, tngliId, children }: WidgetShowcaseProps) {
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

      <div className="p-6 flex flex-wrap items-start justify-center gap-6 min-h-[200px] bg-black/20">
        <div className="flex items-center justify-center flex-1 min-w-[280px]">
          {children}
        </div>
        {tngliId && (
          <WidgetQRCode tngliId={tngliId} title={title} />
        )}
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
          <div className="flex items-center gap-3">
            <LanguagePicker />
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
          <TabsList className="bg-black/30 border border-purple-900/30 flex-wrap">
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
            <TabsTrigger value="marine" className="data-[state=active]:bg-purple-900/30">
              <Anchor className="w-4 h-4 mr-2" />
              Marine
            </TabsTrigger>
            <TabsTrigger value="gauges" className="data-[state=active]:bg-purple-900/30">
              <Gauge className="w-4 h-4 mr-2" />
              Gauges
            </TabsTrigger>
            <TabsTrigger value="drone" className="data-[state=active]:bg-purple-900/30">
              <Plane className="w-4 h-4 mr-2" />
              Drone
            </TabsTrigger>
          </TabsList>

          <TabsContent value="radiation" className="space-y-6">
            <WidgetShowcase
              title="Geiger Counter"
              description="Authentic radiation detector with clicking audio, analog meter, and CPM readout. Perfect for Cold War era game aesthetics."
              category="radiation"
              tossExample={geigerToss}
              tngliId="w-geiger"
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
              tngliId="w-nixie"
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
              tngliId="w-magiceye"
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
              tngliId="w-tubearray"
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
              tngliId="w-vumeter"
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
              tngliId="w-stereovu"
            >
              <StereoVUMeter 
                leftLevel={vuLevel + (Math.random() - 0.5) * 0.2} 
                rightLevel={vuLevel + (Math.random() - 0.5) * 0.2} 
                variant="classic" 
                size="md" 
              />
            </WidgetShowcase>
          </TabsContent>

          <TabsContent value="marine" className="space-y-6">
            <WidgetShowcase
              title="Submarine Sonar Scanner"
              description="Military-grade rotating sweep sonar with ping audio, contact tracking, and multiple visual modes. Perfect for submarine simulators and naval games."
              category="marine"
              tossExample={`{
  "widget": "SonarScanner",
  "props": {
    "mode": "active",
    "gain": 0.7,
    "rangeYards": 5000,
    "variant": "military",
    "sweepSpeed": 4
  },
  "bindings": {
    "onPing": "context.lastPingTime = Date.now()"
  }
}`}
              tngliId="w-sonar"
            >
              <div className="flex gap-6 flex-wrap justify-center">
                <div className="text-center">
                  <SonarScanner variant="military" size={220} />
                  <span className="text-xs text-gray-500 mt-2 block">Military</span>
                </div>
                <div className="text-center">
                  <SonarScanner variant="classic" size={220} />
                  <span className="text-xs text-gray-500 mt-2 block">Classic</span>
                </div>
                <div className="text-center">
                  <SonarScanner variant="modern" size={220} />
                  <span className="text-xs text-gray-500 mt-2 block">Modern</span>
                </div>
              </div>
            </WidgetShowcase>

            <WidgetShowcase
              title="Fish Finder"
              description="Depth sonar with real-time fish echoes, bottom contour mapping, and water temperature. Multiple frequency modes for different fishing conditions."
              category="marine"
              tossExample={`{
  "widget": "FishFinder",
  "props": {
    "maxDepth": 100,
    "frequency": 200,
    "sensitivity": 0.7,
    "variant": "color",
    "showTemp": true
  }
}`}
              tngliId="w-fishfinder"
            >
              <div className="flex gap-6 flex-wrap justify-center">
                <div className="text-center">
                  <FishFinder variant="color" width={280} height={180} />
                  <span className="text-xs text-gray-500 mt-2 block">Color</span>
                </div>
                <div className="text-center">
                  <FishFinder variant="classic" width={280} height={180} />
                  <span className="text-xs text-gray-500 mt-2 block">Classic</span>
                </div>
                <div className="text-center">
                  <FishFinder variant="chirp" width={280} height={180} />
                  <span className="text-xs text-gray-500 mt-2 block">CHIRP</span>
                </div>
              </div>
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

          <TabsContent value="drone" className="space-y-6">
            <WidgetShowcase
              title="Drone Pilot Simulator"
              description="Full 3D drone piloting with keyboard or gamepad controls. Three camera modes: Follow, FPV, and Orbit. Features realistic physics, HUD telemetry, and a procedural world."
              category="simulation"
              tossExample={`{
  "widget": "DronePilot",
  "props": {
    "cameraMode": "follow",
    "showHUD": true,
    "world": "urban"
  },
  "bindings": {
    "gamepad.leftStick": ["throttle", "yaw"],
    "gamepad.rightStick": ["pitch", "roll"],
    "gamepad.A": "toggleCamera"
  }
}`}
              tngliId="w-drone"
            >
              <DronePilotDemo />
            </WidgetShowcase>
            
            <div className="p-4 rounded-lg bg-black/30 border border-purple-900/20">
              <h4 className="text-sm font-semibold text-white mb-3">Controls</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-purple-400 font-mono mb-1">W / S</div>
                  <div className="text-gray-500">Throttle Up/Down</div>
                </div>
                <div>
                  <div className="text-purple-400 font-mono mb-1">A / D</div>
                  <div className="text-gray-500">Yaw Left/Right</div>
                </div>
                <div>
                  <div className="text-purple-400 font-mono mb-1">↑ / ↓</div>
                  <div className="text-gray-500">Pitch Forward/Back</div>
                </div>
                <div>
                  <div className="text-purple-400 font-mono mb-1">← / →</div>
                  <div className="text-gray-500">Roll Left/Right</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                <span className="mr-4"><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">C</kbd> Cycle Camera</span>
                <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded">H</kbd> Toggle HUD</span>
                <span className="ml-4">🎮 Gamepad supported (dual stick)</span>
              </div>
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
