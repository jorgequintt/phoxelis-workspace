# PWA & Offline Mode

Phoebis is a Progressive Web App (PWA). It can be **installed** on desktop and mobile
(Chromium / Safari / Firefox) and works **fully offline** after the first visit.

This document explains how the PWA is implemented and how to alter it yourself.

## How it works

The PWA is built with [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/guide/)
using the **`generateSW`** strategy (Workbox). During `vite build`, the plugin:

1. Generates a **service worker** (`dist/sw.js`) that **precaches** every file your app
   needs to run offline: the JS/CSS bundles, `index.html`, the generated app icons, and —
   critically — the **BDF font files**.
2. Generates **`manifest.webmanifest`** — the install metadata (name, icons, colors,
   display mode).
3. Auto-generates the **icon set** from `public/favicon.svg` via
   [`@vite-pwa/assets-generator`](https://vite-pwa-org.netlify.app/assets-generator/).
4. Injects the `<link rel="manifest">`, `<meta name="theme-color">`, favicon links, and
   an `apple-touch-icon` into the built `index.html`.

> **Why the BDF fonts matter for offline:** the Phoxelis engine loads each font at
> runtime with `fetch('/fonts/<name>.bdf')` (see `.yalc/phoxelis` `fontLoader.js`). These
> requests are served from the `public/fonts/` directory. The service worker precaches
> them (via `globPatterns`), so the browser answers those `fetch` calls from cache — no
> network needed. If you ever add a new font, make sure it's under `public/fonts/` so it
> is picked up by the `bdf` glob.

Everything else the app needs is already local: documents are saved to the browser's
Origin Private File System (`navigator.storage.getDirectory()`), the last document id is
in `localStorage`, and all libraries are bundled. So precaching the assets is all that's
required for full offline support.

## Files involved

| File | Role |
| --- | --- |
| `vite.config.ts` | The single source of truth: `VitePWA({...})` config (manifest, icons, caching) |
| `src/main.ts` | Registers the service worker via `virtual:pwa-register` and shows the update prompt |
| `src/editor/react/atoms/PwaUpdateMessage.tsx` | The "Reload" button rendered inside the update notification |
| `public/favicon.svg` | The source image all PWA icons are generated from |
| `tsconfig.json` | Includes `vite-plugin-pwa/client` types (so `virtual:pwa-register` type-checks) |
| `docs/PWA.md` | This document |

## How to change the install metadata (name, colors, …)

Everything lives in the `manifest` block of `VitePWA` in `vite.config.ts`:

```ts
manifest: {
  name: 'Phoebis — ASCII Art Editor',   // full name shown on install / app launcher
  short_name: 'Phoebis',                // compact name (home screen / taskbar)
  description: 'A browser-based phoxel/ASCII art editor',
  theme_color: '#1A1B1E',               // browser UI + address bar tint when installed
  background_color: '#1A1B1E',          // splash screen while the app launches
  display: 'standalone',                // 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
  start_url: '/',
  scope: '/',
}
```

Edit the values and rebuild. The full list of supported fields is in the
[Web App Manifest spec](https://developer.mozilla.org/en-US/docs/Web/Manifest)
(e.g. `orientation`, `lang`, `categories`, … — just add them to the object).

## How to change the icons

1. Replace the art in `public/favicon.svg`.
2. Rebuild: `npm run build`.

During the build, `pwaAssets` regenerates every icon from that SVG into `dist/`:

- `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`
- `maskable-icon-512x512.png` (used for adaptive/home-screen icons)
- `apple-touch-icon-180x180.png` (iOS add-to-home-screen)
- `favicon.ico`

To use a different source image or a different icon preset, change the `pwaAssets` block:

```ts
pwaAssets: {
  preset: 'minimal-2023',      // see @vite-pwa/assets-generator presets
  image: 'public/favicon.svg', // or e.g. 'public/logo.png'
},
```

## How to change the offline / caching strategy

The `workbox` block controls what gets precached and how:

```ts
workbox: {
  // Files precached at install time. Includes BDF fonts + generated icons.
  globPatterns: ['**/*.{js,css,html,svg,png,ico,bdf}'],
  cleanupOutdatedCaches: true, // remove old precache entries after an update
}
```

- **Precaching** (cache-first at install) is the right choice for app code, styles, and
  the fonts — they never change without a redeploy.
- If you ever fetch external data (e.g. a remote image), add a **runtime cache** rule
  instead, e.g.:

  ```ts
  workbox: {
    runtimeCaching: [
      {
        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
        handler: 'NetworkFirst',
        options: { cacheName: 'api-cache' },
      },
    ],
  }
  ```

See the [Workbox generateSW docs](https://developer.chrome.com/docs/workbox/reference/workbox-build/#method-generateSW)
for all options (cache sizes, expiration, navigation fallback, …).

## How to change the update behaviour

`registerType` is `'prompt'` (default). When you ship a new build, the service worker
finds new precache assets and calls `onNeedRefresh()`; the app shows a Mantine
notification with a **Reload** button. The user chooses when to reload, so a deploy
never interrupts someone mid-stroke.

- The prompt flow is wired in `src/main.ts` via `registerSW({ onNeedRefresh, onOfflineReady })`.
- To switch to **silent auto-update** (the app reloads itself in the background), change
  `registerType: 'autoUpdate'` in `vite.config.ts` and simplify `src/main.ts` (you can
  then drop the `onNeedRefresh` notification and keep `onOfflineReady`).

## Development vs production

The service worker is **not** active during `npm run dev` (vite-plugin-pwa default).
PWA features only exist in the production build, so test with:

```bash
npm run build
npm run preview
```

### Testing checklist

1. Open `http://localhost:4173` in Chrome.
2. DevTools → **Application** → **Service Workers**: confirm `sw.js` is registered and
   **activated**.
3. DevTools → **Application** → **Cache Storage**: confirm the precache contains the JS,
   CSS, `index.html`, icons, and all 5 `fonts/*.bdf` files.
4. DevTools → **Network** → check **Offline**, then reload the page. The app must boot,
   load fonts, and let you draw.
5. DevTools → **Application** → **Manifest**: click **Install** (or use the address-bar
   install icon) to verify the install flow and launch behaviour.

## Troubleshooting

- **App not installable:** installability requires a valid manifest + icons + a
  registered service worker over HTTPS (localhost is exempt). Re-check the testing
  checklist above.
- **Fonts don't load offline:** the `.bdf` glob in `globPatterns` must include the font
  files. Confirm `fonts/*.bdf` appears in the precache (step 3 above).
- **Stale app after deploy:** the "New version available" prompt appears; clicking
  **Reload** re-activates the new service worker. If a user ignores it, the new version
  takes over on their next visit.
- **Build fails on `virtual:pwa-register`:** make sure `"vite-plugin-pwa/client"` is in
  `compilerOptions.types` in `tsconfig.json`.
- **`dev-dist/` appearing:** that's the plugin's dev-mode output; it is gitignored.

## Related docs

- [vite-plugin-pwa Guide](https://vite-pwa-org.netlify.app/guide/)
- [@vite-pwa/assets-generator](https://vite-pwa-org.netlify.app/assets-generator/)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
