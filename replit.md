# TingOs Platform - replit.md

## Overview

TingOs is a virtual machine execution environment for TOSS files (ThingOs State Schema) - conceptually similar to game cartridges. The platform serves as both a state machine runtime and a cartridge ecosystem with multiple domain-specific frontends:

- **thingos.org/tng.li** - The core platform providing user auth, state tracking, and cartridge hosting
- **blu-prince.com** - Professional no-code visual design tool for creating TOSS cartridges
- **unwanted.ad** - Auction site for "misfit toys" using TOSS cartridges per listing
- **artsy.sale** - Art dealer auction platform
- **coins.rip** - Crypto swing trade visualization

The killer feature is **game controller support as first-class objects** - zero-config detection, visual binding UI, haptic feedback, and cross-platform parity from MicroPython to web.

## User Preferences

Preferred communication style: Simple, everyday language.

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

### Third-Party APIs
- **ThingOS Platform API** (documented in attached assets):
  - Base: `https://thingos.org/platform/v1`
  - Auth via `X-API-Key` header
  - Scopes: `read:users`, `read:locations`, `read:cartridges`

### Key NPM Packages
- **@react-three/fiber, @react-three/drei, @react-three/rapier** - 3D rendering and physics
- **three.js** - WebGL graphics engine
- **zod** - Runtime schema validation
- **express-session, passport** - Authentication infrastructure
- **nanoid** - Short unique ID generation for cartridge links