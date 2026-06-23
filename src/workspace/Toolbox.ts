import { Workspace, type Phoxel, type PhoxelPosition } from './Workspace';

export interface Tool {
  name: string;
  onPointerDown?: (e: PointerEvent) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onPinchStart?: (e: HammerInput) => void;
  onPinchMove?: (e: HammerInput) => void;
  onPinchEnd?: (e: HammerInput) => void;
  submit?: () => void;
  abort?: () => void;
  resetTool?: () => void;
  data?: Record<string, any>;
}

export type CurrentTool = {
  tool: Tool;
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPinchStart: (e: HammerInput) => void;
    onPinchMove: (e: HammerInput) => void;
    onPinchEnd: (e: HammerInput) => void;
  };
};

export type ToolDefinition = {
  name: string;
  icon: string;
  tooltip: string;
};

export const toolDefs: ToolDefinition[] = [
  {
    name: 'draw',
    icon: '✏',
    tooltip: 'Draw (freehand)',
  },
  {
    name: 'rect',
    icon: '□',
    tooltip: 'Rectangle (outline)',
  },
  {
    name: 'filledRect',
    icon: '■',
    tooltip: 'Filled Rectangle',
  },
  {
    name: 'line',
    icon: '╱',
    tooltip: 'Line',
  },
  {
    name: 'ellipse',
    icon: '⬭',
    tooltip: 'Ellipse (outline)',
  },
  {
    name: 'filledEllipse',
    icon: '●',
    tooltip: 'Filled Ellipse',
  },
];

export class Toolbox {
  currentTool: null | CurrentTool;
  previousTool: null | Tool;
  tools: ReturnType<typeof createTools>;
  ws: Workspace;

  constructor(ws: Workspace) {
    this.currentTool = null;
    this.previousTool = null;
    this.ws = ws;
    this.tools = createTools(ws, this);
    this.setTool(this.tools.draw);
  }

  setTool(tool: Tool | string) {
    const { currentTool: currTool } = this;
    const { drawboard } = this.ws;

    if (typeof tool === 'string') {
      // TODO redo this
      tool = this.tools[tool as keyof ReturnType<typeof createTools>];
      if (!tool) throw new Error(`No tool by name ${tool}`);
    }

    if (currTool) {
      currTool.tool.abort?.();
      drawboard.element.removeEventListener(
        'pointerdown',
        currTool.handlers.onPointerDown,
      );
      drawboard.element.removeEventListener(
        'pointermove',
        currTool.handlers.onPointerMove,
      );
      drawboard.element.removeEventListener('pointerup', currTool.handlers.onPointerUp);
      drawboard.hammer.off('pinchstart', currTool.handlers.onPinchStart);
      drawboard.hammer.off('pinchmove', currTool.handlers.onPinchMove);
      drawboard.hammer.off('pinchend', currTool.handlers.onPinchEnd);
      this.previousTool = currTool.tool;
    }

    this.currentTool = {
      tool,
      handlers: {
        onPointerDown: (e) => {
          drawboard.element.setPointerCapture(e.pointerId);
          tool.onPointerDown!(e);
        },
        onPointerMove: (e) => {
          tool.onPointerMove!(e);
        },
        onPointerUp: (e) => {
          try {
            drawboard.element.releasePointerCapture(e.pointerId);
          } catch {}
          tool.onPointerUp!(e);
        },
        onPinchStart: (e) => tool.onPinchStart!(e),
        onPinchMove: (e) => tool.onPinchMove!(e),
        onPinchEnd: (e) => tool.onPinchEnd!(e),
      },
    };

    drawboard.element.addEventListener(
      'pointerdown',
      this.currentTool.handlers.onPointerDown,
    );
    drawboard.element.addEventListener(
      'pointermove',
      this.currentTool.handlers.onPointerMove,
    );
    drawboard.element.addEventListener(
      'pointerup',
      this.currentTool.handlers.onPointerUp,
    );
    drawboard.hammer.on('pinchstart', this.currentTool.handlers.onPinchStart);
    drawboard.hammer.on('pinchmove', this.currentTool.handlers.onPinchMove);
    drawboard.hammer.on('pinchend', this.currentTool.handlers.onPinchEnd);
  }
  setPreviousTool() {
    if (this.previousTool) this.setTool(this.previousTool);
  }
}

