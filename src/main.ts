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
const refImagePanzoomConfig = {...panzoomConfiguration};
let refImageScale = refImagePanzoomConfig.startScale;

let scale = panzoomConfiguration.startScale;
const filename = 'current_work';
const font = await getFont('1_Trithemius8x16');

const dp = { char: 'D', fg: '#00FF00', bg: '#FF00FF' };

const phoxelis = Phoxelis(rows, cols, font);
const {
  canvas,
  renderFrame,
  renderPhoxel,
  importPhoxelis,
  exportPhoxelis,
} = phoxelis;
canvas.style = `position: relative; border: 1px solid black`;
const draftScreen = Phoxelis(rows, cols, font);
draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black`;

const content = document.createElement('div');
content.style = 'width: 100%; display: flex; flex: 1; flex-direction: column;';
const drawboard = document.createElement('div');
drawboard.style =
'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex: 1;';
const refImage = document.createElement('img');
const refImageWrapper = document.createElement('div');
refImageWrapper.append(refImage);
refImageWrapper.style = `position: absolute; top: 0px; right: 0px; z-index: -999; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;`;

const layersWrapper = document.createElement('div');
layersWrapper.appendChild(canvas);
layersWrapper.appendChild(refImageWrapper);
layersWrapper.appendChild(draftScreen.canvas);
drawboard.appendChild(layersWrapper);
content.append(drawboard);

const contentFooter = document.createElement('div');
contentFooter.innerHTML = "Works";
content.append(contentFooter);

const appContainer = document.createElement('div');
appContainer.style = 'width: 100%; height: 100%; display: flex; flex-direction: row;';

const navBar = document.createElement('div');
navBar.style = `width: 100%; background: #888888`;
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
    console.log('file', e.target.files)

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
moveRefImageToggle.type = "checkbox";
navBar.appendChild(moveRefImageToggle);


appContainer.appendChild(navBar);
appContainer.appendChild(content);

const sidebar = document.createElement('div');
sidebar.style = `display: flex; flex-direction: column;`;
const alphabetCanvas = document.createElement('canvas');
const alphabetCols = 32;
const alphabetRows = Math.ceil(font.length / alphabetCols);
alphabetCanvas.width = alphabetCols * font.width;
alphabetCanvas.height = alphabetRows * font.height;
alphabetCanvas.style.width = `${alphabetCanvas.width}px`;
alphabetCanvas.style.height = `${alphabetCanvas.height}px`;
const alphabetCtx = alphabetCanvas.getContext('2d')!;
alphabetCtx.fillStyle = 'red';
alphabetCtx.fillRect(0, 0, alphabetCanvas.width, alphabetCanvas.height);
sidebar.append(alphabetCanvas);
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
appContainer.append(sidebar);
document.body.appendChild(appContainer);

let selectedColorType: 'fg' | 'bg' = 'fg';
const colorPicker = iro.ColorPicker('#colorpicker', {
  width: 200,
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
  abortMotion();

  if(moveRefImageToggle.checked) {
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
    abortMotion();
    targetZoom.pan(
      e.movementX / targetZoom.getScale(),
      e.movementY / targetZoom.getScale(),
    );
  } else if (e.shiftKey) {
    abortMotion();
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

const abortMotion = () => {
  mouseButtons.leftClick = false;
  mouseButtons.middleClick = false;
  mouseButtons.rightClick = false;
  mot?.motion.onAbort?.();
};
window.addEventListener('mouseout', (e) => {
  if (e.relatedTarget === null) {
    abortMotion();
  }
});

interface Motion {
  name: string;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onSubmit?: () => void;
  onAbort?: () => void;
  resetMotion?: () => void;
  data?: Record<string, any>;
}

type Phoxel = {
  char: string;
  fg: string;
  bg: string;
  r: number;
  c: number;
};

interface DrawMotion extends Motion {
  data: {
    draftPhoxels: Map<string, Phoxel>;
    drawing: boolean;
  };
  addPhoxelToDraft: (p: Phoxel) => void;
}
const drawMotion: DrawMotion = {
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
    this.resetMotion!();
  },
  resetMotion() {
    this.data.draftPhoxels = new Map();
    draftScreen.reset();
    this.data.drawing = false;
  },
  onAbort() {
    this.resetMotion!();
  },
};

let mot: {
  motion: Motion;
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
  };
} | null = null;

function setMotion(motion: Motion) {
  if (mot) {
    mot.motion.onAbort?.();
    drawboard.removeEventListener('pointerdown', mot.handlers.onPointerDown);
    drawboard.removeEventListener('pointermove', mot.handlers.onPointerMove);
    drawboard.removeEventListener('pointerup', mot.handlers.onPointerUp);
  }

  mot = {
    motion,
    handlers: {
      onPointerDown: (e) => motion.onPointerDown!(e),
      onPointerMove: (e) => motion.onPointerMove!(e),
      onPointerUp: (e) => motion.onPointerUp!(e),
    },
  };
  drawboard.addEventListener('pointerdown', mot.handlers.onPointerDown);
  drawboard.addEventListener('pointermove', mot.handlers.onPointerMove);
  drawboard.addEventListener('pointerup', mot.handlers.onPointerUp);
}

setMotion(drawMotion);

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

alphabetCanvas.addEventListener('click', (e) => {
  const r = Math.floor(e.offsetY / font.height);
  const c = Math.floor(e.offsetX / font.width);
  const index = r * alphabetCols + c;
  const char = font.charactersList[index];
  if (!char) throw new Error(`No char found for position y${r},x${c}`);
  dp.char = String.fromCodePoint(char.codepoint);
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
