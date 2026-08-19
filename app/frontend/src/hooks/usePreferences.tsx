import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PREFERENCES,
  readStoredPreferences,
  resetStoredPreferences,
  writeStoredPreferences,
  type Preferences,
} from "../lib/preferences";
import { applyAccentColor } from "../lib/accentColors";
import { useTheme } from "./useTheme";
import { sweepExpiredAnalyses } from "../lib/storage";

interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
  resetPreferences: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(
    readStoredPreferences,
  );
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    applyAccentColor(preferences.accentColor, resolvedTheme);
  }, [preferences.accentColor, resolvedTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "density-compact",
      preferences.density === "compact",
    );
  }, [preferences.density]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "force-reduce-motion",
      preferences.reduceMotion,
    );
  }, [preferences.reduceMotion]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "larger-text",
      preferences.largerText,
    );
  }, [preferences.largerText]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "high-contrast",
      preferences.highContrast,
    );
  }, [preferences.highContrast]);

  // Runs once per app load, not on every preference change — a sweep is
  // cheap but there's no reason to re-run it just because e.g. the theme
  // toggled. "never" (the default) never touches storage at all.
  useEffect(() => {
    if (preferences.autoDeleteAfterDays === "never") return;
    void sweepExpiredAnalyses(preferences.autoDeleteAfterDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };
        writeStoredPreferences(next);
        return next;
      });
    },
    [],
  );

  const resetPreferences = useCallback(() => {
    resetStoredPreferences();
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{ preferences, setPreference, resetPreferences }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return ctx;
}
