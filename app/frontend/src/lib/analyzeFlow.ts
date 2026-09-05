// The shared "image -> stored analysis" path, extracted from the near-identical
// copies UploadZone and Analysis had grown. A function rather than a hook, so
// it's testable under vitest's node environment.
import { analyzeImage, type AnalyzeApiResult } from "./api";
import { checkImageQuality } from "./imageQuality";
import { saveAnalysis, type ExplainabilityBlobs } from "./storage";
import type { AnalysisRecord, QualityCheck } from "./types";
import type { Preferences } from "./preferences";

const FORMAT_LABELS = "JPEG, PNG, TIFF, WebP";

/** A blocking quality issue as a user-facing message, or null. */
export function describeQualityIssue(check: QualityCheck): string | null {
  if (check.issues.includes("not-an-image")) {
    return `Unsupported file type. Please upload one of: ${FORMAT_LABELS}.`;
  }
  if (check.issues.includes("file-too-large")) {
    return "File is too large. Please upload an image under 25MB.";
  }
  if (check.issues.includes("corrupted")) {
    return "This file could not be read as an image. It may be corrupted.";
  }
  return null; // "too-small" is deliberately absent — it warns, it doesn't block
}

/** The parts of a record that come from a backend analysis. */
export function toBackendFields(
  result: AnalyzeApiResult,
): Pick<AnalysisRecord, "quality" | "prediction" | "backend" | "hasExplainability"> {
  return {
    quality: result.quality,
    prediction: result.prediction,
    backend: {
      croppedWidth: result.croppedWidth,
      croppedHeight: result.croppedHeight,
      preprocessingTimeMs: result.preprocessingTimeMs,
    },
    // Both blobs or neither — the viewer overlays the heatmap onto the cropped
    // preview, so one without the other can't be displayed.
    hasExplainability: Boolean(result.croppedPreviewBlob && result.heatmapBlob),
  };
}

// Both blobs or neither: the viewer overlays one onto the other, so a lone
// blob can't be displayed. Both persisting call sites go through here.
export function toExplainabilityBlobs(
  result: AnalyzeApiResult,
): ExplainabilityBlobs | undefined {
  if (!result.croppedPreviewBlob || !result.heatmapBlob) return undefined;
  return {
    croppedPreviewBlob: result.croppedPreviewBlob,
    heatmapBlob: result.heatmapBlob,
  };
}

export interface RunAnalysisSuccess {
  kind: "ok";
  id: string;
  record: AnalysisRecord;
  file: File;
  /** False when storage is off; the caller passes the record via router state. */
  stored: boolean;
}

export type RunAnalysisResult = RunAnalysisSuccess | { kind: "error"; message: string };

/** Validate, analyze (if enabled), and persist a new image. */
export async function runAnalysis(
  file: File,
  preferences: Preferences,
): Promise<RunAnalysisResult> {
  const { check, dimensions } = await checkImageQuality(file);

  const blocking = describeQualityIssue(check);
  if (blocking) return { kind: "error", message: blocking };

  const backendResult = preferences.autoAnalyzeOnUpload
    ? await analyzeImage(file)
    : undefined;

  if (backendResult && "code" in backendResult) {
    return { kind: "error", message: backendResult.message };
  }

  // The backend's result is authoritative when it answered; otherwise fall back
  // to the client-only check rather than blocking.
  const fields = backendResult ? toBackendFields(backendResult) : null;

  const explainability = backendResult ? toExplainabilityBlobs(backendResult) : undefined;

  const id = crypto.randomUUID();
  const record: AnalysisRecord = {
    id,
    filename: file.name,
    createdAt: Date.now(),
    width: backendResult?.width ?? dimensions?.width ?? 0,
    height: backendResult?.height ?? dimensions?.height ?? 0,
    fileSizeBytes: file.size,
    mimeType: file.type,
    quality: fields?.quality ?? check,
    prediction: fields?.prediction ?? null,
    backend: fields?.backend,
    hasExplainability: Boolean(explainability),
    awaitingManualAnalysis: !preferences.autoAnalyzeOnUpload,
  };

  const stored = preferences.storeAnalysisResults;
  if (stored) {
    // An empty Blob when image storage is off: the record still needs an
    // entry at its image key so deletes and cache accounting stay consistent.
    await saveAnalysis(
      record,
      preferences.storeUploadedImages ? file : new Blob(),
      explainability,
    );
  }

  return { kind: "ok", id, record, file, stored };
}
