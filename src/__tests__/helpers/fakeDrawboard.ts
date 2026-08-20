import { vi } from 'vitest';

/**
 * Builds a drawboard-shaped stub for tests that exercise the Toolbox,
 * HotkeyManager, or Workspace without a real Drawboard (which needs panzoom,
 * hammer, canvas overlays and the Phoxelis engine's canvas).
 *
 * - `element` is a real happy-dom `<div>` so `addEventListener` /
 *   `removeEventListener` work; pointer-capture and layout calls are stubbed.
 * - `mousePos` is a mutable `{ x, y }` that shape tools read to emit cells.
 * - `hammer` and the two panzoom objects are `vi.fn()` stubs.
 * - Overlay render methods are no-ops.
 */
export function createFakeDrawboard() {
  const element = document.createElement('div');
  element.setPointerCapture = vi.fn();
  element.releasePointerCapture = vi.fn();
  element.getBoundingClientRect = () =>
    ({ width: 100, height: 100, top: 0, left: 0, right: 100, bottom: 100, x: 0, y: 0 } as DOMRect);

  const scale = 1;
  const refImageScale = 1;
  const refImage = { img: document.createElement('img'), wrapper: document.createElement('div') };

  const makePanzoom = () => ({
    pan: vi.fn(),
    zoom: vi.fn(),
    getScale: () => scale,
    getPan: () => ({ x: 0, y: 0 }),
    reset: vi.fn(),
    destroy: vi.fn(),
  });

  const fakeDrawboard = {
    element,
    mousePos: { x: -1, y: -1 },
    refImage,
    mirrorOverlay: document.createElement('canvas'),
    selectionOverlay: document.createElement('canvas'),
    textOverlay: document.createElement('canvas'),
    hammer: {
      on: vi.fn(),
      off: vi.fn(),
      get: vi.fn(),
      destroy: vi.fn(),
    },
    scale,
    refImageScale,
    panzoom: null as ReturnType<typeof makePanzoom> | null,
    refImagePanzoom: null as ReturnType<typeof makePanzoom> | null,
    startPanzoom: vi.fn(() => {
      fakeDrawboard.panzoom = makePanzoom();
      fakeDrawboard.refImagePanzoom = makePanzoom();
    }),
    setReferenceImage: vi.fn((base64: string) => {
      refImage.img.src = base64;
      fakeDrawboard.refImageScale = 1;
      fakeDrawboard.refImagePanzoom?.reset();
    }),
    renderMirrorOverlay: vi.fn(),
    renderSelectionOverlay: vi.fn(),
    renderTextOverlay: vi.fn(),
    getReferenceImageConfig: vi.fn(() => ({
      src: refImage.img.src,
      config: {
        panX: fakeDrawboard.refImagePanzoom?.getPan().x ?? 0,
        panY: fakeDrawboard.refImagePanzoom?.getPan().y ?? 0,
        scale: fakeDrawboard.refImagePanzoom?.getScale() ?? 1,
      },
    })),
    dispose: vi.fn(),
    handleWindowMouseOut: vi.fn(),
  };

  return fakeDrawboard;
}

export type FakeDrawboard = ReturnType<typeof createFakeDrawboard>;