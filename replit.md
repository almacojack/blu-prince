# TingOs Platform - replit.md

## Overview

TingOs is a virtual machine execution environment for TOSS files (TingOs State Schema) - conceptually similar to game cartridges. The platform serves as both a state machine runtime and a cartridge ecosystem with multiple domain-specific frontends:

- **tingos.org/tng.li** - The core platform providing user auth, state tracking, and cartridge hosting
- **blu-prince.com** - Professional no-code visual design tool for creating TOSS cartridges
- **unwanted.ad** - Auction site for "misfit toys" using TOSS cartridges per listing
- **artsy.sale** - Art dealer auction platform
- **coins.rip** - Crypto swing trade visualization

**GitHub:** https://github.com/almacojack/blu-prince

The killer feature is **game controller support as first-class objects** - zero-config detection, visual binding UI, haptic feedback, and cross-platform parity from MicroPython to web.

### Satellite Domains
- **l8r.co** - Scheduling services as cartridges - "cartridgize" appointments, reminders, and time capsules
- **unwanted.ad** - Auction site for "misfit toys" using TOSS cartridges per listing
- **artsy.sale** - Art dealer auction platform
- **coins.rip** - Crypto swing trade visualization and playbook cartridges

## User Preferences

Preferred communication style: Simple, everyday language.

### Design Philosophy
- **"Manipulate, don't manage"** - Users should interact directly with visual objects, not hunt through menus
- **"Show me, don't make me find it"** - Cartridges and tools should be visually present and accessible
- **80s Atari kid vibe** - Immersive 3D backdrop like watching TV from a kid's perspective in the 80s
- **Dual Theme System** - Cyberpunk Neon (default) and Victorian Brass themes available via theme switcher

### Recent Changes (January 2026)
- **Performance System** - Auto-detect device capabilities (CPU cores, memory, GPU tier) and adjust settings. Low-power devices get reduced animations, no 3D backgrounds. Manual toggle in localStorage.
- **Conditional 3D Backgrounds** - 3D background only renders on homepage. Editor routes (/editor, /blu-prince, /statechart) get full viewport with no nav padding.
- **Fullscreen Editor Layouts** - Editor pages now span full viewport height/width without nav bar interference.
- **Input Mapping System** - Comprehensive keyboard/mouse/gamepad binding system with conflict detection engine, EmulationStation-style controller setup wizard, and settings page at `/input-settings`
- **Context Menu Manager** - Schema-driven nested context menus with right-click-to-pan toggle, configurable delay when both features are enabled
- **i18n Support** - Full internationalization with English and Russian languages via react-i18next, language picker in widget showcase
- **Widget Library Expansion** - Added Submarine Sonar Scanner and Fish Finder simulator widgets with portable data models for TUI/MicroPython
- **QR Color Customizer** - Reusable QR code component with 8 color presets and custom color picker (black/white default)
- **3D Print Lab Panel** - New panel with watertight validation, leak particle animation, print bed preview, and repair tools
- **TOSS Asset Schema Expansion**:
  - FontAsset: TTF/OTF import with WOFF2 compression, glyph path extraction for 3D text extrusion
  - ImageAsset: PNG, JPG, WebP, GIF, SVG, ICO, XPM, BMP with variants and thumbnails
  - SpriteSheetAsset: Animation frame support with named animation sequences
  - SculptedModel: CSG operation history for procedural model rebuilding
