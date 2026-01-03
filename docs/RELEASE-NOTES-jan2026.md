# TingOS Release Notes - January 2026

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  ████████╗██╗███╗   ██╗ ██████╗  ██████╗ ███████╗                            ║
║  ╚══██╔══╝██║████╗  ██║██╔════╝ ██╔═══██╗██╔════╝                            ║
║     ██║   ██║██╔██╗ ██║██║  ███╗██║   ██║███████╗                            ║
║     ██║   ██║██║╚██╗██║██║   ██║██║   ██║╚════██║                            ║
║     ██║   ██║██║ ╚████║╚██████╔╝╚██████╔╝███████║                            ║
║     ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚══════╝                            ║
║                                                                              ║
║           ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀                        ║
║           RETRO-FUTURISTIC WIDGET LIBRARY • v2.0.0                           ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

## 🌊 New Marine Widgets

### Submarine Sonar Scanner
```
         .-~~~-.
       .'       '.
      /   ◠───◠   \
     |    /   \    |    PING... PING... PING...
     |   ( ● ● )   |
      \   \___/   /     Active sonar with rotating sweep,
       '.       .'      contact tracking, and ping audio
         '~~~~~'
```
- **Rotating sweep beam** with phosphor trail effect
- **Contact blips** that fade as sweep passes
- **Ping audio** with authentic submarine sound
- **Three variants**: Military (green), Classic (lime), Modern (cyan)
- **Portable data model** for TUI and MicroPython rendering

### Fish Finder
```
    ┌──────────────────────────┐
    │ 0ft ─────────────────────│
    │      ><>    ><>          │
    │  25ft ─────────────────  │
    │           ><>   ><>      │
    │  50ft ──────────────     │
    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  BOTTOM CONTOUR
    └──────────────────────────┘
```
- **Real-time fish echoes** swimming across display
- **Bottom contour mapping** with terrain rendering
- **Water temperature** and frequency readout
- **Three variants**: Color, Classic (amber), CHIRP

---

## 🖨️ 3D Print Lab

### Watertight Validation with Leak Animation
```
        ╭─────────────╮
       ╱   ◇     ◇    ╲
      │   ╱ ╲   ╱ ╲    │
      │  ╱   ╲ ╱   ╲   │  ← Holes detected!
      │  ◇     ◇     ◇ │
       ╲   💧 💧 💧   ╱     Water particles escape
        ╲  💧  💧  💧╱       through mesh gaps
         ╰───────────╯
```
- **Mesh analysis** for boundary edges and non-manifold geometry
- **Particle leak visualization** - water drops escape through holes!
- **Print bed preview** with configurable dimensions
- **Auto-repair tools** for closing holes and recalculating normals
- **Mode switching**: View → Validate → Repair

---

## 🌍 Internationalization (i18n)

### Теперь на русском языке!
```
    ┌─────────────────┐
    │  EN / РУ        │  ← Click to toggle
    └─────────────────┘
```
- **English and Russian** language support
- **Language picker** in widget showcase header
- **Persistent preference** saved to localStorage
- **Tooltip system** with i18n integration via `<Hint>` component

---

## 🎨 QR Color Customizer

### 8 Preset Palettes + Custom Colors
```
    ┌────┬────┬────┬────┐
    │░░░░│████│░░░░│████│  Classic • Cyberpunk
    ├────┼────┼────┼────┤
    │░░░░│████│░░░░│████│  Terminal • Blueprint
    ├────┼────┼────┼────┤
    │░░░░│████│░░░░│████│  Sunset • Vapor
    ├────┼────┼────┼────┤
    │░░░░│████│░░░░│████│  Gold Leaf • Steampunk
    └────┴────┴────┴────┘
```
- **Sensible default**: Classic black on white
- **Custom color pickers** for foreground and background
- **Live preview** updates instantly
- **Download QR** as PNG at 200×200px
- **tng.li?id={tngli_id}** URL format with UUID fallback

---

## 📦 TOSS Asset Schema Expansion

### New Asset Types
```typescript
// Fonts for text extrusion and UI
TossFontAsset {
  format: 'ttf' | 'otf' | 'woff' | 'woff2'
  glyphPaths: Record<string, string>  // SVG paths for 3D
  data: string  // Compressed WOFF2
}

// Images and sprites
TossImageAsset {
  format: 'png' | 'jpg' | 'webp' | 'gif' | 'svg' | 'ico' | 'xpm' | 'bmp'
  variants: { size: string, data: string }[]  // Multi-resolution
  thumbnail: string  // Preview for UI
}

// Sprite sheets for animation
TossSpriteSheetAsset {
  frameWidth: number
  frameHeight: number
  animations: { name, frames[], fps, loop }[]
}

// Sculpted models with history
TossSculptedModel {
  history: TossSculptOperation[]  // CSG ops, extrusions, repairs
  type: 'csg_union' | 'csg_subtract' | 'text_extrude' | ...
}
```

---

## 🔧 Developer Tools

### Portable Widget Data Models
All widgets now export state interfaces for cross-platform rendering:
```typescript
// Example: Render sonar in ASCII for TUI
const ascii = renderSonarAscii(state, 21);
/*
       ○○○○○○○○○○○
     ○○···░░░···○○
    ○·····░░·····○
   ○······+······○
    ○·····▓·····○
     ○○···▓···○○
       ○○○○○○○○○○○
*/
```

### Hint Component for Tooltips
```tsx
<Hint i18nKey="tooltips.downloadQr">
  <Button>Download</Button>
</Hint>
```

---

## 📁 File Changes Summary

```
NEW FILES:
├── client/src/components/SonarWidgets.tsx     # Sonar + Fish Finder
├── client/src/components/Print3DPanel.tsx     # 3D Print Lab
├── client/src/components/QRColorCustomizer.tsx
├── client/src/components/ui/Hint.tsx          # Tooltip wrapper
├── client/src/i18n/config.ts                  # i18next setup
├── client/src/i18n/locales/en.json            # English translations
├── client/src/i18n/locales/ru.json            # Russian translations
└── docs/RELEASE-NOTES-jan2026.md              # This file!

MODIFIED:
├── client/src/lib/toss.ts                     # Asset schema expansion
├── client/src/pages/widgets.tsx               # Marine tab, language picker
├── client/src/main.tsx                        # i18n initialization
└── replit.md                                  # Documentation updates
```

---

## 🎮 What's Next?

- **3D View Tab** - Interactive 3D representations of widgets
- **Font Import UI** - Upload TTF/OTF and preview glyph extrusion
- **CSG Sculpting Tools** - Boolean operations for model creation
- **More Widgets**: Oscilloscope, Spectrum Analyzer, Morse Code Key

---

*Built with ❤️ for the retro-futuristic gaming community*

```
    ╔═══════════════════════════════════════╗
    ║  Press [START] to insert cartridge    ║
    ╚═══════════════════════════════════════╝
```
