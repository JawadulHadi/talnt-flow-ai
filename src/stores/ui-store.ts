import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { persistence } from "@/lib/ats/storage-service";
import type { ThemeName } from "@/lib/ats/types";

interface UiState {
  theme: ThemeName;
  fallbackModeActive: boolean;
  setTheme: (t: ThemeName) => void;
  setFallback: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: "frosted-slate",
      fallbackModeActive: false,
      setTheme: (theme) => set({ theme }),
      setFallback: (fallbackModeActive) => set({ fallbackModeActive }),
    }),
    {
      name: "qeloma-ui-v1",
      storage: createJSONStorage(() => persistence),
      skipHydration: true,
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
);
