# TingOS Release Notes

## v0.5.0 - January 4, 2026

### Flight Controls Overhaul
- **Lock/Cruise Mode**: Press `L` to toggle cruise control - tapping direction keys now locks them on/off instead of requiring hold. Press `ESC` to clear all locks.
- **Full Gamepad Support**: Auto-detects game controllers with proper zero-vector handling when sticks are released. Supports:
  - Left stick: Forward/backward and strafe
  - Right stick: Yaw (rotation)
  - LT/RT triggers: Vertical movement (up/down)
- **Key Labels**: All directional buttons now show their keyboard shortcuts (W/A/S/D, Q/E, etc.)
- **Mapping Legend**: Comprehensive control reference accessible from the panel
- **Subtle Stop Button**: D-pad center now has a small red dot that stops all movement when clicked

### Animation Timeline Enhancements
- **Click-and-Drag Scrubbing**: Click or drag anywhere on the time ruler to jump to that frame
- **Prominent Frame Counter**: Large cyan frame number display (30fps) in transport controls
- **Visual Scrub Feedback**: Playhead turns cyan during scrubbing with a floating frame tooltip
- **Smooth Interaction**: Scrubbing works even when dragging outside the timeline area

### Draggable Panel System
- **Event Console**: Now a draggable, dockable panel with corner snapping
- **Pin/Unpin**: Panels can be pinned to stay open or unpinned to auto-hide
- **Minimize**: Collapse panels to save screen space
- **Persistence**: Panel positions saved to localStorage

### Cartridge Browser
- **Visual Grid**: Browse cartridges as visual cards with icons and descriptions
- **Demo Cartridges**: Includes 12 Principles showcase, Product Configurator, Game Character FSM, Smart Home Dashboard
- **Quick Navigation**: Click any cartridge to load it into the editor

### Animation Patterns (12 Principles)
- **Expandable Menu**: Access all 12 Disney animation principles from the timeline
- **One-Click Presets**: Apply squash-stretch, anticipation, follow-through, and more
- **Customizable Parameters**: Adjust intensity, timing, and easing for each pattern
- **TOSS v1.1 Integration**: Animation patterns are now part of the official spec

### 3D Editor Improvements
- **Camera Frustum Visualization**: Prominent camera helpers showing field of view
- **3D Text Rendering**: Text3D component with Google Fonts integration
- **Font System**: Load fonts from Google Fonts, user uploads, or system fonts

### Developer Experience
- **Local Dev Setup**: Docker-compose for PostgreSQL, seed scripts for demo data
- **Tooltips Everywhere**: Filter buttons and controls now have helpful tooltips
- **Improved Event Controls**: Reorganized event panel for better workflow

---

### Bug Fixes
- Fixed FSM state node drag-jump issue by forcing component remount on position changes
- Fixed gamepad polling to properly send zero vectors when sticks released
- Resolved infinite movement when gamepad disconnected during input

### Known Issues
- Flight Controls currently in demo panel; will move to 3D editor for world navigation
- Cartridge loading from browser not yet connected to editor state
