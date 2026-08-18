// Cheap client-side quality gate. This does NOT attempt to determine whether
// an image is actually a retinal fundus photograph (that requires the model
// in Phase 2/3) — it only rejects inputs that are obviously unusable, so we
// never hand a corrupt or absurdly small file to a "model" and pretend it
// produced a meaningful result.
import type { QualityCheck, QualityIssue } from "./types";

export const SUPPORTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/tiff",
  "image/webp",
] as const;

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MIN_DIMENSION_PX = 128;

export interface ProbedImage {
  width: number;
  height: number;
}

function probeImage(file: File): Promise<ProbedImage | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export async function checkImageQuality(
  file: File,
): Promise<{ check: QualityCheck; dimensions: ProbedImage | null }> {
  const issues: QualityIssue[] = [];

  const isSupportedType = (SUPPORTED_MIME_TYPES as readonly string[]).includes(
    file.type,
  );
  if (!isSupportedType) {
    issues.push("not-an-image");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    issues.push("file-too-large");
  }

  let dimensions: ProbedImage | null = null;
  if (isSupportedType) {
    dimensions = await probeImage(file);
    if (!dimensions) {
      issues.push("corrupted");
    } else if (
      dimensions.width < MIN_DIMENSION_PX ||
      dimensions.height < MIN_DIMENSION_PX
    ) {
      issues.push("too-small");
    }
  }

  const passed = issues.length === 0;
  return {
    check: {
      passed,
      issues,
      message: passed
        ? undefined
        : "Image quality may be insufficient for reliable model analysis.",
    },
    dimensions,
  };
}
