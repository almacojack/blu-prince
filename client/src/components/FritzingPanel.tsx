import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { 
  GripVertical, X, Minimize2, CircuitBoard, Lightbulb, 
  ToggleLeft, Cpu, Cable, Zap, Square, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ElectronicPart {
  id: string;
  name: string;
  category: "board" | "component" | "wire" | "sensor" | "output";
  color: string;
  icon: "breadboard" | "led" | "resistor" | "wire" | "button" | "capacitor" | "arduino" | "sensor" | "motor";
  description: string;
}

const ELECTRONIC_PARTS: ElectronicPart[] = [
  { id: "breadboard-half", name: "Half Breadboard", category: "board", color: "#f5f5f0", icon: "breadboard", description: "400 tie-point solderless breadboard" },
  { id: "breadboard-full", name: "Full Breadboard", category: "board", color: "#f5f5f0", icon: "breadboard", description: "830 tie-point solderless breadboard" },
  { id: "arduino-uno", name: "Arduino Uno", category: "board", color: "#00979d", icon: "arduino", description: "ATmega328P microcontroller board" },
  { id: "arduino-nano", name: "Arduino Nano", category: "board", color: "#00979d", icon: "arduino", description: "Compact ATmega328P board" },
  { id: "esp32", name: "ESP32 DevKit", category: "board", color: "#e7352c", icon: "arduino", description: "WiFi + Bluetooth microcontroller" },
  { id: "led-red", name: "LED Red", category: "output", color: "#ef4444", icon: "led", description: "5mm red LED, 2V forward voltage" },
  { id: "led-green", name: "LED Green", category: "output", color: "#22c55e", icon: "led", description: "5mm green LED, 2.2V forward voltage" },
  { id: "led-blue", name: "LED Blue", category: "output", color: "#3b82f6", icon: "led", description: "5mm blue LED, 3.2V forward voltage" },
  { id: "led-yellow", name: "LED Yellow", category: "output", color: "#eab308", icon: "led", description: "5mm yellow LED, 2V forward voltage" },
  { id: "led-rgb", name: "RGB LED", category: "output", color: "#a855f7", icon: "led", description: "Common cathode RGB LED" },
  { id: "resistor-220", name: "220Ω Resistor", category: "component", color: "#d97706", icon: "resistor", description: "1/4W carbon film resistor" },
  { id: "resistor-1k", name: "1kΩ Resistor", category: "component", color: "#d97706", icon: "resistor", description: "1/4W carbon film resistor" },
  { id: "resistor-10k", name: "10kΩ Resistor", category: "component", color: "#d97706", icon: "resistor", description: "1/4W carbon film resistor" },
  { id: "capacitor-100uf", name: "100µF Capacitor", category: "component", color: "#1e40af", icon: "capacitor", description: "Electrolytic capacitor, 25V" },
  { id: "capacitor-10uf", name: "10µF Capacitor", category: "component", color: "#1e40af", icon: "capacitor", description: "Electrolytic capacitor, 16V" },
  { id: "button-tactile", name: "Tactile Button", category: "component", color: "#374151", icon: "button", description: "6mm momentary push button" },
  { id: "potentiometer", name: "Potentiometer 10k", category: "component", color: "#1e3a8a", icon: "sensor", description: "10kΩ rotary potentiometer" },
  { id: "wire-red", name: "Jumper Wire Red", category: "wire", color: "#ef4444", icon: "wire", description: "Male-to-male jumper wire" },
  { id: "wire-black", name: "Jumper Wire Black", category: "wire", color: "#1f2937", icon: "wire", description: "Male-to-male jumper wire" },
  { id: "wire-green", name: "Jumper Wire Green", category: "wire", color: "#22c55e", icon: "wire", description: "Male-to-male jumper wire" },
  { id: "wire-yellow", name: "Jumper Wire Yellow", category: "wire", color: "#eab308", icon: "wire", description: "Male-to-male jumper wire" },
  { id: "wire-blue", name: "Jumper Wire Blue", category: "wire", color: "#3b82f6", icon: "wire", description: "Male-to-male jumper wire" },
  { id: "photoresistor", name: "Photoresistor", category: "sensor", color: "#f97316", icon: "sensor", description: "Light-dependent resistor (LDR)" },
  { id: "temp-sensor", name: "TMP36 Temp Sensor", category: "sensor", color: "#0ea5e9", icon: "sensor", description: "Analog temperature sensor" },
  { id: "ultrasonic", name: "HC-SR04 Ultrasonic", category: "sensor", color: "#8b5cf6", icon: "sensor", description: "Distance sensor, 2-400cm range" },
  { id: "servo", name: "Micro Servo", category: "output", color: "#374151", icon: "motor", description: "SG90 9g micro servo motor" },
  { id: "dc-motor", name: "DC Motor", category: "output", color: "#78716c", icon: "motor", description: "Small DC hobby motor" },
  { id: "buzzer", name: "Piezo Buzzer", category: "output", color: "#1f2937", icon: "sensor", description: "Active piezo buzzer" },
];

const CATEGORIES = [
  { id: "all", name: "All Parts", icon: CircuitBoard },
  { id: "board", name: "Boards", icon: Cpu },
  { id: "component", name: "Components", icon: Zap },
  { id: "wire", name: "Wires", icon: Cable },
  { id: "sensor", name: "Sensors", icon: Circle },
  { id: "output", name: "Outputs", icon: Lightbulb },
];

function PartIcon({ icon, color }: { icon: ElectronicPart["icon"]; color: string }) {
  const iconClass = "w-6 h-6";
  switch (icon) {
    case "breadboard":
      return (
        <div className="w-6 h-6 rounded-sm border-2" style={{ borderColor: "#888", background: color }}>
          <div className="w-full h-full grid grid-cols-4 gap-px p-0.5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-400 rounded-full" style={{ width: 2, height: 2 }} />
            ))}
          </div>
        </div>
      );
    case "led":
      return (
        <div className="relative">
          <Lightbulb className={iconClass} style={{ color }} />
          <div 
            className="absolute inset-0 blur-sm opacity-50 rounded-full"
            style={{ background: color }}
          />
        </div>
      );
    case "resistor":
      return (
        <div className="w-6 h-3 flex items-center">
          <div className="w-1 h-0.5 bg-gray-400" />
          <div className="flex-1 h-2 rounded-sm flex items-center justify-center gap-0.5" style={{ background: "#e8d5b0" }}>
            <div className="w-0.5 h-full bg-amber-600" />
            <div className="w-0.5 h-full bg-amber-800" />
            <div className="w-0.5 h-full bg-amber-600" />
            <div className="w-0.5 h-full bg-yellow-400" />
          </div>
          <div className="w-1 h-0.5 bg-gray-400" />
        </div>
      );
    case "wire":
      return <Cable className={iconClass} style={{ color }} />;
    case "button":
      return <ToggleLeft className={iconClass} style={{ color }} />;
    case "capacitor":
      return (
        <div className="w-4 h-6 rounded-sm flex flex-col items-center justify-end" style={{ background: color }}>
          <div className="w-2 h-1 bg-gray-400" />
        </div>
      );
    case "arduino":
      return <Cpu className={iconClass} style={{ color }} />;
    case "sensor":
      return <Circle className={iconClass} style={{ color }} />;
    case "motor":
      return <Zap className={iconClass} style={{ color }} />;
    default:
      return <Square className={iconClass} style={{ color }} />;
  }
}

