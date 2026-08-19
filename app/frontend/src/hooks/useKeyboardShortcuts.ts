import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "./usePreferences";
import { useCommandPalette } from "./useCommandPalette";
import { dispatchShortcut, type ShortcutEventName } from "../lib/shortcutBus";
import type { ShortcutAction } from "../lib/preferences";

function parseBinding(binding: string): { mod: boolean; key: string } {
  const parts = binding.toLowerCase().split("+");
  return { mod: parts.includes("mod"), key: parts[parts.length - 1] };
}

// "+"/"-" are what Settings shows and what most keyboards produce only with
// Shift held (unshifted keys are "=" and "_" on a US layout) — accept both
// so the zoom shortcuts work without requiring Shift.
function normalizeKey(key: string): string {
  if (key === "=") return "+";
  if (key === "_") return "-";
  return key;
}

function matchesBinding(e: KeyboardEvent, binding: string): boolean {
  const { mod, key } = parseBinding(binding);
  const hasMod = e.metaKey || e.ctrlKey;
  if (mod !== hasMod) return false;
  return normalizeKey(e.key).toLowerCase() === key.toLowerCase();
}

// Actions that only make sense wherever the relevant component is mounted
// (the image viewer, a browsable list) — dispatched on the shortcut bus
// rather than handled here. "upload" and "help" are handled directly since
// they're global (navigate, or a modal this hook's caller owns).
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
