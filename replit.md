# TingOs Platform

## Overview

TingOs is a virtual machine execution environment for TOSS files (TingOs State Schema), functioning as both a state machine runtime and a cartridge ecosystem. It provides multiple domain-specific frontends including tingos.org (core platform), blu-prince.com (no-code visual design), unwanted.ad (auction site), artsy.sale (art auctions), and coins.rip (crypto visualization). A key feature is first-class game controller support with zero-config detection, visual binding, haptic feedback, and cross-platform compatibility. The project aims to enable users to "cartridgize" various applications, from scheduling to 3D product design and auctions.

## User Preferences

Preferred communication style: Simple, everyday language.

### Design Philosophy
- **"Manipulate, don't manage"** - Users should interact directly with visual objects, not hunt through menus
- **"Show me, don't make me find it"** - Cartridges and tools should be visually present and accessible
- **80s Atari kid vibe** - Immersive 3D backdrop like watching TV from a kid's perspective in the 80s
- **Dual Theme System** - Cyberpunk Neon (default) and Victorian Brass themes available via theme switcher

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** and TypeScript, using **Vite** for building, **Wouter** for routing, **TanStack Query** for server state, **Shadcn/ui** with Radix primitives for components, and **Tailwind CSS v4** for styling. **Framer Motion** handles animations, and **React Three Fiber** with **Rapier physics** is used for 3D state machine visualization and runtime simulation.

### Backend Architecture
The backend is an **Express.js** server with TypeScript, following a single entry point pattern. API routes are registered via a `registerRoutes()` function, and storage is abstracted through an `IStorage` interface.

### Data Layer
**Drizzle ORM** with PostgreSQL dialect is used, employing a schema-first approach with Zod validation. Core entities include Users (for authentication) and Cartridges, which store TOSS files as JSONB blobs. The database does not parse the internal FSM structure of TOSS files.

### TOSS File Format
TOSS cartridges are self-contained blobs consisting of:
- **Manifest**: ID, metadata (title, author, version)
- **FSM Logic**: States, transitions, guards, actions
- **Memory Schema**: Typed context variables with defaults
- **Assets**: Referenced media files
- **3D Assets**: Embedded 3D models (glTF, GLB, OBJ, STL, Three.js JSON) with metadata.
- **Editor Metadata**: Node positions for the visual editor (stripped at runtime).

### 3D Asset Pipeline
The system supports importing various 3D formats (glTF, GLB, OBJ, STL, Three.js JSON). An **Asset Importer** parses files and extracts geometry metadata, while an **Asset Loader** reconstructs Three.js objects. A `Asset3DPreview` component allows previewing assets, and the system includes **3D Printing Support** with printability metadata for STL files.

### Runtime Engine
A framework-agnostic TypeScript class, `TingOsEngine`, handles event-driven state machine execution. It supports state entry/exit hooks, guarded transitions, and action execution, designed for portability.

### UI/UX Decisions
The platform features a performance system that auto-detects device capabilities to adjust settings, conditional 3D backgrounds for specific routes, and fullscreen editor layouts. It includes a comprehensive input mapping system with a controller setup wizard, a schema-driven context menu manager, and full i18n support. Visual design emphasizes an "80s Atari kid vibe" with a dual theme system (Cyberpunk Neon and Victorian Brass). Tools like the "Thing Catalog" and various specialized panels (e.g., 3D Print Lab, Environmental Forces) provide rich interactive experiences. User preferences, keybindings, and environment presets are stored as "Preferences Cartridges."

### Core Features
- **Performance System**: Auto-detects device capabilities for optimized rendering.
- **Input Mapping**: Comprehensive keyboard/mouse/gamepad binding with conflict detection.
- **Context Menu Manager**: Schema-driven nested context menus.
- **i18n Support**: Full internationalization with English and Russian.
- **Widget Library**: Expanded with specialized simulators (Submarine Sonar Scanner, Fish Finder).
- **3D Print Lab Panel**: Features watertight validation and print bed preview.
- **TOSS Asset Schema**: Expanded to include various asset types (FontAsset, ImageAsset, SpriteSheetAsset, SculptedModel).
- **Drone Pilot Simulator**: Full 3D simulation with controls and telemetry.
- **Cartridge Protocol**: Programmatic creation and saving of TOSS cartridges.
- **Command System & CLI**: Cartridges expose executable commands, with a CLI shell and multi-cart loading.
- **Multi-Statechart**: TOSS v1.1 supports multiple FSMs per cartridge with an event bus.
- **Physics Forces Expansion**: Includes magnet, spring, hinge, and damper forces.
- **Hardware Cartridge Profiles**: Manufacturing data and firmware targets for physical products.
- **GROUP Feature**: Hierarchical mesh grouping in SceneTree.
- **Editor Trees**: Separated SceneTree for 3D meshes and FSM states list.
- **VS Code Dual Sidebars**: EditorShell component with collapsible sidebars.
- **Property Panel**: Integrated editor for object properties.
- **Frame of Reference System**: Visual alignment tools for objects.
- **Preferences Cartridge**: Stores user preferences, keybindings, and environment presets.
- **Input Profile Modes**: Named profiles for different editor modes.
- **Environment Presets**: Named setups for lighting, background, and camera.
- **Save States System**: Game-like save states for cartridges.
- **Quality Toggle System**: Rendering presets (Low/Medium/High) with auto-detection.
- **Orthographic Camera Mode**: Toggle between perspective and isometric views.
- **Track Laying Tool**: Spline-based road/path painting.
- **Parametric Enclosure Generator**: Hollow boxes for 3D printing with wall thickness, optional lid, and tolerance settings.
- **OpenSCAD Interpreter**: Native JavaScript subset interpreter for OpenSCAD scripts:
  - Primitives: cube, sphere, cylinder, cone, polyhedron
  - Transforms: translate, rotate, scale, mirror, color
  - CSG: union, difference, intersection, hull
  - Control: for loops, if/else, let bindings
  - Modules and functions with parameters
  - Special variables ($fn, $fa, $fs)
