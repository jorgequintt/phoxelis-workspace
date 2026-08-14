import type { Phox } from 'phoxelis';
import _ from 'lodash';
import type { Branch, Workspace, WorkspaceLayer } from '../Workspace';

export type ChangesMap = Record<string, Phox | null>;

export function assembleVersioningChanges(
  branches: Record<string, Branch>,
  currentBranch: string,
  branchStep: number,
  tree: ChangesMap[] = [],
): ChangesMap {
  const branch = branches[currentBranch];
  const base = branch.base;
  const slicedHistory = branch.history.slice(0, branchStep + 1);
  const reducedChanges = slicedHistory.reduce<ChangesMap>(
    (acc, step) => ({ ...acc, ...step }),
    {},
  );
  tree.push(reducedChanges);
  if (base === null) {
    return tree.reverse().reduce<ChangesMap>((acc, step) => ({ ...acc, ...step }), {});
  }
  return assembleVersioningChanges(branches, base.branch, base.step, tree);
}

export class VersioningManager {
  ws: Workspace;

  constructor(ws: Workspace) {
    this.ws = ws;
  }

  public createInitialBranches(): Record<string, Branch> {
    return {
      master: {
        base: null,
        history: [{}],
      },
    };
  }

  public getLayerBranches(layerId: string): WorkspaceLayer {
    return this.ws.data$.layers[layerId].get();
  }

  public seedBranchesFromLayer(layerId: string) {
    const {
      phoxelis,
      config: { size },
    } = this.ws;
    const history0: ChangesMap = {};
    for (let r = 0; r < size.rows; r++) {
      for (let c = 0; c < size.cols; c++) {
        const phox = phoxelis.getPhoxFromPosition(r, c, layerId);
        if (phox) history0[`${r},${c}`] = phox;
      }
    }
    const branches = this.createInitialBranches();
    branches.master.history[0] = history0;
    return {
      branches,
      currentBranch: 'master',
      branchStep: 0,
    };
  }

  public recordChanges(layerId: string, changes: ChangesMap) {
    const layer = this.getLayerBranches(layerId);
    const { branches, currentBranch, branchStep } = layer;
    const branch = branches[currentBranch];
    const currentStep = branch.history[branchStep];
    const newStep = { ...currentStep, ...changes };
    const newHistory = [...branch.history];
    newHistory[branchStep] = newStep;
    const newBranches = {
      ...branches,
      [currentBranch]: {
        ...branch,
        history: newHistory,
      },
    };
    this.ws.data$.layers[layerId].branches.set(newBranches);
  }

  public apply(layerId: string) {
    const {
      phoxelis,
      config: { size },
    } = this.ws;
    const layer = this.getLayerBranches(layerId);
    const merged = assembleVersioningChanges(
      layer.branches,
      layer.currentBranch,
      layer.branchStep,
    );
    for (let r = 0; r < size.rows; r++) {
      for (let c = 0; c < size.cols; c++) {
        phoxelis.removePhoxel(r, c, layerId);
      }
    }
    for (const [key, phox] of Object.entries(merged)) {
      if (!phox) continue;
      const [r, c] = key.split(',').map(Number);
      phoxelis.renderPhoxel(phox.char, phox.fg, phox.bg, r, c, layerId);
    }
  }

  public goNext(layerId: string) {
    const layer = this.getLayerBranches(layerId);
    const length = layer.branches[layer.currentBranch].history.length;
    const nextStep = Math.min(layer.branchStep + 1, length - 1);
    this.ws.data$.layers[layerId].branchStep.set(nextStep);
    this.apply(layerId);
  }

  public goPrevious(layerId: string) {
    const layer = this.getLayerBranches(layerId);
    const nextStep = Math.max(layer.branchStep - 1, 0);
    this.ws.data$.layers[layerId].branchStep.set(nextStep);
    this.apply(layerId);
  }

  public goTo(layerId: string, version: number) {
    const layer = this.getLayerBranches(layerId);
    const histLength = layer.branches[layer.currentBranch].history.length;
    const clamped = Math.max(0, Math.min(version, histLength - 1));
    this.ws.data$.layers[layerId].branchStep.set(clamped);
    this.apply(layerId);
  }

  public switchBranch(layerId: string, branchName: string) {
    const layer = this.getLayerBranches(layerId);
    const branch = layer.branches[branchName];
    if (!branch) return;
    this.ws.data$.layers[layerId].currentBranch.set(branchName);
    this.ws.data$.layers[layerId].branchStep.set(branch.history.length - 1);
    this.apply(layerId);
  }

  public goToParentBranch(layerId: string) {
    const layer = this.getLayerBranches(layerId);
    const base = layer.branches[layer.currentBranch].base;
    if (!base) return;
    this.ws.data$.layers[layerId].currentBranch.set(base.branch);
    this.ws.data$.layers[layerId].branchStep.set(base.step);
    this.apply(layerId);
  }

  public assembleChanges(layerId: string): ChangesMap {
    const layer = this.getLayerBranches(layerId);
    return assembleVersioningChanges(
      layer.branches,
      layer.currentBranch,
      layer.branchStep,
    );
  }

  public snapshot(layerId: string) {
    const layer = this.getLayerBranches(layerId);
    return {
      branches: _.cloneDeep(layer.branches),
      currentBranch: layer.currentBranch,
      branchStep: layer.branchStep,
    };
  }

  public restore(layerId: string, snapshot: ReturnType<VersioningManager['snapshot']>) {
    this.ws.data$.layers[layerId].branches.set(snapshot.branches);
    this.ws.data$.layers[layerId].currentBranch.set(snapshot.currentBranch);
    this.ws.data$.layers[layerId].branchStep.set(snapshot.branchStep);
  }
}
