import { observable } from '@legendapp/state';
import type { Change } from '../../workspace/modules/Actions';
import { ChangesManager } from '../../workspace/modules/ChangesManager';
import { DrawManager } from '../../workspace/modules/DrawManager';
import { LayerManager } from '../../workspace/modules/LayerManager';
import { SelectionManager } from '../../workspace/modules/SelectionManager';
import { VersioningManager } from '../../workspace/modules/VersioningManager';
import type { Workspace } from '../../workspace/Workspace';
import { createFakePhoxelis } from './fakePhoxelis';
import { createFakeDrawboard } from './fakeDrawboard';

export interface MockWorkspaceOptions {
  rows?: number;
  cols?: number;
  baseLayers?: number;
}

const defaultState = {
  dp: { char: '0', fg: '#FFFFFF', bg: '#0077AA' },
  drawMode: 'draw',
  tool: 'draw',
  activeLayer: '',
  activeMotionId: null,
  motionWrap: true,
  paletteData: { selectedPhox: -1, modifyingPhox: false },
  selectedColorType: 'fg',
  movingRefImage: false,
  pencilRadius: 0,
  mirrorEnabled: false,
  mirrorPoint: null,
  mirrorSelectingPoint: false,
  textCursor: null,
  selection: null,
  selectionMove: null,
  clipboard: null,
};

/**
 * Builds a Workspace-shaped stub with real observables, real managers
 * (ChangesManager, DrawManager, VersioningManager, LayerManager,
 * SelectionManager), and in-memory fakes for the Phoxelis engine and the draft
 * screen. Avoids `Workspace.create()` entirely (no fonts, DOM, or render loop).
 */
export function createMockWorkspace(options: MockWorkspaceOptions = {}): Workspace {
  const { rows = 6, cols = 6, baseLayers = 0 } = options;

  const ws = {
    config: {
      size: { rows, cols },
      fontName: '0_Trithemius437',
    },
    font: {
      fontName: 'test',
      length: 1,
      height: 16,
      width: 8,
      characters: {},
      charactersList: [],
    },
    phoxelis: createFakePhoxelis(rows, cols, { createBaseLayer: false }),
    draftScreen: createFakePhoxelis(rows, cols),
    layersTargets: {} as Record<string, HTMLCanvasElement>,
    drawboard: createFakeDrawboard(),
    data$: observable({ layers: {}, motions: {} }),
    state$: observable({ ...defaultState }),
    changesManager: new ChangesManager(),
  };

  const workspace = ws as unknown as Workspace;

  workspace.drawManager = new DrawManager(workspace);
  workspace.versioningManager = new VersioningManager(workspace);
  workspace.layerManager = new LayerManager(workspace);
  workspace.selectionManager = new SelectionManager(workspace);

  workspace.dispatchAction = <T extends (...args: any[]) => Change>(
    action: T,
    ...params: Parameters<T>
  ) => {
    const change = action.call(workspace, ...params);
    change.execute();
    workspace.changesManager.addChange(change);
  };

  for (let i = 0; i < baseLayers; i++) {
    const id = workspace.layerManager.createLayer();
    workspace.state$.activeLayer.set(id);
  }

  return workspace;
}