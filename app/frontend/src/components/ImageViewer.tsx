import { useCallback, useEffect, useRef, useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import { useShortcutListener } from "../hooks/useShortcutListener";
import type { ShortcutEventName } from "../lib/shortcutBus";
import { enhanceImage } from "../lib/imageEnhance";
import { Icon, type IconName } from "./ui";

// No "segmentation" mode on purpose: the backend produces no masks, and a mode
// that looked like one while rendering attention would misrepresent the output.
type ViewMode = "original" | "analyzed" | "heatmap" | "overlay";

export interface ViewerTransform {
  scale: number;
  offset: { x: number; y: number };
  rotation: number; // 0 | 90 | 180 | 270
}

interface ImageViewerProps {
  imageUrl: string;
  // The frame the model analyzed. Heatmap coordinates line up with this, not
  // the upload — cropping shifts and rescales the fundus. Falls back to imageUrl.
  croppedPreviewUrl?: string | null;
  heatmapUrl?: string | null;
  altText: string;
  /** Fills the parent instead of a fixed stage height. */
  fill?: boolean;
  /** Optional caption rendered in the status strip (e.g. the filename). */
  caption?: string;
  // Externally controlled zoom/pan/rotation, for Compare's two synced viewers.
  // Shortcuts stay off in this mode — both viewers would react to one keypress.
  // Brightness/contrast/view-mode remain per-instance either way.
  controlled?: {
    transform: ViewerTransform;
    onChange: (transform: ViewerTransform) => void;
  };
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 0.5;
const DEFAULT_TRANSFORM: ViewerTransform = { scale: MIN_SCALE, offset: { x: 0, y: 0 }, rotation: 0 };

const MODE_LABELS: Record<ViewMode, string> = {
  original: "Original",
  analyzed: "Analyzed frame",
  heatmap: "Grad-CAM",
  overlay: "Overlay",
};

const MODE_HINTS: Record<ViewMode, string> = {
  original: "The image exactly as uploaded",
  analyzed: "The cropped, resized frame the model actually received",
  heatmap: "Grad-CAM attention alone, aligned to the analyzed frame",
  overlay: "Grad-CAM composited over the analyzed frame",
};

// The guard lives in a stable callback rather than at the call site — a fresh
// no-op arrow each render would resubscribe every listener every render.
function useViewerShortcut(
  name: ShortcutEventName,
  controlled: boolean,
  handler: () => void,
): void {
  const guarded = useCallback(() => {
    if (!controlled) handler();
  }, [controlled, handler]);
  useShortcutListener(name, guarded);
}

export default function ImageViewer({
  imageUrl,
  croppedPreviewUrl,
  heatmapUrl,
  altText,
  fill = false,
  caption,
  controlled,
}: ImageViewerProps) {
  const { preferences, setPreference } = usePreferences();
  const heatmapAvailable = Boolean(heatmapUrl);
  const analyzedAvailable = Boolean(croppedPreviewUrl);

  const [viewMode, setViewMode] = useState<ViewMode>(preferences.defaultViewMode);
  const [overlayOpacity, setOverlayOpacity] = useState(preferences.defaultHeatmapOpacity);
  const [brightness, setBrightness] = useState(preferences.defaultBrightness);
  const [contrast, setContrast] = useState(preferences.defaultContrast);
  const [adjustOpen, setAdjustOpen] = useState(false);

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
      // Loose on purpose — the image is object-contain in a container we don't
      // measure, and a clamp that fights the user is worse than a little slack.
      const bound = (s - 1) * 200;
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

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    const request = document.fullscreenElement
      ? document.exitFullscreen()
      : containerRef.current.requestFullscreen();
    // Rejects without a user gesture or under a restrictive permissions policy.
    // Nothing to tell the user, but an unhandled rejection misleads whoever
    // debugs this next.
    void request.catch(() => {});
  }, []);

  const toggleHeatmapView = useCallback(() => {
    setViewMode((m) => (m === "original" ? "overlay" : "original"));
  }, []);

  // Global shortcuts drive only the uncontrolled (primary) viewer — see the
  // `controlled` prop above.
  const isControlled = Boolean(controlled);
  useViewerShortcut("fullscreen", isControlled, toggleFullscreen);
  useViewerShortcut("toggle-heatmap", isControlled, toggleHeatmapView);
  useViewerShortcut("reset-viewer", isControlled, reset);
  useViewerShortcut("zoom-in", isControlled, zoomIn);
  useViewerShortcut("zoom-out", isControlled, zoomOut);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Fires on the unavailable -> available transition (a fresh analysis), not on
  // mount, so reopening an analyzed image still respects "Default view".
  const hadHeatmap = useRef(heatmapAvailable);
  useEffect(() => {
    if (preferences.autoShowGradCam && heatmapAvailable && !hadHeatmap.current) {
      setViewMode("overlay");
    }
    hadHeatmap.current = heatmapAvailable;
  }, [heatmapAvailable, preferences.autoShowGradCam]);

  // "100%" means one image pixel per screen pixel, computed from natural vs.
  // rendered size rather than a fixed multiplier.
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

  const showHeatmapLayer = (viewMode === "heatmap" || viewMode === "overlay") && heatmapAvailable;
  // Every mode except "original" must show the cropped preview, not the raw
  // upload — see the prop comment above.
  const baseImageUrl =
    viewMode !== "original" && croppedPreviewUrl ? croppedPreviewUrl : imageUrl;

  // Display only — never touches what was sent to the model.
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

  const availableModes: ViewMode[] = [
    "original",
    ...(analyzedAvailable ? (["analyzed"] as ViewMode[]) : []),
    ...(heatmapAvailable ? (["heatmap", "overlay"] as ViewMode[]) : []),
  ];
  const isDerived = viewMode !== "original";
  const isAiGenerated = viewMode === "heatmap" || viewMode === "overlay";

  // Fullscreen drops the card edge, which floating against black looks like a bug.
  let shellClass = "rounded-lg border border-chrome-700";
  if (isFullscreen) {
    shellClass = "h-screen";
  } else if (fill) {
    shellClass = "h-full";
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col overflow-hidden bg-chrome-950 ${shellClass}`}
    >
      {/* Stage --------------------------------------------------------- */}
      <div
        className="relative flex-1 min-h-0 overflow-hidden select-none touch-none"
        style={{
          height: fill || isFullscreen ? undefined : "28rem",
          cursor: scale > 1 ? (isPanning ? "grabbing" : "grab") : "default",
        }}
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
              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150"
              style={{ opacity: viewMode === "heatmap" ? 1 : overlayOpacity }}
            />
          )}
        </div>

        {/* Persistent label whenever this isn't the untouched upload. */}
        {isDerived && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 rounded bg-chrome-950/85 px-2 py-1 text-[11px] font-medium text-chrome-200 backdrop-blur-sm"
            style={{ animation: "panel-in 0.15s ease-out" }}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isAiGenerated ? "bg-accent-400" : "bg-chrome-300"}`}
              aria-hidden="true"
            />
            {isAiGenerated ? "AI-generated visualization" : "Analyzed frame"}
            <span className="text-chrome-300/70">· {MODE_LABELS[viewMode]}</span>
          </div>
        )}

        {preferences.autoEnhance && (
          <span className="absolute top-3 right-3 rounded bg-chrome-950/85 px-2 py-1 text-[10px] font-medium text-chrome-300 backdrop-blur-sm">
            Auto-enhanced (display only)
          </span>
        )}

        {/* Zoom readout, bottom-left, out of the way of the fundus circle. */}
        {scale > 1 && (
          <span
            className="absolute bottom-3 left-3 rounded bg-chrome-950/85 px-2 py-1 text-[11px] text-chrome-300 metric backdrop-blur-sm"
            aria-live="polite"
          >
            {Math.round(scale * 100)}%
          </span>
        )}
      </div>

      {/* Adjustments popover ------------------------------------------- */}
      {adjustOpen && (
        <div
          className="absolute bottom-12 right-3 z-10 w-60 rounded-lg border border-chrome-700 bg-chrome-900 p-3 shadow-lg"
          style={{ animation: "panel-in 0.12s ease-out" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-chrome-300/70">
              Display adjustments
            </p>
            <button
              type="button"
              onClick={() => setAdjustOpen(false)}
              aria-label="Close adjustments"
              className="rounded p-0.5 text-chrome-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Icon name="close" className="w-3.5 h-3.5" />
            </button>
          </div>

          <Slider
            id="brightness"
            label="Brightness"
            value={brightness}
            min={0.5}
            max={1.5}
            step={0.05}
            onChange={setBrightness}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            id="contrast"
            label="Contrast"
            value={contrast}
            min={0.5}
            max={1.5}
            step={0.05}
            onChange={setContrast}
            format={(v) => `${Math.round(v * 100)}%`}
          />
          {viewMode === "overlay" && (
            <Slider
              id="overlay-opacity"
              label="Overlay opacity"
              value={overlayOpacity}
              min={0}
              max={1}
              step={0.01}
              onChange={setOverlayOpacity}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          )}
          <p className="mt-2.5 border-t border-chrome-700 pt-2 text-[10px] leading-relaxed text-chrome-300/70">
            Display only — adjustments never affect the image sent to the model.
          </p>
        </div>
      )}

      {/* Toolbar ------------------------------------------------------- */}
      <div className="shrink-0 flex items-center gap-1.5 border-t border-chrome-700 bg-chrome-900 px-2 h-11">
        <div className="flex items-center gap-0.5" role="group" aria-label="Zoom and orientation">
          <ToolButton icon="zoom-out" label="Zoom out" onClick={zoomOut} disabled={scale <= MIN_SCALE} />
          <ToolButton icon="zoom-in" label="Zoom in" onClick={zoomIn} disabled={scale >= MAX_SCALE} />
          <ToolButton icon="fit" label="Fit to screen" onClick={fit} />
          <ToolButton icon="rotate" label="Rotate 90°" onClick={rotate} />
          <ToolButton icon="reset" label="Reset view and adjustments" onClick={reset} />
        </div>

        <div className="h-5 w-px bg-chrome-700" aria-hidden="true" />

        {/* Only modes with real artifacts behind them — no disabled ghosts. */}
        <div
          role="group"
          aria-label="Image view mode"
          className="flex items-center rounded-md bg-chrome-800 p-0.5 text-xs min-w-0 overflow-x-auto panel-scroll"
        >
          {availableModes.map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={viewMode === mode}
              onClick={() => setViewMode(mode)}
              title={MODE_HINTS[mode]}
              className={`whitespace-nowrap rounded px-2.5 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                viewMode === mode
                  ? "bg-accent-600 text-white"
                  : "text-chrome-300 hover:text-white"
              }`}
            >
              {MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {!heatmapAvailable && (
          <span className="hidden lg:inline text-[11px] text-chrome-300/60" title="No model was loaded when this image was analyzed, so no Grad-CAM exists for it.">
            No Grad-CAM
          </span>
        )}

        <div className="flex-1 min-w-0" />

        {/* Fullscreen only — the header that carries the filename is hidden there. */}
        {caption && isFullscreen && (
          <span className="hidden sm:block truncate max-w-[20rem] text-[11px] text-chrome-300/70" title={caption}>
            {caption}
          </span>
        )}

        <ToolButton
          icon="brightness"
          label="Display adjustments"
          onClick={() => setAdjustOpen((v) => !v)}
          active={adjustOpen}
          expanded={adjustOpen}
        />
        <ToolButton
          icon={isFullscreen ? "fullscreen-exit" : "fullscreen"}
          label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          onClick={toggleFullscreen}
        />
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  label,
  onClick,
  disabled,
  active,
  expanded,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  expanded?: boolean;
}) {
  const { preferences } = usePreferences();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      aria-expanded={expanded}
      title={label}
      className={`inline-flex h-8 items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors disabled:opacity-35 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
        active ? "bg-chrome-700 text-white" : "text-chrome-200 hover:bg-chrome-700 hover:text-white"
      }`}
    >
      <Icon name={icon} className="w-4 h-4" />
      {preferences.alwaysShowIconLabels && <span>{label}</span>}
    </button>
  );
}

function Slider({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs text-chrome-300">
          {label}
        </label>
        <span className="text-[11px] text-chrome-300/70 metric">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-accent-500"
      />
    </div>
  );
}
