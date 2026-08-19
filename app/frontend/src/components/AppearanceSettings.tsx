import { useTheme } from "../hooks/useTheme";
import { usePreferences } from "../hooks/usePreferences";
import type { ThemePreference } from "../lib/theme";
import { ACCENT_COLOR_LABELS } from "../lib/accentColors";
import type { AccentColor } from "../lib/preferences";
import SettingsSegmented from "./SettingsSegmented";
import SettingsToggle from "./SettingsToggle";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const ACCENT_OPTIONS: { value: AccentColor; label: string }[] = (
  Object.keys(ACCENT_COLOR_LABELS) as AccentColor[]
).map((value) => ({ value, label: ACCENT_COLOR_LABELS[value] }));

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const { preferences, setPreference } = usePreferences();

  return (
    <div className="divide-y divide-clinic-100">
      <SettingsSegmented
        label="Theme"
        options={THEME_OPTIONS}
        value={theme}
        onChange={setTheme}
        hint="System follows your device's light/dark setting automatically."
      />

      <SettingsSegmented
        label="Accent color"
        options={ACCENT_OPTIONS}
        value={preferences.accentColor}
        onChange={(v) => setPreference("accentColor", v)}
      />

      <SettingsSegmented
        label="Interface density"
        options={[
          { value: "comfortable" as const, label: "Comfortable" },
          { value: "compact" as const, label: "Compact" },
        ]}
        value={preferences.density}
        onChange={(v) => setPreference("density", v)}
        hint="Compact tightens spacing — useful on smaller screens."
      />

      <SettingsToggle
        label="Reduce animations"
        description="Turns off transitions and motion, regardless of your device's setting."
        checked={preferences.reduceMotion}
        onChange={(v) => setPreference("reduceMotion", v)}
      />
    </div>
  );
}
