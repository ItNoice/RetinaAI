// Shortcut bindings: how a stored binding ("mod+k", "ArrowLeft") is displayed,
// and how a raw KeyboardEvent key maps onto one.
//
// hooks/useKeyboardShortcuts.ts matches against the stored string directly; it
// shares normalizeShortcutKey with the Settings recorder so a key recorded in
// one place is guaranteed to match in the other.

// "+" and "-" are what Settings shows and what the zoom shortcuts are bound
// to, but an unshifted US keyboard sends "=" and "_" for those keys. Accept
// both so zooming doesn't silently require Shift.
export function normalizeShortcutKey(key: string): string {
  if (key === "=") return "+";
  if (key === "_") return "-";
  return key;
}

// "mod" is Cmd on macOS and Ctrl everywhere else, matching what
// matchesBinding() accepts (it takes either). Showing ⌘ to a Linux user is
// the kind of small wrongness that makes a shortcut list feel untrustworthy.
function modLabel(): string {
  const platform =
    typeof navigator === "undefined" ? "" : navigator.platform || navigator.userAgent;
  return /Mac|iPhone|iPad/i.test(platform) ? "⌘" : "Ctrl";
}

const KEY_LABELS: Record<string, string> = {
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
};

export function formatShortcutBinding(binding: string): string {
  const mod = modLabel();
  const parts = binding.split("+").map((part) => {
    if (part === "mod") return mod;
    if (KEY_LABELS[part]) return KEY_LABELS[part];
    if (part.length === 1) return part.toUpperCase();
    return part;
  });

  // ⌘K reads correctly unseparated; Ctrl+K does not.
  const separator = binding.includes("mod") && mod === "⌘" ? "" : "+";
  return parts.join(separator);
}
