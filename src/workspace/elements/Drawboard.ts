import { type Workspace } from '../Workspace';
import Hammer from 'hammerjs';
import { createRefImage } from './refImage';
import type { PanzoomObject } from '@panzoom/panzoom';
import Panzoom from '@panzoom/panzoom';

export type CellChangeDetail = {
  x: number;
  y: number;
};

declare global {
  interface HTMLElementEventMap {
    'cellChange': CustomEvent<CellChangeDetail>;
  }
  interface DocumentEventMap {
    'cellChange': CustomEvent<CellChangeDetail>;
  }
}

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
  mirrorOverlay: HTMLCanvasElement;
  selectionOverlay: HTMLCanvasElement;
  textOverlay: HTMLCanvasElement;
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
    ws.phoxelis.canvas.style = `display: block; position: relative; border: 1px solid black; image-rendering: pixelated;`;
    ws.draftScreen.canvas.style = `display: block; position: absolute; top: 0px; right: 0px; border: 1px solid black; image-rendering: pixelated;`;

    const layersWrapper = document.createElement('div');
    layersWrapper.style = 'position: relative';
    layersWrapper.appendChild(ws.phoxelis.canvas);
    layersWrapper.appendChild(this.refImage.wrapper);
    layersWrapper.appendChild(ws.draftScreen.canvas);

    this.mirrorOverlay = document.createElement('canvas');
    this.mirrorOverlay.width = ws.config.size.cols * ws.font.width;
    this.mirrorOverlay.height = ws.config.size.rows * ws.font.height;
    this.mirrorOverlay.style =
      'position: absolute; top: 0; left: 0; pointer-events: none;';
    layersWrapper.appendChild(this.mirrorOverlay);

    this.selectionOverlay = document.createElement('canvas');
    this.selectionOverlay.width = ws.config.size.cols * ws.font.width;
    this.selectionOverlay.height = ws.config.size.rows * ws.font.height;
    this.selectionOverlay.style =
      'position: absolute; top: 0; left: 0; pointer-events: none;';
    layersWrapper.appendChild(this.selectionOverlay);

    this.textOverlay = document.createElement('canvas');
    this.textOverlay.width = ws.config.size.cols * ws.font.width;
    this.textOverlay.height = ws.config.size.rows * ws.font.height;
    this.textOverlay.style =
      'position: absolute; top: 0; left: 0; pointer-events: none;';
    layersWrapper.appendChild(this.textOverlay);

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

      const newPosX = Math.min(
        size.cols - 1,
        Math.max(0, Math.floor(mouseScreenPosX / (font.width * scale))),
      );

      const newPosY = Math.min(
        size.rows - 1,
        Math.max(0, Math.floor(mouseScreenPosY / (font.height * scale))),
      );

      if (this.mousePos.x !== newPosX || this.mousePos.y !== newPosY) {
        this.mousePos.x = newPosX;
        this.mousePos.y = newPosY;

        const cellChangeEvent = new CustomEvent<CellChangeDetail>(
          'cellChange',
          {
            bubbles: true,
            cancelable: true,
            detail: {
              x: newPosX,
              y: newPosY,
            },
          },
        );

        drawboard.dispatchEvent(cellChangeEvent);
      }
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

  renderMirrorOverlay() {
    const ctx = this.mirrorOverlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.mirrorOverlay.width, this.mirrorOverlay.height);

    if (!this.ws.state$.mirrorEnabled.get()) return;
    const point = this.ws.state$.mirrorPoint.get();
    if (!point) return;

    const { width, height } = this.ws.font;
    const x = point.c * width + width / 2;
    const y = point.r * height + height / 2;

    ctx.strokeStyle = '#40E0D0';
    ctx.fillStyle = '#40E0D0';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.mirrorOverlay.height);
    ctx.moveTo(0, y);
    ctx.lineTo(this.mirrorOverlay.width, y);
    ctx.stroke();

    ctx.fillRect(x - 2, y - 2, 5, 5);
  }

  renderSelectionOverlay() {
    const ctx = this.selectionOverlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.selectionOverlay.width, this.selectionOverlay.height);

    const selection = this.ws.state$.selection.get();
    if (!selection) return;

    const { width, height } = this.ws.font;
    const r1 = Math.min(selection.start[0], selection.end[0]);
    const r2 = Math.max(selection.start[0], selection.end[0]);
    const c1 = Math.min(selection.start[1], selection.end[1]);
    const c2 = Math.max(selection.start[1], selection.end[1]);

    const x = c1 * width;
    const y = r1 * height;
    const w = (c2 - c1 + 1) * width;
    const h = (r2 - r1 + 1) * height;

    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.setLineDash([]);
  }

  renderTextOverlay() {
    const ctx = this.textOverlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, this.textOverlay.width, this.textOverlay.height);

    const cursor = this.ws.state$.textCursor.get();
    if (!cursor) return;

    const { width, height } = this.ws.font;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00FF00';
    ctx.beginPath();
    ctx.moveTo(cursor.startC * width, 0);
    ctx.lineTo(cursor.startC * width, this.textOverlay.height);
    ctx.stroke();

    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(
      cursor.c * width + 1,
      cursor.r * height + 1,
      width - 2,
      height - 2,
    );
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
