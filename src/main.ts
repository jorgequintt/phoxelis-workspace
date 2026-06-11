import { getFont, Phoxelis, type Phox, type CharShape } from 'phoxelis';
import './style.css';
import Panzoom from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import iro from '@jaames/iro';
import { downloadArrayBuffer, toggleFullScreen } from './utils';
import {
  saveRefImageToStorage,
  loadRefImageFromStorage,
  saveRefImagePanzoomConfig,
  loadRefImagePanzoomConfig,
  clearRefImageStorage,
  fileToBase64,
} from './refImageStorage';

const rows = 37;
const cols = 152;
const panzoomConfiguration = {
  minScale: 0.15,
  maxScale: 10,
  noBind: true,
  relative: true,
  cursor: 'default',
  startX: 0,
  startY: 0,
  startScale: 1,
  excludeClass: 'panzoom-exclude',
};
const refImagePanzoomConfig = { ...panzoomConfiguration };
let refImageScale = refImagePanzoomConfig.startScale;

let scale = panzoomConfiguration.startScale;
const filename = 'current_work';
const font = await getFont('1_Trithemius8x16');

let drawMode: 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase' = 'draw';
let dp: Phox = { char: 'D', fg: '#00FF00', bg: '#FF00FF' };

function renderDpWithMode(
  target: ReturnType<typeof Phoxelis>,
  r: number,
  c: number,
  options: { draftErasure: boolean } = { draftErasure: false },
) {
  if (drawMode === 'draw') {
    target.renderPhoxel(dp.char, dp.fg, dp.bg, r, c);
    return;
  } else if (drawMode === 'char') {
    const underlyingPhoxel = getPhoxFromPosition(r, c);
    if (!underlyingPhoxel) return;
    target.renderPhoxel(dp.char, underlyingPhoxel.fg, underlyingPhoxel.bg, r, c);
  } else if (drawMode === 'color') {
    const underlyingPhoxel = getPhoxFromPosition(r, c);
    if (!underlyingPhoxel) return;
    target.renderPhoxel(underlyingPhoxel.char, dp.fg, dp.bg, r, c);
  } else if (drawMode === 'fg') {
    const underlyingPhoxel = getPhoxFromPosition(r, c);
    if (!underlyingPhoxel) return;
    target.renderPhoxel(underlyingPhoxel.char, dp.fg, underlyingPhoxel.bg, r, c);
  } else if (drawMode === 'bg') {
    const underlyingPhoxel = getPhoxFromPosition(r, c);
    if (!underlyingPhoxel) return;
    target.renderPhoxel(underlyingPhoxel.char, underlyingPhoxel.fg, dp.bg, r, c);
  } else if (drawMode === 'erase') {
    if (options.draftErasure) {
      target.renderPhoxel('D', '#FF0000', '#FF000055', r, c);
    } else {
      removePhoxel(r, c);
    }
  }
}

const phoxelis = Phoxelis(rows, cols, font, true);
const {
  canvas,
  renderFrame,
  removePhoxel,
  importPhoxelis,
  exportPhoxelis,
  palette,
  getPhoxFromPaletteIndex,
  getPhoxFromPosition,
  storePhoxInPalette,
} = phoxelis;

const appContainer = document.createElement('div');
appContainer.style = 'width: 100%; height: 100%; display: flex; flex-direction: column;';

const navBar = document.createElement('div');
navBar.style = `width: 100%; background: #888888;`;

const content = document.createElement('div');
content.style =
  'width: 100%; display: flex; flex: 1; flex-direction: row; min-height: 0;';

const contentFooter = document.createElement('div');
contentFooter.style = 'overflow-x: scroll;';

let paletteData: {
  selectedPhox: number;
  modifyingPhox: boolean;
} = {
  selectedPhox: -1,
  modifyingPhox: false,
};
const paletteWrapper = document.createElement('div');
paletteWrapper.style = 'position: relative;';
const paletteOverlay = document.createElement('canvas');
paletteOverlay.width = palette.width;
paletteOverlay.height = palette.height;
const paletteScale = 2;
const paletteScaledHeight = font.height * paletteScale;
palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
paletteOverlay.addEventListener('click', (e) => {
  const x = e.offsetX;
  const paletteMaxCells = palette.width / font.width;
  const pos = Math.floor((x / (paletteScale * palette.width)) * paletteMaxCells);
  const phox = getPhoxFromPaletteIndex(pos);

  if (!phox) {
    console.warn('Null Phox selected. Omitting selection');
    return;
  }
  dp = phox;
  paletteData.selectedPhox = pos;

  colorPicker.color.hexString = dp[selectedColorType];
  selectCharInAlphabet(
    font.charactersList.findIndex((c) => c.codepoint === dp.char.codePointAt(0)),
  );

  const ctx = paletteOverlay.getContext('2d');
  ctx!.reset();
  ctx!.strokeStyle = 'green';
  ctx!.lineWidth = 2;
  ctx!.strokeRect(pos * font.width, 0, font.width, font.height);
});
paletteWrapper.append(palette);
paletteWrapper.append(paletteOverlay);
contentFooter.append(paletteWrapper);

