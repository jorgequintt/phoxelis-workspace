import type { Workspace } from './Workspace';

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

  const hotkeys: Hotkey[] = [
    { ctrl: true, key: 'z', onHotkeyEnd: () => ws.changesStack.undoLastChange() },
    { ctrl: true, key: 'y', onHotkeyEnd: () => ws.changesStack.redoLastChange() },
    {
      ctrl: true,
      mouse: 1,
      onHotkeyStart: (e) => {
        ws.setTool(ws.tools.panzoom);
        ws.currTool?.handlers.onPointerDown(e as PointerEvent);
      },
    },
    {
      shift: true,
      mouse: 1,
      onHotkeyStart: (e) => {
        ws.setTool(ws.tools.panzoom);
        ws.currTool?.handlers.onPointerDown(e as PointerEvent);
      },
    },
  ];
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
  window.addEventListener('keydown', handleHotkeyKeydown);
  window.addEventListener('keyup', handleHotkeyKeyup);
  ws.drawboard.addEventListener('pointerdown', (e) => {
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
  });
  ws.drawboard.addEventListener('pointerup', (e) => {
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
  });

  return { hotkeys, handleHotkeyKeydown, handleHotkeyKeyup };
}
