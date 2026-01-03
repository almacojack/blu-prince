import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Keyboard, 
  Gamepad2, 
  Mouse, 
  AlertTriangle,
  Settings,
  RotateCcw,
  Zap,
  ChevronRight,
  Check
} from "lucide-react";
import { InputProvider, useInput } from "@/contexts/InputContext";
import { ControllerSetupWizard } from "@/components/input/ControllerSetupWizard";
import { InputBinding, GamepadBinding } from "@/lib/input/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function BindingBadge({ binding }: { binding: InputBinding }) {
  const { getBindingDisplay } = useInput();
  
  const deviceIcons = {
    keyboard: <Keyboard className="w-3 h-3" />,
    mouse: <Mouse className="w-3 h-3" />,
    gamepad: <Gamepad2 className="w-3 h-3" />
  };
  
  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      {deviceIcons[binding.device]}
      {getBindingDisplay(binding)}
    </Badge>
  );
}

function BindingsTable() {
  const { profile, actions, conflicts, updateBinding } = useInput();
  
  const categories = ['navigation', 'editing', 'camera', 'tools', 'system'] as const;
  
  return (
    <div className="space-y-6">
      {conflicts.length > 0 && (
        <Card className="bg-amber-900/20 border-amber-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-400 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-amber-200/80">
              {conflicts.slice(0, 3).map((c, i) => (
                <li key={i}>{c.message}</li>
              ))}
              {conflicts.length > 3 && (
                <li className="text-amber-400">...and {conflicts.length - 3} more</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {categories.map(category => {
        const categoryActions = actions.filter(a => a.category === category);
        if (categoryActions.length === 0) return null;
        
        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryActions.map(action => {
                const userBinding = profile.bindings.find(b => b.actionId === action.id);
                const bindings = userBinding?.bindings || [];
                const hasConflict = conflicts.some(
                  c => c.actionId1 === action.id || c.actionId2 === action.id
                );
                
                return (
                  <div 
                    key={action.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      hasConflict ? 'bg-amber-900/20 border border-amber-500/30' : 'bg-gray-800/50'
                    }`}
                  >
                    <div>
                      <div className="text-sm text-white">{action.name}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {bindings.map((binding, i) => (
                        <BindingBadge key={i} binding={binding} />
                      ))}
                      {bindings.length === 0 && (
                        <span className="text-xs text-gray-500">Not bound</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsPanel() {
  const { 
    profile, 
    setRightClickToPan, 
    setContextMenuEnabled, 
    setContextMenuDelay,
    setGamepadDeadzone,
    resetToDefaults
  } = useInput();
  
  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Mouse Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Right-Click to Pan</div>
              <div className="text-xs text-gray-500">Use right mouse button to pan the view</div>
            </div>
            <Switch 
              checked={profile.settings.rightClickToPan}
              onCheckedChange={setRightClickToPan}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">Context Menus</div>
              <div className="text-xs text-gray-500">Show right-click context menus</div>
            </div>
            <Switch 
              checked={profile.settings.contextMenuEnabled}
              onCheckedChange={setContextMenuEnabled}
            />
          </div>
          
          {profile.settings.rightClickToPan && profile.settings.contextMenuEnabled && (
            <div className="p-3 rounded-lg bg-amber-900/20 border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Both enabled - context menu will show after a delay
              </div>
              <div className="mt-2">
                <label className="text-xs text-gray-400">Delay before context menu (ms)</label>
                <Slider
                  value={[profile.settings.contextMenuDelay]}
                  onValueChange={([v]) => setContextMenuDelay(v)}
                  min={100}
                  max={1000}
                  step={50}
                  className="mt-2"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {profile.settings.contextMenuDelay}ms
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Gamepad Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-white block mb-2">Stick Deadzone</label>
            <Slider
              value={[profile.settings.gamepadDeadzone * 100]}
              onValueChange={([v]) => setGamepadDeadzone(v / 100)}
              min={5}
              max={50}
              step={5}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {Math.round(profile.settings.gamepadDeadzone * 100)}%
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white">{profile.name}</div>
              <div className="text-xs text-gray-500">
                Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
              </div>
            </div>
            {profile.isDefault && (
              <Badge variant="outline" className="border-purple-500 text-purple-400">Default</Badge>
            )}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={resetToDefaults}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ControllerPanel() {
  const { applyControllerBindings } = useInput();
  const [showWizard, setShowWizard] = useState(false);
  const [connectedGamepads, setConnectedGamepads] = useState<string[]>([]);

  useState(() => {
    const checkGamepads = () => {
      const gamepads = navigator.getGamepads();
      const connected = Array.from(gamepads)
        .filter((gp): gp is Gamepad => gp !== null && gp.connected)
        .map(gp => gp.id);
      setConnectedGamepads(connected);
    };
    
    checkGamepads();
    const interval = setInterval(checkGamepads, 1000);
    return () => clearInterval(interval);
  });

  const handleComplete = (bindings: Map<string, GamepadBinding>) => {
    applyControllerBindings(bindings);
    setShowWizard(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/80 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            Connected Controllers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {connectedGamepads.length > 0 ? (
            <div className="space-y-2">
              {connectedGamepads.map((id, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-gray-800/50">
                  <Zap className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300 truncate">{id}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Gamepad2 className="w-12 h-12 mx-auto opacity-50 mb-3" />
              <p>No controllers connected</p>
              <p className="text-xs mt-1">Connect a controller and press any button</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <Gamepad2 className="w-5 h-5 mr-2" />
            Configure Controller
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg p-0 bg-transparent border-0">
          <ControllerSetupWizard 
            onComplete={handleComplete}
            onCancel={() => setShowWizard(false)}
          />
        </DialogContent>
      </Dialog>

      <Card className="bg-purple-900/20 border-purple-500/30">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-purple-400 mb-2">Like EmulationStation!</h4>
          <p className="text-xs text-gray-400">
            The wizard walks you through each button, just like setting up a retro gaming frontend.
            Skip buttons you don't need, and we'll detect conflicts automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function InputSettingsContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <header className="border-b border-purple-900/30 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/controller">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              Input Settings
            </h1>
            <p className="text-sm text-gray-400">
              Configure keyboard, mouse, and gamepad bindings
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="bindings" className="space-y-6">
          <TabsList className="bg-black/30 border border-purple-900/30">
            <TabsTrigger value="bindings" className="data-[state=active]:bg-purple-900/30">
              <Keyboard className="w-4 h-4 mr-2" />
              Bindings
            </TabsTrigger>
            <TabsTrigger value="controllers" className="data-[state=active]:bg-purple-900/30">
              <Gamepad2 className="w-4 h-4 mr-2" />
              Controllers
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-900/30">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bindings">
            <BindingsTable />
          </TabsContent>

          <TabsContent value="controllers">
            <ControllerPanel />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function InputSettingsPage() {
  return (
    <InputProvider>
      <InputSettingsContent />
    </InputProvider>
  );
}
