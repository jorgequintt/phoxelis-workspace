import type { CharShape } from 'phoxelis';
import type { Workspace } from '../Workspace';
import { sidebarWidth } from '../../editor/react/layout/Sidebar';

const alphabetWidth = sidebarWidth;
const containerHeight = 200;
const margin = 1;

export function createAlphabetSelector(ws: Workspace) {
  const alphabetCanvas = document.createElement('canvas');
  const cellWidth = ws.font.width + margin;
  const cellHeight = ws.font.height + margin;
  const alphabetCols = Math.ceil(alphabetWidth / cellWidth);
  const alphabetRows = Math.ceil(ws.font.length / alphabetCols);
  alphabetCanvas.width = alphabetCols * cellWidth;
  alphabetCanvas.height = alphabetRows * cellHeight;
  const alphabetViewScale = 2;
  alphabetCanvas.style = `width: ${alphabetCanvas.width * alphabetViewScale}px; image-rendering: pixelated;`;
  const alphabetCtx = alphabetCanvas.getContext('2d')!;
  const alphabetContainer = document.createElement('div');
  alphabetContainer.style = `height: ${containerHeight}px; overflow-y: scroll;`;
  alphabetContainer.append(alphabetCanvas);

  const drawCharShapeInAlphabet = (
    index: number,
    charShape: CharShape,
    fg: string,
    bg: string,
  ) => {
    const yOffset = Math.floor(index / alphabetCols) * cellHeight;
    const xOffset = (index % alphabetCols) * cellWidth;
    for (let y = 0; y < charShape.length; y++) {
      for (let x = 0; x < charShape[0].length; x++) {
        const pixelVal = charShape[y][x];
        alphabetCtx.fillStyle = pixelVal ? fg : bg;
        alphabetCtx.fillRect(xOffset + x, yOffset + y, 1, 1);
      }
    }
  };

  ws.font.charactersList.forEach((char, i) => {
    drawCharShapeInAlphabet(i, char.shape, '#FFFFFF', '#000000');
  });

  alphabetCanvas.addEventListener('click', (e) => {
    const r = Math.floor(e.offsetY / alphabetViewScale / cellHeight);
    const c = Math.floor(e.offsetX / alphabetViewScale / cellWidth);
    const index = r * alphabetCols + c;
    const char = ws.font.charactersList[index];
    if (!char) throw new Error(`No char found for position y${r},x${c}`);

    ws.state$.dp.char.set(String.fromCodePoint(char.codepoint));
  });

  ws.state$.dp.char.onChange(({ value, getPrevious }) => {
    const charIndex = ws.font.charactersList.findIndex(
      (c) => c.codepoint === value.codePointAt(0),
    );
    const prevCharIndex = ws.font.charactersList.findIndex(
      (c) => c.codepoint === getPrevious().codePointAt(0),
    );

    drawCharShapeInAlphabet(
      prevCharIndex,
      ws.font.charactersList[prevCharIndex].shape,
      '#FFFFFF',
      '#000000',
    );
    drawCharShapeInAlphabet(
      charIndex,
      ws.font.charactersList[charIndex].shape,
      '#000000',
      '#00FFFF',
    );
  });

  return { element: alphabetContainer };
}
