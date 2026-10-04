import type { StateStorage } from "zustand/middleware";
/** Avoid synchronous storage writes during transient window/panel updates. */
export const preferenceStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
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