const sidebar = document.createElement('div');
sidebar.style = `display: flex; flex-direction: column;`;

// ─── Left Sidebar (Tool Selector) ────────────────────────────────────────────
const drawModeButtons: HTMLButtonElement[] = [];

type DrawModeDefinition = {
  name: 'draw' | 'char' | 'fg' | 'bg' | 'color' | 'erase';
  icon: string;
  tooltip: string;
};

const drawModeDefs: DrawModeDefinition[] = [
  { name: 'draw', icon: '✏', tooltip: 'Draw (char + fg + bg)' },
  { name: 'char', icon: 'A', tooltip: 'Char only' },
  { name: 'fg', icon: 'F', tooltip: 'Foreground color only' },
  { name: 'bg', icon: 'B', tooltip: 'Background color only' },
  { name: 'color', icon: '◉', tooltip: 'Color (fg + bg) only' },
  { name: 'erase', icon: '✕', tooltip: 'Erase' },
];

function createDrawModeButton(def: DrawModeDefinition): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = def.icon;
  btn.title = def.tooltip;
  btn.style.cssText = `
    background: #444;
    color: #ccc;
    border: 1px solid #555;
    border-radius: 3px;
    width: 36px;
    height: 36px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  `;
  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#555';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = drawMode === def.name ? '#666' : '#444';
  });
  btn.addEventListener('click', () => {
    drawModeButtons.forEach((b) => {
      b.style.background = '#444';
      b.style.borderColor = '#555';
    });
    btn.style.background = '#666';
    btn.style.borderColor = '#888';
    drawMode = def.name;
  });
  return btn;
}

// ─── Left Sidebar (Draw Mode Selector) ───────────────────────────────────────
const drawModeSidebar = document.createElement('div');
drawModeSidebar.style = `
  width: 40px;
  flex-shrink: 0;
  background: #2a2a2a;
  border-right: 1px solid #444;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
`;

for (const def of drawModeDefs) {
  const btn = createDrawModeButton(def);
  drawModeSidebar.appendChild(btn);
  drawModeButtons.push(btn);
}

// Set initial active state for 'draw' mode
if (drawModeButtons.length > 0) {
  drawModeButtons[0].style.background = '#666';
  drawModeButtons[0].style.borderColor = '#888';
}

// ─── Left Sidebar (Tool Selector) ────────────────────────────────────────────
const leftSidebar = document.createElement('div');
leftSidebar.style = `
  width: 48px;
  flex-shrink: 0;
  background: #333;
  border-right: 1px solid #555;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  gap: 4px;
`;

type ToolDefinition = {
  name: string;
  icon: string;
  tooltip: string;
  createTool: () => Tool;
};

const toolDefs: ToolDefinition[] = [
  {
    name: 'draw',
    icon: '✏',
    tooltip: 'Draw (freehand)',
    createTool: () => drawTool,
  },
  {
    name: 'rect',
    icon: '□',
    tooltip: 'Rectangle (outline)',
    createTool: () => rectTool,
  },
  {
    name: 'filledRect',
    icon: '■',
    tooltip: 'Filled Rectangle',
    createTool: () => filledRectTool,
  },
  {
    name: 'line',
    icon: '╱',
    tooltip: 'Line',
    createTool: () => lineTool,
  },
  {
    name: 'ellipse',
    icon: '⬭',
    tooltip: 'Ellipse (outline)',
    createTool: () => ellipseTool,
  },
  {
    name: 'filledEllipse',
    icon: '●',
    tooltip: 'Filled Ellipse',
    createTool: () => filledEllipseTool,
  },
];

