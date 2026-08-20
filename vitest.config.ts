import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Separate from vite.config.ts on purpose: the app config loads the PWA plugin,
// which has build side effects and slows tests down. Tests do not need it.
export default defineConfig({
  resolve: {
    alias: {
      // phoxelis's package.json points `main` at dist/phoxelis.umd.cjs, which is
      // not shipped — only the ESM build exists. Vite's browser build picks it
      // up via the `module` field, but Vitest's SSR transform resolves `main`
      // and fails. Alias the bare import to the real ESM entry so suites that
      // import the engine at runtime (e.g. Workspace tests) can resolve it.
      phoxelis: fileURLToPath(
        new URL('./.yalc/phoxelis/dist/phoxelis.js', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: false,
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      // Scope thresholds to files the current suites fully cover. As more
      // suites land (Actions/LayerManager/SelectionManager/DrawManager draw),
      // grow this list — see AGENTS.md "Testing".
      include: [
        'src/utils/rendering.ts',
        'src/utils/general.ts',
        'src/utils/session.ts',
        'src/workspace/Workspace.ts',
        'src/workspace/modules/Actions.ts',
        'src/workspace/modules/ChangesManager.ts',
        'src/workspace/modules/DrawManager.ts',
        'src/workspace/modules/HotkeyManager.ts',
        'src/workspace/modules/LayerManager.ts',
        'src/workspace/modules/SelectionManager.ts',
        'src/workspace/modules/Toolbox.ts',
        'src/workspace/modules/VersioningManager.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});