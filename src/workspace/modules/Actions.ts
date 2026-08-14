import type { LayerData, Phox } from 'phoxelis';
import _ from 'lodash';
import type { Branch, PhoxelPosition, Workspace, WorkspaceLayer } from '../Workspace';

export interface Change {
  execute: () => void;
  undo: () => void;
}

type VersioningSnapshot = {
  branches: Record<string, Branch>;
  currentBranch: string;
  branchStep: number;
};

function snapshotVersioning(layer: WorkspaceLayer): VersioningSnapshot {
  return {
    branches: _.cloneDeep(layer.branches),
    currentBranch: layer.currentBranch,
    branchStep: layer.branchStep,
  };
}

export function draw(
  this: Workspace,
  phoxelPositions: Array<PhoxelPosition>,
  layerId: string,
): Change {
  const previousPhoxels: { phox: Phox | null; r: number; c: number }[] = [];
  const phoxelis = this.phoxelis;
  const dp = {...this.state$.dp.get()};
  const drawMode = this.state$.drawMode.get();
  const positions = this.drawManager.expandPositions(phoxelPositions);
  const versioningSnapshot = snapshotVersioning(this.data$.layers[layerId].get());

  const execute = () => {
    this.drawManager.startMotionStroke();
    const changes: Record<string, Phox | null> = {};
    positions.forEach(([r, c]) => {
      const origPhox = phoxelis.getPhoxFromPosition(r, c, layerId);
      previousPhoxels.push(origPhox ? { phox: origPhox, r, c } : { phox: null, r, c });

      this.drawManager.draw(drawMode, dp, r, c, layerId);

      const newPhox = phoxelis.getPhoxFromPosition(r, c, layerId);
      changes[`${r},${c}`] = newPhox;
    });
    this.versioningManager.recordChanges(layerId, changes);
  };
  const undo = () => {
    previousPhoxels.forEach((p) => {
      if (!p.phox) {
        phoxelis.removePhoxel(p.r, p.c, layerId);
      } else {
        const {char, fg, bg} = p.phox;
        phoxelis.renderPhoxel(char, fg, bg, p.r, p.c, layerId);
      }
    });
    this.data$.layers[layerId].branches.set(versioningSnapshot.branches);
    this.data$.layers[layerId].currentBranch.set(versioningSnapshot.currentBranch);
    this.data$.layers[layerId].branchStep.set(versioningSnapshot.branchStep);
  };

  return { execute, undo };
}

export function drawPhoxes(
  this: Workspace,
  phoxels: Array<{ phox: Phox | null; r: number; c: number }>,
  layerId: string,
): Change {
  const phoxelis = this.phoxelis;
  const previous: Array<{ phox: Phox | null; r: number; c: number }> = [];
  const versioningSnapshot = snapshotVersioning(this.data$.layers[layerId].get());

  const execute = () => {
    previous.length = 0;
    const changes: Record<string, Phox | null> = {};
    phoxels.forEach(({ r, c }) => {
      previous.push({ phox: phoxelis.getPhoxFromPosition(r, c, layerId), r, c });
    });
    phoxels.forEach(({ phox, r, c }) => {
      if (phox) {
        phoxelis.renderPhoxel(phox.char, phox.fg, phox.bg, r, c, layerId);
      } else {
        phoxelis.removePhoxel(r, c, layerId);
      }
      changes[`${r},${c}`] = phox;
    });
    this.versioningManager.recordChanges(layerId, changes);
  };
  const undo = () => {
    previous.forEach(({ phox, r, c }) => {
      if (phox) {
        phoxelis.renderPhoxel(phox.char, phox.fg, phox.bg, r, c, layerId);
      } else {
        phoxelis.removePhoxel(r, c, layerId);
      }
    });
    this.data$.layers[layerId].branches.set(versioningSnapshot.branches);
    this.data$.layers[layerId].currentBranch.set(versioningSnapshot.currentBranch);
    this.data$.layers[layerId].branchStep.set(versioningSnapshot.branchStep);
  };

  return { execute, undo };
}

export function newLayer(this: Workspace): Change {
  let layerId: string;
  let prevActiveLayerId: string;

  const execute = () => {
    prevActiveLayerId = this.state$.activeLayer.get();
    layerId = this.layerManager.createLayer(layerId);
    this.state$.activeLayer.set(layerId);
  };
  const undo = () => {
    this.layerManager.deleteLayer(layerId!);
    this.state$.activeLayer.set(prevActiveLayerId);
  };

  return { execute, undo };
}

