# to do list

A Persian, RTL, local-first daily planner. React + TypeScript + Vite.

## Run locally

```sh
npm install
npm run dev
```

Production + offline testing:

```sh
npm test
npm run build
npm run preview
```

Use HTTPS when hosting, or localhost for development. The service worker is only registered in production. Vercel settings: Vite, build `npm run build`, output `dist`.

## Behavior

- Add, edit, delete and complete tasks; choose any day from the weekly calendar.
- Incomplete tasks with a date before the device's current local day appear as overdue, including after reopening the app.
- Optional 1–1440 minute countdown for each task: start, pause, resume, stop/reset. Stopping resets the timer and does not complete a task.
- Reaching zero automatically completes the task at the recorded deadline. Manual checkbox completion always works and pauses the timer. Undoing completion resets its timer.
- Timers continue by persisted wall-clock deadlines while the app is closed; on reopening, elapsed timers are reconciled. **No guaranteed background alarm or scheduled offline notification in iOS PWA.**
- Tasks stored in IndexedDB; no backend, login or cross-device synchronization. Theme preference uses localStorage. Export/import JSON merges new task IDs without overwriting current tasks.
- Three labeled sample tasks on first use; remove them in Settings.
- Light and dark themes, local Persian font, keyboard-accessible dialogs, reduced-motion support.

## Install on iPhone

Open the hosted app in Safari → Share → Add to Home Screen → Open as Web App (when available) → Add. First load must be online; offline use requires successful service-worker installation and asset caching. Browser storage can be cleared or evicted: keep a JSON backup for important tasks.

## Responsive design

Fluid layouts from 320px to desktop, viewport-fit=cover, dynamic viewport height with fallback, iPhone safe-area insets, 16px form inputs to prevent iOS zoom, independently designed mobile bottom navigation, modal viewport constraints and local fonts. Device-specific visual QA on real Safari remains required; this build environment did not provide the supported browser QA capability.

## Development structure

- `src/domain.ts`: pure date, completion and timer logic.
- `src/storage.ts`: IndexedDB persistence.
- `src/App.tsx`: task/calendar interactions and accessible dialogs.
- `src/style.css`: responsive warm white / terracotta UI.
- `scripts/build-sw.mjs`: content-versioned precache for all built assets.
- `tests/domain.test.ts`: timer expiration, pause/reset, midnight and backup validation.

All data remains in the current browser/device. Avoid editing the same dataset in multiple tabs simultaneously. A cached app update may wait until the app's existing tabs are closed.

## Android app

`mobile/` contains the independent React Native + Expo Android app, with native UI and SQLite persistence. It shares only pure task/timer/date logic with the React web app. See `mobile/README.md` for development and standalone APK build instructions. Android data and browser data are separate.

The Android demo APK targets physical ARM/ARM64 phones with Android 7 or newer. It is a release variant with an embedded JS bundle, signed with the standard demonstration key. It has not been run on a physical device in this environment. Browser and Android storage remain independent.
