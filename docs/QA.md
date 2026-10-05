# QA — macfolio upgrade

Verification date: 2026-10-04. Local Windows environment, Node 24.18.0, installed Google Chrome 154.0.8037.97 and Playwright WebKit 26.6. Fresh browser contexts begin without local files or saved preferences.

## Commands

```bash
npm ci
npm test
npm run build
npm run test:browser:install
npm run test:browser
```

`npm test` passes **35 tests in five files**. TypeScript strict compilation and the production build pass. `npm audit` reports **zero known vulnerabilities** across production and development dependencies at verification time.

The browser suite contains **24 scenarios** across Chrome and WebKit. Checks exercise real production assets, not mocked PDF rendering or mocked browser audio playback. Each normal page is observed for JavaScript exceptions and failed first-party resource responses. Screenshots and HTML reports are written to `artifacts/` and ignored by source control.

## Coverage

| Surface | Evidence |
| --- | --- |
| Desktop 1440×900 and narrow 800×650 | Light/Dark, Dock neighbor magnification, viewport limits, active window focus, drag, minimize/reopen, close, maximize/restore dimensions |
| Shared workspace | Finder locations/history/views/sort/read-only assets → fresh Notes title/content/formatting → editable CodeMirror indentation → Terminal read/delete → Trash restores the same contents |
| File edge cases | Canonical paths, quote/escape/redirection parsing, protected media, rename collisions/invalid names, saving a replacement while preserving the deleted original |
| Calculator | Decimal precision, chained/repeated operators/equals, context-aware percentage, sign, clear/backspace, divide-by-zero and input limits; real keyboard and phone keys |
| LinkedIn | Actual supplied identity, correct external LinkedIn URL, contact mailto and useful local professional profile |
| PDF | Both original pages rendered to nonblank high-density canvas with actual text layers; thumbnails, current page, next/back, zoom, fit, original download and fast close/reopen cleanup |
| Audio | Original MP3/data-companion SHA-256 equality; paused before Play, native duration around 283.5s, advancing current time, decoded nonzero waveform in Chrome, mute/unmute, seek, pause/stop/restart and shared Chess/lock state |
| Navigation | Safari internal history, safe address handling and real external destination links; Spotlight exact-name priority and keyboard activation; Launchpad and File-menu New Note |
| Preferences | Theme, Focus, magnification and reduced motion change the actual interface and survive reload; wallpaper returns to the original Light image |
| Phones | 390×844, 375×667, 320×568 and 667×375; all 13 applications, full-screen back navigation, horizontal overflow checks, PDF/chess/calculator/audio controls; dedicated Safari history/address/résumé actions at every size |
| Touch rotation | Phone shell and four-slot Dock stay on screen at 844×390; Calculator state survives rotation back to portrait |
| Chess | Real legal moves and worker response; automated illegal-move/undo/promotion/engine legality/mate checks; retained off-thread computation and stale-position protection |

Rendered desktop, phone, Light/Dark, app interiors and reference app screenshots were inspected. Small-phone Calculator clipping and landscape home-screen Dock placement were repaired. Control Center contrast was adjusted after the WebKit visual review.

## Non-root production base

A separate build was created with:

```bash
npx vite build --base /macfolio/ --outDir artifacts/base-build
npx vite preview --base /macfolio/ --outDir artifacts/base-build --port 5182
node scripts/verify-base.mjs http://127.0.0.1:5182/macfolio/
```

Both Chrome and WebKit passed direct opening/reload, avatar/assets, both PDF pages, local PDF worker URL, actual MP3 playback, appearance changes without pausing, a computer chess reply through the correctly based worker, and loading the Code editor. No page exceptions or failed first-party responses were observed in these base-path checks.

The supplied originals remain byte-identical. PDF SHA-256: `bbc9c3656f123cd53f1df9b17067a32ece9af46f1e24cf2624ae10382add7d66`. MP3 SHA-256: `852aaa2b1676fda3f74a3b1677d292e7d609e0c42da044ec93b7a756a5bf5b50`. Build/dev preparation copies them to data companions without transcoding.

## Exact limits

