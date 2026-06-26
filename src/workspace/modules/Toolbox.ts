import {
  bresenhamCells,
  drawEllipseFill,
  drawEllipseOutline,
} from '../../utils/rendering';
import type { CellChangeDetail } from '../elements/Drawboard';
import { Workspace, type Phoxel, type PhoxelPosition } from '../Workspace';

export interface Tool {
  name: ToolName;
  onPointerDown?: (e: PointerEvent) => void;
  onCellChange?: (e: CustomEvent<CellChangeDetail>) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onPinchStart?: (e: HammerInput) => void;
  onPinchMove?: (e: HammerInput) => void;
  onPinchEnd?: (e: HammerInput) => void;
  draw?: () => void;
  submit?: () => void;
  abort?: () => void;
  reset?: () => void;
  data?: Record<string, any>;
}

export type CurrentTool = {
  tool: Tool;
  handlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onCellChange: (e: CustomEvent<CellChangeDetail>) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPinchStart: (e: HammerInput) => void;
    onPinchMove: (e: HammerInput) => void;
    onPinchEnd: (e: HammerInput) => void;
  };
};

export type ToolDefinition = {
  name: ToolName;
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
    const { drawboard } = this.ws;

    if (typeof tool === 'string') {
      tool = this.tools[tool as keyof ReturnType<typeof createTools>];
      if (!tool) throw new Error(`No tool by name ${tool}`);
    }

    if (this.currentTool) {
      this.currentTool.tool.abort?.();
      drawboard.element.removeEventListener(
        'pointerdown',
        this.currentTool.handlers.onPointerDown,
      );
      drawboard.element.removeEventListener(
        'pointermove',
        this.currentTool.handlers.onPointerMove,
      );
      drawboard.element.removeEventListener(
        'cellChange',
        this.currentTool.handlers.onCellChange,
      );
      drawboard.element.removeEventListener(
        'pointerup',
        this.currentTool.handlers.onPointerUp,
      );
      drawboard.hammer.off('pinchstart', this.currentTool.handlers.onPinchStart);
      drawboard.hammer.off('pinchmove', this.currentTool.handlers.onPinchMove);
      drawboard.hammer.off('pinchend', this.currentTool.handlers.onPinchEnd);
      this.previousTool = this.currentTool.tool;
    }

    this.currentTool = {
      tool,
      handlers: {
        onPointerDown: (e) => {
          drawboard.element.setPointerCapture(e.pointerId);
          tool.onPointerDown?.(e);
        },
        onPointerMove: (e) => {
          tool.onPointerMove?.(e);
        },
        onCellChange: (e) => {
          tool.onCellChange?.(e);
        },
        onPointerUp: (e) => {
          try {
            drawboard.element.releasePointerCapture(e.pointerId);
            tool.onPointerUp?.(e);
          } catch {}
        },
        onPinchStart: (e) => tool.onPinchStart?.(e),
        onPinchMove: (e) => tool.onPinchMove?.(e),
        onPinchEnd: (e) => tool.onPinchEnd?.(e),
      },
    };

    this.ws.state$.tool.set(tool.name);

    drawboard.element.addEventListener(
      'pointerdown',
      this.currentTool.handlers.onPointerDown,
    );
    drawboard.element.addEventListener(
      'pointermove',
      this.currentTool.handlers.onPointerMove,
    );
    drawboard.element.addEventListener(
      'cellChange',
      this.currentTool.handlers.onCellChange,
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

  abortCurrentTool() {
    this.currentTool?.tool.abort?.();
  }
}

export function createTools(ws: Workspace, tb: Toolbox) {
  const {
    drawboard,
    config: { size },
    draftScreen,
    drawManager,
  } = ws;

  const dbd = drawboard;

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
      const targetZoom = ws.state$.movingRefImage.get()
        ? dbd.refImagePanzoom
        : dbd.panzoom;

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
      this.reset!();
      this.submit!();
      tb.setPreviousTool();
    },
    onPinchStart() {
      this.data.panzooming = true;
      const targetZoom = ws.state$.movingRefImage.get()
        ? dbd.refImagePanzoom
        : dbd.panzoom;

      if (!targetZoom) {
        console.error(
          'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
        );
        return;
      }

      if (ws.state$.movingRefImage.get()) {
        ws.drawboard.refImageScale = targetZoom.getScale();
      } else {
        ws.drawboard.scale = targetZoom.getScale();
      }
    },
    onPinchMove(e) {
      if (this.data.panzooming) {
        const targetZoom = ws.state$.movingRefImage.get()
          ? dbd.refImagePanzoom
          : dbd.panzoom;

        if (!targetZoom) {
          console.error(
            'panzoomTool.onPointerMove error: No target panzoom object. Did you startPanzoom()?',
          );
          return;
        }

        const s = ws.state$.movingRefImage.get()
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
      this.reset!();
      this.submit!();
    },
    submit() {
      tb.setPreviousTool();
    },
    reset() {
      this.data.panzooming = false;
      this.data.panning = false;
      this.data.zooming = false;
    },
    abort() {
      this.reset!();
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
      this.addPhoxelToDraft({
        phox: ws.state$.dp.get(),
        r: dbd.mousePos.y,
        c: dbd.mousePos.x,
      });
      this.draw?.();
    },
    onCellChange() {
      this.draw?.();
    },
    draw() {
      if (this.data.drawing) {
        this.addPhoxelToDraft({
          phox: ws.state$.dp.get(),
          r: dbd.mousePos.y,
          c: dbd.mousePos.x,
        });
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
      this.reset!();
    },
    reset() {
      this.data.draftPhoxels = new Map();
      draftScreen.reset(true);
      this.data.drawing = false;
    },
    abort() {
      this.reset!();
    },
  };

  // ─── Rectangle (outline) Tool ────────────────────────────────────────────────
  const rectTool: Tool = {
    name: 'rect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draw?.();
    },
    onCellChange() {
      this.draw?.();
    },
    draw() {
      if (!this.data!.drawing) return;

      // Clear draft and redraw preview rectangle
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, dbd.mousePos.y);
      const r2 = Math.max(startR, dbd.mousePos.y);
      const c1 = Math.min(startC, dbd.mousePos.x);
      const c2 = Math.max(startC, dbd.mousePos.x);
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
      const r1 = Math.min(startR, dbd.mousePos.y);
      const r2 = Math.max(startR, dbd.mousePos.y);
      const c1 = Math.min(startC, dbd.mousePos.x);
      const c2 = Math.max(startC, dbd.mousePos.x);

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
      this.reset!();
    },
    reset() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.reset!();
    },
  };

  // ─── Filled Rectangle Tool ───────────────────────────────────────────────────
  const filledRectTool: Tool = {
    name: 'filledRect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draw?.();
    },
    onCellChange() {
      this.draw?.();
    },
    draw() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, dbd.mousePos.y);
      const r2 = Math.max(startR, dbd.mousePos.y);
      const c1 = Math.min(startC, dbd.mousePos.x);
      const c2 = Math.max(startC, dbd.mousePos.x);
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
      const r1 = Math.min(startR, dbd.mousePos.y);
      const r2 = Math.max(startR, dbd.mousePos.y);
      const c1 = Math.min(startC, dbd.mousePos.x);
      const c2 = Math.max(startC, dbd.mousePos.x);

      const phoxelsPositions: Array<PhoxelPosition> = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          phoxelsPositions.push([r, c]);
        }
      }
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.reset!();
    },
    reset() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.reset!();
    },
  };

  // ─── Line Tool (Bresenham's algorithm) ──────────────────────────────────────
  const lineTool: Tool = {
    name: 'line',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draw?.();
    },
    onCellChange() {
      this.draw?.();
    },
    draw() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const cells = bresenhamCells(startR, startC, dbd.mousePos.y, dbd.mousePos.x);
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
      const cells = bresenhamCells(startR, startC, dbd.mousePos.y, dbd.mousePos.x);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      for (const { r, c } of cells) {
        phoxelsPositions.push([r, c]);
      }
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.reset!();
    },
    reset() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.reset!();
    },
  };

  // ─── Ellipse Tool (outline) ──────────────────────────────────────────────────
  // Uses the midpoint ellipse algorithm, with rx/ry derived from start→current position
  const ellipseTool: Tool = {
    name: 'ellipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draw?.();
    },
    onCellChange() {
      this.draw?.();
    },
    draw() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const rx = Math.abs(dbd.mousePos.x - startC);
      const ry = Math.abs(dbd.mousePos.y - startR);
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
      const rx = Math.abs(dbd.mousePos.x - startC);
      const ry = Math.abs(dbd.mousePos.y - startR);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      drawEllipseOutline((r, c) => phoxelsPositions.push([r, c]), startR, startC, rx, ry);
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.reset!();
    },
    reset() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
      this.data!.drawing = false;
    },
    abort() {
      this.reset!();
    },
  };

  // ─── Filled Ellipse Tool ─────────────────────────────────────────────────────
  const filledEllipseTool: Tool = {
    name: 'filledEllipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draw?.();
    },
    onCellChange() {
      this.draw?.();
    },
    draw() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      const { startR, startC } = this.data!;
      const rx = Math.abs(dbd.mousePos.x - startC);
      const ry = Math.abs(dbd.mousePos.y - startR);
      drawEllipseFill(
        (r, c) =>
          drawManager.draw(draftScreen, r, c, ws.getDraftBaseLayer(), {
            draftErasure: true,
          }),
        startR,
        startC,
        rx,
        ry,
        size,
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
      const rx = Math.abs(dbd.mousePos.x - startC);
      const ry = Math.abs(dbd.mousePos.y - startR);
      const phoxelsPositions: Array<PhoxelPosition> = [];
      drawEllipseFill(
        (r, c) => phoxelsPositions.push([r, c]),
        startR,
        startC,
        rx,
        ry,
        size,
      );
      ws.changesStack.commitPhoxels(phoxelsPositions);
      this.reset!();
    },
    reset() {
      draftScreen.reset(true);
      this.data!.startR = -1;
      this.data!.startC = -1;
    },
    abort() {
      this.reset!();
    },
  };

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

export type ToolName = keyof ReturnType<typeof createTools>;
