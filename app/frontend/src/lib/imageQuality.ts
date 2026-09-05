// Client-side quality gate. Answers "is this a usable image file", not "is this
// a fundus photograph". The backend repeats these; this copy just saves a round
// trip on an obviously bad file.
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

// The cheapest real corruption check in a browser: a file that claims image/png
// but won't decode fires onerror.
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

  // Only decode files we'd accept anyway — no point on a large unsupported one.
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
