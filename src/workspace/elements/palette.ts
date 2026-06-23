import type { Workspace } from '../Workspace';

export function createPaletteSelector(this: Workspace) {
  const paletteScale = 2;
  const paletteSelector = document.createElement('div');
  paletteSelector.style = 'position: relative;';
  const paletteOverlay = document.createElement('canvas');
  paletteOverlay.width = this.phoxelis.palette.width;
  paletteOverlay.height = this.phoxelis.palette.height;
  const paletteScaledHeight = this.font.height * paletteScale;
  this.phoxelis.palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
  paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
  const onPaletteOverlayClick = (e: MouseEvent) => {
    if (!paletteOverlay) {
      console.error(
        'onPaletteOverlayClick error: null "paletteOverlay" was passed as param.',
      );
      return;
    }
    const x = e.offsetX;
    const paletteMaxCells = this.phoxelis.palette.width / this.font.width;
    const pos = Math.floor(
      (x / (paletteScale * this.phoxelis.palette.width)) * paletteMaxCells,
    );
    const phox = this.phoxelis.getPhoxFromPaletteIndex(pos);
    if (!phox) {
      console.warn('Null Phox selected. Omitting selection');
      return;
    }
    this.session.dp = phox;
    this.session.paletteData.selectedPhox = pos;
    this.colorPicker.picker.color.hexString = this.session.dp[this.session.selectedColorType];
    this.alphabet.selectCharInAlphabet(
      this.font.charactersList.findIndex(
        (c) => c.codepoint === this.session.dp.char.codePointAt(0),
      ),
    );
    const ctx = paletteOverlay.getContext('2d');
    ctx!.reset();
    ctx!.strokeStyle = 'green';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(pos * this.font.width, 0, this.font.width, this.font.height);
  };
  paletteOverlay.addEventListener('click', onPaletteOverlayClick);
  paletteSelector.append(this.phoxelis.palette);
  paletteSelector.append(paletteOverlay);

  return paletteSelector;
}
