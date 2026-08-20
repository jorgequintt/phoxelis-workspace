import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChangesManager } from '../../../workspace/modules/ChangesManager';
import type { Change } from '../../../workspace/modules/Actions';

function makeChange(id: string, log: string[]): Change {
  return {
    execute: () => log.push(`${id}:execute`),
    undo: () => log.push(`${id}:undo`),
  };
}

describe('ChangesManager', () => {
  let manager: ChangesManager;
  let log: string[];

  beforeEach(() => {
    manager = new ChangesManager();
    log = [];
  });

  it('runs undo in LIFO order and keeps the change for redo', () => {
    manager.addChange(makeChange('a', log));
    manager.addChange(makeChange('b', log));

    manager.undoLastChange();
    manager.undoLastChange();

    expect(log).toEqual(['b:undo', 'a:undo']);
    expect(manager.redoHistory).toHaveLength(2);
  });

  it('redoLastChange re-executes and pushes back onto history', () => {
    manager.addChange(makeChange('a', log));
    manager.undoLastChange();
    manager.redoLastChange();

    expect(log).toEqual(['a:undo', 'a:execute']);
    expect(manager.changesHistory).toHaveLength(1);
    expect(manager.redoHistory).toHaveLength(0);
  });

  it('a full undo/redo cycle returns the document to its original state', () => {
    const change = makeChange('a', log);
    manager.addChange(change);
    manager.undoLastChange();
    manager.redoLastChange();
    manager.undoLastChange();

    expect(log).toEqual(['a:undo', 'a:execute', 'a:undo']);
  });

  it('clears the redo stack when a new change is added', () => {
    manager.addChange(makeChange('a', log));
    manager.undoLastChange();
    expect(manager.redoHistory).toHaveLength(1);

    manager.addChange(makeChange('b', log));
    expect(manager.redoHistory).toHaveLength(0);
  });

  it('warns and no-ops when there is nothing to undo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager.undoLastChange();
    expect(warn).toHaveBeenCalledWith('Nothing to undo');
    expect(manager.redoHistory).toHaveLength(0);
    warn.mockRestore();
  });

  it('warns and no-ops when there is nothing to redo', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager.redoLastChange();
    expect(warn).toHaveBeenCalledWith('Nothing to redo');
    expect(manager.changesHistory).toHaveLength(0);
    warn.mockRestore();
  });

  it('caps the history at 100 steps, dropping the oldest', () => {
    const changes: Change[] = [];
    for (let i = 1; i <= 105; i++) {
      const change = makeChange(`c${i}`, log);
      changes.push(change);
      manager.addChange(change);
    }
    expect(manager.changesHistory).toHaveLength(100);

    // c1..c5 were shifted out; c6..c105 remain in insertion order.
    expect(manager.changesHistory[0]).toBe(changes[5]);
    expect(manager.changesHistory[99]).toBe(changes[104]);
  });
});