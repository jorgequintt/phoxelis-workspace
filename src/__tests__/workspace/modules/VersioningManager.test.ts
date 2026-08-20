import { describe, expect, it } from 'vitest';
import { observable } from '@legendapp/state';
import {
  assembleVersioningChanges,
  VersioningManager,
} from '../../../workspace/modules/VersioningManager';
import type {
  Branch,
  Workspace,
  WorkspaceLayer,
} from '../../../workspace/Workspace';
import type { Phox } from 'phoxelis';
import { addVersion, createBranch } from '../../../workspace/modules/Actions';
import { createMockWorkspace } from '../../helpers/mockWorkspace';

const A: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };
const B: Phox = { char: 'b', fg: '#ffffff', bg: '#000000' };
const C: Phox = { char: 'c', fg: '#ffffff', bg: '#000000' };

function makeLayer(overrides: Partial<WorkspaceLayer> = {}): WorkspaceLayer {
  return {
    name: 'Layer #1',
    opacity: 100,
    visible: true,
    position: 0,
    branches: {
      master: { base: null, history: [{}] },
    },
    currentBranch: 'master',
    branchStep: 0,
    ...overrides,
  };
}

function stubWs(layers: Record<string, WorkspaceLayer>): Workspace {
  return {
    data$: observable({ layers, motions: {} }),
  } as unknown as Workspace;
}

describe('assembleVersioningChanges', () => {
  it('merges a single branch up to the current step', () => {
    const branches: Record<string, Branch> = {
      master: {
        base: null,
        history: [{ '0,0': A }, { '1,1': B }],
      },
    };
    const merged = assembleVersioningChanges(branches, 'master', 1);
    expect(merged).toEqual({ '0,0': A, '1,1': B });
  });

  it('slices history at branchStep', () => {
    const branches: Record<string, Branch> = {
      master: {
        base: null,
        history: [{ '0,0': A }, { '1,1': B }],
      },
    };
    const merged = assembleVersioningChanges(branches, 'master', 0);
    expect(merged).toEqual({ '0,0': A });
  });

  it('lets later steps override earlier ones for the same cell', () => {
    const branches: Record<string, Branch> = {
      master: {
        base: null,
        history: [{ '0,0': A }, { '0,0': B }],
      },
    };
    const merged = assembleVersioningChanges(branches, 'master', 1);
    expect(merged['0,0']).toEqual(B);
  });

  it('applies the ancestor branch before the child branch', () => {
    const branches: Record<string, Branch> = {
      master: {
        base: null,
        history: [{ '0,0': A }],
      },
      'branch-1': {
        base: { branch: 'master', step: 0 },
        history: [{ '1,1': B }],
      },
    };
    const merged = assembleVersioningChanges(branches, 'branch-1', 0);
    expect(merged).toEqual({ '0,0': A, '1,1': B });
  });

  it('lets the child branch override its ancestor', () => {
    const branches: Record<string, Branch> = {
      master: {
        base: null,
        history: [{ '0,0': A }],
      },
      'branch-1': {
        base: { branch: 'master', step: 0 },
        history: [{ '0,0': B }],
      },
    };
    const merged = assembleVersioningChanges(branches, 'branch-1', 0);
    expect(merged['0,0']).toEqual(B);
  });

  it('walks an arbitrarily deep ancestor chain', () => {
    const branches: Record<string, Branch> = {
      master: {
        base: null,
        history: [{ '0,0': A }],
      },
      b1: {
        base: { branch: 'master', step: 0 },
        history: [{ '1,1': B }],
      },
      b2: {
        base: { branch: 'b1', step: 0 },
        history: [{ '2,2': C }],
      },
    };
    const merged = assembleVersioningChanges(branches, 'b2', 0);
    expect(merged).toEqual({ '0,0': A, '1,1': B, '2,2': C });
  });

  it('handles an empty history (only the initial empty step)', () => {
    const branches: Record<string, Branch> = {
      master: { base: null, history: [{}] },
    };
    expect(assembleVersioningChanges(branches, 'master', 0)).toEqual({});
  });
});

