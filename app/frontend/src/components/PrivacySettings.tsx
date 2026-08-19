import { usePreferences } from "../hooks/usePreferences";
import SettingsToggle from "./SettingsToggle";

export default function PrivacySettings() {
  const { preferences, setPreference } = usePreferences();

  return (
    <div>
      <p className="text-xs text-clinic-500 leading-relaxed mb-3">
        Local storage (this browser's IndexedDB) is the default for both
        settings below — nothing is uploaded anywhere except to the local
        backend for the analysis itself, and you can turn either off at any
        time.
      </p>
      <div className="divide-y divide-clinic-100">
        <SettingsToggle
          label="Store analysis results"
          description="When off, analyses exist only until you leave the page — nothing is written to this browser."
          checked={preferences.storeAnalysisResults}
          onChange={(v) => setPreference("storeAnalysisResults", v)}
        />
        <SettingsToggle
          label="Store uploaded images"
          description="When off, the original image is discarded after analysis — only the prediction and metadata are kept."
          checked={preferences.storeUploadedImages}
          disabled={!preferences.storeAnalysisResults}
          onChange={(v) => setPreference("storeUploadedImages", v)}
        />
        <SettingsToggle
          label="Local processing indicator"
          description="Show a small badge in the footer confirming analysis happens on this device."
          checked={preferences.showLocalProcessingIndicator}
          onChange={(v) => setPreference("showLocalProcessingIndicator", v)}
        />
      </div>
    </div>
  );
}
