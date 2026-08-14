Live Demo: https://phoebis.netlify.app/

# Phoxelis Workspace

A browser-based **phoxel art editor** — a hybrid of pixel art and classic ANSI/terminal art. Every cell on the canvas is a *phox*: a character glyph from a bitmap (BDF) font, rendered with a foreground and background color. The result is a font-aware canvas where each "pixel" is a small piece of typography.

> **phox** = a grid cell holding a `{ char, fg, bg }` triple — a pixel whose shape is defined by a bitmap font glyph.

Built on top of [Phoxelis](https://github.com/jorgequintt/phoxelis), a canvas rendering engine for grids of character cells, this workspace wraps it in a full-featured editing environment with layers, tools, an undo/redo system, and a modern React UI.

## Features

**Drawing**
- Freehand draw (with adjustable **pencil radius**) plus shape tools: line (Bresenham), rectangle, filled rectangle, ellipse, and filled ellipse (midpoint algorithm), and a **text tool** that types glyphs straight onto the canvas.
- Seven draw modes — control exactly what gets applied to each cell:
  - `draw` (char + fg + bg), `char`, `fg`, `bg` (also paints empty cells), `color` (fg + bg), `erase`, and `motion`.
- **Mirror drawing** — toggle mirror mode, pick a mirror point, and every stroke is reflected vertically, horizontally, and diagonally.
- **Motion mode** — a draw mode that cycles through a named sequence of glyphs (loop or hold) as you stroke.
- Live draft preview: strokes render onto a separate "draft screen" as you draw and only commit to the canvas when you release.

**Selection**
- **Select tool** — drag a rectangular marquee, then move the region by dragging or nudging with the arrow keys; copy / cut / paste / delete it. Operates on the active layer.

**Layers**
- Multiple layers with per-layer **opacity**, **visibility**, and full **reordering** (up/down/top/bottom).
- Add and delete layers (with confirmation), each rendered to its own canvas target and composited per frame.
- **Versioning** — each layer keeps a git-like history of per-step changes: add versions, fork **branches**, switch between them, and reset back to a single history.

**Palette & typography**
- A reusable **phox palette** rendered right inside the canvas — click any entry to pick up that `{ char, fg, bg }` combination.
- **Modify Palette Phox** mode: edit a character's glyph or colors and write it straight back into the palette.
- An **alphabet selector** that lets you browse every glyph in the loaded BDF font and pick a character by clicking.
- Full HSV color wheel (via iro.js) with separate **foreground / background** targets and a one-click **swap colors** button.

**Document management**
- New document dialog — choose grid **rows × cols** and one of five built-in **Trithemius** bitmap fonts.
- Save / load documents (`.phx`) using the browser's File System Access API.
- **Export as PNG** at 1×/2×/4×/8× scale, or export the workspace as `.phoxelis` JSON for later re-import.

**Workflow & navigation**
- Full **undo / redo** (Ctrl+Z / Ctrl+Y), implemented as a command-pattern `Change` system with a 100-step history.
- Pan and zoom the canvas (Ctrl+drag to pan, Shift+drag to zoom, pinch gestures on touch) and view the canvas in **fullscreen**.
- **Reference images** — drop in an image, pan/zoom it independently, and use it as a visual guide while drawing.
- Hotkey manager that supports both keyboard and mouse-button combinations (e.g. hold Ctrl to temporarily pan, Shift to zoom), plus selection hotkeys (copy / cut / paste, delete, arrow-key nudging).

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| UI | React 19, Mantine v9, styled-components, Phosphor icons |
| State | @legendapp/state (observable stores) |
| Rendering | Phoxelis (canvas engine), @panzoom/panzoom, Hammer.js |
| Color | iro.js |
| Build | Vite 8 + SWC |

## Architecture

The project is intentionally split into two decoupled layers:

```
src/
├── workspace/   The engine — pure TypeScript, framework-agnostic
│   ├── Workspace.ts          Central orchestrator: canvas, state, render loop
│   ├── elements/             DOM widgets: Drawboard, palette, alphabet, color picker
│   └── modules/              Capabilities:
│       ├── DrawManager.ts        Per-cell drawing & draft preview logic
│       ├── Toolbox.ts            Tool definitions + pointer/pinch wiring
│       ├── LayerManager.ts       Layer CRUD, reordering, canvas targets
│       ├── ChangesManager.ts     Undo/redo history stack
│       ├── HotkeyManager.ts      Keyboard + mouse hotkey routing
│       ├── SelectionManager.ts   Rectangular selection: copy/cut/paste/move
│       ├── VersioningManager.ts  Per-layer branch/version history
│       └── Actions.ts            Undoable "Change" factories (draw, new/delete layer, …)
│
└── editor/     The presentation layer — React & Mantine
    ├── Editor.ts              Base class: sessions, file save/load, commands
    └── react/                 ReactEditor + App, NavBar, Toolbar, panels
```

The **workspace core** owns all drawing logic, state, and the render loop; the **editor** is a thin mountable UI on top of it. `Editor` is designed to be subclassed — `ReactEditor` is one implementation, and a different UI could swap in without touching the engine.

### Key idea: undoable actions

Every user edit is dispatched through `Workspace.dispatchAction()`, which executes an action factory from `Actions.ts` and records the resulting `Change` (an `{ execute, undo }` pair) in the `ChangesManager`. Because layer operations and drawing share the same mechanism, **everything is undoable** — strokes, layer creation/deletion, and layer reordering.

## Getting Started

```bash
npm install
npm run dev       # start the Vite dev server
```

The app opens in the browser. Create a new document (File → New) or start the default 152×37 workspace.

```bash
npm run build     # type-check + production build
npm run preview   # preview the production build
```

> Note: Phoxelis is consumed via `yalc` (see `.yalc/`) rather than a published npm package. Run `yalc add phoxelis` if you clone fresh and the local link is missing.

## Hotkeys

| Shortcut | Action |
| --- | --- |
| `Ctrl+S` | Save document |
| `Ctrl+O` | Load document |
| `Ctrl+Shift+O` | New document |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Ctrl+C` / `Ctrl+X` / `Ctrl+V` | Copy / Cut / Paste selection |
| `Delete` / `Backspace` | Delete selection |
| `←` `↑` `↓` `→` | Nudge selection |
| `Ctrl+drag` | Pan canvas |
| `Shift+drag` | Zoom canvas |
| Pinch | Zoom (touch) |

## Built-in Fonts

Five Trithemius bitmap fonts ship in `public/fonts/`, ranging from 5×8 to 9×15 plus a 437 codepage variant:

- `0_Trithemius437`
- `1_Trithemius8x16` (default)
- `2_Trithemius9x15`
- `3_Trithemius6x9`
- `4_Trithemius5x8`

## Status

Actively developed hobby project — see `git log` for the roadmap-in-progress (recent work: select & text tools, mirror drawing, motion mode, per-layer versioning, PNG export, fullscreen mode, updated title & favicon).