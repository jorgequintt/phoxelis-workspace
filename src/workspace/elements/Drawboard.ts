import { type Workspace } from '../Workspace';
import Hammer from 'hammerjs';
import { createRefImage } from './refImage';
import type { PanzoomObject } from '@panzoom/panzoom';
import Panzoom from '@panzoom/panzoom';


export const panzoomConfiguration = {
  minScale: 0.15,
  maxScale: 10,
  noBind: true,
  relative: true,
  cursor: 'default',
  startX: 0,
  startY: 0,
  startScale: 1,
};

export class Drawboard {
  element: HTMLDivElement;
  mousePos: { x: number; y: number } = { x: -1, y: -1 };
  refImage: { img: HTMLImageElement; wrapper: HTMLDivElement };
  hammer: HammerManager;
  scale = panzoomConfiguration.startScale;
  refImageScale = panzoomConfiguration.startScale;
  panzoom: PanzoomObject | null = null;
  refImagePanzoom: PanzoomObject | null = null;
  ws: Workspace;

  constructor(ws: Workspace) {
    this.ws = ws;
    this.refImage = createRefImage();
    
    const drawboard = document.createElement('div');
    this.element = drawboard;
    drawboard.style =
      'width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;';
    ws.phoxelis.canvas.style = `position: relative; border: 1px solid black; image-rendering: pixelated;`;
    ws.draftScreen.canvas.style = `position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;

    const layersWrapper = document.createElement('div');
    layersWrapper.style = 'position: relative';
    layersWrapper.appendChild(ws.phoxelis.canvas);
    layersWrapper.appendChild(this.refImage.wrapper);
    layersWrapper.appendChild(ws.draftScreen.canvas);
    drawboard.appendChild(layersWrapper);

    this.hammer = new Hammer(drawboard);
    this.hammer.get('pinch').set({ enable: true });
    this.hammer.on('pinchstart', (e) => {
      ws.toolbox.abortCurrentTool();
      ws.toolbox.setTool(ws.toolbox.tools.panzoom);
      ws.toolbox.currentTool?.handlers.onPinchStart(e);
    });

    const setMousePos = (event: PointerEvent) => {
      const {
        config: { size },
        font,
      } = ws;
      const { width, top, left } = ws.phoxelis.canvas.getBoundingClientRect();
      const scale = width / (size.cols * font.width);
      const mouseScreenPosX = event.clientX - left;
      const mouseScreenPosY = event.clientY - top;
      this.mousePos.x = Math.min(
        size.cols - 1,
        Math.max(0, Math.floor(mouseScreenPosX / (font.width * scale))),
      );
      this.mousePos.y = Math.min(
        size.rows - 1,
        Math.max(0, Math.floor(mouseScreenPosY / (font.height * scale))),
      );
    };

    drawboard.addEventListener('pointerdown', setMousePos);
    drawboard.addEventListener('pointermove', setMousePos);
    drawboard.addEventListener('pointerup', setMousePos);
    window.addEventListener('mouseout', this.handleWindowMouseOut);
  
  }

  handleWindowMouseOut = (e: MouseEvent) => {
    if (e.relatedTarget === null) {
      this.ws.toolbox.currentTool?.tool.abort?.();
    }
  };

  setReferenceImage(base64: string) {
    this.refImage.img.src = base64;
    this.refImageScale = 1;
    this.refImagePanzoom?.reset();
  }

  getReferenceImageConfig() {
    return {
      src: this.refImage.img.src ?? '',
      config: {
        panX: this.refImagePanzoom?.getPan().x ?? 0,
        panY: this.refImagePanzoom?.getPan().y ?? 0,
        scale: this.refImagePanzoom?.getScale() ?? 1,
      },
    };
  }

  /** Should only be executed once drawboard is in the DOM */
  startPanzoom() {
    const {
      config: { data },
    } = this.ws;
  
    this.panzoom = Panzoom(
      this.element.firstElementChild as HTMLElement,
      panzoomConfiguration,
    );
    this.refImagePanzoom = Panzoom(this.refImage.img, { ...panzoomConfiguration });

    if (data) {
      this.refImagePanzoom.pan(data.refImage.config.panX, data.refImage.config.panY);
      this.refImagePanzoom.zoom(data.refImage.config.scale);
    }
  }

  dispose = () => {
    this.panzoom?.destroy();
    this.refImagePanzoom?.destroy();
    window.removeEventListener('mouseout', this.handleWindowMouseOut);
    this.hammer.destroy();
  };
}
