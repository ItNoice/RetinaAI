import { describe, expect, it } from "vitest";
import { checkImageQuality, SUPPORTED_MIME_TYPES } from "./imageQuality";

describe("checkImageQuality", () => {
  it("rejects unsupported file types without touching the Image API", async () => {
    const file = new File(["not an image"], "notes.txt", {
      type: "text/plain",
    });
    const { check, dimensions } = await checkImageQuality(file);
    expect(check.passed).toBe(false);
    expect(check.issues).toContain("not-an-image");
    expect(dimensions).toBeNull();
  });

  it("flags oversized files even before probing dimensions", async () => {
    const oversized = new Uint8Array(26 * 1024 * 1024);
    const file = new File([oversized], "huge.txt", { type: "text/plain" });
    const { check } = await checkImageQuality(file);
    expect(check.issues).toContain("file-too-large");
  });

  it("lists JPEG, PNG, TIFF, and WebP as supported", () => {
    expect(SUPPORTED_MIME_TYPES).toEqual(
      expect.arrayContaining(["image/jpeg", "image/png", "image/tiff", "image/webp"]),
    );
  });
});
