import { Link } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, Zap, Crown, Star, Lock, ChevronRight, BarChart3, Target, Shield, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Ticker {
  id: string;
  symbol: string;
  name: string;
  price: string;
  delta: string;
  volume: string;
  sentiment: "BULL" | "BEAR" | "NEUTRAL" | "BUY" | "SELL" | "MOON";
  signal: number;
  swingHistory: number[];
}

const MOCK_STREAM: Ticker[] = [
  { id: "1", symbol: "BTC", name: "Bitcoin", price: "98,420.50", delta: "+2.4%", volume: "42.3B", sentiment: "BULL", signal: 78, swingHistory: [45, 52, 48, 55, 61, 58, 72, 78] },
  { id: "2", symbol: "ETH", name: "Ethereum", price: "3,840.25", delta: "-1.2%", volume: "18.7B", sentiment: "NEUTRAL", signal: 52, swingHistory: [60, 55, 58, 52, 48, 51, 53, 52] },
  { id: "3", symbol: "SOL", name: "Solana", price: "145.80", delta: "+8.5%", volume: "4.2B", sentiment: "BUY", signal: 85, swingHistory: [40, 48, 55, 62, 70, 75, 82, 85] },
  { id: "4", symbol: "TOSS", name: "TingOs Token", price: "1.25", delta: "+45.2%", volume: "890M", sentiment: "MOON", signal: 96, swingHistory: [20, 35, 48, 62, 75, 85, 92, 96] },
  { id: "5", symbol: "DOGE", name: "Dogecoin", price: "0.12", delta: "-0.5%", volume: "1.1B", sentiment: "BEAR", signal: 35, swingHistory: [55, 50, 45, 42, 38, 36, 34, 35] },
  { id: "6", symbol: "AVAX", name: "Avalanche", price: "42.30", delta: "+4.1%", volume: "890M", sentiment: "BUY", signal: 72, swingHistory: [50, 55, 52, 58, 64, 68, 70, 72] },
  { id: "7", symbol: "LINK", name: "Chainlink", price: "18.45", delta: "+1.8%", volume: "620M", sentiment: "BULL", signal: 68, swingHistory: [55, 58, 60, 62, 65, 66, 67, 68] },
  { id: "8", symbol: "ARB", name: "Arbitrum", price: "1.85", delta: "-2.3%", volume: "340M", sentiment: "NEUTRAL", signal: 48, swingHistory: [60, 55, 52, 50, 48, 49, 48, 48] },
];

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 60},${30 - ((v - min) / range) * 25}`).join(' ');
  
  return (
    <svg width="60" height="30" className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

function SignalGauge({ value }: { value: number }) {
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444';
  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-10" />
        <circle 
          cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${value * 0.94} 100`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono">{value}</span>
    </div>
  );
}

export default function Coins() {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "MOON": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "BUY": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "BULL": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "BEAR": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "SELL": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-green-500 font-mono p-4 md:p-8 selection:bg-green-500/30">
      
      <header className="flex items-center justify-between mb-8 border-b border-green-500/20 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="hover:bg-green-500/10 p-2 rounded transition-colors group" data-testid="button-back">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </Link>
          <h1 className="text-xl tracking-tighter flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            COINS.RIP <span className="text-xs opacity-50 font-normal">| SWING_TRADE_MONITOR</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs opacity-70">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            LIVE FEED
          </div>
          <Badge variant="outline" className="border-green-500/30 text-green-400 text-xs">
            8 ASSETS TRACKED
          </Badge>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr,320px] gap-8">
        <main>
          <div className="border border-green-500/20 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-green-500/5 text-xs uppercase tracking-widest border-b border-green-500/20">
                <tr>
                  <th className="p-4 font-normal opacity-70">Asset</th>
                  <th className="p-4 font-normal opacity-70 text-right">Price</th>
                  <th className="p-4 font-normal opacity-70 text-right">24h</th>
                  <th className="p-4 font-normal opacity-70 text-center hidden md:table-cell">Trend</th>
                  <th className="p-4 font-normal opacity-70 text-center hidden md:table-cell">Signal</th>
                  <th className="p-4 font-normal opacity-70 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-500/10">
                {MOCK_STREAM.map((ticker) => (
                  <tr key={ticker.id} className="hover:bg-green-500/5 transition-colors cursor-crosshair" data-testid={`row-ticker-${ticker.symbol}`}>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold">{ticker.symbol}</span>
                        <span className="text-xs opacity-50">{ticker.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="opacity-90">${ticker.price}</span>
                      <span className="block text-[10px] opacity-40">VOL: {ticker.volume}</span>
                    </td>
                    <td className={`p-4 text-right ${ticker.delta.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                      <span className="flex items-center justify-end gap-1">
                        {ticker.delta.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {ticker.delta}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex justify-center">
                        <MiniSparkline data={ticker.swingHistory} color={ticker.delta.startsWith('+') ? '#22c55e' : '#ef4444'} />
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex justify-center">
                        <SignalGauge value={ticker.signal} />
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="outline" className={`font-mono text-xs rounded-sm ${getSentimentColor(ticker.sentiment)}`}>
                        {ticker.sentiment}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="p-4 border-t border-green-500/20 bg-green-500/5 flex items-center justify-between text-xs">
              <span className="opacity-60">Data powered by TingOs Engine v1.0</span>
              <button className="flex items-center gap-2 hover:text-white transition-colors" data-testid="button-refresh">
                <RefreshCw className="w-3 h-3" /> REFRESH
              </button>
            </div>
          </div>
        </main>

        <aside className="space-y-6">
          <Card className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border-amber-500/30 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-400 tracking-tight">Coinsmith.pro</h3>
                  <p className="text-[10px] text-amber-500/60 uppercase tracking-widest">Premium Trading Suite</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/70 leading-relaxed">
                Unlock algorithmic swing detection, custom alerts, and portfolio optimization powered by TingOs Engine.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-amber-400/80">
                  <Target className="w-4 h-4" />
                  <span>AI-powered entry/exit signals</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400/80">
                  <BarChart3 className="w-4 h-4" />
                  <span>Advanced swing trade analytics</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400/80">
                  <Shield className="w-4 h-4" />
                  <span>Risk management automation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400/80">
                  <Sparkles className="w-4 h-4" />
                  <span>Custom TOSS cartridge builder</span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-500/20">
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl font-bold text-amber-400">$49</span>
                  <span className="text-xs text-amber-500/60">/month</span>
                  <Badge className="ml-auto bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
                    SAVE 40%
                  </Badge>
                </div>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold hover:from-amber-400 hover:to-orange-400 transition-all" data-testid="button-upgrade-coinsmith">
                  <Crown className="w-4 h-4 mr-2" />
                  UPGRADE TO PRO
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] border-green-500/20">
            <CardHeader className="pb-2">
              <h4 className="text-sm font-bold text-green-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quick Stats
              </h4>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="opacity-60">Total Market Cap</span>
                <span className="text-green-400">$2.84T</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">24h Volume</span>
                <span className="text-green-400">$142.8B</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">BTC Dominance</span>
                <span className="text-green-400">52.4%</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60">Active Signals</span>
                <span className="text-purple-400">3 BUY</span>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-xs">
              <Lock className="w-3 h-3 opacity-50" />
              <span className="opacity-70">Free tier: View only</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

