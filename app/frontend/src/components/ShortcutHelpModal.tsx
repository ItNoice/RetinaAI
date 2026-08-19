import { createPortal } from "react-dom";
import { usePreferences } from "../hooks/usePreferences";
import { formatShortcutBinding } from "../lib/formatShortcut";
import type { ShortcutAction } from "../lib/preferences";

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
  help: "Show this help",
  commandPalette: "Open command palette",
};

const ORDER: ShortcutAction[] = [
  "commandPalette",
  "upload",
  "analyze",
  "fullscreen",
  "toggleHeatmap",
  "resetViewer",
  "zoomIn",
  "zoomOut",
  "prev",
  "next",
  "help",
];

export default function ShortcutHelpModal({ onClose }: { onClose: () => void }) {
  const { preferences } = usePreferences();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="relative w-full max-w-sm rounded-lg border border-chrome-700 bg-chrome-900 shadow-2xl p-5"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-chrome-300 hover:text-white p-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            ✕
          </button>
        </div>
        <dl className="space-y-1.5">
          {ORDER.map((action) => (
            <div key={action} className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-chrome-300">{SHORTCUT_LABELS[action]}</dt>
              <dd className="font-mono text-xs text-white bg-chrome-800 px-1.5 py-0.5 rounded shrink-0">
                {formatShortcutBinding(preferences.shortcutBindings[action])}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 pt-3 border-t border-chrome-700 text-xs text-chrome-300">
          Rebind any of these in Settings → Keyboard Shortcuts.
        </p>
      </div>
    </div>,
    document.body,
  );
}
