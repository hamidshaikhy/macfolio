# Architecture

## Shared model and two shells

`App.tsx` selects the desktop or `Mobile.tsx` through a live media query. Phones use the phone shell below 768px; coarse-pointer devices also retain it in short landscape viewports up to 1024px. Apps are lazy-loaded with per-app error boundaries. PDF.js and CodeMirror are isolated from the initial shell.

The desktop has one window per app. Array order is focus order. Opening a minimized app restores it; maximize keeps the original rectangle. Creation, drag, resize and viewport changes clamp bounds. Gesture listeners are removed on completion and unmount. Windows are memoized independently; app content does not rerender for every coordinate change. Dock magnification batches pointer updates through animation frames, budgets growth against the viewport and subscribes to app presence rather than changing window coordinates.

Phone apps share files, preferences and music with the desktop, using one foreground app, a four-slot Dock, home grid, Control Center and lock/home gestures. Landscape compacts the home screen and gives Calculator a horizontal keypad layout.

## State

| Owner | Responsibility | Persistence |
| --- | --- | --- |
| `state/os.ts` | Windows, foreground app, panels, selected file/project, Finder path | Appearance, volume, brightness, Focus, Dock size/magnification, reduced motion |
| `state/files.ts` | Shared contents/titles, create/rename/delete/restore | Local files and Trash records |
| `state/music.ts` | Single audio element, media events, track loading, gain and playback | No autoplay or persisted playback |
| `apps/Chess.tsx` | chess.js game, selection, promotion, worker lifecycle | PGN and game mode |

Storage adapters catch access failures and avoid repeated writes of unchanged preferences. This preserves in-memory usability when browser storage is unavailable. Storage is device-local and has no cloud synchronization.

## Workspace and applications

`lib/filesystem.ts` owns canonical path resolution, folder structure, writable guards and read-only supplied entries. Finder derives folders and files from it and the shared store, with history, list/icon views, search, sort, keyboard selection and context actions. `lib/openFile.ts` routes documents, projects and music to their correct surfaces.

Files have path, content, optional title and timestamps. Deleted records receive a unique Trash identity. Saving another live file at the same path never overwrites a deleted record. Restoration preserves content and resolves name conflicts; permanently emptying Trash requires in-app confirmation. Bundled assets cannot be modified or removed.

Notes applies Markdown transformations to the actual selected text and renders a safe Markdown preview. CodeMirror owns caret, highlighting, scroll-synchronized gutters, tabs and indentation. Neither executes authored code. Both immediately save to the same store. Terminal reads current state only when executing or completing, avoiding background rerenders during note editing. Its interpreter tokenizes quotes/escapes/redirection, normalizes paths and injects supported local actions; it does not execute processes, substitutions, JavaScript or a host shell.

Safari has its own internal history. Portfolio pages render inside the app, while external destinations present an explicit normal-tab link. The curated LinkedIn profile uses supplied identity and résumé evidence, with links to the real external profile; it is not an authenticated session.

Calculator uses a pure reducer, finite-value checks and rounded display precision. Standard operations run left to right. Add/subtract percentages use the accumulator as their base; multiply/divide percentages use a fraction. Repeated equals keeps the previous operation. Division by zero produces a recoverable error. Focus and panel state gate keyboard input.

## PDF

Preview imports PDF.js and a matching worker through Vite. It reads the exact original bytes from the generated data companion, creates high-density canvases and cancellable text layers for every page, and provides thumbnails, page navigation, fit and zoom. ResizeObserver adapts the viewport; current page follows the most visible sheet. Cleanup cancels page/text tasks and destroys the loading task/document on close or retry. Chrome stays themed while the document retains its original colors. Download targets the original supplied PDF.

## Music

A session-level audio element survives app/theme/lock changes. Preloading never calls play. Original MP3 bytes are fetched once from a data companion into a Blob to avoid download-manager/range interference. If the native pipeline rejects a Blob, the same original MP3 is loaded over HTTP, without autoplay. Final failures clear playing/loading state and expose retry.

An explicit user gesture creates/resumes Web Audio where supported and attaches one MediaElementSource and gain node, providing real in-page volume on iOS. Otherwise native audio volume is used. A generation token invalidates old playback promises after pause, stop or media failures. Media events own duration, progress, buffering, ended and error state. Music cards and Chess invoke this same player. No upload, desktop selection or external streaming account is involved.

## Chess

chess.js owns all accepted moves and termination; the UI derives pieces, legal targets, FEN and history from it. Promotion requires a choice. The custom engine performs bounded iterative-deepening alpha-beta search inside `chess.worker.ts`. Position/mode/difficulty changes and unmount cancel obsolete workers; replies are checked against the current FEN before application. The engine has no claimed Elo rating or network multiplayer.

## Appearance, assets and optional tools

Shared CSS properties on `html[data-theme]` theme every surface. Original Catalina images crossfade with appearance. System and user reduced-motion preferences both suppress animation/magnification. SVG system symbols follow one filled optical family. Font, avatar, icons, pieces, PDF, audio and cover are bundled. `lib/assets.ts` and Vite worker imports resolve the configured base path.

`lib/webmcp.ts` feature-detects experimental `document.modelContext` and exposes three validated tools through the same store actions. Unsupported browsers skip registration. Mocked registry tests verify contracts; native WebMCP integration was unavailable.

## Verification boundaries

