// The ICDR scale. Order is the index the output layer predicts and mirrors
// ml/types.py — reordering without retraining relabels every prediction.
export const DR_CLASSES = [
  "No DR",
  "Mild",
  "Moderate",
  "Severe",
  "Proliferative",
] as const;

export type DRClass = (typeof DR_CLASSES)[number];

// What each grade means clinically in general — never a finding about a
// specific upload. Always shown with "the model predicted..." framing.
export const DR_CLASS_DESCRIPTIONS: Record<DRClass, string> = {
  "No DR":
    "No visible signs of diabetic retinopathy on this grading scale.",
  Mild: "Earliest stage — a few microaneurysms (small bulges in the retina's tiny blood vessels) only.",
  Moderate:
    "More extensive microaneurysms and small hemorrhages than mild, but not yet meeting severe-stage criteria.",
  Severe:
    "Extensive retinal hemorrhages, venous beading, or intraretinal microvascular abnormalities across multiple regions of the retina.",
  Proliferative:
    "The most advanced stage — abnormal new blood vessel growth (neovascularization), which can bleed and threaten vision.",
};

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
  // History → Rename. Never overwrites `filename`, which exports still need.
  label?: string;
  createdAt: number;
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
  quality: QualityCheck;
  // Null means "no model loaded" — a real state the UI renders, never a default.
  prediction: PredictionResult | null;
  // Absent when the backend was unreachable and only client checks ran.
  backend?: {
    croppedWidth: number;
    croppedHeight: number;
    preprocessingTimeMs: number;
  };
  // Heatmap + preview are in storage; fetch with getHeatmapBlob et al.
  hasExplainability?: boolean;
  // Auto-analyze was off. Distinguishes "click Analyze" from "backend was
  // down" — both leave prediction null, but only this one offers the button.
  awaitingManualAnalysis?: boolean;
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

export interface EpochRecord {
  epoch: number;
  trainLoss: number;
  trainAcc: number;
  valLoss: number;
  valAcc: number;
  epochTimeS: number;
}

export interface TrainingLogInfo {
  available: boolean;
  note: string;
  history: EpochRecord[];
  bestValAcc: number | null;
  totalTimeS: number | null;
  hyperparameters: Record<string, string>;
}
