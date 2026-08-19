// All analysis data lives in the browser's IndexedDB — nothing is uploaded
// anywhere except to the backend for analysis itself. Each analysis is
// stored as a JSON record plus its original image blob, and — when a model
// produced a real prediction — the cropped preview and Grad-CAM heatmap
// blobs the backend returned, keyed by the same id.
import { createStore, get, set, del, keys, clear } from "idb-keyval";
import type { AnalysisRecord } from "./types";

const store = createStore("retinaai-db", "analyses");

const recordKey = (id: string) => `record:${id}`;
const imageKey = (id: string) => `image:${id}`;
const croppedPreviewKey = (id: string) => `cropped:${id}`;
const heatmapKey = (id: string) => `heatmap:${id}`;

export interface ExplainabilityBlobs {
  croppedPreviewBlob: Blob;
  heatmapBlob: Blob;
}

export async function saveAnalysis(
  record: AnalysisRecord,
  imageBlob: Blob,
  explainability?: ExplainabilityBlobs,
): Promise<void> {
  await set(recordKey(record.id), record, store);
  await set(imageKey(record.id), imageBlob, store);
  if (explainability) {
    await set(croppedPreviewKey(record.id), explainability.croppedPreviewBlob, store);
    await set(heatmapKey(record.id), explainability.heatmapBlob, store);
  }
}

export async function updateAnalysis(record: AnalysisRecord): Promise<void> {
  await set(recordKey(record.id), record, store);
}

export async function getAnalysis(
  id: string,
): Promise<AnalysisRecord | undefined> {
  return get(recordKey(id), store);
}

export async function getImageBlob(id: string): Promise<Blob | undefined> {
  return get(imageKey(id), store);
}

export async function getCroppedPreviewBlob(
  id: string,
): Promise<Blob | undefined> {
  return get(croppedPreviewKey(id), store);
}

export async function getHeatmapBlob(id: string): Promise<Blob | undefined> {
  return get(heatmapKey(id), store);
}

export async function listAnalyses(): Promise<AnalysisRecord[]> {
  const allKeys = await keys(store);
  const recordKeys = allKeys.filter(
    (k): k is string => typeof k === "string" && k.startsWith("record:"),
  );
  const records = await Promise.all(
    recordKeys.map((k) => get<AnalysisRecord>(k, store)),
  );
  return records
    .filter((r): r is AnalysisRecord => Boolean(r))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteAnalysis(id: string): Promise<void> {
  await del(recordKey(id), store);
  await del(imageKey(id), store);
  await del(croppedPreviewKey(id), store);
  await del(heatmapKey(id), store);
}

export async function clearAllAnalyses(): Promise<void> {
  await clear(store);
}
