import type { Workspace } from '../Workspace';

const indicatorHeight = 10;

export function createPaletteSelector(ws: Workspace) {
  const paletteScale = 2;
  const paletteOverlay = document.createElement('canvas');
  paletteOverlay.width = ws.phoxelis.palette.width;
  paletteOverlay.height = ws.phoxelis.palette.height;
  const paletteScaledHeight = ws.font.height * paletteScale;

  ws.phoxelis.palette.style = `position: absolute; top: ${indicatorHeight / 3}px; left: 0; height: ${paletteScaledHeight}px; image-rendering: pixelated; display: block;`;
  
  paletteOverlay.style = `height: ${paletteScaledHeight + indicatorHeight}px; width: ${ws.phoxelis.palette.width * paletteScale}px; border-top: 1px solid black; image-rendering: pixelated; display: block;`;

  const paletteSelector = document.createElement('div');
  paletteSelector.style = `position: relative; overflow: overlay; scrollbar-width: none;`;

  paletteSelector.append(paletteOverlay);
  paletteSelector.append(ws.phoxelis.palette);

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

    if (pos <= 0) {
      console.warn('Null Phox selected. Omitting selection');
      return;
    }

    const phox = ws.phoxelis.getPhoxFromPaletteIndex(pos);
    if (!phox) {
      console.warn('Null Phox selected. Omitting selection');
      return;
    }

    ws.state$.paletteData.selectedPhox.set(pos);
  };

  function renderIndicator(index: number, color = 'green') {
    const ctx = paletteOverlay.getContext('2d');
    ctx!.reset();
    ctx!.fillStyle = color;
    ctx!.fillRect(index * ws.font.width, 0, ws.font.width, ws.font.height);
  }

  ws.state$.paletteData.selectedPhox.onChange(({ value: selectedPhox }) => {
    if (selectedPhox > 0) {
      const phox = ws.phoxelis.getPhoxFromPaletteIndex(selectedPhox);
      if (!phox) return;
      ws.state$.dp.set(phox);

      const color = ws.state$.paletteData.modifyingPhox.get() ? 'red' : 'green';
      renderIndicator(selectedPhox, color);
    }
  });

  ws.state$.paletteData.modifyingPhox.onChange(({ value: modifyinPhox }) => {
    renderIndicator(
      ws.state$.paletteData.selectedPhox.get(),
      modifyinPhox ? 'red' : 'green',
    );
  });

  // TODO Maybe this should be somewhere else
  ws.state$.dp.onChange(({ value: dp }) => {
    const modifyingPhox = ws.state$.paletteData.modifyingPhox.get();
    const selectedPhox = ws.state$.paletteData.selectedPhox.get();
    if (modifyingPhox && selectedPhox > 0) {
      const phox = ws.phoxelis.getPhoxFromPaletteIndex(selectedPhox);
      if (!phox) return;
      ws.phoxelis.storePhoxInPalette(selectedPhox, {
        ...dp,
      });
    }
  });

  paletteOverlay.addEventListener('click', onPaletteOverlayClick);
  ws.phoxelis.palette.addEventListener('click', onPaletteOverlayClick);

  return paletteSelector;
}