- Physical iPhone Safari, macOS Safari and physical touch gestures were unavailable. Responsive viewport checks and a touch-emulated orientation test do not replace device testing of safe areas, dynamic browser chrome or audio policy.
- Windows WebKit in this environment has no Web Audio API and rejects MP3 Blob URLs. The application automatically loads the original MP3 over HTTP there. Actual native playback/time/duration/seek are verified; decoded waveform inspection is performed in Chrome. [Playwright documents platform-dependent codec differences and the distinction from branded Safari](https://playwright.dev/docs/browsers#webkit).
- Speakers/headphones were not evaluated as hardware outputs. Decoding is verified by audio time progression and a nonzero actual analyser signal in Chrome.
- Optional native WebMCP was unavailable; registry/actions are covered with a mocked contract test.
- The custom chess engine has no claimed Elo rating; two-player mode is local to one device. No deployment or account authentication was performed.
- PDF.js and CodeMirror remain lazy app chunks. Vite reports the large editor chunk as a size advisory; it is not loaded by the initial shell.

Before publishing publicly, repeat the actual-device checks on an iPhone and Safari on a Mac. The updated workspace includes the original media, dependency lockfile, tests, asset preparation and local run instructions.


## Visual update regression check

Run `npx playwright test tests/browser/refinement.spec.mjs --project=chrome` after `npm run build`.
This checks independent connection toggles, GitHub search priority and internal navigation, full viewport sizing and restoration, contact data, calendar month navigation and event persistence/deletion, wallpaper persistence and calculator arithmetic. Screenshots are saved under `artifacts/qa/refinement-*.png`.

Wallpaper sources (downloaded and served locally): Unsplash photos `photo-1464822759023-fed622ff2c3b`, `photo-1472396961693-142e6e269027`, `photo-1509316785289-025f5b846b35`, `photo-1518837695005-2083093ee35b`, `photo-1531366936337-7c912a4589a7`.

The profile regression also checks the international mobile `tel:` link, absence of Projects/Preview desktop and Dock shortcuts, loaded toolkit logos, access to Projects through GitHub, and the GitHub layout at a 390 px mobile viewport. Additional profile, toolkit and fullscreen screenshots are generated in `artifacts/qa/`.

## Welcome and résumé refresh — 2026-10-05

The production build, all 35 unit tests, and TypeScript's unused-local/unused-parameter checks pass. The Chrome experience and refinement files verified 13 browser scenarios across the full run and the corrected wallpaper-test rerun. Wallpaper selection and theme selection are now tested independently.

The calendar regression clicks the blank area of a day cell, checks the date in the event form, and verifies that deleting an event does not reopen that form. It also checks that About is absent from the Dock and that the clock and calendar widgets share the same light-theme background. Existing PDF, audio, window, shared-file, mobile and navigation checks remain covered.

The replacement two-page résumé supersedes the PDF hash recorded in the earlier baseline above. The supplied PDF, `public/assets/resume.pdf`, its decoded data companion and the production copy have the same SHA-256: `33d32fda6dc3d05a360deef24ec61884f04549fac20bab0d4b3bdf17acff3e19`. Both pages render in Preview.

Reviewed screenshots: `artifacts/qa/welcome-light.png`, `welcome-dark.png`, `welcome-mobile.png`, `projects-light.png`, `projects-finance.png`, `projects-dark.png` and `resume-new.png`.

## Compact Calculator, mobile home and README — 2026-10-05

The final production build, all 35 unit tests and TypeScript's unused-local/unused-parameter checks pass. The complete Chrome browser suite passes **18/18 tests**; the new shell regression also passes **5/5 tests in WebKit**. The phone experience tests now visit GitHub, Calendar and Contacts in addition to the previous applications.

```bash
npm test
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npm run build
npx playwright test --project=chrome
npx playwright test tests/browser/shell-polish.spec.mjs --project=webkit
npm run screenshots
```

The shell regression checks the 320×510 Calculator window, visible last keypad row, arithmetic, informational notification cards with no action targets, the green battery and charging bolt, a white Calendar in Light mode, a light event form and the preserved dark Calendar. Mobile checks assert that all 13 home/Dock app buttons fit without scrolling at 390×844, 375×667, 320×568 and 667×375. Projects/Preview icons are absent; the Selected work/My résumé links still open the correct apps and both PDF pages. The wider regression verifies window restoration, rotation, files, music, search and saved preferences.

The README is rewritten and its **17 real screenshots** are stored in the non-ignored `docs/screenshots/` directory. All 45 local image/document references resolve. Screenshot capture was rerun against the final build, and the compact Calculator, light Calendar, notifications, desktop welcome and small-phone layouts were inspected visually. Device-testing limits from the earlier baseline still apply; WebKit on Windows is not physical iPhone Safari.

## macfolio rename — 2026-10-05

The production build, unused-symbol TypeScript check and **42 unit tests** pass. The 18 Chrome regression cases pass after rebranding; the additional branding browser test also passes, confirming that saved preferences, a note, an event and a local chess position from the previous namespace load correctly. Old saved values remain available while the new keys are populated.

All 17 README screenshots were recaptured from the renamed production build. Local README references resolve; the previous product name and the requested visual-inspiration sentence are absent from the README. The older storage prefix remains only in compatibility code and migration fixtures.
