// Human-readable rendering of a stored shortcut binding string (e.g.
// "mod+k" -> "⌘K", "ArrowLeft" -> "←") for Settings and the shortcut help
// modal. Not used for matching — hooks/useKeyboardShortcuts.ts does that
// directly against the raw stored string.
export function formatShortcutBinding(binding: string): string {
  return binding
    .split("+")
    .map((part) => {
      if (part === "mod") return "⌘";
      if (part === "ArrowLeft") return "←";
      if (part === "ArrowRight") return "→";
      if (part.length === 1) return part.toUpperCase();
      return part;
    })
    .join(binding.includes("mod") ? "" : "+");
}
