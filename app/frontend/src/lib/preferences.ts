// A single, versioned preferences object persisted to localStorage — the
// same pattern as lib/theme.ts, generalized. Every field here changes real,
// observable behavior somewhere in the app; nothing here is decorative.
// Settings that would require features this project doesn't actually have
// (GPU inference, quantized precision, batch inference, report export) are
// deliberately NOT modeled here — see the Advanced section's read-only info
// panel instead.

export type AccentColor = "blue" | "teal" | "violet" | "slate";
export type Density = "comfortable" | "compact";
export type DefaultZoom = "fit" | "100";
export type ViewMode = "original" | "heatmap" | "overlay";
export type DefaultMetric = "accuracy" | "f1" | "recall" | "precision";
export type DecimalPlaces = 1 | 2 | 4;
export type AutoDeleteAfter = "never" | 7 | 30;

export interface Preferences {
  // Appearance (theme itself is handled separately by ThemeContext)
  accentColor: AccentColor;
  density: Density;
  reduceMotion: boolean;

  // Image viewer
  defaultZoom: DefaultZoom;
  rememberZoom: boolean;
  // Not user-facing controls themselves — the last scale/pan ImageViewer
  // was left at, persisted here (rather than a separate storage
  // mechanism) so "remember zoom" can restore it on the next image.
  lastZoomScale: number;
  lastZoomOffsetX: number;
  lastZoomOffsetY: number;
  defaultViewMode: ViewMode;
  defaultHeatmapOpacity: number; // 0-1
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

  // Accessibility
  largerText: boolean;
  highContrast: boolean;
  alwaysShowIconLabels: boolean;

  // Advanced
  apiBaseUrlOverride: string | null;
  debugLogging: boolean;
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

  showAdvancedMetrics: true,
  showConfusionMatrix: true,
  showPerClassPerformance: true,
  showDatasetStatistics: true,
  defaultMetric: "accuracy",
  decimalPlaces: 1,

  // Local storage is the default, not an opt-in — but it's a real choice
  // the user can see and reverse, not a silent assumption.
  storeAnalysisResults: true,
  storeUploadedImages: true,
  autoDeleteAfterDays: "never",
  showLocalProcessingIndicator: true,

  largerText: false,
  highContrast: false,
  alwaysShowIconLabels: false,

  apiBaseUrlOverride: null,
  debugLogging: false,
};

const STORAGE_KEY = "retinaai-preferences";

export function readStoredPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    // Merge over defaults so a preferences object saved by an older version
    // of this app (missing newer fields) doesn't produce `undefined`s.
    return { ...DEFAULT_PREFERENCES, ...parsed };
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
