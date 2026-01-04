import { LucideIcon } from "lucide-react";

export interface RouteNode {
  path: string;
  label: string;
  category: "core" | "tools" | "ecosystem" | "admin" | "settings";
  description?: string;
  icon?: string;
  children?: RouteNode[];
}

export const SITE_MAP: RouteNode[] = [
  {
    path: "/",
    label: "Home",
    category: "core",
    description: "Main landing page with ecosystem overview",
    icon: "Home",
  },
  {
    path: "/editor",
    label: "Blu-Prince Editor",
    category: "tools",
    description: "Visual TOSS cartridge designer with 3D scene tree",
    icon: "Hexagon",
  },
  {
    path: "/blu-prince",
    label: "Blu-Prince FSM",
    category: "tools",
    description: "State machine editor for cartridge logic",
    icon: "GitBranch",
  },
  {
    path: "/statechart",
    label: "Statechart 3D",
    category: "tools",
    description: "3D visualization of state machine diagrams",
    icon: "Box",
  },
  {
    path: "/runtime",
    label: "Runtime Simulator",
    category: "tools",
    description: "Execute and test TOSS cartridges",
    icon: "Play",
  },
  {
    path: "/playground",
    label: "Playground",
    category: "tools",
    description: "Experimental 3D physics sandbox",
    icon: "Gamepad2",
  },
  {
    path: "/widgets",
    label: "Components Showcase",
    category: "tools",
    description: "Widget library and component demos",
    icon: "Layers",
  },
  {
    path: "/controller",
    label: "Controller Demo",
    category: "tools",
    description: "Gamepad input testing and binding",
    icon: "Gamepad",
  },
  {
    path: "/library",
    label: "Cartridge Library",
    category: "core",
    description: "Browse and manage TOSS cartridges",
    icon: "Package",
  },
  {
    path: "/unwanted",
    label: "Unwanted.ad",
    category: "ecosystem",
    description: "Auction site for misfit toys",
    icon: "Tag",
  },
  {
    path: "/artsy",
    label: "Artsy.sale",
    category: "ecosystem",
    description: "Art dealer auction platform",
    icon: "Palette",
  },
  {
    path: "/coins",
    label: "Coins.rip",
    category: "ecosystem",
    description: "Crypto swing trade visualization",
    icon: "Coins",
  },
  {
    path: "/data-tables",
    label: "Data Tables",
    category: "admin",
    description: "Database schema and content explorer",
    icon: "Table",
  },
  {
    path: "/vault",
    label: "Vault",
    category: "admin",
    description: "Secure storage dashboard",
    icon: "Lock",
  },
  {
    path: "/admin/events",
    label: "Admin Events",
    category: "admin",
    description: "System event log viewer",
    icon: "Activity",
  },
  {
    path: "/utilities",
    label: "Utilities",
    category: "admin",
    description: "Developer tools and utilities",
    icon: "Wrench",
  },
  {
    path: "/pricing",
    label: "Pricing",
    category: "core",
    description: "Subscription tiers and pricing",
    icon: "CreditCard",
  },
  {
    path: "/revenue",
    label: "Revenue Calculator",
    category: "admin",
    description: "Revenue projection tool",
    icon: "Calculator",
  },
  {
    path: "/input-settings",
    label: "Input Settings",
    category: "settings",
    description: "Keyboard and controller binding configuration",
    icon: "Settings",
  },
];

export function getRoutesByCategory(category: RouteNode["category"]): RouteNode[] {
  return SITE_MAP.filter((route) => route.category === category);
}

export function getAllCategories(): RouteNode["category"][] {
  return ["core", "tools", "ecosystem", "admin", "settings"];
}

export function getCategoryLabel(category: RouteNode["category"]): string {
  const labels: Record<RouteNode["category"], string> = {
    core: "Core",
    tools: "Tools",
    ecosystem: "Ecosystem",
    admin: "Admin",
    settings: "Settings",
  };
  return labels[category];
}

export function getCategoryColor(category: RouteNode["category"]): string {
  const colors: Record<RouteNode["category"], string> = {
    core: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    tools: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    ecosystem: "text-green-400 border-green-500/30 bg-green-500/10",
    admin: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    settings: "text-gray-400 border-gray-500/30 bg-gray-500/10",
  };
  return colors[category];
}
