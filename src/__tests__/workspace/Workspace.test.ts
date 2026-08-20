import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Phox } from 'phoxelis';
import {
  Workspace,
  type WorkspaceData,
  type WorkspaceInputConfig,
} from '../../workspace/Workspace';
import { draw } from '../../workspace/modules/Actions';

vi.mock('phoxelis', async () => {
  const { createFakePhoxelis } = await import('../helpers/fakePhoxelis');
  return {
    getFont: vi.fn(async (fontName: string) => ({
      fontName,
      length: 1,
      height: 8,
      width: 8,
      characters: {},
      charactersList: [],
    })),
    Phoxelis: vi.fn(
      (
        rows: number,
        cols: number,
        _font: unknown,
        options?: { createBaseLayer?: boolean },
      ) => createFakePhoxelis(rows, cols, options),
    ),
  };
});

vi.mock('../../workspace/elements/Drawboard', async () => {
  const { createFakeDrawboard } = await import('../helpers/fakeDrawboard');
  return {
    Drawboard: class {
      constructor(ws: unknown) {
        Object.assign(this, createFakeDrawboard(), { ws });
      }
    },
  };
});

vi.mock('../../workspace/elements/colorPicker', () => ({
  createColorPicker: vi.fn(() => ({ dispose: vi.fn() })),
}));
vi.mock('../../workspace/elements/alphabet', () => ({
  createAlphabetSelector: vi.fn(() => ({})),
}));
vi.mock('../../workspace/elements/palette', () => ({
  createPaletteSelector: vi.fn(() => ({})),
}));

const SIZE = { rows: 4, cols: 4 };
const FONT = '0_Trithemius437';
const DP: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };

let rafCallbacks: FrameRequestCallback[] = [];
const created: Workspace[] = [];

async function createWs(config: WorkspaceInputConfig = { size: SIZE, fontName: FONT }) {
  const ws = await Workspace.create(config);
  created.push(ws);
  return ws;
}

function keyEvent(overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    key: '',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    target: null,
    preventDefault: vi.fn(),
    ...overrides,
  } as unknown as KeyboardEvent;
}

beforeEach(() => {
  rafCallbacks = [];
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });
});

afterEach(() => {
  created.forEach((w) => w.dispose());
  created.length = 0;
  vi.restoreAllMocks();
});

