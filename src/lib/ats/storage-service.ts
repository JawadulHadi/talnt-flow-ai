import type { StateStorage } from "zustand/middleware";

/**
 * Storage adapter used by all persisted stores. Swap this implementation for a
 * remote database adapter to sync data to a backend without touching the UI.
 */
export interface PersistenceAdapter extends StateStorage {
  readonly kind: "local" | "remote";
}

const memory = new Map<string, string>();

export const localPersistence: PersistenceAdapter = {
  kind: "local",
  getItem: (key) => {
    try {
      return typeof window === "undefined"
        ? (memory.get(key) ?? null)
        : window.localStorage.getItem(key);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== "undefined") window.localStorage.setItem(key, value);
    } catch {
      // Storage quota or privacy mode: keep working in memory.
    }
    memory.set(key, value);
  },
  removeItem: (key) => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    memory.delete(key);
  },
};

export const persistence: PersistenceAdapter = localPersistence;
