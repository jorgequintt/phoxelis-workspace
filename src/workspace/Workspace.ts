import { getFont, Phoxelis, type Phox, type CharShape } from 'phoxelis';
import '../style.css';
import Panzoom, { type PanzoomObject } from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import _ from 'lodash';
import iro from '@jaames/iro';

const layerPreviewStyle = `height: 100%; width: 100%; object-fit: contain;`;
const paletteScale = 2;

type Phoxel = {
  phox: Phox;
  r: number;
  c: number;
};
type PhoxelPosition = [r: number, c: number];

export type DocumentLayer = {
  layerId: string;
  name: string;
  target: HTMLCanvasElement;
  opacity: number;
  visible: boolean;
};

interface WorkspaceState {
  phoxelis: ReturnType<typeof Phoxelis>;
  font: Awaited<ReturnType<typeof getFont>>;
  layers: Record<string, DocumentLayer>;
  size: { rows: number; cols: number };
  refImageBase64: string;
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

// & This is good. Let's not sell our app soul to react
export async function Workspace(config: {
  size: {
    rows: number;
    cols: number;
  };
  fontName: Parameters<typeof getFont>[0];
  filename: string;
}) {
  const { size, filename, fontName } = config;

  const font = await getFont(fontName);
  const phoxelis = Phoxelis(size.rows, size.cols, font, {
    renderPalette: true,
    createBaseLayer: false,
  });
  const draftScreen = Phoxelis(size.rows, size.cols, font);
  const getDraftBaseLayer = () => {
    return draftScreen.layers[0].id;
  };

  let ws: WorkspaceState = {
    phoxelis,
    font,
    size,
    layers: {},
    refImageBase64: '',
  };
  createLayer(); // Create base layer

  const startDp = { char: 'D', fg: '#00FF00', bg: '#FF00FF' };
  let session: SessionState = {
    dp: { char: 'D', fg: '#00FF00', bg: '#FF00FF' },
    drawMode: 'draw',
    activeLayer: ws.phoxelis.layers[0].id,
    paletteData: {
      selectedPhox: -1,
      modifyingPhox: false,
    },
    alphabetData: {
      selectedChar: ws.font.charactersList.findIndex(
        (c) => c.codepoint === startDp.char.codePointAt(0),
      ),
    },
    selectedColorType: 'fg',
  };
  selectLayer(session.activeLayer);

  // MARK: Elements
  const refImage = document.createElement('img');
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

  const paletteSelector = document.createElement('div');
  paletteSelector.style = 'position: relative;';
  const paletteOverlay = document.createElement('canvas');
  paletteOverlay.width = ws.phoxelis.palette.width;
  paletteOverlay.height = ws.phoxelis.palette.height;
  const paletteScaledHeight = ws.font.height * paletteScale;
  ws.phoxelis.palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
  paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
  const onPaletteOverlayClick = (e: MouseEvent) => {
    if (!paletteOverlay) {
      console.error(
        'onPaletteOverlayClick error: null "paletteOverlay" was passed as param.',
      );
      return;
    }
    const x = e.offsetX;
    const paletteMaxCells = ws.phoxelis.palette.width / ws.font.width;
    const pos = Math.floor(
      (x / (paletteScale * ws.phoxelis.palette.width)) * paletteMaxCells,
    );
    const phox = ws.phoxelis.getPhoxFromPaletteIndex(pos);
    if (!phox) {
      console.warn('Null Phox selected. Omitting selection');
      return;
    }
    session.dp = phox;
    session.paletteData.selectedPhox = pos;
    colorPicker.color.hexString = session.dp[session.selectedColorType];
    selectCharInAlphabet(
      ws.font.charactersList.findIndex(
        (c) => c.codepoint === session.dp.char.codePointAt(0),
      ),
    );
    const ctx = paletteOverlay.getContext('2d');
    ctx!.reset();
    ctx!.strokeStyle = 'green';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(pos * ws.font.width, 0, ws.font.width, ws.font.height);
  };
  paletteOverlay.addEventListener('click', onPaletteOverlayClick);
  paletteSelector.append(ws.phoxelis.palette);
  paletteSelector.append(paletteOverlay);

  const alphabetCanvas = document.createElement('canvas');
  const alphabetWidth = 100;
  const alphabetCols = Math.ceil(alphabetWidth / ws.font.width);
  const alphabetRows = Math.ceil(ws.font.length / alphabetCols);
  alphabetCanvas.width = alphabetCols * ws.font.width;
  alphabetCanvas.height = alphabetRows * ws.font.height;
  const alphabetViewScale = 2;
  alphabetCanvas.style = `width: ${alphabetCanvas.width * alphabetViewScale}px; image-rendering: pixelated;`;
  const alphabetCtx = alphabetCanvas.getContext('2d')!;
  const alphabetContainer = document.createElement('div');
  alphabetContainer.style = 'height: 250px; overflow-y: scroll;';
  alphabetContainer.append(alphabetCanvas);

  function selectCharInAlphabet(index: number) {
    const char = ws.font.charactersList[index];

    drawCharShapeInAlphabet(
      session.alphabetData.selectedChar,
      ws.font.charactersList[session.alphabetData.selectedChar].shape,
      '#FFFFFF',
      '#000000',
    );
    session.dp.char = String.fromCodePoint(char.codepoint);
    drawCharShapeInAlphabet(
      index,
      ws.font.charactersList[index].shape,
      '#000000',
      '#00FFFF',
    );

    session.alphabetData.selectedChar = index;
  }
  alphabetCanvas.addEventListener('click', (e) => {
    const r = Math.floor(e.offsetY / alphabetViewScale / ws.font.height);
    const c = Math.floor(e.offsetX / alphabetViewScale / ws.font.width);
    const index = r * alphabetCols + c;
    const char = ws.font.charactersList[index];
    if (!char) throw new Error(`No char found for position y${r},x${c}`);

    selectCharInAlphabet(index);

    if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
      const selectedPalettePhox = ws.phoxelis.getPhoxFromPaletteIndex(
        session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        ws.phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
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
  colorPicker.on('color:change', (color: any) => {
    session.dp[session.selectedColorType] = color.hexString;

    if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
      const selectedPalettePhox = ws.phoxelis.getPhoxFromPaletteIndex(
        session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        ws.phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
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
  });
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

  function setReferenceImage(base64: string) {
    if (!refImagePanzoom) {
      console.error(
        'setReferenceImage error: No refImagePanzoom. Did you startPanzoom()?',
      );
      return;
    }

    refImage.src = base64;
    refImageScale = 1;
    refImagePanzoom.reset();
  }

  function createLayer(layerId?: string) {
    const target = document.createElement('canvas');
    target.width = ws.font.width * ws.size.cols;
    target.height = ws.font.height * ws.size.rows;
    target.style = layerPreviewStyle;

    const lid = layerId ?? ws.phoxelis.addLayer();

    ws.layers[lid] = {
      layerId: lid,
      name: `Layer #${ws.phoxelis.layers.length}`,
      target,
      opacity: 100,
      visible: true,
    };

    return lid;
  }

  function removeLayer(layerId: string) {
    if (ws.phoxelis.layers.length === 1) {
      console.warn("removeDocumentLayer error: You can't remove the base layer.");
      return;
    }

    const layerPosition = ws.phoxelis.layerPositions[layerId];
    ws.phoxelis.removeLayer(layerId);
    delete ws.layers[layerId];


    const newSelectPos = Math.max(
      0,
      Math.min(ws.phoxelis.layers.length - 1, layerPosition),
    );
    const layerBeforeId = ws.phoxelis.layers[newSelectPos].id;
    selectLayer(layerBeforeId);
  }

  function selectLayer(layerId: string) {
    session.activeLayer = layerId;
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
      const underlyingPhoxel = ws.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
      const underlyingPhoxel = ws.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
      const underlyingPhoxel = ws.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
      const underlyingPhoxel = ws.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
  // TODO to session? And to its own class?
  type ChangesStack = Array<() => void>;
  let changesHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
  let redoHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
  const maxChangesHistory = 50;

  function commitPhoxels(phoxelPositions: Array<PhoxelPosition>) {
    const undoChanges: ChangesStack = [];
    const changes: ChangesStack = [];

    phoxelPositions.forEach(([r, c]) => {
      const origPhox = ws.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!origPhox) {
        undoChanges.push(() => ws.phoxelis.removePhoxel(r, c, session.activeLayer));
      } else {
        undoChanges.push(() =>
          ws.phoxelis.renderPhoxel(
            origPhox.char,
            origPhox.fg,
            origPhox.bg,
            r,
            c,
            session.activeLayer,
          ),
        );
      }

      renderDpWithMode(ws.phoxelis, r, c, session.activeLayer);

      const newPhox = ws.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
      if (!newPhox) {
        changes.push(() => ws.phoxelis.removePhoxel(r, c, session.activeLayer));
      } else {
        changes.push(() =>
          ws.phoxelis.renderPhoxel(
            newPhox.char,
            newPhox.fg,
            newPhox.bg,
            r,
            c,
            session.activeLayer,
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
    {
      ctrl: true,
      key: 's',
      onHotkeyStart: (e) => {
        e.preventDefault();
      },
      onHotkeyEnd() {
        saveDocument(filename);
      },
    },
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

  window.addEventListener('keydown', (e) => {
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
  });
  window.addEventListener('keyup', (e) => {
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
  });
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
  }

  hammer.get('pinch').set({ enable: true });
  hammer.on('pinchstart', (e) => {
    setTool(panzoomTool.name);
    currTool?.handlers.onPinchStart(e);
  });

  type CellPosition = { x: number; y: number };
  const mousePos: CellPosition = { x: -1, y: -1 };

  function setMousePos(event: PointerEvent) {
    const { width, top, left } = ws.phoxelis.canvas.getBoundingClientRect();
    const scale = width / (ws.size.cols * ws.font.width);
    const mouseScreenPosX = event.clientX - left;
    const mouseScreenPosY = event.clientY - top;
    mousePos.x = Math.min(
      ws.size.cols - 1,
      Math.max(0, Math.floor(mouseScreenPosX / (ws.font.width * scale))),
    );
    mousePos.y = Math.min(
      ws.size.rows - 1,
      Math.max(0, Math.floor(mouseScreenPosY / (ws.font.height * scale))),
    );
  }
  drawboard.addEventListener('pointerdown', setMousePos);
  drawboard.addEventListener('pointermove', setMousePos);
  drawboard.addEventListener('pointerup', setMousePos);

  // MARK: Tools

  const abortActiveTool = () => {
    currTool?.tool.abort?.();
  };
  window.addEventListener('mouseout', (e) => {
    if (e.relatedTarget === null) {
      abortActiveTool();
    }
  });

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

  let movingRefImage = false;
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
      const targetZoom = movingRefImage ? refImagePanzoom : panzoom;

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
      const targetZoom = movingRefImage ? refImagePanzoom : panzoom;

      if (!targetZoom) {
        console.error(
          'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
        );
        return;
      }

      if (movingRefImage) {
        refImageScale = targetZoom.getScale();
      } else {
        scale = targetZoom.getScale();
      }
    },
    onPinchMove(e) {
      if (this.data.panzooming) {
        const targetZoom = movingRefImage ? refImagePanzoom : panzoom;

        if (!targetZoom) {
          console.error(
            'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
          );
          return;
        }

        const s = movingRefImage ? refImageScale : scale;
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
      setPreviousTool();
    },
    submit() {
      // TODO store panzoom config in document
      // saveRefImagePanzoomConfig(
      //   refImagePanzoom?.getScale(),
      //   refImagePanzoom?.getPan().x,
      //   refImagePanzoom?.getPan().y,
      // );
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
      r <= Math.min(ws.size.rows - 1, Math.ceil(rMax));
      r++
    ) {
      const dy = r - centerR;
      // ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
      // => |x-cx| <= rx * sqrt(1 - (y-cy)^2/ry^2)
      const ratio = (dy * dy) / (halfRy * halfRy);
      if (ratio > 1) continue;
      const dx = Math.sqrt(Math.max(0, 1 - ratio)) * halfRx;
      const left = Math.max(0, Math.ceil(centerC - dx));
      const right = Math.min(ws.size.cols - 1, Math.floor(centerC + dx));
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
    window.addEventListener('pointerup', currTool.handlers.onPointerUp);
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
    const yOffset = Math.floor(index / alphabetCols) * ws.font.height;
    const xOffset = (index % alphabetCols) * ws.font.width;
    for (let y = 0; y < charShape.length; y++) {
      for (let x = 0; x < charShape[0].length; x++) {
        const pixelVal = charShape[y][x];
        alphabetCtx.fillStyle = pixelVal ? fg : bg;
        alphabetCtx.fillRect(xOffset + x, yOffset + y, 1, 1);
      }
    }
  }

  ws.font.charactersList.forEach((char, i) => {
    drawCharShapeInAlphabet(i, char.shape, '#FFFFFF', '#000000');
  });

  // MARK: File management

  async function saveFile(data: string, filename: string) {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(filename, { create: true });
    const accessHandle = await fileHandle.createWritable();

    accessHandle.write(data);
    accessHandle.close();
  }

  async function loadFile(filename: string) {
    const root = await navigator.storage.getDirectory();
    try {
      const fileHandle = await root.getFileHandle(filename);
      const file = await fileHandle.getFile();
      const fileDataString = await file.text();
      return fileDataString;
    } catch (error) {
      console.error('loadFile Error:', error);
    }
  }

  async function saveDocument(filename: string) {
    const phoxelisData = ws.phoxelis.exportPhoxelis(filename);

    // TODO store refImage and refImagePanzoom confg
    const documentData = {
      phoxelis: phoxelisData,
      layers: _.mapValues(ws.layers, (e) => ({
        ...e,
        target: undefined,
      })),
    };

    const dataStr = JSON.stringify(documentData);
    saveFile(dataStr, filename);
    return documentData;
  }

  async function loadDocument(filename: string) {
    // TODO improve this and saveDocument to prevent bad documents
    const fileDataString = await loadFile(filename);
    if (!fileDataString) {
      console.error(`loadPhoxelis error: Could not load file "${filename}"`);
      return;
    }

    const fileData = JSON.parse(fileDataString) as Awaited<
      ReturnType<typeof saveDocument>
    >;
    ws.phoxelis.importPhoxelis(fileData.phoxelis);

    ws.layers = _.mapValues(fileData.layers, (l) => {
      const target = document.createElement('canvas');
      target.width = ws.font.width * ws.size.cols;
      target.height = ws.font.height * ws.size.rows;
      target.style = layerPreviewStyle;

      return {
        ...l,
        target,
      };
    });

    session.activeLayer = ws.phoxelis.layers[0].id;

    console.log(`${filename} imported.`);
  }

  // MARK: Rendering
  const renderLoop = () => {
    ws.phoxelis.renderFrame(
      ws.phoxelis.layers.map((l) => ({
        additionalTarget: ws.layers[l.id].target,
        opacity: ws.layers[l.id].visible ? ws.layers[l.id].opacity / 100 : 0,
      })),
    );
    window.requestAnimationFrame(renderLoop);
  };
  window.requestAnimationFrame(renderLoop);

  function renderDraftScreen() {
    draftScreen.renderFrame();
    window.requestAnimationFrame(renderDraftScreen);
  }
  window.requestAnimationFrame(renderDraftScreen);

  return {
    filename,
    ws,
    session,
    draftScreen,
    refImagePanzoomConfig,
    drawboard,
    refImage,
    paletteSelector,
    currTool,
    colorPicker: colorPickerEl,
    alphabet: alphabetContainer,
    movingRefImage,
    createLayer,
    removeLayer,
    selectLayer,
    getDraftBaseLayer,
    renderDpWithMode,
    undoLastChange,
    redoLastChange,
    commitPhoxels,
    setReferenceImage,
    setTool,
    saveDocument,
    loadDocument,
    selectColorType,
    startPanzoom,
  };
}