import { useEffect, useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import { formatShortcutBinding, normalizeShortcutKey } from "../lib/formatShortcut";
import {
  DEFAULT_SHORTCUT_BINDINGS,
  type ShortcutAction,
} from "../lib/preferences";

const SHORTCUT_LABELS: Record<ShortcutAction, string> = {
  upload: "Upload / go to Analyze",
  analyze: "Analyze current image",
  fullscreen: "Toggle fullscreen viewer",
  toggleHeatmap: "Toggle heatmap view",
  resetViewer: "Reset viewer",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  prev: "Previous",
  next: "Next",
  help: "Show shortcut help",
  commandPalette: "Open command palette",
};

const ORDER = Object.keys(SHORTCUT_LABELS) as ShortcutAction[];

// Returns null for keypresses that shouldn't end recording: Escape cancels,
// and a modifier on its own is the user still mid-chord.
function captureBinding(e: KeyboardEvent): string | null {
  if (e.key === "Escape") return null;
  if (["Control", "Meta", "Shift", "Alt"].includes(e.key)) return null;

  // Normalized the same way the matcher normalizes incoming keys, so a
  // binding recorded here is guaranteed to fire later.
  const key = normalizeShortcutKey(e.key);
  const mod = e.metaKey || e.ctrlKey;
  return mod ? `mod+${key.toLowerCase()}` : key;
}

export default function ShortcutsSettings() {
  const { preferences, setPreference } = usePreferences();
  const [recording, setRecording] = useState<ShortcutAction | null>(null);

  useEffect(() => {
    if (!recording) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const binding = captureBinding(e);
      if (binding) {
        setPreference("shortcutBindings", {
          ...preferences.shortcutBindings,
          [recording]: binding,
        });
      }
      setRecording(null);
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [recording, preferences.shortcutBindings, setPreference]);

  return (
    <div>
      <div className="divide-y divide-clinic-100">
        {ORDER.map((action) => (
          <div key={action} className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-clinic-800">{SHORTCUT_LABELS[action]}</span>
            <button
              type="button"
              onClick={() => setRecording(action)}
              className={`min-w-[4.5rem] rounded-md border px-2.5 py-1 text-xs font-mono transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                recording === action
                  ? "border-accent-500 bg-accent-soft text-accent-soft-ink"
                  : "border-clinic-200 bg-clinic-50 text-clinic-700 hover:bg-clinic-100"
              }`}
            >
              {recording === action
                ? "Press a key…"
                : formatShortcutBinding(preferences.shortcutBindings[action])}
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setPreference("shortcutBindings", DEFAULT_SHORTCUT_BINDINGS)}
        className="mt-4 text-sm text-clinic-600 hover:text-clinic-900 transition-colors"
      >
        Reset shortcuts to defaults
      </button>
    </div>
  );
}
