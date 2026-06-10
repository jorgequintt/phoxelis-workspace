import { getFont, Phoxelis } from 'phoxelis';
import './style.css';
import Panzoom from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import iro from '@jaames/iro';
import { downloadArrayBuffer, toggleFullScreen } from './utils';
import { sampleRenderContent } from './sampleRenderContent';

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

let dp = { char: 'D', fg: '#00FF00', bg: '#FF00FF' };

const phoxelis = Phoxelis(rows, cols, font, true);
const {
  canvas,
  renderFrame,
  renderPhoxel,
  importPhoxelis,
  exportPhoxelis,
  palette,
  getPhoxFromPaletteIndex,
} = phoxelis;

const appContainer = document.createElement('div');
appContainer.style =
  'width: 100%; height: 100%; display: flex; flex-direction: column;';

const navBar = document.createElement('div');
navBar.style = `width: 100%; background: #888888;`;

const content = document.createElement('div');
content.style = 'width: 100%; display: flex; flex: 1; flex-direction: row; min-height: 0;';

const contentFooter = document.createElement('div');
contentFooter.style = 'overflow-x: scroll;';
const paletteScale = 2;
const paletteHeight = font.height * paletteScale;
palette.style = `height: ${paletteHeight}px; image-rendering: pixelated; border: 1px solid black;`;
palette.addEventListener('click', (e) => {
  const x = e.offsetX;
  const paletteMaxCells = palette.width / font.width;
  const pos = Math.floor(
    (x / (paletteScale * palette.width)) * paletteMaxCells,
  );
  const phox = getPhoxFromPaletteIndex(pos);
  dp = phox;
});
contentFooter.append(palette);

const sidebar = document.createElement('div');
sidebar.style = `display: flex; flex-direction: column;`;

