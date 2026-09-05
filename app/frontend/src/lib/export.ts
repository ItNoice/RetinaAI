// JSON export, plus the pieces the print report shares. The disclaimer travels
// with both: a file outlives the UI that framed it.
import type { AnalysisRecord } from "./types";

export const DISCLAIMER =
  "RetinaAI is an educational and research prototype. It is not a medical " +
  "device and should not be used to diagnose, treat, or make clinical " +
  "decisions about any person. Model predictions may be incorrect, and " +
  "performance may differ across populations, cameras, image quality, and " +
  "clinical settings.";

// Report only — a JSON payload has no image in it to misread.
export const HEATMAP_DISCLAIMER =
  "A Grad-CAM heatmap, when shown, highlights regions that influenced the " +
  "model's prediction — it does not prove those regions contain disease.";

// "anonymize" drops the filename, which users sometimes put a patient name in.
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

// Anchor-click download — no dependency, works everywhere this app targets.
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
