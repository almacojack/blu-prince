import { Link } from "wouter";
import { ArrowLeft, TrendingUp, RefreshCw, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// This component is a "Dumb View" - it knows nothing about crypto or logic.
// It simply renders a stream of "Tickers" provided by the TingOs Engine.
// This architecture makes it trivial to port to Svelte 5 + SvelteFlow later.

interface Ticker {
  id: string;
  symbol: string;
  price: string;
  delta: string;
  sentiment: string; // The "Business Logic" is pre-calculated by TingOs
}

const MOCK_STREAM: Ticker[] = [
  { id: "1", symbol: "BTC", price: "98,420.50", delta: "+2.4%", sentiment: "BULL" },
  { id: "2", symbol: "ETH", price: "3,840.25", delta: "-1.2%", sentiment: "NEUTRAL" },
  { id: "3", symbol: "SOL", price: "145.80", delta: "+8.5%", sentiment: "BUY" },
  { id: "4", symbol: "TOSS", price: "1.25", delta: "+45.2%", sentiment: "MOON" },
  { id: "5", symbol: "DOGE", price: "0.12", delta: "-0.5%", sentiment: "BEAR" },
];

export default function Coins() {
  return (
    <div className="min-h-screen bg-[#050505] text-green-500 font-mono p-4 md:p-8 selection:bg-green-500/30">
      
      {/* Header: Pure Navigation & Status */}
      <header className="flex items-center justify-between mb-12 border-b border-green-500/20 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="hover:bg-green-500/10 p-2 rounded transition-colors group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          </Link>
          <h1 className="text-xl tracking-tighter flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            COINS.RIP <span className="text-xs opacity-50 font-normal">| STREAM_VIEW_ONLY</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-70">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          CONNECTED TO TINGOS ENGINE
        </div>
      </header>

      {/* The View: A raw data table. No local calculation. */}
      <main className="max-w-4xl mx-auto">
        <div className="border border-green-500/20 rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-green-500/5 text-xs uppercase tracking-widest border-b border-green-500/20">
              <tr>
                <th className="p-4 font-normal opacity-70">Asset</th>
                <th className="p-4 font-normal opacity-70 text-right">Price (USD)</th>
                <th className="p-4 font-normal opacity-70 text-right">24h Delta</th>
                <th className="p-4 font-normal opacity-70 text-right">Engine Signal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-500/10">
              {MOCK_STREAM.map((ticker) => (
                <tr key={ticker.id} className="hover:bg-green-500/5 transition-colors cursor-crosshair">
                  <td className="p-4">
                    <span className="font-bold">{ticker.symbol}</span>
                  </td>
                  <td className="p-4 text-right opacity-90">
                    ${ticker.price}
                  </td>
                  <td className={`p-4 text-right ${ticker.delta.startsWith('+') ? 'opacity-100' : 'opacity-60'}`}>
                    {ticker.delta}
                  </td>
                  <td className="p-4 text-right">
                    <Badge variant="outline" className="border-green-500/30 text-green-500 font-mono text-xs rounded-none">
                      {ticker.sentiment}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="p-4 border-t border-green-500/20 bg-green-500/5 flex items-center justify-between text-xs">
            <span className="opacity-60">Listing data provided by TingOs Cartridge Registry v1.0</span>
            <button className="flex items-center gap-2 hover:text-white transition-colors">
              <RefreshCw className="w-3 h-3" /> REFRESH FEED
            </button>
          </div>
        </div>
      </main>

    </div>
  );
}