- **OpenSCAD Documentation**: Interactive docs panel with yellow 3D rendered previews for each primitive/operation.
- **Camera/Light Helpers**: 3D editor shows cameras with frustum visualization, lights with type-specific icons, color-matched labels from scene tree.
- **Font System**: Load fonts from Google Fonts (no API key needed), user uploads (TTF, OTF, WOFF, WOFF2), and system fonts. Font picker UI with search, categories, and live preview.
- **Bitmap Font Converter**: Generates MicroPython-compatible bitmap fonts from vector fonts with texture atlas generation and 1-bit packing for memory efficiency.
- **3D Text Rendering**: Text3D component for rendering text in 3D space with font selection integration.
- **Assertions Panel**: Draggable test panel with WHEN/THEN interface for defining test conditions. Supports state checks, value comparisons, and visibility tests. Safe read-only evaluation model.

## File Organization

### Source Code Structure
```
client/src/
├── components/           # React UI components
│   ├── ui/              # Shadcn/ui primitives (buttons, dialogs, etc.)
│   ├── input/           # Input-specific components
│   ├── testing/         # Test-related components (AssertionsPanel)
│   └── *.tsx            # Feature components (FontPicker, SceneTree, etc.)
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization (locales, config)
├── lib/                 # Business logic and utilities
│   ├── input/           # Input system (bindings, conflicts)
│   ├── openscad/        # OpenSCAD interpreter
│   ├── toss-examples/   # Sample TOSS cartridge files
│   └── *.ts             # Core utilities (engine, font-loader, etc.)
└── pages/               # Route components

shared/
├── schema.ts            # Drizzle ORM database schema
├── toss-assets.ts       # Font, image, model asset schemas
└── models/              # Auth and other shared models

server/
├── routes.ts            # API endpoint definitions
└── storage.ts           # Database storage interface
```

### Key Library Files
- **lib/font-loader.ts**: Font loading from Google Fonts, user uploads, system fonts
- **lib/bitmap-font.ts**: Bitmap font conversion for MicroPython with texture atlas generation
- **lib/engine.ts**: TingOsEngine - FSM runtime execution
- **lib/toss-v1.1.ts**: Authoritative TOSS schema (v1.1)
- **lib/openscad/**: OpenSCAD interpreter (lexer, parser, evaluator)

## External Dependencies

### Database
- **PostgreSQL**: Used via `pg` driver, with `connect-pg-simple` for Express session storage. Configured via `DATABASE_URL`.

### TingOS Platform API
- **Base URL**: `https://thingos.org/platform/v1` (Production) | `https://test.thingos.org/platform/v1` (Staging)
- **Authentication**: `X-API-Key` header with scopes for users, locations, and cartridges.
- **Key Endpoints**: `GET /components`, `GET /cartridges`, `GET /cartridges/nearby`, `GET /locations/{id}/weather`.
- **Built-in Components**: 24 components across Layout, Media, Text, Input, Action, Commerce, and Creative categories.
- **Platform Targets**: Web (Svelte 5), Desktop (Electron), Mobile (Capacitor), MicroPython (Pico W/ESP32), Terminal (Textual TUI).
- **MicroPython Constraints**: Specific limits on items, particles, mesh triangles, RAM, and FPS.

### TOSS Schema Versions
- **toss.ts**: FSM-oriented schema.
- **toss-v1.ts**: 3D runtime schema.
- **toss-v1.1.ts**: Authoritative specification from TingOS backend, including multi-statechart, physics joints, `SpacetimeAnchor`, and hardware profiles.

### Key NPM Packages
- **@react-three/fiber, @react-three/drei, @react-three/rapier**: For 3D rendering and physics.
- **three.js**: Core WebGL graphics engine.
- **zod**: For runtime schema validation.
- **express-session, passport**: For authentication infrastructure.
- **nanoid**: For short unique ID generation.