import { describe, expect, it } from 'vitest';
import { observable } from '@legendapp/state';
import { DrawManager } from '../../../workspace/modules/DrawManager';
import type { Workspace } from '../../../workspace/Workspace';
import type { Phox } from 'phoxelis';
import { createMockWorkspace } from '../../helpers/mockWorkspace';

function makeWs(overrides: Record<string, unknown> = {}) {
  const base = {
    state$: observable({
      dp: { char: '0', fg: '#FFFFFF', bg: '#000000' },
      drawMode: 'draw',
      activeMotionId: null as string | null,
      motionWrap: true,
      mirrorEnabled: false,
      mirrorPoint: null as { r: number; c: number } | null,
    }),
    data$: observable({
      motions: {
        m1: { id: 'm1', name: 'run', chars: ['a', 'b', 'c'] },
        empty: { id: 'empty', name: 'empty', chars: [] },
      },
    }),
    config: { size: { rows: 6, cols: 6 } },
  };
  return {
    ...base,
    ...overrides,
  } as unknown as Workspace;
}

describe('isMirroring', () => {
  it('is false when mirror is disabled or has no point', () => {
    const ws = makeWs();
    const dm = new DrawManager(ws);
    expect(dm.isMirroring()).toBe(false);

    ws.state$.mirrorEnabled.set(true);
    expect(dm.isMirroring()).toBe(false);

    ws.state$.mirrorPoint.set({ r: 2, c: 2 });
    expect(dm.isMirroring()).toBe(true);
  });
});

describe('reflectCells', () => {
  it('returns just the cell when there is no mirror point', () => {
    const dm = new DrawManager(makeWs());
    expect(dm.reflectCells(1, 2)).toEqual([[1, 2]]);
  });

  it('reflects across the point and clamps out-of-bounds cells', () => {
    const ws = makeWs();
    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 3, c: 3 });
    const dm = new DrawManager(ws);

    // Point (1,2) about (3,3) on a 6x6 grid → (1,2),(5,2),(1,4),(5,4).
    expect(dm.reflectCells(1, 2)).toEqual([
      [1, 2],
      [5, 2],
      [1, 4],
      [5, 4],
    ]);
  });

  it('drops reflections outside the canvas', () => {
    const ws = makeWs();
    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 0, c: 0 });
    const dm = new DrawManager(ws);

    // (1,2) about (0,0) → negative reflections are clamped away.
    expect(dm.reflectCells(1, 2)).toEqual([[1, 2]]);
  });

  it('de-duplicates when the cell lies exactly on the mirror point', () => {
    const ws = makeWs();
    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 2, c: 2 });
    const dm = new DrawManager(ws);
    expect(dm.reflectCells(2, 2)).toEqual([[2, 2]]);
  });
});

describe('expandPositions', () => {
  it('returns positions unchanged when mirroring is off', () => {
    const dm = new DrawManager(makeWs());
    const positions: Array<[number, number]> = [
      [0, 0],
      [1, 2],
    ];
    expect(dm.expandPositions(positions)).toEqual(positions);
  });

  it('expands each position to its reflections when mirroring is on', () => {
    const ws = makeWs();
    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 3, c: 3 });
    const dm = new DrawManager(ws);

    expect(dm.expandPositions([[1, 2]])).toEqual([
      [1, 2],
      [5, 2],
      [1, 4],
      [5, 4],
    ]);
  });

  it('de-duplicates overlapping reflections across input positions', () => {
    const ws = makeWs();
    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 3, c: 3 });
    const dm = new DrawManager(ws);

    // (1,2) and (5,4) are reflections of each other; the union has 4 cells.
    expect(dm.expandPositions([[1, 2], [5, 4]])).toHaveLength(4);
  });
});