export function deleteLayer(this: Workspace, layerId: string): Change {
  let deletedLayer: {
    metadata: WorkspaceLayer;
    layerData: LayerData;
  };

  const execute = () => {
    const layerBefore = this.layerManager.getNextLayer(layerId);
    const removedLayer = this.layerManager.deleteLayer(layerId);
    deletedLayer = removedLayer;
    this.state$.activeLayer.set(layerBefore);
  };
  const undo = () => {
    const { metadata, layerData } = deletedLayer;
    this.layerManager.loadLayer(layerData, metadata);
    this.layerManager.setLayerPosition(layerId, metadata.position);
    this.state$.activeLayer.set(layerId);
  };

  return { execute, undo };
}

export function moveLayerUp(this: Workspace, layerId: string): Change {
  let originalPos: number;

  const execute = () => {
    originalPos = this.layerManager.getLayerPosition(layerId);
    this.layerManager.moveLayerUp(layerId);
  };

  const undo = () => {
    this.layerManager.setLayerPosition(layerId, originalPos);
  };

  return { execute, undo };
}

export function moveLayerDown(this: Workspace, layerId: string): Change {
  let originalPos: number;

  const execute = () => {
    originalPos = this.layerManager.getLayerPosition(layerId);
    this.layerManager.moveLayerDown(layerId);
  };

  const undo = () => {
    this.layerManager.setLayerPosition(layerId, originalPos);
  };

  return { execute, undo };
}

export function moveLayerTop(this: Workspace, layerId: string): Change {
  let originalPos: number;

  const execute = () => {
    originalPos = this.layerManager.getLayerPosition(layerId);
    this.layerManager.moveLayerTop(layerId);
  };

  const undo = () => {
    this.layerManager.setLayerPosition(layerId, originalPos);
  };

  return { execute, undo };
}

export function moveLayerBottom(this: Workspace, layerId: string): Change {
  let originalPos: number;

  const execute = () => {
    originalPos = this.layerManager.getLayerPosition(layerId);
    this.layerManager.moveLayerBottom(layerId);
  };

  const undo = () => {
    this.layerManager.setLayerPosition(layerId, originalPos);
  };

  return { execute, undo };
}

export function addVersion(this: Workspace, layerId: string): Change {
  let snapshot: VersioningSnapshot;

  const execute = () => {
    const layer = this.data$.layers[layerId].get();
    snapshot = snapshotVersioning(layer);
    const branch = layer.branches[layer.currentBranch];
    const newHistory = [...branch.history, {}];
    const newBranches = {
      ...layer.branches,
      [layer.currentBranch]: { ...branch, history: newHistory },
    };
    this.data$.layers[layerId].branches.set(newBranches);
    this.data$.layers[layerId].branchStep.set(newHistory.length - 1);
  };
  const undo = () => {
    this.data$.layers[layerId].branches.set(snapshot.branches);
    this.data$.layers[layerId].currentBranch.set(snapshot.currentBranch);
    this.data$.layers[layerId].branchStep.set(snapshot.branchStep);
  };

  return { execute, undo };
}

export function createBranch(this: Workspace, layerId: string): Change {
  let snapshot: VersioningSnapshot;

  const execute = () => {
    const layer = this.data$.layers[layerId].get();
    snapshot = snapshotVersioning(layer);
    const branchName = `branch-${Object.keys(layer.branches).length}`;
    const newBranches = {
      ...layer.branches,
      [branchName]: {
        base: { branch: layer.currentBranch, step: layer.branchStep },
        history: [{}],
      },
    };
    this.data$.layers[layerId].branches.set(newBranches);
    this.data$.layers[layerId].currentBranch.set(branchName);
    this.data$.layers[layerId].branchStep.set(0);
  };
  const undo = () => {
    this.data$.layers[layerId].branches.set(snapshot.branches);
    this.data$.layers[layerId].currentBranch.set(snapshot.currentBranch);
    this.data$.layers[layerId].branchStep.set(snapshot.branchStep);
  };

  return { execute, undo };
}

export function resetVersioning(this: Workspace, layerId: string): Change {
  let snapshot: VersioningSnapshot;

  const execute = () => {
    const layer = this.data$.layers[layerId].get();
    snapshot = snapshotVersioning(layer);
    const merged = this.versioningManager.assembleChanges(layerId);
    this.data$.layers[layerId].branches.set({
      master: { base: null, history: [merged] },
    });
    this.data$.layers[layerId].currentBranch.set('master');
    this.data$.layers[layerId].branchStep.set(0);
  };
  const undo = () => {
    this.data$.layers[layerId].branches.set(snapshot.branches);
    this.data$.layers[layerId].currentBranch.set(snapshot.currentBranch);
    this.data$.layers[layerId].branchStep.set(snapshot.branchStep);
  };

  return { execute, undo };
}
