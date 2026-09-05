// Derives the workflow strip's five stages from what actually happened to an
// image. No timers and no simulated progress — every state is read from the
// record. Pure, so it's unit-testable in node like the rest of lib/.
import type { Stage, StageState } from "../components/WorkflowStages";
import type { AnalysisRecord } from "./types";
import { formatMs } from "./format";

export interface WorkflowInput {
  /** Null before an image has been chosen. */
  record: AnalysisRecord | null;
  /** True while the backend request is in flight. */
  busy?: boolean;
  /** Set when the pipeline stopped with an error the user must act on. */
  failedStage?: "image" | "quality" | "analysis" | null;
  /** False when the backend could not be reached at all. */
  backendReachable?: boolean;
}

export function deriveStages({
  record,
  busy = false,
  failedStage = null,
  backendReachable = true,
}: WorkflowInput): Stage[] {
  const hasImage = record !== null;
  const quality = record?.quality;
  const backend = record?.backend;
  const prediction = record?.prediction ?? null;

  // --- 1. Image ---------------------------------------------------------
  let imageState: StageState = "pending";
  if (failedStage === "image") {
    imageState = "error";
  } else if (hasImage) {
    imageState = "done";
  } else if (busy) {
    imageState = "active";
  }
  const imageDetail = record ? `${record.width} × ${record.height} px` : undefined;

  // --- 2. Quality check -------------------------------------------------
  // Real: format, size and minimum-dimension validation, run client-side and
  // again server-side. Not a gradability model — see QualityPanel.
  let qualityState: StageState = "pending";
  let qualityDetail: string | undefined;
  if (failedStage === "quality") {
    qualityState = "error";
    qualityDetail = "Rejected";
  } else if (quality) {
    qualityState = quality.passed ? "done" : "warn";
    if (quality.passed) {
      qualityDetail = "Checks passed";
    } else if (quality.issues.includes("too-small")) {
      qualityDetail = "Below 128 px";
    } else {
      qualityDetail = "Issue flagged";
    }
  } else if (busy) {
    qualityState = "active";
  }

  // --- 3. Preprocessing -------------------------------------------------
  // Only "done" when the backend actually returned crop geometry.
  let preprocessState: StageState = "pending";
  let preprocessDetail: string | undefined;
  if (backend) {
    preprocessState = "done";
    preprocessDetail = `${backend.croppedWidth} × ${backend.croppedHeight} → 224²`;
  } else if (busy) {
    preprocessState = "active";
  } else if (hasImage && !backendReachable) {
    preprocessState = "unavailable";
    preprocessDetail = "Backend unreachable";
  }

  // --- 4. Model ---------------------------------------------------------
  let modelState: StageState = "pending";
  let modelDetail: string | undefined;
  if (failedStage === "analysis") {
    modelState = "error";
  } else if (prediction) {
    modelState = "done";
    modelDetail = formatMs(prediction.processingTimeMs);
  } else if (busy) {
    modelState = "active";
    modelDetail = "Running inference";
  } else if (record?.awaitingManualAnalysis) {
    modelState = "pending";
    modelDetail = "Not run yet";
  } else if (hasImage) {
    // An image exists and we're not busy, but there's no prediction: the
    // model genuinely isn't available. Never rendered as a result.
    modelState = "unavailable";
    modelDetail = "Model unavailable";
  }

  // --- 5. Results -------------------------------------------------------
  // Mirrors the model stage rather than tracking anything of its own: there
  // are no results to show that the model didn't produce.
  let resultsState: StageState = "pending";
  if (prediction) {
    resultsState = "done";
  } else if (!busy && modelState === "unavailable") {
    resultsState = "unavailable";
  }

  return [
    { id: "image", label: "Image", icon: "image", state: imageState, detail: imageDetail },
    { id: "quality", label: "Quality", icon: "check-circle", state: qualityState, detail: qualityDetail },
    { id: "preprocess", label: "Preprocess", icon: "layers", state: preprocessState, detail: preprocessDetail },
    { id: "model", label: "AI analysis", icon: "scan", state: modelState, detail: modelDetail },
    {
      id: "results",
      label: "Results",
      icon: "check",
      state: resultsState,
      detail: prediction ? prediction.predictedClass : undefined,
    },
  ];
}
