import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Phox } from 'phoxelis';
import { Toolbox, toolDefs } from '../../../workspace/modules/Toolbox';
import { createMockWorkspace } from '../../helpers/mockWorkspace';
import type { Workspace } from '../../../workspace/Workspace';

const DP: Phox = { char: 'a', fg: '#ffffff', bg: '#000000' };

function makeWs(rows = 6, cols = 6) {
  const ws = createMockWorkspace({ baseLayers: 1, rows, cols });
  ws.state$.dp.set(DP);
  const tb = new Toolbox(ws);
  return { ws, tb };
}

function keyEvent(partial: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: '',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    target: null,
    preventDefault: vi.fn(),
    ...partial,
  } as unknown as KeyboardEvent;
}

function seedGlyphs(ws: Workspace, chars: string[]) {
  for (const ch of chars) {
    ws.font.characters[ch.codePointAt(0)!] = [[0]];
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function stubClipboard(readText: () => Promise<string>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { readText: vi.fn(readText) },
  });
}

afterEach(() => {
  delete (navigator as { clipboard?: unknown }).clipboard;
  vi.restoreAllMocks();
});

describe('toolDefs', () => {
  it('defines all tools with name/icon/tooltip', () => {
    const names = toolDefs.map((t) => t.name);
    expect(names).toEqual([
      'select',
      'draw',
      'rect',
      'filledRect',
      'line',
      'ellipse',
      'filledEllipse',
      'text',
    ]);
    for (const def of toolDefs) {
      expect(def.icon).toBeTruthy();
      expect(def.tooltip).toBeTruthy();
    }
  });
});

describe('Toolbox class', () => {
  it('defaults to the draw tool and syncs state$.tool', () => {
    const { ws, tb } = makeWs();
    expect(tb.currentTool?.tool.name).toBe('draw');
    expect(ws.state$.tool.get()).toBe('draw');
  });

  it('creates all nine tools', () => {
    const { tb } = makeWs();
    expect(Object.keys(tb.tools)).toEqual([
      'panzoom',
      'select',
      'draw',
      'line',
      'rect',
      'filledRect',
      'ellipse',
      'filledEllipse',
      'text',
    ]);
  });

  it('setTool switches by name and remembers the previous tool', () => {
    const { ws, tb } = makeWs();
    tb.setTool('line');
    expect(tb.currentTool?.tool.name).toBe('line');
    expect(ws.state$.tool.get()).toBe('line');
    expect(tb.previousTool?.name).toBe('draw');
  });

  it('setTool throws for an unknown tool name', () => {
    const { tb } = makeWs();
    expect(() => tb.setTool('nope')).toThrow('No tool by name');
  });

  it('re-wires DOM, window and hammer listeners when switching tools', () => {
    const { ws, tb } = makeWs();
    const elementAdd = vi.spyOn(ws.drawboard.element, 'addEventListener');
    const elementRemove = vi.spyOn(ws.drawboard.element, 'removeEventListener');
    const hammerOn = vi.spyOn(ws.drawboard.hammer, 'on');
    const hammerOff = vi.spyOn(ws.drawboard.hammer, 'off');
    const windowAdd = vi.spyOn(window, 'addEventListener');
    const windowRemove = vi.spyOn(window, 'removeEventListener');
    elementAdd.mockClear();
    hammerOn.mockClear();
    windowAdd.mockClear();

    tb.setTool('rect');
    expect(elementAdd).toHaveBeenCalled();
    expect(windowAdd).toHaveBeenCalled();
    expect(hammerOn).toHaveBeenCalled();

    tb.setTool('line');
    expect(elementRemove).toHaveBeenCalled();
    expect(windowRemove).toHaveBeenCalled();
    expect(hammerOff).toHaveBeenCalled();
  });

  it('clears the selection when switching away from select', () => {
    const { ws, tb } = makeWs();
    ws.state$.selection.set({ start: [0, 0], end: [1, 1] });
    tb.setTool('select');
    expect(ws.state$.selection.get()).not.toBeNull();

    tb.setTool('draw');
    expect(ws.state$.selection.get()).toBeNull();
  });

  it('resumePreviousTool switches back and abortCurrentTool aborts', () => {
    const { tb } = makeWs();
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    tb.setTool('line');
    tb.resumePreviousTool();
    expect(tb.currentTool?.tool.name).toBe('draw');

    tb.abortCurrentTool();
    expect(tb.currentTool?.tool.name).toBe('draw');
    expect(logSpy).toHaveBeenCalled();
  });

  it('pointer-down while selecting the mirror point sets it and exits the mode', () => {
    const { ws, tb } = makeWs();
    ws.state$.mirrorSelectingPoint.set(true);
    ws.drawboard.mousePos = { x: 3, y: 4 };

    tb.currentTool!.handlers.onPointerDown({
      pointerId: 1,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
    } as PointerEvent);

    expect(ws.state$.mirrorPoint.get()).toEqual({ r: 4, c: 3 });
    expect(ws.state$.mirrorSelectingPoint.get()).toBe(false);
  });

  it('pointer-down while mirror-selecting is skipped when a modifier is held', () => {
    const { ws, tb } = makeWs();
    ws.state$.mirrorSelectingPoint.set(true);
    ws.drawboard.mousePos = { x: 3, y: 4 };
    const tool = tb.tools.draw;
    const spy = vi.spyOn(tool, 'onPointerDown');

    tb.currentTool!.handlers.onPointerDown({
      pointerId: 1,
      ctrlKey: true,
      shiftKey: false,
      altKey: false,
    } as PointerEvent);

    expect(spy).toHaveBeenCalled();
    expect(ws.state$.mirrorPoint.get()).toBeNull();
  });
});

