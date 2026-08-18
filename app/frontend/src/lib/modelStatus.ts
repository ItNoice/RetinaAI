// Single source of truth for "is a real model wired up right now." Phase 3
// will replace `available: false` with real values once ml/inference.py is
// integrated behind the backend. Nothing here may be hard-coded to imply a
// working model exists before it actually does.
export interface ModelStatusInfo {
  available: boolean;
  name: string;
  version: string | null;
  architecture: string | null;
  task: string;
  trainedOn: string | null;
  note: string;
}

export const MODEL_STATUS: ModelStatusInfo = {
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

export const DATASET_STATUS: DatasetInfo = {
  name: null,
  license: null,
  numImages: null,
  note: "No dataset has been integrated yet. See DATASET.md for candidate public datasets under consideration.",
};
