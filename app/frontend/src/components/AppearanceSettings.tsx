import { useTheme } from "../hooks/useTheme";
import type { ThemePreference } from "../lib/theme";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <span className="text-sm text-clinic-700" id="theme-label">
        Theme
      </span>
      <div
        role="radiogroup"
        aria-labelledby="theme-label"
        className="mt-2 inline-flex items-center rounded-md bg-clinic-100 p-1 text-sm"
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={theme === opt.value}
            onClick={() => setTheme(opt.value)}
            className={`px-4 py-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              theme === opt.value
                ? "bg-surface text-clinic-900 shadow-sm font-medium"
                : "text-clinic-600 hover:text-clinic-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-clinic-500">
        "System" follows your device's light/dark setting automatically.
      </p>
    </div>
  );
}
