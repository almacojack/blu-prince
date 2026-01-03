import { useState, useEffect } from "react";
import { useGamepad, type GamepadInput } from "@/hooks/use-gamepad";
import { motion } from "framer-motion";
import { Gamepad2, Wifi, WifiOff, ChevronLeft, ChevronRight } from "lucide-react";

interface VirtualHandheldProps {
  onInput?: (input: GamepadInput) => void;
  showSelector?: boolean;
  className?: string;
}

function DPad({ input }: { input: GamepadInput }) {
  return (
    <div className="relative w-20 h-20" data-testid="dpad">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-gray-900 rounded-lg shadow-inner border border-gray-700" />
      </div>
      <motion.button
        className={`absolute top-0 left-1/2 -translate-x-1/2 w-6 h-7 rounded-t-md border border-gray-600 ${
          input.dpadUp ? "bg-cyan-500 shadow-[0_0_10px_#0ff]" : "bg-gray-800"
        }`}
        animate={{ scale: input.dpadUp ? 0.95 : 1 }}
        data-testid="dpad-up"
      />
      <motion.button
        className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-7 rounded-b-md border border-gray-600 ${
          input.dpadDown ? "bg-cyan-500 shadow-[0_0_10px_#0ff]" : "bg-gray-800"
        }`}
        animate={{ scale: input.dpadDown ? 0.95 : 1 }}
        data-testid="dpad-down"
      />
      <motion.button
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-7 h-6 rounded-l-md border border-gray-600 ${
          input.dpadLeft ? "bg-cyan-500 shadow-[0_0_10px_#0ff]" : "bg-gray-800"
        }`}
        animate={{ scale: input.dpadLeft ? 0.95 : 1 }}
        data-testid="dpad-left"
      />
      <motion.button
        className={`absolute right-0 top-1/2 -translate-y-1/2 w-7 h-6 rounded-r-md border border-gray-600 ${
          input.dpadRight ? "bg-cyan-500 shadow-[0_0_10px_#0ff]" : "bg-gray-800"
        }`}
        animate={{ scale: input.dpadRight ? 0.95 : 1 }}
        data-testid="dpad-right"
      />
    </div>
  );
}

function FaceButtons({ input }: { input: GamepadInput }) {
  const buttons = [
    { key: "y", label: "Y", x: 24, y: 0, color: "yellow" },
    { key: "x", label: "X", x: 0, y: 24, color: "blue" },
    { key: "b", label: "B", x: 48, y: 24, color: "red" },
    { key: "a", label: "A", x: 24, y: 48, color: "green" },
  ] as const;

  const colorMap = {
    yellow: { active: "bg-yellow-400 shadow-[0_0_15px_#facc15]", inactive: "bg-yellow-600/60" },
    blue: { active: "bg-blue-400 shadow-[0_0_15px_#60a5fa]", inactive: "bg-blue-600/60" },
    red: { active: "bg-red-400 shadow-[0_0_15px_#f87171]", inactive: "bg-red-600/60" },
    green: { active: "bg-green-400 shadow-[0_0_15px_#4ade80]", inactive: "bg-green-600/60" },
  };

  return (
    <div className="relative w-20 h-20" data-testid="face-buttons">
      {buttons.map(({ key, label, x, y, color }) => {
        const pressed = input[key];
        const colors = colorMap[color];
        return (
          <motion.button
            key={key}
            className={`absolute w-7 h-7 rounded-full border-2 border-gray-600 font-bold text-xs flex items-center justify-center ${
              pressed ? colors.active + " text-black" : colors.inactive + " text-gray-300"
            }`}
            style={{ left: x, top: y }}
            animate={{ scale: pressed ? 0.9 : 1 }}
            data-testid={`button-${key}`}
          >
            {label}
          </motion.button>
        );
      })}
    </div>
  );
}

