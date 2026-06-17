import { getFont, Phoxelis, type Phox, type CharShape } from 'phoxelis';
import '../style.css';
import Panzoom from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import _ from 'lodash';
import iro from '@jaames/iro';
import { downloadArrayBuffer as downloadAsFile, toggleFullScreen } from '../utils';
import {
  saveRefImageToStorage,
  loadRefImageFromStorage,
  saveRefImagePanzoomConfig,
  loadRefImagePanzoomConfig,
  clearRefImageStorage,
  fileToBase64,
} from '../refImageStorage';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// TODO doc.layers as proxy. Decouple react from what exists rn
import { proxy } from 'valtio';

ReactDOM.createRoot(document.querySelector('#app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

type Phoxel = {
  phox: Phox;
  r: number;
  c: number;
};
type PhoxelPosition = [r: number, c: number];

const size = {
  rows: 37,
  cols: 152,
};
const font = await getFont('1_Trithemius8x16');
const phoxelis = Phoxelis(size.rows, size.cols, font, true);

interface WorkspaceDocument {
  phoxelis: ReturnType<typeof Phoxelis>;
  font: Awaited<ReturnType<typeof getFont>>;
  layers: Record<string, DocumentLayer>;
  size: { rows: number; cols: number };
}

let doc: WorkspaceDocument = {
  phoxelis,
  font,
  size,
  layers: {},
};

interface Session {
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

const startDp = { char: 'D', fg: '#00FF00', bg: '#FF00FF' };
let session: Session = {
  dp: { char: 'D', fg: '#00FF00', bg: '#FF00FF' },
  drawMode: 'draw',
  activeLayer: doc.phoxelis.layers[0].id,
  paletteData: {
    selectedPhox: -1,
    modifyingPhox: false,
  },
  alphabetData: {
    selectedChar: doc.font.charactersList.findIndex(
      (c) => c.codepoint === startDp.char.codePointAt(0),
    ),
  },
  selectedColorType: 'fg',
};

const layerPreviewStyle = `height: 100%; width: 100%; object-fit: contain;`;
const layerList = document.createElement('div');
layerList.style.cssText = `
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 300px;
  overflow-y: auto;
`;

function renderLayerList() {
  doc.phoxelis.layers.toReversed().forEach((l) => {
    let layerEl = layerList.querySelector(`#layer-${l.id}`);
    if (!layerEl) {
      layerEl = createLayerElement(doc.layers[l.id]);
    }
    layerList.appendChild(layerEl);
  });
}

createDocumentLayer(doc.phoxelis.layers[0].id);
selectLayer(doc.phoxelis.layers[0].id);

type DocumentLayer = {
  layerId: string;
  name: string;
  target: HTMLCanvasElement;
  opacity: number;
  visible: boolean;
};

function createDocumentLayer(layerId?: string) {
  const target = document.createElement('canvas');
  target.width = doc.font.width * doc.size.cols;
  target.height = doc.font.height * doc.size.rows;
  target.style = layerPreviewStyle;

  const lid = layerId ?? doc.phoxelis.addLayer();

  doc.layers[lid] = {
    layerId: lid,
    name: `Layer #${doc.phoxelis.layers.length}`,
    target,
    opacity: 100,
    visible: true,
  };

  createLayerElement(doc.layers[lid]);
  renderLayerList();
  selectLayer(lid);
}

function removeDocumentLayer(layerId: string) {
  if (doc.phoxelis.layers.length === 1) {
    console.warn("removeDocumentLayer error: You can't remove the base layer.");
    return;
  }

  const layerPosition = doc.phoxelis.layerPositions[layerId];
  doc.phoxelis.removeLayer(layerId);
  layerList.removeChild(layerList.querySelector(`#layer-${layerId}`)!);
  delete doc.layers[layerId];
  renderLayerList();

  const newSelectPos = Math.max(
    0,
    Math.min(doc.phoxelis.layers.length - 1, layerPosition),
  );
  const layerBeforeId = doc.phoxelis.layers[newSelectPos].id;
  selectLayer(layerBeforeId);
}

function selectLayer(layerId: string) {
  const layerRow = layerList.querySelector(`#layer-${layerId}`);
  if (!layerRow) {
    console.error(`selectLayer error: Could not find layer by id ${layerId}`);
    return;
  }
  layerList
    .querySelectorAll('.layer-row')
    .forEach((el) => ((el as HTMLDivElement).style.background = '#2a2a2a'));
  session.activeLayer = layerId;
  (layerRow as HTMLDivElement).style.background = '#7a7a7a';
}

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
const filename = 'test_file';

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
    const underlyingPhoxel = doc.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
    const underlyingPhoxel = doc.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
    const underlyingPhoxel = doc.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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
    const underlyingPhoxel = doc.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
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

type ChangesStack = Array<() => void>;
let changesHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
let redoHistory: Array<{ changes: ChangesStack; undoChanges: ChangesStack }> = [];
const maxChangesHistory = 50;
function commitPhoxels(phoxelPositions: Array<PhoxelPosition>) {
  const undoChanges: ChangesStack = [];
  const changes: ChangesStack = [];

  phoxelPositions.forEach(([r, c]) => {
    const origPhox = doc.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
    if (!origPhox) {
      undoChanges.push(() => doc.phoxelis.removePhoxel(r, c, session.activeLayer));
    } else {
      undoChanges.push(() =>
        doc.phoxelis.renderPhoxel(
          origPhox.char,
          origPhox.fg,
          origPhox.bg,
          r,
          c,
          session.activeLayer,
        ),
      );
    }

    renderDpWithMode(doc.phoxelis, r, c, session.activeLayer);

    const newPhox = doc.phoxelis.getPhoxFromPosition(r, c, session.activeLayer);
    if (!newPhox) {
      changes.push(() => doc.phoxelis.removePhoxel(r, c, session.activeLayer));
    } else {
      changes.push(() =>
        doc.phoxelis.renderPhoxel(
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

const appContainer = document.createElement('div');
appContainer.style = 'width: 100%; height: 100%; display: flex; flex-direction: column;';

const navBar = document.createElement('div');
navBar.style = `width: 100%; background: #888888;`;

const content = document.createElement('div');
content.style =
  'width: 100%; display: flex; flex: 1; flex-direction: row; min-height: 0;';

const contentFooter = document.createElement('div');
contentFooter.style = 'overflow-x: scroll;';

const paletteWrapper = document.createElement('div');
paletteWrapper.style = 'position: relative;';
const paletteOverlay = document.createElement('canvas');
paletteOverlay.width = doc.phoxelis.palette.width;
paletteOverlay.height = doc.phoxelis.palette.height;
const paletteScale = 2;
const paletteScaledHeight = doc.font.height * paletteScale;
doc.phoxelis.palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
paletteOverlay.addEventListener('click', (e) => {
  const x = e.offsetX;
  const paletteMaxCells = doc.phoxelis.palette.width / doc.font.width;
  const pos = Math.floor(
    (x / (paletteScale * doc.phoxelis.palette.width)) * paletteMaxCells,
  );
  const phox = doc.phoxelis.getPhoxFromPaletteIndex(pos);

  if (!phox) {
    console.warn('Null Phox selected. Omitting selection');
    return;
  }
  session.dp = phox;
  session.paletteData.selectedPhox = pos;

  colorPicker.color.hexString = session.dp[session.selectedColorType];
  selectCharInAlphabet(
    doc.font.charactersList.findIndex((c) => c.codepoint === session.dp.char.codePointAt(0)),
  );

  const ctx = paletteOverlay.getContext('2d');
  ctx!.reset();
  ctx!.strokeStyle = 'green';
  ctx!.lineWidth = 2;
  ctx!.strokeRect(pos * doc.font.width, 0, doc.font.width, doc.font.height);
});
paletteWrapper.append(doc.phoxelis.palette);
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
    btn.style.background = session.drawMode === def.name ? '#666' : '#444';
  });
  btn.addEventListener('click', () => {
    drawModeButtons.forEach((b) => {
      b.style.background = '#444';
      b.style.borderColor = '#555';
    });
    btn.style.background = '#666';
    btn.style.borderColor = '#888';
    session.drawMode = def.name;
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
doc.phoxelis.canvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;
const draftScreen = Phoxelis(doc.size.rows, doc.size.cols, doc.font);
const getDraftBaseLayer = () => {
  return draftScreen.layers[0].id
};
draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;
const refImage = document.createElement('img');
const refImageWrapper = document.createElement('div');
refImageWrapper.append(refImage);
refImageWrapper.style = `position: absolute; top: 0px; right: 0px; z-index: -999; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`;

const layersWrapper = document.createElement('div');
layersWrapper.appendChild(doc.phoxelis.canvas);
layersWrapper.appendChild(refImageWrapper);
layersWrapper.appendChild(draftScreen.canvas);
drawboard.appendChild(layersWrapper);

// Navbar
const saveButton = document.createElement('button');
saveButton.innerHTML = 'Save';
saveButton.onclick = async () => {
  await saveDocument(filename);
};
navBar.appendChild(saveButton);

const fullscreenButton = document.createElement('button');
fullscreenButton.innerHTML = 'Fullscreen';
fullscreenButton.onclick = () => toggleFullScreen(document.body);
navBar.appendChild(fullscreenButton);

const exportButton = document.createElement('button');
exportButton.innerHTML = 'Export';
exportButton.onclick = () =>
  downloadAsFile(
    JSON.stringify(doc.phoxelis.exportPhoxelis(filename)),
    `${filename}.phoxelis`,
  );
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
  if (!session.paletteData.modifyingPhox) {
    session.paletteData.modifyingPhox = true;
    modifyPalettePhoxButton.innerHTML = 'UPDATING PALETTE PHOX';
  } else {
    session.paletteData.modifyingPhox = false;
    modifyPalettePhoxButton.innerHTML = 'Modify Palette Phox';
  }
};
navBar.appendChild(modifyPalettePhoxButton);

const undoButton = document.createElement('button');
undoButton.innerHTML = 'Undo';
undoButton.onclick = () => undoLastChange();
navBar.appendChild(undoButton);

const redoButton = document.createElement('button');
redoButton.innerHTML = 'Redo';
redoButton.onclick = () => redoLastChange();
navBar.appendChild(redoButton);

// Sidebar
const alphabetCanvas = document.createElement('canvas');
const alphabetWidth = 100;
const alphabetCols = Math.ceil(alphabetWidth / doc.font.width);
const alphabetRows = Math.ceil(doc.font.length / alphabetCols);
alphabetCanvas.width = alphabetCols * doc.font.width;
alphabetCanvas.height = alphabetRows * doc.font.height;
const alphabetViewScale = 2;
alphabetCanvas.style = `width: ${alphabetCanvas.width * alphabetViewScale}px; image-rendering: pixelated;`;
const alphabetCtx = alphabetCanvas.getContext('2d')!;

const alphabetContainer = document.createElement('div');
alphabetContainer.style = 'height: 250px; overflow-y: scroll;';
alphabetContainer.append(alphabetCanvas);
sidebar.append(alphabetContainer);

function selectCharInAlphabet(index: number) {
  const char = doc.font.charactersList[index];

  drawCharShapeInAlphabet(
    session.alphabetData.selectedChar,
    doc.font.charactersList[session.alphabetData.selectedChar].shape,
    '#FFFFFF',
    '#000000',
  );
  session.dp.char = String.fromCodePoint(char.codepoint);
  drawCharShapeInAlphabet(
    index,
    doc.font.charactersList[index].shape,
    '#000000',
    '#00FFFF',
  );

  session.alphabetData.selectedChar = index;
}
alphabetCanvas.addEventListener('click', (e) => {
  const r = Math.floor(e.offsetY / alphabetViewScale / doc.font.height);
  const c = Math.floor(e.offsetX / alphabetViewScale / doc.font.width);
  const index = r * alphabetCols + c;
  const char = doc.font.charactersList[index];
  if (!char) throw new Error(`No char found for position y${r},x${c}`);

  selectCharInAlphabet(index);

  if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
    const selectedPalettePhox = doc.phoxelis.getPhoxFromPaletteIndex(
      session.paletteData.selectedPhox,
    );
    if (selectedPalettePhox) {
      doc.phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
        char: session.dp.char,
        fg: selectedPalettePhox.fg,
        bg: selectedPalettePhox.bg,
      });
    }
  }
});

// ─── Layer Management Panel ──────────────────────────────────────────────────
const layerPanel = document.createElement('div');
layerPanel.style.cssText = `
  padding: 8px;
  border-top: 1px solid #444;
  background: #1e1e1e;
`;

const layerPanelTitle = document.createElement('div');
layerPanelTitle.textContent = 'Layers';
layerPanelTitle.style.cssText = `
  font-size: 12px;
  font-weight: bold;
  color: #aaa;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
layerPanel.appendChild(layerPanelTitle);

const layerActions = document.createElement('div');
layerActions.style.cssText = `
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
`;

const addLayerBtn = document.createElement('button');
addLayerBtn.textContent = '+ Add';
addLayerBtn.style.cssText = `
  flex: 1;
  padding: 4px 8px;
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
`;
addLayerBtn.addEventListener('click', () => createDocumentLayer());
layerActions.appendChild(addLayerBtn);

const removeLayerBtn = document.createElement('button');
removeLayerBtn.textContent = '− Remove';
removeLayerBtn.style.cssText = `
  flex: 1;
  padding: 4px 8px;
  background: #444;
  color: #ccc;
  border: 1px solid #555;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
`;
removeLayerBtn.addEventListener('click', () => removeDocumentLayer(session.activeLayer));
layerActions.appendChild(removeLayerBtn);

layerPanel.appendChild(layerActions);

function createLayerElement(layer: DocumentLayer) {
  const layerRow = document.createElement('div');
  layerRow.id = `layer-${layer.layerId}`;
  layerRow.classList.add('layer-row');
  layerRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px;
    background: #2a2a2a;
    border: 1px solid #3a3a3a;
    border-radius: 3px;
    cursor: grab;
    user-select: none;
    transition: background 0.1s;
  `;
  layerRow.addEventListener('click', () => {
    selectLayer(layer.layerId);
  });

  // Drag handle (grip icon)
  const dragHandle = document.createElement('div');
  dragHandle.style.cssText = `
    width: 16px;
    height: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    flex-shrink: 0;
    cursor: grab;
    touch-action: none;
    user-select: none;
  `;
  dragHandle.innerHTML = `
    <span style="font-size: 8px; line-height: 1; color: #666;">⠿</span>
    <span style="font-size: 8px; line-height: 1; color: #666;">⠿</span>
  `;
  layerRow.appendChild(dragHandle);

  // Preview container
  const previewContainer = document.createElement('div');
  previewContainer.style.cssText = `
    width: 28px;
    height: 28px;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 2px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  previewContainer.appendChild(layer.target);
  layerRow.appendChild(previewContainer);

  // Name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = layer.name;
  nameInput.style.cssText = `
    flex: 1;
    min-width: 0;
    padding: 2px 4px;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 2px;
    color: #ccc;
    font-size: 11px;
    outline: none;
  `;
  nameInput.addEventListener('change', (e) => {
    if (e.target instanceof HTMLInputElement) {
      layer.name = e.target.value;
    }
  });
  layerRow.appendChild(nameInput);

  // Opacity slider
  const opacitySlider = document.createElement('input');
  opacitySlider.type = 'range';
  opacitySlider.min = '0';
  opacitySlider.max = '100';
  opacitySlider.value = String(layer.opacity);
  opacitySlider.style.cssText = `
    width: 50px;
    height: 4px;
    accent-color: #666;
    flex-shrink: 0;
  `;
  opacitySlider.addEventListener('change', (e) => {
    if (e.target instanceof HTMLInputElement) {
      layer.opacity = parseInt(e.target.value);
    }
  });
  layerRow.appendChild(opacitySlider);

  // Eye button
  const eyeBtn = document.createElement('button');
  eyeBtn.textContent = layer.visible ? '👁‍🗨' : '👁';
  eyeBtn.style.cssText = `
    width: 24px;
    height: 24px;
    background: transparent;
    border: 1px solid #444;
    border-radius: 2px;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    opacity: layer.visible ? 1 : 0.4;
  `;
  eyeBtn.addEventListener('click', (e) => {
    layer.visible = !layer.visible;
    eyeBtn.textContent = layer.visible ? '👁‍🗨' : '👁';
    e.stopImmediatePropagation();
  });
  layerRow.appendChild(eyeBtn);

  // ── Unified pointer-event drag-and-drop ──
  const dropIndicator = document.createElement('div');
  dropIndicator.setAttribute('data-drop-indicator', 'line');
  dropIndicator.style.cssText = `
    position: absolute;
    left: -4px;
    right: -4px;
    height: 3px;
    background: #4a9eff;
    border-radius: 2px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s;
  `;
  layerRow.style.position = 'relative';
  layerRow.appendChild(dropIndicator);

  let ghost: HTMLElement | null = null;
  let pointerDownRow: HTMLElement | null = null;
  let pointerTargetRow: HTMLElement | null = null;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let isDragging = false;

  // Shared reorder logic
  function reorderRows(source: HTMLElement, target: HTMLElement, insertAbove: boolean) {
    const rows = (Array.from(layerList.children) as HTMLElement[]).toReversed();
    const dragIdx = rows.indexOf(source);
    const targetIdx = rows.indexOf(target);
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;

    const adjustedTarget = dragIdx < targetIdx ? targetIdx - 1 : targetIdx;
    const insertIdx = insertAbove ? adjustedTarget : adjustedTarget + 1;

    doc.phoxelis.moveLayer(doc.phoxelis.layers[dragIdx].id, insertIdx);

    renderLayerList();
  }

  // Show drop indicator on a target row
  function showIndicator(row: HTMLElement, clientY: number) {
    // Hide any existing indicator
    if (pointerTargetRow && pointerTargetRow !== row) {
      const prev = pointerTargetRow.querySelector('[data-drop-indicator]') as HTMLElement;
      if (prev) prev.style.opacity = '0';
    }

    const indicator = row.querySelector('[data-drop-indicator]') as HTMLElement;
    if (!indicator) return;

    const rect = row.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const above = clientY < midY;
    indicator.style.top = above ? '0' : 'auto';
    indicator.style.bottom = above ? 'auto' : '0';
    indicator.style.opacity = '1';
    pointerTargetRow = row;
  }

  // Update ghost position
  function updateGhost(clientX: number, clientY: number) {
    if (!ghost) return;
    const rowRect = pointerDownRow!.getBoundingClientRect();
    ghost.style.transform = `translate(${clientX - rowRect.left - 8}px, ${clientY - rowRect.top - 14}px)`;
  }

  // Find target row under pointer
  function findTarget(clientX: number, clientY: number): HTMLElement | null {
    if (!ghost) return null;
    ghost.style.display = 'none';
    const el = document.elementFromPoint(clientX, clientY);
    ghost.style.display = '';
    return el?.closest('.layer-row') ?? null;
  }

  // Cleanup all drag state
  function cleanupDrag() {
    if (ghost) {
      ghost.remove();
      ghost = null;
    }
    if (pointerDownRow) {
      pointerDownRow.style.opacity = '1';
      pointerDownRow.style.zIndex = '';
    }
    if (pointerTargetRow) {
      const indicator = pointerTargetRow.querySelector(
        '[data-drop-indicator]',
      ) as HTMLElement;
      if (indicator) indicator.style.opacity = '0';
    }
    pointerDownRow = null;
    pointerTargetRow = null;
    isDragging = false;
  }

  // Pointer down — start tracking
  dragHandle.addEventListener('pointerdown', (e: PointerEvent) => {
    // Only respond to left-click (mouse) or any touch/pen
    if (e.button !== 0 && e.pointerType !== 'touch') return;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    pointerDownRow = layerRow;

    // Set pointer capture so we keep receiving events even if pointer leaves the element
    dragHandle.setPointerCapture(e.pointerId);
  });

  // Pointer move — handle both the "threshold check" and active dragging
  dragHandle.addEventListener('pointermove', (e: PointerEvent) => {
    if (!pointerDownRow) return;

    // If we haven't started dragging yet, check the threshold
    if (!isDragging) {
      const dx = Math.abs(e.clientX - pointerStartX);
      const dy = Math.abs(e.clientY - pointerStartY);
      // Start dragging only after moving past the threshold
      if (dx < 5 && dy < 5) return; // Still within threshold, do nothing

      isDragging = true;

      // Create ghost clone
      ghost = pointerDownRow.cloneNode(true) as HTMLElement;
      ghost.style.position = 'fixed';
      ghost.style.width = `${pointerDownRow.offsetWidth}px`;
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.85';
      ghost.style.pointerEvents = 'none';
      ghost.style.transition = 'none';
      ghost.style.transform = `translate(${e.clientX - pointerDownRow.getBoundingClientRect().left - 8}px, ${e.clientY - pointerDownRow.getBoundingClientRect().top - 14}px)`;
      document.body.appendChild(ghost);

      // Hide original row
      pointerDownRow.style.opacity = '0.3';
      pointerDownRow.style.zIndex = '100';
    }

    // Active dragging — update ghost and find target
    if (isDragging) {
      e.preventDefault();
      updateGhost(e.clientX, e.clientY);

      const target = findTarget(e.clientX, e.clientY);
      if (target && target !== pointerDownRow && target !== pointerTargetRow) {
        showIndicator(target, e.clientY);
      } else if (target === pointerDownRow && pointerTargetRow) {
        // Pointer is back on the source row, clear indicator
        const indicator = pointerTargetRow.querySelector(
          '[data-drop-indicator]',
        ) as HTMLElement;
        if (indicator) indicator.style.opacity = '0';
        pointerTargetRow = null;
      }
    }
  });

  // Pointer up — finalize the drag
  dragHandle.addEventListener('pointerup', (e: PointerEvent) => {
    if (!pointerDownRow) return;

    if (isDragging) {
      // Perform reorder
      if (pointerTargetRow) {
        reorderRows(
          pointerDownRow,
          pointerTargetRow,
          e.clientY >
            pointerTargetRow.getBoundingClientRect().top +
              pointerTargetRow.getBoundingClientRect().height / 2,
        );
      }
      cleanupDrag();
    }

    // Release pointer capture
    try {
      dragHandle.releasePointerCapture(e.pointerId);
    } catch {}
    pointerDownRow = null;
  });

  // Pointer cancel (e.g. system interrupt) — cleanup
  dragHandle.addEventListener('pointercancel', () => {
    cleanupDrag();
    try {
      dragHandle.releasePointerCapture(0);
    } catch {}
  });

  layerList.appendChild(layerRow);
  return layerRow;
}

layerPanel.appendChild(layerList);

// ─── Color Picker ────────────────────────────────────────────────────────────
const colorPickerContainer = document.createElement('div');
colorPickerContainer.id = 'colorpicker';
sidebar.append(colorPickerContainer);
const fgColorButton = document.createElement('button');
fgColorButton.innerHTML = 'Foreground';
function selectColorType(type: 'fg' | 'bg') {
  session.selectedColorType = type;

  colorPicker.color.hexString = session.dp[type];
}

fgColorButton.addEventListener('click', () => selectColorType('fg'));
const bgColorButton = document.createElement('button');
bgColorButton.innerHTML = 'Background';
bgColorButton.addEventListener('click', () => selectColorType('bg'));
colorPickerContainer.append(fgColorButton);
colorPickerContainer.append(bgColorButton);

sidebar.append(layerPanel);

content.append(drawModeSidebar);
content.append(leftSidebar);
content.append(drawboard);
content.append(sidebar);
appContainer.appendChild(navBar);
appContainer.appendChild(content);
appContainer.append(contentFooter);
document.body.appendChild(appContainer);

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
  session.dp[session.selectedColorType] = color.hexString;

  if (session.paletteData.modifyingPhox && session.paletteData.selectedPhox > 0) {
    const selectedPalettePhox = doc.phoxelis.getPhoxFromPaletteIndex(
      session.paletteData.selectedPhox,
    );
    if (selectedPalettePhox) {
      doc.phoxelis.storePhoxInPalette(session.paletteData.selectedPhox, {
        char: selectedPalettePhox.char,
        fg: session.selectedColorType === 'fg' ? session.dp[session.selectedColorType] : selectedPalettePhox.fg,
        bg: session.selectedColorType === 'bg' ? session.dp[session.selectedColorType] : selectedPalettePhox.bg,
      });
    }
  }
});
selectColorType('fg');

const renderLoop = () => {
  doc.phoxelis.renderFrame(
    doc.phoxelis.layers.map((l) => ({
      additionalTarget: doc.layers[l.id].target,
      opacity: doc.layers[l.id].visible ? doc.layers[l.id].opacity / 100 : 0,
    })),
  );
  window.requestAnimationFrame(renderLoop);
};
window.requestAnimationFrame(renderLoop);

// sampleRenderContent(phoxelis, rows, cols);

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
      setTool(panzoomTool);
      currTool?.handlers.onPointerDown(e as PointerEvent);
    },
  },
  {
    shift: true,
    mouse: 1,
    onHotkeyStart(e) {
      setTool(panzoomTool);
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
  const matchinDownHotkey = downHotkeys.find((h) => e.key.toLocaleLowerCase() === h.key);
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

const panzoom = Panzoom(layersWrapper, panzoomConfiguration);
const refImagePanzoom = Panzoom(refImage, refImagePanzoomConfig);
const hammer = new Hammer(drawboard);

hammer.get('pinch').set({ enable: true });
hammer.on('pinchstart', (e) => {
  setTool(panzoomTool);
  currTool?.handlers.onPinchStart(e);
});

type CellPosition = { x: number; y: number };
const mousePos: CellPosition = { x: -1, y: -1 };

function setMousePos(event: PointerEvent) {
  const { width, top, left } = doc.phoxelis.canvas.getBoundingClientRect();
  const scale = width / (doc.size.cols * doc.font.width);
  const mouseScreenPosX = event.clientX - left;
  const mouseScreenPosY = event.clientY - top;
  mousePos.x = Math.min(
    doc.size.cols - 1,
    Math.max(0, Math.floor(mouseScreenPosX / (doc.font.width * scale))),
  );
  mousePos.y = Math.min(
    doc.size.rows - 1,
    Math.max(0, Math.floor(mouseScreenPosY / (doc.font.height * scale))),
  );
}
drawboard.addEventListener('pointerdown', setMousePos);
drawboard.addEventListener('pointermove', setMousePos);
drawboard.addEventListener('pointerup', setMousePos);

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
    const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;
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
    const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;

    if (moveRefImageToggle.checked) {
      refImageScale = targetZoom.getScale();
    } else {
      scale = targetZoom.getScale();
    }
  },
  onPinchMove(e) {
    if (this.data.panzooming) {
      const targetZoom = moveRefImageToggle.checked ? refImagePanzoom : panzoom;

      const s = moveRefImageToggle.checked ? refImageScale : scale;
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
    saveRefImagePanzoomConfig(
      refImagePanzoom.getScale(),
      refImagePanzoom.getPan().x,
      refImagePanzoom.getPan().y,
    );
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    draftScreen.reset();
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
    r <= Math.min(doc.size.rows - 1, Math.ceil(rMax));
    r++
  ) {
    const dy = r - centerR;
    // ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
    // => |x-cx| <= rx * sqrt(1 - (y-cy)^2/ry^2)
    const ratio = (dy * dy) / (halfRy * halfRy);
    if (ratio > 1) continue;
    const dx = Math.sqrt(Math.max(0, 1 - ratio)) * halfRx;
    const left = Math.max(0, Math.ceil(centerC - dx));
    const right = Math.min(doc.size.cols - 1, Math.floor(centerC + dx));
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
function setTool(tool: Tool) {
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
  if (previousTool) setTool(previousTool);
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
  const yOffset = Math.floor(index / alphabetCols) * doc.font.height;
  const xOffset = (index % alphabetCols) * doc.font.width;
  for (let y = 0; y < charShape.length; y++) {
    for (let x = 0; x < charShape[0].length; x++) {
      const pixelVal = charShape[y][x];
      alphabetCtx.fillStyle = pixelVal ? fg : bg;
      alphabetCtx.fillRect(xOffset + x, yOffset + y, 1, 1);
    }
  }
}

doc.font.charactersList.forEach((char, i) => {
  drawCharShapeInAlphabet(i, char.shape, '#FFFFFF', '#000000');
});

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

function resetWorkspace() {
  layerList.replaceChildren(); // removes all nodes
}

async function saveDocument(filename: string) {
  const phoxelisData = doc.phoxelis.exportPhoxelis(filename);
  const documentData = {
    phoxelis: phoxelisData,
    layers: _.mapValues(doc.layers, (e) => ({
      ...e,
      target: undefined,
    })),
  };

  const dataStr = JSON.stringify(documentData);
  saveFile(dataStr, filename);
  return documentData;
}

async function loadDocument(filename: string) {
  const fileDataString = await loadFile(filename);
  if (!fileDataString) {
    console.error(`loadPhoxelis error: Could not load file "${filename}"`);
    return;
  }

  resetWorkspace();

  const fileData = JSON.parse(fileDataString) as Awaited<ReturnType<typeof saveDocument>>;
  doc.phoxelis.importPhoxelis(fileData.phoxelis);

  doc.layers = _.mapValues(fileData.layers, (l) => {
    const target = document.createElement('canvas');
    target.width = doc.font.width * doc.size.cols;
    target.height = doc.font.height * doc.size.rows;
    target.style = layerPreviewStyle;

    return {
      ...l,
      target,
    };
  });

  session.activeLayer = doc.phoxelis.layers[0].id;
  renderLayerList();

  console.log(`${filename} imported.`);
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

// TODO bugged document. How to handle these?
// loadDocument(filename);
