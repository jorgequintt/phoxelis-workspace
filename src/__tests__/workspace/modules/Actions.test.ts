import { describe, expect, it } from 'vitest';
import * as Actions from '../../../workspace/modules/Actions';
import type { Phox } from 'phoxelis';
import { createMockWorkspace } from '../../helpers/mockWorkspace';
import type { Workspace } from '../../../workspace/Workspace';

const A: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };
const B: Phox = { char: 'b', fg: '#ffffff', bg: '#000000' };

function cell(ws: Workspace, layerId: string, r: number, c: number): Phox | null {
  return ws.phoxelis.getPhoxFromPosition(r, c, layerId);
}

describe('draw', () => {
  it('round-trips execute → undo → redo → undo to the initial state', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.state$.dp.set(A);

    const change = Actions.draw.call(ws, [[0, 0], [0, 1]], layerId);
    change.execute();
    expect(cell(ws, layerId, 0, 0)).toEqual(A);
    expect(cell(ws, layerId, 0, 1)).toEqual(A);

    change.undo();
    expect(cell(ws, layerId, 0, 0)).toBeNull();
    expect(cell(ws, layerId, 0, 1)).toBeNull();

    change.execute();
    expect(cell(ws, layerId, 0, 0)).toEqual(A);

    change.undo();
    expect(cell(ws, layerId, 0, 0)).toBeNull();
  });

  it('undo restores a pre-existing phoxel and the versioning snapshot', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('x', '#111111', '#222222', 0, 0, layerId);
    ws.state$.dp.set(A);

    const change = Actions.draw.call(ws, [[0, 0]], layerId);
    change.execute();
    expect(cell(ws, layerId, 0, 0)).toEqual(A);

    change.undo();
    expect(cell(ws, layerId, 0, 0)).toEqual({ char: 'x', fg: '#111111', bg: '#222222' });
    expect(ws.data$.layers[layerId].get().branches.master.history[0]).toEqual({});
  });
});

describe('drawPhoxes', () => {
  it('applies a mix of sets and erases, and undo restores prior content', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('x', '#111111', '#222222', 1, 1, layerId);

    const change = Actions.drawPhoxes.call(
      ws,
      [
        { phox: null, r: 1, c: 1 },
        { phox: A, r: 2, c: 2 },
      ],
      layerId,
    );
    change.execute();
    expect(cell(ws, layerId, 1, 1)).toBeNull();
    expect(cell(ws, layerId, 2, 2)).toEqual(A);

    change.undo();
    expect(cell(ws, layerId, 1, 1)).toEqual({ char: 'x', fg: '#111111', bg: '#222222' });
    expect(cell(ws, layerId, 2, 2)).toBeNull();
  });
});

describe('newLayer', () => {
  it('creates a layer and undo removes it', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const prevActive = ws.state$.activeLayer.get();
    const initialCount = ws.phoxelis.layers.length;

    const change = Actions.newLayer.call(ws);
    change.execute();
    expect(ws.phoxelis.layers).toHaveLength(initialCount + 1);
    const newActive = ws.state$.activeLayer.get();
    expect(newActive).not.toBe(prevActive);

    change.undo();
    expect(ws.phoxelis.layers).toHaveLength(initialCount);
    expect(ws.state$.activeLayer.get()).toBe(prevActive);
  });
});

describe('deleteLayer', () => {
  it('undo restores metadata, position, and active layer', () => {
    const ws = createMockWorkspace({ baseLayers: 2 });
    const ids = ws.phoxelis.layers.map((l) => l.id);
    const [l1, l2] = ids;
    ws.state$.activeLayer.set(l2);
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 0, 0, l2);

    const change = Actions.deleteLayer.call(ws, l2);
    change.execute();
    expect(ws.phoxelis.layers.map((l) => l.id)).toEqual([l1]);
    expect(ws.state$.activeLayer.get()).toBe(l1);

    change.undo();
    expect(ws.phoxelis.layers.map((l) => l.id).sort()).toEqual([l1, l2].sort());
    expect(cell(ws, l2, 0, 0)).toEqual({ char: 'a', fg: '#ffffff', bg: '#000000' });
    expect(ws.data$.layers[l2].get().position).toBe(1);
    expect(ws.state$.activeLayer.get()).toBe(l2);
  });
});

describe('moveLayer', () => {
  it('moveLayerUp/Down undo restores the original position', () => {
    const ws = createMockWorkspace({ baseLayers: 3 });
    const mid = ws.phoxelis.layers[1].id;
    expect(ws.phoxelis.layerPositions[mid]).toBe(1);

    const up = Actions.moveLayerUp.call(ws, mid);
    up.execute();
    expect(ws.phoxelis.layerPositions[mid]).toBe(2);
    up.undo();
    expect(ws.phoxelis.layerPositions[mid]).toBe(1);

    const down = Actions.moveLayerDown.call(ws, mid);
    down.execute();
    expect(ws.phoxelis.layerPositions[mid]).toBe(0);
    down.undo();
    expect(ws.phoxelis.layerPositions[mid]).toBe(1);
  });

  it('moveLayerTop/Bottom undo restores the original position', () => {
    const ws = createMockWorkspace({ baseLayers: 3 });
    const mid = ws.phoxelis.layers[1].id;

    const top = Actions.moveLayerTop.call(ws, mid);
    top.execute();
    expect(ws.phoxelis.layerPositions[mid]).toBe(2);
    top.undo();
    expect(ws.phoxelis.layerPositions[mid]).toBe(1);

    const bottom = Actions.moveLayerBottom.call(ws, mid);
    bottom.execute();
    expect(ws.phoxelis.layerPositions[mid]).toBe(0);
    bottom.undo();
    expect(ws.phoxelis.layerPositions[mid]).toBe(1);
  });
});

describe('addVersion', () => {
  it('appends an empty step and undo restores the branches', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();

    const change = Actions.addVersion.call(ws, layerId);
    change.execute();
    let layer = ws.data$.layers[layerId].get();
    expect(layer.branches.master.history).toHaveLength(2);
    expect(layer.branchStep).toBe(1);

    change.undo();
    layer = ws.data$.layers[layerId].get();
    expect(layer.branches.master.history).toHaveLength(1);
    expect(layer.branchStep).toBe(0);
  });
});

describe('createBranch', () => {
  it('adds a branch, switches to it, and undo restores', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();

    const change = Actions.createBranch.call(ws, layerId);
    change.execute();
    let layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('branch-1');
    expect(layer.branchStep).toBe(0);
    expect(layer.branches['branch-1']).toEqual({
      base: { branch: 'master', step: 0 },
      history: [{}],
    });

    change.undo();
    layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('master');
    expect(layer.branches['branch-1']).toBeUndefined();
  });
});

describe('resetVersioning', () => {
  it('flattens the current branch state into master and undo restores', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();

    ws.versioningManager.recordChanges(layerId, { '0,0': A });
    const addVersionChange = Actions.addVersion.call(ws, layerId);
    addVersionChange.execute();
    ws.versioningManager.recordChanges(layerId, { '1,1': B });

    const change = Actions.resetVersioning.call(ws, layerId);
    change.execute();
    let layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('master');
    expect(layer.branchStep).toBe(0);
    expect(layer.branches).toEqual({
      master: { base: null, history: [{ '0,0': A, '1,1': B }] },
    });

    change.undo();
    layer = ws.data$.layers[layerId].get();
    expect(layer.branches.master.history).toEqual([{ '0,0': A }, { '1,1': B }]);
    expect(layer.branchStep).toBe(1);
    expect(layer.currentBranch).toBe('master');
  });
});