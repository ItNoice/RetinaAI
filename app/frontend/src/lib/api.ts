// Thin client for the RetinaAI backend. Every function returns `null` on
// network failure (backend not running, offline, etc.) rather than throwing
// — callers fall back to client-only behavior so the app stays usable
// without a backend, per the project's "keep functional at every stage"
// development philosophy.
import type {
  DRClass,
  EvalSplit,
  MetricsInfo,
  PredictionResult,
  QualityCheck,
  SplitMetrics,
} from "./types";
import type { ModelStatusInfo, DatasetInfo } from "./modelStatus";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000";

interface ApiModelStatus {
  available: boolean;
  name: string;
  version: string | null;
  architecture: string | null;
  task: string;
  trained_on: string | null;
  note: string;
}

interface ApiDatasetStatus {
  name: string | null;
  license: string | null;
  num_images: number | null;
  note: string;
}

interface ApiPrediction {
  model_version: string;
  processing_time_ms: number;
  predicted_class: DRClass;
  confidence: number;
  probabilities: Record<string, number>;
}

interface ApiAnalyzeResponse {
  width: number;
  height: number;
  cropped_width: number;
  cropped_height: number;
  quality: QualityCheck;
  preprocessing_time_ms: number;
  prediction: ApiPrediction | null;
  cropped_preview_png_base64: string | null;
  heatmap_png_base64: string | null;
}

export interface AnalyzeApiResult {
  width: number;
  height: number;
  croppedWidth: number;
  croppedHeight: number;
  quality: QualityCheck;
  preprocessingTimeMs: number;
  prediction: PredictionResult | null;
  croppedPreviewBlob: Blob | null;
  heatmapBlob: Blob | null;
}

function base64PngToBlob(base64: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/png" });
}

export interface AnalyzeApiError {
  code: string;
  message: string;
}

interface ApiSplitMetrics {
  split: EvalSplit;
  dataset: string;
  model_version: string;
  num_images_evaluated: number;
  class_distribution: Record<string, number>;
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  roc_auc_macro: number | null;
  confusion_matrix: number[][];
  class_names: string[];
}

interface ApiMetricsResponse {
  available: boolean;
  note: string;
  train: ApiSplitMetrics | null;
  valid: ApiSplitMetrics | null;
  test: ApiSplitMetrics | null;
}

function toSplitMetrics(m: ApiSplitMetrics): SplitMetrics {
  return {
    split: m.split,
    dataset: m.dataset,
    modelVersion: m.model_version,
    numImagesEvaluated: m.num_images_evaluated,
    classDistribution: m.class_distribution,
    accuracy: m.accuracy,
    precisionMacro: m.precision_macro,
    recallMacro: m.recall_macro,
    f1Macro: m.f1_macro,
    rocAucMacro: m.roc_auc_macro,
    confusionMatrix: m.confusion_matrix,
    classNames: m.class_names,
  };
}

async function safeGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { method: "GET" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchModelStatus(): Promise<ModelStatusInfo | null> {
  const data = await safeGet<ApiModelStatus>("/api/model/status");
  if (!data) return null;
  return {
    available: data.available,
    name: data.name,
    version: data.version,
    architecture: data.architecture,
    task: data.task,
    trainedOn: data.trained_on,
    note: data.note,
  };
}

export async function fetchDatasetStatus(): Promise<DatasetInfo | null> {
  const data = await safeGet<ApiDatasetStatus>("/api/dataset/status");
  if (!data) return null;
  return {
    name: data.name,
    license: data.license,
    numImages: data.num_images,
    note: data.note,
  };
}

export async function fetchMetrics(): Promise<MetricsInfo | null> {
  const data = await safeGet<ApiMetricsResponse>("/api/metrics");
  if (!data) return null;
  return {
    available: data.available,
    note: data.note,
    train: data.train ? toSplitMetrics(data.train) : null,
    valid: data.valid ? toSplitMetrics(data.valid) : null,
    test: data.test ? toSplitMetrics(data.test) : null,
  };
}

// Distinguishes "backend unreachable" (returns undefined — caller falls
// back to client-only checks) from "backend rejected the file" (returns an
// AnalyzeApiError — a real, actionable validation failure to show the user).
export async function analyzeImage(
  file: File,
): Promise<AnalyzeApiResult | AnalyzeApiError | undefined> {
  const formData = new FormData();
  formData.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch {
    return undefined;
  }

  if (res.status === 422) {
    const body = (await res.json()) as { detail: AnalyzeApiError };
    return body.detail;
  }
  if (!res.ok) return undefined;

  const data = (await res.json()) as ApiAnalyzeResponse;
  return {
    width: data.width,
    height: data.height,
    croppedWidth: data.cropped_width,
    croppedHeight: data.cropped_height,
    quality: data.quality,
    preprocessingTimeMs: data.preprocessing_time_ms,
    prediction: data.prediction
      ? {
          modelVersion: data.prediction.model_version,
          processingTimeMs: data.prediction.processing_time_ms,
          predictedClass: data.prediction.predicted_class,
          confidence: data.prediction.confidence,
          probabilities: data.prediction.probabilities as Record<
            DRClass,
            number
          >,
        }
      : null,
    croppedPreviewBlob: data.cropped_preview_png_base64
      ? base64PngToBlob(data.cropped_preview_png_base64)
      : null,
    heatmapBlob: data.heatmap_png_base64
      ? base64PngToBlob(data.heatmap_png_base64)
      : null,
  };
}
