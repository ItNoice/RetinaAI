import { usePreferences } from "../hooks/usePreferences";
import SettingsSegmented from "./SettingsSegmented";
import SettingsToggle from "./SettingsToggle";

export default function ResearchSettings() {
  const { preferences, setPreference } = usePreferences();

  return (
    <div className="divide-y divide-clinic-100">
      <SettingsToggle
        label="Research Mode"
        description="Shows Research, Experiments, and Model Lab in the sidebar, plus a RESEARCH MODE indicator. Off gives a simpler Analyze/Results/History-only view."
        checked={preferences.researchMode}
        onChange={(v) => setPreference("researchMode", v)}
      />
      <SettingsToggle
        label="Show advanced metrics"
        description="Precision, recall, F1, and ROC-AUC alongside accuracy."
        checked={preferences.showAdvancedMetrics}
        onChange={(v) => setPreference("showAdvancedMetrics", v)}
      />
      <SettingsToggle
        label="Show confusion matrix"
        checked={preferences.showConfusionMatrix}
        onChange={(v) => setPreference("showConfusionMatrix", v)}
      />
      <SettingsToggle
        label="Show per-class performance"
        description="Precision/recall/F1 computed per class from the confusion matrix."
        checked={preferences.showPerClassPerformance}
        onChange={(v) => setPreference("showPerClassPerformance", v)}
      />
      <SettingsToggle
        label="Show dataset statistics"
        description="Class distribution for the split you're viewing."
        checked={preferences.showDatasetStatistics}
        onChange={(v) => setPreference("showDatasetStatistics", v)}
      />

      <SettingsSegmented
        label="Default metric"
        options={[
          { value: "accuracy" as const, label: "Accuracy" },
          { value: "f1" as const, label: "F1" },
          { value: "recall" as const, label: "Recall" },
          { value: "precision" as const, label: "Precision" },
        ]}
        value={preferences.defaultMetric}
        onChange={(v) => setPreference("defaultMetric", v)}
        hint="Highlighted in the stat tiles on the Research page."
      />

      <SettingsSegmented
        label="Decimal places"
        options={[
          { value: 1 as const, label: "1" },
          { value: 2 as const, label: "2" },
          { value: 4 as const, label: "4" },
        ]}
        value={preferences.decimalPlaces}
        onChange={(v) => setPreference("decimalPlaces", v)}
        hint="Applies to metrics here and to confidence/probability figures throughout the app."
      />
    </div>
  );
}
