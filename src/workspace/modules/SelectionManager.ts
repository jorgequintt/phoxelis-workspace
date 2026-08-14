import type { Phox } from 'phoxelis';
import type { PhoxelPosition, Workspace } from '../Workspace';
import { drawPhoxes } from './Actions';

export type SelectionData = Array<Array<Phox | null>>;

export interface SelectionBounds {
  r1: number;
  r2: number;
  c1: number;
  c2: number;
}

export interface SelectionRect {
  start: PhoxelPosition;
  end: PhoxelPosition;
}

export class SelectionManager {
  ws: Workspace;

  constructor(ws: Workspace) {
    this.ws = ws;
  }

  getBounds(): SelectionBounds | null {
    const selection = this.ws.state$.selection.get();
    if (!selection) return null;
    return {
      r1: Math.min(selection.start[0], selection.end[0]),
      r2: Math.max(selection.start[0], selection.end[0]),
      c1: Math.min(selection.start[1], selection.end[1]),
      c2: Math.max(selection.start[1], selection.end[1]),
    };
  }

  retrieveData(layerId: string): SelectionData {
    const bounds = this.getBounds();
    if (!bounds) return [];
    const {
      phoxelis,
      config: { size },
    } = this.ws;
    const layer = phoxelis.getLayer(layerId);
    const { r1, r2, c1, c2 } = bounds;
    const data: SelectionData = [];
    for (let r = r1; r <= r2; r++) {
      const row: Array<Phox | null> = [];
      for (let c = c1; c <= c2; c++) {
        const index = layer.buffer[r * size.cols + c];
        row.push(index ? phoxelis.getPhoxFromPaletteIndex(index) : null);
      }
      data.push(row);
    }
    return data;
  }

  private dataToPhoxels(
    data: SelectionData,
    originR: number,
    originC: number,
  ): Array<{ phox: Phox | null; r: number; c: number }> {
    const {
      config: { size },
    } = this.ws;
    const phoxels: Array<{ phox: Phox | null; r: number; c: number }> = [];
    data.forEach((row, ri) =>
      row.forEach((phox, ci) => {
        const r = originR + ri;
        const c = originC + ci;
        if (r < 0 || r >= size.rows || c < 0 || c >= size.cols) return;
        phoxels.push({ phox, r, c });
      }),
    );
    return phoxels;
  }

  private eraseCells(bounds: SelectionBounds) {
    const phoxels: Array<{ phox: null; r: number; c: number }> = [];
    for (let r = bounds.r1; r <= bounds.r2; r++) {
      for (let c = bounds.c1; c <= bounds.c2; c++) {
        phoxels.push({ phox: null, r, c });
      }
    }
    return phoxels;
  }

  isInside(r: number, c: number): boolean {
    const bounds = this.getBounds();
    if (!bounds) return false;
    return r >= bounds.r1 && r <= bounds.r2 && c >= bounds.c1 && c <= bounds.c2;
  }

  copy() {
    const bounds = this.getBounds();
    if (!bounds) return;
    const layerId = this.ws.state$.activeLayer.get();
    this.ws.state$.clipboard.set(this.retrieveData(layerId));
  }

  cut() {
    const bounds = this.getBounds();
    if (!bounds) return;
    const layerId = this.ws.state$.activeLayer.get();
    this.ws.state$.clipboard.set(this.retrieveData(layerId));
    this.ws.dispatchAction(drawPhoxes, this.eraseCells(bounds), layerId);
  }

  remove() {
    const bounds = this.getBounds();
    if (!bounds) return;
    const layerId = this.ws.state$.activeLayer.get();
    this.ws.dispatchAction(drawPhoxes, this.eraseCells(bounds), layerId);
  }

  paste() {
    const clipboard = this.ws.state$.clipboard.get();
    if (!clipboard || clipboard.length === 0) return;
    const {
      state$,
      config: { size },
    } = this.ws;
    const layerId = state$.activeLayer.get();
    const bounds = this.getBounds();
    const originR = bounds ? bounds.r1 : 0;
    const originC = bounds ? bounds.c1 : 0;

    this.ws.dispatchAction(
      drawPhoxes,
      this.dataToPhoxels(clipboard, originR, originC),
      layerId,
    );

    state$.selection.set({
      start: [originR, originC],
      end: [
        Math.min(originR + clipboard.length - 1, size.rows - 1),
        Math.min(originC + (clipboard[0]?.length ?? 1) - 1, size.cols - 1),
      ],
    });
  }