- **Hint Component** - Unified tooltip wrapper with i18n integration
- **Drone Pilot Simulator** - Full 3D drone with keyboard/gamepad controls, FPV/Follow/Orbit cameras, HUD telemetry
- **Pricing Page** - Freemium tiers (Arcade/Indie/Studio/Enterprise) with QR codes and usage calculator
- **Environmental Forces Panel** - Separated into its own dockable panel with scientific units (Kelvin, m/s, Pascals, Sieverts, Liters)
- **Theme System** - Global ThemeProvider with Cyberpunk/Neon and Victorian/Brass themes, theme switcher in navigation
- **Thing Catalog** - Library card motif component browser with search, star/archive, and grid/list views
- **QR Code System** - QRCodePopup, TngliLink, QRIconButton components for tng.li URL sharing with IoT/mobile badges
- **Cartridge Protocol** - Agent can programmatically create TOSS cartridges and save to database via POST /api/cartridges
- **tng.li Business Plan** - Strategic document in docs/tngly-business-plan.md for URL namespace marketing
- **Command System & CLI** - Cartridges expose executable commands via tngli_ids, forming a virtual PATH. Runtime simulator includes CLI shell with command history, tab completion patterns, and multi-cart mounting
- **Multi-Cart Loading** - Load multiple cartridges simultaneously with merged PATH namespaces. Docker-like interoperability between cartridges. Boot cartridge determines initial environment
- **CommandRouter Service** - PATH resolution, command parsing/execution, permission checking, and alias support for cartridge commands
- **Sales Document** - "The Opportunity If You Can Catch It" in docs/ targeting developers, tech managers, and marketing leadership
- **Revenue Models Addendum** - Explores revenue sharing, affiliate programs (Amazon integration), training cartridges, and web hosting configurator vision with predictable pricing
- **Personal Pitch Document** - "Why This. Why Now. Why Us." in docs/ for owner's internal use with spouse/partners
- **Revenue Calculator Page** - Interactive `/revenue` page with sliders for creator, platform operator, and educator revenue projections. "Seeing is believing" for stakeholders
- **Shark Tank Pitch Scenario** - Fictional but realistic pitch narrative showing key angles, metrics, and negotiation strategies that would impress investors
- **Launch Strategy Titles** - Complete 22+ cartridge launch lineup with ratings, pricing, and new concepts (Lost: GPS, Journal ecosystem, Kanban Flow, Demolition Bot, blu-jeans, Product Configurator)
- **Hardware Workshop** - Blu-Prince as inventor's playground: design → prototype → sell → manufacture loop. Magnetic desk systems, modular sensor controls, Solder Party keyboard partnership
- **TOSS v1.1 Multi-Statechart** - Multiple FSMs per cartridge with event bus coordination. Roles: ui, physics, network, logic
- **Physics Forces Expansion** - magnet_attract, magnet_repel, spring_joint, hinge_joint, damper for interactive product configurators
- **Hardware Cartridge Profiles** - Manufacturing data (STL, BOM, assembly notes), firmware targets (ESP32, RP2040), packaging specs
- **Marketing & Dev Plan** - Magazine ads, radio spots, 3-week build sequence with dependency graph
- **GROUP Feature** - Hierarchical mesh grouping in SceneTree using parent_id/children_ids. Group/Ungroup buttons with multi-select (Ctrl+click). Folder icons for groups with expand/collapse
- **SceneTree Auto-Import** - Imported 3D assets now automatically create mesh items in SceneTree with asset_id reference linking
- **TossMesh.asset_id** - New field linking imported 3D models to their source asset for proper scene rendering
- **Separated Editor Trees** - editor.tsx uses SceneTree for 3D meshes; blu-prince.tsx uses inline FSM states list for state machines
- **VS Code Dual Sidebars** - EditorShell component with collapsible left (navigation) and right (properties) sidebars

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for UI components
- **Vite** as build tool with custom plugins for meta images and Replit integration
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management
- **Shadcn/ui** with Radix primitives for accessible component library
- **Tailwind CSS v4** for styling with CSS variables
- **Framer Motion** for animations
- **React Three Fiber** with Rapier physics for 3D state machine visualization and runtime simulation

### Backend Architecture
- **Express.js** server with TypeScript
- **Single entry point** pattern - `server/index.ts` bootstraps HTTP server
- **API routes** registered via `registerRoutes()` function
- **Storage abstraction** via `IStorage` interface enabling memory or database backends
- **Vite dev middleware** integration for HMR in development

### Data Layer
- **Drizzle ORM** with PostgreSQL dialect
- **Schema-first approach** - models defined in `shared/schema.ts` with Zod validation via `drizzle-zod`
- **Core entities**: Users (auth), Cartridges (TOSS files stored as JSONB)
- **TOSS files are self-contained blobs** - database doesn't parse internal FSM structure