function createToolButton(def: ToolDefinition): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = def.icon;
  btn.title = def.tooltip;
  btn.style.cssText = `
    background: #444;
    color: #ccc;
    border: 1px solid #555;
    border-radius: 3px;
    width: 36px;
    height: 36px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  `;
  btn.addEventListener('mouseenter', () => {
    btn.style.background = '#555';
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.background = currTool?.tool.name === def.name ? '#666' : '#444';
  });
  btn.addEventListener('click', () => {
    // Remove active state from all buttons
    leftSidebar.querySelectorAll('button').forEach((b) => {
      b.style.background = '#444';
      b.style.borderColor = '#555';
    });
    // Set active state
    btn.style.background = '#666';
    btn.style.borderColor = '#888';
    setTool(def.createTool());
  });
  return btn;
}

for (const def of toolDefs) {
  leftSidebar.appendChild(createToolButton(def));
}

// Drawboard
const drawboard = document.createElement('div');
drawboard.style =
  'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
canvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;
const draftScreen = Phoxelis(rows, cols, font);
draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;
const refImage = document.createElement('img');
const refImageWrapper = document.createElement('div');
refImageWrapper.append(refImage);
refImageWrapper.style = `position: absolute; top: 0px; right: 0px; z-index: -999; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`;

const layersWrapper = document.createElement('div');
layersWrapper.appendChild(canvas);
layersWrapper.appendChild(refImageWrapper);
layersWrapper.appendChild(draftScreen.canvas);
drawboard.appendChild(layersWrapper);

// Navbar
const saveButton = document.createElement('button');
saveButton.innerHTML = 'Save';
saveButton.onclick = async () => {
  await savePhoxelis(exportPhoxelis(filename), filename);
};
navBar.appendChild(saveButton);

const fullscreenButton = document.createElement('button');
fullscreenButton.innerHTML = 'Fullscreen';
fullscreenButton.onclick = () => toggleFullScreen(document.body);
navBar.appendChild(fullscreenButton);

const exportButton = document.createElement('button');
exportButton.innerHTML = 'Export';
exportButton.onclick = () =>
  downloadArrayBuffer(exportPhoxelis(filename).buffer, `${filename}.phoxelis`);
navBar.appendChild(exportButton);

const referenceImageButton = document.createElement('input');
referenceImageButton.type = 'file';
referenceImageButton.accept = 'image/*';
referenceImageButton.addEventListener('change', async (e) => {
  if (!e?.target) {
    return;
  }

  if (e.target instanceof HTMLInputElement) {
    const file = e.target.files?.[0]; // Get the selected file

    if (file) {
      // Convert to base64 for storage
      try {
        const base64 = await fileToBase64(file);
        const ok = saveRefImageToStorage(base64);
        if (!ok) {
          console.warn('Reference image too large for localStorage');
        }
        refImage.src = base64;
        refImage.style.display = 'block';

        // Reset panzoom config for new image
        refImageScale = refImagePanzoomConfig.startScale;
        refImagePanzoom.reset();
      } catch (err) {
        console.error('Failed to load reference image:', err);
      }
    }
  }
});
navBar.appendChild(referenceImageButton);
const moveRefImageToggle = document.createElement('input');
moveRefImageToggle.type = 'checkbox';
navBar.appendChild(moveRefImageToggle);

const modifyPalettePhoxButton = document.createElement('button');
modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
modifyPalettePhoxButton.onclick = () => {
  if (!paletteData.modifyingPhox) {
    paletteData.modifyingPhox = true;
    modifyPalettePhoxButton.innerHTML = 'UPDATING PALETTE PHOX';
  } else {
    paletteData.modifyingPhox = false;
    modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
  }
};
navBar.appendChild(modifyPalettePhoxButton);

// Sidebar
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
sidebar.append(alphabetContainer);

const alphabetData: {
  selectedChar: number;
} = {
  selectedChar: font.charactersList.findIndex(
    (c) => c.codepoint === dp.char.codePointAt(0),
  ),
};
function selectCharInAlphabet(index: number) {
  const char = font.charactersList[index];

  drawCharShapeInAlphabet(
    alphabetData.selectedChar,
    font.charactersList[alphabetData.selectedChar].shape,
    '#FFFFFF',
    '#000000',
  );
  dp.char = String.fromCodePoint(char.codepoint);
  drawCharShapeInAlphabet(index, font.charactersList[index].shape, '#000000', '#00FFFF');

  alphabetData.selectedChar = index;
}
alphabetCanvas.addEventListener('click', (e) => {
  const r = Math.floor(e.offsetY / alphabetViewScale / font.height);
  const c = Math.floor(e.offsetX / alphabetViewScale / font.width);
  const index = r * alphabetCols + c;
  const char = font.charactersList[index];
  if (!char) throw new Error(`No char found for position y${r},x${c}`);

  selectCharInAlphabet(index);

  if (paletteData.modifyingPhox && paletteData.selectedPhox > 0) {
    const selectedPalettePhox = getPhoxFromPaletteIndex(paletteData.selectedPhox);
    if (selectedPalettePhox) {
      storePhoxInPalette(paletteData.selectedPhox, {
        char: dp.char,
        fg: selectedPalettePhox.fg,
        bg: selectedPalettePhox.bg,
      });
    }
  }
});