describe('getMotionChar', () => {
  it('returns null when no motion is active', () => {
    const dm = new DrawManager(makeWs());
    expect(dm.getMotionChar()).toBeNull();
  });

  it('returns null when the motion is missing or empty', () => {
    const ws = makeWs();
    ws.state$.activeMotionId.set('does-not-exist');
    expect(new DrawManager(ws).getMotionChar()).toBeNull();

    ws.state$.activeMotionId.set('empty');
    expect(new DrawManager(ws).getMotionChar()).toBeNull();
  });

  it('cycles through chars when wrap is enabled', () => {
    const ws = makeWs();
    ws.state$.activeMotionId.set('m1');
    ws.state$.motionWrap.set(true);
    const dm = new DrawManager(ws);
    expect(dm.getMotionChar()).toBe('a');
    expect(dm.getMotionChar()).toBe('b');
    expect(dm.getMotionChar()).toBe('c');
    expect(dm.getMotionChar()).toBe('a');
  });

  it('holds the last char when wrap is disabled', () => {
    const ws = makeWs();
    ws.state$.activeMotionId.set('m1');
    ws.state$.motionWrap.set(false);
    const dm = new DrawManager(ws);
    expect(dm.getMotionChar()).toBe('a');
    expect(dm.getMotionChar()).toBe('b');
    expect(dm.getMotionChar()).toBe('c');
    expect(dm.getMotionChar()).toBe('c');
    expect(dm.getMotionChar()).toBe('c');
  });

  it('startMotionStroke resets the per-stroke cursor', () => {
    const ws = makeWs();
    ws.state$.activeMotionId.set('m1');
    ws.state$.motionWrap.set(true);
    const dm = new DrawManager(ws);
    expect(dm.getMotionChar()).toBe('a');
    dm.startMotionStroke();
    expect(dm.getMotionChar()).toBe('a');
  });
});

