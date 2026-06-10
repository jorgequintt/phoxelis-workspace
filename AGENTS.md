# Phoxelis Workspace - Agent Guide

## Project Overview

**Phoxelis Workspace** is the interactive editor/IDE for the [Phoxelis](https://github.com/Jorelus/phoxelis) library. It provides a full-featured ASCII art creation environment with a color palette, character selector, color picker, zoom/pan canvas, reference image overlay, and file persistence via the Origin Private File System (OPFS).

## Tech Stack

- **TypeScript** (~6.0.2) with ES2023 target
- **Vite** (^8.0.12) as dev server and bundler
- **Phoxelis** (local file dependency via `.yalc/phoxelis`) — the core rendering library
- **@panzoom/panzoom** — canvas zoom and pan
- **hammerjs** — gesture recognition (pinch, swipe)
- **@jaames/iro** — color picker UI

## Project Structure

```
phoxelis-workspace/
├── src/
│   ├── main.ts                # Entry point — app setup, event handlers, tool system
│   ├── style.css              # Global styles
│   ├── utils.ts               # Utility functions (fullscreen, download)
│   └── sampleRenderContent.ts # Demo content (animated intro sequence)
├── public/
│   └── fonts/                 # BDF font files (served at /fonts/)
├── .yalc/                     # Local phoxelis package symlink
├── index.html                 # HTML entry
├── package.json
├── tsconfig.json
└── yalc.lock
```

## Running the Project

```bash
npm run dev    # Start dev server (Vite, with --host --force)
npm run build  # Build production bundle
npm run preview # Preview production build
```

## Dependencies

| Dependency | Purpose |
|------------|---------|
| `phoxelis` (local) | Core ASCII art rendering engine (installed via yalc from `~/projects/phoxelis`) |
| `@panzoom/panzoom` | Canvas zoom/pan with mouse and touch |
| `hammerjs` | Touch gesture recognition (pinch-to-zoom) |
| `@jaames/iro` | Interactive color picker widget |

## Architecture

### Layout

```
┌─────────────────────────────────────────────┐
│  Navbar (Save | Fullscreen | Export | Ref Img)│
├───────────────────────────────┬─────────────┤
│         Drawboard             │  Sidebar    │
│                               │             │
│    ┌──────────────────────┐   │ Alphabet    │
│    │      Main Canvas     │   │ Canvas      │
│    │                      │   │ (char pick) │
│    │  [Ref image overlay] │   │             │
│    │  [Draft overlay]     │   │ Color Picker│
│    │                      │   │ (fg/bg)     │
│    └──────────────────────┘   │             │
├───────────────────────────────┴─────────────┤
│  Palette Preview (click to select phoxel)   │
└─────────────────────────────────────────────┘
```

### Canvas Layers (drawboard)

Three canvas layers stacked via absolute positioning:

1. **Main canvas** — rendered phoxels (final output)
2. **Ref image wrapper** — reference image overlay for tracing
3. **Draft screen** — temporary canvas for stroke preview before commit

### Tool System

A pluggable tool handler system (`Tool` interface) manages pointer interactions:

```typescript
interface Tool {
  name: string;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onSubmit?: () => void;       // Called on stroke completion
  onAbort?: () => void;        // Called on tool cancellation
  resetTool?: () => void;
}
```

**Default tool: `drawTool`**
- On pointer down: starts drawing, places first phoxel
- On pointer move: continues drawing phoxels onto the draft screen
- On pointer up: commits all draft phoxels to the main canvas, clears draft

### State Management

- **`dp` (draw pointer)**: `{ char: string; fg: string; bg: string }` — current draw parameters
- **`selectedColorType`**: `'fg' | 'bg'` — which color the picker modifies
- **`mousePos`**: `{ x: number; y: number }` — current cell position on the grid
- **`mouseButtons`**: tracks left/middle/right button states
- **`scale` / `refImageScale`**: current zoom levels for main canvas and reference image

### Canvas Interaction

| Input | Action |
|-------|--------|
| Click / drag | Draw phoxels |
| Ctrl + drag | Pan canvas |
| Shift + drag | Zoom canvas |
| Pinch (touch) | Zoom canvas (or ref image if toggle checked) |
| Palette click | Select phoxel from palette |
| Alphabet canvas click | Select character |
| Color picker | Set foreground or background color |

### File I/O

- **Save**: Writes `.bin` file to OPFS via `navigator.storage.getDirectory()`
- **Export**: Downloads `.phoxelis` file as a binary blob
- **Load**: Automatically loads `current_work.bin` from OPFS on startup

## Phoxelis Integration

The workspace uses the `phoxelis` library (installed via yalc from `~/projects/phoxelis`). Key imports:

```typescript
import { getFont, Phoxelis } from 'phoxelis';
```

### Usage Pattern

```typescript
const font = await getFont('1_Trithemius8x16');
const phoxelis = Phoxelis(rows, cols, font, true); // true = show palette
const { canvas, renderFrame, renderPhoxel, exportPhoxelis, importPhoxelis } = phoxelis;
```

See `~/projects/phoxelis/SKILLS.md` for the complete phoxelis library API reference.

## Key Implementation Details

### Grid Coordinate System

- Grid is `cols × rows` cells (default 152×37)
- Each cell is `font.width × font.height` pixels
- Mouse position is converted from screen coordinates to grid coordinates in `pointermove` handlers

### Render Loop

Two render loops run in parallel:
1. **Main loop**: `renderFrame()` → `requestAnimationFrame` on the main canvas
2. **Draft loop**: `renderDraftScreen()` → `requestAnimationFrame` on the draft canvas

### Reference Image

- Loaded via file input as a blob URL
- Positioned absolutely over the main canvas
- Has its own panzoom instance for independent movement/zoom
- Toggle checkbox enables/disables ref-image vs main-canvas zoom target

### Font Configuration

Font files must be served at `/fonts/`. The workspace uses `1_Trithemius8x16` by default. Available fonts are the same as in the phoxelis library (see `SKILLS.md` in `~/projects/phoxelis`).

## Development Notes

- The `phoxelis` dependency is managed via **yalc** (local symlink). After changes in `~/projects/phoxelis`:
  ```bash
  cd ~/projects/phoxelis && npm run build
  cd ~/projects/phoxelis-workspace && yalc push phoxelis
  ```
- TypeScript config targets ES2023 with bundler module resolution and strict linting rules.
- The `sampleRenderContent.ts` file contains a demo that renders an animated intro sequence — useful for testing the render pipeline.
- Canvas uses `image-rendering: pixelated` CSS for crisp pixel art rendering.
