import { getFont, Phoxelis } from 'phoxelis';
import './style.css';
import Panzoom from '@panzoom/panzoom';
import Hammer from 'hammerjs';
import iro from '@jaames/iro';

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

let scale = panzoomConfiguration.startScale;

const font = await getFont('1_Trithemius8x16');

const dp = { char: 'D', fg: '#00FF00', bg: '#FF00FF' };

const { canvas, renderFrame, renderPhoxel } = Phoxelis(rows, cols, font);
canvas.style = `position: relative;`;
const draftScreen = Phoxelis(rows, cols, font);
draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px;`;

const drawboard = document.createElement('div');
drawboard.style =
  'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; flex: 1;';

const layersWrapper = document.createElement('div');
layersWrapper.appendChild(canvas);
layersWrapper.appendChild(draftScreen.canvas);
drawboard.appendChild(layersWrapper);

const appContainer = document.createElement('div');
appContainer.style = 'width: 100%; height: 100%; display: flex;';
appContainer.appendChild(drawboard);

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
  ]
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

// RENDERING CONTENT
const colors = {
  white: '#FFFFFF',
  bluedark: '#8c8cfb',
  bluemid: '#5353fa',
  bluelow: '#2a2afa',
  blue: '#0000FF',
};
const takenCells = new Set();
function renderPhoxelBack(
  char: string,
  fg: string,
  bg: string,
  r: number,
  c: number,
) {
  if (!takenCells.has(`${r};${c}`)) {
    renderPhoxel(char, fg, bg, r, c);
  }
}
function fill(color: string) {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      renderPhoxel(' ', color, color, r, c);
    }
  }
}
function write(x: number, y: number, text: string, maxWidth: number = 70) {
  let charCount = 0;
  let currentRow = y;
  text.split('').forEach((char) => {
    charCount++;
    if (char === '\n' || charCount === maxWidth - 1) {
      currentRow++;
      charCount = 0;
      return;
    }
    renderPhoxel(char, colors.white, colors.blue, currentRow, x + charCount);
    takenCells.add(`${currentRow};${x + charCount}`);
  });
}
function drop(char: string, x: number, y: number, speedMs = 40) {
  let currentY = y;
  const dropFall = () => {
    renderPhoxelBack(' ', colors.blue, colors.blue, currentY, x);
    renderPhoxelBack(char, colors.bluelow, colors.blue, currentY + 1, x);
    renderPhoxelBack(char, colors.bluelow, colors.blue, currentY + 2, x);
    renderPhoxelBack(char, colors.bluemid, colors.blue, currentY + 3, x);
    renderPhoxelBack(char, colors.bluemid, colors.blue, currentY + 4, x);
    renderPhoxelBack(char, colors.bluedark, colors.blue, currentY + 5, x);
    currentY++;

    if (currentY > rows) {
      currentY = -6;
    }
  };

  setInterval(dropFall, speedMs);
}
fill(colors.blue);
write(
  16,
  7,
  `
Who am I?

I don't know that. But call me Jorelus.
I'm fascinated by the liminal area between the digital and the heart.
So I'm drawn to art and programming, constantly in pursue of channeling my soul through both.

I enjoy...
* Exercising (weights)
* Riding my bike around the city
* Cooking new recipes
* Feeling music deeply
* Videogames

Here I will share my ASCII art, my esoteric software and my soul.
The website is barebones right now, so excuse the simplicity.
In any case, welcome, and follow me, as I'm looking to connect with other souls here.

Take care.
`,
  100,
);
for (let i = 0; i < cols; i++) {
  drop(
    'i',
    i,
    (Math.floor(Math.random() * 80) + 6) * -1,
    Math.floor(Math.random() * 40) + 170,
  );
}
// RENDERING CONTENT END

const panzoom = Panzoom(layersWrapper, panzoomConfiguration);
const hammer = new Hammer(drawboard);
hammer.get('pinch').set({ enable: true });
hammer.on('pinchstart', () => {
  abortMotion();
  scale = panzoom.getScale();
});
hammer.on('pinchmove', (e) => {
  const newZoomVal = scale * e.scale;
  panzoom.zoom(newZoomVal);
  panzoom.pan(
    (e.velocityX * 11) / panzoom.getScale(),
    (e.velocityY * 11) / panzoom.getScale(),
  );
});

drawboard.addEventListener('pointermove', (e) => {
  if (e.ctrlKey) {
    abortMotion();
    panzoom.pan(
      e.movementX / panzoom.getScale(),
      e.movementY / panzoom.getScale(),
    );
  } else if (e.shiftKey) {
    abortMotion();
    panzoom.zoom(panzoom.getScale() + (e.movementY / 35) * -1);
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
  if(!char) throw new Error(`No char found for position y${r},x${c}`);
  dp.char = String.fromCodePoint(char.codepoint);
});
