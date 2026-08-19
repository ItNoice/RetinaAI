// A tiny pub/sub over window CustomEvents for keyboard-shortcut actions that
// only make sense in the context of whatever's currently mounted (e.g. "H"
// toggles the heatmap only when an ImageViewer is actually on screen).
// hooks/useKeyboardShortcuts.ts dispatches; individual components (mainly
// ImageViewer.tsx, Analysis.tsx, History.tsx) subscribe only while mounted.
export type ShortcutEventName =
  | "analyze"
  | "fullscreen"
  | "toggle-heatmap"
  | "reset-viewer"
  | "zoom-in"
  | "zoom-out"
  | "prev"
  | "next";

const EVENT_PREFIX = "retinaai:shortcut:";

export function dispatchShortcut(name: ShortcutEventName): void {
  window.dispatchEvent(new CustomEvent(`${EVENT_PREFIX}${name}`));
}

export function shortcutEventType(name: ShortcutEventName): string {
  return `${EVENT_PREFIX}${name}`;
}
