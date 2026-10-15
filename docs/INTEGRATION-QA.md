# Embedded apps verification

Integration completed locally on `feature/embedded-apps`. No push, merge or deployment was performed. Source pins, routes and reproduction commands are in [INTEGRATIONS.md](INTEGRATIONS.md).

## Executed checks

| Check | Result |
| --- | --- |
| Root production build and four isolated child builds/typechecks | Passed |
| Root unit suite | 44 passed |
| Personal Finance unit suite | 38 passed |
| Hamnava unit suite | 21 passed |
| To Do List unit suite | 10 passed |
| Hamnava upstream UI scenarios, Chromium and WebKit | 8 passed |
| New integration browser scenarios, Chromium and WebKit | 46 scenarios validated; initial failures corrected and targeted reruns passed |
| Existing browser regression scenarios | 78 scenarios exercised; 67 passed initially, 11 failures corrected and targeted reruns passed |
| Final focus, Dock geometry, project navigation and iframe lifecycle rerun | 6 passed across Chromium and WebKit |
| Development routes: four standalone apps and Barg builder deep link/refresh | 5 passed |
| Compatibility patches against clean pinned upstream checkouts | All four passed `git apply --check --index` |

Browser coverage includes lazy loading; validated ready/focus messages; focus, drag, resize, minimize, restore and close; persistent iframe instances; standalone links and refresh; Barg nested builder URLs, editing, autosave and actual Word/image-PDF downloads; To Do List saved tasks and hidden timer reconciliation; financial account separation, stale writes, CSV and encrypted backup; music search, playback, minimize continuity and close teardown. Notes documents remain accessible through the editor after removal of the internal Notes app. External LinkedIn links remain available.

Responsive checks exercise widths 320, 375, 390, 430, 768, 1024 and 1440 in browser emulation. Existing portrait, appearance, footer and project case-study checks were retained. Project-count expectations now include the distinct Personal Finance project; navigation fractions were updated for nine portfolio entries.

## Cold-load comparison

Measured with `scripts/measure-integration-load.mjs`, fresh Chromium contexts at 1440 × 900 against local production previews. Baseline is commit `39eafaf`; final measurements use the integration build. Sampling ends 2.5 seconds after the hero becomes visible. Analytics responses are stubbed. Bytes below are decoded response-body sizes, not compressed transfer sizes.

| Route | Requests before → after | JS bytes before → after | CSS bytes before → after | Child requests / iframes before opening an app |
| --- | --- | --- | --- | --- |
| `/` | 52 → 46 | 375,976 → 381,860 | 161,334 → 162,261 | 0 / 0 |
| `/portfolio` | 33 → 33 | 318,848 → 323,954 | 161,217 → 162,144 | 0 / 0 |

Initial JavaScript increases by 5,884 bytes on `/` and 5,106 bytes on `/portfolio`; CSS increases by 927 bytes. Child runtimes are absent from the cold load. Request counts depend on resources completed within the sampling window and do not establish a speed improvement.

Local raw reports are in the ignored `artifacts/integration-measurements/before.json` and `after.json`; the script can reproduce them.

## Cost when opening apps

Measured by `scripts/measure-open-apps.mjs`, opening each app in the same desktop session with provider fixtures and no external media downloads. Counts and decoded bytes are cumulative response events per app, including repeated responses; they are not unique bundle sizes or memory measurements.

| App | Requests | JS bytes | CSS bytes | All response bytes |
| --- | --- | --- | --- | --- |
| Barg | 14 | 374,439 | 98,210 | 1,052,686 |
| Hamnava | 12 | 295,097 | 70,169 | 723,208 |
| Personal Finance | 7 | 325,617 | 37,224 | 439,232 |
| To Do List | 12 | 261,910 | 28,553 | 443,243 |

Four iframes exist after explicitly opening all four apps. Closing an app removes its iframe. Minimizing preserves the instance and saved state. Raw local report: `artifacts/integration-measurements/open-apps.json`.

## Live music and limits

`scripts/check-hamnava-live.mjs` successfully exercised the real Audius catalog, search and decoded stream playback in Chromium, both standalone and embedded. The played track was “Rowsfred - CLAWN (Original Mix) [Eclipse Records]” (`GEG9ZWx`). Embedded playback continued while minimized, and closing removed the iframe. The automated fixture tests also use a real audio decoder; WebKit uses a same-origin MP3 fixture because native media requests bypass Playwright request routing.

Scoped service-worker registration, caches and controller separation were verified in both engines; actual offline reloads passed in Chromium. Playwright WebKit offline navigation produced an internal engine error, so Safari offline reload remains a manual check. Browser emulation does not replace testing on physical phones/iPads. Headless checks cover print fonts/layout and actual image-PDF downloads; the native Save-as-PDF dialog needs manual verification. The upstream APK is retained; no new native APK was built. Streaming music still requires internet access.
