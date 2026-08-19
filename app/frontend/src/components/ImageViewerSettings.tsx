import { usePreferences } from "../hooks/usePreferences";
import SettingsSegmented from "./SettingsSegmented";
import SettingsToggle from "./SettingsToggle";

export default function ImageViewerSettings() {
  const { preferences, setPreference } = usePreferences();

  return (
    <div className="divide-y divide-clinic-100">
      <SettingsSegmented
        label="Default zoom"
        options={[
          { value: "fit" as const, label: "Fit to window" },
          { value: "100" as const, label: "100% (actual size)" },
        ]}
        value={preferences.defaultZoom}
        onChange={(v) => setPreference("defaultZoom", v)}
        hint="Overridden by “Remember zoom & position” below once you've zoomed at least once."
      />

      <SettingsToggle
        label="Remember zoom & position"
        description="Reopen images at the zoom/pan you last left the viewer at, instead of the default above."
        checked={preferences.rememberZoom}
        onChange={(v) => setPreference("rememberZoom", v)}
      />

      <SettingsSegmented
        label="Default view"
        options={[
          { value: "original" as const, label: "Original" },
          { value: "heatmap" as const, label: "Heatmap" },
          { value: "overlay" as const, label: "Overlay" },
        ]}
        value={preferences.defaultViewMode}
        onChange={(v) => setPreference("defaultViewMode", v)}
        hint="Only applies when a Grad-CAM heatmap is actually available for the image — otherwise the viewer falls back to Original."
      />

      <div className="py-2">
        <label htmlFor="default-opacity" className="text-sm text-clinic-700">
          Default heatmap opacity
        </label>
        <div className="mt-2 flex items-center gap-3 max-w-xs">
          <input
            id="default-opacity"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={preferences.defaultHeatmapOpacity}
            onChange={(e) =>
              setPreference("defaultHeatmapOpacity", Number(e.target.value))
            }
            className="flex-1 accent-accent-500"
          />
          <span className="text-sm tabular text-clinic-600 w-10 text-right">
            {Math.round(preferences.defaultHeatmapOpacity * 100)}%
          </span>
        </div>
      </div>

      <SettingsToggle
        label="Show image information"
        description="Resolution, file size, format, and cropped size on the analysis screen."
        checked={preferences.showImageInfo}
        onChange={(v) => setPreference("showImageInfo", v)}
      />

      <SettingsToggle
        label="Show image quality assessment"
        description="The quality warning banner when an upload is flagged (e.g. too small)."
        checked={preferences.showQualityAssessment}
        onChange={(v) => setPreference("showQualityAssessment", v)}
      />

      <SettingsToggle
        label="Auto-enhance images"
        description="A real per-channel contrast stretch applied only to what's displayed in the viewer — never to the image sent for analysis, so it cannot change a prediction."
        checked={preferences.autoEnhance}
        onChange={(v) => setPreference("autoEnhance", v)}
      />
    </div>
  );
}
