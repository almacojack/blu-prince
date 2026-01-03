import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Move, ZoomIn, ZoomOut, Music2, SkipForward, Volume2, VolumeX } from "lucide-react";

function WoodgrainPanel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className="relative overflow-hidden rounded-lg shadow-xl">
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 6px,
                rgba(0,0,0,0.2) 6px,
                rgba(0,0,0,0.2) 8px
              ),
              linear-gradient(
                90deg,
                #3e2723 0%,
                #5d4037 15%,
                #4e342e 30%,
                #5d4037 45%,
                #3e2723 60%,
                #6d4c41 75%,
                #3e2723 100%
              )
            `,
            backgroundSize: '100% 14px, 100% 100%',
          }}
        />
        
        <div 
          className="absolute inset-0 rounded-lg"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 2px,
                rgba(93,64,55,0.12) 2px,
                rgba(93,64,55,0.12) 4px
              )
            `,
            mixBlendMode: 'overlay',
          }}
        />
        
        <div 
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-lg"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)',
          }}
        />
        
        <div 
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg"
          style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%)',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-1 px-2 py-1 border-b border-black/20">
            <span 
              className="font-pixel text-[8px] tracking-wider text-amber-100/80 uppercase"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              {title}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 text-amber-100/50 hover:text-amber-100 hover:bg-black/20"
              title="Pop out to floating panel"
            >
              <Move className="w-2.5 h-2.5" />
            </Button>
          </div>
          <div className="p-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResetKnobDemo({ onReset }: { onReset: () => void }) {
  return (
    <button
      onClick={onReset}
      className="relative w-10 h-10 group cursor-pointer"
      title="Reset FSM"
    >
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, #1a1a1a 0%, #0a0a0a 100%)
          `,
          boxShadow: `
            inset 0 2px 4px rgba(0,0,0,0.5),
            0 1px 2px rgba(255,255,255,0.1),
            0 4px 8px rgba(0,0,0,0.4)
          `,
        }}
      />
      
      <div 
        className="absolute inset-1 rounded-full"
        style={{
          background: `
            conic-gradient(
              from 0deg,
              #2a2a2a 0deg,
              #1a1a1a 90deg,
              #0f0f0f 180deg,
              #1a1a1a 270deg,
              #2a2a2a 360deg
            )
          `,
        }}
      />
      
      <div 
        className="absolute inset-2 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(145deg, #1f1f1f, #0a0a0a)',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        <div 
          className="w-0.5 h-2 bg-red-500 rounded-full group-hover:bg-red-400 transition-colors"
          style={{
            boxShadow: '0 0 4px rgba(239,68,68,0.5)',
          }}
        />
      </div>
    </button>
  );
}

export default function CoolChunkyWoodenVibeDemo() {
  const [zoom, setZoom] = useState(100);
  const [isMuted, setIsMuted] = useState(true);
  const trackName = "Neon Dreams";

  const handleZoomIn = () => setZoom(z => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoom(z => Math.max(z - 10, 50));
  const handleZoomReset = () => setZoom(100);
  const handleReset = () => console.log("FSM Reset!");
  const toggleMute = () => setIsMuted(m => !m);

  return (
    <div className="p-8 bg-gray-900 rounded-xl">
      <h2 className="text-xl font-bold text-amber-100 mb-4 font-pixel">Atari 2600/5200 Woodgrain Panels</h2>
      <p className="text-amber-200/70 text-sm mb-6">
        These chunky walnut woodgrain panels feature the warm, mellow aesthetic of classic Atari consoles.
        Each panel can pop out to a floating, draggable window.
      </p>
      
      <div className="flex items-end gap-4 flex-wrap">
        <WoodgrainPanel title="Controls">
          <div className="flex items-center gap-2">
            <ResetKnobDemo onReset={handleReset} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5 text-amber-100 hover:text-white hover:bg-black/20" onClick={handleZoomOut}>
                  <ZoomOut className="w-2.5 h-2.5" />
                </Button>
                <span className="text-[7px] font-pixel text-amber-200 w-7 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-amber-100 hover:text-white hover:bg-black/20" onClick={handleZoomIn}>
                  <ZoomIn className="w-2.5 h-2.5" />
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="h-4 px-1 text-[6px] text-amber-100/60 hover:text-amber-100 hover:bg-black/20" onClick={handleZoomReset}>
                RESET
              </Button>
            </div>
          </div>
        </WoodgrainPanel>

        <WoodgrainPanel title="Audio" className="min-w-[200px]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Music2 className="w-4 h-4 text-amber-200" />
              <span className="text-[9px] text-amber-100 font-pixel truncate max-w-[100px]">{trackName}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-amber-100 hover:text-white hover:bg-black/20 rounded-full"
            >
              <SkipForward className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-7 w-7 rounded-full hover:bg-black/20 ${!isMuted ? 'text-green-400 bg-green-400/10' : 'text-amber-100'}`}
              onClick={toggleMute}
              style={{
                boxShadow: !isMuted ? '0 0 8px rgba(74,222,128,0.4)' : 'none',
              }}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </WoodgrainPanel>
      </div>
    </div>
  );
}