const colorPickerContainer = document.createElement('div');
colorPickerContainer.id = 'colorpicker';
sidebar.append(colorPickerContainer);
const fgColorButton = document.createElement('button');
fgColorButton.innerHTML = 'Foreground';
function selectColorType(type: 'fg' | 'bg') {
  selectedColorType = type;

  colorPicker.color.hexString = dp[type];
}

fgColorButton.addEventListener('click', () => selectColorType('fg'));
const bgColorButton = document.createElement('button');
bgColorButton.innerHTML = 'Background';
bgColorButton.addEventListener('click', () => selectColorType('bg'));
colorPickerContainer.append(fgColorButton);
colorPickerContainer.append(bgColorButton);

content.append(drawModeSidebar);
content.append(leftSidebar);
content.append(drawboard);
content.append(sidebar);
appContainer.appendChild(navBar);
appContainer.appendChild(content);
appContainer.append(contentFooter);
document.body.appendChild(appContainer);

let selectedColorType: 'fg' | 'bg' = 'fg';
const colorPicker = iro.ColorPicker('#colorpicker', {
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
  dp[selectedColorType] = color.hexString;

  if (paletteData.modifyingPhox && paletteData.selectedPhox > 0) {
    const selectedPalettePhox = getPhoxFromPaletteIndex(paletteData.selectedPhox);
    if (selectedPalettePhox) {
      storePhoxInPalette(paletteData.selectedPhox, {
        char: selectedPalettePhox.char,
        fg: selectedColorType === 'fg' ? dp[selectedColorType] : selectedPalettePhox.fg,
        bg: selectedColorType === 'bg' ? dp[selectedColorType] : selectedPalettePhox.bg,
      });
    }
  }
});
selectColorType('fg');

const renderLoop = () => {
  renderFrame();
  window.requestAnimationFrame(renderLoop);
};
window.requestAnimationFrame(renderLoop);

// sampleRenderContent(phoxelis, rows, cols);

const panzoom = Panzoom(layersWrapper, panzoomConfiguration);
const refImagePanzoom = Panzoom(refImage, refImagePanzoomConfig);
const hammer = new Hammer(drawboard);
let panzooming = false;

hammer.get('pinch').set({ enable: true });
hammer.on('pinchstart', () => {
  panzooming = true;
  const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;
  abortTool();

  if (moveRefImageToggle.checked) {
    refImageScale = targetZoom.getScale();
  } else {
    scale = targetZoom.getScale();
  }
});
hammer.on('pinchmove', (e) => {
  const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;

  const s = moveRefImageToggle.checked ? refImageScale : scale;
  const newZoomVal = s * e.scale;
  targetZoom.zoom(newZoomVal);
  targetZoom.pan(
    (e.velocityX * 11) / targetZoom.getScale(),
    (e.velocityY * 11) / targetZoom.getScale(),
  );
});
hammer.on('pinchend', () => {
  panzooming = false;
  // Save panzoom state when interaction ends
  saveRefImagePanzoomConfig(
    refImagePanzoom.getScale(),
    refImagePanzoom.getPan().x,
    refImagePanzoom.getPan().y,
  );
});

drawboard.addEventListener('pointermove', (e) => {
  const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;
  if (e.ctrlKey) {
    panzooming = true;
    abortTool();
    targetZoom.pan(
      e.movementX / targetZoom.getScale(),
      e.movementY / targetZoom.getScale(),
    );
  } else if (e.shiftKey) {
    panzooming = true;
    abortTool();
    targetZoom.zoom(targetZoom.getScale() + (e.movementY / 35) * -1);
  }
});
drawboard.addEventListener('pointerup', () => {
  panzooming = false;
  // Save panzoom state when interaction ends
  saveRefImagePanzoomConfig(
    refImagePanzoom.getScale(),
    refImagePanzoom.getPan().x,
    refImagePanzoom.getPan().y,
  );
});

type CellPosition = { x: number; y: number };
const mousePos: CellPosition = { x: -1, y: -1 };

