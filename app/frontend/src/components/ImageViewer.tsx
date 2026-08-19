import { useCallback, useEffect, useRef, useState } from "react";

type ViewMode = "original" | "heatmap" | "overlay";

interface ImageViewerProps {
  imageUrl: string;
  // The exact cropped+resized image the model analyzed. Required for
  // heatmap/overlay modes — the heatmap's coordinates only line up with
  // this frame, not the original upload's, since cropping shifts and
  // rescales the fundus region. Falls back to `imageUrl` when absent.
  croppedPreviewUrl?: string | null;
  heatmapUrl?: string | null;
  altText: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.5;

export default function ImageViewer({
  imageUrl,
  croppedPreviewUrl,
  heatmapUrl,
  altText,
}: ImageViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("original");
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const heatmapAvailable = Boolean(heatmapUrl);

  const clampOffset = useCallback(
    (next: { x: number; y: number }, s: number) => {
      if (s <= 1) return { x: 0, y: 0 };
      const bound = (s - 1) * 200; // generous drag bound, image is object-contain
      return {
        x: Math.max(-bound, Math.min(bound, next.x)),
        y: Math.max(-bound, Math.min(bound, next.y)),
      };
    },
    [],
  );

  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
  const zoomOut = () =>
    setScale((s) => {
      const next = Math.max(MIN_SCALE, s - ZOOM_STEP);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    setScale((s) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s - e.deltaY * 0.0015));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    if (scale <= 1) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!isPanning || !panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setOffset(clampOffset({ x: panStart.current.ox + dx, y: panStart.current.oy + dy }, scale));
  };
  const onPointerUp: React.PointerEventHandler = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const showHeatmapLayer = viewMode !== "original" && heatmapAvailable;
  // Heatmap/overlay modes must show the cropped preview, not the raw
  // upload — see the prop comment above.
  const baseImageUrl =
    viewMode !== "original" && croppedPreviewUrl ? croppedPreviewUrl : imageUrl;

  return (
    <div
      ref={containerRef}
      className={`relative rounded-lg border border-chrome-700 bg-chrome-950 overflow-hidden ${
        isFullscreen ? "flex flex-col" : ""
      }`}
    >
      <div
        className="relative overflow-hidden select-none touch-none"
        style={{ height: isFullscreen ? "calc(100vh - 3.25rem)" : "28rem", cursor: scale > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <img
            src={baseImageUrl}
            alt={altText}
            draggable={false}
            className="max-w-full max-h-full object-contain pointer-events-none"
          />
          {showHeatmapLayer && heatmapUrl && (
            <img
              src={heatmapUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{ opacity: viewMode === "heatmap" ? 1 : overlayOpacity }}
            />
          )}
        </div>

        {!heatmapAvailable && viewMode !== "original" && (
          <div className="absolute inset-0 flex items-center justify-center bg-chrome-950/80 text-chrome-300 text-sm px-6 text-center">
            No Grad-CAM heatmap is available for this image.
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-chrome-900 px-3 py-2.5 border-t border-chrome-700">
        <div className="flex items-center gap-1" role="group" aria-label="Zoom controls">
          <ViewerButton onClick={zoomOut} label="Zoom out" disabled={scale <= MIN_SCALE}>
            −
          </ViewerButton>
          <span className="text-xs text-chrome-300 tabular w-12 text-center" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <ViewerButton onClick={zoomIn} label="Zoom in" disabled={scale >= MAX_SCALE}>
            +
          </ViewerButton>
          <ViewerButton onClick={reset} label="Reset zoom and pan">
            Reset
          </ViewerButton>
        </div>

        <div className="h-4 w-px bg-chrome-700" aria-hidden="true" />

        <div
          role="group"
          aria-label="Image view mode"
          className="flex items-center rounded-md bg-chrome-800 p-0.5 text-xs"
        >
          {(["original", "heatmap", "overlay"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={mode !== "original" && !heatmapAvailable}
              aria-pressed={viewMode === mode}
              onClick={() => setViewMode(mode)}
              className={`px-2.5 py-1 rounded capitalize transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                viewMode === mode
                  ? "bg-accent-600 text-white"
                  : "text-chrome-300 hover:text-white"
              }`}
              title={
                mode !== "original" && !heatmapAvailable
                  ? "No Grad-CAM heatmap is available for this image (no model was loaded when it was analyzed)"
                  : undefined
              }
            >
              {mode}
            </button>
          ))}
        </div>

        {viewMode === "overlay" && (
          <div className="flex items-center gap-2">
            <label htmlFor="overlay-opacity" className="text-xs text-chrome-300">
              Opacity
            </label>
            <input
              id="overlay-opacity"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={overlayOpacity}
              disabled={!heatmapAvailable}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-24 accent-accent-500"
            />
          </div>
        )}

        <div className="flex-1" />

        <ViewerButton onClick={() => void toggleFullscreen()} label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}>
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </ViewerButton>
      </div>
    </div>
  );
}

function ViewerButton({
  onClick,
  label,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="min-w-[1.75rem] h-7 px-2 rounded text-xs font-medium text-chrome-200 bg-chrome-800 hover:bg-chrome-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors"
    >
      {children}
    </button>
  );
}
