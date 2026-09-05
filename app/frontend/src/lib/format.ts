// Display formatters. One copy, because the private ones these replaced had
// already drifted — 412 ms on the workflow strip, 411.6 ms in the results panel.

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Seconds past 1000 ms — CPU inference lands either side of that line.
export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

// decimalPlaces comes from Settings > Research.
export function formatPercent(value: number, decimalPlaces: number): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}

// undefined locale on purpose: the app has no locale setting, so use the browser's.
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}