describe('Workspace', () => {
  it('creates a workspace with one base layer and syncs the active layer', async () => {
    const ws = await createWs();

    expect(ws.phoxelis.layers).toHaveLength(1);
    const layerId = ws.state$.activeLayer.get();
    expect(layerId).toBe(ws.phoxelis.layers[0].id);
    expect(ws.data$.layers.get()[layerId]).toMatchObject({
      name: 'Layer #1',
      visible: true,
      opacity: 100,
      position: 0,
      currentBranch: 'master',
      branchStep: 0,
    });
    expect(ws.data$.layers.get()[layerId].branches.master).toBeDefined();
    expect(ws.state$.tool.get()).toBe('draw');
    expect(ws.state$.drawMode.get()).toBe('draw');
    expect(ws.font.fontName).toBe(FONT);
    expect(ws.drawboard.element).toBeTruthy();
  });

  it('dispatchAction executes a change and records it for undo/redo', async () => {
    const ws = await createWs();
    ws.state$.dp.set(DP);
    const layerId = ws.state$.activeLayer.get();

    ws.dispatchAction(draw, [[0, 0]], layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(DP);
    expect(ws.changesManager.changesHistory).toHaveLength(1);

    ws.changesManager.undoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();

    ws.changesManager.redoLastChange();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(DP);
  });

  it('registers Ctrl+Z / Ctrl+Y for undo and redo', async () => {
    const ws = await createWs();
    ws.state$.dp.set(DP);
    const layerId = ws.state$.activeLayer.get();
    ws.dispatchAction(draw, [[0, 0]], layerId);

    const z = ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.key === 'z')!;
    const y = ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.key === 'y')!;

    z.onHotkeyEnd!(keyEvent());
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();

    y.onHotkeyEnd!(keyEvent());
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(DP);
  });

  it('registers Ctrl+C/X/V for copy, cut and paste', async () => {
    const ws = await createWs();
    ws.state$.tool.set('select');
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });

    const c = ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.key === 'c')!;
    const x = ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.key === 'x')!;
    const v = ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.key === 'v')!;

    c.onHotkeyEnd!(keyEvent());
    expect(ws.state$.clipboard.get()).toEqual([
      [{ char: 'a', fg: '#ffffff', bg: '#000000' }],
    ]);

    x.onHotkeyEnd!(keyEvent());
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();

    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });
    v.onHotkeyEnd!(keyEvent());
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual({
      char: 'a',
      fg: '#ffffff',
      bg: '#000000',
    });
  });

  it('registers Delete/Backspace/Escape and the arrow keys for selection edits', async () => {
    const ws = await createWs();
    ws.state$.tool.set('select');
    const layerId = ws.state$.activeLayer.get();
    const get = (r: number, c: number) => ws.phoxelis.getPhoxFromPosition(r, c, layerId);
    const hotkey = (key: string) => ws.hotkeyManager.hotkeys.find((h) => h.key === key)!;

    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });
    hotkey('delete').onHotkeyStart!(keyEvent());
    expect(get(2, 2)).toBeNull();

    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });
    hotkey('backspace').onHotkeyStart!(keyEvent());
    expect(get(2, 2)).toBeNull();

    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });
    hotkey('arrowleft').onHotkeyStart!(keyEvent());
    expect(get(2, 1)).toEqual({ char: 'a', fg: '#ffffff', bg: '#000000' });
    expect(get(2, 2)).toBeNull();

    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });
    hotkey('arrowright').onHotkeyStart!(keyEvent());
    expect(get(1, 2)).toEqual({ char: 'a', fg: '#ffffff', bg: '#000000' });

    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });
    hotkey('arrowup').onHotkeyStart!(keyEvent());
    expect(get(0, 1)).toEqual({ char: 'a', fg: '#ffffff', bg: '#000000' });

    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });
    hotkey('arrowdown').onHotkeyStart!(keyEvent());
    expect(get(2, 1)).toEqual({ char: 'a', fg: '#ffffff', bg: '#000000' });

    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });
    hotkey('escape').onHotkeyStart!(keyEvent());
    expect(ws.state$.selection.get()).toBeNull();
  });

  it('selection hotkeys are no-ops while a non-select tool is active', async () => {
    const ws = await createWs();
    ws.state$.tool.set('draw');
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 2, layerId);
    ws.state$.selection.set({ start: [2, 2], end: [2, 2] });

    for (const key of ['delete', 'backspace', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown']) {
      ws.hotkeyManager.hotkeys.find((h) => h.key === key)!.onHotkeyStart!(keyEvent());
    }
    for (const key of ['c', 'x', 'v']) {
      ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.key === key)!.onHotkeyEnd!(keyEvent());
    }
    ws.hotkeyManager.hotkeys.find((h) => h.key === 'escape')!.onHotkeyStart!(keyEvent());

    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual({
      char: 'a',
      fg: '#ffffff',
      bg: '#000000',
    });
    expect(ws.state$.selection.get()).toEqual({ start: [2, 2], end: [2, 2] });
  });

  it('registers Ctrl+click and Shift+click to enter the panzoom tool', async () => {
    const ws = await createWs();
    const e = {
      pointerId: 1,
      button: 0,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
    } as PointerEvent;
    const pan = ws.toolbox.tools.panzoom as { data: { panzooming: boolean } };

    ws.hotkeyManager.hotkeys.find((h) => h.ctrl && h.mouse === 0)!.onHotkeyStart!(e);
    expect(ws.state$.tool.get()).toBe('panzoom');
    expect(pan.data.panzooming).toBe(true);

    ws.toolbox.setTool(ws.toolbox.tools.draw);
    ws.hotkeyManager.hotkeys.find((h) => h.shift && h.mouse === 0)!.onHotkeyStart!(e);
    expect(ws.state$.tool.get()).toBe('panzoom');
    expect(pan.data.panzooming).toBe(true);
  });

  it('re-renders overlays when mirror/selection/text state changes', async () => {
    const ws = await createWs();
    const mirrorSpy = vi.mocked(ws.drawboard.renderMirrorOverlay);
    const selectionSpy = vi.mocked(ws.drawboard.renderSelectionOverlay);
    const textSpy = vi.mocked(ws.drawboard.renderTextOverlay);
    mirrorSpy.mockClear();
    selectionSpy.mockClear();
    textSpy.mockClear();

    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 1, c: 1 });
    expect(mirrorSpy).toHaveBeenCalledTimes(2);

    ws.state$.selection.set({ start: [0, 0], end: [1, 1] });
    expect(selectionSpy).toHaveBeenCalledTimes(1);

    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });
    expect(textSpy).toHaveBeenCalledTimes(1);
  });

  it('render loop frames the canvas and draft screen', async () => {
    const ws = await createWs();
    const frameSpy = vi.spyOn(ws.phoxelis, 'renderFrame');
    const draftSpy = vi.spyOn(ws.draftScreen, 'renderFrame');

    const callbacks = [...rafCallbacks];
    expect(callbacks.length).toBeGreaterThan(0);
    callbacks.forEach((cb) => cb(0));

    expect(frameSpy).toHaveBeenCalled();
    expect(draftSpy).toHaveBeenCalled();
  });

  it('loadData restores exported data including branches and the ref image', async () => {
    const src = await createWs();
    src.state$.dp.set(DP);
    const srcLayer = src.state$.activeLayer.get();
    src.dispatchAction(draw, [[0, 0], [1, 1]], srcLayer);
    const exported = src.exportData();

    const ws = await createWs({
      size: exported.size,
      fontName: exported.fontName,
      data: exported.data,
    });

    const layerId = ws.state$.activeLayer.get();
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(DP);
    expect(ws.data$.layers.get()[layerId].branches.master.history.length).toBeGreaterThan(0);
    expect(ws.data$.motions.get()).toEqual(src.data$.motions.get());
    expect(ws.drawboard.setReferenceImage).toHaveBeenCalledWith(exported.data.refImage.src);
  });

  it('loadData seeds branches when a layer lacks them', async () => {
    const src = await createWs();
    const phoxelisData = src.exportPhoxelis();
    const layerId = phoxelisData.layers[0].id;
    const data: WorkspaceData = {
      phoxelis: phoxelisData,
      layers: {
        [layerId]: {
          name: 'Loaded',
          opacity: 100,
          visible: true,
          position: 0,
        } as WorkspaceData['layers'][string],
      },
      motions: {},
      refImage: { src: '', config: { panX: 0, panY: 0, scale: 1 } },
    };

    const ws = await createWs({ size: SIZE, fontName: FONT, data });
    const restored = ws.data$.layers.get()[ws.state$.activeLayer.get()];
    expect(restored.name).toBe('Loaded');
    expect(restored.branches.master).toBeDefined();
    expect(restored.branches.master.history).toHaveLength(1);
    expect(restored.branches.master.history[0]).toEqual({});
    expect(ws.data$.motions.get()).toEqual({});
  });

  it('onMounted wires up panzoom on the drawboard', async () => {
    const ws = await createWs();
    ws.onMounted();
    expect(ws.drawboard.startPanzoom).toHaveBeenCalled();
  });

  it('dispose tears down the render loop, hotkeys, color picker and drawboard', async () => {
    const ws = await createWs();
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const colorDispose = vi.spyOn(ws.colorPicker, 'dispose');
    const drawboardDispose = vi.spyOn(ws.drawboard, 'dispose');
    const elementRemove = vi.spyOn(ws.drawboard.element, 'removeEventListener');

    ws.dispose();

    expect(cancelSpy).toHaveBeenCalledWith(ws.lastAnimationFrame);
    expect(colorDispose).toHaveBeenCalled();
    expect(drawboardDispose).toHaveBeenCalled();
    expect(elementRemove).toHaveBeenCalled();
  });
});