describe('draw tool (freehand)', () => {
  it('drafts cells and commits them through dispatchAction on pointer-up', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    const baseId = ws.draftScreen.layers[0].id;
    const tool = tb.tools.draw;

    ws.drawboard.mousePos = { x: 1, y: 2 };
    tool.onPointerDown!({} as PointerEvent);
    expect(ws.draftScreen.getPhoxFromPosition(2, 1, baseId)).toEqual(DP);

    ws.drawboard.mousePos = { x: 1, y: 3 };
    tool.onCellChange!({} as CustomEvent);
    expect(ws.draftScreen.getPhoxFromPosition(3, 1, baseId)).toEqual(DP);

    tool.onPointerUp!({} as PointerEvent);
    expect(ws.phoxelis.getPhoxFromPosition(2, 1, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(3, 1, layerId)).toEqual(DP);
    expect(ws.changesManager.changesHistory).toHaveLength(1);
    expect(ws.draftScreen.getPhoxFromPosition(2, 1, baseId)).toBeNull();
  });

  it('respects the pencil radius', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.state$.pencilRadius.set(1);
    const tool = tb.tools.draw;

    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onPointerDown!({} as PointerEvent);
    tool.onPointerUp!({} as PointerEvent);

    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('pointer-up without a stroke does not dispatch', () => {
    const { tb } = makeWs();
    tb.tools.draw.onPointerUp!({} as PointerEvent);
    expect(tb.ws.changesManager.changesHistory).toHaveLength(0);
  });

  it('abort clears the draft', () => {
    const { ws, tb } = makeWs();
    const baseId = ws.draftScreen.layers[0].id;
    const tool = tb.tools.draw;
    ws.drawboard.mousePos = { x: 1, y: 2 };
    tool.onPointerDown!({} as PointerEvent);
    expect(ws.draftScreen.getPhoxFromPosition(2, 1, baseId)).toEqual(DP);

    tool.abort!();
    expect(ws.draftScreen.getPhoxFromPosition(2, 1, baseId)).toBeNull();
  });
});

describe('shape tools', () => {
  it('line submits a Bresenham stroke', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    const tool = tb.tools.line;

    ws.drawboard.mousePos = { x: 1, y: 1 };
    tool.onPointerDown!({} as PointerEvent);
    ws.drawboard.mousePos = { x: 4, y: 1 };
    tool.onCellChange!({} as CustomEvent);
    tool.onPointerUp!({} as PointerEvent);

    for (let c = 1; c <= 4; c++) {
      expect(ws.phoxelis.getPhoxFromPosition(1, c, layerId)).toEqual(DP);
    }
    expect(ws.phoxelis.getPhoxFromPosition(1, 0, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(1, 5, layerId)).toBeNull();
    expect(ws.changesManager.changesHistory).toHaveLength(1);
  });

  it('rect draws only the perimeter', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    const tool = tb.tools.rect;

    ws.drawboard.mousePos = { x: 1, y: 1 };
    tool.onPointerDown!({} as PointerEvent);
    ws.drawboard.mousePos = { x: 3, y: 3 };
    tool.onPointerUp!({} as PointerEvent);

    for (const r of [1, 3]) {
      for (let c = 1; c <= 3; c++) {
        expect(ws.phoxelis.getPhoxFromPosition(r, c, layerId)).toEqual(DP);
      }
    }
    for (const r of [1, 2, 3]) {
      expect(ws.phoxelis.getPhoxFromPosition(r, 1, layerId)).toEqual(DP);
      expect(ws.phoxelis.getPhoxFromPosition(r, 3, layerId)).toEqual(DP);
    }
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toBeNull();
  });

  it('filledRect fills the whole block', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    const tool = tb.tools.filledRect;

    ws.drawboard.mousePos = { x: 1, y: 1 };
    tool.onPointerDown!({} as PointerEvent);
    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onPointerUp!({} as PointerEvent);

    for (const r of [1, 2]) {
      for (const c of [1, 2]) {
        expect(ws.phoxelis.getPhoxFromPosition(r, c, layerId)).toEqual(DP);
      }
    }
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(3, 3, layerId)).toBeNull();
  });

  it('ellipse draws the outline ring', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    const tool = tb.tools.ellipse;

    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onPointerDown!({} as PointerEvent);
    ws.drawboard.mousePos = { x: 4, y: 4 };
    tool.onPointerUp!({} as PointerEvent);

    expect(ws.phoxelis.getPhoxFromPosition(0, 2, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(4, 2, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(2, 0, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(2, 4, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toBeNull();
  });

  it('filledEllipse fills the interior and skips far rows', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    const tool = tb.tools.filledEllipse;

    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onPointerDown!({} as PointerEvent);
    ws.drawboard.mousePos = { x: 4, y: 4 };
    tool.onPointerUp!({} as PointerEvent);

    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(0, 2, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(4, 2, layerId)).toEqual(DP);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(4, 4, layerId)).toBeNull();
  });

  it('submit with no start position is a no-op', () => {
    const { ws, tb } = makeWs();
    const tool = tb.tools.rect;
    tool.submit!();
    tool.onPointerUp!({} as PointerEvent);
    expect(ws.changesManager.changesHistory).toHaveLength(0);
  });

  it('abort resets the draft', () => {
    const { ws, tb } = makeWs();
    const baseId = ws.draftScreen.layers[0].id;
    const tool = tb.tools.filledRect;
    ws.drawboard.mousePos = { x: 1, y: 1 };
    tool.onPointerDown!({} as PointerEvent);
    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onCellChange!({} as CustomEvent);
    expect(ws.draftScreen.getPhoxFromPosition(1, 1, baseId)).toEqual(DP);

    tool.abort!();
    expect(ws.draftScreen.getPhoxFromPosition(1, 1, baseId)).toBeNull();
  });
});

