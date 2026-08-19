import { useCallback, useEffect, useRef, useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import { enhanceImage } from "../lib/imageEnhance";

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
  const { preferences, setPreference } = usePreferences();
  const heatmapAvailable = Boolean(heatmapUrl);

  const [viewMode, setViewMode] = useState<ViewMode>(
    preferences.defaultViewMode,
  );
  const [overlayOpacity, setOverlayOpacity] = useState(
    preferences.defaultHeatmapOpacity,
  );
  const [scale, setScale] = useState(
    preferences.rememberZoom ? preferences.lastZoomScale : MIN_SCALE,
  );
  const [offset, setOffset] = useState(
    preferences.rememberZoom
      ? { x: preferences.lastZoomOffsetX, y: preferences.lastZoomOffsetY }
      : { x: 0, y: 0 },
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const persistZoom = useCallback(
    (s: number, o: { x: number; y: number }) => {
      if (!preferences.rememberZoom) return;
      setPreference("lastZoomScale", s);
      setPreference("lastZoomOffsetX", o.x);
      setPreference("lastZoomOffsetY", o.y);
    },
    [preferences.rememberZoom, setPreference],
  );

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

  const zoomIn = () =>
    setScale((s) => {
      const next = Math.min(MAX_SCALE, s + ZOOM_STEP);
      persistZoom(next, offset);
      return next;
    });
  const zoomOut = () =>
    setScale((s) => {
      const next = Math.max(MIN_SCALE, s - ZOOM_STEP);
      const nextOffset = next === 1 ? { x: 0, y: 0 } : offset;
      if (next === 1) setOffset(nextOffset);
      persistZoom(next, nextOffset);
      return next;
    });
  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    persistZoom(1, { x: 0, y: 0 });
  };

  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    setScale((s) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s - e.deltaY * 0.0015));
      const nextOffset = next === 1 ? { x: 0, y: 0 } : offset;
      if (next === 1) setOffset(nextOffset);
      persistZoom(next, nextOffset);
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
    if (isPanning) persistZoom(scale, offset);
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

  // "100%" default zoom = 1 image pixel per screen pixel, computed from the
  // real natural size vs. the object-contain-fitted rendered size — not
  // just an arbitrary fixed multiplier.
  const onBaseImageLoad = () => {
    if (preferences.rememberZoom) return; // remembered value already wins
    if (preferences.defaultZoom !== "100") return;
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return;
    const renderedWidth = img.getBoundingClientRect().width;
    if (!renderedWidth) return;
    const ratio = img.naturalWidth / renderedWidth;
    setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, ratio)));
  };

  const showHeatmapLayer = viewMode !== "original" && heatmapAvailable;
  // Heatmap/overlay modes must show the cropped preview, not the raw
  // upload — see the prop comment above.
  const baseImageUrl =
    viewMode !== "original" && croppedPreviewUrl ? croppedPreviewUrl : imageUrl;

  // Auto-enhance runs a real contrast stretch on the displayed image only
  // — it never touches what was sent to the model, so it can't change a
  // prediction. See lib/imageEnhance.ts.
  useEffect(() => {
    if (!preferences.autoEnhance) {
      setEnhancedUrl(null);
      return;
    }
    let cancelled = false;
    let objectUrl: string | null = null;
    void enhanceImage(baseImageUrl).then((url) => {
      if (cancelled) return;
      objectUrl = url;
      setEnhancedUrl(url);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [baseImageUrl, preferences.autoEnhance]);

  const displayedImageUrl = enhancedUrl ?? baseImageUrl;

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
            ref={imgRef}
            src={displayedImageUrl}
            alt={altText}
            draggable={false}
            onLoad={onBaseImageLoad}
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

        {preferences.autoEnhance && (
          <span className="absolute top-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-chrome-900/80 text-chrome-300">
            Auto-enhanced (display only)
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-chrome-900 px-3 py-2.5 border-t border-chrome-700">
        <div className="flex items-center gap-1" role="group" aria-label="Zoom controls">
          <ViewerButton onClick={zoomOut} label="Zoom out" disabled={scale <= MIN_SCALE} showLabel={preferences.alwaysShowIconLabels}>
            −
          </ViewerButton>
          <span className="text-xs text-chrome-300 tabular w-12 text-center" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <ViewerButton onClick={zoomIn} label="Zoom in" disabled={scale >= MAX_SCALE} showLabel={preferences.alwaysShowIconLabels}>
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
  showLabel,
  children,
}: {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  showLabel?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="min-w-[1.75rem] h-7 px-2 rounded text-xs font-medium text-chrome-200 bg-chrome-800 hover:bg-chrome-700 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 transition-colors inline-flex items-center gap-1"
    >
      {children}
      {showLabel && <span className="normal-case">{label}</span>}
    </button>
  );
}
