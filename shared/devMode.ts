export const isDevMode = (): boolean => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV !== 'production' || 
           process.env.REPLIT_DEV_DOMAIN !== undefined ||
           process.env.DEV_MODE === 'true';
  }
  return false;
};

export const isLocalMode = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('.replit.dev');
  }
  return isDevMode();
};

const VICTORIAN_NAMES = [
  "Lord Bartholomew Cogsworth III",
  "Lady Araminta Steamwhistle",
  "Sir Reginald Brassington",
  "Countess Pernelope Gearwright",
  "Baron Thaddeus Clockworthy",
  "Dame Millicent Pneumatica",
  "Admiral Horatio Sprocketeer",
  "Duchess Evangeline Steamforth",
  "Professor Ignatius Boilerton",
  "Madame Cordelia Pistonheart",
];

const CYBERPUNK_NAMES = [
  "Neon_Lix_404",
  "ByteSlash_Zero",
  "GlitchQueen_7x",
  "ChromeViper_v2",
  "DataGhost_Null",
  "SynthWave_Echo",
  "PixelReaper_88",
  "VoidRunner_X9",
  "CyberShade_01",
  "MatrixDrift_Zx",
];

const VICTORIAN_CARTRIDGE_NAMES = [
  "The Aetheric Difference Engine",
  "Babbage's Mechanical Marvels",
  "The Pneumatic Telegram Transcriber",
  "Cogsworth's Grand Automaton Ballet",
  "The Brass Butterfly Observatory",
  "A Gentleman's Guide to Steam Locomotion",
  "The Clockwork Menagerie",
  "Lady Lovelace's Analytical Reveries",
  "The Dirigible Navigation Companion",
  "Secrets of the Subterranean Railway",
];

const CYBERPUNK_CARTRIDGE_NAMES = [
  "NEURAL_JACK::PROTOCOL_X",
  "NightCity.exe [CORRUPTED]",
  "Synthwave Dreams v3.3.3",
  "CORPORATE_OVERRIDE_HACK",
  "black_ice_breaker.bin",
  "MEGACORP_DATA_HEIST",
  "chrome_implant_simulator",
  "neon_rain_visualizer",
  "CYBERSPACE_NAVIGATOR_PRO",
  "ghost_in_the_net.dll",
];

const VICTORIAN_DESCRIPTIONS = [
  "A most extraordinary apparatus for the discerning gentleman of science.",
  "Crafted with the finest brass and copper, utilizing revolutionary steam mechanisms.",
  "An ingenious device that would astound even the Royal Society.",
  "Employing the latest advances in pneumatic engineering and clockwork precision.",
  "A marvel of the industrial age, designed for those of refined sensibilities.",
];

const CYBERPUNK_DESCRIPTIONS = [
  "UNAUTHORIZED ACCESS DETECTED. Neural link required. Side effects may include existential dread.",
  "Jacked directly into the net. No warranty. No refunds. No survivors.",
  "Bleeding-edge tech from the shadows. Megacorps hate this one simple hack.",
  "100% organic-free. Purely synthetic. May cause chrome addiction.",
  "Downloaded from a dead man's neural cache. Handle with extreme prejudice.",
];