describe('select tool', () => {
  it('starts a new selection when clicking outside an existing one', () => {
    const { ws, tb } = makeWs();
    const tool = tb.tools.select;

    ws.drawboard.mousePos = { x: 0, y: 0 };
    tool.onPointerDown!({ button: 0 } as PointerEvent);
    expect(ws.state$.selection.get()).toEqual({ start: [0, 0], end: [0, 0] });

    ws.drawboard.mousePos = { x: 3, y: 2 };
    tool.onCellChange!({} as CustomEvent);
    expect(ws.state$.selection.get()).toEqual({ start: [0, 0], end: [2, 3] });

    tool.onPointerUp!({} as PointerEvent);
  });

  it('drags an existing selection and clears the source', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });
    const tool = tb.tools.select;

    ws.drawboard.mousePos = { x: 1, y: 1 };
    tool.onPointerDown!({ button: 0 } as PointerEvent);
    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onCellChange!({} as CustomEvent);
    tool.onPointerUp!({} as PointerEvent);

    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)).toEqual(DP);
  });

  it('ignores non-primary buttons', () => {
    const { ws, tb } = makeWs();
    tb.tools.select.onPointerDown!({ button: 2 } as PointerEvent);
    expect(ws.state$.selection.get()).toBeNull();
  });

  it('abort cancels an in-progress move', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 1, 1, layerId);
    ws.state$.selection.set({ start: [1, 1], end: [1, 1] });
    const tool = tb.tools.select;

    ws.drawboard.mousePos = { x: 1, y: 1 };
    tool.onPointerDown!({ button: 0 } as PointerEvent);
    ws.drawboard.mousePos = { x: 2, y: 2 };
    tool.onCellChange!({} as CustomEvent);
    tool.abort!();

    expect(ws.state$.selection.get()).toEqual({ start: [1, 1], end: [1, 1] });
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toEqual(DP);
    expect(ws.state$.selectionMove.get()).toBeNull();
  });
});