function AnalogStick({ x, y, pressed, label }: { x: number; y: number; pressed: boolean; label: string }) {
  return (
    <div className="relative" data-testid={`stick-${label.toLowerCase()}`}>
      <div className="w-14 h-14 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
        <motion.div
          className={`w-10 h-10 rounded-full border-2 ${
            pressed 
              ? "bg-cyan-500/80 border-cyan-400 shadow-[0_0_12px_#0ff]" 
              : "bg-gray-700 border-gray-600"
          }`}
          animate={{
            x: x * 8,
            y: y * 8,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
      </div>
      <div className="text-[8px] text-gray-500 text-center mt-1 font-mono">{label}</div>
    </div>
  );
}

function ShoulderButtons({ input }: { input: GamepadInput }) {
  return (
    <div className="flex justify-between w-full px-2" data-testid="shoulder-buttons">
      <div className="flex flex-col gap-1 items-start">
        <motion.div
          className={`w-14 h-4 rounded-t-lg border border-gray-600 text-[8px] font-mono flex items-center justify-center ${
            input.leftBumper ? "bg-cyan-500 text-black" : "bg-gray-800 text-gray-400"
          }`}
          animate={{ scale: input.leftBumper ? 0.95 : 1 }}
          data-testid="bumper-left"
        >
          LB
        </motion.div>
        <div className="w-14 h-3 rounded-sm bg-gray-900 border border-gray-700 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400"
            style={{ width: `${input.leftTrigger * 100}%` }}
            data-testid="trigger-left"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end">
        <motion.div
          className={`w-14 h-4 rounded-t-lg border border-gray-600 text-[8px] font-mono flex items-center justify-center ${
            input.rightBumper ? "bg-cyan-500 text-black" : "bg-gray-800 text-gray-400"
          }`}
          animate={{ scale: input.rightBumper ? 0.95 : 1 }}
          data-testid="bumper-right"
        >
          RB
        </motion.div>
        <div className="w-14 h-3 rounded-sm bg-gray-900 border border-gray-700 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-l from-cyan-600 to-cyan-400"
            style={{ width: `${input.rightTrigger * 100}%`, marginLeft: "auto" }}
            data-testid="trigger-right"
          />
        </div>
      </div>
    </div>
  );
}

function ConnectionIndicator({ connected, gamepadName }: { connected: boolean; gamepadName?: string }) {
  return (
    <div className="absolute top-2 right-2 flex items-center gap-2" data-testid="connection-indicator">
      <motion.div
        className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-gray-600"}`}
        animate={connected ? { 
          boxShadow: ["0 0 0px #4ade80", "0 0 8px #4ade80", "0 0 0px #4ade80"],
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      />
      {connected ? (
        <Wifi className="w-3 h-3 text-green-400" />
      ) : (
        <WifiOff className="w-3 h-3 text-gray-500" />
      )}
      {gamepadName && (
        <span className="text-[8px] text-gray-400 font-mono max-w-20 truncate">
          {gamepadName.split("(")[0].trim()}
        </span>
      )}
    </div>
  );
}

export function VirtualHandheld({ onInput, showSelector = true, className = "" }: VirtualHandheldProps) {
  const { 
    isSupported, 
    hasGamepad, 
    gamepads, 
    activeGamepad, 
    activeIndex, 
    setActiveIndex,
    input 
  } = useGamepad({
    deadzone: 0.15,
    onInput: onInput,
  });

  const [screenContent, setScreenContent] = useState<"logo" | "input">("logo");

  useEffect(() => {
    if (hasGamepad) {
      setScreenContent("input");
    }
  }, [hasGamepad]);

  const nextGamepad = () => {
    if (gamepads.length > 1 && activeIndex !== null) {
      const nextIdx = (activeIndex + 1) % gamepads.length;
      setActiveIndex(gamepads[nextIdx]?.index ?? 0);
    }
  };

  const prevGamepad = () => {
    if (gamepads.length > 1 && activeIndex !== null) {
      const prevIdx = (activeIndex - 1 + gamepads.length) % gamepads.length;
      setActiveIndex(gamepads[prevIdx]?.index ?? 0);
    }
  };

  return (
    <div 
      className={`relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl p-4 border-4 border-gray-700 shadow-2xl ${className}`}
      data-testid="virtual-handheld"
    >
      <ConnectionIndicator 
        connected={hasGamepad} 
        gamepadName={activeGamepad?.id}
      />

      <div className="flex flex-col gap-4">
        <ShoulderButtons input={input} />
        
        <div 
          className="relative mx-auto bg-black rounded-lg border-4 border-gray-600 overflow-hidden"
          style={{ width: "280px", aspectRatio: "4/3" }}
          data-testid="handheld-screen"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {screenContent === "logo" ? (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="text-4xl font-bold tracking-wider">
                  <span className="text-cyan-400">TING</span>
                  <span className="text-white">OS</span>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">UNIVERSAL GAME ENGINE</div>
                {!isSupported && (
                  <div className="text-[8px] text-red-400 font-mono mt-2">
                    Gamepad API not supported
                  </div>
                )}
                {isSupported && !hasGamepad && (
                  <div className="text-[8px] text-yellow-400 font-mono mt-2 animate-pulse">
                    Connect a controller...
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full p-3 flex flex-col">
                <div className="text-[10px] text-cyan-400 font-mono mb-2">LIVE INPUT</div>
                <div className="grid grid-cols-4 gap-1 text-[8px] font-mono">
                  <div className={`p-1 rounded ${input.a ? "bg-green-500/30 text-green-400" : "text-gray-600"}`}>A</div>
                  <div className={`p-1 rounded ${input.b ? "bg-red-500/30 text-red-400" : "text-gray-600"}`}>B</div>
                  <div className={`p-1 rounded ${input.x ? "bg-blue-500/30 text-blue-400" : "text-gray-600"}`}>X</div>
                  <div className={`p-1 rounded ${input.y ? "bg-yellow-500/30 text-yellow-400" : "text-gray-600"}`}>Y</div>
                </div>
                <div className="mt-2 flex-1 flex items-center justify-around">
                  <div className="text-center">
                    <div className="text-[8px] text-gray-500 mb-1">L-STICK</div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {input.leftStickX.toFixed(2)}, {input.leftStickY.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[8px] text-gray-500 mb-1">R-STICK</div>
                    <div className="text-[10px] text-cyan-400 font-mono">
                      {input.rightStickX.toFixed(2)}, {input.rightStickY.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none bg-gradient-to-t from-cyan-500/5 to-transparent" />
        </div>

        {showSelector && gamepads.length > 1 && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-mono">
            <button onClick={prevGamepad} className="p-1 hover:text-cyan-400">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Controller {(activeIndex ?? 0) + 1} / {gamepads.length}
            </span>
            <button onClick={nextGamepad} className="p-1 hover:text-cyan-400">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center px-2">
          <DPad input={input} />
          
          <div className="flex gap-3">
            <motion.button
              className={`w-6 h-3 rounded-sm border ${
                input.select ? "bg-gray-300 border-gray-400" : "bg-gray-700 border-gray-600"
              }`}
              animate={{ scale: input.select ? 0.95 : 1 }}
              data-testid="button-select"
            />
            <div className="flex flex-col items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-gray-600" />
            </div>
            <motion.button
              className={`w-6 h-3 rounded-sm border ${
                input.start ? "bg-gray-300 border-gray-400" : "bg-gray-700 border-gray-600"
              }`}
              animate={{ scale: input.start ? 0.95 : 1 }}
              data-testid="button-start"
            />
          </div>
          
          <FaceButtons input={input} />
        </div>

        <div className="flex justify-around items-center pt-2">
          <AnalogStick 
            x={input.leftStickX} 
            y={input.leftStickY} 
            pressed={input.leftStickPress}
            label="L3"
          />
          <AnalogStick 
            x={input.rightStickX} 
            y={input.rightStickY} 
            pressed={input.rightStickPress}
            label="R3"
          />
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-xs font-mono text-gray-500">BLU-PRINCE</div>
        <div className="text-[8px] text-gray-600 font-mono">TOSS CARTRIDGE LOADER</div>
      </div>
    </div>
  );
}
