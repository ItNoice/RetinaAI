// Shapes for the backend's model/dataset status, plus the values the UI shows
// when the backend hasn't answered (yet, or at all).
//
// The fallbacks are deliberately the pessimistic ones: an unreachable backend
// renders as "no model connected", never as a plausible-looking model that
// isn't there. Everything real comes from lib/api.ts.
export interface ModelStatusInfo {
  available: boolean;
  name: string;
  version: string | null;
  architecture: string | null;
  task: string;
  trainedOn: string | null;
  note: string;
}

export const UNAVAILABLE_MODEL_STATUS: ModelStatusInfo = {
  available: false,
  name: "Diabetic retinopathy classifier",
  version: null,
  architecture: null,
  task: "5-class DR severity grading (No DR / Mild / Moderate / Severe / Proliferative)",
  trainedOn: null,
  note: "No trained model is connected yet. Uploaded images are stored and can be viewed, but no prediction is produced.",
};

export interface DatasetInfo {
  name: string | null;
  license: string | null;
  numImages: number | null;
  note: string;
}

export const UNAVAILABLE_DATASET_STATUS: DatasetInfo = {
  name: null,
  license: null,
  numImages: null,
  note: "No dataset has been integrated yet. See DATASET.md for candidate public datasets under consideration.",
};