### TOSS File Format
The cartridge format contains:
- **Manifest** - ID, tngli_id, metadata (title, author, version)
- **FSM Logic** - States, transitions, guards, actions
- **Memory Schema** - Typed context variables with defaults
- **Assets** - Referenced media files (images, audio, etc.)
- **3D Assets** - Embedded 3D models with format-specific storage:
  - glTF: JSON string format
  - GLB/STL: Base64-encoded binary
  - OBJ: Text string format
  - Three.js JSON: Native JSON format
  - Metadata: vertex/face counts, bounding box, printability info
- **Editor Metadata** - Node positions for visual editor (stripped at runtime)

### 3D Asset Pipeline
- **Import Formats**: glTF, GLB, OBJ, STL, Three.js JSON (from Three.js Editor)
- **Asset Importer** (`client/src/lib/asset-importer.ts`): Parses files, extracts geometry metadata
- **Asset Loader** (`client/src/lib/asset-loader.ts`): Reconstructs Three.js objects from TOSS storage
- **Asset3DPreview**: React Three Fiber component with orbit controls for previewing assets
- **3D Printing Support**: Printability metadata (volume, surface area, watertight check) for STL files

### Runtime Engine
- **Framework-agnostic** TypeScript class (`TingOsEngine`) 
- **Event-driven** state machine execution
- **Designed for portability** to Svelte 5 stores/signals
- **Supports**: state entry/exit hooks, guarded transitions, action execution

## External Dependencies

### Database
- **PostgreSQL** via `pg` driver with connection pooling
- **Session storage** via `connect-pg-simple` for Express sessions
- Database URL configured via `DATABASE_URL` environment variable

### TingOS Platform API (FINALIZED CONTRACT)
- **Base URL**: `https://thingos.org/platform/v1` (Production) | `https://test.thingos.org/platform/v1` (Staging)
- **Auth**: `X-API-Key` header
- **Scopes**: `read:users`, `read:locations`, `read:cartridges`, `write:cartridges`, `admin`
- **Key Endpoints**:
  - `GET /components` - List 24 built-in components
  - `GET /cartridges` - User's cartridges
  - `GET /cartridges/nearby?lat=&lng=&radius_km=` - Location-based cartridges
  - `GET /locations/{id}/weather` - Weather data for location-aware cartridges
- **24 Built-in Components**: Layout (4), Media (3), Text (3), Input (6), Action (3), Commerce (3), Creative (2)
- **Platform Targets**: Web (Svelte 5), Desktop (Electron), Mobile (Capacitor), MicroPython (Pico W/ESP32), Terminal (Textual TUI)
- **MicroPython Constraints**: MAX_ITEMS=50, MAX_PARTICLES=200, MAX_MESH_TRIANGLES=500, 264KB RAM, 60fps

### TOSS Schema Versions
- **toss.ts** - FSM-oriented schema for States editor (TossFile, TossState, TossTransition)
- **toss-v1.ts** - 3D runtime schema for Designer (TossCartridge, TossItem, TossMesh)
- **toss-v1.1.ts** - AUTHORITATIVE v1.1 spec from TingOS backend with:
  - `items` → `meshes` rename
  - Multi-statechart system with event bus
  - Physics joints (spring, hinge, damper)
  - SpacetimeAnchor for weather/location context
  - Hardware profiles for physical products
  - Accessory cart metadata and pricing

### Critical Documentation
- **docs/TINGOS_HANDOFF.md** - Full technical handoff from TingOS backend (BINDING CONTRACT)
- **client/src/lib/toss-v1.1.ts** - Authoritative TypeScript schema

### Key NPM Packages
- **@react-three/fiber, @react-three/drei, @react-three/rapier** - 3D rendering and physics
- **three.js** - WebGL graphics engine
- **zod** - Runtime schema validation
- **express-session, passport** - Authentication infrastructure
- **nanoid** - Short unique ID generation for cartridge links