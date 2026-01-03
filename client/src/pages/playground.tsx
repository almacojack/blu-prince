import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { ArrowLeft, Palette, Droplet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import mixbox from "mixbox";

interface ColorSwatch {
  name: string;
  rgb: [number, number, number];
  hex: string;
}

const PIGMENT_COLORS: ColorSwatch[] = [
  { name: "Cadmium Yellow", rgb: [254, 236, 0], hex: "#feec00" },
  { name: "Ultramarine Blue", rgb: [25, 0, 89], hex: "#190059" },
  { name: "Cadmium Red", rgb: [255, 39, 2], hex: "#ff2702" },
  { name: "Phthalo Green", rgb: [0, 60, 50], hex: "#003c32" },
  { name: "Titanium White", rgb: [255, 255, 255], hex: "#ffffff" },
  { name: "Mars Black", rgb: [0, 0, 0], hex: "#000000" },
  { name: "Burnt Sienna", rgb: [138, 51, 36], hex: "#8a3324" },
  { name: "Cobalt Blue", rgb: [0, 33, 133], hex: "#002185" },
];

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function MixboxDemo() {
  const [color1, setColor1] = useState<ColorSwatch>(PIGMENT_COLORS[0]);
  const [color2, setColor2] = useState<ColorSwatch>(PIGMENT_COLORS[1]);
  const [mixRatio, setMixRatio] = useState(0.5);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mixedColor = mixbox.lerp(color1.hex, color2.hex, mixRatio);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    for (let x = 0; x < width; x++) {
      const t = x / width;
      const color = mixbox.lerp(color1.hex, color2.hex, t);
      ctx.fillStyle = color;
      ctx.fillRect(x, 0, 1, height);
    }
  }, [color1, color2]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-100">Color 1</h3>
          <div className="grid grid-cols-4 gap-2">
            {PIGMENT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor1(c)}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  color1.name === c.name ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                data-testid={`color1-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </div>
          <p className="text-sm text-amber-200/60">{color1.name}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-100">Color 2</h3>
          <div className="grid grid-cols-4 gap-2">
            {PIGMENT_COLORS.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor2(c)}
                className={`w-full aspect-square rounded-lg border-2 transition-all ${
                  color2.name === c.name ? 'border-white scale-110' : 'border-transparent hover:border-white/50'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
                data-testid={`color2-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
              />
            ))}
          </div>
          <p className="text-sm text-amber-200/60">{color2.name}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-amber-100">Mix Ratio</h3>
        <div className="flex items-center gap-4">
          <div 
            className="w-8 h-8 rounded-full border-2 border-white/20"
            style={{ backgroundColor: color1.hex }}
          />
          <Slider
            value={[mixRatio * 100]}
            onValueChange={([v]) => setMixRatio(v / 100)}
            max={100}
            step={1}
            className="flex-1"
            data-testid="slider-mix-ratio"
          />
          <div 
            className="w-8 h-8 rounded-full border-2 border-white/20"
            style={{ backgroundColor: color2.hex }}
          />
        </div>
        <p className="text-sm text-center text-amber-200/60">
          {Math.round((1 - mixRatio) * 100)}% {color1.name} + {Math.round(mixRatio * 100)}% {color2.name}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-amber-100">Result (Mixbox Pigment Mixing)</h3>
        <div 
          className="w-full h-24 rounded-xl shadow-lg border border-white/10"
          style={{ backgroundColor: mixedColor }}
          data-testid="mixed-color-result"
        />
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={40} 
          className="w-full h-10 rounded-lg"
          data-testid="gradient-canvas"
        />
        <p className="text-center font-mono text-amber-100">{mixedColor}</p>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <h4 className="text-sm font-semibold text-cyan-400 mb-2">Why Mixbox?</h4>
        <p className="text-sm text-gray-300">
          Unlike RGB mixing (which makes blue + yellow = gray), Mixbox uses real pigment data 
          based on Kubelka-Munk theory. Blue + Yellow = <strong className="text-green-400">Green</strong>, 
          just like real paint! This demo is pre-loaded as a TOSS cartridge example.
        </p>
      </div>
    </div>
  );
}

function MultiColorMixer() {
  const [colors, setColors] = useState<{ hex: string; weight: number }[]>([
    { hex: "#feec00", weight: 0.33 },
    { hex: "#190059", weight: 0.33 },
    { hex: "#ff2702", weight: 0.34 },
  ]);

  const mixColors = useCallback(() => {
    if (colors.length === 0) return "#888888";
    
    const totalWeight = colors.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight === 0) return "#888888";

    const latents = colors.map(c => {
      const rgb = [
        parseInt(c.hex.slice(1, 3), 16),
        parseInt(c.hex.slice(3, 5), 16),
        parseInt(c.hex.slice(5, 7), 16),
      ] as [number, number, number];
      return mixbox.rgbToLatent(rgb);
    });

    const mixedLatent = new Array(mixbox.LATENT_SIZE).fill(0);
    for (let i = 0; i < mixbox.LATENT_SIZE; i++) {
      for (let j = 0; j < colors.length; j++) {
        mixedLatent[i] += (colors[j].weight / totalWeight) * latents[j][i];
      }
    }

    const rgb = mixbox.latentToRgb(mixedLatent);
    return rgbToHex(rgb[0], rgb[1], rgb[2]);
  }, [colors]);

  const mixedResult = mixColors();

  const updateWeight = (index: number, weight: number) => {
    setColors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], weight };
      return updated;
    });
  };

  const updateColor = (index: number, hex: string) => {
    setColors(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], hex };
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {colors.map((color, i) => (
          <div key={i} className="flex items-center gap-4">
            <input 
              type="color" 
              value={color.hex}
              onChange={(e) => updateColor(i, e.target.value)}
              className="w-12 h-12 rounded-lg cursor-pointer border-2 border-white/20"
              data-testid={`multi-color-${i}`}
            />
            <div className="flex-1">
              <Slider
                value={[color.weight * 100]}
                onValueChange={([v]) => updateWeight(i, v / 100)}
                max={100}
                step={1}
                data-testid={`multi-weight-${i}`}
              />
            </div>
            <span className="w-12 text-right text-sm text-amber-200/60">
              {Math.round(color.weight * 100)}%
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-amber-100">Multi-Color Mix Result</h3>
        <div 
          className="w-full h-24 rounded-xl shadow-lg border border-white/10"
          style={{ backgroundColor: mixedResult }}
          data-testid="multi-mixed-result"
        />
        <p className="text-center font-mono text-amber-100">{mixedResult}</p>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="border-b border-amber-900/30 bg-black/40 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-amber-100 hover:text-white" data-testid="link-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-amber-100 font-pixel tracking-wider">
            TingOS Playground
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="mixbox" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="mixbox" className="data-[state=active]:bg-amber-900/50" data-testid="tab-mixbox">
              <Palette className="w-4 h-4 mr-2" />
              Mixbox Color Mixing
            </TabsTrigger>
            <TabsTrigger value="multi" className="data-[state=active]:bg-amber-900/50" data-testid="tab-multi">
              <Droplet className="w-4 h-4 mr-2" />
              Multi-Color Mixer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mixbox" className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-100" data-testid="section-mixbox">
                  Pigment-Based Color Mixing
                </h2>
                <p className="text-amber-200/60 mt-1">
                  Using the Mixbox library for realistic paint-like color blending
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                <span className="text-xs font-mono text-green-400">CARTRIDGE LOADED</span>
              </div>
            </div>
            <MixboxDemo />
          </TabsContent>

          <TabsContent value="multi" className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-amber-100" data-testid="section-multi">
                Multi-Color Mixer
              </h2>
              <p className="text-amber-200/60 mt-1">
                Mix three colors with custom weights using Mixbox latent space
              </p>
            </div>
            <MultiColorMixer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