describe('draw', () => {
  const DP: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };
  const UNDER: Phox = { char: 'x', fg: '#111111', bg: '#222222' };

  it("'draw' writes the full dp phox", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const dm = new DrawManager(ws);
    dm.draw('draw', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(DP);
  });

  it("'char' keeps the underlying fg/bg and no-ops on empty cells", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(UNDER.char, UNDER.fg, UNDER.bg, 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draw('char', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual({
      char: 'a',
      fg: '#111111',
      bg: '#222222',
    });

    dm.draw('char', DP, 1, 1, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();
  });

  it("'fg' keeps the underlying char/bg", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(UNDER.char, UNDER.fg, UNDER.bg, 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draw('fg', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual({
      char: 'x',
      fg: '#ffffff',
      bg: '#222222',
    });
  });

  it("'bg' keeps char/fg and uses defaults on an empty cell", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(UNDER.char, UNDER.fg, UNDER.bg, 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draw('bg', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual({
      char: 'x',
      fg: '#111111',
      bg: '#000000',
    });

    dm.draw('bg', DP, 1, 1, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual({
      char: ' ',
      fg: '#ffffff',
      bg: '#000000',
    });
  });

  it("'color' keeps the underlying char and sets fg+bg", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(UNDER.char, UNDER.fg, UNDER.bg, 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draw('color', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual({
      char: 'x',
      fg: '#ffffff',
      bg: '#000000',
    });
  });

  it("'erase' removes the phox", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel(UNDER.char, UNDER.fg, UNDER.bg, 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draw('erase', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it("'motion' cycles through the active motion chars", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    ws.data$.motions.set({ m1: { id: 'm1', name: 'run', chars: ['a', 'b'] } });
    ws.state$.activeMotionId.set('m1');
    const dm = new DrawManager(ws);

    dm.draw('motion', DP, 0, 0, layerId);
    dm.draw('motion', DP, 0, 1, layerId);
    dm.draw('motion', DP, 0, 2, layerId);

    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)?.char).toBe('a');
    expect(ws.phoxelis.getPhoxFromPosition(0, 1, layerId)?.char).toBe('b');
    expect(ws.phoxelis.getPhoxFromPosition(0, 2, layerId)?.char).toBe('a');
  });

  it("'color' no-ops on an empty cell", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const dm = new DrawManager(ws);

    dm.draw('color', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it("'fg' no-ops on an empty cell", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const dm = new DrawManager(ws);

    dm.draw('fg', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it("'motion' falls back to dp.char when no motion is active", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const dm = new DrawManager(ws);

    dm.draw('motion', DP, 0, 0, layerId);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toEqual(DP);
  });
});

describe('draft', () => {
  const DP: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };

  const draftBase = () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    ws.state$.dp.set(DP);
    ws.state$.drawMode.set('draw');
    return { ws, dm: new DrawManager(ws) };
  };

  it("'draw' renders the dp onto the draft screen base layer", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual(DP);
  });

  it("'erase' drafts the red marker", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.drawMode.set('erase');
    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      char: 'D',
      fg: '#ff0000',
      bg: '#ff000055',
    });
  });

  it("'char' mode reads the underlying phox from the active layer", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.dp.set(DP);
    ws.state$.drawMode.set('char');
    ws.phoxelis.renderPhoxel('x', '#111111', '#222222', 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      char: 'a',
      fg: '#111111',
      bg: '#222222',
    });
  });

  it('respects mirror reflection', () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.mirrorEnabled.set(true);
    ws.state$.mirrorPoint.set({ r: 1, c: 1 });

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual(DP);
    expect(ws.draftScreen.getPhoxFromPosition(2, 0, baseId)).toEqual(DP);
    expect(ws.draftScreen.getPhoxFromPosition(0, 2, baseId)).toEqual(DP);
    expect(ws.draftScreen.getPhoxFromPosition(2, 2, baseId)).toEqual(DP);
  });

  it("'motion' renders the motion char onto the draft screen", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.dp.set(DP);
    ws.state$.drawMode.set('motion');
    ws.data$.motions.set({ m1: { id: 'm1', name: 'run', chars: ['a', 'b'] } });
    ws.state$.activeMotionId.set('m1');
    const dm = new DrawManager(ws);

    dm.draft(0, 0);
    dm.draft(0, 1);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      ...DP,
      char: 'a',
    });
    expect(ws.draftScreen.getPhoxFromPosition(0, 1, baseId)).toEqual({
      ...DP,
      char: 'b',
    });
  });

  it("'motion' draft falls back to dp.char when no motion is active", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.drawMode.set('motion');

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual(DP);
  });

  it("'char' mode no-ops on an empty cell", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.drawMode.set('char');

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toBeNull();
  });

  it("'color' mode reads the underlying char", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.dp.set(DP);
    ws.state$.drawMode.set('color');
    ws.phoxelis.renderPhoxel('x', '#111111', '#222222', 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      char: 'x',
      fg: '#ffffff',
      bg: '#000000',
    });
  });

  it("'color' mode no-ops on an empty cell", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.drawMode.set('color');

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toBeNull();
  });

  it("'fg' mode reads the underlying char/bg", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.dp.set(DP);
    ws.state$.drawMode.set('fg');
    ws.phoxelis.renderPhoxel('x', '#111111', '#222222', 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      char: 'x',
      fg: '#ffffff',
      bg: '#222222',
    });
  });

  it("'fg' mode no-ops on an empty cell", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.drawMode.set('fg');

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toBeNull();
  });

  it("'bg' mode reads the underlying char/fg", () => {
    const ws = createMockWorkspace({ baseLayers: 1 });
    const layerId = ws.state$.activeLayer.get();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.dp.set(DP);
    ws.state$.drawMode.set('bg');
    ws.phoxelis.renderPhoxel('x', '#111111', '#222222', 0, 0, layerId);
    const dm = new DrawManager(ws);

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      char: 'x',
      fg: '#111111',
      bg: '#000000',
    });
  });

  it("'bg' mode uses defaults on an empty cell", () => {
    const { ws, dm } = draftBase();
    const baseId = ws.draftScreen.layers[0].id;
    ws.state$.drawMode.set('bg');

    dm.draft(0, 0);
    expect(ws.draftScreen.getPhoxFromPosition(0, 0, baseId)).toEqual({
      char: ' ',
      fg: '#ffffff',
      bg: '#000000',
    });
  });
});