describe('text tool', () => {
  it('places the cursor on primary pointer down', () => {
    const { ws, tb } = makeWs();
    ws.drawboard.mousePos = { x: 2, y: 3 };
    tb.tools.text.onPointerDown!({ button: 0 } as PointerEvent);
    expect(ws.state$.textCursor.get()).toEqual({ r: 3, c: 2, startC: 2 });
  });

  it('ignores non-primary buttons on pointer down', () => {
    const { ws, tb } = makeWs();
    tb.tools.text.onPointerDown!({ button: 2 } as PointerEvent);
    expect(ws.state$.textCursor.get()).toBeNull();
  });

  it('types a glyph and advances the cursor', () => {
    const { ws, tb } = makeWs();
    seedGlyphs(ws, ['a']);
    const layerId = ws.state$.activeLayer.get();
    ws.drawboard.mousePos = { x: 1, y: 2 };
    tb.tools.text.onPointerDown!({ button: 0 } as PointerEvent);

    const e = keyEvent({ key: 'a' });
    tb.tools.text.onKeyDown!(e);

    expect(ws.phoxelis.getPhoxFromPosition(2, 1, layerId)).toEqual({
      char: 'a',
      fg: '#ffffff',
      bg: '#000000',
    });
    expect(ws.state$.textCursor.get()).toEqual({ r: 2, c: 2, startC: 1 });
    expect(e.preventDefault).toHaveBeenCalled();
  });

  it('skips glyphs absent from the font but still advances', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'x' }));
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
    expect(ws.state$.textCursor.get()).toEqual({ r: 0, c: 1, startC: 0 });
  });

  it('ignores key presses with modifiers held', () => {
    const { ws, tb } = makeWs();
    seedGlyphs(ws, ['a']);
    const layerId = ws.state$.activeLayer.get();
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'a', ctrlKey: true }));
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('ignores key presses when the target is an input', () => {
    const { ws, tb } = makeWs();
    seedGlyphs(ws, ['a']);
    const layerId = ws.state$.activeLayer.get();
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });
    const input = document.createElement('input');

    tb.tools.text.onKeyDown!(keyEvent({ key: 'a', target: input }));
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('is a no-op without a cursor', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.state$.textCursor.set(null);

    tb.tools.text.onKeyDown!(keyEvent({ key: 'a' }));
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('Escape clears the cursor', () => {
    const { ws, tb } = makeWs();
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });
    tb.tools.text.onKeyDown!(keyEvent({ key: 'Escape' }));
    expect(ws.state$.textCursor.get()).toBeNull();
  });

  it('Enter and arrow keys move the cursor', () => {
    const { ws, tb } = makeWs();
    const tool = tb.tools.text;
    ws.state$.textCursor.set({ r: 2, c: 2, startC: 1 });

    tool.onKeyDown!(keyEvent({ key: 'Enter' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 3, c: 1, startC: 1 });

    tool.onKeyDown!(keyEvent({ key: 'ArrowLeft' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 3, c: 0, startC: 1 });

    tool.onKeyDown!(keyEvent({ key: 'ArrowUp' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 2, c: 0, startC: 1 });

    tool.onKeyDown!(keyEvent({ key: 'ArrowRight' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 2, c: 1, startC: 1 });

    tool.onKeyDown!(keyEvent({ key: 'ArrowDown' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 3, c: 1, startC: 1 });
  });

  it('Backspace erases the previous cell and moves left', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 1, layerId);
    ws.state$.textCursor.set({ r: 2, c: 2, startC: 2 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'Backspace' }));
    expect(ws.phoxelis.getPhoxFromPosition(2, 1, layerId)).toBeNull();
    expect(ws.state$.textCursor.get()).toEqual({ r: 2, c: 1, startC: 2 });
  });

  it('Backspace at the left edge does nothing', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'Backspace' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 0, c: 0, startC: 0 });
    expect(ws.changesManager.changesHistory).toHaveLength(0);
    expect(ws.phoxelis.getPhoxFromPosition(0, 0, layerId)).toBeNull();
  });

  it('Delete erases the next cell', () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    ws.phoxelis.renderPhoxel('a', '#ffffff', '#000000', 2, 3, layerId);
    ws.state$.textCursor.set({ r: 2, c: 2, startC: 2 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'Delete' }));
    expect(ws.phoxelis.getPhoxFromPosition(2, 3, layerId)).toBeNull();
    expect(ws.state$.textCursor.get()).toEqual({ r: 2, c: 3, startC: 2 });
  });

  it('Delete at the right edge does nothing', () => {
    const { ws, tb } = makeWs(6, 6);
    ws.state$.textCursor.set({ r: 0, c: 5, startC: 0 });
    tb.tools.text.onKeyDown!(keyEvent({ key: 'Delete' }));
    expect(ws.state$.textCursor.get()).toEqual({ r: 0, c: 5, startC: 0 });
    expect(ws.changesManager.changesHistory).toHaveLength(0);
  });

  it('pastes multi-line clipboard text as glyphs', async () => {
    const { ws, tb } = makeWs();
    seedGlyphs(ws, ['a', 'b', 'c', 'd']);
    const layerId = ws.state$.activeLayer.get();
    stubClipboard(() => Promise.resolve('ab\ncd'));
    ws.state$.textCursor.set({ r: 1, c: 1, startC: 1 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'v', ctrlKey: true }));
    await flush();

    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)?.char).toBe('a');
    expect(ws.phoxelis.getPhoxFromPosition(1, 2, layerId)?.char).toBe('b');
    expect(ws.phoxelis.getPhoxFromPosition(2, 1, layerId)?.char).toBe('c');
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)?.char).toBe('d');
    expect(ws.changesManager.changesHistory).toHaveLength(1);
  });

  it('paste with empty text draws nothing', async () => {
    const { ws, tb } = makeWs();
    const layerId = ws.state$.activeLayer.get();
    stubClipboard(() => Promise.resolve(''));
    ws.state$.textCursor.set({ r: 1, c: 1, startC: 1 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'v', ctrlKey: true }));
    await flush();
    expect(ws.changesManager.changesHistory).toHaveLength(0);
    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)).toBeNull();
  });

  it('paste skips glyphs missing from the font', async () => {
    const { ws, tb } = makeWs();
    seedGlyphs(ws, ['a', 'b']);
    const layerId = ws.state$.activeLayer.get();
    stubClipboard(() => Promise.resolve('aX\nYb'));
    ws.state$.textCursor.set({ r: 1, c: 1, startC: 1 });

    tb.tools.text.onKeyDown!(keyEvent({ key: 'v', ctrlKey: true }));
    await flush();

    expect(ws.phoxelis.getPhoxFromPosition(1, 1, layerId)?.char).toBe('a');
    expect(ws.phoxelis.getPhoxFromPosition(2, 2, layerId)?.char).toBe('b');
    expect(ws.phoxelis.getPhoxFromPosition(1, 2, layerId)).toBeNull();
    expect(ws.phoxelis.getPhoxFromPosition(2, 1, layerId)).toBeNull();
  });

  it('paste swallows clipboard read errors', async () => {
    const { ws, tb } = makeWs();
    stubClipboard(() => Promise.reject(new Error('denied')));
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });

    expect(() =>
      tb.tools.text.onKeyDown!(keyEvent({ key: 'v', ctrlKey: true })),
    ).not.toThrow();
    await flush();
    expect(ws.changesManager.changesHistory).toHaveLength(0);
  });

  it('abort clears the cursor', () => {
    const { ws, tb } = makeWs();
    ws.state$.textCursor.set({ r: 0, c: 0, startC: 0 });
    tb.tools.text.abort!();
    expect(ws.state$.textCursor.get()).toBeNull();
  });
});

