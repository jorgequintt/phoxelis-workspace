import type { Workspace } from '../Workspace';

export function createPaletteSelector(ws: Workspace) {
  const paletteScale = 2;
  const paletteSelector = document.createElement('div');
  paletteSelector.style = 'position: relative;';
  const paletteOverlay = document.createElement('canvas');
  paletteOverlay.width = ws.phoxelis.palette.width;
  paletteOverlay.height = ws.phoxelis.palette.height;
  const paletteScaledHeight = ws.font.height * paletteScale;
  ws.phoxelis.palette.style = `height: ${paletteScaledHeight}px; image-rendering: pixelated; border: 1px solid black;`;
  paletteOverlay.style = `height: ${paletteScaledHeight}px; border: 1px solid black; position: absolute; top: 0; left: 0; image-rendering: pixelated;`;
  const onPaletteOverlayClick = (e: MouseEvent) => {
    if (!paletteOverlay) {
      console.error(
        'onPaletteOverlayClick error: null "paletteOverlay" was passed as param.',
      );
      return;
    }
    const x = e.offsetX;
    const paletteMaxCells = ws.phoxelis.palette.width / ws.font.width;
    const pos = Math.floor(
      (x / (paletteScale * ws.phoxelis.palette.width)) * paletteMaxCells,
    );
    const phox = ws.phoxelis.getPhoxFromPaletteIndex(pos);
    if (!phox) {
      console.warn('Null Phox selected. Omitting selection');
      return;
    }
    ws.state.dp = phox;
    ws.state.paletteData.selectedPhox = pos;
    ws.colorPicker.picker.color.hexString = ws.state.dp[ws.state.selectedColorType];
    ws.alphabet.selectCharInAlphabet(
      ws.font.charactersList.findIndex(
        (c) => c.codepoint === ws.state.dp.char.codePointAt(0),
      ),
    );
    const ctx = paletteOverlay.getContext('2d');
    ctx!.reset();
    ctx!.strokeStyle = 'green';
    ctx!.lineWidth = 2;
    ctx!.strokeRect(pos * ws.font.width, 0, ws.font.width, ws.font.height);
  };
  paletteOverlay.addEventListener('click', onPaletteOverlayClick);
  paletteSelector.append(ws.phoxelis.palette);
  paletteSelector.append(paletteOverlay);

  return paletteSelector;
}
