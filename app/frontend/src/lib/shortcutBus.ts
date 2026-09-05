// Pub/sub over CustomEvents for shortcuts that only mean something while a
// particular component is mounted ("H" needs an ImageViewer on screen).
// useKeyboardShortcuts dispatches; components subscribe while mounted.
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
