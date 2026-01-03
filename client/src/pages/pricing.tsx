import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Rocket, QrCode, Gamepad2, Box, Database, Code, Cloud } from "lucide-react";
import QRCode from "qrcode";

interface PricingTier {
  id: string;
  name: string;
  tagline: string;
  price: number | "Free" | "Custom";
  period?: string;
  features: string[];
  limits: Record<string, string>;
  cta: string;
  popular?: boolean;
  icon: React.ReactNode;
  qrUrl: string;
}

const TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Arcade",
    tagline: "Start your journey",
    price: "Free",
    features: [
      "5 cartridges",
      "1KB script limit",
      "Basic widgets",
      "Community support",
      "tng.li short links"
    ],
    limits: {
      cartridges: "5",
      storage: "10MB",
      apiCalls: "1K/day",
      scripts: "1KB each"
    },
    cta: "Start Free",
    icon: <Gamepad2 className="w-8 h-8" />,
    qrUrl: "https://tng.li/arcade"
  },
  {
    id: "indie",
    name: "Indie",
    tagline: "For solo creators",
    price: 9,
    period: "/mo",
    features: [
      "50 cartridges",
      "10KB scripts",
      "All widgets",
      "Controller support",
      "Priority support",
      "Custom QR colors",
      "Analytics dashboard"
    ],
    limits: {
      cartridges: "50",
      storage: "500MB",
      apiCalls: "50K/day",
      scripts: "10KB each"
    },
    cta: "Go Indie",
    icon: <Zap className="w-8 h-8" />,
    qrUrl: "https://tng.li/indie"
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For game studios",
    price: 49,
    period: "/mo",
    popular: true,
    features: [
      "Unlimited cartridges",
      "50KB scripts",
      "3D asset pipeline",
      "Team collaboration",
      "White-label domains",
      "Webhook integrations",
      "Dedicated support",
      "Revenue sharing: 85/15"
    ],
    limits: {
      cartridges: "Unlimited",
      storage: "10GB",
      apiCalls: "500K/day",
      scripts: "50KB each"
    },
    cta: "Start Studio",
    icon: <Crown className="w-8 h-8" />,
    qrUrl: "https://tng.li/studio"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom solutions",
    price: "Custom",
    features: [
      "Everything in Studio",
      "Unlimited everything",
      "On-premise option",
      "Custom interpreters",
      "SLA guarantee",
      "Dedicated engineer",
      "Revenue sharing: 90/10",
      "Source code escrow"
    ],
    limits: {
      cartridges: "Unlimited",
      storage: "Unlimited",
      apiCalls: "Unlimited",
      scripts: "Unlimited"
    },
    cta: "Contact Sales",
    icon: <Rocket className="w-8 h-8" />,
    qrUrl: "https://tng.li/enterprise"
  }
];

