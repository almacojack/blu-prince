import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartridgeProvider } from "@/contexts/cartridge-context";
import Home from "@/pages/home";
import BluPrince from "@/pages/blu-prince";
import BluPrinceEditor from "@/pages/editor";
import ControllerDemo from "@/pages/controller";
import Unwanted from "@/pages/unwanted";
import Artsy from "@/pages/artsy";
import Coins from "@/pages/coins";
import RuntimeSimulator from "@/pages/runtime";
import StatechartEditor from "@/pages/statechart";
import DataTables from "@/pages/data-tables";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blu-prince" component={BluPrince} />
      <Route path="/editor" component={BluPrinceEditor} />
      <Route path="/controller" component={ControllerDemo} />
      <Route path="/unwanted" component={Unwanted} />
      <Route path="/artsy" component={Artsy} />
      <Route path="/coins" component={Coins} />
      <Route path="/runtime" component={RuntimeSimulator} />
      <Route path="/statechart" component={StatechartEditor} />
      <Route path="/data-tables" component={DataTables} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartridgeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
            <div className="scanline" />
            <Router />
            <Toaster />
          </div>
        </TooltipProvider>
      </CartridgeProvider>
    </QueryClientProvider>
  );
}

export default App;