drawboard.addEventListener('pointermove', (event) => {
  const { width, top, left } = canvas.getBoundingClientRect();
  const scale = width / (cols * font.width);
  const mouseScreenPosX = event.clientX - left;
  const mouseScreenPosY = event.clientY - top;
  mousePos.x = Math.min(
    cols - 1,
    Math.max(0, Math.floor(mouseScreenPosX / (font.width * scale))),
  );
  mousePos.y = Math.min(
    rows - 1,
    Math.max(0, Math.floor(mouseScreenPosY / (font.height * scale))),
  );
});

const abortTool = () => {
  currTool?.tool.abort?.();
};
window.addEventListener('mouseout', (e) => {
  if (e.relatedTarget === null) {
    abortTool();
  }
});

interface Tool {
  name: string;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  submit?: () => void;
  abort?: () => void;
  resetTool?: () => void;
  data?: Record<string, any>;
}

type Phoxel = {
  phox: Phox;
  r: number;
  c: number;
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
    renderDpWithMode(draftScreen, p.r, p.c, { draftErasure: true });
  },
  onPointerDown() {
    this.data.drawing = true;
    this.addPhoxelToDraft({ phox: dp, r: mousePos.y, c: mousePos.x });
  },
  onPointerMove() {
    if (this.data.drawing) {
      this.addPhoxelToDraft({ phox: dp, r: mousePos.y, c: mousePos.x });
    }
  },
  onPointerUp() {
    this.data.drawing = false;
    this.submit!();
  },
  submit() {
    this.data.draftPhoxels.forEach((p) => {
      renderDpWithMode(phoxelis, p.r, p.c);
    });
    this.resetTool!();
  },
  resetTool() {
    this.data.draftPhoxels = new Map();
    draftScreen.reset();
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
    draftScreen.reset();
    const { startR, startC } = this.data!;
    const r1 = Math.min(startR, mousePos.y);
    const r2 = Math.max(startR, mousePos.y);
    const c1 = Math.min(startC, mousePos.x);
    const c2 = Math.max(startC, mousePos.x);
    // Top & bottom edges
    for (let c = c1; c <= c2; c++) {
      renderDpWithMode(draftScreen, r1, c, { draftErasure: true });
      renderDpWithMode(draftScreen, r2, c, { draftErasure: true });
    }
    // Left & right edges
    for (let r = r1; r <= r2; r++) {
      renderDpWithMode(draftScreen, r, c1, { draftErasure: true });
      renderDpWithMode(draftScreen, r, c2, { draftErasure: true });
    }
  },
  onPointerUp() {
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
    // Top & bottom edges
    for (let c = c1; c <= c2; c++) {
      renderDpWithMode(phoxelis, r1, c);
      renderDpWithMode(phoxelis, r2, c);
    }
    // Left & right edges
    for (let r = r1; r <= r2; r++) {
      renderDpWithMode(phoxelis, r, c1);
      renderDpWithMode(phoxelis, r, c2);
    }
    this.resetTool!();
  },
  resetTool() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
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
    draftScreen.reset();
    const { startR, startC } = this.data!;
    const r1 = Math.min(startR, mousePos.y);
    const r2 = Math.max(startR, mousePos.y);
    const c1 = Math.min(startC, mousePos.x);
    const c2 = Math.max(startC, mousePos.x);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        renderDpWithMode(draftScreen, r, c, { draftErasure: true });
      }
    }
  },
  onPointerUp() {
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
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        renderDpWithMode(phoxelis, r, c);
      }
    }
    this.resetTool!();
  },
  resetTool() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
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
    draftScreen.reset();
    const { startR, startC } = this.data!;
    const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
    for (const { r, c } of cells) {
      renderDpWithMode(draftScreen, r, c, { draftErasure: true });
    }
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.submit!();
  },
  submit() {
    const { startR, startC } = this.data!;
    if (startR === -1 || startC === -1) return;
    const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
    for (const { r, c } of cells) {
      renderDpWithMode(phoxelis, r, c);
    }
    this.resetTool!();
  },
  resetTool() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
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
    draftScreen.reset();
    const { startR, startC } = this.data!;
    const rx = Math.abs(mousePos.x - startC);
    const ry = Math.abs(mousePos.y - startR);
    drawEllipseOutline(
      (r, c) => renderDpWithMode(draftScreen, r, c, { draftErasure: true }),
      startR,
      startC,
      rx,
      ry,
    );
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.submit!();
  },
  submit() {
    const { startR, startC } = this.data!;
    if (startR === -1 || startC === -1) return;
    const rx = Math.abs(mousePos.x - startC);
    const ry = Math.abs(mousePos.y - startR);
    drawEllipseOutline(
      (r, c) => renderDpWithMode(phoxelis, r, c),
      startR,
      startC,
      rx,
      ry,
    );
    this.resetTool!();
  },
  resetTool() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
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
    draftScreen.reset();
    const { startR, startC } = this.data!;
    const rx = Math.abs(mousePos.x - startC);
    const ry = Math.abs(mousePos.y - startR);
    drawEllipseFill(
      (r, c) => renderDpWithMode(draftScreen, r, c, { draftErasure: true }),
      startR,
      startC,
      rx,
      ry,
    );
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.submit!();
  },
  submit() {
    const { startR, startC } = this.data!;
    if (startR === -1 || startC === -1) return;
    const rx = Math.abs(mousePos.x - startC);
    const ry = Math.abs(mousePos.y - startR);
    drawEllipseFill((r, c) => renderDpWithMode(phoxelis, r, c), startR, startC, rx, ry);
    this.resetTool!();
  },
  resetTool() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
  abort() {
    this.resetTool!();
  },
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
    r <= Math.min(rows - 1, Math.ceil(rMax));
    r++
  ) {
    const dy = r - centerR;
    // ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
    // => |x-cx| <= rx * sqrt(1 - (y-cy)^2/ry^2)
    const ratio = (dy * dy) / (halfRy * halfRy);
    if (ratio > 1) continue;
    const dx = Math.sqrt(Math.max(0, 1 - ratio)) * halfRx;
    const left = Math.max(0, Math.ceil(centerC - dx));
    const right = Math.min(cols - 1, Math.floor(centerC + dx));
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
  };
} | null = null;

