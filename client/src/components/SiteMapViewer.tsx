import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Home, Hexagon, GitBranch, Box, Play, Gamepad2, Layers, Gamepad, 
  Package, Tag, Palette, Coins, Table, Lock, Activity, Wrench, 
  CreditCard, Calculator, Settings, Map, ChevronRight, ExternalLink
} from "lucide-react";
import { SITE_MAP, RouteNode, getAllCategories, getCategoryLabel, getCategoryColor } from "@shared/siteMap";

const iconMap: Record<string, any> = {
  Home, Hexagon, GitBranch, Box, Play, Gamepad2, Layers, Gamepad,
  Package, Tag, Palette, Coins, Table, Lock, Activity, Wrench,
  CreditCard, Calculator, Settings,
};

interface SiteMapViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SiteMapViewer({ isOpen, onClose }: SiteMapViewerProps) {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  const getRoutesForCategory = (category: RouteNode["category"]) => {
    return SITE_MAP.filter((route) => route.category === category);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
            data-testid="sitemap-backdrop"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90vw] max-w-3xl max-h-[80vh] overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-2xl"
            data-testid="sitemap-viewer"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
              <div className="flex items-center gap-2">
                <Map className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-mono font-bold text-white">Site Map</h2>
                <span className="text-xs text-gray-500 font-mono ml-2">
                  {SITE_MAP.length} pages
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                data-testid="button-close-sitemap"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="grid gap-4">
                {getAllCategories().map((category) => {
                  const routes = getRoutesForCategory(category);
                  if (routes.length === 0) return null;

                  return (
                    <div key={category}>
                      <div className={`text-xs font-mono uppercase tracking-wider mb-2 px-2 py-1 rounded inline-block ${getCategoryColor(category)}`}>
                        {getCategoryLabel(category)}
                      </div>
                      <div className="grid gap-1">
                        {routes.map((route) => {
                          const Icon = route.icon ? iconMap[route.icon] : ChevronRight;
                          const isActive = location === route.path;
                          const isHovered = hoveredRoute === route.path;

                          return (
                            <motion.button
                              key={route.path}
                              onClick={() => handleNavigate(route.path)}
                              onMouseEnter={() => setHoveredRoute(route.path)}
                              onMouseLeave={() => setHoveredRoute(null)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                                isActive
                                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300"
                                  : "hover:bg-white/5 border border-transparent hover:border-white/10 text-gray-300"
                              }`}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                              data-testid={`sitemap-link-${route.path.replace(/\//g, "-").slice(1) || "home"}`}
                            >
                              <div className={`p-1.5 rounded ${isActive ? "bg-cyan-500/20" : "bg-white/5 group-hover:bg-white/10"}`}>
                                {Icon && <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-gray-400 group-hover:text-white"}`} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${isActive ? "text-cyan-300" : "text-white"}`}>
                                    {route.label}
                                  </span>
                                  {isActive && (
                                    <span className="text-[10px] bg-cyan-500/30 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                                      CURRENT
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {route.description}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  {route.path}
                                </span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-gray-500 font-mono">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-400">ESC</kbd> or click outside to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
