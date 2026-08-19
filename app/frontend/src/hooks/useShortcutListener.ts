import { useEffect } from "react";
import { shortcutEventType, type ShortcutEventName } from "../lib/shortcutBus";

// Subscribes `handler` to a global shortcut action for as long as the
// calling component is mounted — see lib/shortcutBus.ts for why this is a
// pub/sub instead of prop-drilled callbacks.
export function useShortcutListener(
  name: ShortcutEventName,
  handler: () => void,
): void {
  useEffect(() => {
    const type = shortcutEventType(name);
    window.addEventListener(type, handler);
    return () => window.removeEventListener(type, handler);
  }, [name, handler]);
}
