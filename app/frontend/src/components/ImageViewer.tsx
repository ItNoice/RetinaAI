import { useCallback, useEffect, useRef, useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import { useShortcutListener } from "../hooks/useShortcutListener";
import { enhanceImage } from "../lib/imageEnhance";

type ViewMode = "original" | "heatmap" | "overlay";

export interface ViewerTransform {
  scale: number;
  offset: { x: number; y: number };
  rotation: number; // 0 | 90 | 180 | 270
}

interface ImageViewerProps {
  imageUrl: string;
  // The exact cropped+resized image the model analyzed. Required for
  // heatmap/overlay modes — the heatmap's coordinates only line up with
  // this frame, not the original upload's, since cropping shifts and
  // rescales the fundus region. Falls back to `imageUrl` when absent.
  croppedPreviewUrl?: string | null;
  heatmapUrl?: string | null;
  altText: string;
  // When provided, zoom/pan/rotation are controlled externally (used by
  // Compare's synchronized detailed view — two viewers sharing one
  // transform). Global keyboard shortcuts (F/H/R/+/-) are only wired up in
  // uncontrolled mode, since two controlled viewers would both react to the
  // same keypress. Brightness/contrast/view-mode stay per-instance either
  // way — nothing in the spec asks those to sync.
  controlled?: {
    transform: ViewerTransform;
    onChange: (transform: ViewerTransform) => void;
  };
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.5;
const DEFAULT_TRANSFORM: ViewerTransform = { scale: MIN_SCALE, offset: { x: 0, y: 0 }, rotation: 0 };

export default function ImageViewer({
  imageUrl,
  croppedPreviewUrl,
  heatmapUrl,
  altText,
  controlled,
}: ImageViewerProps) {
  const { preferences, setPreference } = usePreferences();
  const heatmapAvailable = Boolean(heatmapUrl);

  const [viewMode, setViewMode] = useState<ViewMode>(preferences.defaultViewMode);
  const [overlayOpacity, setOverlayOpacity] = useState(preferences.defaultHeatmapOpacity);
  const [brightness, setBrightness] = useState(preferences.defaultBrightness);
  const [contrast, setContrast] = useState(preferences.defaultContrast);

  const [internalTransform, setInternalTransform] = useState<ViewerTransform>(() =>
    preferences.rememberZoom
      ? {
          scale: preferences.lastZoomScale,
          offset: { x: preferences.lastZoomOffsetX, y: preferences.lastZoomOffsetY },
          rotation: 0,
        }
      : DEFAULT_TRANSFORM,
  );
  const transform = controlled ? controlled.transform : internalTransform;
  const { scale, offset, rotation } = transform;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const panStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const updateTransform = useCallback(
    (next: Partial<ViewerTransform>) => {
      const merged: ViewerTransform = { ...transform, ...next };
      if (controlled) {
        controlled.onChange(merged);
      } else {
        setInternalTransform(merged);
        if (preferences.rememberZoom) {
          setPreference("lastZoomScale", merged.scale);
          setPreference("lastZoomOffsetX", merged.offset.x);
          setPreference("lastZoomOffsetY", merged.offset.y);
        }
      }
    },
    [transform, controlled, preferences.rememberZoom, setPreference],
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

  const zoomIn = useCallback(() => {
    const next = Math.min(MAX_SCALE, scale + ZOOM_STEP);
    updateTransform({ scale: next });
  }, [scale, updateTransform]);

  const zoomOut = useCallback(() => {
    const next = Math.max(MIN_SCALE, scale - ZOOM_STEP);
    updateTransform({ scale: next, offset: next === 1 ? { x: 0, y: 0 } : offset });
  }, [scale, offset, updateTransform]);

  const fit = useCallback(() => {
    updateTransform({ scale: 1, offset: { x: 0, y: 0 } });
  }, [updateTransform]);

  const rotate = useCallback(() => {
    updateTransform({ rotation: ((rotation + 90) % 360) as ViewerTransform["rotation"] });
  }, [rotation, updateTransform]);

  const reset = useCallback(() => {
    updateTransform(DEFAULT_TRANSFORM);
    setBrightness(1);
    setContrast(1);
  }, [updateTransform]);

  const onWheel: React.WheelEventHandler = (e) => {
    e.preventDefault();
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale - e.deltaY * 0.0015));
    updateTransform({ scale: next, offset: next === 1 ? { x: 0, y: 0 } : offset });
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
    updateTransform({ offset: clampOffset({ x: panStart.current.ox + dx, y: panStart.current.oy + dy }, scale) });
  };
  const onPointerUp: React.PointerEventHandler = () => {
    setIsPanning(false);
    panStart.current = null;
  };

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  const toggleHeatmapView = useCallback(() => {
    setViewMode((m) => (m === "original" ? "overlay" : "original"));
  }, []);

  // Global keyboard shortcuts only act on the uncontrolled (primary) viewer
  // instance — see the `controlled` prop doc comment above.
  useShortcutListener("fullscreen", controlled ? () => {} : () => void toggleFullscreen());
  useShortcutListener("toggle-heatmap", controlled ? () => {} : toggleHeatmapView);
  useShortcutListener("reset-viewer", controlled ? () => {} : reset);
  useShortcutListener("zoom-in", controlled ? () => {} : zoomIn);
  useShortcutListener("zoom-out", controlled ? () => {} : zoomOut);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Settings > AI Analysis > "Auto-show Grad-CAM": switch to overlay the
  // moment a heatmap transitions from unavailable to available (a fresh
  // analysis just completed) — not on every mount, so reopening an
  // already-analyzed image still respects "Default view" instead.
  const hadHeatmap = useRef(heatmapAvailable);
  useEffect(() => {
    if (preferences.autoShowGradCam && heatmapAvailable && !hadHeatmap.current) {
      setViewMode("overlay");
    }
    hadHeatmap.current = heatmapAvailable;
  }, [heatmapAvailable, preferences.autoShowGradCam]);

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
    updateTransform({ scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, ratio)) });
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
            transform: `rotate(${rotation}deg) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            filter: `brightness(${brightness}) contrast(${contrast})`,
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
          <ViewerButton onClick={fit} label="Fit to screen">
            Fit
          </ViewerButton>
          <ViewerButton onClick={reset} label="Reset zoom, pan, rotation & adjustments">
            Reset
          </ViewerButton>
          <ViewerButton onClick={rotate} label="Rotate 90°">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 3.5A6.5 6.5 0 106.5 10M13 3.5V7M13 3.5H9.5" />
            </svg>
          </ViewerButton>
        </div>

        <div className="h-4 w-px bg-chrome-700" aria-hidden="true" />

        <div className="flex items-center gap-2">
          <label htmlFor="brightness" className="text-xs text-chrome-300">
            Brightness
          </label>
          <input
            id="brightness"
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-16 accent-accent-500"
          />
          <label htmlFor="contrast" className="text-xs text-chrome-300">
            Contrast
          </label>
          <input
            id="contrast"
            type="range"
            min={0.5}
            max={1.5}
            step={0.05}
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="w-16 accent-accent-500"
          />
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
