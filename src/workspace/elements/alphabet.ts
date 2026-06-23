import type { CharShape } from 'phoxelis';
import type { Workspace } from '../Workspace';

export function createAlphabetSelector(this: Workspace) {
  const alphabetCanvas = document.createElement('canvas');
  const alphabetWidth = 100;
  const alphabetCols = Math.ceil(alphabetWidth / this.font.width);
  const alphabetRows = Math.ceil(this.font.length / alphabetCols);
  alphabetCanvas.width = alphabetCols * this.font.width;
  alphabetCanvas.height = alphabetRows * this.font.height;
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
    const yOffset = Math.floor(index / alphabetCols) * this.font.height;
    const xOffset = (index % alphabetCols) * this.font.width;
    for (let y = 0; y < charShape.length; y++) {
      for (let x = 0; x < charShape[0].length; x++) {
        const pixelVal = charShape[y][x];
        alphabetCtx.fillStyle = pixelVal ? fg : bg;
        alphabetCtx.fillRect(xOffset + x, yOffset + y, 1, 1);
      }
    }
  };

  this.font.charactersList.forEach((char, i) => {
    drawCharShapeInAlphabet(i, char.shape, '#FFFFFF', '#000000');
  });

  alphabetCanvas.addEventListener('click', (e) => {
    const r = Math.floor(e.offsetY / alphabetViewScale / this.font.height);
    const c = Math.floor(e.offsetX / alphabetViewScale / this.font.width);
    const index = r * alphabetCols + c;
    const char = this.font.charactersList[index];
    if (!char) throw new Error(`No char found for position y${r},x${c}`);

    selectCharInAlphabet(index);

    if (
      this.session.paletteData.modifyingPhox &&
      this.session.paletteData.selectedPhox > 0
    ) {
      const selectedPalettePhox = this.phoxelis.getPhoxFromPaletteIndex(
        this.session.paletteData.selectedPhox,
      );
      if (selectedPalettePhox) {
        this.phoxelis.storePhoxInPalette(this.session.paletteData.selectedPhox, {
          char: this.session.dp.char,
          fg: selectedPalettePhox.fg,
          bg: selectedPalettePhox.bg,
        });
      }
    }
  });

  const selectCharInAlphabet = (index: number) => {
    const char = this.font.charactersList[index];

    drawCharShapeInAlphabet(
      this.session.alphabetData.selectedChar,
      this.font.charactersList[this.session.alphabetData.selectedChar].shape,
      '#FFFFFF',
      '#000000',
    );
    this.session.dp.char = String.fromCodePoint(char.codepoint);
    drawCharShapeInAlphabet(
      index,
      this.font.charactersList[index].shape,
      '#000000',
      '#00FFFF',
    );

    this.session.alphabetData.selectedChar = index;
  };

  return { alphabet: alphabetContainer, selectCharInAlphabet };
}
