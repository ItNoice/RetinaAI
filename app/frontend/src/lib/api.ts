// Thin client for the RetinaAI backend.
//
// Nothing here throws on network failure. A missing backend is an ordinary
// state for this app — you can open it with nothing running and still upload,
// inspect and browse images — so every call returns null instead and lets the
// caller degrade. Errors that the *user* can act on (a rejected file) are the
// exception; see analyzeImage.
//
// The Api* interfaces below mirror app/backend/schemas.py verbatim, snake_case
// and all. The mapping to camelCase happens here, at the boundary, so the rest
// of the app never sees the wire format.
import type {
  DRClass,
  EpochRecord,
  EvalSplit,
  MetricsInfo,
  PredictionResult,
  QualityCheck,
  SplitMetrics,
  TrainingLogInfo,
} from "./types";
import type { ModelStatusInfo, DatasetInfo } from "./modelStatus";
import { readStoredPreferences } from "./preferences";

// Re-read on every call (not cached at module load) so Settings > Advanced
// > API endpoint override takes effect immediately, without a reload.
function getApiBaseUrl(): string {
  const override = readStoredPreferences().apiBaseUrlOverride;
  if (override) return override;
  return (
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:8000"
  );
}

// Off unless Settings > Advanced > Debug logging is on. Worth having: most
// support questions about this app turn out to be "which URL was it actually
// calling".
function debugLog(...args: unknown[]): void {
  if (readStoredPreferences().debugLogging) {
    console.log("[RetinaAI]", ...args);
  }
}

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

// The heatmap and preview come back inline as base64 rather than as separate
// endpoints, so a result is one round trip and can't half-arrive.
export function base64PngToBlob(base64: string): Blob {
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

export function toSplitMetrics(m: ApiSplitMetrics): SplitMetrics {
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
  const url = `${getApiBaseUrl()}${path}`;
  try {
    debugLog("GET", url);
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      debugLog("GET", url, "->", res.status);
      return null;
    }
    const data = (await res.json()) as T;
    debugLog("GET", url, "-> 200", data);
    return data;
  } catch (err) {
    debugLog("GET", url, "-> network error", err);
    return null;
  }
}

function toModelStatus(data: ApiModelStatus): ModelStatusInfo {
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

export async function fetchModelStatus(): Promise<ModelStatusInfo | null> {
  const data = await safeGet<ApiModelStatus>("/api/model/status");
  return data ? toModelStatus(data) : null;
}

// POST rather than GET because it has a side effect: the backend drops its
// cached checkpoint. Returns the status afterwards, so the caller can tell
// whether a newly trained model actually loaded.
export async function reloadModel(): Promise<ModelStatusInfo | null> {
  const url = `${getApiBaseUrl()}/api/model/reload`;
  try {
    debugLog("POST", url);
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) {
      debugLog("POST", url, "->", res.status);
      return null;
    }
    return toModelStatus((await res.json()) as ApiModelStatus);
  } catch (err) {
    debugLog("POST", url, "-> network error", err);
    return null;
  }
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

interface ApiEpochRecord {
  epoch: number;
  train_loss: number;
  train_acc: number;
  val_loss: number;
  val_acc: number;
  epoch_time_s: number;
}

interface ApiTrainingLogResponse {
  available: boolean;
  note: string;
  history: ApiEpochRecord[];
  best_val_acc: number | null;
  total_time_s: number | null;
  hyperparameters: Record<string, string>;
}

function toEpochRecord(e: ApiEpochRecord): EpochRecord {
  return {
    epoch: e.epoch,
    trainLoss: e.train_loss,
    trainAcc: e.train_acc,
    valLoss: e.val_loss,
    valAcc: e.val_acc,
    epochTimeS: e.epoch_time_s,
  };
}

export async function fetchTrainingLog(): Promise<TrainingLogInfo | null> {
  const data = await safeGet<ApiTrainingLogResponse>("/api/training-log");
  if (!data) return null;
  return {
    available: data.available,
    note: data.note,
    history: data.history.map(toEpochRecord),
    bestValAcc: data.best_val_acc,
    totalTimeS: data.total_time_s,
    hyperparameters: data.hyperparameters,
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

// Three outcomes, and the caller needs to tell them apart:
//   AnalyzeApiResult  - analyzed (the prediction inside may still be null)
//   AnalyzeApiError   - the backend rejected the file; show the message
//   undefined         - backend unreachable; fall back to client-only checks
// Collapsing the last two into one would mean telling users their image is
// broken whenever the server happens to be down.
export async function analyzeImage(
  file: File,
): Promise<AnalyzeApiResult | AnalyzeApiError | undefined> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${getApiBaseUrl()}/api/analyze`;
  let res: Response;
  try {
    debugLog("POST", url, file.name, `${file.size}B`);
    res = await fetch(url, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    debugLog("POST", url, "-> network error", err);
    return undefined;
  }

  if (res.status === 422) {
    const body = (await res.json()) as { detail: AnalyzeApiError };
    debugLog("POST", url, "-> 422", body.detail);
    return body.detail;
  }
  if (!res.ok) {
    debugLog("POST", url, "->", res.status);
    return undefined;
  }
  debugLog("POST", url, "-> 200");

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
