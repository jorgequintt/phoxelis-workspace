export function createDrawboard(phoxelisCanvas: HTMLCanvasElement, draftScreenCanvas: HTMLCanvasElement, refImageWrapper: HTMLDivElement) {
  const drawboard = document.createElement('div');
    drawboard.style =
      'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
    phoxelisCanvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;
    draftScreenCanvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;

    const layersWrapper = document.createElement('div');
    layersWrapper.style = 'position: relative';
    layersWrapper.appendChild(phoxelisCanvas);
    layersWrapper.appendChild(refImageWrapper);
    layersWrapper.appendChild(draftScreenCanvas);
    drawboard.appendChild(layersWrapper);

    return drawboard;
}