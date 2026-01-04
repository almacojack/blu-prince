import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, Users, Package, DollarSign, Sparkles, Building2, GraduationCap } from "lucide-react";

export default function RevenueCalculator() {
  // Creator Calculator
  const [cartridgeCount, setCartridgeCount] = useState(5);
  const [avgPrice, setAvgPrice] = useState(15);
  const [monthlySales, setMonthlySales] = useState(50);
  const [creatorTier, setCreatorTier] = useState<"starter" | "verified" | "partner" | "premier">("starter");

  // Platform Operator Calculator
  const [activeCreators, setActiveCreators] = useState(1000);
  const [avgCartridgesPerCreator, setAvgCartridgesPerCreator] = useState(5);
  const [platformAvgPrice, setPlatformAvgPrice] = useState(12);
  const [conversionRate, setConversionRate] = useState(3);
  const [proSubscriptionRate, setProSubscriptionRate] = useState(5);

  const tierSplits = {
    starter: { creator: 0.70, platform: 0.30 },
    verified: { creator: 0.80, platform: 0.20 },
    partner: { creator: 0.85, platform: 0.15 },
    premier: { creator: 0.90, platform: 0.10 },
  };

  // Creator calculations
  const creatorMonthlyGMV = useMemo(() => monthlySales * avgPrice, [monthlySales, avgPrice]);
  const creatorMonthlyEarnings = useMemo(() => 
    creatorMonthlyGMV * tierSplits[creatorTier].creator, 
    [creatorMonthlyGMV, creatorTier]
  );
  const creatorYearlyEarnings = useMemo(() => creatorMonthlyEarnings * 12, [creatorMonthlyEarnings]);

  // Platform calculations
  const platformMonthlyGMV = useMemo(() => {
    const totalCartridges = activeCreators * avgCartridgesPerCreator;
    const monthlySalesPerCartridge = (conversionRate / 100) * (activeCreators * 10); // Rough estimate
    return totalCartridges * platformAvgPrice * (conversionRate / 100) * 10;
  }, [activeCreators, avgCartridgesPerCreator, platformAvgPrice, conversionRate]);

  const platformCommissionRevenue = useMemo(() => platformMonthlyGMV * 0.20, [platformMonthlyGMV]);
  
  const platformSubscriptionRevenue = useMemo(() => {
    const proUsers = activeCreators * (proSubscriptionRate / 100);
    return proUsers * 19; // Average subscription price
  }, [activeCreators, proSubscriptionRate]);

  const platformTotalMonthly = useMemo(() => 
    platformCommissionRevenue + platformSubscriptionRevenue,
    [platformCommissionRevenue, platformSubscriptionRevenue]
  );

  const formatCurrency = (n: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Revenue Calculator
            </h1>
            <p className="text-muted-foreground">See the financial opportunity. Adjust the sliders. Do the math.</p>
          </div>
        </div>

        <Tabs defaultValue="creator" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="creator" className="gap-2">
              <Package className="w-4 h-4" /> Creator
            </TabsTrigger>
            <TabsTrigger value="operator" className="gap-2">
              <Building2 className="w-4 h-4" /> Platform
            </TabsTrigger>
            <TabsTrigger value="educator" className="gap-2">
              <GraduationCap className="w-4 h-4" /> Educator
            </TabsTrigger>
          </TabsList>

          {/* CREATOR TAB */}
          <TabsContent value="creator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Your Inputs
                  </CardTitle>
                  <CardDescription>Adjust based on your expectations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Cartridges You'll Create</label>
                      <span className="text-primary font-bold">{cartridgeCount}</span>
                    </div>
                    <Slider
                      value={[cartridgeCount]}
                      onValueChange={([v]) => setCartridgeCount(v)}
                      min={1}
                      max={50}
                      step={1}
                      data-testid="slider-cartridge-count"
                    />
                    <p className="text-xs text-muted-foreground">Most creators start with 3-5 cartridges</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Average Price per Cartridge</label>
                      <span className="text-primary font-bold">${avgPrice}</span>
                    </div>
                    <Slider
                      value={[avgPrice]}
                      onValueChange={([v]) => setAvgPrice(v)}
                      min={1}
                      max={99}
                      step={1}
                      data-testid="slider-avg-price"
                    />
                    <p className="text-xs text-muted-foreground">$5-15 for simple tools, $20-50 for games/courses</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Monthly Sales (all cartridges)</label>
                      <span className="text-primary font-bold">{monthlySales}</span>
                    </div>
                    <Slider
                      value={[monthlySales]}
                      onValueChange={([v]) => setMonthlySales(v)}
                      min={1}
                      max={500}
                      step={1}
                      data-testid="slider-monthly-sales"
                    />
                    <p className="text-xs text-muted-foreground">10-50 typical for new creators, 100+ for established</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Your Creator Tier</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["starter", "verified", "partner", "premier"] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setCreatorTier(tier)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            creatorTier === tier 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted hover:bg-muted/80"
                          }`}
                          data-testid={`button-tier-${tier}`}
                        >
                          {tier.charAt(0).toUpperCase() + tier.slice(1)} ({tierSplits[tier].creator * 100}%)
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Your Projected Earnings
                  </CardTitle>
                  <CardDescription>Based on your inputs above</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                    <p className="text-5xl font-bold text-primary" data-testid="text-monthly-earnings">
                      {formatCurrency(creatorMonthlyEarnings)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (GMV: {formatCurrency(creatorMonthlyGMV)} × {tierSplits[creatorTier].creator * 100}% your cut)
                    </p>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Yearly Earnings</span>
                      <span className="text-2xl font-bold">{formatCurrency(creatorYearlyEarnings)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Per Cartridge (avg)</span>
                      <span className="font-medium">{formatCurrency(creatorMonthlyEarnings / cartridgeCount)}/mo</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Hourly Rate*</span>
                      <span className="font-medium">{formatCurrency(creatorMonthlyEarnings / 20)}/hr</span>
                    </div>
                    <p className="text-xs text-muted-foreground">*Assumes ~20 hours/month maintaining/promoting</p>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                      Growth Scenario
                    </p>
                    <p className="text-xs text-muted-foreground">
                      If sales grow 10% monthly for a year, you'd earn{" "}
                      <span className="text-primary font-bold">
                        {formatCurrency(creatorMonthlyEarnings * Math.pow(1.1, 12))}
                      </span>{" "}
                      in month 12.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Real Talk: What Does It Take?</h3>
                    <p className="text-sm text-muted-foreground">
                      A creator earning {formatCurrency(creatorMonthlyEarnings)}/month needs {monthlySales} sales 
                      across {cartridgeCount} cartridges. That's {Math.round(monthlySales / cartridgeCount)} sales 
                      per cartridge per month, or about {Math.round(monthlySales / cartridgeCount / 30 * 10) / 10} per day.
                      With the retro gaming community's appetite for new content and tng.li's frictionless distribution, 
                      these numbers are achievable with consistent quality and community engagement.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PLATFORM OPERATOR TAB */}
          <TabsContent value="operator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Platform Assumptions
                  </CardTitle>
                  <CardDescription>Model your marketplace economics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Active Creators</label>
                      <span className="text-primary font-bold">{activeCreators.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[activeCreators]}
                      onValueChange={([v]) => setActiveCreators(v)}
                      min={100}
                      max={100000}
                      step={100}
                      data-testid="slider-active-creators"
                    />
                    <p className="text-xs text-muted-foreground">itch.io has 500K+, we target 1% in Year 1</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Avg Cartridges per Creator</label>
                      <span className="text-primary font-bold">{avgCartridgesPerCreator}</span>
                    </div>
                    <Slider
                      value={[avgCartridgesPerCreator]}
                      onValueChange={([v]) => setAvgCartridgesPerCreator(v)}
                      min={1}
                      max={20}
                      step={1}
                      data-testid="slider-carts-per-creator"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Visitor-to-Buyer Conversion</label>
                      <span className="text-primary font-bold">{conversionRate}%</span>
                    </div>
                    <Slider
                      value={[conversionRate]}
                      onValueChange={([v]) => setConversionRate(v)}
                      min={1}
                      max={15}
                      step={0.5}
                      data-testid="slider-conversion"
                    />
                    <p className="text-xs text-muted-foreground">Industry average: 2-4%</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">Pro Subscription Rate</label>
                      <span className="text-primary font-bold">{proSubscriptionRate}%</span>
                    </div>
                    <Slider
                      value={[proSubscriptionRate]}
                      onValueChange={([v]) => setProSubscriptionRate(v)}
                      min={1}
                      max={20}
                      step={1}
                      data-testid="slider-pro-rate"
                    />
                    <p className="text-xs text-muted-foreground">Creators who upgrade to paid plans</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Platform Revenue
                  </CardTitle>
                  <CardDescription>Monthly recurring revenue projection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center py-8 space-y-2">
                    <p className="text-sm text-muted-foreground">Total Monthly Revenue</p>
                    <p className="text-5xl font-bold text-primary" data-testid="text-platform-revenue">
                      {formatCurrency(platformTotalMonthly)}
                    </p>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Marketplace Commissions</span>
                      <span className="font-bold">{formatCurrency(platformCommissionRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pro Subscriptions</span>
                      <span className="font-bold">{formatCurrency(platformSubscriptionRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-4">
                      <span className="text-muted-foreground">Annual Run Rate</span>
                      <span className="text-2xl font-bold">{formatCurrency(platformTotalMonthly * 12)}</span>
                    </div>
                  </div>

                  <div className="bg-background/50 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium">Valuation Implications</p>
                    <p className="text-xs text-muted-foreground">
                      At 5x ARR (conservative SaaS multiple), this revenue supports a valuation of{" "}
                      <span className="text-primary font-bold">
                        {formatCurrency(platformTotalMonthly * 12 * 5)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EDUCATOR TAB */}
          <TabsContent value="educator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Training & Certification Revenue
                </CardTitle>
                <CardDescription>Education is a high-margin opportunity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <p className="text-4xl font-bold text-primary">$49</p>
                    <p className="text-sm text-muted-foreground mt-2">Self-Paced Course</p>
                    <p className="text-xs text-muted-foreground mt-4">1,000 sales/year = $49,000</p>
                  </div>
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <p className="text-4xl font-bold text-primary">$199</p>
                    <p className="text-sm text-muted-foreground mt-2">Certification Exam</p>
                    <p className="text-xs text-muted-foreground mt-4">200 exams/year = $39,800</p>
                  </div>
                  <div className="text-center p-6 bg-muted/30 rounded-lg">
                    <p className="text-4xl font-bold text-primary">$2,999</p>
                    <p className="text-sm text-muted-foreground mt-2">Enterprise Seat</p>
                    <p className="text-xs text-muted-foreground mt-4">50 seats/year = $149,950</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-lg font-semibold">Year 1 Education Revenue Potential</p>
                  <p className="text-3xl font-bold text-primary mt-2">$238,750</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Ready to see it in action?</p>
          <div className="flex gap-4 justify-center">
            <Link href="/runtime">
              <Button size="lg" className="gap-2">
                Try the Simulator
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="gap-2">
                Open Blu-Prince Editor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
