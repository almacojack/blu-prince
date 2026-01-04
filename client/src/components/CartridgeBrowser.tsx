import { useState, useCallback, useMemo, Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Play, Info } from "lucide-react";
import { Cartridge3D } from "./Cartridge3D";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export interface CartridgeEntry {
  id: string;
  title: string;
  author: string;
  description?: string;
  color?: string;
  labelColor?: string;
}

interface CartridgeBrowserProps {
  cartridges: CartridgeEntry[];
  onSelect?: (cartridge: CartridgeEntry) => void;
  onLoad?: (cartridge: CartridgeEntry) => void;
  onClose?: () => void;
  className?: string;
}

const CART_SPACING = 3.2;
const SIDE_TILT = Math.PI / 6;
const SELECTED_Z = 1.5;

function CartridgeScene({
  cartridges,
  selectedIndex,
  onSelect,
}: {
  cartridges: CartridgeEntry[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const positions = useMemo(() => {
    return cartridges.map((_, i) => {
      const offset = i - selectedIndex;
      const x = offset * CART_SPACING;
      const z = offset === 0 ? SELECTED_Z : -Math.abs(offset) * 0.5;
      const rotY = offset === 0 ? 0 : offset > 0 ? -SIDE_TILT : SIDE_TILT;
      return { x, z, rotY };
    });
  }, [cartridges, selectedIndex]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <directionalLight position={[-3, 4, -2]} intensity={0.3} />
      <spotLight
        position={[0, 5, 8]}
        angle={0.4}
        penumbra={0.5}
        intensity={0.6}
        castShadow
      />

      {cartridges.map((cart, i) => {
        const pos = positions[i];
        return (
          <Cartridge3D
            key={cart.id}
            title={cart.title}
            author={cart.author}
            color={cart.color || "#1a1a2e"}
            labelColor={cart.labelColor || "#f8f8f8"}
            selected={i === selectedIndex}
            position={[pos.x, 0, pos.z]}
            rotation={[0, pos.rotY, 0]}
            onClick={() => onSelect(i)}
          />
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#0a0a15"
          roughness={0.8}
          metalness={0.2}
          transparent
          opacity={0.8}
        />
      </mesh>

      <Environment preset="city" />
    </>
  );
}

export function CartridgeBrowser({
  cartridges,
  onSelect,
  onLoad,
  onClose,
  className,
}: CartridgeBrowserProps) {
  const { themeVariant } = useTheme();
  const isVictorian = themeVariant === "victorian";
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => Math.min(cartridges.length - 1, prev + 1));
  }, [cartridges.length]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "ArrowRight") handleNext();
      else if (e.key === "Enter" && cartridges[selectedIndex]) {
        onLoad?.(cartridges[selectedIndex]);
      }
      else if (e.key === "Escape") onClose?.();
    },
    [handlePrev, handleNext, cartridges, selectedIndex, onLoad, onClose]
  );

  const selectedCart = cartridges[selectedIndex];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 z-50 flex flex-col outline-none",
        isVictorian ? "bg-amber-950/95" : "bg-black/95",
        className
      )}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      data-testid="cartridge-browser"
    >
      <div
        className={cn(
          "flex items-center justify-between px-6 py-4 border-b",
          isVictorian ? "border-amber-700/30" : "border-white/10"
        )}
      >
        <h2
          className={cn(
            "text-2xl font-bold tracking-wide",
            isVictorian ? "font-serif text-amber-100" : "text-cyan-400"
          )}
        >
          Cartridge Library
        </h2>

        <button
          onClick={onClose}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isVictorian
              ? "hover:bg-amber-800/50 text-amber-300"
              : "hover:bg-white/10 text-white"
          )}
          data-testid="button-close-browser"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative">
        <Canvas shadows dpr={[1, 2]}>
          <PerspectiveCamera makeDefault position={[0, 1, 8]} fov={50} />
          <Suspense fallback={null}>
            <CartridgeScene
              cartridges={cartridges}
              selectedIndex={selectedIndex}
              onSelect={(i) => {
                if (i === selectedIndex) {
                  onSelect?.(cartridges[i]);
                } else {
                  setSelectedIndex(i);
                }
              }}
            />
          </Suspense>
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2.2}
            minAzimuthAngle={-Math.PI / 6}
            maxAzimuthAngle={Math.PI / 6}
          />
        </Canvas>

        <button
          onClick={handlePrev}
          disabled={selectedIndex === 0}
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all",
            isVictorian
              ? "bg-amber-800/80 hover:bg-amber-700/80 text-amber-100 disabled:opacity-30"
              : "bg-white/10 hover:bg-white/20 text-white disabled:opacity-30",
            "backdrop-blur-sm"
          )}
          data-testid="button-prev-cart"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        <button
          onClick={handleNext}
          disabled={selectedIndex === cartridges.length - 1}
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all",
            isVictorian
              ? "bg-amber-800/80 hover:bg-amber-700/80 text-amber-100 disabled:opacity-30"
              : "bg-white/10 hover:bg-white/20 text-white disabled:opacity-30",
            "backdrop-blur-sm"
          )}
          data-testid="button-next-cart"
        >
          <ChevronRight className="w-8 h-8" />
        </button>

        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 p-6",
            "bg-gradient-to-t",
            isVictorian ? "from-amber-950 to-transparent" : "from-black to-transparent"
          )}
        >
          <AnimatePresence mode="wait">
            {selectedCart && (
              <motion.div
                key={selectedCart.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h3
                  className={cn(
                    "text-3xl font-bold mb-2",
                    isVictorian ? "font-serif text-amber-100" : "text-white"
                  )}
                  data-testid="text-cart-title"
                >
                  {selectedCart.title}
                </h3>
                <p
                  className={cn(
                    "text-lg mb-1",
                    isVictorian ? "text-amber-300" : "text-cyan-400"
                  )}
                  data-testid="text-cart-author"
                >
                  by {selectedCart.author}
                </p>
                {selectedCart.description && (
                  <p
                    className={cn(
                      "text-sm max-w-lg mx-auto mb-4",
                      isVictorian ? "text-amber-200/70" : "text-white/60"
                    )}
                    data-testid="text-cart-description"
                  >
                    {selectedCart.description}
                  </p>
                )}

                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => onLoad?.(selectedCart)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all",
                      isVictorian
                        ? "bg-amber-600 hover:bg-amber-500 text-amber-950"
                        : "bg-cyan-500 hover:bg-cyan-400 text-black"
                    )}
                    data-testid="button-load-cart"
                  >
                    <Play className="w-5 h-5" />
                    Load Cartridge
                  </button>

                  <button
                    onClick={() => onSelect?.(selectedCart)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg transition-all",
                      isVictorian
                        ? "bg-amber-800/50 hover:bg-amber-700/50 text-amber-100"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    )}
                    data-testid="button-info-cart"
                  >
                    <Info className="w-5 h-5" />
                    Details
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div
        className={cn(
          "px-6 py-3 border-t flex items-center justify-center gap-2",
          isVictorian ? "border-amber-700/30" : "border-white/10"
        )}
      >
        {cartridges.map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              i === selectedIndex
                ? isVictorian
                  ? "bg-amber-400 w-6"
                  : "bg-cyan-400 w-6"
                : isVictorian
                ? "bg-amber-700/50 hover:bg-amber-600/50"
                : "bg-white/30 hover:bg-white/50"
            )}
            data-testid={`button-dot-${i}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default CartridgeBrowser;