  move(dr: number, dc: number) {
    const bounds = this.getBounds();
    if (!bounds) return;
    const layerId = this.ws.state$.activeLayer.get();
    const data = this.retrieveData(layerId);
    this.commitMoveTo(data, bounds, bounds.r1 + dr, bounds.c1 + dc, layerId);
  }

  startMove(r: number, c: number) {
    const bounds = this.getBounds();
    if (!bounds) return;
    const layerId = this.ws.state$.activeLayer.get();
    this.ws.state$.selectionMove.set({
      data: this.retrieveData(layerId),
      offset: [r - bounds.r1, c - bounds.c1],
      source: { start: [bounds.r1, bounds.c1], end: [bounds.r2, bounds.c2] },
      target: [bounds.r1, bounds.c1],
      layerId,
    });
  }

  updateMove(r: number, c: number) {
    const move = this.ws.state$.selectionMove.get();
    if (!move) return;
    const targetR = r - move.offset[0];
    const targetC = c - move.offset[1];
    this.ws.state$.selectionMove.target.set([targetR, targetC]);
    this.updateSelectionRect(move.data, targetR, targetC);
    this.renderMovePreview(move.data, targetR, targetC);
  }

  commitMove() {
    const move = this.ws.state$.selectionMove.get();
    if (!move) return;
    const { source } = move;
    const [targetR, targetC] = move.target;
    const moved = targetR !== source.start[0] || targetC !== source.start[1];
    if (moved) {
      const bounds: SelectionBounds = {
        r1: source.start[0],
        r2: source.end[0],
        c1: source.start[1],
        c2: source.end[1],
      };
      this.commitMoveTo(move.data, bounds, targetR, targetC, move.layerId);
    }
    this.ws.state$.selectionMove.set(null);
    this.ws.draftScreen.reset(true);
  }

  cancelMove() {
    const move = this.ws.state$.selectionMove.get();
    if (!move) return;
    this.ws.state$.selection.set(move.source);
    this.ws.state$.selectionMove.set(null);
    this.ws.draftScreen.reset(true);
  }

  private updateSelectionRect(data: SelectionData, targetR: number, targetC: number) {
    const {
      state$,
      config: { size },
    } = this.ws;
    state$.selection.set({
      start: [Math.max(0, targetR), Math.max(0, targetC)],
      end: [
        Math.min(targetR + data.length - 1, size.rows - 1),
        Math.min(targetC + (data[0]?.length ?? 1) - 1, size.cols - 1),
      ],
    });
  }

  private commitMoveTo(
    data: SelectionData,
    source: SelectionBounds,
    targetR: number,
    targetC: number,
    layerId: string,
  ) {
    const phoxels: Array<{ phox: Phox | null; r: number; c: number }> = [];
    data.forEach((row, ri) =>
      row.forEach((phox, ci) => {
        if (!phox) return;
        phoxels.push({ phox: null, r: source.r1 + ri, c: source.c1 + ci });
      }),
    );
    phoxels.push(...this.dataToPhoxels(data, targetR, targetC));
    this.ws.dispatchAction(drawPhoxes, phoxels, layerId);
    this.updateSelectionRect(data, targetR, targetC);
  }

  private renderMovePreview(data: SelectionData, targetR: number, targetC: number) {
    const {
      draftScreen,
      config: { size },
    } = this.ws;
    draftScreen.reset(true);
    data.forEach((row, ri) =>
      row.forEach((phox, ci) => {
        if (!phox) return;
        const r = targetR + ri;
        const c = targetC + ci;
        if (r < 0 || r >= size.rows || c < 0 || c >= size.cols) return;
        draftScreen.renderPhoxel(phox.char, phox.fg, phox.bg, r, c);
      }),
    );
  }

  clearSelection() {
    this.ws.state$.selection.set(null);
    this.ws.state$.selectionMove.set(null);
    this.ws.draftScreen.reset(true);
  }
}
