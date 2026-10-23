import { create } from "zustand";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
}

const storageKey = "theme";
const validThemes: ThemePreference[] = ["light", "dark", "system"];

function getInitialPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(storageKey);
    return validThemes.includes(saved as ThemePreference) ? saved as ThemePreference : "system";
  } catch {
    return "system";
  }
}

function applyTheme(preference: ThemePreference) {
  const isDark = preference === "dark"
    || (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  meta?.setAttribute("content", isDark ? "#04141a" : "#0b3d4a");
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: getInitialPreference(),
  setPreference: (preference) => {
    try {
      localStorage.setItem(storageKey, preference);
    } catch {
      // The theme still applies for this page view when storage is unavailable.
    }
    applyTheme(preference);
    set({ preference });
  },
  cyclePreference: () => {
    const currentIndex = validThemes.indexOf(get().preference);
    get().setPreference(validThemes[(currentIndex + 1) % validThemes.length]);
  },
}));

export function initializeTheme() {
  applyTheme(useThemeStore.getState().preference);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if (useThemeStore.getState().preference === "system") applyTheme("system");
  });
}
