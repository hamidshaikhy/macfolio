import type { StateStorage } from "zustand/middleware";
/** Copy prior saved data into the new namespace without deleting the original. */
export function readStoredValue(name: string): string | null {
  try {
    const current = localStorage.getItem(name);
    if (current !== null || !name.startsWith("macfolio.")) return current;
    const legacy = localStorage.getItem(`hamidos.${name.slice("macfolio.".length)}`);
    if (legacy !== null) {
      try { localStorage.setItem(name, legacy); } catch { /* read remains usable if storage is full */ }
    }
    return legacy;
  } catch {
    return null;
  }
}
/** Avoid synchronous storage writes during transient window/panel updates. */
export const preferenceStorage: StateStorage = {
  getItem: readStoredValue,
  setItem: (name, value) => {
    try {
      if (localStorage.getItem(name) !== value)
        localStorage.setItem(name, value);
    } catch {
      /* private mode / quota: preferences remain usable in memory */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* no storage available */
    }
  },
};
