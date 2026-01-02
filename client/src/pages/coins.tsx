import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

// Mock Data
const COINS = [
  { id: 1, symbol: "BTC", name: "Bitcoin", price: 98420.50, change24h: 2.4, change7d: 5.1, volume: "42B", sentiment: "Bullish" },
  { id: 2, symbol: "ETH", name: "Ethereum", price: 3840.25, change24h: -1.2, change7d: 0.8, volume: "18B", sentiment: "Neutral" },
  { id: 3, symbol: "SOL", name: "Solana", price: 145.80, change24h: 8.5, change7d: 15.2, volume: "4B", sentiment: "Strong Buy" },
  { id: 4, symbol: "TOSS", name: "TingOs Token", price: 1.25, change24h: 45.2, change7d: 120.5, volume: "50M", sentiment: "Moon" },
  { id: 5, symbol: "DOGE", name: "Dogecoin", price: 0.12, change24h: -0.5, change7d: -2.1, volume: "800M", sentiment: "Bearish" },
];

export default function Coins() {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono selection:bg-orange-500/30">
      {/* Top Bar */}
      <div className="border-b border-white/10 bg-[#111]">
        <div className="container mx-auto px-4 h-10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 text-muted-foreground">
            <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/> MARKET OPEN</span>
            <span>GAS: 12 GWEI</span>
            <span>DOMINANCE: BTC 52%</span>
          </div>
          <div className="flex gap-4">
             <span className="hover:text-white cursor-pointer">PORTFOLIO</span>
             <span className="hover:text-white cursor-pointer">SETTINGS</span>
          </div>
        </div>
      </div>

      <nav className="border-b border-white/10 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="p-2 hover:bg-white/5 rounded cursor-pointer transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="text-orange-500" />
              <span className="text-xl font-bold tracking-tighter">coins.rip</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10 font-bold text-xs h-8">
              CONNECT WALLET
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#111] border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">TOTAL MARKET CAP</div>
            <div className="text-xl font-bold text-white">$2.45T</div>
            <div className="text-xs text-green-500 flex items-center mt-1"><ArrowUpRight className="w-3 h-3 mr-1" /> +2.4%</div>
          </Card>
          <Card className="bg-[#111] border-white/10 p-4">
            <div className="text-xs text-muted-foreground mb-1">24H VOLUME</div>
            <div className="text-xl font-bold text-white">$84.2B</div>
            <div className="text-xs text-red-500 flex items-center mt-1"><ArrowDownRight className="w-3 h-3 mr-1" /> -5.1%</div>
          </Card>
          <Card className="bg-[#111] border-white/10 p-4 col-span-2 bg-gradient-to-r from-orange-900/10 to-transparent">
            <div className="text-xs text-orange-500 font-bold mb-1">FEATURED SWING</div>
            <div className="flex justify-between items-end">
              <div>
                <div className="text-2xl font-bold text-white">TOSS / USDT</div>
                <div className="text-sm text-muted-foreground">TingOs Token</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-500">+45.2%</div>
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-black font-bold h-6 text-xs mt-2">TRADE NOW</Button>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-[#111] border-white/10 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h3 className="font-bold text-sm">MARKET OVERVIEW</h3>
            <div className="flex gap-2">
               <Button size="icon" variant="ghost" className="h-6 w-6"><RefreshCcw className="w-3 h-3" /></Button>
            </div>
          </div>
          <Table>
            <TableHeader className="bg-black/40">
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="w-[50px] text-xs">#</TableHead>
                <TableHead className="text-xs">ASSET</TableHead>
                <TableHead className="text-right text-xs">PRICE</TableHead>
                <TableHead className="text-right text-xs">24H %</TableHead>
                <TableHead className="text-right text-xs">7D %</TableHead>
                <TableHead className="text-right text-xs hidden md:table-cell">VOLUME</TableHead>
                <TableHead className="text-right text-xs">SENTIMENT</TableHead>
                <TableHead className="text-right text-xs">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COINS.map((coin) => (
                <TableRow key={coin.id} className="border-white/5 hover:bg-white/5 cursor-pointer group">
                  <TableCell className="font-medium text-xs text-muted-foreground">{coin.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px]">
                        {coin.symbol[0]}
                      </div>
                      <div>
                        <div className="font-bold text-xs">{coin.name}</div>
                        <div className="text-[10px] text-muted-foreground">{coin.symbol}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-sm">
                    ${coin.price.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right text-xs font-bold ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {coin.change24h > 0 ? '+' : ''}{coin.change24h}%
                  </TableCell>
                  <TableCell className={`text-right text-xs font-bold ${coin.change7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {coin.change7d > 0 ? '+' : ''}{coin.change7d}%
                  </TableCell>
                  <TableCell className="text-right text-xs hidden md:table-cell text-muted-foreground">
                    {coin.volume}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className={`
                      text-[10px] border-none bg-opacity-20
                      ${coin.sentiment === 'Bullish' || coin.sentiment === 'Moon' || coin.sentiment === 'Strong Buy' ? 'bg-green-500 text-green-500' : 
                        coin.sentiment === 'Bearish' ? 'bg-red-500 text-red-500' : 'bg-yellow-500 text-yellow-500'}
                    `}>
                      {coin.sentiment}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="secondary" className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      CHART
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
    </div>
  );
}