describe('panzoom tool', () => {
  const pinchInput = (partial: Record<string, unknown>): never =>
    ({ scale: 1, velocityX: 0, velocityY: 0, ...partial }) as never;

  it('pans when dragging with ctrl held and resumes the previous tool on release', () => {
    const { ws, tb } = makeWs();
    ws.drawboard.startPanzoom();
    tb.setTool(tb.tools.panzoom);
    const tool = tb.tools.panzoom;

    tool.onPointerDown!({ ctrlKey: true, shiftKey: false } as PointerEvent);
    tool.onPointerMove!({ movementX: 20, movementY: 10 } as PointerEvent);
    expect(ws.drawboard.panzoom!.pan).toHaveBeenCalledWith(20, 10);

    tool.onPointerUp!({} as PointerEvent);
    expect(tb.currentTool?.tool.name).toBe('draw');
  });

  it('zooms when dragging with shift held', () => {
    const { ws, tb } = makeWs();
    ws.drawboard.startPanzoom();
    tb.setTool(tb.tools.panzoom);
    const tool = tb.tools.panzoom;

    tool.onPointerDown!({ ctrlKey: false, shiftKey: true } as PointerEvent);
    tool.onPointerMove!({ movementX: 0, movementY: 35 } as PointerEvent);
    expect(ws.drawboard.panzoom!.zoom).toHaveBeenCalledWith(0);
  });

  it('does not pan on move unless a drag started', () => {
    const { ws, tb } = makeWs();
    ws.drawboard.startPanzoom();
    const tool = tb.tools.panzoom;
    tool.onPointerMove!({ movementX: 5, movementY: 5 } as PointerEvent);
    expect(ws.drawboard.panzoom!.pan).not.toHaveBeenCalled();
  });

  it('logs an error when no panzoom target exists', () => {
    const { tb } = makeWs();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tool = tb.tools.panzoom;

    tool.onPointerDown!({ ctrlKey: true } as PointerEvent);
    tool.onPointerMove!({ movementX: 1, movementY: 1 } as PointerEvent);
    tool.onPinchStart!({} as never);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('pinch zooms and pans the panzoom target', () => {
    const { ws, tb } = makeWs();
    ws.drawboard.startPanzoom();
    tb.setTool(tb.tools.panzoom);
    const tool = tb.tools.panzoom;

    tool.onPinchStart!({} as never);
    tool.onPinchMove!(pinchInput({ scale: 2, velocityX: 10, velocityY: 5 }));
    expect(ws.drawboard.panzoom!.zoom).toHaveBeenCalledWith(2);
    expect(ws.drawboard.panzoom!.pan).toHaveBeenCalledWith(110, 55);

    tool.onPinchEnd!({} as never);
    expect(tb.currentTool?.tool.name).toBe('draw');
  });

  it('pinch adjusts the reference image while moving it', () => {
    const { ws, tb } = makeWs();
    ws.state$.movingRefImage.set(true);
    ws.drawboard.startPanzoom();
    const tool = tb.tools.panzoom;

    tool.onPinchStart!({} as never);
    expect(ws.drawboard.refImageScale).toBe(1);

    tool.onPinchMove!(pinchInput({ scale: 3 }));
    expect(ws.drawboard.refImagePanzoom!.zoom).toHaveBeenCalledWith(3);
  });

  it('onPointerUp without an active drag does nothing', () => {
    const { ws, tb } = makeWs();
    ws.drawboard.startPanzoom();
    tb.setTool(tb.tools.panzoom);
    tb.tools.panzoom.onPointerUp!({} as PointerEvent);
    expect(tb.currentTool?.tool.name).toBe('panzoom');
  });
});