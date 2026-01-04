# TingOs Platform - Development Progress

**Last Updated:** January 2026  
**Status:** Active Development - MVP Complete

---

## Executive Summary

TingOs is a universal gaming engine platform built around the concept of "cartridges" - portable state machines called TOSS files (TingOs State Schema). The platform enables artists and creators to build interactive experiences, games, and simulations with a visual, no-code approach.

The killer feature is **game controller support as first-class objects** with zero-config detection and cross-platform parity.

---

## What We Built

### 1. TOSS File Format & Runtime Engine

**Location:** `client/src/lib/toss-v1.ts`, `shared/schema.ts`

The TOSS (TingOs State Schema) format is the core data structure powering all cartridges:

```typescript
interface TOSSFile {
  version: "1.0";
  manifest: {
    id: string;           // UUID
    tngli_id: string;     // Short shareable ID (e.g., "abc123")
    metadata: { title, author, version, description }
  };
  fsm: {
    initial: string;
    states: Record<string, StateConfig>;
    context: Record<string, any>;
  };
  assets: AssetDefinition[];
  assets_3d: Asset3D[];   // Embedded 3D models
}
```

**Features:**
- Self-contained cartridge files with embedded 3D assets
- State machine definition with guards, actions, and transitions
- Memory schema with typed context variables
- Support for glTF, GLB, OBJ, STL, and Three.js JSON formats

---

### 2. Immersive 3D Experience

**Location:** `client/src/components/BackgroundStage.tsx`

An 80s-inspired immersive backdrop that makes users feel like "a kid watching Atari on the TV":

- **CRT TV monitor** with glow effects and vintage styling
- **Cartridge shelf** displaying a collection of game cartridges
- **Atari console** on the floor with controller
- **Beanbag chair** for the cozy vibe
- **Neon grid floor** with infinite perspective
- **Floating particles** with ambient animation
- **Post-processing effects:** Bloom, Chromatic Aberration, Vignette

The 3D scene uses React Three Fiber with Rapier physics, lazy-loaded for performance.

---

### 3. Cyberpunk Navigation System

**Location:** `client/src/components/NeonPathNav.tsx`

A glowing neon navigation bar with:

- **Animated SVG path** with gradient glow effect
- **Nav nodes** for Home, Design, Cartridges, Controls
- **Active state indicators** with color-coded glow
- **Command palette button** (Ctrl+K / Cmd+K)
- **Fullscreen toggle** (F key)
- **Sign In/Out** with user avatar display
- **44px+ touch targets** for mobile accessibility

---

### 4. Command Palette

**Location:** `client/src/components/GlobalCommandPalette.tsx`

A powerful command palette accessible via keyboard shortcut:

- **Categories:** Navigation, Tools, Help
- **Search:** Filter commands by name or category
- **Keyboard navigation:** Arrow keys, Enter to select
- **Quick actions:** Jump to any page, toggle fullscreen, start tutorials

---

### 5. Interactive Tutorial System

**Location:** `client/src/contexts/TutorialContext.tsx`, `client/src/components/TutorialOverlay.tsx`

Five guided tutorials with spotlight highlighting:

1. **Getting Started** - Platform overview
2. **Creating States** - FSM basics
3. **Environmental Forces** - Fire, ice, water, wind simulation
4. **Game Controllers** - Mapping inputs
5. **3D Assets** - Importing and using models

**Features:**
- SVG mask spotlight on target elements
- Step-by-step progression with descriptions
- Keyboard navigation (Escape, Arrow keys, Enter)
- Progress persistence in localStorage

---

### 6. Worlds & Vault System

**Location:** `shared/schema.ts`, `server/storage.ts`, `server/routes.ts`, `client/src/pages/vault.tsx`

The vault allows creators to organize cartridges into "Worlds" - imaginary universes:

**Database Schema:**
- `worlds` - Collections with title, slug, visibility, tenant
- `world_cartridges` - Join table with role (main/supporting)
- `vault_entries` - Backup records with checksums
- `export_grants` - Tier-based export permissions

**API Endpoints:**
- `GET/POST /api/worlds` - List and create worlds
- `GET/PUT/DELETE /api/worlds/:id` - World management
- `POST /api/worlds/:id/cartridges` - Add cartridge to world
- `GET /api/vault` - User's vault entries
- `POST /api/vault/:cartridgeId` - Backup a cartridge
- `GET /api/export/:cartridgeId` - Export (paid tier required)

