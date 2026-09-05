// Display formatters shared across the UI.
//
// These lived as private copies in four or five components and had already
// started to drift — the same inference time rendered as "412 ms" on the
// workflow strip and "411.6 ms" in the results panel. One copy, so a number
// looks the same wherever it appears.

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Switches to seconds past 1000 ms. CPU inference lands either side of that
// line depending on the machine, and "1423.7 ms" is hard to read at a glance.
export function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

// decimalPlaces comes from Settings > Research; a metric shown to 4 dp in one
// panel and 1 dp in another looks like two different numbers.
export function formatPercent(value: number, decimalPlaces: number): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}

// Locale-aware and undefined-locale on purpose: the browser's own formatting
// is what the user expects, and this app has no locale setting of its own.
export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}
