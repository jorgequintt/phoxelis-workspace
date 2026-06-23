import { type Workspace } from '../Workspace';
import Hammer from 'hammerjs';

export function createDrawboard(ws: Workspace) {
  const drawboard = document.createElement('div');
  drawboard.style =
    'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
  ws.phoxelis.canvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;
  ws.draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;

  const layersWrapper = document.createElement('div');
  layersWrapper.style = 'position: relative';
  layersWrapper.appendChild(ws.phoxelis.canvas);
  layersWrapper.appendChild(ws.refImage.wrapper);
  layersWrapper.appendChild(ws.draftScreen.canvas);
  drawboard.appendChild(layersWrapper);

  const hammer = new Hammer(drawboard);
  hammer.get('pinch').set({ enable: true });
  hammer.on('pinchstart', (e) => {
    ws.toolbox.setTool(ws.toolbox.tools.panzoom);
    ws.toolbox.currentTool?.handlers.onPinchStart(e);
  });

    const setMousePos = (event: PointerEvent) => {
    const {
      config: { size },
      mousePos,
      font,
    } = ws;
    const { width, top, left } = ws.phoxelis.canvas.getBoundingClientRect();
    const scale = width / (size.cols * font.width);
    const mouseScreenPosX = event.clientX - left;
    const mouseScreenPosY = event.clientY - top;
    mousePos.x = Math.min(
      size.cols - 1,
      Math.max(0, Math.floor(mouseScreenPosX / (font.width * scale))),
    );
    mousePos.y = Math.min(
      size.rows - 1,
      Math.max(0, Math.floor(mouseScreenPosY / (font.height * scale))),
    );
  };

  drawboard.addEventListener('pointerdown', setMousePos);
  drawboard.addEventListener('pointermove', setMousePos);
  drawboard.addEventListener('pointerup', setMousePos);
  const handleWindowMouseOut = (e: MouseEvent) => {
    if (e.relatedTarget === null) {
      ws.toolbox.currentTool?.tool.abort?.();
    }
  };
  window.addEventListener('mouseout', handleWindowMouseOut);

  const dispose = () => {
    window.removeEventListener('mouseout', handleWindowMouseOut);
    hammer.destroy();
  };

  return { element: drawboard, dispose, hammer };
}