**UI Features:**
- Album-style world cards with gradient backgrounds
- Visibility controls (private/unlisted/public)
- Create world dialog with slug generation
- Vault statistics dashboard
- Upgrade prompts for export functionality

---

### 7. Blu-Prince FSM Designer

**Location:** `client/src/pages/blu-prince.tsx`, `client/src/pages/editor.tsx`

The professional no-code visual design tool for creating TOSS cartridges:

- **Node-based state machine editor**
- **Drag-and-drop state creation**
- **Visual transition connections**
- **Property panels for state configuration**
- **Environmental forces simulation** (fire, ice, water, wind)

---

### 8. Controller Support

**Location:** `client/src/pages/controller.tsx`, `server/websocket.ts`

Zero-config game controller detection and mapping:

- **WebSocket real-time sync** for controller events
- **Visual button mapping UI**
- **Haptic feedback support**
- **Multi-controller support**
- **Cross-platform parity** (web, desktop, MicroPython)

---

### 9. 3D Asset Pipeline

**Location:** `client/src/lib/asset-importer.ts`, `client/src/lib/asset-loader.ts`

Import and manage 3D assets within cartridges:

**Supported Formats:**
- glTF/GLB (standard exchange format)
- OBJ (legacy mesh format)
- STL (3D printing format)
- Three.js JSON (from Three.js Editor)

**Features:**
- Automatic geometry metadata extraction
- Bounding box calculation
- Printability analysis for STL files
- Preview component with orbit controls

---

### 10. Cartridge Library

**Location:** `client/src/pages/cartridge-library.tsx`

Browse, search, and manage cartridge collection:

- **Grid view** with Atari-style cartridge labels
- **Search and filtering**
- **CRUD operations** (create, delete)
- **Load into runtime** functionality

---

### 11. Authentication System

**Location:** `server/replit_integrations/auth.ts`

Replit OAuth integration for user authentication:

- **One-click sign in** with Replit account
- **Session management** with PostgreSQL storage
- **User profiles** with avatar support
- **Protected routes** for vault/export features

---

### 12. Database Layer

**Location:** `shared/schema.ts`, `server/storage.ts`, `server/db.ts`

PostgreSQL database with Drizzle ORM:

**Tables:**
- `users` - Replit auth users
- `sessions` - Session storage
- `cartridges` - TOSS file storage with JSONB
- `worlds` - World collections
- `world_cartridges` - World-cartridge relationships
- `vault_entries` - Backup records
- `export_grants` - Export permissions
- `user_subscriptions` - Tier management

---

## Technical Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** for server state
- **Wouter** for routing
- **Tailwind CSS v4** with CSS variables
- **Shadcn/ui** + Radix primitives
- **Framer Motion** for animations
- **React Three Fiber** + Rapier for 3D

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** with PostgreSQL
- **WebSocket** for real-time controller sync
- **Passport** for authentication

### Database
- **PostgreSQL** (Neon-backed on Replit)
- **Drizzle migrations** for schema management

---

## Design Philosophy

### "Manipulate, Don't Manage"
Users should interact directly with visual objects, not hunt through menus. Every feature is designed for immediate, tactile interaction.

### "Show Me, Don't Make Me Find It"
Cartridges and tools are visually present and accessible. The 3D backdrop puts your content in context, like a kid's room full of games.

### 80s Atari Kid Vibe
The aesthetic evokes the wonder of childhood gaming - CRT monitors, glowing neons, beanbags, and the thrill of inserting a new cartridge.

---

## Satellite Site Strategy

TingOs serves as the core platform with domain-specific frontends:

| Domain | Purpose | Status |
|--------|---------|--------|
| **TingOs.org** | Core platform, vault, auth | Active |
| **blu-prince.com** | FSM design tool | Planned |
| **Unwanted.ad** | Misfit toys auction | Template Ready |
| **artsy.sale** | Art dealer platform | Template Ready |
| **coins.rip** | Crypto visualization | Template Ready |

See `SATELLITE_TEMPLATES.md` for implementation guides.

---

## File Structure

