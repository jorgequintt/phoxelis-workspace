import type { LayerData, Phox } from 'phoxelis';
import type { PhoxelPosition, Workspace, WorkspaceLayer } from '../Workspace';

export interface Change {
  execute: () => void;
  undo: () => void;
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

  const execute = () => {
    this.drawManager.startMotionStroke();
    phoxelPositions.forEach(([r, c]) => {
      const origPhox = phoxelis.getPhoxFromPosition(r, c, layerId);
      previousPhoxels.push(origPhox ? { phox: origPhox, r, c } : { phox: null, r, c });

      this.drawManager.draw(drawMode, dp, r, c, layerId);
    });
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
