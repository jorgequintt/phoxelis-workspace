import { getFont, Phoxelis, type Phox, type CharShape } from 'phoxelis';
import '../style.css';
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import _ from 'lodash';
import iro from '@jaames/iro';

type Phoxel = {
  phox: Phox;
  r: number;
  c: number;
};
type PhoxelPosition = [r: number, c: number];

export type DocumentLayer = {
  name: string;
  opacity: number;
  visible: boolean;
};

interface DocumentState {
  layers: Record<string, DocumentLayer>;
}

interface SessionState {
  dp: Phox;
  drawMode: 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase';
  activeLayer: string;
  paletteData: {
    selectedPhox: number;
    modifyingPhox: boolean;
  };
  alphabetData: {
    selectedChar: number;
  };
  selectedColorType: 'fg' | 'bg';
  movingRefImage: boolean;
}

export type DrawModeDefinition = {
  name: 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase';
  icon: string;
  tooltip: string;
};

export const drawModeDefs: DrawModeDefinition[] = [
  { name: 'draw', icon: '✏', tooltip: 'Draw (char + fg + bg)' },
  { name: 'char', icon: 'A', tooltip: 'Char only' },
  { name: 'fg', icon: 'F', tooltip: 'Foreground color only' },
  { name: 'bg', icon: 'B', tooltip: 'Background color only' },
  { name: 'color', icon: '◉', tooltip: 'Color (fg + bg) only' },
  { name: 'erase', icon: '✕', tooltip: 'Erase' },
];

export type ToolDefinition = {
  name: string;
  icon: string;
  tooltip: string;
};

export const toolDefs: ToolDefinition[] = [
  {
    name: 'draw',
    icon: '✏',
    tooltip: 'Draw (freehand)',
  },
  {
    name: 'rect',
    icon: '□',
    tooltip: 'Rectangle (outline)',
  },
  {
    name: 'filledRect',
    icon: '■',
    tooltip: 'Filled Rectangle',
  },
  {
    name: 'line',
    icon: '╱',
    tooltip: 'Line',
  },
  {
    name: 'ellipse',
    icon: '⬭',
    tooltip: 'Ellipse (outline)',
  },
  {
    name: 'filledEllipse',
    icon: '●',
    tooltip: 'Filled Ellipse',
  },
];

export type WorkspaceObj = Awaited<ReturnType<typeof Workspace>>;

export interface WorkspaceData {
  phoxelis: ReturnType<ReturnType<typeof Phoxelis>['exportPhoxelis']>; // TODO export type in phoxelis for this
  layers: DocumentState['layers'];
  refImage: {
    src: string;
    config: {
      panX: number;
      panY: number;
      scale: number;
    };
  };
}

export interface WorkspaceInputConfig {
  size: {
    rows: number;
    cols: number;
  };
  fontName: Parameters<typeof getFont>[0];
  data?: WorkspaceData;
}

export interface WorkspaceExportConfig extends WorkspaceInputConfig {
  data: WorkspaceData;
}

