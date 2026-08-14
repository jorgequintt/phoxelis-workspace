# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project overview

Phoxelis Workspace is a browser-based **phoxel art editor** — a hybrid of pixel art and
ANSI/terminal art. Every canvas cell is a *phox*: a `{ char, fg, bg }` triple whose glyph
comes from a bitmap (BDF) font. It is a React UI wrapped around the
[Phoxelis](https://github.com/jorgequintt/phoxelis) canvas engine (consumed locally via yalc).

- Language: TypeScript (ESM, bundler resolution, strict-ish config)
- UI: React 19 + Mantine v9 + styled-components + Phosphor icons
- State: `@legendapp/state` observables
- Rendering: Phoxelis (canvas), `@panzoom/panzoom`, Hammer.js
- Color: iro.js (`@jaames/iro`)
- Build: Vite 8 + SWC, PostCSS (Mantine preset)
- No test framework. No linter/formatter configured.

## Commands

```bash
npm install     # install deps (requires the yalc-linked phoxelis, see below)
npm run dev     # start Vite dev server (vite --host --force)
npm run build   # type-check (tsc) THEN production build (vite build)
npm run preview # serve the production build
```

`npm run build` runs `tsc` first and **fails on type errors** — always run it after
changes. There is no lint or test script.

## Critical dependency: Phoxelis via yalc

`phoxelis` is **not** an npm-published package. `package.json` references
`"phoxelis": "file:.yalc/phoxelis"`. After a fresh clone:

```bash
npm i -g yalc   # if not installed
yalc add phoxelis
```

The local copy lives in `.yalc/phoxelis/` with published type declarations in
`.yalc/phoxelis/dist/src/*.d.ts`. The engine API (canvas, layers, palette, fonts) is the
source of truth; read those `.d.ts` files before using a Phoxelis API. If engine types
change, re-run `yalc push phoxelis` from the phoxelis repo and rebuild.

Key Phoxelis types used everywhere:
- `Phox` = `{ char: string; fg: string; bg: string }`
- `Font` = `{ fontName, length, height, width, characters, charactersList }`
- `FontName` = `'0_Trithemius437' | '1_Trithemius8x16' | '2_Trithemius9x15' | '3_Trithemius6x9' | '4_Trithemius5x8'`
- `PhoxelisObj` = the object returned by `Phoxelis(rows, cols, font, options)`
- `LayerData` = return type of `PhoxelisObj['removeLayer']` (used to restore layers on undo)

## Architecture

The project is intentionally split into two decoupled layers:

```
src/
├── main.ts            Entry point: instantiates ReactEditor, restores last session
├── workspace/         The ENGINE — pure TypeScript, framework-agnostic, owns all state
│   ├── Workspace.ts       Central orchestrator: canvas, observable state, render loop
│   ├── elements/          Imperative DOM widgets (Drawboard, palette, alphabet, colorPicker, refImage)
│   └── modules/           Capabilities (Toolbox, DrawManager, LayerManager, ChangesManager, HotkeyManager, Actions)
├── editor/            The PRESENTATION layer — React & Mantine, thin UI over the engine
│   ├── Editor.ts          Base class: sessions, file save/load, command methods
│   └── react/             ReactEditor, App, layout/, organisms/, compounds/, atoms/
└── utils/              rendering.ts (Bresenham/ellipse math), general.ts (download/file helpers)
```

**The engine must not import from the React layer** (only exception: the hardcoded
`sidebarWidth` constant re-exported from `src/editor/react/layout/Sidebar.tsx`, imported by
`colorPicker.ts` and `alphabet.ts`). Keep this direction of dependency. New UIs should be
able to swap in by subclassing `Editor` (see `ReactEditor`).

### Directory conventions (atomic design)

- `editor/react/atoms/` — primitives (`DOMWrapper`, `SideButton`)
- `editor/react/organisms/` — feature components (`Toolbar`, `LayersPanel`, `NavBar`, `ToolsMenu`, `DrawModeMenu`)
- `editor/react/compounds/` — composite/configurable components (`Menubar`, `NewDocumentModal`)
- `editor/react/layout/` — page composition (`Content`, `Sidebar`, `Footer`)

## Core concepts

### State via @legendapp/state

`Workspace` owns two observables:

- `data$` — document data (`layers: Record<layerId, WorkspaceLayer>`). `WorkspaceLayer = { name, opacity, visible, position }`.
- `state$` — UI/tool state (`dp` = current phox `{char,fg,bg}`, `drawMode`, `tool`, `activeLayer`, `paletteData`, `selectedColorType`, `movingRefImage`, `pencilRadius`).

React components read observables with `useValue(ws.state$.xxx)` and mutate with
`ws.state$.xxx.set(value)` (dot-notation `ws.state$.dp.fg.set(...)` also works). Imperative
engine code uses `.get()` / `.set()` / `.onChange()` directly.

### Undoable actions (command pattern) — IMPORTANT

Every user edit that should be undoable is dispatched through
`Workspace.dispatchAction(action, ...params)`:

```ts
ws.dispatchAction(draw, phoxPositions, activeLayer);
ws.dispatchAction(newLayer);
ws.dispatchAction(moveLayerUp, activeLayer);
```

`dispatchAction` calls the factory, `execute()`s the change, and pushes it to the
`ChangesManager` (100-step history, Ctrl+Z/Ctrl+Y).

`Action` factories live in `src/workspace/modules/Actions.ts` and return a `Change`:

```ts
interface Change {
  execute: () => void;
  undo: () => void;
}
```

Factories are bound to the `Workspace` via the `this` parameter. **Any new user-facing
mutation should follow this pattern** — don't call `LayerManager` / `phoxelis` mutators
directly from UI code, or it bypasses undo/redo.

### Draw pipeline (draft screen)

Tools draw a live preview onto a separate `draftScreen` Phoxelis instance while the pointer
is down (`drawManager.draft(r, c)`), then on pointer-up call `submit()`, which dispatches a
single undoable `draw` change and resets the draft. See `Toolbox.createTools()`.

### Render loop

`Workspace.startRenderLoop()` runs `requestAnimationFrame`, calling
`phoxelis.renderFrame(layerOptions)` (compositing each layer onto its `layersTargets`
canvas with per-layer opacity/visibility) then `draftScreen.renderFrame()`.

## Code conventions

- 2-space indent, semicolons, single quotes.
- `verbatimModuleSyntax` is on: **type-only imports must use `import type { ... }`** and
  regular imports for values. Violations fail the build.
- `erasableSyntaxOnly` is on: no `enum`, no `namespace`, **no constructor parameter
  properties** (`constructor(public ws: Workspace)` is forbidden). Use explicit class
  fields + assignment, and string-literal unions (`DrawModeName`, `ToolName`) instead of enums.
- `noUnusedLocals` / `noUnusedParameters` are on: unused imports/params fail `tsc`.
- Import order (informal, keep consistent with surrounding files): external libs
  (`react`, `@mantine/*`, `styled-components`, `@legendapp/state`), then `../workspace/*`
  / `../../workspace/*`, then `../Editor`, then local. `import _ from 'lodash'` is common.
- Mantine components are imported from `@mantine/core`; icons are imported from
  `@phosphor-icons/react/dist/csr/<IconName>` (client-side safe render).
- `// MARK: <name>` comments group sections within large files (see `Toolbox.ts`,
  `HotkeyManager.ts`).
- Coordinates: **`r` = row, `c` = column**, positions are `[r, c]` tuples (`PhoxelPosition`).
- Colors are hex strings. A phoxel = `{ phox: Phox, r, c }` (`Phoxel` type in Workspace.ts).
- Canvas DOM styles are set imperatively via `element.style = '...'` string assignments.

## Key files to know

| File | Role |
| --- | --- |
| `src/workspace/Workspace.ts` | Central orchestrator; `Workspace.create()` is an async static factory (font loading); constructor is protected |
| `src/workspace/modules/Actions.ts` | All undoable action factories + `Change` interface |
| `src/workspace/modules/Toolbox.ts` | Tool definitions & pointer/pinch wiring; `createTools()` builds each tool |
| `src/workspace/modules/DrawManager.ts` | Applies `dp` per draw-mode to real canvas (`draw`) or draft screen (`draft`) |
| `src/workspace/modules/LayerManager.ts` | Layer CRUD, reordering, canvas targets |
| `src/workspace/modules/ChangesManager.ts` | 100-step undo/redo stacks |
| `src/workspace/modules/HotkeyManager.ts` | Keyboard + mouse-button hotkey routing |
| `src/workspace/elements/Drawboard.ts` | Canvas container, pointer→cell mapping, panzoom, hammer pinch |
| `src/editor/Editor.ts` | Sessions, save/load (File System Access API), command methods |
| `src/editor/react/ReactEditor.tsx` | `Editor` subclass rendering `<App>` via React root |

## Common pitfalls

- **Forgetting `import type`** or adding an unused import — both fail `npm run build`.
- **Touching Phoxelis APIs blindly** — read `.yalc/phoxelis/dist/src/**/*.d.ts` first.
- **Mutating layers/canvas directly from React components** — route through
  `ws.dispatchAction` so undo/redo stays consistent.
- **Bypassing the draft screen** — strokes commit only on pointer-up via `submit()`;
  freehand + shape tools all follow the draft → submit → reset lifecycle.
- `documentName` and `last_doc` (localStorage) persist sessions across reloads (`main.ts`
  auto-loads the last document); save/load uses `navigator.storage.getDirectory()` (File
  System Access API), which only works in Chromium browsers.
- `index.html` references `/favicon.svg` which is **not present** in `public/` — the 404 is
  pre-existing; don't treat it as a regression.
