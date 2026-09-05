// Display and key-normalization for shortcut bindings ("mod+k", "ArrowLeft").

// An unshifted US keyboard sends "=" and "_" where the bindings say "+" and
// "-", so accept both — otherwise zooming silently requires Shift.
export function normalizeShortcutKey(key: string): string {
  if (key === "=") return "+";
  if (key === "_") return "-";
  return key;
}

// matchesBinding() accepts either modifier; this picks the right label to show.
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
