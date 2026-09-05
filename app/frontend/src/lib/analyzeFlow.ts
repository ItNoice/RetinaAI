// The shared "turn an image into a stored analysis" path.
//
// Extracted because UploadZone and Analysis had grown near-identical copies
// of it, and the copies were the kind that drift: a field added to one and
// forgotten in the other shows up later as a record that renders differently
// depending on which screen created it.
//
// A plain function rather than a hook, deliberately: vitest runs in the node
// environment in this project (no jsdom, no testing-library), so a hook would
// be untestable while this is not. Navigation and UI state stay in the
// components.
import { analyzeImage, type AnalyzeApiResult } from "./api";
import { checkImageQuality } from "./imageQuality";
import { saveAnalysis, type ExplainabilityBlobs } from "./storage";
import type { AnalysisRecord, QualityCheck } from "./types";
import type { Preferences } from "./preferences";

const FORMAT_LABELS = "JPEG, PNG, TIFF, WebP";

/**
 * Turn a blocking client-side quality issue into a user-facing message.
 *
 * `too-small` is intentionally absent: it's a soft flag that the backend also
 * reports, and it warns rather than blocks.
 */
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
  return null;
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

/**
 * The explainability blobs, but only as a pair.
 *
 * The viewer overlays the heatmap onto the cropped preview, so one without
 * the other can't be displayed and shouldn't be stored. Both call sites that
 * persist a backend result go through this rather than asserting each blob
 * non-null separately.
 */
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
  /** False when preferences say not to persist — the caller must pass the
   *  record through router state instead. */
  stored: boolean;
}

export type RunAnalysisResult = RunAnalysisSuccess | { kind: "error"; message: string };

/**
 * Validate, analyze (if enabled), and persist a new image.
 *
 * The backend re-validates and preprocesses — when reachable, its result is
 * authoritative. When it isn't, we fall back to the client-only check rather
 * than blocking, so the app stays usable with no backend.
 */
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