interface FritzingPanelProps {
  onSelectPart?: (part: ElectronicPart) => void;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  "data-testid"?: string;
}

export function FritzingPanel({
  onSelectPart,
  onClose,
  initialPosition = { x: 16, y: 200 },
  "data-testid": testId,
}: FritzingPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const dragControls = useDragControls();

  const filteredParts = selectedCategory === "all" 
    ? ELECTRONIC_PARTS 
    : ELECTRONIC_PARTS.filter(p => p.category === selectedCategory);

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      initial={{ x: initialPosition.x, y: initialPosition.y }}
      className="fixed z-50 select-none"
      style={{ touchAction: "none" }}
      data-testid={testId}
    >
      <div className="w-72 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg border-2 border-teal-600 shadow-2xl overflow-hidden">
        <div 
          className="flex items-center justify-between px-3 py-2 cursor-move bg-gradient-to-r from-teal-700 to-teal-600 border-b border-teal-500"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-teal-200" />
            <CircuitBoard className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white tracking-wide">
              FRITZING PARTS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 text-teal-200 hover:text-white hover:bg-teal-600"
              onClick={() => setIsMinimized(!isMinimized)}
              data-testid="button-minimize-fritzing"
            >
              <Minimize2 className="w-3 h-3" />
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-teal-200 hover:text-red-400 hover:bg-teal-600"
                onClick={onClose}
                data-testid="button-close-fritzing"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {!isMinimized && (
          <>
            <div className="flex gap-1 p-2 bg-gray-850 border-b border-gray-700 overflow-x-auto">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`h-7 px-2 text-xs whitespace-nowrap ${
                    selectedCategory === cat.id 
                      ? "bg-teal-600 text-white" 
                      : "text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                  data-testid={`filter-${cat.id}`}
                >
                  <cat.icon className="w-3 h-3 mr-1" />
                  {cat.name}
                </Button>
              ))}
            </div>

            <ScrollArea className="h-80">
              <div className="p-2 space-y-1">
                {filteredParts.map(part => (
                  <button
                    key={part.id}
                    onClick={() => onSelectPart?.(part)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-teal-600/20 border border-transparent hover:border-teal-500/50 transition-all group"
                    data-testid={`part-${part.id}`}
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-900 rounded border border-gray-700 group-hover:border-teal-500/50">
                      <PartIcon icon={part.icon} color={part.color} />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white group-hover:text-teal-300">
                        {part.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {part.description}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[8px] border-gray-600 text-gray-400"
                    >
                      {part.category}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="p-2 border-t border-gray-700 bg-gray-850">
              <div className="text-[10px] text-gray-500 text-center">
                Drag parts to the 3D scene to place them
              </div>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="p-2 flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-teal-400" />
            <span className="text-xs text-gray-400">
              {ELECTRONIC_PARTS.length} parts available
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export { ELECTRONIC_PARTS };
export type { ElectronicPart };
