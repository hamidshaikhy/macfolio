# Five independent applications

Barg, Hamnava, Personal Finance, To Do List and Koja Berim are real applications built from pinned source in `integrations/`. They share Macfolio's deployment and origin, but each keeps its own React version, lockfile, CSS, fonts, document, storage logic and build. Upstream repositories are unchanged. No APK was rebuilt; To Do List's existing downloadable release and checksum are preserved.

| App | Standalone URL | Source commit |
| --- | --- | --- |
| Barg | `/apps/barg/` (editor: `/apps/barg/builder`) | `062a89867dbba22894d8675c2bfcaf94b1515f1c` |
| Hamnava | `/apps/hamnava/` | `3226da9a2888c01057bb4c99cef436304ae4e222` |
| Personal Finance | `/apps/personal-finance/` | `b565c84ae91867a15a85015683798751072f3e3e` |
| To Do List | `/apps/todo/` | `4e057da6294191f54024b1e0d62e32bea3fb6b07` |
| Koja Berim | `/apps/koja-berim/` | `879ebe9227742e2dddf2e05939bdcbae2d026570` |

Repository URLs and exact pins are also in `integrations/sources.json`. These URLs are available locally and in the production build; the public domain receives them when this branch is deployed. Personal Finance is a separate project from the older Financial Panel; both remain in the project collection. The five app demos appear in Projects, GitHub cards, Safari's project list and the standalone portfolio.

## Install, run and build

Use Node 22.13+ (tested with Node 24.18) and npm:

```sh
npm ci
npm run dev
```

Root `postinstall` runs `npm run apps:install`, installing each child with its own lockfile, including build tools. If the root installation intentionally uses `--ignore-scripts`, run `npm run apps:install` afterward. Native Android dependencies are not installed or built.

Development uses the existing single Vite process. The integration middleware starts each child's own Vite server in-process on its first prefixed request; no extra terminal or external demo is required. It serves source updates through that child's compiler. Child manifests and APK URLs are prefixed in source too, so development downloads and assets work.

```sh
npm run build
npm run preview
```

The main build runs first; `scripts/build-integrations.mjs` then builds each child and copies its output into `dist/apps/<id>/`. A failed child stops the build with its app name and a nonzero exit. Production never clones GitHub or resolves a floating upstream branch. `vercel.json` and the preview middleware handle slash/no-slash entry URLs and Barg's builder deep link; assets keep their real paths and are not rewritten to Macfolio HTML. Barg uses a prefix-aware BrowserRouter instead of the upstream HashRouter to support the requested `/apps/barg/builder` refresh.

## Windows and lifecycle

`src/lib/integrated-apps.ts` contains only small metadata. `AppView` loads the shared `EmbeddedApp` wrapper on demand. No child iframe, bundle, font, API request or worker is created before opening that app. Desktop and mobile use the existing shell; each titlebar has a real **OPEN FULL** link with `target="_blank"` and `rel="noopener noreferrer"`. About's existing `/portfolio` link and automatic startup remain intact.

The iframe occupies the content area and responds to its actual viewport. Document isolation protects Macfolio's layout from child global CSS and RTL changes. No sandbox is applied: these are trusted same-origin applications, and storage, Web Crypto, forms, printing, downloads and links remain available. Same-origin iframes are not a security boundary against hostile JavaScript.

DOM ordering is stable; z-index follows the existing focus order. React keys alone do not prevent an iframe reloading when an ancestor is moved in the DOM. Opening another window, focus, drag, resize, minimize, restoring or Dock hover leave the running child intact. Minimize/home hides the instance and pauses visual animations; To Do List reconciles timestamp-based timers on return. Hamnava never starts playback automatically; user-started playback continues minimized. Closing removes the iframe and listeners and stops its runtime. Mobile home preserves opened children; the five apps appear in an explicit home list, with Finder, Safari, Calculator and Contacts in its Dock.

Each child sends ready after React commits, and sends focus from pointer/focus events. The small typed bridge accepts only ready, focus and visibility messages. Origin, exact frame source, app ID and instance UUID are checked; target origin is explicit. It has no arbitrary navigation, execution, settings or account-data commands. Loading, timeout/error and retry are displayed inside the app's window; an HTML load event alone never marks it ready.

Notes and LinkedIn internal apps, launchers, shortcuts, icon assets and lazy imports are removed. Existing note files and storage remain; Finder, Terminal and Spotlight open them in Code. Contact/portfolio/Safari LinkedIn links remain normal external links.

## Storage and PWA scope

URL paths do not partition origin storage. The audited names do not collide:

| App | Persistent namespace |
| --- | --- |
| Macfolio | `macfolio.*` preferences/files/calendar/chess |
| Barg | `barg:resume`, `barg:intro-theme` |
| Hamnava | IndexedDB `music-pwa-local`; localStorage `music-session` |
| Personal Finance | IndexedDB `personal-finance-vault-v1` |
| To Do List | IndexedDB `rooz-planner`; localStorage `rooz-theme` |

