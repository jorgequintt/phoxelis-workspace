import type { CharShape } from 'phoxelis';
import type { Workspace } from '../Workspace';

export function createAlphabetSelector(ws: Workspace) {
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

  const drawCharShapeInAlphabet = (
    index: number,
    charShape: CharShape,
    fg: string,
    bg: string,
  ) => {
    const yOffset = Math.floor(index / alphabetCols) * ws.font.height;
    const xOffset = (index % alphabetCols) * ws.font.width;
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
    const r = Math.floor(e.offsetY / alphabetViewScale / ws.font.height);
    const c = Math.floor(e.offsetX / alphabetViewScale / ws.font.width);
    const index = r * alphabetCols + c;
    const char = ws.font.charactersList[index];
    if (!char) throw new Error(`No char found for position y${r},x${c}`);

    selectCharInAlphabet(index);

    if (
      ws.session.paletteData.modifyingPhox &&
      ws.session.paletteData.selectedPhox > 0
    ) {
      const selectedPalettePhox = ws.phoxelis.getPhoxFromPaletteIndex(
        ws.session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        ws.phoxelis.storePhoxInPalette(ws.session.paletteData.selectedPhox, {
          char: ws.session.dp.char,
          fg: selectedPalettePhox.fg,
          bg: selectedPalettePhox.bg,
        });
      }
    }
  });

  const selectCharInAlphabet = (index: number) => {
    const char = ws.font.charactersList[index];

    drawCharShapeInAlphabet(
      ws.session.alphabetData.selectedChar,
      ws.font.charactersList[ws.session.alphabetData.selectedChar].shape,
      '#FFFFFF',
      '#000000',
    );
    ws.session.dp.char = String.fromCodePoint(char.codepoint);
    drawCharShapeInAlphabet(
      index,
      ws.font.charactersList[index].shape,
      '#000000',
      '#00FFFF',
    );

    ws.session.alphabetData.selectedChar = index;
  };

  return { alphabet: alphabetContainer, selectCharInAlphabet };
}