function setTool(tool: Tool) {
  if (currTool) {
    currTool.tool.abort?.();
    drawboard.removeEventListener('pointerdown', currTool.handlers.onPointerDown);
    drawboard.removeEventListener('pointermove', currTool.handlers.onPointerMove);
    window.removeEventListener('pointerup', currTool.handlers.onPointerUp);
  }

  currTool = {
    tool,
    handlers: {
      onPointerDown: (e) => !panzooming && tool.onPointerDown!(e),
      onPointerMove: (e) => !panzooming && tool.onPointerMove!(e),
      onPointerUp: (e) => !panzooming && tool.onPointerUp!(e),
    },
  };
  drawboard.addEventListener('pointerdown', currTool.handlers.onPointerDown);
  drawboard.addEventListener('pointermove', currTool.handlers.onPointerMove);
  window.addEventListener('pointerup', currTool.handlers.onPointerUp);
}

setTool(drawTool);

function renderDraftScreen() {
  draftScreen.renderFrame();
  window.requestAnimationFrame(renderDraftScreen);
}
window.requestAnimationFrame(renderDraftScreen);

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

async function savePhoxelis(data: Uint32Array<ArrayBuffer>, name = 'data') {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(`${name}.bin`, { create: true });
  const accessHandle = await fileHandle.createWritable();

  accessHandle.write(data.buffer);
  accessHandle.close();
}

async function loadPhoxelis(name = 'data') {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle(`${name}.bin`);
  if (!fileHandle) throw new Error(`No file "${name}" found in OPFS`);
  const file = await fileHandle.getFile();
  const fileBuffer = await file.arrayBuffer();
  importPhoxelis(new Uint32Array(fileBuffer));
}

// ─── Restore reference image & panzoom config on load ────────────────────────
const savedRefImagePanzoom = loadRefImagePanzoomConfig();
const savedRefImageBase64 = loadRefImageFromStorage();

if (savedRefImageBase64) {
  // Restore the reference image
  refImage.src = savedRefImageBase64;
  refImage.style.display = 'block';

  // Restore panzoom config if available
  if (savedRefImagePanzoom) {
    refImageScale = savedRefImagePanzoom.scale;
    refImagePanzoom.pan(savedRefImagePanzoom.x, savedRefImagePanzoom.y);
    refImagePanzoom.zoom(savedRefImagePanzoom.scale);
  }
} else if (savedRefImagePanzoom) {
  // Panzoom config exists but no image — clear stale config
  clearRefImageStorage();
}

window.addEventListener('pagehide', () => {
  // Final save on page unload
  saveRefImagePanzoomConfig(
    refImagePanzoom.getScale(),
    refImagePanzoom.getPan().x,
    refImagePanzoom.getPan().y,
  );
});

loadPhoxelis(filename);
