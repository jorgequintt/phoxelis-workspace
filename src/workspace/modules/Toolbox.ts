import {
  bresenhamCells,
  circleCells,
  drawEllipseFill,
  drawEllipseOutline,
} from '../../utils/rendering';
import type { CellChangeDetail } from '../elements/Drawboard';
import { Workspace, type Phoxel, type PhoxelPosition } from '../Workspace';
import { draw, drawPhoxes } from './Actions';

export interface Tool {
  name: ToolName;
  onPointerDown?: (e: PointerEvent) => void;
  onCellChange?: (e: CustomEvent<CellChangeDetail>) => void;
  onPointerMove?: (e: PointerEvent) => void;
  onPointerUp?: (e: PointerEvent) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  onKeyUp?: (e: KeyboardEvent) => void;
  onPinchStart?: (e: HammerInput) => void;
  onPinchMove?: (e: HammerInput) => void;
  onPinchEnd?: (e: HammerInput) => void;
  draft?: () => void;
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
    onKeyDown: (e: KeyboardEvent) => void;
    onKeyUp: (e: KeyboardEvent) => void;
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
    name: 'select',
    icon: '▣',
    tooltip: 'Select',
  },
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
  {
    name: 'text',
    icon: 'T',
    tooltip: 'Text',
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
      if (this.currentTool.tool.name === 'select' && tool.name !== 'select') {
        this.ws.selectionManager.clearSelection();
      }
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
      window.removeEventListener('keydown', this.currentTool.handlers.onKeyDown);
      window.removeEventListener('keyup', this.currentTool.handlers.onKeyUp);
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
          if (
            this.ws.state$.mirrorSelectingPoint.get() &&
            !e.ctrlKey &&
            !e.shiftKey &&
            !e.altKey
          ) {
            this.ws.state$.mirrorPoint.set({
              r: drawboard.mousePos.y,
              c: drawboard.mousePos.x,
            });
            this.ws.state$.mirrorSelectingPoint.set(false);
            return;
          }
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
        onKeyDown: (e) => tool.onKeyDown?.(e),
        onKeyUp: (e) => tool.onKeyUp?.(e),
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
    window.addEventListener('keydown', this.currentTool.handlers.onKeyDown);
    window.addEventListener('keyup', this.currentTool.handlers.onKeyUp);
    drawboard.hammer.on('pinchstart', this.currentTool.handlers.onPinchStart);
    drawboard.hammer.on('pinchmove', this.currentTool.handlers.onPinchMove);
    drawboard.hammer.on('pinchend', this.currentTool.handlers.onPinchEnd);
  }

  resumePreviousTool() {
    console.log(this.previousTool?.name);
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
    state$
  } = ws;

  const dbd = drawboard;

  // MARK: Panzoom
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
      this.submit!();
      this.reset!();
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
      this.submit!();
      this.reset!();
    },
    submit() {
      tb.resumePreviousTool();
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

  // MARK: Draw
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
      const radius = ws.state$.pencilRadius.get();
      const cells = circleCells(p.r, p.c, radius, size);
      for (const [r, c] of cells) {
        const key = `${r};${c}`;
        if (this.data!.draftPhoxels.has(key)) continue;
        this.data!.draftPhoxels.set(key, { ...p, r, c });
        drawManager.draft(r, c);
      }
    },
    onPointerDown() {
      this.data.drawing = true;
      drawManager.startMotionStroke();
      this.addPhoxelToDraft({
        phox: ws.state$.dp.get(),
        r: dbd.mousePos.y,
        c: dbd.mousePos.x,
      });
      this.draft?.();
    },
    onCellChange() {
      this.draft?.();
    },
    draft() {
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
      const phoxPositions: Array<PhoxelPosition> = [];
      this.data.draftPhoxels.forEach((p) => {
        phoxPositions.push([p.r, p.c]);
      });
      ws.dispatchAction(draw, phoxPositions, state$.activeLayer.get()); 
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

  // MARK: Rectangle outline
  const rectTool: Tool = {
    name: 'rect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draft?.();
    },
    onCellChange() {
      this.draft?.();
    },
    draft() {
      if (!this.data!.drawing) return;

      // Clear draft and redraw preview rectangle
      draftScreen.reset(true);
      drawManager.startMotionStroke();
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, dbd.mousePos.y);
      const r2 = Math.max(startR, dbd.mousePos.y);
      const c1 = Math.min(startC, dbd.mousePos.x);
      const c2 = Math.max(startC, dbd.mousePos.x);
      // Top & bottom edges
      for (let c = c1; c <= c2; c++) {
        drawManager.draft(r1, c);
        drawManager.draft(r2, c);
      }
      // Left & right edges
      for (let r = r1; r <= r2; r++) {
        drawManager.draft(r, c1);
        drawManager.draft(r, c2);
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

      const phoxPositions: Array<PhoxelPosition> = [];

      // Top & bottom edges
      for (let c = c1; c <= c2; c++) {
        phoxPositions.push([r1, c]);
        phoxPositions.push([r2, c]);
      }
      // Left & right edges
      for (let r = r1; r <= r2; r++) {
        phoxPositions.push([r, c1]);
        phoxPositions.push([r, c2]);
      }

      ws.dispatchAction(draw, phoxPositions, state$.activeLayer.get()); 
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

  // MARK: Rectangle
  const filledRectTool: Tool = {
    name: 'filledRect',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draft?.();
    },
    onCellChange() {
      this.draft?.();
    },
    draft() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      drawManager.startMotionStroke();
      const { startR, startC } = this.data!;
      const r1 = Math.min(startR, dbd.mousePos.y);
      const r2 = Math.max(startR, dbd.mousePos.y);
      const c1 = Math.min(startC, dbd.mousePos.x);
      const c2 = Math.max(startC, dbd.mousePos.x);
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          drawManager.draft(r, c);
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

      const phoxPositions: Array<PhoxelPosition> = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          phoxPositions.push([r, c]);
        }
      }
      
      ws.dispatchAction(draw, phoxPositions, state$.activeLayer.get()); 
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

  // MARK: Line
  const lineTool: Tool = {
    name: 'line',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draft?.();
    },
    onCellChange() {
      this.draft?.();
    },
    draft() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      drawManager.startMotionStroke();
      const { startR, startC } = this.data!;
      const cells = bresenhamCells(startR, startC, dbd.mousePos.y, dbd.mousePos.x);
      for (const { r, c } of cells) {
        drawManager.draft(r, c);
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
      const phoxPositions: Array<PhoxelPosition> = [];
      for (const { r, c } of cells) {
        phoxPositions.push([r, c]);
      }

      ws.dispatchAction(draw, phoxPositions, state$.activeLayer.get()); 
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

  // MARK: Outline Ellipse
  const ellipseTool: Tool = {
    name: 'ellipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draft?.();
    },
    onCellChange() {
      this.draft?.();
    },
    draft() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      drawManager.startMotionStroke();
      const { startR, startC } = this.data!;
      const rx = Math.abs(dbd.mousePos.x - startC);
      const ry = Math.abs(dbd.mousePos.y - startR);
      drawEllipseOutline(
        (r, c) =>
          drawManager.draft(r, c),
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
      const phoxPositions: Array<PhoxelPosition> = [];
      drawEllipseOutline((r, c) => phoxPositions.push([r, c]), startR, startC, rx, ry);

      ws.dispatchAction(draw, phoxPositions, state$.activeLayer.get()); 
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

  // MARK: Ellipse
  const filledEllipseTool: Tool = {
    name: 'filledEllipse',
    data: { startR: -1, startC: -1, drawing: false },
    onPointerDown(_e: PointerEvent) {
      this.data!.startR = dbd.mousePos.y;
      this.data!.startC = dbd.mousePos.x;
      this.data!.drawing = true;
      this.draft?.();
    },
    onCellChange() {
      this.draft?.();
    },
    draft() {
      if (!this.data!.drawing) return;
      draftScreen.reset(true);
      drawManager.startMotionStroke();
      const { startR, startC } = this.data!;
      const rx = Math.abs(dbd.mousePos.x - startC);
      const ry = Math.abs(dbd.mousePos.y - startR);
      drawEllipseFill(
        (r, c) =>
          drawManager.draft(r, c),
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
      const phoxPositions: Array<PhoxelPosition> = [];
      drawEllipseFill(
        (r, c) => phoxPositions.push([r, c]),
        startR,
        startC,
        rx,
        ry,
        size,
      );

      ws.dispatchAction(draw, phoxPositions, state$.activeLayer.get()); 
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

  // MARK: Select
  interface SelectTool extends Tool {
    data: {
      selecting: boolean;
      moving: boolean;
    };
  }
  const selectTool: SelectTool = {
    name: 'select',
    data: { selecting: false, moving: false },
    onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const r = dbd.mousePos.y;
      const c = dbd.mousePos.x;
      const selectionManager = ws.selectionManager;
      if (state$.selection.get() && selectionManager.isInside(r, c)) {
        selectionManager.startMove(r, c);
        this.data.moving = true;
      } else {
        state$.selection.set({ start: [r, c], end: [r, c] });
        this.data.selecting = true;
      }
    },
    onCellChange() {
      const r = dbd.mousePos.y;
      const c = dbd.mousePos.x;
      if (this.data.moving) {
        ws.selectionManager.updateMove(r, c);
      } else if (this.data.selecting) {
        const selection = state$.selection.get();
        if (selection) {
          state$.selection.set({ start: selection.start, end: [r, c] });
        }
      }
    },
    onPointerUp() {
      if (this.data.moving) ws.selectionManager.commitMove();
      this.data.moving = false;
      this.data.selecting = false;
    },
    reset() {
      draftScreen.reset(true);
    },
    abort() {
      ws.selectionManager.cancelMove();
      this.data.moving = false;
      this.data.selecting = false;
      draftScreen.reset(true);
    },
  };

  // MARK: Text
  const textTool: Tool = {
    name: 'text',
    onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const r = dbd.mousePos.y;
      const c = dbd.mousePos.x;
      state$.textCursor.set({ r, c, startC: c });
    },
    onKeyDown(e: KeyboardEvent) {
      const cursor = state$.textCursor.get();
      if (!cursor) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const { r, c, startC } = cursor;
      const activeLayer = state$.activeLayer.get();
      const dp = state$.dp.get();

      const moveTo = (nr: number, nc: number) => {
        const clampedR = Math.min(Math.max(0, nr), size.rows - 1);
        const clampedC = Math.min(Math.max(0, nc), size.cols - 1);
        state$.textCursor.set({ r: clampedR, c: clampedC, startC });
      };

      const eraseCell = (nr: number, nc: number) => {
        ws.dispatchAction(drawPhoxes, [{ phox: null, r: nr, c: nc }], activeLayer);
      };

      const charToGlyph = (ch: string): string | null => {
        const cp = ch.codePointAt(0);
        if (cp === undefined) return null;
        return ws.font.characters[cp] ? ch : null;
      };

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          state$.textCursor.set(null);
          return;
        case 'Enter':
          e.preventDefault();
          moveTo(r + 1, startC);
          return;
        case 'ArrowLeft':
          e.preventDefault();
          moveTo(r, c - 1);
          return;
        case 'ArrowRight':
          e.preventDefault();
          moveTo(r, c + 1);
          return;
        case 'ArrowUp':
          e.preventDefault();
          moveTo(r - 1, c);
          return;
        case 'ArrowDown':
          e.preventDefault();
          moveTo(r + 1, c);
          return;
        case 'Backspace': {
          e.preventDefault();
          if (c - 1 < 0) return;
          eraseCell(r, c - 1);
          moveTo(r, c - 1);
          return;
        }
        case 'Delete': {
          e.preventDefault();
          if (c + 1 >= size.cols) return;
          eraseCell(r, c + 1);
          moveTo(r, c + 1);
          return;
        }
      }

      if (e.ctrlKey && e.key.toLocaleLowerCase() === 'v') {
        e.preventDefault();
        navigator.clipboard
          .readText()
          .then((text) => {
            if (!text) return;
            const freeC = size.cols - c;
            const freeR = size.rows - r;
            const lines = text
              .split('\n')
              .map((line) => [...line].slice(0, freeC))
              .slice(0, freeR);

            const phoxels: Array<{
              phox: { char: string; fg: string; bg: string };
              r: number;
              c: number;
            }> = [];
            lines.forEach((line, li) => {
              line.forEach((ch, ci) => {
                const glyph = charToGlyph(ch);
                if (glyph === null) return;
                phoxels.push({
                  phox: { char: glyph, fg: dp.fg, bg: dp.bg },
                  r: r + li,
                  c: c + ci,
                });
              });
            });

            if (phoxels.length > 0) {
              ws.dispatchAction(drawPhoxes, phoxels, activeLayer);
            }
          })
          .catch(() => {});
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        const glyph = charToGlyph(e.key);
        if (glyph !== null) {
          ws.dispatchAction(
            drawPhoxes,
            [{ phox: { char: glyph, fg: dp.fg, bg: dp.bg }, r, c }],
            activeLayer,
          );
        }
        moveTo(r, c + 1);
      }
    },
    abort() {
      state$.textCursor.set(null);
    },
  };

  return {
    panzoom: panzoomTool,
    select: selectTool,
    draw: drawTool,
    line: lineTool,
    rect: rectTool,
    filledRect: filledRectTool,
    ellipse: ellipseTool,
    filledEllipse: filledEllipseTool,
    text: textTool,
  };
}

export type ToolName = keyof ReturnType<typeof createTools>;
