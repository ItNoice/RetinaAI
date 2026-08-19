import { useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import SettingsToggle from "./SettingsToggle";

export default function AIAnalysisSettings() {
  const { preferences, setPreference } = usePreferences();
  const [confirmingExperimental, setConfirmingExperimental] = useState(false);

  return (
    <div className="divide-y divide-clinic-100">
      <SettingsToggle
        label="Automatically analyze after upload"
        description="When off, images are stored (if history is on) but not sent for analysis until you click Analyze now."
        checked={preferences.autoAnalyzeOnUpload}
        onChange={(v) => setPreference("autoAnalyzeOnUpload", v)}
      />
      <SettingsToggle
        label="Show confidence scores"
        checked={preferences.showConfidenceScores}
        onChange={(v) => setPreference("showConfidenceScores", v)}
      />
      <SettingsToggle
        label="Show probability distribution"
        checked={preferences.showProbabilityDistribution}
        onChange={(v) => setPreference("showProbabilityDistribution", v)}
      />
      <SettingsToggle
        label="Show model information"
        description="Model version, in the analysis screen's metadata panel."
        checked={preferences.showModelInfo}
        onChange={(v) => setPreference("showModelInfo", v)}
      />
      <SettingsToggle
        label="Show processing time"
        checked={preferences.showProcessingTime}
        onChange={(v) => setPreference("showProcessingTime", v)}
      />

      <div className="py-2">
        <SettingsToggle
          label="Minimum confidence warning"
          description="Flag predictions below a confidence threshold as especially uncertain."
          checked={preferences.minConfidenceWarning !== null}
          onChange={(v) =>
            setPreference("minConfidenceWarning", v ? 0.5 : null)
          }
        />
        {preferences.minConfidenceWarning !== null && (
          <div className="mt-2 flex items-center gap-3 max-w-xs pl-0">
            <input
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={preferences.minConfidenceWarning}
              onChange={(e) =>
                setPreference("minConfidenceWarning", Number(e.target.value))
              }
              className="flex-1 accent-accent-500"
              aria-label="Minimum confidence warning threshold"
            />
            <span className="text-sm tabular text-clinic-600 w-10 text-right">
              {Math.round(preferences.minConfidenceWarning * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="py-2">
        <SettingsToggle
          label="Enable experimental models"
          description="No experimental models are available yet — this project ships one validated diabetic retinopathy model. Kept here, off, so a future addition doesn't silently turn itself on."
          checked={preferences.experimentalModelsEnabled}
          disabled={confirmingExperimental}
          onChange={(v) => {
            if (v) {
              setConfirmingExperimental(true);
            } else {
              setPreference("experimentalModelsEnabled", false);
            }
          }}
        />
        {confirmingExperimental && (
          <div className="mt-2 rounded-md border border-warn-500/30 bg-warn-soft px-3.5 py-3 text-sm text-warn-soft-ink">
            <p>
              Experimental models are not independently validated to the
              same standard as the default model, and none exist for this
              project yet. Enabling this now does nothing except record your
              preference for when one is added.
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreference("experimentalModelsEnabled", true);
                  setConfirmingExperimental(false);
                }}
                className="rounded-md bg-warn-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                Enable anyway
              </button>
              <button
                type="button"
                onClick={() => setConfirmingExperimental(false)}
                className="rounded-md border border-warn-500/40 px-3 py-1.5 text-xs font-medium text-warn-soft-ink hover:bg-warn-soft/60 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
