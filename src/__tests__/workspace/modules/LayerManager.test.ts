import { describe, expect, it } from 'vitest';
import { createMockWorkspace } from '../../helpers/mockWorkspace';

describe('LayerManager', () => {
  it('createLayer adds a layer with metadata and a canvas target', () => {
    const ws = createMockWorkspace();
    const id = ws.layerManager.createLayer();

    expect(ws.phoxelis.layers).toHaveLength(1);
    expect(ws.phoxelis.layers[0].id).toBe(id);
    const meta = ws.data$.layers[id].get();
    expect(meta.name).toBe('Layer #1');
    expect(meta.opacity).toBe(100);
    expect(meta.visible).toBe(true);
    expect(meta.position).toBe(0);
    expect(meta.currentBranch).toBe('master');
    expect(meta.branches.master.history).toEqual([{}]);
    expect(ws.layersTargets[id]).toBeDefined();
  });

  it('deleteLayer returns metadata + LayerData and recalcs positions', () => {
    const ws = createMockWorkspace({ baseLayers: 2 });
    const ids = ws.phoxelis.layers.map((l) => l.id);
    const target = ids[1];
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 0, 0, target);

    const removed = ws.layerManager.deleteLayer(target);
    expect(removed.metadata.position).toBe(1);
    expect(removed.layerData.layer.id).toBe(target);
    expect(ws.phoxelis.layers.map((l) => l.id)).toEqual([ids[0]]);
    expect(ws.data$.layers[ids[0]].get().position).toBe(0);
  });

  it('loadLayer restores a deleted layer with its cells and metadata', () => {
    const ws = createMockWorkspace({ baseLayers: 2 });
    const ids = ws.phoxelis.layers.map((l) => l.id);
    const target = ids[1];
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 0, 0, target);

    const removed = ws.layerManager.deleteLayer(target);
    ws.layerManager.loadLayer(removed.layerData, removed.metadata);

    expect(ws.phoxelis.layers.map((l) => l.id)).toEqual(ids);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, target)).toEqual({
      char: 'a',
      fg: '#ffffff',
      bg: '#000000',
    });
    expect(ws.data$.layers[target].get()).toEqual(removed.metadata);
  });

  it('moveLayerTop/Bottom clamp and moveLayerUp/Down reorder', () => {
    const ws = createMockWorkspace({ baseLayers: 3 });
    const [a, b, c] = ws.phoxelis.layers.map((l) => l.id);

    ws.layerManager.moveLayerTop(a);
    expect(ws.phoxelis.layerPositions[a]).toBe(2);
    expect(ws.data$.layers[a].get().position).toBe(2);

    // Already at top: no-op.
    ws.layerManager.moveLayerTop(a);
    expect(ws.phoxelis.layerPositions[a]).toBe(2);

    ws.layerManager.moveLayerBottom(c);
    expect(ws.phoxelis.layerPositions[c]).toBe(0);

    ws.layerManager.moveLayerUp(b);
    expect(ws.phoxelis.layerPositions[b]).toBe(2);

    ws.layerManager.moveLayerDown(b);
    expect(ws.phoxelis.layerPositions[b]).toBe(1);

    ws.layerManager.moveLayerDown(b);
    expect(ws.phoxelis.layerPositions[b]).toBe(0);
  });

  it('setLayerPosition moves the layer and recalcs all positions', () => {
    const ws = createMockWorkspace({ baseLayers: 3 });
    const ids = ws.phoxelis.layers.map((l) => l.id);

    ws.layerManager.setLayerPosition(ids[0], 2);
    expect(ws.phoxelis.layerPositions[ids[0]]).toBe(2);
    expect(ws.data$.layers[ids[0]].get().position).toBe(2);
    expect(ws.data$.layers[ids[1]].get().position).toBe(0);
    expect(ws.data$.layers[ids[2]].get().position).toBe(1);
  });

  it('getNextLayer returns the lower-position neighbor, clamped', () => {
    const ws = createMockWorkspace({ baseLayers: 3 });
    const ids = ws.phoxelis.layers.map((l) => l.id);

    expect(ws.layerManager.getNextLayer(ids[1])).toBe(ids[0]);
    // Clamped: there is no layer below the bottom-most.
    expect(ws.layerManager.getNextLayer(ids[0])).toBe(ids[0]);
  });

  it('getSortedLayers returns layers top-first', () => {
    const ws = createMockWorkspace({ baseLayers: 3 });
    const ids = ws.phoxelis.layers.map((l) => l.id);
    expect(ws.layerManager.getSortedLayers()).toEqual([...ids].reverse());
  });

  it('getDraftBaseLayer returns the draft screen base layer id', () => {
    const ws = createMockWorkspace();
    expect(ws.layerManager.getDraftBaseLayer()).toBe(ws.draftScreen.layers[0].id);
  });
});