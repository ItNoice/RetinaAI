import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  applyTheme,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type ThemePreference,
} from "../lib/theme";

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(readStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveTheme(readStoredTheme()),
  );

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    writeStoredTheme(next);
    applyTheme(next);
    setResolvedTheme(resolveTheme(next));
  }, []);

  // Keep resolvedTheme in sync if the OS-level preference changes while
  // this tab is on "system".
  useEffect(() => {
    if (theme !== "system" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolvedTheme(resolveTheme("system"));
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
