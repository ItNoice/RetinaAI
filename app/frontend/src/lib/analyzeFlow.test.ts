import { describe, expect, it } from "vitest";
import { describeQualityIssue, toBackendFields } from "./analyzeFlow";
import type { AnalyzeApiResult } from "./api";
import type { QualityCheck } from "./types";

const clean: QualityCheck = { passed: true, issues: [] };

describe("describeQualityIssue", () => {
  it("returns null when nothing blocks the analysis", () => {
    expect(describeQualityIssue(clean)).toBeNull();
  });

  it("names the supported formats for an unusable file type", () => {
    const message = describeQualityIssue({
      passed: false,
      issues: ["not-an-image"],
    });
    expect(message).toContain("JPEG, PNG, TIFF, WebP");
  });

  it("reports the size cap for an oversized file", () => {
    expect(
      describeQualityIssue({ passed: false, issues: ["file-too-large"] }),
    ).toContain("25MB");
  });

  it("reports corruption separately from an unsupported type", () => {
    expect(describeQualityIssue({ passed: false, issues: ["corrupted"] })).toContain(
      "corrupted",
    );
  });

  it("does not block on too-small, which is a warning the backend also flags", () => {
    expect(describeQualityIssue({ passed: false, issues: ["too-small"] })).toBeNull();
  });
});

describe("toBackendFields", () => {
  const base: AnalyzeApiResult = {
    width: 1640,
    height: 1232,
    croppedWidth: 1134,
    croppedHeight: 1134,
    quality: clean,
    preprocessingTimeMs: 12.5,
    prediction: null,
    croppedPreviewBlob: null,
    heatmapBlob: null,
  };

  it("carries the backend's crop and timing across", () => {
    expect(toBackendFields(base).backend).toEqual({
      croppedWidth: 1134,
      croppedHeight: 1134,
      preprocessingTimeMs: 12.5,
    });
  });

  it("only claims explainability when both blobs are present", () => {
    // The viewer overlays the heatmap onto the cropped preview, so one
    // without the other cannot be rendered.
    const blob = new Blob(["x"], { type: "image/png" });
    expect(toBackendFields(base).hasExplainability).toBe(false);
    expect(
      toBackendFields({ ...base, croppedPreviewBlob: blob }).hasExplainability,
    ).toBe(false);
    expect(toBackendFields({ ...base, heatmapBlob: blob }).hasExplainability).toBe(
      false,
    );
    expect(
      toBackendFields({ ...base, croppedPreviewBlob: blob, heatmapBlob: blob })
        .hasExplainability,
    ).toBe(true);
  });

  it("passes a null prediction through rather than inventing one", () => {
    expect(toBackendFields(base).prediction).toBeNull();
  });
});
