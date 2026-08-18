// All analysis data lives in the browser's IndexedDB — nothing is uploaded
// anywhere in Phase 1 (there is no backend yet). Each analysis is stored as
// a JSON record plus the original image blob, keyed by the same id.
import { createStore, get, set, del, keys, clear } from "idb-keyval";
import type { AnalysisRecord } from "./types";

const store = createStore("retinaai-db", "analyses");

const recordKey = (id: string) => `record:${id}`;
const imageKey = (id: string) => `image:${id}`;

export async function saveAnalysis(
  record: AnalysisRecord,
  imageBlob: Blob,
): Promise<void> {
  await set(recordKey(record.id), record, store);
  await set(imageKey(record.id), imageBlob, store);
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
}

export async function clearAllAnalyses(): Promise<void> {
  await clear(store);
}