Vitest exercises logic and component behavior. Playwright uses production assets in Chrome and WebKit, checks media/PDF, interaction flows, preferences and phone sizes, and saves rendered screenshots. A second production build verifies a non-root base path. Windows WebKit lacks Web Audio and rejects Blob media; HTTP fallback is verified there, while actual decoded waveform is checked in Chrome. Emulated phones and WebKit on Windows do not establish physical iPhone/macOS Safari behavior. See `QA.md` for the final run and outstanding device checks.

## Desktop visual update

- Wi-Fi, Bluetooth and AirDrop are independent, persisted interface switches; they do not access device connectivity.
- Spotlight offers Apps, Files, Web and Settings filters and a blurred desktop. GitHub is a searchable internal application.
- GitHub and Contacts render the portfolio data in `src/lib/content.ts`; no GitHub API or embedded external profile is required.
- Calendar opens from its desktop widget or app icon. Month navigation, a list view, event creation and deletion use browser-local persistence (`macfolio.calendar.v1`).
- Wallpaper selection is independent of appearance and persists with preferences. Five additional landscape images are bundled locally.
- Maximized windows cover the browser viewport and restore their previous rectangle using the green control.
- `src/refinement.css` supplies the translucent surfaces and updated application styles.

## Profile and desktop cleanup

Contacts includes Hamid’s supplied mobile number as `+98 937 389 1553`, with a `tel:+989373891553` action and a copy control. Contact values remain centralized in `src/lib/content.ts`.

The GitHub profile uses `src/github.css`, local toolkit logos in `public/assets/toolkit/`, and native CSS illustrations for project previews. Devicon’s MIT license is included alongside the SVG assets. Section navigation opens the toolkit or project cards; profile actions open Contacts and Preview within macfolio.

Projects and Preview are excluded from the Dock, and their desktop shortcuts are removed. Both applications remain available through Launchpad, Spotlight, Finder and the existing portfolio links.

## Welcome, project case studies and résumé refresh

The initial About window is a visual welcome page with personal copy, project previews and direct links to Projects, Contacts, GitHub and Preview. About remains accessible through its left profile widget, Launchpad and Spotlight, and is excluded from the Dock.

Projects uses a theme-aware case study layout with a project-specific accent, an illustrative interface preview and contribution/challenge/outcome cards. `ProjectPreview.tsx` and `project-preview.css` are shared by About, Projects and GitHub; toolkit metadata lives in `src/lib/toolkit.ts`.

Calendar day buttons span their entire cells. Event controls sit above the day button, so deleting an event does not open the creation form. The clock widget now uses the same theme tokens as other desktop widgets.

The supplied `hamidshaikhy-cv.pdf` replaces the contents of `public/assets/resume.pdf` and its required rendering transport copy (`resume-data.txt`). SHA-256: `33d32fda6dc3d05a360deef24ec61884f04549fac20bab0d4b3bdf17acff3e19`. Both pages are rendered by the existing Preview application. The previous PDF bytes are no longer bundled.

Cleanup removed unused imports, test-only app wrappers, the obsolete static Calendar icon and 136 obsolete CSS rules from earlier About, Projects, GitHub and desktop shortcut layouts. Existing theme and mobile shell rules are retained.

## Compact utilities, mobile parity and notification center

Calculator opens at 320×510 with a 36px titlebar, no visible title, and a compact four-column keypad. `clampRect` accepts an optional app id so its 280px minimum width does not weaken other applications' 420px limit. Drag, resize, minimize and full-viewport maximize remain available. `src/shell-refinements.css` replaces the previous 56 conflicting Calculator rules and owns its portrait/landscape layouts.

Mobile derives its home icons from the desktop `dockApps` list, reserving Finder, Safari, Calculator and LinkedIn for the phone Dock and adding Trash to the grid. About opens from the profile widget; Projects and Preview open from the Selected work/My résumé links. The complete grid fits the tested 320×568 through 390×844 portrait screens and 667×375 landscape screen without page navigation. Spotlight keeps About available when landscape hides the widgets.

The menu-bar date now toggles the `notifications` panel. `NotificationCenter.tsx` renders four static sample cards without click actions; it does not use the Calendar widget or receive live mail. Its glass material follows the theme. The shared battery SVG contains a green fill and white charging bolt in both desktop and phone chrome.

Calendar now uses white/light surfaces by default and explicit dark overrides. Toolbar, adjacent-month cells, borders, list, event form and date/time inputs follow the same appearance. The old Calendar widget popover and its 11 unused CSS rules are removed.

The rewritten README embeds 17 real browser screenshots from `docs/screenshots/`. `npm run screenshots` starts a temporary production preview and captures fresh, isolated browser contexts at a fixed time; it closes the browser and preview afterward. Screenshot files stay outside the ignored QA artifacts so GitHub can display them.

## macfolio branding and saved-data compatibility

The product name, npm package, browser title, system menus, Terminal, internal Safari URLs, audio element id, export names, scripts and documentation use `macfolio`. The README's visual-inspiration sentence is removed. Personal identity and third-party license notices are preserved.

Storage now uses the `macfolio.*.v1` namespace. `readStoredValue` reads the current key first; when absent, it reads and copies the corresponding legacy key without removing the original. It still returns the original data if copying fails. The previous prefix remains only in this compatibility reader and its migration tests. Zustand stores and Chess share the reader, preserving existing preferences, files, events and games on the same browser origin.
