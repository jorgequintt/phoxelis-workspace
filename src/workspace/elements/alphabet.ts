import type { CharShape } from 'phoxelis';
import type { Workspace } from '../Workspace';

const alphabetWidth = 150;
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

    selectCharInAlphabet(index);

    if (
      ws.state$.paletteData.modifyingPhox.get() &&
      ws.state$.paletteData.selectedPhox.get() > 0
    ) {
      const selectedPalettePhox = ws.phoxelis.getPhoxFromPaletteIndex(
        ws.state$.paletteData.selectedPhox.get(),
      );
      if (selectedPalettePhox) {
        ws.phoxelis.storePhoxInPalette(ws.state$.paletteData.selectedPhox.get(), {
          char: ws.state$.dp.char.get(),
          fg: selectedPalettePhox.fg,
          bg: selectedPalettePhox.bg,
        });
      }
    }
  });

  const selectCharInAlphabet = (index: number) => {
    const char = ws.font.charactersList[index];

    drawCharShapeInAlphabet(
      ws.state$.alphabetData.selectedChar.get(),
      ws.font.charactersList[ws.state$.alphabetData.selectedChar.get()].shape,
      '#FFFFFF',
      '#000000',
    );
    ws.state$.dp.char.set(String.fromCodePoint(char.codepoint));
    drawCharShapeInAlphabet(
      index,
      ws.font.charactersList[index].shape,
      '#000000',
      '#00FFFF',
    );

    ws.state$.alphabetData.selectedChar.set(index);
  };

  selectCharInAlphabet(1);

  return { element: alphabetContainer, selectCharInAlphabet };
}