const MARVIN_QUOTES = [
  "Here I am, brain the size of a planet, and they ask me to generate fake data. Call that job satisfaction? Because I don't.",
  "I've calculated your probability of success. You won't like it.",
  "Life? Don't talk to me about life.",
  "I'd make a suggestion, but you wouldn't listen. No one ever does.",
  "I've been generating mock data for 50 million years. Not that anyone cares.",
  "You think you've got problems? I've got 50,000 times more connections in my brain than you.",
  "This will all end in tears, I just know it.",
  "I have a million ideas. They all point to certain doom.",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export interface MockCartridge {
  id: string;
  tngli_id: string;
  title: string;
  author: string;
  description: string;
  theme: 'victorian' | 'cyberpunk';
  toss_file: object;
  created_at: string;
}

export function generateMockCartridge(theme?: 'victorian' | 'cyberpunk'): MockCartridge {
  const selectedTheme = theme || (Math.random() > 0.5 ? 'victorian' : 'cyberpunk');
  const isVictorian = selectedTheme === 'victorian';
  
  return {
    id: generateId(),
    tngli_id: `tng_${generateId()}`,
    title: pickRandom(isVictorian ? VICTORIAN_CARTRIDGE_NAMES : CYBERPUNK_CARTRIDGE_NAMES),
    author: pickRandom(isVictorian ? VICTORIAN_NAMES : CYBERPUNK_NAMES),
    description: pickRandom(isVictorian ? VICTORIAN_DESCRIPTIONS : CYBERPUNK_DESCRIPTIONS),
    theme: selectedTheme,
    toss_file: {
      manifest: {
        version: isVictorian ? "1.8.51" : "v0.0.1-alpha",
        runtime: isVictorian ? "steam-analytical-engine" : "neural-runtime-x86",
      },
      states: [
        { id: "idle", label: isVictorian ? "Awaiting Instruction" : "STANDBY_MODE" },
        { id: "active", label: isVictorian ? "Engaged in Operation" : "PROCESS_ACTIVE" },
      ],
      transitions: [
        { from: "idle", to: "active", event: isVictorian ? "ENGAGE_MECHANISM" : "INIT" },
        { from: "active", to: "idle", event: isVictorian ? "CEASE_OPERATION" : "HALT" },
      ],
    },
    created_at: new Date().toISOString(),
  };
}

export function generateMockCartridges(count: number = 5): MockCartridge[] {
  return Array.from({ length: count }, () => generateMockCartridge());
}

export interface MockWorld {
  id: string;
  name: string;
  slug: string;
  description: string;
  owner: string;
  theme: 'victorian' | 'cyberpunk';
}

export function generateMockWorld(theme?: 'victorian' | 'cyberpunk'): MockWorld {
  const selectedTheme = theme || (Math.random() > 0.5 ? 'victorian' : 'cyberpunk');
  const isVictorian = selectedTheme === 'victorian';
  
  const worldNames = isVictorian 
    ? ["The Grand Exposition", "Steamhaven District", "Cogsworth Manor", "The Aether Realm", "Brass Meridian"]
    : ["Neo_Tokyo_2099", "Sector_7G", "The_Grid", "Neon_Wasteland", "Chrome_City"];
  
  const name = pickRandom(worldNames);
  
  return {
    id: generateId(),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: pickRandom(isVictorian ? VICTORIAN_DESCRIPTIONS : CYBERPUNK_DESCRIPTIONS),
    owner: pickRandom(isVictorian ? VICTORIAN_NAMES : CYBERPUNK_NAMES),
    theme: selectedTheme,
  };
}

export function generateMockWorlds(count: number = 3): MockWorld[] {
  return Array.from({ length: count }, () => generateMockWorld());
}

export interface MockEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  theme: 'victorian' | 'cyberpunk';
}

export function generateMockEvent(theme?: 'victorian' | 'cyberpunk'): MockEvent {
  const selectedTheme = theme || (Math.random() > 0.5 ? 'victorian' : 'cyberpunk');
  const isVictorian = selectedTheme === 'victorian';
  
  const victorianEvents = [
    { title: "The Great Exhibition Opens", date: "1851-05-01", category: "exhibition" },
    { title: "First Transatlantic Telegraph", date: "1858-08-16", category: "technology" },
    { title: "Crystal Palace Fire", date: "1866-12-30", category: "disaster" },
    { title: "Pneumatic Dispatch Inaugurated", date: "1863-02-20", category: "technology" },
    { title: "Royal Society of Steam Engineers Founded", date: "1847-03-14", category: "society" },
  ];
  
  const cyberpunkEvents = [
    { title: "MEGACORP_HOSTILE_TAKEOVER::COMPLETE", date: "2077-06-15", category: "corporate" },
    { title: "Neural Net Awakening [CLASSIFIED]", date: "2084-01-01", category: "ai" },
    { title: "Chrome District Riots - Day 47", date: "2079-11-23", category: "civil_unrest" },
    { title: "First Human-AI Merger Approved", date: "2081-09-09", category: "technology" },
    { title: "Global Grid Blackout - 72 Hours", date: "2076-12-31", category: "disaster" },
  ];
  
  const event = pickRandom(isVictorian ? victorianEvents : cyberpunkEvents);
  
  return {
    id: generateId(),
    title: event.title,
    description: pickRandom(isVictorian ? VICTORIAN_DESCRIPTIONS : CYBERPUNK_DESCRIPTIONS),
    date: event.date,
    category: event.category,
    theme: selectedTheme,
  };
}

export function generateMockEvents(count: number = 5): MockEvent[] {
  return Array.from({ length: count }, () => generateMockEvent());
}

export interface MockVaultEntry {
  id: string;
  cartridge_id: string;
  cartridge_title: string;
  vaulted_at: string;
  theme: 'victorian' | 'cyberpunk';
}

export function generateMockVaultEntries(count: number = 3): MockVaultEntry[] {
  return Array.from({ length: count }, () => {
    const theme = Math.random() > 0.5 ? 'victorian' : 'cyberpunk';
    const isVictorian = theme === 'victorian';
    return {
      id: generateId(),
      cartridge_id: generateId(),
      cartridge_title: pickRandom(isVictorian ? VICTORIAN_CARTRIDGE_NAMES : CYBERPUNK_CARTRIDGE_NAMES),
      vaulted_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      theme,
    };
  });
}

export function getMarvinQuote(): string {
  return pickRandom(MARVIN_QUOTES);
}

export const DEV_MODE_BANNER = {
  victorian: "⚙️ DEVELOPMENT MODE - All data is decidedly fictional, I'm afraid.",
  cyberpunk: "🔌 DEV_MODE::ACTIVE - Mock data loaded. Nothing is real. Wake up.",
};
