import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { preferenceStorage } from "../lib/storage";
import type { AppId } from "../lib/apps";
import {
  clampRect,
  initialRect,
  viewport,
  type OSWindow,
  type Rect,
} from "../lib/windows";
export type Theme = "light" | "dark";
interface OSState {
  wifi: boolean;
  bluetooth: boolean;
  airdrop: boolean;
  wallpaper: string;
  toggleConnection: (key: "wifi" | "bluetooth" | "airdrop") => void;
  setWallpaper: (wallpaper: string) => void;
  theme: Theme;
  brightness: number;
  volume: number;
  focusMode: boolean;
  reducedMotion: boolean;
  dockMagnification: boolean;
  dockSize: number;
  selectedProject: string | null;
  finderPath: string;
  windows: OSWindow[];
  mobileApp: AppId | null;
  locked: boolean;
  panel:
    | "control"
    | "spotlight"
    | "launchpad"
    | "apple"
    | "notifications"
    | "file"
    | "edit"
    | "view"
    | "window"
    | "help"
    | null;
  selectedFile: string;
  notification: string | null;
  setTheme: (v: Theme) => void;
  setBrightness: (v: number) => void;
  setVolume: (v: number) => void;
  toggleFocus: () => void;
  setReducedMotion: (v: boolean) => void;
  setDockMagnification: (v: boolean) => void;
  setDockSize: (v: number) => void;
  setSelectedProject: (id: string | null) => void;
  setFinderPath: (path: string) => void;
  openApp: (app: AppId) => void;
  closeApp: (app: AppId) => void;
  focusApp: (app: AppId) => void;
  minimize: (app: AppId) => void;
  maximize: (app: AppId) => void;
  moveWindow: (app: AppId, rect: Rect) => void;
  fitWindows: () => void;
  home: () => void;
  setLocked: (v: boolean) => void;
  setPanel: (v: OSState["panel"]) => void;
  setSelectedFile: (path: string) => void;
  notify: (message: string | null) => void;
}
export const useOS = create<OSState>()(
  persist(
    (set, get) => ({
      wifi: true, bluetooth: false, airdrop: true, wallpaper: "dynamic",
      toggleConnection: key => set(s => ({ [key]: !s[key] })),
      setWallpaper: wallpaper => set({ wallpaper }),
      theme: "light",
      brightness: 1,
      volume: 0.55,
      focusMode: false,
      reducedMotion: false,
      dockMagnification: true,
      dockSize: 52,
      selectedProject: null,
      finderPath: "/Users/hamid",
      windows: [],
      mobileApp: null,
      locked: false,
      panel: null,
      selectedFile: "/Users/hamid/README.md",
      notification: null,
      setTheme: (theme) => set({ theme }),
      setBrightness: (brightness) =>
        set({ brightness: Math.min(1, Math.max(0.35, brightness)) }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
      toggleFocus: () => set((s) => ({ focusMode: !s.focusMode })),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setDockMagnification: (dockMagnification) => set({ dockMagnification }),
      setDockSize: (dockSize) => set({ dockSize: Math.min(64, Math.max(36, dockSize)) }),
      setSelectedProject: (selectedProject) => set({ selectedProject }),
      setFinderPath: (finderPath) => set({ finderPath }),
      openApp: (app) => {
        const existing = get().windows.find((w) => w.app === app);
        set((s) => ({
          windows: [
            ...s.windows.filter((w) => w.app !== app),
            existing
              ? { ...existing, minimized: false }
              : {
                  app,
                  rect: initialRect(app, s.windows.length % 4),
                  minimized: false,
                  maximized: false,
                },
          ],
          mobileApp: app,
          panel: null,
        }));
      },
      closeApp: (app) =>
        set((s) => ({
          windows: s.windows.filter((w) => w.app !== app),
          mobileApp: s.mobileApp === app ? null : s.mobileApp,
        })),
      focusApp: (app) =>
        set((s) => s.windows.at(-1)?.app === app && !s.windows.at(-1)?.minimized ? s : ({
          windows: [
            ...s.windows.filter((w) => w.app !== app),
            ...s.windows
              .filter((w) => w.app === app)
              .map((w) => ({ ...w, minimized: false })),
          ],
        })),
      minimize: (app) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.app === app ? { ...w, minimized: true } : w,
          ),
        })),
      maximize: (app) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.app === app ? { ...w, maximized: !w.maximized } : w,
          ),
        })),
      moveWindow: (app, rect) =>
        set((s) => ({
          windows: s.windows.map((w) =>
            w.app === app ? { ...w, rect: clampRect(rect, viewport(), w.app) } : w,
          ),
        })),
      fitWindows: () =>
        set((s) => ({
          windows: s.windows.map((w) => ({
            ...w,
            rect: clampRect(w.rect, viewport(), w.app),
          })),
        })),
      home: () => set({ mobileApp: null, panel: null }),
      setLocked: (locked) => set({ locked, panel: null }),
      setPanel: (panel) => set({ panel }),
      setSelectedFile: (selectedFile) => set({ selectedFile }),
      notify: (notification) => set({ notification }),
    }),
    {
      name: "macfolio.preferences.v1",
      storage: createJSONStorage(() => preferenceStorage),
      partialize: (s) => ({
        wifi: s.wifi, bluetooth: s.bluetooth, airdrop: s.airdrop, wallpaper: s.wallpaper,
        theme: s.theme,
        volume: s.volume,
        reducedMotion: s.reducedMotion,
        dockMagnification: s.dockMagnification,
        dockSize: s.dockSize,
        brightness: s.brightness,
        focusMode: s.focusMode,
      }),
    },
  ),
);