```
TingOs/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BackgroundStage.tsx     # 3D immersive backdrop
│   │   │   ├── NeonPathNav.tsx         # Cyberpunk navigation
│   │   │   ├── GlobalCommandPalette.tsx # Command palette
│   │   │   ├── TutorialOverlay.tsx     # Tutorial spotlight
│   │   │   ├── TutorialMenu.tsx        # Tutorial selection
│   │   │   └── SimulatorDisplay.tsx    # FSM simulator
│   │   ├── contexts/
│   │   │   ├── TutorialContext.tsx     # Tutorial state
│   │   │   ├── cartridge-context.tsx   # Cartridge state
│   │   │   └── UiScaleContext.tsx      # Accessibility zoom
│   │   ├── hooks/
│   │   │   ├── use-auth.ts             # Authentication
│   │   │   └── useFullscreen.ts        # Fullscreen toggle
│   │   ├── lib/
│   │   │   ├── toss-v1.ts              # TOSS file format
│   │   │   ├── asset-importer.ts       # 3D asset import
│   │   │   └── asset-loader.ts         # 3D asset loading
│   │   └── pages/
│   │       ├── home.tsx                # Landing page
│   │       ├── blu-prince.tsx          # FSM designer
│   │       ├── vault.tsx               # Vault dashboard
│   │       ├── cartridge-library.tsx   # Library browser
│   │       └── controller.tsx          # Controller config
│   └── index.html
├── server/
│   ├── index.ts                        # Server entry
│   ├── routes.ts                       # API routes
│   ├── storage.ts                      # Database operations
│   ├── db.ts                           # Drizzle connection
│   └── websocket.ts                    # Controller WebSocket
├── shared/
│   ├── schema.ts                       # Database schema
│   └── models/
│       └── auth.ts                     # Auth models
├── PROGRESS.md                         # This file
├── SATELLITE_TEMPLATES.md              # Satellite site guides
└── replit.md                           # Project documentation
```

---

## What's Next

### Immediate Priorities
1. **Blu-Prince visual polish** - The FSM designer needs the most attention
2. **Export functionality** - Wire up paid tier checks with Stripe
3. **Controller WebSocket** - Finalize cross-device sync

### Future Features
1. **Real-time collaboration** - Multiple users editing same world
2. **Marketplace** - Buy/sell cartridges and worlds
3. **Mobile app** - Native iOS/Android with controller support
4. **MicroPython runtime** - Run TOSS on embedded devices

---

## Development Notes

### Running Locally
```bash
npm install
npm run dev
```

### Database Commands
```bash
npm run db:push     # Push schema changes
npm run db:studio   # Open Drizzle Studio
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `SESSION_SECRET` - Session encryption key
- `REPLIT_DOMAINS` - Replit domain for OAuth

---

## Syncing to GitHub

To back up this project to a new GitHub repository:

### Step 1: Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new)
2. Name it `tingos` (or your preferred name)
3. Leave it **empty** (no README, no .gitignore, no license)
4. Click "Create repository"

### Step 2: Connect from Replit

In the Replit Shell, run these commands:

```bash
# Check current git status
git status

# If not initialized, initialize git
git init

# Add all files
git add .

# Commit current state
git commit -m "TingOs MVP - Worlds, Vault, and Immersive 3D"

# Add GitHub as remote (replace with your repo URL)
git remote add github https://github.com/YOUR_USERNAME/tingos.git

# Push to GitHub
git push -u github main
```

### Step 3: If You Get Authentication Errors

You'll need a GitHub Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use the token as your password when pushing:

```bash
git push -u github main
# Username: your-github-username
# Password: your-personal-access-token
```

### Step 4: Future Updates

After making changes in Replit:

```bash
git add .
git commit -m "Description of changes"
git push github main
```

### Alternative: Use Replit's Git Integration

1. Click the "Version Control" icon in the left sidebar (branch icon)
2. Click "Connect to GitHub"
3. Authorize Replit to access your GitHub
4. Select or create a repository
5. Push changes directly from the UI

---

## Creating Satellite Repls

For Unwanted.ad, artsy.sale, and coins.rip:

### Step 1: Create New Repl
1. Go to [replit.com/new](https://replit.com/new)
2. Choose "React + Vite" template
3. Name it appropriately (e.g., `unwanted-ad`)

### Step 2: Configure Environment
```bash
# In the new Repl's Secrets tab, add:
VITE_TINGOS_API_URL=https://your-tingos-repl.replit.app
VITE_TINGOS_TENANT=unwanted  # or artsy, coins
```

### Step 3: Copy Template Code
Follow the templates in `SATELLITE_TEMPLATES.md` to set up:
- API client configuration
- Theme and branding
- Page components
- Authentication flow

### Step 4: Deploy
1. Click "Deploy" in the top right
2. Configure custom domain if you have one
3. SSL is automatic with Replit

---

*Built with love for creators who want to build worlds.*