export function createTools(ws: Workspace, tb: Toolbox) {
  const {
    session,
    drawboard,
    config: { size },
    draftScreen,
    drawManager
  } = ws;
  const { refImagePanzoom, panzoom, mousePos } = drawboard;

  interface PanzoomTool extends Tool {
    data: {
      panzooming: boolean;
      zooming: boolean;
      panning: boolean;
    };
  }
  const panzoomTool: PanzoomTool = {
    name: 'panzoom',
    data: {
      panzooming: false,
      zooming: false,
      panning: false,
    },
    onPointerDown(e) {
      this.data.panzooming = true;
      this.data.panning = e.ctrlKey;
      this.data.zooming = e.shiftKey;
    },
    onPointerMove(e) {
      if (!this.data.panzooming) return;
      const targetZoom = session.movingRefImage ? refImagePanzoom : panzoom;

      if (!targetZoom) {
        console.error(
          'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
        );
        return;
      }

      if (this.data.panning) {
        targetZoom.pan(
          e.movementX / targetZoom.getScale(),
          e.movementY / targetZoom.getScale(),
        );
      } else if (this.data.zooming) {
        targetZoom.zoom(targetZoom.getScale() + (e.movementY / 35) * -1);
      }
    },
    onPointerUp() {
      if (!this.data.panzooming) return;
      this.resetTool!();
      this.submit!();
      tb.setPreviousTool();
    },
    onPinchStart() {
      this.data.panzooming = true;
      const targetZoom = session.movingRefImage ? refImagePanzoom : panzoom;

      if (!targetZoom) {
        console.error(
          'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
        );
        return;
      }

      if (session.movingRefImage) {
        ws.drawboard.refImageScale = targetZoom.getScale();
      } else {
        ws.drawboard.scale = targetZoom.getScale();
      }
    },
    onPinchMove(e) {
      if (this.data.panzooming) {
        const targetZoom = session.movingRefImage ? refImagePanzoom : panzoom;

        if (!targetZoom) {
          console.error(
            'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
          );
          return;
        }

        const s = session.movingRefImage
          ? ws.drawboard.refImageScale
          : ws.drawboard.scale;
        const newZoomVal = s * e.scale;
        targetZoom.zoom(newZoomVal);
        targetZoom.pan(
          (e.velocityX * 11) / targetZoom.getScale(),
          (e.velocityY * 11) / targetZoom.getScale(),
        );
      }
    },
    onPinchEnd() {
      if (!this.data!.panzooming) return;
      this.resetTool!();
      this.submit!();
    },
    submit() {
      tb.setPreviousTool();
    },
    resetTool() {
      this.data.panzooming = false;
      this.data.panning = false;
      this.data.zooming = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  interface DrawTool extends Tool {
    data: {
      draftPhoxels: Map<string, Phoxel>;
      drawing: boolean;
    };
    addPhoxelToDraft: (p: Phoxel) => void;
  }
  const drawTool: DrawTool = {
    name: 'draw',
    data: {
      draftPhoxels: new Map(),
      drawing: false,
    },
    addPhoxelToDraft(p: Phoxel) {
      this.data!.draftPhoxels.set(`${p.r};${p.c}`, p);
      drawManager.draw(draftScreen, p.r, p.c, ws.getDraftBaseLayer(), {
        draftErasure: true,
      });
    },
    onPointerDown() {
      this.data.drawing = true;
      this.addPhoxelToDraft({ phox: session.dp, r: mousePos.y, c: mousePos.x });
    },
    onPointerMove() {
      if (this.data.drawing) {
        this.addPhoxelToDraft({ phox: session.dp, r: mousePos.y, c: mousePos.x });
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data.drawing = false;
      this.submit!();
    },
    submit() {
      const phoxelsPositions: Array<PhoxelPosition> = [];
      this.data.draftPhoxels.forEach((p) => {
        phoxelsPositions.push([p.r, p.c]);
      });
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      this.data.draftPhoxels = new Map();
      draftScreen.reset(true);
      this.data.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Rectangle (outline) Tool ────────────────────────────────────────────────
  const rectTool: Tool = {
    name: 'rect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      // Clear draft and redraw preview rectangle
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);
      // Top & bottom edges
      for (let c = c1; c <= c2; c++) {
        drawManager.draw(draftScreen, r1, c, ws.getDraftBaseLayer(), {
          draftErasure: true,
        });
        drawManager.draw(draftScreen, r2, c, ws.getDraftBaseLayer(), {
          draftErasure: true,
        });
      }
      // Left & right edges
      for (let r = r1; r <= r2; r++) {
        drawManager.draw(draftScreen, r, c1, ws.getDraftBaseLayer(), {
          draftErasure: true,
        });
        drawManager.draw(draftScreen, r, c2, ws.getDraftBaseLayer(), {
          draftErasure: true,
        });
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);

      const phoxelsPositions: Array<PhoxelPosition> = [];

      // Top & bottom edges
      for (let c = c1; c <= c2; c++) {
        phoxelsPositions.push([r1, c]);
        phoxelsPositions.push([r2, c]);
      }
      // Left & right edges
      for (let r = r1; r <= r2; r++) {
        phoxelsPositions.push([r, c1]);
        phoxelsPositions.push([r, c2]);
      }

      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Filled Rectangle Tool ───────────────────────────────────────────────────
  const filledRectTool: Tool = {
    name: 'filledRect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          drawManager.draw(draftScreen, r, c, ws.getDraftBaseLayer(), {
            draftErasure: true,
          });
        }
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const r1 = Math.min(startR, mousePos.y);
      const r2 = Math.max(startR, mousePos.y);
      const c1 = Math.min(startC, mousePos.x);
      const c2 = Math.max(startC, mousePos.x);

      const phoxelsPositions: Array<PhoxelPosition> = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          phoxelsPositions.push([r, c]);
        }
      }
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Line Tool (Bresenham's algorithm) ──────────────────────────────────────
  function bresenhamCells(
    r0: number,
    c0: number,
    r1: number,
    c1: number,
  ): { r: number; c: number }[] {
    const cells: { r: number; c: number }[] = [];
    let dr = Math.abs(r1 - r0);
    let dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dr - dc;
    let r = r0;
    let c = c0;
    while (true) {
      cells.push({ r, c });
      if (r === r1 && c === c1) break;
      const e2 = 2 * err;
      if (e2 > -dc) {
        err -= dc;
        r += sr;
      }
      if (e2 < dr) {
        err += dr;
        c += sc;
      }
    }
    return cells;
  }

  const lineTool: Tool = {
    name: 'line',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
      for (const { r, c } of cells) {
        drawManager.draw(draftScreen, r, c, ws.getDraftBaseLayer(), {
          draftErasure: true,
        });
      }
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const cells = bresenhamCells(startR, startC, mousePos.y, mousePos.x);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      for (const { r, c } of cells) {
        phoxelsPositions.push([r, c]);
      }
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Ellipse Tool (outline) ──────────────────────────────────────────────────
  // Uses the midpoint ellipse algorithm, with rx/ry derived from start→current position
  const ellipseTool: Tool = {
    name: 'ellipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      drawEllipseOutline(
        (r, c) =>
          drawManager.draw(draftScreen, r, c, ws.getDraftBaseLayer(), {
            draftErasure: true,
          }),
        startR,
        startC,
        rx,
        ry,
      );
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      drawEllipseOutline((r, c) => phoxelsPositions.push([r, c]), startR, startC, rx, ry);
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Filled Ellipse Tool ─────────────────────────────────────────────────────
  const filledEllipseTool: Tool = {
    name: 'filledEllipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = mousePos.y;
      this.data!.startC = mousePos.x;
      this.data!.drawing = true;
    },
    onPointerMove(_e: PointerEvent) {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      drawEllipseFill(
        (r, c) =>
          drawManager.draw(draftScreen, r, c, ws.getDraftBaseLayer(), {
            draftErasure: true,
          }),
        startR,
        startC,
        rx,
        ry,
      );
    },
    onPointerUp() {
      if (!this.data!.drawing) return;
      this.data!.drawing = false;
      this.submit!();
    },
    submit() {
      const { startR, startC } = this.data!;
      if (startR === -1 || startC === -1) return;
      const rx = Math.abs(mousePos.x - startC);
      const ry = Math.abs(mousePos.y - startR);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      drawEllipseFill((r, c) => phoxelsPositions.push([r, c]), startR, startC, rx, ry);
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.resetTool!();
    },
    resetTool() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
    },
    abort() {
      this.resetTool!();
    },
  };

  // ─── Ellipse helper functions ────────────────────────────────────────────────

  /** Draw ellipse outline using midpoint ellipse algorithm */
  function drawEllipseOutline(
    renderFn: (r: number, c: number) => void,
    centerR: number,
    centerC: number,
    rx: number,
    ry: number,
  ) {
    if (rx === 0 && ry === 0) return;
    const rx2 = rx * rx;
    const ry2 = ry * ry;
    let x = 0;
    let y = ry;
    let d1 = ry2 - rx2 * ry + 0.25 * rx2;
    let dx = 2 * ry2 * x;
    let dy = 2 * rx2 * y;

    const plot4 = (cr: number, cc: number, dx: number, dy: number) => {
      renderFn(cr + dy, cc + dx);
      renderFn(cr - dy, cc + dx);
      renderFn(cr + dy, cc - dx);
      renderFn(cr - dy, cc - dx);
    };

    // Region 1: slope > -1
    while (dx < dy) {
      plot4(centerR, centerC, x, y);
      if (d1 < 0) {
        x++;
        dx += 2 * ry2;
        d1 += dx + ry2;
      } else {
        x++;
        y--;
        dx += 2 * ry2;
        dy -= 2 * rx2;
        d1 += dx - dy + ry2;
      }
    }

    // Region 2: slope <= -1
    let d2 = ry2 * (x + 0.5) ** 2 + rx2 * (y - 1) ** 2 - rx2 * ry2;
    while (y >= 0) {
      plot4(centerR, centerC, x, y);
      if (d2 > 0) {
        y--;
        dy -= 2 * rx2;
        d2 += rx2 - dy;
      } else {
        y--;
        x++;
        dx += 2 * ry2;
        dy -= 2 * rx2;
        d2 += dx - dy + rx2;
      }
    }
  }

  /** Fill ellipse using scanline approach with midpoint ellipse algorithm */
  function drawEllipseFill(
    renderFn: (r: number, c: number) => void,
    centerR: number,
    centerC: number,
    rx: number,
    ry: number,
  ) {
    if (rx === 0 && ry === 0) return;

    // For each row, find the leftmost and rightmost column that falls inside the ellipse
    const halfRx = rx + 0.5;
    const halfRy = ry + 0.5;
    const rMin = centerR - halfRy;
    const rMax = centerR + halfRy;

    for (
      let r = Math.max(0, Math.floor(rMin));
      r <= Math.min(size.rows - 1, Math.ceil(rMax));
      r++
    ) {
      const dy = r - centerR;
      // ellipse equation: (x-cx)^2/rx^2 + (y-cy)^2/ry^2 <= 1
      // => |x-cx| <= rx * sqrt(1 - (y-cy)^2/ry^2)
      const ratio = (dy * dy) / (halfRy * halfRy);
      if (ratio > 1) continue;
      const dx = Math.sqrt(Math.max(0, 1 - ratio)) * halfRx;
      const left = Math.max(0, Math.ceil(centerC - dx));
      const right = Math.min(size.cols - 1, Math.floor(centerC + dx));
      for (let c = left; c <= right; c++) {
        renderFn(r, c);
      }
    }
  }

  return {
    panzoom: panzoomTool,
    draw: drawTool,
    line: lineTool,
    rect: rectTool,
    filledRect: filledRectTool,
    ellipse: ellipseTool,
    filledEllipse: filledEllipseTool,
  };
}