function TierQRCode({ url, tier }: { url: string; tier: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const colors: Record<string, { dark: string; light: string }> = {
      free: { dark: "#22c55e", light: "#0a0a0a" },
      indie: { dark: "#f59e0b", light: "#0a0a0a" },
      studio: { dark: "#a855f7", light: "#0a0a0a" },
      enterprise: { dark: "#ef4444", light: "#0a0a0a" }
    };
    
    QRCode.toDataURL(url, {
      width: 120,
      margin: 1,
      color: colors[tier] || colors.free
    }).then(setQrDataUrl);
  }, [url, tier]);

  if (!qrDataUrl) return null;

  return (
    <div className="flex flex-col items-center gap-1">
      <img src={qrDataUrl} alt={`QR code for ${tier}`} className="rounded-lg" />
      <span className="text-xs text-gray-500 font-mono">{url.replace("https://", "")}</span>
    </div>
  );
}

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <Card 
      className={`relative flex flex-col bg-gray-900/80 border-gray-800 ${
        tier.popular ? "border-purple-500 shadow-lg shadow-purple-500/20" : ""
      }`}
      data-testid={`card-pricing-${tier.id}`}
    >
      {tier.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 p-3 rounded-full bg-gray-800 text-purple-400">
          {tier.icon}
        </div>
        <CardTitle className="text-2xl text-white">{tier.name}</CardTitle>
        <CardDescription className="text-gray-400">{tier.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
          {typeof tier.price === "number" ? (
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-white">${tier.price}</span>
              <span className="text-gray-400">{tier.period}</span>
            </div>
          ) : (
            <span className="text-4xl font-bold text-white">{tier.price}</span>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <TierQRCode url={tier.qrUrl} tier={tier.id} />
        </div>

        <ul className="space-y-2">
          {tier.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <Box className="w-3 h-3" />
              <span>{tier.limits.cartridges} cartridges</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Database className="w-3 h-3" />
              <span>{tier.limits.storage}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Cloud className="w-3 h-3" />
              <span>{tier.limits.apiCalls}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <Code className="w-3 h-3" />
              <span>{tier.limits.scripts}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          className={`w-full ${
            tier.popular 
              ? "bg-purple-600 hover:bg-purple-700" 
              : "bg-gray-800 hover:bg-gray-700"
          }`}
          data-testid={`button-${tier.id}-cta`}
        >
          {tier.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

function UsageCalculator() {
  const [cartridges, setCartridges] = useState(10);
  const [apiCalls, setApiCalls] = useState(5000);

  const recommendedTier = 
    cartridges <= 5 && apiCalls <= 1000 ? "Arcade (Free)" :
    cartridges <= 50 && apiCalls <= 50000 ? "Indie ($9/mo)" :
    "Studio ($49/mo)";

  return (
    <Card className="bg-gray-900/80 border-gray-800 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <QrCode className="w-5 h-5 text-purple-400" />
          Usage Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Cartridges needed</label>
          <input 
            type="range" 
            min="1" 
            max="100" 
            value={cartridges}
            onChange={(e) => setCartridges(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="text-right text-white font-mono">{cartridges}</div>
        </div>
        <div>
          <label className="text-sm text-gray-400">API calls/day</label>
          <input 
            type="range" 
            min="100" 
            max="100000" 
            step="100"
            value={apiCalls}
            onChange={(e) => setApiCalls(Number(e.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="text-right text-white font-mono">{apiCalls.toLocaleString()}</div>
        </div>
        <div className="pt-4 border-t border-gray-800 text-center">
          <span className="text-gray-400">Recommended: </span>
          <span className="text-purple-400 font-semibold">{recommendedTier}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketplaceLinks() {
  const links = [
    { name: "artsy.sale", desc: "Art dealer auctions", url: "https://artsy.sale", color: "text-amber-400" },
    { name: "unwanted.ad", desc: "Misfit toy auctions", url: "https://unwanted.ad", color: "text-rose-400" },
    { name: "coins.rip", desc: "Crypto playbooks", url: "https://coins.rip", color: "text-emerald-400" },
    { name: "l8r.co", desc: "Scheduling cartridges", url: "https://l8r.co", color: "text-cyan-400" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          className="group p-4 rounded-lg bg-gray-900/60 border border-gray-800 hover:border-purple-500/50 transition-all text-center"
          data-testid={`link-marketplace-${link.name.replace(".", "-")}`}
        >
          <div className={`font-mono text-lg ${link.color} group-hover:scale-105 transition-transform`}>
            {link.name}
          </div>
          <div className="text-xs text-gray-500 mt-1">{link.desc}</div>
        </a>
      ))}
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-purple-500 text-purple-400">
            Gaming API Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Build Games, Not Infrastructure
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            From hobby projects to AAA studios. Start free, scale infinitely.
            Scan any QR code to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} />
          ))}
        </div>

        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Marketplace Satellites
          </h2>
          <MarketplaceLinks />
        </div>

        <div className="mb-16">
          <UsageCalculator />
        </div>

        <div className="text-center">
          <h3 className="text-xl text-white mb-4">All Plans Include</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> SNAP scripting</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Controller support</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> tng.li short links</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> QR code generation</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> TOSS file format</span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Web + TUI + MicroPython</span>
          </div>
        </div>
      </div>
    </div>
  );
}
