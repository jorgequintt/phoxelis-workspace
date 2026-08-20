import { describe, expect, it, vi } from 'vitest';
import { createHotkeyManager } from '../../../workspace/modules/HotkeyManager';
import { createMockWorkspace } from '../../helpers/mockWorkspace';

const keyEvent = (partial: Partial<KeyboardEvent>): KeyboardEvent =>
  ({
    key: '',
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
    ...partial,
  }) as unknown as KeyboardEvent;

describe('createHotkeyManager', () => {
  it('matches a hotkey on keydown and fires onHotkeyStart + onHotkeyEnd on keyup', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const start = vi.fn();
    const end = vi.fn();
    hkm.hotkeys.push({ ctrl: true, key: 'z', onHotkeyStart: start, onHotkeyEnd: end });

    hkm.handleHotkeyKeydown(keyEvent({ key: 'Z', ctrlKey: true }));
    expect(start).toHaveBeenCalledTimes(1);

    hkm.handleHotkeyKeyup(keyEvent({ key: 'z', ctrlKey: true }));
    expect(end).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1); // no double start on keyup
  });

  it('ignores keydown when mods or key do not match', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const start = vi.fn();
    hkm.hotkeys.push({ ctrl: true, key: 'z', onHotkeyStart: start });

    hkm.handleHotkeyKeydown(keyEvent({ key: 'z' })); // no ctrl
    hkm.handleHotkeyKeydown(keyEvent({ key: 'x', ctrlKey: true })); // wrong key
    hkm.handleHotkeyKeydown(keyEvent({ key: 'z', ctrlKey: true, shiftKey: true })); // extra shift
    expect(start).not.toHaveBeenCalled();
  });

  it('fires onHotkeyEnd on keyup even without a prior keydown (stray keyup)', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const end = vi.fn();
    hkm.hotkeys.push({ key: 'a', onHotkeyEnd: end });

    hkm.handleHotkeyKeyup(keyEvent({ key: 'a' }));
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('ends the down hotkey and a differently-matched hotkey on a modified keyup', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const plainEnd = vi.fn();
    const shiftedEnd = vi.fn();
    hkm.hotkeys.push({ ctrl: true, key: 'z', onHotkeyEnd: plainEnd });
    hkm.hotkeys.push({ ctrl: true, shift: true, key: 'z', onHotkeyEnd: shiftedEnd });

    hkm.handleHotkeyKeydown(keyEvent({ key: 'z', ctrlKey: true }));
    hkm.handleHotkeyKeyup(keyEvent({ key: 'z', ctrlKey: true, shiftKey: true }));

    expect(plainEnd).toHaveBeenCalledTimes(1); // down hotkey ends (matched by key)
    expect(shiftedEnd).toHaveBeenCalledTimes(1); // different hotkey matches the released mods
  });

  it('does not fire onHotkeyEnd on keyup when nothing matches', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const end = vi.fn();
    hkm.hotkeys.push({ ctrl: true, key: 'z', onHotkeyEnd: end });

    hkm.handleHotkeyKeyup(keyEvent({ key: 'q', ctrlKey: true }));
    expect(end).not.toHaveBeenCalled();
  });

  it('routes mouse-button hotkeys through pointer events on the drawboard element', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const start = vi.fn();
    const end = vi.fn();
    hkm.hotkeys.push({ mouse: 2, onHotkeyStart: start, onHotkeyEnd: end });

    const down = new Event('pointerdown');
    Object.assign(down, { button: 2, ctrlKey: false, altKey: false, shiftKey: false });
    ws.drawboard.element.dispatchEvent(down);
    expect(start).toHaveBeenCalledTimes(1);

    const up = new Event('pointerup');
    Object.assign(up, { button: 2, ctrlKey: false, altKey: false, shiftKey: false });
    ws.drawboard.element.dispatchEvent(up);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('ignores pointer events whose button does not match', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const start = vi.fn();
    hkm.hotkeys.push({ mouse: 2, onHotkeyStart: start });

    const down = new Event('pointerdown');
    Object.assign(down, { button: 0, ctrlKey: false, altKey: false, shiftKey: false });
    ws.drawboard.element.dispatchEvent(down);
    expect(start).not.toHaveBeenCalled();
  });

  it('fires onHotkeyEnd on pointerup even without a prior pointerdown', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const end = vi.fn();
    hkm.hotkeys.push({ mouse: 1, onHotkeyEnd: end });

    const up = new Event('pointerup');
    Object.assign(up, { button: 1, ctrlKey: false, altKey: false, shiftKey: false });
    ws.drawboard.element.dispatchEvent(up);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('dispose() removes the window and element listeners', () => {
    const ws = createMockWorkspace();
    const hkm = createHotkeyManager(ws);
    const start = vi.fn();
    hkm.hotkeys.push({ ctrl: true, key: 'z', onHotkeyStart: start });

    hkm.dispose();

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    expect(start).not.toHaveBeenCalled();

    const down = new Event('pointerdown');
    Object.assign(down, { button: 2, ctrlKey: false, altKey: false, shiftKey: false });
    hkm.hotkeys.push({ mouse: 2, onHotkeyStart: start });
    ws.drawboard.element.dispatchEvent(down);
    expect(start).not.toHaveBeenCalled();
  });
});