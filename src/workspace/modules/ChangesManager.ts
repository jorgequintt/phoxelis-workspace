import type { LayerData } from 'phoxelis';
import type { PhoxelPosition, Workspace, WorkspaceLayer } from '../Workspace';

type ChangesStack = Array<() => void>;
interface ChangesEntry {
  changes: ChangesStack;
  undoChanges: ChangesStack;
}

export function createChangesManager(ws: Workspace) {
  const { phoxelis } = ws;

  let changesHistory: Array<ChangesEntry> = [];
  let redoHistory: Array<ChangesEntry> = [];
  const maxChangesHistory = 50;

  const addChanges = (changes: ChangesEntry) => {
    if (changesHistory.length === maxChangesHistory) changesHistory.shift();
    changesHistory.push(changes);
    redoHistory = [];
  };

  const commitPhoxels = (phoxelPositions: Array<PhoxelPosition>) => {
    const undoChanges: ChangesStack = [];
    const changes: ChangesStack = [];
    const currentLayerId = ws.state$.activeLayer.get(); // Captured for undo/redo funcs

    phoxelPositions.forEach(([r, c]) => {
      const origPhox = phoxelis.getPhoxFromPosition(r, c, ws.state$.activeLayer.get());
      if (!origPhox) {
        // Note: Pass currentLayerId, not ws.state.activeLayer to funcs
        undoChanges.push(() => phoxelis.removePhoxel(r, c, currentLayerId));
      } else {
        undoChanges.push(() =>
          phoxelis.renderPhoxel(
            origPhox.char,
            origPhox.fg,
            origPhox.bg,
            r,
            c,
            currentLayerId,
          ),
        );
      }

      ws.drawManager.draw(phoxelis, r, c, ws.state$.activeLayer.get());

      const newPhox = phoxelis.getPhoxFromPosition(r, c, ws.state$.activeLayer.get());
      if (!newPhox) {
        changes.push(() => phoxelis.removePhoxel(r, c, currentLayerId));
      } else {
        changes.push(() =>
          phoxelis.renderPhoxel(
            newPhox.char,
            newPhox.fg,
            newPhox.bg,
            r,
            c,
            currentLayerId,
          ),
        );
      }
    });

    addChanges({ changes, undoChanges });
  };

  const commitAddLayer = (layerId: string) => {
    const layer = ws.data$.layers[layerId].get();
    const changes: ChangesStack = [];
    const undoChanges: ChangesStack = [];
    const data: { removedLayer: null | { layerData: LayerData; layer: WorkspaceLayer } } =
      { removedLayer: null };

    undoChanges.push(() => {
      const removedLayer = ws.layerManager.removeLayer(layerId);
      data.removedLayer = removedLayer!;
    });

    changes.push(() => {
      ws.layerManager.loadLayer(data.removedLayer!.layerData, layer);
      ws.state$.activeLayer.set(layerId);
    });

    addChanges({ changes, undoChanges });
  };

  const commitRemoveLayer = (layerData: LayerData, layer: WorkspaceLayer) => {
    const changes: ChangesStack = [];
    const undoChanges: ChangesStack = [];
    const data: { removedLayer: null | { layerData: LayerData; layer: WorkspaceLayer } } =
      { removedLayer: null };

    undoChanges.push(() => {
      ws.layerManager.loadLayer(layerData, layer);
      ws.state$.activeLayer.set(layerData!.layer.id);
    });

    changes.push(() => {
      const removedLayer = ws.layerManager.deleteLayer(layerData!.layer.id);
      data.removedLayer = removedLayer!;
    });

    addChanges({ changes, undoChanges });
  };

  const commitMoveLayer = (layerId: string, prevPos: number, newPos: number) => {
    const changes: ChangesStack = [];
    const undoChanges: ChangesStack = [];

    undoChanges.push(() => {
      ws.layerManager.setLayerPosition(layerId, prevPos);
    });

    changes.push(() => {
      ws.layerManager.setLayerPosition(layerId, newPos);
    });

    addChanges({ changes, undoChanges });
  };

  const undoLastChange = () => {
    const lastChange = changesHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to undo');
      return;
    }

    lastChange.undoChanges.forEach((fn) => fn());
    redoHistory.push(lastChange);
  };

  const redoLastChange = () => {
    const lastChange = redoHistory.pop();

    if (!lastChange) {
      console.warn('Nothing to redo');
      return;
    }

    lastChange.changes.forEach((fn) => fn());
    changesHistory.push(lastChange);
  };

  return {
    undoLastChange,
    redoLastChange,
    commitPhoxels,
    commitAddLayer,
    commitRemoveLayer,
    commitMoveLayer,
  };
}
