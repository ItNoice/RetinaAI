// Theme preference storage + application. Kept separate from React so the
// same logic can run in index.html's pre-paint script (avoiding a flash of
// the wrong theme) and inside the app via ThemeContext.
export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "retinaai-theme";

export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable (private browsing, etc.) — fall through.
  }
  return "system";
}

export function writeStoredTheme(theme: ThemePreference): void {
  try {
    if (theme === "system") {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore — theme just won't persist across reloads.
  }
}

// Applies `theme` to the document by setting/removing data-theme, which
// index.css's [data-theme="dark"]/[data-theme="light"] blocks read.
// "system" removes the attribute entirely, so the prefers-color-scheme
// media query in index.css takes over.
export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function resolveTheme(theme: ThemePreference): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
