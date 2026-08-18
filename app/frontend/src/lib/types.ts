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
}

export interface StoredImageBlob {
  id: string;
  blob: Blob;
}
