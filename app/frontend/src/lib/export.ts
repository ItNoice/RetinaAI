// Export paths for a single analysis: the JSON download and the shared pieces
// the print report reuses.
//
// The disclaimer travels with every export deliberately. A JSON file or a
// printed page outlives the app's UI, and the framing that this isn't a
// diagnosis has to survive with it.
import type { AnalysisRecord } from "./types";

export const DISCLAIMER =
  "RetinaAI is an educational and research prototype. It is not a medical " +
  "device and should not be used to diagnose, treat, or make clinical " +
  "decisions about any person. Model predictions may be incorrect, and " +
  "performance may differ across populations, cameras, image quality, and " +
  "clinical settings.";

// The report adds this; the JSON export doesn't, since a JSON payload has no
// images in it to misread.
export const HEATMAP_DISCLAIMER =
  "A Grad-CAM heatmap, when shown, highlights regions that influenced the " +
  "model's prediction — it does not prove those regions contain disease.";

// Shared by JSON export and the print report — "anonymize" strips the
// original filename and exact timestamp, keeping only relative timing, so
// an export can't leak a filename someone chose that happens to contain
// identifying information.
export function exportDisplayName(record: AnalysisRecord, anonymize: boolean): string {
  if (anonymize) return "Retinal analysis";
  return record.label ?? record.filename;
}

export function exportTimestamp(record: AnalysisRecord, anonymize: boolean): string {
  if (anonymize) {
    const days = Math.floor((Date.now() - record.createdAt) / (24 * 60 * 60 * 1000));
    if (days <= 0) return "Analyzed today";
    return `Analyzed ${days} day${days === 1 ? "" : "s"} ago`;
  }
  return new Date(record.createdAt).toLocaleString();
}

export function buildExportPayload(record: AnalysisRecord, anonymize: boolean) {
  return {
    name: exportDisplayName(record, anonymize),
    analyzedAt: anonymize ? null : new Date(record.createdAt).toISOString(),
    prediction: record.prediction,
    quality: record.quality,
    image: {
      width: record.width,
      height: record.height,
      fileSizeBytes: anonymize ? null : record.fileSizeBytes,
      mimeType: record.mimeType,
    },
    backend: record.backend ?? null,
    disclaimer: DISCLAIMER,
  };
}

// Anchor-click download: no File System Access API, no dependency, works in
// every browser this app targets.
export function exportAnalysisJson(record: AnalysisRecord, anonymize: boolean): void {
  const payload = buildExportPayload(record, anonymize);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `retinaai-analysis-${record.id}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
