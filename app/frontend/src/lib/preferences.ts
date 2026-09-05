// One preferences object in localStorage. Every field changes real behavior
// somewhere; settings for features this project lacks (GPU inference,
// quantization) are deliberately absent — see Advanced's read-only panel.

export type AccentColor = "blue" | "teal" | "violet" | "slate";
export type Density = "comfortable" | "compact";
export type DefaultZoom = "fit" | "100";
export type ViewMode = "original" | "heatmap" | "overlay";
export type DefaultMetric = "accuracy" | "f1" | "recall" | "precision";
export type DecimalPlaces = 1 | 2 | 4;
export type AutoDeleteAfter = "never" | 7 | 30;

// "mod" is Ctrl on Windows/Linux, Cmd on macOS, resolved at match time.
export type ShortcutAction =
  | "upload"
  | "analyze"
  | "fullscreen"
  | "toggleHeatmap"
  | "resetViewer"
  | "zoomIn"
  | "zoomOut"
  | "prev"
  | "next"
  | "help"
  | "commandPalette";

export type ShortcutBindings = Record<ShortcutAction, string>;

export const DEFAULT_SHORTCUT_BINDINGS: ShortcutBindings = {
  upload: "u",
  analyze: "a",
  fullscreen: "f",
  toggleHeatmap: "h",
  resetViewer: "r",
  zoomIn: "+",
  zoomOut: "-",
  prev: "ArrowLeft",
  next: "ArrowRight",
  help: "?",
  commandPalette: "mod+k",
};

export interface Preferences {
  // Appearance (theme itself is handled separately by ThemeContext)
  accentColor: AccentColor;
  density: Density;
  reduceMotion: boolean;

  // Image viewer
  defaultZoom: DefaultZoom;
  rememberZoom: boolean;
  // Not controls — the viewer's last scale/pan, so "remember zoom" can restore it.
  lastZoomScale: number;
  lastZoomOffsetX: number;
  lastZoomOffsetY: number;
  defaultViewMode: ViewMode;
  defaultHeatmapOpacity: number; // 0-1
  defaultBrightness: number; // 1 = unchanged, matches CSS filter scale
  defaultContrast: number; // 1 = unchanged, matches CSS filter scale
  showImageInfo: boolean;
  showQualityAssessment: boolean;
  autoEnhance: boolean;

  // AI analysis
  autoAnalyzeOnUpload: boolean;
  showConfidenceScores: boolean;
  showProbabilityDistribution: boolean;
  minConfidenceWarning: number | null; // null = off; else 0-1 threshold
  showModelInfo: boolean;
  showProcessingTime: boolean;
  experimentalModelsEnabled: boolean;
  // Jumps to overlay when a fresh analysis lands. Separate from "Default view"
  // above, which applies to reopening an existing analysis.
  autoShowGradCam: boolean;

  // Research
  showAdvancedMetrics: boolean;
  showConfusionMatrix: boolean;
  showPerClassPerformance: boolean;
  showDatasetStatistics: boolean;
  defaultMetric: DefaultMetric;
  decimalPlaces: DecimalPlaces;

  // Storage & privacy (one real pair of toggles serves both "History &
  // Storage" and "Privacy" — see Settings.tsx's grouping)
  storeAnalysisResults: boolean;
  storeUploadedImages: boolean;
  autoDeleteAfterDays: AutoDeleteAfter;
  showLocalProcessingIndicator: boolean;
  // Drops filename and exact timestamp from exports, keeping relative timing.
  anonymizeExports: boolean;
  includeImagesInReport: boolean;

  // Accessibility
  largerText: boolean;
  highContrast: boolean;
  alwaysShowIconLabels: boolean;

  // Advanced
  apiBaseUrlOverride: string | null;
  debugLogging: boolean;

  // A master switch, not a label: off hides Research/Experiments/Model Lab
  // from nav and gates the advanced result panels.
  researchMode: boolean;

  // Always a full map — readStoredPreferences fills in any missing actions.
  shortcutBindings: ShortcutBindings;
}

export const DEFAULT_PREFERENCES: Preferences = {
  accentColor: "blue",
  density: "comfortable",
  reduceMotion: false,

  defaultZoom: "fit",
  rememberZoom: false,
  lastZoomScale: 1,
  lastZoomOffsetX: 0,
  lastZoomOffsetY: 0,
  defaultViewMode: "original",
  defaultHeatmapOpacity: 0.5,
  defaultBrightness: 1,
  defaultContrast: 1,
  showImageInfo: true,
  showQualityAssessment: true,
  autoEnhance: false,

  autoAnalyzeOnUpload: true,
  showConfidenceScores: true,
  showProbabilityDistribution: true,
  minConfidenceWarning: 0.5,
  showModelInfo: true,
  showProcessingTime: true,
  experimentalModelsEnabled: false,
  autoShowGradCam: false,

  showAdvancedMetrics: true,
  showConfusionMatrix: true,
  showPerClassPerformance: true,
  showDatasetStatistics: true,
  defaultMetric: "accuracy",
  decimalPlaces: 1,

  // On by default, but visible and reversible — not a silent assumption.
  storeAnalysisResults: true,
  storeUploadedImages: true,
  autoDeleteAfterDays: "never",
  showLocalProcessingIndicator: true,
  anonymizeExports: false,
  includeImagesInReport: true,

  largerText: false,
  highContrast: false,
  alwaysShowIconLabels: false,

  apiBaseUrlOverride: null,
  debugLogging: false,

  researchMode: true,

  shortcutBindings: DEFAULT_SHORTCUT_BINDINGS,
};

const STORAGE_KEY = "retinaai-preferences";

export function readStoredPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    // Merge over defaults so an object saved by an older version doesn't
    // produce undefineds. shortcutBindings needs its own merge for the same
    // reason, one level down.
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      shortcutBindings: {
        ...DEFAULT_SHORTCUT_BINDINGS,
        ...parsed.shortcutBindings,
      },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writeStoredPreferences(prefs: Preferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore — preferences just won't persist across reloads.
  }
}

export function resetStoredPreferences(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