describe('VersioningManager', () => {
  it('createInitialBranches seeds a single empty master branch', () => {
    const vm = new VersioningManager(stubWs({}));
    expect(vm.createInitialBranches()).toEqual({
      master: { base: null, history: [{}] },
    });
  });

  it('recordChanges merges into the current history step', () => {
    const ws = stubWs({
      L1: makeLayer(),
    });
    const vm = new VersioningManager(ws);
    vm.recordChanges('L1', { '0,0': A, '1,1': B });
    vm.recordChanges('L1', { '1,1': C });

    const layer = ws.data$.layers.L1.get();
    expect(layer.branches.master.history[0]).toEqual({ '0,0': A, '1,1': C });
    expect(layer.branchStep).toBe(0);
  });

  it('assembleChanges returns the merged changes for the current state', () => {
    const ws = stubWs({
      L1: makeLayer({
        branches: {
          master: {
            base: null,
            history: [{ '0,0': A }, { '1,1': B }],
          },
        },
        branchStep: 1,
      }),
    });
    const vm = new VersioningManager(ws);
    expect(vm.assembleChanges('L1')).toEqual({ '0,0': A, '1,1': B });
  });

  it('snapshot/restore round-trips the versioning state', () => {
    const ws = stubWs({
      L1: makeLayer({
        branches: {
          master: {
            base: null,
            history: [{ '0,0': A }],
          },
        },
      }),
    });
    const vm = new VersioningManager(ws);
    const snap = vm.snapshot('L1');
    vm.recordChanges('L1', { '1,1': B });
    vm.restore('L1', snap);
    expect(vm.getLayerBranches('L1').branches).toEqual({
      master: { base: null, history: [{ '0,0': A }] },
    });
  });
});

describe('VersioningManager with engine', () => {
  it('seedBranchesFromLayer snapshots existing cells into master step 0', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(A.char, A.fg, A.bg, 0, 0, layerId);

    const seeded = ws.versioningManager.seedBranchesFromLayer(layerId);
    expect(seeded.currentBranch).toBe('master');
    expect(seeded.branchStep).toBe(0);
    expect(seeded.branches.master.history[0]).toEqual({ '0,0': A });
  });

  it('apply rewrites the layer cells from the merged history', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.versioningManager.recordChanges(layerId, { '0,0': A });
    ws.versioningManager.recordChanges(layerId, { '1,1': B });
    // A cell that exists on the canvas but not in history must be cleared.
    ws.phoxelis.renderPhoxel('z', '#333333', '#444444', 3, 3, layerId);

    ws.versioningManager.apply(layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(A);
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(B);
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toBeNull();
  });

  it('goNext/goPrevious/goTo navigate the history and clamp', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.dispatchAction(addVersion, layerId); // history length 2, branchStep 1

    ws.versioningManager.goPrevious(layerId);
    expect(ws.data$.layers[layerId].get().branchStep).toBe(0);
    ws.versioningManager.goPrevious(layerId);
    expect(ws.data$.layers[layerId].get().branchStep).toBe(0); // clamped

    ws.versioningManager.goNext(layerId);
    expect(ws.data$.layers[layerId].get().branchStep).toBe(1);
    ws.versioningManager.goNext(layerId);
    expect(ws.data$.layers[layerId].get().branchStep).toBe(1); // clamped

    ws.versioningManager.goTo(layerId, 5);
    expect(ws.data$.layers[layerId].get().branchStep).toBe(1); // clamped

    ws.versioningManager.goTo(layerId, 0);
    expect(ws.data$.layers[layerId].get().branchStep).toBe(0);
  });

  it('switchBranch switches, applies, and ignores unknown branches', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.dispatchAction(createBranch, layerId);
    ws.versioningManager.recordChanges(layerId, { '0,0': A });

    ws.versioningManager.switchBranch(layerId, 'master');
    let layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('master');
    expect(layer.branchStep).toBe(0);
    // master has no history → the branch-1 cell is cleared.
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();

    ws.versioningManager.switchBranch(layerId, 'does-not-exist');
    layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('master');
  });

  it('goToParentBranch returns to the branch base and no-ops on master', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.dispatchAction(createBranch, layerId);
    ws.versioningManager.recordChanges(layerId, { '0,0': A });

    ws.versioningManager.goToParentBranch(layerId);
    let layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('master');
    expect(layer.branchStep).toBe(0);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();

    ws.versioningManager.goToParentBranch(layerId); // master has no base
    layer = ws.data$.layers[layerId].get();
    expect(layer.currentBranch).toBe('master');
  });

  it('recordChanges on a branch keeps history append semantics for goNext', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.versioningManager.recordChanges(layerId, { '0,0': A });
    const branch = ws.data$.layers[layerId].get().branches.master;
    expect(branch.history).toHaveLength(1);
    expect(branch.history[0]).toEqual({ '0,0': A });
  });

  it('apply ignores null entries in the merged history', () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(A.char, A.fg, A.bg, 0, 0, layerId);
    ws.versioningManager.recordChanges(layerId, { '0,0': null });

    ws.versioningManager.apply(layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });
});