import type { AccentColor } from "./preferences";

interface AccentPalette {
  light: { 700: string; 600: string; 500: string; 400: string; soft: string; softInk: string };
  dark: { 700: string; 600: string; 500: string; 400: string; soft: string; softInk: string };
}

// Separate light/dark variants: a color that reads on white may not on near-black.
export const ACCENT_PALETTES: Record<AccentColor, AccentPalette> = {
  blue: {
    light: { 700: "#1d4ed8", 600: "#2563eb", 500: "#3b82f6", 400: "#60a5fa", soft: "#dbeafe", softInk: "#1d4ed8" },
    dark: { 700: "#1d4ed8", 600: "#2563eb", 500: "#3b82f6", 400: "#60a5fa", soft: "#16233f", softInk: "#93c5fd" },
  },
  teal: {
    light: { 700: "#0f766e", 600: "#0d9488", 500: "#14b8a6", 400: "#2dd4bf", soft: "#ccfbf1", softInk: "#0f766e" },
    dark: { 700: "#0f766e", 600: "#0d9488", 500: "#14b8a6", 400: "#2dd4bf", soft: "#134e4a", softInk: "#5eead4" },
  },
  violet: {
    light: { 700: "#6d28d9", 600: "#7c3aed", 500: "#8b5cf6", 400: "#a78bfa", soft: "#ede9fe", softInk: "#6d28d9" },
    dark: { 700: "#6d28d9", 600: "#7c3aed", 500: "#8b5cf6", 400: "#a78bfa", soft: "#2e1065", softInk: "#c4b5fd" },
  },
  slate: {
    light: { 700: "#334155", 600: "#475569", 500: "#64748b", 400: "#94a3b8", soft: "#e2e8f0", softInk: "#334155" },
    dark: { 700: "#475569", 600: "#64748b", 500: "#94a3b8", 400: "#cbd5e1", soft: "#1e293b", softInk: "#cbd5e1" },
  },
};

export const ACCENT_COLOR_LABELS: Record<AccentColor, string> = {
  blue: "Blue",
  teal: "Teal",
  violet: "Violet",
  slate: "Slate",
};

export function applyAccentColor(
  accent: AccentColor,
  resolvedTheme: "light" | "dark",
): void {
  const palette = ACCENT_PALETTES[accent][resolvedTheme];
  const root = document.documentElement.style;
  root.setProperty("--accent-700", palette[700]);
  root.setProperty("--accent-600", palette[600]);
  root.setProperty("--accent-500", palette[500]);
  root.setProperty("--accent-400", palette[400]);
  root.setProperty("--accent-soft", palette.soft);
  root.setProperty("--accent-soft-ink", palette.softInk);
}
