import { useState, Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartridgeProvider } from "@/contexts/cartridge-context";
import { UiScaleProvider } from "@/contexts/UiScaleContext";
import { TutorialProvider } from "@/contexts/TutorialContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FlightControlsProvider, useFlightControls } from "@/contexts/FlightControlsContext";
import { PerformanceProvider, usePerformance } from "@/contexts/PerformanceContext";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { TutorialMenu } from "@/components/TutorialMenu";
import { NeonPathNav } from "@/components/NeonPathNav";
import { GlobalCommandPalette } from "@/components/GlobalCommandPalette";
import { FlightControlsDashboard } from "@/components/FlightControlsDashboard";
import { useFullscreen } from "@/hooks/useFullscreen";
import Home from "@/pages/home";
import BluPrince from "@/pages/blu-prince";
import BluPrinceEditor from "@/pages/editor";
import ControllerDemo from "@/pages/controller";
import CartridgeLibrary from "@/pages/cartridge-library";
import Unwanted from "@/pages/unwanted";
import Artsy from "@/pages/artsy";
import Coins from "@/pages/coins";
import RuntimeSimulator from "@/pages/runtime";
import StatechartEditor from "@/pages/statechart";
import DataTables from "@/pages/data-tables";
import VaultDashboard from "@/pages/vault";
import AdminEvents from "@/pages/admin-events";
import Utilities from "@/pages/utilities";
import Playground from "@/pages/playground";
import Widgets from "@/pages/widgets";
import Pricing from "@/pages/pricing";
import InputSettings from "@/pages/input-settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blu-prince" component={BluPrince} />
      <Route path="/editor" component={BluPrinceEditor} />
      <Route path="/controller" component={ControllerDemo} />
      <Route path="/library" component={CartridgeLibrary} />
      <Route path="/unwanted" component={Unwanted} />
      <Route path="/artsy" component={Artsy} />
      <Route path="/coins" component={Coins} />
      <Route path="/runtime" component={RuntimeSimulator} />
      <Route path="/statechart" component={StatechartEditor} />
      <Route path="/data-tables" component={DataTables} />
      <Route path="/vault" component={VaultDashboard} />
      <Route path="/admin/events" component={AdminEvents} />
      <Route path="/utilities" component={Utilities} />
      <Route path="/playground" component={Playground} />
      <Route path="/widgets" component={Widgets} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/input-settings" component={InputSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

const BackgroundStage = lazy(() => import("@/components/BackgroundStage"));

function GlobalFlightControls() {
  const { isVisible, toggleVisible, setVisible } = useFlightControls();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleVisible();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisible]);
  
  if (!isVisible) return null;
  
  return (
    <FlightControlsDashboard
      onFlightInput={(input) => {
        const event = new CustomEvent('global-flight-input', { detail: input });
        window.dispatchEvent(event);
      }}
      onClose={() => setVisible(false)}
    />
  );
}

function ConditionalBackground() {
  const [location] = useLocation();
  const { settings } = usePerformance();
  
  // Only show 3D background on homepage and if enabled in settings
  const isHomepage = location === '/';
  const show3D = isHomepage && settings.enable3DBackgrounds;
  
  if (!show3D) {
    return <div className="fixed inset-0 bg-gradient-to-br from-[#050510] via-[#0a0a1f] to-[#050510]" />;
  }
  
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-[#050510]" />}>
      <BackgroundStage />
    </Suspense>
  );
}

function AppContent() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleTutorialOpen = () => {
    const event = new CustomEvent("open-tutorial-menu");
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen text-foreground antialiased selection:bg-primary/20 relative">
      <ConditionalBackground />
      
      <NeonPathNav 
        onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
        onFullscreenToggle={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
      
      <div className="relative z-10 pt-16">
        <div className="scanline" />
        <Router />
      </div>
      
      <Toaster />
      <TutorialOverlay />
      <TutorialMenu />
      <GlobalFlightControls />
      
      <GlobalCommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onFullscreenToggle={toggleFullscreen}
        onTutorialOpen={handleTutorialOpen}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PerformanceProvider>
          <UiScaleProvider>
            <CartridgeProvider>
              <TutorialProvider>
                <FlightControlsProvider>
                  <TooltipProvider>
                    <AppContent />
                  </TooltipProvider>
                </FlightControlsProvider>
              </TutorialProvider>
            </CartridgeProvider>
          </UiScaleProvider>
        </PerformanceProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
