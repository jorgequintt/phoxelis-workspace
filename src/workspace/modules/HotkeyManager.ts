import type { Workspace } from '../Workspace';

export function createHotkeyManager(ws: Workspace) {
  // MARK: Hotkeys
  interface Hotkey {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    key?: string;
    mouse?: number;
    onHotkeyStart?: (e: KeyboardEvent | PointerEvent) => void;
    onHotkeyEnd?: (e: KeyboardEvent | PointerEvent) => void;
  }

  const hotkeys: Hotkey[] = [];
  const downHotkeys: Hotkey[] = [];

  const handleHotkeyKeydown = (e: KeyboardEvent) => {
    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.key.toLocaleLowerCase() === h.key,
    );
    if (matchingHotkey) {
      matchingHotkey.onHotkeyStart?.(e);
      downHotkeys.push(matchingHotkey);
    }
  };
  const handleHotkeyKeyup = (e: KeyboardEvent) => {
    const matchinDownHotkey = downHotkeys.find(
      (h) => e.key.toLocaleLowerCase() === h.key,
    );
    if (matchinDownHotkey) {
      matchinDownHotkey.onHotkeyEnd?.(e);
      downHotkeys.splice(downHotkeys.indexOf(matchinDownHotkey), 1);
    }

    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.key.toLocaleLowerCase() === h.key,
    );
    if (matchingHotkey == matchinDownHotkey) {
      // do nothing as we already ended the hotkey
    } else if (matchingHotkey) {
      matchingHotkey.onHotkeyEnd?.(e);
    }
  };

  const handlePointerDown = (e: PointerEvent) => {
    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.button === h.mouse,
    );
    if (matchingHotkey) {
      matchingHotkey.onHotkeyStart?.(e);
      downHotkeys.push(matchingHotkey);
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    const matchinDownHotkey = downHotkeys.find((h) => e.button === h.mouse);
    if (matchinDownHotkey) {
      matchinDownHotkey.onHotkeyEnd?.(e);
      downHotkeys.splice(downHotkeys.indexOf(matchinDownHotkey), 1);
    }

    const matchingHotkey = hotkeys.find(
      (h) =>
        !!h.ctrl === e.ctrlKey &&
        !!h.alt === e.altKey &&
        !!h.shift === e.shiftKey &&
        e.button === h.mouse,
    );
    if (matchingHotkey == matchinDownHotkey) {
      // do nothing as we already ended the hotkey
    } else if (matchingHotkey) {
      matchingHotkey.onHotkeyEnd?.(e);
    }
  };

  window.addEventListener('keydown', handleHotkeyKeydown);
  window.addEventListener('keyup', handleHotkeyKeyup);
  ws.drawboard.element.addEventListener('pointerdown', handlePointerDown);
  ws.drawboard.element.addEventListener('pointerup', handlePointerUp);

  const dispose = () => {
    window.removeEventListener('keydown', handleHotkeyKeydown);
    window.removeEventListener('keyup', handleHotkeyKeyup);
    ws.drawboard.element.removeEventListener('pointerdown', handlePointerDown);
    ws.drawboard.element.removeEventListener('pointerup', handlePointerUp);
  };

  return { hotkeys, handleHotkeyKeydown, handleHotkeyKeyup, dispose };
}
