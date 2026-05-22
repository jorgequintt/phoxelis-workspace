import { getFont, Phoxelis } from 'phoxelis';
import './style.css'
import Panzoom from '@panzoom/panzoom';
import Hammer from 'hammerjs';

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
  excludeClass: 'panzoom-exclude'
};

let scale = panzoomConfiguration.startScale;

const font = await getFont('1_Trithemius8x16');
const {canvas, renderFrame, renderPhoxel} = Phoxelis(rows, cols, font);
const canvasContainer = document.createElement('div');
canvasContainer.style = 'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
canvasContainer.append(canvas);
document.body.append(canvasContainer);

const renderLoop = () => {
  renderFrame();
  window.requestAnimationFrame(renderLoop);
}
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
function renderPhoxelBack(char: string, fg: string, bg: string, r: number, c: number) {
  if(!takenCells.has(`${r};${c}`)) {
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

const panzoom = Panzoom(canvas, panzoomConfiguration);
const hammer = new Hammer(canvasContainer);
hammer.get('pinch').set({ enable: true });
hammer.on('pinchstart', () => {
  scale = panzoom.getScale();
});
hammer.on('pinchmove', (e) => {
      const newZoomVal = scale * e.scale;
      panzoom.zoom(newZoomVal);
      panzoom.pan(
        (e.velocityX * 11) / panzoom.getScale(),
        (e.velocityY * 11) / panzoom.getScale()
      );
});

canvasContainer.addEventListener('pointermove', (e) => {
  if (e.ctrlKey) {
      panzoom.pan(
        e.movementX / panzoom.getScale(),
        e.movementY / panzoom.getScale()
      );
    } else if (e.shiftKey) {
      panzoom.zoom(panzoom.getScale() + (e.movementY / 35) * -1);
    }
});