// Everything the app remembers lives in this browser's IndexedDB. Retinal
// images are medical data; the only place any of it is ever sent is the
// backend the user is running themselves, for the analysis they asked for.
//
// One analysis spans up to four keys sharing an id: the JSON record, the
// original image, and — when a model actually ran — the cropped preview and
// Grad-CAM heatmap. Prefixed string keys rather than four object stores,
// because idb-keyval gives us one store and that's enough here.
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
  const writes = [
    set(recordKey(record.id), record, store),
    set(imageKey(record.id), imageBlob, store),
  ];
  if (explainability) {
    writes.push(
      set(croppedPreviewKey(record.id), explainability.croppedPreviewBlob, store),
      set(heatmapKey(record.id), explainability.heatmapBlob, store),
    );
  }
  await Promise.all(writes);
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

// Newest first — every list view in the app wants that order, so it's done
// here once rather than at each call site.
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

// Counts heatmap keys rather than cropped-preview keys — the two are always
// written together, so either works, and one is enough.
export async function getCacheInfo(): Promise<{ cachedCount: number }> {
  const allKeys = await keys(store);
  const cachedCount = allKeys.filter(
    (k): k is string => typeof k === "string" && k.startsWith("heatmap:"),
  ).length;
  return { cachedCount };
}

// Deletes only the Grad-CAM heatmap + cropped-preview blobs, keeping
// records and original images — for reclaiming space without losing
// history. These regenerate automatically next time that image is
// re-analyzed with a backend available.
export async function clearCachedPreviews(): Promise<void> {
  const allKeys = await keys(store);
  const cacheKeys = allKeys.filter(
    (k): k is string =>
      typeof k === "string" &&
      (k.startsWith("cropped:") || k.startsWith("heatmap:")),
  );
  await Promise.all(cacheKeys.map((k) => del(k, store)));
}

// Deletes any analysis older than `maxAgeDays`. Called on app load when
// Settings > History & Storage > "Auto-delete after" isn't "never".
// Returns the number of analyses removed, so the caller can decide whether
// to refresh a list it's already rendered.
export async function sweepExpiredAnalyses(maxAgeDays: number): Promise<number> {
  const all = await listAnalyses();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const expired = all.filter((r) => r.createdAt < cutoff);
  await Promise.all(expired.map((r) => deleteAnalysis(r.id)));
  return expired.length;
}
