// DR severity classes used by the (future) diabetic retinopathy classifier.
// Kept centralized so additional conditions can be added without touching
// every component that renders a class label.
export const DR_CLASSES = [
  "No DR",
  "Mild",
  "Moderate",
  "Severe",
  "Proliferative",
] as const;

export type DRClass = (typeof DR_CLASSES)[number];

export interface PredictionResult {
  modelVersion: string;
  processingTimeMs: number;
  predictedClass: DRClass;
  confidence: number; // 0-1
  probabilities: Record<DRClass, number>; // sums to ~1
}

export type QualityIssue =
  | "not-an-image"
  | "too-small"
  | "file-too-large"
  | "corrupted";

export interface QualityCheck {
  passed: boolean;
  issues: QualityIssue[];
  message?: string;
}

export interface AnalysisRecord {
  id: string;
  filename: string;
  createdAt: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
  quality: QualityCheck;
  // Real predictions are only ever populated once ml/inference.py (Phase 3)
  // is wired up through the backend. Never fabricated client-side.
  prediction: PredictionResult | null;
  // Set when the backend (app/backend) actually processed this image —
  // absent when the backend was unreachable and the app fell back to
  // client-only quality checks.
  backend?: {
    croppedWidth: number;
    croppedHeight: number;
    preprocessingTimeMs: number;
  };
  // True when a Grad-CAM heatmap + cropped preview were stored alongside
  // this analysis (only possible when prediction is non-null). Fetch them
  // via lib/storage's getCroppedPreviewBlob/getHeatmapBlob.
  hasExplainability?: boolean;
}

export interface StoredImageBlob {
  id: string;
  blob: Blob;
}

export type EvalSplit = "train" | "valid" | "test";

export interface SplitMetrics {
  split: EvalSplit;
  dataset: string;
  modelVersion: string;
  numImagesEvaluated: number;
  classDistribution: Record<string, number>;
  accuracy: number;
  precisionMacro: number;
  recallMacro: number;
  f1Macro: number;
  rocAucMacro: number | null;
  confusionMatrix: number[][];
  classNames: string[];
}

export interface MetricsInfo {
  available: boolean;
  note: string;
  train: SplitMetrics | null;
  valid: SplitMetrics | null;
  test: SplitMetrics | null;
}
