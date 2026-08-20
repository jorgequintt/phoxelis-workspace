import { describe, expect, it } from 'vitest';
import { createMockWorkspace } from '../../helpers/mockWorkspace';
import type { Phox } from 'phoxelis';

const A: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };
const B: Phox = { char: 'b', fg: '#ffffff', bg: '#000000' };
const C: Phox = { char: 'c', fg: '#ffffff', bg: '#000000' };

describe('SelectionManager', () => {
  it('getBounds returns null with no selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    expect(ws.selectionManager.getBounds()).toBeNull();
  });

  it('getBounds normalizes reversed corners', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    ws.state$.selection.set({ start: [3, 4], end: [1, 2] });
    expect(ws.selectionManager.getBounds()).toEqual({ r1: 1, r2: 3, c1: 2, c2: 4 });
  });

  it('isInside reports membership in the selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    expect(ws.selectionManager.isInside(0, 0)).toBe(false);
    ws.state$.selection.set({ start: [1, 1], end: [2, 3] });
    const sm = ws.selectionManager;
    expect(sm.isInside(1, 1)).toBe(true);
    expect(sm.isInside(2, 3)).toBe(true);
    expect(sm.isInside(0, 0)).toBe(false);
    expect(sm.isInside(3, 1)).toBe(false);
  });

  it('retrieveData returns rows of Phox|null from the layer buffer', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [2, 2] });

    expect(ws.selectionManager.retrieveData(layerId)).toEqual([
      [A, null],
      [null, null],
    ]);
  });

  it('retrieveData returns an empty array with no selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    expect(ws.selectionManager.retrieveData(layerId)).toEqual([]);
  });

  it('copy stores the selection in the clipboard', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [2, 2] });

    ws.selectionManager.copy();
    expect(ws.state$.clipboard.get()).toEqual([
      [A, null],
      [null, null],
    ]);
  });

  it('cut erases the selection and undo restores it', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [2, 2] });

    ws.selectionManager.cut();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();
    expect(ws.state$.clipboard.get()).toEqual([
      [A, null],
      [null, null],
    ]);

    ws.changesManager.undoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(A);
  });

  it('remove erases the selection and undo restores it', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [2, 2] });

    ws.selectionManager.remove();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();

    ws.changesManager.undoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(A);
  });

  it('paste writes the clipboard at the selection origin and updates the selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 4, cols: 4 });
    const layerId = ws.state$.activeLayer.get();
    ws.state$.clipboard.set([
      [A, B],
      [null, C],
    ]);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });

    ws.selectionManager.paste();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(A);
    expect(ws.phoxelis.getPhoxFromPosition(1, 2, layerId)).toEqual(B);
    expect(ws.phoxelis.getPhoxFromPosition(2, 1, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(C);
    expect(ws.state$.selection.get()).toEqual({ start: [1, 1], end: [2, 2] });

    ws.changesManager.undoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();
  });

  it('paste clamps to the canvas bounds when there is no selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 2, cols: 2 });
    const layerId = ws.state$.activeLayer.get();
    ws.state$.clipboard.set([
      [A, B],
      [null, C],
      [A, B],
    ]);

    ws.selectionManager.paste();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(A);
    expect(ws.phoxelis.getPhoxFromPosition(0, 1, layerId)).toEqual(B);
    expect(ws.phoxelis.getPhoxFromPosition(1, 0, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(C);
    // Row 2 is clamped away; selection is clamped.
    expect(ws.state$.selection.get()).toEqual({ start: [0, 0], end: [1, 1] });
  });

  it('copy/cut/remove/paste are no-ops without a selection or clipboard', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();

    ws.selectionManager.copy();
    expect(ws.state$.clipboard.get()).toBeNull();

    ws.selectionManager.cut();
    ws.selectionManager.remove();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();

    ws.state$.clipboard.set([]);
    ws.selectionManager.paste();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('move is a no-op without a selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.selectionManager.move(1, 1);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('startMove is a no-op without a selection', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    ws.selectionManager.startMove(0, 0);
    expect(ws.state$.selectionMove.get()).toBeNull();
  });

  it('updateMove/commitMove/cancelMove are no-ops without an active move', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const sm = ws.selectionManager;

    sm.updateMove(1, 1);
    sm.commitMove();
    sm.cancelMove();
    expect(ws.state$.selectionMove.get()).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('commitMove without movement does not dispatch a change', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 5, cols: 5 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });

    ws.selectionManager.startMove(2, 2);
    ws.selectionManager.updateMove(2, 2);
    ws.selectionManager.commitMove();

    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(A);
    expect(ws.state$.selectionMove.get()).toBeNull();
    expect(ws.changesManager.changesHistory).toHaveLength(0);
  });

  it('move shifts the selection and undo restores the source', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 5, cols: 5 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });

    ws.selectionManager.move(1, 1);
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toEqual(A);
    expect(ws.state$.selection.get()).toEqual({ start: [3, 3], end: [3, 3] });

    ws.changesManager.undoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(A);
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toBeNull();
  });

  it('startMove/updateMove/commitMove drags the selection and clears the source', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 5, cols: 5 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });

    ws.selectionManager.startMove(2, 2);
    ws.selectionManager.updateMove(3, 3);
    ws.selectionManager.commitMove();

    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toEqual(A);
    expect(ws.state$.selection.get()).toEqual({ start: [3, 3], end: [3, 3] });

    ws.changesManager.undoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(A);
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toBeNull();
  });

  it('cancelMove restores the source selection without moving cells', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 5, cols: 5 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });

    ws.selectionManager.startMove(2, 2);
    ws.selectionManager.updateMove(3, 3);
    ws.selectionManager.cancelMove();

    expect(ws.state$.selection.get()).toEqual({ start: [2, 2], end: [2, 2] });
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(A);
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toBeNull();
  });

  it('drags a selection with empty cells and clamps near the edge', () => {
    const ws = createMockWorkspace({ baseLayers: 1, rows: 5, cols: 5 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 0, 0, layerId);
    ws.phoxelis.renderPhoxel('b', '#ffffff', '#000000', 0, 1, layerId);
    ws.state$.selection.set({ start: [0, 0], end: [1, 1] });

    ws.selectionManager.startMove(0, 0);
    ws.selectionManager.updateMove(4, 4);
    ws.selectionManager.commitMove();

    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(0, 1, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(4, 4, layerId)).toEqual(A);
    expect(ws.state$.selection.get()).toEqual({ start: [4, 4], end: [4, 4] });
  });

  it('clearSelection drops the selection and move state', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    ws.state$.selection.set({ start: [0, 0], end: [1, 1] });
    ws.selectionManager.clearSelection();
    expect(ws.state$.selection.get()).toBeNull();
    expect(ws.state$.selectionMove.get()).toBeNull();
  });
});