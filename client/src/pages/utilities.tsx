import { Link } from "wouter";
import { ArrowLeft, Palette, Music2, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CoolChunkyWoodenVibeDemo from "@/components/CoolChunkyWoodenVibeDemo";

export default function Utilities() {
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
            TingOS Utilities
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-amber-100" data-testid="section-ui-components">
                UI Component Gallery
              </h2>
            </div>
            <p className="text-amber-200/70 mb-6">
              Archived UI components and design patterns from the TingOS platform.
            </p>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-amber-200 mb-3 flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5" />
                  Cool Chunky Wooden Vibe Panels
                </h3>
                <CoolChunkyWoodenVibeDemo />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Music2 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-amber-100" data-testid="section-audio-tools">
                Audio Tools
              </h2>
            </div>
            <p className="text-amber-200/70 mb-4">
              Chiptune player and audio visualization tools.
            </p>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <p className="text-gray-400 text-sm italic">
                WinAMP-style audio player coming soon...
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
