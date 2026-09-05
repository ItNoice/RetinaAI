import { describe, expect, it } from "vitest";
import { deriveStages } from "./workflow";
import type { AnalysisRecord } from "./types";

const base: AnalysisRecord = {
  id: "a",
  filename: "fundus.jpg",
  createdAt: 0,
  width: 640,
  height: 480,
  fileSizeBytes: 1234,
  mimeType: "image/jpeg",
  quality: { passed: true, issues: [] },
  prediction: null,
};

const analyzed: AnalysisRecord = {
  ...base,
  quality: { passed: true, issues: [] },
  backend: { croppedWidth: 470, croppedHeight: 470, preprocessingTimeMs: 12 },
  prediction: {
    modelVersion: "resnet18-epoch3",
    processingTimeMs: 35.2,
    predictedClass: "Severe",
    confidence: 0.96,
    probabilities: { "No DR": 0.01, Mild: 0.01, Moderate: 0.01, Severe: 0.96, Proliferative: 0.01 },
  },
};

function stage(record: Parameters<typeof deriveStages>[0], id: string) {
  const found = deriveStages(record).find((s) => s.id === id);
  if (!found) throw new Error(`no stage ${id}`);
  return found;
}

describe("deriveStages", () => {
  it("reports every stage as pending before an image exists", () => {
    const stages = deriveStages({ record: null });
    expect(stages.map((s) => s.id)).toEqual([
      "image",
      "quality",
      "preprocess",
      "model",
      "results",
    ]);
    expect(stages.every((s) => s.state === "pending")).toBe(true);
  });

  it("completes every stage for a fully analyzed record", () => {
    const stages = deriveStages({ record: analyzed });
    expect(stages.map((s) => s.state)).toEqual(["done", "done", "done", "done", "done"]);
  });

  it("shows real geometry and timing rather than generic labels", () => {
    expect(stage({ record: analyzed }, "image").detail).toBe("640 × 480 px");
    expect(stage({ record: analyzed }, "preprocess").detail).toBe("470 × 470 → 224²");
    expect(stage({ record: analyzed }, "model").detail).toBe("35 ms");
    expect(stage({ record: analyzed }, "results").detail).toBe("Severe");
  });

  it("warns rather than fails when quality was flagged", () => {
    const flagged = {
      ...analyzed,
      quality: { passed: false, issues: ["too-small" as const], message: "x" },
    };
    expect(stage({ record: flagged }, "quality").state).toBe("warn");
    expect(stage({ record: flagged }, "quality").detail).toBe("Below 128 px");
  });

  it("never reports the model stage as done without a prediction", () => {
    // The central rule: a missing prediction is "unavailable", never a
    // silently-successful stage.
    expect(stage({ record: base }, "model").state).toBe("unavailable");
    expect(stage({ record: base }, "results").state).toBe("unavailable");
    expect(stage({ record: base }, "model").detail).toBe("Model unavailable");
  });

  it("distinguishes 'not run yet' from 'model unavailable'", () => {
    const pendingManual = { ...base, awaitingManualAnalysis: true };
    expect(stage({ record: pendingManual }, "model").state).toBe("pending");
    expect(stage({ record: pendingManual }, "model").detail).toBe("Not run yet");
  });

  it("marks preprocessing unavailable when the backend can't be reached", () => {
    const s = stage({ record: base, backendReachable: false }, "preprocess");
    expect(s.state).toBe("unavailable");
    expect(s.detail).toBe("Backend unreachable");
  });

  it("shows work in progress while a request is in flight", () => {
    expect(stage({ record: base, busy: true }, "model").state).toBe("active");
    expect(stage({ record: null, busy: true }, "image").state).toBe("active");
  });

  it("surfaces a failed stage as an error", () => {
    expect(stage({ record: base, failedStage: "analysis" }, "model").state).toBe("error");
    expect(stage({ record: base, failedStage: "quality" }, "quality").state).toBe("error");
  });

  it("formats sub-second and multi-second inference differently", () => {
    const slow = {
      ...analyzed,
      prediction: { ...analyzed.prediction!, processingTimeMs: 2400 },
    };
    expect(stage({ record: slow }, "model").detail).toBe("2.40 s");
  });
});
