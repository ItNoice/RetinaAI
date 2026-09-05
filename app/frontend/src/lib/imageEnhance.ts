// Auto-contrast for the viewer: a per-channel histogram stretch on a <canvas>
// copy. Display only — the bytes sent to the backend are untouched, so this
// cannot influence a prediction.
export async function enhanceImage(sourceUrl: string): Promise<string | null> {
  const img = await loadImage(sourceUrl);
  if (!img) return null;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  for (let channel = 0; channel < 3; channel++) {
    // 1st/99th percentile as the black/white points — robust to outlier pixels
    // in a way the literal min/max isn't.
    const [lo, hi] = percentileRange(data, channel, 0.01);
    if (hi <= lo) continue;
    const scale = 255 / (hi - lo);
    for (let i = channel; i < data.length; i += 4) {
      data[i] = clamp((data[i] - lo) * scale);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob ? URL.createObjectURL(blob) : null);
    }, "image/png");
  });
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, v));
}

function percentileRange(
  data: Uint8ClampedArray,
  channel: number,
  fraction: number,
): [number, number] {
  const histogram = new Array<number>(256).fill(0);
  let total = 0;
  for (let i = channel; i < data.length; i += 4) {
    histogram[data[i]]++;
    total++;
  }
  const cutoff = total * fraction;

  let lo = 0;
  let cumulative = 0;
  for (let v = 0; v < 256; v++) {
    cumulative += histogram[v];
    if (cumulative > cutoff) {
      lo = v;
      break;
    }
  }

  let hi = 255;
  cumulative = 0;
  for (let v = 255; v >= 0; v--) {
    cumulative += histogram[v];
    if (cumulative > cutoff) {
      hi = v;
      break;
    }
  }

  return [lo, hi];
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