// ─── Tool Selector ───────────────────────────────────────────────────────────
const toolBar = document.createElement('div');
toolBar.style = `
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 4px;
  background: #333;
  border-right: 1px solid #555;
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
    name: 'circle',
    icon: '○',
    tooltip: 'Circle',
    createTool: () => circleTool,
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
    toolBar.querySelectorAll('button').forEach((b) => {
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
  toolBar.appendChild(createToolButton(def));
}

sidebar.prepend(toolBar);

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
referenceImageButton.addEventListener('change', (e) => {
  if (!e?.target) {
    console.log('no event');
    return;
  }

  if (e.target instanceof HTMLInputElement) {
    const file = e.target.files?.[0]; // Get the selected file
    console.log('file', e.target.files);

    if (file) {
      // Generate a temporary URL representing the local file
      const objectURL = URL.createObjectURL(file);

      refImage.src = objectURL;
      refImage.style.display = 'block';

      // Free memory when the image finishes loading
      refImage.onload = () => {
        URL.revokeObjectURL(objectURL);
      };
    }
  }
});
navBar.appendChild(referenceImageButton);
const moveRefImageToggle = document.createElement('input');
moveRefImageToggle.type = 'checkbox';
navBar.appendChild(moveRefImageToggle);

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

alphabetCanvas.addEventListener('click', (e) => {
  const r = Math.floor(e.offsetY / alphabetViewScale / font.height);
  const c = Math.floor(e.offsetX / alphabetViewScale / font.width);
  const index = r * alphabetCols + c;
  const char = font.charactersList[index];
  if (!char) throw new Error(`No char found for position y${r},x${c}`);
  dp.char = String.fromCodePoint(char.codepoint);
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
hammer.get('pinch').set({ enable: true });
hammer.on('pinchstart', () => {
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

drawboard.addEventListener('pointermove', (e) => {
  const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;
  if (e.ctrlKey) {
    abortTool();
    targetZoom.pan(
      e.movementX / targetZoom.getScale(),
      e.movementY / targetZoom.getScale(),
    );
  } else if (e.shiftKey) {
    abortTool();
    targetZoom.zoom(targetZoom.getScale() + (e.movementY / 35) * -1);
  }
});

type CellPosition = { x: number; y: number };
const mousePos: CellPosition = { x: -1, y: -1 };

drawboard.addEventListener('pointermove', (event) => {
  const { width, top, left } = canvas.getBoundingClientRect();
  const scale = width / (cols * font.width);
  const mouseScreenPosX = event.clientX - left;
  const mouseScreenPosY = event.clientY - top;
  mousePos.x = Math.floor(mouseScreenPosX / (font.width * scale));
  mousePos.y = Math.floor(mouseScreenPosY / (font.height * scale));
});

const mouseButtons = {
  leftClick: false,
  rightClick: false,
  middleClick: false,
};

drawboard.addEventListener('pointerdown', (e) => {
  switch (e.button) {
    case 0:
      mouseButtons.leftClick = true;
      break;
    case 1:
      mouseButtons.middleClick = true;
      break;
    case 0:
      mouseButtons.rightClick = true;
      break;
    default:
      break;
  }
});

drawboard.addEventListener('pointerup', (e: PointerEvent) => {
  switch (e.button) {
    case 0:
      mouseButtons.leftClick = false;
      break;
    case 1:
      mouseButtons.middleClick = false;
      break;
    case 0:
      mouseButtons.rightClick = false;
      break;
    default:
      break;
  }
});

const abortTool = () => {
  mouseButtons.leftClick = false;
  mouseButtons.middleClick = false;
  mouseButtons.rightClick = false;
  currTool?.tool.onAbort?.();
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
  onSubmit?: () => void;
  onAbort?: () => void;
  resetTool?: () => void;
  data?: Record<string, any>;
}

type Phoxel = {
  char: string;
  fg: string;
  bg: string;
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
    draftScreen.renderPhoxel(p.char, p.fg, p.bg, p.r, p.c);
  },
  onPointerDown() {
    this.data.drawing = true;
    this.addPhoxelToDraft({ ...dp, r: mousePos.y, c: mousePos.x });
  },
  onPointerMove() {
    if (this.data.drawing) {
      this.addPhoxelToDraft({ ...dp, r: mousePos.y, c: mousePos.x });
    }
  },
  onPointerUp() {
    this.data.drawing = false;
    this.onSubmit!();
  },
  onSubmit() {
    this.data.draftPhoxels.forEach((p) => {
      renderPhoxel(p.char, p.fg, p.bg, p.r, p.c);
    });
    this.resetTool!();
  },
  resetTool() {
    this.data.draftPhoxels = new Map();
    draftScreen.reset();
    this.data.drawing = false;
  },
  onAbort() {
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
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r1, c);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r2, c);
    }
    // Left & right edges
    for (let r = r1; r <= r2; r++) {
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r, c1);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r, c2);
    }
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.onSubmit!();
  },
  onSubmit() {
    const { startR, startC } = this.data!;
    const r1 = Math.min(startR, mousePos.y);
    const r2 = Math.max(startR, mousePos.y);
    const c1 = Math.min(startC, mousePos.x);
    const c2 = Math.max(startC, mousePos.x);
    for (let c = c1; c <= c2; c++) {
      renderPhoxel(dp.char, dp.fg, dp.bg, r1, c);
      renderPhoxel(dp.char, dp.fg, dp.bg, r2, c);
    }
    for (let r = r1; r <= r2; r++) {
      renderPhoxel(dp.char, dp.fg, dp.bg, r, c1);
      renderPhoxel(dp.char, dp.fg, dp.bg, r, c2);
    }
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
  onAbort() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
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
        draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r, c);
      }
    }
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.onSubmit!();
  },
  onSubmit() {
    const { startR, startC } = this.data!;
    const r1 = Math.min(startR, mousePos.y);
    const r2 = Math.max(startR, mousePos.y);
    const c1 = Math.min(startC, mousePos.x);
    const c2 = Math.max(startC, mousePos.x);
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        renderPhoxel(dp.char, dp.fg, dp.bg, r, c);
      }
    }
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
  onAbort() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
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
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, r, c);
    }
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.onSubmit!();
  },
  onSubmit() {
    const { startR, startC } = this.data!;
    const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
    for (const { r, c } of cells) {
      renderPhoxel(dp.char, dp.fg, dp.bg, r, c);
    }
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
  onAbort() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
};

// ─── Circle Tool ─────────────────────────────────────────────────────────────
const circleTool: Tool = {
  name: 'circle',
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
    const radius = Math.sqrt(
      (mousePos.y - startR) ** 2 + (mousePos.x - startC) ** 2,
    );
    // Midpoint circle algorithm for outline
    const r = Math.round(radius);
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;
    const plotCircle8 = (cr: number, cc: number, dx: number, dy: number) => {
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr + dy, cc + dx);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr - dy, cc + dx);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr + dy, cc - dx);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr - dy, cc - dx);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr + dx, cc + dy);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr - dx, cc + dy);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr + dx, cc - dy);
      draftScreen.renderPhoxel(dp.char, dp.fg, dp.bg, cr - dx, cc - dy);
    };
    plotCircle8(startR, startC, x, y);
    while (x <= y) {
      if (d < 0) {
        d += 4 * x + 6;
      } else {
        d += 4 * (x - y) + 10;
        y--;
      }
      x++;
      plotCircle8(startR, startC, x, y);
    }
  },
  onPointerUp() {
    this.data!.drawing = false;
    this.onSubmit!();
  },
  onSubmit() {
    const { startR, startC } = this.data!;
    const radius = Math.sqrt(
      (mousePos.y - startR) ** 2 + (mousePos.x - startC) ** 2,
    );
    const r = Math.round(radius);
    let x = 0;
    let y = r;
    let d = 3 - 2 * r;
    const plotCircle8 = (cr: number, cc: number, dx: number, dy: number) => {
      renderPhoxel(dp.char, dp.fg, dp.bg, cr + dy, cc + dx);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr - dy, cc + dx);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr + dy, cc - dx);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr - dy, cc - dx);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr + dx, cc + dy);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr - dx, cc + dy);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr + dx, cc - dy);
      renderPhoxel(dp.char, dp.fg, dp.bg, cr - dx, cc - dy);
    };
    plotCircle8(startR, startC, x, y);
    while (x <= y) {
      if (d < 0) {
        d += 4 * x + 6;
      } else {
        d += 4 * (x - y) + 10;
        y--;
      }
      x++;
      plotCircle8(startR, startC, x, y);
    }
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
  onAbort() {
    draftScreen.reset();
    this.data!.startR = -1;
    this.data!.startC = -1;
  },
};

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
    currTool.tool.onAbort?.();
    drawboard.removeEventListener('pointerdown', currTool.handlers.onPointerDown);
    drawboard.removeEventListener('pointermove', currTool.handlers.onPointerMove);
    drawboard.removeEventListener('pointerup', currTool.handlers.onPointerUp);
  }

  currTool = {
    tool,
    handlers: {
      onPointerDown: (e) => tool.onPointerDown!(e),
      onPointerMove: (e) => tool.onPointerMove!(e),
      onPointerUp: (e) => tool.onPointerUp!(e),
    },
  };
  drawboard.addEventListener('pointerdown', currTool.handlers.onPointerDown);
  drawboard.addEventListener('pointermove', currTool.handlers.onPointerMove);
  drawboard.addEventListener('pointerup', currTool.handlers.onPointerUp);
}

setTool(drawTool);

function renderDraftScreen() {
  draftScreen.renderFrame();
  window.requestAnimationFrame(renderDraftScreen);
}
window.requestAnimationFrame(renderDraftScreen);

font.charactersList.forEach((char, i) => {
  const yOffset = Math.floor(i / alphabetCols) * font.height;
  const xOffset = (i % alphabetCols) * font.width;
  for (let y = 0; y < char.shape.length; y++) {
    for (let x = 0; x < char.shape.length; x++) {
      const pixelVal = char.shape[y][x];
      alphabetCtx.fillStyle = pixelVal ? 'white' : 'black';
      alphabetCtx.fillRect(xOffset + x, yOffset + y, 1, 1);
    }
  }
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

loadPhoxelis(filename);
