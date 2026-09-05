import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "./usePreferences";
import { useCommandPalette } from "./useCommandPalette";
import { dispatchShortcut, type ShortcutEventName } from "../lib/shortcutBus";
import type { ShortcutAction } from "../lib/preferences";
import { normalizeShortcutKey } from "../lib/formatShortcut";

function parseBinding(binding: string): { mod: boolean; key: string } {
  const parts = binding.toLowerCase().split("+");
  return { mod: parts.includes("mod"), key: parts[parts.length - 1] };
}

function matchesBinding(e: KeyboardEvent, binding: string): boolean {
  const { mod, key } = parseBinding(binding);
  const hasMod = e.metaKey || e.ctrlKey;
  if (mod !== hasMod) return false;
  return normalizeShortcutKey(e.key).toLowerCase() === key.toLowerCase();
}

// Only meaningful where the relevant component is mounted, so these go out on
// the bus. "upload" and "help" are global and handled here directly.
const DISPATCHED_ACTIONS: Partial<Record<ShortcutAction, ShortcutEventName>> = {
  analyze: "analyze",
  fullscreen: "fullscreen",
  toggleHeatmap: "toggle-heatmap",
  resetViewer: "reset-viewer",
  zoomIn: "zoom-in",
  zoomOut: "zoom-out",
  prev: "prev",
  next: "next",
};

export function useKeyboardShortcuts(onHelp: () => void): void {
  const { preferences } = usePreferences();
  const navigate = useNavigate();
  const commandPalette = useCommandPalette();

  useEffect(() => {
    const bindings = preferences.shortcutBindings;

    function onKeyDown(e: KeyboardEvent) {
      // The command palette owns Ctrl/Cmd+K everywhere, even mid-typing.
      if (matchesBinding(e, bindings.commandPalette)) {
        e.preventDefault();
        commandPalette.toggle();
        return;
      }

      if (commandPalette.isOpen) return; // palette handles its own keys while open

      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable);
      if (isTyping) return;

      if (matchesBinding(e, bindings.help)) {
        e.preventDefault();
        onHelp();
        return;
      }
      if (matchesBinding(e, bindings.upload)) {
        e.preventDefault();
        navigate("/analyze");
        return;
      }

      for (const [action, eventName] of Object.entries(DISPATCHED_ACTIONS) as [
        ShortcutAction,
        ShortcutEventName,
      ][]) {
        if (matchesBinding(e, bindings[action])) {
          e.preventDefault();
          dispatchShortcut(eventName);
          return;
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [preferences.shortcutBindings, navigate, commandPalette, onHelp]);
}
