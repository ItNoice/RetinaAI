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

  // These four are implemented as classes on <html> that index.css keys off.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("density-compact", preferences.density === "compact");
    root.classList.toggle("force-reduce-motion", preferences.reduceMotion);
    root.classList.toggle("larger-text", preferences.largerText);
    root.classList.toggle("high-contrast", preferences.highContrast);
  }, [
    preferences.density,
    preferences.reduceMotion,
    preferences.largerText,
    preferences.highContrast,
  ]);

  // Once per app load, not on every preference change. "never" (the default)
  // never touches storage at all.
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