// & Keep decoupling with the same method: Imperfect step in the right direction, not frozen planning the perfect step
// MARK: Workspace
export async function Workspace(config: WorkspaceInputConfig) {
  let { size, fontName, data } = config;

  const font = await getFont(fontName);
  const phoxelis = Phoxelis(size.rows, size.cols, font, {
    renderPalette: true,
    createBaseLayer: false,
  });
  const draftScreen = Phoxelis(size.rows, size.cols, font);
  const getDraftBaseLayer = () => {
    return draftScreen.layers[0].id;
  };

  let layersTargets: Record<string, HTMLCanvasElement> = {};

  // What outer users can set. To be persisted in document
  const defaultDocumentState = () => ({
    layers: {},
  });

  // What outer users can set. Should not persist
  const defaultSessionState = (activeLayer: string): SessionState => ({
    dp: { char: 'D', fg: '#00FF00', bg: '#FF00FF' },
    drawMode: 'draw',
    activeLayer: activeLayer,
    paletteData: {
      selectedPhox: -1,
      modifyingPhox: false,
    },
    alphabetData: {
      selectedChar: font.charactersList.findIndex(
        (c) => c.codepoint === 'D'.codePointAt(0),
      ),
    },
    selectedColorType: 'fg',
    movingRefImage: false,
  });

  let ds: DocumentState = defaultDocumentState();
  const baseLayer = createLayer(); // Base layer
  let session: SessionState = defaultSessionState(baseLayer);
  selectLayer(baseLayer);

  // MARK: Elements
  const refImage = document.createElement('img');
  refImage.alt = ""; // removes broken icon
  const refImageWrapper = document.createElement('div');
  refImageWrapper.append(refImage);
  refImageWrapper.style = `position: absolute; top: 0px; right: 0px; z-index: -999; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`;

  const drawboard = document.createElement('div');
  drawboard.style =
    'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
  phoxelis.canvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;
  draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;

  const layersWrapper = document.createElement('div');
  layersWrapper.style = 'position: relative';
  layersWrapper.appendChild(phoxelis.canvas);
  layersWrapper.appendChild(refImageWrapper);
  layersWrapper.appendChild(draftScreen.canvas);
  drawboard.appendChild(layersWrapper);

  const paletteScale = 2;
  const paletteSelector = document.createElement('div');
  paletteSelector.style = 'position: relative;';
  const paletteOverlay = document.createElement('canvas');
  paletteOverlay.width = phoxelis.palette.width;
  paletteOverlay.height = phoxelis.palette.height;
  const paletteScaledHeight = font.height * paletteScale;
  phoxelis.palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
  paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
  const onPaletteOverlayClick = (e: MouseEvent) => {
    if (!paletteOverlay) {
      console.error(
        'onPaletteOverlayClick error: null "paletteOverlay" was passed as param.',
      );
      return;
    }
    const x = e.offsetX;
    const paletteMaxCells = phoxelis.palette.width / font.width;
    const pos = Math.floor(
      (x / (paletteScale * phoxelis.palette.width)) * paletteMaxCells,
    );
    const phox = phoxelis.getPhoxFromPaletteIndex(pos);
    if (!phox) {
      console.warn('Null Phox selected. Omitting selection');
      return;
    }
    session.dp = phox;
    session.paletteData.selectedPhox = pos;
    colorPicker.color.hexString = session.dp[session.selectedColorType];
    selectCharInAlphabet(
      font.charactersList.findIndex(
        (c) => c.codepoint === session.dp.char.codePointAt(0),
      ),
    );
    const ctx = paletteOverlay.getContext('2d');
    ctx!.reset();
    ctx!.strokeStyle = 'green';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(pos * font.width, 0, font.width, font.height);
  };
  paletteOverlay.addEventListener('click', onPaletteOverlayClick);
  paletteSelector.append(phoxelis.palette);
  paletteSelector.append(paletteOverlay);

  const alphabetCanvas = document.createElement('canvas');
  const alphabetWidth = 100;
  const alphabetCols = Math.ceil(alphabetWidth / font.width);
  const alphabetRows = Math.ceil(font.length / alphabetCols);
  alphabetCanvas.width = alphabetCols * font.width;
  alphabetCanvas.height = alphabetRows * font.height;
  const alphabetViewScale = 2;
  alphabetCanvas.style = `width: ${alphabetCanvas.width * alphabetViewScale}px; image-rendering: pixelated;`;
  const alphabetCtx = alphabetCanvas.getContext('2d')!;
  const alphabetContainer = document.createElement('div');
  alphabetContainer.style = 'height: 250px; overflow-y: scroll;';
  alphabetContainer.append(alphabetCanvas);

  function selectCharInAlphabet(index: number) {
    const char = font.charactersList[index];

    drawCharShapeInAlphabet(
      session.alphabetData.selectedChar,
      font.charactersList[session.alphabetData.selectedChar].shape,
      '#FFFFFF',
      '#000000',
    );
    session.dp.char = String.fromCodePoint(char.codepoint);
    drawCharShapeInAlphabet(
      index,
      font.charactersList[index].shape,
      '#000000',
      '#00FFFF',
    );

    session.alphabetData.selectedChar = index;
  }
  alphabetCanvas.addEventListener('click', (e) => {
    const r = Math.floor(e.offsetY / alphabetViewScale / font.height);
    const c = Math.floor(e.offsetX / alphabetViewScale / font.width);
    const index = r * alphabetCols + c;
    const char = font.charactersList[index];
    if (!char) throw new Error(`No char found for position y${r},x${c}`);

    selectCharInAlphabet(index);

    if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
      const selectedPalettePhox = phoxelis.getPhoxFromPaletteIndex(
        session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
          char: session.dp.char,
          fg: selectedPalettePhox.fg,
          bg: selectedPalettePhox.bg,
        });
      }
    }
  });

  const colorPickerEl = document.createElement('div');
  colorPickerEl.id = '#colorpicker';
  const colorPicker = iro.ColorPicker(colorPickerEl, {
    width: 150,
    layout: [
      {
        component: iro.ui.Wheel,
      },
      {
        component: iro.ui.Slider,
      },
    ],
  });
  const handleColorPickeChange = (color: any) => {
    session.dp[session.selectedColorType] = color.hexString;

    if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
      const selectedPalettePhox = phoxelis.getPhoxFromPaletteIndex(
        session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
          char: selectedPalettePhox.char,
          fg:
            session.selectedColorType === 'fg'
              ? session.dp[session.selectedColorType]
              : selectedPalettePhox.fg,
          bg:
            session.selectedColorType === 'bg'
              ? session.dp[session.selectedColorType]
              : selectedPalettePhox.bg,
        });
      }
    }
  }
  colorPicker.on('color:change', handleColorPickeChange);
  const fgColorButton = document.createElement('button');
  fgColorButton.innerHTML = 'Foreground';
  fgColorButton.addEventListener('click', () => selectColorType('fg'));
  colorPickerEl.append(fgColorButton);
  const bgColorButton = document.createElement('button');
  bgColorButton.innerHTML = 'Background';
  bgColorButton.addEventListener('click', () => selectColorType('bg'));
  colorPickerEl.append(bgColorButton);
  function selectColorType(type: 'fg' | 'bg') {
    session.selectedColorType = type;
    colorPicker.color.hexString = session.dp[type];
  }

  selectColorType('fg');

  const panzoomConfiguration = {
    minScale: 0.15,
    maxScale: 10,
    noBind: true,
    relative: true,
    cursor: 'default',
    startX: 0,
    startY: 0,
    startScale: 1,
  };
  let scale = panzoomConfiguration.startScale;
  const hammer = new Hammer(drawboard);

  const refImagePanzoomConfig = { ...panzoomConfiguration };
  let refImageScale = refImagePanzoomConfig.startScale;

  let panzoom: PanzoomObject | null = null;
  let refImagePanzoom: PanzoomObject | null = null;

  /** Can only be done once drawboard is in the DOM */
  function startPanzoom() {
    panzoom = Panzoom(layersWrapper, panzoomConfiguration);
    refImagePanzoom = Panzoom(refImage, refImagePanzoomConfig);

    if (data) {
      refImagePanzoom.pan(data.refImage.config.panX, data.refImage.config.panY);
      refImagePanzoom.zoom(data.refImage.config.scale);
    }
  }

  function setReferenceImage(base64: string) {
    refImage.src = base64;
    refImageScale = 1;
    refImagePanzoom?.reset();
  }

  function getReferenceImageConfig() {
    return {
      src: refImage.src ?? '',
      config: {
        panX: refImagePanzoom?.getPan().x ?? 0,
        panY: refImagePanzoom?.getPan().y ?? 0,
        scale: refImagePanzoom?.getScale() ?? 1,
      },
    };
  }

  // MARK: Load data variable if present. Create defaults if not
  if (data) {
    phoxelis.importPhoxelis(data.phoxelis);

    ds.layers = _.mapValues(data.layers, (l, k) => {
      const target = createLayerTarget();
      layersTargets[k] = target;

      return {
        ...l,
      };
    });
    selectLayer(phoxelis.layers[0].id);
    setReferenceImage(data.refImage.src);
  }

  // MARK: Layers
  function createLayer(layerId?: string) {
    const target = createLayerTarget();

    const lid = layerId ?? phoxelis.addLayer();

    ds.layers[lid] = {
      name: `Layer #${phoxelis.layers.length}`,
      opacity: 100,
      visible: true,
    };

    layersTargets[lid] = target;

    return lid;
  }

  function removeLayer(layerId: string) {
    if (phoxelis.layers.length === 1) {
      console.warn("removeDocumentLayer error: You can't remove the base layer.");
      return;
    }

    const layerPosition = phoxelis.layerPositions[layerId];
    phoxelis.removeLayer(layerId);
    delete ds.layers[layerId];

    const newSelectPos = Math.max(0, Math.min(phoxelis.layers.length - 1, layerPosition));
    const layerBeforeId = phoxelis.layers[newSelectPos].id;
    selectLayer(layerBeforeId);
  }

  function moveLayer(...args: Parameters<typeof phoxelis.moveLayer>) {
    return phoxelis.moveLayer(...args);
  }

  function selectLayer(layerId: string) {
    session.activeLayer = layerId;
  }

  function getSortedLayers() {
    return phoxelis.layers.map((l) => l.id);
  }

  function createLayerTarget() {
    const target = document.createElement('canvas');
    target.width = font.width * size.cols;
    target.height = font.height * size.rows;
    target.style = `height: 100%; width: 100%; object-fit: contain;`;
    return target;
  }

  function renderDpWithMode(
    target: ReturnType<typeof Phoxelis>,
    r: number,
    c: number,
    layerId: string,
    options: { draftErasure: boolean } = { draftErasure: false },
  ) {
    if (session.drawMode === 'draw') {
      target.renderPhoxel(session.dp.char, session.dp.fg, session.dp.bg, r, c, layerId);
      return;
    } else if (session.drawMode === 'char') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        session.dp.char,
        underlyingPhoxel.fg,
        underlyingPhoxel.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'color') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        underlyingPhoxel.char,
        session.dp.fg,
        session.dp.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'fg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        underlyingPhoxel.char,
        session.dp.fg,
        underlyingPhoxel.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'bg') {
      const underlyingPhoxel = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!underlyingPhoxel) return;
      target.renderPhoxel(
        underlyingPhoxel.char,
        underlyingPhoxel.fg,
        session.dp.bg,
        r,
        c,
        layerId,
      );
    } else if (session.drawMode === 'erase') {
      if (options.draftErasure) {
        target.renderPhoxel('D', '#FF0000', '#FF000055', r, c, layerId);
      } else {
        target.removePhoxel(r, c, layerId);
      }
    }
  }

  // MARK: Undo-Redo Stack Management
  type ChangesStack = Array<() => void>;
  let changesHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
  let redoHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
  const maxChangesHistory = 50;

  function commitPhoxels(phoxelPositions: Array<PhoxelPosition>) {
    const undoChanges: ChangesStack = [];
    const changes: ChangesStack = [];
    const currentLayerId = session.activeLayer; // Captured for undo/redo funcs

    phoxelPositions.forEach(([r, c]) => {
      const origPhox = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!origPhox) {
        // Note: Pass currentLayerId, not session.activeLayer to funcs
        undoChanges.push(() => phoxelis.removePhoxel(r, c, currentLayerId));
      } else {
        undoChanges.push(() =>
          phoxelis.renderPhoxel(
            origPhox.char,
            origPhox.fg,
            origPhox.bg,
            r,
            c,
            currentLayerId,
          ),
        );
      }

      renderDpWithMode(phoxelis, r, c, session.activeLayer);

      const newPhox = phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!newPhox) {
        changes.push(() => phoxelis.removePhoxel(r, c, currentLayerId));
      } else {
        changes.push(() =>
          phoxelis.renderPhoxel(
            newPhox.char,
            newPhox.fg,
            newPhox.bg,
            r,
            c,
            currentLayerId,
          ),
        );
      }
    });

    if (changesHistory.length === maxChangesHistory) changesHistory.shift();
    changesHistory.push({ changes, undoChanges });
    redoHistory = [];
  }

  function undoLastChange() {
    const lastChange = changesHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to undo');
      return;
    }

    lastChange.undoChanges.forEach((fn) => fn());
    redoHistory.push(lastChange);
  }

  function redoLastChange() {
    const lastChange = redoHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to redo');
      return;
    }

    lastChange.changes.forEach((fn) => fn());
    changesHistory.push(lastChange);
  }

  // sampleRenderContent(phoxelis, rows, cols);

  // MARK: Hotkeys
  interface Hotkey {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    key?: string;
    mouse?: number;
    onHotkeyStart?: (e: KeyboardEvent | PointerEvent) => void;
    onHotkeyEnd?: (e: KeyboardEvent | PointerEvent) => void;
  }

  const hotkeys: Hotkey[] = [
    { ctrl: true, key: 'z', onHotkeyEnd: () => undoLastChange() },
    { ctrl: true, key: 'y', onHotkeyEnd: () => redoLastChange() },
    {
      ctrl: true,
      mouse: 1,
      onHotkeyStart(e) {
        setTool(panzoomTool.name);
        currTool?.handlers.onPointerDown(e as PointerEvent);
      },
    },
    {
      shift: true,
      mouse: 1,
      onHotkeyStart(e) {
        setTool(panzoomTool.name);
        currTool?.handlers.onPointerDown(e as PointerEvent);
      },
    },
  ];
  const downHotkeys: Hotkey[] = [];

  const handleHotkeyKeydown = (e: KeyboardEvent) => {
    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.key.toLocaleLowerCase() === h.key,
    );
    if (matchingHotkey) {
      matchingHotkey.onHotkeyStart?.(e);
      downHotkeys.push(matchingHotkey);
    }
  };
  const handleHotkeyKeyup = (e: KeyboardEvent) => {
    const matchinDownHotkey = downHotkeys.find(
      (h) => e.key.toLocaleLowerCase() === h.key,
    );
    if (matchinDownHotkey) {
      matchinDownHotkey.onHotkeyEnd?.(e);
      downHotkeys.splice(downHotkeys.indexOf(matchinDownHotkey), 1);
    }

    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.key.toLocaleLowerCase() === h.key,
    );
    if (matchingHotkey == matchinDownHotkey) {
      // do nothing as we already ended the hotkey
    } else if (matchingHotkey) {
      matchingHotkey.onHotkeyEnd?.(e);
    }
  };
  window.addEventListener('keydown', handleHotkeyKeydown);
  window.addEventListener('keyup', handleHotkeyKeyup);
  drawboard.addEventListener('pointerdown', (e) => {
    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.button === h.mouse,
    );
    if (matchingHotkey) {
      matchingHotkey.onHotkeyStart?.(e);
      downHotkeys.push(matchingHotkey);
    }
  });
  drawboard.addEventListener('pointerup', (e) => {
    const matchinDownHotkey = downHotkeys.find((h) => e.button === h.mouse);
    if (matchinDownHotkey) {
      matchinDownHotkey.onHotkeyEnd?.(e);
      downHotkeys.splice(downHotkeys.indexOf(matchinDownHotkey), 1);
    }

    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.button === h.mouse,
    );
    if (matchingHotkey == matchinDownHotkey) {
      // do nothing as we already ended the hotkey
    } else if (matchingHotkey) {
      matchingHotkey.onHotkeyEnd?.(e);
    }
  });

  // MARK: Drawboard interactions
  hammer.get('pinch').set({ enable: true });
  hammer.on('pinchstart', (e) => {
    setTool(panzoomTool.name);
    currTool?.handlers.onPinchStart(e);
  });

  type CellPosition = { x: number; y: number };
  const mousePos: CellPosition = { x: -1, y: -1 };

  function setMousePos(event: PointerEvent) {
    const { width, top, left } = phoxelis.canvas.getBoundingClientRect();
    const scale = width / (size.cols * font.width);
    const mouseScreenPosX = event.clientX - left;
    const mouseScreenPosY = event.clientY - top;
    mousePos.x = Math.min(
      size.cols - 1,
      Math.max(0, Math.floor(mouseScreenPosX / (font.width * scale))),
    );
    mousePos.y = Math.min(
      size.rows - 1,
      Math.max(0, Math.floor(mouseScreenPosY / (font.height * scale))),
    );
  }
  drawboard.addEventListener('pointerdown', setMousePos);
  drawboard.addEventListener('pointermove', setMousePos);
  drawboard.addEventListener('pointerup', setMousePos);

  // MARK: Tools

  const handleWindowMouseOut = (e: MouseEvent) => {
    if (e.relatedTarget === null) {
      currTool?.tool.abort?.();
    }
  };
  window.addEventListener('mouseout', handleWindowMouseOut);

  interface Tool {
    name: string;
    onPointerDown?: (e: PointerEvent) => void;
    onPointerMove?: (e: PointerEvent) => void;
    onPointerUp?: (e: PointerEvent) => void;
    onPinchStart?: (e: HammerInput) => void;
    onPinchMove?: (e: HammerInput) => void;
    onPinchEnd?: (e: HammerInput) => void;
    submit?: () => void;
    abort?: () => void;
    resetTool?: () => void;
    data?: Record<string, any>;
  }

  interface PanzoomTool extends Tool {
    data: {
      panzooming: boolean;
      zooming: boolean;
      panning: boolean;
    };
  }
  const panzoomTool: PanzoomTool = {
    name: 'panzoom',
    data: {
      panzooming: false,
      zooming: false,
      panning: false,
    },
    onPointerDown(e) {
      this.data.panzooming = true;
      this.data.panning = e.ctrlKey;
      this.data.zooming = e.shiftKey;
    },
    onPointerMove(e) {
      if (!this.data.panzooming) return;
      const targetZoom = session.movingRefImage ? refImagePanzoom : panzoom;

      if (!targetZoom) {
        console.error(
          'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
        );
        return;
      }

      if (this.data.panning) {
        targetZoom.pan(
          e.movementX / targetZoom.getScale(),
          e.movementY / targetZoom.getScale(),
        );
      } else if (this.data.zooming) {
        targetZoom.zoom(targetZoom.getScale() + (e.movementY / 35) * -1);
      }
    },
    onPointerUp() {
      if (!this.data.panzooming) return;
      this.resetTool!();
      this.submit!();
      setPreviousTool();
    },
    onPinchStart() {
      this.data.panzooming = true;
      const targetZoom = session.movingRefImage ? refImagePanzoom : panzoom;

      if (!targetZoom) {
        console.error(
          'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
        );
        return;
      }

      if (session.movingRefImage) {
        refImageScale = targetZoom.getScale();
      } else {
        scale = targetZoom.getScale();
      }
    },
    onPinchMove(e) {
      if (this.data.panzooming) {
        const targetZoom = session.movingRefImage ? refImagePanzoom : panzoom;

        if (!targetZoom) {
          console.error(
            'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
          );
          return;
        }

        const s = session.movingRefImage ? refImageScale : scale;
        const newZoomVal = s * e.scale;
        targetZoom.zoom(newZoomVal);
        targetZoom.pan(
          (e.velocityX * 11) / targetZoom.getScale(),
          (e.velocityY * 11) / targetZoom.getScale(),
        );
      }
    },
    onPinchEnd() {
      if (!this.data!.panzooming) return;
      this.resetTool!();
      this.submit!();
    },
    submit() {
      setPreviousTool();
    },
    resetTool() {
      this.data.panzooming = false;
      this.data.panning = false;
      this.data.zooming = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  interface DrawTool extends Tool {
    data: {
      draftPhoxels: Map<string, Phoxel>;
      drawing: boolean;
    };
    addPhoxelToDraft: (p: Phoxel) => void;
  }
  const drawTool: DrawTool = {
    name: 'draw',
    data: {
      draftPhoxels: new Map(),
      drawing: false,
    },
    addPhoxelToDraft(p: Phoxel) {
      this.data!.draftPhoxels.set(`${p.r};${p.c}`, p);
      renderDpWithMode(draftScreen, p.r, p.c, getDraftBaseLayer(), {
        draftErasure: true,
      });
    },
    onPointerDown() {
      this.data.drawing = true;
      this.addPhoxelToDraft({ phox: session.dp, r: mousePos.y, c: mousePos.x });
    },
    onPointerMove() {
      if (this.data.drawing) {
        this.addPhoxelToDraft({ phox: session.dp, r: mousePos.y, c: mousePos.x });
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data.drawing = false;
      this.submit!();
    },
    submit() {
      const phoxelsPositions: Array<PhoxelPosition> = [];
      this.data.draftPhoxels.forEach((p) => {
        phoxelsPositions.push([p.r, p.c]);
      });
      commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      this.data.draftPhoxels = new Map();
      draftScreen.reset(true);
      this.data.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Rectangle (outline) Tool ────────────────────────────────────────────────
  const rectTool: Tool = {
    name: 'rect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      // Clear draft and redraw preview rectangle
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);
      // Top & bottom edges
      for (let c = c1; c <= c2; c++) {
        renderDpWithMode(draftScreen, r1, c, getDraftBaseLayer(), {
          draftErasure: true,
        });
        renderDpWithMode(draftScreen, r2, c, getDraftBaseLayer(), {
          draftErasure: true,
        });
      }
      // Left & right edges
      for (let r = r1; r <= r2; r++) {
        renderDpWithMode(draftScreen, r, c1, getDraftBaseLayer(), {
          draftErasure: true,
        });
        renderDpWithMode(draftScreen, r, c2, getDraftBaseLayer(), {
          draftErasure: true,
        });
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);

      const phoxelsPositions: Array<PhoxelPosition> = [];

      // Top & bottom edges
      for (let c = c1; c <= c2; c++) {
        phoxelsPositions.push([r1, c]);
        phoxelsPositions.push([r2, c]);
      }
      // Left & right edges
      for (let r = r1; r <= r2; r++) {
        phoxelsPositions.push([r, c1]);
        phoxelsPositions.push([r, c2]);
      }

      commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Filled Rectangle Tool ───────────────────────────────────────────────────
  const filledRectTool: Tool = {
    name: 'filledRect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          renderDpWithMode(draftScreen, r, c, getDraftBaseLayer(), {
            draftErasure: true,
          });
        }
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);

      const phoxelsPositions: Array<PhoxelPosition> = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          phoxelsPositions.push([r, c]);
        }
      }
      commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Line Tool (Bresenham's algorithm) ──────────────────────────────────────
  function bresenhamCells(
    r0: number,
    c0: number,
    r1: number,
    c1: number,
  ): { r: number; c: number }[] {
    const cells: { r: number; c: number }[] = [];
    let dr = Math.abs(r1 - r0);
    let dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dr - dc;
    let r = r0;
    let c = c0;
    while (true) {
      cells.push({ r, c });
      if (r === r1 && c === c1) break;
      const e2 = 2 * err;
      if (e2 > -dc) {
        err -= dc;
        r += sr;
      }
      if (e2 < dr) {
        err += dr;
        c += sc;
      }
    }
    return cells;
  }

  const lineTool: Tool = {
    name: 'line',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
      for (const { r, c } of cells) {
        renderDpWithMode(draftScreen, r, c, getDraftBaseLayer(), {
          draftErasure: true,
        });
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      for (const { r, c } of cells) {
        phoxelsPositions.push([r, c]);
      }
      commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Ellipse Tool (outline) ──────────────────────────────────────────────────
  // Uses the midpoint ellipse algorithm, with rx/ry derived from start→current position
  const ellipseTool: Tool = {
    name: 'ellipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      drawEllipseOutline(
        (r, c) =>
          renderDpWithMode(draftScreen, r, c, getDraftBaseLayer(), {
            draftErasure: true,
          }),
        startR,
        startC,
        rx,
        ry,
      );
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      drawEllipseOutline((r, c) => phoxelsPositions.push([r, c]), startR, startC, rx, ry);
      commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Filled Ellipse Tool ─────────────────────────────────────────────────────
  const filledEllipseTool: Tool = {
    name: 'filledEllipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      drawEllipseFill(
        (r, c) =>
          renderDpWithMode(draftScreen, r, c, getDraftBaseLayer(), {
            draftErasure: true,
          }),
        startR,
        startC,
        rx,
        ry,
      );
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      drawEllipseFill((r, c) => phoxelsPositions.push([r, c]), startR, startC, rx, ry);
      commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
    },
    abort() {
      this.resetTool!();
    },
  };

  const tools = {
    [panzoomTool.name]: panzoomTool,
    [drawTool.name]: drawTool,
    [lineTool.name]: lineTool,
    [rectTool.name]: rectTool,
    [filledRectTool.name]: filledRectTool,
    [ellipseTool.name]: ellipseTool,
    [filledEllipseTool.name]: filledEllipseTool,
  };

  // ─── Ellipse helper functions ────────────────────────────────────────────────

  /** Draw ellipse outline using midpoint ellipse algorithm */
  function drawEllipseOutline(
    renderFn: (r: number, c: number) => void,
    centerR: number,
    centerC: number,
    rx: number,
    ry: number,
  ) {
    if (rx === 0 && ry === 0) return;
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    let x = 0;
    let y = ry;
    let d1 = ry2 - rx2 * ry + 0.25 * rx2;
    let dx = 2 * ry2 * x;
    let dy = 2 * rx2 * y;

    const plot4 = (cr: number, cc: number, dx: number, dy: number) => {
      renderFn(cr + dy, cc + dx);
      renderFn(cr - dy, cc + dx);
      renderFn(cr + dy, cc - dx);
      renderFn(cr - dy, cc - dx);
    };

    // Region 1: slope > -1
    while (dx < dy) {
      plot4(centerR, centerC, x, y);
      if (d1 < 0) {
        x++;
        dx += 2 * ry2;
        d1 += dx + ry2;
      } else {
        x++;
        y--;
        dx += 2 * ry2;
        dy -= 2 * rx2;
        d1 += dx - dy + ry2;
      }
    }

    // Region 2: slope <= -1
    let d2 = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2;
    while (y >= 0) {
      plot4(centerR, centerC, x, y);
      if (d2 > 0) {
        y--;
        dy -= 2 * rx2;
        d2 += rx2 - dy;
      } else {
        y--;
        x++;
        dx += 2 * ry2;
        dy -= 2 * rx2;
        d2 += dx - dy + rx2;
      }
    }
  }

  /** Fill ellipse using scanline approach with midpoint ellipse algorithm */
  function drawEllipseFill(
    renderFn: (r: number, c: number) => void,
    centerR: number,
    centerC: number,
    rx: number,
    ry: number,
  ) {
    if (rx === 0 && ry === 0) return;

    // For each row, find the leftmost and rightmost column that falls inside the ellipse
    const halfRx = rx + 0.5;
    const halfRy = ry + 0.5;
    const rMin = centerR - halfRy;
    const rMax = centerR + halfRy;

    for (
      let r = Math.max(0, Math.floor(rMin));
      r <= Math.min(size.rows - 1, Math.ceil(rMax));
      r++
    ) {
      const dy = r - centerR;
      // ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
      // => |x-cx| <= rx * sqrt(1 - (y-cy)^2/ry^2)
      const ratio = (dy * dy) / (halfRy * halfRy);
      if (ratio > 1) continue;
      const dx = Math.sqrt(Math.max(0, 1 - ratio)) * halfRx;
      const left = Math.max(0, Math.ceil(centerC - dx));
      const right = Math.min(size.cols - 1, Math.floor(centerC + dx));
      for (let c = left; c <= right; c++) {
        renderFn(r, c);
      }
    }
  }

  let currTool: {
    tool: Tool;
    handlers: {
      onPointerDown: (e: PointerEvent) => void;
      onPointerUp: (e: PointerEvent) => void;
      onPointerMove: (e: PointerEvent) => void;
      onPinchStart: (e: HammerInput) => void;
      onPinchMove: (e: HammerInput) => void;
      onPinchEnd: (e: HammerInput) => void;
    };
  } | null = null;

  let previousTool: Tool | null = null;
  function setTool(name: string) {
    const tool = tools[name];

    if (!tool) {
      console.error(`setTool error: Tool ${name} doesn't exist.`);
      return;
    }

    if (currTool) {
      currTool.tool.abort?.();
      drawboard.removeEventListener('pointerdown', currTool.handlers.onPointerDown);
      drawboard.removeEventListener('pointermove', currTool.handlers.onPointerMove);
      drawboard.removeEventListener('pointerup', currTool.handlers.onPointerUp);
      hammer.off('pinchstart', currTool.handlers.onPinchStart);
      hammer.off('pinchmove', currTool.handlers.onPinchMove);
      hammer.off('pinchend', currTool.handlers.onPinchEnd);
      previousTool = currTool.tool;
    }

    currTool = {
      tool,
      handlers: {
        onPointerDown: (e) => {
          drawboard.setPointerCapture(e.pointerId);
          tool.onPointerDown!(e);
        },
        onPointerMove: (e) => {
          tool.onPointerMove!(e);
        },
        onPointerUp: (e) => {
          try {
            drawboard.releasePointerCapture(e.pointerId);
          } catch {}
          tool.onPointerUp!(e);
        },
        onPinchStart: (e) => tool.onPinchStart!(e),
        onPinchMove: (e) => tool.onPinchMove!(e),
        onPinchEnd: (e) => tool.onPinchEnd!(e),
      },
    };
    drawboard.addEventListener('pointerdown', currTool.handlers.onPointerDown);
    drawboard.addEventListener('pointermove', currTool.handlers.onPointerMove);
    drawboard.addEventListener('pointerup', currTool.handlers.onPointerUp);
    hammer.on('pinchstart', currTool.handlers.onPinchStart);
    hammer.on('pinchmove', currTool.handlers.onPinchMove);
    hammer.on('pinchend', currTool.handlers.onPinchEnd);
  }
  function setPreviousTool() {
    if (previousTool) setTool(previousTool.name);
  }

  setTool(drawTool.name);

  function drawCharShapeInAlphabet(
    index: number,
    charShape: CharShape,
    fg: string,
    bg: string,
  ) {
    const yOffset = Math.floor(index / alphabetCols) * font.height;
    const xOffset = (index % alphabetCols) * font.width;
    for (let y = 0; y < charShape.length; y++) {
      for (let x = 0; x < charShape[0].length; x++) {
        const pixelVal = charShape[y][x];
        alphabetCtx.fillStyle = pixelVal ? fg : bg;
        alphabetCtx.fillRect(xOffset + x, yOffset + y, 1, 1);
      }
    }
  }

  font.charactersList.forEach((char, i) => {
    drawCharShapeInAlphabet(i, char.shape, '#FFFFFF', '#000000');
  });

  // MARK: File management
  function exportData(): WorkspaceExportConfig {
    const phoxelisData = phoxelis.exportPhoxelis();

    const documentData = {
      size,
      fontName,
      data: {
        phoxelis: phoxelisData,
        layers: ds.layers,
        refImage: {
          src: refImage.src ?? '',
          config: {
            panX: refImagePanzoom?.getPan().x ?? 0,
            panY: refImagePanzoom?.getPan().y ?? 0,
            scale: refImagePanzoom?.getScale() ?? 1,
          },
        },
      },
    };

    return documentData;
  }

  // // TODO start document?

  function exportPhoxelis() {
    return phoxelis.exportPhoxelis();
  }

  // MARK: Rendering
  let continueRenderLoop = true;
  let lastAnimationFrame: number = -1;
  const renderLoop = () => {
    phoxelis.renderFrame(
      phoxelis.layers.map((l) => ({
        additionalTarget: layersTargets[l.id],
        opacity: ds.layers[l.id].visible ? ds.layers[l.id].opacity / 100 : 0,
      })),
    );
    draftScreen.renderFrame();
    if(continueRenderLoop) {
      lastAnimationFrame = window.requestAnimationFrame(renderLoop);
    };
  };
  lastAnimationFrame = window.requestAnimationFrame(renderLoop);
  

  function dispose() {
    // TODO There is some memory leak when creating many new documents. what else can we dispose of? 
    window.removeEventListener('keydown', handleHotkeyKeydown);
    window.removeEventListener('keyup', handleHotkeyKeyup);
    window.removeEventListener('mouseout', handleWindowMouseOut);

    continueRenderLoop = false;
    window.cancelAnimationFrame(lastAnimationFrame);

    hammer.destroy();
    panzoom?.destroy();
    refImagePanzoom?.destroy();
    colorPicker.off('color:change', handleColorPickeChange);
    colorPickerEl.remove();
  }

  return {
    size,
    fontName,
    phoxelis,
    ds,
    session,
    drawboard,
    paletteSelector,
    currTool,
    layersTargets,
    colorPicker: colorPickerEl,
    alphabet: alphabetContainer,
    hotkeys,
    createLayer,
    removeLayer,
    moveLayer,
    selectLayer,
    getDraftBaseLayer,
    renderDpWithMode,
    undoLastChange,
    redoLastChange,
    commitPhoxels,
    setReferenceImage,
    setTool,
    selectColorType,
    startPanzoom,
    getSortedLayers,
    exportPhoxelis,
    getReferenceImageConfig,
    exportData,
    dispose,
  };
}
