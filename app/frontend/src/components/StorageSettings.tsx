import { usePreferences } from "../hooks/usePreferences";
import { useToast } from "../hooks/useToast";
import {
  clearAllAnalyses,
  clearCachedPreviews,
} from "../lib/storage";
import SettingsSegmented from "./SettingsSegmented";

export default function StorageSettings() {
  const { preferences, setPreference } = usePreferences();
  const toast = useToast();

  const runAction = async (
    label: string,
    action: () => Promise<void | number>,
  ) => {
    const confirmed = window.confirm(`${label}? This cannot be undone.`);
    if (!confirmed) return;
    const result = await action();
    toast.success(
      typeof result === "number"
        ? `Removed ${result} analys${result === 1 ? "is" : "es"}.`
        : "Done.",
    );
  };

  return (
    <div>
      <SettingsSegmented
        label="Auto-delete after"
        options={[
          { value: "never" as const, label: "Never" },
          { value: 7 as const, label: "7 days" },
          { value: 30 as const, label: "30 days" },
        ]}
        value={preferences.autoDeleteAfterDays}
        onChange={(v) => setPreference("autoDeleteAfterDays", v)}
        hint="Checked once when the app loads — analyses older than this are removed automatically."
      />

      <div className="mt-4 pt-4 border-t border-clinic-100 space-y-2">
        <button
          type="button"
          onClick={() =>
            void runAction("Clear all analysis history", async () => {
              await clearAllAnalyses();
            })
          }
          className="block text-sm text-clinic-700 hover:text-danger-500 transition-colors"
        >
          Clear analysis history
        </button>
        <button
          type="button"
          onClick={() =>
            void runAction(
              "Clear cached heatmaps and previews (originals and predictions stay)",
              async () => {
                await clearCachedPreviews();
              },
            )
          }
          className="block text-sm text-clinic-700 hover:text-danger-500 transition-colors"
        >
          Clear cached images (heatmaps &amp; previews)
        </button>
        <button
          type="button"
          onClick={() =>
            void runAction("Clear all local data", async () => {
              await clearAllAnalyses();
            })
          }
          className="block text-sm text-danger-soft-ink hover:opacity-80 transition-opacity font-medium"
        >
          Clear all local data
        </button>
      </div>
    </div>
  );
}