No storage names, accounts or encryption were merged. Finance retains PBKDF2/AES-GCM encryption, independent users, revision checks and encrypted backup handling. Another document must sign in again; passwords and decryption keys never cross the bridge. Same-app saved data is shared between its window and standalone URL; unsaved forms and in-memory sessions are not. Data on an older external domain is not automatically transferred: use that app's existing export/import flow. There is no new SSO or cloud synchronization.

Hamnava, Finance and To Do List register workers only at their own `/apps/<id>/sw.js`, scoped to that prefix, in standalone production use. Embedded registration and install prompts are disabled. Each manifest has its own id/start URL/scope/icons. The root build creates these workers after the child builds, replacing upstream root-scope generators. Cache names start with `macfolio-<id>-shell-`; cleanup and lookup target only that child's cache. Fetches outside its prefix, APIs, audio and APK downloads are not intercepted or precached. Old workers/caches belonging to Macfolio or other apps are not removed. Barg does not add a worker.

Hamnava streams real Audius music and requires internet/provider access. The existing Macfolio music player is unchanged. Finance and To Do List retain their own offline shell and local data behavior.

## Updating vendored source

Keep upstream changes separate from compatibility edits:

1. Make a review branch. Clone the original repository into a temporary directory and check out a specific commit, not a floating branch during deployment.
2. Apply `integrations/patches/<id>.patch` from this repository in that clean checkout (`git apply --check --index <absolute-patch-path>` first, then `git apply --index`). The patches record the base, router, bridge, assets, manifest, build and embedded-mode changes against the pins above. Resolve patch conflicts against the new upstream source deliberately.
3. Replace `integrations/<id>/` with the reviewed source, retaining upstream documentation/licenses and excluding `.git`, `node_modules`, generated `dist` and test artifacts. Keep the new upstream lockfile; update `integrations/sources.json` to its exact commit. Refresh that compatibility patch against the new clean upstream. Recopy any deliberately changed app icons to the small root icon assets; the Dock's custom dollar/music icons are intentionally independent of upstream PWA icons.
4. Run `npm run apps:install`, root/child tests, `npm run build` and the integration browser tests. Verify prefix assets, nested routes, storage, PWA isolation, lazy loading and exports before publishing. Never resolve a patch conflict by importing the child into Macfolio's main React root.

`integrations/bridge.tsx` is the reference bridge source; each child contains its matching local `src/macfolio-bridge.tsx` so its TypeScript/build boundaries remain independent. Keep all copies synchronized when changing the protocol.

## Verification

```sh
npm test
npm --prefix integrations/hamnava test
npm --prefix integrations/personal-finance test
npm --prefix integrations/todo test
npm run build
npx playwright test tests/browser/integrated-apps.spec.mjs tests/browser/integrated-behaviors.spec.mjs
npm run test:apps:ui
```

Barg has no upstream test command; its typecheck/build and actual browser editing/Word/PDF/font checks are included. The root unit suite tests registry consistency and rejects forged bridge messages. Browser tests cover loading, focus/drag/resize/minimize/restore/close, standalone links/deep links/refresh, saved tasks and hidden timer reconciliation, financial user separation/stale writes, CSV/encrypted backup and actual Word/PDF downloads. Music tests use provider fixtures and decoded audio; `node scripts/check-hamnava-live.mjs` separately exercises real Audius catalog/search/playback in Chrome (preview on port 5180).

Cold-load measurements and test results are recorded in [INTEGRATION-QA.md](INTEGRATION-QA.md). Tests are browser emulation, not a real phone/iPad run. Headless tests inspect print styling/fonts and download actual image PDFs; the native Save-as-PDF dialog still needs manual checking. Playwright WebKit offline navigation produced an internal engine error; worker scopes, caches and controller separation are tested there, while offline reloads are tested in Chrome. No push, merge or deployment is performed by this integration task.

## Koja Berim

Koja Berim uses the same lazy wrapper and bridge, with explicit geolocation permission delegation. Location is requested only through the app's user controls. IndexedDB `koja-berim-v1` keeps saved places, collections, notes and cached city data separate from the other apps. Shares remove embedded-window instance parameters. The source SVG location marker is used for the Dock without its decorative lower-right dot.

Default maps use Leaflet/OpenStreetMap with no key. Fresh tiles, remote discovery and directions require internet. The optional upstream Neshan backend remains disabled; the vendored server source is retained but not deployed as a Macfolio API. The standalone service worker owns `/apps/koja-berim/` only; place photographs are excluded from its precache. Real upstream screenshots illustrate discovery, metro and mobile views in all project galleries.
