import { vi } from 'vitest';

// Environment shims. Tests run under happy-dom, which lacks these; the app
// modules touch them (render loop, getFont). Stub them so future suites that
// import engine modules don't crash.
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  return setTimeout(() => cb(performance.now()), 16) as unknown as number;
});
vi.stubGlobal('cancelAnimationFrame', (id: number) => {
  clearTimeout(id);
});

// Phoxelis' getFont() fetches BDF fonts over the network. Unit tests never
// need real fonts; later engine-touching suites will `vi.mock('phoxelis')`
// entirely. Keep a benign fetch stub in place so accidental network calls
// fail fast instead of hanging.
vi.stubGlobal('fetch', () => Promise.reject(new Error('fetch() called in test')));