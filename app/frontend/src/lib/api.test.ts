import { describe, expect, it } from "vitest";
import { base64PngToBlob, toSplitMetrics } from "./api";

describe("base64PngToBlob", () => {
  it("decodes base64 into a PNG blob of the right byte length", async () => {
    // "hi" -> base64 "aGk="
    const blob = base64PngToBlob("aGk=");
    expect(blob.type).toBe("image/png");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(new TextDecoder().decode(bytes)).toBe("hi");
  });
});

describe("toSplitMetrics", () => {
  it("maps the API's snake_case shape to the frontend's camelCase shape without dropping data", () => {
    const apiShape = {
      split: "test" as const,
      dataset: "DDR grading subset",
      model_version: "resnet18-epoch3",
      num_images_evaluated: 3759,
      class_distribution: { "No DR": 1880 },
      accuracy: 0.52,
      precision_macro: 0.467,
      recall_macro: 0.503,
      f1_macro: 0.44,
      roc_auc_macro: 0.83,
      confusion_matrix: [[1, 2]],
      class_names: ["No DR", "Mild"],
    };

    expect(toSplitMetrics(apiShape)).toEqual({
      split: "test",
      dataset: "DDR grading subset",
      modelVersion: "resnet18-epoch3",
      numImagesEvaluated: 3759,
      classDistribution: { "No DR": 1880 },
      accuracy: 0.52,
      precisionMacro: 0.467,
      recallMacro: 0.503,
      f1Macro: 0.44,
      rocAucMacro: 0.83,
      confusionMatrix: [[1, 2]],
      classNames: ["No DR", "Mild"],
    });
  });

  it("preserves a null ROC-AUC (some folds/classes can't produce one)", () => {
    const apiShape = {
      split: "train" as const,
      dataset: "x",
      model_version: "x",
      num_images_evaluated: 1,
      class_distribution: {},
      accuracy: 1,
      precision_macro: 1,
      recall_macro: 1,
      f1_macro: 1,
      roc_auc_macro: null,
      confusion_matrix: [[1]],
      class_names: ["No DR"],
    };
    expect(toSplitMetrics(apiShape).rocAucMacro).toBeNull();
  });
});
